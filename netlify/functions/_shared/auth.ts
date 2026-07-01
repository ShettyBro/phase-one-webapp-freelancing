import jwt from 'jsonwebtoken';
import type { HandlerEvent } from '@netlify/functions';

const SECRET = process.env.JWT_SECRET || '';

export type Role = 'ADMIN' | 'SUPER_ADMIN';

export interface AdminClaims {
  sub: string;       // admin id
  role: Role;
  username: string;
}

/** Admin → expires after ADMIN_SESSION_HOURS (default 5h). Super Admin → no expiry. */
export function signAdminToken(claims: AdminClaims): { token: string; expiresInMs: number } {
  const hours = Number(process.env.ADMIN_SESSION_HOURS || '5');
  if (claims.role === 'SUPER_ADMIN') {
    return { token: jwt.sign(claims, SECRET), expiresInMs: 0 };
  }
  return {
    token: jwt.sign(claims, SECRET, { expiresIn: `${hours}h` }),
    expiresInMs: hours * 60 * 60 * 1000,
  };
}

export function getBearer(event: HandlerEvent): string | null {
  const h = event.headers['authorization'] || event.headers['Authorization'];
  if (!h || !h.startsWith('Bearer ')) return null;
  return h.slice(7);
}

/**
 * Verifies the request's admin token. Returns claims on success, or null.
 * Pass `requiredRole: 'SUPER_ADMIN'` to restrict to super admins.
 */
export function authenticate(
  event: HandlerEvent,
  requiredRole?: Role,
): { claims: AdminClaims } | { error: { status: number; message: string; expired?: boolean } } {
  if (!SECRET) return { error: { status: 500, message: 'JWT_SECRET not configured.' } };
  const token = getBearer(event);
  if (!token) return { error: { status: 401, message: 'Unauthorized — no token.' } };
  try {
    const claims = jwt.verify(token, SECRET) as AdminClaims;
    if (requiredRole && claims.role !== requiredRole) {
      return { error: { status: 403, message: 'Forbidden — insufficient privileges.' } };
    }
    return { claims };
  } catch (err) {
    const expired = (err as Error).name === 'TokenExpiredError';
    return { error: { status: 401, message: expired ? 'Session expired.' : 'Invalid token.', expired } };
  }
}
