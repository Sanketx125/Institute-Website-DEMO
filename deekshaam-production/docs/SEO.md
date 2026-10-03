# SEO architecture & launch runbook

## How it works

```
CMS (memoryDb) ──► apps/api/src/seo/render.ts ──► HTML for every public URL
      │                    ▲                       (meta, canonical, JSON-LD, readable content)
      │                    │
      ├──► seo/changes.ts ─┘ fingerprints rendered pages after each CMS write
      │         ├─► truthful <lastmod> in sitemaps
      │         └─► IndexNow ping (Bing, Copilot, Yandex, Naver, Seznam)
      └──► seo/seo.controller.ts ──► sitemap_index.xml, sitemap-{pages,programs,jobs,news,events,videos}.xml, robots.txt
```

- **Page text** (titles, descriptions, H1s) for fixed routes lives in `packages/types/src/seo.ts` (`PAGE_META`).
  The server renderer and the client `<SEOHead>` both read it, so they always agree.
- **JSON-LD is server-only.** Crawlers load every URL fresh, so the server copy is what they index.
  Pages don't add their own schema. To change structured data, edit `render.ts`.
- **Status codes:** 200 live · 301 trailing slash, `www`, `http` or another host, sent to `CLIENT_ORIGIN` ·
  404 unknown or draft · 410 archived content or a job past its `validThrough`.
- **nginx** serves `/assets/*` (cached for a year, immutable) and real files. Every other path is
  proxied to the API, which renders the HTML.

### Structured data emitted

| Page | Types |
|---|---|
| Every page | `CollegeOrUniversity` (address, geo, logo, sameAs) |
| `/` | `WebSite` |
| `/programs`, `/certifications` | `ItemList` of `Course` (Google Course list) |
| `/programs/:slug` | `Course` with credential and prerequisites |
| `/jobs/:slug` | `JobPosting` (only when a real `datePosted` exists) |
| `/news/:slug` | `Article` with `dateModified` from tracked edits |
| `/events/:slug` | `Event` (start and end times in IST) |
| `/videos/:youtubeId` | `VideoObject` (only when staff enter the YouTube publish date) |
| All inner pages | `BreadcrumbList` |

FAQ markup is intentionally absent: Google shows FAQ rich results only for government and health sites.

### Rules that keep this trustworthy

- Never invent dates. Leave out `datePosted`, `uploadDate` or `validThrough` when they are unknown, and the
  matching schema is skipped.
- Only publish claims (placement %, stipends, "job offer from day 1") that the institution can document.
- Expired jobs: set `validThrough`. The page then returns 410 and drops out of the sitemap automatically.

## Environment

| Variable | Purpose |
|---|---|
| `CLIENT_ORIGIN` | Canonical origin, e.g. `https://deekshaedu.in`. Every other host or protocol 301s here. |
| `GOOGLE_SITE_VERIFICATION` | Token from Search Console, using the HTML-tag method |
| `BING_SITE_VERIFICATION` | Token from Bing Webmaster Tools (`msvalidate.01`) |
| `INDEXNOW_KEY` | 8–128 hex chars. Served at `/<key>.txt`, and pings are sent only in production. |
| `BLOCK_AI_TRAINING` | `true` blocks GPTBot, Google-Extended, CCBot, ClaudeBot and Applebot-Extended. Search and answer bots (Googlebot, Bingbot, OAI-SearchBot, PerplexityBot) stay allowed. |

## Launch checklist (needs people, not code)

1. **Verify the location on site:** gate GPS, then the Google Business Profile pin, then update
   `coordinates`, `streetAddress`, `addressLocality` and `postalCode` in site settings. Use the same values
   everywhere: GBP, directories and social profiles.
2. Set `CLIENT_ORIGIN` to the final domain and deploy.
3. Google Search Console: verify, submit `/sitemap_index.xml`, then run URL Inspection on `/`,
   `/programs/bca` and a job page, and check that rendered HTML and structured data are detected.
4. Bing Webmaster Tools: verify, submit the sitemap and set `INDEXNOW_KEY`.
5. Run the Rich Results Test on `/programs`, a job, an event and a video page.
6. Claim or fix third-party listings so the founding year, address and programs match the site.
7. Add verified outcome numbers, faculty profiles and real campus photos. Remove any placeholder content.
8. Watch Search Console (Pages, Enhancements, Core Web Vitals) every week for the first two months.
