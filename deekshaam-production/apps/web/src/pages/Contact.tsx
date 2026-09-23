import React, { useState, useEffect } from 'react';
import { Icon } from '@deekshaam/ui';
import { api } from '../services/api';
import { SEOHead } from '../components/SEOHead';
import { NotificationModal } from '../components/NotificationModal';

interface ContactProps {
  onNavigate: (path: string) => void;
}

export const Contact: React.FC<ContactProps> = ({ onNavigate }) => {
  const [settings, setSettings] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    program: 'BCA',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    api.getSettings().then(setSettings).catch(console.error);
    api.trackEvent({ eventType: 'page_view', pagePath: '/contact' }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.submitEnquiry({
        ...formData,
        sourcePage: '/contact',
      });
      setSubmitted(true);
    } catch (err: any) {
      setErrorMessage(`Submission failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEOHead
        title="Contact & Admissions Enquiry"
        description="Get in touch with Deekshaam Business School admissions office. Request a callback or send an enquiry."
        canonicalPath="/contact"
      />

      <section className="page-hero compact">
        <div className="container">
          <span className="eyebrow">Connect With Us</span>
          <h1>Contact Deekshaam Business School</h1>
          <p>Admissions counseling, campus visits, document verification, and academic guidance start here.</p>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.2fr', gap: '40px' }}>
          {/* CONTACT CARDS */}
          <div style={{ display: 'grid', gap: '16px', alignContent: 'start' }}>
            <div className="info-card">
              <Icon name="phone" size={24} color="var(--orange)" />
              <span className="eyebrow" style={{ marginTop: '8px' }}>Admissions Hotline</span>
              <h3>{settings?.phone || '+91 8971435297'}</h3>
              <a href={`tel:${settings?.phone || '+918971435297'}`} className="text-link">
                Call Admissions Directly <Icon name="arrow" size={14} />
              </a>
            </div>

            <div className="info-card">
              <Icon name="message" size={24} color="var(--orange)" />
              <span className="eyebrow" style={{ marginTop: '8px' }}>Official Email</span>
              <h3>{settings?.admissionEmail || 'admission@deekshaedu.in'}</h3>
              <a href={`mailto:${settings?.admissionEmail || 'admission@deekshaedu.in'}`} className="text-link">
                Send an Email Query <Icon name="arrow" size={14} />
              </a>
            </div>

            <div className="info-card">
              <Icon name="map" size={24} color="var(--orange)" />
              <span className="eyebrow" style={{ marginTop: '8px' }}>Campus Address</span>
              <p style={{ margin: '6px 0 12px', fontSize: '14px', lineHeight: '1.5' }}>
                {settings?.address || 'MY Samruddhi Nagar, Venkatapura Village, PO-Kundana Hobli, Devanahalli Taluk, Bangalore - 562110'}
              </p>
              <a
                href={`https://www.google.com/maps/place/Deekshaam+Business+School/@${settings?.coordinates || '13.2611403,77.5988094'},17z`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-link"
              >
                Open Google Maps Directions <Icon name="arrow" size={14} />
              </a>
            </div>
          </div>

          {/* CALLBACK FORM */}
          {!submitted ? (
            <form className="enquiry-form" onSubmit={handleSubmit}>
              <span className="eyebrow">Request a Callback</span>
              <h2>Speak with an Admissions Advisor</h2>
              <p style={{ color: '#666', marginBottom: '24px' }}>
                Leave your details below and our counselors will get in touch to assist with degree selection and admissions.
              </p>

              <div className="form-grid">
                <label>
                  Full Name *
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Ananya Rao"
                    required
                  />
                </label>
                <label>
                  Mobile Number *
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="10-digit mobile number"
                    required
                  />
                </label>
                <label>
                  Email Address
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@example.com"
                  />
                </label>
                <label>
                  Program of Interest *
                  <select
                    value={formData.program}
                    onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                  >
                    <option value="BCA">Bachelor of Computer Applications (BCA)</option>
                    <option value="BBA">Bachelor of Business Administration (BBA)</option>
                    <option value="B.Com">Bachelor of Commerce (B.Com)</option>
                    <option value="Professional Certification">Professional Certifications</option>
                  </select>
                </label>
              </div>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '16px' }}>
                Specific Question or Message
                <textarea
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="I would like to know more about eligibility, semester fees, hostel availability..."
                />
              </label>

              <label className="consent">
                <input type="checkbox" required />
                <span>I agree to be contacted by Deekshaam regarding this enquiry.</span>
              </label>

              <button type="submit" className="btn btn-primary full" disabled={loading}>
                {loading ? 'Submitting...' : 'Request Admissions Callback'} <Icon name="arrow" size={16} />
              </button>
            </form>
          ) : (
            <div className="enquiry-form success-state">
              <Icon name="check" size={48} color="var(--green)" />
              <h2 style={{ fontSize: '28px', margin: '14px 0 8px' }}>Enquiry Received Successfully</h2>
              <p style={{ color: '#555', maxWidth: '440px', margin: '0 auto 24px' }}>
                Our admissions department will follow up with you at <strong>{formData.phone}</strong> regarding your interest in{' '}
                <strong>{formData.program}</strong>.
              </p>
              <button className="btn btn-primary" onClick={() => setSubmitted(false)}>
                Submit Another Enquiry
              </button>
            </div>
          )}
        </div>
      </section>

      {errorMessage && (
        <NotificationModal
          isOpen={true}
          title="Admissions Enquiry Notice"
          message={errorMessage}
          type="error"
          onClose={() => setErrorMessage(null)}
        />
      )}
    </>
  );
};
