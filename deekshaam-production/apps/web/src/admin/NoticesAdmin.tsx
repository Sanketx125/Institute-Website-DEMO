import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../services/api';
import { Icon } from '@deekshaam/ui';
import { Dialog } from '../components/Dialog';
import { useAdminFeedback } from './AdminFeedback';

interface Notice {
  id: string;
  title: string;
  date: string;
  priority: 'NORMAL' | 'HIGH';
  status: 'PUBLISHED' | 'ARCHIVED';
  fileUrl: string;
}

const blank = (): Notice => ({
  id: '',
  title: '',
  date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
  priority: 'NORMAL',
  status: 'PUBLISHED',
  fileUrl: '',
});

export const NoticesAdmin: React.FC = () => {
  const notify = useAdminFeedback();
  const [items, setItems] = useState<Notice[]>([]);
  const [editing, setEditing] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'PUBLISHED' | 'HIGH' | 'ARCHIVED'>('ALL');
  const [search, setSearch] = useState('');

  const refresh = () =>
    api
      .getAdminNotices()
      .then(setItems)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));

  useEffect(() => {
    refresh();
  }, []);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    setBusy(true);
    try {
      if (editing.id) await api.updateNotice(editing.id, editing);
      else await api.createNotice(editing);
      setEditing(null);
      await refresh();
      notify('Campus notice saved.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const archive = async (item: Notice) => {
    setBusy(true);
    try {
      await api.updateNotice(item.id, {
        ...item,
        status: item.status === 'PUBLISHED' ? 'ARCHIVED' : 'PUBLISHED',
      });
      await refresh();
      notify(item.status === 'PUBLISHED' ? 'Notice archived.' : 'Notice published.');
    } catch (err: any) {
      notify(err.message);
    } finally {
      setBusy(false);
    }
  };

  const publishedCount = useMemo(() => items.filter((i) => i.status === 'PUBLISHED').length, [items]);
  const highCount = useMemo(() => items.filter((i) => i.priority === 'HIGH').length, [items]);
  const archivedCount = useMemo(() => items.filter((i) => i.status === 'ARCHIVED').length, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (activeTab === 'PUBLISHED' && item.status !== 'PUBLISHED') return false;
      if (activeTab === 'HIGH' && item.priority !== 'HIGH') return false;
      if (activeTab === 'ARCHIVED' && item.status !== 'ARCHIVED') return false;

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const title = (item.title || '').toLowerCase();
        const date = (item.date || '').toLowerCase();
        if (!title.includes(q) && !date.includes(q)) return false;
      }
      return true;
    });
  }, [items, activeTab, search]);

  const handleResetFilters = () => {
    setActiveTab('ALL');
    setSearch('');
  };

  const isFiltered = activeTab !== 'ALL' || search.trim() !== '';

  return (
    <div>
      <div className="workspace-page-heading admin-toolbar">
        <div>
          <h1 style={{ fontSize: '28px', margin: '0 0 6px', letterSpacing: '-0.5px' }}>Campus Notices</h1>
          <p style={{ color: '#777', margin: 0 }}>
            Keep important admissions announcements and campus notifications current.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setError('');
            setEditing(blank());
          }}
        >
          Create a Notice <Icon name="arrow" size={16} />
        </button>
      </div>

      {error && !editing && (
        <div className="inline-feedback error" role="alert">
          {error}
        </div>
      )}

      {/* UNIFIED TOOLBAR: SEGMENT PILLS ON LEFT, COMPACT SEARCH ON RIGHT */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        {/* LEFT: Segment Tabs */}
        <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              background: activeTab === 'ALL' ? '#1b365d' : '#f1f5f9',
              color: activeTab === 'ALL' ? '#ffffff' : '#475569',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>All Notices</span>
            <span
              style={{
                fontSize: '11px',
                padding: '1px 6px',
                borderRadius: '10px',
                background: activeTab === 'ALL' ? 'rgba(255,255,255,0.22)' : '#e2e8f0',
                color: activeTab === 'ALL' ? '#fff' : '#64748b',
                fontWeight: 700,
              }}
            >
              {items.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PUBLISHED')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              background: activeTab === 'PUBLISHED' ? '#15803d' : '#f1f5f9',
              color: activeTab === 'PUBLISHED' ? '#ffffff' : '#475569',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>Published</span>
            <span
              style={{
                fontSize: '11px',
                padding: '1px 6px',
                borderRadius: '10px',
                background: activeTab === 'PUBLISHED' ? 'rgba(255,255,255,0.22)' : '#e2e8f0',
                color: activeTab === 'PUBLISHED' ? '#fff' : '#64748b',
                fontWeight: 700,
              }}
            >
              {publishedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('HIGH')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              background: activeTab === 'HIGH' ? '#b45309' : '#f1f5f9',
              color: activeTab === 'HIGH' ? '#ffffff' : '#475569',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>Important</span>
            <span
              style={{
                fontSize: '11px',
                padding: '1px 6px',
                borderRadius: '10px',
                background: activeTab === 'HIGH' ? 'rgba(255,255,255,0.22)' : '#e2e8f0',
                color: activeTab === 'HIGH' ? '#fff' : '#64748b',
                fontWeight: 700,
              }}
            >
              {highCount}
            </span>
          </button>

          {archivedCount > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('ARCHIVED')}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                border: 'none',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                background: activeTab === 'ARCHIVED' ? '#64748b' : '#f1f5f9',
                color: activeTab === 'ARCHIVED' ? '#ffffff' : '#475569',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>Archived</span>
              <span
                style={{
                  fontSize: '11px',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  background: activeTab === 'ARCHIVED' ? 'rgba(255,255,255,0.22)' : '#e2e8f0',
                  color: activeTab === 'ARCHIVED' ? '#fff' : '#64748b',
                  fontWeight: 700,
                }}
              >
                {archivedCount}
              </span>
            </button>
          )}
        </div>

        {/* RIGHT: Compact Inline Search */}
        <div className="admin-toolbar-filter">
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
              placeholder="Search notices..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
                  lineHeight: 1,
                }}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {isFiltered && (
            <button
              type="button"
              onClick={handleResetFilters}
              style={{
                height: '36px',
                padding: '0 12px',
                border: '1px dashed #cbd5e1',
                borderRadius: '8px',
                background: '#f8fafc',
                color: '#64748b',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Reset
            </button>
          )}

          <div
            style={{
              fontSize: '12px',
              color: '#64748b',
              fontWeight: 600,
              padding: '4px 10px',
              background: '#f1f5f9',
              borderRadius: '6px',
              whiteSpace: 'nowrap',
            }}
          >
            Showing {filteredItems.length} of {items.length}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="admin-card" role="status">
          Loading notices...
        </div>
      ) : items.length === 0 ? (
        <div className="admin-card" style={{ textAlign: 'center', padding: '48px', color: '#777' }}>
          No campus notices created yet. Click "Create a Notice" above to publish an announcement.
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="admin-card" style={{ textAlign: 'center', padding: '48px', color: '#777' }}>
          <p style={{ margin: '0 0 14px', fontSize: '15px', color: '#475569' }}>
            No notices match your current search and filters.
          </p>
          <button className="btn btn-secondary" onClick={handleResetFilters}>
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="admin-card">
          <div className="table-responsive" role="region" aria-label="Scrollable notices table" tabIndex={0}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Date</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.title}</strong>
                    </td>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '12px', color: '#64748b' }}>{item.date}</td>
                    <td>
                      <span className={`badge ${item.priority === 'HIGH' ? 'badge-warning' : 'badge-info'}`}>
                        {item.priority === 'HIGH' ? 'Important' : 'Normal'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${item.status === 'PUBLISHED' ? 'badge-success' : 'badge-info'}`}>
                        {item.status === 'PUBLISHED' ? 'Published' : 'Archived'}
                      </span>
                    </td>
                    <td>
                      <div className="media-actions">
                        <button
                          className="btn btn-ghost small"
                          onClick={() => {
                            setError('');
                            setEditing({ ...item });
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-ghost small"
                          disabled={busy}
                          onClick={() => archive(item)}
                        >
                          {item.status === 'PUBLISHED' ? 'Archive' : 'Publish'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editing && (
        <Dialog
          open={true}
          onClose={() => {
            if (!busy) setEditing(null);
          }}
          label={editing?.id ? 'Edit campus notice' : 'Create campus notice'}
          className="workspace-editor"
          preventBackdropClose={true}
          preventEscapeClose={true}
        >
          <div className="workspace-editor-body">
            <h2>{editing?.id ? 'Edit notice' : 'Create notice'}</h2>
            {error && (
              <div className="inline-feedback error" role="alert">
                {error}
              </div>
            )}
            <form className="staff-login-form" onSubmit={save}>
              <label>
                Notice title
                <input
                  required
                  minLength={5}
                  maxLength={180}
                  value={editing?.title || ''}
                  onChange={(e) => setEditing((current) => current && { ...current, title: e.target.value })}
                />
              </label>
              <label>
                Date
                <input
                  required
                  value={editing?.date || ''}
                  onChange={(e) => setEditing((current) => current && { ...current, date: e.target.value })}
                />
              </label>
              <label>
                Priority
                <select
                  value={editing?.priority || 'NORMAL'}
                  onChange={(e) =>
                    setEditing((current) => current && { ...current, priority: e.target.value as Notice['priority'] })
                  }
                >
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">Important</option>
                </select>
              </label>
              <label>
                Status
                <select
                  value={editing?.status || 'PUBLISHED'}
                  onChange={(e) =>
                    setEditing((current) => current && { ...current, status: e.target.value as Notice['status'] })
                  }
                >
                  <option value="PUBLISHED">Published</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </label>
              <div className="media-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={busy}
                  onClick={() => setEditing(null)}
                >
                  Cancel
                </button>
                <button className="btn btn-primary" disabled={busy}>
                  {busy ? 'Saving...' : 'Save notice'}
                </button>
              </div>
            </form>
          </div>
        </Dialog>
      )}
    </div>
  );
};
