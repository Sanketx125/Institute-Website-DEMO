import React, { useState, useEffect, useMemo } from 'react';
import { Icon } from '@deekshaam/ui';
import { Dialog } from '../components/Dialog';
import { useAdminFeedback } from './AdminFeedback';
import { api } from '../services/api';

export const UsersAdmin: React.FC = () => {
  const notify = useAdminFeedback();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [resetUser, setResetUser] = useState<any | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [busy, setBusy] = useState(false);

  // Filters State
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'STAFF' | 'AGENTS'>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'ADMISSION_STAFF',
  });

  const fetchUsers = () => {
    api
      .getUsers()
      .then((data) => {
        setUsers(data || []);
        setLoading(false);
      })
      .catch((err: Error) => {
        setLoading(false);
        notify(err.message || 'Unable to load this workspace. Please try again.');
      });
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
      notify('Account created successfully.');
      fetchUsers();
    } catch (err: any) {
      notify(`Create user failed: ${err.message}`);
    }
  };

  // Counts for tabs
  const totalCount = users.length;
  const staffCount = users.filter((u) => u.role !== 'AGENT').length;
  const agentCount = users.filter((u) => u.role === 'AGENT').length;

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // 1. Category segmentation
      if (categoryFilter === 'STAFF' && u.role === 'AGENT') return false;
      if (categoryFilter === 'AGENTS' && u.role !== 'AGENT') return false;

      // 2. Role filter
      if (roleFilter && u.role !== roleFilter) return false;

      // 3. Active status filter
      if (statusFilter === 'ACTIVE' && u.isActive === false) return false;
      if (statusFilter === 'INACTIVE' && u.isActive !== false) return false;

      // 4. Search query
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchName = u.name?.toLowerCase().includes(q);
        const matchEmail = u.email?.toLowerCase().includes(q);
        const matchRole = u.role?.toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchRole) return false;
      }

      return true;
    });
  }, [users, categoryFilter, roleFilter, statusFilter, search]);

  const hasActiveFilters = categoryFilter !== 'ALL' || roleFilter !== '' || statusFilter !== '' || search.trim() !== '';

  const handleResetFilters = () => {
    setCategoryFilter('ALL');
    setRoleFilter('');
    setStatusFilter('');
    setSearch('');
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return (
          <span
            className="badge"
            style={{ background: '#0f172a', color: '#f8fafc', fontWeight: 600, padding: '4px 10px' }}
          >
            Super Admin
          </span>
        );
      case 'ADMISSION_STAFF':
        return (
          <span
            className="badge"
            style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', fontWeight: 600, padding: '4px 10px' }}
          >
            Admissions Staff
          </span>
        );
      case 'CONTENT_ADMIN':
        return (
          <span
            className="badge"
            style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', fontWeight: 600, padding: '4px 10px' }}
          >
            Content Admin
          </span>
        );
      case 'ENQUIRY_STAFF':
        return (
          <span
            className="badge"
            style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', fontWeight: 600, padding: '4px 10px' }}
          >
            Enquiry Staff
          </span>
        );
      case 'AGENT':
        return (
          <span
            className="badge"
            style={{ background: '#ffedd5', color: '#c2410c', border: '1px solid #fed7aa', fontWeight: 700, padding: '4px 10px' }}
          >
            Referral Agent
          </span>
        );
      default:
        return <span className="badge badge-info">{role}</span>;
    }
  };

  return (
    <div>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '28px', margin: '0 0 6px' }}>Team & access</h1>
          <p style={{ color: '#777', margin: 0 }}>
            Manage campus staff accounts, referral partner credentials, and workspace permissions.
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setCreating(true)}>
          <Icon name="user" size={16} /> Create User Account
        </button>
      </div>

      {/* UNIFIED TOOLBAR: CATEGORY PILLS ON LEFT, COMPACT FILTERS ON RIGHT */}
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
        {/* LEFT: Category Pills (All / Staff / Agents) */}
        <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => {
              setCategoryFilter('ALL');
              if (roleFilter === 'AGENT') setRoleFilter('');
            }}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              background: categoryFilter === 'ALL' ? '#1b365d' : '#f1f5f9',
              color: categoryFilter === 'ALL' ? '#ffffff' : '#475569',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>All Accounts</span>
            <span
              style={{
                fontSize: '11px',
                padding: '1px 6px',
                borderRadius: '10px',
                background: categoryFilter === 'ALL' ? 'rgba(255,255,255,0.22)' : '#e2e8f0',
                color: categoryFilter === 'ALL' ? '#fff' : '#64748b',
                fontWeight: 700,
              }}
            >
              {totalCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCategoryFilter('STAFF');
              if (roleFilter === 'AGENT') setRoleFilter('');
            }}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              background: categoryFilter === 'STAFF' ? '#1b365d' : '#f1f5f9',
              color: categoryFilter === 'STAFF' ? '#ffffff' : '#475569',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>Campus Staff</span>
            <span
              style={{
                fontSize: '11px',
                padding: '1px 6px',
                borderRadius: '10px',
                background: categoryFilter === 'STAFF' ? 'rgba(255,255,255,0.22)' : '#e2e8f0',
                color: categoryFilter === 'STAFF' ? '#fff' : '#64748b',
                fontWeight: 700,
              }}
            >
              {staffCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCategoryFilter('AGENTS');
              setRoleFilter('AGENT');
            }}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              background: categoryFilter === 'AGENTS' ? '#c2410c' : '#f1f5f9',
              color: categoryFilter === 'AGENTS' ? '#ffffff' : '#475569',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>Referral Agents</span>
            <span
              style={{
                fontSize: '11px',
                padding: '1px 6px',
                borderRadius: '10px',
                background: categoryFilter === 'AGENTS' ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                color: categoryFilter === 'AGENTS' ? '#fff' : '#64748b',
                fontWeight: 700,
              }}
            >
              {agentCount}
            </span>
          </button>
        </div>

        {/* RIGHT: Compact Inline Filters (Search + Role + Status + Clear) */}
        <div className="admin-toolbar-filter">
          {/* SEARCH BAR */}
          <div style={{ position: 'relative', width: '210px' }}>
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
              placeholder="Search name, email..."
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
                  cursor: 'pointer',
                  color: '#94a3b8',
                  padding: 0,
                  display: 'flex',
                }}
              >
                <Icon name="close" size={14} />
              </button>
            )}
          </div>

          {/* ROLE FILTER */}
          <select
            value={roleFilter}
            onChange={(e) => {
              const val = e.target.value;
              setRoleFilter(val);
              if (val === 'AGENT') setCategoryFilter('AGENTS');
              else if (val) setCategoryFilter('STAFF');
            }}
          >
            <option value="">All Roles</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="ADMISSION_STAFF">Admissions Staff</option>
            <option value="CONTENT_ADMIN">Content Admin</option>
            <option value="ENQUIRY_STAFF">Enquiry Staff</option>
            <option value="AGENT">Referral Agent</option>
          </select>

          {/* STATUS FILTER */}
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>

          {/* RESET FILTERS BUTTON */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              style={{
                background: '#fee2e2',
                border: '1px solid #fca5a5',
                borderRadius: '8px',
                color: '#b91c1c',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600,
                padding: '0 10px',
                height: '36px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                whiteSpace: 'nowrap',
              }}
              title="Reset all filters"
            >
              <Icon name="close" size={13} /> Clear
            </button>
          )}

          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, marginLeft: '4px' }}>
            ({filteredUsers.length} of {totalCount})
          </span>
        </div>
      </div>

      {/* USERS TABLE */}
      <div className="admin-card">
        {loading ? (
          <div style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>Loading user accounts...</div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 16px', color: '#64748b' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
                color: '#94a3b8',
              }}
            >
              <Icon name="search" size={24} />
            </div>
            <h3 style={{ fontSize: '16px', margin: '0 0 6px', color: '#334155' }}>No accounts matched your filters</h3>
            <p style={{ fontSize: '13px', margin: '0 0 16px' }}>
              Try adjusting your search query, role filter, or category tabs to find what you're looking for.
            </p>
            {hasActiveFilters && (
              <button type="button" className="btn btn-ghost" onClick={handleResetFilters}>
                Reset all filters
              </button>
            )}
          </div>
        ) : (
          <div className="table-responsive" role="region" aria-label="Scrollable data table" tabIndex={0}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Account Type</th>
                  <th>Assigned Role</th>
                  <th>Active Status</th>
                  <th>Created At</th>
                  <th>Access</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const isAgent = u.role === 'AGENT';
                  const isActive = u.isActive !== false;
                  return (
                    <tr key={u.id}>
                      <td>
                        <strong>{u.name}</strong>
                      </td>
                      <td>
                        <span style={{ color: '#475569', fontSize: '13px' }}>{u.email}</span>
                      </td>
                      <td>
                        {isAgent ? (
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              color: '#c2410c',
                              background: '#fff7ed',
                              border: '1px solid #fed7aa',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              display: 'inline-block',
                            }}
                          >
                            Referral Partner
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              color: '#334155',
                              background: '#f1f5f9',
                              border: '1px solid #e2e8f0',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              display: 'inline-block',
                            }}
                          >
                            Campus Staff
                          </span>
                        )}
                      </td>
                      <td>{getRoleBadge(u.role)}</td>
                      <td>
                        {isActive ? (
                          <span className="badge badge-success">Active</span>
                        ) : (
                          <span className="badge badge-warning" style={{ color: '#991b1b', background: '#fee2e2' }}>
                            Inactive
                          </span>
                        )}
                      </td>
                      <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-ghost small"
                          onClick={() => {
                            setResetUser(u);
                            setNewPassword('');
                          }}
                        >
                          Set password
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE USER DIALOG */}
      {creating && (
        <Dialog
          open={true}
          onClose={() => setCreating(false)}
          label="Create staff or agent account"
          className="workspace-editor"
          preventBackdropClose={true}
          preventEscapeClose={true}
        >
          <div className="workspace-editor-body">
            <h2 style={{ fontSize: '22px', margin: '0 0 16px' }}>Create User Account</h2>

            <form onSubmit={handleCreate} style={{ display: 'grid', gap: '14px' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: 700 }}>
                Full Name *
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  style={{ border: '1px solid #ddd', padding: '8px 12px', borderRadius: '8px' }}
                  placeholder="e.g. John Doe"
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
                  placeholder="john@example.com"
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
                  placeholder="Min 8 chars, 1 uppercase, 1 lowercase, 1 number"
                />
                <small style={{ color: '#888', fontWeight: 400 }}>
                  Must contain at least 8 characters with uppercase, lowercase, and numbers.
                </small>
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: 700 }}>
                Assign Role & Access *
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  style={{ border: '1px solid #ddd', padding: '8px 12px', borderRadius: '8px' }}
                >
                  <optgroup label="Campus Staff Roles">
                    <option value="SUPER_ADMIN">SUPER_ADMIN (Universal Administrator Access)</option>
                    <option value="CONTENT_ADMIN">CONTENT_ADMIN (CMS Content & Media)</option>
                    <option value="ADMISSION_STAFF">ADMISSION_STAFF (Admissions & Applications Review)</option>
                    <option value="ENQUIRY_STAFF">ENQUIRY_STAFF (Leads, Enquiries & Visits)</option>
                  </optgroup>
                  <optgroup label="External Partner Roles">
                    <option value="AGENT">AGENT (Referral Partner / Affiliate Agent)</option>
                  </optgroup>
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

      {/* RESET PASSWORD DIALOG */}
      {resetUser && (
        <Dialog
          open={true}
          onClose={() => {
            if (!busy) setResetUser(null);
          }}
          label="Set user password"
          className="workspace-editor"
          preventBackdropClose={true}
          preventEscapeClose={true}
        >
          <div className="workspace-editor-body">
            <h2 style={{ fontSize: '22px', margin: '0 0 6px' }}>Set a New Password</h2>
            <p className="workspace-hint">
              <strong>{resetUser.name}</strong> ({resetUser.email}) will use this password next time they sign in.
              Their current sessions will end.
            </p>
            <form
              className="staff-login-form"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!resetUser) return;
                setBusy(true);
                try {
                  await api.resetUserPassword(resetUser.id, newPassword);
                  setResetUser(null);
                  setNewPassword('');
                  notify('Password changed successfully. Previous sessions have been signed out.');
                } catch (err: any) {
                  notify(err.message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              <label>
                New password
                <input
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 chars, 1 uppercase, 1 lowercase, 1 number"
                />
              </label>
              <p className="workspace-hint">Use at least 8 characters with uppercase and lowercase letters and a number.</p>
              <div className="media-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => setResetUser(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={busy}>
                  {busy ? 'Saving...' : 'Set password'}
                </button>
              </div>
            </form>
          </div>
        </Dialog>
      )}
    </div>
  );
};
