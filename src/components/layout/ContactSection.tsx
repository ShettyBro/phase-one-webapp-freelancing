import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, MapPin, Clock, Phone, Instagram } from 'lucide-react';
import { SectionContainer, SectionHeader } from '../ui/SectionContainer';
import { DoveAccent } from '../ui/DoveAccent';
import { CONFERENCE } from '../../data/comun';
import api from '../../utils/api';

// ── Contact data ─────────────────────────────────────────────────────────────
const STUDENT_COORDINATORS = [
  { role: 'Head of CoMUN', name: 'Ayush Prem', phone: '+91 8618080517' },
  { role: 'Communications', name: 'Thavanes Kanakaraj', phone: '+91 8867933396' },
  { role: 'Hospitality', name: 'Dhruv Kulkarni', phone: '+91 9980954225' },
];

const FACULTY = [
  { name: 'Mrs. Mercy Stanley', phone: '+91 9742175540' },
  { name: 'Mrs. Tabassum Ali', phone: '+91 98440 87602' },
  { name: 'Mrs. Sandra Vijaya Anchan', phone: '+91 94805 10509' },
];

const ContactSection: React.FC = () => {
  const [form, setForm]     = useState({ name: '', email: '', message: '' });
  const [sent, setSent]     = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post('/contact', form);
      setSent(true);
    } catch {
      setError('Could not send your message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionContainer
      id="contact"
      className="bg-gradient-to-b from-comun-black to-comun-charcoal"
      decor={<DoveAccent position="right" opacity={0.05} />}
    >
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
          {/* ── Contact Info panel ── */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-2 flex flex-col gap-4"
          >
            {/* Email */}
            <div className="flex items-start gap-4 glass gold-border p-4">
              <div className="w-10 h-10 flex items-center justify-center border border-comun-gold/20 text-comun-gold flex-shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <p className="font-sans text-xs text-comun-gold/60 uppercase tracking-widest mb-1">Official Email</p>
                <a href="mailto:cottonsmun2026@gmail.com" className="font-sans text-sm text-comun-white/80 hover:text-comun-gold transition-colors">
                  cottonsmun2026@gmail.com
                </a>
              </div>
            </div>

            {/* Address */}
            <div className="flex items-start gap-4 glass gold-border p-4">
              <div className="w-10 h-10 flex items-center justify-center border border-comun-gold/20 text-comun-gold flex-shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="font-sans text-xs text-comun-gold/60 uppercase tracking-widest mb-1">Address</p>
                <p className="font-sans text-sm text-comun-white/80 leading-relaxed">
                  15, Residency Rd, Shanthala Nagar,<br />
                  Ashok Nagar, Bengaluru,<br />
                  Karnataka – 560025
                </p>
              </div>
            </div>

            {/* Conference dates */}
            <div className="flex items-start gap-4 glass gold-border p-4">
              <div className="w-10 h-10 flex items-center justify-center border border-comun-gold/20 text-comun-gold flex-shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="font-sans text-xs text-comun-gold/60 uppercase tracking-widest mb-1">Conference Dates</p>
                <p className="font-sans text-sm text-comun-white/80">{CONFERENCE.dates}</p>
              </div>
            </div>

            {/* Student coordinators */}
            <div className="glass gold-border p-4">
              <div className="flex items-center gap-2 mb-3">
                <Phone className="w-4 h-4 text-comun-gold/70" />
                <p className="font-sans text-xs text-comun-gold/70 uppercase tracking-widest">Student Co-ordinators</p>
              </div>
              <div className="flex flex-col gap-2.5">
                {STUDENT_COORDINATORS.map(c => (
                  <div key={c.name} className="border-b border-white/5 pb-2 last:border-0 last:pb-0">
                    <p className="font-sans text-[11px] text-comun-gold/60 uppercase tracking-wider">{c.role}</p>
                    <p className="font-sans text-sm text-comun-white/85">{c.name}</p>
                    <a href={`tel:${c.phone.replace(/\s/g, '')}`} className="font-sans text-xs text-comun-muted hover:text-comun-gold transition-colors">
                      {c.phone}
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Faculty */}
            <div className="glass gold-border p-4">
              <div className="flex items-center gap-2 mb-3">
                <Phone className="w-4 h-4 text-comun-gold/70" />
                <p className="font-sans text-xs text-comun-gold/70 uppercase tracking-widest">Faculty</p>
              </div>
              <div className="flex flex-col gap-2.5">
                {FACULTY.map(f => (
                  <div key={f.name} className="border-b border-white/5 pb-2 last:border-0 last:pb-0">
                    <p className="font-sans text-sm text-comun-white/85">{f.name}</p>
                    <a href={`tel:${f.phone.replace(/\s/g, '')}`} className="font-sans text-xs text-comun-muted hover:text-comun-gold transition-colors">
                      {f.phone}
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Instagram */}
            <div className="glass gold-border p-4">
              <p className="font-sans text-xs text-comun-gold/60 uppercase tracking-widest mb-3">Follow CoMUN</p>
              <a
                href="https://instagram.com/cottonsmun2026"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-sans text-sm text-comun-white/80 hover:text-comun-gold transition-colors"
              >
                <Instagram className="w-4 h-4" />
                @cottonsmun2026
              </a>
            </div>
          </motion.div>

          {/* ── Contact Form ── */}
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

                {error && <p className="form-error">{error}</p>}

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
