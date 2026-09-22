import { Request, Response } from 'express';
import { generalEnquirySchema, campusVisitSchema, leadStatusUpdateSchema } from '@deekshaam/validation';
import { memoryDb } from '../database/client';
import { recordAuditLog } from '../middleware/logger';
import { AuthenticatedRequest } from '../middleware/auth';

export function submitGeneralEnquiry(req: Request, res: Response) {
  const validated = generalEnquirySchema.parse(req.body);
  const isCallback = !validated.message || validated.message.toLowerCase().includes('callback');

  const lead = {
    id: `lead-${Date.now()}`,
    type: isCallback ? 'CALLBACK' : 'GENERAL_ENQUIRY',
    name: validated.name,
    phone: validated.phone,
    email: validated.email || null,
    program: validated.program || 'General',
    message: validated.message || 'Requested callback from admissions',
    sourcePage: validated.sourcePage || '/contact',
    status: 'NEW',
    assignedTo: null,
    notes: null,
    history: [
      {
        id: `lh-${Date.now()}`,
        oldStatus: null,
        newStatus: 'NEW',
        notes: 'Lead created via online form',
        changedBy: 'SYSTEM',
        createdAt: new Date().toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  memoryDb.leads.unshift(lead);

  res.status(201).json({
    success: true,
    message: 'Thank you. Your enquiry has been received.',
    data: { id: lead.id, type: lead.type },
  });
}

export function submitCampusVisit(req: Request, res: Response) {
  const validated = campusVisitSchema.parse(req.body);

  const lead = {
    id: `visit-${Date.now()}`,
    type: 'CAMPUS_VISIT',
    name: validated.name,
    phone: validated.phone,
    email: validated.email || null,
    program: validated.program || 'Campus Visit',
    preferredDate: validated.preferredDate,
    preferredTime: validated.preferredTime,
    message: validated.notes || 'Campus tour & admissions discussion requested',
    sourcePage: '/visit',
    status: 'NEW',
    assignedTo: null,
    notes: null,
    history: [
      {
        id: `lh-${Date.now()}`,
        oldStatus: null,
        newStatus: 'NEW',
        notes: `Visit requested for ${validated.preferredDate} (${validated.preferredTime})`,
        changedBy: 'SYSTEM',
        createdAt: new Date().toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  memoryDb.leads.unshift(lead);

  res.status(201).json({
    success: true,
    message: 'Campus visit request received. Admissions will contact you to confirm.',
    data: { id: lead.id, preferredDate: lead.preferredDate },
  });
}

export function listLeads(req: AuthenticatedRequest, res: Response) {
  const { type, status, search } = req.query;

  let list = [...memoryDb.leads];

  if (type) list = list.filter((l) => l.type === type);
  if (status) list = list.filter((l) => l.status === status);
  if (search) {
    const q = String(search).toLowerCase();
    list = list.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        (l.email && l.email.toLowerCase().includes(q)) ||
        l.phone.includes(q) ||
        (l.program && l.program.toLowerCase().includes(q))
    );
  }

  res.json({ success: true, data: list });
}

export function updateLead(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const lead = memoryDb.leads.find((l) => l.id === id);

  if (!lead) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Lead not found' } });
  }

  const { status, assignedTo, notes } = leadStatusUpdateSchema.parse(req.body);
  const oldStatus = lead.status;

  lead.status = status;
  if (assignedTo !== undefined) lead.assignedTo = assignedTo;
  if (notes !== undefined) lead.notes = notes;
  lead.updatedAt = new Date().toISOString();

  const historyItem = {
    id: `lh-${Date.now()}`,
    oldStatus,
    newStatus: status,
    notes: notes || `Status changed to ${status}`,
    changedBy: req.user?.email || 'STAFF',
    createdAt: new Date().toISOString(),
  };

  lead.history.push(historyItem);

  recordAuditLog({
    action: 'STATUS_CHANGE',
    entity: 'Lead',
    entityId: id,
    userId: req.user?.id,
    userEmail: req.user?.email,
    details: { oldStatus, newStatus: status, assignedTo },
  });

  res.json({ success: true, data: lead });
}
