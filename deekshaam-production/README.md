# Deekshaam Production Platform

The unified, enterprise-grade production platform for **Deekshaam Business School** (Bangalore).

This application unifies the public institutional portal, administrative Content Management System (CMS), online admissions engine, lead management, Razorpay payment processing, dynamic search, automated SEO, first-party telemetry, and an isolated AI advisory assistant into a single, cohesive monorepo.

---

## Unified System Architecture

```
deekshaam-production/
├── apps/
│   ├── web/                     # React 18 + TypeScript + Vite Single-Page Application
│   │   ├── src/
│   │   │   ├── admin/           # Administrative CMS Workspace (Dashboard, Settings, CMS, Admissions, Leads, Payments)
│   │   │   ├── components/      # UI Shell, Navigation, Mega-Menus, Footer, Search, AI Assistant
│   │   │   ├── pages/           # Dynamic Public Pages (Home, Programs, Detail, Compare, Apply, Track, Visit, Contact)
│   │   │   └── services/        # Unified API Client
│   │   ├── index.html
│   │   └── vite.config.ts
│   │
│   └── api/                     # Node.js + Express + TypeScript REST API Server
│       ├── src/
│       │   ├── auth/            # JWT authentication & session tokens
│       │   ├── users/           # User administration & RBAC
│       │   ├── cms/             # Programs, news, events, notices, gallery, media, settings
│       │   ├── admissions/      # Online applications, document upload, status tracking, review
│       │   ├── enquiries/       # Leads, callbacks, campus visit bookings
│       │   ├── payments/        # Razorpay order generation, HMAC SHA-256 verification, webhooks
│       │   ├── search/          # Full-text indexing & search engine
│       │   ├── seo/             # Dynamic sitemap.xml & robots.txt generation
│       │   ├── analytics/       # Telemetry ingestion & dashboard summary
│       │   └── ai/              # Provider-agnostic AI assistant adapter with domain knowledge
│       └── server.ts
│
├── packages/
│   ├── types/                   # Unified domain models, DTOs & API envelopes
│   ├── validation/              # Zod validation schemas
│   └── ui/                      # Design tokens, palette, and SVG icon registry
│
├── database/
│   ├── prisma/                  # Unified PostgreSQL schema (20+ entities) & seed script
│   └── migrations/              # Initial SQL migration
│
├── storage/
│   ├── public-media/            # Public web/CDN assets (images, banners)
│   └── private-documents/       # Isolated, access-controlled applicant marksheets & IDs
│
├── docs/                        # Architecture, API specs, and deployment guides
├── docker/                      # Multi-stage Dockerfiles and docker-compose.yml
└── tests/                       # Comprehensive integration test suite
```

---

## All 10 Phases Synthesized

1. **Phase 1 (Foundation)**: Unified monorepo structure, environment handling, Docker configurations, structured logging, standardized API responses.
2. **Phase 2 (Design System)**: Design tokens, Inter typography, brand palette (`--orange`, `--ink`, `--cream`), responsive grid, mobile drawer.
3. **Phase 3 (CMS Foundation)**: Admin JWT authentication, Bcrypt password hashing, Role-Based Access Control (`SUPER_ADMIN`, `CONTENT_ADMIN`, `ADMISSION_STAFF`, `ENQUIRY_STAFF`), immutable audit logs.
4. **Phase 4 (Core CMS)**: Dynamic degree programs (BBA, BCA, B.Com), 6-semester curriculums, specializations, faculty/leadership profiles, news, events, notices, and photo gallery.
5. **Phase 5 (Public Website)**: Dynamic CMS-driven pages, sticky anchor navigation, interactive Program Finder, responsive recruiter grids, loading and empty states.
6. **Phase 6 (Admissions)**: 4-step online application wizard, auto-save drafts, institutional ID generation (`DBS-YYYY-XXXXXX`), private document uploads, 5-stage tracking portal, and staff review inbox.
7. **Phase 7 (Enquiries & Leads)**: Callback request forms, campus visit scheduler with time slots, admin lead inbox, status lifecycle tracking (`NEW`, `CONTACTED`, `FOLLOW_UP`, `CLOSED`).
8. **Phase 8 (Payments)**: Server-side Razorpay order generation, client checkout, HMAC SHA-256 signature verification, webhook processing, and admin transaction reconciliation.
9. **Phase 9 (Search, SEO & Analytics)**: Site-wide full-text search (`Ctrl+K`), dynamic `sitemap.xml`, production `robots.txt`, Schema.org structured data, first-party event tracking.
10. **Phase 10 (Optional AI Chatbot)**: Deeksha Guide virtual assistant with provider-agnostic adapter, institutional knowledge retrieval, safe domain guardrails, and human callback fallback.

---

## Getting Started

### 1. Installation

```bash
cd deekshaam-production
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 3. Build & Seed

```bash
# Build shared packages
npm run build:packages

# Seed initial institutional data & admin account
npm run seed
```

### 4. Run Development Servers

```bash
# Start backend API (Port 5000)
npm run dev:api

# In another terminal, start frontend web client (Port 3000)
npm run dev:web
```

- Public Portal: `http://localhost:3000`
- Admin Workspace: `http://localhost:3000/admin`
- Backend Health Check: `http://localhost:5000/api/health`

### Staff Credentials:
- **Super Admin Email**: `admin@deekshaam.edu`
- **Admissions Staff Email**: `admissions@deekshaam.edu`
- **Passwords**: no defaults are shipped. Set `ADMIN_PASSWORD` and `STAFF_PASSWORD` in `.env`. The API refuses to start without them in every environment. The bootstrap admin email is `admin@deekshaam.edu`.

---

## Running Automated Tests

```bash
npm test
```

Verifies API health, public CMS retrieval, admissions submissions, document uploads, lead capture, payment verification, search, dynamic SEO, AI chatbot responses, and admin authorization.

---

## Docker Deployment

```bash
cd docker
docker-compose up -d --build
```
