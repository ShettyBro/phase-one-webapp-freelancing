import type { Handler } from '@netlify/functions';
import { prisma } from './_shared/prisma';
import { ok, fail, preflight } from './_shared/http';
import { authenticate } from './_shared/auth';

/**
 * GET /api/auth-me — validates the token and returns the current admin profile.
 * authenticate() already verifies isActive, so we just need the public fields.
 */
export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();
  if (event.httpMethod !== 'GET') return fail(405, 'Method not allowed.');

  const auth = await authenticate(event);
  if ('error' in auth) return fail(auth.error.status, auth.error.message, { expired: auth.error.expired });

  // authenticate() already confirmed the admin exists and isActive.
  // Fetch the public-facing profile (no passwordHash).
  const admin = await prisma.admin.findUnique({
    where: { id: auth.claims.sub },
    select: { id: true, name: true, username: true, role: true, isActive: true },
  });
  if (!admin) return fail(401, 'Account not found.');

  return ok({ admin });
};
