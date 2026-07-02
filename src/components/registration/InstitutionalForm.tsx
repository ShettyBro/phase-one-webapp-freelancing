import React, { useState } from 'react';
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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = (): string | null => {
    if (!institutionName.trim()) return 'Institution name is required.';
    if (!teacher.name.trim() || !teacher.email.trim() || !teacher.phone.trim()) return 'Teacher In Charge details are required.';
    if (!head.name.trim() || !head.email.trim() || !head.phone.trim()) return 'Head Delegate details are required.';
    if (!spreadsheet) return 'Please upload the delegation spreadsheet.';
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

      {error && <p className="form-error text-center">{error}</p>}

      <button type="submit" disabled={submitting} className="btn-primary text-sm px-8 py-3.5 inline-flex items-center justify-center gap-2 self-center min-w-[220px]">
        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
        {submitting ? 'Submitting…' : 'Submit Registration'}
      </button>
    </form>
  );
};
