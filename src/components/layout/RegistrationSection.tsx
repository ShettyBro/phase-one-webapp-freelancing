import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
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
  const isFeatured = 'featured' in data && data.featured === true;
  const { isOpen, requireOpen } = useRegistration();
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.65, delay: 0.12 * index, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6, scale: 1.015, transition: { duration: 0.25 } }}
      className={`
        relative group flex flex-col overflow-hidden
        ${isFeatured
          ? 'border border-comun-gold/40 shadow-gold'
          : 'border border-comun-gold/10 hover:border-comun-gold/25'
        }
        bg-gradient-to-br ${data.accent}
        transition-all duration-300
      `}
      style={{ backdropFilter: 'blur(10px)' }}
    >
      {/* Featured top bar — maroon→gold→maroon brand accent */}
      {isFeatured && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-comun-maroon via-comun-gold to-comun-maroon" />
      )}

      {/* Corner ornament */}
      <div className="absolute top-4 right-4 w-8 h-8 border-t border-r border-comun-gold/20 group-hover:border-comun-gold/50 transition-colors duration-300" />

      <div className="relative p-7 flex flex-col gap-5 h-full">
        {/* Icon + Badge */}
        <div className="flex items-start justify-between">
          <span className="text-4xl">{data.icon}</span>
          <span
            className={`
              font-sans text-[10px] font-bold tracking-[0.2em] uppercase px-3 py-1
              ${isFeatured
                ? 'bg-comun-gold/20 text-comun-gold border border-comun-gold/30'
                : 'bg-white/5 text-comun-muted border border-white/10'
              }
            `}
          >
            {data.badge}
          </span>
        </div>

        {/* Title */}
        <div>
          <h3 className="font-serif-display text-2xl font-semibold text-comun-white mb-2 group-hover:text-gold-gradient transition-all duration-300">
            {data.title}
          </h3>
          <p className="font-sans text-sm text-comun-muted leading-relaxed">
            {data.description}
          </p>
        </div>

        {/* Highlights */}
        <ul className="flex flex-col gap-2 flex-1">
          {data.highlights.map(h => (
            <li key={h} className="flex items-center gap-3 font-sans text-sm text-comun-muted/90">
              <span className="w-4 h-px bg-comun-gold/50 flex-shrink-0" />
              {h}
            </li>
          ))}
        </ul>

        {/* CTA */}
        <div className="mt-4 pt-4 border-t border-comun-gold/10">
          <button
            className={isFeatured ? 'btn-primary w-full text-sm py-3' : 'btn-secondary w-full text-sm py-3'}
            onClick={() => requireOpen(() => navigate('/register'))}
          >
            {isOpen ? data.cta : 'Registrations Closed'}
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
        subtitle="Join CoMUN 2026 as a delegate, institutional team, or special committee participant. Registration opens soon."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
