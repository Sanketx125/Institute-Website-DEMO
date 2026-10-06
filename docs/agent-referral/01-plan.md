# Phase 0: Implementation Plan & Technical Specification
**Feature**: Agent / Referral Promo Code System  
**Repository**: Deekshaam Production Platform (`deekshaam-production`)  
**Date**: October 2026  
**Status**: Approved Plan  

---

## 1. Architectural Strategy & Design Principles

1. **Non-Breaking by Default**:
   - The public admission flow remains 100% identical when no promo code is provided.
   - All newly added columns on `Application` are nullable.
   - The entire system is guarded by feature flag `AGENT_REFERRAL_ENABLED` (env var and setting). When `false`, the app behaves exactly as it does today.
2. **Zero Client Trust**:
   - The client never dictates discounts, final amounts, commissions, or agent attribution.
   - The server validates the code and calculates all figures in integer minor units (paise) inside a transaction.
3. **Ledger-Based Accounting**:
   - Commissions follow an immutable state machine: `PENDING` -> `APPROVED` -> `PAID` / `REVERSED`.
   - Records are never hard-deleted; transitions are logged in `AgentAuditLog`.
4. **Data Isolation & Anti-Fraud**:
   - Strict server-side RBAC: Agents are restricted strictly to their own data (`agent.userId === req.user.id`).
   - Student PII is masked (e.g. `98****21`, `r****@gmail.com`) in agent views.
   - Self-referrals (matching student and agent email/phone, or logged-in agent applying own code) are blocked.

---

## 2. Phase-by-Phase Execution Plan

### Phase 1: Data Model, Schema & Shared Types
- **Prisma Schema Update (`database/prisma/schema.prisma`)**:
  - Add models: `Agent`, `AgentCommission`, `AgentPayout`, `AgentAuditLog`, `ReferralSettings`.
  - Extend `Application` with nullable fields: `agentId`, `promoCodeUsed`, `discountPercentApplied`, `discountAmount`, `commissionPercentApplied`.
  - Add relations between `Agent`, `User`, `Application`, `AgentCommission`, and `AgentPayout`.
  - Add indexes: `agents(promoCode)`, `agent_commissions(agentId, status)`, `applications(agentId)`.
- **Database Migration**:
  - Create reversible SQL migration `database/migrations/20261006_add_agent_referral/migration.sql`.
  - Provide up and down migration scripts.
- **Shared Types (`packages/types/src/index.ts`)**:
  - Add `RoleType.AGENT = 'AGENT'`.
  - Add `AgentStatus`, `CommissionStatus`, `PayoutMethod`.
  - Add domain interfaces: `Agent`, `AgentCommission`, `AgentPayout`, `ReferralSettings`, `ValidatePromoCodeResponse`.
- **Validation Schemas (`packages/validation/src/index.ts`)**:
  - Add Zod schemas: `createAgentSchema`, `updateAgentSchema`, `validatePromoCodeSchema`, `createPayoutSchema`, `referralSettingsSchema`.
  - Extend `applicationSchema` to accept optional `promoCode: z.string().optional()`.
- **MemoryDatabase Model Parity (`apps/api/src/database/client.ts`)**:
  - Add collections to `MemoryDatabase`: `agents`, `agentCommissions`, `agentPayouts`, `agentAuditLogs`, `referralSettings`.
  - Seed default referral settings and permissions (`agents.create`).

### Phase 2: Promo Code Engine & Public Admission Flow
- **Promo Code Service (`apps/api/src/referral/promo-code.service.ts`)**:
  - Human-friendly uppercase pattern (e.g., `<INITIALS><DISCOUNT>`, e.g. `PD10`).
  - Disallows ambiguous characters (`0/O`, `1/I/L`).
  - Collision resolution loop (PD10 -> PD10A -> PD10B).
  - Sanitization, whitespace trimming, and canonical uppercase conversion.
- **Validation Endpoint (`apps/api/src/referral/routes.ts`)**:
  - `POST /api/referral/validate` { `code`, `programSlug?` }.
  - Rate limited to 10 requests / min / IP.
  - Returns: `{ valid: true, discountPercent, discountAmount, originalFee, finalFee }` or neutral 400 error.
- **Admission Submission Integration (`apps/api/src/admissions/admissions.controller.ts`)**:
  - If `promoCode` is absent, run legacy path without alteration.
  - If `promoCode` is present:
    - Re-verify code validity and active status server-side.
    - Anti-fraud check: student email/phone must not match agent email/phone; agent cannot refer self.
    - Store immutable snapshot fields on `Application`.
    - Create `AgentCommission` record with status `PENDING`.
