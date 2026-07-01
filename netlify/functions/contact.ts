import type { Handler } from '@netlify/functions';
import { prisma } from './_shared/prisma';
import { ok, fail, preflight, parseBody } from './_shared/http';
import { isEmail, nonEmpty } from './_shared/validation';

/**
 * POST /api/contact — stores a contact message (admin reads it in the panel).
 */
export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();
  if (event.httpMethod !== 'POST') return fail(405, 'Method not allowed.');

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
