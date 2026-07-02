import type { Handler } from '@netlify/functions';
import { Readable } from 'stream';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { prisma } from './_shared/prisma';
import { fail, preflight, CORS } from './_shared/http';
import { authenticate } from './_shared/auth';
import { R2_BUCKET, r2Configured } from './_shared/r2';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const XLSX = require('xlsx');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const JSZip = require('jszip');

type ExportType = 'individual-single' | 'individual-double' | 'institutional-zip' | 'id-proof-zip';

function r2Client(): S3Client {
  return new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT || '',
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    },
    forcePathStyle: true,
  });
}

async function downloadR2File(r2Key: string): Promise<Buffer | null> {
  if (!r2Configured()) return null;
  try {
    const cl = r2Client();
    const res = await cl.send(new GetObjectCommand({ Bucket: R2_BUCKET, Key: r2Key }));
    const body = res.Body as Readable;
    const chunks: Buffer[] = [];
    for await (const chunk of body) chunks.push(Buffer.from(chunk));
    return Buffer.concat(chunks);
  } catch {
    return null;
  }
}

function safeFilename(str: string): string {
  return str.replace(/[^a-zA-Z0-9_\-. ]/g, '_').trim();
}

/**
 * GET /api/admin-export?type=<ExportType>
 * Admin-only. Generates and streams CSV/XLSX/ZIP exports.
 *
 * type=individual-single → XLSX: Individual Single delegates
 * type=individual-double → XLSX: Individual Double delegates (Delegate 1 + Delegate 2)
 * type=institutional-zip → ZIP: Master_List.xlsx + institution folders with uploaded spreadsheets
 * type=id-proof-zip      → ZIP: All delegate ID proofs renamed ApplicationID_Name.ext
 */
