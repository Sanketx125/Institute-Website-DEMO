import { SiteImage } from '../components/SiteImage';
import React, { useState, useEffect } from 'react';
import { Icon } from '@deekshaam/ui';
import { api } from '../services/api';
import { SEOHead } from '../components/SEOHead';
import { VideoShowcase } from '../components/VideoShowcase';

interface PlacementsProps {
  onNavigate: (path: string) => void;
}

export const Placements: React.FC<PlacementsProps> = ({ onNavigate }) => {
  const [employers, setEmployers] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);

  useEffect(() => {
    api.getEmployers().then(setEmployers).catch(console.error);
    api.getStories().then(setStories).catch(console.error);
    api.trackEvent({ eventType: 'page_view', pagePath: '/placements' }).catch(() => {});
  }, []);

  return (
    <>
      <SEOHead
        title="Placements & Career Development"
        description="Explore placement partners, corporate internship tracks, and career assistance at Deekshaam Business School."
        canonicalPath="/placements"
      />

      <section className="page-hero"><div className="container page-hero-grid"><div><span className="eyebrow">Career development</span><h1>Build a career.<br />Start with direction.</h1><p>Connect your degree to the world of work through career guidance, practical projects and conversations with industry. Our job-before-academy pathway helps eligible students explore conditional opportunities before classes begin.</p><div className="hero-actions"><button className="btn btn-primary" onClick={() => onNavigate('/contact')}>Talk to a career counselor <Icon name="arrow" size={16} /></button><button className="btn btn-ghost" onClick={() => onNavigate('/programs')}>Explore programs</button></div></div><aside className="career-support-card"><span className="eyebrow light">From potential to preparation</span><h2>A clearer path forward.</h2>{[['01', 'Know your strengths', 'Build an aptitude profile and explore the roles that interest you.'], ['02', 'Meet industry', 'Prepare for interviews and connect with corporate and HR partners.'], ['03', 'Understand your offer', 'Review eligibility, selection criteria and employer conditions with your counselor.']].map(([number, title, description]) => <div key={number}><span>{number}</span><div><h3>{title}</h3><p>{description}</p></div></div>)}<p className="career-support-note">Selection and conditional offers depend on eligibility, interviews and employer terms.</p></aside></div></section>

      {/* RECRUITERS GRID */}
      <section className="section">
        <div className="container">
          <div className="logo-heading">
            <div>
              <span className="eyebrow">Industry connections</span>
              <h2>A wider view of the working world.</h2>
            </div>
            <p>Explore the industries and organizations represented in our career network. Ask the careers team for current opportunities and selection criteria.</p>
          </div>

          <div className="logo-grid">
            {employers.map((emp, i) => (
              <div key={i} className="logo-tile">
                <SiteImage src={emp.logoUrl || emp[1]} alt={emp.name || emp[0]} loading="lazy" />
                <span>{emp.name || emp[0]}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-tint editorial-section" id="student-stories"><div className="container"><div className="editorial-heading"><div><span className="eyebrow">Student journeys</span><h2>Career stories, in their own words.</h2><p>Hear directly from students about the path they took and the work they do now.</p></div></div>{stories.length ? <div className="story-grid">{stories.map(story => <article className="story-card" key={story.id}><div className="story-card-top">{story.imageUrl ? <SiteImage src={story.imageUrl} alt={story.name} loading="lazy" /> : <span className="story-initial" aria-hidden="true">{story.name?.charAt(0)}</span>}<div><span className="eyebrow">{story.program}{story.graduationYear ? ` · ${story.graduationYear}` : ''}</span><h3>{story.name}</h3><p>{story.outcome}</p></div></div><blockquote>“{story.quote}”</blockquote></article>)}</div> : <div className="story-empty"><div><span className="eyebrow">More to come</span><h3>Every career has a story.</h3><p>We are collecting first-hand stories from students and alumni. Speak with our careers team for current placement support and verified outcomes.</p></div><button className="btn btn-ghost" onClick={() => onNavigate('/contact')}>Ask about career support <Icon name="arrow" size={16} /></button></div>}</div></section>

      {/* CAREER DEVELOPMENT FRAMEWORK */}
      <section className="section section-tint">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Four Pillars</span>
            <h2>Comprehensive Placement Preparation</h2>
            <p>Preparation begins in semester one, not just during final-year campus drives.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 210px), 1fr))', gap: '20px' }}>
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
      <VideoShowcase category="Career stories" title="Conversations about careers." description="Watch student and industry voices shared by Deekshaam." />
      <section className="section career-final-cta"><div className="container editorial-cta"><div><span className="eyebrow light">Your next step</span><h2>Talk through your options with us.</h2><p>Get clear answers about programs, internships, and the support available to you.</p></div><button className="btn btn-primary" onClick={() => onNavigate('/contact')}>Contact the careers team <Icon name="arrow" size={16} /></button></div></section>
    </>
  );
};
