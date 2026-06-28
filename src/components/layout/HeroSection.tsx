import React from 'react';
import { motion } from 'framer-motion';
import { CONFERENCE } from '../../data/comun';

const fadeUp = (delay = 0) => ({
  initial:    { opacity: 0, y: 20 },
  animate:    { opacity: 1, y: 0 },
  transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1] as const, delay },
});

const fadeIn = (delay = 0) => ({
  initial:    { opacity: 0 },
  animate:    { opacity: 1 },
  transition: { duration: 0.9, ease: 'easeOut' as const, delay },
});

const HeroSection: React.FC = () => {
  const handleRegister   = () => document.querySelector('#registration')?.scrollIntoView({ behavior: 'smooth' });
  const handleCommittees = () => document.querySelector('#committees')?.scrollIntoView({ behavior: 'smooth' });
  const handleScroll     = () => document.querySelector('#about')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <section className="relative w-full min-h-screen flex flex-col items-center justify-center overflow-hidden">

      {/* ── Background Photo ─────────────────────────────────────────
          The UN General Assembly Hall — sets the diplomatic stage.
          A very slow Ken-Burns drift keeps it feeling alive (cinematic,
          not distracting). The dark overlay below keeps text legible.
      ───────────────────────────────────────────────────────────── */}
      <motion.div
        className="absolute inset-0 -z-20 bg-comun-black"
        style={{
          backgroundImage: 'url(/un-assembly.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center 42%',
        }}
        initial={{ scale: 1.06, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ scale: { duration: 18, ease: 'easeOut' }, opacity: { duration: 1.6, ease: 'easeOut' } }}
        aria-hidden="true"
      />

      {/* ── Legibility Overlay ───────────────────────────────────────
          Darkens the photo so the gold logo + title read clearly, with
          a touch of warm gold glow behind the crest and a deep vignette.
      ───────────────────────────────────────────────────────────── */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background: [
            /* warm gold halo behind the crest / title */
            'radial-gradient(ellipse 50% 45% at 50% 42%, rgba(201,168,76,0.10) 0%, transparent 65%)',
            /* top-to-bottom darkening — heavier at the edges for the navbar + CTAs */
            'linear-gradient(180deg, rgba(6,11,24,0.86) 0%, rgba(6,11,24,0.5) 30%, rgba(6,11,24,0.55) 60%, rgba(6,11,24,0.9) 100%)',
            /* corner vignette to frame the content */
            'radial-gradient(ellipse 115% 100% at 50% 45%, transparent 42%, rgba(3,7,15,0.75) 100%)',
          ].join(','),
        }}
        aria-hidden="true"
      />

      {/* ── Hero Content ─────────────────────────────────────────────
          pt-20 md:pt-24 → clears the fixed navbar.
          Logo is now the dominant element with a large display size.
      ───────────────────────────────────────────────────────────── */}
      <div
        className="relative flex flex-col items-center text-center px-4 sm:px-6 max-w-4xl mx-auto w-full"
        style={{ zIndex: 2, paddingTop: '4.5rem' }}   /* clears the fixed navbar */
      >

        {/* ────────────────────────────────────────────────────────────
            LOGO — prominent but sized so the whole hero fits in 100vh.
        ──────────────────────────────────────────────────────────── */}
        <motion.div {...fadeIn(0.05)} className="mb-4 md:mb-5">
          <img
            src="/logo.png"
            alt="CoMUN 2026 Official Logo"
            style={{
              height: 'clamp(118px, 13vw, 178px)',
              width:  'auto',
              objectFit: 'contain',
              display: 'block',
              margin: '0 auto',
              filter: 'drop-shadow(0 0 40px rgba(201,168,76,0.45)) drop-shadow(0 2px 8px rgba(0,0,0,0.6))',
            }}
          />
        </motion.div>

        {/* Eyebrow */}
        <motion.div {...fadeUp(0.2)} className="mb-3">
          <span className="inline-flex items-center gap-3 font-sans text-[10px] sm:text-[11px] font-semibold tracking-[0.3em] uppercase text-comun-gold/80">
            <span className="w-6 h-px bg-comun-gold/40 inline-block" />
            Cottons Model United Nations
            <span className="w-6 h-px bg-comun-gold/40 inline-block" />
          </span>
        </motion.div>

        {/* ────────────────────────────────────────────────────────────
            Title — sized to fit two lines on a 1366px viewport at 100%.
        ──────────────────────────────────────────────────────────── */}
        <motion.h1
          {...fadeUp(0.35)}
          className="font-serif-display font-semibold text-comun-white mb-3"
          style={{
            fontSize:      'clamp(1.7rem, 3.4vw, 3rem)',
            letterSpacing: '0.06em',
            lineHeight:    '1.12',
            filter:        'drop-shadow(0 2px 14px rgba(0,0,0,0.7))',
          }}
        >
          <span className="block text-gold-gradient">COTTONS MODEL</span>
          <span className="block text-gold-gradient">UNITED NATIONS</span>
        </motion.h1>

        {/* Divider */}
        <motion.div {...fadeIn(0.48)} className="mb-3">
          <div className="w-32 h-px bg-gradient-to-r from-transparent via-comun-gold/55 to-transparent mx-auto" />
        </motion.div>

        {/* Roman Year */}
        <motion.p
          {...fadeUp(0.55)}
          className="font-serif-display text-base md:text-lg font-light tracking-[0.45em] text-comun-gold/65 mb-2"
        >
          {CONFERENCE.romanYear}
        </motion.p>

        {/* Theme */}
        <motion.p
          {...fadeUp(0.64)}
          className="font-serif-display text-base md:text-lg italic font-light text-comun-white/65 mb-2 tracking-wide"
        >
          "{CONFERENCE.theme}"
        </motion.p>

        {/* Dates */}
        <motion.p
          {...fadeUp(0.72)}
          className="font-sans text-xs md:text-sm text-comun-muted tracking-[0.2em] uppercase mb-6 md:mb-7"
        >
          {CONFERENCE.dates}
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          {...fadeUp(0.82)}
          className="flex flex-col sm:flex-row items-center gap-4"
        >
          <button onClick={handleRegister}   className="btn-primary  text-sm px-8 py-3 min-w-[160px]">
            Register Now
          </button>
          <button onClick={handleCommittees} className="btn-secondary text-sm px-8 py-3 min-w-[160px]">
            Explore Committees
          </button>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.button
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.1 }}
        onClick={handleScroll}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 group cursor-pointer"
        style={{ zIndex: 2 }}
        aria-label="Scroll down"
      >
        <span className="font-sans text-[9px] tracking-[0.25em] uppercase text-comun-muted/70 group-hover:text-comun-gold transition-colors">
          Scroll
        </span>
        <div className="w-5 h-8 border border-comun-gold/25 rounded-full flex items-start justify-center pt-1.5 group-hover:border-comun-gold/55 transition-colors">
          <motion.div
            className="w-1 h-2 bg-comun-gold/55 rounded-full"
            animate={{ y: [0, 10, 0], opacity: [1, 0, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </motion.button>
    </section>
  );
};

export default HeroSection;
