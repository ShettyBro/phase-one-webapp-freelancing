# CoMUN 2026 — AI Project Context & Handoff Report

> **Purpose of this file:** A machine-oriented brief so an AI agent can understand the
> current state of this codebase and continue work without re-discovering everything.
> Read this first, then open `src/pages/HomePage.tsx` and `src/components/layout/`.

---

## 1. What This Project Is

A **landing page (single-page marketing site)** for **CoMUN 2026 — Cottons Model United
Nations**, a prestige diplomatic / Model-UN conference (theme: *"Peace Over Power"*,
dates: *30 July – 1 August 2026*).

The brief is to feel like the **official site of an international diplomatic conference**:
prestige, peace, diplomacy, leadership, professionalism, luxury — **not** a startup/SaaS/
generic-college-event look.

The repo began as a generic full-stack boilerplate ("Phase One Web Application"). Only the
**frontend landing page** has been built so far. Backend (Prisma/Postgres/JWT) is scaffolded
but **intentionally not implemented yet** — the frontend is structured for clean later
integration.

---

## 2. Tech Stack (actual versions in `package.json`)

| Layer | Tech |
|---|---|
| Framework | **React 18.3** + **TypeScript 5.2** (strict mode) |
| Build | **Vite 5.3** (`@vitejs/plugin-react`) |
| Styling | **Tailwind CSS 3.4** + PostCSS + Autoprefixer |
| Animation | **Framer Motion 11.2** |
| Routing | **react-router-dom 6.23** |
| Icons | **lucide-react** |
| HTTP (future) | **axios** (pre-wired in `src/utils/api.ts`) |
| Backend (future, NOT built) | Prisma 5.15, PostgreSQL/Neon, JWT (`jsonwebtoken`, `bcryptjs`) |

> Note: the original brief mentioned React 19 / Neon; the repo actually runs **React 18.3**.
> Do not "upgrade" unless asked — everything is built and tested against 18.3.

### Commands
```bash
npm run dev        # vite dev server → http://localhost:5173 (may use 5174 if busy)
npm run build      # vite build → dist/
npx tsc --noEmit   # typecheck (build script does NOT typecheck — run this separately)
```
**Always run `npx tsc --noEmit` AND `npx vite build` after changes.** The `build` script is
just `vite build` (no type checking), so type errors only surface via `tsc`.

---

## 3. Critical Config Quirks (read before touching assets/build)

- **`vite.config.ts` sets `publicDir: 'src/public'`** — static assets live in
  `src/public/`, **not** a root `/public`. Reference them at runtime by root path,
  e.g. `src/public/logo.png` → `<img src="/logo.png" />`.
- **`tsconfig.json`** has `strict: true` but `noUnusedLocals: false` — unused vars won't
  fail the build, but keep code clean anyway.
- Fonts loaded via `<link>` in **`index.html`** (Google Fonts):
  **Cormorant Garamond** (serif/display) + **Inter** (sans). No local font files.

### Assets in `src/public/`
| File | Use |
|---|---|
| `logo.png` | CoMUN crest — hero + navbar + footer |
| `un-assembly.jpg` | UN General Assembly Hall photo — **hero background** (downloaded from Wikimedia Commons, ~2.2 MB) |
| `dove_peace.png` | Teal peace dove — recurring **watermark motif** across sections + Theme showpiece |
| `v2 TEASER.mp4` | Official teaser (~20 MB) — `VideoSection`, **no autoplay** |

---

## 4. Design System

### Color tokens (`tailwind.config.js` → `theme.extend.colors`)
Prefix everything `comun-*`. The dark tokens are **navy-tinted** (deliberately, so the
photo hero blends into the sections — do not revert to neutral blacks):

