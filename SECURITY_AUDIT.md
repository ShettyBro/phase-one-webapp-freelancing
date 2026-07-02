# Security Audit & Code Review — CoMUN 2026 Web App (`phase-one-webapp-freelancing`)

**Audit date:** 2026-07-02
**Scope:** `netlify/functions/**` (serverless API), `prisma/**`, `src/**` (React SPA), config (`netlify.toml`, `vercel.json`, `.env*`).
**Stack:** React 18 + Vite SPA · Netlify Functions (TypeScript) · Prisma + Neon PostgreSQL · Cloudflare R2 (S3) · JWT (bcrypt) · Brevo SMTP.
**Method:** Manual static review of every backend function, shared module, auth flow, DB schema, and the client auth layer.

---

## Executive summary

The codebase is generally clean and thoughtfully written: **Prisma is used everywhere (no raw SQL → no SQL injection), passwords are bcrypt-hashed (cost 12), fees are set server-side (no price tampering), email values are HTML-escaped, IDs use CSPRNG (`crypto.randomInt`/`randomUUID`), and secrets are correctly git-ignored.**

However, there are several real security gaps — the most important being that **deactivating or deleting an admin does not revoke their access**, **super-admin tokens never expire**, **the file-upload signing endpoint is unauthenticated**, and **there is no rate limiting anywhere** (login brute-force, contact spam, R2 upload abuse). None are SQL-injection-class, but combined they materially weaken the admin trust boundary.

### Findings by severity

| # | Severity | Finding | Location |
|---|----------|---------|----------|
| 1 | **High** | Deactivated/deleted admins keep full API access (no `isActive`/existence recheck on data endpoints) | `_shared/auth.ts` + all admin fns |
| 2 | **High** | Super-admin JWTs never expire; no server-side revocation/logout | `_shared/auth.ts`, `auth-logout.ts` |
| 3 | **Medium** | `uploads-sign` is unauthenticated → anyone can mint R2 PUT URLs (storage/cost DoS) | `uploads-sign.ts` |
| 4 | **Medium** | No rate limiting on login (brute-force), contact (spam), or PDF-retrieve (enumeration) | all public POST/GET fns |
| 5 | **Medium** | Wildcard CORS (`Access-Control-Allow-Origin: *`) on authenticated admin endpoints | `_shared/http.ts` |
| 6 | **Medium** | `resource-upload-sign` performs **no** MIME/type validation (unlike `uploads-sign`) | `resource-upload-sign.ts` |
| 7 | **Low-Med** | Response-header injection via user-controlled `fileName` in presigned `Content-Disposition` | `_shared/r2.ts`, `admin-registrations.ts` |
| 8 | **Low-Med** | Weak ownership check on public PDF retrieve (phone last-10-digits only) | `registration-pdf.ts` |
| 9 | **Low** | JWT verified without pinning `algorithms` | `_shared/auth.ts` |
| 10 | **Low** | Admin JWT/token stored in `localStorage` (XSS-exfiltratable) | `src/utils/auth.ts` |
| 11 | **Low** | No role granularity — any `ADMIN` can delete registrations & bulk-export all PII | admin data fns |
| 12 | **Info/Reliability** | Bulk ZIP exports load every file into function memory (OOM/timeout at scale) | `admin-export.ts` |
| 13 | **Info** | Empty stub dirs (`api/ad`, `api/register`) & unconfirmed hardcoded fees (`TODO`) | `api/**/.gitkeep`, `_shared/domain.ts` |

---

## Detailed findings

### 1. [High] Deactivating or deleting an admin does not revoke their access

`authenticate()` only verifies the JWT signature and (optionally) the role claim. It never confirms the admin still exists or is still active:

```ts
// _shared/auth.ts
const claims = jwt.verify(token, SECRET) as AdminClaims;
if (requiredRole && claims.role !== requiredRole) { ... }
return { claims };   // no DB lookup, no isActive check
```

`isActive` is checked **only** in `auth-login.ts` and `auth-me.ts`. Every data endpoint — `admin-registrations`, `admin-export`, `admin-messages`, `admin-resources`, `resource-categories`, `settings`, `admin-dashboard`, `admin-logs`, `superadmin-admins` — calls `authenticate(event)` and trusts the token alone.

