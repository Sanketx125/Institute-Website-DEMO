import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAdminFeedback } from './AdminFeedback';

export const AgentAdmissions: React.FC = () => {
  const notify = useAdminFeedback();
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchAdmissions = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search.trim()) params.append('search', search.trim());
    if (statusFilter) params.append('status', statusFilter);

    api
      .getAgentAdmissions(params.toString())
      .then((data) => {
        setAdmissions(data || []);
        setLoading(false);
      })
      .catch((err) => {
        notify(err.message || 'Unable to load referred admissions.');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAdmissions();
  }, [search, statusFilter]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', margin: '0 0 6px', letterSpacing: '-0.5px' }}>
            Referred Applications
          </h1>
          <p style={{ color: '#777', margin: 0 }}>
            List of candidates who registered through your promotional referral code.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              border: '1px solid #dcd8d3',
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '13px',
              background: '#fff',
            }}
          >
            <option value="">All Application Statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="DOCUMENT_VERIFICATION">Document Verification</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <input
            type="text"
            placeholder="Search candidate name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              border: '1px solid #dcd8d3',
              borderRadius: '8px',
              padding: '10px 16px',
              width: '260px',
              fontSize: '13px',
            }}
          />
        </div>
      </div>

      <div className="admin-card">
        {loading ? (
          <div>Loading referred applications...</div>
        ) : admissions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#777' }}>
            No referred applications found matching the selected filter.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Application ID</th>
                  <th>Applicant Name</th>
                  <th>Masked Contact</th>
                  <th>Program</th>
                  <th>Admission Stage</th>
                  <th>Status</th>
                  <th>Fee Paid</th>
                  <th>Commission</th>
                  <th>Commission Status</th>
                  <th>Submitted At</th>
                </tr>
              </thead>
              <tbody>
                {admissions.map((adm) => (
                  <tr key={adm.id}>
                    <td><strong>{adm.id}</strong></td>
                    <td>{adm.fullName}</td>
                    <td>
                      <div>{adm.phone}</div>
                      <small style={{ color: '#888' }}>{adm.email}</small>
                    </td>
                    <td><span className="badge badge-info">{adm.programSlug?.toUpperCase()}</span></td>
                    <td>Stage {adm.stage || 1} of 5</td>
                    <td>
                      <span
                        className={`badge ${
                          adm.status === 'ACCEPTED'
                            ? 'badge-success'
                            : adm.status === 'REJECTED'
                            ? 'badge-danger'
                            : 'badge-warning'
                        }`}
                      >
                        {adm.status}
                      </span>
                    </td>
                    <td>₹{((adm.feeAmountPaise || 0) / 100).toLocaleString('en-IN')}</td>
                    <td style={{ fontWeight: 600 }}>
                      ₹{((adm.commission?.commissionAmountPaise || 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          adm.commission?.status === 'PAID'
                            ? 'badge-success'
                            : adm.commission?.status === 'APPROVED'
                            ? 'badge-info'
                            : adm.commission?.status === 'REVERSED'
                            ? 'badge-danger'
                            : 'badge-warning'
                        }`}
                      >
                        {adm.commission?.status || 'PENDING'}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px', color: '#666' }}>
                      {adm.createdAt ? new Date(adm.createdAt).toLocaleDateString('en-IN') : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
