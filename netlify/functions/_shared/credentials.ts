import { randomInt } from 'crypto';
import { prisma } from './prisma';

const PASSWORD_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

/** Secure random password (default 8 chars). */
export function generatePassword(length = 8): string {
  let out = '';
  for (let i = 0; i < length; i++) out += PASSWORD_CHARS[randomInt(0, PASSWORD_CHARS.length)];
  return out;
}

/** Derives a base username from a name/email and ensures it's unique. */
export async function generateUniqueUsername(name: string, email: string): Promise<string> {
  const fromEmail = email.split('@')[0];
  const raw = (fromEmail || name).toLowerCase().replace(/[^a-z0-9]/g, '');
  const base = (raw || 'admin').slice(0, 20);

  let candidate = base;
  let n = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const exists = await prisma.admin.findUnique({ where: { username: candidate }, select: { id: true } });
    if (!exists) return candidate;
    n += 1;
    candidate = `${base}${n}`;
  }
}

/** Minimal user-agent parsing for login logs. */
export function parseUserAgent(ua = ''): { browser: string; device: string } {
  const browser = /edg/i.test(ua)
    ? 'Edge'
    : /opr|opera/i.test(ua)
    ? 'Opera'
    : /chrome|crios/i.test(ua)
    ? 'Chrome'
    : /firefox|fxios/i.test(ua)
    ? 'Firefox'
    : /safari/i.test(ua)
    ? 'Safari'
    : 'Unknown';
  const device = /mobile/i.test(ua) ? 'Mobile' : /tablet|ipad/i.test(ua) ? 'Tablet' : 'Desktop';
  return { browser, device };
}
