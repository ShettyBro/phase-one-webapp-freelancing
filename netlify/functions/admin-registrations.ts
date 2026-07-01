import type { Handler } from '@netlify/functions';
import { prisma } from './_shared/prisma';
import { ok, fail, preflight, clientInfo } from './_shared/http';
import { authenticate } from './_shared/auth';
import { deleteObjects, presignDownload, r2Configured } from './_shared/r2';
import { logActivity } from './_shared/logs';

/**
 * /api/admin-registrations
 *  GET               → list (?q search, ?type INDIVIDUAL|INSTITUTIONAL)
 *  GET ?id=...       → full detail incl. delegates + file download links
 *  DELETE ?id=...    → delete record + R2 files
 */
export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();

  const auth = authenticate(event);
  if ('error' in auth) return fail(auth.error.status, auth.error.message, { expired: auth.error.expired });

  const id = event.queryStringParameters?.id;

  try {
    if (event.httpMethod === 'GET' && id) {
      const reg = await prisma.registration.findUnique({
        where: { id },
        include: { delegates: { orderBy: { position: 'asc' } }, files: true },
      });
      if (!reg) return fail(404, 'Registration not found.');

      const files = await Promise.all(
        reg.files.map(async (f) => ({
          id: f.id,
          kind: f.kind,
          fileName: f.fileName,
          downloadUrl: r2Configured() ? await presignDownload(f.r2Key, 300, f.fileName).catch(() => null) : null,
        })),
      );

      return ok({ registration: { ...reg, files } });
    }

    if (event.httpMethod === 'GET') {
      const q = event.queryStringParameters?.q?.trim();
      const type = event.queryStringParameters?.type as 'INDIVIDUAL' | 'INSTITUTIONAL' | undefined;

      const where: Record<string, unknown> = {};
      if (type === 'INDIVIDUAL' || type === 'INSTITUTIONAL') where.type = type;
      if (q) {
        where.OR = [
          { applicationId: { contains: q, mode: 'insensitive' } },
          { institutionName: { contains: q, mode: 'insensitive' } },
          { teacherEmail: { contains: q, mode: 'insensitive' } },
          { delegates: { some: { OR: [{ name: { contains: q, mode: 'insensitive' } }, { email: { contains: q, mode: 'insensitive' } }] } } },
        ];
      }

      const take = Math.min(500, Math.max(1, Number(event.queryStringParameters?.take) || 500));

      const list = await prisma.registration.findMany({
        where,
        orderBy: { submittedAt: 'desc' },
        include: { delegates: { select: { name: true, email: true, phone: true }, orderBy: { position: 'asc' } } },
        take,
      });

      const rows = list.map((r) => ({
        id: r.id,
        applicationId: r.applicationId,
        type: r.type,
        delegationType: r.delegationType,
        committee: r.committee,
        institutionName: r.institutionName,
        primaryName: r.type === 'INDIVIDUAL' ? r.delegates[0]?.name : r.teacherName,
        primaryEmail: r.type === 'INDIVIDUAL' ? r.delegates[0]?.email : r.teacherEmail,
        submittedAt: r.submittedAt,
      }));

      return ok({ registrations: rows });
    }

    if (event.httpMethod === 'DELETE' && id) {
      const reg = await prisma.registration.findUnique({ where: { id }, include: { files: true } });
      if (!reg) return fail(404, 'Registration not found.');

      if (r2Configured() && reg.files.length) {
        await deleteObjects(reg.files.map((f) => f.r2Key));
      }
      await prisma.registration.delete({ where: { id } }); // cascades delegates + files

      const { ip } = clientInfo(event);
      await logActivity(auth.claims.sub, 'REGISTRATION_DELETE', `Deleted ${reg.applicationId}`, ip);
      return ok({ message: 'Registration deleted.' });
    }

    return fail(405, 'Method not allowed.');
  } catch (err) {
    console.error('admin-registrations error:', err);
    return fail(500, 'Server error.');
  }
};
