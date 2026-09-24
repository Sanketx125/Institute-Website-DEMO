import { Request, Response } from 'express';
import { z } from 'zod';
import { memoryDb } from '../database/client';
import { AuthenticatedRequest } from '../middleware/auth';
import { recordAuditLog } from '../middleware/logger';
const videoSchema = z.array(z.object({
  id: z.string().min(1).max(100), youtubeId: z.string().regex(/^[a-zA-Z0-9_-]{11}$/),
  title: z.string().trim().min(1).max(180), category: z.string().max(80), duration: z.string().max(20), description: z.string().max(1000),
})).max(50).refine(items => new Set(items.map(v => v.id)).size === items.length, 'Video IDs must be unique');
export function getVideos(_req: Request, res: Response) { res.json({ success: true, data: memoryDb.videos }); }
export function updateVideos(req: AuthenticatedRequest, res: Response) {
  memoryDb.videos = videoSchema.parse(req.body);
  recordAuditLog({ action: 'UPDATE', entity: 'VideoLibrary', userId: req.user?.id, userEmail: req.user?.email, details: { count: memoryDb.videos.length } });
  res.json({ success: true, data: memoryDb.videos });
}
