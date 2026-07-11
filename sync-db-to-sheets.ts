/**
 * sync-db-to-sheets.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * One-shot migration script: reads ALL existing registrations from the Neon
 * PostgreSQL database and appends them to Google Sheets.
 *
 * Run from the project root:
 *   npx tsx sync-db-to-sheets.ts
 *
 * Safe to run multiple times — it clears the tabs first so you never get
 * duplicate rows.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import * as fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { JWT } from 'google-auth-library';

// ── 1. Load .env ───────────────────────────────────────────────────────────
const envFile = fs.readFileSync('.env', 'utf-8');
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=#][^=]*)=(.*)/);
  if (match) {
    let [, key, val] = match;
    key = key.trim();
    val = val.trim();
    if ((val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
});

// ── 2. Validate env ────────────────────────────────────────────────────────
if (!process.env.GOOGLE_SHEETS_ID) {
  console.error('❌ GOOGLE_SHEETS_ID is not set in .env');
  process.exit(1);
}
if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
  console.error('❌ GOOGLE_SERVICE_ACCOUNT_JSON is not set in .env');
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set in .env');
  process.exit(1);
}

const SHEET_ID = process.env.GOOGLE_SHEETS_ID;
const prisma = new PrismaClient();

// ── 3. Google Sheets helpers ───────────────────────────────────────────────
async function getToken(): Promise<string> {
  const creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!);
  const client = new JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const token = await client.getAccessToken();
  return token.token!;
}

async function sheetsRequest(token: string, method: string, path: string, body?: any) {
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Sheets API ${res.status}: ${text}`);
  return JSON.parse(text);
}

async function ensureTab(token: string, existingTabs: string[], title: string) {
  if (!existingTabs.includes(title)) {
    await sheetsRequest(token, 'POST', ':batchUpdate', {
      requests: [{ addSheet: { properties: { title } } }],
    });
    console.log(`  Created tab: "${title}"`);
  }
}

async function clearTab(token: string, title: string) {
  await sheetsRequest(token, 'POST', `/values/${encodeURIComponent(title)}:clear`, {});
}

async function writeRows(token: string, title: string, rows: any[][]) {
  if (rows.length === 0) return;
  await sheetsRequest(
    token, 'PUT',
    `/values/${encodeURIComponent(title)}!A1?valueInputOption=RAW`,
    { values: rows },
  );
}

// ── 4. Column definitions ──────────────────────────────────────────────────
const INDIVIDUAL_HEADERS = [
  'Application ID', 'Submitted At', 'Delegation Type', 'Committee', 'Portfolio',
  'Payment Method', 'Payment Reference (UTR)', 'Has Payment Proof', 'Amount Payable (₹)',
  'D1 Name', 'D1 Email', 'D1 Phone', 'D1 Grade', 'D1 Nationality', 'D1 Experience', 'D1 Institution',
  'D2 Name', 'D2 Email', 'D2 Phone', 'D2 Grade', 'D2 Nationality', 'D2 Experience', 'D2 Institution',
];

const INSTITUTIONAL_HEADERS = [
  'Application ID', 'Submitted At', 'Institution Name',
  'Teacher Name', 'Teacher Email', 'Teacher Phone',
  'Head Delegate Name', 'Head Delegate Email', 'Head Delegate Phone',
  'Payment Method', 'Payment Reference (UTR)', 'Has Payment Proof', 'Amount Payable (₹)',
  'Spreadsheet File',
];

// ── 5. Main ────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   DB → Google Sheets Sync Script       ║');
  console.log('╚════════════════════════════════════════╝\n');

  // Auth
  console.log('🔑 Authenticating with Google Sheets...');
  const token = await getToken();
  console.log('✅ Authenticated\n');

  // Get existing tabs
  const meta = await sheetsRequest(token, 'GET', '');
  const existingTabs: string[] = meta.sheets.map((s: any) => s.properties.title);
  console.log(`📋 Existing tabs: ${existingTabs.join(', ')}\n`);

  // ── Individual Registrations ──────────────────────────────────────────
  console.log('📥 Loading INDIVIDUAL registrations from DB...');
  const individuals = await prisma.registration.findMany({
    where: { type: 'INDIVIDUAL' },
    include: {
      delegates: { orderBy: { position: 'asc' } },
      files: { where: { kind: 'PAYMENT_PROOF' } },
    },
    orderBy: { submittedAt: 'asc' },
  });
  console.log(`   Found ${individuals.length} individual registration(s)`);

  const individualRows: any[][] = [INDIVIDUAL_HEADERS];
  for (const reg of individuals) {
    const d1 = reg.delegates.find(d => d.position === 1);
    const d2 = reg.delegates.find(d => d.position === 2);
    const hasProof = reg.files.length > 0;

    individualRows.push([
      reg.applicationId,
      reg.submittedAt.toISOString(),
      reg.delegationType ?? '',
      reg.committee ?? '',
      reg.portfolio ?? '',
      reg.paymentMethod ?? '',
      reg.paymentReference ?? '',
      hasProof ? 'Yes' : 'No',
      reg.amountPayable,
      // D1
      d1?.name ?? '', d1?.email ?? '', d1?.phone ?? '',
      d1?.grade ?? '', d1?.nationality ?? '', d1?.experience ?? '', d1?.institution ?? '',
      // D2
      d2?.name ?? '', d2?.email ?? '', d2?.phone ?? '',
      d2?.grade ?? '', d2?.nationality ?? '', d2?.experience ?? '', d2?.institution ?? '',
    ]);
  }

  await ensureTab(token, existingTabs, 'Individual Registrations');
  await clearTab(token, 'Individual Registrations');
  await writeRows(token, 'Individual Registrations', individualRows);
  console.log(`✅ Individual Registrations tab updated (${individuals.length} rows + header)\n`);

  // ── Institutional Registrations ───────────────────────────────────────
  console.log('📥 Loading INSTITUTIONAL registrations from DB...');
  const institutionals = await prisma.registration.findMany({
    where: { type: 'INSTITUTIONAL' },
    include: {
      files: true,
    },
    orderBy: { submittedAt: 'asc' },
  });
  console.log(`   Found ${institutionals.length} institutional registration(s)`);

  const institutionalRows: any[][] = [INSTITUTIONAL_HEADERS];
  for (const reg of institutionals) {
    const spreadsheet = reg.files.find(f => f.kind === 'SPREADSHEET');
    const proof = reg.files.find(f => f.kind === 'PAYMENT_PROOF');

    institutionalRows.push([
      reg.applicationId,
      reg.submittedAt.toISOString(),
      reg.institutionName ?? '',
      reg.teacherName ?? '', reg.teacherEmail ?? '', reg.teacherPhone ?? '',
      reg.headName ?? '', reg.headEmail ?? '', reg.headPhone ?? '',
      reg.paymentMethod ?? '',
      reg.paymentReference ?? '',
      proof ? 'Yes' : 'No',
      reg.amountPayable,
      spreadsheet?.fileName ?? '',
    ]);
  }

  await ensureTab(token, existingTabs, 'Institutional Registrations');
  await clearTab(token, 'Institutional Registrations');
  await writeRows(token, 'Institutional Registrations', institutionalRows);
  console.log(`✅ Institutional Registrations tab updated (${institutionals.length} rows + header)\n`);

  // ── Summary ───────────────────────────────────────────────────────────
  const total = individuals.length + institutionals.length;
  console.log('════════════════════════════════════════');
  console.log(`🎉 Sync complete! ${total} registration(s) exported.`);
  console.log(`📊 Sheet: https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`);
  console.log('════════════════════════════════════════\n');
}

main()
  .catch(err => {
    console.error('\n❌ Error:', err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
