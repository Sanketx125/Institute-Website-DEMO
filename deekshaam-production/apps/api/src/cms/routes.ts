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
  getNotices,
  getGallery,
  createGalleryItem,
  listMedia,
  uploadMediaAsset,
  listAuditLogs,
} from './cms.controller';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { uploadPublicMedia } from '../middleware/upload';

const router = Router();

// Public read routes
router.get('/settings', getSiteSettings);
router.get('/programs', getPrograms);
router.get('/programs/:slug', getProgramBySlug);
router.get('/certifications', getCertifications);
router.get('/faculty', getFaculty);
router.get('/employers', getEmployers);
router.get('/news', getNews);
router.get('/news/:slug', getNewsBySlug);
router.get('/events', getEvents);
router.get('/notices', getNotices);
router.get('/gallery', getGallery);

// Protected CMS Admin write routes
router.put('/settings', authenticate, requireRole(['SUPER_ADMIN']), updateSiteSettings);

router.post('/programs', authenticate, requireRole(['SUPER_ADMIN', 'CONTENT_ADMIN']), createProgram);
router.put('/programs/:id', authenticate, requireRole(['SUPER_ADMIN', 'CONTENT_ADMIN']), updateProgram);
router.delete('/programs/:id', authenticate, requireRole(['SUPER_ADMIN', 'CONTENT_ADMIN']), deleteProgram);

router.post('/news', authenticate, requireRole(['SUPER_ADMIN', 'CONTENT_ADMIN']), createNews);
router.post('/events', authenticate, requireRole(['SUPER_ADMIN', 'CONTENT_ADMIN']), createEvent);
router.post('/gallery', authenticate, requireRole(['SUPER_ADMIN', 'CONTENT_ADMIN']), createGalleryItem);

// Media library
router.get('/media', authenticate, requireRole(['SUPER_ADMIN', 'CONTENT_ADMIN']), listMedia);
router.post('/media/upload', authenticate, requireRole(['SUPER_ADMIN', 'CONTENT_ADMIN']), uploadPublicMedia.single('file'), uploadMediaAsset);

// Audit logs
router.get('/audit-logs', authenticate, requireRole(['SUPER_ADMIN']), listAuditLogs);

export default router;
