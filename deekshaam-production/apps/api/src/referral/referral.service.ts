import { memoryDb } from '../database/client';
import { config } from '../config';
import { sanitizePromoCode, calculateReferralAmounts, CalculationResult } from './promo.service';

export const STANDARD_APPLICATION_FEE_PAISE = 50000; // ₹500.00 standard application processing fee

export interface ValidationOutcome {
  valid: boolean;
  code?: string;
  agent?: any;
  calculation?: CalculationResult;
  message?: string;
}

export class ReferralService {
  /**
   * Checks if referral system is globally enabled.
   */
  public isEnabled(): boolean {
    return Boolean(config.features.agentReferralEnabled);
  }

  /**
   * Gets current global referral settings.
   */
  public getSettings() {
    return memoryDb.referralSettings || {
      id: 'referral_settings_default',
      defaultCommissionPercent: 0,
      defaultDiscountPercent: 0,
      commissionBase: 'NET_FEE',
      maxAllowedDiscountPercent: 50,
      maxAllowedCommissionPercent: 50,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Finds an agent by canonical promo code.
   */
  public findAgentByCode(code: string): any | null {
    if (!code) return null;
    const canonical = sanitizePromoCode(code);
    return (
      memoryDb.agents.find(
        (a) =>
          !a.deletedAt &&
          sanitizePromoCode(a.promoCode) === canonical &&
          a.status === 'ACTIVE'
      ) || null
    );
  }

  /**
   * Validates a promo code with optional anti-fraud student context and program-specific fee lookup.
   */
  public validateCode(
    code: string,
    studentContext?: {
      email?: string;
      phone?: string;
      userId?: string;
    },
    programSlug?: string
  ): ValidationOutcome {
    if (!this.isEnabled()) {
      return { valid: false, message: 'Referral program is not active at this time.' };
    }

    const canonical = sanitizePromoCode(code);
    const agent = this.findAgentByCode(canonical);

    if (!agent) {
      // Neutral error message: does not reveal if code exists vs disabled
      return { valid: false, message: 'This code is not valid.' };
    }

    // Anti-fraud: agent cannot use their own code
    if (studentContext) {
      const studentEmail = (studentContext.email || '').trim().toLowerCase();
      const studentPhone = (studentContext.phone || '').trim().replace(/\D/g, '');
      const agentEmail = (agent.email || '').trim().toLowerCase();
      const agentPhone = (agent.phone || '').trim().replace(/\D/g, '');

      if (studentEmail && agentEmail && studentEmail === agentEmail) {
        return { valid: false, message: 'This code is not eligible for this applicant.' };
      }

      if (
        studentPhone &&
        agentPhone &&
        (studentPhone.endsWith(agentPhone) || agentPhone.endsWith(studentPhone))
      ) {
        return { valid: false, message: 'This code is not eligible for this applicant.' };
      }

      if (studentContext.userId && studentContext.userId === agent.userId) {
        return { valid: false, message: 'Agents cannot apply their own promo code.' };
      }
    }

    let grossFeePaise = STANDARD_APPLICATION_FEE_PAISE;
    if (programSlug) {
      const prog = memoryDb.programs.find(
        (p: any) =>
          p.slug === programSlug ||
          p.code?.toLowerCase() === programSlug.toLowerCase() ||
          p.id === programSlug
      );
      if (prog && typeof prog.applicationFee === 'number' && prog.applicationFee > 0) {
        grossFeePaise = Math.round(prog.applicationFee * 100);
      }
    }

    const settings = this.getSettings();
    const discountPercent = Number(agent.studentDiscountPercent || 0);
    const commissionPercent = Number(agent.commissionPercent || 0);

    const calculation = calculateReferralAmounts({
      grossFeePaise,
      discountPercent,
      commissionPercent,
      commissionBase: settings.commissionBase,
    });

    return {
      valid: true,
      code: canonical,
      agent,
      calculation,
      message: `Code ${canonical} applied: ${discountPercent}% off`,
    };
  }

  /**
   * Processes referral attribution and creates pending commission inside admission submission.
   */
  public processAdmissionSubmission(params: {
    applicationId: string;
    promoCode?: string;
    programSlug?: string;
    studentEmail: string;
    studentPhone: string;
    studentUserId?: string;
  }): {
    agentId: string | null;
    promoCodeUsed: string | null;
    discountPercentApplied: number;
    discountAmount: number; // in paise
    commissionPercentApplied: number;
    commissionAmount: number; // in paise
    finalFeePaise: number;
  } {
    let grossFeePaise = STANDARD_APPLICATION_FEE_PAISE;
    if (params.programSlug) {
      const pSlug = params.programSlug;
      const prog = memoryDb.programs.find(
        (p: any) =>
          p.slug === pSlug ||
          (p.code && p.code.toLowerCase() === pSlug.toLowerCase()) ||
          p.id === pSlug
      );
      if (prog && typeof prog.applicationFee === 'number' && prog.applicationFee > 0) {
        grossFeePaise = Math.round(prog.applicationFee * 100);
      }
    }

    if (!this.isEnabled() || !params.promoCode) {
      return {
        agentId: null,
        promoCodeUsed: null,
        discountPercentApplied: 0,
        discountAmount: 0,
        commissionPercentApplied: 0,
        commissionAmount: 0,
        finalFeePaise: grossFeePaise,
      };
    }

    const outcome = this.validateCode(
      params.promoCode,
      {
        email: params.studentEmail,
        phone: params.studentPhone,
        userId: params.studentUserId,
      },
      params.programSlug
    );

    if (!outcome.valid || !outcome.agent || !outcome.calculation) {
      throw new Error(outcome.message || 'The promo code applied is not valid.');
    }

    const { agent, calculation } = outcome;

    // Create AgentCommission record in PENDING state
    const commissionRecord = {
      id: `comm-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      agentId: agent.id,
      admissionId: params.applicationId,
      baseAmount: calculation.commissionBasePaise,
      commissionPercent: calculation.commissionPercent,
      commissionAmount: calculation.commissionAmountPaise,
      status: 'PENDING',
      approvedAt: null,
      paidAt: null,
      payoutId: null,
      reversalReason: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Ensure idempotency: do not create duplicate commission for the same admission
    const existing = memoryDb.agentCommissions.find((c) => c.admissionId === params.applicationId);
    if (!existing) {
      memoryDb.agentCommissions.unshift(commissionRecord);

      // Audit log
      this.recordAuditLog({
        actorUserId: agent.userId,
        action: 'COMMISSION_CREATED',
        entityType: 'AgentCommission',
        entityId: commissionRecord.id,
        newValue: JSON.stringify({
          status: 'PENDING',
          commissionAmount: calculation.commissionAmountPaise,
          admissionId: params.applicationId,
          code: agent.promoCode,
        }),
      });

      memoryDb.saveToFile();
    }

    return {
      agentId: agent.id,
      promoCodeUsed: agent.promoCode,
      discountPercentApplied: calculation.discountPercent,
      discountAmount: calculation.discountAmountPaise,
      commissionPercentApplied: calculation.commissionPercent,
      commissionAmount: calculation.commissionAmountPaise,
      finalFeePaise: calculation.netFeePaise,
    };
  }

  /**
   * Payment success hook: Transitions commission PENDING -> APPROVED.
   */
  public approveCommissionForAdmission(admissionId: string): boolean {
    if (!this.isEnabled()) return false;

    const commission = memoryDb.agentCommissions.find((c) => c.admissionId === admissionId);
    if (!commission) return false;

    if (commission.status === 'PENDING') {
      const oldStatus = commission.status;
      commission.status = 'APPROVED';
      commission.approvedAt = new Date().toISOString();
      commission.updatedAt = new Date().toISOString();

      this.recordAuditLog({
        actorUserId: 'SYSTEM',
        action: 'COMMISSION_STATUS_CHANGE',
        entityType: 'AgentCommission',
        entityId: commission.id,
        oldValue: oldStatus,
        newValue: 'APPROVED',
      });
      return true;
    }
    return false;
  }

  /**
   * Admission rejection/cancellation/refund hook: Transitions commission to REVERSED.
   */
  public reverseCommissionForAdmission(
    admissionId: string,
    reason: string,
    actorUserId?: string
  ): boolean {
    if (!this.isEnabled()) return false;

    const commission = memoryDb.agentCommissions.find((c) => c.admissionId === admissionId);
    if (!commission) return false;

    if (commission.status === 'REVERSED') return false;

    const oldStatus = commission.status;
    commission.status = 'REVERSED';
    commission.reversalReason = reason || 'Admission cancelled, rejected, or refunded';
    commission.updatedAt = new Date().toISOString();

    this.recordAuditLog({
      actorUserId: actorUserId || 'SYSTEM',
      action: 'COMMISSION_STATUS_CHANGE',
      entityType: 'AgentCommission',
      entityId: commission.id,
      oldValue: oldStatus,
      newValue: JSON.stringify({ status: 'REVERSED', reason: commission.reversalReason }),
    });
    return true;
  }

  /**
   * Records payout for one or more approved commissions.
   */
  public recordPayout(params: {
    agentId: string;
    commissionIds?: string[];
    method: string;
    reference: string;
    note?: string;
    paidBy: string;
  }): any {
    const agent = memoryDb.agents.find((a) => a.id === params.agentId && !a.deletedAt);
    if (!agent) throw new Error('Agent not found');

    const eligibleCommissions = memoryDb.agentCommissions.filter(
      (c) =>
        c.agentId === params.agentId &&
        c.status === 'APPROVED' &&
        (!params.commissionIds || params.commissionIds.length === 0 || params.commissionIds.includes(c.id))
    );

    if (eligibleCommissions.length === 0) {
      throw new Error('No approved commissions found for this payout.');
    }

    const totalAmount = eligibleCommissions.reduce((sum, c) => sum + c.commissionAmount, 0);
    const payoutId = `payo-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    const payoutRecord = {
      id: payoutId,
      agentId: agent.id,
      totalAmount,
      method: params.method,
      reference: params.reference,
      note: params.note || null,
      paidBy: params.paidBy,
      paidAt: new Date().toISOString(),
    };

    memoryDb.agentPayouts.unshift(payoutRecord);

    const now = new Date().toISOString();
    eligibleCommissions.forEach((c) => {
      c.status = 'PAID';
      c.payoutId = payoutId;
      c.paidAt = now;
      c.updatedAt = now;
    });

    this.recordAuditLog({
      actorUserId: params.paidBy,
      action: 'PAYOUT_RECORDED',
      entityType: 'AgentPayout',
      entityId: payoutId,
      newValue: JSON.stringify({
        totalAmount,
        commissionCount: eligibleCommissions.length,
        method: params.method,
        reference: params.reference,
      }),
    });

    return payoutRecord;
  }

  /**
   * Records an immutable audit log entry.
   */
  public recordAuditLog(entry: {
    actorUserId: string;
    action: string;
    entityType: string;
    entityId: string;
    oldValue?: string | null;
    newValue?: string | null;
    ipAddress?: string | null;
  }) {
    const log = {
      id: `aal-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      ...entry,
      createdAt: new Date().toISOString(),
    };
    memoryDb.agentAuditLogs.unshift(log);
  }
}

export const referralService = new ReferralService();
