import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { validatePromoCode } from './public.controller';
import {
  getAgentDashboard,
  getAgentAdmissions,
  getAgentPayouts,
  updateAgentPayoutDetails,
} from './agent.controller';
import {
  listAgents,
  createAgent,
  updateAgent,
  toggleAgentStatus,
  recordPayout,
  listCommissions,
  exportCommissionsCSV,
  getReferralSettings,
  updateReferralSettings,
} from './admin.controller';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

// Rate limiter for public promo code validation: 10 requests / minute / IP
const validateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many promo code attempts. Please wait a minute and try again.',
    },
  },
});

// ----------------------------------------------------
// PUBLIC ENDPOINTS
// ----------------------------------------------------
router.post('/validate', validateLimiter, validatePromoCode);

// ----------------------------------------------------
// AGENT & STAFF REFERRAL PORTAL ENDPOINTS
// ----------------------------------------------------
router.get('/agent/dashboard', authenticate, requireRole(['AGENT', 'SUPER_ADMIN', 'ADMISSION_STAFF', 'CONTENT_ADMIN', 'ENQUIRY_STAFF']), getAgentDashboard);
router.get('/agent/admissions', authenticate, requireRole(['AGENT', 'SUPER_ADMIN', 'ADMISSION_STAFF', 'CONTENT_ADMIN', 'ENQUIRY_STAFF']), getAgentAdmissions);
router.get('/agent/payouts', authenticate, requireRole(['AGENT', 'SUPER_ADMIN', 'ADMISSION_STAFF', 'CONTENT_ADMIN', 'ENQUIRY_STAFF']), getAgentPayouts);
router.patch('/agent/payout-details', authenticate, requireRole(['AGENT', 'SUPER_ADMIN', 'ADMISSION_STAFF', 'CONTENT_ADMIN', 'ENQUIRY_STAFF']), updateAgentPayoutDetails);

// ----------------------------------------------------
// ADMIN & STAFF ENDPOINTS
// ----------------------------------------------------
router.get('/agents', authenticate, requireRole(['SUPER_ADMIN', 'ADMISSION_STAFF']), listAgents);
router.post('/agents', authenticate, requireRole(['SUPER_ADMIN', 'ADMISSION_STAFF']), asyncHandler(createAgent));
router.patch('/agents/:id', authenticate, requireRole(['SUPER_ADMIN', 'ADMISSION_STAFF']), updateAgent);
router.patch('/agents/:id/status', authenticate, requireRole(['SUPER_ADMIN']), toggleAgentStatus);

router.get('/commissions', authenticate, requireRole(['SUPER_ADMIN']), listCommissions);
router.get('/commissions/export', authenticate, requireRole(['SUPER_ADMIN']), exportCommissionsCSV);
router.post('/payouts', authenticate, requireRole(['SUPER_ADMIN']), recordPayout);

router.get('/settings', authenticate, requireRole(['SUPER_ADMIN']), getReferralSettings);
router.put('/settings', authenticate, requireRole(['SUPER_ADMIN']), updateReferralSettings);

export default router;
