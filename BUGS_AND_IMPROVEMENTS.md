# Bugs & Improvements — CoMUN 2026 Web App (`phase-one-webapp-freelancing`)

**Date:** 2026-07-02
**Scope:** Functional bugs + quality/UX/reliability improvements across **backend** (`netlify/functions/**`, `prisma/**`) and **frontend** (`src/**`).
**Companion doc:** See `SECURITY_AUDIT.md` for the security-specific findings. This file focuses on *correctness*, *reliability*, and *developer/UX improvements*. A few items overlap with the security audit and are cross-referenced.

---

## TL;DR

The app works and is well-structured, but I found **one genuine broken-access-control bug** (authorization enforced only in the UI, not the API), **a cross-browser download bug**, a **committee/UX inconsistency**, several **error-handling gaps** in the admin panel, and **scalability limits** in the bulk-export functions. None block a small event, but the access-control and download bugs should be fixed before launch.

### Bugs at a glance

| # | Area | Severity | Bug |
|---|------|----------|-----|
| B1 | Backend + Frontend | **High** | Delete-registration & ZIP/PII exports are gated to Super Admin **only in the UI**; the API accepts any admin |
| B2 | Frontend | **Medium** | File downloads (`admin-export`, admin PDF) don't append the `<a>` to the DOM → fail in Firefox/Safari |
| B3 | Frontend | **Medium** | "Single Delegation — open to all committees" but the form **excludes DISEC** from the single dropdown |
| B4 | Frontend | **Medium** | Admin search has no request cancellation → out-of-order responses can show stale results |
| B5 | Frontend | **Low-Med** | `openDetail`, `toggle`, `doExport` etc. have no error handling → infinite spinners / silent failures on network error |
| B6 | Backend | **Low-Med** | Bulk ZIP exports buffer *every* file in function memory → OOM/timeout as data grows |
| B7 | Backend | **Low** | Double-delegation: two delegates with the same email/phone aren't checked in-request; only caught by a DB constraint with a generic message |
| B8 | Backend | **Low** | `admin-registrations` list silently caps at 500 rows with no "more results" indication |
| B9 | Backend | **Low** | Immediate post-registration PDF download can 404/403 under Neon read-replica lag |
| B10 | Frontend | **Low** | No React error boundary → any render error blanks the whole SPA |
| B11 | Backend | **Low** | SMTP uses `secure:false` on port 587 without `requireTLS` → mail may go plaintext if the server allows |

---

## Backend

### B1. [High] Authorization enforced only on the client — API allows any admin
`src/pages/admin/AdminRegistrations.tsx` hides the **Delete** button and the **Institution ZIP / ID-Proofs ZIP** exports behind `isSuperAdmin` (see the `Fix #11` comments at lines 133, 192, 239). But the backend does not match:

```ts
// netlify/functions/admin-registrations.ts  (DELETE)
const auth = authenticate(event);          // ← no role requirement
...
if (event.httpMethod === 'DELETE' && id) { await prisma.registration.delete(...) }
```
```ts
// netlify/functions/admin-export.ts
const auth = authenticate(event);          // ← no role requirement
// serves id-proof-zip / institutional-zip (all PII) to ANY admin token
```

**Impact:** A regular `ADMIN` can still call `DELETE /api/admin-registrations?id=…` and `GET /api/admin-export?type=id-proof-zip` directly (curl/fetch) and delete records or download all delegate ID proofs — the UI gate is cosmetic. Client-side checks are not a security boundary.

**Fix:** Enforce the role on the server for the privileged operations:
```ts
const auth = authenticate(event, 'SUPER_ADMIN');   // for DELETE + ZIP/PII exports
```
(or split the export types so only the bulk-PII ones require Super Admin). This also appears as security finding #11 in `SECURITY_AUDIT.md`.

---

### B6. [Low-Med] Bulk ZIP exports load all files into memory
`admin-export.ts` (`institutional-zip`, `id-proof-zip`) fetches every R2 object into memory and builds the ZIP in-process:

