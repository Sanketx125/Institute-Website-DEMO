import { Request, Response } from 'express';
import { memoryDb } from '../database/client';
import { recordAuditLog } from '../middleware/logger';
import { AuthenticatedRequest } from '../middleware/auth';
import {
  siteSettingsSchema,
  programUpsertSchema,
  newsUpsertSchema,
  eventUpsertSchema,
  galleryItemSchema,
} from '@deekshaam/validation';

// ----------------------------------------------------
// SITE SETTINGS
// ----------------------------------------------------
export function getSiteSettings(_req: Request, res: Response) {
  res.json({ success: true, data: memoryDb.siteSettings });
}

export function updateSiteSettings(req: AuthenticatedRequest, res: Response) {
  const validated = siteSettingsSchema.parse(req.body);
  memoryDb.siteSettings = {
    ...memoryDb.siteSettings,
    ...validated,
    updatedAt: new Date().toISOString(),
  };

  recordAuditLog({
    action: 'UPDATE',
    entity: 'SiteSettings',
    userId: req.user?.id,
    userEmail: req.user?.email,
    details: { instituteName: validated.instituteName },
  });

  res.json({ success: true, data: memoryDb.siteSettings });
}

// ----------------------------------------------------
// PROGRAMS
// ----------------------------------------------------
export function getPrograms(_req: Request, res: Response) {
  res.json({ success: true, data: memoryDb.programs });
}

export function getProgramBySlug(req: Request, res: Response) {
  const { slug } = req.params;
  const program = memoryDb.programs.find((p) => p.slug === slug);
  if (!program) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Program not found' } });
  }
  res.json({ success: true, data: program });
}

export function createProgram(req: AuthenticatedRequest, res: Response) {
  const validated = programUpsertSchema.parse(req.body);
  const newProgram = {
    id: `prog-${Date.now()}`,
    ...validated,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  memoryDb.programs.push(newProgram);
  memoryDb.buildSearchIndex();

  recordAuditLog({
    action: 'CREATE',
    entity: 'Program',
    entityId: newProgram.id,
    userId: req.user?.id,
    userEmail: req.user?.email,
    details: { code: newProgram.code, title: newProgram.title },
  });

  res.status(201).json({ success: true, data: newProgram });
}

export function updateProgram(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const idx = memoryDb.programs.findIndex((p) => p.id === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Program not found' } });
  }

  const validated = programUpsertSchema.parse(req.body);
  memoryDb.programs[idx] = {
    ...memoryDb.programs[idx],
    ...validated,
    updatedAt: new Date().toISOString(),
  };
  memoryDb.buildSearchIndex();

  recordAuditLog({
    action: 'UPDATE',
    entity: 'Program',
    entityId: id,
    userId: req.user?.id,
    userEmail: req.user?.email,
    details: { code: validated.code },
  });

  res.json({ success: true, data: memoryDb.programs[idx] });
}

export function deleteProgram(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const idx = memoryDb.programs.findIndex((p) => p.id === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Program not found' } });
  }

  const removed = memoryDb.programs.splice(idx, 1)[0];
  memoryDb.buildSearchIndex();

  recordAuditLog({
    action: 'DELETE',
    entity: 'Program',
    entityId: id,
    userId: req.user?.id,
    userEmail: req.user?.email,
    details: { code: removed.code },
  });

  res.json({ success: true, message: 'Program removed' });
}

// ----------------------------------------------------
// CERTIFICATIONS & RECRUITERS
// ----------------------------------------------------
export function getCertifications(_req: Request, res: Response) {
  res.json({ success: true, data: memoryDb.certifications });
}

export function getFaculty(_req: Request, res: Response) {
  res.json({ success: true, data: memoryDb.faculty });
}

export function getEmployers(_req: Request, res: Response) {
  res.json({ success: true, data: memoryDb.employers });
}

// ----------------------------------------------------
// NEWS & EVENTS
// ----------------------------------------------------
export function getNews(_req: Request, res: Response) {
  res.json({ success: true, data: memoryDb.news });
}

export function getNewsBySlug(req: Request, res: Response) {
  const { slug } = req.params;
  const item = memoryDb.news.find((n) => n.slug === slug);
  if (!item) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'News article not found' } });
  }
  res.json({ success: true, data: item });
}

export function createNews(req: AuthenticatedRequest, res: Response) {
  const validated = newsUpsertSchema.parse(req.body);
  const newItem = {
    id: `news-${Date.now()}`,
    ...validated,
    createdAt: new Date().toISOString(),
  };

  memoryDb.news.unshift(newItem);
  memoryDb.buildSearchIndex();

  recordAuditLog({
    action: 'CREATE',
    entity: 'News',
    entityId: newItem.id,
    userId: req.user?.id,
    userEmail: req.user?.email,
    details: { title: newItem.title },
  });

  res.status(201).json({ success: true, data: newItem });
}

export function getEvents(_req: Request, res: Response) {
  res.json({ success: true, data: memoryDb.events });
}

export function createEvent(req: AuthenticatedRequest, res: Response) {
  const validated = eventUpsertSchema.parse(req.body);
  const newEvent = {
    id: `evt-${Date.now()}`,
    ...validated,
    createdAt: new Date().toISOString(),
  };

  memoryDb.events.push(newEvent);
  memoryDb.buildSearchIndex();

  recordAuditLog({
    action: 'CREATE',
    entity: 'Event',
    entityId: newEvent.id,
    userId: req.user?.id,
    userEmail: req.user?.email,
    details: { title: newEvent.title },
  });

  res.status(201).json({ success: true, data: newEvent });
}

export function getNotices(_req: Request, res: Response) {
  res.json({ success: true, data: memoryDb.notices });
}

export function getGallery(_req: Request, res: Response) {
  res.json({ success: true, data: memoryDb.gallery });
}

export function createGalleryItem(req: AuthenticatedRequest, res: Response) {
  const validated = galleryItemSchema.parse(req.body);
  const newItem = {
    id: `gal-${Date.now()}`,
    ...validated,
    createdAt: new Date().toISOString(),
  };

  memoryDb.gallery.push(newItem);
  res.status(201).json({ success: true, data: newItem });
}

// ----------------------------------------------------
// MEDIA ASSETS
// ----------------------------------------------------
export function listMedia(_req: Request, res: Response) {
  res.json({ success: true, data: memoryDb.media });
}

export function uploadMediaAsset(req: AuthenticatedRequest, res: Response) {
  if (!req.file) {
    return res.status(400).json({ success: false, error: { code: 'FILE_MISSING', message: 'No file uploaded' } });
  }

  const asset = {
    id: `media-${Date.now()}`,
    filename: req.file.filename,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
    url: `/public-media/${req.file.filename}`,
    altText: req.body.altText || req.file.originalname,
    category: req.body.category || 'General',
    uploadedBy: req.user?.email || 'admin',
    createdAt: new Date().toISOString(),
  };

  memoryDb.media.unshift(asset);

  recordAuditLog({
    action: 'CREATE',
    entity: 'Media',
    entityId: asset.id,
    userId: req.user?.id,
    userEmail: req.user?.email,
    details: { filename: asset.filename, size: asset.size },
  });

  res.status(201).json({ success: true, data: asset });
}

// ----------------------------------------------------
// AUDIT LOGS
// ----------------------------------------------------
export function listAuditLogs(_req: Request, res: Response) {
  res.json({ success: true, data: memoryDb.auditLogs });
}
