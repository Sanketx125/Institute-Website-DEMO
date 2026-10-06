import React, { useEffect, useState } from 'react';
import { Icon } from '@deekshaam/ui';
import { api } from '../services/api';
import { VideoItem } from '../components/VideoShowcase';
import { Dialog } from '../components/Dialog';
import { SiteImage } from '../components/SiteImage';
import { useAdminFeedback } from './AdminFeedback';

const emptyVideo = {
  id: '',
  url: '',
  title: '',
  category: 'Campus life',
  duration: '',
  description: '',
  uploadDate: '',
};

function youtubeId(value: string) {
  if (/^[a-zA-Z0-9_-]{11}$/.test(value.trim())) return value.trim();
  try {
    const url = new URL(value);
    if (!['www.youtube.com', 'youtube.com', 'youtu.be'].includes(url.hostname)) return null;
    const id =
      url.hostname === 'youtu.be'
        ? url.pathname.slice(1)
        : url.searchParams.get('v') || url.pathname.split('/')[2];
    return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

export const MediaAdmin: React.FC = () => {
  const notify = useAdminFeedback();
  const [tab, setTab] = useState<'files' | 'videos'>('files');
  const [files, setFiles] = useState<any[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(emptyVideo);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      const [media, clips] = await Promise.all([api.getMedia(), api.getVideos()]);
      setFiles(media || []);
      setVideos(clips || []);
    } catch (err: any) {
      setError(err.message || 'Unable to load media assets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const saveVideos = async (next: VideoItem[]) => {
    setBusy(true);
    try {
      setVideos(await api.updateVideos(next));
      notify('Video library updated. Videos also appear on the selected public page.');
      return true;
    } catch (err: any) {
      notify(err.message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const body = new FormData();
    body.append('file', file);
    body.append('category', 'General');
    body.append('altText', file.name);
    setBusy(true);
    try {
      await api.uploadMedia(body);
      const updatedMedia = await api.getMedia();
      setFiles(updatedMedia || []);
      notify('File uploaded successfully and ready to use.');
    } catch (err: any) {
      notify(err.message || 'File upload failed');
    } finally {
      setBusy(false);
      event.target.value = '';
    }
  };

  const publishToGallery = async (file: any) => {
    setBusy(true);
    try {
      const rawTitle = (file.altText || file.originalName || 'Campus Photo').replace(/\.[^/.]+$/, '');
      const title = rawTitle.length >= 3 ? rawTitle : 'Campus Life Photo';
      await api.createGalleryItem({
        title,
        category: 'Campus',
        imageUrl: file.url,
        caption: file.altText || '',
        status: 'PUBLISHED',
        order: 0,
      });
      notify(`"${title}" published to public Photo Gallery!`);
    } catch (err: any) {
      notify(`Could not add to gallery: ${err.message || 'Error occurred'}`);
    } finally {
      setBusy(false);
    }
  };

  const addVideo = async (event: React.FormEvent) => {
    event.preventDefault();
    const id = youtubeId(form.url);
    if (!id) {
      setError('Enter a valid YouTube URL or video ID.');
      return;
    }
    const video = {
      id: form.id || crypto.randomUUID(),
      youtubeId: id,
      title: form.title.trim(),
      category: form.category,
      duration: form.duration,
      description: form.description,
      uploadDate: form.uploadDate,
    };
    if (
      await saveVideos(
        form.id ? videos.map((item) => (item.id === form.id ? video : item)) : [...videos, video]
      )
    ) {
      setEditing(false);
      setForm(emptyVideo);
      setError('');
    }
  };

  return (
    <div>
      {/* HEADER TOOLBAR WITH CLEAN INLINE CONTROLS */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div>
          <h1 style={{ margin: '0 0 6px', fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>
            Media library
          </h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
            Keep campus images, downloadable files and videos in one place.
          </p>
        </div>

        <div>
          {tab === 'files' ? (
            <label
              className="btn btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                width: 'auto',
                margin: 0,
                cursor: busy ? 'not-allowed' : 'pointer',
              }}
            >
              <Icon name="document" size={16} />
              {busy ? 'Uploading...' : 'Upload a file'}
              <input
                className="visually-hidden"
                type="file"
                disabled={busy}
                onChange={upload}
                accept="image/*,.pdf"
              />
            </label>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', width: 'auto' }}
              disabled={busy || videos.length >= 50}
              onClick={() => {
                setError('');
                setEditing(true);
              }}
            >
              Add a video
            </button>
          )}
        </div>
      </div>

      {/* SEGMENT TABS */}
      <div className="workspace-tabs">
        <button
          type="button"
          aria-pressed={tab === 'files'}
          className={tab === 'files' ? 'selected' : ''}
          onClick={() => setTab('files')}
        >
          Images & files <span>{files.length}</span>
        </button>
        <button
          type="button"
          aria-pressed={tab === 'videos'}
          className={tab === 'videos' ? 'selected' : ''}
          onClick={() => setTab('videos')}
        >
          Campus videos <span>{videos.length}</span>
        </button>
      </div>

      {error && !editing && (
        <div role="alert" className="inline-feedback error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="admin-card" role="status" style={{ textAlign: 'center', padding: '40px' }}>
          Loading your library...
        </div>
      ) : tab === 'files' ? (
        <div>
          {!files.length ? (
            <div className="workspace-empty">
              <Icon name="laptop" size={32} />
              <h2>A home for your campus media.</h2>
              <p>Upload an image or PDF, then copy its URL or add it straight to the Photo Gallery.</p>
            </div>
          ) : (
            <div className="workspace-media-grid">
              {files.map((file) => (
                <article
                  className="admin-card media-file"
                  key={file.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '16px',
                    borderRadius: '12px',
                  }}
                >
                  <div>
                    {file.mimeType?.startsWith('image/') ? (
                      <div
                        style={{
                          height: '160px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          background: '#f1f5f9',
                          marginBottom: '12px',
                        }}
                      >
                        <SiteImage
                          src={file.url}
                          alt={file.altText || file.originalName}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    ) : (
                      <div
                        className="media-document"
                        style={{
                          height: '160px',
                          borderRadius: '8px',
                          display: 'grid',
                          placeItems: 'center',
                          background: '#e9f0f3',
                          color: '#49687d',
                          marginBottom: '12px',
                        }}
                      >
                        <Icon name="document" size={36} />
                      </div>
                    )}

                    <h3
                      style={{
                        margin: '0 0 4px',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#0f172a',
                        wordBreak: 'break-word',
                      }}
                    >
                      {file.originalName || file.filename || 'Uploaded file'}
                    </h3>

                    {file.createdAt && (
                      <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '12px' }}>
                        Uploaded {new Date(file.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    )}
                  </div>

                  {/* ACTION BUTTONS */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '8px',
                      alignItems: 'center',
                      paddingTop: '12px',
                      borderTop: '1px solid #f1f5f9',
                    }}
                  >
                    <button
                      type="button"
                      className="btn btn-ghost small"
                      style={{ padding: '4px 8px', fontSize: '12px' }}
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(new URL(file.url, window.location.origin).href);
                          notify('File link copied.');
                        } catch {
                          notify('Could not copy the link.');
                        }
                      }}
                    >
                      Copy link
                    </button>
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-ghost small"
                      style={{ padding: '4px 8px', fontSize: '12px' }}
                    >
                      Open
                    </a>
                    {file.mimeType?.startsWith('image/') && (
                      <button
                        type="button"
                        className="btn btn-primary small"
                        style={{
                          padding: '4px 10px',
                          fontSize: '12px',
                          marginLeft: 'auto',
                          background: '#0f766e',
                          borderColor: '#0f766e',
                        }}
                        disabled={busy}
                        onClick={() => publishToGallery(file)}
                        title="Publish this image to the public photo gallery"
                      >
                        + Add to Gallery
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          <p className="workspace-hint">
            Choose a category when adding a video to place it on Campus Life, Placements or About. The first six also appear on the homepage.
          </p>
          {!videos.length && (
            <div className="workspace-empty">
              <Icon name="laptop" size={32} />
              <h2>Let your campus tell its story.</h2>
              <p>Add your own YouTube videos. No sample videos are published automatically.</p>
            </div>
          )}
          <div className="workspace-media-grid">
            {videos.map((video, index) => (
              <article className="admin-card media-file" key={video.id} style={{ padding: '16px', borderRadius: '12px' }}>
                <img
                  src={`https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`}
                  alt=""
                  style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '8px', marginBottom: '12px' }}
                />
                <span className="eyebrow" style={{ display: 'block', marginBottom: '6px', fontSize: '11px' }}>
                  {video.category} · {index < 6 ? 'Homepage' : 'Library'}
                </span>
                <h3 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 600 }}>{video.title}</h3>
                <div className="media-actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-ghost small"
                    disabled={busy}
                    onClick={() => {
                      setForm({
                        id: video.id,
                        url: video.youtubeId,
                        title: video.title,
                        category: video.category,
                        duration: video.duration,
                        description: video.description,
                        uploadDate: video.uploadDate || '',
                      });
                      setError('');
                      setEditing(true);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost small"
                    disabled={busy || index === 0}
                    onClick={() => {
                      const next = [...videos];
                      [next[index - 1], next[index]] = [next[index], next[index - 1]];
                      saveVideos(next);
                    }}
                  >
                    Move up
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost small"
                    disabled={busy}
                    onClick={() => saveVideos(videos.filter((v) => v.id !== video.id))}
                  >
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {/* EDIT VIDEO DIALOG */}
      <Dialog
        open={editing}
        onClose={() => {
          if (!busy) setEditing(false);
        }}
        label={form.id ? 'Edit video' : 'Add a campus video'}
        className="workspace-editor"
        preventBackdropClose={true}
        preventEscapeClose={true}
      >
        <div className="workspace-editor-body">
          <h2>{form.id ? 'Edit video' : 'Add a campus video'}</h2>
          <p className="workspace-hint">Use a video published on your YouTube channel.</p>
          {error && (
            <div className="inline-feedback error" role="alert">
              {error}
            </div>
          )}
          <form className="staff-login-form" onSubmit={addVideo}>
            <label>
              YouTube link or video ID
              <input required value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
            </label>
            <label>
              Video title
              <input required maxLength={180} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </label>
            <label>
              Show on page
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="Campus life">Campus Life</option>
                <option value="Career stories">Placements</option>
                <option value="Our story">About</option>
              </select>
            </label>
            <label>
              Duration (optional)
              <input placeholder="e.g. 03:20" maxLength={20} value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
            </label>
            <label>
              Published on YouTube (helps Google show this video in search)
              <input type="date" value={form.uploadDate} onChange={(e) => setForm({ ...form, uploadDate: e.target.value })} />
            </label>
            <label>
              Short description
              <textarea maxLength={1000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </label>
            <div className="media-actions">
              <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => setEditing(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={busy}>
                {busy ? 'Saving...' : form.id ? 'Save video' : 'Add to library'}
              </button>
            </div>
          </form>
        </div>
      </Dialog>
    </div>
  );
};
