import React from 'react';
import { FAQS } from '../../data/comun';
import { SectionContainer, SectionHeader } from '../ui/SectionContainer';
import { FAQAccordion } from '../ui/FAQAccordion';
import { motion } from 'framer-motion';

const FAQSection: React.FC = () => (
  <SectionContainer
    id="faq"
    className="bg-gradient-to-b from-comun-charcoal/40 to-comun-black relative"
    narrow
  >
    <div className="relative z-10">
      <SectionHeader
        eyebrow="FAQ"
        title={
          <>
            Frequently Asked{' '}
            <span className="text-gold-gradient">Questions</span>
          </>
        }
        subtitle="Everything you need to know about CoMUN 2026. More details will be added as the conference date approaches."
      />

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="glass gold-border p-6 md:p-8"
      >
        <FAQAccordion items={FAQS} />
      </motion.div>

      {/* Footer note */}
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="text-center font-sans text-xs text-comun-muted mt-8"
      >
        Have a question not listed here?{' '}
        <button
          onClick={() => document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' })}
          className="text-comun-gold hover:text-comun-gold-light transition-colors underline underline-offset-2"
        >
          Contact us
        </button>
      </motion.p>
    </div>
  </SectionContainer>
);

export default FAQSection;
