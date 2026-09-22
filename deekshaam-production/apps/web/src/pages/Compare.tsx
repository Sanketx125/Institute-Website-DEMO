import React, { useState, useEffect } from 'react';
import { Icon } from '@deekshaam/ui';
import { api } from '../services/api';
import { SEOHead } from '../components/SEOHead';

interface CompareProps {
  onNavigate: (path: string) => void;
}

export const Compare: React.FC<CompareProps> = ({ onNavigate }) => {
  const [programs, setPrograms] = useState<any[]>([]);

  useEffect(() => {
    api.getPrograms().then(setPrograms).catch(console.error);
    api.trackEvent({ eventType: 'page_view', pagePath: '/compare' }).catch(() => {});
  }, []);

  return (
    <>
      <SEOHead
        title="Compare Undergraduate Degree Programs (BBA vs BCA vs B.Com)"
        description="Side-by-side comparison of BBA, BCA, and B.Com degree programs at Deekshaam Business School."
        canonicalPath="/compare"
      />

      <section className="page-hero compact">
        <div className="container">
          <span className="eyebrow">Program Comparison</span>
          <h1>BBA, BCA, or B.Com? Compare side by side.</h1>
          <p>Evaluate core differences in focus areas, specialization tracks, and career opportunities to make an informed choice.</p>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              minWidth: '780px',
              borderCollapse: 'collapse',
              border: '1px solid var(--line)',
              borderRadius: '16px',
              overflow: 'hidden',
              background: '#fff',
            }}
          >
            <thead>
              <tr style={{ background: '#17191b', color: '#fff' }}>
                <th style={{ padding: '20px', width: '22%', textAlign: 'left' }}>Parameter</th>
                {programs.map((p) => (
                  <th key={p.slug} style={{ padding: '20px', width: '26%', textAlign: 'left' }}>
                    <div style={{ fontSize: '24px', fontWeight: 800 }}>{p.code}</div>
                    <div style={{ fontSize: '12px', color: '#aaa', fontWeight: 400 }}>{p.title}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '16px 20px', fontWeight: 700, background: '#faf9f7', borderBottom: '1px solid #eee' }}>
                  Core Domain Focus
                </td>
                <td style={{ padding: '16px 20px', borderBottom: '1px solid #eee' }}>Management, leadership, operations, marketing</td>
                <td style={{ padding: '16px 20px', borderBottom: '1px solid #eee' }}>Software development, algorithms, cloud, AI & ML</td>
                <td style={{ padding: '16px 20px', borderBottom: '1px solid #eee' }}>Financial accounting, taxation, auditing, commerce</td>
              </tr>

              <tr>
                <td style={{ padding: '16px 20px', fontWeight: 700, background: '#faf9f7', borderBottom: '1px solid #eee' }}>
                  Duration & Mode
                </td>
                {programs.map((p) => (
                  <td key={p.slug} style={{ padding: '16px 20px', borderBottom: '1px solid #eee' }}>
                    {p.duration} &middot; {p.mode}
                  </td>
                ))}
              </tr>

              <tr>
                <td style={{ padding: '16px 20px', fontWeight: 700, background: '#faf9f7', borderBottom: '1px solid #eee' }}>
                  Eligibility
                </td>
                {programs.map((p) => (
                  <td key={p.slug} style={{ padding: '16px 20px', borderBottom: '1px solid #eee', fontSize: '13px' }}>
                    10+2 with min 50% (45% for reserved categories)
                  </td>
                ))}
              </tr>

              <tr>
                <td style={{ padding: '16px 20px', fontWeight: 700, background: '#faf9f7', borderBottom: '1px solid #eee' }}>
                  Key Specializations
                </td>
                {programs.map((p) => (
                  <td key={p.slug} style={{ padding: '16px 20px', borderBottom: '1px solid #eee', fontSize: '13px' }}>
                    {p.specializations?.slice(0, 4).join(', ')}
                  </td>
                ))}
              </tr>

              <tr>
                <td style={{ padding: '16px 20px', fontWeight: 700, background: '#faf9f7', borderBottom: '1px solid #eee' }}>
                  Example Career Roles
                </td>
                {programs.map((p) => (
                  <td key={p.slug} style={{ padding: '16px 20px', borderBottom: '1px solid #eee', fontSize: '13px' }}>
                    {p.careers?.slice(0, 4).join(', ')}
                  </td>
                ))}
              </tr>

              <tr>
                <td style={{ padding: '20px', background: '#faf9f7' }}>Actions</td>
                {programs.map((p) => (
                  <td key={p.slug} style={{ padding: '20px' }}>
                    <button
                      className="btn btn-primary small full"
                      onClick={() => onNavigate(`/programs/${p.slug}`)}
                    >
                      View {p.code} Details <Icon name="arrow" size={14} />
                    </button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
};
