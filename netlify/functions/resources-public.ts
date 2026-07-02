import type { Handler } from '@netlify/functions';
import { prisma } from './_shared/prisma';
import { ok, fail, preflight , setEvent } from './_shared/http';
import { presignDownload, r2Configured } from './_shared/r2';

/**
 * GET /api/resources-public — enabled resources grouped by category (for the site).
 */
export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight(event);
  setEvent(event);
  if (event.httpMethod !== 'GET') return fail(405, 'Method not allowed.');

  try {
    const categories = await prisma.resourceCategory.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      include: {
        resources: {
          where: { isEnabled: true },
          orderBy: { createdAt: 'desc' },
          include: { file: true },
        },
      },
    });

    const publicBase = process.env.R2_PUBLIC_BASE_URL?.replace(/\/$/, '');

    const result = await Promise.all(
      categories
        .filter((c) => c.resources.length > 0)
        .map(async (c) => ({
          id: c.id,
          name: c.name,
          resources: await Promise.all(
            c.resources.map(async (r) => {
              let url: string | null = null;
              if (r.file) {
                if (publicBase) url = `${publicBase}/${r.file.r2Key}`;
                else if (r2Configured()) url = await presignDownload(r.file.r2Key, 3600, r.file.fileName).catch(() => null);
              }
              return { id: r.id, title: r.title, description: r.description, fileName: r.file?.fileName ?? null, url };
            }),
          ),
        })),
    );

    return ok({ categories: result });
  } catch (err) {
    console.error('resources-public error:', err);
    return fail(500, 'Could not load resources.');
  }
};
