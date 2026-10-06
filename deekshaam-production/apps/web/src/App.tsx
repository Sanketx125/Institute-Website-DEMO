import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { SearchModal } from './components/SearchModal';
import { AIChatbot } from './components/AIChatbot';
import { SEOHead } from './components/SEOHead';
import { track } from './services/track';
import { MobileActionBar } from './components/MobileActionBar';

// Public Pages
import { Home } from './pages/Home';
import { Programs } from './pages/Programs';
import { Jobs } from './pages/Jobs';
import { JobDetail } from './pages/JobDetail';
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
import { EventDetail } from './pages/EventDetail';
import { VideoDetail } from './pages/VideoDetail';
import { Events } from './pages/Events';
import { Gallery } from './pages/Gallery';

// Admin System
import { canAccess } from './admin/access';
import { WorkspaceHome } from './admin/WorkspaceHome';
import { AdminFeedbackProvider } from './admin/AdminFeedback';
import { AdminLogin } from './admin/AdminLogin';
import { AdminLayout } from './admin/AdminLayout';
import { Dashboard } from './admin/Dashboard';
import { AnalyticsAdmin } from './admin/AnalyticsAdmin';
import { SiteSettingsAdmin } from './admin/SiteSettingsAdmin';
import { MediaAdmin } from './admin/MediaAdmin';
import { ProgramsAdmin } from './admin/ProgramsAdmin';
import { NoticesAdmin } from './admin/NoticesAdmin';
import { EditorialAdmin } from './admin/EditorialAdmin';
import { NewsAdmin } from './admin/NewsAdmin';
import { AdmissionsAdmin } from './admin/AdmissionsAdmin';
import { LeadsAdmin } from './admin/LeadsAdmin';
import { PaymentsAdmin } from './admin/PaymentsAdmin';
import { UsersAdmin } from './admin/UsersAdmin';
import { AuditLogsAdmin } from './admin/AuditLogsAdmin';
import { AgentDashboard } from './admin/AgentDashboard';
import { AgentAdmissions } from './admin/AgentAdmissions';
import { AgentPayouts } from './admin/AgentPayouts';
import { AgentProfile } from './admin/AgentProfile';
import { AgentsAdmin } from './admin/AgentsAdmin';
import { CommissionsAdmin } from './admin/CommissionsAdmin';
import { ReferralSettingsAdmin } from './admin/ReferralSettingsAdmin';
import { api, getAuthToken, clearAuthToken } from './services/api';

