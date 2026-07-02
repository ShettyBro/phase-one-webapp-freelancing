// Standalone Brevo SMTP test. Run: node --env-file=.env scripts/test-email.mjs
import nodemailer from 'nodemailer';

const TO = 'sudeepjs2001@gmail.com';

const host = process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com';
const port = Number(process.env.BREVO_SMTP_PORT || 587);
const user = process.env.BREVO_SMTP_USER;
const pass = process.env.BREVO_SMTP_PASS;
const from = process.env.EMAIL_FROM || 'CoMUN 2026 <no-reply@cottons.edu>';

console.log('SMTP config:', { host, port, user: user ? user.slice(0, 4) + '…' : '(missing)', from });

if (!user || !pass) {
  console.error('✗ BREVO_SMTP_USER / BREVO_SMTP_PASS missing in env.');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: false,
  auth: { user, pass },
});

const html = `
<div style="font-family:Inter,Arial,sans-serif;background:#070e1d;color:#F5F0E8;padding:32px;">
  <div style="max-width:560px;margin:0 auto;border:1px solid rgba(255,208,0,0.25);border-radius:8px;overflow:hidden;">
    <div style="height:4px;background:linear-gradient(90deg,#912626,#FFD000,#912626);"></div>
    <div style="padding:28px;">
      <h1 style="font-family:Georgia,serif;color:#FFD000;font-size:22px;margin:0 0 4px;">CoMUN 2026</h1>
      <p style="color:#8a8a8a;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin:0 0 20px;">Cottons Model United Nations</p>
      <p style="font-size:15px;">This is a <strong>test email</strong> confirming Brevo SMTP is configured correctly.</p>
      <p style="font-size:13px;color:#8a8a8a;margin-top:24px;font-style:italic;">Peace Over Power — CoMUN 2026</p>
    </div>
  </div>
</div>`;

async function trySend(fromAddr, label) {
  console.log(`\n→ Attempt (${label}) from: ${fromAddr}`);
  const info = await transporter.sendMail({
    from: fromAddr,
    to: TO,
    subject: 'CoMUN 2026 — Brevo SMTP Test',
    html,
  });
  console.log(`✓ Sent. messageId=${info.messageId}`);
  if (info.accepted?.length) console.log('  accepted:', info.accepted);
  if (info.rejected?.length) console.log('  rejected:', info.rejected);
}

try {
  console.log('\nVerifying SMTP connection…');
  await transporter.verify();
  console.log('✓ SMTP connection OK.');

  try {
    await trySend(from, 'EMAIL_FROM');
  } catch (e1) {
    console.error('✗ EMAIL_FROM send failed:', e1.message);
    // Fallback: use the authenticated login as the sender (usually a verified Brevo sender)
    await trySend(user, 'BREVO_SMTP_USER fallback');
  }
  console.log(`\nDone. Check ${TO} (including spam).`);
} catch (err) {
  console.error('\n✗ SMTP error:', err.message);
  if (err.response) console.error('  response:', err.response);
  process.exit(1);
}
