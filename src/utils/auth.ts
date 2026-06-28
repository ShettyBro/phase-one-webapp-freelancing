const TOKEN_KEY = 'webapp_admin_token';
const USERNAME_KEY = 'webapp_admin_user';
const EXPIRES_KEY = 'webapp_admin_expires';

export interface AdminSession {
  token: string;
  username: string;
  expiresAt: number;
}

export function saveSession(token: string, username: string, expiresInMs: number): void {
  const expiresAt = Date.now() + expiresInMs;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USERNAME_KEY, username);
  localStorage.setItem(EXPIRES_KEY, String(expiresAt));
}

export function getToken(): string | null {
  const token = localStorage.getItem(TOKEN_KEY);
  const expires = Number(localStorage.getItem(EXPIRES_KEY));
  if (!token || !expires) return null;
  if (Date.now() >= expires) {
    clearSession();
    return null;
  }
  return token;
}

export function getUsername(): string | null {
  return localStorage.getItem(USERNAME_KEY);
}

export function getMsUntilExpiry(): number {
  const expires = Number(localStorage.getItem(EXPIRES_KEY));
  if (!expires) return 0;
  return Math.max(0, expires - Date.now());
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USERNAME_KEY);
  localStorage.removeItem(EXPIRES_KEY);
}

export function authHeader(): { Authorization: string } | Record<string, never> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
