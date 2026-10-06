import { Dialog } from '../components/Dialog';
import { useAdminFeedback } from './AdminFeedback';
import React, { useState, useEffect } from 'react';
import { Icon } from '@deekshaam/ui';
import { api, getAuthToken } from '../services/api';

export const AdmissionsAdmin: React.FC = () => {
  const notify = useAdminFeedback();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState<'ALL' | 'NEW' | 'REVIEW' | 'ACCEPTED' | 'REJECTED'>('ALL');
  const [programFilter, setProgramFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [newStatus, setNewStatus] = useState('UNDER_REVIEW');
  const [statusComment, setStatusComment] = useState('');

  const fetchApplications = () => {
    api
      .getAdminApplications()
      .then((data) => {
        setApplications(data || []);
        setLoading(false);
      })
      .catch((err: Error) => {
        setLoading(false);
        notify(err.message || 'Unable to load this workspace. Please try again.');
      });
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const filteredApplications = React.useMemo(() => {
    return applications.filter((app) => {
      // Status tab
      if (statusTab === 'NEW' && app.status !== 'SUBMITTED') return false;
      if (statusTab === 'REVIEW' && app.status !== 'UNDER_REVIEW' && app.status !== 'DOCUMENT_VERIFICATION') return false;
      if (statusTab === 'ACCEPTED' && app.status !== 'ACCEPTED') return false;
      if (statusTab === 'REJECTED' && app.status !== 'REJECTED') return false;

      // Status dropdown
      if (statusFilter && app.status !== statusFilter) return false;

      // Program filter
      if (programFilter && app.programSlug?.toLowerCase() !== programFilter.toLowerCase()) return false;

      // Search
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const mId = app.id?.toLowerCase().includes(q);
        const mName = app.fullName?.toLowerCase().includes(q);
        const mPhone = app.phone?.toLowerCase().includes(q);
        const mEmail = app.email?.toLowerCase().includes(q);
        if (!mId && !mName && !mPhone && !mEmail) return false;
      }

      return true;
    });
  }, [applications, statusTab, statusFilter, programFilter, search]);

  const hasActiveFilters = statusTab !== 'ALL' || programFilter !== '' || statusFilter !== '' || search.trim() !== '';

  const handleResetFilters = () => {
    setStatusTab('ALL');
    setProgramFilter('');
    setStatusFilter('');
    setSearch('');
  };

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

      notify('Application status updated successfully.');
      setSelectedApp(null);
      setStatusComment('');
      fetchApplications();
    } catch (err: any) {
      notify(`Update failed: ${err.message}`);
    }
  };

  const handleDownloadDoc = async (docId: string) => {
    try {
      const response = await fetch(`/api/admissions/admin/documents/${encodeURIComponent(docId)}/download`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      if (!response.ok) throw new Error('Unable to download this document. Please sign in again or retry.');
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = url;
      link.download =
        response.headers.get('Content-Disposition')?.match(/filename="([^"\r\n]+)"/)?.[1] || `document-${docId}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err: any) {
      notify(err.message);
    }
  };

  return (
    <div>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '28px', margin: '0 0 6px', letterSpacing: '-0.5px' }}>Admissions Review Inbox</h1>
          <p style={{ color: '#777', margin: 0 }}>
            Review applicant submissions, verify credentials, and manage admission offers.
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
        {/* LEFT: Status Segment Pills */}
        <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => {
              setStatusTab('ALL');
              setStatusFilter('');
            }}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              background: statusTab === 'ALL' ? '#1b365d' : '#f1f5f9',
              color: statusTab === 'ALL' ? '#ffffff' : '#475569',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>All</span>
            <span
              style={{
                fontSize: '11px',
                padding: '1px 6px',
                borderRadius: '10px',
                background: statusTab === 'ALL' ? 'rgba(255,255,255,0.22)' : '#e2e8f0',
                color: statusTab === 'ALL' ? '#fff' : '#64748b',
                fontWeight: 700,
              }}
            >
              {applications.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setStatusTab('NEW');
              setStatusFilter('SUBMITTED');
            }}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              background: statusTab === 'NEW' ? '#0369a1' : '#f1f5f9',
              color: statusTab === 'NEW' ? '#ffffff' : '#475569',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>New Submissions</span>
            <span
              style={{
                fontSize: '11px',
                padding: '1px 6px',
                borderRadius: '10px',
                background: statusTab === 'NEW' ? 'rgba(255,255,255,0.22)' : '#e2e8f0',
                color: statusTab === 'NEW' ? '#fff' : '#64748b',
                fontWeight: 700,
              }}
            >
              {applications.filter((a) => a.status === 'SUBMITTED').length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setStatusTab('REVIEW');
              setStatusFilter('');
            }}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              background: statusTab === 'REVIEW' ? '#d97706' : '#f1f5f9',
              color: statusTab === 'REVIEW' ? '#ffffff' : '#475569',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>Under Review</span>
            <span
              style={{
                fontSize: '11px',
                padding: '1px 6px',
                borderRadius: '10px',
                background: statusTab === 'REVIEW' ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                color: statusTab === 'REVIEW' ? '#fff' : '#64748b',
                fontWeight: 700,
              }}
            >
              {applications.filter((a) => a.status === 'UNDER_REVIEW' || a.status === 'DOCUMENT_VERIFICATION').length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setStatusTab('ACCEPTED');
              setStatusFilter('ACCEPTED');
            }}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              background: statusTab === 'ACCEPTED' ? '#16a34a' : '#f1f5f9',
              color: statusTab === 'ACCEPTED' ? '#ffffff' : '#475569',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>Accepted</span>
            <span
              style={{
                fontSize: '11px',
                padding: '1px 6px',
                borderRadius: '10px',
                background: statusTab === 'ACCEPTED' ? 'rgba(255,255,255,0.22)' : '#e2e8f0',
                color: statusTab === 'ACCEPTED' ? '#fff' : '#64748b',
                fontWeight: 700,
              }}
            >
              {applications.filter((a) => a.status === 'ACCEPTED').length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setStatusTab('REJECTED');
              setStatusFilter('REJECTED');
            }}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              background: statusTab === 'REJECTED' ? '#dc2626' : '#f1f5f9',
              color: statusTab === 'REJECTED' ? '#ffffff' : '#475569',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>Rejected</span>
            <span
              style={{
                fontSize: '11px',
                padding: '1px 6px',
                borderRadius: '10px',
                background: statusTab === 'REJECTED' ? 'rgba(255,255,255,0.22)' : '#e2e8f0',
                color: statusTab === 'REJECTED' ? '#fff' : '#64748b',
                fontWeight: 700,
              }}
            >
              {applications.filter((a) => a.status === 'REJECTED').length}
            </span>
          </button>
        </div>

        {/* RIGHT: Compact Inline Controls */}
        <div className="admin-toolbar-filter">
          {/* SEARCH */}
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
              placeholder="Filter Name, ID, Phone..."
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

          {/* PROGRAM SELECT */}
          <select
            value={programFilter}
            onChange={(e) => setProgramFilter(e.target.value)}
          >
            <option value="">All Programs</option>
            <option value="bba">BBA</option>
            <option value="bca">BCA</option>
            <option value="bcom">B.Com</option>
          </select>

          {/* STATUS SELECT */}
          <select
            value={statusFilter}
            onChange={(e) => {
              const val = e.target.value;
              setStatusFilter(val);
              if (val === 'SUBMITTED') setStatusTab('NEW');
              else if (val === 'ACCEPTED') setStatusTab('ACCEPTED');
              else if (val === 'REJECTED') setStatusTab('REJECTED');
              else if (val === 'UNDER_REVIEW' || val === 'DOCUMENT_VERIFICATION') setStatusTab('REVIEW');
              else if (!val) setStatusTab('ALL');
            }}
          >
            <option value="">All Stages</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="DOCUMENT_VERIFICATION">Doc Verification</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="REJECTED">Rejected</option>
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
            ({filteredApplications.length})
          </span>
        </div>
      </div>

      <div className="admin-card">
        {loading ? (
          <div>Loading admissions applications...</div>
        ) : filteredApplications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#777' }}>
            No applications match the search or filter criteria.
          </div>
        ) : (
          <div className="table-responsive" role="region" aria-label="Scrollable data table" tabIndex={0}>
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
                {filteredApplications.map((app) => (
                  <tr key={app.id}>
                    <td><strong>{app.id}</strong></td>
                    <td>{app.fullName}</td>
                    <td>
                      <div>{app.phone}</div>
                      <small style={{ color: '#888' }}>{app.email}</small>
                    </td>
                    <td>
                      <span className="badge badge-info">{app.programSlug?.toUpperCase()}</span>
                      {app.promoCodeUsed && (
                        <div style={{ marginTop: '4px' }}>
                          <span className="badge badge-warning" style={{ fontSize: '10px' }}>
                            Referred: {app.agent ? `${app.agent.name} (${app.promoCodeUsed})` : app.promoCodeUsed}
                          </span>
                        </div>
                      )}
                    </td>
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
        <Dialog
          open={true}
          onClose={() => setSelectedApp(null)}
          label="Review application"
          className="workspace-editor"
          preventBackdropClose={true}
          preventEscapeClose={true}
        >
          <div className="workspace-editor-body">
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
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
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

              {selectedApp.promoCodeUsed && (
                <div>
                  <strong>Referral Attribution:</strong>
                  <div>Code Used: <code style={{ fontWeight: 700 }}>{selectedApp.promoCodeUsed}</code></div>
                  <div>Discount Applied: {selectedApp.discountPercentApplied}% (₹{((selectedApp.discountAmountPaise || 0) / 100).toFixed(2)})</div>
                  {selectedApp.agent && <div>Agent: {selectedApp.agent.name} ({selectedApp.agent.email})</div>}
                </div>
              )}
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
                      <strong style={{ color: doc.documentType === 'SIGNATURE' ? '#0f766e' : '#0f172a' }}>
                        {doc.documentType === 'SIGNATURE'
                          ? 'Applicant Signature'
                          : doc.documentType === 'PHOTO'
                          ? 'Applicant Photo'
                          : doc.documentType === 'MARKSHEET_10'
                          ? '10th Marksheet'
                          : doc.documentType === 'MARKSHEET_12'
                          ? '12th Marksheet'
                          : doc.documentType}
                      </strong>
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '12px' }}>
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
        </Dialog>
      )}
    </div>
  );
};
