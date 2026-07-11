/**
 * Google Sheets integration — appends a row to the configured spreadsheet
 * whenever a registration is successfully created.
 *
 * Requires these env vars (set in Netlify dashboard):
 *   GOOGLE_SHEETS_ID              — the spreadsheet ID from the URL
 *   GOOGLE_SERVICE_ACCOUNT_JSON   — full service-account credentials JSON (single line)
 *
 * The service account must be granted "Editor" access to the sheet.
 * If either var is missing the function is a no-op (safe in dev / before setup).
 *
 * Sheet layout (two tabs created automatically on first write):
 *   "Individual Registrations"   — one row per individual delegate(s)
 *   "Institutional Registrations" — one row per institution
 */

import { google } from 'googleapis';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface IndividualSheetRow {
  applicationId: string;
  submittedAt: string;        // ISO date string
  delegationType: string;     // SINGLE | DOUBLE
  committee: string;
  portfolio: string;
  paymentMethod: string;      // ONLINE | OFFLINE
  paymentReference: string;   // UTR or blank
  hasPaymentProof: boolean;
  amountPayable: number;
  // Delegate 1
  d1Name: string;
  d1Email: string;
  d1Phone: string;
  d1Grade: number | string;
  d1Nationality: string;
  d1Experience: string;
  d1Institution: string;
  // Delegate 2 (Double delegation only)
  d2Name?: string;
  d2Email?: string;
  d2Phone?: string;
  d2Grade?: number | string;
  d2Nationality?: string;
  d2Experience?: string;
  d2Institution?: string;
}

export interface InstitutionalSheetRow {
  applicationId: string;
  submittedAt: string;
  institutionName: string;
  teacherName: string;
  teacherEmail: string;
  teacherPhone: string;
  headName: string;
  headEmail: string;
  headPhone: string;
  paymentMethod: string;      // ONLINE | OFFLINE | AT_DESK
  paymentReference: string;
  hasPaymentProof: boolean;
  amountPayable: number;
  spreadsheetFileName: string;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function isConfigured(): boolean {
  return !!(process.env.GOOGLE_SHEETS_ID && process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
}

function buildAuth() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON!;
  const creds = JSON.parse(raw);
  return new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

/**
 * Ensures a sheet (tab) with the given title exists; returns the sheetId.
 * If it doesn't exist it creates it with a header row.
 */
async function ensureSheet(
  sheets: ReturnType<typeof google.sheets>,
  spreadsheetId: string,
  title: string,
  headers: string[],
): Promise<number> {
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const existing = meta.data.sheets?.find((s) => s.properties?.title === title);
  if (existing) return existing.properties!.sheetId!;

  // Create the sheet tab
  const res = await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [{ addSheet: { properties: { title } } }],
    },
  });
  const newSheetId = res.data.replies?.[0]?.addSheet?.properties?.sheetId ?? 0;

  // Write header row
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${title}!A1`,
    valueInputOption: 'RAW',
    requestBody: { values: [headers] },
  });

  return newSheetId;
}

// ─── Individual Registrations ─────────────────────────────────────────────────

const INDIVIDUAL_HEADERS = [
  'Application ID', 'Submitted At', 'Delegation Type', 'Committee', 'Portfolio',
  'Payment Method', 'Payment Reference', 'Has Payment Proof', 'Amount Payable (₹)',
  // Delegate 1
  'D1 Name', 'D1 Email', 'D1 Phone', 'D1 Grade', 'D1 Nationality', 'D1 Experience', 'D1 Institution',
  // Delegate 2
  'D2 Name', 'D2 Email', 'D2 Phone', 'D2 Grade', 'D2 Nationality', 'D2 Experience', 'D2 Institution',
];

export async function appendIndividualRow(row: IndividualSheetRow): Promise<void> {
  if (!isConfigured()) {
    console.log('[Sheets] Not configured — skipping individual row append.');
    return;
  }
  try {
    const auth = buildAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID!;
    const TAB = 'Individual Registrations';

    await ensureSheet(sheets, spreadsheetId, TAB, INDIVIDUAL_HEADERS);

    const values = [[
      row.applicationId,
      row.submittedAt,
      row.delegationType,
      row.committee,
      row.portfolio,
      row.paymentMethod,
      row.paymentReference,
      row.hasPaymentProof ? 'Yes' : 'No',
      row.amountPayable,
      // D1
      row.d1Name, row.d1Email, row.d1Phone, row.d1Grade,
      row.d1Nationality, row.d1Experience, row.d1Institution,
      // D2 (blank for single)
      row.d2Name ?? '', row.d2Email ?? '', row.d2Phone ?? '', row.d2Grade ?? '',
      row.d2Nationality ?? '', row.d2Experience ?? '', row.d2Institution ?? '',
    ]];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${TAB}!A1`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values },
    });
    console.log('[Sheets] Individual row appended:', row.applicationId);
  } catch (err) {
    // Never block a registration due to Sheets errors.
    console.error('[Sheets] Failed to append individual row:', err);
  }
}

// ─── Institutional Registrations ──────────────────────────────────────────────

const INSTITUTIONAL_HEADERS = [
  'Application ID', 'Submitted At', 'Institution Name',
  'Teacher Name', 'Teacher Email', 'Teacher Phone',
  'Head Name', 'Head Email', 'Head Phone',
  'Payment Method', 'Payment Reference', 'Has Payment Proof', 'Amount Payable (₹)',
  'Spreadsheet File',
];

export async function appendInstitutionalRow(row: InstitutionalSheetRow): Promise<void> {
  if (!isConfigured()) {
    console.log('[Sheets] Not configured — skipping institutional row append.');
    return;
  }
  try {
    const auth = buildAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID!;
    const TAB = 'Institutional Registrations';

    await ensureSheet(sheets, spreadsheetId, TAB, INSTITUTIONAL_HEADERS);

    const values = [[
      row.applicationId,
      row.submittedAt,
      row.institutionName,
      row.teacherName, row.teacherEmail, row.teacherPhone,
      row.headName, row.headEmail, row.headPhone,
      row.paymentMethod,
      row.paymentReference,
      row.hasPaymentProof ? 'Yes' : 'No',
      row.amountPayable,
      row.spreadsheetFileName,
    ]];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${TAB}!A1`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values },
    });
    console.log('[Sheets] Institutional row appended:', row.applicationId);
  } catch (err) {
    console.error('[Sheets] Failed to append institutional row:', err);
  }
}
