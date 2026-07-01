import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import api from '../utils/api';
import { RegistrationClosedDialog } from '../components/ui/RegistrationClosedDialog';

interface RegistrationContextValue {
  /** Whether registrations are currently open (fail-safe default: true). */
  isOpen: boolean;
  /** True until the status has been fetched at least once. */
  loading: boolean;
  /** Re-fetch the registration status from the backend. */
  refresh: () => Promise<void>;
  /** Runs `action` if registrations are open; otherwise shows the closed dialog. */
  requireOpen: (action: () => void) => void;
}

const RegistrationContext = createContext<RegistrationContextValue | undefined>(undefined);

export const RegistrationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(true); // fail-safe: assume open until told otherwise
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get('/settings');
      if (typeof data?.registrationOpen === 'boolean') setIsOpen(data.registrationOpen);
    } catch {
      // Network/backend unavailable — keep the current (open) state.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const requireOpen = useCallback(
    (action: () => void) => {
      if (isOpen) action();
      else setDialogOpen(true);
    },
    [isOpen],
  );

  return (
    <RegistrationContext.Provider value={{ isOpen, loading, refresh, requireOpen }}>
      {children}
      <RegistrationClosedDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </RegistrationContext.Provider>
  );
};

export function useRegistration(): RegistrationContextValue {
  const ctx = useContext(RegistrationContext);
  if (!ctx) throw new Error('useRegistration must be used within a RegistrationProvider');
  return ctx;
}
