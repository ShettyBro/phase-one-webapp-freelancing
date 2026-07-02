import type { Handler } from '@netlify/functions';
import { prisma } from './_shared/prisma';
import { ok, fail, preflight, parseBody, clientInfo } from './_shared/http';
import { isEmail, nonEmpty } from './_shared/validation';
import { checkRateLimit, RATE_LIMIT_RESPONSE } from './_shared/rateLimit';

/**
 * POST /api/contact — stores a contact message (admin reads it in the panel).
 *
 * Fix #4 — rate-limited to 5 messages per IP per 10 minutes to prevent
 * spam/flooding of the contact inbox.
 */
export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();
  if (event.httpMethod !== 'POST') return fail(405, 'Method not allowed.');

  const { ip } = clientInfo(event);

  // Fix #4 — rate-limit contact submissions: 5 per IP per 10 minutes.
  if (!checkRateLimit(`contact:${ip}`, 5, 10 * 60 * 1000)) {
    return RATE_LIMIT_RESPONSE;
  }

  try {
    const { name, email, message } = parseBody<{ name?: string; email?: string; message?: string }>(event);

    if (!nonEmpty(name)) return fail(400, 'Name is required.');
    if (!isEmail(email)) return fail(400, 'A valid email is required.');
    if (!nonEmpty(message)) return fail(400, 'Message is required.');

    await prisma.contactMessage.create({
      data: { name: name!.trim(), email: email!.trim().toLowerCase(), message: message!.trim() },
    });

    return ok({ message: 'Message received.' });
  } catch (err) {
    console.error('contact error:', err);
    return fail(500, 'Could not send your message. Please try again.');
  }
};
