import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { memoryDb } from '../database/client';
import { AuthenticatedRequest } from '../middleware/auth';
import { recordAuditLog } from '../middleware/logger';
import { eventUpsertSchema, galleryItemSchema } from '@deekshaam/validation';

const storySchema = z.object({
  name: z.string().trim().min(2).max(100),
  program: z.string().trim().min(2).max(100),
  graduationYear: z.string().trim().max(8).default(''),
  outcome: z.string().trim().min(4).max(180),
  quote: z.string().trim().min(10).max(1200),
  imageUrl: z.string().trim().max(500).default(''),
  consentConfirmed: z.boolean(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
}).refine(item => item.status !== 'PUBLISHED' || item.consentConfirmed, { message: 'Confirm consent before publishing a student story.' });

type Collection = 'events' | 'gallery' | 'stories';
const schemas = { events: eventUpsertSchema, gallery: galleryItemSchema, stories: storySchema };
const names = { events: 'Event', gallery: 'GalleryItem', stories: 'SuccessStory' };

export const listPublished = (collection: Collection) => (_req: Request, res: Response) => {
  res.json({ success: true, data: memoryDb[collection].filter(item => item.status === 'PUBLISHED') });
};

export const listForEditor = (collection: Collection) => (_req: AuthenticatedRequest, res: Response) => {
  res.json({ success: true, data: memoryDb[collection] });
};

export const saveEditorialItem = (collection: Collection) => (req: AuthenticatedRequest, res: Response) => {
  const validated = schemas[collection].parse(req.body);
  const items = memoryDb[collection];
  const index = req.params.id ? items.findIndex(item => item.id === req.params.id) : -1;
  if (req.params.id && index < 0) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Content item not found.' } });
  }
  if (collection === 'events' && items.some(item => item.slug === (validated as any).slug && item.id !== req.params.id)) {
    return res.status(409).json({ success: false, error: { code: 'CONFLICT', message: 'An event already uses this URL slug.' } });
  }
  const now = new Date().toISOString();
  const item = index < 0
    ? { ...validated, id: `${collection.slice(0, 3)}-${randomUUID()}`, createdAt: now, updatedAt: now }
    : { ...items[index], ...validated, updatedAt: now };
  if (index < 0) items.unshift(item); else items[index] = item;
  if (collection === 'events') memoryDb.buildSearchIndex();
  recordAuditLog({ action: index < 0 ? 'CREATE' : 'UPDATE', entity: names[collection], entityId: item.id, userId: req.user?.id, userEmail: req.user?.email, details: { title: (item as any).title || (item as any).name, status: (item as any).status } });
  return res.status(index < 0 ? 201 : 200).json({ success: true, data: item });
};
