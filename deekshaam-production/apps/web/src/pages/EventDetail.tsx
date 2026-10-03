import React, { useState, useEffect } from 'react';
import { Icon } from '@deekshaam/ui';
import { api } from '../services/api';
import { SEOHead } from '../components/SEOHead';
import { SiteImage } from '../components/SiteImage';

interface EventDetailProps {
  slug: string;
  onNavigate: (path: string) => void;
}

/** Individual event URL: Google's Event rich results require one page per event. */
export const EventDetail: React.FC<EventDetailProps> = ({ slug, onNavigate }) => {
  const [event, setEvent] = useState<any>(undefined);

  useEffect(() => {
    api.getEvents().then((rows: any[]) => setEvent(rows.find((e) => e.slug === slug) || null)).catch(() => setEvent(null));
    api.trackEvent({ eventType: 'page_view', pagePath: `/events/${slug}` }).catch(() => {});
  }, [slug]);

  if (event === undefined) return <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>Loading event...</div>;

  if (!event) {
    return (
      <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
        <SEOHead title="Event not found" noindex />
        <h2>Event Not Found</h2>
        <button className="btn btn-primary" onClick={() => onNavigate('/events')}>Return to Events</button>
      </div>
    );
  }

  return (
    <>
      <SEOHead title={`${event.title} - ${event.date}`} description={event.summary} canonicalPath={`/events/${event.slug}`} image={event.coverImage} />
      <section className="page-hero compact">
        <div className="container" style={{ maxWidth: '820px' }}>
          <div className="crumbs">
            <a href="/events" onClick={(e) => { e.preventDefault(); onNavigate('/events'); }}>Events</a>
            <span>/</span>
            <span>{event.date}</span>
          </div>
          <span className="eyebrow">{event.date}{event.time ? ` · ${event.time}` : ''}</span>
          <h1 style={{ fontSize: '38px', margin: '12px 0 16px' }}>{event.title}</h1>
          {event.location && <p><Icon name="map" size={15} /> {event.location}</p>}
        </div>
      </section>
      <section className="section">
        <div className="container" style={{ maxWidth: '820px', lineHeight: '1.8' }}>
          {event.coverImage && <SiteImage src={event.coverImage} alt={event.title} />}
          <p>{event.description || event.summary}</p>
          <div style={{ marginTop: '36px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => onNavigate('/visit')}>Plan a campus visit <Icon name="arrow" size={16} /></button>
            <button className="btn btn-ghost" onClick={() => onNavigate('/events')}>&larr; All events</button>
          </div>
        </div>
      </section>
    </>
  );
};
