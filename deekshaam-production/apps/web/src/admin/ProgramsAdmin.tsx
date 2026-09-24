import { Dialog } from '../components/Dialog';
import { useAdminFeedback } from './AdminFeedback';
import React, { useState, useEffect } from 'react';
import { Icon } from '@deekshaam/ui';
import { api } from '../services/api';

export const ProgramsAdmin: React.FC = () => {
  const notify = useAdminFeedback();
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProgram, setEditingProgram] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPrograms = () => {
    api.getPrograms().then((data) => {
      setPrograms(data || []);
      setLoading(false);
    }).catch((err: Error) => { setLoading(false); notify(err.message || 'Unable to load this workspace. Please try again.'); });
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
      notify(`Operation failed: ${err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      await api.deleteProgram(id);
      setDeleteId(null);
      fetchPrograms();
      notify('Program removed.');
    } catch (err: any) {
      notify(`Delete failed: ${err.message}`);
    } finally { setDeleting(false); }
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
          <div className="table-responsive" role="region" aria-label="Scrollable data table" tabIndex={0}>
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
                        onClick={() => setDeleteId(p.id)}
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
        <Dialog open={true} onClose={() => setEditingProgram(null)} label="Edit program" className="workspace-editor">
          <div className="workspace-editor-body">
            <h2 style={{ fontSize: '22px', margin: '0 0 16px' }}>
              {editingProgram.isNew ? 'Create New Program' : `Edit ${editingProgram.code}`}
            </h2>

            <form onSubmit={handleSave} style={{ display: 'grid', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '12px' }}>
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
        </Dialog>
      )}
      <Dialog open={!!deleteId} onClose={() => { if (!deleting) setDeleteId(null); }} label="Remove program" className="notification-dialog"><h2>Remove this program?</h2><p>This removes the program from the public catalog. Existing applications remain in the admissions workspace.</p><div className="media-actions"><button className="btn btn-ghost" disabled={deleting} onClick={() => setDeleteId(null)}>Keep program</button><button className="btn btn-primary" disabled={deleting} onClick={() => deleteId && handleDelete(deleteId)}>{deleting ? 'Removing...' : 'Remove program'}</button></div></Dialog>
    </div>
  );
};
