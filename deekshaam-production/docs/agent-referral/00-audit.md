# Phase 0: Codebase Audit & System Architecture Report
**Feature**: Agent / Referral Promo Code System  
**Repository**: Deekshaam Production Platform (`deekshaam-production`)  
**Date**: October 2026  
**Status**: Completed (Read-Only Analysis)

---

## 1. Tech Stack, Framework Versions & Architecture

### 1.1 Monorepo Architecture
- **Monorepo Manager**: npm workspaces configured in root `package.json` (`deekshaam-production-platform@1.0.0`).
- **Workspace Packages**:
  - `packages/types` (`@deekshaam/types`): Domain types, enums, DTO interfaces.
  - `packages/validation` (`@deekshaam/validation`): Shared runtime schema validation using Zod (`^3.22.4`).
  - `packages/ui` (`@deekshaam/ui`): Reusable UI tokens and React icon components.
  - `packages/top3` (`@deekshaam/top3`): Universal Top3 program/career engine.
  - `apps/api` (`@deekshaam/api`): Node.js REST API with Express (`^4.18.3`) and TypeScript (`^5.3.3`).
  - `apps/web` (`@deekshaam/web`): Modern React 18 SPA (`react` & `react-dom` `^18.2.0`) bundled via Vite (`^5.1.4`).

### 1.2 Database & ORM
- **Database**: PostgreSQL (configurable via `DATABASE_URL`).
- **ORM**: Prisma (`@prisma/client` and `prisma` `^5.10.2`).
- **Schema Location**: `deekshaam-production/database/prisma/schema.prisma`.
- **Migrations Directory**: `deekshaam-production/database/migrations/20260922_init/migration.sql`.
- **Data Access Pattern**:
  - Dual-mode architecture in `apps/api/src/database/client.ts`.
  - Connects to PostgreSQL via `prisma` if `checkDatabaseConnection()` succeeds.
  - Maintains an in-memory fallback repository (`MemoryDatabase` / `memoryDb` singleton) for zero-dependency execution, offline development, and the automated integration test suite (`tests/run-integration.js`, `tests/run-workspace.cjs`).
  - **Requirement for New Feature**: All new entities (`Agent`, `AgentCommission`, `AgentPayout`, `AgentAuditLog`, and global referral settings) and extended fields on `Application` must be defined both in `schema.prisma` with reversible SQL migration AND in `MemoryDatabase` to maintain seamless dual-mode capability and full test passability.

### 1.3 Authentication, Session & Security
- **JWT**: `jsonwebtoken` (`^9.0.2`), signed with `config.jwt.secret` (environment variable `JWT_SECRET`, minimum 32 chars enforced in production).
- **Password Hashing**: `bcryptjs` (`^2.4.3`) with configurable salt rounds (default: 10).
- **Session Handling**: Stateless JWT with payload `{ id, email, name, role, sessionVersion }`. Token revocation is supported via `user.sessionVersion` which invalidates tokens upon password change.
- **Authentication Middleware**: `apps/api/src/middleware/auth.ts` (`authenticate`), extracting `Bearer <token>` from the `Authorization` header.
- **Client Storage**: `localStorage.getItem('dbs_auth_token')` managed in `apps/web/src/services/api.ts`.

---

## 2. Roles, Permissions & Route Guarding Model

### 2.1 Existing Roles
Defined in `packages/types/src/index.ts` (`RoleType`) and `schema.prisma`:
1. `SUPER_ADMIN`: Universal administrator with unrestricted system-wide access.
2. `CONTENT_ADMIN`: Manages CMS content (pages, programs, news, events, notices, media).
3. `ADMISSION_STAFF`: Inspects student applications, verifies documents, updates admission workflow stages.
4. `ENQUIRY_STAFF`: Manages general enquiries, callback requests, and campus visit bookings.

### 2.2 Permissions
- Seeded in `apps/api/src/database/seed-data.ts`:
  `cms:read`, `cms:write`, `cms:publish`, `admissions:read`, `admissions:write`, `leads:read`, `leads:write`, `payments:read`, `users:manage`, `audit:read`, `settings:manage`.
- **Target Role for Feature**: New role `AGENT` for external referral agents.
- **Target Permission for Staff**: `agents.create` (Super Admin has it by default; staff requires explicit grant).

### 2.3 Route Guarding
- **Server API**: `requireRole(allowedRoles: string[])` in `apps/api/src/middleware/rbac.ts`.
  - Grants universal pass if `req.user.role === 'SUPER_ADMIN'`.
  - Enforces `allowedRoles.includes(req.user.role)`.
- **Web Portal**:
  - Dynamic navigation configured in `apps/web/src/admin/access.ts` via `workspaceModules` and helper `canAccess(role, module)`.
  - Protected layout in `apps/web/src/admin/AdminLayout.tsx` and routing in `apps/web/src/App.tsx`.
