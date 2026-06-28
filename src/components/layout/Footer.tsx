import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { NAV_LINKS, CONFERENCE } from '../../data/comun';

const Footer: React.FC = () => {
  const handleNavClick = (href: string) => {
    if (href.startsWith('#')) {
      document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const year = new Date().getFullYear();

  return (
    <footer className="relative bg-comun-charcoal border-t border-comun-gold/10 overflow-hidden">
      {/* Ambient top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-px bg-gradient-to-r from-transparent via-comun-gold/30 to-transparent" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-20 bg-comun-gold/5 blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">

          {/* Brand Column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col gap-5"
          >
            <Link to="/" className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="CoMUN Logo"
                className="h-12 w-auto object-contain opacity-90"
              />
              <div className="flex flex-col">
                <span className="font-sans font-bold text-base text-comun-white tracking-wider">CoMUN 2026</span>
                <span className="font-sans text-[11px] text-comun-gold tracking-[0.15em] uppercase">
                  Cottons Model United Nations
                </span>
              </div>
            </Link>
            <p className="font-sans text-sm text-comun-muted leading-relaxed max-w-xs">
              The premier diplomatic simulation experience. Debate. Deliberate. Decide.
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-comun-gold/60 text-xs font-sans tracking-widest uppercase">
                {CONFERENCE.dates}
              </span>
            </div>
          </motion.div>

          {/* Navigation Column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex flex-col gap-4"
          >
            <h3 className="font-sans text-xs font-semibold text-comun-gold tracking-[0.2em] uppercase mb-2">
              Navigation
            </h3>
            {NAV_LINKS.map(link => (
              <button
                key={link.label}
                onClick={() => handleNavClick(link.href)}
                className="text-left font-sans text-sm text-comun-muted hover:text-comun-gold transition-colors duration-200 w-fit"
              >
                {link.label}
              </button>
            ))}
          </motion.div>

          {/* Conference Column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col gap-4"
          >
            <h3 className="font-sans text-xs font-semibold text-comun-gold tracking-[0.2em] uppercase mb-2">
              Conference
            </h3>
            <div className="flex flex-col gap-2">
              {[
                { label: 'Theme', value: CONFERENCE.theme },
                { label: 'Dates', value: CONFERENCE.dates },
                { label: 'Committees', value: '7 Committees' },
                { label: 'Edition', value: CONFERENCE.edition },
              ].map(item => (
                <div key={item.label} className="flex gap-3">
                  <span className="font-sans text-xs text-comun-gold/60 uppercase tracking-wider w-20 flex-shrink-0 pt-0.5">
                    {item.label}
                  </span>
                  <span className="font-sans text-sm text-comun-muted">{item.value}</span>
                </div>
              ))}
            </div>

            {/* Contact Info */}
            <div className="mt-4 pt-4 border-t border-comun-gold/10">
              <h4 className="font-sans text-xs text-comun-gold/60 uppercase tracking-widest mb-2">
                Contact
              </h4>
              <p className="font-sans text-sm text-comun-muted">
                comun2026@cottons.edu
              </p>
            </div>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 pt-6 border-t border-comun-gold/10 flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <p className="font-sans text-xs text-comun-muted text-center sm:text-left">
            © {year} CoMUN — Cottons Model United Nations. All rights reserved.
          </p>
          <div className="flex items-center gap-1">
            <span className="font-serif-display text-comun-gold/40 text-sm italic">
              Peace Over Power
            </span>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
