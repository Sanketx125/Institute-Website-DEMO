# Deekshaam Production Platform — Complete Audit Report

**Audit date:** 2026-09-23
**Scope:** `deekshaam-production/` (API, Web, packages, deployment configs)
**Method:** Direct source-code review of every security-relevant and SEO-relevant file. All findings below cite the exact file and behavior observed in the code.

---

## 1. Executive Summary

The platform is a well-structured monorepo (Express API + React/Vite web + shared packages) with good bones: helmet, RBAC middleware, zod validation, audit logging, sanitized file uploads, and a per-page SEO component. However, it is **not production-ready**. There are:

- **3 critical security issues** (payment signature bypass, open CORS, hardcoded default secrets)
- **6 high-severity issues** (no rate limiting, JWT in localStorage, unauthenticated document upload, PII exposure via tracking endpoint, webhook signature computed over re-serialized JSON, default admin credentials)
- **1 confirmed SEO bug** (canonical URLs are broken — set via `content` attribute instead of `href`)
- **Fundamental architectural limitation:** the entire database is in-memory (`memoryDb`), so all data is lost on restart
- **UI color issues:** the palette is a one-note orange/cream family with contrast problems

---

## 2. Critical Security Issues

### 2.1 Payment signature verification can be bypassed (CRITICAL)

**File:** `apps/api/src/payments/payments.controller.ts` (line ~75-77)

```ts
const isTestMode = config.razorpay.keySecret === 'placeholder_secret_key_change_me' || config.env !== 'production';
const isSignatureValid = isTestMode || generatedSignature === signature;
```

Any deployment not explicitly running with `NODE_ENV=production` accepts **any** signature, including an empty or garbage one. Since the default `NODE_ENV` in `config/index.ts` is `'development'`, a deployment that forgets to set the env var silently accepts forged payment confirmations. An attacker can mark any order as `SUCCESS` without paying.

**Fix:** remove the bypass entirely. Use Razorpay test-mode keys for testing instead of skipping verification.

### 2.2 CORS allows every origin (CRITICAL)

**File:** `apps/api/src/app.ts`

```ts
app.use(cors({ origin: '*', ... }));
```

Any website on the internet can make authenticated requests to this API using a victim's browser (the JWT in localStorage is attached via `Authorization` header only if the attacker's JS can read it — but with `origin: '*'`, any site can call all public endpoints, spam applications, and abuse the analytics ingestion). Combined with no rate limiting, this makes abuse trivial.

**Fix:** set `origin` to the exact web app origin from `config.clientOrigin`.

### 2.3 Hardcoded fallback secrets (CRITICAL)

**File:** `apps/api/src/config/index.ts`

```ts
jwt: { secret: process.env.JWT_SECRET || 'deekshaam-production-secret-key-change-in-prod-2026', ... },
razorpay: { keySecret: process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_placeholder', ... }
```

If `JWT_SECRET` is unset, anyone who reads the public repo (or this default) can forge valid admin JWTs and get `SUPER_ADMIN` access. The payment test-mode check in 2.1 also keys off a hardcoded placeholder string.

**Fix:** fail startup if secrets are missing in production; never ship fallback secrets.

---

## 3. High-Severity Issues

### 3.1 No rate limiting anywhere

`grep` for `express-rate-limit|rateLimit` across the whole project returns **zero matches**. Public endpoints include login (`/api/auth/login`), application submission, payment order creation, and analytics ingestion. Login is brute-forceable; application submission is spammable; analytics can be flooded (events array is capped at 2000, but each event still costs write time).

**Fix:** add `express-rate-limit` with stricter limits on `/api/auth/login` and public POST endpoints.

### 3.2 JWT stored in localStorage (XSS-stealable)

