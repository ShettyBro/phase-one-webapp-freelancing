import type { Handler } from '@netlify/functions';
import { prisma } from './_shared/prisma';
import { ok, fail, preflight, parseBody, clientInfo } from './_shared/http';
import { authenticate } from './_shared/auth';
import { deleteObjects, r2Configured } from './_shared/r2';
import { logActivity } from './_shared/logs';

/**
 * /api/resource-categories (admin)
 *  GET            → categories with resource counts
 *  POST           → create { name, order? }
 *  DELETE ?id=... → delete category (+ its resources' R2 files)
 */
export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();

  const auth = authenticate(event);
  if ('error' in auth) return fail(auth.error.status, auth.error.message, { expired: auth.error.expired });

  try {
    if (event.httpMethod === 'GET') {
      const categories = await prisma.resourceCategory.findMany({
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
        include: { _count: { select: { resources: true } } },
      });
      return ok({ categories });
    }

    if (event.httpMethod === 'POST') {
      const { name, order } = parseBody<{ name?: string; order?: number }>(event);
      if (!name || !name.trim()) return fail(400, 'Category name is required.');
      const existing = await prisma.resourceCategory.findUnique({ where: { name: name.trim() } });
      if (existing) return fail(409, 'A category with this name already exists.');
      const category = await prisma.resourceCategory.create({
        data: { name: name.trim(), order: order ?? 0 },
      });
      return ok({ category });
    }

    if (event.httpMethod === 'DELETE') {
      const id = event.queryStringParameters?.id;
      if (!id) return fail(400, 'Category id is required.');
      const resources = await prisma.resource.findMany({ where: { categoryId: id }, include: { file: true } });
      const keys = resources.map((r) => r.file?.r2Key).filter(Boolean) as string[];
      if (r2Configured() && keys.length) await deleteObjects(keys);
      await prisma.resourceCategory.delete({ where: { id } });
      const { ip } = clientInfo(event);
      await logActivity(auth.claims.sub, 'RESOURCE_DELETE', `Deleted category ${id}`, ip);
      return ok({ message: 'Category deleted.' });
    }

    return fail(405, 'Method not allowed.');
  } catch (err) {
    console.error('resource-categories error:', err);
    return fail(500, 'Server error.');
  }
};
