import { Router } from 'express';
import { trackEvent, getSummary } from './analytics.controller';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

// Public telemetry ingestion
router.post('/event', trackEvent);

// Admin dashboard summary
router.get('/summary', authenticate, requireRole(['SUPER_ADMIN']), getSummary);

export default router;
