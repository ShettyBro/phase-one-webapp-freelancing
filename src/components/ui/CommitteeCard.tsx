import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import type { Committee } from '../../data/comun';

// ─── Format badge colours ─────────────────────────────────────────────────
const categoryAccent: Record<Committee['category'], string> = {
  General:  'text-blue-300',
  Security: 'text-red-300',
  Crisis:   'text-orange-300',
  Special:  'text-purple-300',
};

// ─── Committee Card ───────────────────────────────────────────────────────
interface CommitteeCardProps {
  committee: Committee;
  index: number;
  onClick: () => void;
}

export const CommitteeCard: React.FC<CommitteeCardProps> = ({ committee, index, onClick }) => (
  <motion.button
    type="button"
    onClick={onClick}
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-60px' }}
    transition={{
      duration: 0.55,
      delay: 0.06 * (index % 4),
      ease: [0.22, 1, 0.36, 1],
    }}
    whileHover={{ y: -4, scale: 1.01 }}
    whileTap={{ scale: 0.98 }}
    className="group relative w-full text-left overflow-hidden rounded-md cursor-pointer
      border border-white/8 hover:border-comun-gold/50
      hover:shadow-[0_0_28px_rgba(255,208,0,0.12)]
      transition-all duration-300"
    style={{ backdropFilter: 'blur(10px)', background: 'rgba(255,255,255,0.03)' }}
  >
    {/* Gold top accent line */}
    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-comun-gold/0 to-transparent group-hover:via-comun-gold/60 transition-all duration-500" />

    {/* Background gradient based on committee colour */}
    <div className={`absolute inset-0 bg-gradient-to-br ${committee.color} opacity-60`} />

    {/* Content */}
    <div className="relative flex items-center gap-4 px-5 py-4">
      {/* Code block */}
      <div className="flex-shrink-0">
        <span className="font-serif-display text-2xl font-semibold text-comun-white group-hover:text-comun-gold transition-colors duration-300 leading-none">
          {committee.name}
        </span>
      </div>

      {/* Divider */}
      <div className="w-px h-8 bg-white/10 flex-shrink-0" />

      {/* Full name + format */}
      <div className="flex-1 min-w-0">
        <p className="font-sans text-sm font-medium text-comun-white/90 leading-snug truncate">
          {committee.fullName}
        </p>
        {committee.format && (
          <p className={`font-sans text-[11px] mt-0.5 ${categoryAccent[committee.category]} opacity-70 tracking-wide`}>
            {committee.format}
          </p>
        )}
      </div>

      {/* Arrow CTA */}
      <ChevronRight
        className="w-4 h-4 text-comun-gold/0 group-hover:text-comun-gold/80 flex-shrink-0 transition-all duration-300 group-hover:translate-x-0.5"
      />
    </div>
  </motion.button>
);
