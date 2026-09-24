import React, { useState } from 'react';
import { Icon } from '@deekshaam/ui';
import { Dialog } from '../components/Dialog';
import { clearAuthToken } from '../services/api';
import { roleLabels, workspaceModules, canAccess } from './access';
interface AdminLayoutProps { currentTab: string; onSelectTab: (tab: string) => void; currentUser: any; onLogout: () => void; onNavigatePublic: (path: string) => void; children: React.ReactNode; }
export const AdminLayout: React.FC<AdminLayoutProps> = ({ currentTab, onSelectTab, currentUser, onLogout, onNavigatePublic, children }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const role = currentUser?.role || '';
  const items = workspaceModules.filter(item => canAccess(role, item.id));
  const navigation = <><div className="workspace-brand"><img src="/favicon.svg" alt="" /><div><strong>Deekshaam</strong><small>CAMPUS WORKSPACE</small></div></div><nav className="admin-nav" aria-label="Workspace navigation">{['Workspace', 'Student services', 'Website', 'Administration'].map(group => <React.Fragment key={group}>{items.some(item => item.group === group) && <span className="workspace-group">{group}</span>}{items.filter(item => item.group === group).map(item => <button key={item.id} aria-current={currentTab === item.id ? 'page' : undefined} className={currentTab === item.id ? 'active' : ''} onClick={() => { onSelectTab(item.id); setMenuOpen(false); }}><Icon name={item.icon} size={18} /><span>{item.label}</span></button>)}</React.Fragment>)}</nav><button className="workspace-public" onClick={() => onNavigatePublic('/')}><Icon name="arrow" size={16} /> View public website</button></>;
  return <div className="admin-shell"><aside className="admin-sidebar">{navigation}</aside><Dialog open={menuOpen} onClose={() => setMenuOpen(false)} label="Workspace navigation" className="workspace-drawer"><button className="icon-btn" aria-label="Close workspace menu" onClick={() => setMenuOpen(false)}><Icon name="close" size={20} /></button>{navigation}</Dialog><div className="admin-main">
    <header className="admin-header"><div className="workspace-breadcrumb"><button className="icon-btn workspace-menu" aria-label="Open workspace menu" onClick={() => setMenuOpen(true)}><Icon name="menu" size={22} /></button><span>Workspace <span>/</span> <strong>{workspaceModules.find(m => m.id === currentTab)?.label || 'Overview'}</strong></span></div><div className="workspace-account"><span className="workspace-avatar">{currentUser?.name?.charAt(0) || 'D'}</span><div><strong>{currentUser?.name}</strong><small>{roleLabels[role] || role}</small></div><button className="btn btn-ghost small" onClick={() => { clearAuthToken(); onLogout(); }}><Icon name="logout" size={16} /><span>Sign out</span></button></div></header>
    <main className="admin-content">{children}</main><footer className="workspace-footer">Deekshaam Business School <span>Staff workspace</span></footer>
  </div></div>;
};
