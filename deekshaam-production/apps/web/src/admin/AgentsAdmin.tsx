import React, { useState, useEffect } from 'react';
import { Icon } from '@deekshaam/ui';
import { Dialog } from '../components/Dialog';
import { api } from '../services/api';
import { useAdminFeedback } from './AdminFeedback';

export const AgentsAdmin: React.FC<{ currentUser?: any }> = ({ currentUser }) => {
  const notify = useAdminFeedback();
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [creating, setCreating] = useState(false);
  const [editingAgent, setEditingAgent] = useState<any | null>(null);
  const [createdInfo, setCreatedInfo] = useState<any | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    commissionPercent: 0,
    studentDiscountPercent: 0,
    customPromoCode: '',
    notes: '',
    payoutDetails: '',
    temporaryPassword: '',
  });

  const fetchAgents = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search.trim()) params.append('search', search.trim());
    if (statusFilter) params.append('status', statusFilter);

    api
      .getAgents(params.toString())
      .then((data) => {
        setAgents(data || []);
        setLoading(false);
      })
      .catch((err) => {
        notify(err.message || 'Unable to load referral agents.');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAgents();
  }, [search, statusFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        notes: formData.notes.trim() || undefined,
        payoutDetails: formData.payoutDetails.trim() || undefined,
        temporaryPassword: formData.temporaryPassword.trim() || undefined,
      };

      if (isSuperAdmin) {
        payload.commissionPercent = Number(formData.commissionPercent);
        payload.studentDiscountPercent = Number(formData.studentDiscountPercent);
        if (formData.customPromoCode.trim()) {
          payload.promoCode = formData.customPromoCode.trim().toUpperCase();
        }
      }

      const res = await api.createAgent(payload);
      setCreating(false);
      setCreatedInfo(res);
      notify('Referral agent created successfully!');
      fetchAgents();
    } catch (err: any) {
      notify(`Create agent failed: ${err.message}`);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAgent) return;
    try {
      const payload: any = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        notes: formData.notes.trim(),
        payoutDetails: formData.payoutDetails.trim(),
      };

      if (isSuperAdmin) {
        payload.commissionPercent = Number(formData.commissionPercent);
        payload.studentDiscountPercent = Number(formData.studentDiscountPercent);
        if (formData.customPromoCode.trim()) {
          payload.promoCode = formData.customPromoCode.trim().toUpperCase();
        }
      }

      await api.updateAgent(editingAgent.id, payload);
      setEditingAgent(null);
      notify('Agent updated successfully!');
      fetchAgents();
    } catch (err: any) {
      notify(`Update agent failed: ${err.message}`);
    }
  };

  const handleToggleStatus = async (agentId: string) => {
    try {
      await api.toggleAgentStatus(agentId);
      notify('Agent status updated.');
      fetchAgents();
    } catch (err: any) {
      notify(`Status toggle failed: ${err.message}`);
    }
  };

  const openEditModal = (agent: any) => {
    setEditingAgent(agent);
    setFormData({
      name: agent.name || '',
      email: agent.email || '',
      phone: agent.phone || '',
      commissionPercent: agent.commissionPercent || 0,
      studentDiscountPercent: agent.studentDiscountPercent || 0,
      customPromoCode: agent.promoCode || '',
      notes: agent.notes || '',
      payoutDetails: agent.payoutDetails || '',
      temporaryPassword: '',
    });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', margin: '0 0 6px', letterSpacing: '-0.5px' }}>
            Referral Partners & Agents
          </h1>
          <p style={{ color: '#777', margin: 0 }}>
            Manage affiliate agents, commission rates, and promo codes.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => {
            setFormData({
              name: '',
              email: '',
              phone: '',
              commissionPercent: 10,
              studentDiscountPercent: 10,
              customPromoCode: '',
              notes: '',
              payoutDetails: '',
              temporaryPassword: '',
            });
            setCreating(true);
          }}
        >
          <Icon name="arrow" size={16} /> Create New Agent
        </button>
      </div>

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
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="SUSPENDED">Suspended</option>
        </select>

        <input
          type="text"
          placeholder="Filter by agent name, email, or promo code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            border: '1px solid #dcd8d3',
            borderRadius: '8px',
            padding: '10px 16px',
            width: '320px',
            fontSize: '13px',
          }}
        />
      </div>

      <div className="admin-card">
        {loading ? (
          <div>Loading agents directory...</div>
        ) : agents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#777' }}>
            No agents found. Click "Create New Agent" to onboard a referral partner.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Partner Name</th>
                  <th>Contact Info</th>
                  <th>Promo Code</th>
                  <th>Student Discount</th>
                  <th>Commission Rate</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((ag) => (
                  <tr key={ag.id}>
                    <td>
                      <strong>{ag.name}</strong>
                      {!ag.isConfigured && (
                        <div style={{ marginTop: '2px' }}>
                          <span className="badge badge-warning" style={{ fontSize: '10px' }}>
                            Commission not configured
                          </span>
                        </div>
                      )}
                    </td>
                    <td>
                      <div>{ag.phone}</div>
                      <small style={{ color: '#888' }}>{ag.email}</small>
                    </td>
                    <td>
                      <code style={{ fontSize: '13px', fontWeight: 700, color: '#1b365d' }}>
                        {ag.promoCode}
                      </code>
                    </td>
                    <td>{ag.studentDiscountPercent}%</td>
                    <td>{ag.commissionPercent}%</td>
                    <td>
                      <span
                        className={`badge ${
                          ag.status === 'ACTIVE'
                            ? 'badge-success'
                            : ag.status === 'INACTIVE'
                            ? 'badge-neutral'
                            : 'badge-danger'
                        }`}
                      >
                        {ag.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-ghost small" onClick={() => openEditModal(ag)}>
                          Edit
                        </button>
                        <button
                          className={`btn ${ag.status === 'ACTIVE' ? 'btn-ghost' : 'btn-secondary'} small`}
                          onClick={() => handleToggleStatus(ag.id)}
                        >
                          {ag.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      {creating && (
        <Dialog open={true} onClose={() => setCreating(false)} label="Create Referral Agent" className="workspace-editor">
          <div className="workspace-editor-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <span className="eyebrow">Onboard Partner</span>
                <h2 style={{ fontSize: '22px', margin: '4px 0' }}>Create New Agent Account</h2>
              </div>
              <button className="icon-btn" onClick={() => setCreating(false)}>
                <Icon name="close" size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                <label>
                  Full Name *
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Prashant Dhavan"
                  />
                </label>
                <label>
                  Email Address *
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="prashant@example.com"
                  />
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                <label>
                  Phone Number *
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="9876543210"
                  />
                </label>
                <label>
                  Temporary Password (Optional)
                  <input
                    type="password"
                    value={formData.temporaryPassword}
                    onChange={(e) => setFormData({ ...formData, temporaryPassword: e.target.value })}
                    placeholder="Leave blank to auto-generate"
                  />
                </label>
              </div>

              {isSuperAdmin ? (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '16px', borderRadius: '8px' }}>
                  <h3 style={{ fontSize: '14px', margin: '0 0 12px', color: '#1e293b' }}>
                    Super Admin Rate Configuration
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
                    <label>
                      Student Discount %
                      <input
                        type="number"
                        min="0"
                        max="50"
                        step="0.5"
                        value={formData.studentDiscountPercent}
                        onChange={(e) => setFormData({ ...formData, studentDiscountPercent: Number(e.target.value) })}
                      />
                    </label>
                    <label>
                      Commission Rate %
                      <input
                        type="number"
                        min="0"
                        max="50"
                        step="0.5"
                        value={formData.commissionPercent}
                        onChange={(e) => setFormData({ ...formData, commissionPercent: Number(e.target.value) })}
                      />
                    </label>
                    <label>
                      Custom Promo Code
                      <input
                        type="text"
                        placeholder="Auto-generated if empty"
                        value={formData.customPromoCode}
                        onChange={(e) => setFormData({ ...formData, customPromoCode: e.target.value.toUpperCase() })}
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', color: '#92400e' }}>
                  <strong>Staff Note:</strong> Commission and discount rates are managed by Super Administrators. This agent will be created with default rates (0%) and flagged for Super Admin review.
                </div>
              )}

              <div style={{ marginBottom: '16px' }}>
                <label>
                  Banking / UPI Details (Optional)
                  <textarea
                    rows={2}
                    value={formData.payoutDetails}
                    onChange={(e) => setFormData({ ...formData, payoutDetails: e.target.value })}
                    placeholder="Bank name, Account Number, IFSC, or UPI ID"
                  />
                </label>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label>
                  Internal Notes (Optional)
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Internal reference notes regarding this partner..."
                  />
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setCreating(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Agent
                </button>
              </div>
            </form>
          </div>
        </Dialog>
      )}

      {/* CREATION CONFIRMATION / PROMO CODE MODAL */}
      {createdInfo && (
        <Dialog open={true} onClose={() => setCreatedInfo(null)} label="Agent Created" className="workspace-editor">
          <div className="workspace-editor-body" style={{ textAlign: 'center', padding: '24px' }}>
            <div style={{ width: '56px', height: '56px', background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#16a34a' }}>
              <Icon name="check" size={28} />
            </div>
            <h2 style={{ fontSize: '22px', margin: '0 0 8px' }}>Partner Successfully Onboarded!</h2>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>
              {createdInfo.agent?.name} has been provisioned with the partner portal login.
            </p>

            <div style={{ background: '#f1f5f9', padding: '16px', borderRadius: '12px', marginBottom: '20px', textAlign: 'left' }}>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>PROMO CODE</span>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#1b365d' }}>{createdInfo.agent?.promoCode}</div>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>SHAREABLE URL</span>
                <div style={{ fontSize: '13px', wordBreak: 'break-all', color: '#2563eb' }}>
                  {`${window.location.origin}/apply?ref=${createdInfo.agent?.promoCode}`}
                </div>
              </div>
              {createdInfo.temporaryPassword && (
                <div>
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>TEMPORARY PASSWORD</span>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#b91c1c' }}>{createdInfo.temporaryPassword}</div>
                  <small style={{ color: '#666' }}>Share this one-time password with the agent securely.</small>
                </div>
              )}
            </div>

            <button className="btn btn-primary full" onClick={() => setCreatedInfo(null)}>
              Done
            </button>
          </div>
        </Dialog>
      )}

      {/* EDIT MODAL */}
      {editingAgent && (
        <Dialog open={true} onClose={() => setEditingAgent(null)} label="Edit Referral Agent" className="workspace-editor">
          <div className="workspace-editor-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <span className="eyebrow">{editingAgent.promoCode}</span>
                <h2 style={{ fontSize: '22px', margin: '4px 0' }}>Edit Partner Profile</h2>
              </div>
              <button className="icon-btn" onClick={() => setEditingAgent(null)}>
                <Icon name="close" size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdate}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                <label>
                  Full Name *
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </label>
                <label>
                  Phone Number *
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </label>
              </div>

              {isSuperAdmin && (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '16px', borderRadius: '8px' }}>
                  <h3 style={{ fontSize: '14px', margin: '0 0 12px', color: '#1e293b' }}>
                    Super Admin Rate Configuration
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
                    <label>
                      Student Discount %
                      <input
                        type="number"
                        min="0"
                        max="50"
                        step="0.5"
                        value={formData.studentDiscountPercent}
                        onChange={(e) => setFormData({ ...formData, studentDiscountPercent: Number(e.target.value) })}
                      />
                    </label>
                    <label>
                      Commission Rate %
                      <input
                        type="number"
                        min="0"
                        max="50"
                        step="0.5"
                        value={formData.commissionPercent}
                        onChange={(e) => setFormData({ ...formData, commissionPercent: Number(e.target.value) })}
                      />
                    </label>
                    <label>
                      Promo Code
                      <input
                        type="text"
                        value={formData.customPromoCode}
                        onChange={(e) => setFormData({ ...formData, customPromoCode: e.target.value.toUpperCase() })}
                      />
                    </label>
                  </div>
                  <small style={{ color: '#d97706', display: 'block', marginTop: '8px' }}>
                    Note: Changes to discount and commission apply only to FUTURE admissions. Existing commissions are not altered.
                  </small>
                </div>
              )}

              <div style={{ marginBottom: '16px' }}>
                <label>
                  Banking / UPI Details
                  <textarea
                    rows={3}
                    value={formData.payoutDetails}
                    onChange={(e) => setFormData({ ...formData, payoutDetails: e.target.value })}
                  />
                </label>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label>
                  Internal Notes
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setEditingAgent(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </Dialog>
      )}
    </div>
  );
};
