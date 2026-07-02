import type { Handler } from '@netlify/functions';
import { ok, fail, preflight, parseBody , setEvent } from './_shared/http';
import { authenticate } from './_shared/auth';
import { r2Configured, buildKey, presignUpload } from './_shared/r2';
import { RESOURCE_FILE } from './_shared/domain';

// Valid resource subcategories → maps directly to the R2 folder structure:
//   resources/brochures/
//   resources/guides/
//   resources/templates/
//   resources/others/
const RESOURCE_SUBCATEGORIES = ['brochures', 'guides', 'templates', 'others'] as const;
type ResourceSubcategory = (typeof RESOURCE_SUBCATEGORIES)[number];

/**
 * Fix #6 — explicit MIME + extension allow-list for admin-uploaded resources.
 * Prevents upload of arbitrary types (e.g. HTML/SVG) that could be served as
 * stored XSS if the bucket's public URL is same-origin with the app.
 */
const RESOURCE_ALLOWED_TYPES: Record<string, string[]> = {
  'application/pdf':                                                                ['pdf'],
  'application/vnd.ms-powerpoint':                                                 ['ppt'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation':     ['pptx'],
  'application/msword':                                                             ['doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':       ['docx'],
  'application/vnd.ms-excel':                                                       ['xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':             ['xlsx'],
  'text/csv':                                                                       ['csv'],
  'image/jpeg':                                                                     ['jpg', 'jpeg'],
  'image/png':                                                                      ['png'],
};

/**
 * POST /api/resource-upload-sign (admin) — presigned PUT for a public resource file.
 * Body: { fileName, contentType, size, subcategory? }
 * subcategory defaults to 'others' if omitted or unrecognised.
 */
export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight(event);
  setEvent(event);
  if (event.httpMethod !== 'POST') return fail(405, 'Method not allowed.');

  const auth = await authenticate(event);
  if ('error' in auth) return fail(auth.error.status, auth.error.message, { expired: auth.error.expired });

  if (!r2Configured()) return fail(503, 'File storage is not configured yet.');

  const { fileName, contentType, size, subcategory } = parseBody<{
    fileName?: string;
    contentType?: string;
    size?: number;
    subcategory?: string;
  }>(event);

  if (!fileName || !contentType || typeof size !== 'number') {
    return fail(400, 'fileName, contentType and size are required.');
  }
  if (size <= 0 || size > RESOURCE_FILE.maxBytes) {
    return fail(400, `File exceeds the ${Math.round(RESOURCE_FILE.maxBytes / (1024 * 1024))}MB limit.`);
  }

  // Fix #6 — validate MIME type against the allow-list.
  const allowedExts = RESOURCE_ALLOWED_TYPES[contentType];
  if (!allowedExts) {
    return fail(400, `Unsupported file type "${contentType}". Allowed: PDF, Office documents, images, CSV.`);
  }

  // Also validate file extension matches the declared MIME type.
  const ext = (fileName.split('.').pop() || '').toLowerCase();
  if (!allowedExts.includes(ext)) {
    return fail(400, `File extension ".${ext}" does not match the declared content type.`);
  }

  // Resolve subcategory — fall back to 'others' for unknown/missing values.
  const sub: ResourceSubcategory =
    RESOURCE_SUBCATEGORIES.includes(subcategory as ResourceSubcategory)
      ? (subcategory as ResourceSubcategory)
      : 'others';

  const prefix = `resources/${sub}`;

  try {
    const key = buildKey(prefix, fileName);
    const uploadUrl = await presignUpload(key, contentType, 300);
    return ok({ uploadUrl, key, fileName, mimeType: contentType, size, subcategory: sub });
  } catch (err) {
    console.error('resource-upload-sign error:', err);
    return fail(500, 'Could not create upload URL.');
  }
};
