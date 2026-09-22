# Deekshaam Production Platform - Database Layer

This directory houses the PostgreSQL database schema, migrations, and seed scripts using Prisma ORM.

## Schema Architecture

The unified database schema provides complete relational persistence across all institutional domains:

1. **Security & RBAC**:
   - `Role`, `Permission`, `RolePermission`, `User`
   - Role definitions: `SUPER_ADMIN`, `CONTENT_ADMIN`, `ADMISSION_STAFF`, `ENQUIRY_STAFF`
   - `AuditLog`: Immutable audit trail for all write, login, and status change events.

2. **Core CMS**:
   - `SiteSettings`: Institutional configuration, contact details, social links, SEO defaults.
   - `Media`: Public asset registry for banners, icons, photos.
   - `Page` & `PageSection`: Flexible page builder with typed layout sections.
   - `Menu` & `MenuItem`: Hierarchical navigation trees (primary, mobile, footer).
   - `Department` & `Faculty`: Academic units and leadership personnel.
   - `Program`, `ProgramSpecialization`, `ProgramCareer`, `ProgramHighlight`, `ProgramCurriculum`: Full 6-semester undergraduate degree models.
   - `Certification`: Professional certification tracks.
   - `News`, `Event`, `Notice`, `Gallery`, `Document`: Institutional communication channels.

3. **Admissions & Applications**:
   - `Application`: Comprehensive applicant records with unique identifier (`DBS-YYYY-XXXXXX`).
   - `ApplicationDocument`: Metadata and path pointers for documents stored in `storage/private-documents`.
   - `ApplicationStatusHistory`: Audit log of stage transitions and admissions remarks.

4. **Enquiries & Lead Management**:
   - `Lead`: Captures general queries, callback requests, and campus visit bookings.
   - `LeadHistory`: Lifecycle status transitions (`NEW` -> `CONTACTED` -> `FOLLOW_UP` -> `CLOSED`).

5. **Payments (Razorpay)**:
   - `Payment`: Cryptographically verified transaction records linked to applications.

6. **Search & Analytics**:
   - `SearchIndex`: High-performance full-text search indexing across programs, pages, news, events, notices.
   - `AnalyticsEvent`: First-party telemetry for pageviews, CTA clicks, form submissions, and AI interactions.

## Setup & Migration Commands

```bash
# Generate Prisma Client
npx prisma generate --schema=database/prisma/schema.prisma

# Push schema directly to database (development)
npx prisma db push --schema=database/prisma/schema.prisma

# Create and apply migrations (production)
npx prisma migrate dev --name init --schema=database/prisma/schema.prisma

# Seed institutional content and initial super admin
npm run seed
```
