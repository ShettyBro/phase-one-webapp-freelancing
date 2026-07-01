import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '../utils/api';
import { saveSession, clearSession, getToken, getMsUntilExpiry } from '../utils/auth';

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
  msUntilExpiry: number | null; // null = never expires (super admin)
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const NEVER = 100 * 365 * 24 * 60 * 60 * 1000; // ~100y sentinel for super admin
const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [msUntilExpiry, setMsUntilExpiry] = useState<number | null>(null);

  const doLogout = useCallback(async (notifyServer = true) => {
    if (notifyServer && getToken()) {
      try {
        await api.post('/auth-logout');
      } catch {
        /* ignore */
      }
    }
    clearSession();
    setAdmin(null);
    setMsUntilExpiry(null);
  }, []);

  // Restore session on mount.
  useEffect(() => {
    (async () => {
      if (!getToken()) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get('/auth-me');
        setAdmin(data.admin);
      } catch {
        clearSession();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Session countdown + auto-logout (skipped for super admin).
  useEffect(() => {
    if (!admin) return;
    if (admin.role === 'SUPER_ADMIN') {
      setMsUntilExpiry(null);
      return;
    }
    const tick = () => {
      const ms = getMsUntilExpiry();
      setMsUntilExpiry(ms);
      if (ms <= 0) doLogout(false);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [admin, doLogout]);

  const login = useCallback(async (username: string, password: string) => {
    const { data } = await api.post('/auth-login', { username, password });
    const expires = data.expiresInMs && data.expiresInMs > 0 ? data.expiresInMs : NEVER;
    saveSession(data.token, data.admin.username, expires);
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
