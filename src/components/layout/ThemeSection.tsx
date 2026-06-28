import React from 'react';
import { motion } from 'framer-motion';
import { CONFERENCE } from '../../data/comun';

/**
 * Conference Theme section — large typographic statement for "Peace Over Power"
 */
const ThemeSection: React.FC = () => (
  <section className="relative py-20 md:py-24 overflow-hidden bg-comun-navy/30">
    {/* Background layers */}
    <div className="absolute inset-0 bg-gradient-to-b from-comun-black via-comun-navy/60 to-comun-black" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(201,168,76,0.1)_0%,transparent_65%)]" />

    {/* Faint horizontal rule lines */}
    {[20, 40, 60, 80].map(pct => (
      <div
        key={pct}
        className="absolute left-0 right-0 h-px opacity-[0.04]"
        style={{ top: `${pct}%`, background: 'linear-gradient(90deg, transparent, #C9A84C, transparent)' }}
      />
    ))}

    {/* Luminous peace dove — the thematic heart of this section */}
    <motion.img
      src="/dove_peace.png"
      alt=""
      aria-hidden="true"
      initial={{ opacity: 0, scale: 0.94 }}
      whileInView={{ opacity: 0.16, scale: 1, y: [0, -16, 0] }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{
        opacity: { duration: 1.8, ease: 'easeOut' },
        scale:   { duration: 1.8, ease: 'easeOut' },
        y:       { duration: 10, repeat: Infinity, ease: 'easeInOut' },
      }}
      className="pointer-events-none select-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-0"
      style={{
        width: 'clamp(420px, 58vw, 820px)',
        height: 'auto',
        filter: 'brightness(1.15) drop-shadow(0 0 80px rgba(91,184,212,0.35))',
      }}
    />

    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

      {/* Eyebrow */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <span className="inline-flex items-center gap-3 font-sans text-xs font-semibold tracking-[0.3em] uppercase text-comun-gold/70">
          <span className="w-12 h-px bg-comun-gold/30" />
          {CONFERENCE.name} — Official Theme
          <span className="w-12 h-px bg-comun-gold/30" />
        </span>
      </motion.div>

      {/* Large theme words */}
      <div className="overflow-hidden">
        <motion.p
          initial={{ y: '100%', opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className="font-serif-display font-light text-comun-white/30 tracking-[0.25em] uppercase text-lg md:text-2xl mb-2"
        >
          Conference Theme
        </motion.p>
      </div>

      <div className="overflow-hidden mb-4">
        <motion.h2
          initial={{ y: '100%', opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          className="font-serif-display font-semibold text-gold-shimmer leading-tight"
          style={{ fontSize: 'clamp(2.8rem, 7.5vw, 6.5rem)' }}
        >
          Peace
        </motion.h2>
      </div>

      <div className="overflow-hidden mb-10">
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.35 }}
          className="flex items-center justify-center gap-6 md:gap-10"
        >
          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-comun-gold/30" />
          <span
            className="font-serif-display font-light italic text-comun-white/50 tracking-widest"
            style={{ fontSize: 'clamp(1.5rem, 4vw, 3.5rem)' }}
          >
            over
          </span>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent to-comun-gold/30" />
        </motion.div>
      </div>

      <div className="overflow-hidden mb-10">
        <motion.h2
          initial={{ y: '100%', opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
          className="font-serif-display font-semibold text-comun-white/25 leading-tight"
          style={{ fontSize: 'clamp(2.8rem, 7.5vw, 6.5rem)' }}
        >
          Power
        </motion.h2>
      </div>

      {/* Theme description */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.65 }}
        className="font-sans text-base md:text-lg text-comun-muted max-w-2xl mx-auto leading-relaxed"
      >
        This theme challenges delegates to question the structures of dominance that shape
        our world — and to champion diplomacy, cooperation, and human dignity above all.
      </motion.p>

      {/* Decorative rule */}
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1, delay: 0.8 }}
        className="mt-12 mx-auto w-40 h-px bg-gradient-to-r from-transparent via-comun-gold/40 to-transparent origin-center"
      />
    </div>
  </section>
);

export default ThemeSection;
