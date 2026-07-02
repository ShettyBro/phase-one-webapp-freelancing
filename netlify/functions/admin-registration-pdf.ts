import type { Handler } from '@netlify/functions';
import { prisma } from './_shared/prisma';
import { fail, preflight, CORS } from './_shared/http';
import { authenticate } from './_shared/auth';
import { buildRegistrationPdf, type PdfRegistration } from './_shared/pdf';

/**
 * GET /api/admin-registration-pdf?id=<registration-uuid>
 * Admin-only endpoint — no phone verification required.
 * Generates the PDF on the fly and streams it back as a download.
 */
export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();
  if (event.httpMethod !== 'GET') return fail(405, 'Method not allowed.');

  const auth = await authenticate(event);
  if ('error' in auth) return fail(auth.error.status, auth.error.message, { expired: auth.error.expired });

  const id = event.queryStringParameters?.id?.trim();
  if (!id) return fail(400, 'Registration ID is required.');

  try {
    const reg = await prisma.registration.findUnique({
      where: { id },
      include: { delegates: true },
    });
    if (!reg) return fail(404, 'Registration not found.');

    const pdfBytes = await buildRegistrationPdf(reg as unknown as PdfRegistration);
    const body = Buffer.from(pdfBytes).toString('base64');

    return {
      statusCode: 200,
      headers: {
        ...CORS,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${reg.applicationId}.pdf"`,
        'Cache-Control': 'no-store',
      },
      body,
      isBase64Encoded: true,
    };
  } catch (err) {
    console.error('admin-registration-pdf error:', err);
    return fail(500, 'Could not generate the PDF.');
  }
};
