import { SiteImage } from '../components/SiteImage';
import React, { useState, useEffect } from 'react';
import { Icon } from '@deekshaam/ui';
import { api } from '../services/api';
import { SEOHead } from '../components/SEOHead';
import { CampusMap } from '../components/CampusMap';
import { VideoShowcase } from '../components/VideoShowcase';

interface CampusProps {
  onNavigate: (path: string) => void;
}

export const Campus: React.FC<CampusProps> = ({ onNavigate }) => {
  const [settings, setSettings] = useState<any>(null);
  const [gallery, setGallery] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    api.getSettings().then(setSettings).catch(console.error);
    api.getGallery().then(setGallery).catch(console.error);
    api.getEvents().then(setEvents).catch(console.error);
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

      <section className="page-hero campus-hero">
        <div className="container campus-hero-grid"><div>
          <span className="eyebrow">Campus Life</span>
          <h1>A campus built for every kind of progress.</h1>
          <p>See where classes, projects and everyday student life come together in Devanahalli, Bengaluru.</p>
          <div className="hero-actions">
            <button className="btn btn-primary" onClick={() => onNavigate('/visit')}>
              Visit the campus <Icon name="arrow" size={16} />
            </button>
            <button className="btn btn-ghost" onClick={() => onNavigate('/gallery')}>
              View all photos
            </button>
          </div>
        </div><div className="campus-hero-image"><SiteImage src={settings?.campusImage || 'https://deekshaedu.in/wp-content/uploads/2025/03/Deekshaam-Buisness-School-Img-1.png'} alt="Classroom and student moments at Deekshaam Business School" /><span>Devanahalli · Bengaluru</span></div></div>
      </section>

      {/* FACILITIES GRID */}
      <section className="section campus-facilities">
        <div className="container">
            <span className="eyebrow">Student Infrastructure</span>
            <h2>Spaces to study, connect and recharge.</h2>
            <div className="facility-grid">
              {facilities.map((f, i) => (
                <article key={i} className="facility-card"><span className="facility-number">0{i + 1}</span>
                  <div>
                    <h3>{f.title}</h3>
                    <p>{f.desc}</p>
                  </div>
                </article>
              ))}
            </div>
        </div>
      </section>

      <section className="section section-tint editorial-section"><div className="container"><div className="editorial-heading"><div><span className="eyebrow">Campus in pictures</span><h2>Take a closer look.</h2><p>Browse photographs selected by the Deekshaam team.</p></div><button className="text-link" onClick={() => onNavigate('/gallery')}>Explore the gallery <Icon name="arrow" size={16} /></button></div><div className="campus-photo-grid">{gallery.filter(item => item.category !== 'Illustration').slice(0, 4).map(item => <article className="campus-photo" key={item.id}><SiteImage src={item.imageUrl} alt={item.title} loading="lazy" /><div><span>{item.category}</span><h3>{item.title}</h3></div></article>)}</div></div></section>

      <section className="section editorial-section"><div className="container"><div className="editorial-heading"><div><span className="eyebrow">What’s happening</span><h2>Campus events.</h2><p>Workshops, conversations and community moments from our calendar.</p></div><button className="text-link" onClick={() => onNavigate('/events')}>See all events <Icon name="arrow" size={16} /></button></div>{events.length ? <div className="event-preview-grid">{events.slice(0, 3).map(event => <article className="event-preview" key={event.id}>{event.coverImage && <SiteImage src={event.coverImage} alt={event.title} loading="lazy" />}<div><span className="eyebrow">{event.date}</span><h3>{event.title}</h3><p>{event.summary}</p><small>{event.location}</small></div></article>)}</div> : <div className="story-empty"><div><h3>More campus moments are on their way.</h3><p>Upcoming event details will appear here as they are confirmed.</p></div><button className="btn btn-ghost" onClick={() => onNavigate('/events')}>View the calendar</button></div>}</div></section>

      <VideoShowcase category="Campus life" title="Get to know life on campus." description="Explore student life, spaces and campus moments on video." />

      {/* GEOSPATIAL MAP & DIRECTIONS */}
      <CampusMap />
    </>
  );
};