- **Public Student Applicant Guarding**:
  - Students do not have user accounts.
  - Ownership of applications is verified using custom headers: `x-applicant-token` (secret issued on submission) or `x-applicant-email` (verified in `hasApplicantProof` / `verifyApplicantProof` in `admissions.controller.ts`).

---

## 3. End-to-End Admission Workflow

```
[Student in Browser]
       │
       ▼
[Apply.tsx - 4 Step Wizard]
  Step 1: Personal Profile
  Step 2: Program Choice (BBA, BCA, B.Com)
  Step 3: Academic Records (10th/12th)
  Step 4: Review, Documents & [Optional Promo Code]
       │
       ├─► (Optional) POST /api/referral/validate { code, programSlug }
       │                  └─ Returns: { valid, discountPercent, discountAmount, finalFee }
       │
       ▼
POST /api/admissions/apply { ...formData, promoCode? }
       │
       ▼
[admissions.controller.ts: submitApplication]
  - Zod validation via applicationSchema
  - Generates Application ID (DBS-YYYY-XXXXXX)
  - Generates accessToken
  - If promoCode present:
      - Re-validates code against Agent table server-side
      - Anti-fraud check (agent phone/email != student phone/email)
      - Computes discount & net fee
      - Stores snapshot fields on Application
      - Creates AgentCommission record (status: PENDING)
  - Writes to DB / MemoryDatabase
  - Emits AuditLog
       │
       ▼
[Apply.tsx - Success State & Razorpay Initiation]
  - Displays Application Reference ID
  - Shows Fee Breakdown (Original, Discount, Final Amount)
       │
       ▼
POST /api/payments/create-order { amount: finalFee, purpose: 'APPLICATION_FEE', applicationId }
       │
       ▼
Razorpay Checkout Modal (or sandbox simulation)
       │
       ▼
POST /api/payments/verify { orderId, paymentId, signature }
  - Cryptographic HMAC-SHA256 verification
  - Sets Payment status = SUCCESS
  - Updates Application stage = 5 (Enrolled), status = ACCEPTED
  - Transitions associated AgentCommission: PENDING -> APPROVED
  - Dispatches email receipt via EmailService
```

### Exact Files, Endpoints & Tables Involved:
1. **Frontend**:
   - `apps/web/src/pages/Apply.tsx`: Student admission application form.
   - `apps/web/src/services/api.ts`: API client functions `submitApplication`, `createPaymentOrder`, `verifyPayment`.
   - `apps/web/src/admin/AdmissionsAdmin.tsx`: Staff inbox reviewing applications.
2. **Backend**:
   - `apps/api/src/admissions/routes.ts`: `POST /api/admissions/apply`.
   - `apps/api/src/admissions/admissions.controller.ts`: `submitApplication`.
   - `apps/api/src/payments/routes.ts`: `POST /api/payments/create-order`, `POST /api/payments/verify`, `POST /api/payments/webhook`.
   - `apps/api/src/payments/payments.controller.ts`: `createPaymentOrder`, `verifyPayment`, `handleWebhook`.
3. **Database Tables**:
   - `Application`: Primary admission record.
   - `ApplicationDocument`: Uploaded verification documents.
   - `ApplicationStatusHistory`: Audit trail of admission status changes.
   - `Payment`: Financial transaction records.
   - `AuditLog`: Immutable action records.

---

## 4. Current Fee Storage & Calculations

1. **Currency**: Indian National Rupee (`INR`).
2. **Amounts & Precision**:
   - In `schema.prisma`, `Payment.amount` is stored as `INTEGER` representing **paise** (minor currency units; 100 paise = 1 INR). E.g., ₹500 is stored as `50000`.
   - In `createPaymentOrderSchema`, the incoming amount is in Rupees (`number`), which the controller converts via `Math.round(validated.amount * 100)`.
3. **Existing Discounts**:
   - No discount or promo code calculation exists in the codebase today.
   - Standard application processing fee is hardcoded in `Apply.tsx` as ₹500.00 (`amount: 500`).
4. **Calculations for Referral System**:
   - Standard gross fee = ₹500 (50,000 paise).
   - Student discount: `discount_amount = round_half_up(gross_fee * student_discount_percent / 100)`.
   - Net fee = `gross_fee - discount_amount`.
   - Commission base: Defaults to `NET_FEE` (configurable to `GROSS_FEE`).
   - Agent commission: `commission_amount = round_half_up(base_fee * commission_percent / 100)` in minor units (paise).

---

## 5. Non-Breaking Insertion Point for Promo Code

