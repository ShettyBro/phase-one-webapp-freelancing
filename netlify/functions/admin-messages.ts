import type { Handler } from '@netlify/functions';
import { prisma } from './_shared/prisma';
import { ok, fail, preflight, clientInfo } from './_shared/http';
import { authenticate } from './_shared/auth';
import { logActivity } from './_shared/logs';

/**
 * /api/admin-messages
 *  GET            → list (?q search) + unreadCount
 *  GET ?id=...    → single message (marks it read)
 *  DELETE ?id=... → delete
 */
export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();

  const auth = authenticate(event);
  if ('error' in auth) return fail(auth.error.status, auth.error.message, { expired: auth.error.expired });

  const id = event.queryStringParameters?.id;

  try {
    if (event.httpMethod === 'GET' && id) {
      const msg = await prisma.contactMessage.findUnique({ where: { id } });
      if (!msg) return fail(404, 'Message not found.');
      if (!msg.isRead) {
        await prisma.contactMessage.update({ where: { id }, data: { isRead: true } });
      }
      return ok({ message: { ...msg, isRead: true } });
    }

    if (event.httpMethod === 'GET') {
      const q = event.queryStringParameters?.q?.trim();
      const where = q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' as const } },
              { email: { contains: q, mode: 'insensitive' as const } },
              { message: { contains: q, mode: 'insensitive' as const } },
            ],
          }
        : {};
      const [messages, unreadCount] = await Promise.all([
        prisma.contactMessage.findMany({ where, orderBy: { createdAt: 'desc' }, take: 500 }),
        prisma.contactMessage.count({ where: { isRead: false } }),
      ]);
      return ok({ messages, unreadCount });
    }

    if (event.httpMethod === 'DELETE' && id) {
      await prisma.contactMessage.delete({ where: { id } });
      const { ip } = clientInfo(event);
      await logActivity(auth.claims.sub, 'MESSAGE_DELETE', `Deleted message ${id}`, ip);
      return ok({ message: 'Message deleted.' });
    }

    return fail(405, 'Method not allowed.');
  } catch (err) {
    console.error('admin-messages error:', err);
    return fail(500, 'Server error.');
  }
};
