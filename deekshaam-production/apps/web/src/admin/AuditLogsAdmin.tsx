import React, { useState, useEffect, useMemo } from 'react';
import { useAdminFeedback } from './AdminFeedback';
import { api } from '../services/api';
import { Icon } from '@deekshaam/ui';
import { Dialog } from '../components/Dialog';

export const AuditLogsAdmin: React.FC = () => {
  const notify = useAdminFeedback();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionTab, setActionTab] = useState<'ALL' | 'LOGIN' | 'CREATE' | 'UPDATE' | 'DELETE'>('ALL');
  const [selectedEntity, setSelectedEntity] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [activeLog, setActiveLog] = useState<any | null>(null);

  const fetchLogs = () => {
    setLoading(true);
    api
      .getAuditLogs()
      .then((data) => {
        setLogs(data || []);
        setLoading(false);
      })
      .catch((err: Error) => {
        setLoading(false);
        notify(err.message || 'Unable to load audit logs. Please try again.');
      });
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Compute category counts
  const loginCount = useMemo(() => logs.filter((l) => l.action === 'LOGIN').length, [logs]);
  const createCount = useMemo(() => logs.filter((l) => l.action === 'CREATE').length, [logs]);
  const updateCount = useMemo(
    () => logs.filter((l) => l.action === 'UPDATE' || l.action === 'STATUS_CHANGE' || l.action?.includes('UPDATE')).length,
    [logs]
  );
  const deleteCount = useMemo(() => logs.filter((l) => l.action === 'DELETE').length, [logs]);

  // Extract distinct entities
  const entities = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => {
      if (l.entity) set.add(l.entity);
    });
    return Array.from(set).sort();
  }, [logs]);

  // Extract distinct actions
  const actions = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => {
      if (l.action) set.add(l.action);
    });
    return Array.from(set).sort();
  }, [logs]);

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      if (actionTab === 'LOGIN' && l.action !== 'LOGIN') return false;
      if (actionTab === 'CREATE' && l.action !== 'CREATE') return false;
      if (
        actionTab === 'UPDATE' &&
        l.action !== 'UPDATE' &&
        l.action !== 'STATUS_CHANGE' &&
        !l.action?.includes('UPDATE')
      )
        return false;
      if (actionTab === 'DELETE' && l.action !== 'DELETE') return false;

      if (selectedEntity && l.entity !== selectedEntity) return false;
      if (selectedAction && l.action !== selectedAction) return false;

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const actor = (l.userEmail || '').toLowerCase();
        const entity = (l.entity || '').toLowerCase();
        const entityId = (l.entityId || '').toLowerCase();
        const act = (l.action || '').toLowerCase();
        const details = (l.detailsJson || '').toLowerCase();
        const ip = (l.ipAddress || '').toLowerCase();

        if (
          !actor.includes(q) &&
          !entity.includes(q) &&
          !entityId.includes(q) &&
          !act.includes(q) &&
          !details.includes(q) &&
          !ip.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [logs, actionTab, selectedEntity, selectedAction, search]);

  const handleResetFilters = () => {
    setActionTab('ALL');
    setSelectedEntity('');
    setSelectedAction('');
    setSearch('');
  };

  const isFiltered = actionTab !== 'ALL' || selectedEntity !== '' || selectedAction !== '' || search.trim() !== '';

  const getActionBadge = (action: string) => {
    if (action === 'LOGIN') {
      return (
        <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd' }}>
          LOGIN
        </span>
      );
    }
    if (action === 'CREATE') {
      return (
        <span className="badge" style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' }}>
          CREATE
        </span>
      );
    }
    if (action === 'DELETE') {
      return (
        <span className="badge" style={{ background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca' }}>
          DELETE
        </span>
      );
    }
    if (action === 'STATUS_CHANGE') {
      return (
        <span className="badge" style={{ background: '#f3e8ff', color: '#7e22ce', border: '1px solid #e9d5ff' }}>
          STATUS
        </span>
      );
    }
    return (
      <span className="badge" style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}>
        {action}
      </span>
    );
  };

  return (
    <div>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '28px', margin: '0 0 6px', letterSpacing: '-0.5px' }}>Activity & Audit Log</h1>
          <p style={{ color: '#777', margin: 0 }}>
            Immutable security trail of administrative access, authentication events, and data changes.
          </p>
        </div>
        <button className="btn btn-secondary" onClick={fetchLogs} disabled={loading} title="Refresh audit activity">
          <Icon name="check" size={14} /> Refresh
        </button>
      </div>

      {/* UNIFIED TOOLBAR: CATEGORY PILLS ON LEFT, COMPACT CONTROLS ON RIGHT */}
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
            onClick={() => setActionTab('ALL')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              background: actionTab === 'ALL' ? '#1b365d' : '#f1f5f9',
              color: actionTab === 'ALL' ? '#ffffff' : '#475569',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>All Activities</span>
            <span
              style={{
                fontSize: '11px',
                padding: '1px 6px',
                borderRadius: '10px',
                background: actionTab === 'ALL' ? 'rgba(255,255,255,0.22)' : '#e2e8f0',
                color: actionTab === 'ALL' ? '#fff' : '#64748b',
                fontWeight: 700,
              }}
            >
              {logs.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActionTab('LOGIN')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              background: actionTab === 'LOGIN' ? '#0369a1' : '#f1f5f9',
              color: actionTab === 'LOGIN' ? '#ffffff' : '#475569',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>Logins & Sessions</span>
            <span
              style={{
                fontSize: '11px',
                padding: '1px 6px',
                borderRadius: '10px',
                background: actionTab === 'LOGIN' ? 'rgba(255,255,255,0.22)' : '#e2e8f0',
                color: actionTab === 'LOGIN' ? '#fff' : '#64748b',
                fontWeight: 700,
              }}
            >
              {loginCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActionTab('CREATE')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              background: actionTab === 'CREATE' ? '#15803d' : '#f1f5f9',
              color: actionTab === 'CREATE' ? '#ffffff' : '#475569',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>Creations</span>
            <span
              style={{
                fontSize: '11px',
                padding: '1px 6px',
                borderRadius: '10px',
                background: actionTab === 'CREATE' ? 'rgba(255,255,255,0.22)' : '#e2e8f0',
                color: actionTab === 'CREATE' ? '#fff' : '#64748b',
                fontWeight: 700,
              }}
            >
              {createCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActionTab('UPDATE')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              background: actionTab === 'UPDATE' ? '#b45309' : '#f1f5f9',
              color: actionTab === 'UPDATE' ? '#ffffff' : '#475569',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>Updates</span>
            <span
              style={{
                fontSize: '11px',
                padding: '1px 6px',
                borderRadius: '10px',
                background: actionTab === 'UPDATE' ? 'rgba(255,255,255,0.22)' : '#e2e8f0',
                color: actionTab === 'UPDATE' ? '#fff' : '#64748b',
                fontWeight: 700,
              }}
            >
              {updateCount}
            </span>
          </button>

          {deleteCount > 0 && (
            <button
              type="button"
              onClick={() => setActionTab('DELETE')}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                border: 'none',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                background: actionTab === 'DELETE' ? '#b91c1c' : '#f1f5f9',
                color: actionTab === 'DELETE' ? '#ffffff' : '#475569',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>Deletions</span>
              <span
                style={{
                  fontSize: '11px',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  background: actionTab === 'DELETE' ? 'rgba(255,255,255,0.22)' : '#e2e8f0',
                  color: actionTab === 'DELETE' ? '#fff' : '#64748b',
                  fontWeight: 700,
                }}
              >
                {deleteCount}
              </span>
            </button>
          )}
        </div>

        {/* RIGHT: Compact Inline Filters */}
        <div className="admin-toolbar-filter">
          <div style={{ position: 'relative', width: '210px' }}>
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
              placeholder="Search user, entity, IP..."
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

          {entities.length > 0 && (
            <select
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value)}
              title="Filter by target entity"
            >
              <option value="">All Entities</option>
              {entities.map((ent) => (
                <option key={ent} value={ent}>
                  {ent}
                </option>
              ))}
            </select>
          )}

          {actions.length > 0 && (
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              title="Filter by specific action"
            >
              <option value="">All Actions</option>
              {actions.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>
          )}

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
            Showing {filteredLogs.length} of {logs.length}
          </div>
        </div>
      </div>

      {/* TABLE CARD */}
      <div className="admin-card">
        {loading ? (
          <div style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
            Loading audit logs...
          </div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#777' }}>
            No audit records captured yet.
          </div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#777' }}>
            <p style={{ margin: '0 0 14px', fontSize: '15px', color: '#475569' }}>
              No audit records match your current search and filters.
            </p>
            <button className="btn btn-secondary" onClick={handleResetFilters}>
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="table-responsive" role="region" aria-label="Scrollable audit log table" tabIndex={0}>
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
                  <th>Inspect</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '12px', color: '#64748b' }}>
                      {new Date(log.timestamp).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'medium',
                      })}
                    </td>
                    <td>{getActionBadge(log.action)}</td>
                    <td><strong>{log.entity}</strong></td>
                    <td>
                      {log.entityId ? (
                        <code style={{ fontSize: '12px', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                          {log.entityId}
                        </code>
                      ) : (
                        <span style={{ color: '#aaa' }}>-</span>
                      )}
                    </td>
                    <td>
                      <div><strong>{log.userEmail || 'SYSTEM'}</strong></div>
                      {log.userId && <small style={{ color: '#94a3b8' }}>ID: {log.userId.slice(0, 8)}...</small>}
                    </td>
                    <td>
                      <small style={{ color: '#64748b', fontFamily: 'monospace' }}>{log.ipAddress || '-'}</small>
                    </td>
                    <td>
                      <div
                        style={{
                          maxWidth: '220px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontSize: '12px',
                          color: '#475569',
                          fontFamily: 'monospace',
                        }}
                        title={log.detailsJson}
                      >
                        {log.detailsJson || '-'}
                      </div>
                    </td>
                    <td>
                      {log.detailsJson ? (
                        <button
                          type="button"
                          className="btn btn-ghost small"
                          onClick={() => setActiveLog(log)}
                          style={{ padding: '3px 8px', fontSize: '11px' }}
                        >
                          View
                        </button>
                      ) : (
                        <span style={{ color: '#cbd5e1' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* INSPECTION MODAL */}
      {activeLog && (
        <Dialog
          open={true}
          onClose={() => setActiveLog(null)}
          label="Audit Log Details"
          className="workspace-editor"
          preventBackdropClose={true}
          preventEscapeClose={true}
        >
          <div className="workspace-editor-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <span className="eyebrow">Security Inspection</span>
                <h2 style={{ fontSize: '20px', margin: '4px 0' }}>Activity Record</h2>
              </div>
              <button className="icon-btn" onClick={() => setActiveLog(null)}>
                <Icon name="close" size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px', background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
              <div>
                <strong style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Timestamp</strong>
                <div style={{ fontSize: '13px' }}>{new Date(activeLog.timestamp).toLocaleString()}</div>
              </div>
              <div>
                <strong style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Action</strong>
                <div>{getActionBadge(activeLog.action)}</div>
              </div>
              <div>
                <strong style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Target Entity</strong>
                <div style={{ fontSize: '13px' }}><strong>{activeLog.entity}</strong> ({activeLog.entityId || 'N/A'})</div>
              </div>
              <div>
                <strong style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Actor</strong>
                <div style={{ fontSize: '13px' }}>{activeLog.userEmail || 'SYSTEM'} (IP: {activeLog.ipAddress || 'Unknown'})</div>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, marginBottom: '6px', display: 'block' }}>
                Event Payload / Delta
              </label>
              <pre
                style={{
                  background: '#0f172a',
                  color: '#f8fafc',
                  padding: '14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  overflowX: 'auto',
                  maxHeight: '300px',
                  lineHeight: '1.5',
                  fontFamily: 'monospace',
                }}
              >
                {(() => {
                  try {
                    return JSON.stringify(JSON.parse(activeLog.detailsJson), null, 2);
                  } catch {
                    return activeLog.detailsJson || 'No details payload recorded.';
                  }
                })()}
              </pre>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setActiveLog(null)}>
                Close
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
};
