import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Download } from 'lucide-react';
import { FormField } from '../ui/FormField';
import { FileUpload } from '../ui/FileUpload';
import type { UploadedRef } from '../../utils/uploadFile';
import {
  submitInstitutional,
  extractApiError,
  type ContactForm,
  type RegistrationResult,
} from '../../utils/registrationApi';

const emptyContact = (): ContactForm => ({ name: '', email: '', phone: '' });

const TEMPLATE_HEADERS = ['Name', 'Email', 'Phone', 'Grade', 'Nationality', 'Committee Preference', 'Portfolio Preference'];

function downloadTemplate() {
  const csv = TEMPLATE_HEADERS.join(',') + '\n';
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'CoMUN-2026-Delegation-Template.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

interface InstitutionalFormProps {
  onSuccess: (result: RegistrationResult, phone: string) => void;
  onDuplicate: (applicationId: string) => void;
}

export const InstitutionalForm: React.FC<InstitutionalFormProps> = ({ onSuccess, onDuplicate }) => {
  const [institutionName, setInstitutionName] = useState('');
  const [teacher, setTeacher] = useState<ContactForm>(emptyContact);
  const [head, setHead] = useState<ContactForm>(emptyContact);
  const [spreadsheet, setSpreadsheet] = useState<UploadedRef | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'ONLINE' | 'OFFLINE'>('OFFLINE');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentProof, setPaymentProof] = useState<UploadedRef | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = (): string | null => {
    if (!institutionName.trim()) return 'Institution name is required.';
    if (!teacher.name.trim() || !teacher.email.trim() || !teacher.phone.trim()) return 'Teacher In Charge details are required.';
    if (!head.name.trim() || !head.email.trim() || !head.phone.trim()) return 'Head Delegate details are required.';
    if (!spreadsheet) return 'Please upload the delegation spreadsheet.';
    if (paymentMethod === 'ONLINE') {
      if (!paymentReference.trim()) return 'Please enter the UTR / Transaction Reference for your NEFT transfer.';
      if (!paymentProof) return 'Please upload a screenshot of your NEFT payment.';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setSubmitting(true);
    try {
      const result = await submitInstitutional({
        institutionName: institutionName.trim(),
        teacher,
        head,
        spreadsheet: spreadsheet as UploadedRef,
        paymentMethod,
        paymentReference: paymentMethod === 'ONLINE' ? paymentReference.trim() : undefined,
        paymentProof: paymentMethod === 'ONLINE' ? (paymentProof ?? undefined) : undefined,
      });
      onSuccess(result, teacher.phone.trim());
    } catch (err) {
      const apiErr = extractApiError(err);
      if (apiErr.duplicate && apiErr.applicationId) {
        onDuplicate(apiErr.applicationId);
      } else if (apiErr.duplicate) {
        setError('An institutional registration already exists for this teacher email or phone. Please contact the organizers.');
      } else {
        setError(apiErr.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const contactGrid = (
    title: string,
    value: ContactForm,
    set: React.Dispatch<React.SetStateAction<ContactForm>>,
    prefix: string,
  ) => (
    <div className="glass gold-border rounded-md p-6 flex flex-col gap-5">
      <h3 className="font-serif-display text-xl text-comun-gold">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <FormField label="Name" name={`${prefix}-name`} required value={value.name} onChange={(v) => set((p) => ({ ...p, name: v }))} placeholder="Full name" />
        <FormField label="Email" name={`${prefix}-email`} type="email" required value={value.email} onChange={(v) => set((p) => ({ ...p, email: v }))} placeholder="email@school.edu" />
        <FormField label="Phone" name={`${prefix}-phone`} type="tel" required value={value.phone} onChange={(v) => set((p) => ({ ...p, phone: v }))} placeholder="+91 …" />
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      {/* Institution */}
      <div className="glass gold-border rounded-md p-6">
        <FormField label="Institution Name" name="institution" required value={institutionName} onChange={setInstitutionName} placeholder="School / College name" />
      </div>

      {contactGrid('Teacher In Charge', teacher, setTeacher, 'teacher')}
      {contactGrid('Head Delegate', head, setHead, 'head')}

      {/* Spreadsheet */}
      <div className="glass gold-border rounded-md p-6 flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="font-serif-display text-xl text-comun-gold">Delegation Spreadsheet</h3>
            <p className="font-sans text-xs text-comun-muted mt-1">Download the template, fill it in, and upload it below.</p>
          </div>
          <button type="button" onClick={downloadTemplate} className="btn-secondary text-xs px-5 py-2.5 inline-flex items-center gap-2 flex-shrink-0">
            <Download className="w-4 h-4" /> Download Template
          </button>
        </div>
        <FileUpload label="Upload Spreadsheet (CSV / XLSX)" kind="SPREADSHEET" required value={spreadsheet} onChange={setSpreadsheet} />
      </div>

      {/* ── Payment Section ── */}
      <div className="glass gold-border rounded-md p-6 flex flex-col gap-5">
        <div>
          <h3 className="font-serif-display text-xl text-comun-gold mb-1">Payment Method</h3>
          <p className="font-sans text-xs text-comun-muted">
            Total = (No. of delegates × ₹1,500) + ₹1,500 institutional fee.
            Exact amount confirmed after delegate count is verified.
          </p>
        </div>

        {/* Method toggle */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Offline / At Desk */}
          <button
            type="button"
            onClick={() => setPaymentMethod('OFFLINE')}
            className={`p-5 rounded-md border text-left transition-all ${
              paymentMethod === 'OFFLINE'
                ? 'border-comun-gold bg-comun-gold/10 shadow-[0_0_15px_rgba(201,168,76,0.15)]'
                : 'border-white/10 bg-white/[0.02] hover:border-comun-gold/30 hover:bg-white/[0.04]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`font-sans font-semibold ${paymentMethod === 'OFFLINE' ? 'text-comun-gold' : 'text-comun-white'}`}>At Desk (Offline)</span>
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === 'OFFLINE' ? 'border-comun-gold' : 'border-white/30'}`}>
                {paymentMethod === 'OFFLINE' && <div className="w-2 h-2 rounded-full bg-comun-gold" />}
              </div>
            </div>
            <p className="font-sans text-xs text-comun-muted">Pay at the registration desk. Amount finalised by the team.</p>
          </button>

          {/* Online / NEFT */}
          <button
            type="button"
            onClick={() => setPaymentMethod('ONLINE')}
            className={`p-5 rounded-md border text-left transition-all ${
              paymentMethod === 'ONLINE'
                ? 'border-comun-gold bg-comun-gold/10 shadow-[0_0_15px_rgba(201,168,76,0.15)]'
                : 'border-white/10 bg-white/[0.02] hover:border-comun-gold/30 hover:bg-white/[0.04]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`font-sans font-semibold ${paymentMethod === 'ONLINE' ? 'text-comun-gold' : 'text-comun-white'}`}>NEFT Transfer</span>
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === 'ONLINE' ? 'border-comun-gold' : 'border-white/30'}`}>
                {paymentMethod === 'ONLINE' && <div className="w-2 h-2 rounded-full bg-comun-gold" />}
              </div>
            </div>
            <p className="font-sans text-xs text-comun-muted">Transfer to the school bank account — attach screenshot + UTR.</p>
          </button>
        </div>

        {/* OFFLINE info */}
        {paymentMethod === 'OFFLINE' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-4 border border-white/10 bg-white/[0.02] rounded-md overflow-hidden"
          >
            <p className="font-sans text-sm text-comun-muted">
              💳 Our team will contact you with the final amount once the delegate list is verified.
              Payment is collected at the <span className="text-comun-white">registration desk on Day 1</span> (30 July 2026).
            </p>
          </motion.div>
        )}

        {/* ONLINE details */}
        {paymentMethod === 'ONLINE' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-5 border border-comun-gold/20 bg-comun-gold/5 rounded-md flex flex-col gap-4 overflow-hidden"
          >
            <div>
              <p className="font-sans text-sm text-comun-white mb-2">
                Transfer the total amount to the school bank account:
              </p>
              <div className="font-mono text-sm text-comun-gold/80 bg-black/20 p-3 rounded border border-white/5 space-y-1">
                <p><strong>Name:</strong> BISHOP COTTON BOYS' SCHOOL</p>
                <p><strong>A/C No:</strong> 410202050000024</p>
                <p><strong>IFSC:</strong> UBIN0541028</p>
                <p><strong>Branch:</strong> Richmond Town Branch</p>
              </div>
              <p className="font-sans text-xs text-comun-muted mt-2">
                Formula: (No. of delegates × ₹1,500) + ₹1,500 = Total
              </p>
            </div>
            <FormField
              label="Transaction Reference Number (UTR)"
              name="paymentReference"
              required
              value={paymentReference}
              onChange={setPaymentReference}
              placeholder="e.g. UTR1234567890"
            />
            <FileUpload
              label="NEFT Payment Screenshot / Proof (PDF or Image)"
              kind="PAYMENT_PROOF"
              required
              value={paymentProof}
              onChange={setPaymentProof}
            />
          </motion.div>
        )}
      </div>

      {error && <p className="form-error text-center">{error}</p>}

      <button type="submit" disabled={submitting} className="btn-primary text-sm px-8 py-3.5 inline-flex items-center justify-center gap-2 self-center min-w-[220px]">
        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
        {submitting ? 'Submitting…' : 'Submit Registration'}
      </button>
    </form>
  );
};
