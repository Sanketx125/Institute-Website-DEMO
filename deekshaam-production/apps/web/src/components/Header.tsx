import React, { useState } from 'react';
import { Icon } from '@deekshaam/ui';

interface HeaderProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenSearch: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentPath, onNavigate, onOpenSearch }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (path: string, e: React.MouseEvent) => {
    e.preventDefault();
    onNavigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* TOPBAR */}
      <div className="topbar">
        <div className="container topbar-inner">
          <div>
            <span>Affiliated with Bengaluru North University & Approved by AICTE, New Delhi</span>
          </div>
          <div>
            <a href="tel:+918971435297">
              <Icon name="phone" size={14} /> +91 8971435297
            </a>
            <a href="mailto:admission@deekshaedu.in">
              <Icon name="message" size={14} /> admission@deekshaedu.in
            </a>
            <a href="/admin" onClick={(e) => handleNav('/admin', e)}>
              <Icon name="user" size={14} /> Admin Portal
            </a>
          </div>
        </div>
      </div>

      {/* STICKY MAIN HEADER */}
      <header className="site-header">
        <div className="container nav-wrap">
          <a href="/" className="brand" onClick={(e) => handleNav('/', e)}>
            <div className="brand-mark">
              <img
                src="https://media.collegedekho.com/media/img/institute/logo/download_4_K3JEM2R.png?width=96"
                alt="DBS Logo"
                className="brand-official"
              />
            </div>
            <div className="brand-copy">
              <strong>Deekshaam</strong>
              <span>Business School</span>
            </div>
          </a>

          {/* DESKTOP NAV */}
          <nav className="desktop-nav">
            <a href="/" className={currentPath === '/' ? 'active' : ''} onClick={(e) => handleNav('/', e)}>
              Home
            </a>

            {/* PROGRAMS MEGA MENU */}
            <div className="nav-item has-menu">
              <a href="/programs" onClick={(e) => handleNav('/programs', e)}>
                Programs <Icon name="chevron" size={14} />
              </a>
              <div className="mega-menu">
                <div>
                  <span className="mega-label">Undergraduate Degrees</span>
                  <a href="/programs/bba" onClick={(e) => handleNav('/programs/bba', e)}>
                    <strong>BBA</strong>
                    <small>Management, analytics and digital business</small>
                  </a>
                  <a href="/programs/bca" onClick={(e) => handleNav('/programs/bca', e)}>
                    <strong>BCA</strong>
                    <small>Software, data, cloud and intelligent systems</small>
                  </a>
                  <a href="/programs/bcom" onClick={(e) => handleNav('/programs/bcom', e)}>
                    <strong>B.Com</strong>
                    <small>Accounting, finance and modern commerce</small>
                  </a>
                </div>
                <div>
                  <span className="mega-label">Special Programs</span>
                  <a href="/certifications" onClick={(e) => handleNav('/certifications', e)}>
                    <strong>Professional Certifications</strong>
                    <small>AI, Cloud, Data, Marketing & Banking</small>
                  </a>
                  <a href="/compare" onClick={(e) => handleNav('/compare', e)}>
                    <strong>Compare Programs</strong>
                    <small>Side-by-side degree comparison</small>
                  </a>
                </div>
              </div>
            </div>

            {/* ADMISSIONS MEGA MENU */}
            <div className="nav-item has-menu">
              <a href="/admissions" onClick={(e) => handleNav('/admissions', e)}>
                Admissions <Icon name="chevron" size={14} />
              </a>
              <div className="mega-menu" style={{ width: '420px' }}>
                <div>
                  <span className="mega-label">Applicant Hub</span>
                  <a href="/admissions" onClick={(e) => handleNav('/admissions', e)}>
                    <strong>Admissions Overview</strong>
                    <small>Process, requirements & key dates</small>
                  </a>
                  <a href="/apply" onClick={(e) => handleNav('/apply', e)}>
                    <strong>Apply Online</strong>
                    <small>Start or continue an application</small>
                  </a>
                  <a href="/track" onClick={(e) => handleNav('/track', e)}>
                    <strong>Track Application</strong>
                    <small>Real-time status tracking</small>
                  </a>
                </div>
                <div>
                  <span className="mega-label">Campus & Guidance</span>
                  <a href="/visit" onClick={(e) => handleNav('/visit', e)}>
                    <strong>Plan a Campus Visit</strong>
                    <small>Tour the campus & meet counselors</small>
                  </a>
                  <a href="/about" onClick={(e) => handleNav('/about', e)}>
                    <strong>For Parents</strong>
                    <small>Recognition, hostels & academic support</small>
                  </a>
                </div>
              </div>
            </div>

            <a href="/placements" className={currentPath === '/placements' ? 'active' : ''} onClick={(e) => handleNav('/placements', e)}>
              Placements
            </a>
            <a href="/campus" className={currentPath === '/campus' ? 'active' : ''} onClick={(e) => handleNav('/campus', e)}>
              Campus Life
            </a>
            <a href="/about" className={currentPath === '/about' ? 'active' : ''} onClick={(e) => handleNav('/about', e)}>
              About
            </a>
            <a href="/contact" className={currentPath === '/contact' ? 'active' : ''} onClick={(e) => handleNav('/contact', e)}>
              Contact
            </a>
          </nav>

          {/* ACTIONS */}
          <div className="nav-actions">
            <button className="icon-btn" onClick={onOpenSearch} title="Search (Ctrl + K)">
              <Icon name="search" size={19} />
            </button>
            <a href="/apply" className="btn btn-primary small" onClick={(e) => handleNav('/apply', e)}>
              Apply Now
            </a>
            <button className="icon-btn menu-open" onClick={() => setMobileMenuOpen(true)}>
              <Icon name="menu" size={24} />
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE DRAWER */}
      <div
        className={`drawer-backdrop ${mobileMenuOpen ? 'show' : ''}`}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 100,
          opacity: mobileMenuOpen ? 1 : 0,
          pointerEvents: mobileMenuOpen ? 'auto' : 'none',
          transition: '0.2s',
        }}
        onClick={() => setMobileMenuOpen(false)}
      />
      <div
        className={`mobile-drawer ${mobileMenuOpen ? 'open' : ''}`}
        style={{
          position: 'fixed',
          right: mobileMenuOpen ? 0 : '-320px',
          top: 0,
          width: '300px',
          height: '100vh',
          background: '#fff',
          zIndex: 101,
          padding: '24px',
          boxShadow: '-10px 0 30px rgba(0,0,0,0.15)',
          transition: '0.3s ease',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong>Menu</strong>
          <button className="icon-btn" onClick={() => setMobileMenuOpen(false)}>
            <Icon name="close" size={20} />
          </button>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '30px' }}>
          <a href="/" onClick={(e) => handleNav('/', e)}>Home</a>
          <a href="/programs" onClick={(e) => handleNav('/programs', e)}>All Programs</a>
          <a href="/programs/bba" onClick={(e) => handleNav('/programs/bba', e)}>— BBA</a>
          <a href="/programs/bca" onClick={(e) => handleNav('/programs/bca', e)}>— BCA</a>
          <a href="/programs/bcom" onClick={(e) => handleNav('/programs/bcom', e)}>— B.Com</a>
          <a href="/certifications" onClick={(e) => handleNav('/certifications', e)}>Certifications</a>
          <a href="/admissions" onClick={(e) => handleNav('/admissions', e)}>Admissions</a>
          <a href="/apply" onClick={(e) => handleNav('/apply', e)}>Apply Online</a>
          <a href="/track" onClick={(e) => handleNav('/track', e)}>Track Application</a>
          <a href="/visit" onClick={(e) => handleNav('/visit', e)}>Plan Campus Visit</a>
          <a href="/placements" onClick={(e) => handleNav('/placements', e)}>Placements</a>
          <a href="/campus" onClick={(e) => handleNav('/campus', e)}>Campus Life</a>
          <a href="/about" onClick={(e) => handleNav('/about', e)}>About Deekshaam</a>
          <a href="/contact" onClick={(e) => handleNav('/contact', e)}>Contact & Support</a>
          <a href="/admin" onClick={(e) => handleNav('/admin', e)} style={{ color: 'var(--orange)', fontWeight: 700 }}>Admin Portal</a>
        </nav>
      </div>
    </>
  );
};
