import React from 'react';
import { motion } from 'framer-motion';
import type { Committee } from '../../data/comun';

// ─── Category Badge ───────────────────────────────────────────────────────
const categoryColors: Record<Committee['category'], string> = {
  General:  'bg-blue-500/10 text-blue-300 border-blue-500/20',
  Security: 'bg-red-500/10 text-red-300 border-red-500/20',
  Crisis:   'bg-orange-500/10 text-orange-300 border-orange-500/20',
  Special:  'bg-purple-500/10 text-purple-300 border-purple-500/20',
};

// ─── Committee Card ───────────────────────────────────────────────────────
interface CommitteeCardProps {
  committee: Committee;
  index: number;
}

export const CommitteeCard: React.FC<CommitteeCardProps> = ({ committee, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 28 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-60px' }}
    transition={{
      duration: 0.65,
      delay: 0.07 * (index % 4),
      ease: [0.22, 1, 0.36, 1],
    }}
    whileHover={{ y: -6, scale: 1.015, transition: { duration: 0.25, ease: 'easeOut' } }}
    className={`
      relative group cursor-pointer overflow-hidden
      bg-gradient-to-br ${committee.color}
      border border-comun-gold/10 hover:border-comun-gold/30
      transition-all duration-300
    `}
    style={{ backdropFilter: 'blur(8px)' }}
  >
    {/* Top gold accent line */}
    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-comun-gold/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

    {/* Corner decoration */}
    <div className="absolute top-3 right-3 w-6 h-6 border-t border-r border-comun-gold/20 group-hover:border-comun-gold/50 transition-colors duration-300" />
    <div className="absolute bottom-3 left-3 w-6 h-6 border-b border-l border-comun-gold/20 group-hover:border-comun-gold/50 transition-colors duration-300" />

    {/* Hover glow */}
    <div className="absolute inset-0 bg-comun-gold/0 group-hover:bg-comun-gold/3 transition-colors duration-400" />

    <div className="relative p-6 flex flex-col gap-4">
      {/* Code + Category */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-serif-display text-3xl md:text-4xl font-semibold text-comun-white group-hover:text-gold-gradient transition-all duration-300">
          {committee.name}
        </h3>
        <span
          className={`
            flex-shrink-0 font-sans text-[10px] font-semibold tracking-[0.18em] uppercase
            px-2.5 py-1 border ${categoryColors[committee.category]}
          `}
        >
          {committee.category}
        </span>
      </div>

      {/* Full name */}
      <p className="font-sans text-sm text-comun-muted/80 leading-relaxed group-hover:text-comun-muted transition-colors duration-300">
        {committee.fullName}
      </p>

      {/* CTA Arrow */}
      <div className="flex items-center gap-2 mt-auto pt-2">
        <span className="font-sans text-xs font-medium tracking-widest uppercase text-comun-gold/0 group-hover:text-comun-gold/80 transition-all duration-300">
          Learn More
        </span>
        <motion.span
          className="text-comun-gold/0 group-hover:text-comun-gold/80 transition-colors duration-300"
          animate={{ x: [0, 4, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          →
        </motion.span>
      </div>
    </div>
  </motion.div>
);
