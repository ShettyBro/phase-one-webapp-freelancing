import type { Handler } from '@netlify/functions';
import { prisma } from './_shared/prisma';
import { ok, fail, preflight, parseBody, clientInfo , setEvent } from './_shared/http';
import { generateUniqueApplicationId } from './_shared/applicationId';
import { sendRegistrationConfirmation } from './_shared/email';
import { validateDelegate, validateFileRef, type DelegateInput, type FileRef } from './_shared/validation';
import { COMMITTEE_CODES, DOUBLE_DELEGATION_COMMITTEE, FEES } from './_shared/domain';
import { checkRateLimit, RATE_LIMIT_RESPONSE } from './_shared/rateLimit';

interface IndividualPayload {
  delegationType?: 'SINGLE' | 'DOUBLE';
  committee?: string;
  portfolio?: string;
  delegates?: DelegateInput[];
  idProofs?: FileRef[];
  paymentMethod?: 'ONLINE' | 'OFFLINE';
  paymentReference?: string;
}

async function findDuplicate(emails: string[], phones: string[]) {
  const dup = await prisma.delegate.findFirst({
    where: { OR: [{ email: { in: emails } }, { phone: { in: phones } }] },
    include: { registration: { select: { applicationId: true } } },
  });
  return dup?.registration?.applicationId ?? null;
}

/**
 * POST /api/register-individual
 * Single or Double (DISEC-only) delegation. Files must already be uploaded to
 * R2 (via /api/uploads-sign); their keys are passed in `idProofs`.
 */
