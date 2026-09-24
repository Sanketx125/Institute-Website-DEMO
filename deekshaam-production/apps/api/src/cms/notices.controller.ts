import { Request, Response } from 'express';
import { z } from 'zod';
import { memoryDb } from '../database/client';
import { AuthenticatedRequest } from '../middleware/auth';
import { recordAuditLog } from '../middleware/logger';
const schema = z.object({ title: z.string().trim().min(5).max(180), date: z.string().trim().min(4).max(40), priority: z.enum(['NORMAL','HIGH']), status: z.enum(['PUBLISHED','ARCHIVED']), fileUrl: z.string().max(500).optional().default('') });
export function getNotices(_req: Request, res: Response) { res.json({ success: true, data: memoryDb.notices.filter(n => n.status === 'PUBLISHED') }); }
export function listNotices(_req: AuthenticatedRequest, res: Response) { res.json({ success: true, data: memoryDb.notices }); }
export function createNotice(req: AuthenticatedRequest, res: Response) {
  const item = { id: `not-${Date.now()}`, ...schema.parse(req.body) };
  memoryDb.notices.unshift(item);
  recordAuditLog({ action: 'CREATE', entity: 'Notice', entityId: item.id, userId: req.user?.id, userEmail: req.user?.email, details: { title: item.title } });
  res.status(201).json({ success: true, data: item });
}
export function updateNotice(req: AuthenticatedRequest, res: Response) {
  const item = memoryDb.notices.find(n => n.id === req.params.id);
  if (!item) return res.status(404).json({ success: false, error: { message: 'Notice not found.' } });
  Object.assign(item, schema.parse(req.body));
  recordAuditLog({ action: 'UPDATE', entity: 'Notice', entityId: item.id, userId: req.user?.id, userEmail: req.user?.email, details: { title: item.title, status: item.status } });
  res.json({ success: true, data: item });
}
