import { prisma } from './prisma';
import type { ActivityAction } from '@prisma/client';

/** Records an admin activity-log entry (best-effort — never throws). */
export async function logActivity(
  adminId: string | null,
  action: ActivityAction,
  details?: string,
  ipAddress?: string,
): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: { adminId: adminId ?? undefined, action, details, ipAddress },
    });
  } catch (err) {
    console.error('logActivity failed:', err);
  }
}
