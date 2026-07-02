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

/** Returns the session duration in hours for the given role. */
export function sessionHours(role: Role): number {
  return role === 'SUPER_ADMIN' ? SUPER_ADMIN_HOURS : ADMIN_HOURS;
}

/**
 * Signs a time-limited JWT for the given admin.
 * Both roles now have an expiry (super-admin was previously never-expiring — fix #2).
 */
export function signAdminToken(claims: AdminClaims): { token: string; expiresInMs: number } {
  const hours = sessionHours(claims.role);
  const expiresInMs = hours * 60 * 60 * 1000;
  return {
    token: jwt.sign(claims, SECRET, { expiresIn: `${hours}h`, algorithm: 'HS256' }),
    expiresInMs,
  };
}

/**
 * Builds a Set-Cookie header value for the admin session token.
 * Fix #10 — the token is delivered as an httpOnly Secure SameSite=Strict cookie
 * so it cannot be read or exfiltrated by JavaScript running on the page.
 */
export function buildTokenCookie(token: string, hours: number): string {
  const maxAge = hours * 60 * 60;
  // SameSite=None is needed when the frontend and API are on different domains
  // (e.g. Vercel frontend + Netlify API). If they are same-origin use Strict.
  const sameSite = process.env.COOKIE_SAMESITE || 'None';
  return [
    `adminToken=${token}`,
    'HttpOnly',
    'Secure',
    `SameSite=${sameSite}`,
    `Max-Age=${maxAge}`,
    'Path=/',
  ].join('; ');
}

/** Returns a Set-Cookie value that immediately expires the adminToken cookie (logout). */
export function clearTokenCookie(): string {
  return 'adminToken=; HttpOnly; Secure; SameSite=None; Max-Age=0; Path=/';
}

/**
 * Extracts the admin JWT from the request.
 * Fix #10 — primary source is the httpOnly cookie; Bearer header is kept as
 * a fallback so CLI tools / local development with curl still work.
 */
export function getBearer(event: HandlerEvent): string | null {
  // 1. Prefer the httpOnly cookie (browser sends this automatically).
  const cookieHeader = event.headers['cookie'] || event.headers['Cookie'] || '';
  const cookieMatch = cookieHeader.match(/(?:^|;\s*)adminToken=([^;]+)/);
  if (cookieMatch) return cookieMatch[1];

  // 2. Fallback: Authorization: Bearer <token>  (CLI / local dev / raw fetch)
  const h = event.headers['authorization'] || event.headers['Authorization'];
  if (h && h.startsWith('Bearer ')) return h.slice(7);

  return null;
}

/**
 * Verifies the request's admin token AND confirms the admin still exists and
 * is active in the database (fix #1 — deactivated admins can no longer reuse
 * their outstanding tokens).
 *
 * Pass `requiredRole: 'SUPER_ADMIN'` to restrict to super admins.
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
  try {
    const admin = await prisma.admin.findUnique({
      where: { id: claims.sub },
      select: { id: true, isActive: true },
    });
    if (!admin || !admin.isActive) {
      return { error: { status: 401, message: 'Account not found or has been deactivated.' } };
    }
  } catch {
    return { error: { status: 503, message: 'Authentication check failed. Please try again.' } };
  }

  return { claims };
}