| Token | Hex | Role |
|---|---|---|
| `comun-black` | `#070e1d` | base dark (matches body bg) |
| `comun-charcoal` | `#0c1730` | alternate section band |
| `comun-navy` | `#0a1428` | mid navy |
| `comun-navy-mid` | `#122844` | lighter navy |
| `comun-gold` | `#C9A84C` | **primary accent** |
| `comun-gold-light` | `#E2C27D` | highlight gold |
| `comun-gold-dark` | `#9A7A32` | deep gold |
| `comun-teal` | `#5BB8D4` | dove hue / cool glow |
| `comun-white` | `#F5F0E8` | warm white text |
| `comun-muted` | `#8a8a8a` | muted text |
| `comun-orange` | `#D4722A` | rare warm accent |

Legacy aliases `primary/accent/muted/danger` still exist for boilerplate compatibility.

### Typography
- **Serif/display** → `font-serif-display` (CSS class) or Tailwind `font-serif` = Cormorant
  Garamond. Used for: conference title, section headings, large statements.
- **Sans** → `font-sans` = Inter. Used for: nav, body, buttons, cards, labels.
- Custom sizes in config: `text-hero`, `text-display`, `text-section`.

### Reusable CSS utilities (`src/styles/index.css`)
`.btn-primary`, `.btn-secondary` (gold gradient / outline buttons with hover shimmer),
`.glass`, `.glass-dark`, `.glass-navy` (glassmorphism), `.gold-border`,
`.gold-border-hover`, `.gold-divider`, `.gold-divider-left`, `.text-gold-gradient`,
`.text-gold-shimmer` (animated), `.section-padding`, `.container-wide/narrow`.

> **Body background** is a fixed layered navy with faint teal/gold radial accents — the
> whole page reads as one continuous surface (never a flat fill). Set in `index.css body{}`.

---

## 5. Architecture & File Map

```
src/
├── main.tsx                       # entry; imports styles/index.css
├── App.tsx                        # Router + Navbar + ScrollProgress bar + Footer + Routes
├── pages/
│   └── HomePage.tsx               # Hero (eager) + 9 lazy-loaded sections in <Suspense>
├── components/
│   ├── layout/                    # one file per page section (see below)
│   │   ├── Navbar.tsx
│   │   ├── HeroSection.tsx
│   │   ├── AboutSection.tsx
│   │   ├── ThemeSection.tsx
│   │   ├── CommitteesSection.tsx
│   │   ├── WhySection.tsx
│   │   ├── ResourcesSection.tsx
│   │   ├── VideoSection.tsx
│   │   ├── RegistrationSection.tsx
│   │   ├── FAQSection.tsx
│   │   ├── ContactSection.tsx
│   │   └── Footer.tsx
│   └── ui/                        # reusable presentational pieces
│       ├── SectionContainer.tsx   # <SectionContainer> + <SectionHeader>
│       ├── CommitteeCard.tsx
│       ├── FeatureCard.tsx
│       ├── FAQAccordion.tsx
│       ├── DoveAccent.tsx         # recurring dove watermark
│       └── Countdown.tsx          # live conference countdown (hero)
├── hooks/
│   ├── useScroll.ts               # useScrollProgress() for top progress bar
│   ├── useCountUp.ts              # rAF count-up for stats
│   └── useCountdown.ts            # live countdown to a target date (ticks /1s)
├── utils/
│   ├── scroll.ts                  # smoothScrollTo() — eased JS scroll (SEE §7)
│   ├── api.ts                     # axios instance (baseURL '/api', JWT interceptors) — for future
│   └── auth.ts                    # localStorage JWT session helpers — for future
├── data/
│   └── comun.ts                   # ALL static content (single source of truth — SEE §6)
└── styles/
    └── index.css                  # Tailwind layers + design-system utilities
```

### Page section order (in `HomePage.tsx`)
1. **Hero** (eager) → 2. About → 3. Theme → 4. Committees → 5. Why Participate →
6. **Resources** → 7. Video/Teaser → 8. Registration → 9. FAQ → 10. Contact → Footer.

All sections except Hero are **`React.lazy` + `<Suspense>`** (perf). Hero is eager
(above the fold).

### Section anchor IDs (used by nav/smooth-scroll)
`about`, `committees`, `resources`, `teaser`, `registration`, `faq`, `contact`, `why`.
(Theme section has no id; Hero has no id — "Home" scrolls to top.)

