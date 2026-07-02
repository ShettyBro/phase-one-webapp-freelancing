import type { Handler } from '@netlify/functions';
import bcrypt from 'bcryptjs';
import { prisma } from './_shared/prisma';
import { ok, fail, preflight, parseBody, clientInfo } from './_shared/http';
import { signAdminToken } from './_shared/auth';
import { parseUserAgent } from './_shared/credentials';
import { logActivity } from './_shared/logs';
import { checkRateLimit, RATE_LIMIT_RESPONSE } from './_shared/rateLimit';

/**
 * POST /api/auth-login — { username, password }
 * Verifies credentials, records a login log, returns a JWT + session info.
 *
 * Fix #4 — rate-limited to 10 attempts per IP per 15 minutes to prevent
 * brute-force / credential-stuffing attacks.
 */
export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();
  if (event.httpMethod !== 'POST') return fail(405, 'Method not allowed.');

  const { ip, userAgent } = clientInfo(event);
  const { browser, device } = parseUserAgent(userAgent);

  // Fix #4 — rate-limit login attempts: 10 per IP per 15 minutes.
  if (!checkRateLimit(`login:${ip}`, 10, 15 * 60 * 1000)) {
    return RATE_LIMIT_RESPONSE;
  }

  const { username, password } = parseBody<{ username?: string; password?: string }>(event);

  const recordLogin = (adminId: string | null, success: boolean) =>
    prisma.loginLog.create({
      data: { adminId: adminId ?? undefined, usernameTried: username, ipAddress: ip, browser, device, success },
    }).catch((e) => console.error('login log failed:', e));

  try {
    if (!username || !password) return fail(400, 'Username and password are required.');

    const admin = await prisma.admin.findUnique({ where: { username } });
    if (!admin || !admin.isActive) {
      await recordLogin(admin?.id ?? null, false);
      return fail(401, 'Invalid credentials or inactive account.');
    }

    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) {
      await recordLogin(admin.id, false);
      return fail(401, 'Invalid credentials.');
    }

    const { token, expiresInMs } = signAdminToken({ sub: admin.id, role: admin.role, username: admin.username });

    await prisma.admin.update({ where: { id: admin.id }, data: { lastLogin: new Date() } });
    await recordLogin(admin.id, true);
    await logActivity(admin.id, 'LOGIN', `${admin.username} logged in`, ip);

    return ok({
      token,
      expiresInMs,
      admin: { id: admin.id, name: admin.name, username: admin.username, role: admin.role },
    });
  } catch (err) {
    console.error('auth-login error:', err);
    return fail(500, 'Login failed. Please try again.');
  }
};
