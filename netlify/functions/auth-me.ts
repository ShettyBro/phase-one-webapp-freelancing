import type { Handler } from '@netlify/functions';
import { prisma } from './_shared/prisma';
import { ok, fail, preflight } from './_shared/http';
import { authenticate } from './_shared/auth';

/**
 * GET /api/auth-me — validates the token and returns the current admin profile.
 */
export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();
  if (event.httpMethod !== 'GET') return fail(405, 'Method not allowed.');

  const auth = authenticate(event);
  if ('error' in auth) return fail(auth.error.status, auth.error.message, { expired: auth.error.expired });

  const admin = await prisma.admin.findUnique({
    where: { id: auth.claims.sub },
    select: { id: true, name: true, username: true, role: true, isActive: true },
  });
  if (!admin || !admin.isActive) return fail(401, 'Account not found or inactive.');

  return ok({ admin });
};
