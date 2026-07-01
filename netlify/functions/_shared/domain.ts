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

// ── Fees (amount payable at the Registration Desk) ──
// TODO: confirm final amounts with the organizers. Stored on each registration
// and printed on the PDF.
export const FEES = {
  INDIVIDUAL_SINGLE: 1500,
  INDIVIDUAL_DOUBLE: 2800,
  INSTITUTIONAL: 0, // billed per delegate at the desk
} as const;

export const CURRENCY = 'INR';
