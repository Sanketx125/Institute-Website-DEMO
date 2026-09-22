import React, { useState, useEffect } from 'react';
import { Icon } from '@deekshaam/ui';
import { api } from '../services/api';
import { SEOHead } from '../components/SEOHead';

interface CampusProps {
  onNavigate: (path: string) => void;
}

export const Campus: React.FC<CampusProps> = ({ onNavigate }) => {
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    api.getSettings().then(setSettings).catch(console.error);
    api.trackEvent({ eventType: 'page_view', pagePath: '/campus' }).catch(() => {});
  }, []);

  const facilities = [
    { title: 'Advanced Computing & AI Lab', desc: 'Modern workstations, high-speed internet, and software development suites.' },
    { title: 'Interactive Smart Classrooms', desc: 'Multimedia audio-visual projection for interactive case discussions and presentations.' },
    { title: 'Residential Hostel Facilities', desc: 'Secure accommodations for outstation students with warden supervision and hygienic dining.' },
    { title: 'Central Academic Library', desc: 'Curated collection of university textbooks, national journals, reference volumes, and digital archives.' },
    { title: 'Campus Cafeteria & Dining', desc: 'Fresh, nutritious meal and snack options catering to students from diverse Indian states.' },
    { title: 'Sports & Student Lounge', desc: 'Recreational facilities for indoor and outdoor sports, cultural clubs, and community activities.' },
  ];

  return (
    <>
      <SEOHead
        title="Campus Infrastructure & Hostel Facilities"
        description="Explore the campus environment, computer labs, residential hostels, and student amenities at Deekshaam Business School."
        canonicalPath="/campus"
      />

      <section className="page-hero compact">
        <div className="container">
          <span className="eyebrow">Campus Life</span>
          <h1>Learn, collaborate, and grow in a modern campus environment.</h1>
          <p>Discover our academic infrastructure, high-tech labs, and student residential support located in Bangalore.</p>
          <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
            <button className="btn btn-primary" onClick={() => onNavigate('/visit')}>
              Plan a Campus Visit <Icon name="arrow" size={16} />
            </button>
            <button className="btn btn-ghost" onClick={() => onNavigate('/apply')}>
              Apply Online
            </button>
          </div>
        </div>
      </section>

      {/* FACILITIES GRID */}
      <section className="section">
        <div className="container split-feature">
          <div className="feature-image">
            <img
              src={settings?.campusImage || 'https://deekshaedu.in/wp-content/uploads/2025/03/Deekshaam-Buisness-School-Img-1.png'}
              alt="Campus Main Facility"
            />
          </div>

          <div>
            <span className="eyebrow">Student Infrastructure</span>
            <h2>The essentials students and parents prioritize.</h2>
            <div style={{ display: 'grid', gap: '16px', marginTop: '24px' }}>
              {facilities.map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'var(--cream)',
                      color: 'var(--orange)',
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon name="check" size={16} />
                  </div>
                  <div>
                    <h3 style={{ margin: '0 0 4px', fontSize: '16px' }}>{f.title}</h3>
                    <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* MAP & DIRECTIONS */}
      <section className="section section-dark">
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px' }}>
          <div>
            <span className="eyebrow light">Campus Location</span>
            <h2 style={{ fontSize: '32px', margin: '8px 0' }}>{settings?.address || 'Venkatpura, Kundana, Devanhalli Taluk, Bangalore - 562110'}</h2>
            <p style={{ color: '#aaa', margin: 0 }}>Coordinates: {settings?.coordinates || '13.261667, 77.610694'}</p>
          </div>

          <a
            className="btn btn-white"
            href={`https://www.google.com/maps/search/?api=1&query=${settings?.coordinates || '13.261667,77.610694'}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open in Google Maps <Icon name="arrow" size={16} />
          </a>
        </div>
      </section>
    </>
  );
};
