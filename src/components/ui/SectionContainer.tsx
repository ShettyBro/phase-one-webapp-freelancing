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
  /** Background decoration layer (e.g. <DoveAccent />), rendered behind content. */
  decor?: React.ReactNode;
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
  decor,
}) => {
  const padding = compact ? 'py-12 md:py-16' : 'py-16 md:py-20 lg:py-24';
  const maxW = narrow ? 'max-w-4xl' : 'max-w-7xl';

  return (
    <section
      id={id}
      className={`relative overflow-hidden scroll-mt-20 md:scroll-mt-24 ${padding} px-4 sm:px-6 lg:px-8 ${className}`}
    >
      {decor}
      <div className={`relative z-10 ${maxW} mx-auto`}>{children}</div>
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
      className={`flex flex-col gap-3 mb-10 md:mb-12 ${align}`}
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
      <motion.div
        className={`${centered ? 'gold-divider' : 'gold-divider-left'} mt-2`}
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
        style={{ transformOrigin: centered ? 'center' : 'left' }}
      />
      {subtitle && (
        <p className="text-comun-muted font-sans text-base md:text-lg max-w-2xl leading-relaxed mt-2">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
};
