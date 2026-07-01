import type { Handler } from '@netlify/functions';
import bcrypt from 'bcryptjs';
import { prisma } from './_shared/prisma';
import { ok, fail, preflight, parseBody, clientInfo } from './_shared/http';
import { authenticate } from './_shared/auth';
import { generatePassword, generateUniqueUsername } from './_shared/credentials';
import { isEmail, isPhone, nonEmpty } from './_shared/validation';
import { logActivity } from './_shared/logs';

const ADMIN_SELECT = {
  id: true, name: true, username: true, email: true, phone: true,
  role: true, isActive: true, lastLogin: true, createdAt: true,
} as const;

/**
 * /api/superadmin-admins (SUPER_ADMIN only)
 *  GET            → list admins
 *  POST           → create { name, email, phone } → returns generated password once
 *  PATCH ?id=...  → { isActive } toggle OR { resetPassword: true } → returns new password
 */
export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();

  const auth = authenticate(event, 'SUPER_ADMIN');
  if ('error' in auth) return fail(auth.error.status, auth.error.message, { expired: auth.error.expired });

  const { ip } = clientInfo(event);
  const id = event.queryStringParameters?.id;

  try {
    if (event.httpMethod === 'GET') {
      const admins = await prisma.admin.findMany({ orderBy: { createdAt: 'asc' }, select: ADMIN_SELECT });
      return ok({ admins });
    }

    if (event.httpMethod === 'POST') {
      const { name, email, phone } = parseBody<{ name?: string; email?: string; phone?: string }>(event);
      if (!nonEmpty(name)) return fail(400, 'Name is required.');
      if (!isEmail(email)) return fail(400, 'A valid email is required.');
      if (!isPhone(phone)) return fail(400, 'A valid phone number is required.');

      const dupe = await prisma.admin.findFirst({
        where: { OR: [{ email: email!.toLowerCase() }, { phone: phone!.trim() }] },
        select: { id: true },
      });
      if (dupe) return fail(409, 'An admin with this email or phone already exists.');

      const username = await generateUniqueUsername(name!, email!);
      const password = generatePassword(8);
      const passwordHash = await bcrypt.hash(password, 12);

      const admin = await prisma.admin.create({
        data: {
          name: name!.trim(),
          email: email!.toLowerCase(),
          phone: phone!.trim(),
          username,
          passwordHash,
          role: 'ADMIN',
          createdById: auth.claims.sub,
        },
        select: ADMIN_SELECT,
      });

      await logActivity(auth.claims.sub, 'ADMIN_CREATION', `Created admin ${username}`, ip);
      // Password returned once for the super admin to hand over.
      return ok({ admin, password });
    }

    if (event.httpMethod === 'PATCH' && id) {
      const target = await prisma.admin.findUnique({ where: { id } });
      if (!target) return fail(404, 'Admin not found.');
      if (target.role === 'SUPER_ADMIN') return fail(403, 'Super Admin accounts cannot be modified here.');

      const body = parseBody<{ isActive?: boolean; resetPassword?: boolean }>(event);

      if (body.resetPassword) {
        const password = generatePassword(8);
        const passwordHash = await bcrypt.hash(password, 12);
        await prisma.admin.update({ where: { id }, data: { passwordHash } });
        await logActivity(auth.claims.sub, 'PASSWORD_RESET', `Reset password for ${target.username}`, ip);
        return ok({ password });
      }

      if (typeof body.isActive === 'boolean') {
        const admin = await prisma.admin.update({ where: { id }, data: { isActive: body.isActive }, select: ADMIN_SELECT });
        await logActivity(auth.claims.sub, 'ADMIN_TOGGLE', `${body.isActive ? 'Enabled' : 'Disabled'} ${target.username}`, ip);
        return ok({ admin });
      }

      return fail(400, 'Nothing to update.');
    }

    return fail(405, 'Method not allowed.');
  } catch (err) {
    console.error('superadmin-admins error:', err);
    return fail(500, 'Server error.');
  }
};