export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight(event);
  setEvent(event);
  if (event.httpMethod !== 'POST') return fail(405, 'Method not allowed.');

  // Fix #4 — rate-limit registration: 5 per IP per hour.
  const { ip } = clientInfo(event);
  if (!checkRateLimit(`register-individual:${ip}`, 5, 60 * 60 * 1000)) {
    return RATE_LIMIT_RESPONSE;
  }

  try {
    // Registrations must be open.
    const setting = await prisma.setting.findUnique({ where: { key: 'registration_open' } });
    if (setting && setting.value !== 'true') {
      return fail(403, 'Registrations are currently closed.');
    }

    const body = parseBody<IndividualPayload>(event);
    const isDouble = body.delegationType === 'DOUBLE';

    if (body.delegationType !== 'SINGLE' && body.delegationType !== 'DOUBLE') {
      return fail(400, 'delegationType must be SINGLE or DOUBLE.');
    }
    if (!body.committee || !COMMITTEE_CODES.includes(body.committee as never)) {
      return fail(400, 'A valid committee is required.');
    }
    if (isDouble && body.committee !== DOUBLE_DELEGATION_COMMITTEE) {
      return fail(400, `Double Delegation is only available for ${DOUBLE_DELEGATION_COMMITTEE}.`);
    }
    if (!body.portfolio || !body.portfolio.trim()) {
      return fail(400, 'A portfolio preference is required.');
    }
    if (body.paymentMethod !== 'ONLINE' && body.paymentMethod !== 'OFFLINE') {
      return fail(400, 'Invalid payment method.');
    }
    if (body.paymentMethod === 'ONLINE' && (!body.paymentReference || !body.paymentReference.trim())) {
      return fail(400, 'A transaction reference number is required for online payments.');
    }

    const delegates = body.delegates ?? [];
    const idProofs = body.idProofs ?? [];
    const expected = isDouble ? 2 : 1;
    if (delegates.length !== expected) return fail(400, `Expected ${expected} delegate(s).`);
    if (idProofs.length !== expected) return fail(400, `Expected ${expected} ID proof upload(s).`);

    for (let i = 0; i < expected; i++) {
      const dErr = validateDelegate(delegates[i], `Delegate ${i + 1}`);
      if (dErr) return fail(400, dErr);
      const fErr = validateFileRef(idProofs[i], `Delegate ${i + 1} ID proof`);
      if (fErr) return fail(400, fErr);
    }

    // ── Duplicate prevention (email / phone) ──
    const emails = delegates.map((d) => d.email!.trim().toLowerCase());
    const phones = delegates.map((d) => d.phone!.trim());

    // Fix B7 — for double delegation, the two delegates must be distinct people.
    // Catch it here with a clear message instead of hitting the DB unique
    // constraint and returning the generic "already exists" error.
    if (isDouble) {
      if (emails[0] === emails[1]) return fail(400, 'Delegate 1 and Delegate 2 must use different email addresses.');
      if (phones[0] === phones[1]) return fail(400, 'Delegate 1 and Delegate 2 must use different phone numbers.');
    }

    const existingAppId = await findDuplicate(emails, phones);
    if (existingAppId) {
      return fail(409, 'A registration already exists for this email or phone number. Please contact the organizers if you need assistance.', {
        duplicate: true,
        applicationId: existingAppId,
      });
    }

    const applicationId = await generateUniqueApplicationId();
    const amountPayable = isDouble ? FEES.INDIVIDUAL_DOUBLE : FEES.INDIVIDUAL_SINGLE;

    const created = await prisma.registration.create({
      data: {
        applicationId,
        type: 'INDIVIDUAL',
        delegationType: body.delegationType,
        committee: body.committee,
        portfolio: body.portfolio.trim(),
        amountPayable,
        paymentMethod: body.paymentMethod,
        paymentReference: body.paymentMethod === 'ONLINE' ? body.paymentReference?.trim() : null,
        delegates: {
          create: delegates.map((d, i) => ({
            position: i + 1,
            name: d.name!.trim(),
            email: emails[i],
            phone: phones[i],
            grade: d.grade!,
            nationality: d.nationality!.trim(),
            experience: d.experience!.trim(),
            institution: d.institution?.trim() || null,
          })),
        },
        files: {
          create: idProofs.map((f) => ({
            kind: 'ID_PROOF' as const,
            r2Key: f.key!,
            fileName: f.fileName!,
            mimeType: f.mimeType || 'application/octet-stream',
            size: f.size || 0,
          })),
        },
      },
      select: { applicationId: true },
    });

    // Confirmation email to the primary delegate (best-effort).
    const d2 = isDouble ? delegates[1] : null;
    await sendRegistrationConfirmation(emails[0], {
      applicationId: created.applicationId,
      name: delegates[0].name!.trim(),
      registrationType: `Individual — ${isDouble ? 'Double' : 'Single'} Delegation`,
      committee: body.committee,
      portfolio: body.portfolio?.trim(),
      delegationType: body.delegationType,
      delegate2Name: d2?.name?.trim() ?? null,
      amountPayable,
    }).catch((e) => console.error('email failed:', e));

    // For double delegation also notify the second delegate.
    if (isDouble && d2 && emails[1] && emails[1] !== emails[0]) {
      await sendRegistrationConfirmation(emails[1], {
        applicationId: created.applicationId,
        name: d2.name!.trim(),
        registrationType: 'Individual — Double Delegation',
        committee: body.committee,
        portfolio: body.portfolio?.trim(),
        delegationType: 'DOUBLE',
        delegate2Name: delegates[0].name!.trim(),
        amountPayable,
      }).catch((e) => console.error('email failed (delegate 2):', e));
    }

    return ok({
      applicationId: created.applicationId,
      registrationType: 'INDIVIDUAL',
      delegationType: body.delegationType,
      committee: body.committee,
      amountPayable,
    });
  } catch (err: unknown) {
    // Unique-constraint fallback (race on delegate email/phone).
    if (typeof err === 'object' && err && (err as { code?: string }).code === 'P2002') {
      // Best-effort: try to find the conflicting registration's application ID.
      const existingFallback = await prisma.delegate.findFirst({
        where: { OR: [
          { email: { in: [] } }, // race means we don't have emails here; just signal duplicate
        ]},
        include: { registration: { select: { applicationId: true } } },
      }).catch(() => null);
      return fail(409, 'A registration already exists for this email or phone number. Please contact the organizers.', {
        duplicate: true,
        applicationId: existingFallback?.registration?.applicationId ?? undefined,
      });
    }
    console.error('register-individual error:', err);
    return fail(500, 'Registration failed. Please try again.');
  }
};
