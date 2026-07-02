import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export function emailConfigured(): boolean {
  return !!(process.env.BREVO_SMTP_USER && process.env.BREVO_SMTP_PASS);
}

/** Escapes HTML so registrant-supplied values can't inject markup into the email. */
function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

let _transporter: Transporter | null = null;
function getTransporter(): Transporter {
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

// Netlify sets URL automatically; allow override via SITE_URL env var.
function siteUrl(): string {
  return (process.env.SITE_URL || process.env.URL || 'https://comun2026.netlify.app').replace(/\/$/, '');
}

/**
 * Sends mail trying EMAIL_FROM first, then falling back to the authenticated
 * SMTP user as sender (Brevo rejects unverified From addresses). Mirrors the
 * working scripts/test-email.mjs. Never throws to the caller's flow.
 */
async function sendWithFallback(to: string, subject: string, html: string): Promise<void> {
  const primaryFrom = process.env.EMAIL_FROM || 'CoMUN 2026 <noreply@cottons.edu>';
  try {
    await getTransporter().sendMail({ from: primaryFrom, to, subject, html });
  } catch (err) {
    console.error('Email send failed with EMAIL_FROM, retrying with SMTP user:', (err as Error).message);
    await getTransporter().sendMail({ from: process.env.BREVO_SMTP_USER, to, subject, html });
  }
}

export interface RegistrationEmailData {
  applicationId: string;
  /** Primary recipient's first name */
  name: string;
  registrationType: string; // e.g. "Individual — Single Delegation"
  committee?: string | null;
  portfolio?: string | null;
  delegationType?: 'SINGLE' | 'DOUBLE' | null;
  /** For double delegations — second delegate's name */
  delegate2Name?: string | null;
  /** Institutional extras */
  institutionName?: string | null;
  headName?: string | null;
  headEmail?: string | null;
  amountPayable?: number;
  /** Link to retrieve the PDF */
  retrieveUrl?: string;
}

// ── Premium HTML template ────────────────────────────────────────────────────
function buildHtml(data: RegistrationEmailData): string {
  const base = siteUrl();
  const logoUrl = `${base}/logo.png`;
  const doveUrl = `${base}/dove_peace.png`;

  const isDouble = data.delegationType === 'DOUBLE';
  const isInstitutional = data.registrationType === 'Institutional';
  const feeText = data.amountPayable && data.amountPayable > 0
    ? `INR ${data.amountPayable.toLocaleString()}`
    : 'To be settled at the Registration Desk';

  const infoRows = [
    ['Application ID', `<strong style="color:#FFD000;letter-spacing:1px;">${esc(data.applicationId)}</strong>`],
    ['Registration Type', esc(data.registrationType)],
    ...(data.committee ? [['Committee', esc(data.committee)]] : []),
    ...(data.portfolio ? [['Portfolio', esc(data.portfolio)]] : []),
    ...(isDouble && data.delegate2Name ? [['Delegate 2', esc(data.delegate2Name)]] : []),
    ...(isInstitutional && data.institutionName ? [['Institution', esc(data.institutionName)]] : []),
    ...(isInstitutional && data.headName ? [['Head Delegate', esc(data.headName)]] : []),
    ['Amount Payable', esc(feeText)],
  ] as [string, string][];

  const tableRows = infoRows.map(([label, value]) => `
    <tr>
      <td style="padding:9px 16px;font-size:12px;color:#9a9a9a;text-transform:uppercase;letter-spacing:0.08em;white-space:nowrap;border-bottom:1px solid rgba(255,255,255,0.05);">${label}</td>
      <td style="padding:9px 16px;font-size:13px;color:#F5F0E8;text-align:right;border-bottom:1px solid rgba(255,255,255,0.05);">${value}</td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>CoMUN 2026 — Registration Confirmed</title>
</head>
<body style="margin:0;padding:0;background:#040A15;font-family:Arial,Helvetica,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#040A15;padding:32px 16px;">
    <tr><td align="center">

      <!-- Card -->
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#0A1628;border:1px solid rgba(255,208,0,0.20);border-radius:10px;overflow:hidden;">

        <!-- Top gradient accent bar -->
        <tr>
          <td style="height:4px;background:linear-gradient(90deg,#6B1A1A 0%,#FFD000 50%,#6B1A1A 100%);font-size:0;">&nbsp;</td>
        </tr>

        <!-- Logo header -->
        <tr>
          <td align="center" style="padding:36px 32px 24px;background:linear-gradient(180deg,rgba(255,208,0,0.06) 0%,transparent 100%);">
            <img src="${logoUrl}" alt="CoMUN 2026" width="180" height="auto"
              style="display:block;max-width:180px;filter:drop-shadow(0 0 18px rgba(255,208,0,0.35));" />
            <p style="margin:14px 0 0;font-size:11px;letter-spacing:0.25em;color:#9a9a9a;text-transform:uppercase;">
              Cottons Model United Nations · 12th Edition
            </p>
          </td>
        </tr>

        <!-- Gold divider -->
        <tr>
          <td style="padding:0 32px;">
            <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(255,208,0,0.4),transparent);"></div>
          </td>
        </tr>

        <!-- Hero message -->
        <tr>
          <td style="padding:32px 32px 8px;">
            <p style="margin:0 0 8px;font-size:22px;font-weight:bold;color:#FFD000;font-family:Georgia,'Times New Roman',serif;">
              Registration Confirmed ✓
            </p>
            <p style="margin:0;font-size:15px;color:#F5F0E8;line-height:1.7;">
              Dear <strong>${esc(data.name)}</strong>,
            </p>
            <p style="margin:12px 0 0;font-size:14px;color:#B0A898;line-height:1.8;">
              Your registration for <strong style="color:#F5F0E8;">CoMUN 2026</strong> has been
              successfully received. Please find your registration details below. Keep your
              <strong style="color:#FFD000;">Application ID</strong> safe — you will need it
              at the Registration Desk.
            </p>
          </td>
        </tr>

        <!-- Details table -->
        <tr>
          <td style="padding:24px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0"
              style="background:rgba(255,208,0,0.04);border:1px solid rgba(255,208,0,0.15);border-radius:6px;border-collapse:collapse;overflow:hidden;">
              ${tableRows}
            </table>
          </td>
        </tr>

        <!-- Important note -->
        <tr>
          <td style="padding:0 32px 28px;">
            <table width="100%" cellpadding="0" cellspacing="0"
              style="background:rgba(145,38,38,0.12);border-left:3px solid #912626;border-radius:0 4px 4px 0;padding:16px 20px;">
              <tr>
                <td style="padding:14px 18px;">
                  <p style="margin:0;font-size:13px;color:#cfcfcf;line-height:1.75;">
                    📋 <strong style="color:#F5F0E8;">Next Steps</strong><br/>
                    Download and print your registration PDF. Bring it along with a valid ID on
                    conference day. The applicable fee is payable at the Registration Desk.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        ${data.retrieveUrl ? `
        <!-- Retrieve PDF button -->
        <tr>
          <td align="center" style="padding:0 32px 32px;">
            <a href="${esc(data.retrieveUrl)}"
              style="display:inline-block;padding:13px 34px;background:linear-gradient(135deg,#FFD000,#E6A800);color:#040A15;font-size:13px;font-weight:bold;text-decoration:none;border-radius:4px;letter-spacing:0.08em;text-transform:uppercase;">
              Download Registration PDF
            </a>
          </td>
        </tr>` : ''}

        <!-- Gold divider -->
        <tr>
          <td style="padding:0 32px;">
            <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(255,208,0,0.25),transparent);"></div>
          </td>
        </tr>

        <!-- Dove footer -->
        <tr>
          <td align="center" style="padding:28px 32px 34px;">
            <img src="${doveUrl}" alt="" width="48" height="auto"
              style="display:block;margin:0 auto 12px;opacity:0.7;filter:drop-shadow(0 0 12px rgba(91,184,212,0.35));" />
            <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:14px;color:#FFD000;">
              Peace Over Power
            </p>
            <p style="margin:8px 0 0;font-size:11px;color:#6f6f6f;line-height:1.6;">
              CoMUN 2026 · Cottons Model United Nations<br/>
              This is an automated confirmation — please do not reply to this email.
            </p>
          </td>
        </tr>

      </table>
      <!-- /Card -->

    </td></tr>
  </table>

</body>
</html>`;
}

/**
 * Individual registration confirmation. `data.retrieveUrl` optional.
 */
export async function sendRegistrationConfirmation(
  to: string,
  data: RegistrationEmailData,
): Promise<void> {
  if (!emailConfigured()) {
    console.warn('Brevo SMTP not configured — skipping confirmation email.');
    return;
  }
  const subject = `CoMUN 2026 — Registration Confirmed (${data.applicationId})`;
  await sendWithFallback(to, subject, buildHtml(data));
}

/**
 * Institutional confirmation — sends to the teacher, and (if different) the head delegate.
 */
export async function sendInstitutionalConfirmation(
  teacherEmail: string,
  headEmail: string | null,
  data: RegistrationEmailData,
): Promise<void> {
  if (!emailConfigured()) {
    console.warn('Brevo SMTP not configured — skipping confirmation email.');
    return;
  }
  const subject = `CoMUN 2026 — Registration Confirmed (${data.applicationId})`;
  const html = buildHtml(data);

  await sendWithFallback(teacherEmail, subject, html);
  if (headEmail && headEmail !== teacherEmail) {
    await sendWithFallback(headEmail, subject, html).catch((e) =>
      console.error('email failed (head delegate):', e),
    );
  }
}