---

## 6. Content Data — `src/data/comun.ts`

**All copy/content is centralized here.** Edit content here, not in JSX.
Exports: `CONFERENCE` (name/theme/dates/romanYear/edition), `NAV_LINKS`, `STATS`,
`COMMITTEES` (typed `Committee[]`), `FEATURES`, `REGISTRATION_TYPES`, `FAQS`.

- **Committees (exact order, do not reorder):** DISEC, UNODC, SPECPOL, UNSC, CCC,
  IPC – J, IPC – P. (No descriptions yet — only code/fullName/category/gradient color.)
- **Registration types:** Institutional, Individual (`featured: true`), Special.
- `NAV_LINKS`: Home `/`, About `#about`, Committees `#committees`, Resources `#resources`,
  Contact `#contact`. **There is intentionally NO "Admin Login" anywhere.**

---

## 7. Navigation & Smooth Scrolling (IMPORTANT pattern)

**All in-page navigation goes through `smoothScrollTo()` in `src/utils/scroll.ts`.**
Do NOT use `scrollIntoView` or `window.scrollTo({behavior:'smooth'})` — they were
removed because they were too abrupt and would double-animate against CSS.

- `smoothScrollTo('top' | '#id' | HTMLElement, { offset?, duration? })`
- rAF + `easeInOutCubic`; duration auto-scales with distance (clamped **550–1150ms**).
- Applies an **84px navbar offset** so targets land below the fixed navbar.
- Honors `prefers-reduced-motion` (instant jump).
- **`html { scroll-behavior: auto }`** in CSS is required so the browser doesn't fight it.

Call sites: `Navbar` (links + Register + mobile drawer), `Footer` (links incl. Home→top),
`HeroSection` (Register / Explore Committees), `FAQSection` & `ResourcesSection` (Contact CTAs).

`Navbar` also has a scroll-spy `useEffect` that highlights the active link via a
`SECTION_MAP`. Navbar is **fully transparent at all times** (client spec), pill-shaped
gold-bordered link container on the left, solid gold REGISTER button on the right,
mobile hamburger drawer.

---

## 8. Animation System (Framer Motion)

**Style rule:** cinematic & elegant only — **fade, slide, blur, scale, gentle float,
draw-in**. **No bounce, spin, flash, or aggressive motion.** Standard easing curve used
throughout: `[0.22, 1, 0.36, 1]`.

Currently implemented:
- **Hero:** background `un-assembly.jpg` has Ken-Burns zoom **+ scroll parallax**
  (`useScroll`/`useTransform`: photo drifts down, content floats up & fades). Crest logo
  blur-in entrance then continuous **breathing float**. CTA buttons = spring scale on
  hover / press on tap. Text has shadows + scrim for legibility over the photo.
- **Navbar:** slides down + fades on load.
- **Theme section:** **letter-by-letter cascade** for "Peace" / "Power" (`AnimatedWord`
  component inside `ThemeSection.tsx` — staggered rise + un-blur, gold shimmer per letter).
- **About stats:** **count-up** from 0 via `useCountUp` + `useInView` (preserves `+`/`st`
  suffixes; uses `tabular-nums`).
- **Hero countdown:** live timer (`Countdown` + `useCountdown`) to `CONFERENCE.startsAt`
  (`2026-07-30T09:00:00`) — four gold/navy unit cards with a per-tick fade. Shows a
  fallback message once the date passes.
- **Section headers:** gold divider **draws in** (`scaleX 0→1`) — in `SectionContainer`'s
  `SectionHeader`.
- **Cards** (Committee/Feature/Registration/Stat): scroll fade-up + **lift & subtle scale**
  on hover.
- **Global:** gold scroll-progress bar at top (`App.tsx` `ScrollProgress` + `useScroll.ts`).
- **Dove motif:** `DoveAccent` faint watermark fades in per section (alternating sides);
  Theme section has a larger glowing floating dove as a showpiece.

