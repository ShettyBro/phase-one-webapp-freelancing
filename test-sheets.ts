import * as fs from 'fs';
import { JWT } from 'google-auth-library';

// Manually parse .env
const envFile = fs.readFileSync('.env', 'utf-8');
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    let [_, key, val] = match;
    key = key.trim();
    val = val.trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
});

const SHEET_ID = process.env.GOOGLE_SHEETS_ID!;

async function getClient(): Promise<JWT> {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON!;
  const creds = JSON.parse(raw);
  const client = new JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return client;
}

async function request(client: JWT, method: string, path: string, body?: any) {
  const token = await client.getAccessToken();
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${token.token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${text}`);
  return JSON.parse(text);
}

async function main() {
  console.log('=== Google Sheets Diagnostic ===\n');
  console.log(`Sheet ID : ${SHEET_ID}`);
  console.log(`Sheet URL: https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit\n`);

  const client = await getClient();
  console.log('✅ Auth OK - service account authenticated\n');

  // 1. List all tabs
  const meta = await request(client, 'GET', '');
  const tabs: string[] = meta.sheets.map((s: any) => s.properties.title);
  console.log('📋 Tabs found in your sheet:');
  tabs.forEach((t, i) => console.log(`   ${i + 1}. "${t}"`));

  // 2. Read the Individual Registrations tab if it exists
  const TARGET_TAB = 'Individual Registrations';
  if (tabs.includes(TARGET_TAB)) {
    const data = await request(client, 'GET', `/values/${encodeURIComponent(TARGET_TAB)}`);
    const rows: any[][] = data.values || [];
    console.log(`\n✅ "${TARGET_TAB}" tab has ${rows.length} row(s):`);
    rows.forEach((row, i) => console.log(`   Row ${i + 1}: ${row.slice(0, 5).join(' | ')}...`));
  } else {
    console.log(`\n⚠️  "${TARGET_TAB}" tab does not exist yet.`);
    console.log('Writing a test row now...\n');

    // Create it
    await request(client, 'POST', ':batchUpdate', {
      requests: [{ addSheet: { properties: { title: TARGET_TAB } } }],
    });

    const headers = [
      'Application ID', 'Submitted At', 'Delegation Type', 'Committee', 'Portfolio',
      'Payment Method', 'Payment Reference', 'Has Payment Proof', 'Amount (₹)',
      'D1 Name', 'D1 Email', 'D1 Phone', 'D1 Grade', 'D1 Nationality', 'D1 Experience',
    ];

    await request(client, 'POST',
      `/values/${encodeURIComponent(TARGET_TAB)}!A1:append?valueInputOption=RAW`, {
      values: [headers],
    });

    await request(client, 'POST',
      `/values/${encodeURIComponent(TARGET_TAB)}!A1:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, {
      values: [[
        `TEST-${Date.now()}`, new Date().toISOString(), 'SINGLE', 'UNHRC', 'Test Country',
        'OFFLINE', '', 'No', 1500,
        'John Doe', 'john@example.com', '+91999', 10, 'Indian', 'None',
      ]],
    });

    console.log('✅ Tab created and test row written!');
  }

  console.log(`\n👉 Open your sheet and look for the "${TARGET_TAB}" tab at the bottom.`);
  console.log(`   URL: https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`);
}

main().catch(err => {
  console.error('\n❌ ERROR:', err.message);
});
