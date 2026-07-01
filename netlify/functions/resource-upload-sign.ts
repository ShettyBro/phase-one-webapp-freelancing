import type { Handler } from '@netlify/functions';
import { ok, fail, preflight, parseBody } from './_shared/http';
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
 * POST /api/resource-upload-sign (admin) — presigned PUT for a public resource file.
 * Body: { fileName, contentType, size, subcategory? }
 * subcategory defaults to 'others' if omitted or unrecognised.
 */
export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();
  if (event.httpMethod !== 'POST') return fail(405, 'Method not allowed.');

  const auth = authenticate(event);
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
