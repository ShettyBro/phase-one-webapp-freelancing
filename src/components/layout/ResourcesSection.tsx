import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, ExternalLink, Loader2 } from 'lucide-react';
import { SectionContainer, SectionHeader } from '../ui/SectionContainer';
import { smoothScrollTo } from '../../utils/scroll';
import api from '../../utils/api';

// ─── Types ────────────────────────────────────────────────────────────────
interface PublicResource {
  id: string;
  title: string;
  description: string | null;
  fileName: string | null;
  url: string | null;
}
interface PublicCategory {
  id: string;
  name: string;
  resources: PublicResource[];
}

// ─── Permanent UNO link card (always shown) ───────────────────────────────
const UnoLinkCard: React.FC<{ index: number }> = ({ index }) => (
  <motion.a
    href="https://digitallibrary.un.org"
    target="_blank"
    rel="noopener noreferrer"
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-60px' }}
    transition={{ duration: 0.6, delay: 0.07 * (index % 3), ease: [0.22, 1, 0.36, 1] }}
    whileHover={{ y: -4 }}
    className="group relative overflow-hidden flex flex-col gap-4 p-6 border border-comun-gold/20 hover:border-comun-gold/50 bg-comun-gold/5 hover:bg-comun-gold/8 rounded-md transition-all duration-300 cursor-pointer"
    style={{ backdropFilter: 'blur(8px)' }}
  >
    <div className="absolute inset-0 bg-comun-gold/0 group-hover:bg-comun-gold/4 transition-colors duration-300 pointer-events-none rounded-md" />
    <div className="relative flex items-start justify-between gap-3">
      <span className="text-3xl">🌐</span>
      <span className="font-sans text-[10px] font-bold tracking-[0.15em] uppercase px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-sm">
        Available
      </span>
    </div>
    <div className="relative flex flex-col gap-2 flex-1">
      <h3 className="font-sans font-semibold text-base text-comun-white group-hover:text-comun-gold transition-colors duration-300">
        UN Digital Library
      </h3>
      <p className="font-sans text-sm text-comun-muted leading-relaxed">
        Access official UN documentation, resolutions, and reports directly from the United Nations Digital Library and Dag Hammarskjöld Library.
      </p>
      <div className="flex items-center gap-1.5 mt-auto pt-2">
        <span className="font-sans text-[10px] text-comun-gold/60 border border-comun-gold/15 px-2 py-0.5 rounded-sm">External Link</span>
      </div>
    </div>
    <div className="relative flex items-center gap-2 pt-1">
      <ExternalLink className="w-3.5 h-3.5 text-comun-gold/60 group-hover:text-comun-gold transition-colors" />
      <span className="font-sans text-xs font-medium text-comun-gold/70 group-hover:text-comun-gold tracking-widest uppercase transition-colors">
        Open Portal
      </span>
    </div>
  </motion.a>
);

// ─── Permanent Delegate Matrix card (always shown) ────────────────────────
const DelegateMatrixCard: React.FC<{ index: number }> = ({ index }) => (
  <motion.a
    href="https://docs.google.com/spreadsheets/d/1ZRD-0pNNnbINPATENWJVl-J8bwMDZXFQIc3rZrQ4fis/edit?usp=sharing"
    target="_blank"
    rel="noopener noreferrer"
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-60px' }}
    transition={{ duration: 0.6, delay: 0.07 * (index % 3), ease: [0.22, 1, 0.36, 1] }}
    whileHover={{ y: -4 }}
    className="group relative overflow-hidden flex flex-col gap-4 p-6 border border-comun-gold/20 hover:border-comun-gold/50 bg-comun-gold/5 hover:bg-comun-gold/8 rounded-md transition-all duration-300 cursor-pointer"
    style={{ backdropFilter: 'blur(8px)' }}
  >
    <div className="absolute inset-0 bg-comun-gold/0 group-hover:bg-comun-gold/4 transition-colors duration-300 pointer-events-none rounded-md" />
    <div className="relative flex items-start justify-between gap-3">
      <span className="text-3xl">📊</span>
      <span className="font-sans text-[10px] font-bold tracking-[0.15em] uppercase px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-sm">
        Available
      </span>
    </div>
    <div className="relative flex flex-col gap-2 flex-1">
      <h3 className="font-sans font-semibold text-base text-comun-white group-hover:text-comun-gold transition-colors duration-300">
        CoMUN Delegate Matrix
      </h3>
      <p className="font-sans text-sm text-comun-muted leading-relaxed">
        Official committee–country allocation matrix for CoMUN 2026. View which countries and portfolios are available across all committees.
      </p>
      <div className="flex items-center gap-1.5 mt-auto pt-2">
        <span className="font-sans text-[10px] text-comun-gold/60 border border-comun-gold/15 px-2 py-0.5 rounded-sm">Google Sheets</span>
      </div>
    </div>
    <div className="relative flex items-center gap-2 pt-1">
      <ExternalLink className="w-3.5 h-3.5 text-comun-gold/60 group-hover:text-comun-gold transition-colors" />
      <span className="font-sans text-xs font-medium text-comun-gold/70 group-hover:text-comun-gold tracking-widest uppercase transition-colors">
        View Matrix
      </span>
    </div>
  </motion.a>
);


