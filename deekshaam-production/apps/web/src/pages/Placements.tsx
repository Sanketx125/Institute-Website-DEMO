import React, { useState, useEffect } from 'react';
import { Icon } from '@deekshaam/ui';
import { api } from '../services/api';
import { SEOHead } from '../components/SEOHead';

interface PlacementsProps {
  onNavigate: (path: string) => void;
}

export const Placements: React.FC<PlacementsProps> = ({ onNavigate }) => {
  const [employers, setEmployers] = useState<any[]>([]);

  useEffect(() => {
    api.getEmployers().then(setEmployers).catch(console.error);
    api.trackEvent({ eventType: 'page_view', pagePath: '/placements' }).catch(() => {});
  }, []);

  return (
    <>
      <SEOHead
        title="Placements & Career Development"
        description="Explore placement partners, corporate internship tracks, and career assistance at Deekshaam Business School."
        canonicalPath="/placements"
      />

      <section className="page-hero">
        <div className="container page-hero-grid">
          <div>
            <span className="eyebrow">Industry Connect</span>
            <h1>Verifiable, structured career development for every graduate.</h1>
            <p>
              Develop industry awareness, practical coding and analytical skills, and professional interview confidence
              through structured career counseling and corporate outreach.
            </p>
            <div style={{ marginTop: '24px' }}>
              <button className="btn btn-primary" onClick={() => onNavigate('/contact')}>
                Consult Career Support Desk <Icon name="arrow" size={16} />
              </button>
            </div>
          </div>

          <div
            style={{
              background: '#17191b',
              color: '#fff',
              borderRadius: '24px',
              padding: '48px',
              textAlign: 'center',
            }}
          >
            <Icon name="briefcase" size={48} color="var(--orange)" />
            <strong style={{ fontSize: '24px', display: 'block', margin: '16px 0 8px' }}>
              Academic Rigor + Industry Immersion
            </strong>
            <span style={{ fontSize: '13px', color: '#aaa' }}>
              Direct corporate recruitment and internship pipelines
            </span>
          </div>
        </div>
      </section>

      {/* RECRUITERS GRID */}
      <section className="section">
        <div className="container">
          <div className="logo-heading">
            <div>
              <span className="eyebrow">Our Recruiters</span>
              <h2>Organizations where DBS students build careers.</h2>
            </div>
            <p>Our students engage with top corporate brands across technology, consulting, FMCG, and finance.</p>
          </div>

          <div className="logo-grid">
            {employers.map((emp, i) => (
              <div key={i} className="logo-tile">
                <img src={emp.logoUrl || emp[1]} alt={emp.name || emp[0]} loading="lazy" />
                <span>{emp.name || emp[0]}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CAREER DEVELOPMENT FRAMEWORK */}
      <section className="section section-tint">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Four Pillars</span>
            <h2>Comprehensive Placement Preparation</h2>
            <p>Preparation begins in semester one, not just during final-year campus drives.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
            <article className="info-card">
              <Icon name="user" size={24} color="var(--orange)" />
              <h3 style={{ fontSize: '18px', margin: '12px 0 6px' }}>Career Mapping</h3>
              <p>Identify individual strengths, aptitudes, and target career families early in the academic cycle.</p>
            </article>

            <article className="info-card">
              <Icon name="document" size={24} color="var(--orange)" />
              <h3 style={{ fontSize: '18px', margin: '12px 0 6px' }}>Profile Building</h3>
              <p>Craft ATS-compliant resumes, technical portfolios, GitHub repositories, and LinkedIn profiles.</p>
            </article>

            <article className="info-card">
              <Icon name="briefcase" size={24} color="var(--orange)" />
              <h3 style={{ fontSize: '18px', margin: '12px 0 6px' }}>Internship Tracks</h3>
              <p>Mandatory corporate internships connecting classroom learning with real enterprise demands.</p>
            </article>

            <article className="info-card">
              <Icon name="check" size={24} color="var(--orange)" />
              <h3 style={{ fontSize: '18px', margin: '12px 0 6px' }}>Campus Drives</h3>
              <p>Dedicated recruitment drives with verified salary packages and formal institutional verification.</p>
            </article>
          </div>
        </div>
      </section>
    </>
  );
};
