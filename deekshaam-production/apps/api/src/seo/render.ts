/**
 * Server-side SEO renderer for public routes.
 *
 * Crawlers (Google, Bing/Copilot, ChatGPT Search, social previews) receive a complete
 * document for every URL before JavaScript runs: route-specific title/description/
 * canonical/robots/OG/Twitter, JSON-LD in the initial HTML, and a readable copy of the
 * page content inside #root (React replaces it on mount).
 *
 * Status codes are real: 200 live, 301 trailing slash / non-canonical host,
 * 404 never existed or draft, 410 archived content or expired job.
 */
import fs from 'fs';
import path from 'path';
import { Request, Response, NextFunction } from 'express';
import { PAGE_META, SITE_NAME, DEFAULT_SHARE_IMAGE, isoDuration, eventDates } from '@deekshaam/types';
import { memoryDb } from '../database/client';
import { config } from '../config';
import { lastModified } from './changes';

// Repo root = everything before the first /apps/api/ (works for src/ under ts-node and the nested tsc dist/).
const REPO_ROOT = __dirname.split(`${path.sep}apps${path.sep}api${path.sep}`)[0];
export const WEB_DIST = process.env.WEB_DIST_DIR || path.join(REPO_ROOT, 'apps', 'web', 'dist');

export interface Page {
  status?: 200 | 404 | 410;
  title: string;
  description: string;
  noindex?: boolean;
  /** Absolute or root-relative share image; also listed in the image sitemap. */
  image?: string;
  ogType?: 'website' | 'article' | 'video.other';
  jsonLd?: object[];
  body: string;
}

