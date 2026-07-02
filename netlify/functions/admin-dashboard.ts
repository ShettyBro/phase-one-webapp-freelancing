import type { Handler } from '@netlify/functions';
import { prisma } from './_shared/prisma';
import { ok, fail, preflight , setEvent } from './_shared/http';
import { authenticate } from './_shared/auth';

/** GET /api/admin-dashboard — stats cards + 14-day registration trend. */
export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight(event);
  setEvent(event);
  if (event.httpMethod !== 'GET') return fail(405, 'Method not allowed.');

  const auth = await authenticate(event);
  if ('error' in auth) return fail(auth.error.status, auth.error.message, { expired: auth.error.expired });

  try {
    const [total, individual, institutional, single, double, setting] = await Promise.all([
      prisma.registration.count(),
      prisma.registration.count({ where: { type: 'INDIVIDUAL' } }),
      prisma.registration.count({ where: { type: 'INSTITUTIONAL' } }),
      prisma.registration.count({ where: { delegationType: 'SINGLE' } }),
      prisma.registration.count({ where: { delegationType: 'DOUBLE' } }),
      prisma.setting.findUnique({ where: { key: 'registration_open' } }),
    ]);

    // ── 14-day trend ──
    const days = 14;
    const since = new Date();
    since.setDate(since.getDate() - (days - 1));
    since.setHours(0, 0, 0, 0);

    const recent = await prisma.registration.findMany({
      where: { submittedAt: { gte: since } },
      select: { submittedAt: true },
    });

    const buckets: Record<string, number> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      buckets[d.toISOString().slice(0, 10)] = 0;
    }
    for (const r of recent) {
      const key = r.submittedAt.toISOString().slice(0, 10);
      if (key in buckets) buckets[key] += 1;
    }
    const trend = Object.entries(buckets).map(([date, count]) => ({ date, count }));

    return ok({
      stats: {
        total,
        individual,
        institutional,
        single,
        double,
        registrationOpen: setting ? setting.value === 'true' : true,
      },
      trend,
    });
  } catch (err) {
    console.error('admin-dashboard error:', err);
    return fail(500, 'Could not load dashboard.');
  }
};
