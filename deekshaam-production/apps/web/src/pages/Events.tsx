import React, { useState, useEffect } from 'react';
import { Icon } from '@deekshaam/ui';
import { api } from '../services/api';
import { SEOHead } from '../components/SEOHead';
import { SiteImage } from '../components/SiteImage';

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
          <h1>What’s happening on campus.</h1>
          <p>Discover workshops, conversations and moments that bring the Deekshaam community together.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="events-page-list">
            {events.map((evt, i) => (
              <article
                key={evt.id || i}
                className="campus-event-card"
              >
                {evt.coverImage ? <SiteImage src={evt.coverImage} alt={evt.title} loading="lazy" /> : <div className="event-date-block"><Icon name="calendar" size={25} /><strong>{evt.date}</strong><small>{evt.time || 'Time to be confirmed'}</small></div>}

                <div className="event-page-copy">
                  <span className="eyebrow">{evt.date}{evt.time ? ` · ${evt.time}` : ''}</span>
                  <h2>{evt.title}</h2>
                  <p>{evt.description || evt.summary}</p>
                  {evt.location && <small><Icon name="map" size={15} /> {evt.location}</small>}
                </div>
              </article>
            ))}
          </div>
          {!events.length && <div className="story-empty"><div><h2>The next event is taking shape.</h2><p>Confirmed dates and details will appear here. You can contact us to ask about visiting campus in the meantime.</p></div><button className="btn btn-ghost" onClick={() => onNavigate('/contact')}>Contact us <Icon name="arrow" size={16} /></button></div>}
        </div>
      </section>
    </>
  );
};
