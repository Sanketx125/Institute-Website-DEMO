# Deekshaam Production Platform — System Architecture Document

## 1. Executive Summary

The **Deekshaam Production Platform** is an enterprise-grade digital campus solution engineered specifically for **Deekshaam Business School** (DBS), managed by the Deeksha Education Trust (founded 2021). The platform merges public-facing admissions and programmatic marketing with a full-featured Content Management System (CMS), student application workflows, enquiry lead lifecycle management, Razorpay payment reconciliation, dynamic search, SEO automation, and an isolated AI advisory assistant.

---

## 2. Monorepo Structure

```
deekshaam-production/
├── apps/
│   ├── web/                     # React 18 + TypeScript + Vite Single-Page Application
│   └── api/                     # Node.js + Express + TypeScript REST API Server
│
├── packages/
│   ├── types/                   # Centralized TypeScript entity definitions and DTOs
│   ├── validation/              # Zod runtime schema validators
│   └── ui/                      # Unified design tokens and reusable UI primitives
│
├── database/
│   ├── prisma/                  # Unified Prisma schema (20+ entities) & seed script
│   └── migrations/              # SQL DDL migrations
│
├── storage/
│   ├── public-media/            # Public CDN/web accessible assets (images, banners)
│   └── private-documents/       # Isolated, access-controlled applicant marksheets & IDs
│
├── docs/                        # Architectural, API, and deployment documentation
├── docker/                      # Multi-stage Dockerfiles and compose configuration
└── tests/                       # Automated integration & regression test suites
```

---

## 3. Technology Stack

- **Frontend**: React 18, TypeScript, Vite, CSS Modules with custom Design Tokens.
- **Backend**: Node.js, Express, TypeScript, Helmet, CORS, JSON Web Tokens (JWT), Bcrypt, Multer.
- **Database & ORM**: PostgreSQL 16 with Prisma ORM.
- **Payment Processing**: Razorpay standard checkout, server-side HMAC SHA-256 signature verification, idempotent webhook reconciliation.
- **Storage Layer**: Separate public media (`storage/public-media`) and strictly authenticated private documents (`storage/private-documents`).
- **Telemetry & SEO**: First-party event ingestion, dynamic XML sitemaps, robots.txt, JSON-LD Schema.org metadata.
- **AI Assistant**: Provider-agnostic adapter interface (`LocalKnowledgeProvider`), knowledge retrieval, human fallback.

---

## 4. Security Architecture

1. **Password Hashing**: Bcrypt with 10 salt rounds. Plaintext credentials are never persisted.
2. **Role-Based Access Control (RBAC)**:
   - `SUPER_ADMIN`: Unrestricted administrative oversight, user management, audit review, payment records.
   - `CONTENT_ADMIN`: Programs, news, events, notices, gallery, and media assets.
   - `ADMISSION_STAFF`: Application inbox, document verification, stage transitions.
   - `ENQUIRY_STAFF`: General enquiries, callbacks, campus visit scheduling.
3. **Private Document Protection**: Uploaded applicant marksheets and government IDs are stored outside the public document root. Streaming endpoints require authorized JWT tokens.
4. **Payment Cryptographic Verification**: Client-reported payment states are never trusted. All captures require server-side signature validation (`crypto.createHmac('sha256', secret)`) or verified webhook payloads.
5. **Immutable Audit Trail**: Every sensitive mutation (`CREATE`, `UPDATE`, `DELETE`, `LOGIN`, `STATUS_CHANGE`) records actor ID, target entity, timestamp, and client IP address in `AuditLog`.