- **Frontend Integration (`apps/web/src/pages/Apply.tsx`)**:
  - Add optional collapsed promo code input in Step 4.
  - Auto-apply query param `?ref=<code>`.
  - Dynamic fee preview card with accessible announcements (`aria-live`).
  - Pass validated code upon submission.

### Phase 3: Commission Lifecycle & Payment Hook
- **Payment Success Hook (`apps/api/src/payments/payments.controller.ts`)**:
  - Inside `verifyPayment` and `handleWebhook`:
    - Upon successful payment verification for an application, locate associated `AgentCommission`.
    - Transition status: `PENDING` -> `APPROVED`.
    - Set `approvedAt: new Date().toISOString()`.
    - Log transition to `agent_audit_logs`.
- **Status Change / Reversal Hook (`apps/api/src/admissions/admissions.controller.ts`)**:
  - When staff updates application status to `REJECTED` or refunds application:
    - Transition commission status: `PENDING` / `APPROVED` -> `REVERSED`.
    - Record `reversalReason`.
    - Log transition to `agent_audit_logs`.

### Phase 4: Administrative & Agent Portals API
- **Admin Management Endpoints (`apps/api/src/referral/admin.controller.ts`)**:
  - `GET /api/referral/agents`: List agents (search, filter by status).
  - `POST /api/referral/agents`: Create agent (Super Admin or Staff with `agents.create`).
    - Creates `User` account with role `AGENT`.
    - If Staff creates, uses global default percentages; marks with `"Commission not configured"` badge.
  - `PATCH /api/referral/agents/:id`: Update agent details (percentages editable ONLY by Super Admin).
  - `PATCH /api/referral/agents/:id/status`: Activate / Deactivate agent.
  - `POST /api/referral/agents/:id/reset-password`: Reset password / send invite.
  - `POST /api/referral/payouts`: Record payout (Super Admin only).
    - Links multiple `APPROVED` commissions to payout; marks them `PAID`.
  - `GET /api/referral/commissions`: View all commissions (Super Admin only).
  - `GET /api/referral/commissions/export`: Export commissions to CSV.
  - `GET / PUT /api/referral/settings`: Global referral settings (Super Admin only).
- **Agent Self-Service Endpoints (`apps/api/src/referral/agent.controller.ts`)**:
  - `GET /api/referral/agent/dashboard`: KPI metrics (total admissions, pending/approved/paid/reversed totals).
  - `GET /api/referral/agent/admissions`: Scoped admissions list with masked student PII.
  - `GET /api/referral/agent/payouts`: Payout history.
  - `GET /api/referral/agent/code`: Agent's promo code and referral link (`<site>/admission?ref=<CODE>`).
  - `GET / PATCH /api/referral/agent/profile`: Profile view and payout details update.

### Phase 5: Frontend Portals & UI Implementation
- **Agent Portal UI (`apps/web/src/agent/`)**:
  - `AgentDashboard.tsx`: Metric cards, commission summary, promo code share widget with 1-click copy.
  - `AgentAdmissions.tsx`: Paginated table of referred students (masked contact info, fee, commission status).
  - `AgentPayouts.tsx`: Payout records and ledger history.
- **Admin Referral Management UI (`apps/web/src/admin/`)**:
  - `AgentsAdmin.tsx`: Full agent list, status filters, create/edit modal.
  - `CommissionsAdmin.tsx`: Commission ledger, batch payout modal, CSV export.
  - `ReferralSettingsAdmin.tsx`: Default percentages, commission base (Net vs Gross), max limits.
  - Integrate referral attribution into existing `AdmissionsAdmin.tsx` ("Referred by Agent (CODE)").
- **Navigation & Role Access (`apps/web/src/admin/access.ts` & `AdminLayout.tsx`)**:
  - Add `agent` module for role `AGENT`.
  - Add `referral-agents` and `referral-commissions` modules for `SUPER_ADMIN` and `ADMISSION_STAFF`.

### Phase 6: Automated Testing & Verification
- **Unit Tests**:
  - Promo code generation and collision handling.
  - Discount and commission calculation (rounding, minor units, Net vs Gross base).
  - Commission state machine valid/invalid transitions.