```ts
await Promise.all(regs.flatMap((r) => r.files.map(async (f) => {
  const buf = await downloadR2File(f.r2Key);   // full file in memory
  zip.file(filename, buf);
})));
const zipBuf = await zip.generateAsync({ type: 'nodebuffer', ... }); // whole ZIP in memory
```

**Impact:** Netlify Functions have tight memory (~1 GB) and a ~10 s (background: longer) limit. With a few hundred ID proofs (up to 4 MB each) this will OOM or time out, and the whole export fails with a generic 500.

**Fix:** Stream to R2 and return a presigned link, paginate the export, or move to a background/scheduled function. At minimum, cap the count and surface a clear "too many files, contact support" message.

---

### B7. [Low] Double delegation — no in-request duplicate check between the two delegates
`register-individual.ts` checks each delegate's email/phone against the DB, but not against **each other** within the same submission. If a user enters the same email/phone for both delegates, the pre-check passes (neither exists yet), then the nested `create` violates `@@unique([email])`/`@@unique([phone])` on `Delegate` → caught as `P2002` and returned as the generic "already exists" duplicate message.

**Impact:** Confusing UX — the user is told a registration "already exists" when really they just duplicated their own delegate.

**Fix:** Before creating, validate `delegates[0].email !== delegates[1].email` and same for phone, with a specific message ("Delegate 1 and Delegate 2 must have different email/phone").

---

### B8. [Low] Registration list silently truncates at 500
`admin-registrations.ts` caps `take` at 500. The admin UI paginates client-side over whatever it received, so beyond 500 records the newest-500 window is all that's ever visible — with no indication that rows are missing.

**Fix:** Move pagination server-side (cursor or `skip`/`take`) and return a total count, or at least show a "showing latest 500" notice.

---

### B9. [Low] Read-after-write race on immediate PDF download
After `register-individual`/`register-institutional` returns, `RegistrationSuccess` immediately calls `registration-pdf`. On Neon's pooled/replica setup a just-written row may not be visible instantly, yielding a spurious 404/403 ("phone doesn't match").

**Fix:** The UI already degrades gracefully (points users to the Retrieve page), but consider a short retry/backoff, or read from the primary for this endpoint.

---

### B11. [Low] SMTP transport doesn't force TLS
`_shared/email.ts`:
```ts
nodemailer.createTransport({ host, port: 587, secure: false, auth: {...} });
```
`secure:false` on 587 relies on opportunistic STARTTLS; if the server doesn't advertise it, credentials/content can go in cleartext.

**Fix:** Add `requireTLS: true` (Brevo supports STARTTLS on 587), or use `secure:true` on port 465.

### Minor backend notes
- `generateUniqueApplicationId` gives up after 6 attempts and throws → registration fails hard. Fine given the ~1 B keyspace, but log/alert if it ever triggers.
- Empty stub dirs `api/ad/.gitkeep`, `api/register/.gitkeep` are dead scaffolding (real API is under `netlify/functions/`) — remove to avoid confusion.
- `_shared/domain.ts` has `// TODO: confirm final amounts` — fees (1500/2800) are hardcoded and written onto every registration + PDF; confirm before launch.

---

## Frontend

### B2. [Medium] Downloads fail in Firefox/Safari — anchor not added to the DOM
`AdminRegistrations.tsx` builds a temporary `<a>` and calls `.click()` **without appending it to the document**:

```ts
// downloadExport (line ~38) and downloadPdf (line ~274)
const a = document.createElement('a');
a.href = url; a.download = filename; a.click();   // ← never appended
URL.revokeObjectURL(url);
```

Firefox (and some Safari versions) ignore `.click()` on a detached anchor, so exports/PDF downloads silently do nothing. Note `src/utils/pdfApi.ts` does it correctly (`appendChild` → `click` → `remove`) — the admin helpers are inconsistent with it.

**Fix:** Mirror `pdfApi.ts`: `document.body.appendChild(a); a.click(); a.remove();` and revoke the object URL slightly later (e.g. in a `setTimeout`) so the download isn't cancelled by early revocation.

---

