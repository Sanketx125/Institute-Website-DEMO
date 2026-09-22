import { Router } from 'express';
import {
  createPaymentOrder,
  verifyPayment,
  handleWebhook,
  listPayments,
} from './payments.controller';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

// Public checkout endpoints
router.post('/create-order', createPaymentOrder);
router.post('/verify', verifyPayment);
router.post('/webhook', handleWebhook);

// Protected Staff Payments reconciliation
router.get('/admin', authenticate, requireRole(['SUPER_ADMIN']), listPayments);

export default router;
