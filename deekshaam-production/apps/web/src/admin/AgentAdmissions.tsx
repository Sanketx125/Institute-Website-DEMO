import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { useAdminFeedback } from './AdminFeedback';
import { Icon } from '@deekshaam/ui';

export const AgentAdmissions: React.FC = () => {
  const notify = useAdminFeedback();
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState('');
  const [programFilter, setProgramFilter] = useState('');

  const fetchAdmissions = () => {
    setLoading(true);
    api
      .getAgentAdmissions('')
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
  }, []);

  const counts = useMemo(() => {
    return {
      all: admissions.length,
      submitted: admissions.filter((a) => a.status === 'SUBMITTED').length,
      underReview: admissions.filter((a) => a.status === 'UNDER_REVIEW' || a.status === 'DOCUMENT_VERIFICATION').length,
      accepted: admissions.filter((a) => a.status === 'ACCEPTED').length,
      rejected: admissions.filter((a) => a.status === 'REJECTED').length,
    };
  }, [admissions]);

  const filteredAdmissions = useMemo(() => {
    return admissions.filter((adm) => {
      if (statusTab === 'SUBMITTED' && adm.status !== 'SUBMITTED') return false;
      if (statusTab === 'UNDER_REVIEW' && adm.status !== 'UNDER_REVIEW' && adm.status !== 'DOCUMENT_VERIFICATION')
        return false;
      if (statusTab === 'ACCEPTED' && adm.status !== 'ACCEPTED') return false;
      if (statusTab === 'REJECTED' && adm.status !== 'REJECTED') return false;

      if (programFilter && (adm.programSlug || '').toLowerCase() !== programFilter.toLowerCase()) return false;

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const id = (adm.id || '').toLowerCase();
        const name = (adm.fullName || '').toLowerCase();
        const phone = (adm.phone || '').toLowerCase();
        const email = (adm.email || '').toLowerCase();
        if (!id.includes(q) && !name.includes(q) && !phone.includes(q) && !email.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [admissions, statusTab, programFilter, search]);

  const handleResetFilters = () => {
    setStatusTab('');
    setProgramFilter('');
    setSearch('');
  };

  const isFiltered = statusTab !== '' || programFilter !== '' || search.trim() !== '';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '28px', margin: '0 0 6px', letterSpacing: '-0.5px' }}>Referred Applications</h1>
          <p style={{ color: '#777', margin: 0 }}>
            List of candidates who registered through your promotional referral code.
          </p>
        </div>
        <button className="btn btn-secondary" onClick={fetchAdmissions} disabled={loading} title="Refresh applicant list">
          <Icon name="check" size={14} /> Refresh
        </button>
      </div>

      {/* UNIFIED TOOLBAR: SEGMENT PILLS ON LEFT, COMPACT CONTROLS ON RIGHT */}
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
        {/* LEFT: Segment Tabs */}
        <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setStatusTab('')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              background: statusTab === '' ? '#1b365d' : '#f1f5f9',
              color: statusTab === '' ? '#ffffff' : '#475569',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>All Applications</span>
            <span
              style={{
                fontSize: '11px',
                padding: '1px 6px',
                borderRadius: '10px',
                background: statusTab === '' ? 'rgba(255,255,255,0.22)' : '#e2e8f0',
                color: statusTab === '' ? '#fff' : '#64748b',
                fontWeight: 700,
              }}
            >
              {counts.all}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusTab('SUBMITTED')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              background: statusTab === 'SUBMITTED' ? '#0284c7' : '#f1f5f9',
              color: statusTab === 'SUBMITTED' ? '#ffffff' : '#475569',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>Submitted</span>
            <span
              style={{
                fontSize: '11px',
                padding: '1px 6px',
                borderRadius: '10px',
                background: statusTab === 'SUBMITTED' ? 'rgba(255,255,255,0.22)' : '#e2e8f0',
                color: statusTab === 'SUBMITTED' ? '#fff' : '#64748b',
                fontWeight: 700,
              }}
            >
              {counts.submitted}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusTab('UNDER_REVIEW')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              background: statusTab === 'UNDER_REVIEW' ? '#b45309' : '#f1f5f9',
              color: statusTab === 'UNDER_REVIEW' ? '#ffffff' : '#475569',
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
                background: statusTab === 'UNDER_REVIEW' ? 'rgba(255,255,255,0.22)' : '#e2e8f0',
                color: statusTab === 'UNDER_REVIEW' ? '#fff' : '#64748b',
                fontWeight: 700,
              }}
            >
              {counts.underReview}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusTab('ACCEPTED')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              background: statusTab === 'ACCEPTED' ? '#15803d' : '#f1f5f9',
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
              {counts.accepted}
            </span>
          </button>

          {counts.rejected > 0 && (
            <button
              type="button"
              onClick={() => setStatusTab('REJECTED')}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                border: 'none',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                background: statusTab === 'REJECTED' ? '#b91c1c' : '#f1f5f9',
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
                {counts.rejected}
              </span>
            </button>
          )}
        </div>

        {/* RIGHT: Compact Inline Filters */}
        <div className="admin-toolbar-filter">
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
              placeholder="Search candidate name, id..."
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
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '2px 4px',
                  fontSize: '12px',
                  lineHeight: 1,
                }}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          <select
            value={programFilter}
            onChange={(e) => setProgramFilter(e.target.value)}
            title="Filter by program"
          >
            <option value="">All Programs</option>
            <option value="bba">BBA</option>
            <option value="bca">BCA</option>
            <option value="bcom">B.Com</option>
          </select>

          {isFiltered && (
            <button
              type="button"
              onClick={handleResetFilters}
              style={{
                height: '36px',
                padding: '0 12px',
                border: '1px dashed #cbd5e1',
                borderRadius: '8px',
                background: '#f8fafc',
                color: '#64748b',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Reset
            </button>
          )}

          <div
            style={{
              fontSize: '12px',
              color: '#64748b',
              fontWeight: 600,
              padding: '4px 10px',
              background: '#f1f5f9',
              borderRadius: '6px',
              whiteSpace: 'nowrap',
            }}
          >
            Showing {filteredAdmissions.length} of {admissions.length}
          </div>
        </div>
      </div>

      <div className="admin-card">
        {loading ? (
          <div style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
            Loading referred applications...
          </div>
        ) : admissions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#777' }}>
            No referred applications found yet. Candidates using your referral promo code will appear here.
          </div>
        ) : filteredAdmissions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#777' }}>
            <p style={{ margin: '0 0 14px', fontSize: '15px', color: '#475569' }}>
              No applications match your current search and filters.
            </p>
            <button className="btn btn-secondary" onClick={handleResetFilters}>
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="table-responsive" role="region" aria-label="Scrollable referred applications table" tabIndex={0}>
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
                {filteredAdmissions.map((adm) => (
                  <tr key={adm.id}>
                    <td>
                      <code style={{ fontSize: '12px', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                        {adm.id}
                      </code>
                    </td>
                    <td><strong>{adm.fullName}</strong></td>
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
                    <td style={{ fontWeight: 600, color: '#1b365d' }}>
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
                    <td style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>
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
