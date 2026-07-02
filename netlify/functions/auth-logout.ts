import type { Handler } from '@netlify/functions';
import { prisma } from './_shared/prisma';
import { ok, fail, preflight, clientInfo } from './_shared/http';
import { authenticate } from './_shared/auth';
import { logActivity } from './_shared/logs';

/**
 * POST /api/auth-logout — stamps the latest login log with a logout time.
 */
export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();
  if (event.httpMethod !== 'POST') return fail(405, 'Method not allowed.');

  const auth = await authenticate(event);
  if ('error' in auth) return fail(auth.error.status, auth.error.message, { expired: auth.error.expired });

  try {
    const { ip } = clientInfo(event);
    const lastLogin = await prisma.loginLog.findFirst({
      where: { adminId: auth.claims.sub, logoutTime: null, success: true },
      orderBy: { loginTime: 'desc' },
    });
    if (lastLogin) {
      await prisma.loginLog.update({ where: { id: lastLogin.id }, data: { logoutTime: new Date() } });
    }
    await logActivity(auth.claims.sub, 'LOGOUT', `${auth.claims.username} logged out`, ip);
    return ok({ message: 'Logged out.' });
  } catch (err) {
    console.error('auth-logout error:', err);
    return fail(500, 'Logout failed.');
  }
};
