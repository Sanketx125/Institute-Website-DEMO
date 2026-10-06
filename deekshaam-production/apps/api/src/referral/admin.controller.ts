import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { AuthenticatedRequest } from '../middleware/auth';
import { memoryDb } from '../database/client';
import { referralService } from './referral.service';
import { generatePromoCode, isValidCustomCode, sanitizePromoCode } from './promo.service';
import { createAgentSchema, updateAgentSchema, createPayoutSchema, referralSettingsSchema } from '@deekshaam/validation';

export function listAgents(req: AuthenticatedRequest, res: Response) {
  const { status, search } = req.query;

  let agents = memoryDb.agents.filter((a) => !a.deletedAt);

  if (status) {
    agents = agents.filter((a) => a.status === status);
  }

  if (search) {
    const q = String(search).toLowerCase();
    agents = agents.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.phone.toLowerCase().includes(q) ||
        a.promoCode.toLowerCase().includes(q)
    );
  }

  const results = agents.map((agent) => {
    const commissions = memoryDb.agentCommissions.filter((c) => c.agentId === agent.id);
    const admissionsCount = memoryDb.applications.filter((a) => a.agentId === agent.id).length;

    const totalApproved = commissions.filter((c) => c.status === 'APPROVED').reduce((sum, c) => sum + c.commissionAmount, 0);
    const totalPaid = commissions.filter((c) => c.status === 'PAID').reduce((sum, c) => sum + c.commissionAmount, 0);

    return {
      id: agent.id,
      userId: agent.userId,
      name: agent.name,
      email: agent.email,
      phone: agent.phone,
      status: agent.status,
      promoCode: agent.promoCode,
      commissionPercent: Number(agent.commissionPercent),
      studentDiscountPercent: Number(agent.studentDiscountPercent),
      isConfigured: agent.isConfigured,
      notes: agent.notes,
      admissionsCount,
      approvedCommissionINR: totalApproved / 100,
      paidCommissionINR: totalPaid / 100,
      createdAt: agent.createdAt,
    };
  });

  res.json({ success: true, data: results });
}

export async function createAgent(req: AuthenticatedRequest, res: Response) {
  const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';

  const parsed = createAgentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: parsed.error.errors.map((e) => e.message).join('; ') },
    });
  }

  const data = parsed.data;

  // Check email collision
  const existingUser = memoryDb.users.find((u) => u.email.toLowerCase() === data.email.toLowerCase());
  const existingAgent = memoryDb.agents.find((a) => a.email.toLowerCase() === data.email.toLowerCase() && !a.deletedAt);
  if (existingUser || existingAgent) {
    return res.status(409).json({ success: false, error: { code: 'AGENT_EXISTS', message: 'An account with this email already exists.' } });
  }

  const settings = referralService.getSettings();

  // Rate logic: Only Super Admin can define custom rates at creation.
  // Staff creations default to global settings and are marked as unconfigured.
  let commissionPercent = settings.defaultCommissionPercent;
  let studentDiscountPercent = settings.defaultDiscountPercent;
  let isConfigured = false;

  if (isSuperAdmin && (data.commissionPercent !== undefined || data.studentDiscountPercent !== undefined)) {
    commissionPercent = data.commissionPercent !== undefined ? data.commissionPercent : settings.defaultCommissionPercent;
    studentDiscountPercent = data.studentDiscountPercent !== undefined ? data.studentDiscountPercent : settings.defaultDiscountPercent;
    isConfigured = true;
  }

  // Promo code generation or custom override
  const existingCodes = memoryDb.agents.filter((a) => !a.deletedAt).map((a) => a.promoCode);
  let promoCode = '';

  if (data.promoCode && isSuperAdmin) {
    const customValidation = isValidCustomCode(data.promoCode);
    if (!customValidation.valid) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_CODE', message: customValidation.reason } });
    }
    const cleanCode = sanitizePromoCode(data.promoCode);
    if (existingCodes.includes(cleanCode)) {
      return res.status(409).json({ success: false, error: { code: 'CODE_EXISTS', message: 'This promo code is already in use.' } });
    }
    promoCode = cleanCode;
  } else {
    promoCode = generatePromoCode(data.name, studentDiscountPercent, existingCodes);
  }

  // Create User account for Agent
  const tempPassword = data.password || `Agent@${Math.floor(100000 + Math.random() * 900000)}!`;
  const userId = `usr-agent-${Date.now()}`;
  const newUser = {
    id: userId,
    email: data.email,
    passwordHash: await bcrypt.hash(tempPassword, 10),
    name: data.name,
    role: 'AGENT',
    isActive: data.status === 'ACTIVE',
    createdAt: new Date().toISOString(),
  };
  memoryDb.users.push(newUser);

  // Create Agent profile
  const agentId = `agent-${Date.now()}`;
  const newAgent = {
    id: agentId,
    userId,
    name: data.name,
    email: data.email,
    phone: data.phone,
    status: data.status || 'ACTIVE',
    promoCode,
    commissionPercent,
    studentDiscountPercent,
    payoutDetails: data.payoutDetails || null,
    notes: data.notes || null,
    isConfigured,
    createdBy: req.user?.id || 'STAFF',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
  };
  memoryDb.agents.unshift(newAgent);

  referralService.recordAuditLog({
    actorUserId: req.user?.id || 'SYSTEM',
    action: 'AGENT_CREATE',
    entityType: 'Agent',
    entityId: agentId,
    newValue: JSON.stringify({ name: data.name, email: data.email, promoCode, isConfigured }),
  });

  res.status(201).json({
    success: true,
    data: {
      ...newAgent,
      initialPassword: isSuperAdmin ? tempPassword : undefined, // Provided once to creator for initial onboarding
    },
  });
}