export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();
  if (event.httpMethod !== 'GET') return fail(405, 'Method not allowed.');

  // Fix #11 — ZIP exports contain bulk PII; gate them to SUPER_ADMIN.
  // XLSX exports (individual-single, individual-double) remain accessible to all admins.
  const type = event.queryStringParameters?.type as ExportType | undefined;
  if (!type) return fail(400, 'type query param is required.');

  const isZipExport = type === 'institutional-zip' || type === 'id-proof-zip';
  const auth = await authenticate(event, isZipExport ? 'SUPER_ADMIN' : undefined);
  if ('error' in auth) return fail(auth.error.status, auth.error.message, { expired: auth.error.expired });

  try {
    // ── Export 1: Individual Single ─────────────────────────────────────────
    if (type === 'individual-single') {
      const regs = await prisma.registration.findMany({
        where: { type: 'INDIVIDUAL', delegationType: 'SINGLE' },
        orderBy: { submittedAt: 'desc' },
        include: { delegates: { orderBy: { position: 'asc' } } },
      });

      const rows = regs.map((r) => {
        const d = r.delegates[0];
        return {
          'Application ID': r.applicationId,
          'Registration Date': r.submittedAt.toISOString().slice(0, 10),
          'Name': d?.name ?? '',
          'Email': d?.email ?? '',
          'Phone': d?.phone ?? '',
          'Grade': d?.grade ?? '',
          'Nationality': d?.nationality ?? '',
          'Experience': d?.experience ?? '',
          'Institution': d?.institution ?? '',
          'Committee': r.committee ?? '',
          'Portfolio': r.portfolio ?? '',
          'Amount Payable': r.amountPayable,
        };
      });

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Individual Single');
      const buf: Buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      return {
        statusCode: 200,
        headers: {
          ...CORS,
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': 'attachment; filename="Individual_Single_Delegates.xlsx"',
          'Cache-Control': 'no-store',
        },
        body: buf.toString('base64'),
        isBase64Encoded: true,
      };
    }

    // ── Export 2: Individual Double ─────────────────────────────────────────
    if (type === 'individual-double') {
      const regs = await prisma.registration.findMany({
        where: { type: 'INDIVIDUAL', delegationType: 'DOUBLE' },
        orderBy: { submittedAt: 'desc' },
        include: { delegates: { orderBy: { position: 'asc' } } },
      });

      const rows = regs.map((r) => {
        const d1 = r.delegates[0];
        const d2 = r.delegates[1];
        return {
          'Application ID': r.applicationId,
          'Registration Date': r.submittedAt.toISOString().slice(0, 10),
          'Delegate 1 Name': d1?.name ?? '',
          'Delegate 1 Email': d1?.email ?? '',
          'Delegate 1 Phone': d1?.phone ?? '',
          'Delegate 1 Grade': d1?.grade ?? '',
          'Delegate 1 Nationality': d1?.nationality ?? '',
          'Delegate 1 Experience': d1?.experience ?? '',
          'Delegate 1 Institution': d1?.institution ?? '',
          'Delegate 2 Name': d2?.name ?? '',
          'Delegate 2 Email': d2?.email ?? '',
          'Delegate 2 Phone': d2?.phone ?? '',
          'Delegate 2 Grade': d2?.grade ?? '',
          'Delegate 2 Nationality': d2?.nationality ?? '',
          'Delegate 2 Experience': d2?.experience ?? '',
          'Delegate 2 Institution': d2?.institution ?? '',
          'Committee': r.committee ?? '',
          'Portfolio': r.portfolio ?? '',
          'Amount Payable': r.amountPayable,
        };
      });

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Individual Double');
      const buf: Buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      return {
        statusCode: 200,
        headers: {
          ...CORS,
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': 'attachment; filename="Individual_Double_Delegates.xlsx"',
          'Cache-Control': 'no-store',
        },
        body: buf.toString('base64'),
        isBase64Encoded: true,
      };
    }

    // ── Export 3: Institutional ZIP ─────────────────────────────────────────
    if (type === 'institutional-zip') {
      const regs = await prisma.registration.findMany({
        where: { type: 'INSTITUTIONAL' },
        orderBy: { submittedAt: 'desc' },
        include: { files: { where: { kind: 'SPREADSHEET' } } },
      });

      const zip = new JSZip();

      // Master list sheet
      const masterRows = regs.map((r) => ({
        'Application ID': r.applicationId,
        'Institution': r.institutionName ?? '',
        'Teacher Name': r.teacherName ?? '',
        'Teacher Email': r.teacherEmail ?? '',
        'Teacher Phone': r.teacherPhone ?? '',
        'Head Delegate': r.headName ?? '',
        'Head Email': r.headEmail ?? '',
        'Registration Date': r.submittedAt.toISOString().slice(0, 10),
        'Uploaded Spreadsheet': r.files[0]?.fileName ?? '(none)',
        'Amount Payable': r.amountPayable,
      }));

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(masterRows), 'Master List');
      const masterBuf: Buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      zip.file('Master_List.xlsx', masterBuf);

      // Fix #12 — sequential downloads instead of Promise.all to prevent OOM.
      // Files are downloaded one-by-one and added to the ZIP as we go.
      for (const r of regs) {
        if (!r.files[0]) continue;
        const buf = await downloadR2File(r.files[0].r2Key);
        if (!buf) continue;
        const folder = safeFilename(r.institutionName || r.applicationId);
        zip.folder(folder)!.file(r.files[0].fileName, buf);
      }

      const zipBuf: Buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });

      return {
        statusCode: 200,
        headers: {
          ...CORS,
          'Content-Type': 'application/zip',
          'Content-Disposition': 'attachment; filename="Institutional_Registrations.zip"',
          'Cache-Control': 'no-store',
        },
        body: zipBuf.toString('base64'),
        isBase64Encoded: true,
      };
    }

    // ── Export 4: Individual ID Proof ZIP ───────────────────────────────────
    if (type === 'id-proof-zip') {
      const regs = await prisma.registration.findMany({
        where: { type: 'INDIVIDUAL' },
        orderBy: { submittedAt: 'desc' },
        include: {
          delegates: { orderBy: { position: 'asc' } },
          files: { where: { kind: 'ID_PROOF' } },
        },
      });

      const zip = new JSZip();

      // Fix #12 — sequential downloads to prevent OOM (was Promise.all).
      for (const r of regs) {
        for (const f of r.files) {
          const buf = await downloadR2File(f.r2Key);
          if (!buf) continue;
          const ext = f.fileName.split('.').pop() || 'bin';
          const delegateName = r.delegates[0]?.name ?? 'Unknown';
          const safeName = safeFilename(delegateName).replace(/\s+/g, '_');
          const filename = `${r.applicationId}_${safeName}.${ext}`;
          zip.file(filename, buf);
        }
      }

      const zipBuf: Buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });

      return {
        statusCode: 200,
        headers: {
          ...CORS,
          'Content-Type': 'application/zip',
          'Content-Disposition': 'attachment; filename="Individual_ID_Proofs.zip"',
          'Cache-Control': 'no-store',
        },
        body: zipBuf.toString('base64'),
        isBase64Encoded: true,
      };
    }

    return fail(400, `Unknown export type: ${type}`);
  } catch (err) {
    console.error('admin-export error:', err);
    return fail(500, 'Export failed.');
  }
};
