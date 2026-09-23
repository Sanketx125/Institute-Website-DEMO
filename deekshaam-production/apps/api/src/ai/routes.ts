import { Router } from 'express';
import { chatWithAI } from './ai.controller';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

router.post('/chat', asyncHandler(chatWithAI));

export default router;
