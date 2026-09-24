import { Router } from 'express';
import { login, getCurrentUser } from './auth.controller';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';


const router = Router();

router.post('/login', asyncHandler(login));
router.get('/me', authenticate, getCurrentUser);

export default router;
