import React from 'react';
import { motion } from 'framer-motion';
import { useCountdown } from '../../hooks/useCountdown';

interface CountdownProps {
  target: string | number | Date;
  className?: string;
}

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Elegant live countdown — four gold/navy unit cards (Days · Hours · Minutes ·
 * Seconds). Each value gently fades on change so the timer feels alive.
 */
export const Countdown: React.FC<CountdownProps> = ({ target, className = '' }) => {
  const { days, hours, minutes, seconds, isComplete } = useCountdown(target);

  if (isComplete) {
    return (
      <p className={`font-serif-display italic text-comun-gold-light text-lg md:text-xl ${className}`}>
        The conference is underway.
      </p>
    );
  }

  const units = [
    { value: days, label: 'Days' },
    { value: hours, label: 'Hours' },
    { value: minutes, label: 'Minutes' },
    { value: seconds, label: 'Seconds' },
  ];

  return (
    <div className={`flex items-stretch justify-center gap-2 sm:gap-3 ${className}`} role="timer" aria-live="off">
      {units.map((unit) => (
        <div
          key={unit.label}
          className="glass-navy gold-border flex flex-col items-center justify-center rounded-md px-2.5 sm:px-4 py-2 sm:py-3 min-w-[56px] sm:min-w-[74px]"
        >
          <div className="overflow-hidden">
            <motion.span
              key={unit.value}
              initial={{ y: '-60%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="block font-serif-display font-semibold text-2xl sm:text-3xl md:text-4xl text-gold-gradient tabular-nums leading-none"
            >
              {pad(unit.value)}
            </motion.span>
          </div>
          <span className="font-sans text-[8px] sm:text-[9px] tracking-[0.22em] uppercase text-comun-muted mt-1.5">
            {unit.label}
          </span>
        </div>
      ))}
    </div>
  );
};
