import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Copy, Check, Download, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { RegistrationResult } from '../../utils/registrationApi';
import { downloadRegistrationPdf } from '../../utils/pdfApi';

interface RegistrationSuccessProps {
  result: RegistrationResult;
  phone: string; // primary phone — needed to retrieve the PDF
}

export const RegistrationSuccess: React.FC<RegistrationSuccessProps> = ({ result, phone }) => {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(result.applicationId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    setDownloadError(null);
    try {
      // B9 — brief delay so Neon read replicas have time to catch up after
      // the just-written registration row becomes visible on the read path.
      await new Promise((r) => setTimeout(r, 1000));
      await downloadRegistrationPdf(result.applicationId, phone);
    } catch {
      setDownloadError('Could not generate the PDF right now. You can retrieve it later from the Retrieve Registration page.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="glass-navy gold-border rounded-md max-w-xl mx-auto p-8 md:p-10 text-center relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-comun-maroon via-comun-gold to-comun-maroon" />

      <div className="mx-auto mb-5 w-16 h-16 flex items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/5">
        <CheckCircle2 className="w-8 h-8 text-emerald-400" />
      </div>

      <h2 className="font-serif-display text-3xl font-semibold text-gold-gradient mb-2">Registration Confirmed</h2>
      <p className="font-sans text-sm text-comun-muted mb-6">
        Save your Application ID — you'll need it during offline registration.
      </p>

      {/* Application ID */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <div className="px-5 py-3 border border-comun-gold/30 bg-comun-gold/5 rounded-sm">
          <span className="font-serif-display text-2xl md:text-3xl font-semibold text-comun-gold tracking-wider">
            {result.applicationId}
          </span>
        </div>
        <button onClick={copyId} className="p-2.5 border border-comun-gold/20 hover:border-comun-gold/50 rounded-sm text-comun-gold transition-colors" aria-label="Copy Application ID">
          {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
        </button>
      </div>

      {result.amountPayable > 0 && (
        <p className="font-sans text-sm text-comun-white/80 mb-2">
          Amount payable at the Registration Desk:{' '}
          <span className="text-comun-gold font-semibold">₹{result.amountPayable.toLocaleString('en-IN')}</span>
        </p>
      )}

      <p className="font-sans text-xs text-comun-muted leading-relaxed mb-8">
        A confirmation email should arrive shortly. Please download your registration PDF and bring a
        printed copy during offline registration.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button onClick={handleDownload} disabled={downloading} className="btn-primary text-sm px-7 py-3 inline-flex items-center gap-2">
          {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {downloading ? 'Generating…' : 'Download PDF'}
        </button>
        <Link to="/" className="btn-secondary text-sm px-7 py-3">Back to Home</Link>
      </div>

      {downloadError && <p className="form-error mt-4">{downloadError}</p>}
    </motion.div>
  );
};
