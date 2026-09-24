import { Router } from 'express';
import { listUsers, createUser, listRoles, resetUserPassword } from './users.controller';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

router.use(authenticate);
router.get('/', requireRole(['SUPER_ADMIN']), listUsers);
router.post('/', requireRole(['SUPER_ADMIN']), asyncHandler(createUser));
router.get('/roles', listRoles);
router.put('/:id/password', requireRole(['SUPER_ADMIN']), asyncHandler(resetUserPassword));

export default router;
