import { Router } from 'express';
import {
  submitGeneralEnquiry,
  submitCampusVisit,
  listLeads,
  updateLead,
} from './enquiries.controller';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

// Public lead capture
router.post('/', submitGeneralEnquiry);
router.post('/visit', submitCampusVisit);

// Protected Staff Lead Inbox
router.get('/admin', authenticate, requireRole(['SUPER_ADMIN', 'ENQUIRY_STAFF', 'ADMISSION_STAFF']), listLeads);
router.patch('/admin/:id', authenticate, requireRole(['SUPER_ADMIN', 'ENQUIRY_STAFF', 'ADMISSION_STAFF']), updateLead);

export default router;
