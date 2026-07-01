import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, X } from 'lucide-react';

interface RegistrationClosedDialogProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Modal shown when a user activates any Register CTA while registrations are
 * closed. Styled to match the site (glass-navy, gold + maroon accents).
 */
export const RegistrationClosedDialog: React.FC<RegistrationClosedDialogProps> = ({ open, onClose }) => (
  <AnimatePresence>
    {open && (
      <>
        <motion.div
          className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          aria-hidden="true"
        />
        <div className="fixed inset-0 z-[201] flex items-center justify-center p-4 pointer-events-none">
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reg-closed-title"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-auto glass-navy gold-border rounded-md w-full max-w-md p-8 text-center relative overflow-hidden"
          >
            {/* Maroon → gold top accent */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-comun-maroon via-comun-gold to-comun-maroon" />

            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1.5 text-comun-muted hover:text-comun-gold transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <div className="mx-auto mb-5 w-14 h-14 flex items-center justify-center rounded-full border border-comun-gold/30 bg-comun-gold/5">
              <Lock className="w-6 h-6 text-comun-gold" />
            </div>

            <h3
              id="reg-closed-title"
              className="font-serif-display text-2xl md:text-3xl font-semibold text-gold-gradient mb-3"
            >
              Registrations Closed
            </h3>

            <p className="font-sans text-sm text-comun-muted leading-relaxed mb-6">
              Registrations for CoMUN 2026 are currently closed. Please check back soon or
              follow our official channels for updates. For any queries, reach out via the
              Contact section.
            </p>

            <button onClick={onClose} className="btn-primary text-sm px-8 py-3 w-full sm:w-auto">
              Understood
            </button>
          </motion.div>
        </div>
      </>
    )}
  </AnimatePresence>
);
