import React from 'react';
import { Icon } from '@deekshaam/ui';
import { clearAuthToken } from '../services/api';

interface AdminLayoutProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  currentUser: any;
  onLogout: () => void;
  onNavigatePublic: (path: string) => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  onLogout,
  onNavigatePublic,
  children,
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'grid' as const },
    { id: 'settings', label: 'Site Settings', icon: 'settings' as const },
    { id: 'media', label: 'Media Library', icon: 'laptop' as const },
    { id: 'programs', label: 'Programs', icon: 'briefcase' as const },
    { id: 'news', label: 'News & Updates', icon: 'document' as const },
    { id: 'admissions', label: 'Admissions', icon: 'user' as const },
    { id: 'leads', label: 'Enquiries & Visits', icon: 'message' as const },
    { id: 'payments', label: 'Payments', icon: 'check' as const },
    { id: 'users', label: 'Staff Users', icon: 'shield' as const },
    { id: 'audit', label: 'Audit Logs', icon: 'clock' as const },
  ];

  return (
    <div className="admin-shell">
      {/* SIDEBAR */}
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'var(--orange)',
              color: '#fff',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <Icon name="shield" size={20} color="#fff" />
          </div>
          <div>
            <strong style={{ fontSize: '15px' }}>Deekshaam CMS</strong>
            <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Control Center
            </div>
          </div>
        </div>

        <nav className="admin-nav">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={currentTab === item.id ? 'active' : ''}
              onClick={() => onSelectTab(item.id)}
            >
              <Icon name={item.icon} size={18} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div style={{ padding: '16px', borderTop: '1px solid #2b2e32' }}>
          <button
            onClick={() => onNavigatePublic('/')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              width: '100%',
              background: 'rgba(255,255,255,0.05)',
              border: 0,
              padding: '10px 14px',
              borderRadius: '8px',
              color: '#ccc',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            <Icon name="arrow" size={16} /> Public Website
          </button>
        </div>
      </aside>

      {/* MAIN VIEW */}
      <div className="admin-main">
        {/* HEADER */}
        <header className="admin-header">
          <div style={{ fontSize: '14px', color: '#666', fontWeight: 600 }}>
            Active Module: <strong style={{ color: '#111', textTransform: 'capitalize' }}>{currentTab}</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ textAlign: 'right' }}>
              <strong style={{ fontSize: '13px', display: 'block' }}>{currentUser?.name || 'Administrator'}</strong>
              <span className="badge badge-info">{currentUser?.role || 'STAFF'}</span>
            </div>

            <button
              className="btn btn-ghost small"
              onClick={() => {
                clearAuthToken();
                onLogout();
              }}
              title="Sign out of administration workspace"
            >
              <Icon name="logout" size={16} /> Sign Out
            </button>
          </div>
        </header>

        {/* CONTENT */}
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
};