### Reusable building blocks for new sections
- `<SectionContainer id className narrow compact decor>` — consistent padding
  (`py-16/20/24`), max-width, `overflow-hidden`, `scroll-mt` offset, and a **`decor` slot**
  rendered behind content (use for `<DoveAccent />` or background layers).
- `<SectionHeader eyebrow title subtitle centered>` — animated heading + drawing divider.
- `<DoveAccent position size opacity glow flip />` — background dove watermark.

---

## 9. Status: Done / Not Done

### Done — full stack (Phases 1–5 complete)
- Full responsive landing page (all 10 sections), design system, dove motif, photo hero,
  animation pass, eased smooth-scroll, countdown.
- **Registration system**: `/register` (Individual single + double-DISEC, Institutional with
  template download + spreadsheet upload), R2 direct uploads, duplicate prevention, App-ID
  `COMUN26-XXXXXX`, confirmation email (Brevo), success screen with PDF download.
- **PDF + retrieve**: dynamic PDF (logo + dove watermark + details + amount + instructions)
  generated on the fly (never stored); public `/retrieve` (App ID + phone).
- **Registration ON/OFF**: admin toggle → every Register CTA flips to "Registrations Closed".
- **Contact form** → stored in DB (`/api/contact`); admin inbox with read/unread + delete.
- **Resources**: public section renders enabled CMS resources dynamically (static fallback);
  admin CMS = categories + upload/replace/toggle/delete to R2.
- **Admin panel** (`/admin`): login (JWT, 5h session timer), dashboard + recharts trend,
  registrations (search/filter/view/delete + R2 cleanup), resources CMS, messages, settings,
  activity logs.
- **Super Admin**: create admins (auto username + generated password), reset password,
  enable/disable, login + activity logs, no session timeout.
- **Backend**: 18 Netlify Functions + shared libs; Prisma schema pushed to Neon; super admin
  seeded. `tsc --noEmit` (frontend + functions) clean; `vite build` green.

### Deferred / future (out of current scope)
- Brevo/R2 only run once their env vars are set on Netlify (code is complete + inert without).
- Committee detail pages, finance module, payments — future phases.

### Admin routes
`/admin/login`, `/admin` (dashboard), `/admin/registrations`, `/admin/resources`,
`/admin/messages`, `/admin/settings`, `/admin/logs`, `/admin/admins` (super only).
First login: seeded super admin — username `superadmin`, password = `SUPERADMIN_PASSWORD`
from `.env` (change on first login).

---

## 9b. Deploy Checklist
- **Vercel (frontend)**: set `VITE_API_BASE_URL=https://api.cottonsmun26.com/.netlify/functions`.
- **Netlify (backend)**: set `DATABASE_URL`, `JWT_SECRET`, `ADMIN_SESSION_HOURS`, all `R2_*`,
  `BREVO_SMTP_*`, `EMAIL_FROM`, `PUBLIC_SITE_URL=https://cottonsmun26.com`.
- **Cloudflare DNS**: `cottonsmun26.com`→Vercel, `api.cottonsmun26.com`→Netlify, `www`→root.
- Run `npm run db:seed` once against production Neon (creates the super admin) if not done.
- Smoke test: load `/`, submit a test registration, download its PDF via `/retrieve`, log in
  at `/admin/login`, toggle registration in Settings → confirm public Register button flips.

---

## 10. Conventions for Continuing Work

