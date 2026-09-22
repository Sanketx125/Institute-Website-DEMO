import { Router } from 'express';
import { listUsers, createUser, listRoles } from './users.controller';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

router.use(authenticate);
router.get('/', requireRole(['SUPER_ADMIN']), listUsers);
router.post('/', requireRole(['SUPER_ADMIN']), createUser);
router.get('/roles', listRoles);

export default router;
