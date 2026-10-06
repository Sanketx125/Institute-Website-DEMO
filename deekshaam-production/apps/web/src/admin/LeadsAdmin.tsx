import { Dialog } from '../components/Dialog';
import { useAdminFeedback } from './AdminFeedback';
import React, { useState, useEffect, useMemo } from 'react';
import { Icon } from '@deekshaam/ui';
import { api } from '../services/api';

export const LeadsAdmin: React.FC = () => {
  const notify = useAdminFeedback();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [newStatus, setNewStatus] = useState('CONTACTED');
  const [notes, setNotes] = useState('');
  const [assignedTo, setAssignedTo] = useState('');

  // Filters State
  const [typeTab, setTypeTab] = useState<'ALL' | 'CAMPUS_VISIT' | 'GENERAL'>('ALL');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const fetchLeads = () => {
    api
      .getAdminLeads()
      .then((data) => {
        setLeads(data || []);
        setLoading(false);
      })
      .catch((err: Error) => {
        setLoading(false);
        notify(err.message || 'Unable to load this workspace. Please try again.');
      });
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Type Tab
      if (typeTab === 'CAMPUS_VISIT' && lead.type !== 'CAMPUS_VISIT') return false;
      if (typeTab === 'GENERAL' && lead.type === 'CAMPUS_VISIT') return false;

      // Status
      if (statusFilter && lead.status !== statusFilter) return false;

      // Search
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const mName = lead.name?.toLowerCase().includes(q);
        const mPhone = lead.phone?.toLowerCase().includes(q);
        const mEmail = lead.email?.toLowerCase().includes(q);
        const mProgram = lead.program?.toLowerCase().includes(q);
        const mCounselor = lead.assignedTo?.toLowerCase().includes(q);
        if (!mName && !mPhone && !mEmail && !mProgram && !mCounselor) return false;
      }

      return true;
    });
  }, [leads, typeTab, statusFilter, search]);

  const hasActiveFilters = typeTab !== 'ALL' || statusFilter !== '' || search.trim() !== '';

  const handleResetFilters = () => {
    setTypeTab('ALL');
    setStatusFilter('');
    setSearch('');
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;

    try {
      await api.updateLeadStatus(selectedLead.id, {
        status: newStatus,
        assignedTo,
        notes,
      });
      notify('Lead status updated successfully.');
      setSelectedLead(null);
      fetchLeads();
    } catch (err: any) {
      notify(`Update failed: ${err.message}`);
    }
  };

  return (
    <div>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '28px', margin: '0 0 6px', letterSpacing: '-0.5px' }}>
            Enquiry & Campus Visit Leads
          </h1>
          <p style={{ color: '#777', margin: 0 }}>
            Follow up on callback requests, website enquiries, and scheduled tours.
          </p>
        </div>
      </div>

      {/* COMBINED SEGMENT & FILTER TOOLBAR */}
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
        {/* LEFT: Type Segment Pills */}
        <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setTypeTab('ALL')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              background: typeTab === 'ALL' ? '#1b365d' : '#f1f5f9',
              color: typeTab === 'ALL' ? '#ffffff' : '#475569',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>All Leads</span>
            <span
              style={{
                fontSize: '11px',
                padding: '1px 6px',
                borderRadius: '10px',
                background: typeTab === 'ALL' ? 'rgba(255,255,255,0.22)' : '#e2e8f0',
                color: typeTab === 'ALL' ? '#fff' : '#64748b',
                fontWeight: 700,
              }}
            >
              {leads.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTypeTab('CAMPUS_VISIT')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              background: typeTab === 'CAMPUS_VISIT' ? '#d97706' : '#f1f5f9',
              color: typeTab === 'CAMPUS_VISIT' ? '#ffffff' : '#475569',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>Campus Visits</span>
            <span
              style={{
                fontSize: '11px',
                padding: '1px 6px',
                borderRadius: '10px',
                background: typeTab === 'CAMPUS_VISIT' ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                color: typeTab === 'CAMPUS_VISIT' ? '#fff' : '#64748b',
                fontWeight: 700,
              }}
            >
              {leads.filter((l) => l.type === 'CAMPUS_VISIT').length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTypeTab('GENERAL')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              background: typeTab === 'GENERAL' ? '#0369a1' : '#f1f5f9',
              color: typeTab === 'GENERAL' ? '#ffffff' : '#475569',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>General Enquiries</span>
            <span
              style={{
                fontSize: '11px',
                padding: '1px 6px',
                borderRadius: '10px',
                background: typeTab === 'GENERAL' ? 'rgba(255,255,255,0.22)' : '#e2e8f0',
                color: typeTab === 'GENERAL' ? '#fff' : '#64748b',
                fontWeight: 700,
              }}
            >
              {leads.filter((l) => l.type !== 'CAMPUS_VISIT').length}
            </span>
          </button>
        </div>

        {/* RIGHT: Compact Inline Filters */}
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
              placeholder="Filter by name, phone..."
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

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="FOLLOW_UP">Follow Up</option>
            <option value="CLOSED">Closed</option>
          </select>

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
            >
              <Icon name="close" size={13} /> Clear
            </button>
          )}

          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, marginLeft: '4px' }}>
            ({filteredLeads.length})
          </span>
        </div>
      </div>

      <div className="admin-card">
        {loading ? (
          <div>Loading leads...</div>
        ) : filteredLeads.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#777' }}>
            No leads match the selected filter criteria.
          </div>
        ) : (
          <div className="table-responsive" role="region" aria-label="Scrollable data table" tabIndex={0}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Name</th>
                  <th>Phone / Email</th>
                  <th>Program / Details</th>
                  <th>Status</th>
                  <th>Received</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => (
                  <tr key={lead.id}>
                    <td>
                      <span className={`badge ${lead.type === 'CAMPUS_VISIT' ? 'badge-warning' : 'badge-info'}`}>
                        {lead.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td><strong>{lead.name}</strong></td>
                    <td>
                      <div>{lead.phone}</div>
                      <small style={{ color: '#888' }}>{lead.email || 'No email provided'}</small>
                    </td>
                    <td>
                      {lead.type === 'CAMPUS_VISIT' ? (
                        <div>
                          <strong>{lead.preferredDate}</strong> ({lead.preferredTime})
                        </div>
                      ) : (
                        <div>{lead.program || 'General'}</div>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${lead.status === 'NEW' ? 'badge-danger' : 'badge-success'}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td>{new Date(lead.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="btn btn-ghost small"
                        onClick={() => {
                          setSelectedLead(lead);
                          setNewStatus(lead.status);
                          setNotes(lead.notes || '');
                          setAssignedTo(lead.assignedTo || '');
                        }}
                      >
                        Action
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* LEAD ACTION MODAL */}
      {selectedLead && (
        <Dialog
          open={true}
          onClose={() => setSelectedLead(null)}
          label="Update enquiry"
          className="workspace-editor"
          preventBackdropClose={true}
          preventEscapeClose={true}
        >
          <div className="workspace-editor-body">
            <h2 style={{ fontSize: '22px', margin: '0 0 16px' }}>Manage Lead: {selectedLead.name}</h2>

            <div style={{ background: '#faf9f7', padding: '16px', borderRadius: '10px', fontSize: '13px', marginBottom: '20px' }}>
              <div><strong>Phone:</strong> {selectedLead.phone}</div>
              {selectedLead.email && <div><strong>Email:</strong> {selectedLead.email}</div>}
              <div><strong>Program:</strong> {selectedLead.program}</div>
              {selectedLead.message && (
                <div style={{ marginTop: '8px' }}>
                  <strong>Message / Notes:</strong> {selectedLead.message}
                </div>
              )}
            </div>

            <form onSubmit={handleUpdate} style={{ display: 'grid', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '12px' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: 700 }}>
                  Lifecycle Status
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    style={{ border: '1px solid #ddd', padding: '8px 12px', borderRadius: '8px' }}
                  >
                    <option value="NEW">NEW</option>
                    <option value="CONTACTED">CONTACTED</option>
                    <option value="FOLLOW_UP">FOLLOW_UP</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: 700 }}>
                  Assigned Counselor
                  <input
                    type="text"
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    placeholder="e.g. Counselor Priya"
                    style={{ border: '1px solid #ddd', padding: '8px 12px', borderRadius: '8px' }}
                  />
                </label>
              </div>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: 700 }}>
                Internal Follow-up Notes
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Record outcome of conversation or visit confirmation..."
                  style={{ border: '1px solid #ddd', padding: '8px 12px', borderRadius: '8px' }}
                />
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setSelectedLead(null)}>
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
    </div>
  );
};
