import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

export const R2_BUCKET = process.env.R2_BUCKET || 'comun-uploads';

export function r2Configured(): boolean {
  return !!(
    process.env.R2_ENDPOINT &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY
  );
}

let _client: S3Client | null = null;
function client(): S3Client {
  if (!_client) {
    const endpoint = process.env.R2_ENDPOINT || '';
    const accountId = process.env.R2_ACCOUNT_ID || '';
    // DEBUG — log R2 client config on first init
    console.log('[R2] Initialising S3Client', {
      endpoint,
      accountId,
      bucket: R2_BUCKET,
      accessKeyId: (process.env.R2_ACCESS_KEY_ID || '').slice(0, 6) + '…',
    });
    _client = new S3Client({
      region: 'auto',
      endpoint,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
      },
      // REQUIRED for Cloudflare R2: the endpoint is account-scoped
      // (https://<accountId>.r2.cloudflarestorage.com) and the bucket name
      // must appear in the URL PATH, not as a virtual-hosted subdomain.
      // Without this flag the SDK generates virtual-hosted-style URLs like
      // https://<bucket>.<accountId>.r2.cloudflarestorage.com which R2 does
      // not serve → CORS preflight receives 403 immediately.
      forcePathStyle: true,
    });
  }
  return _client;
}

/** Builds a namespaced object key, e.g. id-proofs/2026/<uuid>.pdf */
export function buildKey(prefix: string, fileName: string): string {
  const ext = (fileName.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${prefix}/${randomUUID()}.${ext}`;
}

/** Presigned PUT URL the browser uses to upload directly to R2.
 *
 * IMPORTANT: ContentType is intentionally NOT set on PutObjectCommand.
 * When ContentType is included in the command, AWS Signature V4 adds
 * "content-type" to the x-amz-signedheaders list. R2 then enforces that
 * the browser PUT sends an EXACTLY matching Content-Type — any mismatch
 * (e.g. browser normalises "image/jpeg" differently) invalidates the sig.
 * Omitting it from the command keeps Content-Type out of the signed headers
 * so the browser can send it freely without affecting signature validity.
 */
export async function presignUpload(
  key: string,
  contentType: string,
  expiresIn = 300,
): Promise<string> {
  // DEBUG — log what we are about to sign
  console.log('[R2] presignUpload', { bucket: R2_BUCKET, key, contentType, expiresIn });

  const url = await getSignedUrl(
    client(),
    // ContentType deliberately omitted — see JSDoc above
    new PutObjectCommand({ Bucket: R2_BUCKET, Key: key }),
    { expiresIn },
  );

  // DEBUG — log the generated URL (first 120 chars to avoid logging secrets)
  console.log('[R2] presigned PUT URL (truncated):', url.slice(0, 120) + '…');
  return url;
}

/** Presigned GET URL for downloading a stored object (optionally forcing a filename). */
export async function presignDownload(
  key: string,
  expiresIn = 300,
  downloadName?: string,
): Promise<string> {
  return getSignedUrl(
    client(),
    new GetObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      ResponseContentDisposition: downloadName ? `attachment; filename="${downloadName}"` : undefined,
    }),
    { expiresIn },
  );
}

export async function deleteObject(key: string): Promise<void> {
  await client().send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }));
}

/** Deletes many objects, ignoring individual failures (best-effort cleanup). */
export async function deleteObjects(keys: string[]): Promise<void> {
  await Promise.allSettled(keys.map((k) => deleteObject(k)));
}