- **TypeScript everywhere**, functional components, named/typed props.
- **Content → `data/comun.ts`**; **styling → Tailwind utility classes** (avoid inline styles
  except for dynamic/gradient/animation values that Tailwind can't express).
- **Reuse** `SectionContainer`, `SectionHeader`, `DoveAccent`, `smoothScrollTo`, `useCountUp`
  before writing new equivalents.
- Keep the **palette** (`comun-*` gold/navy) and **animation rules** (§8) — no new random
  colors, no aggressive motion.
- New page section: create in `components/layout/`, give it a stable `id`, lazy-load it in
  `HomePage.tsx`, add to `NAV_LINKS`/`SECTION_MAP` if it should be navigable.
- After any change: `npx tsc --noEmit` then `npx vite build`.
- Static assets go in **`src/public/`** (not root `public/`).

---

## 10b. Backend / Registration System (IN PROGRESS)

A full registration + admin system is being built in phases (see the spec). Status:

### Done
- **Prisma schema** (`prisma/schema.prisma`) — complete & normalized: `Admin` (roles
  ADMIN/SUPER_ADMIN), `Registration` + `Delegate` (individual single/double),
  `UploadedFile` (R2), `ResourceCategory`/`Resource` (CMS), `ContactMessage`, `Setting`,
  `LoginLog`, `ActivityLog`. Indexes + unique constraints for duplicate prevention
  (delegate email/phone unique; institutional teacherEmail/teacherPhone unique).
  **Pushed to Neon** (`npm run db:push`). `binaryTargets` includes `rhel-openssl-3.0.x`
  for Netlify.
- **`.env`** populated (Neon URL live; JWT secret generated). **`.env.example`** documents
  every var (Neon, JWT, R2, Brevo, super-admin bootstrap).
- **Seed** (`prisma/seed.mjs`, `npm run db:seed`) — creates the Super Admin + default
  `registration_open=true`. Already run against Neon.
- **Netlify Functions** backend under `netlify/functions/`:
  - `_shared/` — `prisma.ts`, `http.ts` (json/ok/fail/preflight/parseBody/clientInfo),
    `auth.ts` (JWT; admin 5h expiry, super-admin no expiry), `applicationId.ts`
    (COMUN26-XXXXXX), `logs.ts` (activity logging).
  - `settings.ts` — `GET /api/settings` (public registration status), `PUT` (admin toggle).
- **`netlify.toml`** — build (`prisma generate && vite build`), functions dir, `/api/*` →
  `/.netlify/functions/:splat`, SPA fallback.
- **Frontend registration-status mechanism** (Phase 2): `src/context/RegistrationContext.tsx`
  (`useRegistration()` → `{ isOpen, requireOpen }`, fail-safe open) + 
  `RegistrationClosedDialog.tsx`. Navbar + Hero register CTAs flip to "Registrations Closed"
  and open the dialog when off. App wrapped in `<RegistrationProvider>`.

### Not done yet (next phases)
- **Phase 3**: public registration flow pages (Individual single/double, Institutional),
  R2 uploads, duplicate-check + create APIs, Brevo confirmation email.
- **Phase 4**: dynamic PDF (pdf-lib) + public "Retrieve Registration" page (App ID + phone).
- **Phase 5**: Admin + Super-Admin panels (JWT login w/ session timer, dashboard+charts via
  recharts, registrations, resources CMS, messages, settings, logs).

### Running the backend locally
Plain `npm run dev` (Vite) does NOT serve functions — `/api/*` calls fail and the
registration status fails-safe to OPEN. To run functions+frontend together use
**`netlify dev`** (requires `netlify-cli`). Deps already installed: `@netlify/functions`,
`@aws-sdk/client-s3` + presigner, `nodemailer`, `pdf-lib`, `recharts`.

### Credentials still required (empty in `.env`)
- **Cloudflare R2**: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`,
  `R2_BUCKET`, `R2_ENDPOINT` — needed for ID/spreadsheet/resource uploads (Phase 3+).
- **Brevo SMTP**: `BREVO_SMTP_USER`, `BREVO_SMTP_PASS` — needed for confirmation emails.
Neon `DATABASE_URL` is live and working.

---

## 11. Quick Orientation Path for an AI Agent

1. `src/data/comun.ts` — what content exists.
2. `src/pages/HomePage.tsx` — section composition & order.
3. `src/components/ui/SectionContainer.tsx` — the layout/animation primitive every section uses.
4. `src/components/layout/HeroSection.tsx` — the most complex component (parallax, overlays, motion).
5. `src/utils/scroll.ts` — the navigation contract.
6. `tailwind.config.js` + `src/styles/index.css` — the design tokens & utilities.
