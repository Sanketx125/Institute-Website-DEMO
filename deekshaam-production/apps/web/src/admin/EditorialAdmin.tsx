import React, { useEffect, useState, useMemo } from 'react';
import { Icon } from '@deekshaam/ui';
import { api } from '../services/api';
import { Dialog } from '../components/Dialog';
import { SiteImage } from '../components/SiteImage';
import { useAdminFeedback } from './AdminFeedback';

type Kind = 'stories' | 'events' | 'gallery';
type Item = Record<string, any>;

const labels: Record<Kind, string> = {
  stories: 'Success stories',
  events: 'Campus events',
  gallery: 'Photo gallery',
};

const singular: Record<Kind, string> = {
  stories: 'story',
  events: 'event',
  gallery: 'photo',
};

const imageField: Record<Kind, string> = {
  stories: 'imageUrl',
  events: 'coverImage',
  gallery: 'imageUrl',
};

const blank = (kind: Kind): Item =>
  kind === 'stories'
    ? { name: '', program: '', graduationYear: '', outcome: '', quote: '', imageUrl: '', consentConfirmed: false, status: 'DRAFT' }
    : kind === 'events'
    ? { slug: '', title: '', date: '', time: '', location: '', summary: '', description: '', coverImage: '', status: 'DRAFT' }
    : { title: '', category: 'Campus', imageUrl: '', caption: '', order: 0, status: 'PUBLISHED' };

