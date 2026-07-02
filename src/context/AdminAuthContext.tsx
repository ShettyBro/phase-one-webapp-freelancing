import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '../utils/api';
import { saveSession, clearSession, isLoggedIn, getMsUntilExpiry } from '../utils/auth';

export type AdminRole = 'ADMIN' | 'SUPER_ADMIN';

export interface AdminUser {
  id: string;
  name: string;
  username: string;
  role: AdminRole;
}

interface AdminAuthContextValue {
  admin: AdminUser | null;
  loading: boolean;
  isSuperAdmin: boolean;
  msUntilExpiry: number | null; // null = no countdown shown (super admin)
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [msUntilExpiry, setMsUntilExpiry] = useState<number | null>(null);

  const doLogout = useCallback(async (notifyServer = true) => {
    if (notifyServer) {
      try {
        // Tell the server to clear the httpOnly cookie.
        await api.post('/auth-logout');
      } catch {
        /* ignore — cookie will expire on its own */
      }
    }
    clearSession();
    setAdmin(null);
    setMsUntilExpiry(null);
  }, []);

  // Restore session on mount — call /auth-me which uses the httpOnly cookie.
  // Fix #10: We no longer check localStorage for a token; the cookie does
  // that automatically. If the cookie is absent/expired, /auth-me returns 401.
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/auth-me');
        setAdmin(data.admin);
      } catch {
        // 401 = no valid cookie, or cookie expired. Clear metadata.
        clearSession();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Session countdown + auto-logout driven by the client-side expiry metadata
  // stored in localStorage (the timestamp only — not the token itself).
  useEffect(() => {
    if (!admin) return;
    if (admin.role === 'SUPER_ADMIN') {
      setMsUntilExpiry(null);
      return;
    }
    const tick = () => {
      const ms = getMsUntilExpiry();
      setMsUntilExpiry(ms);
      if (ms <= 0 && isLoggedIn() === false) doLogout(false);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [admin, doLogout]);

  const login = useCallback(async (username: string, password: string) => {
    // The server sets the httpOnly cookie in the response headers.
    // We only store non-secret metadata (username, expiry) in localStorage.
    const { data } = await api.post('/auth-login', { username, password });
    // expiresInMs: 0 means the server set a long-lived cookie; treat as no countdown.
    const expiresInMs = data.expiresInMs && data.expiresInMs > 0 ? data.expiresInMs : 0;
    saveSession(data.admin.username, expiresInMs > 0 ? expiresInMs : 24 * 60 * 60 * 1000);
    setAdmin(data.admin);
  }, []);

  return (
    <AdminAuthContext.Provider
      value={{ admin, loading, isSuperAdmin: admin?.role === 'SUPER_ADMIN', msUntilExpiry, login, logout: () => doLogout(true) }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export function useAdminAuth(): AdminAuthContextValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  return ctx;
}
