import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { REGISTRATION_TYPES } from '../../data/comun';
import { SectionContainer, SectionHeader } from '../ui/SectionContainer';
import { DoveAccent } from '../ui/DoveAccent';
import { useRegistration } from '../../context/RegistrationContext';

// ─── Registration Card ────────────────────────────────────────────────────
interface RegCardProps {
  data: typeof REGISTRATION_TYPES[number];
  index: number;
}

const RegistrationCard: React.FC<RegCardProps> = ({ data, index }) => {
  const { isOpen, requireOpen } = useRegistration();
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.65, delay: 0.15 * index, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6, scale: 1.015, transition: { duration: 0.25 } }}
      className="group relative flex flex-col overflow-hidden
        border border-comun-gold/20
        bg-gradient-to-br from-comun-gold/8 to-comun-gold-dark/3
        hover:border-comun-gold/50
        transition-all duration-300"
      style={{ backdropFilter: 'blur(12px)' }}
    >
      {/* Top accent bar — always present, brightens on hover */}
      <div className="absolute top-0 left-0 right-0 h-0.5
        bg-gradient-to-r from-comun-gold-dark via-comun-gold to-comun-gold-dark
        opacity-50 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Hover glow overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ boxShadow: 'inset 0 0 50px rgba(255,208,0,0.05), 0 0 40px rgba(255,208,0,0.1)' }}
      />

      {/* Corner ornament */}
      <div className="absolute top-4 right-4 w-8 h-8 border-t border-r border-comun-gold/25
        group-hover:border-comun-gold/60 transition-colors duration-300" />

      <div className="relative p-7 flex flex-col gap-5 h-full">

        {/* Icon */}
        <span className="text-4xl">{data.icon}</span>

        {/* Title + description */}
        <div>
          <h3 className="font-serif-display text-2xl font-semibold text-comun-white mb-2
            group-hover:text-gold-gradient transition-all duration-300">
            {data.title}
          </h3>
          <p className="font-sans text-sm text-comun-muted leading-relaxed">
            {data.description}
          </p>
        </div>

        {/* Highlights */}
        <ul className="flex flex-col gap-2.5 flex-1">
          {data.highlights.map(h => (
            <li key={h} className="flex items-center gap-3 font-sans text-sm text-comun-muted/90">
              <span className="w-4 h-px bg-comun-gold/60 flex-shrink-0" />
              {h}
            </li>
          ))}
        </ul>

        {/* CTA */}
        <div className="mt-4 pt-4 border-t border-comun-gold/15 group-hover:border-comun-gold/30 transition-colors duration-300">
          <button
            className="btn-primary w-full text-sm py-3 inline-flex items-center justify-center gap-2"
            onClick={() => requireOpen(() => navigate(
              data.type === 'Individual' ? '/register?flow=individual' : '/register?flow=institutional'
            ))}
          >
            {isOpen ? data.cta : 'Registrations Closed'}
            {isOpen && <ChevronRight className="w-4 h-4" />}
          </button>
          <p className="text-center font-sans text-xs text-comun-muted/50 mt-3">
            {isOpen ? 'Secure your place at CoMUN 2026' : 'Registrations are currently closed'}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Registration Section ─────────────────────────────────────────────────
const RegistrationSection: React.FC = () => (
  <SectionContainer
    id="registration"
    className="bg-gradient-to-b from-comun-black to-comun-charcoal/50"
    decor={<DoveAccent position="left" opacity={0.04} flip />}
  >
    <div className="relative z-10">
      <SectionHeader
        eyebrow="Registration"
        title={
          <>
            Secure Your Seat at the{' '}
            <span className="text-gold-gradient">Table</span>
          </>
        }
        subtitle="Join CoMUN 2026 as an individual delegate or register your institution's delegation."
      />

      {/* 2-column equal grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {REGISTRATION_TYPES.map((type, i) => (
          <RegistrationCard key={type.type} data={type} index={i} />
        ))}
      </div>

      {/* Notice */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="mt-10 p-5 glass gold-border text-center max-w-2xl mx-auto"
      >
        <p className="font-sans text-sm text-comun-muted">
          Registration details, fees, and committee allocations will be announced soon.{' '}
          <span className="text-comun-gold">Follow our official channels for updates.</span>
        </p>
      </motion.div>
    </div>
  </SectionContainer>
);

export default RegistrationSection;
