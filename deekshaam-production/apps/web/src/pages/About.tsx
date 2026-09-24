import { SiteImage } from '../components/SiteImage';
import React, { useState, useEffect } from 'react';
import { Icon } from '@deekshaam/ui';
import { api } from '../services/api';
import { SEOHead } from '../components/SEOHead';
import { VideoShowcase } from '../components/VideoShowcase';

interface AboutProps {
  onNavigate: (path: string) => void;
}

export const About: React.FC<AboutProps> = ({ onNavigate }) => {
  const [faculty, setFaculty] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    api.getFaculty().then(setFaculty).catch(console.error);
    api.getSettings().then(setSettings).catch(console.error);
    api.trackEvent({ eventType: 'page_view', pagePath: '/about' }).catch(() => {});
  }, []);

  return (
    <>
      <SEOHead
        title="About Deekshaam Business School | Leadership & Vision"
        description="Learn about the history, institutional mission, leadership, and governance of Deekshaam Business School."
        canonicalPath="/about"
      />

      <section className="page-hero">
        <div className="container page-hero-grid">
          <div>
            <span className="eyebrow">About Deekshaam</span>
            <h1>Where ambition meets a place to grow.</h1>
            <p>
              Deekshaam Business School brings applied learning, academic guidance and a close-knit campus community together in Devanahalli, Bengaluru.
            </p>
            <div className="hero-actions"><button className="btn btn-primary" onClick={() => onNavigate('/programs')}>Explore our programs <Icon name="arrow" size={16} /></button><button className="btn btn-ghost" onClick={() => onNavigate('/visit')}>Visit the campus</button></div>
          </div>
          <div className="about-hero-image"><SiteImage src={settings?.campusImage || 'https://deekshaedu.in/wp-content/uploads/2025/03/Deekshaam-Buisness-School-Img-1.png'} alt="Classroom and student moments at Deekshaam" /><span>Established {settings?.founded || '2021'} · Devanahalli</span></div>
        </div>
      </section>
      <section className="section about-story-band"><div className="container about-story-grid"><div><span className="eyebrow light">Our approach</span><h2>Learning moves beyond the classroom.</h2><p>Programs combine university-aligned teaching with projects, presentation practice and career conversations that help students connect what they learn to what comes next.</p></div><div className="about-story-points"><p><strong>01</strong> Learn the fundamentals</p><p><strong>02</strong> Apply ideas in projects</p><p><strong>03</strong> Prepare for the workplace</p></div></div></section>

      {/* CORE VALUES */}
      <section className="section">
        <div className="container about-grid">
          <div>
            <span className="eyebrow">Institutional Mission</span>
            <h2>Shaping learning for a rapidly evolving digital world.</h2>
            <p style={{ marginTop: '12px', lineHeight: '1.6' }}>
              Located in Devanahalli Taluk, Bengaluru, DBS delivers an academic environment that bridges theoretical
              foundations with applied industry requirements. We welcome students from diverse regions across India,
              fostering a collaborative and inclusive academic community.
            </p>
            <button className="btn btn-primary" style={{ marginTop: '24px' }} onClick={() => onNavigate('/programs')}>
              Explore Academic Programs <Icon name="arrow" size={16} />
            </button>
          </div>

          <div className="values-grid">
            <article>
              <strong>01</strong>
              <h3>Applied Learning</h3>
              <p>Connect textbook concepts with hands-on lab experiments, presentations, and live case studies.</p>
            </article>
            <article>
              <strong>02</strong>
              <h3>Inclusive Access</h3>
              <p>Support ambitious students from varied socio-economic backgrounds with guidance and mentorship.</p>
            </article>
            <article>
              <strong>03</strong>
              <h3>Career Readiness</h3>
              <p>Maintain continuous focus on professional competencies, soft skills, and employer readiness.</p>
            </article>
            <article>
              <strong>04</strong>
              <h3>Responsible Governance</h3>
              <p>Ensure transparency, adherence to university curricula, and ethical educational leadership.</p>
            </article>
          </div>
        </div>
      </section>
      <VideoShowcase category="Our story" title="See the people behind Deekshaam." description="Get to know the campus, the team and the way we learn together." />

      {/* LEADERSHIP GRID */}
      <section className="section section-tint">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Governance & Faculty</span>
            <h2>Leadership Team</h2>
            <p>Meet the visionary educators and academic leaders guiding Deekshaam Business School.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: '24px' }}>
            {faculty.map((leader, i) => (
              <article key={i} className="info-card" style={{ padding: '0', overflow: 'hidden' }}>
                <SiteImage
                  src={leader.image}
                  alt={leader.name}
                  style={{ width: '100%', height: '320px', objectFit: 'cover' }}
                />
                <div style={{ padding: '24px' }}>
                  <span className="eyebrow">{leader.role}</span>
                  <h3 style={{ margin: '6px 0 4px', fontSize: '20px' }}>{leader.name}</h3>
                  <p style={{ color: '#777', fontSize: '13px', margin: 0 }}>{leader.note}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};
