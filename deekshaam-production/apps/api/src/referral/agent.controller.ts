import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { memoryDb } from '../database/client';
import { referralService } from './referral.service';
import { config } from '../config';

/**
 * Masks phone number for privacy: e.g. 9876543210 -> 98****10
 */
function maskPhone(phone?: string): string {
  if (!phone) return 'N/A';
  const clean = phone.trim().replace(/\D/g, '');
  if (clean.length < 4) return '****';
  return `${clean.slice(0, 2)}****${clean.slice(-2)}`;
}

/**
 * Masks email for privacy: e.g. student@gmail.com -> s****t@gmail.com
 */
function maskEmail(email?: string): string {
  if (!email || !email.includes('@')) return 'N/A';
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0]}*@${domain}`;
  return `${local[0]}****${local[local.length - 1]}@${domain}`;
}

/**
 * Extracts first name and initial: e.g. "Rahul Sharma" -> "Rahul S."
 */
function maskName(fullName?: string): string {
  if (!fullName) return 'Applicant';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

/**
 * Retrieves or automatically provisions the agent profile corresponding to the currently authenticated user/staff.
 */
function getOrCreateAgentForUser(user?: any) {
  if (!user || !user.id) return null;
  let agent = memoryDb.agents.find(
    (a) =>
      !a.deletedAt &&
      (a.userId === user.id || (user.email && a.email && a.email.toLowerCase() === user.email.toLowerCase()))
  );

  if (!agent) {
    const existingCodes = memoryDb.agents.filter((a) => !a.deletedAt).map((a) => a.promoCode);
    const settings = referralService.getSettings();
    const cleanPrefix = (user.name || 'STAFF').replace(/[^a-zA-Z]/g, '').slice(0, 5).toUpperCase() || 'STAFF';
    let promoCode = `${cleanPrefix}10`;
    let suffix = 1;
    while (existingCodes.includes(promoCode)) {
      promoCode = `${cleanPrefix}${suffix++}`;
    }

    agent = {
      id: `agent-usr-${user.id}`,
      userId: user.id,
      name: user.name || 'Staff Partner',
      email: user.email,
      phone: '9876543210',
      status: 'ACTIVE',
      promoCode,
      commissionPercent: settings.defaultCommissionPercent !== undefined ? settings.defaultCommissionPercent : 10,
      studentDiscountPercent: settings.defaultDiscountPercent !== undefined ? settings.defaultDiscountPercent : 10,
      payoutDetails: 'Internal Staff Referral Account',
      notes: `Institutional referral account for staff member (${user.role || 'STAFF'})`,
      isConfigured: true,
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    };
    memoryDb.agents.unshift(agent);
    memoryDb.saveToFile();
  } else if (!agent.userId) {
    agent.userId = user.id;
    memoryDb.saveToFile();
  }

  return agent;
}

export function getAgentDashboard(req: AuthenticatedRequest, res: Response) {
  const agent = getOrCreateAgentForUser(req.user);
  if (!agent) {
    return res.status(404).json({ success: false, error: { code: 'AGENT_NOT_FOUND', message: 'Agent profile not found.' } });
  }

  const commissions = memoryDb.agentCommissions.filter((c) => c.agentId === agent.id);
  const admissions = memoryDb.applications.filter((a) => a.agentId === agent.id);

  let totalPending = 0;
  let totalApproved = 0;
  let totalPaid = 0;
  let totalReversed = 0;

  commissions.forEach((c) => {
    if (c.status === 'PENDING') totalPending += c.commissionAmount;
    else if (c.status === 'APPROVED') totalApproved += c.commissionAmount;
    else if (c.status === 'PAID') totalPaid += c.commissionAmount;
    else if (c.status === 'REVERSED') totalReversed += c.commissionAmount;
  });

  const recent = commissions.slice(0, 5).map((comm) => {
    const admission = memoryDb.applications.find((a) => a.id === comm.admissionId);
    return {
      id: comm.admissionId,
      studentName: maskName(admission?.fullName),
      maskedPhone: maskPhone(admission?.phone),
      maskedEmail: maskEmail(admission?.email),
      programSlug: admission?.programSlug || 'bca',
      admissionStatus: admission?.status || 'SUBMITTED',
      grossFeeINR: 500,
      discountINR: (admission?.discountAmount || 0) / 100,
      finalFeeINR: (comm.baseAmount || 50000) / 100,
      commissionINR: comm.commissionAmount / 100,
      commissionStatus: comm.status,
      submittedAt: comm.createdAt,
    };
  });

  res.json({
    success: true,
    data: {
      agent: {
        id: agent.id,
        name: agent.name,
        email: agent.email,
        phone: agent.phone,
        status: agent.status,
        promoCode: agent.promoCode,
        commissionPercent: Number(agent.commissionPercent),
        studentDiscountPercent: Number(agent.studentDiscountPercent),
        isConfigured: agent.isConfigured,
        shareUrl: `${config.clientOrigin}/apply?ref=${agent.promoCode}`,
      },
      metrics: {
        totalAdmissions: admissions.length,
        totalPendingCommissionINR: totalPending / 100,
        totalApprovedCommissionINR: totalApproved / 100,
        totalPaidCommissionINR: totalPaid / 100,
        totalReversedCommissionINR: totalReversed / 100,
      },
      recentAdmissions: recent,
    },
  });
}

export function getAgentAdmissions(req: AuthenticatedRequest, res: Response) {
  const agent = getOrCreateAgentForUser(req.user);
  if (!agent) {
    return res.status(404).json({ success: false, error: { code: 'AGENT_NOT_FOUND', message: 'Agent profile not found.' } });
  }

  const { status, search } = req.query;

  // Filter commissions strictly belonging to this agent
  let commissions = memoryDb.agentCommissions.filter((c) => c.agentId === agent.id);

  if (status) {
    commissions = commissions.filter((c) => c.status === status);
  }

  let results = commissions.map((comm) => {
    const admission = memoryDb.applications.find((a) => a.id === comm.admissionId);
    return {
      id: comm.admissionId,
      studentName: maskName(admission?.fullName),
      maskedPhone: maskPhone(admission?.phone),
      maskedEmail: maskEmail(admission?.email),
      programSlug: admission?.programSlug || 'bca',
      admissionStatus: admission?.status || 'SUBMITTED',
      grossFeeINR: 500,
      discountINR: (admission?.discountAmount || 0) / 100,
      finalFeeINR: (comm.baseAmount || 50000) / 100,
      commissionINR: comm.commissionAmount / 100,
      commissionStatus: comm.status,
      submittedAt: comm.createdAt,
      paidAt: comm.paidAt || null,
    };
  });

  if (search) {
    const q = String(search).toLowerCase();
    results = results.filter(
      (r) =>
        r.id.toLowerCase().includes(q) ||
        r.studentName.toLowerCase().includes(q) ||
        r.programSlug.toLowerCase().includes(q)
    );
  }

  res.json({
    success: true,
    data: results,
  });
}

export function getAgentPayouts(req: AuthenticatedRequest, res: Response) {
  const agent = getOrCreateAgentForUser(req.user);
  if (!agent) {
    return res.status(404).json({ success: false, error: { code: 'AGENT_NOT_FOUND', message: 'Agent profile not found.' } });
  }

  const payouts = memoryDb.agentPayouts
    .filter((p) => p.agentId === agent.id)
    .map((p) => ({
      id: p.id,
      totalAmountINR: p.totalAmount / 100,
      method: p.method,
      reference: p.reference,
      note: p.note,
      paidAt: p.paidAt,
    }));

  res.json({
    success: true,
    data: payouts,
  });
}

export function updateAgentPayoutDetails(req: AuthenticatedRequest, res: Response) {
  const agent = getOrCreateAgentForUser(req.user);
  if (!agent) {
    return res.status(404).json({ success: false, error: { code: 'AGENT_NOT_FOUND', message: 'Agent profile not found.' } });
  }

  const { payoutDetails } = req.body;
  agent.payoutDetails = payoutDetails || null;
  agent.updatedAt = new Date().toISOString();

  referralService.recordAuditLog({
    actorUserId: agent.userId,
    action: 'AGENT_PAYOUT_DETAILS_UPDATED',
    entityType: 'Agent',
    entityId: agent.id,
    newValue: JSON.stringify({ updated: true }),
  });

  memoryDb.saveToFile();

  res.json({
    success: true,
    data: { message: 'Payout details updated successfully.' },
  });
}
