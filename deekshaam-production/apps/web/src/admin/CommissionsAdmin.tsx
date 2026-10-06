import React, { useState, useEffect } from 'react';
import { Icon } from '@deekshaam/ui';
import { Dialog } from '../components/Dialog';
import { api } from '../services/api';
import { useAdminFeedback } from './AdminFeedback';

export const CommissionsAdmin: React.FC = () => {
  const notify = useAdminFeedback();
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
    const params = new URLSearchParams();
    if (statusFilter) params.append('status', statusFilter);
    if (selectedAgentId) params.append('agentId', selectedAgentId);

    api
      .getCommissions(params.toString())
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
  }, [statusFilter, selectedAgentId]);

  const totalCommissionPaise = commissions.reduce((sum, c) => sum + (c.commissionAmountPaise || 0), 0);
  const pendingPaise = commissions.filter((c) => c.status === 'PENDING').reduce((sum, c) => sum + (c.commissionAmountPaise || 0), 0);
  const approvedPaise = commissions.filter((c) => c.status === 'APPROVED').reduce((sum, c) => sum + (c.commissionAmountPaise || 0), 0);
  const paidPaise = commissions.filter((c) => c.status === 'PAID').reduce((sum, c) => sum + (c.commissionAmountPaise || 0), 0);

  // Group approved payable by agent
  const payableByAgent: Record<string, { agentName: string; count: number; totalPaise: number }> = {};
  commissions
    .filter((c) => c.status === 'APPROVED')
    .forEach((c) => {
      const aId = c.agentId;
      if (!payableByAgent[aId]) {
        payableByAgent[aId] = {
          agentName: c.agent?.name || aId,
          count: 0,
          totalPaise: 0,
        };
      }
      payableByAgent[aId].count += 1;
      payableByAgent[aId].totalPaise += c.commissionAmountPaise || 0;
    });

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

  const exportCSV = () => {
    if (commissions.length === 0) {
      notify('No data to export.');
      return;
    }
    const headers = ['Commission ID', 'Agent Name', 'Promo Code', 'Application ID', 'Base Amount (INR)', 'Commission %', 'Commission Amount (INR)', 'Status', 'Created Date'];
    const rows = commissions.map((c) => [
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

      {/* FILTERS */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
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
          <option value="">All Statuses</option>
          <option value="PENDING">Pending (Unpaid Student Fee)</option>
          <option value="APPROVED">Approved (Ready for Payout)</option>
          <option value="PAID">Paid (Disbursed)</option>
          <option value="REVERSED">Reversed / Cancelled</option>
        </select>

        <select
          value={selectedAgentId}
          onChange={(e) => setSelectedAgentId(e.target.value)}
          style={{
            border: '1px solid #dcd8d3',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '13px',
            background: '#fff',
            minWidth: '220px',
          }}
        >
          <option value="">All Referral Agents</option>
          {agents.map((ag) => (
            <option key={ag.id} value={ag.id}>
              {ag.name} ({ag.promoCode})
            </option>
          ))}
        </select>
      </div>

      {/* COMMISSIONS TABLE */}
      <div className="admin-card">
        {loading ? (
          <div>Loading commissions ledger...</div>
        ) : commissions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#777' }}>
            No commission records match your current filters.
          </div>
        ) : (
          <div className="table-responsive">
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
                {commissions.map((c) => (
                  <tr key={c.id}>
                    <td><strong>{c.id}</strong></td>
                    <td>
                      <div><strong>{c.agent?.name}</strong></div>
                      <code style={{ fontSize: '11px', color: '#1b365d' }}>{c.agent?.promoCode}</code>
                    </td>
                    <td><code>{c.admissionId}</code></td>
                    <td>₹{((c.baseAmountPaise || 0) / 100).toLocaleString('en-IN')}</td>
                    <td>{c.commissionPercent}%</td>
                    <td style={{ fontWeight: 700, color: '#1b365d' }}>
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
                    <td style={{ fontSize: '12px', color: '#666' }}>
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN') : 'N/A'}
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
        <Dialog open={true} onClose={() => setPayoutModalOpen(false)} label="Record Partner Payout" className="workspace-editor">
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
