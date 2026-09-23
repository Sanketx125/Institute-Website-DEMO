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
            <div className="admission-pill" style={{ marginBottom: '14px' }}>
              <span /> 100% Pre-Admission Corporate Selection Guarantee
            </div>
            <span className="eyebrow" style={{ color: '#ea580c', fontWeight: 700, letterSpacing: '2px' }}>
              Job-First Career Architecture
            </span>
            <h1>First Job. Then Academy. A revolutionary placement guarantee.</h1>
            <p>
              Through direct alliances with 450+ HR consultancies, talent syndicates, and multinational corporate recruiters across Bengaluru, Deekshaam students secure conditional corporate job offers and Letters of Intent (LOI) <em>before</em> their degree classes commence.
            </p>
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginTop: '24px' }}>
              <button className="btn btn-primary" onClick={() => onNavigate('/apply')}>
                Apply for Placement Guarantee <Icon name="arrow" size={16} />
              </button>
              <button className="btn btn-dark" onClick={() => onNavigate('/contact')}>
                Consult Corporate Desk <Icon name="arrow" size={16} />
              </button>
            </div>
          </div>

          <div
            style={{
              background: '#0b132b',
              color: '#fff',
              borderRadius: '24px',
              padding: '36px',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(234, 88, 12, 0.15)', color: '#ea580c', display: 'grid', placeItems: 'center' }}>
                <Icon name="briefcase" size={26} />
              </div>
              <div>
                <strong style={{ fontSize: '18px', display: 'block', color: '#fff' }}>Corporate Gateway Metrics</strong>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Verified Institutional Outcomes</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', textAlign: 'left' }}>
              <div style={{ background: '#111c38', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <strong style={{ fontSize: '26px', color: '#ea580c', display: 'block' }}>450+</strong>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>HR & Corporate Tie-ups</span>
              </div>
              <div style={{ background: '#111c38', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <strong style={{ fontSize: '26px', color: '#ea580c', display: 'block' }}>100%</strong>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Pre-Admission LOI Track</span>
              </div>
              <div style={{ background: '#111c38', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <strong style={{ fontSize: '26px', color: '#38bdf8', display: 'block' }}>₹18.4L</strong>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Highest Stipend Package</span>
              </div>
              <div style={{ background: '#111c38', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <strong style={{ fontSize: '26px', color: '#4ade80', display: 'block' }}>₹6.8L</strong>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Median Starting Package</span>
              </div>
            </div>
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
