/**
 * src/utils/auth.ts
 *
 * Fix #10 — Admin JWT is no longer stored in localStorage.
 * The token is now an httpOnly Secure cookie set by the server on login.
 * The browser sends it automatically on every same-origin request.
 *
 * localStorage now stores only NON-SECRET session metadata:
 *   - username (display name — not a secret)
 *   - expiresAt (timestamp — used for the countdown timer and client-side gate)
 *
 * Because there is no token in localStorage, an XSS payload cannot steal
 * the JWT and use it from a remote origin. The token is only sent by the
 * browser itself via the httpOnly cookie, which JS cannot read.
 */

const USERNAME_KEY = 'comun_admin_user';
const EXPIRES_KEY  = 'comun_admin_expires';

export interface AdminSession {
  username: string;
  expiresAt: number;
}

/** Called after a successful login response. Stores only public metadata. */
export function saveSession(username: string, expiresInMs: number): void {
  const expiresAt = Date.now() + expiresInMs;
  localStorage.setItem(USERNAME_KEY, username);
  localStorage.setItem(EXPIRES_KEY, String(expiresAt));
}

/** Returns whether the client-side session metadata is still valid. */
export function isLoggedIn(): boolean {
  const expires = Number(localStorage.getItem(EXPIRES_KEY));
  if (!expires) return false;
  if (Date.now() >= expires) {
    clearSession();
    return false;
  }
  return true;
}

export function getUsername(): string | null {
  return localStorage.getItem(USERNAME_KEY);
}

export function getMsUntilExpiry(): number {
  const expires = Number(localStorage.getItem(EXPIRES_KEY));
  if (!expires) return 0;
  return Math.max(0, expires - Date.now());
}

export function clearSession(): void {
  localStorage.removeItem(USERNAME_KEY);
  localStorage.removeItem(EXPIRES_KEY);
}

/**
 * @deprecated No longer used — token lives in an httpOnly cookie.
 * Kept as a no-op stub so any remaining callers don't crash at import time.
 * Remove after verifying all call-sites have been cleaned up.
 */
export function getToken(): string | null {
  return null;
}

/**
 * @deprecated No longer used — no Authorization header needed; cookie is
 * sent automatically by the browser on credentialed requests.
 */
export function authHeader(): Record<string, never> {
  return {};
}
