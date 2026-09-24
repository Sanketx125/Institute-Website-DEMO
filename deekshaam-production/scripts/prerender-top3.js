/**
 * Build-time prerender for Top 3 SEO.
 *
 * Fetches Top 3 picks from the running API (or falls back to seed data),
 * then writes static HTML files for each vertical landing page with the
 * Top 3 cards, JSON-LD structured data, and per-page meta baked into the
 * initial HTML - so crawlers see the content without executing JS.
 *
 * Usage: node scripts/prerender-top3.js [apiBaseUrl]
 */
const fs = require('fs');
const path = require('path');

const API_BASE = process.argv[2] || process.env.API_BASE_URL || 'http://localhost:5000';
const DIST_DIR = path.resolve(__dirname, '../apps/web/dist');

const VERTICALS = [
  {
    vertical: 'job',
    path: '/jobs',
    title: 'Top 3 Job-First Hiring Pathways in Bangalore | Deekshaam Business School',
    description:
      'The 3 highest-demand partner-company job pathways at Deekshaam Business School. Join Salesforce, HCLTech or HDFC Bank first through HR tie-ups, then earn your degree alongside employment.',
    schemaType: 'JobPosting',
    heading: 'Top 3 Job-First Pathways',
  },
  {
    vertical: 'program',
    path: '/programs',
    title: 'Top 3 Degree Programs (BBA, BCA, B.Com) in Bangalore | Deekshaam Business School',
    description:
      'The 3 ranked undergraduate degree programs at Deekshaam Business School: BBA, BCA and B.Com with specializations, curriculum depth and placement outcomes.',
    schemaType: 'Course',
    heading: 'Top 3 Degree Programs',
  },
  {
    vertical: 'certification',
    path: '/certifications',
    title: 'Top 3 Professional Certifications (AI, Cloud, Data) | Deekshaam Business School',
    description:
      'The 3 highest-demand professional certifications at Deekshaam Business School, ranked by hiring outcomes across AI, cloud, data and finance.',
    schemaType: 'Course',
    heading: 'Top 3 Professional Certifications',
  },
];

