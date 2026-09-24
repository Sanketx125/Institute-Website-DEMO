import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Icon } from '@deekshaam/ui';
import { Dialog } from '../components/Dialog';
import { useAdminFeedback } from './AdminFeedback';
interface Notice { id: string; title: string; date: string; priority: 'NORMAL'|'HIGH'; status: 'PUBLISHED'|'ARCHIVED'; fileUrl: string; }
const blank = (): Notice => ({ id: '', title: '', date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }), priority: 'NORMAL', status: 'PUBLISHED', fileUrl: '' });
export const NoticesAdmin: React.FC = () => {
  const notify = useAdminFeedback();
  const [items, setItems] = useState<Notice[]>([]);
  const [editing, setEditing] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const refresh = () => api.getAdminNotices().then(setItems).catch((err: Error) => setError(err.message)).finally(() => setLoading(false));
  useEffect(() => { refresh(); }, []);
  const save = async (event: React.FormEvent) => {
    event.preventDefault(); if (!editing) return; setBusy(true);
    try { if (editing.id) await api.updateNotice(editing.id, editing); else await api.createNotice(editing); setEditing(null); await refresh(); notify('Campus notice saved.'); }
    catch (err: any) { setError(err.message); }
    finally { setBusy(false); }
  };
  const archive = async (item: Notice) => { setBusy(true); try { await api.updateNotice(item.id, { ...item, status: item.status === 'PUBLISHED' ? 'ARCHIVED' : 'PUBLISHED' }); await refresh(); notify(item.status === 'PUBLISHED' ? 'Notice archived.' : 'Notice published.'); } catch (err: any) { notify(err.message); } finally { setBusy(false); } };
  return <div><div className="workspace-page-heading admin-toolbar"><div><h1>Campus notices</h1><p>Keep important admissions and campus announcements current.</p></div><button className="btn btn-primary" onClick={() => { setError(''); setEditing(blank()); }}>Create a notice <Icon name="arrow" size={16} /></button></div>
    {error && !editing && <div className="inline-feedback error" role="alert">{error}</div>}
    {loading ? <div className="admin-card" role="status">Loading notices...</div> : <div className="admin-card"><div className="table-responsive" role="region" aria-label="Scrollable notices table" tabIndex={0}><table className="data-table"><thead><tr><th>Title</th><th>Date</th><th>Priority</th><th>Status</th><th>Actions</th></tr></thead><tbody>{items.map(item => <tr key={item.id}><td><strong>{item.title}</strong></td><td>{item.date}</td><td><span className={`badge ${item.priority === 'HIGH' ? 'badge-warning' : 'badge-info'}`}>{item.priority === 'HIGH' ? 'Important' : 'Normal'}</span></td><td><span className={`badge ${item.status === 'PUBLISHED' ? 'badge-success' : 'badge-info'}`}>{item.status === 'PUBLISHED' ? 'Published' : 'Archived'}</span></td><td><div className="media-actions"><button className="btn btn-ghost small" onClick={() => { setError(''); setEditing({ ...item }); }}>Edit</button><button className="btn btn-ghost small" disabled={busy} onClick={() => archive(item)}>{item.status === 'PUBLISHED' ? 'Archive' : 'Publish'}</button></div></td></tr>)}</tbody></table></div>{!items.length && <p className="workspace-hint">No notices yet. Create one to show it on the campus noticeboard.</p>}</div>}
    <Dialog open={!!editing} onClose={() => { if (!busy) setEditing(null); }} label={editing?.id ? 'Edit campus notice' : 'Create campus notice'} className="workspace-editor"><div className="workspace-editor-body"><h2>{editing?.id ? 'Edit notice' : 'Create notice'}</h2>{error && <div className="inline-feedback error" role="alert">{error}</div>}<form className="staff-login-form" onSubmit={save}><label>Notice title<input required minLength={5} maxLength={180} value={editing?.title || ''} onChange={e => setEditing(current => current && { ...current, title: e.target.value })} /></label><label>Date<input required value={editing?.date || ''} onChange={e => setEditing(current => current && { ...current, date: e.target.value })} /></label><label>Priority<select value={editing?.priority || 'NORMAL'} onChange={e => setEditing(current => current && { ...current, priority: e.target.value as Notice['priority'] })}><option value="NORMAL">Normal</option><option value="HIGH">Important</option></select></label><label>Status<select value={editing?.status || 'PUBLISHED'} onChange={e => setEditing(current => current && { ...current, status: e.target.value as Notice['status'] })}><option value="PUBLISHED">Published</option><option value="ARCHIVED">Archived</option></select></label><div className="media-actions"><button type="button" className="btn btn-ghost" disabled={busy} onClick={() => setEditing(null)}>Cancel</button><button className="btn btn-primary" disabled={busy}>{busy ? 'Saving...' : 'Save notice'}</button></div></form></div></Dialog>
  </div>;
};