### B3. [Medium] DISEC excluded from Single Delegation contradicts the UI copy
The delegation step says Single is *"Open to all committees"* (`RegisterPage.tsx:389`), but the single form removes DISEC:

```tsx
// IndividualForm.tsx:153
options={COMMITTEES
  .filter((c) => c.code !== DOUBLE_COMMITTEE)   // ← DISEC dropped for SINGLE
  .map(...)}
```

Meanwhile the backend (`register-individual.ts`) happily accepts a SINGLE registration for DISEC. So either (a) single DISEC should be allowed and the filter is a bug, or (b) DISEC is double-only and the copy is wrong. Right now the two disagree.

**Fix:** Decide the rule and make copy + form + backend agree. If single DISEC is allowed, drop the filter; if not, update the "open to all committees" text and reject single-DISEC server-side.

---

### B4. [Medium] Admin search has no request cancellation (stale results)
`AdminRegistrations.tsx` debounces `load()` by 300 ms but doesn't cancel in-flight requests:

```ts
useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);
```

If a slow response for query "a" resolves after the response for "ab", the list shows results for the wrong query. Same pattern applies to `AdminMessages`.

**Fix:** Use an `AbortController` per request (axios `signal`) and abort the previous one, or guard with a request-sequence/latest-wins token.

---

### B5. [Low-Med] Missing error handling → infinite spinners / silent failures
Several admin async actions have no `catch`, so a network error (or a non-401 API error) leaves the UI stuck or gives no feedback:

- `AdminRegistrations.openDetail` — on failure `detail` stays `null`, the drawer spins forever.
- `AdminRegistrations.load` — no catch; a thrown error leaves `loading` true (spinner forever).
- `AdminSettings.toggle` — swallows errors in `finally` but never tells the user the save failed; the toggle silently reverts.

**Fix:** Add `try/catch` with a visible error/toast and always reset `loading`/`saving`. The global axios interceptor only handles 401 (redirect to login); everything else needs local handling.

---

### B10. [Low] No React error boundary
There's no top-level error boundary, so any render-time exception in a component blanks the entire SPA (white screen) instead of a graceful fallback.

**Fix:** Wrap the router in an error boundary with a friendly retry UI.

### Minor frontend notes
- Admin token in `localStorage` (see `SECURITY_AUDIT.md` #10) — XSS-exfiltratable.
- `URL.revokeObjectURL(url)` is called immediately after `.click()` in the admin download helpers — can cancel the download in some browsers; defer it (tied to B2).
- `RegistrationSuccess` shows "A confirmation email has been sent" unconditionally, even though the backend sends email best-effort and may skip it if SMTP is unconfigured — consider softening the wording.

---

## Recommended improvements (both layers)

**Correctness / security parity**
1. Enforce Super-Admin on the server for delete + bulk-PII export (B1) — align API with the UI gating already present.
2. Add server-side rate limiting (login brute-force, contact spam, upload abuse) — see `SECURITY_AUDIT.md` #3/#4.

**Reliability**
3. Make bulk exports streaming/paginated or background jobs (B6).
4. Server-side pagination + total counts for registrations & messages (B8).
5. Add a scheduled cleanup for orphaned R2 uploads (files never attached to a registration).

**UX / DX**
6. Fix cross-browser downloads and centralize a single `downloadBlob(blob, filename)` helper reused by `pdfApi`, exports, and admin PDF (B2).
7. Add `AbortController`-based cancellation to all search inputs (B4).
8. Add error boundaries + a toast system; give every async admin action a catch (B5, B10).
9. Resolve the DISEC single-delegation inconsistency across copy/form/API (B3).
10. Add in-request duplicate detection for double delegation with a specific message (B7).

**Housekeeping**
11. Remove dead stub dirs (`api/ad`, `api/register`); confirm the `FEES` TODO; add `requireTLS` to SMTP (B11).
12. Consider a lightweight test pass (endpoint smoke tests + a form-submit e2e) — there are currently no tests in the repo.

---

*Generated by automated code review (static analysis). Validate each item against runtime behaviour and the production config before prioritizing. Severity reflects functional/operational impact; see `SECURITY_AUDIT.md` for the security-weighted view.*
