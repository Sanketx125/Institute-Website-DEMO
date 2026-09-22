import React from 'react';
import { Icon } from '@deekshaam/ui';
import { SEOHead } from '../components/SEOHead';

interface AdmissionsProps {
  onNavigate: (path: string) => void;
}

export const Admissions: React.FC<AdmissionsProps> = ({ onNavigate }) => {
  const documents = [
    '10th standard marks card and passing certificate',
    '12th standard / Diploma marks card',
    'Recent passport-size color photographs (white background)',
    'Government ID proof (Aadhaar / Voter ID / Passport)',
    'Transfer and Migration Certificate',
    'APAAR / ABC ID as per institutional admission guidelines',
  ];

  const faqs = [
    {
      q: 'Can I apply before my final Class 12 / Board results are announced?',
      a: 'Yes. You can initiate your application with your Class 10 marks and pre-board scores. Provisional admission is granted subject to submission of final passing certificates.',
    },
    {
      q: 'Can I save my application draft and complete it later?',
      a: 'Yes. The application portal includes auto-save and draft resume capabilities so you can return to complete academic details or document uploads.',
    },
    {
      q: 'How do I check the status of my submitted application?',
      a: 'After submitting, you receive a unique institutional reference ID (e.g. DBS-2026-XXXXXX). You can enter this ID on the "Track Application" page anytime to see real-time updates.',
    },
    {
      q: 'Where can I confirm fee structures and hostel accommodation charges?',
      a: 'Contact the admissions counseling desk at +91 8971435297 or book a campus visit to receive the comprehensive fee schedule for your specific intake year.',
    },
  ];

  return (
    <>
      <SEOHead
        title="Admissions 2026-27 | Eligibility & Online Application"
        description="Learn about the undergraduate admissions process, document requirements, and key deadlines at Deekshaam Business School."
        canonicalPath="/admissions"
      />

      <section className="page-hero">
        <div className="container page-hero-grid">
          <div>
            <span className="eyebrow">Admissions 2026-27</span>
            <h1>A clear, transparent path from enquiry to enrollment.</h1>
            <p>
              Understand each stage of the admissions process, prepare your documentation, and submit your application
              online with full tracking support.
            </p>
            <div className="hero-actions">
              <button className="btn btn-primary" onClick={() => onNavigate('/apply')}>
                Start Online Application <Icon name="arrow" size={16} />
              </button>
              <button className="btn btn-ghost" onClick={() => onNavigate('/contact')}>
                Consult Counselors
              </button>
            </div>
          </div>

          <div className="process-card">
            <div className="process-line">
              <span className="active">1</span>
              <div>
                <strong>Choose Degree & Check Eligibility</strong>
                <small>BBA, BCA, or B.Com undergraduate options</small>
              </div>
            </div>
            <div className="process-line">
              <span className="active">2</span>
              <div>
                <strong>Complete Online Application</strong>
                <small>Fill applicant details & education history</small>
              </div>
            </div>
            <div className="process-line">
              <span className="active">3</span>
              <div>
                <strong>Upload Documents</strong>
                <small>10th & 12th credentials verification</small>
              </div>
            </div>
            <div className="process-line">
              <span className="active">4</span>
              <div>
                <strong>Provisional Offer & Enrollment</strong>
                <small>Seat allocation, payment & enrollment</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* REQUIRED DOCUMENTS */}
      <section className="section">
        <div className="container detail-grid">
          <div>
            <div className="section-head">
              <span className="eyebrow">Verification Checklist</span>
              <h2>Required Documentation</h2>
              <p>Prepare digital copies of the following documents before submitting your application.</p>
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

          <aside className="privacy-card">
            <Icon name="shield" size={36} color="var(--orange)" />
            <h3 style={{ marginTop: '14px' }}>Data Privacy & Security</h3>
            <p style={{ lineHeight: '1.6', color: '#555' }}>
              All uploaded applicant marksheets and identity cards are stored in isolated, access-controlled private
              storage. Documents are reviewed exclusively by authorized admissions committee staff and are never made
              public.
            </p>
            <button className="btn btn-primary full" style={{ marginTop: '16px' }} onClick={() => onNavigate('/apply')}>
              Proceed to Application Form <Icon name="arrow" size={16} />
            </button>
          </aside>
        </div>
      </section>

      {/* ADMISSION FAQS */}
      <section className="section section-tint">
        <div className="container" style={{ maxWidth: '840px' }}>
          <div className="section-head" style={{ textAlign: 'center', margin: '0 auto 38px' }}>
            <span className="eyebrow">Frequently Asked Questions</span>
            <h2>Admissions Guidance</h2>
          </div>

          <div className="faq-list">
            {faqs.map((f, i) => (
              <details key={i} open={i === 0}>
                <summary>
                  <span>{f.q}</span>
                  <Icon name="chevron" size={18} />
                </summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};
