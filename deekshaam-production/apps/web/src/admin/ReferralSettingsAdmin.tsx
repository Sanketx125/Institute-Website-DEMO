import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAdminFeedback } from './AdminFeedback';

export const ReferralSettingsAdmin: React.FC = () => {
  const notify = useAdminFeedback();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    defaultCommissionPercent: 10,
    defaultDiscountPercent: 10,
    commissionBase: 'NET_FEE',
    maxAllowedDiscountPercent: 50,
    maxAllowedCommissionPercent: 50,
    isEnabled: true,
  });

  useEffect(() => {
    api
      .getReferralSettings()
      .then((data) => {
        if (data) {
          setSettings({
            defaultCommissionPercent: data.defaultCommissionPercent ?? 10,
            defaultDiscountPercent: data.defaultDiscountPercent ?? 10,
            commissionBase: data.commissionBase || 'NET_FEE',
            maxAllowedDiscountPercent: data.maxAllowedDiscountPercent ?? 50,
            maxAllowedCommissionPercent: data.maxAllowedCommissionPercent ?? 50,
            isEnabled: data.isEnabled ?? true,
          });
        }
        setLoading(false);
      })
      .catch((err) => {
        notify(err.message || 'Unable to load referral settings.');
        setLoading(false);
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateReferralSettings(settings);
      notify('Referral settings updated successfully.');
    } catch (err: any) {
      notify(`Update failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div>Loading referral system policies...</div>;
  }

  return (
    <div style={{ maxWidth: '680px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', margin: '0 0 6px', letterSpacing: '-0.5px' }}>
          Global Referral System Settings
        </h1>
        <p style={{ color: '#777', margin: 0 }}>
          Super Administrator controls for defaults, payout calculations, and sanity caps.
        </p>
      </div>

      <div className="admin-card">
        <form onSubmit={handleSave}>
          <div style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #f0eee9' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={settings.isEnabled}
                onChange={(e) => setSettings({ ...settings, isEnabled: e.target.checked })}
                style={{ width: '18px', height: '18px' }}
              />
              <div>
                <strong>Enable Referral & Promo Code System</strong>
                <div style={{ fontSize: '13px', color: '#666' }}>
                  When disabled, promo code input is hidden on public admissions and validation calls reject.
                </div>
              </div>
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <label>
              Default Staff Commission %
              <input
                type="number"
                min="0"
                max={settings.maxAllowedCommissionPercent}
                step="0.5"
                value={settings.defaultCommissionPercent}
                onChange={(e) => setSettings({ ...settings, defaultCommissionPercent: Number(e.target.value) })}
                required
              />
              <small style={{ color: '#777', display: 'block', marginTop: '4px' }}>
                Applied when staff create agents without custom overrides.
              </small>
            </label>

            <label>
              Default Student Discount %
              <input
                type="number"
                min="0"
                max={settings.maxAllowedDiscountPercent}
                step="0.5"
                value={settings.defaultDiscountPercent}
                onChange={(e) => setSettings({ ...settings, defaultDiscountPercent: Number(e.target.value) })}
                required
              />
              <small style={{ color: '#777', display: 'block', marginTop: '4px' }}>
                Applied to new promo codes created with default parameters.
              </small>
            </label>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label>
              Commission Base Calculation Method
              <select
                value={settings.commissionBase}
                onChange={(e) => setSettings({ ...settings, commissionBase: e.target.value })}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #dcd8d3', marginTop: '4px' }}
              >
                <option value="NET_FEE">NET Fee (Course Fee minus Student Discount) — Recommended</option>
                <option value="GROSS_FEE">GROSS Fee (Original Program Fee before discount)</option>
              </select>
              <small style={{ color: '#777', display: 'block', marginTop: '4px' }}>
                Determines the base amount upon which the agent's commission percentage is calculated.
              </small>
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <label>
              Max Allowed Commission Cap %
              <input
                type="number"
                min="1"
                max="100"
                value={settings.maxAllowedCommissionPercent}
                onChange={(e) => setSettings({ ...settings, maxAllowedCommissionPercent: Number(e.target.value) })}
                required
              />
              <small style={{ color: '#777', display: 'block', marginTop: '4px' }}>
                Upper ceiling for individual agent commission rates.
              </small>
            </label>

            <label>
              Max Allowed Discount Cap %
              <input
                type="number"
                min="1"
                max="100"
                value={settings.maxAllowedDiscountPercent}
                onChange={(e) => setSettings({ ...settings, maxAllowedDiscountPercent: Number(e.target.value) })}
                required
              />
              <small style={{ color: '#777', display: 'block', marginTop: '4px' }}>
                Upper ceiling for applicant promotional discounts.
              </small>
            </label>
          </div>

          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? 'Saving Policies...' : 'Save Referral Policies'}
          </button>
        </form>
      </div>
    </div>
  );
};
