import type { HandlerEvent, HandlerResponse } from '@netlify/functions';

/**
 * Origin allow-list.
 * Reflects the requesting origin if it's on the list (required for
 * credentialed cross-origin requests). Falls back to the primary domain for
 * unknown origins so we never send a wildcard on auth-bearing routes.
 */
const ALLOWED_ORIGINS = new Set([
  'https://comun2026.com',
  'https://www.comun2026.com',
  'https://comun2026.netlify.app',
  // Allow any Netlify preview deploy (deploy-preview-N--comun2026.netlify.app)
]);

function allowedOrigin(event: HandlerEvent): string {
  const origin = event.headers['origin'] || event.headers['Origin'] || '';
  // Exact match or Netlify preview deploy match
  if (ALLOWED_ORIGINS.has(origin) || /^https:\/\/deploy-preview-\d+--comun2026\.netlify\.app$/.test(origin)) {
    return origin;
  }
  // Localhost in dev
  if (/^http:\/\/localhost(:\d+)?$/.test(origin) || /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) {
    return origin;
  }
  // Fallback — do NOT return '*' on authenticated routes; return primary domain.
  return 'https://comun2026.com';
}

export function corsHeaders(event: HandlerEvent) {
  return {
    'Access-Control-Allow-Origin': allowedOrigin(event),
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Vary': 'Origin',
  };
}

// Legacy static export kept for callers that don't have event context (e.g. registration-pdf).
// Still better than '*' because registration-pdf is unauthenticated.
export const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
};

export function json(statusCode: number, body: unknown, event?: HandlerEvent): HandlerResponse {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', ...(event ? corsHeaders(event) : CORS) },
    body: JSON.stringify(body),
  };
}

/** 200 with `{ success: true, ...payload }`. */
export const ok = (payload: Record<string, unknown> = {}, event?: HandlerEvent): HandlerResponse =>
  json(200, { success: true, ...payload }, event);

/** Error response with `{ success: false, message }`. */
export const fail = (status: number, message: string, extra: Record<string, unknown> = {}, event?: HandlerEvent): HandlerResponse =>
  json(status, { success: false, message, ...extra }, event);

/** CORS preflight. */
export const preflight = (event?: HandlerEvent): HandlerResponse => ({
  statusCode: 204,
  headers: event ? corsHeaders(event) : CORS,
  body: '',
});

export function parseBody<T = Record<string, unknown>>(event: HandlerEvent): T {
  if (!event.body) return {} as T;
  try {
    return JSON.parse(event.body) as T;
  } catch {
    return {} as T;
  }
}

/** Best-effort client IP + user-agent for logging. */
export function clientInfo(event: HandlerEvent) {
  const ipRaw =
    event.headers['x-nf-client-connection-ip'] ||
    event.headers['x-forwarded-for'] ||
    '';
  const ua = event.headers['user-agent'] || '';
  return { ip: String(ipRaw).split(',')[0].trim(), userAgent: ua };
}
