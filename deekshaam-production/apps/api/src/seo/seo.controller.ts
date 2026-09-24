import { Request, Response } from 'express';
import { memoryDb } from '../database/client';
import { config } from '../config';

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
  '/jobs',
];

function generateSitemapXml(urls: { path: string; priority: string }[]) {
  const baseUrl = config.clientOrigin;
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${baseUrl}${u.path}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;
}

export function getSitemap(_req: Request, res: Response) {
  const programUrls = memoryDb.programs.map((p) => `/programs/${p.slug}`);
  const newsUrls = memoryDb.news.map((n) => `/news/${n.slug}`);
  const jobUrls = memoryDb.jobs.map((j) => `/jobs/${j.slug}`);
  const certifications = memoryDb.certifications || [{ slug: '' }, { slug: '' }, { slug: '' }]; // Mock fallback if certifications missing in db

  const allUrls = [
    ...staticUrls.map(u => ({ path: u, priority: u === '' ? '1.0' : u === '/programs' || u === '/jobs' ? '0.9' : '0.8' })),
    ...programUrls.map(u => ({ path: u, priority: '0.9' })),
    ...newsUrls.map(u => ({ path: u, priority: '0.8' })),
    ...jobUrls.map(u => ({ path: u, priority: '0.8' }))
  ];

  res.header('Content-Type', 'application/xml');
  res.send(generateSitemapXml(allUrls));
}

export function getSitemapIndex(_req: Request, res: Response) {
  const baseUrl = config.clientOrigin;
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${baseUrl}/sitemap-pages.xml</loc>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-programs.xml</loc>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-jobs.xml</loc>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-news.xml</loc>
  </sitemap>
</sitemapindex>`;
  res.header('Content-Type', 'application/xml');
  res.send(xml);
}

export function getSitemapPages(_req: Request, res: Response) {
  const urls = staticUrls.map(u => ({ path: u, priority: u === '' ? '1.0' : u === '/programs' || u === '/jobs' ? '0.9' : '0.8' }));
  res.header('Content-Type', 'application/xml');
  res.send(generateSitemapXml(urls));
}

export function getSitemapPrograms(_req: Request, res: Response) {
  const urls = memoryDb.programs.map((p) => ({ path: `/programs/${p.slug}`, priority: '0.9' }));
  res.header('Content-Type', 'application/xml');
  res.send(generateSitemapXml(urls));
}

export function getSitemapJobs(_req: Request, res: Response) {
  const urls = memoryDb.jobs.map((j) => ({ path: `/jobs/${j.slug}`, priority: '0.8' }));
  res.header('Content-Type', 'application/xml');
  res.send(generateSitemapXml(urls));
}

export function getSitemapNews(_req: Request, res: Response) {
  const urls = memoryDb.news.map((n) => ({ path: `/news/${n.slug}`, priority: '0.8' }));
  res.header('Content-Type', 'application/xml');
  res.send(generateSitemapXml(urls));
}

export function getRobotsTxt(_req: Request, res: Response) {
  const baseUrl = config.clientOrigin;
  const content = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: ${baseUrl}/sitemap_index.xml
`;

  res.header('Content-Type', 'text/plain');
  res.send(content);
}
