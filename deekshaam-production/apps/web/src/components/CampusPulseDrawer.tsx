import React, { useState, useEffect } from 'react';
import { Icon } from '@deekshaam/ui';
import { api } from '../services/api';
import { Dialog } from './Dialog';

interface CampusPulseDrawerProps { isOpen: boolean; onClose: () => void; onNavigate: (path: string) => void; }
interface Notice { id: string; title: string; date: string; priority?: string; status?: string; }
export const CampusPulseDrawer: React.FC<CampusPulseDrawerProps> = ({ isOpen, onClose, onNavigate }) => {
  const [posts, setPosts] = useState<Notice[]>([]);
  const [filter, setFilter] = useState('All updates');
  const [status, setStatus] = useState('loading');
  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    setStatus('loading');
    api.getNotices().then(data => { if (active) { setPosts(data.filter((p: Notice) => p.status === 'PUBLISHED')); setStatus('ready'); } }).catch(() => { if (active) setStatus('error'); });
    return () => { active = false; };
  }, [isOpen]);
  const visible = posts.filter(p => filter === 'All updates' || p.priority === 'HIGH');
  return <Dialog open={isOpen} onClose={onClose} label="Campus noticeboard" className="notice-drawer">
    <div className="dialog-heading"><div><span className="eyebrow">Stay in the know</span><h2>Campus noticeboard</h2></div><button className="icon-btn" aria-label="Close noticeboard" onClick={onClose}><Icon name="close" size={20} /></button></div>
    <p className="drawer-intro">Academic notices and announcements, all in one place.</p>
    <div className="location-tabs">{['All updates', 'Important'].map(item => <button key={item} aria-pressed={filter === item} className={filter === item ? 'selected' : ''} onClick={() => setFilter(item)}>{item}</button>)}</div>
    <div className="notice-list" aria-live="polite">
      {status === 'loading' && <p>Loading campus updates...</p>}
      {status === 'error' && <p>We could not load the noticeboard. Please try again later or contact the admissions team.</p>}
      {status === 'ready' && !visible.length && <p>No announcements to show right now. Check back for campus updates.</p>}
      {status === 'ready' && visible.map(post => <article key={post.id}><div className="news-meta">{post.priority === 'HIGH' ? 'Important' : 'Campus update'} <span>{post.date}</span></div><h3>{post.title}</h3></article>)}
    </div>
    <div className="drawer-footer"><button className="text-link" onClick={() => { onClose(); onNavigate('/news'); }}>Explore campus news <Icon name="arrow" size={16} /></button><a href="tel:+918971435297">Need a hand? Call us</a></div>
  </Dialog>;
};
