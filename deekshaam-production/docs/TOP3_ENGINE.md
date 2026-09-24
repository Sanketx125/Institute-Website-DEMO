# Top 3 Engine

One shared "Always Top 3" system for every results vertical. Whatever the user searches or filters by, the results page always shows exactly 3 top-pick cards as the hero section, before the full list.

## How it works

- **Engine**: `packages/top3/src/index.ts` — a single `TopThreeEngine` class. Verticals never fork its logic.
- **Vertical registry**: `apps/api/src/top3/top3.controller.ts` — each vertical supplies only a config (filter priority, backfill order, sponsored quota).
- **Shared card**: `apps/web/src/components/TopPicks.tsx` — one React component renders the Top 3 for every vertical; only labels change.
- **API**: `GET /api/top3?vertical=job&city=Bangalore&department=Technology` — one endpoint serves all verticals.
- **Prerender**: `scripts/prerender-top3.js` — bakes Top 3 HTML + JSON-LD + meta into static files at build time so crawlers see content without JS.

## Current verticals

| Vertical | Landing page | Filters | Relaxation order (last dropped first) |
|---|---|---|---|
| `job` | `/jobs` | city, department, tag | tag → city → department |
| `program` | `/programs` | city, stream, specialization | specialization → city → stream |
| `certification` | `/certifications` | city, group, duration | duration → city → group |

## Selection order

1. Exact matches on all active filters, sorted by `rankScore`.
2. Fewer than 3 exact matches → relax filters one at a time (reverse priority order) until 3 found.
3. Still fewer than 3 → backfill from the next vertical in `backfillOrder`, set `isBackfilled: true`.
4. Never invent a listing. Fewer than 3 is a last resort with honest "more coming soon" copy.

Sponsored listings may occupy at most 1 of the 3 slots (configurable via `maxSponsoredSlots`), are always labeled "Sponsored", and never displace organic picks beyond that quota.

## Onboarding a new vertical

Zero changes to selection/rendering logic. Config and data only:

1. Add listings to the database (e.g. a `jobsSeed`-style seed file, or CMS-managed records).
2. Add a config entry in `apps/api/src/top3/top3.controller.ts`:

```ts
const verticalConfigs: Record<string, VerticalConfig> = {
  internship: {
    vertical: 'internship',
    filterPriority: ['city', 'department', 'tag'],
    backfillOrder: ['job', 'program', 'certification'],
    maxSponsoredSlots: 1,
  },
};
```

3. Map the DB records into `Listing` objects in `getEngine()`'s `listings` map.
4. Add a landing page that renders `<TopPicks config={{ vertical: 'internship', ... }} />`.
5. Add the route to `App.tsx`, the sitemap in `seo.controller.ts`, and a prerender entry in `scripts/prerender-top3.js`.

The engine, card component, relaxation, backfill, sponsored rule, and analytics events all apply automatically.

## SEO rules

- Top 3 content is server-rendered via the prerender script (check view-source, not the rendered DOM).
- JSON-LD per vertical: `JobPosting` (jobs), `Course` (programs/certifications), plus `BreadcrumbList` on every page.
- Unique meta titles/descriptions per vertical+filter combination, pulling in real specifics (city, count, top name).
- Thin filter combinations (fewer than 3 exact matches) get `noindex,follow` — links still pass equity to detail pages.
- Only landing pages and detail pages enter the sitemap; filter combos never do.

## Analytics

Every Top 3 impression and click fires a distinguishable event via `POST /api/analytics/event`:

- `top3_impression` — metadata: `vertical`, `filters`, `isBackfilled`, `pickIds`, `sponsored[]`
- `top3_click` — metadata: `vertical`, `position` (1/2/3), `listingId`, `sponsored`, `isBackfilled`

Query `memoryDb.analyticsEvents` (or the analytics summary endpoint) to rank and price slots data-driven.
