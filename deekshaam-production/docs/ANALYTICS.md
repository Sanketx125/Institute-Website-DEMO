# Analytics

Staff see it under **Analytics** in the workspace (Administrator and Admissions team).

## What is measured

Anonymous first-party events only. No names, emails or phone numbers are ever sent, no cookies are set,
and browsers with Do Not Track are not counted. Staff pages and crawlers are ignored.

| Event | Fired when |
|---|---|
| `page_view` | any public page loads (program pages also set the program) |
| `apply_step` | an apply step is viewed or completed (`action`, `step`, `program`) |
| `apply_error` | a step fails validation, or submission fails |
| `apply_submitted` / `payment_success` | the application is created / the fee is verified |
| `cta_click` | an element with `data-track="label"` (and optional `data-track-program`) is clicked |

Visitor and session ids are random UUIDs kept in `localStorage` / `sessionStorage`. Where a session came
from is read once at landing: `utm_source` wins, otherwise the referrer (Google, Bing, Instagram, YouTube,
Direct, ...).

Submitted applications, enquiries, cities, streams and focus areas come from the real admissions and
enquiries tables, so those numbers stay correct even if a browser blocked tracking.

## Report (`GET /api/analytics/report?range=7|30|90`)

Built by `apps/api/src/analytics/report.ts`, a pure function over events + applications + leads:
KPIs with change vs the previous period, the application funnel, per-program demand with 12-week trends,
sources with start rate, devices with finish rate, exit points, and rule-based insights
(biggest leak, rising/falling programs, best/worst source, phone vs desktop gap).
Steps nobody has reached are never reported as leaks, and small samples are skipped or flagged.

## Adding a tracked button

```tsx
<button data-track="apply" data-track-program={program.slug}>Apply</button>
```

For the program page, the labels `apply`, `visit` and `semester` feed "What visitors do on the page".

## Limits

- Events live in memory (100,000 max, newest kept) and reset when the API restarts. `buildReport` only needs
  an array of events, so persisting them to a table is a drop-in change when long history matters.
- Single process only. Use a shared store before running more than one API instance.
