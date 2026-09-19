# Deekshaam Business School - Digital Campus Frontend

A reusable, production-oriented frontend for the redesigned Deekshaam Business School public website and admissions journey. The UI is built as a proper site architecture rather than a single marketing mockup, so the same experience can be connected to the institution's CMS, admissions API, CRM, payment gateway and AI services later.

## Run locally

    python3 serve.py

Open:

    http://localhost:8080

The included development server supports direct SPA routes such as `/programs/bca`, `/admissions` and `/track`.

## Quality check

    npm test

or:

    npm run check

## Main experiences

- Institution-branded responsive header/footer and mobile navigation
- BBA, BCA and B.Com catalog and detailed program pages
- Program comparison and program finder
- Professional certification catalog
- Admissions information architecture
- Multi-step online application with save/resume adapter
- Application ID and status tracking experience
- Placements/career area with the employer logos currently published by DBS
- Campus life and contact/campus directions
- Leadership with public DBS leadership imagery
- Global search (Ctrl/Cmd + K)
- Deeksha Guide admissions assistant interface
- Responsive mobile call / visit / apply actions

## Architecture

- `src/data/content.js` - centralized institutional and academic content model
- `src/components/` - shared brand shell and icon system
- `src/pages/views.js` - reusable route-level page renderers
- `src/services/applicationStore.js` - local admissions persistence adapter
- `src/services/admissionsGateway.js` - switchable admissions API gateway
- `src/services/leadGateway.js` - switchable enquiry/campus-visit gateway
- `src/config/runtime.js` + `runtime-config.js` - runtime API configuration
- `src/lib/router.js` - client-side routing
- `src/styles/app.css` - responsive design system
- `tests/smoke.mjs` - route/content smoke checks
- `serve.py` - local SPA development server

The owner-review build runs with `apiBaseUrl` blank, so forms stay isolated and the application workflow uses the browser persistence adapter. Set the API base URL in `runtime-config.js` to route application submission, status lookup, enquiries and campus-visit requests through real services. This keeps the approved UX intact while the backend/CMS/CRM is connected.

## Deployment

The package contains configuration examples for Apache/cPanel (`.htaccess`), Netlify (`netlify.toml`), Vercel (`vercel.json`) and Nginx/Docker (`nginx.conf`, `Dockerfile`).

`robots.txt` and the page meta tag are deliberately set to `noindex,nofollow` while this owner-review build is hosted. Remove that only at the approved production launch.

## Brand and media

The site uses Deekshaam's orange/charcoal identity, public DBS program/campus imagery, public leadership imagery and the employer logos already shown by DBS. The header also attempts to use the publicly listed institute mark with an embedded vector fallback. When the owner supplies the original transparent SVG/PNG brand master, replace that single logo source in `src/data/content.js` so the mark is fully authoritative and self-hosted.

## Content governance before go-live

Some information on the current public website is internally inconsistent, especially fee labels on BCA/B.Com pages. This build therefore does not invent those amounts. Before the final public launch, academic, admissions, finance and placement owners should sign off their respective data sets and approved media.