- **Integration Tests**:
  - `POST /api/referral/validate` under valid, invalid, inactive, and rate-limited conditions.
  - Admission submission without promo code (verifying 0 changes to output).
  - Admission submission with promo code (verifying discount, snapshot fields, pending commission).
  - Payment verification triggering commission `PENDING` -> `APPROVED`.
  - Payout recording triggering `APPROVED` -> `PAID`.
  - Self-referral prevention.
  - Double-submit idempotency.
  - RBAC checks: Staff without `agents.create` cannot create agents; Staff cannot edit percentages.
  - IDOR checks: Agent A cannot access Agent B's dashboard or admissions.
- **Regression Tests**:
  - Verification with feature flag `AGENT_REFERRAL_ENABLED=false` ensuring all referral routes return 404/disabled and public admission UI remains intact.
  - Full run of existing test suites.

---

## 3. Database Migration Specification

### New Table: `Agent`
```sql
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL UNIQUE,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL UNIQUE,
    "phone" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE
    "promoCode" TEXT NOT NULL UNIQUE,
    "commissionPercent" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "studentDiscountPercent" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "payoutDetails" TEXT, -- JSON / encrypted
    "notes" TEXT,
    "isConfigured" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "Agent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT
);
CREATE UNIQUE INDEX "Agent_promoCode_key" ON "Agent"("promoCode");
CREATE INDEX "Agent_status_idx" ON "Agent"("status");
```

### New Table: `AgentCommission`
```sql
CREATE TABLE "AgentCommission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agentId" TEXT NOT NULL,
    "admissionId" TEXT NOT NULL UNIQUE,
    "baseAmount" INTEGER NOT NULL, -- in paise
    "commissionPercent" DECIMAL(5,2) NOT NULL,
    "commissionAmount" INTEGER NOT NULL, -- in paise
    "status" TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, PAID, REVERSED
    "approvedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "payoutId" TEXT,
    "reversalReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AgentCommission_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT,
    CONSTRAINT "AgentCommission_admissionId_fkey" FOREIGN KEY ("admissionId") REFERENCES "Application"("id") ON DELETE RESTRICT
);
CREATE INDEX "AgentCommission_agentId_status_idx" ON "AgentCommission"("agentId", "status");
```

### New Table: `AgentPayout`
```sql
CREATE TABLE "AgentPayout" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agentId" TEXT NOT NULL,
    "totalAmount" INTEGER NOT NULL, -- in paise
    "method" TEXT NOT NULL, -- BANK_TRANSFER, UPI, CHEQUE, OTHER
    "reference" TEXT NOT NULL,
    "paidBy" TEXT NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    CONSTRAINT "AgentPayout_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT
);
```

### New Table: `AgentAuditLog`
```sql
CREATE TABLE "AgentAuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actorUserId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "AgentAuditLog_entity_idx" ON "AgentAuditLog"("entityType", "entityId");
```

### Alter Table: `Application`
```sql
ALTER TABLE "Application" ADD COLUMN "agentId" TEXT;
ALTER TABLE "Application" ADD COLUMN "promoCodeUsed" TEXT;
ALTER TABLE "Application" ADD COLUMN "discountPercentApplied" DECIMAL(5,2);
ALTER TABLE "Application" ADD COLUMN "discountAmount" INTEGER;
ALTER TABLE "Application" ADD COLUMN "commissionPercentApplied" DECIMAL(5,2);
CREATE INDEX "Application_agentId_idx" ON "Application"("agentId");
```

---

## 4. Acceptance Criteria Checklist

- [ ] Public admission without promo code is completely unaltered.
- [ ] Valid promo code applies discount accurately; creates `PENDING` commission record.
- [ ] Omitted promo code yields 0 commission and no retroactive attribution.
- [ ] Commission transitions strictly on verified payment (`PENDING` -> `APPROVED`).
- [ ] Super Admin records payouts (`APPROVED` -> `PAID`); links multiple commissions.
- [ ] Admission cancellation/refund reverses commission (`REVERSED`).
- [ ] Percentage changes apply solely to future admissions; past admissions preserve snapshots.
- [ ] Agent portal strictly isolates data per agent and masks student PII.
- [ ] Super Admin alone can edit commission percentages; Staff can create agents but with unconfigured badges.
- [ ] Feature flag `AGENT_REFERRAL_ENABLED=false` disables all referral endpoints and hides all referral UI.
- [ ] All automated unit, integration, and regression tests pass; compilation succeeds without errors.
