import React from 'react';
import { motion } from 'framer-motion';
import { COMMITTEES } from '../../data/comun';
import { SectionContainer, SectionHeader } from '../ui/SectionContainer';
import { CommitteeCard } from '../ui/CommitteeCard';

const CommitteesSection: React.FC = () => (
  <SectionContainer
    id="committees"
    className="bg-gradient-to-b from-comun-black to-comun-charcoal/50 relative"
  >
    {/* Ambient */}
    <div className="ambient-orb w-[400px] h-[300px] bg-comun-gold/4 bottom-0 right-0 translate-x-1/4" />

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

      {/* Committee Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5">
        {COMMITTEES.slice(0, 4).map((c, i) => (
          <CommitteeCard key={c.code} committee={c} index={i} />
        ))}

        {/* UNSC spans 2 on large — keep grid clean */}
        {/* Bottom row: last 3 */}
        {COMMITTEES.slice(4).map((c, i) => (
          <CommitteeCard key={c.code} committee={c} index={i + 4} />
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
        Committee study guides & background papers coming soon
      </motion.p>
    </div>
  </SectionContainer>
);

export default CommitteesSection;
