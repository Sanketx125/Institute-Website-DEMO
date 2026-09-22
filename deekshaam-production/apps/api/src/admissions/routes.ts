import { Router } from 'express';
import {
  submitApplication,
  trackApplication,
  uploadApplicantDocument,
  listApplications,
  getApplicationDetail,
  updateApplicationStatus,
  downloadPrivateDocument,
} from './admissions.controller';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { uploadPrivateDocument } from '../middleware/upload';

const router = Router();

// Public applicant routes
router.post('/apply', submitApplication);
router.get('/track/:id', trackApplication);
router.post('/upload/:id', uploadPrivateDocument.single('document'), uploadApplicantDocument);

// Protected Staff Admissions routes
router.get('/admin/applications', authenticate, requireRole(['SUPER_ADMIN', 'ADMISSION_STAFF']), listApplications);
router.get('/admin/applications/:id', authenticate, requireRole(['SUPER_ADMIN', 'ADMISSION_STAFF']), getApplicationDetail);
router.patch('/admin/applications/:id/status', authenticate, requireRole(['SUPER_ADMIN', 'ADMISSION_STAFF']), updateApplicationStatus);
router.get('/admin/documents/:docId/download', authenticate, requireRole(['SUPER_ADMIN', 'ADMISSION_STAFF']), downloadPrivateDocument);

export default router;
