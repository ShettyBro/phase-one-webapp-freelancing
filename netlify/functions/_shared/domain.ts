// Shared backend domain constants for registration validation + pricing.
// NOTE: committee codes mirror src/data/comun.ts (COMMITTEES[].code).

export const COMMITTEE_CODES = [
  'DISEC',
  'UNODC',
  'SPECPOL',
  'UNSC',
  'CCC',
  'IPC-J',
  'IPC-P',
] as const;

export type CommitteeCode = (typeof COMMITTEE_CODES)[number];

/** Double Delegation is only allowed for DISEC. */
export const DOUBLE_DELEGATION_COMMITTEE: CommitteeCode = 'DISEC';

/** DISEC is ONLY available for Double Delegation — exclude it from Single. */
export const DISEC_EXCLUDED_FROM_SINGLE = true;

// ── Upload constraints ──
export const ID_PROOF = {
  maxBytes: 4 * 1024 * 1024, // 4 MB
  mimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
  extensions: ['pdf', 'jpg', 'jpeg', 'png'],
};

export const SPREADSHEET = {
  maxBytes: 8 * 1024 * 1024, // 8 MB
  mimeTypes: [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  extensions: ['csv', 'xlsx', 'xls'],
};

export const RESOURCE_FILE = {
  maxBytes: 25 * 1024 * 1024, // 25 MB (admin-uploaded public docs)
};

export const PAYMENT_PROOF = {
  maxBytes: 4 * 1024 * 1024, // 4 MB
  mimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
  extensions: ['pdf', 'jpg', 'jpeg', 'png', 'webp'],
  /** R2 folder — must match the folder the client created in the bucket */
  r2Prefix: 'payment proofs',
};

// ── Fees ──
export const FEES = {
  INDIVIDUAL_SINGLE: 1500,         // ₹1,500 per delegate
  INDIVIDUAL_DOUBLE: 3000,         // ₹1,500 × 2 delegates
  /** Flat institution registration fee charged once per institution */
  INSTITUTIONAL_FLAT: 1500,
  /** Per-delegate fee for institutional registrations */
  INSTITUTIONAL_PER_DELEGATE: 1500,
  INSTITUTIONAL: 0,                // total billed at desk (unknown until delegate count confirmed)
} as const;

export const CURRENCY = 'INR';