**Impact:** When a Super Admin disables an admin (`isActive=false`) or the account is deleted, the previously issued JWT **continues to work** for the full token lifetime (5 h for admins, **forever** for a super admin — see #2). The admin can still read/export all registrant PII, delete records, and toggle registration. This defeats the primary purpose of the admin-disable feature.

**Fix:** In `authenticate()` (or a wrapper), load the admin by `claims.sub` and reject if missing or `!isActive`. To avoid a DB hit per call, cache briefly, or at minimum enforce it on all mutating/PII endpoints.

---

### 2. [High] Super-admin tokens never expire and cannot be revoked

```ts
// _shared/auth.ts — signAdminToken
if (claims.role === 'SUPER_ADMIN') {
  return { token: jwt.sign(claims, SECRET), expiresInMs: 0 }; // no expiry
}
```

Super-admin JWTs are signed with **no `expiresIn`**. Combined with #1 (no server-side session state and logout is client-only — `auth-logout.ts` merely stamps a log row), a leaked super-admin token grants **permanent, unrevocable** full control. There is no deny-list, `jti`, or token-version mechanism.

**Fix:** Give super admins an expiry too (even if long, e.g. 24 h) and add a revocation path — e.g. a `tokenVersion` column on `Admin` embedded in the claims and checked on verify, so password reset / disable invalidates all outstanding tokens.

---

### 3. [Medium] `uploads-sign` is unauthenticated — R2 upload/cost abuse

`uploads-sign.ts` has **no `authenticate()` call** (by design, since public registrants must upload before they have an account). Any anonymous caller can repeatedly request presigned PUT URLs and push up to 4 MB (ID proofs) / 8 MB (spreadsheets) objects into the bucket:

```ts
const key = buildKey(rule.prefix, fileName);
const uploadUrl = await presignUpload(key, contentType, 300);
return ok({ uploadUrl, key, ... });
```

**Impact:** Unbounded writes to R2 → storage growth and egress/operation billing abuse (financial DoS). Orphaned objects (uploads never attached to a registration) are never garbage-collected.

**Fix:** Add rate limiting / a lightweight proof-of-work or CAPTCHA/turnstile token, cap per-IP requests, and schedule cleanup of R2 objects with no owning registration after N hours. Because `presignUpload` deliberately omits `ContentType` from the signature (documented in `r2.ts`), the actual uploaded bytes/type are **not** constrained by the sign request — validation is advisory only.

---

### 4. [Medium] No rate limiting anywhere

`grep` for `rate.?limit|throttle|lockout|attempts` returns **no matches**. Consequences:

- **`auth-login`** — unlimited password guesses. bcrypt(12) slows each attempt but nothing blocks sustained brute force or credential stuffing. Failed attempts are logged but never trigger lockout.
- **`contact`** — unauthenticated insert; a bot can flood `ContactMessage` (DB bloat, admin-inbox spam).
- **`registration-pdf`** / **`registration-*`** — no throttle on repeated attempts.

**Fix:** Add per-IP rate limiting (Netlify edge, an upstream WAF/Cloudflare rule, or a token-bucket in the DB), plus account lockout / exponential backoff after repeated login failures.

---

### 5. [Medium] Wildcard CORS on authenticated endpoints

```ts
// _shared/http.ts
export const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', ... };
```

`*` is applied uniformly, including to admin endpoints that accept `Authorization`. Auth uses a Bearer token (not cookies), so classic CSRF doesn't apply, but the wildcard lets **any** website script the API and, if it can obtain a token (e.g. via #10 XSS), use it cross-origin without restriction.

**Fix:** Reflect an allow-list of known origins (prod domain + `netlify dev`) instead of `*`, at least on authenticated routes.

---

### 6. [Medium] `resource-upload-sign` does no content-type validation

`uploads-sign.ts` validates `contentType` against an allow-list and enforces per-kind size caps. `resource-upload-sign.ts` (admin) validates **only size** — no MIME/extension check:

```ts
if (size <= 0 || size > RESOURCE_FILE.maxBytes) { ... }   // that's the only content gate
const key = buildKey(prefix, fileName);
const uploadUrl = await presignUpload(key, contentType, 300);
```

Resources are later served publicly (`resources-public.ts` builds `${R2_PUBLIC_BASE_URL}/${r2Key}` or a presigned GET). An admin (or anyone with an admin token, cf. #1) can upload arbitrary file types — including `.html`/`.svg`. If `R2_PUBLIC_BASE_URL` is ever same-origin or a domain trusted by the app, this enables **stored XSS**.

**Fix:** Apply an explicit MIME + extension allow-list for resources, and serve downloads with `Content-Disposition: attachment` / a non-executing content type.

---

### 7. [Low-Med] Header injection via user-controlled filename in presigned download

```ts
// _shared/r2.ts
ResponseContentDisposition: downloadName ? `attachment; filename="${downloadName}"` : undefined,
```

`downloadName` is `UploadedFile.fileName`, which originates from the registrant's original `file.name` and is stored unsanitized. It flows here from `admin-registrations.ts` (`presignDownload(f.r2Key, 300, f.fileName)`). A filename containing `"` or CRLF can break out of the header value inside the signed R2 URL.

**Fix:** Sanitize/quote the filename (strip quotes, CR, LF, control chars) before embedding — `admin-export.ts` already has a `safeFilename()` helper that should be reused here.

---

### 8. [Low-Med] Weak ownership proof on public PDF retrieval

`registration-pdf.ts` authorizes purely on `applicationId` + phone, where phone is normalized to the **last 10 digits**:

```ts
const normalizePhone = (p) => p.replace(/\D/g, '').slice(-10);
```

The `applicationId` keyspace (`COMUN26-` + 6 chars of a 32-symbol alphabet ≈ 1.07 B) makes blind enumeration impractical, so this is low risk — but the only secret protecting a registrant's full PII PDF is a guessable/known phone number, with no rate limit (#4) to slow guessing once an `applicationId` is known (e.g. leaked from an email screenshot).

**Fix:** Rate-limit this endpoint and consider an emailed one-time link instead of phone-as-password.

---

### 9. [Low] JWT verified without pinning the algorithm

```ts
jwt.verify(token, SECRET) as AdminClaims;   // no { algorithms: ['HS256'] }
```

With a symmetric secret this is largely safe in `jsonwebtoken` v9 (which won't accept `alg:none` without an explicit key), but pinning `algorithms: ['HS256']` is defense-in-depth against algorithm-confusion and future misconfig.

---

### 10. [Low] Admin token stored in `localStorage`

`src/utils/auth.ts` persists the JWT in `localStorage`. Any XSS in the admin panel can read and exfiltrate it, and (per #2) a stolen super-admin token is permanent. Prefer an httpOnly, `Secure`, `SameSite` cookie for the session token, or accept the risk with a tight CSP and short expiries.

---

### 11. [Low] No role granularity between ADMIN and SUPER_ADMIN on destructive/PII actions

`admin-registrations` **DELETE**, `admin-export` (bulk export of every ID proof + all emails/phones), and `admin-messages` DELETE require only a plain `ADMIN` token. Only login-log viewing and admin management are `SUPER_ADMIN`-gated. Consider whether bulk PII export and hard deletes should be restricted or audited more tightly (they are logged, which is good).

---

### 12. [Info/Reliability] Bulk ZIP exports buffer all files in memory

`admin-export.ts` (`institutional-zip`, `id-proof-zip`) downloads every R2 object into memory and builds the ZIP in-process (`Promise.all(... downloadR2File ...)` → `zip.generateAsync({ type: 'nodebuffer' })`). At scale this will exceed the Netlify Function memory/time limits and fail (or OOM). Not a security bug, but the export feature will silently break as registrations grow. Consider streaming, pagination, or pre-signed client-side fetching.

---

### 13. [Info] Incomplete / stub items

- `api/ad/.gitkeep` and `api/register/.gitkeep` are empty placeholder directories — dead scaffolding (the real API is under `netlify/functions/`). Remove to avoid confusion.
- `_shared/domain.ts`: `// TODO: confirm final amounts with the organizers` — fees (`1500` / `2800`) are hardcoded and unconfirmed; these are written onto every registration and PDF.
- `email.ts` `siteUrl()` falls back to `https://comun2026.netlify.app`; confirm `SITE_URL`/`URL` is set in prod so confirmation-email asset/links resolve to the real domain.

---

## What's already done well (no action needed)

- **No SQL injection** — all DB access is via Prisma's parameterized query builder; no `$queryRaw`/string-built SQL anywhere.
- **Password storage** — `bcrypt.hash(password, 12)`; login uses constant-time `bcrypt.compare`; generated passwords use `crypto.randomInt`.
- **Secrets hygiene** — `.env` is git-ignored and untracked; `.env.example` ships placeholders only.
- **No price tampering** — fee amounts are resolved server-side from `FEES`, never trusted from the client.
- **Email injection** — registrant values are HTML-escaped via `esc()`; recipient addresses are regex-validated.
- **Object keys** — `buildKey()` uses `randomUUID()` + a sanitized extension → no path traversal / key collisions from user filenames.
- **Duplicate-registration races** — handled defensively with a pre-check *and* a Prisma `P2002` unique-constraint fallback.
- **XSS in React views** — contact messages and registrant data are rendered through React (auto-escaped), not `dangerouslySetInnerHTML`.

---

## Prioritized remediation checklist

1. **Enforce `isActive` + existence on every authenticated request** (finding #1) — highest impact, small change in `_shared/auth.ts`.
2. **Add token expiry for super admins + a revocation/`tokenVersion` mechanism** (#2).
3. **Rate-limit login, contact, PDF-retrieve, and `uploads-sign`; add cleanup for orphaned R2 objects** (#3, #4).
4. **Restrict CORS to an allow-list on authenticated routes** (#5).
5. **Add MIME/extension validation to `resource-upload-sign` and serve resources as attachments** (#6).
6. **Sanitize `fileName` before it enters `Content-Disposition`** (#7).
7. Pin JWT `algorithms`, revisit token storage/CSP, and add role gating on destructive/PII actions (#9–#11).

---

*Report generated by automated security review. Findings are based on static analysis; validate each against the production configuration (env vars, Cloudflare/WAF rules, R2 bucket policy) before prioritizing.*
