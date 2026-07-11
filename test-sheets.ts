import * as fs from 'fs';
import { appendIndividualRow } from './netlify/functions/_shared/googleSheets';

// Manually parse .env for the test script
const envFile = fs.readFileSync('.env', 'utf-8');
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    let [_, key, val] = match;
    key = key.trim();
    val = val.trim();
    if (val.startsWith('"') && val.endsWith('"') || val.startsWith("'") && val.endsWith("'")) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
});

async function testSheets() {
  console.log('Testing Google Sheets Integration...\n');

  if (!process.env.GOOGLE_SHEETS_ID) {
    console.error('❌ ERROR: GOOGLE_SHEETS_ID is empty in your .env file.');
    console.error('Please create a Google Sheet, copy its ID from the URL (e.g. 1aBcDeFgHiJkLmNoPqRsTuVwXyZ), paste it into .env, and run this again.');
    process.exit(1);
  }

  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    console.error('❌ ERROR: GOOGLE_SERVICE_ACCOUNT_JSON is missing.');
    process.exit(1);
  }

  console.log(`✅ Environment variables found.`);
  console.log(`Sheet ID: ${process.env.GOOGLE_SHEETS_ID}`);
  console.log(`Service Account Email: sheet-access@gold-blueprint-502118-u4.iam.gserviceaccount.com`);
  console.log(`\nMake sure you have shared your Google Sheet with the email above and given it "Editor" access!\n`);

  const testRow = {
    applicationId: `TEST-${Date.now()}`,
    submittedAt: new Date().toISOString(),
    delegationType: 'SINGLE',
    committee: 'UNHRC',
    portfolio: 'Test Delegate',
    paymentMethod: 'OFFLINE',
    paymentReference: '',
    hasPaymentProof: false,
    amountPayable: 1500,
    d1Name: 'John Doe',
    d1Email: 'john@example.com',
    d1Phone: '+919999999999',
    d1Grade: 10,
    d1Nationality: 'Indian',
    d1Experience: 'None',
    d1Institution: 'Test School'
  };

  try {
    console.log('Attempting to create/update the "Individual Registrations" tab with a test row...');
    await appendIndividualRow(testRow);
    console.log('\n🎉 SUCCESS! A test row was added to your Google Sheet.');
  } catch (err: any) {
    console.error('\n❌ FAILED to write to Google Sheets:');
    console.error(err.message);
  }
}

testSheets();