const esc = (s: unknown) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const link = (href: string, text: string) => `<a href="${esc(href)}">${esc(text)}</a>`;
const list = (items: string[]) => `<ul>${items.map((i) => `<li>${i}</li>`).join('')}</ul>`;
const published = (rows: any[] = []) => rows.filter((r) => r.status === 'PUBLISHED' && !isExpired(r));
export const abs = (p: string) => (/^https?:\/\//.test(p) ? p : `${config.clientOrigin}${p}`);
const ORG_ID = () => `${abs('/')}#organization`;
const isExpired = (r: any) => Boolean(r.validThrough && new Date(r.validThrough) < new Date());
const iso = (d?: string) => {
  const t = new Date(d || '');
  return isNaN(+t) ? undefined : t.toISOString();
};
const facts = (rows: [string, unknown][]) =>
  `<dl>${rows.filter(([, v]) => v).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>`;

function organization() {
  const s = memoryDb.siteSettings;
  const [lat, lng] = String(s.coordinates || '').split(',').map(Number);
  let sameAs: string[] = [];
  try { sameAs = Object.values(JSON.parse(s.socialLinksJson || '{}')); } catch { /* ignore bad CMS JSON */ }
  return {
    '@context': 'https://schema.org',
    '@type': 'CollegeOrUniversity',
    '@id': ORG_ID(),
    name: s.instituteName,
    alternateName: s.shortName,
    url: abs('/'),
    logo: abs('/logo.png'),
    image: abs(s.heroImage || DEFAULT_SHARE_IMAGE),
    foundingDate: s.founded,
    parentOrganization: s.managedBy ? { '@type': 'Organization', name: s.managedBy } : undefined,
    telephone: s.phone,
    email: s.admissionEmail,
    address: {
      '@type': 'PostalAddress',
      streetAddress: s.streetAddress || s.address,
      addressLocality: s.addressLocality,
      postalCode: s.postalCode || String(s.address || '').match(/\b\d{6}\b/)?.[0],
      addressRegion: 'Karnataka',
      addressCountry: 'IN',
    },
    geo: Number.isFinite(lat) && Number.isFinite(lng) ? { '@type': 'GeoCoordinates', latitude: lat, longitude: lng } : undefined,
    hasMap: Number.isFinite(lat) ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}` : undefined,
    sameAs,
  };
}

function breadcrumbs(trail: [string, string][]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [['Home', '/'], ...trail].map(([name, p], i) => ({ '@type': 'ListItem', position: i + 1, name, item: abs(p) })),
  };
}

const course = (name: string, description: string, url?: string, duration?: string) => ({
  '@type': 'Course',
  name,
  description,
  url: url && abs(url),
  provider: { '@type': 'CollegeOrUniversity', name: SITE_NAME, sameAs: abs('/') },
  timeRequired: isoDuration(duration),
});

// Google "Course list" summary-page format: an ItemList of full Course items.
const courseList = (items: object[]) => ({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  itemListElement: items.map((item, i) => ({ '@type': 'ListItem', position: i + 1, item })),
});

/** "Rs 20,000 - 28,000/month" -> schema.org MonetaryAmount. */
function salary(stipend?: string) {
  const nums = String(stipend || '').replace(/,/g, '').match(/\d+/g)?.map(Number);
  if (!nums?.length) return undefined;
  return { '@type': 'MonetaryAmount', currency: 'INR', value: { '@type': 'QuantitativeValue', minValue: nums[0], maxValue: nums[1] ?? nums[0], unitText: /year|annum/i.test(stipend!) ? 'YEAR' : 'MONTH' } };
}

const programLinks = () => list(published(memoryDb.programs).map((p) => `${link(`/programs/${p.slug}`, `${p.code} - ${p.title}`)}: ${esc(p.summary)}`));

/** Extra body content + JSON-LD for static routes. */
const STATIC_EXTRAS: Record<string, () => { html?: string; jsonLd?: object[] }> = {
  '/': () => {
    const s = memoryDb.siteSettings;
    return {
      html: facts([['Managed by', s.managedBy], ['Founded', s.founded], ['Approvals & affiliation', (s.affiliations || []).join(', ')], ['Address', s.address], ['Phone', s.phone]]) + `<h2>Degree programs</h2>${programLinks()}<h2>Explore</h2>${list([link('/jobs', 'Job-first pathways'), link('/admissions', 'Admissions'), link('/placements', 'Placements'), link('/campus', 'Campus'), link('/contact', 'Contact')])}`,
      jsonLd: [{ '@context': 'https://schema.org', '@type': 'WebSite', name: SITE_NAME, alternateName: s.shortName, url: abs('/'), publisher: { '@id': ORG_ID() } }],
    };
  },
  '/programs': () => ({
    html: programLinks(),
    jsonLd: [courseList(published(memoryDb.programs).map((p) => course(`${p.code} - ${p.title}`, p.summary, `/programs/${p.slug}`, p.duration)))],
  }),
  '/compare': () => ({ html: programLinks() }),
  '/certifications': () => {
    const certs = published(memoryDb.certifications);
    return {
      html: list(certs.map((c) => `<strong>${esc(c.title)}</strong> (${esc(c.duration)}): ${esc(c.text)}`)),
      jsonLd: certs.length >= 3 ? [courseList(certs.map((c) => course(c.title, c.text, undefined, c.duration)))] : [],
    };
  },
  '/jobs': () => ({ html: list(published(memoryDb.jobs).map((j) => `${link(`/jobs/${j.slug}`, `${j.title} at ${j.employer}`)}: ${esc(j.summary)}`)) }),
  '/news': () => ({ html: list(published(memoryDb.news).map((n) => `${link(`/news/${n.slug}`, n.title)} (${esc(n.date)})`)) }),
  '/events': () => ({ html: list(published(memoryDb.events).map((e) => `${link(`/events/${e.slug}`, e.title)} (${esc(e.date)})`)) }),
  '/campus': () => ({ html: videoLinks('Campus life') }),
  '/about': () => ({ html: list((memoryDb.faculty || []).map((f: any) => `<strong>${esc(f.name)}</strong>, ${esc(f.role)}`)) + videoLinks('Our story') }),
  '/placements': () => ({ html: list((memoryDb.employers || []).map((e: any) => esc(e.name || e))) + videoLinks('Career stories') }),
  '/contact': () => {
    const s = memoryDb.siteSettings;
    return { html: `<address>${esc(s.address)}<br>Phone: ${esc(s.phone)}<br>Email: ${esc(s.admissionEmail)}</address>` };
  },
};

function videoLinks(category: string) {
  const vids = (memoryDb.videos || []).filter((v: any) => v.category === category);
  return vids.length ? `<h2>Videos</h2>${list(vids.map((v: any) => link(`/videos/${v.youtubeId}`, v.title)))}` : '';
}

/** Canonical, indexable paths — the single list the sitemap and change tracker read from. */
export function indexablePaths(): string[] {
  return [
    ...Object.keys(PAGE_META).filter((p) => !PAGE_META[p].noindex),
    ...published(memoryDb.programs).map((p) => `/programs/${p.slug}`),
    ...published(memoryDb.jobs).map((j) => `/jobs/${j.slug}`),
    ...published(memoryDb.news).map((n) => `/news/${n.slug}`),
    ...published(memoryDb.events).map((e) => `/events/${e.slug}`),
    ...(memoryDb.videos || []).map((v: any) => `/videos/${v.youtubeId}`),
  ];
}

const GONE: Page = { status: 410, title: 'This page has been removed', description: 'This content is no longer available.', noindex: true, body: `<h1>This page has been removed</h1><p>${link('/', 'Return to the homepage')}</p>` };

function detail(kind: string, slug: string): Page | null {
  const collections: Record<string, any[]> = { programs: memoryDb.programs, jobs: memoryDb.jobs, news: memoryDb.news, events: memoryDb.events };
  if (kind === 'videos') return video(slug);
  const rows = collections[kind];
  if (!rows) return null;
  const any = rows.find((x) => x.slug === slug);
  if (!any) return null;
  if (any.status === 'ARCHIVED' || (any.status === 'PUBLISHED' && isExpired(any))) return GONE;
  if (any.status !== 'PUBLISHED') return null;
  const url = `/${kind}/${slug}`;
  const modified = lastModified(url);

  if (kind === 'programs') {
    const p = any;
    return {
      title: p.seoTitle || `${p.code} College in Bangalore - ${p.title}`,
      description: p.seoDescription || p.summary,
      image: p.image,
      jsonLd: [
        { '@context': 'https://schema.org', ...course(`${p.code} - ${p.title}`, p.summary, url, p.duration), educationalCredentialAwarded: `${p.code} (${p.title})`, coursePrerequisites: p.eligibility, image: p.image && abs(p.image) },
        breadcrumbs([['Programs', '/programs'], [p.code, url]]),
      ],
      body: `<h1>${esc(p.code)} - ${esc(p.title)}</h1><p>${esc(p.summary)}</p>
${facts([['Duration', p.duration], ['Mode', p.mode], ['Eligibility', p.eligibility], ['Specializations', (p.specializations || []).join(', ')], ['Career pathways', (p.careers || []).join(', ')]])}
<h2>Curriculum</h2>${(p.curriculum || []).map((sem: string[], i: number) => `<h3>Semester ${i + 1}</h3>${list(sem.map(esc))}`).join('')}
<p>${link('/admissions', 'Admissions')} · ${link('/apply', 'Apply online')} · ${link('/programs', 'All programs')}</p>`,
    };
  }
  if (kind === 'jobs') {
    const j = any;
    // Google requires a genuine datePosted; without one we omit JobPosting rather than invent it.
    const jobPosting = j.datePosted && {
      '@context': 'https://schema.org',
      '@type': 'JobPosting',
      title: j.title,
      description: `<p>${esc(j.summary)}</p><p>Work mode: ${esc(j.mode)}. Degree pathway: ${esc(j.degreePath)}.</p>`,
      datePosted: j.datePosted,
      validThrough: iso(j.validThrough),
      employmentType: 'FULL_TIME',
      hiringOrganization: { '@type': 'Organization', name: j.employer },
      jobLocation: { '@type': 'Place', address: { '@type': 'PostalAddress', addressLocality: j.city, addressRegion: 'Karnataka', addressCountry: 'IN' } },
      baseSalary: salary(j.stipend),
      directApply: true,
      url: abs(url),
    };
    return {
      title: `${j.title} at ${j.employer} - Job-First Pathway`,
      description: j.summary,
      jsonLd: [...(jobPosting ? [jobPosting] : []), breadcrumbs([['Jobs', '/jobs'], [j.title, url]])],
      body: `<h1>${esc(j.title)} at ${esc(j.employer)}</h1><p>${esc(j.summary)}</p>
${facts([['Location', j.city], ['Work mode', j.mode], ['Stipend', j.stipend], ['Degree pathway', j.degreePath]])}
<p>${link('/jobs', 'All job pathways')} · ${link('/apply', 'Apply online')}</p>`,
    };
  }
  if (kind === 'news') {
    const n = any;
    const datePublished = iso(n.date);
    return {
      title: n.seoTitle || n.title,
      description: n.seoDescription || n.summary || String(n.content || '').slice(0, 160),
      ogType: 'article',
      image: n.image,
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: n.title,
          description: n.summary,
          image: abs(n.image || DEFAULT_SHARE_IMAGE),
          datePublished,
          dateModified: modified && datePublished && modified > datePublished ? modified : datePublished,
          author: { '@type': 'Organization', name: SITE_NAME, url: abs('/') },
          publisher: { '@id': ORG_ID() },
          mainEntityOfPage: abs(url),
        },
        breadcrumbs([['News', '/news'], [n.title, url]]),
      ],
      body: `<article><h1>${esc(n.title)}</h1><p><time datetime="${esc(datePublished)}">${esc(n.date)}</time></p><p>${esc(n.summary)}</p><p>${esc(n.content)}</p></article><p>${link('/news', 'All news')}</p>`,
    };
  }
  // events
  const e = any;
  const { start, end } = eventDates(e.date, e.time);
  const s = memoryDb.siteSettings;
  return {
    title: `${e.title} - ${e.date}`,
    description: e.summary,
    image: e.coverImage,
    jsonLd: [
      start && {
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: e.title,
        description: e.description || e.summary,
        startDate: start,
        endDate: end,
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        location: { '@type': 'Place', name: e.location || SITE_NAME, address: { '@type': 'PostalAddress', streetAddress: s.address, addressRegion: 'Karnataka', addressCountry: 'IN' } },
        image: abs(e.coverImage || DEFAULT_SHARE_IMAGE),
        organizer: { '@type': 'Organization', name: SITE_NAME, url: abs('/') },
      },
      breadcrumbs([['Events', '/events'], [e.title, url]]),
    ].filter(Boolean) as object[],
    body: `<h1>${esc(e.title)}</h1><p>${esc(e.description || e.summary)}</p>
${facts([['Date', e.date], ['Time', e.time], ['Venue', e.location]])}<p>${link('/events', 'All events')} · ${link('/visit', 'Visit campus')}</p>`,
  };
}

function video(id: string): Page | null {
  const v = (memoryDb.videos || []).find((x: any) => x.youtubeId === id);
  if (!v) return null;
  const url = `/videos/${v.youtubeId}`;
  const thumb = `https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`;
  const [mm, ss] = String(v.duration || '').split(':').map(Number);
  return {
    title: v.title,
    description: v.description || `${v.title} - a ${v.category.toLowerCase()} video from ${SITE_NAME}.`,
    ogType: 'video.other',
    image: thumb,
    jsonLd: [
      // VideoObject requires uploadDate; omitted (not invented) until staff enter it.
      v.uploadDate && {
        '@context': 'https://schema.org',
        '@type': 'VideoObject',
        name: v.title,
        description: v.description || v.title,
        thumbnailUrl: thumb,
        uploadDate: iso(v.uploadDate),
        duration: Number.isFinite(mm) && Number.isFinite(ss) ? `PT${mm}M${ss}S` : undefined,
        embedUrl: `https://www.youtube-nocookie.com/embed/${v.youtubeId}`,
        contentUrl: `https://www.youtube.com/watch?v=${v.youtubeId}`,
        publisher: { '@id': ORG_ID() },
      },
      breadcrumbs([[v.category, v.category === 'Career stories' ? '/placements' : v.category === 'Our story' ? '/about' : '/campus'], [v.title, url]]),
    ].filter(Boolean) as object[],
    body: `<h1>${esc(v.title)}</h1><p>${esc(v.description)}</p><p>${link(`https://www.youtube.com/watch?v=${v.youtubeId}`, 'Watch on YouTube')}</p>`,
  };
}

