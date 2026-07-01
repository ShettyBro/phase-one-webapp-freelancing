import type { HandlerEvent, HandlerResponse } from '@netlify/functions';

export const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
};

export function json(statusCode: number, body: unknown): HandlerResponse {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', ...CORS },
    body: JSON.stringify(body),
  };
}

/** 200 with `{ success: true, ...payload }`. */
export const ok = (payload: Record<string, unknown> = {}): HandlerResponse =>
  json(200, { success: true, ...payload });

/** Error response with `{ success: false, message }`. */
export const fail = (status: number, message: string, extra: Record<string, unknown> = {}): HandlerResponse =>
  json(status, { success: false, message, ...extra });

/** CORS preflight. */
export const preflight = (): HandlerResponse => ({ statusCode: 204, headers: CORS, body: '' });

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
