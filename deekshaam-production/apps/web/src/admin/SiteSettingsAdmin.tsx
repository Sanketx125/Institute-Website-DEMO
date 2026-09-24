import { useAdminFeedback } from './AdminFeedback';
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export const SiteSettingsAdmin: React.FC = () => {
  const notify = useAdminFeedback();
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [savedMessage, setSavedMessage] = useState(false);

  useEffect(() => {
    api.getSettings().then((data) => {
      setSettings(data);
      setLoading(false);
    }).catch((err: Error) => { setLoading(false); notify(err.message || 'Unable to load this workspace. Please try again.'); });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateSettings(settings);
      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 3000);
    } catch (err: any) {
      notify(`Update failed: ${err.message}`);
    }
  };

  if (loading) return <div role="status">Loading settings...</div>;
  if (!settings) return <div className="inline-feedback error" role="alert">Settings could not be loaded. Refresh the page to try again.</div>;

  return (
    <div style={{ maxWidth: '800px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', margin: '0 0 6px' }}>Site Settings & Branding</h1>
        <p style={{ color: '#777', margin: 0 }}>Configure institutional identity, contact directories, and global media assets.</p>
      </div>

      {savedMessage && (
        <div style={{ background: '#dff6ec', color: 'var(--green)', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontWeight: 700 }}>
          Site settings successfully saved and updated across the platform.
        </div>
      )}

      <form onSubmit={handleSubmit} className="admin-card">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '16px' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
            Institute Legal Name
            <input
              type="text"
              value={settings.instituteName}
              onChange={(e) => setSettings({ ...settings, instituteName: e.target.value })}
              required
              style={{ border: '1px solid #dcd8d3', borderRadius: '8px', padding: '10px' }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
            Short Name / Acronym
            <input
              type="text"
              value={settings.shortName}
              onChange={(e) => setSettings({ ...settings, shortName: e.target.value })}
              required
              style={{ border: '1px solid #dcd8d3', borderRadius: '8px', padding: '10px' }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
            Managed By (Trust / Society)
            <input
              type="text"
              value={settings.managedBy}
              onChange={(e) => setSettings({ ...settings, managedBy: e.target.value })}
              required
              style={{ border: '1px solid #dcd8d3', borderRadius: '8px', padding: '10px' }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
            Founded Year
            <input
              type="text"
              value={settings.founded}
              onChange={(e) => setSettings({ ...settings, founded: e.target.value })}
              required
              style={{ border: '1px solid #dcd8d3', borderRadius: '8px', padding: '10px' }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
            Admissions Hotline Phone
            <input
              type="text"
              value={settings.phone}
              onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
              required
              style={{ border: '1px solid #dcd8d3', borderRadius: '8px', padding: '10px' }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
            Admissions Email
            <input
              type="email"
              value={settings.admissionEmail}
              onChange={(e) => setSettings({ ...settings, admissionEmail: e.target.value })}
              required
              style={{ border: '1px solid #dcd8d3', borderRadius: '8px', padding: '10px' }}
            />
          </label>
        </div>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 600, marginTop: '16px' }}>
          Physical Campus Address
          <textarea
            rows={2}
            value={settings.address}
            onChange={(e) => setSettings({ ...settings, address: e.target.value })}
            required
            style={{ border: '1px solid #dcd8d3', borderRadius: '8px', padding: '10px' }}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 600, marginTop: '16px' }}>
          Map Geographic Coordinates (lat, lng)
          <input
            type="text"
            value={settings.coordinates}
            onChange={(e) => setSettings({ ...settings, coordinates: e.target.value })}
            required
            style={{ border: '1px solid #dcd8d3', borderRadius: '8px', padding: '10px' }}
          />
        </label>

        <h3 style={{ fontSize: '16px', margin: '24px 0 12px' }}>Branding Images (URLs)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '16px' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
            Official Logo URL
            <input
              type="url"
              value={settings.logoImage}
              onChange={(e) => setSettings({ ...settings, logoImage: e.target.value })}
              required
              style={{ border: '1px solid #dcd8d3', borderRadius: '8px', padding: '10px' }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
            Hero Banner Image URL
            <input
              type="url"
              value={settings.heroImage}
              onChange={(e) => setSettings({ ...settings, heroImage: e.target.value })}
              required
              style={{ border: '1px solid #dcd8d3', borderRadius: '8px', padding: '10px' }}
            />
          </label>
        </div>

        <div style={{ marginTop: '24px' }}>
          <button type="submit" className="btn btn-primary">
            Save Site Settings
          </button>
        </div>
      </form>
    </div>
  );
};
