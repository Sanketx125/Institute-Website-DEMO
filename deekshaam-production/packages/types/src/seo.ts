// ===================================================
// SEO PAGE METADATA - single source for the server renderer (apps/api/src/seo/render.ts)
// and the client <SEOHead>, so the HTML Google crawls and the rendered DOM never disagree.
// ===================================================

export const SITE_NAME = 'Deekshaam Business School';
/** 1200x630 JPG; SVG/WebP previews are unreliable on Facebook/LinkedIn/WhatsApp. */
export const DEFAULT_SHARE_IMAGE = '/images/share-default.jpg';

export interface PageMeta {
  title: string;
  description: string;
  h1: string;
  /** Transactional pages: crawlable (to see the tag) but kept out of the index. */
  noindex?: boolean;
}

export const PAGE_META: Record<string, PageMeta> = {
  '/': {
    title: 'BBA, BCA & B.Com College in Bangalore',
    description: 'Study BBA, BCA and B.Com in Bangalore at Deekshaam Business School. AICTE approved, university affiliated, with work-integrated learning and job-first pathways.',
    h1: 'Deekshaam Business School, Bangalore',
  },
  '/programs': {
    title: 'Undergraduate Degree Programs (BBA, BCA, B.Com)',
    description: 'Explore 3-year undergraduate degree programs in Management, Computer Applications and Commerce at Deekshaam Business School, Bangalore.',
    h1: 'Undergraduate Degree Programs',
  },
  '/jobs': {
    title: 'Job-First Hiring Pathways in Bangalore',
    description: 'Partner-company job pathways at Deekshaam Business School: join through HR tie-ups, then complete your degree alongside employment.',
    h1: 'Job-First Hiring Pathways',
  },
  '/certifications': {
    title: 'Professional Certifications (AI, Cloud, Data, Marketing, Finance)',
    description: 'Explore modular 6-11 month professional certifications in AI, cloud, data, marketing and finance at Deekshaam Business School.',
    h1: 'Professional Certifications',
  },
  '/compare': {
    title: 'Compare BBA vs BCA vs B.Com',
    description: 'Side-by-side comparison of BBA, BCA and B.Com degree programs at Deekshaam Business School: eligibility, specializations and careers.',
    h1: 'Compare Degree Programs',
  },
  '/admissions': {
    title: 'Admissions 2026-27 | Eligibility & Online Application',
    description: 'Undergraduate admissions process, eligibility, document requirements and key deadlines at Deekshaam Business School.',
    h1: 'Admissions',
  },
  '/placements': {
    title: 'Placements & Career Development',
    description: 'Placement partners, corporate internship tracks and career assistance at Deekshaam Business School.',
    h1: 'Placements & Career Development',
  },
  '/campus': {
    title: 'Campus Infrastructure & Hostel Facilities',
    description: 'Campus environment, computer labs, residential hostels and student amenities at Deekshaam Business School, Devanahalli.',
    h1: 'Campus & Facilities',
  },
  '/about': {
    title: 'About Us | Leadership & Vision',
    description: 'History, mission, leadership and governance of Deekshaam Business School, managed by Deeksha Education Trust.',
    h1: 'About Deekshaam Business School',
  },
  '/news': {
    title: 'News, Articles & Career Insights',
    description: 'Institutional news, academic updates and career advice from Deekshaam Business School.',
    h1: 'News & Articles',
  },
  '/events': {
    title: 'Campus Events & Seminars',
    description: 'Upcoming institutional events, academic symposiums and cultural festivals at Deekshaam Business School.',
    h1: 'Events',
  },
  '/gallery': {
    title: 'Campus Photo Gallery',
    description: 'Campus photographs selected by the Deekshaam Business School team.',
    h1: 'Gallery',
  },
  '/visit': {
    title: 'Book a Campus Visit',
    description: 'Schedule a campus visit to Deekshaam Business School in Devanahalli, Bangalore.',
    h1: 'Visit the Campus',
  },
  '/contact': {
    title: 'Contact & Admissions Enquiry',
    description: 'Contact the Deekshaam Business School admissions office. Request a callback or send an enquiry.',
    h1: 'Contact Us',
  },
  '/apply': {
    title: 'Online Application Portal',
    description: 'Apply online for BBA, BCA or B.Com at Deekshaam Business School.',
    h1: 'Apply Online',
    noindex: true,
  },
  '/track': {
    title: 'Track Application Status',
    description: 'Check your application status at Deekshaam Business School.',
    h1: 'Track Your Application',
    noindex: true,
  },
};

/** "3 years" -> "P3Y", "6-11 months" -> "P11M" (upper bound); undefined when unparseable. */
export function isoDuration(text?: string): string | undefined {
  const m = String(text || '').match(/(\d+)\s*(?:-\s*(\d+))?\s*(year|month|week|day)/i);
  return m ? `P${m[2] || m[1]}${m[3][0].toUpperCase()}` : undefined;
}

/** "15 Oct 2026" + "10:00 AM - 04:00 PM" -> local ISO strings (IST) for schema.org dates. */
export function eventDates(date?: string, time?: string): { start?: string; end?: string } {
  const day = new Date(`${date} 00:00 UTC`);
  if (!date || isNaN(+day)) return {};
  const ymd = day.toISOString().slice(0, 10);
  const toIso = (t?: string) => {
    const m = t?.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!m) return undefined;
    const h = (+m[1] % 12) + (m[3].toUpperCase() === 'PM' ? 12 : 0);
    return `${ymd}T${String(h).padStart(2, '0')}:${m[2]}:00+05:30`;
  };
  const [from, to] = String(time || '').split(/\s+-\s+/);
  return { start: toIso(from) || ymd, end: toIso(to) };
}
