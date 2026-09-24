import { Router } from 'express';
import { getTopThree, getJobs, getJobBySlug } from './top3.controller';

const router = Router();

// Public Top 3 engine endpoint - one route serves every vertical.
router.get('/top3', getTopThree);
router.get('/jobs', getJobs);
router.get('/jobs/:slug', getJobBySlug);

export default router;
