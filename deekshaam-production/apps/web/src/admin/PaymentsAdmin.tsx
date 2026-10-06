import React, { useState, useEffect, useMemo } from 'react';
import { useAdminFeedback } from './AdminFeedback';
import { api } from '../services/api';
import { Icon } from '@deekshaam/ui';

export const PaymentsAdmin: React.FC = () => {
  const notify = useAdminFeedback();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState<'ALL' | 'SUCCESS' | 'PENDING' | 'FAILED'>('ALL');
  const [purposeFilter, setPurposeFilter] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchPayments = () => {
    setLoading(true);
    api
      .getAdminPayments()
      .then((data) => {
        setPayments(data || []);
        setLoading(false);
      })
      .catch((err: Error) => {
        setLoading(false);
        notify(err.message || 'Unable to load payment records. Please try again.');
      });
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  // Compute Metrics across all payments
  const totalCapturedPaise = useMemo(
    () => payments.filter((p) => p.status === 'SUCCESS').reduce((sum, p) => sum + (p.amount || 0), 0),
    [payments]
  );
  const successCount = useMemo(() => payments.filter((p) => p.status === 'SUCCESS').length, [payments]);
  const pendingCount = useMemo(() => payments.filter((p) => p.status === 'PENDING' || p.status === 'CREATED').length, [payments]);
  const failedCount = useMemo(() => payments.filter((p) => p.status === 'FAILED').length, [payments]);

  // Extract distinct purposes
  const purposes = useMemo(() => {
    const set = new Set<string>();
    payments.forEach((p) => {
      if (p.purpose) set.add(p.purpose);
    });
    return Array.from(set);
  }, [payments]);

  // Filtered payments
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      if (statusTab !== 'ALL') {
        if (statusTab === 'PENDING' && p.status !== 'PENDING' && p.status !== 'CREATED') return false;
        if (statusTab !== 'PENDING' && p.status !== statusTab) return false;
      }
      if (purposeFilter && p.purpose !== purposeFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const match =
          (p.orderId && p.orderId.toLowerCase().includes(q)) ||
          (p.paymentId && p.paymentId.toLowerCase().includes(q)) ||
          (p.customerName && p.customerName.toLowerCase().includes(q)) ||
          (p.customerEmail && p.customerEmail.toLowerCase().includes(q)) ||
          (p.applicationId && p.applicationId.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [payments, statusTab, purposeFilter, search]);

  const handleCopy = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard?.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    });
  };

  const handleResetFilters = () => {
    setStatusTab('ALL');
    setPurposeFilter('');
    setSearch('');
  };

  const isFiltered = statusTab !== 'ALL' || purposeFilter !== '' || search.trim() !== '';

  return (
    <div>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '28px', margin: '0 0 6px', letterSpacing: '-0.5px' }}>Payments Ledger</h1>
          <p style={{ color: '#777', margin: 0 }}>
            Reconcile Razorpay transactions, captured admissions fees, and gateway order statuses.
          </p>
        </div>
        <button className="btn btn-secondary" onClick={fetchPayments} disabled={loading} title="Refresh payment records">
          <Icon name="check" size={14} /> Refresh
        </button>
      </div>

      {/* METRIC STRIP */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-box">
          <span>Total Captured</span>
          <strong style={{ color: '#16a34a' }}>
            ₹{(totalCapturedPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </strong>
          <small>Verified successful settlements</small>
        </div>

        <div className="stat-box">
          <span>Successful Transactions</span>
          <strong style={{ color: '#0f172a' }}>{successCount}</strong>
          <small>{payments.length ? `${Math.round((successCount / payments.length) * 100)}% conversion rate` : 'No orders yet'}</small>
        </div>

        <div className="stat-box">
          <span>Pending / Uncaptured</span>
          <strong style={{ color: '#d97706' }}>{pendingCount}</strong>
          <small>Awaiting student gateway completion</small>
        </div>

        <div className="stat-box">
          <span>Failed / Cancelled</span>
          <strong style={{ color: failedCount > 0 ? '#dc2626' : '#64748b' }}>{failedCount}</strong>
          <small>Unsuccessful or aborted attempts</small>
        </div>
      </div>

      {/* UNIFIED TOOLBAR: SEGMENT TABS LEFT, COMPACT CONTROLS RIGHT */}
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
            onClick={() => setStatusTab('ALL')}
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
            <span>All Payments</span>
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
              {payments.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusTab('SUCCESS')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              background: statusTab === 'SUCCESS' ? '#15803d' : '#f1f5f9',
              color: statusTab === 'SUCCESS' ? '#ffffff' : '#475569',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>Successful</span>
            <span
              style={{
                fontSize: '11px',
                padding: '1px 6px',
                borderRadius: '10px',
                background: statusTab === 'SUCCESS' ? 'rgba(255,255,255,0.22)' : '#e2e8f0',
                color: statusTab === 'SUCCESS' ? '#fff' : '#64748b',
                fontWeight: 700,
              }}
            >
              {successCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusTab('PENDING')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              background: statusTab === 'PENDING' ? '#b45309' : '#f1f5f9',
              color: statusTab === 'PENDING' ? '#ffffff' : '#475569',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>Pending</span>
            <span
              style={{
                fontSize: '11px',
                padding: '1px 6px',
                borderRadius: '10px',
                background: statusTab === 'PENDING' ? 'rgba(255,255,255,0.22)' : '#e2e8f0',
                color: statusTab === 'PENDING' ? '#fff' : '#64748b',
                fontWeight: 700,
              }}
            >
              {pendingCount}
            </span>
          </button>

          {failedCount > 0 && (
            <button
              type="button"
              onClick={() => setStatusTab('FAILED')}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                border: 'none',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                background: statusTab === 'FAILED' ? '#b91c1c' : '#f1f5f9',
                color: statusTab === 'FAILED' ? '#ffffff' : '#475569',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>Failed</span>
              <span
                style={{
                  fontSize: '11px',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  background: statusTab === 'FAILED' ? 'rgba(255,255,255,0.22)' : '#e2e8f0',
                  color: statusTab === 'FAILED' ? '#fff' : '#64748b',
                  fontWeight: 700,
                }}
              >
                {failedCount}
              </span>
            </button>
          )}
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
              placeholder="Search order, payment, name..."
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

          {purposes.length > 0 && (
            <select
              value={purposeFilter}
              onChange={(e) => setPurposeFilter(e.target.value)}
              title="Filter by payment purpose"
            >
              <option value="">All Purposes</option>
              {purposes.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          )}

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
            Showing {filteredPayments.length} of {payments.length}
          </div>
        </div>
      </div>

      {/* TABLE CARD */}
      <div className="admin-card">
        {loading ? (
          <div style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
            Loading transactions...
          </div>
        ) : payments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#777' }}>
            No payment transactions recorded yet.
          </div>
        ) : filteredPayments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#777' }}>
            <p style={{ margin: '0 0 14px', fontSize: '15px', color: '#475569' }}>
              No transactions match your current search and filters.
            </p>
            <button className="btn btn-secondary" onClick={handleResetFilters}>
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="table-responsive" role="region" aria-label="Scrollable payments table" tabIndex={0}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order Reference</th>
                  <th>Gateway Payment ID</th>
                  <th>Customer</th>
                  <th>Application Ref</th>
                  <th>Purpose</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Captured At</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((p) => {
                  const isOrderCopied = copiedId === `order-${p.orderId}`;
                  const isPaymentCopied = copiedId === `pay-${p.paymentId}`;

                  return (
                    <tr key={p.id || p.orderId}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <code style={{ fontSize: '12px', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                            {p.orderId}
                          </code>
                          <button
                            type="button"
                            onClick={() => handleCopy(p.orderId, `order-${p.orderId}`)}
                            title="Copy Order ID"
                            style={{
                              background: 'none',
                              border: 'none',
                              color: isOrderCopied ? '#16a34a' : '#94a3b8',
                              cursor: 'pointer',
                              padding: '2px',
                              fontSize: '11px',
                            }}
                          >
                            {isOrderCopied ? '✓' : '⧉'}
                          </button>
                        </div>
                      </td>
                      <td>
                        {p.paymentId ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <code style={{ fontSize: '12px', background: '#f8fafc', padding: '2px 6px', borderRadius: '4px' }}>
                              {p.paymentId}
                            </code>
                            <button
                              type="button"
                              onClick={() => handleCopy(p.paymentId, `pay-${p.paymentId}`)}
                              title="Copy Payment ID"
                              style={{
                                background: 'none',
                                border: 'none',
                                color: isPaymentCopied ? '#16a34a' : '#94a3b8',
                                cursor: 'pointer',
                                padding: '2px',
                                fontSize: '11px',
                              }}
                            >
                              {isPaymentCopied ? '✓' : '⧉'}
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '12px' }}>Uncaptured</span>
                        )}
                      </td>
                      <td>
                        <div>
                          <strong>{p.customerName || 'N/A'}</strong>
                        </div>
                        <small style={{ color: '#64748b' }}>{p.customerEmail || '—'}</small>
                      </td>
                      <td>
                        {p.applicationId ? (
                          <span
                            style={{
                              fontWeight: 600,
                              fontFamily: 'monospace',
                              background: '#eff6ff',
                              color: '#1d4ed8',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '11px',
                            }}
                          >
                            {p.applicationId}
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>-</span>
                        )}
                      </td>
                      <td>
                        <span className="badge badge-info" style={{ textTransform: 'none', fontSize: '11px' }}>
                          {p.purpose || 'APPLICATION_FEE'}
                        </span>
                      </td>
                      <td>
                        <strong style={{ fontSize: '14px', color: p.status === 'SUCCESS' ? '#15803d' : '#0f172a' }}>
                          ₹{((p.amount || 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </strong>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            p.status === 'SUCCESS'
                              ? 'badge-success'
                              : p.status === 'PENDING' || p.status === 'CREATED'
                              ? 'badge-warning'
                              : p.status === 'FAILED'
                              ? 'badge-danger'
                              : 'badge-neutral'
                          }`}
                          style={{ fontWeight: 600 }}
                        >
                          {p.status === 'CREATED' ? 'INITIATED' : p.status}
                        </span>
                      </td>
                      <td style={{ whiteSpace: 'nowrap', fontSize: '12px', color: '#64748b' }}>
                        {p.verifiedAt
                          ? new Date(p.verifiedAt).toLocaleString('en-IN', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })
                          : p.createdAt
                          ? new Date(p.createdAt).toLocaleString('en-IN', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })
                          : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
