-- ==============================================================================
-- DEEKSHAAM PRODUCTION PLATFORM - MIGRATION 20261006_add_agent_referral
-- Purpose: Add Agent & Referral Promo Code System (Reversible, Non-breaking)
-- ==============================================================================

-- 1. AlterTable: Application (add nullable referral columns - does not break existing rows)
ALTER TABLE "Application" ADD COLUMN "agentId" TEXT;
ALTER TABLE "Application" ADD COLUMN "promoCodeUsed" TEXT;
ALTER TABLE "Application" ADD COLUMN "discountPercentApplied" DECIMAL(5,2);
ALTER TABLE "Application" ADD COLUMN "discountAmount" INTEGER;
ALTER TABLE "Application" ADD COLUMN "commissionPercentApplied" DECIMAL(5,2);

-- 2. CreateTable: Agent
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "promoCode" TEXT NOT NULL,
    "commissionPercent" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "studentDiscountPercent" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "payoutDetails" TEXT,
    "notes" TEXT,
    "isConfigured" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- 3. CreateTable: AgentCommission
CREATE TABLE "AgentCommission" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "admissionId" TEXT NOT NULL,
    "baseAmount" INTEGER NOT NULL,
    "commissionPercent" DECIMAL(5,2) NOT NULL,
    "commissionAmount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "payoutId" TEXT,
    "reversalReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentCommission_pkey" PRIMARY KEY ("id")
);

-- 4. CreateTable: AgentPayout
CREATE TABLE "AgentPayout" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "method" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "paidBy" TEXT NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,

    CONSTRAINT "AgentPayout_pkey" PRIMARY KEY ("id")
);

-- 5. CreateTable: AgentAuditLog
CREATE TABLE "AgentAuditLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentAuditLog_pkey" PRIMARY KEY ("id")
);

-- 6. CreateTable: ReferralSettings
CREATE TABLE "ReferralSettings" (
    "id" TEXT NOT NULL DEFAULT 'referral_settings_default',
    "defaultCommissionPercent" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "defaultDiscountPercent" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "commissionBase" TEXT NOT NULL DEFAULT 'NET_FEE',
    "maxAllowedDiscountPercent" DECIMAL(5,2) NOT NULL DEFAULT 50.00,
    "maxAllowedCommissionPercent" DECIMAL(5,2) NOT NULL DEFAULT 50.00,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferralSettings_pkey" PRIMARY KEY ("id")
);

-- 7. Constraints & Indexes
CREATE UNIQUE INDEX "Agent_userId_key" ON "Agent"("userId");
CREATE UNIQUE INDEX "Agent_email_key" ON "Agent"("email");
CREATE UNIQUE INDEX "Agent_promoCode_key" ON "Agent"("promoCode");
CREATE INDEX "Agent_status_idx" ON "Agent"("status");
CREATE INDEX "Agent_promoCode_idx" ON "Agent"("promoCode");

CREATE UNIQUE INDEX "AgentCommission_admissionId_key" ON "AgentCommission"("admissionId");
CREATE INDEX "AgentCommission_agentId_status_idx" ON "AgentCommission"("agentId", "status");
CREATE INDEX "AgentCommission_status_idx" ON "AgentCommission"("status");

CREATE INDEX "AgentPayout_agentId_idx" ON "AgentPayout"("agentId");
CREATE INDEX "AgentAuditLog_entityType_entityId_idx" ON "AgentAuditLog"("entityType", "entityId");
CREATE INDEX "AgentAuditLog_createdAt_idx" ON "AgentAuditLog"("createdAt");

CREATE INDEX "Application_agentId_idx" ON "Application"("agentId");

-- 8. Foreign Keys
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Application" ADD CONSTRAINT "Application_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgentCommission" ADD CONSTRAINT "AgentCommission_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AgentCommission" ADD CONSTRAINT "AgentCommission_admissionId_fkey" FOREIGN KEY ("admissionId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AgentCommission" ADD CONSTRAINT "AgentCommission_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "AgentPayout"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgentPayout" ADD CONSTRAINT "AgentPayout_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
