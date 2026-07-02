import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { NAV_LINKS } from '../../data/comun';
import { smoothScrollTo } from '../../utils/scroll';
import { useRegistration } from '../../context/RegistrationContext';

/**
 * Maps each nav label to the section ID it represents on the page.
 * "Resources" maps to #registration until a dedicated /resources page is built.
 */
const SECTION_MAP: { label: string; sectionId: string }[] = [
  { label: 'Home',       sectionId: '' },
  { label: 'About',      sectionId: 'about' },
  { label: 'Committees', sectionId: 'committees' },
  { label: 'Resources',  sectionId: 'resources' },
  { label: 'FAQ',        sectionId: 'faq' },
  { label: 'Contact',    sectionId: 'contact' },
];

/**
 * CoMUN 2026 — Navbar (matches client design)
 * ─ Fully transparent background at all times
 * ─ Nav links enclosed in a pill-shaped gold-bordered container (left side)
 * ─ Active / hovered link has gold fill background
 * ─ Solid gold "REGISTER" button on the far right
 * ─ Mobile hamburger drawer
 */
const Navbar: React.FC = () => {
  const [open, setOpen]             = useState(false);
  const [activeLink, setActiveLink] = useState('Home');
  const location                    = useLocation();
  const mobileRef                   = useRef<HTMLDivElement>(null);

  // ── Scroll-position based active section tracker ────────────────

  useEffect(() => {
    const NAVBAR_HEIGHT  = 80;
    const TRIGGER_OFFSET = NAVBAR_HEIGHT + window.innerHeight * 0.25;

    const onScroll = () => {
      const scrollY = window.scrollY;

      if (scrollY < 60) {
        setActiveLink('Home');
        return;
      }

      let detected = 'Home';
      for (const { label, sectionId } of SECTION_MAP) {
        if (!sectionId) continue;
        const el = document.getElementById(sectionId);
        if (!el) continue;
        if (el.getBoundingClientRect().top + scrollY - TRIGGER_OFFSET <= scrollY) {
          detected = label;
        }
      }
      setActiveLink(detected);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [location]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (mobileRef.current && !mobileRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const handleNavClick = (href: string, label: string) => {
    setActiveLink(label);
    if (href === '/') {
      smoothScrollTo('top');
    } else if (href.startsWith('#')) {
      smoothScrollTo(href);
    }
    setOpen(false);
  };

  const { isOpen: registrationOpen, requireOpen } = useRegistration();
  const navigate = useNavigate();

  const handleRegister = () => {
    requireOpen(() => navigate('/register'));
    setOpen(false);
  };

  return (
    <>
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50"
        initial={{ y: -28, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">

            {/* ── Left: Pill Nav Container ─────────────────────────── */}
            <div className="hidden md:flex items-center">
              {/* Pill border container */}
              <div
                className="flex items-center gap-1 px-1.5 py-1.5"
                style={{
                  border: '1.5px solid rgba(145, 38, 38, 0.85)',
                  borderRadius: '999px',
                  background: 'rgba(94, 23, 23, 0.28)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                {NAV_LINKS.map(link => {
                  const isActive = activeLink === link.label;
                  return (
                    <button
                      key={link.label}
                      onClick={() => handleNavClick(link.href, link.label)}
                      style={{
                        borderRadius: '999px',
                        padding: '0.45rem 1.1rem',
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '0.875rem',
                        fontWeight: isActive ? 700 : 500,
                        letterSpacing: '0.02em',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer',
                        border: 'none',
                        outline: 'none',
                        background: isActive
                          ? 'linear-gradient(135deg, #FFD000 0%, #FFE266 100%)'
                          : 'transparent',
                        color: isActive ? '#0a0a0a' : 'rgba(255,255,255,0.85)',
                      }}
                      onMouseEnter={e => {
                        if (!isActive) {
                          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,208,0,0.15)';
                          (e.currentTarget as HTMLButtonElement).style.color = '#FFD000';
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isActive) {
                          (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                          (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.85)';
                        }
                      }}
                    >
                      {link.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Center: Logo (mobile) / hidden on desktop since logo is in hero ── */}
            <div className="md:hidden flex items-center">
              <Link to="/" className="flex items-center gap-2">
                <img
                  src="/logo.png"
                  alt="CoMUN"
                  className="h-9 w-auto object-contain"
                />
                <span className="font-sans font-bold text-sm text-white tracking-wider">CoMUN</span>
              </Link>
            </div>

            {/* ── Right: My Pass + Register Buttons + Mobile Toggle ───── */}
            <div className="flex items-center gap-3">

              {/* Desktop: My Pass (ghost/subtle) */}
              <Link
                to="/retrieve"
                className="hidden md:inline-flex items-center gap-1.5 font-sans font-semibold text-sm cursor-pointer"
                style={{
                  color: 'rgba(255,255,255,0.75)',
                  padding: '0.55rem 1.25rem',
                  borderRadius: '999px',
                  border: '1.5px solid rgba(145,38,38,0.6)',
                  background: 'rgba(94,23,23,0.18)',
                  backdropFilter: 'blur(8px)',
                  letterSpacing: '0.03em',
                  transition: 'all 0.2s ease',
                  textDecoration: 'none',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(145,38,38,0.9)';
                  (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(94,23,23,0.35)';
                  (e.currentTarget as HTMLAnchorElement).style.color = '#fff';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(145,38,38,0.6)';
                  (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(94,23,23,0.18)';
                  (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.75)';
                }}
              >
                <FileText size={14} />
                My Pass
              </Link>

              {/* Desktop register button */}
              <button
                onClick={handleRegister}
                className="hidden md:inline-flex items-center justify-center font-sans font-bold text-sm tracking-widest uppercase cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #FFD000 0%, #FFE266 100%)',
                  color: '#0a0a0a',
                  padding: '0.6rem 1.75rem',
                  borderRadius: '999px',
                  border: 'none',
                  outline: 'none',
                  letterSpacing: '0.08em',
                  boxShadow: '0 4px 20px rgba(255,208,0,0.4)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 28px rgba(255,208,0,0.55)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 20px rgba(255,208,0,0.4)';
                }}
              >
                {registrationOpen ? 'Register' : 'Registrations Closed'}
              </button>

              {/* Mobile hamburger */}
              <button
                onClick={() => setOpen(v => !v)}
                className="md:hidden p-2 text-white/80 hover:text-comun-gold transition-colors"
                aria-label={open ? 'Close menu' : 'Open menu'}
              >
                {open ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* ── Mobile Drawer ──────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.div
              ref={mobileRef}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-72 md:hidden"
              style={{
                background: 'rgba(10,10,10,0.95)',
                backdropFilter: 'blur(20px)',
                borderLeft: '1px solid rgba(255,208,0,0.15)',
              }}
            >
              <div className="flex flex-col h-full p-6">
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-2">
                    <img src="/logo.png" alt="CoMUN" className="h-9 w-auto object-contain" />
                    <span className="font-sans font-bold text-sm text-white">CoMUN 2026</span>
                  </div>
                  <button onClick={() => setOpen(false)} className="p-2 text-white/60 hover:text-comun-gold">
                    <X size={20} />
                  </button>
                </div>

                <nav className="flex flex-col gap-1 flex-1">
                  {NAV_LINKS.map((link, i) => {
                    const isActive = activeLink === link.label;
                    return (
                      <motion.button
                        key={link.label}
                        onClick={() => handleNavClick(link.href, link.label)}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 * i }}
                        className="text-left font-sans text-base py-3 px-4 rounded-full transition-all duration-200"
                        style={{
                          background: isActive ? 'linear-gradient(135deg, #FFD000, #FFE266)' : 'transparent',
                          color: isActive ? '#0a0a0a' : 'rgba(255,255,255,0.75)',
                          fontWeight: isActive ? 700 : 500,
                        }}
                      >
                        {link.label}
                      </motion.button>
                    );
                  })}
                </nav>

                <div className="pt-6 border-t border-comun-gold/10 flex flex-col gap-3">
                  {/* Mobile: My Pass ghost button */}
                  <Link
                    to="/retrieve"
                    onClick={() => setOpen(false)}
                    className="w-full font-sans font-semibold text-sm py-3 rounded-full text-center flex items-center justify-center gap-2"
                    style={{
                      background: 'rgba(94,23,23,0.25)',
                      border: '1.5px solid rgba(145,38,38,0.5)',
                      color: 'rgba(255,255,255,0.8)',
                      textDecoration: 'none',
                    }}
                  >
                    <FileText size={14} />
                    My Pass
                  </Link>
                  <button
                    onClick={handleRegister}
                    className="w-full font-sans font-bold text-sm tracking-widest uppercase py-3 rounded-full"
                    style={{
                      background: 'linear-gradient(135deg, #FFD000, #FFE266)',
                      color: '#0a0a0a',
                    }}
                  >
                    {registrationOpen ? 'Register Now' : 'Registrations Closed'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
