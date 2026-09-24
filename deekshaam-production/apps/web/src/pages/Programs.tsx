import { SiteImage } from '../components/SiteImage';
import React, { useState, useEffect } from 'react';
import { Icon } from '@deekshaam/ui';
import { api } from '../services/api';
import { SEOHead } from '../components/SEOHead';
import { TopPicks } from '../components/TopPicks';

interface ProgramsProps {
  onNavigate: (path: string) => void;
}

export const Programs: React.FC<ProgramsProps> = ({ onNavigate }) => {
  const [programs, setPrograms] = useState<any[]>([]);

  useEffect(() => {
    api.getPrograms().then(setPrograms).catch(console.error);
    api.trackEvent({ eventType: 'page_view', pagePath: '/programs' }).catch(() => {});
  }, []);

  return (
    <>
      <SEOHead
        title="Undergraduate Degree Programs (BBA, BCA, B.Com)"
        description="Explore 3-year undergraduate degree programs in Management, Computer Applications, and Commerce at Deekshaam Business School, Bangalore."
        canonicalPath="/programs"
      />

      <section className="page-hero compact">
        <div className="container">
          <span className="eyebrow">Academic Catalog</span>
          <h1>Undergraduate programs built for modern enterprise.</h1>
          <p>Explore curriculum structures, specialization pathways, eligibility criteria, and career roles before applying.</p>
        </div>
      </section>

      <TopPicks
        config={{
          vertical: 'program',
          heading: 'Top 3 Degree Programs',
          subheading: 'Ranked by curriculum depth, specialization breadth and placement outcomes.',
          ctaLabel: 'View Program',
        }}
        onNavigate={onNavigate}
      />

      <section className="section">
        <div className="container">
          <div className="program-grid">
            {programs.map((p) => (
              <article key={p.slug} className="program-card">
                <div className="program-image">
                  <SiteImage src={p.image} alt={p.title} />
                  <span>{p.duration}</span>
                </div>
                <div className="program-body">
                  <span className="eyebrow">Undergraduate</span>
                  <h3>{p.code}</h3>
                  <p className="program-title">{p.title}</p>
                  <p>{p.summary}</p>
                  <div className="program-tags">
                    {p.specializations?.slice(0, 3).map((s: string, idx: number) => (
                      <span key={idx}>{s}</span>
                    ))}
                  </div>
                  <a
                    href={`/programs/${p.slug}`}
                    className="text-link"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate(`/programs/${p.slug}`);
                    }}
                  >
                    View Curriculum & Details <Icon name="arrow" size={15} />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-tint">
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px' }}>
          <div>
            <h2 style={{ fontSize: '32px', margin: '0 0 8px', letterSpacing: '-1px' }}>Need help comparing BBA, BCA, and B.Com?</h2>
            <p style={{ margin: 0, color: 'var(--muted)' }}>Review differences in specializations, curriculum focus, and career tracks side by side.</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-primary" onClick={() => onNavigate('/compare')}>
              Compare Programs <Icon name="arrow" size={16} />
            </button>
            <button className="btn btn-ghost" onClick={() => onNavigate('/contact')}>
              Consult Admissions
            </button>
          </div>
        </div>
      </section>
    </>
  );
};