export function resolvePage(urlPath: string): Page {
  if (urlPath.startsWith('/admin')) return { title: 'Staff workspace', description: '', noindex: true, body: '' };
  const meta = PAGE_META[urlPath];
  if (meta) {
    const extra = STATIC_EXTRAS[urlPath]?.() || {};
    const trail: [string, string][] = urlPath === '/' ? [] : [[meta.h1, urlPath]];
    return {
      title: meta.title,
      description: meta.description,
      noindex: meta.noindex,
      jsonLd: [...(extra.jsonLd || []), ...(trail.length ? [breadcrumbs(trail)] : [])],
      body: `<h1>${esc(meta.h1)}</h1><p>${esc(meta.description)}</p>${extra.html || ''}`,
    };
  }
  const [, kind, slug, rest] = urlPath.split('/');
  const page = slug && !rest ? detail(kind, decodeURIComponent(slug)) : null;
  return page || { status: 404, title: 'Page not found', description: 'The page you are looking for does not exist or has been moved.', noindex: true, body: `<h1>Page not found</h1><p>${link('/', 'Return to the homepage')}</p>` };
}

export function renderHtml(template: string, urlPath: string, page: Page): string {
  const title = `${page.title} | ${SITE_NAME}`;
  const url = abs(urlPath);
  const image = abs(page.image || DEFAULT_SHARE_IMAGE);
  const verify = [
    process.env.GOOGLE_SITE_VERIFICATION && `<meta name="google-site-verification" content="${esc(process.env.GOOGLE_SITE_VERIFICATION)}" />`,
    process.env.BING_SITE_VERIFICATION && `<meta name="msvalidate.01" content="${esc(process.env.BING_SITE_VERIFICATION)}" />`,
  ].filter(Boolean).join('\n    ');
  const ld = [organization(), ...(page.jsonLd || [])]
    // Site-wide organization block stays; page blocks (data-ssr) are swapped by SEOHead on SPA navigation.
    // JSON.stringify drops undefined fields; escape "<" so content cannot close the script tag.
    .map((o, i) => `<script type="application/ld+json" ${i ? 'data-ssr' : 'id="org-schema"'}>${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`)
    .join('\n    ');
  const head = `<title>${esc(title)}</title>
    <meta name="description" content="${esc(page.description)}" />
    <meta name="robots" content="${page.noindex ? 'noindex,follow' : 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1'}" />
    ${page.status ? '' : `<link rel="canonical" href="${esc(url)}" />`}
    <meta property="og:site_name" content="${SITE_NAME}" />
    <meta property="og:locale" content="en_IN" />
    <meta property="og:type" content="${page.ogType || 'website'}" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(page.description)}" />
    <meta property="og:url" content="${esc(url)}" />
    <meta property="og:image" content="${esc(image)}" />
    <meta property="og:image:alt" content="${esc(page.title)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(title)}" />
    <meta name="twitter:description" content="${esc(page.description)}" />
    <meta name="twitter:image" content="${esc(image)}" />
    ${verify}
    ${ld}`;
  return template
    .replace(/<title>[\s\S]*?<\/title>/, () => head)
    .replace('<div id="root"></div>', () => `<div id="root"><main class="container">${page.body}</main></div>`);
}

