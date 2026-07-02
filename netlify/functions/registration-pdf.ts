import type { Handler } from '@netlify/functions';
import { prisma } from './_shared/prisma';
import { fail, preflight, CORS, clientInfo } from './_shared/http';
import { buildRegistrationPdf, type PdfRegistration } from './_shared/pdf';
import { checkRateLimit, RATE_LIMIT_RESPONSE } from './_shared/rateLimit';

/** Strip everything except digits, then take the last 10 — handles +91 / 91 / 0 prefixes. */
const normalizePhone = (p: string) => p.replace(/\D/g, '').slice(-10);

/**
 * GET /api/registration-pdf?applicationId=...&phone=...
 * Verifies the phone belongs to the registration, then generates the PDF
 * on the fly (never stored) and returns it as a download.
 *
 * Fix #4 / #8 — rate-limited to 10 retrieval attempts per IP per 15 minutes
 * to prevent enumeration attacks (applicationId + phone guessing).
 */
export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();
  if (event.httpMethod !== 'GET') return fail(405, 'Method not allowed.');

  const { ip } = clientInfo(event);

  // Fix #4/#8 — rate-limit PDF retrieval: 10 per IP per 15 minutes.
  if (!checkRateLimit(`pdf:${ip}`, 10, 15 * 60 * 1000)) {
    return RATE_LIMIT_RESPONSE;
  }

  const applicationId = event.queryStringParameters?.applicationId?.trim();
  const phone = event.queryStringParameters?.phone?.trim();
  if (!applicationId || !phone) return fail(400, 'Application ID and phone number are required.');

  try {
    const reg = await prisma.registration.findUnique({
      where: { applicationId },
      include: { delegates: true },
    });
    if (!reg) return fail(404, 'No registration found. Please check your Application ID and phone number.');

    // ── Verify phone ownership ──
    const target = normalizePhone(phone);
    const phones =
      reg.type === 'INDIVIDUAL'
        ? reg.delegates.map((d) => normalizePhone(d.phone))
        : [normalizePhone(reg.teacherPhone || '')];
    if (!phones.includes(target)) {
      return fail(403, 'The phone number does not match this Application ID.');
    }

    const pdfBytes = await buildRegistrationPdf(reg as unknown as PdfRegistration);
    const body = Buffer.from(pdfBytes).toString('base64');

    return {
      statusCode: 200,
      headers: {
        ...CORS,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${applicationId}.pdf"`,
        'Cache-Control': 'no-store',
      },
      body,
      isBase64Encoded: true,
    };
  } catch (err) {
    console.error('registration-pdf error:', err);
    return fail(500, 'Could not generate the PDF. Please try again.');
  }
};