export function updateAgent(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';

  const agent = memoryDb.agents.find((a) => a.id === id && !a.deletedAt);
  if (!agent) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Agent not found' } });
  }

  const parsed = updateAgentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: parsed.error.errors.map((e) => e.message).join('; ') },
    });
  }

  const data = parsed.data;

  // Percentage changes can ONLY be made by Super Admin
  if ((data.commissionPercent !== undefined || data.studentDiscountPercent !== undefined) && !isSuperAdmin) {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only Super Admin can configure commission or discount rates.' },
    });
  }

  // Promo code changes can ONLY be made by Super Admin
  if (data.promoCode && !isSuperAdmin) {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only Super Admin can change promo codes.' },
    });
  }

  if (data.promoCode && isSuperAdmin) {
    const clean = sanitizePromoCode(data.promoCode);
    if (clean !== agent.promoCode) {
      const codeCheck = isValidCustomCode(clean);
      if (!codeCheck.valid) return res.status(400).json({ success: false, error: { code: 'INVALID_CODE', message: codeCheck.reason } });
      const collision = memoryDb.agents.find((a) => a.id !== agent.id && a.promoCode === clean && !a.deletedAt);
      if (collision) return res.status(409).json({ success: false, error: { code: 'CODE_EXISTS', message: 'Promo code is already in use.' } });
      agent.promoCode = clean;
    }
  }

  if (data.name) agent.name = data.name;
  if (data.phone) agent.phone = data.phone;
  if (data.status) agent.status = data.status;
  if (data.notes !== undefined) agent.notes = data.notes;
  if (data.payoutDetails !== undefined) agent.payoutDetails = data.payoutDetails;

  if (isSuperAdmin) {
    if (data.commissionPercent !== undefined) agent.commissionPercent = data.commissionPercent;
    if (data.studentDiscountPercent !== undefined) agent.studentDiscountPercent = data.studentDiscountPercent;
    agent.isConfigured = true;
  }

  agent.updatedAt = new Date().toISOString();

  // Sync user status
  const user = memoryDb.users.find((u) => u.id === agent.userId);
  if (user && data.status) {
    user.isActive = data.status === 'ACTIVE';
  }

  referralService.recordAuditLog({
    actorUserId: req.user?.id || 'SYSTEM',
    action: 'AGENT_UPDATE',
    entityType: 'Agent',
    entityId: agent.id,
    newValue: JSON.stringify({
      commissionPercent: agent.commissionPercent,
      studentDiscountPercent: agent.studentDiscountPercent,
      status: agent.status,
    }),
  });

  res.json({ success: true, data: agent });
}

