import { Dialog } from '../components/Dialog';
import { useAdminFeedback } from './AdminFeedback';
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export const NewsAdmin: React.FC = () => {
  const notify = useAdminFeedback();
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    category: 'Career',
    date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    summary: '',
    content: '',
  });

  const fetchNews = () => {
    api.getNews().then((data) => {
      setNews(data || []);
      setLoading(false);
    }).catch((err: Error) => { setLoading(false); notify(err.message || 'Unable to load this workspace. Please try again.'); });
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
      fetchNews();
    } catch (err: any) {
      notify(`Create failed: ${err.message}`);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', margin: '0 0 6px' }}>News & Articles</h1>
          <p style={{ color: '#777', margin: 0 }}>Publish career resources, notifications, and campus updates.</p>
        </div>

        <button className="btn btn-primary" onClick={() => setCreating(true)}>
          Publish New Article
        </button>
      </div>

      <div className="admin-card">
        {loading ? (
          <div>Loading articles...</div>
        ) : (
          <div className="table-responsive" role="region" aria-label="Scrollable data table" tabIndex={0}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Title</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {news.map((item, i) => (
                  <tr key={i}>
                    <td>{item.date}</td>
                    <td><span className="badge badge-info">{item.category}</span></td>
                    <td><strong>{item.title}</strong></td>
                    <td><span className="badge badge-success">{item.status || 'PUBLISHED'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {creating && (
        <Dialog open={true} onClose={() => setCreating(false)} label="Publish an article" className="workspace-editor">
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