export const EditorialAdmin: React.FC<{ kind: Kind }> = ({ kind }) => {
  const notify = useAdminFeedback();
  const [items, setItems] = useState<Item[]>([]);
  const [editing, setEditing] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PUBLISHED' | 'DRAFT' | 'ARCHIVED'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Media picker modal state
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [mediaLibrary, setMediaLibrary] = useState<any[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);

  const load = async () => {
    try {
      const next =
        kind === 'stories'
          ? await api.getAdminStories()
          : kind === 'events'
          ? await api.getAdminEvents()
          : await api.getAdminGallery();
      setItems(next || []);
    } catch (err: any) {
      setError(err.message || 'Unable to load content');
    }
  };

  useEffect(() => {
    setLoading(true);
    setError('');
    setSearch('');
    setStatusFilter('ALL');
    setCategoryFilter('ALL');
    load().finally(() => setLoading(false));
  }, [kind]);

  const openMediaPicker = async () => {
    setMediaPickerOpen(true);
    setLoadingMedia(true);
    try {
      const media = await api.getMedia();
      setMediaLibrary(media || []);
    } catch {
      notify('Unable to load media library items.');
    } finally {
      setLoadingMedia(false);
    }
  };

  const change = (field: string, value: any) =>
    setEditing((current) => current && { ...current, [field]: value });

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    setBusy(true);
    setError('');
    try {
      if (editing.id) {
        if (kind === 'stories') await api.updateStory(editing.id, editing);
        else if (kind === 'events') await api.updateEvent(editing.id, editing);
        else await api.updateGalleryItem(editing.id, editing);
      } else {
        if (kind === 'stories') await api.createStory(editing);
        else if (kind === 'events') await api.createEvent(editing);
        else await api.createGalleryItem(editing);
      }
      setEditing(null);
      await load();
      notify(`${singular[kind][0].toUpperCase()}${singular[kind].slice(1)} saved successfully.`);
    } catch (err: any) {
      setError(err.message || 'Failed to save item');
    } finally {
      setBusy(false);
    }
  };

  const setStatus = async (item: Item, status: string) => {
    setBusy(true);
    try {
      const next = { ...item, status };
      if (kind === 'stories') await api.updateStory(item.id, next);
      else if (kind === 'events') await api.updateEvent(item.id, next);
      else await api.updateGalleryItem(item.id, next);
      await load();
      notify(status === 'PUBLISHED' ? 'Item published on public website.' : 'Item unpublished from public website.');
    } catch (err: any) {
      notify(err.message || 'Unable to update status');
    } finally {
      setBusy(false);
    }
  };

  const deleteItem = async (item: Item) => {
    if (!window.confirm(`Are you sure you want to delete "${item.title || item.name}"?`)) return;
    setBusy(true);
    try {
      if (kind === 'stories') await api.deleteStory(item.id);
      else if (kind === 'events') await api.deleteEvent(item.id);
      else await api.deleteGalleryItem(item.id);
      await load();
      notify(`"${item.title || item.name}" deleted.`);
    } catch (err: any) {
      notify(err.message || 'Unable to delete item');
    } finally {
      setBusy(false);
    }
  };

  const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    form.append('category', kind);
    form.append('altText', editing?.title || editing?.name || file.name);
    setBusy(true);
    try {
      const media = await api.uploadMedia(form);
      change(imageField[kind], media.url);
      notify('Image uploaded and linked.');
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setBusy(false);
      event.target.value = '';
    }
  };

  // Categories list for filtering
  const allCategories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((it) => {
      const cat = it.category || it.program;
      if (cat) set.add(cat);
    });
    return Array.from(set);
  }, [items]);

  // Client-side filtering
  const filteredItems = useMemo(() => {
    return items.filter((it) => {
      if (statusFilter !== 'ALL' && it.status !== statusFilter) return false;
      if (categoryFilter !== 'ALL') {
        const cat = it.category || it.program;
        if (cat !== categoryFilter) return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const titleMatch = (it.title || it.name || '').toLowerCase().includes(q);
        const descMatch = (it.caption || it.summary || it.quote || '').toLowerCase().includes(q);
        if (!titleMatch && !descMatch) return false;
      }
      return true;
    });
  }, [items, statusFilter, categoryFilter, search]);

  const counts = useMemo(() => {
    return {
      all: items.length,
      published: items.filter((i) => i.status === 'PUBLISHED').length,
      draft: items.filter((i) => i.status === 'DRAFT').length,
      archived: items.filter((i) => i.status === 'ARCHIVED').length,
    };
  }, [items]);

  const formatPublishedDate = (item: Item) => {
    const rawDate = item.publishedAt || item.updatedAt || item.createdAt;
    if (!rawDate) return null;
    try {
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) return null;
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return null;
    }
  };

  const field = (key: string, label: string, required = false, type = 'text') => (
    <label key={key}>
      {label} {required && '*'}
      <input
        type={type}
        required={required}
        value={editing?.[key] ?? ''}
        onChange={(event) =>
          change(key, type === 'number' ? Number(event.target.value) : event.target.value)
        }
      />
    </label>
  );

  const area = (key: string, label: string, required = false) => (
    <label key={key}>
      {label} {required && '*'}
      <textarea
        required={required}
        value={editing?.[key] || ''}
        onChange={(event) => change(key, event.target.value)}
      />
    </label>
  );

  return (
    <div>
      {/* HEADER SECTION WITH ACTION BUTTON */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        <div>
          <h1 style={{ margin: '0 0 6px', fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>
            {labels[kind]}
          </h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
            {kind === 'stories'
              ? 'Share verified student journeys with permission from each student.'
              : kind === 'events'
              ? 'Keep dates, details and event photographs current.'
              : 'Choose photographs shown on Campus Life and the public gallery page.'}
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', width: 'auto' }}
          onClick={() => {
            setError('');
            setEditing(blank(kind));
          }}
        >
          Add {singular[kind]} <Icon name="arrow" size={16} />
        </button>
      </div>

      {/* FILTER CONTROLS TOOLBAR */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px',
          padding: '12px 16px',
          background: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
        }}
      >
        {/* LEFT: STATUS SEGMENT PILLS */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: 'All Items', count: counts.all },
            { id: 'PUBLISHED', label: 'Published', count: counts.published },
            { id: 'DRAFT', label: 'Drafts', count: counts.draft },
            { id: 'ARCHIVED', label: 'Archived', count: counts.archived },
          ].map((tab) => {
            const active = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id as any)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  border: active ? '1px solid #0f766e' : '1px solid #e2e8f0',
                  background: active ? '#0f766e' : '#f8fafc',
                  color: active ? 'white' : '#475569',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.label}
                <span
                  style={{
                    fontSize: '10px',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    background: active ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                    color: active ? 'white' : '#64748b',
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* RIGHT: COMPACT SEARCH & CATEGORY FILTER */}
        <div className="admin-toolbar-filter" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {allCategories.length > 0 && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                height: '36px',
                padding: '0 10px',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                background: 'white',
                fontSize: '13px',
                color: '#334155',
              }}
            >
              <option value="ALL">All Categories</option>
              {allCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}

          <div style={{ position: 'relative', width: '220px' }}>
            <span
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Icon name="search" size={14} />
            </span>
            <input
              type="text"
              placeholder={`Search ${labels[kind].toLowerCase()}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '32px' }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '2px 4px',
                  fontSize: '12px',
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {error && !editing && (
        <div className="inline-feedback error" role="alert">
          {error}
        </div>
      )}

      {/* CONTENT DISPLAY: RESPONSIVE PHOTO GRID FOR GALLERY, CARDS FOR OTHERS */}
      {loading ? (
        <div className="admin-card" role="status" style={{ textAlign: 'center', padding: '40px' }}>
          Loading content...
        </div>
      ) : !items.length ? (
        <div className="workspace-empty">
          <Icon name="document" size={32} />
          <h2>Nothing here yet</h2>
          <p>Add your first {singular[kind]} as a draft, review it, then publish it when ready.</p>
        </div>
      ) : !filteredItems.length ? (
        <div className="admin-card" style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>
          No {labels[kind].toLowerCase()} match your current search and filters.
          <br />
          <button
            type="button"
            className="btn btn-ghost small"
            style={{ marginTop: '12px' }}
            onClick={() => {
              setSearch('');
              setStatusFilter('ALL');
              setCategoryFilter('ALL');
            }}
          >
            Clear filters
          </button>
        </div>
      ) : kind === 'gallery' ? (
        /* RESPONSIVE PHOTO GRID (3-4 COLUMNS) - NO MORE ENDLESS SCROLLING */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px',
          }}
        >
          {filteredItems.map((item) => {
            const pubDate = formatPublishedDate(item);
            return (
              <article
                key={item.id}
                className="admin-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  padding: 0,
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}
              >
                {/* IMAGE PREVIEW WITH BADGES */}
                <div style={{ position: 'relative', height: '180px', background: '#f1f5f9', overflow: 'hidden' }}>
                  {item.imageUrl ? (
                    <SiteImage
                      src={item.imageUrl}
                      alt={item.title || 'Campus image'}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ height: '100%', display: 'grid', placeItems: 'center', color: '#94a3b8' }}>
                      <Icon name="document" size={36} />
                    </div>
                  )}

                  {/* STATUS & CATEGORY BADGES */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '10px',
                      left: '10px',
                      display: 'flex',
                      gap: '6px',
                    }}
                  >
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        letterSpacing: '0.5px',
                        background:
                          item.status === 'PUBLISHED'
                            ? '#059669'
                            : item.status === 'DRAFT'
                            ? '#d97706'
                            : '#64748b',
                        color: 'white',
                      }}
                    >
                      {item.status}
                    </span>
                    {item.category && (
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 600,
                          background: 'rgba(15, 23, 42, 0.75)',
                          color: 'white',
                          backdropFilter: 'blur(4px)',
                        }}
                      >
                        {item.category}
                      </span>
                    )}
                  </div>
                </div>

                {/* DETAILS & PUBLISHED METADATA */}
                <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3
                    style={{
                      margin: '0 0 6px',
                      fontSize: '15px',
                      fontWeight: 700,
                      color: '#0f172a',
                    }}
                  >
                    {item.title}
                  </h3>

                  {item.caption && (
                    <p
                      style={{
                        margin: '0 0 10px',
                        fontSize: '13px',
                        color: '#64748b',
                        lineHeight: 1.5,
                        flex: 1,
                      }}
                    >
                      {item.caption}
                    </p>
                  )}

                  {/* PUBLISHED METADATA: PROMINENTLY DISPLAYED */}
                  <div
                    style={{
                      fontSize: '11px',
                      color: '#64748b',
                      marginTop: 'auto',
                      paddingTop: '8px',
                      borderTop: '1px solid #f1f5f9',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span>
                      {item.status === 'PUBLISHED' ? (
                        <span style={{ color: '#059669', fontWeight: 600 }}>
                          ● Published: {pubDate || 'Recently'}
                        </span>
                      ) : (
                        <span>Last updated: {pubDate || 'Recently'}</span>
                      )}
                    </span>
                    {item.order !== undefined && (
                      <span style={{ color: '#94a3b8' }}>Order #{item.order}</span>
                    )}
                  </div>

                  {/* ACTION CONTROLS */}
                  <div
                    style={{
                      display: 'flex',
                      gap: '8px',
                      marginTop: '12px',
                      paddingTop: '10px',
                      borderTop: '1px solid #f1f5f9',
                    }}
                  >
                    <button
                      type="button"
                      className="btn btn-ghost small"
                      onClick={() => {
                        setError('');
                        setEditing({ ...item });
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost small"
                      disabled={busy}
                      onClick={() =>
                        setStatus(item, item.status === 'PUBLISHED' ? 'ARCHIVED' : 'PUBLISHED')
                      }
                    >
                      {item.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost small"
                      style={{ marginLeft: 'auto', color: '#dc2626' }}
                      disabled={busy}
                      onClick={() => deleteItem(item)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        /* RESPONSIVE CARDS FOR STORIES AND EVENTS */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '20px',
          }}
        >
          {filteredItems.map((item) => {
            const pubDate = formatPublishedDate(item);
            return (
              <article
                key={item.id}
                className="admin-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                }}
              >
                {item[imageField[kind]] && (
                  <div style={{ height: '160px', borderRadius: '8px', overflow: 'hidden', marginBottom: '12px', background: '#f8fafc' }}>
                    <SiteImage
                      src={item[imageField[kind]]}
                      alt={item.title || item.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: item.status === 'PUBLISHED' ? '#059669' : '#d97706',
                      color: 'white',
                    }}
                  >
                    {item.status}
                  </span>
                  {pubDate && (
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                      {item.status === 'PUBLISHED' ? `Published: ${pubDate}` : `Updated: ${pubDate}`}
                    </span>
                  )}
                </div>

                <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 6px', color: '#0f172a' }}>
                  {item.title || item.name}
                </h2>
                <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 12px', flex: 1 }}>
                  {kind === 'stories'
                    ? `${item.program} · ${item.outcome}`
                    : kind === 'events'
                    ? `${item.date} · ${item.location}`
                    : item.caption || item.category}
                </p>

                <div style={{ display: 'flex', gap: '8px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                  <button
                    type="button"
                    className="btn btn-ghost small"
                    onClick={() => {
                      setError('');
                      setEditing({ ...item });
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost small"
                    disabled={
                      busy ||
                      (kind === 'stories' && !item.consentConfirmed && item.status !== 'PUBLISHED')
                    }
                    onClick={() =>
                      setStatus(item, item.status === 'PUBLISHED' ? 'ARCHIVED' : 'PUBLISHED')
                    }
                  >
                    {item.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost small"
                    style={{ marginLeft: 'auto', color: '#dc2626' }}
                    disabled={busy}
                    onClick={() => deleteItem(item)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* EDIT / CREATE DIALOG */}
      <Dialog
        open={!!editing}
        onClose={() => {
          if (!busy) setEditing(null);
        }}
        label={editing?.id ? `Edit ${singular[kind]}` : `Add ${singular[kind]}`}
        className="workspace-editor"
        preventBackdropClose={true}
        preventEscapeClose={true}
      >
        <div className="workspace-editor-body">
          <h2>{editing?.id ? `Edit ${singular[kind]}` : `Add ${singular[kind]}`}</h2>
          <p className="workspace-hint">
            Only published items appear on the public website.
          </p>
          {error && (
            <div className="inline-feedback error" role="alert">
              {error}
            </div>
          )}

          <form className="staff-login-form" onSubmit={save}>
            {kind === 'stories' && (
              <>
                {field('name', 'Student name', true)}
                {field('program', 'Program', true)}
                {field('graduationYear', 'Graduation year')}
                {field('outcome', 'Career outcome / role', true)}
                {area('quote', 'Student’s own words', true)}
              </>
            )}

            {kind === 'events' && (
              <>
                {field('title', 'Event title', true)}
                {field('date', 'Date (e.g. 15 Oct 2026)', true)}
                {field('time', 'Time')}
                {field('location', 'Location')}
                {area('summary', 'Short summary', true)}
                {area('description', 'Full description')}
              </>
            )}

            {kind === 'gallery' && (
              <>
                {field('title', 'Photo title', true)}
                <label>
                  Category *
                  <select
                    value={editing?.category || 'Campus'}
                    onChange={(e) => change('category', e.target.value)}
                  >
                    <option value="Campus">Campus Life</option>
                    <option value="Learning">Classrooms & Learning</option>
                    <option value="Events">Campus Events</option>
                    <option value="Facilities">Labs & Facilities</option>
                    <option value="Sports">Sports & Recreation</option>
                    <option value="Placements">Placements & Industry</option>
                  </select>
                </label>
                {area('caption', 'Caption / Short description')}
                {field('order', 'Display order (lower numbers appear first)', false, 'number')}
              </>
            )}

            {/* IMAGE ATTACHMENT WITH DIRECT UPLOAD & MEDIA LIBRARY PICKER */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '16px',
                marginTop: '12px',
                marginBottom: '16px',
              }}
            >
              <label style={{ margin: '0 0 8px', fontWeight: 600 }}>
                Image {kind === 'gallery' && '*'}
              </label>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
                <label
                  className="btn btn-primary small"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    margin: 0,
                    cursor: busy ? 'not-allowed' : 'pointer',
                  }}
                >
                  <Icon name="document" size={14} />
                  {busy ? 'Uploading...' : 'Upload Image File'}
                  <input
                    className="visually-hidden"
                    type="file"
                    accept="image/*"
                    disabled={busy}
                    onChange={upload}
                  />
                </label>

                <button
                  type="button"
                  className="btn btn-ghost small"
                  onClick={openMediaPicker}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Icon name="laptop" size={14} />
                  Pick from Media Library
                </button>
              </div>

              <input
                type="text"
                value={editing?.[imageField[kind]] || ''}
                required={kind === 'gallery'}
                onChange={(event) => change(imageField[kind], event.target.value)}
                placeholder="Or paste an image URL here"
                style={{ fontSize: '13px' }}
              />

              {editing?.[imageField[kind]] && (
                <div style={{ marginTop: '12px', maxHeight: '180px', overflow: 'hidden', borderRadius: '8px' }}>
                  <SiteImage
                    className="editorial-image-preview"
                    src={editing[imageField[kind]]}
                    alt="Preview"
                    style={{ width: '100%', height: '180px', objectFit: 'cover' }}
                  />
                </div>
              )}
            </div>

            {kind === 'stories' && (
              <label className="editorial-consent">
                <input
                  type="checkbox"
                  checked={!!editing?.consentConfirmed}
                  onChange={(event) => change('consentConfirmed', event.target.checked)}
                />
                I confirm this student approved publication of their name, quote, career details and image.
              </label>
            )}

            <label>
              Publication Status
              <select
                value={editing?.status || 'PUBLISHED'}
                onChange={(event) => change('status', event.target.value)}
              >
                <option value="PUBLISHED">Published (visible on website)</option>
                <option value="DRAFT">Draft (hidden from public)</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </label>

            <div className="media-actions" style={{ marginTop: '20px' }}>
              <button
                type="button"
                className="btn btn-ghost"
                disabled={busy}
                onClick={() => setEditing(null)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={busy}>
                {busy ? 'Saving...' : 'Save content'}
              </button>
            </div>
          </form>
        </div>
      </Dialog>

      {/* MEDIA LIBRARY PICKER MODAL */}
      <Dialog
        open={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        label="Select Image from Media Library"
        className="workspace-editor"
        preventBackdropClose={true}
        preventEscapeClose={true}
      >
        <div className="workspace-editor-body">
          <h2>Select from Media Library</h2>
          <p className="workspace-hint">Click any image to link it to this content.</p>

          {loadingMedia ? (
            <div style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
              Loading media library...
            </div>
          ) : !mediaLibrary.length ? (
            <div style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
              No images in media library yet. Use the upload button to upload one.
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: '12px',
                maxHeight: '400px',
                overflowY: 'auto',
                padding: '8px',
              }}
            >
              {mediaLibrary
                .filter((m) => m.mimeType?.startsWith('image/'))
                .map((m) => (
                  <div
                    key={m.id}
                    onClick={() => {
                      change(imageField[kind], m.url);
                      setMediaPickerOpen(false);
                      notify('Image selected from media library.');
                    }}
                    style={{
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      transition: 'border-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#0f766e')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
                  >
                    <SiteImage
                      src={m.url}
                      alt={m.originalName}
                      style={{ width: '100%', height: '100px', objectFit: 'cover' }}
                    />
                    <div style={{ padding: '4px 6px', fontSize: '11px', color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {m.originalName || 'Image'}
                    </div>
                  </div>
                ))}
            </div>
          )}

          <div style={{ marginTop: '16px', textAlign: 'right' }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setMediaPickerOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
