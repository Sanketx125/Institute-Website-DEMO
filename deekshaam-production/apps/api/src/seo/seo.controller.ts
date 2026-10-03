import { Request, Response } from 'express';
import { config } from '../config';
import { indexablePaths, resolvePage, abs } from './render';
import { lastModified, INDEXNOW_KEY } from './changes';
import { memoryDb } from '../database/client';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

// Truthful lastmod only: a tracked CMS edit, else the item's own publish date, else none.
// (Google ignores changefreq/priority and distrusts a lastmod that is always "today".)
function publishDate(path: string): string | undefined {
  const [, kind, slug] = path.split('/');
  const row = kind === 'news' ? memoryDb.news.find((n: any) => n.slug === slug) : kind === 'jobs' ? memoryDb.jobs.find((j: any) => j.slug === slug) : null;
  const d = new Date(row?.date || row?.datePosted || '');
  return isNaN(+d) ? undefined : d.toISOString();
}

function sendUrlset(res: Response, paths: string[]) {
  const urls = paths.map((p) => {
    const lastmod = lastModified(p) || publishDate(p);
    const image = resolvePage(p).image;
    return `  <url><loc>${esc(abs(p))}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}${image ? `<image:image><image:loc>${esc(abs(image))}</image:loc></image:image>` : ''}</url>`;
  });
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join('\n')}
</urlset>`);
}

const SECTIONS: Record<string, RegExp> = {
  pages: /^\/[^/]*$/,
  programs: /^\/programs\/./,
  jobs: /^\/jobs\/./,
  news: /^\/news\/./,
  events: /^\/events\/./,
  videos: /^\/videos\/./,
};
const section = (name: string) => indexablePaths().filter((p) => SECTIONS[name].test(p));

export function getSitemap(_req: Request, res: Response) {
  sendUrlset(res, indexablePaths());
}

export function getSitemapIndex(_req: Request, res: Response) {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${Object.keys(SECTIONS).filter((n) => section(n).length).map((n) => `  <sitemap><loc>${abs(`/sitemap-${n}.xml`)}</loc></sitemap>`).join('\n')}
</sitemapindex>`;
  res.type('application/xml').send(xml);
}

export function getSitemapSection(req: Request, res: Response) {
  const name = req.params.section;
  if (!SECTIONS[name]) return res.status(404).type('text/plain').send('Not found');
  sendUrlset(res, section(name));
}

export function getIndexNowKey(req: Request, res: Response, next: () => void) {
  if (!INDEXNOW_KEY || req.params.key !== INDEXNOW_KEY) return next();
  res.type('text/plain').send(INDEXNOW_KEY);
}

export function getRobotsTxt(_req: Request, res: Response) {
  // "*" admits search/AI crawlers (Googlebot, Bingbot, OAI-SearchBot for ChatGPT Search,
  // PerplexityBot). /apply and /track are NOT disallowed: crawlers must fetch them to see noindex.
  // Model-training opt-out is separate from search visibility and controlled by env.
  const training = (process.env.BLOCK_AI_TRAINING || '').toLowerCase() === 'true'
    ? ['GPTBot', 'Google-Extended', 'CCBot', 'ClaudeBot', 'Applebot-Extended'].map((b) => `User-agent: ${b}\nDisallow: /\n`).join('\n') + '\n'
    : '';
  const content = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

${training}Sitemap: ${config.clientOrigin}/sitemap_index.xml
`;
  res.type('text/plain').send(content);
}
