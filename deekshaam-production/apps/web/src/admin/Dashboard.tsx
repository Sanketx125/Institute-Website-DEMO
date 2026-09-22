import React, { useState, useEffect } from 'react';
import { Icon } from '@deekshaam/ui';
import { api } from '../services/api';

interface DashboardProps {
  onSelectTab: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onSelectTab }) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getAnalyticsSummary(), api.getAuditLogs()])
      .then(([summaryData, logsData]) => {
        setMetrics(summaryData);
        setAuditLogs(logsData);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div>Loading analytics dashboard...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', margin: '0 0 6px', letterSpacing: '-0.5px' }}>Executive Overview</h1>
        <p style={{ color: '#777', margin: 0 }}>Operational metrics across admissions, leads, payments, and site traffic.</p>
      </div>

      {/* METRIC BOXES */}
      <div className="stats-grid">
        <div className="stat-box">
          <span>Admissions Applications</span>
          <strong>{metrics?.applications?.total || 0}</strong>
          <small>{metrics?.applications?.pendingReview || 0} awaiting verification</small>
        </div>

        <div className="stat-box">
          <span>Enquiries & Campus Visits</span>
          <strong>{metrics?.leads?.total || 0}</strong>
          <small>{metrics?.leads?.newLeads || 0} new incoming queries</small>
        </div>

        <div className="stat-box">
          <span>Verified Payment Revenue</span>
          <strong style={{ color: 'var(--green)' }}>
            ₹{(metrics?.payments?.totalRevenueINR || 0).toLocaleString('en-IN')}
          </strong>
          <small>{metrics?.payments?.successfulCount || 0} successful transactions</small>
        </div>

        <div className="stat-box">
          <span>First-Party Traffic</span>
          <strong>{metrics?.traffic?.pageViews || 0}</strong>
          <small>Tracked pageview events</small>
        </div>
      </div>

      {/* SHORTCUT ACTIONS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <button
          className="admin-card"
          onClick={() => onSelectTab('admissions')}
          style={{ cursor: 'pointer', textAlign: 'left', border: '1px solid #e0dcd7' }}
        >
          <Icon name="user" size={24} color="var(--orange)" />
          <h3 style={{ margin: '10px 0 4px', fontSize: '16px' }}>Review Applications</h3>
          <p style={{ fontSize: '12px', color: '#777', margin: 0 }}>Inspect applicant marksheets and update stages</p>
        </button>

        <button
          className="admin-card"
          onClick={() => onSelectTab('leads')}
          style={{ cursor: 'pointer', textAlign: 'left', border: '1px solid #e0dcd7' }}
        >
          <Icon name="message" size={24} color="var(--orange)" />
          <h3 style={{ margin: '10px 0 4px', fontSize: '16px' }}>Lead Inbox</h3>
          <p style={{ fontSize: '12px', color: '#777', margin: 0 }}>Manage callback requests and campus visits</p>
        </button>

        <button
          className="admin-card"
          onClick={() => onSelectTab('programs')}
          style={{ cursor: 'pointer', textAlign: 'left', border: '1px solid #e0dcd7' }}
        >
          <Icon name="briefcase" size={24} color="var(--orange)" />
          <h3 style={{ margin: '10px 0 4px', fontSize: '16px' }}>Manage Programs</h3>
          <p style={{ fontSize: '12px', color: '#777', margin: 0 }}>Update syllabus, specializations, and details</p>
        </button>

        <button
          className="admin-card"
          onClick={() => onSelectTab('settings')}
          style={{ cursor: 'pointer', textAlign: 'left', border: '1px solid #e0dcd7' }}
        >
          <Icon name="settings" size={24} color="var(--orange)" />
          <h3 style={{ margin: '10px 0 4px', fontSize: '16px' }}>Site Settings</h3>
          <p style={{ fontSize: '12px', color: '#777', margin: 0 }}>Branding, contact info, and SEO defaults</p>
        </button>
      </div>

      {/* RECENT AUDIT LOGS */}
      <div className="admin-card">
        <h2 style={{ fontSize: '18px', margin: '0 0 16px' }}>Recent Administrative Audit Activity</h2>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Target Entity</th>
                <th>Staff Account</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.slice(0, 6).map((log, i) => (
                <tr key={i}>
                  <td>
                    <span className="badge badge-info">{log.action}</span>
                  </td>
                  <td>
                    <strong>{log.entity}</strong> {log.entityId && <span style={{ color: '#888' }}>({log.entityId})</span>}
                  </td>
                  <td>{log.userEmail || 'System'}</td>
                  <td>{new Date(log.timestamp).toLocaleString()}</td>
                </tr>
              ))}
              {auditLogs.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: '#888', padding: '24px' }}>
                    No administrative audit events recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
