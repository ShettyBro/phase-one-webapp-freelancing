import type { Handler } from '@netlify/functions';
import { ok, fail, preflight, parseBody } from './_shared/http';
import { r2Configured, buildKey, presignUpload } from './_shared/r2';
import { ID_PROOF, SPREADSHEET } from './_shared/domain';

type UploadKind = 'ID_PROOF' | 'SPREADSHEET';

interface SignRequest {
  kind?: UploadKind;
  fileName?: string;
  contentType?: string;
  size?: number;
}

const RULES: Record<UploadKind, { prefix: string; mimeTypes: string[]; maxBytes: number }> = {
  ID_PROOF:    { prefix: 'individual/ids',         mimeTypes: ID_PROOF.mimeTypes,    maxBytes: ID_PROOF.maxBytes },
  SPREADSHEET: { prefix: 'institution/spreadsheets', mimeTypes: SPREADSHEET.mimeTypes, maxBytes: SPREADSHEET.maxBytes },
};

/**
 * POST /api/uploads-sign
 * Body: { kind, fileName, contentType, size }
 * Returns a presigned PUT URL the browser uses to upload directly to R2,
 * plus the object key to attach to the registration payload.
 */
export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();
  if (event.httpMethod !== 'POST') return fail(405, 'Method not allowed.');

  if (!r2Configured()) {
    return fail(503, 'File storage is not configured yet. Please try again later.');
  }

  const { kind, fileName, contentType, size } = parseBody<SignRequest>(event);

  if (!kind || !RULES[kind]) return fail(400, 'Invalid upload kind.');
  if (!fileName || !contentType || typeof size !== 'number') {
    return fail(400, 'fileName, contentType and size are required.');
  }

  const rule = RULES[kind];
  if (!rule.mimeTypes.includes(contentType)) {
    return fail(400, `Unsupported file type for ${kind}.`);
  }
  if (size <= 0 || size > rule.maxBytes) {
    return fail(400, `File exceeds the ${Math.round(rule.maxBytes / (1024 * 1024))}MB limit.`);
  }

  try {
    const key = buildKey(rule.prefix, fileName);
    const uploadUrl = await presignUpload(key, contentType, 300);
    return ok({ uploadUrl, key, fileName, mimeType: contentType, size });
  } catch (err) {
    console.error('uploads-sign error:', err);
    return fail(500, 'Could not create upload URL.');
  }
};
