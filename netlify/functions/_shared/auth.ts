import jwt from 'jsonwebtoken';
import type { HandlerEvent } from '@netlify/functions';
import { prisma } from './prisma';

const SECRET = process.env.JWT_SECRET || '';

// Super admins get a long-but-finite session (default 24 h).
// Regular admins get a shorter session (default 5 h).
const SUPER_ADMIN_HOURS = Number(process.env.SUPER_ADMIN_SESSION_HOURS || '24');
const ADMIN_HOURS       = Number(process.env.ADMIN_SESSION_HOURS        || '5');

export type Role = 'ADMIN' | 'SUPER_ADMIN';

export interface AdminClaims {
  sub: string;       // admin id
  role: Role;
  username: string;
}

/**
 * Signs a time-limited JWT for the given admin.
 * Super Admins now get an expiry too (was previously never-expiring — security fix #2).
 */
export function signAdminToken(claims: AdminClaims): { token: string; expiresInMs: number } {
  const hours = claims.role === 'SUPER_ADMIN' ? SUPER_ADMIN_HOURS : ADMIN_HOURS;
  const expiresInMs = hours * 60 * 60 * 1000;
  return {
    token: jwt.sign(claims, SECRET, { expiresIn: `${hours}h`, algorithm: 'HS256' }),
    expiresInMs,
  };
}

export function getBearer(event: HandlerEvent): string | null {
  const h = event.headers['authorization'] || event.headers['Authorization'];
  if (!h || !h.startsWith('Bearer ')) return null;
  return h.slice(7);
}

/**
 * Verifies the request's admin token AND confirms the admin still exists and
 * is active in the database (fix #1 — deactivated admins can no longer reuse
 * their outstanding tokens).
 *
 * Pass `requiredRole: 'SUPER_ADMIN'` to restrict to super admins.
 * Returns the DB admin row alongside the JWT claims so callers don't need a
 * second DB round-trip.
 */
export async function authenticate(
  event: HandlerEvent,
  requiredRole?: Role,
): Promise<{ claims: AdminClaims } | { error: { status: number; message: string; expired?: boolean } }> {
  if (!SECRET) return { error: { status: 500, message: 'JWT_SECRET not configured.' } };
  const token = getBearer(event);
  if (!token) return { error: { status: 401, message: 'Unauthorized — no token.' } };

  let claims: AdminClaims;
  try {
    // Fix #9 — pin the algorithm to HS256 to prevent algorithm-confusion attacks.
    claims = jwt.verify(token, SECRET, { algorithms: ['HS256'] }) as AdminClaims;
  } catch (err) {
    const expired = (err as Error).name === 'TokenExpiredError';
    return { error: { status: 401, message: expired ? 'Session expired.' : 'Invalid token.', expired } };
  }

  if (requiredRole && claims.role !== requiredRole) {
    return { error: { status: 403, message: 'Forbidden — insufficient privileges.' } };
  }

  // Fix #1 — verify the admin still exists and is active.
  // This ensures that deactivating or deleting an admin immediately revokes access,
  // even for tokens that haven't yet expired.
  try {
    const admin = await prisma.admin.findUnique({
      where: { id: claims.sub },
      select: { id: true, isActive: true },
    });
    if (!admin || !admin.isActive) {
      return { error: { status: 401, message: 'Account not found or has been deactivated.' } };
    }
  } catch {
    // If the DB is unreachable, fail safe rather than granting access.
    return { error: { status: 503, message: 'Authentication check failed. Please try again.' } };
  }

  return { claims };
}
