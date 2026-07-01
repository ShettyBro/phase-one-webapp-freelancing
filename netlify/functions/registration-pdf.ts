import type { Handler } from '@netlify/functions';
import { prisma } from './_shared/prisma';
import { fail, preflight, CORS } from './_shared/http';
import { buildRegistrationPdf, type PdfRegistration } from './_shared/pdf';

const normalizePhone = (p: string) => p.replace(/[\s-]/g, '').replace(/^\+/, '');

/**
 * GET /api/registration-pdf?applicationId=...&phone=...
 * Verifies the phone belongs to the registration, then generates the PDF
 * on the fly (never stored) and returns it as a download.
 */
export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();
  if (event.httpMethod !== 'GET') return fail(405, 'Method not allowed.');

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
