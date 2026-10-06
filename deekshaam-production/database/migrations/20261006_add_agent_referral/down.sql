-- ==============================================================================
-- DEEKSHAAM PRODUCTION PLATFORM - DOWN MIGRATION 20261006_add_agent_referral
-- Purpose: Safely rollback Agent & Referral Promo Code schema
-- ==============================================================================

-- 1. Drop Foreign Keys
ALTER TABLE "AgentPayout" DROP CONSTRAINT IF EXISTS "AgentPayout_agentId_fkey";
ALTER TABLE "AgentCommission" DROP CONSTRAINT IF EXISTS "AgentCommission_payoutId_fkey";
ALTER TABLE "AgentCommission" DROP CONSTRAINT IF EXISTS "AgentCommission_admissionId_fkey";
ALTER TABLE "AgentCommission" DROP CONSTRAINT IF EXISTS "AgentCommission_agentId_fkey";
ALTER TABLE "Application" DROP CONSTRAINT IF EXISTS "Application_agentId_fkey";
ALTER TABLE "Agent" DROP CONSTRAINT IF EXISTS "Agent_userId_fkey";

-- 2. Drop Tables
DROP TABLE IF EXISTS "ReferralSettings";
DROP TABLE IF EXISTS "AgentAuditLog";
DROP TABLE IF EXISTS "AgentPayout";
DROP TABLE IF EXISTS "AgentCommission";
DROP TABLE IF EXISTS "Agent";

-- 3. Rollback Application Columns
DROP INDEX IF EXISTS "Application_agentId_idx";
ALTER TABLE "Application" DROP COLUMN IF EXISTS "commissionPercentApplied";
ALTER TABLE "Application" DROP COLUMN IF EXISTS "discountAmount";
ALTER TABLE "Application" DROP COLUMN IF EXISTS "discountPercentApplied";
ALTER TABLE "Application" DROP COLUMN IF EXISTS "promoCodeUsed";
ALTER TABLE "Application" DROP COLUMN IF EXISTS "agentId";