export const App: React.FC = () => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [searchOpen, setSearchOpen] = useState(false);
  const adminTab = currentPath.split('/')[2] || 'dashboard';
  const setAdminTab = (tab: string) => navigate(`/admin/${tab}`);
  const [authChecking, setAuthChecking] = useState(() => Boolean(getAuthToken()));
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

  // Delegated CTA analytics: any element with data-track="label" (and optional data-track-program)
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-track]');
      if (el) track('cta_click', { label: el.dataset.track, program: el.dataset.trackProgram });
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
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

  // Check auth for admin and staff routes
  useEffect(() => {
    if (currentPath.startsWith('/admin') || ['/login', '/staff', '/staff-login', '/portal'].includes(currentPath)) {
      const token = getAuthToken();
      setAuthTokenState(token);
      if (token) {
        setAuthChecking(true);
        api
          .getCurrentUser()
          .then((u) => setCurrentUser(u))
          .catch(() => {
            clearAuthToken();
            setCurrentUser(null);
            setAuthTokenState(null);
          }).finally(() => setAuthChecking(false));
      } else {
        setAuthChecking(false);
        setCurrentUser(null);
      }
    }
  }, [currentPath]);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path.split('?')[0]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Route Dispatcher
  const renderContent = () => {
    const isLoginRoute = ['/login', '/staff', '/staff-login', '/portal', '/admin/login'].includes(currentPath);

    // Admin & Staff Workspace Routes
    if (currentPath.startsWith('/admin') || isLoginRoute) {
      if (authChecking && !currentUser) return <div className="workspace-loading" role="status">Opening your workspace...</div>;
      const isAuthed = Boolean(authToken && currentUser);

      if (isLoginRoute || !isAuthed) {
        if (isAuthed && isLoginRoute) {
          const target = currentUser?.role === 'AGENT' ? '/admin/agent-dashboard' : '/admin/dashboard';
          navigate(target);
          return null;
        }
        return (
          <AdminLogin
            onLoginSuccess={(user) => {
              const token = getAuthToken();
              setAuthTokenState(token);
              if (user) setCurrentUser(user);
              const target = user?.role === 'AGENT' ? '/admin/agent-dashboard' : '/admin/dashboard';
              navigate(target);
            }}
            onNavigate={navigate}
          />
        );
      }

      const defaultTab = currentUser?.role === 'AGENT' ? 'agent-dashboard' : 'dashboard';
      const selectedTab = canAccess(currentUser?.role, adminTab) ? adminTab : defaultTab;
      return (
        <AdminFeedbackProvider><AdminLayout
          currentTab={selectedTab}
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
          {selectedTab === 'dashboard' && (currentUser?.role === 'SUPER_ADMIN' ? <Dashboard onSelectTab={setAdminTab} /> : <WorkspaceHome user={currentUser} onSelectTab={setAdminTab} />)}
          {selectedTab === 'analytics' && <AnalyticsAdmin />}
          {selectedTab === 'settings' && <SiteSettingsAdmin />}
          {selectedTab === 'media' && <MediaAdmin />}
          {selectedTab === 'programs' && <ProgramsAdmin />}
          {selectedTab === 'news' && <NewsAdmin />}
          {selectedTab === 'notices' && <NoticesAdmin />}
          {selectedTab === 'stories' && <EditorialAdmin kind="stories" />}
          {selectedTab === 'events' && <EditorialAdmin kind="events" />}
          {selectedTab === 'gallery' && <EditorialAdmin kind="gallery" />}
          {selectedTab === 'admissions' && <AdmissionsAdmin />}
          {selectedTab === 'leads' && <LeadsAdmin />}
          {selectedTab === 'payments' && <PaymentsAdmin />}
          {selectedTab === 'users' && <UsersAdmin />}
          {selectedTab === 'audit' && <AuditLogsAdmin />}
          {selectedTab === 'referral-agents' && <AgentsAdmin currentUser={currentUser} />}
          {selectedTab === 'referral-commissions' && <CommissionsAdmin />}
          {selectedTab === 'referral-settings' && <ReferralSettingsAdmin />}
          {selectedTab === 'agent-dashboard' && <AgentDashboard />}
          {selectedTab === 'agent-admissions' && <AgentAdmissions />}
          {selectedTab === 'agent-payouts' && <AgentPayouts />}
          {selectedTab === 'agent-profile' && <AgentProfile />}
        </AdminLayout></AdminFeedbackProvider>
      );
    }

    // Dynamic program route: /programs/:slug
    if (currentPath.startsWith('/programs/') && currentPath.split('/')[2]) {
      const slug = currentPath.split('/')[2];
      return <ProgramDetail slug={slug} onNavigate={navigate} />;
    }

    if (currentPath.startsWith('/jobs/') && currentPath.split('/')[2]) {
      const slug = currentPath.split('/')[2];
      return <JobDetail slug={slug} onNavigate={navigate} />;
    }

    // Dynamic news route: /news/:slug
    if (currentPath.startsWith('/news/') && currentPath.split('/')[2]) {
      const slug = currentPath.split('/')[2];
      return <NewsDetail slug={slug} onNavigate={navigate} />;
    }

    if (currentPath.startsWith('/events/') && currentPath.split('/')[2]) {
      return <EventDetail slug={currentPath.split('/')[2]} onNavigate={navigate} />;
    }

    if (currentPath.startsWith('/videos/') && currentPath.split('/')[2]) {
      return <VideoDetail id={currentPath.split('/')[2]} onNavigate={navigate} />;
    }

    // Static Public Routes
    switch (currentPath) {
      case '/':
        return <Home onNavigate={navigate} />;
      case '/programs':
        return <Programs onNavigate={navigate} />;
      case '/jobs':
        return <Jobs onNavigate={navigate} />;
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
            <SEOHead title="Page not found" noindex />
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

      <div key={isAdminRoute ? 'admin' : currentPath} className={isAdminRoute ? undefined : 'route-fade'}>{renderContent()}</div>

      {!isAdminRoute && <Footer onNavigate={navigate} />}

      {!isAdminRoute && (
        <>
          <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} onNavigate={navigate} />
          <AIChatbot onNavigate={navigate} />
          {currentPath !== '/apply' && currentPath !== '/track' && <MobileActionBar onNavigate={navigate} />}
        </>
      )}
    </div>
  );
};
