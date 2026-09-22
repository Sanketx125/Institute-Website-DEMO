import React, { useState, useEffect } from 'react';
import { Icon } from '@deekshaam/ui';
import { api } from '../services/api';
import { SEOHead } from '../components/SEOHead';

interface TrackProps {
  onNavigate: (path: string) => void;
}

export const Track: React.FC<TrackProps> = ({ onNavigate }) => {
  const [appId, setAppId] = useState('');
  const [appData, setAppData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) {
      setAppId(id);
      fetchStatus(id);
    }
  }, []);

  const fetchStatus = async (id: string) => {
    if (!id.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await api.trackApplication(id.trim());
      setAppData(res);
    } catch (err: any) {
      setError(err.message || 'No application record found for this ID.');
      setAppData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStatus(appId);
  };

  return (
    <>
      <SEOHead
        title="Track Application Status"
        description="Check real-time application status and admission milestone progress at Deekshaam Business School."
        canonicalPath="/track"
      />

      <section className="page-hero compact">
        <div className="container">
          <span className="eyebrow">Applicant Portal</span>
          <h1>Track Your Application Progress</h1>
          <p>Enter your institutional application reference number to view document verification and admission committee updates.</p>
        </div>
      </section>

      <section className="section">
        <div className="container track-grid">
          {/* SEARCH FORM */}
          <form className="track-form" onSubmit={handleSearch}>
            <label>
              Application Reference ID *
              <input
                type="text"
                placeholder="e.g. DBS-2026-104928"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                required
              />
            </label>
            <button type="submit" className="btn btn-primary full" style={{ marginTop: '16px' }} disabled={loading}>
              {loading ? 'Searching...' : 'Check Status'} <Icon name="arrow" size={16} />
            </button>
            <p className="form-note" style={{ marginTop: '14px' }}>
              Your application reference ID was issued upon submitting your online form. Contact admissions if you need assistance retrieving it.
            </p>
          </form>

          {/* STATUS DISPLAY */}
          <div className="track-form" style={{ minHeight: '340px' }}>
            {loading && <div style={{ textAlign: 'center', padding: '60px 0', color: '#777' }}>Searching admissions database...</div>}

            {error && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#9a3b20' }}>
                <Icon name="alert" size={40} color="#9a3b20" />
                <h3 style={{ margin: '14px 0 6px' }}>Application Record Not Found</h3>
                <p style={{ color: '#666', fontSize: '13px' }}>{error}</p>
              </div>
            )}

            {!loading && !error && !appData && (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#777' }}>
                <Icon name="document" size={44} color="#ccc" />
                <h3 style={{ margin: '16px 0 6px', color: '#333' }}>Your Application Milestones Will Appear Here</h3>
                <p style={{ fontSize: '13px', color: '#888' }}>
                  Enter your reference ID on the left to track progress through document verification and committee decisions.
                </p>
              </div>
            )}

            {appData && (
              <div className="status-card">
                <span className="eyebrow">{appData.id}</span>
                <h2>{appData.fullName}</h2>
                <p style={{ color: '#666', margin: '4px 0 20px' }}>
                  {appData.email} &middot; Degree: <strong>{appData.programSlug?.toUpperCase()}</strong> &middot; Status:{' '}
                  <span className="badge badge-success">{appData.status}</span>
                </p>

                <div className="status-timeline">
                  {appData.stages?.map((st: any) => {
                    const isDone = st.number < appData.stage;
                    const isCurrent = st.number === appData.stage;
                    return (
                      <div key={st.number} className={`${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`}>
                        <span>{isDone ? <Icon name="check" size={16} /> : st.number}</span>
                        <div>
                          <strong>{st.title}</strong>
                          <small>{st.description}</small>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
};
