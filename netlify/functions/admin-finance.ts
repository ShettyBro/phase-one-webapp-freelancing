import type { Handler } from '@netlify/functions';
import { prisma } from './_shared/prisma';
import { ok, fail, preflight, setEvent } from './_shared/http';
import { authenticate } from './_shared/auth';

/**
 * GET /api/admin-finance
 * Admin-only. Revenue summary + per-registration payment records.
 *
 * Payment data lives on the Registration model:
 *   amountPayable    — fee for this registration (INR)
 *   paymentMethod    — ONLINE (paid via bank transfer, reference collected)
 *                      | OFFLINE (to be paid at the registration desk)
 *                      | null   (institutional — billed per delegate at the desk)
 *   paymentReference — UTR / transaction ID (online payments only)
 *
 * "Collected" = ONLINE registrations (reference provided at sign-up).
 * "Pending"   = OFFLINE + institutional (settled at the desk).
 */
export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight(event);
  setEvent(event);
  if (event.httpMethod !== 'GET') return fail(405, 'Method not allowed.');

  const auth = await authenticate(event);
  if ('error' in auth) return fail(auth.error.status, auth.error.message, { expired: auth.error.expired });

  try {
    const regs = await prisma.registration.findMany({
      orderBy: { submittedAt: 'desc' },
      select: {
        id: true,
        applicationId: true,
        type: true,
        delegationType: true,
        committee: true,
        institutionName: true,
        teacherName: true,
        amountPayable: true,
        paymentMethod: true,
        paymentReference: true,
        submittedAt: true,
        delegates: { select: { name: true }, orderBy: { position: 'asc' }, take: 1 },
      },
    });

    const payments = regs.map((r) => ({
      id: r.id,
      applicationId: r.applicationId,
      type: r.type,
      delegationType: r.delegationType,
      committee: r.committee,
      payer:
        r.type === 'INDIVIDUAL'
          ? r.delegates[0]?.name ?? '—'
          : r.institutionName ?? r.teacherName ?? '—',
      amountPayable: r.amountPayable,
      paymentMethod: r.paymentMethod, // 'ONLINE' | 'OFFLINE' | null
      paymentReference: r.paymentReference,
      submittedAt: r.submittedAt,
    }));

    // ── Aggregates ──
    const sum = (list: typeof payments) => list.reduce((acc, p) => acc + p.amountPayable, 0);

    const online = payments.filter((p) => p.paymentMethod === 'ONLINE');
    const offline = payments.filter((p) => p.paymentMethod === 'OFFLINE');
    const atDesk = payments.filter((p) => p.paymentMethod === null); // institutional

    const summary = {
      totalExpected: sum(payments),
      collectedOnline: { count: online.length, amount: sum(online) },
      pendingOffline: { count: offline.length, amount: sum(offline) },
      atDesk: { count: atDesk.length, amount: sum(atDesk) },
      // Online payments where a reference number was actually captured.
      referencesCaptured: online.filter((p) => !!p.paymentReference).length,
    };

    return ok({ summary, payments });
  } catch (err) {
    console.error('admin-finance error:', err);
    return fail(500, 'Could not load finance data.');
  }
};