async function fetchTop3(vertical) {
  try {
    const res = await fetch(`${API_BASE}/api/top3?vertical=${vertical}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.success && json.data && json.data.picks) return json.data;
  } catch (e) {
    console.warn(`[prerender] API unavailable for ${vertical}, using seed fallback: ${e.message}`);
  }
  return null;
}

function seedFallback(vertical) {
  const jobs = [
    { id: 'job-1', title: 'Associate Consultant (CRM)', employer: 'Salesforce', city: 'Bangalore', summary: 'Entry-level CRM consulting role with Salesforce partner network. Employment first, BCA degree alongside.', url: '/jobs/salesforce-associate-consultant' },
    { id: 'job-2', title: 'IT Support Engineer', employer: 'HCLTech', city: 'Bangalore', summary: 'Service desk and infrastructure support at HCLTech Bangalore. Job-first pathway with BCA in parallel.', url: '/jobs/hcltech-it-support-engineer' },
    { id: 'job-3', title: 'Relationship Executive', employer: 'HDFC Bank', city: 'Bangalore', summary: 'Branch banking customer relationship role at HDFC Bank. Join through HR tie-up, complete B.Com while employed.', url: '/jobs/hdfc-bank-relationship-executive' },
  ];
  const programs = [
    { id: 'prog-1', title: 'BBA - Bachelor of Business Administration', city: 'Bangalore', summary: 'Management, analytics and digital business with 8 specialization pathways.', url: '/programs/bba' },
    { id: 'prog-2', title: 'BCA - Bachelor of Computer Applications', city: 'Bangalore', summary: 'Software, data, cloud and intelligent systems through practical labs.', url: '/programs/bca' },
    { id: 'prog-3', title: 'B.Com - Bachelor of Commerce', city: 'Bangalore', summary: 'Accounting, finance and modern business across six applied semesters.', url: '/programs/bcom' },
  ];
  const certifications = [
    { id: 'cert-1', title: 'Data Science', city: 'Bangalore', summary: 'Python, machine learning, analytics and data visualization foundations.', url: '/certifications' },
    { id: 'cert-2', title: 'Artificial Intelligence & ML', city: 'Bangalore', summary: 'Neural networks, deep learning, Python ML libraries and applied AI.', url: '/certifications' },
    { id: 'cert-3', title: 'Cloud Computing', city: 'Bangalore', summary: 'AWS, Microsoft Azure, cloud architecture and cloud security fundamentals.', url: '/certifications' },
  ];
  if (vertical === 'job') return { picks: jobs, isBackfilled: false };
  if (vertical === 'program') return { picks: programs, isBackfilled: false };
  return { picks: certifications, isBackfilled: false };
}

function renderCard(pick, idx, schemaType) {
  const rank = ['#1', '#2', '#3'][idx];
  return `      <article class="top3-card" data-rank="${idx + 1}">
        <div class="top3-rank">${rank}</div>
        <div class="top3-card-body">
          <h3>${escapeHtml(pick.title)}</h3>
          <p class="top3-summary">${escapeHtml(pick.summary || '')}</p>
          <a href="${pick.url || '#'}" class="btn btn-primary small">View Details</a>
        </div>
      </article>`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function structuredData(picks, schemaType, vertical) {
  const items = picks.map((p, idx) => {
    const base = {
      '@type': schemaType,
      name: p.title,
      url: p.url,
      description: p.summary,
    };
    if (schemaType === 'JobPosting') {
      base.hiringOrganization = { '@type': 'Organization', name: p.employer };
      base.jobLocation = { '@type': 'Place', address: { '@type': 'PostalAddress', addressLocality: p.city, addressCountry: 'IN' } };
      base.employmentType = 'FULL_TIME';
    }
    return { '@type': 'ListItem', position: idx + 1, item: base };
  });
  return JSON.stringify({ '@context': 'https://schema.org', '@type': 'ItemList', itemListElement: items });
}

function breadcrumbs(vertical) {
  const crumbs = [
    { name: 'Home', url: '/' },
  ];
  if (vertical) {
     crumbs.push({ name: vertical === 'job' ? 'Jobs' : vertical === 'program' ? 'Programs' : 'Certifications', url: vertical === 'job' ? '/jobs' : vertical === 'program' ? '/programs' : '/certifications' });
  }
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.url })),
  });
}

function getFaqSchema() {
  const faqs = [
    { question: 'What programs does Deekshaam offer?', answer: 'We offer BBA, BCA, B.Com and specialized certification programs.' },
    { question: 'Are there placement opportunities?', answer: 'Yes, we provide 100% placement assistance and job-first pathways with top employers.' },
    { question: 'Where is the campus located?', answer: 'Deekshaam Business School is located in Bangalore, India.' }
  ];
  
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  });
}

function getOrganizationSchema() {
  return JSON.stringify([
    {
      '@context': 'https://schema.org',
      '@type': 'EducationalOrganization',
      name: 'Deekshaam Business School',
      url: 'https://deekshaam.edu.in'
    },
    {
      '@context': 'https://schema.org',
      '@type': 'CollegeOrUniversity',
      name: 'Deekshaam Business School',
      url: 'https://deekshaam.edu.in',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Bangalore',
        addressCountry: 'IN'
      }
    }
  ]);
}

function writePage(routePath, title, description, schemaScripts, contentHtml) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${routePath}" />
  ${schemaScripts.map(s => `<script type="application/ld+json">${s}</script>`).join('\n  ')}
</head>
<body>
  <div id="root"></div>
  ${contentHtml || ''}
  <script type="module" src="/assets/index.js"></script>
</body>
</html>`;

  // Create path mapping
  let outDir = path.join(DIST_DIR, routePath.replace(/^\//, ''));
  if (routePath === '/') outDir = DIST_DIR;
  
  const outPath = path.join(outDir, 'index.html');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, html);
  console.log(`[prerender] Wrote ${outPath}`);
}

async function main() {
  if (!fs.existsSync(DIST_DIR)) {
    console.error(`[prerender] ${DIST_DIR} does not exist. Run "npm run build:web" first.`);
    process.exit(1);
  }

  // 1. Vertical Pages
  for (const v of VERTICALS) {
    const data = (await fetchTop3(v.vertical)) || seedFallback(v.vertical);
    const picks = (data.picks || []).slice(0, 3);
    if (picks.length === 0) {
      console.warn(`[prerender] No picks for ${v.vertical}, skipping`);
      continue;
    }

    const contentHtml = `<section class="top3-section" aria-label="Top picks">
    <div class="container">
      <div class="top3-head">
        <span class="eyebrow">Curated Shortlist</span>
        <h2>${escapeHtml(v.heading)}</h2>
      </div>
      <div class="top3-grid">
${picks.map((p, i) => renderCard(p, i, v.schemaType)).join('\n')}
      </div>
    </div>
  </section>`;

    const schemas = [
      structuredData(picks, v.schemaType, v.vertical),
      breadcrumbs(v.vertical),
      getFaqSchema()
    ];
    
    writePage(v.path, v.title, v.description, schemas, contentHtml);
  }

  // 2. Homepage
  writePage(
    '/',
    'Deekshaam Business School | Job-First Education in Bangalore',
    'Join Deekshaam Business School for job-first pathways, BBA, BCA, B.Com, and professional certifications with top placement partners in Bangalore.',
    [getOrganizationSchema(), getFaqSchema(), breadcrumbs(null)],
    ''
  );

  // 3. Individual Job Pages
  const jobsData = seedFallback('job').picks;
  for (const job of jobsData) {
    const jobSchema = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'JobPosting',
      title: job.title,
      description: job.summary,
      hiringOrganization: { '@type': 'Organization', name: job.employer },
      jobLocation: { '@type': 'Place', address: { '@type': 'PostalAddress', addressLocality: job.city, addressCountry: 'IN' } },
      employmentType: 'FULL_TIME'
    });

    writePage(
      job.url,
      `${job.title} at ${job.employer} | Deekshaam Pathways`,
      job.summary,
      [jobSchema, breadcrumbs('job'), getFaqSchema()],
      `<section class="job-detail"><h1>${escapeHtml(job.title)}</h1><p>${escapeHtml(job.summary)}</p></section>`
    );
  }
}

main().catch((e) => {
  console.error('[prerender] Failed:', e);
  process.exit(1);
});
