import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { FormField } from '../ui/FormField';
import { NationalitySelect } from '../ui/NationalitySelect';
import { FileUpload } from '../ui/FileUpload';
import { COMMITTEES } from '../../data/comun';
import type { UploadedRef } from '../../utils/uploadFile';
import {
  submitIndividual,
  extractApiError,
  type DelegateForm,
  type RegistrationResult,
} from '../../utils/registrationApi';

const DOUBLE_COMMITTEE = 'DISEC';
const GRADES = ['6', '7', '8', '9', '10', '11', '12'];

/**
 * DISEC is Double-Delegation only — exclude it from the Single Delegation list.
 * The backend also enforces this; the frontend simply keeps the UI clean.
 */
const SINGLE_COMMITTEES = COMMITTEES.filter((c) => c.code !== DOUBLE_COMMITTEE);

const emptyDelegate = (): DelegateForm => ({
  name: '', email: '', phone: '', grade: '', nationality: '', experience: '', institution: '',
});

interface IndividualFormProps {
  delegationType: 'SINGLE' | 'DOUBLE';
  onSuccess: (result: RegistrationResult, phone: string) => void;
  onDuplicate: (applicationId: string) => void;
}

export const IndividualForm: React.FC<IndividualFormProps> = ({ delegationType, onSuccess, onDuplicate }) => {
  const isDouble = delegationType === 'DOUBLE';
  const count = isDouble ? 2 : 1;

  const [delegates, setDelegates] = useState<DelegateForm[]>(
    Array.from({ length: count }, emptyDelegate),
  );
  const [idProofs, setIdProofs] = useState<(UploadedRef | null)[]>(Array(count).fill(null));
  const [committee, setCommittee] = useState(isDouble ? DOUBLE_COMMITTEE : '');
  const [portfolio, setPortfolio] = useState('');
  const [committee2, setCommittee2] = useState('');
  const [portfolio2, setPortfolio2] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'ONLINE' | 'OFFLINE'>('ONLINE');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentProof, setPaymentProof] = useState<UploadedRef | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setDelegateField = (i: number, field: keyof DelegateForm, value: string) => {
    setDelegates((prev) => prev.map((d, idx) => (idx === i ? { ...d, [field]: value } : d)));
  };
  const setIdProof = (i: number, ref: UploadedRef | null) => {
    setIdProofs((prev) => prev.map((r, idx) => (idx === i ? ref : r)));
  };

  const validate = (): string | null => {
    if (!committee) return 'Please select a committee preference (1st Choice).';
    const selectedComm = COMMITTEES.find((c) => c.code === committee);
    if (selectedComm?.registrationClosed) {
      return `Registration for ${selectedComm.name} (${selectedComm.fullName}) is currently closed.`;
    }
    if (!portfolio.trim()) return 'Please enter a portfolio preference for your 1st committee choice.';

    if (committee2) {
      const selectedComm2 = COMMITTEES.find((c) => c.code === committee2);
      if (selectedComm2?.registrationClosed) {
        return `Registration for 2nd preference ${selectedComm2.name} (${selectedComm2.fullName}) is currently closed.`;
      }
    }

    for (let i = 0; i < count; i++) {
      const d = delegates[i];
      const label = isDouble ? `Delegate ${i + 1}` : 'Delegate';
      if (!d.name.trim()) return `${label}: name is required.`;
      if (!d.email.trim()) return `${label}: email is required.`;
      if (!d.phone.trim()) return `${label}: phone is required.`;
      if (!d.grade) return `${label}: grade is required.`;
      if (!d.nationality.trim()) return `${label}: nationality is required.`;
      if (!d.experience.trim()) return `${label}: experience is required.`;
      if (!idProofs[i]) return `${label}: please upload an ID proof.`;
    }
    if (paymentMethod === 'ONLINE') {
      if (!paymentReference.trim()) {
        return 'Please enter the Transaction Reference Number (UTR) for your online payment.';
      }
      if (!paymentProof) {
        return 'Please upload a screenshot of your payment transfer.';
      }
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
      const result = await submitIndividual({
        delegationType,
        committee,
        portfolio: portfolio.trim(),
        committee2: committee2 || undefined,
        portfolio2: portfolio2.trim() || undefined,
        delegates: delegates.map((d) => ({ ...d, grade: Number(d.grade) })),
        idProofs: idProofs as UploadedRef[],
        paymentMethod,
        paymentReference: paymentMethod === 'ONLINE' ? paymentReference.trim() : undefined,
        paymentProof: paymentMethod === 'ONLINE' ? (paymentProof ?? undefined) : undefined,
      });
      onSuccess(result, delegates[0].phone.trim());
    } catch (err) {
      const apiErr = extractApiError(err);
      if (apiErr.duplicate && apiErr.applicationId) {
        onDuplicate(apiErr.applicationId);
      } else if (apiErr.duplicate) {
        setError('A registration already exists with your email or phone number. Please contact the organizers.');
      } else {
        setError(apiErr.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      {delegates.map((d, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 * i }}
          className="glass gold-border rounded-md p-6 flex flex-col gap-5"
        >
          {isDouble && (
            <h3 className="font-serif-display text-xl text-comun-gold">Delegate {i + 1}</h3>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label="Name" name={`name-${i}`} required value={d.name} onChange={(v) => setDelegateField(i, 'name', v)} placeholder="Full name" />
            <FormField label="Email" name={`email-${i}`} type="email" required value={d.email} onChange={(v) => setDelegateField(i, 'email', v)} placeholder="you@email.com" />
            <FormField label="Phone Number" name={`phone-${i}`} type="tel" required value={d.phone} onChange={(v) => setDelegateField(i, 'phone', v)} placeholder="+91 …" />
            <FormField
              as="select"
              label="Grade"
              name={`grade-${i}`}
              required
              value={d.grade}
              onChange={(v) => setDelegateField(i, 'grade', v)}
              placeholder="Select grade"
              options={GRADES.map((g) => ({ value: g, label: `Grade ${g}` }))}
            />
            <NationalitySelect required value={d.nationality} onChange={(v) => setDelegateField(i, 'nationality', v)} />
            <FormField label="Experience" name={`exp-${i}`} required value={d.experience} onChange={(v) => setDelegateField(i, 'experience', v)} placeholder="e.g. 3 MUNs, Beginner…" />
            <FormField label="Institution (optional)" name={`inst-${i}`} value={d.institution} onChange={(v) => setDelegateField(i, 'institution', v)} placeholder="School / College" className="sm:col-span-2" />
          </div>
          <FileUpload
            label="School ID / Government ID"
            kind="ID_PROOF"
            required
            value={idProofs[i]}
            onChange={(ref) => setIdProof(i, ref)}
          />
        </motion.div>
      ))}

      {/* Committee + Portfolio Section */}
      <div className="glass gold-border rounded-md p-6 flex flex-col gap-6">
        <h3 className="font-serif-display text-xl text-comun-gold">Committee &amp; Portfolio Preferences</h3>

        {/* Preference 1 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {isDouble ? (
            <div>
              <FormField
                as="select"
                label="Committee Preference 1"
                name="committee"
                required
                value={DOUBLE_COMMITTEE}
                onChange={() => {}}
                options={[
                  {
                    value: DOUBLE_COMMITTEE,
                    label: `DISEC (Double Delegation) — Registration Closed`,
                    disabled: true,
                  },
                ]}
              />
              <p className="font-sans text-xs text-red-400 mt-1">Registration for DISEC (Double Delegation) is currently closed.</p>
            </div>
          ) : (
            <FormField
              as="select"
              label="Committee Preference 1"
              name="committee"
              required
              value={committee}
              onChange={setCommittee}
              placeholder="Select 1st preference"
              options={SINGLE_COMMITTEES.map((c) => ({
                value: c.code,
                label: c.registrationClosed ? `${c.name} — ${c.fullName} (Registration Closed)` : `${c.name} — ${c.fullName}`,
                disabled: c.registrationClosed,
              }))}
            />
          )}
          <FormField label="Portfolio Preference 1" name="portfolio" required value={portfolio} onChange={setPortfolio} placeholder="e.g. country / role (1st choice)" />
        </div>

        {/* Preference 2 */}
        {!isDouble && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t border-white/10">
            <FormField
              as="select"
              label="Committee Preference 2"
              name="committee2"
              value={committee2}
              onChange={setCommittee2}
              placeholder="Select 2nd preference (optional)"
              options={SINGLE_COMMITTEES.map((c) => ({
                value: c.code,
                label: c.registrationClosed ? `${c.name} — ${c.fullName} (Registration Closed)` : `${c.name} — ${c.fullName}`,
                disabled: c.registrationClosed,
              }))}
            />
            <FormField label="Portfolio Preference 2" name="portfolio2" value={portfolio2} onChange={setPortfolio2} placeholder="e.g. country / role (2nd choice)" />
          </div>
        )}
      </div>

      {/* Payment Section */}
      <div className="glass gold-border rounded-md p-6 flex flex-col gap-5">
        <div>
          <h3 className="font-serif-display text-xl text-comun-gold mb-1">Payment Details</h3>
          <p className="font-sans text-sm text-comun-muted">
            Registration Fee:{' '}
            <strong className="text-comun-white text-base">₹{isDouble ? '3,000' : '1,500'}</strong>
            {isDouble && (
              <span className="text-comun-muted text-xs ml-2">(₹1,500 per head × 2 delegates)</span>
            )}
          </p>
        </div>

        {/* Method toggle */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <span className={`font-sans font-semibold ${paymentMethod === 'ONLINE' ? 'text-comun-gold' : 'text-comun-white'}`}>Online (NEFT)</span>
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === 'ONLINE' ? 'border-comun-gold' : 'border-white/30'}`}>
                {paymentMethod === 'ONLINE' && <div className="w-2 h-2 rounded-full bg-comun-gold" />}
              </div>
            </div>
            <p className="font-sans text-xs text-comun-muted">Pay via bank transfer — attach screenshot and enter UTR.</p>
          </button>

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
            <p className="font-sans text-xs text-comun-muted">Pay in cash at the registration desk on Day 1.</p>
          </button>
        </div>

        {/* ONLINE details panel */}
        {paymentMethod === 'ONLINE' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-5 border border-comun-gold/20 bg-comun-gold/5 rounded-md flex flex-col gap-4 overflow-hidden"
          >
            <div>
              <p className="font-sans text-sm text-comun-white mb-2">
                Transfer <strong className="text-comun-gold">₹{isDouble ? '3,000' : '1,500'}</strong> to:
              </p>
              <div className="font-mono text-sm text-comun-gold/80 bg-black/20 p-3 rounded border border-white/5 space-y-1">
                <p><strong>Name:</strong> BISHOP COTTON BOYS' SCHOOL</p>
                <p><strong>A/C No:</strong> 410202050000024</p>
                <p><strong>IFSC:</strong> UBIN0541028</p>
                <p><strong>Branch:</strong> Richmond Town Branch</p>
              </div>
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
              label="Payment Screenshot / Proof (PDF or Image)"
              kind="PAYMENT_PROOF"
              required
              value={paymentProof}
              onChange={setPaymentProof}
            />
          </motion.div>
        )}

        {/* OFFLINE info pill */}
        {paymentMethod === 'OFFLINE' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-4 border border-white/10 bg-white/[0.02] rounded-md overflow-hidden"
          >
            <p className="font-sans text-sm text-comun-muted">
              💳 You may pay at the <span className="text-comun-white">registration desk on Day 1</span> of the conference (30 July 2026). Please carry the exact amount in cash.
            </p>
          </motion.div>
        )}
      </div>

      {error && <p className="form-error text-center">{error}</p>}

      <p className="font-sans text-xs text-comun-muted text-center">
        ⚠️ <strong className="text-comun-white/70">No refunds</strong> will be issued once registration is submitted and confirmed.
      </p>

      <button type="submit" disabled={submitting} className="btn-primary text-sm px-8 py-3.5 inline-flex items-center justify-center gap-2 self-center min-w-[220px]">
        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
        {submitting ? 'Submitting…' : 'Submit Registration'}
      </button>
    </form>
  );
};
