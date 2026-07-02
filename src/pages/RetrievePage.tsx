import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Loader2, FileText, CheckCircle2 } from 'lucide-react';
import { FormField } from '../components/ui/FormField';
import { downloadRegistrationPdf } from '../utils/pdfApi';
import { useSEO } from '../hooks/useSEO';

const RetrievePage: React.FC = () => {
  useSEO({
    title: 'Retrieve Registration — CoMUN 2026',
    description: 'Retrieve and download your CoMUN 2026 registration PDF using your Application ID and phone number.',
    url: '/retrieve',
  });

  const [applicationId, setApplicationId] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!applicationId.trim() || !phone.trim()) {
      setError('Please enter both your Application ID and phone number.');
      return;
    }
    setLoading(true);
    try {
      await downloadRegistrationPdf(applicationId.trim().toUpperCase(), phone.trim());
      setDone(true);
    } catch (err) {
      let msg = 'Could not find a matching registration. Please check your details.';
      const data = (err as { response?: { data?: unknown } })?.response?.data;
      if (data instanceof Blob) {
        try {
          const parsed = JSON.parse(await data.text());
          if (parsed?.message) msg = parsed.message;
        } catch {
          /* keep default */
        }
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen pt-20 md:pt-24 pb-24 px-4 sm:px-6">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <span className="font-sans text-xs font-semibold tracking-[0.25em] uppercase text-comun-gold/80">Retrieve</span>
          <h1 className="font-serif-display text-3xl md:text-4xl font-semibold text-gold-gradient mt-3 mb-3">Retrieve Registration</h1>
          <div className="gold-divider" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass-navy gold-border rounded-md p-8 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-comun-maroon via-comun-gold to-comun-maroon" />

          {done ? (
            <div className="text-center">
              <div className="mx-auto mb-4 w-14 h-14 flex items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/5">
                <CheckCircle2 className="w-7 h-7 text-emerald-400" />
              </div>
              <h2 className="font-serif-display text-2xl text-comun-white mb-2">PDF Downloaded</h2>
              <p className="font-sans text-sm text-comun-muted mb-6">
                Your registration PDF has been downloaded. Bring a printed copy to the Registration Desk.
              </p>
              <button onClick={() => setDone(false)} className="btn-secondary text-sm px-6 py-2.5">Retrieve Another</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="flex items-center gap-3 text-comun-gold/80 mb-1">
                <FileText className="w-5 h-5" />
                <p className="font-sans text-xs text-comun-muted">Enter your Application ID and the phone number you registered with.</p>
              </div>
              <FormField label="Application ID" name="applicationId" required value={applicationId} onChange={(v) => setApplicationId(v)} placeholder="COMUN26-XXXXXX" />
              <FormField label="Phone Number" name="phone" type="tel" required value={phone} onChange={setPhone} placeholder="+91 …" />

              {error && <p className="form-error">{error}</p>}

              <button type="submit" disabled={loading} className="btn-primary text-sm py-3 inline-flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {loading ? 'Retrieving…' : 'Download PDF'}
              </button>
            </form>
          )}
        </motion.div>

      </div>
    </main>
  );
};

export default RetrievePage;
