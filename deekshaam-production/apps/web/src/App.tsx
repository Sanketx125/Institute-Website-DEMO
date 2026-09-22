import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { SearchModal } from './components/SearchModal';
import { AIChatbot } from './components/AIChatbot';

// Public Pages
import { Home } from './pages/Home';
import { Programs } from './pages/Programs';
import { ProgramDetail } from './pages/ProgramDetail';
import { Compare } from './pages/Compare';
import { Certifications } from './pages/Certifications';
import { Admissions } from './pages/Admissions';
import { Apply } from './pages/Apply';
import { Track } from './pages/Track';
import { Visit } from './pages/Visit';
import { Contact } from './pages/Contact';
import { About } from './pages/About';
import { Placements } from './pages/Placements';
import { Campus } from './pages/Campus';
import { News } from './pages/News';
import { NewsDetail } from './pages/NewsDetail';
import { Events } from './pages/Events';
import { Gallery } from './pages/Gallery';

// Admin System
import { AdminLogin } from './admin/AdminLogin';
import { AdminLayout } from './admin/AdminLayout';
import { Dashboard } from './admin/Dashboard';
import { SiteSettingsAdmin } from './admin/SiteSettingsAdmin';
import { MediaAdmin } from './admin/MediaAdmin';
import { ProgramsAdmin } from './admin/ProgramsAdmin';
import { NewsAdmin } from './admin/NewsAdmin';
import { AdmissionsAdmin } from './admin/AdmissionsAdmin';
import { LeadsAdmin } from './admin/LeadsAdmin';
import { PaymentsAdmin } from './admin/PaymentsAdmin';
import { UsersAdmin } from './admin/UsersAdmin';
import { AuditLogsAdmin } from './admin/AuditLogsAdmin';
import { api, getAuthToken, clearAuthToken } from './services/api';

export const App: React.FC = () => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [searchOpen, setSearchOpen] = useState(false);
  const [adminTab, setAdminTab] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [authToken, setAuthTokenState] = useState<string | null>(() => getAuthToken());

  // Sync route on popstate (browser back/forward)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Global Ctrl+K listener for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Check auth for admin routes
  useEffect(() => {
    if (currentPath.startsWith('/admin')) {
      const token = getAuthToken();
      setAuthTokenState(token);
      if (token) {
        api
          .getCurrentUser()
          .then((u) => setCurrentUser(u))
          .catch(() => {
            setCurrentUser(null);
            setAuthTokenState(null);
          });
      } else {
        setCurrentUser(null);
      }
    }
  }, [currentPath]);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Route Dispatcher
  const renderContent = () => {
    // Admin Routes
    if (currentPath.startsWith('/admin')) {
      const isAuthed = Boolean(authToken || getAuthToken() || currentUser);
      if (currentPath === '/admin/login' || !isAuthed) {
        return (
          <AdminLogin
            onLoginSuccess={(user) => {
              const token = getAuthToken();
              setAuthTokenState(token);
              if (user) setCurrentUser(user);
              setAdminTab('dashboard');
              navigate('/admin');
            }}
            onNavigate={navigate}
          />
        );
      }

      return (
        <AdminLayout
          currentTab={adminTab}
          onSelectTab={setAdminTab}
          currentUser={currentUser}
          onLogout={() => {
            clearAuthToken();
            setAuthTokenState(null);
            setCurrentUser(null);
            navigate('/admin/login');
          }}
          onNavigatePublic={navigate}
        >
          {adminTab === 'dashboard' && <Dashboard onSelectTab={setAdminTab} />}
          {adminTab === 'settings' && <SiteSettingsAdmin />}
          {adminTab === 'media' && <MediaAdmin />}
          {adminTab === 'programs' && <ProgramsAdmin />}
          {adminTab === 'news' && <NewsAdmin />}
          {adminTab === 'admissions' && <AdmissionsAdmin />}
          {adminTab === 'leads' && <LeadsAdmin />}
          {adminTab === 'payments' && <PaymentsAdmin />}
          {adminTab === 'users' && <UsersAdmin />}
          {adminTab === 'audit' && <AuditLogsAdmin />}
        </AdminLayout>
      );
    }

    // Dynamic program route: /programs/:slug
    if (currentPath.startsWith('/programs/') && currentPath.split('/')[2]) {
      const slug = currentPath.split('/')[2];
      return <ProgramDetail slug={slug} onNavigate={navigate} />;
    }

    // Dynamic news route: /news/:slug
    if (currentPath.startsWith('/news/') && currentPath.split('/')[2]) {
      const slug = currentPath.split('/')[2];
      return <NewsDetail slug={slug} onNavigate={navigate} />;
    }

    // Static Public Routes
    switch (currentPath) {
      case '/':
        return <Home onNavigate={navigate} />;
      case '/programs':
        return <Programs onNavigate={navigate} />;
      case '/compare':
        return <Compare onNavigate={navigate} />;
      case '/certifications':
        return <Certifications onNavigate={navigate} />;
      case '/admissions':
        return <Admissions onNavigate={navigate} />;
      case '/apply':
        return <Apply onNavigate={navigate} />;
      case '/track':
        return <Track onNavigate={navigate} />;
      case '/visit':
        return <Visit onNavigate={navigate} />;
      case '/contact':
        return <Contact onNavigate={navigate} />;
      case '/about':
        return <About onNavigate={navigate} />;
      case '/placements':
        return <Placements onNavigate={navigate} />;
      case '/campus':
        return <Campus onNavigate={navigate} />;
      case '/news':
        return <News onNavigate={navigate} />;
      case '/events':
        return <Events onNavigate={navigate} />;
      case '/gallery':
        return <Gallery onNavigate={navigate} />;
      default:
        return (
          <div className="container" style={{ padding: '100px 0', textAlign: 'center' }}>
            <h1 style={{ fontSize: '48px', color: 'var(--orange)', marginBottom: '8px' }}>404</h1>
            <h2>Page Not Found</h2>
            <p style={{ color: '#777', margin: '12px 0 24px' }}>
              The page you are looking for does not exist or has been moved.
            </p>
            <button className="btn btn-primary" onClick={() => navigate('/')}>
              Return to Homepage
            </button>
          </div>
        );
    }
  };

  const isAdminRoute = currentPath.startsWith('/admin');

  return (
    <div className="app-root">
      {!isAdminRoute && (
        <Header currentPath={currentPath} onNavigate={navigate} onOpenSearch={() => setSearchOpen(true)} />
      )}

      {renderContent()}

      {!isAdminRoute && <Footer onNavigate={navigate} />}

      {!isAdminRoute && (
        <>
          <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} onNavigate={navigate} />
          <AIChatbot onNavigate={navigate} />
        </>
      )}
    </div>
  );
};
