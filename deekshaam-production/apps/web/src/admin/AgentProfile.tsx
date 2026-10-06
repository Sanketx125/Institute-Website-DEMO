import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAdminFeedback } from './AdminFeedback';

export const AgentProfile: React.FC = () => {
  const notify = useAdminFeedback();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [agent, setAgent] = useState<any | null>(null);
  const [payoutDetails, setPayoutDetails] = useState('');

  useEffect(() => {
    api
      .getAgentDashboard()
      .then((res) => {
        setAgent(res.agent);
        setPayoutDetails(res.agent?.payoutDetails || '');
        setLoading(false);
      })
      .catch((err) => {
        notify(err.message || 'Unable to load profile.');
        setLoading(false);
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateAgentPayoutDetails(payoutDetails.trim());
      notify('Banking & payout details updated successfully.');
    } catch (err: any) {
      notify(`Update failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div>Loading profile & banking details...</div>;
  }

  return (
    <div style={{ maxWidth: '720px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', margin: '0 0 6px', letterSpacing: '-0.5px' }}>
          Banking & Partner Profile
        </h1>
        <p style={{ color: '#777', margin: 0 }}>
          Manage your payout destination (Bank Account / UPI) and view partner account details.
        </p>
      </div>

      <div className="admin-card" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', margin: '0 0 16px' }}>Partner Account Information</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', fontSize: '14px' }}>
          <div>
            <strong style={{ color: '#666', display: 'block', fontSize: '12px' }}>PARTNER NAME</strong>
            <span>{agent?.name}</span>
          </div>
          <div>
            <strong style={{ color: '#666', display: 'block', fontSize: '12px' }}>EMAIL ADDRESS</strong>
            <span>{agent?.email}</span>
          </div>
          <div>
            <strong style={{ color: '#666', display: 'block', fontSize: '12px' }}>PHONE NUMBER</strong>
            <span>{agent?.phone}</span>
          </div>
          <div>
            <strong style={{ color: '#666', display: 'block', fontSize: '12px' }}>ACTIVE PROMO CODE</strong>
            <strong style={{ color: '#1b365d' }}>{agent?.promoCode}</strong>
          </div>
          <div>
            <strong style={{ color: '#666', display: 'block', fontSize: '12px' }}>STUDENT DISCOUNT</strong>
            <span>{agent?.studentDiscountPercent}%</span>
          </div>
          <div>
            <strong style={{ color: '#666', display: 'block', fontSize: '12px' }}>COMMISSION RATE</strong>
            <span>{agent?.commissionPercent}%</span>
          </div>
        </div>
      </div>

      <div className="admin-card">
        <h2 style={{ fontSize: '18px', margin: '0 0 8px' }}>Payout Disbursement Details</h2>
        <p style={{ color: '#777', fontSize: '13px', margin: '0 0 20px' }}>
          Provide your NEFT/IMPS bank account details (Bank Name, Account Number, IFSC Code, Account Holder Name) or UPI VPA (e.g. yourname@okaxis). All future disbursements will be sent here.
        </p>

        <form onSubmit={handleSave}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', marginBottom: '6px' }}>
              Bank Account / UPI Details
            </label>
            <textarea
              rows={5}
              value={payoutDetails}
              onChange={(e) => setPayoutDetails(e.target.value)}
              placeholder={`Bank: HDFC Bank&#10;A/C No: 50100234567890&#10;IFSC: HDFC0000123&#10;Holder Name: Prashant Dhavan&#10;Or UPI: prashant@upi`}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #dcd8d3',
                fontFamily: 'inherit',
                fontSize: '14px',
              }}
            />
          </div>

          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Payout Details'}
          </button>
        </form>
      </div>
    </div>
  );
};
