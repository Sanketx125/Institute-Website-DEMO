import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAdminFeedback } from './AdminFeedback';

export const AgentPayouts: React.FC = () => {
  const notify = useAdminFeedback();
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getAgentPayouts()
      .then((data) => {
        setPayouts(data || []);
        setLoading(false);
      })
      .catch((err) => {
        notify(err.message || 'Unable to load payouts history.');
        setLoading(false);
      });
  }, []);

  const totalDisbursedPaise = payouts.reduce((sum, p) => sum + (p.totalAmountPaise || 0), 0);

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', margin: '0 0 6px', letterSpacing: '-0.5px' }}>
          Payout & Disbursement History
        </h1>
        <p style={{ color: '#777', margin: 0 }}>
          Record of all commission payments transferred to your bank account or UPI ID.
        </p>
      </div>

      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-box">
          <span>Total Cumulative Disbursements</span>
          <strong style={{ color: 'var(--green)' }}>
            ₹{(totalDisbursedPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </strong>
          <small>Processed across {payouts.length} payout batches</small>
        </div>
      </div>

      <div className="admin-card">
        {loading ? (
          <div>Loading payout ledger...</div>
        ) : payouts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#777' }}>
            No payouts have been recorded yet. Once your approved commissions are disbursed by administration, they will appear here.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Payout ID</th>
                  <th>Amount</th>
                  <th>Payment Method</th>
                  <th>Transaction Reference</th>
                  <th>Disbursed Date</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((p) => (
                  <tr key={p.id}>
                    <td><strong>{p.id}</strong></td>
                    <td style={{ fontWeight: 700, color: '#16a34a' }}>
                      ₹{((p.totalAmountPaise || 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td><span className="badge badge-neutral">{p.method}</span></td>
                    <td><code>{p.reference || 'N/A'}</code></td>
                    <td>{p.paidAt ? new Date(p.paidAt).toLocaleDateString('en-IN') : 'N/A'}</td>
                    <td style={{ color: '#666', fontSize: '13px' }}>{p.note || '—'}</td>
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
