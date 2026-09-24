import React from 'react';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const handleNav = (path: string, e: React.MouseEvent) => {
    e.preventDefault();
    onNavigate(path);
  };

  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <div className="brand-copy">
            <strong style={{ color: '#fff', fontSize: '22px' }}>Deekshaam</strong>
            <span style={{ color: '#888' }}>Business School</span>
          </div>
          <p style={{ marginTop: '14px', lineHeight: '1.6' }}>
            Managed by Deeksha Education Trust (Founded 2021). Providing work-integrated undergraduate education,
            hands-on laboratories, and professional career certifications in Bengaluru.
          </p>
          <div className="footer-chip">
            AICTE Approved &middot; Bengaluru North University Affiliated
          </div>
        </div>

        <div>
          <h4>Undergraduate</h4>
          <a href="/programs/bba" onClick={(e) => handleNav('/programs/bba', e)}>Bachelor of Business Admin (BBA)</a>
          <a href="/programs/bca" onClick={(e) => handleNav('/programs/bca', e)}>Bachelor of Computer Apps (BCA)</a>
          <a href="/programs/bcom" onClick={(e) => handleNav('/programs/bcom', e)}>Bachelor of Commerce (B.Com)</a>
          <a href="/certifications" onClick={(e) => handleNav('/certifications', e)}>Professional Certifications</a>
          <a href="/compare" onClick={(e) => handleNav('/compare', e)}>Compare Degree Programs</a>
        </div>

        <div>
          <h4>Admissions</h4>
          <a href="/admissions" onClick={(e) => handleNav('/admissions', e)}>Admissions Process</a>
          <a href="/apply" onClick={(e) => handleNav('/apply', e)}>Online Application Portal</a>
          <a href="/track" onClick={(e) => handleNav('/track', e)}>Track Application Status</a>
          <a href="/visit" onClick={(e) => handleNav('/visit', e)}>Schedule Campus Visit</a>
          <a href="/contact" onClick={(e) => handleNav('/contact', e)}>Speak with Admissions</a>
        </div>

        <div>
          <h4>Campus & Life</h4>
          <a href="/about" onClick={(e) => handleNav('/about', e)}>About the Institution</a>
          <a href="/placements" onClick={(e) => handleNav('/placements', e)}>Placements & Recruiters</a>
          <a href="/campus" onClick={(e) => handleNav('/campus', e)}>Campus Infrastructure</a>
          <a href="/news" onClick={(e) => handleNav('/news', e)}>News & Articles</a>
          <a href="/events" onClick={(e) => handleNav('/events', e)}>Campus Events</a>
        </div>

        <div>
          <h4>Administration</h4>
          <a href="/admin/login" onClick={(e) => handleNav('/admin/login', e)}>Staff sign in</a>
          <a href="/contact" onClick={(e) => handleNav('/contact', e)}>Grievance & Support</a>
          <a href="/privacy" onClick={(e) => handleNav('/privacy', e)}>Privacy Policy</a>
          <a href="/terms" onClick={(e) => handleNav('/terms', e)}>Terms & Conditions</a>
          <a href="/sitemap.xml" target="_blank">XML Sitemap</a>
        </div>
      </div>

      <div className="container footer-bottom">
        <span>&copy; {new Date().getFullYear()} Deekshaam Business School. All rights reserved.</span>
        <span>Venkatpura, Kundana, Devanahalli Taluk, Bangalore - 562110</span>
      </div>
    </footer>
  );
};
