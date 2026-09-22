import React, { useState, useEffect } from 'react';
import { Icon } from '@deekshaam/ui';
import { api } from '../services/api';
import { SEOHead } from '../components/SEOHead';

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
            <div className="admission-pill">
              <span /> Admissions open for 2026-27 undergraduate intake
            </div>
            <span className="eyebrow">Work-Integrated Higher Education</span>
            <h1>
              Build the degree.<br />
              <em>Build the career.</em>
            </h1>
            <p className="hero-lead">
              Study business, technology, or commerce in Bengaluru through programs structured around academic
              rigor, applied laboratories, and verifiable career outcomes.
            </p>
            <div className="hero-actions">
              <button className="btn btn-primary" onClick={() => onNavigate('/programs')}>
                Explore Programs <Icon name="arrow" size={16} />
              </button>
              <button className="btn btn-dark" onClick={() => onNavigate('/apply')}>
                Apply Online <Icon name="arrow" size={16} />
              </button>
            </div>
            <div className="hero-quick">
              <div>
                <strong>3</strong>
                <span>UG Programs</span>
              </div>
              <div>
                <strong>10</strong>
                <span>Certifications</span>
              </div>
              <div>
                <strong>{settings?.founded || '2021'}</strong>
                <span>Established</span>
              </div>
            </div>
          </div>

          <div className="hero-media">
            <img
              src={settings?.heroImage || 'https://deekshaedu.in/wp-content/uploads/2025/03/Deekshaam-Buisness-School-Img-1.png'}
              alt="Deekshaam Campus"
            />
            <div className="hero-card">
              <div className="hero-card-icon">
                <Icon name="briefcase" size={22} />
              </div>
              <div>
                <strong>Learning Beyond Classrooms</strong>
                <span>Applied projects, hands-on laboratories, and structured placement pathways.</span>
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
    </>
  );
};
