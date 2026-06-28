import React from 'react';
import { motion } from 'framer-motion';

interface SectionContainerProps {
  id?: string;
  className?: string;
  children: React.ReactNode;
  /** If true, renders a narrow (4xl) container. Default is 7xl wide. */
  narrow?: boolean;
  /** Extra top/bottom padding variant */
  compact?: boolean;
}

/**
 * Reusable section wrapper with consistent padding and max-width.
 */
export const SectionContainer: React.FC<SectionContainerProps> = ({
  id,
  className = '',
  children,
  narrow = false,
  compact = false,
}) => {
  const padding = compact ? 'py-16 md:py-20' : 'py-20 md:py-28 lg:py-36';
  const maxW = narrow ? 'max-w-4xl' : 'max-w-7xl';

  return (
    <section
      id={id}
      className={`relative ${padding} px-4 sm:px-6 lg:px-8 ${className}`}
    >
      <div className={`${maxW} mx-auto`}>{children}</div>
    </section>
  );
};

// ─── Section Header ────────────────────────────────────────────────────────
interface SectionHeaderProps {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: string;
  centered?: boolean;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  eyebrow,
  title,
  subtitle,
  centered = true,
}) => {
  const align = centered ? 'text-center items-center' : 'text-left items-start';

  return (
    <motion.div
      className={`flex flex-col gap-4 mb-16 ${align}`}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      {eyebrow && (
        <span className="text-comun-gold font-sans text-xs font-semibold tracking-[0.2em] uppercase">
          {eyebrow}
        </span>
      )}
      <h2 className="font-serif-display text-section text-comun-white leading-tight">
        {title}
      </h2>
      {centered && <div className="gold-divider mt-2" />}
      {!centered && <div className="gold-divider-left mt-2" />}
      {subtitle && (
        <p className="text-comun-muted font-sans text-base md:text-lg max-w-2xl leading-relaxed mt-2">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
};
