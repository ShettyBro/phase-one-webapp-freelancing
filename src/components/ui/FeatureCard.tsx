import React from 'react';
import { motion } from 'framer-motion';

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  index: number;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-60px' }}
    transition={{ duration: 0.6, delay: 0.08 * (index % 3), ease: [0.22, 1, 0.36, 1] }}
    whileHover={{ y: -4, scale: 1.02, transition: { duration: 0.2 } }}
    className="group relative glass gold-border gold-border-hover p-6 flex flex-col gap-4 overflow-hidden"
  >
    {/* Hover shimmer */}
    <div className="absolute inset-0 bg-gradient-to-br from-comun-gold/0 to-comun-gold/0 group-hover:from-comun-gold/5 group-hover:to-transparent transition-all duration-500" />

    {/* Icon */}
    <div className="relative w-12 h-12 flex items-center justify-center border border-comun-gold/20 group-hover:border-comun-gold/40 transition-colors duration-300">
      <span className="text-2xl">{icon}</span>
      <div className="absolute inset-0 bg-comun-gold/0 group-hover:bg-comun-gold/5 transition-colors duration-300" />
    </div>

    {/* Text */}
    <div className="relative flex flex-col gap-2">
      <h3 className="font-sans font-semibold text-base text-comun-white group-hover:text-comun-gold transition-colors duration-300">
        {title}
      </h3>
      <p className="font-sans text-sm text-comun-muted leading-relaxed">
        {description}
      </p>
    </div>
  </motion.div>
);
