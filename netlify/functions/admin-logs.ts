import type { Handler } from '@netlify/functions';
import { prisma } from './_shared/prisma';
import { ok, fail, preflight } from './_shared/http';
import { authenticate } from './_shared/auth';

/**
 * GET /api/admin-logs?type=activity|login
 *  - activity: any admin
 *  - login: SUPER_ADMIN only
 */
export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();
  if (event.httpMethod !== 'GET') return fail(405, 'Method not allowed.');

  const auth = await authenticate(event);
  if ('error' in auth) return fail(auth.error.status, auth.error.message, { expired: auth.error.expired });

  const type = event.queryStringParameters?.type === 'login' ? 'login' : 'activity';

  try {
    if (type === 'login') {
      if (auth.claims.role !== 'SUPER_ADMIN') return fail(403, 'Forbidden.');
      const logs = await prisma.loginLog.findMany({
        orderBy: { loginTime: 'desc' },
        take: 300,
        include: { admin: { select: { username: true, name: true } } },
      });
      return ok({ logs });
    }

    const logs = await prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 300,
      include: { admin: { select: { username: true, name: true } } },
    });
    return ok({ logs });
  } catch (err) {
    console.error('admin-logs error:', err);
    return fail(500, 'Could not load logs.');
  }
};
