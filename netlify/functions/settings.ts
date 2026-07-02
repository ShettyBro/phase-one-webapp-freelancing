import type { Handler } from '@netlify/functions';
import { prisma } from './_shared/prisma';
import { ok, fail, preflight, parseBody, clientInfo } from './_shared/http';
import { authenticate } from './_shared/auth';
import { logActivity } from './_shared/logs';

const REGISTRATION_KEY = 'registration_open';

async function getRegistrationOpen(): Promise<boolean> {
  const row = await prisma.setting.findUnique({ where: { key: REGISTRATION_KEY } });
  // Default OPEN if the setting has never been written.
  return row ? row.value === 'true' : true;
}

/**
 * GET  /api/settings  → public: { registrationOpen }
 * PUT  /api/settings  → admin: toggle registration { registrationOpen: boolean }
 */
export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();

  try {
    if (event.httpMethod === 'GET') {
      return ok({ registrationOpen: await getRegistrationOpen() });
    }

    if (event.httpMethod === 'PUT') {
      const auth = await authenticate(event);
      if ('error' in auth) return fail(auth.error.status, auth.error.message, { expired: auth.error.expired });

      const body = parseBody<{ registrationOpen?: boolean }>(event);
      if (typeof body.registrationOpen !== 'boolean') {
        return fail(400, 'registrationOpen (boolean) is required.');
      }

      await prisma.setting.upsert({
        where: { key: REGISTRATION_KEY },
        update: { value: String(body.registrationOpen) },
        create: { key: REGISTRATION_KEY, value: String(body.registrationOpen) },
      });

      const { ip } = clientInfo(event);
      await logActivity(
        auth.claims.sub,
        'REGISTRATION_TOGGLE',
        `Registrations turned ${body.registrationOpen ? 'ON' : 'OFF'}`,
        ip,
      );

      return ok({ registrationOpen: body.registrationOpen });
    }

    return fail(405, 'Method not allowed.');
  } catch (err) {
    console.error('settings error:', err);
    return fail(500, 'Server error.');
  }
};
