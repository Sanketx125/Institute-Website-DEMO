import { Dialog } from '../components/Dialog';
import { useAdminFeedback } from './AdminFeedback';
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export const UsersAdmin: React.FC = () => {
  const notify = useAdminFeedback();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [resetUser, setResetUser] = useState<any | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'ADMISSION_STAFF',
  });

  const fetchUsers = () => {
    api.getUsers().then((data) => {
      setUsers(data || []);
      setLoading(false);
    }).catch((err: Error) => { setLoading(false); notify(err.message || 'Unable to load this workspace. Please try again.'); });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createUser(formData);
      setCreating(false);
      setFormData({ email: '', password: '', name: '', role: 'ADMISSION_STAFF' });
      fetchUsers();
    } catch (err: any) {
      notify(`Create user failed: ${err.message}`);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', margin: '0 0 6px' }}>Team & access</h1>
          <p style={{ color: '#777', margin: 0 }}>Give each team member the right access to their workspace.</p>
        </div>

        <button className="btn btn-primary" onClick={() => setCreating(true)}>
          Create Staff User
        </button>
      </div>

      <div className="admin-card">
        {loading ? (
          <div>Loading user accounts...</div>
        ) : (
          <div className="table-responsive" role="region" aria-label="Scrollable data table" tabIndex={0}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Active Status</th>
                  <th>Created At</th>
                  <th>Access</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td><strong>{u.name}</strong></td>
                    <td>{u.email}</td>
                    <td><span className="badge badge-info">{u.role}</span></td>
                    <td><span className="badge badge-success">Active</span></td>
                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td><button className="btn btn-ghost small" onClick={() => { setResetUser(u); setNewPassword(''); }}>Set password</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {creating && (
        <Dialog open={true} onClose={() => setCreating(false)} label="Create staff account" className="workspace-editor">
          <div className="workspace-editor-body">
            <h2 style={{ fontSize: '22px', margin: '0 0 16px' }}>Create Staff User</h2>

            <form onSubmit={handleCreate} style={{ display: 'grid', gap: '14px' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: 700 }}>
                Full Name *
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  style={{ border: '1px solid #ddd', padding: '8px 12px', borderRadius: '8px' }}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: 700 }}>
                Email Address *
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  style={{ border: '1px solid #ddd', padding: '8px 12px', borderRadius: '8px' }}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: 700 }}>
                Initial Password *
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  style={{ border: '1px solid #ddd', padding: '8px 12px', borderRadius: '8px' }}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: 700 }}>
                Assign Role *
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  style={{ border: '1px solid #ddd', padding: '8px 12px', borderRadius: '8px' }}
                >
                  <option value="SUPER_ADMIN">SUPER_ADMIN (Universal Access)</option>
                  <option value="CONTENT_ADMIN">CONTENT_ADMIN (CMS Content)</option>
                  <option value="ADMISSION_STAFF">ADMISSION_STAFF (Admissions Review)</option>
                  <option value="ENQUIRY_STAFF">ENQUIRY_STAFF (Leads & Visits)</option>
                </select>
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setCreating(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create User
                </button>
              </div>
            </form>
          </div>
        </Dialog>
      )}
      <Dialog open={!!resetUser} onClose={() => { if (!busy) setResetUser(null); }} label="Set staff password" className="workspace-editor"><div className="workspace-editor-body"><h2>Set a new password</h2><p className="workspace-hint">{resetUser?.name} will use this password next time they sign in. Their current sessions will end.</p><form className="staff-login-form" onSubmit={async e => { e.preventDefault(); if (!resetUser) return; setBusy(true); try { await api.resetUserPassword(resetUser.id, newPassword); setResetUser(null); setNewPassword(''); notify('Password changed. Previous sessions have been signed out.'); } catch (err: any) { notify(err.message); } finally { setBusy(false); } }}><label>New password<input type="password" autoComplete="new-password" minLength={8} required value={newPassword} onChange={e => setNewPassword(e.target.value)} /></label><p className="workspace-hint">Use at least 8 characters with uppercase and lowercase letters and a number.</p><div className="media-actions"><button type="button" className="btn btn-ghost" disabled={busy} onClick={() => setResetUser(null)}>Cancel</button><button className="btn btn-primary" disabled={busy}>{busy ? 'Saving...' : 'Set password'}</button></div></form></div></Dialog>
    </div>
  );
};
