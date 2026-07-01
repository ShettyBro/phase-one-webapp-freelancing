export interface DelegateInput {
  name?: string;
  email?: string;
  phone?: string;
  grade?: number;
  nationality?: string;
  experience?: string;
  institution?: string | null;
}

export interface FileRef {
  key?: string;
  fileName?: string;
  mimeType?: string;
  size?: number;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9\s-]{7,20}$/;

export const isEmail = (v?: string) => !!v && EMAIL_RE.test(v.trim());
export const isPhone = (v?: string) => !!v && PHONE_RE.test(v.trim());
export const nonEmpty = (v?: string) => !!v && v.trim().length > 0;

/** Returns an error message, or null if the delegate is valid. */
export function validateDelegate(d: DelegateInput, label = 'Delegate'): string | null {
  if (!nonEmpty(d.name)) return `${label}: name is required.`;
  if (!isEmail(d.email)) return `${label}: a valid email is required.`;
  if (!isPhone(d.phone)) return `${label}: a valid phone number is required.`;
  if (typeof d.grade !== 'number' || d.grade < 6 || d.grade > 12) {
    return `${label}: grade must be between 6 and 12.`;
  }
  if (!nonEmpty(d.nationality)) return `${label}: nationality is required.`;
  if (!nonEmpty(d.experience)) return `${label}: experience is required.`;
  return null;
}

/** Returns an error message, or null if the file reference is valid. */
export function validateFileRef(f: FileRef | undefined, label = 'File'): string | null {
  if (!f) return `${label} is required.`;
  if (!nonEmpty(f.key)) return `${label}: upload is missing.`;
  if (!nonEmpty(f.fileName)) return `${label}: file name is missing.`;
  return null;
}
