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

import { JWT } from 'google-auth-library';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface IndividualSheetRow {
  applicationId: string;
  submittedAt: string;        // ISO date string
  delegationType: string;     // SINGLE | DOUBLE
  committee: string;
  portfolio: string;
  committee2?: string;
  portfolio2?: string;
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

let cachedClient: JWT | null = null;
async function getClient(): Promise<JWT> {
  if (cachedClient) return cachedClient;
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON!;
  const creds = JSON.parse(raw);
  const client = new JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  cachedClient = client;
  return client;
}

async function requestSheetsApi(client: JWT, method: string, path: string, body?: any) {
  const token = await client.getAccessToken();
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${process.env.GOOGLE_SHEETS_ID}${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${token.token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Sheets API Error: ${res.status} ${res.statusText} - ${errorText}`);
  }
  return res.json();
}

/**
 * Ensures a sheet (tab) with the given title exists.
 * If it doesn't exist it creates it with a header row.
 */
async function ensureSheet(client: JWT, title: string, headers: string[]): Promise<void> {
  // Get spreadsheet metadata
  const meta = await requestSheetsApi(client, 'GET', '');
  const existing = meta.sheets?.find((s: any) => s.properties?.title === title);
  if (existing) return;

  // Create the sheet tab
  await requestSheetsApi(client, 'POST', ':batchUpdate', {
    requests: [{ addSheet: { properties: { title } } }],
  });

  // Write header row
  await requestSheetsApi(client, 'POST', `/values/${encodeURIComponent(title)}!A1:append?valueInputOption=RAW`, {
    values: [headers],
  });
}

// ─── Individual Registrations ─────────────────────────────────────────────────

const INDIVIDUAL_HEADERS = [
  'Application ID', 'Submitted At', 'Delegation Type', 'Committee 1', 'Portfolio 1', 'Committee 2', 'Portfolio 2',
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
    const client = await getClient();
    const TAB = 'Individual Registrations';

    await ensureSheet(client, TAB, INDIVIDUAL_HEADERS);

    const values = [[
      row.applicationId,
      row.submittedAt,
      row.delegationType,
      row.committee,
      row.portfolio,
      row.committee2 ?? '',
      row.portfolio2 ?? '',
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

    await requestSheetsApi(client, 'POST', `/values/${encodeURIComponent(TAB)}!A1:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, {
      values
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
    const client = await getClient();
    const TAB = 'Institutional Registrations';

    await ensureSheet(client, TAB, INSTITUTIONAL_HEADERS);

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

    await requestSheetsApi(client, 'POST', `/values/${encodeURIComponent(TAB)}!A1:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, {
      values
    });
    console.log('[Sheets] Institutional row appended:', row.applicationId);
  } catch (err) {
    console.error('[Sheets] Failed to append institutional row:', err);
  }
}
