import React from 'react';
import { motion } from 'framer-motion';

type Position = 'left' | 'right' | 'center';

interface DoveAccentProps {
  /** Which edge the dove anchors to. */
  position?: Position;
  /** CSS width (responsive clamp recommended). */
  size?: string;
  /** Resting opacity once faded in. */
  opacity?: number;
  /** Add a soft teal glow (use sparingly for hero-like emphasis). */
  glow?: boolean;
  /** Flip horizontally so a pair of doves can face inward. */
  flip?: boolean;
}

/**
 * Faint peace-dove watermark used as a recurring background motif.
 * Sits behind section content (z-0) and fades in on scroll.
 * The outer div owns positioning; the inner img owns the flip — so the
 * two transforms never collide.
 */
export const DoveAccent: React.FC<DoveAccentProps> = ({
  position = 'right',
  size = 'clamp(260px, 30vw, 520px)',
  opacity = 0.05,
  glow = false,
  flip = false,
}) => {
  const anchor =
    position === 'center'
      ? 'left-1/2 -translate-x-1/2'
      : position === 'left'
      ? 'left-0 -translate-x-1/4'
      : 'right-0 translate-x-1/4';

  return (
    <motion.div
      aria-hidden="true"
      initial={{ opacity: 0 }}
      whileInView={{ opacity }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 1.6, ease: 'easeOut' }}
      className={`pointer-events-none select-none absolute top-1/2 -translate-y-1/2 z-0 ${anchor}`}
      style={{ width: size }}
    >
      <img
        src="/dove_peace.png"
        alt=""
        className="w-full h-auto"
        style={{
          transform: flip ? 'scaleX(-1)' : undefined,
          filter: glow
            ? 'brightness(1.12) drop-shadow(0 0 60px rgba(91,184,212,0.30))'
            : undefined,
        }}
      />
    </motion.div>
  );
};
