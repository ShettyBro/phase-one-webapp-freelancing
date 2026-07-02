import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { COMMITTEES, type Committee } from '../../data/comun';
import { SectionContainer, SectionHeader } from '../ui/SectionContainer';
import { CommitteeCard } from '../ui/CommitteeCard';
import { DoveAccent } from '../ui/DoveAccent';

const CommitteesSection: React.FC = () => {
  const [selectedCommittee, setSelectedCommittee] = useState<Committee | null>(null);

  // Robust scroll lock — works on iOS, Android and all desktop browsers.
  // Saves current scroll position, then uses position:fixed so the page
  // stays frozen at exactly that spot. Restores on close.
  useEffect(() => {
    if (selectedCommittee) {
      const scrollY = window.scrollY;
      document.body.style.overflow   = 'hidden';
      document.body.style.position   = 'fixed';
      document.body.style.top        = `-${scrollY}px`;
      document.body.style.width      = '100%';
      document.documentElement.style.overflow = 'hidden';
    } else {
      const top = document.body.style.top;
      document.body.style.overflow   = '';
      document.body.style.position   = '';
      document.body.style.top        = '';
      document.body.style.width      = '';
      document.documentElement.style.overflow = '';
      // Restore exact scroll position so page doesn't jump to top.
      if (top) window.scrollTo(0, -parseInt(top, 10));
    }
    return () => {
      const top = document.body.style.top;
      document.body.style.overflow   = '';
      document.body.style.position   = '';
      document.body.style.top        = '';
      document.body.style.width      = '';
      document.documentElement.style.overflow = '';
      if (top) window.scrollTo(0, -parseInt(top, 10));
    };
  }, [selectedCommittee]);

  return (
    <SectionContainer
      id="committees"
      className="bg-gradient-to-b from-comun-black to-comun-charcoal/50"
      decor={<DoveAccent position="left" opacity={0.04} flip />}
    >
      <div className="relative z-10">
        <SectionHeader
          eyebrow="Committees"
          title={
            <>
              Seven Chambers of{' '}
              <span className="text-gold-gradient">Global Dialogue</span>
            </>
          }
          subtitle="Each committee represents a distinct forum of the United Nations system. Choose your arena, research your mandate, and step into the debate."
        />

        {/* Committee grid — 1 col mobile, 2 col sm, 3 col lg */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
          {COMMITTEES.map((c, i) => (
            <CommitteeCard key={c.code} committee={c} index={i} onClick={() => setSelectedCommittee(c)} />
          ))}
        </div>

        {/* Coming Soon notice */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center font-sans text-xs text-comun-muted tracking-widest uppercase mt-10"
        >
          Click any committee to view agenda &amp; details
        </motion.p>
      </div>

      {/* Committee Info Modal */}
      <AnimatePresence>
        {selectedCommittee && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            onClick={() => setSelectedCommittee(null)}
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/85 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              onClick={e => e.stopPropagation()}
              className={`relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-sm shadow-2xl z-10`}
              style={{
                backdropFilter: 'blur(20px)',
                background: 'linear-gradient(145deg, rgba(10,6,20,0.97) 0%, rgba(18,10,30,0.95) 100%)',
                border: '1px solid rgba(255,208,0,0.25)',
                boxShadow: '0 0 60px rgba(255,208,0,0.1), 0 24px 64px rgba(0,0,0,0.6)',
              }}
            >
              {/* Gold top bar */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-comun-maroon via-comun-gold to-comun-maroon" />
              
              <div className="p-6 md:p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className="pr-8">
                    <h3 className="font-serif-display text-3xl md:text-4xl text-comun-white mb-2">
                      {selectedCommittee.name}
                    </h3>
                    <p className="font-sans text-sm md:text-base text-comun-gold/80 uppercase tracking-widest">
                      {selectedCommittee.fullName}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedCommittee(null)}
                    className="p-2 text-comun-muted hover:text-comun-gold transition-colors bg-white/5 rounded-full flex-shrink-0"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {selectedCommittee.agenda && (
                    <div>
                      <h4 className="font-sans text-xs text-comun-gold/60 uppercase tracking-widest mb-2">Agenda</h4>
                      <p className="font-serif-display text-xl text-comun-white/90 leading-relaxed">
                        {selectedCommittee.agenda}
                      </p>
                    </div>
                  )}

                  {selectedCommittee.description && (
                    <div>
                      <h4 className="font-sans text-xs text-comun-gold/60 uppercase tracking-widest mb-2">Committee Description</h4>
                      <p className="font-sans text-sm text-comun-muted leading-relaxed">
                        {selectedCommittee.description}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                    {selectedCommittee.format && (
                      <div>
                        <h4 className="font-sans text-xs text-comun-gold/60 uppercase tracking-widest mb-1">Format</h4>
                        <p className="font-sans text-sm text-comun-white">{selectedCommittee.format}</p>
                      </div>
                    )}
                    {selectedCommittee.chairperson && (
                      <div>
                        <h4 className="font-sans text-xs text-comun-gold/60 uppercase tracking-widest mb-1">Chairperson</h4>
                        <p className="font-sans text-sm text-comun-white">{selectedCommittee.chairperson}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </SectionContainer>
  );
};

export default CommitteesSection;
