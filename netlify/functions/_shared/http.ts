import { AsyncLocalStorage } from 'async_hooks';
import type { HandlerEvent, HandlerResponse } from '@netlify/functions';

/**
 * CORS for a credentialed cross-origin setup (Vercel frontend + Netlify API).
 *
 * Because the frontend sends requests with `credentials: 'include'` (the auth
 * token lives in an httpOnly cookie — fix #10), the browser requires:
 *   1. `Access-Control-Allow-Credentials: true`
 *   2. `Access-Control-Allow-Origin` set to the EXACT requesting origin — a
 *      wildcard `*` is rejected by the browser on credentialed requests.
 *
 * We use AsyncLocalStorage so every helper (ok, fail, preflight, json) can
 * automatically reflect the request origin without every call-site needing to
 * pass `event`. Each handler must call `setEvent(event)` at the very top, or
 * wrap with the exported `withEvent` helper.
 */

// ── AsyncLocalStorage for per-request event context ─────────────────────────
const eventStorage = new AsyncLocalStorage<HandlerEvent>();

/**
 * Stores the current request event in async context.
 * Call this at the very top of each handler, or use `withEvent`.
 */
export function setEvent(event: HandlerEvent): void {
  // AsyncLocalStorage.run is the correct API; setEvent is a convenience alias
  // that runs the rest of the current async chain inside the correct context.
  // Because handlers are top-level async functions we instead store the event
  // in a per-invocation module variable (serverless = single-concurrent call).
  _event = event;
}

// Serverless functions are single-threaded per invocation, so a module-level
// variable is safe here (no concurrent requests in the same module instance).
let _event: HandlerEvent | null = null;

// ── CORS allow-list ──────────────────────────────────────────────────────────
const PRIMARY_ORIGIN = (process.env.PUBLIC_SITE_URL || 'https://cottonsmun26.com').replace(/\/$/, '');

const ALLOWED_ORIGINS = new Set<string>([
  PRIMARY_ORIGIN,
  'https://cottonsmun26.com',
  'https://www.cottonsmun26.com',
  'https://comun2026.netlify.app',
]);

/** Resolves the Access-Control-Allow-Origin value for a request. */
function resolveOrigin(event?: HandlerEvent | null): string {
  const ev = event ?? _event;
  const origin = ev?.headers?.['origin'] || ev?.headers?.['Origin'] || '';
  if (origin) {
    const isAllowed =
      ALLOWED_ORIGINS.has(origin) ||
      // Netlify preview deploys: deploy-preview-N--<site>.netlify.app
      /^https:\/\/deploy-preview-\d+--[a-z0-9-]+\.netlify\.app$/.test(origin) ||
      // Local development
      /^http:\/\/localhost(:\d+)?$/.test(origin) ||
      /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin);
    if (isAllowed) return origin;
  }
  // Fallback — never '*' on credentialed routes.
  return PRIMARY_ORIGIN;
}

/** Credentialed CORS headers, reflecting the request origin when known. */
export function corsHeaders(event?: HandlerEvent | null) {
  return {
    'Access-Control-Allow-Origin': resolveOrigin(event),
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    // Fix #10 — required so the browser accepts Set-Cookie from credentialed requests.
    'Access-Control-Allow-Credentials': 'true',
    'Vary': 'Origin',
  };
}

/**
 * Dynamic CORS headers getter — reads the per-invocation _event so this
 * is always correct even when called without an explicit event argument.
 * Used by registration-pdf.ts which builds its own HandlerResponse.
 */
export function getCORS() {
  return corsHeaders(_event);
}

/** @deprecated Use getCORS() instead — this is kept for backward compat only. */
export const CORS = corsHeaders();

export function json(statusCode: number, body: unknown, event?: HandlerEvent | null): HandlerResponse {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(event) },
    body: JSON.stringify(body),
  };
}

/** 200 with `{ success: true, ...payload }`. */
export const ok = (payload: Record<string, unknown> = {}, event?: HandlerEvent | null): HandlerResponse =>
  json(200, { success: true, ...payload }, event);

/** Error response with `{ success: false, message }`. */
export const fail = (status: number, message: string, extra: Record<string, unknown> = {}, event?: HandlerEvent | null): HandlerResponse =>
  json(status, { success: false, message, ...extra }, event);

/** CORS preflight. */
export const preflight = (event?: HandlerEvent | null): HandlerResponse => ({
  statusCode: 204,
  headers: corsHeaders(event),
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
