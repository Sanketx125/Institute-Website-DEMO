import React, { useState, useEffect, useMemo } from 'react';
import { Icon } from '@deekshaam/ui';
import { Dialog } from '../components/Dialog';
import { api } from '../services/api';
import { useAdminFeedback } from './AdminFeedback';

export const CommissionsAdmin: React.FC = () => {
  const notify = useAdminFeedback();
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [agents, setAgents] = useState<any[]>([]);

  // Payout Modal
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [payoutAgentId, setPayoutAgentId] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('BANK_TRANSFER');
  const [payoutReference, setPayoutReference] = useState('');
  const [payoutNote, setPayoutNote] = useState('');
  const [processingPayout, setProcessingPayout] = useState(false);

  const fetchCommissions = () => {
    setLoading(true);
    api
      .getCommissions('')
      .then((data) => {
        setCommissions(data || []);
        setLoading(false);
      })
      .catch((err) => {
        notify(err.message || 'Unable to load commissions ledger.');
        setLoading(false);
      });
  };

  useEffect(() => {
    api.getAgents().then((res) => setAgents(res || [])).catch(() => {});
  }, []);

  useEffect(() => {
    fetchCommissions();
  }, []);

  // System-wide metric totals across all records
  const totalCommissionPaise = useMemo(
    () => commissions.reduce((sum, c) => sum + (c.commissionAmountPaise || 0), 0),
    [commissions]
  );
  const pendingPaise = useMemo(
    () => commissions.filter((c) => c.status === 'PENDING').reduce((sum, c) => sum + (c.commissionAmountPaise || 0), 0),
    [commissions]
  );
  const approvedPaise = useMemo(
    () => commissions.filter((c) => c.status === 'APPROVED').reduce((sum, c) => sum + (c.commissionAmountPaise || 0), 0),
    [commissions]
  );
  const paidPaise = useMemo(
    () => commissions.filter((c) => c.status === 'PAID').reduce((sum, c) => sum + (c.commissionAmountPaise || 0), 0),
    [commissions]
  );

  const pendingCount = useMemo(() => commissions.filter((c) => c.status === 'PENDING').length, [commissions]);
  const approvedCount = useMemo(() => commissions.filter((c) => c.status === 'APPROVED').length, [commissions]);
  const paidCount = useMemo(() => commissions.filter((c) => c.status === 'PAID').length, [commissions]);

  // Group approved payable by agent
  const payableByAgent: Record<string, { agentName: string; count: number; totalPaise: number }> = useMemo(() => {
    const map: Record<string, { agentName: string; count: number; totalPaise: number }> = {};
    commissions
      .filter((c) => c.status === 'APPROVED')
      .forEach((c) => {
        const aId = c.agentId;
        if (!map[aId]) {
          map[aId] = {
            agentName: c.agent?.name || aId,
            count: 0,
            totalPaise: 0,
          };
        }
        map[aId].count += 1;
        map[aId].totalPaise += c.commissionAmountPaise || 0;
      });
    return map;
  }, [commissions]);

  // Client-filtered commissions
  const filteredCommissions = useMemo(() => {
    return commissions.filter((c) => {
      if (statusFilter && c.status !== statusFilter) return false;
      if (selectedAgentId && c.agentId !== selectedAgentId) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const agentName = (c.agent?.name || '').toLowerCase();
        const promoCode = (c.agent?.promoCode || '').toLowerCase();
        const admissionId = (c.admissionId || '').toLowerCase();
        const id = (c.id || '').toLowerCase();
        const studentName = (c.studentName || '').toLowerCase();
        if (
          !agentName.includes(q) &&
          !promoCode.includes(q) &&
          !admissionId.includes(q) &&
          !id.includes(q) &&
          !studentName.includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [commissions, statusFilter, selectedAgentId, search]);

  const handleRecordPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutAgentId) {
      notify('Please select an agent to disburse.');
      return;
    }
    setProcessingPayout(true);
    try {
      await api.recordPayout({
        agentId: payoutAgentId,
        method: payoutMethod,
        reference: payoutReference.trim() || undefined,
        note: payoutNote.trim() || undefined,
      });
      notify('Payout recorded successfully! Associated commissions marked as PAID.');
      setPayoutModalOpen(false);
      setPayoutReference('');
      setPayoutNote('');
      fetchCommissions();
    } catch (err: any) {
      notify(`Payout recording failed: ${err.message}`);
    } finally {
      setProcessingPayout(false);
    }
  };

  const handleResetFilters = () => {
    setStatusFilter('');
    setSelectedAgentId('');
    setSearch('');
  };

  const isFiltered = statusFilter !== '' || selectedAgentId !== '' || search.trim() !== '';

  const exportCSV = () => {
    const dataset = filteredCommissions.length > 0 ? filteredCommissions : commissions;
    if (dataset.length === 0) {
      notify('No data to export.');
      return;
    }
    const headers = ['Commission ID', 'Agent Name', 'Promo Code', 'Application ID', 'Base Amount (INR)', 'Commission %', 'Commission Amount (INR)', 'Status', 'Created Date'];
    const rows = dataset.map((c) => [
      c.id,
      `"${c.agent?.name || ''}"`,
      c.agent?.promoCode || '',
      c.admissionId || '',
      ((c.baseAmountPaise || 0) / 100).toFixed(2),
      c.commissionPercent,
      ((c.commissionAmountPaise || 0) / 100).toFixed(2),
      c.status,
      c.createdAt ? new Date(c.createdAt).toISOString() : '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `commissions_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', margin: '0 0 6px', letterSpacing: '-0.5px' }}>
            Commissions & Payouts Ledger
          </h1>
          <p style={{ color: '#777', margin: 0 }}>
            Track referral commissions, verify eligibility, record partner payouts, and export data.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={exportCSV}>
            <Icon name="document" size={16} /> Export CSV
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              const firstPayable = Object.keys(payableByAgent)[0] || '';
              setPayoutAgentId(firstPayable);
              setPayoutModalOpen(true);
            }}
          >
            <Icon name="check" size={16} /> Record Partner Payout
          </button>
        </div>
      </div>

      {/* METRIC BOXES */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-box">
          <span>Total Commission</span>
          <strong>₹{(totalCommissionPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
          <small>{commissions.length} total commission rows</small>
        </div>

        <div className="stat-box">
          <span>Pending Verification</span>
          <strong style={{ color: '#d97706' }}>
            ₹{(pendingPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </strong>
          <small>Candidate fee awaiting payment</small>
        </div>

        <div className="stat-box">
          <span>Approved (Payable)</span>
          <strong style={{ color: 'var(--green)' }}>
            ₹{(approvedPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </strong>
          <small>Ready for disbursement</small>
        </div>

        <div className="stat-box">
          <span>Disbursed (Paid)</span>
          <strong style={{ color: '#2563eb' }}>
            ₹{(paidPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </strong>
          <small>Completed payouts</small>
        </div>
      </div>

      {/* UNIFIED TOOLBAR: SEGMENT PILLS LEFT, COMPACT CONTROLS RIGHT */}
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
            onClick={() => setStatusFilter('')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              background: statusFilter === '' ? '#1b365d' : '#f1f5f9',
              color: statusFilter === '' ? '#ffffff' : '#475569',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>All Commissions</span>
            <span
              style={{
                fontSize: '11px',
                padding: '1px 6px',
                borderRadius: '10px',
                background: statusFilter === '' ? 'rgba(255,255,255,0.22)' : '#e2e8f0',
                color: statusFilter === '' ? '#fff' : '#64748b',
                fontWeight: 700,
              }}
            >
              {commissions.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('PENDING')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              background: statusFilter === 'PENDING' ? '#b45309' : '#f1f5f9',
              color: statusFilter === 'PENDING' ? '#ffffff' : '#475569',
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
                background: statusFilter === 'PENDING' ? 'rgba(255,255,255,0.22)' : '#e2e8f0',
                color: statusFilter === 'PENDING' ? '#fff' : '#64748b',
                fontWeight: 700,
              }}
            >
              {pendingCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('APPROVED')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              background: statusFilter === 'APPROVED' ? '#15803d' : '#f1f5f9',
              color: statusFilter === 'APPROVED' ? '#ffffff' : '#475569',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>Approved (Payable)</span>
            <span
              style={{
                fontSize: '11px',
                padding: '1px 6px',
                borderRadius: '10px',
                background: statusFilter === 'APPROVED' ? 'rgba(255,255,255,0.22)' : '#e2e8f0',
                color: statusFilter === 'APPROVED' ? '#fff' : '#64748b',
                fontWeight: 700,
              }}
            >
              {approvedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('PAID')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              background: statusFilter === 'PAID' ? '#2563eb' : '#f1f5f9',
              color: statusFilter === 'PAID' ? '#ffffff' : '#475569',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>Disbursed (Paid)</span>
            <span
              style={{
                fontSize: '11px',
                padding: '1px 6px',
                borderRadius: '10px',
                background: statusFilter === 'PAID' ? 'rgba(255,255,255,0.22)' : '#e2e8f0',
                color: statusFilter === 'PAID' ? '#fff' : '#64748b',
                fontWeight: 700,
              }}
            >
              {paidCount}
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
              placeholder="Search agent, code, app..."
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
            value={selectedAgentId}
            onChange={(e) => setSelectedAgentId(e.target.value)}
            title="Filter by referral agent"
          >
            <option value="">All Referral Agents</option>
            {agents.map((ag) => (
              <option key={ag.id} value={ag.id}>
                {ag.name} ({ag.promoCode})
              </option>
            ))}
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
            Showing {filteredCommissions.length} of {commissions.length}
          </div>
        </div>
      </div>

      {/* COMMISSIONS TABLE */}
      <div className="admin-card">
        {loading ? (
          <div style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
            Loading commissions ledger...
          </div>
        ) : commissions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#777' }}>
            No commission records recorded in the ledger yet.
          </div>
        ) : filteredCommissions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#777' }}>
            <p style={{ margin: '0 0 14px', fontSize: '15px', color: '#475569' }}>
              No commission records match your current search and filters.
            </p>
            <button className="btn btn-secondary" onClick={handleResetFilters}>
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="table-responsive" role="region" aria-label="Scrollable commissions table" tabIndex={0}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Commission ID</th>
                  <th>Partner Agent</th>
                  <th>Application ID</th>
                  <th>Base Amount</th>
                  <th>Rate %</th>
                  <th>Commission</th>
                  <th>Status</th>
                  <th>Created Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredCommissions.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <code style={{ fontSize: '12px', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                        {c.id}
                      </code>
                    </td>
                    <td>
                      <div><strong>{c.agent?.name}</strong></div>
                      <code style={{ fontSize: '11px', color: '#1b365d' }}>{c.agent?.promoCode}</code>
                    </td>
                    <td>
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
                        {c.admissionId}
                      </span>
                    </td>
                    <td>₹{((c.baseAmountPaise || 0) / 100).toLocaleString('en-IN')}</td>
                    <td>
                      <span className="badge badge-neutral">{c.commissionPercent}%</span>
                    </td>
                    <td style={{ fontWeight: 700, color: '#1b365d', fontSize: '14px' }}>
                      ₹{((c.commissionAmountPaise || 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          c.status === 'PAID'
                            ? 'badge-success'
                            : c.status === 'APPROVED'
                            ? 'badge-info'
                            : c.status === 'REVERSED'
                            ? 'badge-danger'
                            : 'badge-warning'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>
                      {c.createdAt
                        ? new Date(c.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RECORD PAYOUT MODAL */}
      {payoutModalOpen && (
        <Dialog
          open={true}
          onClose={() => setPayoutModalOpen(false)}
          label="Record Partner Payout"
          className="workspace-editor"
          preventBackdropClose={true}
          preventEscapeClose={true}
        >
          <div className="workspace-editor-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <span className="eyebrow">Disbursement Ledger</span>
                <h2 style={{ fontSize: '22px', margin: '4px 0' }}>Record Commission Payout</h2>
              </div>
              <button className="icon-btn" onClick={() => setPayoutModalOpen(false)}>
                <Icon name="close" size={20} />
              </button>
            </div>

            <form onSubmit={handleRecordPayout}>
              <div style={{ marginBottom: '16px' }}>
                <label>
                  Select Referral Agent *
                  <select
                    value={payoutAgentId}
                    onChange={(e) => setPayoutAgentId(e.target.value)}
                    required
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #dcd8d3', marginTop: '4px' }}
                  >
                    <option value="">-- Choose Agent with Payable Balance --</option>
                    {Object.entries(payableByAgent).map(([agId, info]) => (
                      <option key={agId} value={agId}>
                        {info.agentName} — ₹{(info.totalPaise / 100).toFixed(2)} ({info.count} approved items)
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {payoutAgentId && payableByAgent[payoutAgentId] && (
                <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '12px', borderRadius: '8px', marginBottom: '16px', color: '#065f46' }}>
                  <strong>Payable Amount:</strong> ₹{(payableByAgent[payoutAgentId].totalPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })} across {payableByAgent[payoutAgentId].count} approved applications.
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <label>
                  Payment Method *
                  <select
                    value={payoutMethod}
                    onChange={(e) => setPayoutMethod(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #dcd8d3', marginTop: '4px' }}
                  >
                    <option value="BANK_TRANSFER">Bank Transfer (NEFT/IMPS/RTGS)</option>
                    <option value="UPI">UPI Transfer</option>
                    <option value="CHEQUE">Bank Cheque</option>
                    <option value="CASH">Cash / Voucher</option>
                  </select>
                </label>
                <label>
                  Transaction Reference / UTR
                  <input
                    type="text"
                    value={payoutReference}
                    onChange={(e) => setPayoutReference(e.target.value)}
                    placeholder="e.g. UTR1298471928"
                  />
                </label>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label>
                  Disbursement Notes (Optional)
                  <textarea
                    rows={2}
                    value={payoutNote}
                    onChange={(e) => setPayoutNote(e.target.value)}
                    placeholder="e.g. Transferred to HDFC account ending in 7890"
                  />
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setPayoutModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={processingPayout || !payoutAgentId}>
                  {processingPayout ? 'Recording...' : 'Confirm & Mark Paid'}
                </button>
              </div>
            </form>
          </div>
        </Dialog>
      )}
    </div>
  );
};
