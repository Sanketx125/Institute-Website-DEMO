import { Router } from 'express';
import { getSitemap, getRobotsTxt } from './seo.controller';

const router = Router();

router.get('/sitemap.xml', getSitemap);
router.get('/robots.txt', getRobotsTxt);

export default router;
