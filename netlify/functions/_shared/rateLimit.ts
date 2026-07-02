/**
 * _shared/rateLimit.ts
 * Lightweight in-process sliding-window rate limiter.
 *
 * NOTE: Netlify Functions share a warm instance for a short window, so this
 * provides meaningful throttling while remaining stateless across cold starts.
 * For a stricter guarantee, replace the Map with a Redis/KV store.
 */

interface Window {
  count: number;
  resetAt: number; // epoch ms
}

const store = new Map<string, Window>();

/**
 * Checks whether a key (IP + action) has exceeded its limit in the window.
 * @param key     Unique string, e.g. `login:1.2.3.4`
 * @param limit   Max allowed requests in the window
 * @param windowMs Window size in milliseconds
 * @returns `true` if the request is ALLOWED, `false` if the limit is exceeded
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  let win = store.get(key);

  if (!win || now >= win.resetAt) {
    // Start a fresh window
    win = { count: 1, resetAt: now + windowMs };
    store.set(key, win);
    return true;
  }

  win.count++;
  if (win.count > limit) {
    return false; // Rate limit exceeded
  }
  return true;
}

/**
 * Convenience helper — returns a 429 response body when rate-limited.
 * Callers should check `checkRateLimit` first, then call this for the response.
 */
export const RATE_LIMIT_RESPONSE = {
  statusCode: 429,
  headers: {
    'Content-Type': 'application/json',
    'Retry-After': '60',
    'Access-Control-Allow-Origin': '*',
  },
  body: JSON.stringify({ success: false, message: 'Too many requests. Please try again later.' }),
};
