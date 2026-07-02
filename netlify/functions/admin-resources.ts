import type { Handler } from '@netlify/functions';
import { prisma } from './_shared/prisma';
import { ok, fail, preflight, parseBody, clientInfo , setEvent } from './_shared/http';
import { authenticate } from './_shared/auth';
import { deleteObject, r2Configured } from './_shared/r2';
import { logActivity } from './_shared/logs';

interface FilePayload {
  key: string;
  fileName: string;
  mimeType: string;
  size: number;
}

/**
 * /api/admin-resources (admin)
 *  GET            → all resources (with category + file)
 *  POST           → create { categoryId, title, description?, file }
 *  PATCH ?id=...  → update fields and/or replace file
 *  DELETE ?id=... → delete resource + R2 file
 */
export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight(event);
  setEvent(event);

  const auth = await authenticate(event);
  if ('error' in auth) return fail(auth.error.status, auth.error.message, { expired: auth.error.expired });

  const id = event.queryStringParameters?.id;
  const { ip } = clientInfo(event);

  try {
    if (event.httpMethod === 'GET') {
      const resources = await prisma.resource.findMany({
        orderBy: { createdAt: 'desc' },
        include: { category: true, file: true },
      });
      return ok({ resources });
    }

    if (event.httpMethod === 'POST') {
      const body = parseBody<{ categoryId?: string; title?: string; description?: string; file?: FilePayload }>(event);
      if (!body.categoryId) return fail(400, 'A category is required.');
      if (!body.title?.trim()) return fail(400, 'A title is required.');
      if (!body.file?.key) return fail(400, 'A file upload is required.');

      const uploaded = await prisma.uploadedFile.create({
        data: {
          kind: 'RESOURCE',
          r2Key: body.file.key,
          fileName: body.file.fileName,
          mimeType: body.file.mimeType || 'application/octet-stream',
          size: body.file.size || 0,
        },
      });
      const resource = await prisma.resource.create({
        data: {
          categoryId: body.categoryId,
          title: body.title.trim(),
          description: body.description?.trim() || null,
          fileId: uploaded.id,
        },
        include: { category: true, file: true },
      });
      await logActivity(auth.claims.sub, 'RESOURCE_UPLOAD', `Uploaded resource "${resource.title}"`, ip);
      return ok({ resource });
    }

    if (event.httpMethod === 'PATCH' && id) {
      const body = parseBody<{
        title?: string;
        description?: string;
        categoryId?: string;
        isEnabled?: boolean;
        file?: FilePayload;
      }>(event);

      const existing = await prisma.resource.findUnique({ where: { id }, include: { file: true } });
      if (!existing) return fail(404, 'Resource not found.');

      const data: Record<string, unknown> = {};
      if (typeof body.title === 'string') data.title = body.title.trim();
      if (typeof body.description === 'string') data.description = body.description.trim() || null;
      if (typeof body.categoryId === 'string') data.categoryId = body.categoryId;
      if (typeof body.isEnabled === 'boolean') data.isEnabled = body.isEnabled;

      // ── File replacement ──
      let action: 'RESOURCE_REPLACE' | 'RESOURCE_TOGGLE' | 'OTHER' = 'OTHER';
      if (body.file?.key) {
        const oldFile = existing.file;
        const newFile = await prisma.uploadedFile.create({
          data: {
            kind: 'RESOURCE',
            r2Key: body.file.key,
            fileName: body.file.fileName,
            mimeType: body.file.mimeType || 'application/octet-stream',
            size: body.file.size || 0,
          },
        });
        data.fileId = newFile.id;
        // remove the previous object + row
        if (oldFile) {
          if (r2Configured()) await deleteObject(oldFile.r2Key).catch(() => {});
          await prisma.uploadedFile.delete({ where: { id: oldFile.id } }).catch(() => {});
        }
        action = 'RESOURCE_REPLACE';
      } else if (typeof body.isEnabled === 'boolean') {
        action = 'RESOURCE_TOGGLE';
      }

      const resource = await prisma.resource.update({ where: { id }, data, include: { category: true, file: true } });
      await logActivity(auth.claims.sub, action, `Updated resource "${resource.title}"`, ip);
      return ok({ resource });
    }

    if (event.httpMethod === 'DELETE' && id) {
      const existing = await prisma.resource.findUnique({ where: { id }, include: { file: true } });
      if (!existing) return fail(404, 'Resource not found.');
      if (existing.file) {
        if (r2Configured()) await deleteObject(existing.file.r2Key).catch(() => {});
      }
      await prisma.resource.delete({ where: { id } });
      if (existing.file) await prisma.uploadedFile.delete({ where: { id: existing.file.id } }).catch(() => {});
      await logActivity(auth.claims.sub, 'RESOURCE_DELETE', `Deleted resource "${existing.title}"`, ip);
      return ok({ message: 'Resource deleted.' });
    }

    return fail(405, 'Method not allowed.');
  } catch (err) {
    console.error('admin-resources error:', err);
    return fail(500, 'Server error.');
  }
};
