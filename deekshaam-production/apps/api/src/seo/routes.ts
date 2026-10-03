import { Router } from 'express';
import { getSitemap, getSitemapIndex, getSitemapSection, getIndexNowKey, getRobotsTxt } from './seo.controller';

const router = Router();

router.get('/sitemap.xml', getSitemap);
router.get(['/sitemap-index.xml', '/sitemap_index.xml'], getSitemapIndex);
router.get('/sitemap-:section.xml', getSitemapSection);
router.get('/robots.txt', getRobotsTxt);
router.get('/:key.txt', getIndexNowKey);

export default router;
