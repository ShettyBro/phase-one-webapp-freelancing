import api from './api';
import type { UploadedRef } from './uploadFile';

export interface DelegateForm {
  name: string;
  email: string;
  phone: string;
  grade: string; // select value; converted to number on submit
  nationality: string;
  experience: string;
  institution: string;
}

export interface ContactForm {
  name: string;
  email: string;
  phone: string;
}

export interface RegistrationResult {
  applicationId: string;
  registrationType: 'INDIVIDUAL' | 'INSTITUTIONAL';
  delegationType?: 'SINGLE' | 'DOUBLE';
  committee?: string;
  amountPayable: number;
}

export interface ApiError {
  message: string;
  duplicate?: boolean;
  applicationId?: string;
}

export function extractApiError(err: unknown): ApiError {
  const anyErr = err as { response?: { data?: ApiError } };
  return anyErr?.response?.data ?? { message: 'Something went wrong. Please try again.' };
}

export async function submitIndividual(payload: {
  delegationType: 'SINGLE' | 'DOUBLE';
  committee: string;
  portfolio: string;
  delegates: Array<Omit<DelegateForm, 'grade'> & { grade: number }>;
  idProofs: UploadedRef[];
}): Promise<RegistrationResult> {
  const { data } = await api.post('/register-individual', payload);
  return data;
}

export async function submitInstitutional(payload: {
  institutionName: string;
  teacher: ContactForm;
  head: ContactForm;
  spreadsheet: UploadedRef;
}): Promise<RegistrationResult> {
  const { data } = await api.post('/register-institutional', payload);
  return data;
}