// ─── Dynamic CMS resource card ────────────────────────────────────────────
const DynamicResourceCard: React.FC<{ resource: PublicResource; index: number }> = ({ resource, index }) => (
  <motion.a
    href={resource.url || '#'}
    target="_blank"
    rel="noopener noreferrer"
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-60px' }}
    transition={{ duration: 0.6, delay: 0.07 * (index % 3), ease: [0.22, 1, 0.36, 1] }}
    whileHover={{ y: -4 }}
    className="group relative overflow-hidden flex flex-col gap-4 p-6 border border-comun-gold/20 hover:border-comun-gold/45 bg-comun-gold/5 rounded-md transition-all duration-300"
    style={{ backdropFilter: 'blur(8px)' }}
  >
    <div className="flex items-start justify-between gap-3">
      <span className="text-3xl">📄</span>
      <Download className="w-4 h-4 text-comun-gold/70 group-hover:text-comun-gold transition-colors" />
    </div>
    <h3 className="font-sans font-semibold text-base text-comun-white group-hover:text-comun-gold transition-colors">
      {resource.title}
    </h3>
    {resource.description && (
      <p className="font-sans text-sm text-comun-muted leading-relaxed">{resource.description}</p>
    )}
    <span className="font-sans text-[11px] text-comun-gold/60 tracking-wider mt-auto pt-1 uppercase">
      {resource.fileName ? 'Download' : 'Open Link'}
    </span>
  </motion.a>
);

// ─── Resources Section ────────────────────────────────────────────────────
const ResourcesSection: React.FC = () => {
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/resources-public')
      .then(({ data }) => setCategories(data.categories || []))
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, []);

  // All CMS resources that are published and have a URL
  const publishedCategories = categories.filter((c) => c.resources.length > 0);
  const hasPublished = publishedCategories.length > 0;

  return (
    <SectionContainer
      id="resources"
      className="bg-gradient-to-b from-comun-charcoal/40 to-comun-black relative"
    >
      {/* Ambient glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '20%', right: 0,
          width: '400px', height: '400px',
          background: 'radial-gradient(ellipse at center, rgba(255,208,0,0.05) 0%, transparent 70%)',
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
          subtitle={
            hasPublished
              ? 'Official conference materials published by the Secretariat. Download and study ahead of CoMUN 2026.'
              : 'All official conference materials — background guides, templates, rules of procedure, and study resources — will be published here ahead of CoMUN 2026.'
          }
        />

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-comun-gold/50 animate-spin" />
          </div>
        )}

        {/* Content once loaded */}
        {!loading && (
          <>
            {hasPublished ? (
              /* ── Dynamic CMS sections + permanent UNO link at end ── */
              <div className="flex flex-col gap-10">
                {publishedCategories.map((cat) => (
                  <div key={cat.id}>
                    <h3 className="font-serif-display text-xl text-comun-gold mb-4">{cat.name}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {cat.resources.map((r, i) => (
                        <DynamicResourceCard key={r.id} resource={r} index={i} />
                      ))}
                    </div>
                  </div>
                ))}

                {/* Always-present UNO link */}
                <div>
                  <h3 className="font-serif-display text-xl text-comun-gold mb-4">External Links</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    <UnoLinkCard index={0} />
                    <DelegateMatrixCard index={1} />
                  </div>
                </div>
              </div>
            ) : (
              /* ── No CMS resources yet — show only the UNO link ── */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <UnoLinkCard index={0} />
                <DelegateMatrixCard index={1} />
              </div>
            )}

            {/* Notification banner — only shown when nothing is published yet */}
            {!hasPublished && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="mt-12 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-md"
                style={{
                  background: 'rgba(255,208,0,0.05)',
                  border: '1px solid rgba(255,208,0,0.15)',
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">🔔</span>
                  <p className="font-sans text-sm text-comun-muted text-center sm:text-left">
                    Resources will be released{' '}
                    <span className="text-comun-gold">4 weeks before the conference.</span>{' '}
                    Check back here or follow our official channels.
                  </p>
                </div>
                <button
                  onClick={() => smoothScrollTo('#contact')}
                  className="btn-secondary text-xs px-5 py-2.5 flex-shrink-0"
                >
                  Get Notified
                </button>
              </motion.div>
            )}
          </>
        )}
      </div>
    </SectionContainer>
  );
};

export default ResourcesSection;
