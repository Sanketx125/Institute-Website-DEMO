import React, { useState, useEffect } from 'react';
import { Icon } from '@deekshaam/ui';
import { api } from '../services/api';
import { SEOHead } from '../components/SEOHead';
import { TopPicks } from '../components/TopPicks';

interface JobsProps {
  onNavigate: (path: string) => void;
}

export const Jobs: React.FC<JobsProps> = ({ onNavigate }) => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [filters, setFilters] = useState<{ city?: string; department?: string; tag?: string }>({});

  useEffect(() => {
    api.getJobs().then(setJobs).catch(console.error);
    api.trackEvent({ eventType: 'page_view', pagePath: '/jobs' }).catch(() => {});
  }, []);

  const cities = Array.from(new Set(jobs.map((j) => j.city)));
  const departments = Array.from(new Set(jobs.map((j) => j.department)));
  const tags = Array.from(new Set(jobs.flatMap((j) => j.tags || [])));

  const filtered = jobs.filter((j) => {
    if (filters.city && j.city !== filters.city) return false;
    if (filters.department && j.department !== filters.department) return false;
    if (filters.tag && !(j.tags || []).includes(filters.tag)) return false;
    return true;
  });

  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  // Thin-combination guard: a filter combo with fewer than 3 exact matches
  // is a near-duplicate page - keep it out of the index, keep links followed.
  const isThinCombo = activeFilterCount > 0 && filtered.length < 3;

  return (
    <>
      <SEOHead
        title={`Job-First Hiring Pathways in Bangalore${activeFilterCount ? ` — ${Object.values(filters).filter(Boolean).join(', ')}` : ''}`}
        description={`Top 3 partner-company job pathways at Deekshaam Business School: join through HR tie-ups with Salesforce, HCLTech, HDFC Bank and more, then complete your degree alongside employment.`}
        canonicalPath="/jobs"
        noindex={isThinCombo}
        structuredData={jobsStructuredData(jobs)}
      />

      <section className="page-hero compact">
        <div className="container">
          <span className="eyebrow">Job-First Pathways</span>
          <h1>Join a partner company first. Earn your degree alongside.</h1>
          <p>
            Deekshaam's HR tie-ups place you into employment from day one — Salesforce, HCLTech, HDFC Bank, ITC and
            other partners hire first, and your BBA/BCA/B.Com runs in parallel.
          </p>
        </div>
      </section>

      <TopPicks
        config={{
          vertical: 'job',
          heading: 'Top 3 Job-First Pathways',
          subheading: 'Curated from our partner HR network, ranked by placement track record.',
          ctaLabel: 'View Pathway',
          filters,
        }}
        onNavigate={onNavigate}
      />

      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">All Pathways</span>
            <h2>All hiring pathways ({filtered.length})</h2>
          </div>

          <div className="filter-bar">
            <label>
              City
              <select
                value={filters.city || ''}
                onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value || undefined }))}
              >
                <option value="">All cities</option>
                {cities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
            <label>
              Department
              <select
                value={filters.department || ''}
                onChange={(e) => setFilters((f) => ({ ...f, department: e.target.value || undefined }))}
              >
                <option value="">All departments</option>
                {departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </label>
            <label>
              Focus
              <select
                value={filters.tag || ''}
                onChange={(e) => setFilters((f) => ({ ...f, tag: e.target.value || undefined }))}
              >
                <option value="">All focus areas</option>
                {tags.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </label>
            {activeFilterCount > 0 && (
              <button className="btn btn-ghost small" onClick={() => setFilters({})}>
                Clear filters
              </button>
            )}
          </div>

          <div className="program-grid">
            {filtered.map((job) => (
              <article key={job.slug} className="program-card">
                <div className="program-body">
                  <span className="eyebrow">{job.employer}</span>
                  <h3>{job.title}</h3>
                  <p>{job.summary}</p>
                  <div className="program-tags">
                    <span>{job.city}</span>
                    <span>{job.department}</span>
                    <span>{job.stipend}</span>
                  </div>
                  <a
                    href={`/jobs/${job.slug}`}
                    className="text-link"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate(`/jobs/${job.slug}`);
                    }}
                  >
                    View Pathway Details <Icon name="arrow" size={15} />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

function jobsStructuredData(jobs: any[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: jobs.slice(0, 3).map((job, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      item: {
        '@type': 'JobPosting',
        title: job.title,
        description: job.summary,
        hiringOrganization: {
          '@type': 'Organization',
          name: job.employer,
        },
        jobLocation: {
          '@type': 'Place',
          address: {
            '@type': 'PostalAddress',
            addressLocality: job.city,
            addressCountry: 'IN',
          },
        },
        employmentType: 'FULL_TIME',
      },
    })),
  };
}