- **Frontend (`Apply.tsx`)**:
  - In Step 4 (Application Review), directly before the declaration checkbox:
    - Add a clean collapsible toggle: *"Have a promo code?"*.
    - If URL contains `?ref=CODE`, pre-fill the input and automatically trigger validation.
    - If valid, render: `"Code <CODE> applied: <X>% off"` with transparent price breakdown: Gross Fee, Discount, Net Fee.
    - If student clears the code or provides none, attribution is omitted and standard fee remains ₹500.
    - On submission, pass optional `promoCode` property to `api.submitApplication()`.
- **Backend (`apps/api/src/admissions/admissions.controller.ts`)**:
  - If `req.body.promoCode` is absent, run legacy creation code path without modification.
  - If present and valid, attach attribution snapshots and insert pending commission record.

---

## 6. Risk Analysis & Mitigation Strategies

| Risk | Impact | Mitigation Strategy |
| :--- | :--- | :--- |
| **Client tampering with fee/discount** | Financial loss / fraud | Zero client trust. Server re-evaluates code and recalculates discount and payable fee server-side at the moment of submission. |
| **Breaking legacy admissions** | Application failure | Nullable database columns. Feature flag `AGENT_REFERRAL_ENABLED` returns early to legacy branch when disabled. |
| **Self-referral / Agent cheating** | Undeserved payouts | Strict validation: Student email and phone cannot match referring agent's credentials. Logged-in agents cannot apply their own promo code. |
| **Code guessing / enumeration** | Brute-force discovery | Rate limit `POST /api/referral/validate` to 10 req/min/IP. Generic neutral error `"This code is not valid"` returned for non-existent or inactive codes. |
| **Retroactive percentage changes** | Corrupted ledger | Percentage snapshots: store `discount_percent_applied` and `commission_percent_applied` on the `Application` and `AgentCommission` rows. |
| **IDOR in Agent Portal** | Privacy / Data breach | All agent endpoints query strictly by authenticated agent's own ID (`req.user.id`). Never accept `agentId` in URL or request body for agent role. Mask applicant PII. |
| **Double commission creation** | Double payout | Unique constraint on `agent_commissions.admission_id`. Idempotent payment verification hooks. |

---

## 7. Recommended Improvements (Outside Feature Scope)

Ranked by severity:

### [SEVERITY 1 - CRITICAL]
1. **Compilation Blocker in `apps/api/src/services/email.ts`**:
   - **Finding**: Line 3 imports `{ findProjectRoot }` from `../database/client`, but `findProjectRoot` is not exported by `src/database/client.ts`. This causes `npm run build:api` (`tsc`) to fail with TS2305.
   - **Remedy**: Export a robust `findProjectRoot` utility from `database/client.ts` or path resolver.
2. **Outdated Compilation Artifacts in `apps/api/dist`**:
   - **Finding**: Pre-compiled `dist` binaries date back to September 22, while TypeScript sources were updated on October 4 with SEO and Analytics features. `tests/run-integration.js` imports `dist/apps/api/src/app.js` directly, causing stale test failures.
   - **Remedy**: Ensure `npm run build:api` compiles cleanly prior to running integration tests.

### [SEVERITY 2 - HIGH]
3. **Client-Controlled Payment Amount in `POST /api/payments/create-order`**:
   - **Finding**: Endpoint accepts `amount: number` directly from the client body without server-side verification against program or application fees. A malicious actor could submit `amount: 1` and satisfy payment requirements.
   - **Remedy**: Look up fee from `applicationId` on the server and discard client-provided `amount`.
4. **Plaintext Application Access Token**:
   - **Finding**: `Application.accessToken` is generated with `crypto.randomBytes(24).toString('hex')` and stored unhashed in `memoryDb.applications`.
   - **Remedy**: Store SHA-256 hash in database; verify using hashed comparison.

### [SEVERITY 3 - MEDIUM]
5. **Inconsistent Webhook State Transition**:
   - **Finding**: `payments.controller.ts` webhook handler records payment `SUCCESS`, but does not update `application.stage` or `application.status`, whereas `verifyPayment` updates both.
   - **Remedy**: Unify payment completion logic into a single internal helper called by both `verifyPayment` and `handleWebhook`.
6. **In-Memory Rate Limiting in Production**:
   - **Finding**: `express-rate-limit` stores counters in local process memory. In multi-instance or containerized deployments, rate limits can be circumvented across instances.
   - **Remedy**: Configure Redis store for distributed rate limiting.

### [SEVERITY 4 - LOW]
7. **Hardcoded Currency Symbol**:
   - **Finding**: Currency symbol `₹` is hardcoded across multiple views rather than utilizing `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })`.
8. **Missing Table Accessibility Attributes**:
   - **Finding**: Admin data tables in `AdmissionsAdmin.tsx` lack `aria-sort` indicators on sortable columns.
