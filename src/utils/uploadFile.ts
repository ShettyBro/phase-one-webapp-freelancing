import api from './api';

export interface UploadedRef {
  key: string;
  fileName: string;
  mimeType: string;
  size: number;
}

export type UploadKind = 'ID_PROOF' | 'SPREADSHEET';

export const UPLOAD_LIMITS: Record<UploadKind, { maxBytes: number; accept: string; label: string }> = {
  ID_PROOF: {
    maxBytes: 4 * 1024 * 1024,
    accept: '.pdf,.jpg,.jpeg,.png',
    label: 'PDF, JPG or PNG · max 4 MB',
  },
  SPREADSHEET: {
    maxBytes: 8 * 1024 * 1024,
    accept: '.csv,.xlsx,.xls',
    label: 'CSV or XLSX · max 8 MB',
  },
};

const MIME_BY_KIND: Record<UploadKind, string[]> = {
  ID_PROOF: ['application/pdf', 'image/jpeg', 'image/png'],
  SPREADSHEET: [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
};

/** Client-side validation mirroring the server rules. Returns error or null. */
export function validateFile(kind: UploadKind, file: File): string | null {
  const limit = UPLOAD_LIMITS[kind];
  if (file.size > limit.maxBytes) {
    return `File is too large (max ${Math.round(limit.maxBytes / (1024 * 1024))} MB).`;
  }
  // Some browsers report empty type for csv/xlsx — fall back to extension.
  const okMime = MIME_BY_KIND[kind].includes(file.type);
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const okExt = limit.accept.includes(ext);
  if (!okMime && !okExt) return 'Unsupported file type.';
  return null;
}

/**
 * Requests a presigned URL and uploads the file directly to Cloudflare R2.
 * Returns the stored object reference to attach to the registration payload.
 */
export async function uploadFile(kind: UploadKind, file: File): Promise<UploadedRef> {
  const contentType = file.type || 'application/octet-stream';

  const { data } = await api.post('/uploads-sign', {
    kind,
    fileName: file.name,
    contentType,
    size: file.size,
  });

  if (!data?.uploadUrl || !data?.key) {
    throw new Error('Could not prepare the upload.');
  }

  // IMPORTANT: send ONLY Content-Type. Adding any extra header (e.g. Authorization,
  // x-amz-*) that was not included in the signature will cause R2 to reject the request.
  const put = await fetch(data.uploadUrl as string, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: file,
  });

  if (!put.ok) {
    throw new Error('Upload failed. Please try again.');
  }

  return { key: data.key, fileName: file.name, mimeType: contentType, size: file.size };
}

