import type { Handler } from '@netlify/functions';
import { prisma } from './_shared/prisma';
import { ok, fail, preflight, parseBody, clientInfo, setEvent } from './_shared/http';
import { generateUniqueApplicationId } from './_shared/applicationId';
import { sendInstitutionalConfirmation } from './_shared/email';
import { isEmail, isPhone, nonEmpty, validateFileRef, type FileRef } from './_shared/validation';
import { FEES } from './_shared/domain';
import { checkRateLimit, RATE_LIMIT_RESPONSE } from './_shared/rateLimit';
import { appendInstitutionalRow } from './_shared/googleSheets';

interface Contact {
  name?: string;
  email?: string;
  phone?: string;
}

interface InstitutionalPayload {
  institutionName?: string;
  teacher?: Contact;
  head?: Contact;
  spreadsheet?: FileRef;
  paymentMethod?: 'ONLINE' | 'OFFLINE';   // NEW — Offline = at desk
  paymentReference?: string;              // NEW — UTR for ONLINE
  paymentProof?: FileRef;                 // NEW — NEFT screenshot for ONLINE
}

function validateContact(c: Contact | undefined, label: string): string | null {
  if (!c || !nonEmpty(c.name)) return `${label}: name is required.`;
  if (!isEmail(c.email)) return `${label}: a valid email is required.`;
  if (!isPhone(c.phone)) return `${label}: a valid phone number is required.`;
  return null;
}

/**
 * POST /api/register-institutional
 *
 * Changes:
 *  - paymentMethod (ONLINE | OFFLINE) is now required.
 *  - For ONLINE: paymentReference (UTR) + paymentProof (screenshot) are required.
 *  - For OFFLINE: payment is collected at desk — no proof needed.
 *  - On success, appends a row to Google Sheets (best-effort).
 */
export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight(event);
  setEvent(event);
  if (event.httpMethod !== 'POST') return fail(405, 'Method not allowed.');

  // Rate-limit: 3 per IP per hour.
  const { ip } = clientInfo(event);
  if (!checkRateLimit(`register-institutional:${ip}`, 3, 60 * 60 * 1000)) {
    return RATE_LIMIT_RESPONSE;
  }

  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'registration_open' } });
    if (setting && setting.value !== 'true') {
      return fail(403, 'Registrations are currently closed.');
    }

    const body = parseBody<InstitutionalPayload>(event);

    // ── Validate contacts & spreadsheet ──
    if (!nonEmpty(body.institutionName)) return fail(400, 'Institution name is required.');
    const tErr = validateContact(body.teacher, 'Teacher In Charge');
    if (tErr) return fail(400, tErr);
    const hErr = validateContact(body.head, 'Head Delegate');
    if (hErr) return fail(400, hErr);
    const fErr = validateFileRef(body.spreadsheet, 'Delegate spreadsheet');
    if (fErr) return fail(400, fErr);

    // ── Validate payment ──
    if (body.paymentMethod !== 'ONLINE' && body.paymentMethod !== 'OFFLINE') {
      return fail(400, 'Payment method is required (ONLINE or OFFLINE).');
    }
    if (body.paymentMethod === 'ONLINE') {
      if (!body.paymentReference || !body.paymentReference.trim()) {
        return fail(400, 'A transaction reference number (UTR) is required for online payments.');
      }
      const proofErr = validateFileRef(body.paymentProof, 'Payment proof screenshot');
      if (proofErr) return fail(400, proofErr);
    }

    const teacherEmail = body.teacher!.email!.trim().toLowerCase();
    const teacherPhone = body.teacher!.phone!.trim();

    // ── Duplicate prevention ──
    const existing = await prisma.registration.findFirst({
      where: { OR: [{ teacherEmail }, { teacherPhone }] },
      select: { applicationId: true },
    });
    if (existing) {
      return fail(409, 'An institutional registration already exists for this teacher email or phone. Please contact the organizers if you need assistance.', {
        duplicate: true,
        applicationId: existing.applicationId,
      });
    }

    const applicationId = await generateUniqueApplicationId();

    // Build file records.
    const fileCreates: {
      kind: 'SPREADSHEET' | 'PAYMENT_PROOF';
      r2Key: string;
      fileName: string;
      mimeType: string;
      size: number;
    }[] = [
      {
        kind: 'SPREADSHEET' as const,
        r2Key: body.spreadsheet!.key!,
        fileName: body.spreadsheet!.fileName!,
        mimeType: body.spreadsheet!.mimeType || 'application/octet-stream',
        size: body.spreadsheet!.size || 0,
      },
    ];

    if (body.paymentMethod === 'ONLINE' && body.paymentProof) {
      fileCreates.push({
        kind: 'PAYMENT_PROOF' as const,
        r2Key: body.paymentProof.key!,
        fileName: body.paymentProof.fileName!,
        mimeType: body.paymentProof.mimeType || 'application/octet-stream',
        size: body.paymentProof.size || 0,
      });
    }

    const created = await prisma.registration.create({
      data: {
        applicationId,
        type: 'INSTITUTIONAL',
        institutionName: body.institutionName!.trim(),
        teacherName: body.teacher!.name!.trim(),
        teacherEmail,
        teacherPhone,
        headName: body.head!.name!.trim(),
        headEmail: body.head!.email!.trim().toLowerCase(),
        headPhone: body.head!.phone!.trim(),
        amountPayable: FEES.INSTITUTIONAL,
        paymentMethod: body.paymentMethod,
        paymentReference: body.paymentMethod === 'ONLINE' ? body.paymentReference?.trim() : null,
        files: { create: fileCreates },
      },
      select: { applicationId: true, submittedAt: true },
    });

    // Confirmation emails — best-effort.
    await sendInstitutionalConfirmation(
      teacherEmail,
      body.head?.email?.trim().toLowerCase() || null,
      {
        applicationId: created.applicationId,
        name: body.teacher!.name!.trim(),
        registrationType: 'Institutional',
        institutionName: body.institutionName!.trim(),
        headName: body.head!.name!.trim(),
        headEmail: body.head!.email!.trim().toLowerCase(),
        amountPayable: FEES.INSTITUTIONAL,
      },
    ).catch((e) => console.error('email failed:', e));

    // Google Sheets — best-effort.
    appendInstitutionalRow({
      applicationId: created.applicationId,
      submittedAt: created.submittedAt.toISOString(),
      institutionName: body.institutionName!.trim(),
      teacherName: body.teacher!.name!.trim(),
      teacherEmail,
      teacherPhone,
      headName: body.head!.name!.trim(),
      headEmail: body.head!.email!.trim().toLowerCase(),
      headPhone: body.head!.phone!.trim(),
      paymentMethod: body.paymentMethod,
      paymentReference: body.paymentMethod === 'ONLINE' ? (body.paymentReference?.trim() ?? '') : '',
      hasPaymentProof: !!(body.paymentMethod === 'ONLINE' && body.paymentProof),
      amountPayable: FEES.INSTITUTIONAL,
      spreadsheetFileName: body.spreadsheet!.fileName!,
    }).catch(() => { /* already logged inside */ });

    return ok({
      applicationId: created.applicationId,
      registrationType: 'INSTITUTIONAL',
      amountPayable: FEES.INSTITUTIONAL,
    });
  } catch (err: unknown) {
    if (typeof err === 'object' && err && (err as { code?: string }).code === 'P2002') {
      return fail(409, 'An institutional registration already exists for this teacher email or phone.', { duplicate: true });
    }
    console.error('register-institutional error:', err);
    return fail(500, 'Registration failed. Please try again.');
  }
};
