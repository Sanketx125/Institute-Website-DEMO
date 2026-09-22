import React, { useState, useEffect } from 'react';
import { Icon } from '@deekshaam/ui';
import { api } from '../services/api';
import { SEOHead } from '../components/SEOHead';

interface EventsProps {
  onNavigate: (path: string) => void;
}

export const Events: React.FC<EventsProps> = ({ onNavigate }) => {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    api.getEvents().then(setEvents).catch(console.error);
    api.trackEvent({ eventType: 'page_view', pagePath: '/events' }).catch(() => {});
  }, []);

  return (
    <>
      <SEOHead
        title="Campus Events & Seminars"
        description="Upcoming and past institutional events, academic symposiums, and cultural festivals at Deekshaam Business School."
        canonicalPath="/events"
      />

      <section className="page-hero compact">
        <div className="container">
          <span className="eyebrow">Campus Calendar</span>
          <h1>Upcoming Events & Seminars</h1>
          <p>Join our academic conferences, technical workshops, cultural celebrations, and industry speaker meets.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div style={{ display: 'grid', gap: '24px' }}>
            {events.map((evt, i) => (
              <article
                key={i}
                className="info-card"
                style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: '32px', alignItems: 'center' }}
              >
                <div
                  style={{
                    background: '#17191b',
                    color: '#fff',
                    borderRadius: '14px',
                    padding: '24px',
                    textAlign: 'center',
                  }}
                >
                  <Icon name="calendar" size={28} color="var(--orange)" />
                  <div style={{ fontSize: '18px', fontWeight: 800, marginTop: '8px' }}>{evt.date}</div>
                  <small style={{ color: '#aaa', fontSize: '11px' }}>{evt.time || '10:00 AM'}</small>
                </div>

                <div>
                  <span className="eyebrow">Academic Event</span>
                  <h2 style={{ fontSize: '24px', margin: '6px 0 10px' }}>{evt.title}</h2>
                  <p style={{ color: '#666', fontSize: '14px', lineHeight: '1.6' }}>{evt.description || evt.summary}</p>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: '#777', fontSize: '12px', marginTop: '12px' }}>
                    <Icon name="map" size={16} />
                    <span>{evt.location || 'DBS Campus Auditorium, Bangalore'}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};
