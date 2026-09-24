import React, { useState, useEffect } from 'react';
import { Icon } from '@deekshaam/ui';
import { api } from '../services/api';
import { SEOHead } from '../components/SEOHead';
import { TopPicks } from '../components/TopPicks';

interface CertificationsProps {
  onNavigate: (path: string) => void;
}

export const Certifications: React.FC<CertificationsProps> = ({ onNavigate }) => {
  const [certifications, setCertifications] = useState<any[]>([]);

  useEffect(() => {
    api.getCertifications().then(setCertifications).catch(console.error);
    api.trackEvent({ eventType: 'page_view', pagePath: '/certifications' }).catch(() => {});
  }, []);

  const groups = Array.from(new Set(certifications.map((c) => c.group)));

  return (
    <>
      <SEOHead
        title="Professional Certifications (AI, Cloud, Data, Marketing, Finance)"
        description="Explore modular 6-11 month professional certifications at Deekshaam Business School."
        canonicalPath="/certifications"
      />

      <section className="page-hero">
        <div className="container page-hero-grid">
          <div>
            <span className="eyebrow">Career Acceleration</span>
            <h1>New skills. More possibilities.</h1>
            <p>
              Enhance your employability through specialized 6 to 11-month certification pathways designed around
              high-growth technical and managerial competencies.
            </p>
            <div style={{ marginTop: '24px' }}>
              <button className="btn btn-primary" onClick={() => onNavigate('/contact')}>
                Enquire About Certifications <Icon name="arrow" size={16} />
              </button>
            </div>
          </div>

          <div
            style={{
              background: 'var(--navy-900)',
              color: '#fff',
              borderRadius: '24px',
              padding: '48px',
              textAlign: 'center',
            }}
          >
            <strong style={{ fontSize: '72px', color: 'var(--orange)', display: 'block', letterSpacing: '-4px' }}>
              6–11
            </strong>
            <span style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '2px' }}>
              Month Practical Learning Pathways
            </span>
          </div>
        </div>
      </section>

      <TopPicks
        config={{
          vertical: 'certification',
          heading: 'Top 3 Certifications',
          subheading: 'Highest-demand skill pathways ranked by hiring outcomes.',
          ctaLabel: 'View Certification',
        }}
        onNavigate={onNavigate}
      />

      {groups.map((group, gIdx) => (
        <section key={gIdx} className={`section ${gIdx % 2 === 1 ? 'section-tint' : ''}`}>
          <div className="container">
            <div className="section-head">
              <span className="eyebrow">{group}</span>
              <h2>{group} Programs</h2>
            </div>

            <div className="cert-grid">
              {certifications
                .filter((c) => c.group === group)
                .map((cert, cIdx) => (
                  <article key={cIdx} className="cert-card">
                    <span className="cert-group">{cert.group}</span>
                    <h3>{cert.title}</h3>
                    <p>{cert.text}</p>
                    <div>
                      <span>Duration: {cert.duration}</span>
                      <a
                        href="/apply"
                        onClick={(e) => {
                          e.preventDefault();
                          onNavigate('/contact');
                        }}
                      >
                        Enquire <Icon name="arrow" size={15} />
                      </a>
                    </div>
                  </article>
                ))}
            </div>
          </div>
        </section>
      ))}
    </>
  );
};
