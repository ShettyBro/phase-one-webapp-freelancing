import React, { Suspense, lazy } from 'react';
import HeroSection from '../components/layout/HeroSection';
import { useSEO } from '../hooks/useSEO';

// Lazy-load below-the-fold sections for performance
const AboutSection        = lazy(() => import('../components/layout/AboutSection'));
const ThemeSection        = lazy(() => import('../components/layout/ThemeSection'));
const CommitteesSection   = lazy(() => import('../components/layout/CommitteesSection'));
const WhySection          = lazy(() => import('../components/layout/WhySection'));
const ResourcesSection    = lazy(() => import('../components/layout/ResourcesSection'));
const VideoSection        = lazy(() => import('../components/layout/VideoSection'));
const RegistrationSection = lazy(() => import('../components/layout/RegistrationSection'));
// FAQ is small and used in navbar — eager load so #faq is always in DOM
import FAQSection from '../components/layout/FAQSection';
const ContactSection      = lazy(() => import('../components/layout/ContactSection'));

/**
 * CoMUN 2026 Home Page
 * Hero loads immediately; all other sections are lazy-loaded.
 */
const HomePage: React.FC = () => {
  useSEO({
    title: 'CoMUN 2026 — Cottons Model United Nations',
    description: 'Peace Over Power. Join CoMUN 2026 — the premier Model United Nations experience. 30 July – 1 August 2026 at Cottons Campus.',
    url: '/',
  });

  return (
    <main>
      {/* Hero — always eagerly loaded (above the fold) */}
    <HeroSection />

    <Suspense fallback={<SectionSkeleton />}>
      <AboutSection />
    </Suspense>

    <Suspense fallback={<SectionSkeleton />}>
      <ThemeSection />
    </Suspense>

    <Suspense fallback={<SectionSkeleton />}>
      <CommitteesSection />
    </Suspense>

    <Suspense fallback={<SectionSkeleton />}>
      <WhySection />
    </Suspense>

    <Suspense fallback={<SectionSkeleton />}>
      <ResourcesSection />
    </Suspense>

    <Suspense fallback={<SectionSkeleton />}>
      <VideoSection />
    </Suspense>

    <Suspense fallback={<SectionSkeleton />}>
      <RegistrationSection />
    </Suspense>

    <FAQSection />

    <Suspense fallback={<SectionSkeleton />}>
      <ContactSection />
    </Suspense>
  </main>
  );
};

// Lightweight skeleton while section loads
const SectionSkeleton: React.FC = () => (
  <div className="py-24 flex items-center justify-center">
    <div className="w-6 h-6 border-2 border-comun-gold/30 border-t-comun-gold rounded-full animate-spin" />
  </div>
);

export default HomePage;
