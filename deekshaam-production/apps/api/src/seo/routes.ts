import { Router } from 'express';
import { 
  getSitemap, 
  getSitemapIndex, 
  getSitemapPages, 
  getSitemapPrograms, 
  getSitemapJobs, 
  getSitemapNews, 
  getRobotsTxt 
} from './seo.controller';

const router = Router();

router.get('/sitemap.xml', getSitemap);
router.get('/sitemap_index.xml', getSitemapIndex);
router.get('/sitemap-pages.xml', getSitemapPages);
router.get('/sitemap-programs.xml', getSitemapPrograms);
router.get('/sitemap-jobs.xml', getSitemapJobs);
router.get('/sitemap-news.xml', getSitemapNews);
router.get('/robots.txt', getRobotsTxt);

export default router;
