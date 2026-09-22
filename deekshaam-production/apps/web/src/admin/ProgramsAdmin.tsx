import React, { useState, useEffect } from 'react';
import { Icon } from '@deekshaam/ui';
import { api } from '../services/api';

export const ProgramsAdmin: React.FC = () => {
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProgram, setEditingProgram] = useState<any | null>(null);

  const fetchPrograms = () => {
    api.getPrograms().then((data) => {
      setPrograms(data || []);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProgram.id && !editingProgram.isNew) {
        await api.updateProgram(editingProgram.id, editingProgram);
      } else {
        await api.createProgram(editingProgram);
      }
      setEditingProgram(null);
      fetchPrograms();
    } catch (err: any) {
      alert(`Operation failed: ${err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this program?')) return;
    try {
      await api.deleteProgram(id);
      fetchPrograms();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', margin: '0 0 6px' }}>Undergraduate Programs</h1>
          <p style={{ color: '#777', margin: 0 }}>Configure syllabus, degree overviews, specializations, and eligibility.</p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() =>
            setEditingProgram({
              isNew: true,
              code: '',
              slug: '',
              title: '',
              kicker: '',
              duration: '3 years',
              mode: 'Classroom learning',
              eligibility: '10+2 from recognized board',
              summary: '',
              image: 'https://deekshaedu.in/wp-content/uploads/2024/03/BCA.png',
              specializations: [],
              careers: [],
              highlights: [],
              curriculum: [[], [], [], [], [], []],
              status: 'PUBLISHED',
            })
          }
        >
          Add New Program <Icon name="arrow" size={16} />
        </button>
      </div>

      <div className="admin-card">
        {loading ? (
          <div>Loading programs...</div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Title</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {programs.map((p) => (
                  <tr key={p.id || p.slug}>
                    <td><strong>{p.code}</strong></td>
                    <td>{p.title}</td>
                    <td>{p.duration}</td>
                    <td><span className="badge badge-success">{p.status}</span></td>
                    <td>
                      <button
                        className="btn btn-ghost small"
                        style={{ marginRight: '8px' }}
                        onClick={() => setEditingProgram({ ...p })}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-ghost small"
                        style={{ color: '#c92a2a' }}
                        onClick={() => handleDelete(p.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* EDIT / CREATE MODAL */}
      {editingProgram && (
        <div className="search-overlay" onClick={() => setEditingProgram(null)}>
          <div className="search-panel" style={{ maxWidth: '640px', padding: '28px' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '22px', margin: '0 0 16px' }}>
              {editingProgram.isNew ? 'Create New Program' : `Edit ${editingProgram.code}`}
            </h2>

            <form onSubmit={handleSave} style={{ display: 'grid', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: 700 }}>
                  Program Code (e.g. BCA)
                  <input
                    type="text"
                    value={editingProgram.code}
                    onChange={(e) => setEditingProgram({ ...editingProgram, code: e.target.value })}
                    required
                    style={{ border: '1px solid #ddd', padding: '8px 12px', borderRadius: '8px' }}
                  />
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: 700 }}>
                  Slug (URL key)
                  <input
                    type="text"
                    value={editingProgram.slug}
                    onChange={(e) => setEditingProgram({ ...editingProgram, slug: e.target.value })}
                    required
                    style={{ border: '1px solid #ddd', padding: '8px 12px', borderRadius: '8px' }}
                  />
                </label>
              </div>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: 700 }}>
                Program Title
                <input
                  type="text"
                  value={editingProgram.title}
                  onChange={(e) => setEditingProgram({ ...editingProgram, title: e.target.value })}
                  required
                  style={{ border: '1px solid #ddd', padding: '8px 12px', borderRadius: '8px' }}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: 700 }}>
                Program Overview Summary
                <textarea
                  rows={3}
                  value={editingProgram.summary}
                  onChange={(e) => setEditingProgram({ ...editingProgram, summary: e.target.value })}
                  required
                  style={{ border: '1px solid #ddd', padding: '8px 12px', borderRadius: '8px' }}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: 700 }}>
                Eligibility Criteria
                <input
                  type="text"
                  value={editingProgram.eligibility}
                  onChange={(e) => setEditingProgram({ ...editingProgram, eligibility: e.target.value })}
                  required
                  style={{ border: '1px solid #ddd', padding: '8px 12px', borderRadius: '8px' }}
                />
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setEditingProgram(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
