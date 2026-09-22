import React, { useState, useEffect } from 'react';
import { Icon } from '@deekshaam/ui';
import { api } from '../services/api';
import { SEOHead } from '../components/SEOHead';

interface ProgramDetailProps {
  slug: string;
  onNavigate: (path: string) => void;
}

export const ProgramDetail: React.FC<ProgramDetailProps> = ({ slug, onNavigate }) => {
  const [program, setProgram] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .getProgram(slug)
      .then((data) => {
        setProgram(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });

    api.trackEvent({ eventType: 'page_view', pagePath: `/programs/${slug}` }).catch(() => {});
  }, [slug]);

  if (loading) {
    return <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>Loading program details...</div>;
  }

  if (!program) {
    return (
      <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
        <h2>Program Not Found</h2>
        <p>The requested degree program does not exist or has been relocated.</p>
        <button className="btn btn-primary" onClick={() => onNavigate('/programs')}>
          Return to Programs Catalog
        </button>
      </div>
    );
  }

  const documents = [
    '10th standard marks card & passing certificate',
    '12th standard / Pre-University / Diploma marks card',
    'Recent passport-size color photographs',
    'Government ID proof (Aadhaar / Passport / Voter ID)',
    'Transfer and Migration Certificate',
    'APAAR / ABC ID as per institutional admission guidelines',
  ];

  const courseSchema = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: program.title,
    description: program.summary,
    provider: {
      '@type': 'EducationalOrganization',
      name: 'Deekshaam Business School',
      sameAs: window.location.origin,
    },
    educationalCredentialAwarded: program.code,
    timeRequired: program.duration,
  };

  return (
    <>
      <SEOHead
        title={`${program.code} - ${program.title}`}
        description={program.summary}
        canonicalPath={`/programs/${program.slug}`}
        structuredData={courseSchema}
      />

      {/* PROGRAM HERO */}
      <section className="program-hero">
        <div className="container program-hero-grid">
          <div>
            <div className="crumbs">
              <a href="/programs" onClick={(e) => { e.preventDefault(); onNavigate('/programs'); }}>
                Programs
              </a>
              <span>/</span>
              <span>{program.code}</span>
            </div>
            <span className="eyebrow">Undergraduate Degree Program</span>
            <h1>{program.title}</h1>
            <p className="lead">{program.kicker}</p>
            <p>{program.summary}</p>

            <div className="hero-actions">
              <button className="btn btn-primary" onClick={() => onNavigate(`/apply?program=${program.slug}`)}>
                Apply for {program.code} <Icon name="arrow" size={16} />
              </button>
              <button className="btn btn-ghost" onClick={() => onNavigate('/compare')}>
                Compare All Degrees
              </button>
            </div>
          </div>

          <div className="program-hero-card">
            <img src={program.image} alt={program.title} />
            <div className="facts">
              <div>
                <small>Duration</small>
                <strong>{program.duration}</strong>
              </div>
              <div>
                <small>Mode</small>
                <strong>{program.mode}</strong>
              </div>
              <div>
                <small>Degree Awarded</small>
                <strong>{program.code}</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ANCHOR NAV */}
      <nav className="anchor-nav">
        <div className="container">
          <a href="#overview">Overview</a>
          <a href="#specializations">Specializations</a>
          <a href="#curriculum">Semester Curriculum</a>
          <a href="#careers">Career Pathways</a>
          <a href="#admissions">Admissions & Documents</a>
        </div>
      </nav>

      {/* OVERVIEW */}
      <section className="section" id="overview">
        <div className="container detail-grid">
          <div>
            <span className="eyebrow">Academic Rigor & Practice</span>
            <h2>Learn the theoretical foundations. Apply them in real-world contexts.</h2>
            <p>{program.summary}</p>
            <div className="check-grid">
              {program.highlights?.map((h: string, i: number) => (
                <div key={i}>
                  <Icon name="check" size={16} />
                  <span>{h}</span>
                </div>
              ))}
            </div>
          </div>

          <aside className="info-card">
            <span className="eyebrow">Eligibility Criteria</span>
            <h3>Who Can Apply?</h3>
            <p style={{ marginTop: '8px', lineHeight: '1.6' }}>{program.eligibility}</p>
            <a
              href="/contact"
              className="text-link"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/contact');
              }}
            >
              Verify Eligibility with Admissions <Icon name="arrow" size={15} />
            </a>
          </aside>
        </div>
      </section>

      {/* SPECIALIZATIONS */}
      <section className="section section-tint" id="specializations">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Specialization Tracks</span>
            <h2>Develop depth in high-demand industry domains.</h2>
            <p>Customize your learning path in upper semesters to match your specific career trajectory.</p>
          </div>

          <div className="specialization-grid">
            {program.specializations?.map((s: string, i: number) => (
              <article key={i}>
                <span>Track 0{i + 1}</span>
                <h3>{s}</h3>
                <p>Structured coursework and projects focused on industry relevance and corporate readiness.</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CURRICULUM */}
      <section className="section" id="curriculum">
        <div className="container curriculum-layout">
          <div className="section-head sticky-head">
            <span className="eyebrow">Curriculum Structure</span>
            <h2>Six Semesters of Progressive Learning</h2>
            <p>
              The syllabus progresses from fundamental core knowledge to specialized subjects and real-world project
              work.
            </p>
          </div>

          <div className="semester-list">
            {program.curriculum?.map((semSubjects: string[], semIdx: number) => (
              <details key={semIdx} open={semIdx === 0}>
                <summary>
                  <span>Semester {semIdx + 1}</span>
                  <Icon name="chevron" size={18} />
                </summary>
                <ul>
                  {semSubjects.map((sub: string, subIdx: number) => (
                    <li key={subIdx}>{sub}</li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CAREERS */}
      <section className="section section-dark" id="careers">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow light">Career Outcomes</span>
            <h2>Roles graduates can pursue upon completion.</h2>
            <p>Professional opportunities aligned with this degree and associated industry tracks.</p>
          </div>
          <div className="career-chips">
            {program.careers?.map((car: string, i: number) => (
              <span key={i}>{car}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ADMISSIONS & DOCUMENTS */}
      <section className="section" id="admissions">
        <div className="container detail-grid">
          <div>
            <div className="section-head">
              <span className="eyebrow">Admissions Checklist</span>
              <h2>Documents Required for {program.code} Enrollment</h2>
              <p>Keep these documents ready in digital format (PDF or JPG) for your online application.</p>
            </div>
            <div className="document-list">
              {documents.map((d, i) => (
                <div key={i}>
                  <span>{i + 1}</span>
                  <p>{d}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="apply-side">
            <span className="eyebrow">Next Steps</span>
            <h3>Ready to apply for {program.code}?</h3>
            <p>Complete your online profile, upload credentials, and reserve your seat for the upcoming academic cycle.</p>
            <button
              className="btn btn-primary full"
              style={{ marginTop: '16px' }}
              onClick={() => onNavigate(`/apply?program=${program.slug}`)}
            >
              Start {program.code} Application <Icon name="arrow" size={16} />
            </button>
            <div style={{ marginTop: '16px' }}>
              <a
                href="/visit"
                className="text-link"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('/visit');
                }}
              >
                Plan a Campus Visit First <Icon name="arrow" size={14} />
              </a>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
};
