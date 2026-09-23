import React, { useState, useEffect } from 'react';
import { Icon } from '@deekshaam/ui';
import { api } from '../services/api';
import { SEOHead } from '../components/SEOHead';
import { CampusMap } from '../components/CampusMap';
import { VideoShowcase } from '../components/VideoShowcase';
import { CampusPulseDrawer } from '../components/CampusPulseDrawer';

interface HomeProps {
  onNavigate: (path: string) => void;
}

export const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const [programs, setPrograms] = useState<any[]>([]);
  const [certifications, setCertifications] = useState<any[]>([]);
  const [employers, setEmployers] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [selectedInterest, setSelectedInterest] = useState<string>('technology');
  const [pulseOpen, setPulseOpen] = useState<boolean>(false);

  useEffect(() => {
    api.getSettings().then(setSettings).catch(console.error);
    api.getPrograms().then(setPrograms).catch(console.error);
    api.getCertifications().then(setCertifications).catch(console.error);
    api.getEmployers().then(setEmployers).catch(console.error);
    api.getNews().then(setNews).catch(console.error);
    api.trackEvent({ eventType: 'page_view', pagePath: '/' }).catch(() => {});
  }, []);

  const finderMap: Record<string, { code: string; title: string; desc: string; slug: string }> = {
    technology: {
      code: 'BCA',
      title: 'Bachelor of Computer Applications',
      desc: 'Focused on software engineering, AI & ML, databases, cloud, and programming fundamentals.',
      slug: 'bca',
    },
    business: {
      code: 'BBA',
      title: 'Bachelor of Business Administration',
      desc: 'Focused on management, analytics, digital marketing, business psychology, and operations.',
      slug: 'bba',
    },
    finance: {
      code: 'B.Com',
      title: 'Bachelor of Commerce',
      desc: 'Focused on accounting, corporate taxation, banking, auditing, and corporate finance.',
      slug: 'bcom',
    },
  };

  const currentFinder = finderMap[selectedInterest];

  return (
    <>
      <SEOHead
        title="Undergraduate Programs & Certifications"
        description="Study BBA, BCA, and B.Com in Bangalore at Deekshaam Business School. AICTE approved, university affiliated with work-integrated learning."
        canonicalPath="/"
      />

      {/* HERO SECTION */}
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
              <div className="admission-pill">
                <span /> 100% Pre-Admission Corporate Selection Guarantee
              </div>
              <button
                type="button"
                onClick={() => setPulseOpen(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  background: '#fff4e5',
                  color: '#c2410c',
                  border: '1px solid rgba(194, 65, 12, 0.25)',
                  cursor: 'pointer',
                }}
                title="Open live announcements and placement alerts"
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ea580c', display: 'inline-block' }} />
                Campus Pulse
              </button>
            </div>

            <span className="eyebrow" style={{ color: '#ea580c', fontWeight: 700, letterSpacing: '2px' }}>
              Job-First Higher Education Model
            </span>
            <h1>
              Your Job Starts.<br />
              <em>Before Your Degree Does.</em>
            </h1>
            <p className="hero-lead">
              Bengaluru's pioneer institute where students secure corporate job placements and formal Letters of Intent (LOI) through 450+ HR consultancy tie-ups before academic induction begins. Learn with confidence, graduate with day-one seniority.
            </p>
            <div className="hero-actions">
              <button className="btn btn-primary" onClick={() => onNavigate('/apply')}>
                Claim Guaranteed Placement Track <Icon name="arrow" size={16} />
              </button>
              <button className="btn btn-dark" onClick={() => onNavigate('/programs')}>
                Explore Academic Programs <Icon name="arrow" size={16} />
              </button>
            </div>
            <div className="hero-quick">
              <div>
                <strong>450+</strong>
                <span>HR & Corporate Tie-ups</span>
              </div>
              <div>
                <strong>100%</strong>
                <span>Pre-Admission LOI</span>
              </div>
              <div>
                <strong>₹18.4L</strong>
                <span>Highest Package</span>
              </div>
              <div>
                <strong>₹6.8L</strong>
                <span>Median Package</span>
              </div>
            </div>
          </div>

          <div className="hero-media">
            <img
              src={settings?.heroImage || 'https://deekshaedu.in/wp-content/uploads/2025/03/Deekshaam-Buisness-School-Img-1.png'}
              alt="Deekshaam Campus"
            />
            <div className="hero-card" style={{ background: '#0b132b', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="hero-card-icon" style={{ background: '#ea580c', color: '#fff' }}>
                <Icon name="briefcase" size={22} />
              </div>
              <div>
                <strong style={{ color: '#ffedd5', fontSize: '15px' }}>First Job &bull; Then Academy</strong>
                <span style={{ color: '#cbd5e1', fontSize: '13px' }}>
                  Corporate HR interviews and conditional offer letter issued before degree commencement.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROOF STRIP */}
      <section className="proof-strip">
        <div className="container">
          <span className="proof-label">Official Affiliation & Approvals</span>
          <div className="proof-items">
            {(settings?.affiliations || ['AICTE, New Delhi', 'Government of Karnataka', 'Bengaluru North University']).map(
              (aff: string, i: number) => (
                <div key={i}>
                  <Icon name="check" size={16} />
                  <span>{aff}</span>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* "JOB BEFORE ACADEMY" CORE USP SECTION */}
      <section className="section" style={{ background: '#080e1e', color: '#ffffff', padding: '90px 0', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-120px', right: '-120px', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(234, 88, 12, 0.15) 0%, rgba(8, 14, 30, 0) 70%)', pointerEvents: 'none' }} />
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '820px', margin: '0 auto 50px' }}>
            <span style={{ display: 'inline-block', padding: '5px 14px', borderRadius: '9999px', background: 'rgba(234, 88, 12, 0.15)', border: '1px solid rgba(234, 88, 12, 0.35)', color: '#ff9b6d', fontSize: '12px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '14px' }}>
              The Deekshaam Breakthrough
            </span>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.8px', margin: '0 0 16px' }}>
              The "Job-First, Academy-Next" Paradigm
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '16px', lineHeight: 1.6, margin: 0 }}>
              Why spend 3 years in uncertainty hoping for a campus drive? At Deekshaam, we flip higher education upside down: through direct syndication with 450+ HR consultancies and enterprise hiring panels, eligible students lock in their corporate job offer <em>before</em> their academic classes begin.
            </p>
          </div>

          {/* 3 CORE PILLARS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '56px' }}>
            <div style={{ background: '#111c38', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '32px 26px', position: 'relative' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(234, 88, 12, 0.15)', color: '#ea580c', display: 'grid', placeItems: 'center', marginBottom: '20px' }}>
                <Icon name="briefcase" size={24} />
              </div>
              <h3 style={{ fontSize: '19px', fontWeight: 700, color: '#ffffff', margin: '0 0 10px' }}>450+ HR Consultancy Tie-ups</h3>
              <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
                Direct enterprise MoUs with top multinational staffing firms and North Bengaluru corporate corridors. Recruiters match candidate talent profiles into verified entry-level roles.
              </p>
            </div>

            <div style={{ background: '#111c38', border: '1px solid rgba(234, 88, 12, 0.3)', borderRadius: '16px', padding: '32px 26px', position: 'relative', boxShadow: '0 10px 30px rgba(234, 88, 12, 0.08)' }}>
              <div style={{ position: 'absolute', top: '16px', right: '16px', background: '#ea580c', color: '#fff', fontSize: '10px', fontWeight: 800, padding: '3px 8px', borderRadius: '9999px', textTransform: 'uppercase' }}>
                Core Guarantee
              </div>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(234, 88, 12, 0.15)', color: '#ea580c', display: 'grid', placeItems: 'center', marginBottom: '20px' }}>
                <Icon name="shield" size={24} />
              </div>
              <h3 style={{ fontSize: '19px', fontWeight: 700, color: '#ffffff', margin: '0 0 10px' }}>Pre-Admission LOI Contract</h3>
              <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
                Qualified candidates receive a legally structured Letter of Intent (LOI) confirming company tier, starting designation, and salary scale before depositing academic fees.
              </p>
            </div>

            <div style={{ background: '#111c38', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '32px 26px', position: 'relative' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(234, 88, 12, 0.15)', color: '#ea580c', display: 'grid', placeItems: 'center', marginBottom: '20px' }}>
                <Icon name="laptop" size={24} />
              </div>
              <h3 style={{ fontSize: '19px', fontWeight: 700, color: '#ffffff', margin: '0 0 10px' }}>Day 1 Corporate Market Entry</h3>
              <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
                Classroom learning is reverse-engineered around your designated employer's tech stack. You train on live industry projects, earn paid stipends, and bypass campus unemployment.
              </p>
            </div>
          </div>

          {/* 5-STEP ROADMAP TIMELINE */}
          <div style={{ background: '#0e172e', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)', padding: '40px 32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '32px' }}>
              <div>
                <span style={{ color: '#ea580c', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px' }}>Step-by-Step Blueprint</span>
                <h3 style={{ fontSize: '24px', fontWeight: 700, color: '#ffffff', margin: '4px 0 0' }}>How Your Placement is Locked In</h3>
              </div>
              <button className="btn btn-primary small" onClick={() => onNavigate('/apply')}>
                Apply for Pre-Admission LOI <Icon name="arrow" size={14} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              {[
                { step: '01', title: 'Talent Profiling', desc: 'Aptitude & interest evaluation with institutional corporate counselors.' },
                { step: '02', title: 'HR Partner Match', desc: 'Candidate mapped to hiring requisitions of 450+ corporate tie-ups.' },
                { step: '03', title: 'Pre-Admission LOI', desc: 'Formal Letter of Intent issued with guaranteed designation & compensation.' },
                { step: '04', title: 'Curriculum Lock', desc: '3-year degree curriculum tailored directly to hiring partner tech stack.' },
                { step: '05', title: 'Immediate Onboarding', desc: 'Direct corporate induction with zero gap, paid stipends & seniority.' },
              ].map((s, idx) => (
                <div key={idx} style={{ background: '#162244', borderRadius: '12px', padding: '20px 16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: '24px', fontWeight: 900, color: '#ea580c', opacity: 0.8, display: 'block', marginBottom: '8px' }}>
                    {s.step}
                  </span>
                  <strong style={{ display: 'block', fontSize: '15px', color: '#ffffff', marginBottom: '6px' }}>{s.title}</strong>
                  <p style={{ color: '#94a3b8', fontSize: '12px', lineHeight: 1.5, margin: 0 }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PROGRAMS SECTION */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Academic Programs</span>
            <h2>Choose a degree aligned with where you want to lead.</h2>
            <p>Explore undergraduate programs designed in consultation with university guidelines and industry needs.</p>
          </div>

          <div className="program-grid">
            {programs.map((p) => (
              <article key={p.slug} className="program-card">
                <div className="program-image">
                  <img src={p.image} alt={p.title} />
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
                    View Program Details <Icon name="arrow" size={15} />
                  </a>
                </div>
              </article>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '36px' }}>
            <button className="btn btn-ghost" onClick={() => onNavigate('/compare')}>
              Compare All Programs Side-by-Side <Icon name="arrow" size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* INTERACTIVE PROGRAM FINDER */}
      <section className="section section-tint">
        <div className="container finder-grid">
          <div>
            <div className="section-head">
              <span className="eyebrow">Smart Discovery</span>
              <h2>Not sure what to study? Start with your interest.</h2>
              <p>A quick decision support tool for students and parents before speaking with admissions counselors.</p>
            </div>

            <div className="finder-options">
              <button
                className={selectedInterest === 'technology' ? 'selected' : ''}
                onClick={() => setSelectedInterest('technology')}
              >
                <Icon name="laptop" size={24} color="var(--orange)" />
                <span>
                  <strong>Technology & Software</strong>
                  <small>Programming, cloud, data science, and intelligent systems</small>
                </span>
              </button>

              <button
                className={selectedInterest === 'business' ? 'selected' : ''}
                onClick={() => setSelectedInterest('business')}
              >
                <Icon name="briefcase" size={24} color="var(--orange)" />
                <span>
                  <strong>Business & Management</strong>
                  <small>Strategic leadership, digital business, and operations</small>
                </span>
              </button>

              <button
                className={selectedInterest === 'finance' ? 'selected' : ''}
                onClick={() => setSelectedInterest('finance')}
              >
                <Icon name="grid" size={24} color="var(--orange)" />
                <span>
                  <strong>Finance & Commerce</strong>
                  <small>Corporate accounting, auditing, taxation, and financial markets</small>
                </span>
              </button>
            </div>
          </div>

          <div className="finder-result">
            <span className="eyebrow" style={{ color: '#ff9b6d' }}>Recommended Starting Point</span>
            <h3>{currentFinder.code}</h3>
            <h4 style={{ margin: '4px 0 12px', fontSize: '18px', fontWeight: 600 }}>{currentFinder.title}</h4>
            <p>{currentFinder.desc}</p>
            <button
              className="btn btn-primary"
              style={{ marginTop: '20px' }}
              onClick={() => onNavigate(`/programs/${currentFinder.slug}`)}
            >
              Explore {currentFinder.code} Curriculum <Icon name="arrow" size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* WHY DEEKSHAAM SPLIT FEATURE */}
      <section className="section">
        <div className="container split-feature">
          <div className="feature-image">
            <img
              src={settings?.campusImage || 'https://deekshaedu.in/wp-content/uploads/2025/03/Deekshaam-Buisness-School-Img-1.png'}
              alt="DBS Campus"
            />
          </div>
          <div className="feature-copy">
            <span className="eyebrow">The Deekshaam Advantage</span>
            <h2>An academic experience designed around employability.</h2>
            <div className="feature-list">
              <article>
                <Icon name="briefcase" size={24} />
                <div>
                  <h3>Industry Exposure</h3>
                  <p>Internships, live industry projects, guest seminars, and corporate mentorship embedded across semesters.</p>
                </div>
              </article>

              <article>
                <Icon name="laptop" size={24} />
                <div>
                  <h3>Practical Laboratories</h3>
                  <p>Dedicated computer laboratories, analytics tools, and case-study presentations rather than pure textbook memorization.</p>
                </div>
              </article>

              <article>
                <Icon name="user" size={24} />
                <div>
                  <h3>Career Guidance & Placement Cell</h3>
                  <p>Resume workshops, mock interviews, and active liaison with top organizations in Bangalore and pan-India.</p>
                </div>
              </article>
            </div>

            <button className="btn btn-ghost" onClick={() => onNavigate('/about')}>
              Discover Institution Leadership <Icon name="arrow" size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* RECRUITERS LOGO GRID */}
      <section className="section logo-section">
        <div className="container">
          <div className="logo-heading">
            <div>
              <span className="eyebrow">Placement Partners</span>
              <h2>Organizations where our alumni work.</h2>
            </div>
            <p>Industry connections built through continuous corporate engagement and internship tracks.</p>
          </div>

          <div className="logo-grid">
            {employers.map((emp, i) => (
              <div key={i} className="logo-tile">
                <img src={emp.logoUrl || emp[1]} alt={emp.name || emp[0]} loading="lazy" />
                <span>{emp.name || emp[0]}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CAREER BAND */}
      <section className="section section-dark">
        <div className="container career-band">
          <div>
            <span className="eyebrow light">Career Progression</span>
            <h2>From degree selection to career launch, keep the journey connected.</h2>
            <p>Connect fundamental academic concepts with applied certifications and placement readiness from semester one.</p>
          </div>
          <div className="career-steps">
            <div>
              <span>01</span>
              <strong>Foundations</strong>
              <small>University syllabus & core academic understanding</small>
            </div>
            <div>
              <span>02</span>
              <strong>Applied Skills</strong>
              <small>Specializations, labs & industry certifications</small>
            </div>
            <div>
              <span>03</span>
              <strong>Experience</strong>
              <small>Internships, presentations & live project work</small>
            </div>
            <div>
              <span>04</span>
              <strong>Placement</strong>
              <small>Campus drives, corporate interviews & placement support</small>
            </div>
          </div>
        </div>
      </section>

      {/* CERTIFICATIONS PREVIEW */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Upskilling</span>
            <h2>Professional Certifications</h2>
            <p>High-impact, modular skill certifications pursued alongside or following degree programs.</p>
          </div>

          <div className="cert-preview">
            {certifications.slice(0, 6).map((c, i) => (
              <article key={i} className="cert-card">
                <span className="cert-group">{c.group}</span>
                <h3>{c.title}</h3>
                <p>{c.text}</p>
                <div>
                  <span>{c.duration}</span>
                  <a
                    href="/apply"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate('/apply');
                    }}
                  >
                    Enquire <Icon name="arrow" size={14} />
                  </a>
                </div>
              </article>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '36px' }}>
            <button className="btn btn-ghost" onClick={() => onNavigate('/certifications')}>
              Explore All 10 Professional Certifications <Icon name="arrow" size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ADMISSIONS PREVIEW */}
      <section className="section section-tint">
        <div className="container admissions-preview">
          <div>
            <span className="eyebrow">Admissions 2026-27</span>
            <h2>Your online application journey, simplified.</h2>
            <p>
              Submit your profile, choose your degree preference, upload documents securely, and follow progress with
              a single institutional reference number.
            </p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button className="btn btn-primary" onClick={() => onNavigate('/apply')}>
                Start Online Application <Icon name="arrow" size={16} />
              </button>
              <button className="btn btn-ghost" onClick={() => onNavigate('/track')}>
                Track Existing Application
              </button>
            </div>
          </div>

          <div className="process-card">
            <div className="process-line">
              <span className="active">1</span>
              <div>
                <strong>Explore & Apply</strong>
                <small>Select degree and complete profile form</small>
              </div>
            </div>
            <div className="process-line">
              <span>2</span>
              <div>
                <strong>Verification</strong>
                <small>Upload 10th & 12th marks cards securely</small>
              </div>
            </div>
            <div className="process-line">
              <span>3</span>
              <div>
                <strong>Committee Review</strong>
                <small>Admissions committee evaluates credentials</small>
              </div>
            </div>
            <div className="process-line">
              <span>4</span>
              <div>
                <strong>Offer & Enrollment</strong>
                <small>Receive provisional offer and complete fee payment</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LATEST NEWS */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Institutional Updates</span>
            <h2>Latest News & Articles</h2>
          </div>

          <div className="news-grid">
            {news.map((item, idx) => (
              <a
                key={idx}
                className="news-card"
                href={`/news/${item.slug}`}
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate(`/news/${item.slug}`);
                }}
              >
                <span className="news-meta">
                  {item.category} &middot; {item.date}
                </span>
                <h3>{item.title}</h3>
                <p>{item.summary || item.content.slice(0, 110) + '...'}</p>
                <span className="text-link">
                  Read Article <Icon name="arrow" size={14} />
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* VIDEO SHOWCASE SECTION */}
      <VideoShowcase />

      {/* GEOSPATIAL CAMPUS MAP */}
      <CampusMap />

      {/* CTA SECTION */}
      <section className="cta-section">
        <div className="container cta-grid">
          <div>
            <span className="eyebrow light">Next Steps</span>
            <h2>Take the first step toward a future-proof career.</h2>
            <p>Schedule a personal campus tour, consult our admissions counselors, or start an online application.</p>
          </div>
          <div>
            <button className="btn btn-white" onClick={() => onNavigate('/apply')}>
              Apply Online Now <Icon name="arrow" size={16} />
            </button>
            <button className="btn btn-outline-white" onClick={() => onNavigate('/visit')}>
              Plan a Campus Visit
            </button>
          </div>
        </div>
      </section>

      {/* CAMPUS PULSE DRAWER */}
      <CampusPulseDrawer
        isOpen={pulseOpen}
        onClose={() => setPulseOpen(false)}
        onNavigate={onNavigate}
      />

      {/* FLOATING QUICK PULSE TRIGGER BUTTON */}
      <button
        type="button"
        onClick={() => setPulseOpen(true)}
        className="floating-pulse-btn"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 90,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: '#0b132b',
          color: '#ffffff',
          border: '1px solid rgba(234, 88, 12, 0.4)',
          borderRadius: '9999px',
          padding: '12px 20px',
          boxShadow: '0 12px 30px rgba(0,0,0,0.3)',
          cursor: 'pointer',
          fontWeight: 700,
          fontSize: '13px',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        title="Open Live Campus Pulse"
      >
        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ea580c', display: 'inline-block' }} />
        <span>Campus Pulse</span>
        <span style={{ background: '#ea580c', color: '#fff', fontSize: '10px', padding: '2px 7px', borderRadius: '9999px', fontWeight: 800 }}>LIVE</span>
      </button>
    </>
  );
};
