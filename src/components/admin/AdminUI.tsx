import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertTriangle } from 'lucide-react';

export const AdminPageHeader: React.FC<{ title: string; subtitle?: string; actions?: React.ReactNode }> = ({ title, subtitle, actions }) => (
  <div className="flex items-start justify-between gap-4 mb-6">
    <div>
      <h1 className="font-serif-display text-2xl md:text-3xl font-semibold text-gold-gradient">{title}</h1>
      {subtitle && <p className="font-sans text-sm text-comun-muted mt-1">{subtitle}</p>}
    </div>
    {actions}
  </div>
);

export const AdminCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-comun-charcoal/50 border border-comun-gold/10 rounded-md ${className}`}>{children}</div>
);

export const Spinner: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`flex items-center justify-center py-16 ${className}`}>
    <Loader2 className="w-6 h-6 text-comun-gold animate-spin" />
  </div>
);

export const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="text-center py-16 font-sans text-sm text-comun-muted">{message}</div>
);

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ open, title, message, confirmLabel = 'Delete', loading, onConfirm, onCancel }) => (
  <AnimatePresence>
    {open && (
      <>
        <motion.div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onCancel} />
        <div className="fixed inset-0 z-[201] flex items-center justify-center p-4 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            className="pointer-events-auto bg-comun-charcoal border border-comun-maroon/40 rounded-md w-full max-w-sm p-6 text-center"
          >
            <div className="mx-auto mb-4 w-12 h-12 flex items-center justify-center rounded-full border border-comun-maroon/40 bg-comun-maroon/10">
              <AlertTriangle className="w-6 h-6 text-comun-maroon-light" />
            </div>
            <h3 className="font-serif-display text-xl text-comun-white mb-2">{title}</h3>
            <p className="font-sans text-sm text-comun-muted mb-6">{message}</p>
            <div className="flex gap-3 justify-center">
              <button onClick={onCancel} disabled={loading} className="btn-secondary text-sm px-5 py-2.5">Cancel</button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className="text-sm px-5 py-2.5 rounded-sm font-sans font-semibold uppercase tracking-wider inline-flex items-center gap-2 bg-comun-maroon text-white hover:bg-comun-maroon-light transition-colors disabled:opacity-60"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />} {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      </>
    )}
  </AnimatePresence>
);
