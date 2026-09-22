import { Request, Response } from 'express';
import { memoryDb } from '../database/client';
import { config } from '../config';

export function getSitemap(_req: Request, res: Response) {
  const baseUrl = config.clientOrigin;

  const staticUrls = [
    '',
    '/about',
    '/programs',
    '/admissions',
    '/placements',
    '/campus',
    '/news',
    '/events',
    '/gallery',
    '/contact',
    '/apply',
    '/track',
    '/visit',
    '/compare',
    '/certifications',
  ];

  const programUrls = memoryDb.programs.map((p) => `/programs/${p.slug}`);
  const newsUrls = memoryDb.news.map((n) => `/news/${n.slug}`);

  const allUrls = [...staticUrls, ...programUrls, ...newsUrls];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    (u) => `  <url>
    <loc>${baseUrl}${u}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${u === '' ? '1.0' : u.startsWith('/programs') ? '0.9' : '0.8'}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  res.header('Content-Type', 'application/xml');
  res.send(xml);
}

export function getRobotsTxt(_req: Request, res: Response) {
  const baseUrl = config.clientOrigin;
  const content = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: ${baseUrl}/sitemap.xml
`;

  res.header('Content-Type', 'text/plain');
  res.send(content);
}
