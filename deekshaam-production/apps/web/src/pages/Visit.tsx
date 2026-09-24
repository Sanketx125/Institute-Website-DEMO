import React, { useState, useEffect } from 'react';
import { Icon } from '@deekshaam/ui';
import { api } from '../services/api';
import { SEOHead } from '../components/SEOHead';
import { NotificationModal } from '../components/NotificationModal';

interface VisitProps {
  onNavigate: (path: string) => void;
}

export const Visit: React.FC<VisitProps> = ({ onNavigate }) => {
  const [settings, setSettings] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    program: 'BCA',
    preferredDate: '',
    preferredTime: '10:00 AM - 11:00 AM',
    notes: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    api.getSettings().then(setSettings).catch(console.error);
    api.trackEvent({ eventType: 'page_view', pagePath: '/visit' }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.submitCampusVisit(formData);
      setSubmitted(true);
    } catch (err: any) {
      setErrorMessage(`Request failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEOHead
        title="Schedule a Campus Visit"
        description="Book an appointment to tour the Deekshaam Business School campus, inspect student facilities, and meet faculty."
        canonicalPath="/visit"
      />

      <section className="page-hero compact">
        <div className="container">
          <span className="eyebrow">Experience Deekshaam</span>
          <h1>Plan Your Campus Visit</h1>
          <p>Tour our state-of-the-art laboratories, residential hostels, and meet admissions counselors in person.</p>
        </div>
      </section>

      <section className="section section-tint">
        <div className="container visit-layout">
          {/* VISIT FORM */}
          {!submitted ? (
            <form className="visit-form" onSubmit={handleSubmit}>
              <span className="eyebrow">Appointment Booking</span>
              <h2>Select Preferred Date & Time</h2>

              <div className="form-grid" style={{ marginTop: '20px' }}>
                <label>
                  Student / Parent Name *
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Full name"
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
                  Degree of Interest *
                  <select
                    value={formData.program}
                    onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                  >
                    <option value="BCA">BCA - Computer Applications</option>
                    <option value="BBA">BBA - Business Administration</option>
                    <option value="B.Com">B.Com - Commerce</option>
                    <option value="Professional Certification">Professional Certifications</option>
                    <option value="General Campus Tour">General Campus Tour</option>
                  </select>
                </label>
                <label>
                  Preferred Date *
                  <input
                    type="date"
                    value={formData.preferredDate}
                    onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                    required
                  />
                </label>
                <label>
                  Preferred Time Slot *
                  <select
                    value={formData.preferredTime}
                    onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
                  >
                    <option value="10:00 AM - 11:00 AM">10:00 AM - 11:00 AM</option>
                    <option value="11:30 AM - 12:30 PM">11:30 AM - 12:30 PM</option>
                    <option value="02:00 PM - 03:00 PM">02:00 PM - 03:00 PM</option>
                    <option value="03:30 PM - 04:30 PM">03:30 PM - 04:30 PM</option>
                  </select>
                </label>
              </div>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '16px' }}>
                Areas You Wish to Discuss (Optional)
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Programs, residential hostel accommodation, transport routes..."
                />
              </label>

              <label className="consent">
                <input type="checkbox" required />
                <span>I agree to be contacted by Deekshaam admissions to confirm this campus appointment.</span>
              </label>

              <button type="submit" className="btn btn-primary full" disabled={loading}>
                {loading ? 'Submitting...' : 'Request Campus Visit Appointment'} <Icon name="arrow" size={16} />
              </button>
            </form>
          ) : (
            <div className="visit-form success-state">
              <Icon name="check" size={48} color="var(--green)" />
              <h2 style={{ fontSize: '28px', margin: '14px 0 8px' }}>Campus Visit Request Confirmed</h2>
              <p style={{ color: '#555', maxWidth: '440px', margin: '0 auto 24px' }}>
                Our admissions coordinator will contact you at <strong>{formData.phone}</strong> to confirm your slot on{' '}
                <strong>{formData.preferredDate}</strong>.
              </p>
              <button className="btn btn-primary" onClick={() => setSubmitted(false)}>
                Book Another Visit
              </button>
            </div>
          )}

          {/* ASIDE INFO */}
          <aside
            style={{
              background: 'var(--navy-900)',
              color: '#fff',
              borderRadius: '20px',
              padding: '36px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <span className="eyebrow light">Plan your visit</span>
              <h2 style={{ fontSize: '28px', margin: '8px 0 16px' }}>See the campus in person.</h2>
              <p style={{ color: '#aaa', lineHeight: '1.6' }}>
                A campus visit allows students and parents to evaluate computer laboratories, lecture halls, residential
                facilities, and have one-on-one sessions with our academic deans.
              </p>

              <div style={{ marginTop: '28px', display: 'grid', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <Icon name="map" size={20} color="var(--orange)" />
                  <span style={{ fontSize: '14px' }}>
                    {settings?.address || 'Venkatpura, Kundana, Devanhalli Taluk, Bangalore - 562110'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <Icon name="phone" size={20} color="var(--orange)" />
                  <span style={{ fontSize: '14px' }}>{settings?.phone || '+91 8971435297'}</span>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <Icon name="message" size={20} color="var(--orange)" />
                  <span style={{ fontSize: '14px' }}>{settings?.admissionEmail || 'admission@deekshaedu.in'}</span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '36px' }}>
              <a
                className="btn btn-white full"
                href={`https://www.google.com/maps/search/?api=1&query=${settings?.coordinates || '13.2611403,77.5988094'}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open in Google Maps <Icon name="arrow" size={16} />
              </a>
            </div>
          </aside>
        </div>
      </section>

      {errorMessage && (
        <NotificationModal
          isOpen={true}
          title="Visit Request Notice"
          message={errorMessage}
          type="error"
          onClose={() => setErrorMessage(null)}
        />
      )}
    </>
  );
};
