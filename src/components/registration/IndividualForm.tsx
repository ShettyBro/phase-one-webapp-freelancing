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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setDelegateField = (i: number, field: keyof DelegateForm, value: string) => {
    setDelegates((prev) => prev.map((d, idx) => (idx === i ? { ...d, [field]: value } : d)));
  };
  const setIdProof = (i: number, ref: UploadedRef | null) => {
    setIdProofs((prev) => prev.map((r, idx) => (idx === i ? ref : r)));
  };

  const validate = (): string | null => {
    if (!committee) return 'Please select a committee.';
    if (!portfolio.trim()) return 'Please enter a portfolio preference.';
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
        delegates: delegates.map((d) => ({ ...d, grade: Number(d.grade) })),
        idProofs: idProofs as UploadedRef[],
      });
      onSuccess(result, delegates[0].phone.trim());
    } catch (err) {
      const apiErr = extractApiError(err);
      if (apiErr.duplicate && apiErr.applicationId) {
        onDuplicate(apiErr.applicationId);
      } else if (apiErr.duplicate) {
        // Duplicate confirmed but no ID returned (race condition). Show inline message.
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

      {/* Committee + Portfolio */}
      <div className="glass gold-border rounded-md p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
        {isDouble ? (
          <FormField as="select" label="Committee" name="committee" required value={DOUBLE_COMMITTEE} onChange={() => {}} options={[{ value: DOUBLE_COMMITTEE, label: 'DISEC (Double Delegation)' }]} />
        ) : (
          <FormField
            as="select"
            label="Committee Preference"
            name="committee"
            required
            value={committee}
            onChange={setCommittee}
            placeholder="Select a committee"
            options={COMMITTEES
              .map((c) => ({ value: c.code, label: `${c.name} — ${c.fullName}` }))}
          />
        )}
        <FormField label="Portfolio Preference" name="portfolio" required value={portfolio} onChange={setPortfolio} placeholder="e.g. country / role" />
      </div>

      {error && <p className="form-error text-center">{error}</p>}

      <button type="submit" disabled={submitting} className="btn-primary text-sm px-8 py-3.5 inline-flex items-center justify-center gap-2 self-center min-w-[220px]">
        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
        {submitting ? 'Submitting…' : 'Submit Registration'}
      </button>
    </form>
  );
};
