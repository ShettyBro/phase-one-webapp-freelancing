import type { Handler } from '@netlify/functions';
import { prisma } from './_shared/prisma';
import { ok, fail, preflight, clientInfo, corsHeaders , setEvent } from './_shared/http';
import { authenticate, clearTokenCookie } from './_shared/auth';
import { logActivity } from './_shared/logs';

/**
 * POST /api/auth-logout — stamps the latest login log with a logout time
 * and clears the httpOnly auth cookie.
 *
 * Fix #10 — responds with Set-Cookie: adminToken=; Max-Age=0 to immediately
 * expire the httpOnly cookie in the browser, completing the cookie-based
 * auth flow (the client cannot do this itself because the cookie is httpOnly).
 */
export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight(event);
  setEvent(event);
  if (event.httpMethod !== 'POST') return fail(405, 'Method not allowed.', {}, event);

  const auth = await authenticate(event);
  if ('error' in auth) return fail(auth.error.status, auth.error.message, { expired: auth.error.expired }, event);

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

    // Fix #10 — clear the httpOnly cookie on the server side.
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders(event),
        'Access-Control-Allow-Credentials': 'true',
        'Set-Cookie': clearTokenCookie(),
      },
      body: JSON.stringify({ success: true, message: 'Logged out.' }),
    };
  } catch (err) {
    console.error('auth-logout error:', err);
    return fail(500, 'Logout failed.', {}, event);
  }
};
