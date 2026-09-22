import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export const PaymentsAdmin: React.FC = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAdminPayments().then((data) => {
      setPayments(data || []);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', margin: '0 0 6px' }}>Razorpay Payment Reconciliation</h1>
        <p style={{ color: '#777', margin: 0 }}>Review verified transactions, gateway signatures, and linked applicant IDs.</p>
      </div>

      <div className="admin-card">
        {loading ? (
          <div>Loading transactions...</div>
        ) : payments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#777' }}>
            No payment transactions recorded yet.
          </div>
        ) : (
          <div className="table-responsive">
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
                {payments.map((p) => (
                  <tr key={p.id || p.orderId}>
                    <td><code>{p.orderId}</code></td>
                    <td>{p.paymentId ? <code>{p.paymentId}</code> : <span style={{ color: '#aaa' }}>Uncaptured</span>}</td>
                    <td>
                      <div><strong>{p.customerName}</strong></div>
                      <small style={{ color: '#777' }}>{p.customerEmail}</small>
                    </td>
                    <td>{p.applicationId ? <strong>{p.applicationId}</strong> : '-'}</td>
                    <td><span className="badge badge-info">{p.purpose}</span></td>
                    <td>
                      <strong>₹{(p.amount / 100).toLocaleString('en-IN')}</strong>
                    </td>
                    <td>
                      <span className={`badge ${p.status === 'SUCCESS' ? 'badge-success' : 'badge-warning'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td>{p.verifiedAt ? new Date(p.verifiedAt).toLocaleString() : '-'}</td>
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