// Real CSP for the public site, listing every third party the pages use.
const CSP = [
  "default-src 'self'",
  "script-src 'self' https://checkout.razorpay.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https:",
  "frame-src https://www.youtube-nocookie.com https://www.openstreetmap.org https://*.razorpay.com",
  "connect-src 'self' https://*.razorpay.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join('; ');

let template: string | null = null;
function loadTemplate(): string | null {
  if (template === null && fs.existsSync(path.join(WEB_DIST, 'index.html'))) {
    template = fs.readFileSync(path.join(WEB_DIST, 'index.html'), 'utf8');
  }
  return template;
}

/** Express handler for every non-API GET that is not a static asset. */
export function seoRender(req: Request, res: Response, next: NextFunction) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  const query = req.originalUrl.slice(req.originalUrl.indexOf('?') >= 0 ? req.originalUrl.indexOf('?') : req.originalUrl.length);
  // One host, one URL: www/non-www or alias domains 301 to CLIENT_ORIGIN (production only;
  // dev/test hosts vary). X-Forwarded-Host covers proxies that rewrite Host.
  if (config.isProduction) {
    const canonical = new URL(config.clientOrigin);
    const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
    const proto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
    if ((host && host !== canonical.host) || (proto && `${proto}:` !== canonical.protocol)) {
      return res.redirect(301, `${config.clientOrigin}${req.path.replace(/(.)\/+$/, '$1')}${query}`);
    }
  }
  if (req.path.length > 1 && req.path.endsWith('/')) {
    return res.redirect(301, req.path.replace(/\/+$/, '') + query);
  }
  const tpl = loadTemplate();
  if (!tpl) return next(); // web app not built (local API-only dev)
  const page = resolvePage(req.path);
  res.setHeader('Content-Security-Policy', CSP);
  // HTML must revalidate so CMS edits show immediately; hashed /assets are cached for a year.
  res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  res.status(page.status || 200).type('html').send(renderHtml(tpl, req.path, page));
}
