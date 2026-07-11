import React, { createContext, useContext, useCallback, useState } from 'react';
import api from '../utils/api';
import { RegistrationClosedDialog } from '../components/ui/RegistrationClosedDialog';

interface RegistrationContextValue {
  /** Whether registrations are currently open (optimistic default: true). */
  isOpen: boolean;
  /** True while fetching the status from the backend. */
  loading: boolean;
  /**
   * Fetch the registration status on demand (called only when the user
   * actually tries to register — NOT on every page load).
   */
  refresh: () => Promise<void>;
  /**
   * Call this when the user clicks a Register button.
   * Fetches the latest status, then either runs `action` (if open)
   * or shows the "Registrations Closed" dialog.
   */
  requireOpen: (action: () => void) => void;
}

const RegistrationContext = createContext<RegistrationContextValue | undefined>(undefined);

export const RegistrationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Optimistic defaults — no API call until user clicks Register.
  const [isOpen, setIsOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/settings');
      if (typeof data?.registrationOpen === 'boolean') setIsOpen(data.registrationOpen);
    } catch {
      // Network / backend unavailable — keep the current (open) state.
    } finally {
      setLoading(false);
    }
  }, []);

  const requireOpen = useCallback(
    (action: () => void) => {
      // Fetch latest status first, then decide.
      setLoading(true);
      api.get('/settings')
        .then(({ data }) => {
          const open = typeof data?.registrationOpen === 'boolean' ? data.registrationOpen : true;
          setIsOpen(open);
          if (open) action();
          else setDialogOpen(true);
        })
        .catch(() => {
          // On network error, assume open and let the backend reject if needed.
          action();
        })
        .finally(() => setLoading(false));
    },
    [],
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
