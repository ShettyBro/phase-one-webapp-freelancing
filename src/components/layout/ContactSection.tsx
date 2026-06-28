import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, MapPin, Clock } from 'lucide-react';
import { SectionContainer, SectionHeader } from '../ui/SectionContainer';
import { CONFERENCE } from '../../data/comun';

const ContactSection: React.FC = () => {
  const [form, setForm]     = useState({ name: '', email: '', message: '' });
  const [sent, setSent]     = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Placeholder: will connect to backend API
    await new Promise(r => setTimeout(r, 1000));
    setSent(true);
    setLoading(false);
  };

  const INFO = [
    {
      icon: <Mail className="w-5 h-5" />,
      label: 'Email',
      value: 'comun2026@cottons.edu',
    },
    {
      icon: <MapPin className="w-5 h-5" />,
      label: 'Venue',
      value: 'Cottons Campus',
    },
    {
      icon: <Clock className="w-5 h-5" />,
      label: 'Conference Dates',
      value: CONFERENCE.dates,
    },
  ];

  return (
    <SectionContainer
      id="contact"
      className="bg-gradient-to-b from-comun-black to-comun-charcoal relative"
    >
      <div className="ambient-orb w-[400px] h-[300px] bg-comun-navy/40 bottom-0 right-0 translate-x-1/4" />

      <div className="relative z-10">
        <SectionHeader
          eyebrow="Contact"
          title={
            <>
              Get in{' '}
              <span className="text-gold-gradient">Touch</span>
            </>
          }
          subtitle="Reach out for registration inquiries, school delegations, press accreditation, or any other questions."
        />

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-2 flex flex-col gap-6"
          >
            <div className="flex flex-col gap-5">
              {INFO.map(item => (
                <div
                  key={item.label}
                  className="flex items-start gap-4 glass gold-border p-4"
                >
                  <div className="w-10 h-10 flex items-center justify-center border border-comun-gold/20 text-comun-gold flex-shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <p className="font-sans text-xs text-comun-gold/60 uppercase tracking-widest mb-1">
                      {item.label}
                    </p>
                    <p className="font-sans text-sm text-comun-white/80">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Social placeholder */}
            <div className="glass gold-border p-5 mt-2">
              <p className="font-sans text-xs text-comun-gold/60 uppercase tracking-widest mb-3">
                Follow CoMUN
              </p>
              <div className="flex gap-3">
                {['Instagram', 'LinkedIn', 'Twitter'].map(s => (
                  <span
                    key={s}
                    className="font-sans text-xs text-comun-muted border border-comun-gold/10 px-3 py-1.5 hover:border-comun-gold/30 hover:text-comun-gold transition-colors cursor-pointer"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            className="lg:col-span-3"
          >
            {sent ? (
              <div className="glass gold-border p-10 flex flex-col items-center justify-center text-center h-full min-h-[300px] gap-5">
                <span className="text-5xl">✉️</span>
                <h3 className="font-serif-display text-2xl text-comun-white">Message Sent</h3>
                <p className="font-sans text-sm text-comun-muted max-w-sm">
                  Thank you for reaching out. Our team will get back to you within 24–48 hours.
                </p>
                <div className="gold-divider mt-2" />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="glass gold-border p-6 md:p-8 flex flex-col gap-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="name" className="font-sans text-xs text-comun-gold/60 uppercase tracking-widest">
                      Full Name
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Your full name"
                      className="bg-white/5 border border-comun-gold/15 text-comun-white placeholder:text-comun-muted/40 font-sans text-sm px-4 py-3 outline-none focus:border-comun-gold/40 transition-colors"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="email" className="font-sans text-xs text-comun-gold/60 uppercase tracking-widest">
                      Email Address
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={form.email}
                      onChange={handleChange}
                      placeholder="your@email.com"
                      className="bg-white/5 border border-comun-gold/15 text-comun-white placeholder:text-comun-muted/40 font-sans text-sm px-4 py-3 outline-none focus:border-comun-gold/40 transition-colors"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="message" className="font-sans text-xs text-comun-gold/60 uppercase tracking-widest">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={5}
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Write your message or inquiry here…"
                    className="bg-white/5 border border-comun-gold/15 text-comun-white placeholder:text-comun-muted/40 font-sans text-sm px-4 py-3 outline-none focus:border-comun-gold/40 transition-colors resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary text-sm py-3.5 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending…' : 'Send Message'}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </SectionContainer>
  );
};

export default ContactSection;
