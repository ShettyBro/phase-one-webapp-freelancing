import React from 'react';
import { motion } from 'framer-motion';
import { STATS } from '../../data/comun';
import { SectionContainer, SectionHeader } from '../ui/SectionContainer';

// ─── Stat Card ────────────────────────────────────────────────────────────
interface StatCardProps {
  value: string;
  label: string;
  index: number;
}

const StatCard: React.FC<StatCardProps> = ({ value, label, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-60px' }}
    transition={{ duration: 0.6, delay: 0.1 * index, ease: [0.22, 1, 0.36, 1] }}
    className="glass gold-border gold-border-hover flex flex-col items-center justify-center py-8 px-6 text-center"
  >
    <span className="font-serif-display text-5xl md:text-6xl font-semibold text-gold-gradient leading-none mb-2">
      {value}
    </span>
    <span className="font-sans text-xs font-medium tracking-[0.2em] uppercase text-comun-muted mt-1">
      {label}
    </span>
  </motion.div>
);

// ─── About Section ────────────────────────────────────────────────────────
const AboutSection: React.FC = () => (
  <SectionContainer
    id="about"
    className="bg-gradient-to-b from-comun-black via-comun-navy/20 to-comun-black relative"
  >
    {/* Ambient glow */}
    <div className="ambient-orb w-[500px] h-[500px] bg-comun-navy/40 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

    <div className="relative z-10">
      <SectionHeader
        eyebrow="About CoMUN"
        title={
          <>
            A New Tradition of{' '}
            <span className="text-gold-gradient">Diplomacy</span>
          </>
        }
        subtitle="CoMUN 2026 — Cottons Model United Nations — is the inaugural edition of a premier diplomatic simulation conference. Held at Cottons Campus, CoMUN brings together the next generation of global leaders to debate, negotiate, and craft resolutions that mirror real-world United Nations proceedings."
      />

      {/* Body Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 items-center mb-20">

        {/* Text Column */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-6"
        >
          <p className="font-sans text-base md:text-lg text-comun-muted leading-relaxed">
            Born from a vision to cultivate leadership, critical thinking, and cross-cultural dialogue,
            CoMUN creates a space where students step into the shoes of diplomats and world leaders.
          </p>
          <p className="font-sans text-base text-comun-muted leading-relaxed">
            Over three immersive days, delegates will engage in structured parliamentary debate across
            seven specialized committees — from global security and drug policy to crisis simulations and
            international press.
          </p>

          {/* Quote block */}
          <blockquote className="border-l-2 border-comun-gold/50 pl-6 mt-2">
            <p className="font-serif-display text-xl md:text-2xl italic text-comun-white/90 leading-relaxed">
              "The United Nations is our one great hope for a peaceful and free world."
            </p>
            <footer className="font-sans text-xs text-comun-gold/60 tracking-widest uppercase mt-3">
              — Ralph Bunche
            </footer>
          </blockquote>
        </motion.div>

        {/* Visual Column */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className="flex flex-col gap-5"
        >
          {/* Mission Cards */}
          {[
            {
              icon: '🎯',
              title: 'Our Mission',
              desc: 'To provide an authentic, high-quality Model UN experience that challenges and inspires every delegate.',
            },
            {
              icon: '🌍',
              title: 'Our Vision',
              desc: 'To build a community of informed, empathetic, and globally-minded leaders at Cottons and beyond.',
            },
            {
              icon: '⚖️',
              title: 'Our Values',
              desc: 'Integrity, collaboration, excellence, and a deep respect for the principles of the United Nations charter.',
            },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 * i, duration: 0.5 }}
              className="glass-navy gold-border gold-border-hover p-5 flex gap-4"
            >
              <span className="text-2xl flex-shrink-0 mt-0.5">{item.icon}</span>
              <div>
                <h3 className="font-sans font-semibold text-sm text-comun-white mb-1">{item.title}</h3>
                <p className="font-sans text-sm text-comun-muted leading-relaxed">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Statistics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STATS.map((stat, i) => (
          <StatCard key={stat.label} value={stat.value} label={stat.label} index={i} />
        ))}
      </div>
    </div>
  </SectionContainer>
);

export default AboutSection;
