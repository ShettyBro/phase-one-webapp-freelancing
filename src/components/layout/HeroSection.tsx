import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { CONFERENCE } from '../../data/comun';
import { useNavigate } from 'react-router-dom';
import { smoothScrollTo } from '../../utils/scroll';
import { Countdown } from '../ui/Countdown';
import { useRegistration } from '../../context/RegistrationContext';

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
  const { isOpen: registrationOpen, requireOpen } = useRegistration();
  const navigate = useNavigate();
  const handleRegister   = () => requireOpen(() => navigate('/register'));
  const handleCommittees = () => smoothScrollTo('#committees');

  // Scroll-linked parallax — the photo drifts down slowly while the content
  // floats up and fades as you scroll past the hero, creating real depth.
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });
  const bgY            = useTransform(scrollYProgress, [0, 1], ['0%', '16%']);
  const contentY       = useTransform(scrollYProgress, [0, 1], [0, -90]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.55], [1, 0]);

  return (
    <section
      ref={sectionRef}
      className="relative w-full min-h-screen flex flex-col items-center justify-center overflow-hidden"
    >

      {/* ── Background Photo ─────────────────────────────────────────
          The UN General Assembly Hall — sets the diplomatic stage.
          A slow Ken-Burns drift + scroll parallax keep it cinematic.
          Oversized (-inset) so the parallax shift never reveals an edge.
      ───────────────────────────────────────────────────────────── */}
      <motion.div
        className="absolute -inset-[10%] -z-20 bg-comun-black"
        style={{
          backgroundImage: 'url(/un-assembly.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center 42%',
          y: bgY,
        }}
        initial={{ scale: 1.08, opacity: 0 }}
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
            'radial-gradient(ellipse 50% 45% at 50% 42%, rgba(255,208,0,0.10) 0%, transparent 65%)',
            /* dark scrim directly behind the central text column for guaranteed contrast */
            'radial-gradient(ellipse 60% 60% at 50% 48%, rgba(4,8,18,0.72) 0%, rgba(4,8,18,0.25) 55%, transparent 75%)',
            /* top-to-bottom darkening — heavier at the edges for the navbar + CTAs */
            'linear-gradient(180deg, rgba(6,11,24,0.88) 0%, rgba(6,11,24,0.62) 35%, rgba(6,11,24,0.66) 62%, rgba(6,11,24,0.92) 100%)',
            /* corner vignette to frame the content */
            'radial-gradient(ellipse 115% 100% at 50% 45%, transparent 40%, rgba(3,7,15,0.8) 100%)',
          ].join(','),
        }}
        aria-hidden="true"
      />

      {/* ── Hero Content ─────────────────────────────────────────────
          pt-20 md:pt-24 → clears the fixed navbar.
          Logo is now the dominant element with a large display size.
      ───────────────────────────────────────────────────────────── */}
      <motion.div
        className="relative flex flex-col items-center text-center px-4 sm:px-6 max-w-4xl mx-auto w-full"
        style={{ zIndex: 2, paddingTop: '2.75rem', y: contentY, opacity: contentOpacity }}   /* clears the fixed navbar + scroll parallax */
      >

        {/* ────────────────────────────────────────────────────────────
            LOGO — prominent but sized so the whole hero fits in 100vh.
        ──────────────────────────────────────────────────────────── */}
        <motion.div
          className="mb-3 md:mb-3.5"
          initial={{ opacity: 0, scale: 0.92, filter: 'blur(6px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
        >
          <motion.img
            src="/logo.png"
            alt="CoMUN 2026 Official Logo"
            animate={{ y: [0, -9, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              height: 'clamp(88px, 9.5vw, 138px)',
              width:  'auto',
              objectFit: 'contain',
              display: 'block',
              margin: '0 auto',
              filter: 'drop-shadow(0 0 40px rgba(255,208,0,0.45)) drop-shadow(0 2px 8px rgba(0,0,0,0.6))',
            }}
          />
        </motion.div>

        {/* Eyebrow */}
        <motion.div {...fadeUp(0.2)} className="mb-2">
          <span className="inline-flex items-center gap-3 font-sans text-[10px] sm:text-[11px] font-semibold tracking-[0.3em] uppercase text-comun-gold/90" style={{ textShadow: '0 1px 10px rgba(0,0,0,0.8)' }}>
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
          className="font-serif-display font-semibold text-comun-white mb-2.5"
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
        <motion.div {...fadeIn(0.48)} className="mb-2.5">
          <div className="w-32 h-px bg-gradient-to-r from-transparent via-comun-gold/55 to-transparent mx-auto" />
        </motion.div>

        {/* Roman Year */}
        <motion.p
          {...fadeUp(0.55)}
          className="font-serif-display text-base md:text-lg font-light tracking-[0.45em] text-comun-gold/90 mb-1.5"
          style={{ textShadow: '0 1px 12px rgba(0,0,0,0.75)' }}
        >
          {CONFERENCE.romanYear}
        </motion.p>

        {/* Theme */}
        <motion.p
          {...fadeUp(0.64)}
          className="font-serif-display text-lg md:text-2xl italic font-normal text-comun-white/95 mb-2 tracking-wide"
          style={{ textShadow: '0 2px 16px rgba(0,0,0,0.8)' }}
        >
          "{CONFERENCE.theme}"
        </motion.p>

        {/* Dates */}
        <motion.p
          {...fadeUp(0.72)}
          className="font-sans text-xs md:text-sm text-comun-gold-light tracking-[0.2em] uppercase mb-4"
          style={{ textShadow: '0 1px 10px rgba(0,0,0,0.8)' }}
        >
          {CONFERENCE.dates}
        </motion.p>

        {/* Countdown */}
        <motion.div {...fadeUp(0.8)} className="mb-5 md:mb-6">
          <Countdown target={CONFERENCE.startsAt} />
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          {...fadeUp(0.82)}
          className="flex flex-col sm:flex-row items-center gap-4"
        >
          <motion.button
            onClick={handleRegister}
            className="btn-primary text-sm px-8 py-3 min-w-[160px]"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
          >
            {registrationOpen ? 'Register Now' : 'Registrations Closed'}
          </motion.button>
          <motion.button
            onClick={handleCommittees}
            className="btn-secondary text-sm px-8 py-3 min-w-[160px]"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
          >
            Explore Committees
          </motion.button>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
