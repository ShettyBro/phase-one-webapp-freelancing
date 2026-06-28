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

      {/* ── Background ──────────────────────────────────────────────
          Slightly lighter navy so the teal dove can be seen against it.
          The dove is teal (#5BB8D4) — background must not be same hue.
          Using a very dark warm-tinted charcoal so the cool teal shows.
      ───────────────────────────────────────────────────────────── */}
      <div
        className="absolute inset-0 -z-20"
        style={{ background: '#0c0e14' }}   /* dark warm charcoal-black */
      />
      <div
        className="absolute inset-0 -z-10"
        style={{
          background: [
            /* deep navy vignette edges */
            'radial-gradient(ellipse 100% 100% at 50% 0%,   rgba(10,16,32,0.9)  0%, transparent 60%)',
            'radial-gradient(ellipse 100% 100% at 50% 100%, rgba(8,12,22,0.95)  0%, transparent 60%)',
            /* gold ambient centre glow */
            'radial-gradient(ellipse 60% 50% at 50% 62%,   rgba(201,168,76,0.06) 0%, transparent 70%)',
          ].join(','),
        }}
      />

      {/* ── Peace Dove Watermark ─────────────────────────────────────
          Higher opacity (0.13) and NO desaturation so the teal shows.
          Positioned to sit behind the title area, not the logo.
      ───────────────────────────────────────────────────────────── */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ zIndex: 0, paddingTop: '12%' }}   /* shift dove down so it sits behind the text */
        aria-hidden="true"
      >
        <img
          src="/dove_peace.png"
          alt=""
          style={{
            width:  'clamp(420px, 62vw, 820px)',
            height: 'auto',
            opacity: 0.13,
            filter:  'blur(0.5px) brightness(1.3)',  /* keep teal colour, just soften edges */
            userSelect: 'none',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* ── Hero Content ─────────────────────────────────────────────
          pt-20 md:pt-24 → clears the fixed navbar.
          Logo is now the dominant element with a large display size.
      ───────────────────────────────────────────────────────────── */}
      <div
        className="relative flex flex-col items-center text-center px-4 sm:px-6 max-w-4xl mx-auto w-full"
        style={{ zIndex: 2, paddingTop: '5.5rem' }}   /* 88px — clears h-20 navbar on desktop */
      >

        {/* ────────────────────────────────────────────────────────────
            LOGO — the star of the show.
            h-44 → 176px | h-56 → 224px | h-64 → 256px
            Let it breathe with a prominent gold drop-shadow.
        ──────────────────────────────────────────────────────────── */}
        <motion.div {...fadeIn(0.05)} className="mb-6 md:mb-8">
          <img
            src="/logo.png"
            alt="CoMUN 2026 Official Logo"
            style={{
              height: 'clamp(180px, 22vw, 260px)',   /* big on all screen sizes */
              width:  'auto',
              objectFit: 'contain',
              display: 'block',
              margin: '0 auto',
              filter: 'drop-shadow(0 0 40px rgba(201,168,76,0.45)) drop-shadow(0 2px 8px rgba(0,0,0,0.6))',
            }}
          />
        </motion.div>

        {/* Eyebrow */}
        <motion.div {...fadeUp(0.2)} className="mb-4">
          <span className="inline-flex items-center gap-3 font-sans text-[11px] font-semibold tracking-[0.3em] uppercase text-comun-gold/80">
            <span className="w-6 h-px bg-comun-gold/40 inline-block" />
            Cottons Model United Nations
            <span className="w-6 h-px bg-comun-gold/40 inline-block" />
          </span>
        </motion.div>

        {/* ────────────────────────────────────────────────────────────
            Title — reduced from clamp(2.8rem,8vw,7rem) to a controlled
            size that fits in 2 lines without wrapping at 100% zoom.
            Max ~3.75rem so "COTTONS MODEL" + "UNITED NATIONS" each
            fit on one line on a 1366px viewport.
        ──────────────────────────────────────────────────────────── */}
        <motion.h1
          {...fadeUp(0.35)}
          className="font-serif-display font-semibold text-comun-white leading-tight mb-4"
          style={{
            fontSize:      'clamp(2rem, 4.2vw, 3.8rem)',
            letterSpacing: '0.06em',
            lineHeight:    '1.15',
          }}
        >
          <span className="block text-gold-gradient">COTTONS MODEL</span>
          <span className="block text-gold-gradient">UNITED NATIONS</span>
        </motion.h1>

        {/* Divider */}
        <motion.div {...fadeIn(0.48)} className="mb-4">
          <div className="w-36 h-px bg-gradient-to-r from-transparent via-comun-gold/55 to-transparent mx-auto" />
        </motion.div>

        {/* Roman Year */}
        <motion.p
          {...fadeUp(0.55)}
          className="font-serif-display text-lg md:text-xl font-light tracking-[0.45em] text-comun-gold/65 mb-3"
        >
          {CONFERENCE.romanYear}
        </motion.p>

        {/* Theme */}
        <motion.p
          {...fadeUp(0.64)}
          className="font-serif-display text-base md:text-xl italic font-light text-comun-white/65 mb-2 tracking-wide"
        >
          "{CONFERENCE.theme}"
        </motion.p>

        {/* Dates */}
        <motion.p
          {...fadeUp(0.72)}
          className="font-sans text-xs md:text-sm text-comun-muted tracking-[0.2em] uppercase mb-10"
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
