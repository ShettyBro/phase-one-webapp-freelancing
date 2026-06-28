import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';

interface AccordionItemProps {
  question: string;
  answer: string;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}

export const AccordionItem: React.FC<AccordionItemProps> = ({
  question,
  answer,
  index,
  isOpen,
  onToggle,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-40px' }}
    transition={{ duration: 0.5, delay: 0.07 * index, ease: [0.22, 1, 0.36, 1] }}
    className={`
      border-b border-comun-gold/10 transition-colors duration-300
      ${isOpen ? 'border-comun-gold/20' : ''}
    `}
  >
    <button
      onClick={onToggle}
      className="w-full flex items-start justify-between gap-4 py-5 text-left group"
      aria-expanded={isOpen}
    >
      <div className="flex items-start gap-4">
        <span className="font-sans text-xs text-comun-gold/50 font-semibold tracking-widest uppercase mt-0.5 flex-shrink-0 w-6">
          {String(index + 1).padStart(2, '0')}
        </span>
        <span
          className={`
            font-sans text-sm md:text-base font-medium leading-relaxed transition-colors duration-200
            ${isOpen ? 'text-comun-gold' : 'text-comun-white/80 group-hover:text-comun-white'}
          `}
        >
          {question}
        </span>
      </div>
      <span className="flex-shrink-0 mt-0.5">
        {isOpen
          ? <Minus className="w-4 h-4 text-comun-gold" />
          : <Plus  className="w-4 h-4 text-comun-muted group-hover:text-comun-gold transition-colors" />
        }
      </span>
    </button>

    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          key="content"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden"
        >
          <div className="pb-6 pl-10 pr-8">
            <p className="font-sans text-sm md:text-base text-comun-muted leading-relaxed">
              {answer}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
);

// ─── FAQ Accordion Component ──────────────────────────────────────────────
interface FAQAccordionProps {
  items: readonly { question: string; answer: string }[];
}

export const FAQAccordion: React.FC<FAQAccordionProps> = ({ items }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (i: number) => setOpenIndex(prev => (prev === i ? null : i));

  return (
    <div className="divide-comun-gold/10">
      {items.map((item, i) => (
        <AccordionItem
          key={item.question}
          question={item.question}
          answer={item.answer}
          index={i}
          isOpen={openIndex === i}
          onToggle={() => toggle(i)}
        />
      ))}
    </div>
  );
};
