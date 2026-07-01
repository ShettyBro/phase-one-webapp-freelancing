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
    _client = new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
      },
    });
  }
  return _client;
}

/** Builds a namespaced object key, e.g. id-proofs/2026/<uuid>.pdf */
export function buildKey(prefix: string, fileName: string): string {
  const ext = (fileName.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${prefix}/${randomUUID()}.${ext}`;
}

/** Presigned PUT URL the browser uses to upload directly to R2. */
export async function presignUpload(
  key: string,
  contentType: string,
  expiresIn = 300,
): Promise<string> {
  return getSignedUrl(
    client(),
    new PutObjectCommand({ Bucket: R2_BUCKET, Key: key, ContentType: contentType }),
    { expiresIn },
  );
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