**File:** `apps/web/src/services/api.ts` — token stored under `dbs_auth_token` in `localStorage`. Any XSS (e.g., via an uploaded SVG served from `/public-media`, which allows `image/svg+xml` and is served cross-origin per helmet's `crossOriginResourcePolicy: cross-origin`) can steal admin sessions. SVG uploads are a known XSS vector when served inline from the same origin.

**Fix:** move the token to an `HttpOnly` cookie, and serve uploaded media from a separate domain or force `Content-Disposition: attachment` / sanitize SVGs.

### 3.3 Unauthenticated document upload to any application

**File:** `apps/api/src/admissions/routes.ts`

```ts
router.post('/upload/:id', uploadPrivateDocument.single('document'), uploadApplicantDocument);
```

No `authenticate`, no ownership check, no proof the uploader is the applicant. Anyone who knows (or brute-forces) an application ID like `DBS-2026-123456` can attach arbitrary files to that application — including a crafted `.svg` or `.docx` that staff will later download and open. The ID space is only ~900,000 values per year, trivially enumerable.

**Fix:** require an applicant-side token or at minimum an email/OTP match before accepting uploads.

### 3.4 PII exposure via public tracking endpoint

**File:** `apps/api/src/admissions/admissions.controller.ts` — `trackApplication` returns `fullName`, `email`, `phone` (in the full application object) for **any** application ID, with no authentication. Application IDs are guessable (see 3.3). This is a direct PII leak of student data.

**Fix:** require the applicant's email or a tracking PIN alongside the ID, and return only status/stage, never contact details.

### 3.5 Webhook signature computed over re-serialized JSON (HIGH)

**File:** `apps/api/src/payments/payments.controller.ts` (line ~131-142)

```ts
const rawBody = JSON.stringify(req.body);
```

Razorpay signs the **raw request body**. `JSON.stringify(req.body)` re-serializes after Express parsing, so key ordering/whitespace may differ and the HMAC will mismatch on legitimate webhooks — while the check is skipped entirely outside production (`config.isProduction` guard). Also, if the signature header is absent, the handler proceeds without any verification.

**Fix:** capture raw body via `express.json({ verify: (req, buf) => { req.rawBody = buf; } })` and HMAC that; reject requests with a missing signature header.

### 3.6 Default admin credentials in code

**Files:** `apps/api/src/database/client.ts` (lines 36, 45) and `apps/api/src/seed.ts` (line 46)

```ts
passwordHash: bcrypt.hashSync('Admin@123456', 10),
passwordHash: bcrypt.hashSync('Staff@123456', 10),
```

Combined with the default JWT secret (2.3), an attacker can simply log in as `SUPER_ADMIN` on any deployment that kept defaults.

**Fix:** require admin credentials via environment variables at first boot; print a one-time generated password.

---

## 4. Medium/Low Issues

| # | Issue | Location | Severity |
|---|-------|----------|----------|
| 4.1 | In-memory database — all users, applications, payments, leads lost on restart; no persistence despite Prisma schema existing in `database/prisma/schema.prisma` | `apps/api/src/database/client.ts` | Architectural |
| 4.2 | `express.json({ limit: '10mb' })` — very large body limit invites memory-exhaustion DoS | `apps/api/src/app.ts` | Medium |
| 4.3 | Analytics `getSummary` returns `successfulPayments` as the filtered array, not a count — `successfulCount` is correct but the raw array is used for revenue; minor, but the response shape is inconsistent | `apps/api/src/analytics/analytics.controller.ts` | Low |
| 4.4 | `users.controller.ts` `listUsers` strips `passwordHash` correctly, but `createUser` has no password strength validation visible | `apps/api/src/users/users.controller.ts` | Medium |
| 4.5 | No CSRF protection — acceptable for a pure Bearer-token API, but becomes a real risk if tokens move to cookies (see 3.2 fix) | `apps/api/src/app.ts` | Low |
| 4.6 | No HTTPS redirect / HSTS at the app level (relies on nginx/Netlify layer) | deployment | Low |
| 4.7 | `robots.txt` disallows `/admin/` and `/api/` — good — but the sitemap is served by the **API** origin (`config.clientOrigin` is used for URLs, yet the route lives on the API server); if the web app is deployed separately, `sitemap.xml` may not resolve on the web domain | `apps/api/src/seo/seo.controller.ts` | Medium (SEO) |
| 4.8 | Favicon and logo loaded from a third-party domain (`media.collegedekho.com`) — brand asset on someone else's CDN; if that host removes the file, the site loses its logo and favicon, and it adds a third-party DNS/TLS dependency | `apps/web/index.html`, `SEOHead.tsx` | Medium |
| 4.9 | `SEOHead` default description is identical on every page that doesn't pass one — duplicate meta descriptions across the site | `apps/web/src/components/SEOHead.tsx` | Medium (SEO) |
| 4.10 | No `og:title`, `og:image`, `twitter:card` tags anywhere — link previews on WhatsApp/Facebook/LinkedIn will be blank or generic | `apps/web/index.html` | High (SEO/social) |

---

## 5. SEO Deep-Dive (the most important part)

### 5.1 Confirmed bug: canonical URLs are broken

**File:** `apps/web/src/components/SEOHead.tsx` (line ~35)

```ts
canonical.setAttribute('content', `${window.location.origin}${canonicalPath}`);
```

A `<link rel="canonical">` element uses the **`href`** attribute, not `content`. Every canonical tag on the site is effectively empty. Search engines currently see no canonical at all, which means:

- Duplicate-content risk between `/` and `/index.html`, trailing-slash and non-slash variants
- No consolidation of ranking signals to the preferred URL

**Fix (one line):**

```ts
canonical.setAttribute('href', `${window.location.origin}${canonicalPath}`);
```

### 5.2 The bigger structural problem: client-side-only SEO

This is a **Vite SPA**. All meta tags, titles, canonicals, and JSON-LD are injected by JavaScript after hydration (`SEOHead` runs in `useEffect`). Consequences:

- **Google can render JS, but does so on a delayed "second wave" of indexing.** Rankings and fresh content (news articles, program pages) get indexed slower than competitors with server-rendered HTML.
- **Bing, DuckDuckGo, and most AI crawlers (ChatGPT, Perplexity) do not reliably execute JS.** The site is effectively invisible to them — they see only the bare `index.html` shell with a title and nothing else.
- **Social scrapers (Facebook, WhatsApp, LinkedIn) never execute JS.** Every shared link shows no description and no image.

**Fix options, in order of impact:**
1. **Prerendering (best ROI):** add `vite-plugin-prerender` or deploy-time prerendering for all static routes (`/`, `/about`, `/programs/*`, `/news/*`, etc.). The sitemap already lists exactly these URLs — prerender exactly that set.
2. **SSR migration:** move to Next.js or React Router + v7 SSR framework mode. Highest effort, best result.
3. **Minimum viable:** put per-route meta tags in `index.html` for the homepage only, and add dynamic OG tags via a tiny server-side middleware that injects meta into the HTML shell for crawler user-agents.

### 5.3 Missing SEO fundamentals

| Item | Status | Notes |
|------|--------|-------|
| `sitemap.xml` | Exists (API-served) | Good URL coverage incl. programs/news; but `lastmod` is always "today" (fake freshness signal — search engines may discount it); no `hreflang` |
| `robots.txt` | Exists | Correctly blocks `/admin/` and `/api/` |
| Canonical | **Broken** | See 5.1 |
| Meta description | Partial | Default description reused on pages that omit it (4.9) |
| Open Graph / Twitter cards | **Missing entirely** | No `og:*` or `twitter:*` tags in `index.html` or `SEOHead` |
| JSON-LD | Partial | `EducationalOrganization` schema is good; but program pages should emit `Course`/`EducationalOccupationalProgram` schema, news pages should emit `NewsArticle`, and none of that is wired up |
| Image alt text | Not audited per-image | Needs a pass over all `<img>` in pages |
| Performance | At risk | Google Fonts + Razorpay checkout JS loaded blocking in `<body>`; Razorpay script should be `defer`/lazy-loaded only on checkout pages |
| `lang` attribute | `en` | Fine |
| Favicon | Third-party hosted | See 4.8 — also a minor performance/availability issue |

### 5.4 SEO comparison with popular education websites

How the top Indian education portals handle this (based on their publicly observable behavior):

| Site | Rendering | OG tags | Structured data | Takeaway for Deekshaam |
|------|-----------|--------|-----------------|------------------------|
| **Shiksha.com** | Server-rendered | Full `og:` + `twitter:` | `College`, `Course`, `FAQPage`, breadcrumbs | Their program pages rank because content is in raw HTML with rich schema — the exact thing this SPA lacks |
| **CollegeDekho** (whose CDN this project borrows its logo from) | Server-rendered | Full | `CollegeOrUniversity`, `Course` | Same pattern; also note they own their media domain |
| **Careers360** | Server-rendered | Full | Extensive schema incl. `AggregateRating` | Ratings/review schema drives rich snippets — Deekshaam has no review system at all |
| **Christ University** (direct competitor, Bangalore) | Server-rendered | Partial | Basic | Even traditional competitor sites ship static HTML — an SPA is a structural disadvantage in this market |
| **upGrad / Great Learning** (certifications competitor) | SSR (Next.js-style) | Full | `Course`, `Organization`, `FAQPage` | The certification vertical this site targets (`/certifications`) is dominated by SSR sites with course schema |

**Bottom line:** in the education vertical, essentially every ranking competitor serves full HTML to crawlers. A JS-only SPA with a broken canonical tag and no OG tags will not compete for "BBA colleges in Bangalore" style queries regardless of content quality. Fix 5.1 immediately (one line), then prerender.

### 5.5 Priority SEO action list

1. **Fix the canonical `href` bug** — one line, immediate.
2. **Add OG + Twitter tags** to `index.html` (static defaults) and `SEOHead` (per-page) — biggest social-sharing win.
3. **Prerender all sitemap URLs** at build time.
4. **Add `Course`/`EducationalOccupationalProgram` JSON-LD on program pages** and `NewsArticle` on news detail pages.
5. **Stop faking `lastmod`** in the sitemap — use real content dates.
6. **Self-host the logo/favicon** instead of loading from `media.collegedekho.com`.
7. **Lazy-load the Razorpay script** — only load on `/apply` or checkout.
8. **Write unique meta descriptions** for every page (currently a shared default).

---

## 6. UI / Color Audit (public web app)

### 6.1 Current palette

From `apps/web/src/index.css` and `packages/ui/src/tokens.ts`:

| Token | Value | Role |
|-------|-------|------|
| `--orange` | `#ed5c1b` | Primary |
| `--orange-dark` | `#c7430d` | Primary hover |
| `--ink` | `#151515` | Text |
| `--muted` | `#666b73` | Secondary text |
| `--line` | `#e8e4df` | Borders |
| `--cream` | `#f8f5f0` | Section background |
| `--soft` | `#fffaf6` | Soft background |
| `--dark` | `#121619` | Dark sections |
| `--green` | `#176b52` | Success/accent |
| `--white` | `#ffffff` | Base |

### 6.2 Problems

1. **One-note warm palette.** Nearly every surface is a variation of orange/cream/beige: `#ed5c1b`, `#fff0e8` (primaryLight), `#f8f5f0`, `#fffaf6`, `#e8e4df`, `#dcd8d3`. The whole site reads as "orange on cream" — flat, low-energy, and difficult to scan. There is no cool counterweight except a single green used sparingly.
2. **Contrast failures (WCAG):**
   - `#ed5c1b` orange on white: **~3.1:1** — fails WCAG AA for normal text (needs 4.5:1). Any orange body text or orange-on-white buttons with normal-size text fail.
   - `#666b73` muted on `#f8f5f0` cream: **~4.6:1** — borderline pass, but on `#fffaf6` soft backgrounds with smaller text it gets risky.
   - White text on `#ed5c1b` (common CTA pattern): **~3.2:1** — fails AA.
3. **`--radius: 22px`** as the global radius is very round for an operational/education site; combined with the cream palette it pushes the design toward "soft consumer blog" rather than "credible institution."
4. **Two competing dark tokens** (`--ink #151515` and `--dark #121619`) plus `--line` and `--border` doing the same job — the token set itself is inconsistent, which is why the UI feels slightly off even to you.
5. **Inter as the only typeface** at 8 weights — functional but generic; every competitor site in the education space also uses Inter or similar, so there is zero brand distinction in typography.

### 6.3 Recommended palette (keeps brand orange, fixes contrast and monotony)

A credible education-institution direction: deep academic navy as the structural color, brand orange reserved strictly for CTAs, and a real neutral scale.

```css
:root {
  /* Structure: deep navy replaces near-black and carries headers/footers */
  --navy-900: #0f2440;
  --navy-700: #1c3a5e;

  /* Brand: orange only for actions and highlights */
  --brand-600: #c2410c;   /* darker orange, 4.6:1 on white — AA pass */
  --brand-500: #ea580c;   /* large text / icons / graphics only */
  --brand-100: #ffedd5;

  /* Neutrals: true gray scale, not beige */
  --gray-900: #111827;
  --gray-600: #4b5563;   /* 7.5:1 on white — safe muted text */
  --gray-300: #d1d5db;
  --gray-100: #f3f4f6;
  --gray-50:  #f9fafb;

  /* Accent: keep the green for success states only */
  --success-700: #15803d;

  --radius: 10px;        /* calmer, more institutional */
}
```

Rules of thumb to enforce:
- Body text: `--gray-900` on white; secondary `--gray-600` — never orange for body text.
- CTAs: `--brand-600` background with white text (passes AA), `--brand-500` only for large headings/icons.
- Dark sections: `--navy-900` instead of `#121619` — gives the site a distinct academic identity instead of generic near-black.
- Kill the cream/beige backgrounds (`--cream`, `--soft`, `--line`, `--border`) in favor of the gray scale; keep at most one warm tint (`--brand-100`) for highlight cards.
- Reduce global radius from 22px to 10px.
- Consider a display serif (e.g., a self-hosted "Fraunces" or "Source Serif 4") for headings paired with Inter for body — this is the single cheapest way to stop looking like every other education SPA.

---

## 7. Limitations (things that are by design but constrain you)

1. **In-memory DB** — every restart wipes users, applications, payments, leads, CMS content, analytics. The Prisma schema exists but nothing connects to it. This is the single biggest gap between "demo" and "production."
2. **No real Razorpay integration** — orders are generated locally (`order_${Date.now()}`), never created via Razorpay's API, so real payments can never succeed even with valid keys.
3. **No email/SMS sending** — application submissions and status changes produce no notifications; the "AI" provider defaults to `local` with no external calls.
4. **Single-process only** — in-memory state + audit logs in memory mean horizontal scaling is impossible.
5. **No test coverage for security paths** — `tests/run-tests.js` exists but nothing covers signature verification, RBAC boundaries, or upload auth.
6. **No CI/CD visible** in the repo.

---

## 8. Prioritized Fix Roadmap

| Priority | Item | Effort |
|----------|------|--------|
| P0 | Remove payment signature test-mode bypass (2.1) | 10 min |
| P0 | Fix canonical `href` bug (5.1) | 1 line |
| P0 | Fail startup on missing secrets; remove default admin passwords (2.3, 3.6) | 1 hr |
| P0 | Restrict CORS to `clientOrigin` (2.2) | 5 min |
| P1 | Add rate limiting to login + public POSTs (3.1) | 1 hr |
| P1 | Fix webhook raw-body HMAC + reject missing signature (3.5) | 2 hr |
| P1 | Require auth/ownership on document upload (3.3) and strip PII from tracking (3.4) | 3 hr |
| P1 | Add OG/Twitter tags (5.5 #2) | 2 hr |
| P2 | Prerender sitemap URLs (5.5 #3) | 1 day |
| P2 | Move JWT to HttpOnly cookie; restrict SVG uploads (3.2) | 1 day |
| P2 | UI palette + radius overhaul (6.3) | 1-2 days |
| P3 | Persist to Postgres via the existing Prisma schema (7.1) | 3-5 days |
| P3 | Real Razorpay order creation via API (7.2) | 1 day |

---

## 9. Verification Checklist

To verify each critical claim yourself:

- [ ] **2.1:** In `payments.controller.ts`, search `isTestMode` — confirm the `||` bypass.
- [ ] **2.2:** In `app.ts`, confirm `cors({ origin: '*' })`.
- [ ] **2.3:** In `config/index.ts`, confirm the `||` fallback secrets.
- [ ] **3.1:** Run `rg "rate-limit|rateLimit" deekshaam-production/` — zero results.
- [ ] **3.3/3.4:** In `admissions/routes.ts`, confirm `/upload/:id` and `/track/:id` have no `authenticate`.
- [ ] **3.5:** In `payments.controller.ts`, confirm `JSON.stringify(req.body)` in `handleWebhook`.
- [ ] **3.6:** In `database/client.ts`, confirm `Admin@123456` / `Staff@123456` hashes.
- [ ] **5.1:** In `SEOHead.tsx`, confirm `canonical.setAttribute('content', ...)` — should be `href`.
- [ ] **5.2:** View page source (not DevTools Elements) of any page — only the bare shell with a `<title>` is served.
- [ ] **6.2:** Paste `#ed5c1b` on white into any WCAG contrast checker — ~3.1:1.
