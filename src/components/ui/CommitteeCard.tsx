import React from 'react';
import { motion } from 'framer-motion';
import type { Committee } from '../../data/comun';

// ─── Category accent map — maroon/gold theming only ──────────────────────
const categoryMeta: Record<Committee['category'], { label: string; dot: string }> = {
  General:  { label: 'General Assembly', dot: 'bg-comun-gold' },
  Security: { label: 'Security Council', dot: 'bg-comun-maroon-light' },
  Crisis:   { label: 'Crisis Simulation', dot: 'bg-orange-400' },
  Special:  { label: 'Special Committee', dot: 'bg-comun-gold/60' },
};

// ─── Committee Card ───────────────────────────────────────────────────────
interface CommitteeCardProps {
  committee: Committee;
  index: number;
  onClick: () => void;
}

export const CommitteeCard: React.FC<CommitteeCardProps> = ({ committee, index, onClick }) => {
  const meta = categoryMeta[committee.category];

  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, delay: 0.07 * (index % 3), ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6 }}
      whileTap={{ scale: 0.98 }}
      className="group relative w-full text-left cursor-pointer focus:outline-none"
    >
      {/* Card body */}
      <div
        className="relative overflow-hidden rounded-sm border border-comun-gold/15 group-hover:border-comun-gold/55 transition-colors duration-400 h-full"
        style={{
          background: 'linear-gradient(135deg, rgba(28,16,52,0.95) 0%, rgba(36,18,44,0.90) 100%)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 0 0 0 rgba(255,208,0,0)',
          transition: 'border-color 0.4s ease, box-shadow 0.4s ease',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 40px rgba(255,208,0,0.13), inset 0 1px 0 rgba(255,208,0,0.08)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 0 0 rgba(255,208,0,0)';
        }}
      >
        {/* Top gold bar — expands on hover */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-comun-maroon/60 via-comun-gold/80 to-comun-maroon/60 opacity-0 group-hover:opacity-100 transition-opacity duration-400" />

        {/* Ambient inner glow */}
        <div className="absolute top-0 right-0 w-28 h-28 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ background: 'radial-gradient(circle, rgba(255,208,0,0.06) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }}
        />

        {/* Corner bracket TL */}
        <div className="absolute top-3 left-3 w-5 h-5 border-t border-l border-comun-gold/30 group-hover:border-comun-gold/70 transition-colors duration-400" />
        {/* Corner bracket BR */}
        <div className="absolute bottom-3 right-3 w-5 h-5 border-b border-r border-comun-gold/30 group-hover:border-comun-gold/70 transition-colors duration-400" />

        {/* Main content */}
        <div className="relative px-6 py-6 flex flex-col gap-3 h-full min-h-[148px]">

          {/* Category pill */}
          <div className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${meta.dot}`} />
            <span className="font-sans text-[10px] text-comun-muted/90 tracking-[0.18em] uppercase">
              {meta.label}
            </span>
          </div>

          {/* Committee code — large serif */}
          <h3 className="font-serif-display text-[2.1rem] leading-none font-semibold text-comun-white group-hover:text-comun-gold transition-colors duration-350">
            {committee.name}
          </h3>

          {/* Full name */}
          <p className="font-sans text-xs text-comun-muted/90 leading-snug flex-1">
            {committee.fullName}
          </p>

          {/* Footer row */}
          <div className="flex items-center justify-between mt-1">
            {committee.format && (
              <span className="font-sans text-[10px] text-comun-gold/50 uppercase tracking-widest border border-comun-gold/15 px-2 py-0.5 rounded-sm">
                {committee.format}
              </span>
            )}
            <span className="font-sans text-[10px] text-comun-muted/40 group-hover:text-comun-gold/60 uppercase tracking-widest transition-colors duration-300 ml-auto">
              View Details →
            </span>
          </div>
        </div>
      </div>
    </motion.button>
  );
};
