import React, { useEffect, useState } from 'react';
import { Icon } from '@deekshaam/ui';
import { api } from '../services/api';
import { Dialog } from '../components/Dialog';
import { SiteImage } from '../components/SiteImage';
import { useAdminFeedback } from './AdminFeedback';

type Kind = 'stories' | 'events' | 'gallery';
type Item = Record<string, any>;
const labels = { stories: 'Success stories', events: 'Campus events', gallery: 'Photo gallery' };
const singular = { stories: 'story', events: 'event', gallery: 'photo' };
const imageField = { stories: 'imageUrl', events: 'coverImage', gallery: 'imageUrl' };
const blank = (kind: Kind): Item => kind === 'stories'
  ? { name: '', program: '', graduationYear: '', outcome: '', quote: '', imageUrl: '', consentConfirmed: false, status: 'DRAFT' }
  : kind === 'events'
    ? { slug: '', title: '', date: '', time: '', location: '', summary: '', description: '', coverImage: '', status: 'DRAFT' }
    : { title: '', category: 'Campus', imageUrl: '', caption: '', order: 0, status: 'DRAFT' };

export const EditorialAdmin: React.FC<{ kind: Kind }> = ({ kind }) => {
  const notify = useAdminFeedback();
  const [items, setItems] = useState<Item[]>([]);
  const [editing, setEditing] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const load = async () => {
    const next = kind === 'stories' ? await api.getAdminStories() : kind === 'events' ? await api.getAdminEvents() : await api.getAdminGallery();
    setItems(next);
  };
  useEffect(() => { setLoading(true); setError(''); load().catch((err: Error) => setError(err.message)).finally(() => setLoading(false)); }, [kind]);
  const change = (field: string, value: any) => setEditing(current => current && { ...current, [field]: value });
  const save = async (event: React.FormEvent) => {
    event.preventDefault(); if (!editing) return;
    setBusy(true); setError('');
    try {
      const method = kind === 'stories' ? (editing.id ? api.updateStory(editing.id, editing) : api.createStory(editing))
        : kind === 'events' ? (editing.id ? api.updateEvent(editing.id, editing) : api.createEvent(editing))
          : (editing.id ? api.updateGalleryItem(editing.id, editing) : api.createGalleryItem(editing));
      await method; setEditing(null); await load(); notify(`${singular[kind][0].toUpperCase()}${singular[kind].slice(1)} saved.`);
    } catch (err: any) { setError(err.message); } finally { setBusy(false); }
  };
  const setStatus = async (item: Item, status: string) => {
    setBusy(true);
    try {
      const next = { ...item, status };
      if (kind === 'stories') await api.updateStory(item.id, next);
      else if (kind === 'events') await api.updateEvent(item.id, next);
      else await api.updateGalleryItem(item.id, next);
      await load(); notify(status === 'PUBLISHED' ? 'Published on the website.' : 'Removed from the public website.');
    } catch (err: any) { notify(err.message); } finally { setBusy(false); }
  };
  const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    const form = new FormData(); form.append('file', file); form.append('category', kind); form.append('altText', editing?.title || editing?.name || file.name);
    setBusy(true);
    try { const media = await api.uploadMedia(form); change(imageField[kind], media.url); notify('Image uploaded. Save the item to use it on the website.'); }
    catch (err: any) { setError(err.message); } finally { setBusy(false); event.target.value = ''; }
  };
  const field = (key: string, label: string, required = false, type = 'text') => <label key={key}>{label}<input type={type} required={required} value={editing?.[key] ?? ''} onChange={event => change(key, type === 'number' ? Number(event.target.value) : event.target.value)} /></label>;
  const area = (key: string, label: string, required = false) => <label key={key}>{label}<textarea required={required} value={editing?.[key] || ''} onChange={event => change(key, event.target.value)} /></label>;
  return <div>
    <div className="workspace-page-heading admin-toolbar"><div><h1>{labels[kind]}</h1><p>{kind === 'stories' ? 'Share verified student journeys with permission from each student.' : kind === 'events' ? 'Keep dates, details and event photographs current.' : 'Choose the photos shown on Campus Life and the gallery page.'}</p></div><button className="btn btn-primary" onClick={() => { setError(''); setEditing(blank(kind)); }}>Add {singular[kind]} <Icon name="arrow" size={16} /></button></div>
    {error && !editing && <div className="inline-feedback error" role="alert">{error}</div>}
    {loading ? <div className="admin-card" role="status">Loading content...</div> : !items.length ? <div className="workspace-empty"><Icon name="document" size={32} /><h2>Nothing here yet</h2><p>Add your first {singular[kind]} as a draft, review it, then publish it when ready.</p></div> : <div className="editorial-admin-list">{items.map(item => <article className="admin-card editorial-admin-item" key={item.id}>{item[imageField[kind]] && <SiteImage src={item[imageField[kind]]} alt={item.title || item.name} />}<div><span className="eyebrow">{item.status}</span><h2>{item.title || item.name}</h2><p>{kind === 'stories' ? `${item.program} · ${item.outcome}` : kind === 'events' ? `${item.date} · ${item.location}` : item.caption || item.category}</p><div className="media-actions"><button className="btn btn-ghost small" onClick={() => { setError(''); setEditing({ ...item }); }}>Edit</button><button className="btn btn-ghost small" disabled={busy || (kind === 'stories' && !item.consentConfirmed && item.status !== 'PUBLISHED')} onClick={() => setStatus(item, item.status === 'PUBLISHED' ? 'ARCHIVED' : 'PUBLISHED')}>{item.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}</button></div></div></article>)}</div>}
    <Dialog open={!!editing} onClose={() => { if (!busy) setEditing(null); }} label={`Edit ${singular[kind]}`} className="workspace-editor"><div className="workspace-editor-body"><h2>{editing?.id ? `Edit ${singular[kind]}` : `Add ${singular[kind]}`}</h2><p className="workspace-hint">Only published items appear on the public website.</p>{error && <div className="inline-feedback error" role="alert">{error}</div>}<form className="staff-login-form" onSubmit={save}>
      {kind === 'stories' && <>{field('name', 'Student name', true)}{field('program', 'Program', true)}{field('graduationYear', 'Graduation year')}{field('outcome', 'Career outcome / role', true)}{area('quote', 'Student’s own words', true)}</>}
      {kind === 'events' && <>{field('title', 'Event title', true)}{field('slug', 'URL slug', true)}{field('date', 'Date (e.g. 15 Oct 2026)', true)}{field('time', 'Time')}{field('location', 'Location')}{area('summary', 'Short summary', true)}{area('description', 'Full description')}</>}
      {kind === 'gallery' && <>{field('title', 'Photo title', true)}{field('category', 'Category', true)}{area('caption', 'Caption')}{field('order', 'Display order', false, 'number')}</>}
      <label>Image URL<input value={editing?.[imageField[kind]] || ''} required={kind === 'gallery'} onChange={event => change(imageField[kind], event.target.value)} placeholder="Upload below or paste a media library URL" /></label><label className="btn btn-ghost editorial-upload">{busy ? 'Uploading...' : 'Upload an image'}<input className="visually-hidden" type="file" accept="image/*" disabled={busy} onChange={upload} /></label>
      {editing?.[imageField[kind]] && <SiteImage className="editorial-image-preview" src={editing[imageField[kind]]} alt="Preview" />}
      {kind === 'stories' && <label className="editorial-consent"><input type="checkbox" checked={!!editing?.consentConfirmed} onChange={event => change('consentConfirmed', event.target.checked)} />I confirm this student approved publication of their name, quote, career details and image.</label>}
      <label>Visibility<select value={editing?.status || 'DRAFT'} onChange={event => change('status', event.target.value)}><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option><option value="ARCHIVED">Archived</option></select></label>
      <div className="media-actions"><button type="button" className="btn btn-ghost" disabled={busy} onClick={() => setEditing(null)}>Cancel</button><button className="btn btn-primary" disabled={busy}>{busy ? 'Saving...' : 'Save content'}</button></div>
    </form></div></Dialog>
  </div>;
};
