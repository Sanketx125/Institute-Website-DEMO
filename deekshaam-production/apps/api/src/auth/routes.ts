import { Router } from 'express';
import { login, getCurrentUser } from './auth.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/login', login);
router.get('/me', authenticate, getCurrentUser);

export default router;
