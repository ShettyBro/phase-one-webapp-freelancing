import type { Handler } from '@netlify/functions';
import { prisma } from './_shared/prisma';
import { ok, fail, preflight, parseBody, clientInfo , setEvent } from './_shared/http';
import { generateUniqueApplicationId } from './_shared/applicationId';
import { sendInstitutionalConfirmation } from './_shared/email';
import { isEmail, isPhone, nonEmpty, validateFileRef, type FileRef } from './_shared/validation';
import { FEES } from './_shared/domain';
import { checkRateLimit, RATE_LIMIT_RESPONSE } from './_shared/rateLimit';

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
}

function validateContact(c: Contact | undefined, label: string): string | null {
  if (!c || !nonEmpty(c.name)) return `${label}: name is required.`;
  if (!isEmail(c.email)) return `${label}: a valid email is required.`;
  if (!isPhone(c.phone)) return `${label}: a valid phone number is required.`;
  return null;
}

/**
 * POST /api/register-institutional
 * Stores teacher + head contacts, institution, and the uploaded delegate
 * spreadsheet (no parsing). Spreadsheet must already be uploaded to R2.
 */
export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight(event);
  setEvent(event);
  if (event.httpMethod !== 'POST') return fail(405, 'Method not allowed.');

  // Fix #4 — rate-limit registration: 3 per IP per hour.
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

    if (!nonEmpty(body.institutionName)) return fail(400, 'Institution name is required.');
    const tErr = validateContact(body.teacher, 'Teacher In Charge');
    if (tErr) return fail(400, tErr);
    const hErr = validateContact(body.head, 'Head Delegate');
    if (hErr) return fail(400, hErr);
    const fErr = validateFileRef(body.spreadsheet, 'Delegate spreadsheet');
    if (fErr) return fail(400, fErr);

    const teacherEmail = body.teacher!.email!.trim().toLowerCase();
    const teacherPhone = body.teacher!.phone!.trim();

    // ── Duplicate prevention (teacher email / phone) ──
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
        files: {
          create: [{
            kind: 'SPREADSHEET' as const,
            r2Key: body.spreadsheet!.key!,
            fileName: body.spreadsheet!.fileName!,
            mimeType: body.spreadsheet!.mimeType || 'application/octet-stream',
            size: body.spreadsheet!.size || 0,
          }],
        },
      },
      select: { applicationId: true },
    });

    // Confirmation emails — teacher + head delegate (best-effort).
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
