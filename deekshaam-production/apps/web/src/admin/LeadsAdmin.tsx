import { Dialog } from '../components/Dialog';
import { useAdminFeedback } from './AdminFeedback';
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export const LeadsAdmin: React.FC = () => {
  const notify = useAdminFeedback();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [newStatus, setNewStatus] = useState('CONTACTED');
  const [notes, setNotes] = useState('');
  const [assignedTo, setAssignedTo] = useState('');

  const fetchLeads = () => {
    api.getAdminLeads().then((data) => {
      setLeads(data || []);
      setLoading(false);
    }).catch((err: Error) => { setLoading(false); notify(err.message || 'Unable to load this workspace. Please try again.'); });
  };

  useEffect(() => {
    fetchLeads();
  }, []);

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', margin: '0 0 6px' }}>Enquiry & Campus Visit Leads</h1>
          <p style={{ color: '#777', margin: 0 }}>Follow up on callback requests, website enquiries, and scheduled tours.</p>
        </div>
      </div>

      <div className="admin-card">
        {loading ? (
          <div>Loading leads...</div>
        ) : leads.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#777' }}>
            No incoming leads recorded.
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
                {leads.map((lead) => (
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
        <Dialog open={true} onClose={() => setSelectedLead(null)} label="Update enquiry" className="workspace-editor">
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
