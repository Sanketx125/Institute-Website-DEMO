import { Router } from 'express';
import { trackEvent, getSummary, getReport } from './analytics.controller';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

// Public telemetry ingestion
router.post('/event', trackEvent);

// Admin dashboard summary
router.get('/summary', authenticate, requireRole(['SUPER_ADMIN']), getSummary);

// Program demand, funnel and source report for decision-makers
router.get('/report', authenticate, requireRole(['SUPER_ADMIN', 'ADMISSION_STAFF']), getReport);

export default router;
