import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export const AuditLogsAdmin: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAuditLogs().then((data) => {
      setLogs(data || []);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', margin: '0 0 6px' }}>Immutable Security Audit Trail</h1>
        <p style={{ color: '#777', margin: 0 }}>Cryptographically timestamped logs tracking every administrative action and status update.</p>
      </div>

      <div className="admin-card">
        {loading ? (
          <div>Loading audit logs...</div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#777' }}>
            No audit records captured yet.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Target Entity</th>
                  <th>Entity Reference</th>
                  <th>Staff Actor</th>
                  <th>IP Address</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{new Date(log.timestamp).toLocaleString()}</td>
                    <td>
                      <span className="badge badge-info">{log.action}</span>
                    </td>
                    <td><strong>{log.entity}</strong></td>
                    <td><code>{log.entityId || '-'}</code></td>
                    <td>{log.userEmail || 'SYSTEM'}</td>
                    <td><small>{log.ipAddress || '-'}</small></td>
                    <td>
                      <small style={{ color: '#666' }}>
                        {log.detailsJson ? log.detailsJson.slice(0, 80) : '-'}
                      </small>
                    </td>
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
