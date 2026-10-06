import React, { useState, useEffect, useMemo } from 'react';
import { Dialog } from '../components/Dialog';
import { useAdminFeedback } from './AdminFeedback';
import { api } from '../services/api';
import { Icon } from '@deekshaam/ui';

export const NewsAdmin: React.FC = () => {
  const notify = useAdminFeedback();
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [categoryTab, setCategoryTab] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    category: 'Career',
    date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    summary: '',
    content: '',
  });

  const fetchNews = () => {
    setLoading(true);
    api
      .getNews()
      .then((data) => {
        setNews(data || []);
        setLoading(false);
      })
      .catch((err: Error) => {
        setLoading(false);
        notify(err.message || 'Unable to load news articles. Please try again.');
      });
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createNews({
        ...formData,
        slug: formData.slug || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      });
      setCreating(false);
      setFormData({
        title: '',
        slug: '',
        category: 'Career',
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        summary: '',
        content: '',
      });
      notify('News article published successfully.');
      fetchNews();
    } catch (err: any) {
      notify(`Create failed: ${err.message}`);
    }
  };

  // Distinct categories and counts
  const categories = useMemo(() => {
    const map: Record<string, number> = {};
    news.forEach((item) => {
      const cat = item.category || 'General';
      map[cat] = (map[cat] || 0) + 1;
    });
    return map;
  }, [news]);

  const filteredNews = useMemo(() => {
    return news.filter((item) => {
      if (categoryTab !== 'ALL' && item.category !== categoryTab) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const title = (item.title || '').toLowerCase();
        const cat = (item.category || '').toLowerCase();
        const summary = (item.summary || '').toLowerCase();
        const content = (item.content || '').toLowerCase();
        if (!title.includes(q) && !cat.includes(q) && !summary.includes(q) && !content.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [news, categoryTab, search]);

  const handleResetFilters = () => {
    setCategoryTab('ALL');
    setSearch('');
  };

  const isFiltered = categoryTab !== 'ALL' || search.trim() !== '';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '28px', margin: '0 0 6px', letterSpacing: '-0.5px' }}>News & Articles</h1>
          <p style={{ color: '#777', margin: 0 }}>Publish career resources, notifications, and campus updates.</p>
        </div>

        <button className="btn btn-primary" onClick={() => setCreating(true)}>
          <Icon name="arrow" size={16} /> Publish New Article
        </button>
      </div>

      {/* UNIFIED TOOLBAR: CATEGORY PILLS ON LEFT, COMPACT SEARCH ON RIGHT */}
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
        {/* LEFT: Category Pills */}
        <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setCategoryTab('ALL')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              background: categoryTab === 'ALL' ? '#1b365d' : '#f1f5f9',
              color: categoryTab === 'ALL' ? '#ffffff' : '#475569',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>All Articles</span>
            <span
              style={{
                fontSize: '11px',
                padding: '1px 6px',
                borderRadius: '10px',
                background: categoryTab === 'ALL' ? 'rgba(255,255,255,0.22)' : '#e2e8f0',
                color: categoryTab === 'ALL' ? '#fff' : '#64748b',
                fontWeight: 700,
              }}
            >
              {news.length}
            </span>
          </button>

          {['Career', 'Admissions', 'Academic', 'Campus'].map((cat) => {
            const count = categories[cat] || 0;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryTab(cat)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  background: categoryTab === cat ? '#1b365d' : '#f1f5f9',
                  color: categoryTab === cat ? '#ffffff' : '#475569',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>{cat}</span>
                <span
                  style={{
                    fontSize: '11px',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    background: categoryTab === cat ? 'rgba(255,255,255,0.22)' : '#e2e8f0',
                    color: categoryTab === cat ? '#fff' : '#64748b',
                    fontWeight: 700,
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
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
              placeholder="Search articles..."
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
            Showing {filteredNews.length} of {news.length}
          </div>
        </div>
      </div>

      <div className="admin-card">
        {loading ? (
          <div style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
            Loading articles...
          </div>
        ) : news.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#777' }}>
            No articles published yet. Click "Publish New Article" above to create one.
          </div>
        ) : filteredNews.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#777' }}>
            <p style={{ margin: '0 0 14px', fontSize: '15px', color: '#475569' }}>
              No articles match your current search and filters.
            </p>
            <button className="btn btn-secondary" onClick={handleResetFilters}>
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="table-responsive" role="region" aria-label="Scrollable news table" tabIndex={0}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Title</th>
                  <th>Summary</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredNews.map((item, i) => (
                  <tr key={item.id || i}>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '12px', color: '#64748b' }}>{item.date}</td>
                    <td>
                      <span className="badge badge-info">{item.category}</span>
                    </td>
                    <td>
                      <strong>{item.title}</strong>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        {item.summary ? item.summary.slice(0, 70) + (item.summary.length > 70 ? '...' : '') : '—'}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-success">{item.status || 'PUBLISHED'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {creating && (
        <Dialog
          open={true}
          onClose={() => setCreating(false)}
          label="Publish an article"
          className="workspace-editor"
          preventBackdropClose={true}
          preventEscapeClose={true}
        >
          <div className="workspace-editor-body">
            <h2 style={{ fontSize: '22px', margin: '0 0 16px' }}>Publish New Article</h2>

            <form onSubmit={handleCreate} style={{ display: 'grid', gap: '14px' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: 700 }}>
                Article Title *
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  style={{ border: '1px solid #ddd', padding: '8px 12px', borderRadius: '8px' }}
                />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '12px' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: 700 }}>
                  Category
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    style={{ border: '1px solid #ddd', padding: '8px 12px', borderRadius: '8px' }}
                  >
                    <option value="Career">Career</option>
                    <option value="Admissions">Admissions</option>
                    <option value="Academic">Academic</option>
                    <option value="Campus">Campus</option>
                  </select>
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: 700 }}>
                  Publication Date
                  <input
                    type="text"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                    style={{ border: '1px solid #ddd', padding: '8px 12px', borderRadius: '8px' }}
                  />
                </label>
              </div>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: 700 }}>
                Brief Summary
                <textarea
                  rows={2}
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  style={{ border: '1px solid #ddd', padding: '8px 12px', borderRadius: '8px' }}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: 700 }}>
                Full Content *
                <textarea
                  rows={5}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  required
                  style={{ border: '1px solid #ddd', padding: '8px 12px', borderRadius: '8px' }}
                />
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setCreating(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Publish Article
                </button>
              </div>
            </form>
          </div>
        </Dialog>
      )}
    </div>
  );
};
