import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export function emailConfigured(): boolean {
  return !!(process.env.BREVO_SMTP_USER && process.env.BREVO_SMTP_PASS);
}

/** Escapes HTML so registrant-supplied values can't inject markup into the email. */
function esc(value: string): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

let _transporter: Transporter | null = null;
function transporter(): Transporter {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      host: process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com',
      port: Number(process.env.BREVO_SMTP_PORT || 587),
      secure: false,
      auth: { user: process.env.BREVO_SMTP_USER, pass: process.env.BREVO_SMTP_PASS },
    });
  }
  return _transporter;
}

interface RegistrationEmailData {
  applicationId: string;
  name: string;
  registrationType: string;
  committee?: string | null;
  retrieveUrl?: string;
}

/**
 * Sends the registration confirmation email (no PDF attached — spec).
 * No-op (logs) when SMTP isn't configured, so registration never fails on email.
 */
export async function sendRegistrationConfirmation(
  to: string,
  data: RegistrationEmailData,
): Promise<void> {
  if (!emailConfigured()) {
    console.warn('Brevo SMTP not configured — skipping confirmation email.');
    return;
  }

  const html = `
  <div style="font-family:Inter,Arial,sans-serif;background:#070e1d;color:#F5F0E8;padding:32px;">
    <div style="max-width:560px;margin:0 auto;border:1px solid rgba(255,208,0,0.25);border-radius:8px;overflow:hidden;">
      <div style="height:4px;background:linear-gradient(90deg,#912626,#FFD000,#912626);"></div>
      <div style="padding:28px;">
        <h1 style="font-family:Georgia,serif;color:#FFD000;font-size:22px;margin:0 0 4px;">CoMUN 2026</h1>
        <p style="color:#8a8a8a;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin:0 0 20px;">Cottons Model United Nations</p>
        <p style="font-size:15px;">Dear ${esc(data.name)},</p>
        <p style="font-size:14px;line-height:1.6;color:#cfcccc;">
          Your registration for <strong>CoMUN 2026</strong> has been received successfully.
        </p>
        <table style="width:100%;font-size:14px;margin:18px 0;border-collapse:collapse;">
          <tr><td style="padding:6px 0;color:#8a8a8a;">Application ID</td><td style="padding:6px 0;color:#FFD000;font-weight:bold;text-align:right;">${esc(data.applicationId)}</td></tr>
          <tr><td style="padding:6px 0;color:#8a8a8a;">Registration Type</td><td style="padding:6px 0;text-align:right;">${esc(data.registrationType)}</td></tr>
          ${data.committee ? `<tr><td style="padding:6px 0;color:#8a8a8a;">Committee</td><td style="padding:6px 0;text-align:right;">${esc(data.committee)}</td></tr>` : ''}
        </table>
        <p style="font-size:14px;line-height:1.6;color:#cfcccc;">
          Please keep your <strong>Application ID</strong> safe. Download and print your
          registration PDF and bring it with you during offline registration at the
          Registration Desk, where the applicable amount is payable.
        </p>
        ${data.retrieveUrl ? `<p style="font-size:13px;color:#8a8a8a;">You can re-download your PDF anytime at: <a href="${esc(data.retrieveUrl)}" style="color:#FFD000;">${esc(data.retrieveUrl)}</a></p>` : ''}
        <p style="font-size:13px;color:#8a8a8a;margin-top:24px;font-style:italic;">Peace Over Power — CoMUN 2026</p>
      </div>
    </div>
  </div>`;

  const subject = `CoMUN 2026 — Registration Confirmed (${data.applicationId})`;
  const primaryFrom = process.env.EMAIL_FROM || 'CoMUN 2026 <noreply@cottons.edu>';

  // Mirror scripts/test-email.mjs: try EMAIL_FROM first, then fall back to the
  // authenticated SMTP user as sender (Brevo rejects unverified From addresses).
  try {
    await transporter().sendMail({ from: primaryFrom, to, subject, html });
  } catch (err) {
    console.error('Email send failed with EMAIL_FROM, retrying with SMTP user:', (err as Error).message);
    await transporter().sendMail({ from: process.env.BREVO_SMTP_USER, to, subject, html });
  }
}
