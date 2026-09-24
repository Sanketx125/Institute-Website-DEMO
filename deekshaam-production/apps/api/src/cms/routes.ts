import { Router } from 'express';
import {
  getSiteSettings,
  updateSiteSettings,
  getPrograms,
  getProgramBySlug,
  createProgram,
  updateProgram,
  deleteProgram,
  getCertifications,
  getFaculty,
  getEmployers,
  getNews,
  getNewsBySlug,
  createNews,
  getEvents,
  createEvent,
  getGallery,
  createGalleryItem,
  listMedia,
  uploadMediaAsset,
  listAuditLogs,
} from './cms.controller';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { uploadPublicMedia } from '../middleware/upload';

import { getVideos, updateVideos } from './videos.controller';
import { listPublished, listForEditor, saveEditorialItem } from './editorial.controller';
import { getNotices, listNotices, createNotice, updateNotice } from './notices.controller';
const router = Router();
router.get('/videos', getVideos);
router.put('/videos', authenticate, requireRole(['CONTENT_ADMIN']), updateVideos);

// Public read routes
router.get('/settings', getSiteSettings);
router.get('/programs', getPrograms);
router.get('/programs/:slug', getProgramBySlug);
router.get('/certifications', getCertifications);
router.get('/faculty', getFaculty);
router.get('/employers', getEmployers);
router.get('/news', getNews);
router.get('/news/:slug', getNewsBySlug);
router.get('/events', listPublished('events'));
router.get('/events/admin', authenticate, requireRole(['SUPER_ADMIN', 'CONTENT_ADMIN']), listForEditor('events'));
router.get('/notices', getNotices);
router.get('/notices/admin', authenticate, requireRole(['CONTENT_ADMIN']), listNotices);
router.post('/notices', authenticate, requireRole(['CONTENT_ADMIN']), createNotice);
router.put('/notices/:id', authenticate, requireRole(['CONTENT_ADMIN']), updateNotice);
router.get('/gallery', listPublished('gallery'));
router.get('/gallery/admin', authenticate, requireRole(['SUPER_ADMIN', 'CONTENT_ADMIN']), listForEditor('gallery'));
router.get('/stories', listPublished('stories'));
router.get('/stories/admin', authenticate, requireRole(['SUPER_ADMIN', 'CONTENT_ADMIN']), listForEditor('stories'));

// Protected CMS Admin write routes
router.put('/settings', authenticate, requireRole(['SUPER_ADMIN']), updateSiteSettings);

router.post('/programs', authenticate, requireRole(['SUPER_ADMIN', 'CONTENT_ADMIN']), createProgram);
router.put('/programs/:id', authenticate, requireRole(['SUPER_ADMIN', 'CONTENT_ADMIN']), updateProgram);
router.delete('/programs/:id', authenticate, requireRole(['SUPER_ADMIN', 'CONTENT_ADMIN']), deleteProgram);

router.post('/news', authenticate, requireRole(['SUPER_ADMIN', 'CONTENT_ADMIN']), createNews);
router.post('/events', authenticate, requireRole(['SUPER_ADMIN', 'CONTENT_ADMIN']), saveEditorialItem('events'));
router.put('/events/:id', authenticate, requireRole(['SUPER_ADMIN', 'CONTENT_ADMIN']), saveEditorialItem('events'));
router.post('/gallery', authenticate, requireRole(['SUPER_ADMIN', 'CONTENT_ADMIN']), saveEditorialItem('gallery'));
router.put('/gallery/:id', authenticate, requireRole(['SUPER_ADMIN', 'CONTENT_ADMIN']), saveEditorialItem('gallery'));
router.post('/stories', authenticate, requireRole(['SUPER_ADMIN', 'CONTENT_ADMIN']), saveEditorialItem('stories'));
router.put('/stories/:id', authenticate, requireRole(['SUPER_ADMIN', 'CONTENT_ADMIN']), saveEditorialItem('stories'));

// Media library
router.get('/media', authenticate, requireRole(['SUPER_ADMIN', 'CONTENT_ADMIN']), listMedia);
router.post('/media/upload', authenticate, requireRole(['SUPER_ADMIN', 'CONTENT_ADMIN']), uploadPublicMedia.single('file'), uploadMediaAsset);

// Audit logs
router.get('/audit-logs', authenticate, requireRole(['SUPER_ADMIN']), listAuditLogs);

export default router;