export function toggleAgentStatus(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const agent = memoryDb.agents.find((a) => a.id === id && !a.deletedAt);
  if (!agent) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Agent not found' } });
  }

  const newStatus = agent.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
  agent.status = newStatus;
  agent.updatedAt = new Date().toISOString();

  const user = memoryDb.users.find((u) => u.id === agent.userId);
  if (user) user.isActive = newStatus === 'ACTIVE';

  referralService.recordAuditLog({
    actorUserId: req.user?.id || 'SYSTEM',
    action: 'AGENT_STATUS_TOGGLE',
    entityType: 'Agent',
    entityId: agent.id,
    newValue: newStatus,
  });

  res.json({ success: true, data: { id: agent.id, status: newStatus } });
}

export function recordPayout(req: AuthenticatedRequest, res: Response) {
  const parsed = createPayoutSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: parsed.error.errors.map((e) => e.message).join('; ') },
    });
  }

  try {
    const payout = referralService.recordPayout({
      ...parsed.data,
      paidBy: req.user?.id || 'SUPER_ADMIN',
    });
    res.status(201).json({ success: true, data: payout });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { code: 'PAYOUT_FAILED', message: err.message } });
  }
}

export function listCommissions(req: AuthenticatedRequest, res: Response) {
  const { status, agentId } = req.query;

  let list = [...memoryDb.agentCommissions];
  if (status) list = list.filter((c) => c.status === status);
  if (agentId) list = list.filter((c) => c.agentId === agentId);

  const results = list.map((c) => {
    const agent = memoryDb.agents.find((a) => a.id === c.agentId);
    const admission = memoryDb.applications.find((a) => a.id === c.admissionId);
    return {
      ...c,
      baseAmountINR: c.baseAmount / 100,
      commissionAmountINR: c.commissionAmount / 100,
      agentName: agent?.name || 'Unknown',
      agentEmail: agent?.email || 'Unknown',
      agentPromoCode: agent?.promoCode || 'N/A',
      studentName: admission?.fullName || 'Unknown',
      programSlug: admission?.programSlug || 'bca',
    };
  });

  res.json({ success: true, data: results });
}

export function exportCommissionsCSV(_req: AuthenticatedRequest, res: Response) {
  const list = memoryDb.agentCommissions.map((c) => {
    const agent = memoryDb.agents.find((a) => a.id === c.agentId);
    const admission = memoryDb.applications.find((a) => a.id === c.admissionId);
    return [
      c.id,
      c.admissionId,
      agent?.name || '',
      agent?.email || '',
      agent?.promoCode || '',
      admission?.fullName || '',
      admission?.programSlug || '',
      (c.baseAmount / 100).toFixed(2),
      c.commissionPercent,
      (c.commissionAmount / 100).toFixed(2),
      c.status,
      c.approvedAt || '',
      c.paidAt || '',
      c.createdAt,
    ].map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',');
  });

  const header = '"Commission ID","Admission ID","Agent Name","Agent Email","Promo Code","Student Name","Program","Base Fee (INR)","Commission %","Commission (INR)","Status","Approved At","Paid At","Created At"';
  const csv = [header, ...list].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="commissions-export.csv"');
  res.send(csv);
}

export function getReferralSettings(_req: AuthenticatedRequest, res: Response) {
  res.json({ success: true, data: referralService.getSettings() });
}

export function updateReferralSettings(req: AuthenticatedRequest, res: Response) {
  const parsed = referralSettingsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: parsed.error.errors.map((e) => e.message).join('; ') },
    });
  }

  const updated = {
    ...referralService.getSettings(),
    ...parsed.data,
    updatedAt: new Date().toISOString(),
  };
  memoryDb.referralSettings = updated;

  referralService.recordAuditLog({
    actorUserId: req.user?.id || 'SUPER_ADMIN',
    action: 'REFERRAL_SETTINGS_UPDATED',
    entityType: 'ReferralSettings',
    entityId: updated.id,
    newValue: JSON.stringify(parsed.data),
  });

  res.json({ success: true, data: updated });
}
