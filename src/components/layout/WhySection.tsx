import React from 'react';
import { FEATURES } from '../../data/comun';
import { SectionContainer, SectionHeader } from '../ui/SectionContainer';
import { FeatureCard } from '../ui/FeatureCard';
import { DoveAccent } from '../ui/DoveAccent';

const WhySection: React.FC = () => (
  <SectionContainer
    id="why"
    className="bg-gradient-to-b from-comun-charcoal/50 to-comun-black"
    decor={<DoveAccent position="right" opacity={0.045} />}
  >
    <div className="relative z-10">
      <SectionHeader
        eyebrow="Why Participate"
        title={
          <>
            More Than a Conference.{' '}
            <span className="text-gold-gradient">A Defining Experience.</span>
          </>
        }
        subtitle="CoMUN is an investment in yourself. Every session, every resolution, every negotiation sharpens the skills that matter most in a complex world."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {FEATURES.map((feature, i) => (
          <FeatureCard
            key={feature.title}
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
            index={i}
          />
        ))}
      </div>
    </div>
  </SectionContainer>
);

export default WhySection;
