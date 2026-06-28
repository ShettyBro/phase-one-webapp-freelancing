import React from 'react';
import { motion } from 'framer-motion';
import { SectionContainer, SectionHeader } from '../ui/SectionContainer';

// ─── Resource types ───────────────────────────────────────────────────────
const RESOURCES = [
  {
    icon: '📄',
    title: 'Background Guides',
    status: 'coming-soon',
    description:
      'Official study guides prepared by the Secretariat for each committee. Covers agenda topics, country positions, and key documents.',
    tags: ['DISEC', 'UNODC', 'SPECPOL', 'UNSC', 'CCC', 'IPC-J', 'IPC-P'],
  },
  {
    icon: '📝',
    title: 'Position Paper Template',
    status: 'coming-soon',
    description:
      'Standardised position paper format for all CoMUN 2026 committees. Includes formatting guidelines and submission instructions.',
    tags: ['All Committees'],
  },
  {
    icon: '⚖️',
    title: 'Rules of Procedure',
    status: 'coming-soon',
    description:
      'The formal rules governing debate, motions, voting, and decorum across all CoMUN 2026 committees.',
    tags: ['General', 'Security Council', 'Crisis', 'Press Corps'],
  },
  {
    icon: '🎓',
    title: 'Delegate Handbook',
    status: 'coming-soon',
    description:
      'A comprehensive guide for first-time and experienced delegates covering conference etiquette, speech-writing, and negotiation strategy.',
    tags: ['Beginner', 'Intermediate', 'Advanced'],
  },
  {
    icon: '🌐',
    title: 'UN Research Portal',
    status: 'available',
    description:
      'Access official UN documentation, resolutions, and reports directly from the United Nations Digital Library and UN Dag Hammarskjöld Library.',
    tags: ['External Link'],
    href: 'https://digitallibrary.un.org',
  },
  {
    icon: '📋',
    title: 'Resolution Draft Template',
    status: 'coming-soon',
    description:
      'Pre-formatted working paper and draft resolution templates conforming to UN parliamentary standards used in CoMUN debate.',
    tags: ['All Committees'],
  },
] as const;

// ─── Status Badge ─────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  if (status === 'available') {
    return (
      <span className="font-sans text-[10px] font-bold tracking-[0.15em] uppercase px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        Available
      </span>
    );
  }
  return (
    <span className="font-sans text-[10px] font-bold tracking-[0.15em] uppercase px-2.5 py-1 bg-comun-gold/10 text-comun-gold/70 border border-comun-gold/20">
      Coming Soon
    </span>
  );
};

// ─── Resource Card ────────────────────────────────────────────────────────
interface ResourceCardProps {
  resource: typeof RESOURCES[number];
  index: number;
}

const ResourceCard: React.FC<ResourceCardProps> = ({ resource, index }) => {
  const isAvailable = resource.status === 'available';
  const hasHref     = 'href' in resource;

  const CardWrapper = ({ children }: { children: React.ReactNode }) =>
    hasHref && isAvailable ? (
      <a
        href={(resource as typeof resource & { href: string }).href}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        {children}
      </a>
    ) : (
      <div>{children}</div>
    );

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay: 0.07 * (index % 3), ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`
        group relative overflow-hidden flex flex-col gap-4
        border transition-all duration-300
        ${isAvailable
          ? 'border-comun-gold/20 hover:border-comun-gold/45 bg-comun-gold/5 cursor-pointer'
          : 'border-white/5 hover:border-white/10 bg-white/[0.02] cursor-default'
        }
      `}
      style={{ backdropFilter: 'blur(8px)' }}
    >
      {/* Available hover glow */}
      {isAvailable && (
        <div className="absolute inset-0 bg-comun-gold/0 group-hover:bg-comun-gold/4 transition-colors duration-300 pointer-events-none" />
      )}

      <CardWrapper>
        <div className="relative p-6 flex flex-col gap-4">
          {/* Icon + Status */}
          <div className="flex items-start justify-between gap-3">
            <span className={`text-3xl ${!isAvailable ? 'opacity-50 grayscale' : ''}`}>
              {resource.icon}
            </span>
            <StatusBadge status={resource.status} />
          </div>

          {/* Title */}
          <h3
            className={`font-sans font-semibold text-base transition-colors duration-300 ${
              isAvailable
                ? 'text-comun-white group-hover:text-comun-gold'
                : 'text-comun-white/50'
            }`}
          >
            {resource.title}
          </h3>

          {/* Description */}
          <p className={`font-sans text-sm leading-relaxed ${isAvailable ? 'text-comun-muted' : 'text-comun-muted/50'}`}>
            {resource.description}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mt-auto pt-1">
            {resource.tags.map(tag => (
              <span
                key={tag}
                className={`font-sans text-[10px] tracking-wider px-2 py-0.5 ${
                  isAvailable
                    ? 'text-comun-gold/60 border border-comun-gold/15'
                    : 'text-comun-muted/30 border border-white/5'
                }`}
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Available link arrow */}
          {isAvailable && (
            <div className="flex items-center gap-2 pt-1">
              <span className="font-sans text-xs font-medium text-comun-gold/70 group-hover:text-comun-gold tracking-widest uppercase transition-colors">
                Open Portal
              </span>
              <motion.span
                className="text-comun-gold/70 group-hover:text-comun-gold transition-colors"
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                →
              </motion.span>
            </div>
          )}
        </div>
      </CardWrapper>
    </motion.div>
  );
};

// ─── Resources Section ────────────────────────────────────────────────────
const ResourcesSection: React.FC = () => (
  <SectionContainer
    id="resources"
    className="bg-gradient-to-b from-comun-charcoal/40 to-comun-black relative"
  >
    <div
      className="absolute pointer-events-none"
      style={{
        top: '20%', right: 0,
        width: '400px', height: '400px',
        background: 'radial-gradient(ellipse at center, rgba(201,168,76,0.05) 0%, transparent 70%)',
        filter: 'blur(60px)',
      }}
    />

    <div className="relative z-10">
      <SectionHeader
        eyebrow="Resources"
        title={
          <>
            Prepare. Research.{' '}
            <span className="text-gold-gradient">Debate.</span>
          </>
        }
        subtitle="All official conference materials — background guides, templates, rules of procedure, and study resources — will be published here ahead of CoMUN 2026."
      />

      {/* Resource Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {RESOURCES.map((resource, i) => (
          <ResourceCard key={resource.title} resource={resource} index={i} />
        ))}
      </div>

      {/* Notification banner */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="mt-12 p-5 flex flex-col sm:flex-row items-center justify-between gap-4"
        style={{
          background: 'rgba(201,168,76,0.05)',
          border: '1px solid rgba(201,168,76,0.15)',
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">🔔</span>
          <p className="font-sans text-sm text-comun-muted text-center sm:text-left">
            Resources will be released <span className="text-comun-gold">4 weeks before the conference.</span> Check back here or follow our official channels.
          </p>
        </div>
        <button
          onClick={() => document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' })}
          className="btn-secondary text-xs px-5 py-2.5 flex-shrink-0"
        >
          Get Notified
        </button>
      </motion.div>
    </div>
  </SectionContainer>
);

export default ResourcesSection;
