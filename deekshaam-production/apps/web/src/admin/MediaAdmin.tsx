import React, { useEffect, useState } from 'react';
import { Icon } from '@deekshaam/ui';
import { api } from '../services/api';
import { VideoItem } from '../components/VideoShowcase';
import { Dialog } from '../components/Dialog';
import { SiteImage } from '../components/SiteImage';
import { useAdminFeedback } from './AdminFeedback';
const emptyVideo = { id: '', url: '', title: '', category: 'Campus life', duration: '', description: '' };
function youtubeId(value: string) {
  if (/^[a-zA-Z0-9_-]{11}$/.test(value.trim())) return value.trim();
  try { const url = new URL(value); if (!['www.youtube.com', 'youtube.com', 'youtu.be'].includes(url.hostname)) return null; const id = url.hostname === 'youtu.be' ? url.pathname.slice(1) : url.searchParams.get('v') || url.pathname.split('/')[2]; return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null; } catch { return null; }
}
export const MediaAdmin: React.FC = () => {
  const notify = useAdminFeedback();
  const [tab, setTab] = useState('files');
  const [files, setFiles] = useState<any[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(emptyVideo);
  const [error, setError] = useState('');
  useEffect(() => { Promise.all([api.getMedia(), api.getVideos()]).then(([media, clips]) => { setFiles(media); setVideos(clips); }).catch(err => setError(err.message)).finally(() => setLoading(false)); }, []);
  const saveVideos = async (next: VideoItem[]) => { setBusy(true); try { setVideos(await api.updateVideos(next)); notify('Video library updated. Videos also appear on the selected public page.'); return true; } catch (err: any) { notify(err.message); return false; } finally { setBusy(false); } };
  const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    const body = new FormData(); body.append('file', file); body.append('category', 'General'); body.append('altText', file.name);
    setBusy(true); try { await api.uploadMedia(body); setFiles(await api.getMedia()); notify('Your file is ready to use.'); } catch (err: any) { notify(err.message); } finally { setBusy(false); event.target.value = ''; }
  };
  const addVideo = async (event: React.FormEvent) => {
    event.preventDefault(); const id = youtubeId(form.url); if (!id) { setError('Enter a valid YouTube URL or video ID.'); return; }
    const video = { id: form.id || crypto.randomUUID(), youtubeId: id, title: form.title.trim(), category: form.category, duration: form.duration, description: form.description };
    if (await saveVideos(form.id ? videos.map(item => item.id === form.id ? video : item) : [...videos, video])) { setEditing(false); setForm(emptyVideo); setError(''); }
  };
  return <div><div className="workspace-page-heading admin-toolbar"><div><h1>Media library</h1><p>Keep campus images, downloadable files and videos in one place.</p></div>{tab === 'files' ? <label className="btn btn-primary">{busy ? 'Uploading...' : 'Upload a file'}<input className="visually-hidden" type="file" disabled={busy} onChange={upload} accept="image/*,.pdf" /></label> : <button className="btn btn-primary" disabled={busy || videos.length >= 50} onClick={() => { setError(''); setEditing(true); }}>Add a video</button>}</div>
    <div className="workspace-tabs">{['files', 'videos'].map(item => <button key={item} aria-pressed={tab === item} className={tab === item ? 'selected' : ''} onClick={() => setTab(item)}>{item === 'files' ? 'Images & files' : 'Campus videos'} <span>{item === 'files' ? files.length : videos.length}</span></button>)}</div>
    {error && !editing && <div role="alert" className="inline-feedback error">{error}</div>}
    {loading ? <div className="admin-card" role="status">Loading your library...</div> : tab === 'files' ? <div>{!files.length ? <div className="workspace-empty"><Icon name="laptop" size={32} /><h2>A home for your campus media.</h2><p>Upload an image or PDF, then copy its URL to use it in your content.</p></div> : <div className="workspace-media-grid">{files.map(file => <article className="admin-card media-file" key={file.id}>{file.mimeType?.startsWith('image/') ? <SiteImage src={file.url} alt={file.altText || file.originalName} /> : <div className="media-document"><Icon name="document" size={36} /></div>}<h3>{file.originalName || file.filename || 'Uploaded file'}</h3><button className="text-link" onClick={async () => { try { await navigator.clipboard.writeText(new URL(file.url, window.location.origin).href); notify('File link copied.'); } catch { notify('Could not copy the link. Open the file to copy its address.'); } }}>Copy link</button><a href={file.url} target="_blank" rel="noopener noreferrer">Open file</a></article>)}</div>}</div> : <><p className="workspace-hint">Choose a category when adding a video to place it on Campus Life, Placements or About. The first six also appear on the homepage.</p>{!videos.length && <div className="workspace-empty"><Icon name="laptop" size={32} /><h2>Let your campus tell its story.</h2><p>Add your own YouTube videos. No sample videos are published automatically.</p></div>}<div className="workspace-media-grid">{videos.map((video, index) => <article className="admin-card media-file" key={video.id}><img src={`https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`} alt="" /><span className="eyebrow">{video.category} · {index < 6 ? 'Homepage' : 'Library'}</span><h3>{video.title}</h3><div className="media-actions"><button className="btn btn-ghost small" disabled={busy} onClick={() => { setForm({ id: video.id, url: video.youtubeId, title: video.title, category: video.category, duration: video.duration, description: video.description }); setError(''); setEditing(true); }}>Edit</button><button className="btn btn-ghost small" disabled={busy || index === 0} onClick={() => { const next = [...videos]; [next[index-1], next[index]] = [next[index], next[index-1]]; saveVideos(next); }}>Move up</button><button className="btn btn-ghost small" disabled={busy} onClick={() => saveVideos(videos.filter(v => v.id !== video.id))}>Remove</button></div></article>)}</div></>}
    <Dialog open={editing} onClose={() => { if (!busy) setEditing(false); }} label={form.id ? 'Edit video' : 'Add a campus video'} className="workspace-editor"><div className="workspace-editor-body"><h2>{form.id ? 'Edit video' : 'Add a campus video'}</h2><p className="workspace-hint">Use a video published on your YouTube channel.</p>{error && <div className="inline-feedback error" role="alert">{error}</div>}<form className="staff-login-form" onSubmit={addVideo}><label>YouTube link or video ID<input required value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} /></label><label>Video title<input required maxLength={180} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></label><label>Show on page<select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}><option value="Campus life">Campus Life</option><option value="Career stories">Placements</option><option value="Our story">About</option></select></label><label>Duration (optional)<input placeholder="e.g. 03:20" maxLength={20} value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} /></label><label>Short description<textarea maxLength={1000} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></label><div className="media-actions"><button type="button" className="btn btn-ghost" disabled={busy} onClick={() => setEditing(false)}>Cancel</button><button className="btn btn-primary" disabled={busy}>{busy ? 'Saving...' : form.id ? 'Save video' : 'Add to library'}</button></div></form></div></Dialog>
  </div>;
};
