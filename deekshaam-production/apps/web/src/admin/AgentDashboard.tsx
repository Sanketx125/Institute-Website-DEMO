import React, { useState, useEffect } from 'react';
import { Icon } from '@deekshaam/ui';
import { api } from '../services/api';
import { useAdminFeedback } from './AdminFeedback';

export const AgentDashboard: React.FC = () => {
  const notify = useAdminFeedback();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api
      .getAgentDashboard()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        notify(err.message || 'Unable to load partner dashboard.');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="workspace-loading" role="status">Loading your partner dashboard...</div>;
  }

  const agent = data?.agent;
  const metrics = data?.metrics || {};
  const recentAdmissions = data?.recentAdmissions || [];

  const shareUrl = `${window.location.origin}/apply?ref=${agent?.promoCode || ''}`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      notify('Referral link copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', margin: '0 0 6px', letterSpacing: '-0.5px' }}>
          Welcome back, {agent?.name || 'Partner'}
        </h1>
        <p style={{ color: '#777', margin: 0 }}>
          Track your referred applicants, commission earnings, and share your exclusive promo code.
        </p>
      </div>

      {/* SHAREABLE PROMO CODE CARD */}
      <div
        className="admin-card"
        style={{
          background: 'linear-gradient(135deg, #1b365d 0%, #0b1a2e 100%)',
          color: '#ffffff',
          padding: '24px',
          borderRadius: '16px',
          marginBottom: '24px',
          boxShadow: '0 8px 24px rgba(27, 54, 93, 0.18)',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
          <div>
            <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8 }}>
              Your Partner Referral Code
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '6px' }}>
              <span
                style={{
                  fontSize: '32px',
                  fontWeight: 800,
                  letterSpacing: '2px',
                  background: 'rgba(255, 255, 255, 0.15)',
                  padding: '4px 16px',
                  borderRadius: '8px',
                  border: '1px dashed rgba(255, 255, 255, 0.4)',
                }}
              >
                {agent?.promoCode || 'PENDING'}
              </span>
              <span style={{ fontSize: '14px', background: '#e0b034', color: '#1b365d', padding: '4px 10px', borderRadius: '12px', fontWeight: 600 }}>
                {agent?.studentDiscountPercent}% Student Discount
              </span>
              <span style={{ fontSize: '14px', background: '#38a169', color: '#ffffff', padding: '4px 10px', borderRadius: '12px', fontWeight: 600 }}>
                {agent?.commissionPercent}% Commission Rate
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn btn-secondary"
              onClick={() => copyToClipboard(agent?.promoCode || '')}
              style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff' }}
            >
              <Icon name="document" size={16} /> Copy Code
            </button>
            <button
              className="btn btn-primary"
              onClick={() => copyToClipboard(shareUrl)}
              style={{ background: '#e0b034', color: '#1b365d', border: 'none', fontWeight: 700 }}
            >
              <Icon name="arrow" size={16} /> {copied ? 'Link Copied!' : 'Copy Share Link'}
            </button>
          </div>
        </div>

        <div style={{ marginTop: '16px', fontSize: '13px', opacity: 0.85 }}>
          Shareable Link: <code style={{ color: '#fed7aa', wordBreak: 'break-all' }}>{shareUrl}</code>
        </div>
      </div>

      {/* METRICS SUMMARY */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-box">
          <span>Total Referred Admissions</span>
          <strong>{metrics.totalAdmissions || 0}</strong>
          <small>Applications attributed to your code</small>
        </div>

        <div className="stat-box">
          <span>Pending Commissions</span>
          <strong style={{ color: '#d97706' }}>
            ₹{((metrics.pendingCommissionPaise || 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </strong>
          <small>Awaiting fee verification</small>
        </div>

        <div className="stat-box">
          <span>Approved (Payable)</span>
          <strong style={{ color: 'var(--green)' }}>
            ₹{((metrics.approvedCommissionPaise || 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </strong>
          <small>Verified and eligible for disbursement</small>
        </div>

        <div className="stat-box">
          <span>Total Paid Out</span>
          <strong style={{ color: '#2563eb' }}>
            ₹{((metrics.paidCommissionPaise || 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </strong>
          <small>Disbursed to your account</small>
        </div>
      </div>

      {/* RECENT ADMISSIONS TABLE */}
      <div className="admin-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', margin: '0 0 4px' }}>Recent Referred Admissions</h2>
            <p style={{ color: '#777', fontSize: '13px', margin: 0 }}>
              Latest candidate enrollments through your referral link (PII masked for privacy).
            </p>
          </div>
        </div>

        {recentAdmissions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px', color: '#777' }}>
            No candidates have enrolled using your promo code yet. Share your link to get started!
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Application ID</th>
                  <th>Applicant Name</th>
                  <th>Contact (Masked)</th>
                  <th>Program</th>
                  <th>Admission Status</th>
                  <th>Net Fee Paid</th>
                  <th>Commission</th>
                  <th>Commission Status</th>
                </tr>
              </thead>
              <tbody>
                {recentAdmissions.map((adm: any) => (
                  <tr key={adm.id}>
                    <td><strong>{adm.id}</strong></td>
                    <td>{adm.fullName}</td>
                    <td>
                      <div>{adm.phone}</div>
                      <small style={{ color: '#888' }}>{adm.email}</small>
                    </td>
                    <td><span className="badge badge-info">{adm.programSlug?.toUpperCase()}</span></td>
                    <td><span className="badge badge-neutral">{adm.status}</span></td>
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
