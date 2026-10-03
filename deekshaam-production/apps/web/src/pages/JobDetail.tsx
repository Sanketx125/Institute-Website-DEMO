import React, { useState, useEffect } from 'react';
import { Icon } from '@deekshaam/ui';
import { api } from '../services/api';
import { SEOHead } from '../components/SEOHead';

interface JobDetailProps {
  slug: string;
  onNavigate: (path: string) => void;
}

export const JobDetail: React.FC<JobDetailProps> = ({ slug, onNavigate }) => {
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.getJob(slug)
      .then((data) => {
        setJob(data);
        setError(false);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
      
    api.trackEvent({ eventType: 'page_view', pagePath: `/jobs/${slug}` }).catch(() => {});
  }, [slug]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '100px 0', textAlign: 'center' }}>
        <p>Loading job details...</p>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="container" style={{ padding: '100px 0', textAlign: 'center' }}>
        <h2>Job not found</h2>
        <p>The pathway you are looking for might have been closed or removed.</p>
        <button className="btn btn-primary mt-4" onClick={() => onNavigate('/jobs')}>
          View all pathways
        </button>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title={`${job.title} at ${job.employer} - Job-First Pathway`}
        description={job.summary}
        canonicalPath={`/jobs/${slug}`}
      />

      <div className="container" style={{ padding: '60px 0 20px' }}>
        <a 
          href="/jobs" 
          className="text-link" 
          onClick={(e) => { e.preventDefault(); onNavigate('/jobs'); }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '40px' }}
        >
          <span style={{ display: 'inline-flex', transform: 'rotate(180deg)' }}>
            <Icon name="arrow" size={15} />
          </span> Back to all pathways
        </a>
      </div>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="content-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '60px' }}>
            <div className="main-content">
              <span className="eyebrow">{job.employer}</span>
              <h1 style={{ marginBottom: '24px' }}>{job.title}</h1>
              <p className="lead" style={{ fontSize: '1.2rem', color: '#555', marginBottom: '32px' }}>
                {job.summary}
              </p>

              <div className="job-meta" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '40px' }}>
                <span className="tag" style={{ background: '#f5f5f5', padding: '8px 16px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Icon name="map" size={16} /> {job.city}
                </span>
                <span className="tag" style={{ background: '#f5f5f5', padding: '8px 16px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Icon name="briefcase" size={16} /> {job.department}
                </span>
                <span className="tag" style={{ background: '#f5f5f5', padding: '8px 16px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Icon name="laptop" size={16} /> {job.mode}
                </span>
                <span className="tag" style={{ background: '#f5f5f5', padding: '8px 16px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Icon name="document" size={16} /> {job.stipend}
                </span>
              </div>

              <h3>Pathway Overview</h3>
              <p>
                As part of Deekshaam's job-first model, you will join {job.employer} as a {job.title} in {job.city}. 
                This is a {job.mode.toLowerCase()} role in the {job.department} department.
                While employed, you will complete your {job.degreePath} degree in parallel, applying your academic learning directly to your work.
              </p>

              <div style={{ marginTop: '40px' }}>
                <button 
                  className="btn btn-primary" 
                  onClick={() => onNavigate('/apply')}
                  style={{ padding: '16px 32px', fontSize: '1.1rem' }}
                >
                  Apply Now
                </button>
              </div>
            </div>

            <div className="sidebar" style={{ background: '#f9f9f9', padding: '32px', borderRadius: '12px', height: 'fit-content' }}>
              <h3 style={{ marginBottom: '24px' }}>Qualifying Course</h3>
              <div style={{ marginBottom: '24px' }}>
                <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>Required Degree Program</p>
                <p style={{ fontWeight: 600, fontSize: '1.1rem', margin: '4px 0' }}>{job.degreePath}</p>
                <a 
                  href={`/programs/${job.degreePath.toLowerCase().replace('.', '')}`} 
                  className="text-link"
                  onClick={(e) => { 
                    e.preventDefault(); 
                    onNavigate(`/programs/${job.degreePath.toLowerCase().replace('.', '')}`); 
                  }}
                >
                  View degree details <Icon name="arrow" size={14} />
                </a>
              </div>

              <hr style={{ margin: '24px 0', border: 0, borderTop: '1px solid #ddd' }} />

              <h4 style={{ marginBottom: '16px' }}>Focus Areas</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {job.tags && job.tags.map((tag: string) => (
                  <span key={tag} style={{ background: '#e0e0e0', padding: '4px 12px', borderRadius: '100px', fontSize: '0.85rem' }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
