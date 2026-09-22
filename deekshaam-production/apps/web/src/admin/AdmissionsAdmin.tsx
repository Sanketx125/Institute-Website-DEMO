import React, { useState, useEffect } from 'react';
import { Icon } from '@deekshaam/ui';
import { api, getAuthToken } from '../services/api';

export const AdmissionsAdmin: React.FC = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [newStatus, setNewStatus] = useState('UNDER_REVIEW');
  const [statusComment, setStatusComment] = useState('');

  const fetchApplications = () => {
    const params = search ? `search=${encodeURIComponent(search)}` : '';
    api.getAdminApplications(params).then((data) => {
      setApplications(data || []);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchApplications();
  }, [search]);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;

    try {
      const stageMap: Record<string, number> = {
        SUBMITTED: 1,
        DOCUMENT_VERIFICATION: 2,
        UNDER_REVIEW: 3,
        ACCEPTED: 4,
        REJECTED: 4,
      };

      await api.updateApplicationStatus(selectedApp.id, {
        status: newStatus,
        stage: stageMap[newStatus] || 3,
        comment: statusComment,
      });

      alert('Application status updated successfully.');
      setSelectedApp(null);
      setStatusComment('');
      fetchApplications();
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    }
  };

  const handleDownloadDoc = (docId: string) => {
    const token = getAuthToken();
    window.open(`/api/admissions/admin/documents/${docId}/download?token=${token}`, '_blank');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', margin: '0 0 6px' }}>Admissions Review Inbox</h1>
          <p style={{ color: '#777', margin: 0 }}>Review applicant submissions, verify credentials, and manage admission offers.</p>
        </div>

        <input
          type="text"
          placeholder="Filter by Name, ID, or Phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            border: '1px solid #dcd8d3',
            borderRadius: '8px',
            padding: '10px 16px',
            width: '280px',
            fontSize: '13px',
          }}
        />
      </div>

      <div className="admin-card">
        {loading ? (
          <div>Loading admissions applications...</div>
        ) : applications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#777' }}>
            No applications match the search criteria.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Application ID</th>
                  <th>Applicant Name</th>
                  <th>Contact</th>
                  <th>Program</th>
                  <th>Stream / %</th>
                  <th>Stage</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id}>
                    <td><strong>{app.id}</strong></td>
                    <td>{app.fullName}</td>
                    <td>
                      <div>{app.phone}</div>
                      <small style={{ color: '#888' }}>{app.email}</small>
                    </td>
                    <td><span className="badge badge-info">{app.programSlug?.toUpperCase()}</span></td>
                    <td>{app.stream} &middot; {app.percentage}</td>
                    <td>Stage {app.stage || 1} of 5</td>
                    <td>
                      <span
                        className={`badge ${
                          app.status === 'ACCEPTED'
                            ? 'badge-success'
                            : app.status === 'REJECTED'
                            ? 'badge-danger'
                            : 'badge-warning'
                        }`}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-ghost small"
                        onClick={() => {
                          setSelectedApp(app);
                          setNewStatus(app.status);
                        }}
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAIL & STATUS MODAL */}
      {selectedApp && (
        <div className="search-overlay" onClick={() => setSelectedApp(null)}>
          <div className="search-panel" style={{ maxWidth: '680px', padding: '28px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <span className="eyebrow">{selectedApp.id}</span>
                <h2 style={{ fontSize: '24px', margin: '4px 0' }}>{selectedApp.fullName}</h2>
              </div>
              <button className="icon-btn" onClick={() => setSelectedApp(null)}>
                <Icon name="close" size={20} />
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '16px',
                background: '#faf9f7',
                padding: '16px',
                borderRadius: '12px',
                fontSize: '13px',
                marginBottom: '20px',
              }}
            >
              <div>
                <strong>Personal Details:</strong>
                <div>Phone: {selectedApp.phone}</div>
                <div>Email: {selectedApp.email}</div>
                <div>DOB: {selectedApp.dob}</div>
                <div>Location: {selectedApp.city}, {selectedApp.state}</div>
              </div>

              <div>
                <strong>Academic Profile:</strong>
                <div>Program: {selectedApp.programSlug?.toUpperCase()}</div>
                <div>Class 10: {selectedApp.board10} ({selectedApp.year10})</div>
                <div>Class 12: {selectedApp.board12} ({selectedApp.year12})</div>
                <div>Stream: {selectedApp.stream} ({selectedApp.percentage})</div>
              </div>
            </div>

            {/* UPLOADED DOCUMENTS */}
            <h3 style={{ fontSize: '15px', margin: '16px 0 8px' }}>Uploaded Verification Documents</h3>
            {selectedApp.documents && selectedApp.documents.length > 0 ? (
              <div style={{ display: 'grid', gap: '8px', marginBottom: '20px' }}>
                {selectedApp.documents.map((doc: any) => (
                  <div
                    key={doc.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: '#fff',
                      border: '1px solid #eee',
                      padding: '10px 14px',
                      borderRadius: '8px',
                    }}
                  >
                    <div>
                      <strong>{doc.documentType}</strong>
                      <span style={{ fontSize: '12px', color: '#777', marginLeft: '8px' }}>({doc.fileName})</span>
                    </div>
                    <button
                      className="btn btn-ghost small"
                      onClick={() => handleDownloadDoc(doc.id)}
                    >
                      <Icon name="download" size={14} /> Download Securely
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: '#888', fontSize: '13px', marginBottom: '20px' }}>
                No documents uploaded yet by this applicant.
              </div>
            )}

            {/* UPDATE STATUS FORM */}
            <form onSubmit={handleUpdateStatus} style={{ borderTop: '1px solid #eee', paddingTop: '16px' }}>
              <h3 style={{ fontSize: '15px', margin: '0 0 12px' }}>Update Admissions Stage</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: 700 }}>
                  New Status
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    style={{ border: '1px solid #ddd', padding: '8px 12px', borderRadius: '8px' }}
                  >
                    <option value="SUBMITTED">SUBMITTED</option>
                    <option value="DOCUMENT_VERIFICATION">DOCUMENT_VERIFICATION</option>
                    <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                    <option value="ACCEPTED">ACCEPTED (Offer Issued)</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: 700 }}>
                  Committee Remark / Reason
                  <input
                    type="text"
                    value={statusComment}
                    onChange={(e) => setStatusComment(e.target.value)}
                    placeholder="e.g. Credentials verified, seat allocated in BCA Batch A"
                    required
                    style={{ border: '1px solid #ddd', padding: '8px 12px', borderRadius: '8px' }}
                  />
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setSelectedApp(null)}>
                  Close
                </button>
                <button type="submit" className="btn btn-primary">
                  Update Status & Log Action
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
