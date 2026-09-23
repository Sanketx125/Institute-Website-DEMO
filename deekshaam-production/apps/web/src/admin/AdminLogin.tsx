import React, { useState } from 'react';
import { Icon } from '@deekshaam/ui';
import { api, setAuthToken } from '../services/api';
import { SEOHead } from '../components/SEOHead';

interface AdminLoginProps {
  onLoginSuccess: (user?: any) => void;
  onNavigate: (path: string) => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onNavigate }) => {
  const [email, setEmail] = useState('admin@deekshaam.edu');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.login({ email, password });
      setAuthToken(res.token);
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEOHead title="Staff Login | Admin Portal" />

      <div
        style={{
          minHeight: '100vh',
          background: '#f4f5f7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '420px',
            background: '#fff',
            borderRadius: '20px',
            border: '1px solid #e2ddd8',
            padding: '40px 32px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.06)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '14px',
                background: '#17191b',
                color: 'var(--orange)',
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 16px',
              }}
            >
              <Icon name="shield" size={28} color="var(--orange)" />
            </div>
            <h1 style={{ fontSize: '24px', margin: '0 0 6px', letterSpacing: '-0.5px' }}>Deekshaam Staff Portal</h1>
            <p style={{ color: '#777', fontSize: '13px', margin: 0 }}>Secure Admin & Admissions Access</p>
          </div>

          {error && (
            <div
              style={{
                background: '#ffe5e5',
                color: '#c92a2a',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '13px',
                marginBottom: '20px',
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', fontWeight: 700 }}>
              Staff Email Address
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@deekshaam.edu"
                required
                style={{
                  border: '1px solid #dcd8d3',
                  borderRadius: '10px',
                  padding: '12px',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', fontWeight: 700 }}>
              Password
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%',
                    border: '1px solid #dcd8d3',
                    borderRadius: '10px',
                    padding: '12px 42px 12px 12px',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    color: '#666',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name={showPassword ? 'eye-off' : 'eye'} size={18} />
                </button>
              </div>
            </label>

            <button
              type="submit"
              className="btn btn-primary full"
              style={{ marginTop: '8px', height: '46px' }}
              disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Sign In to Workspace'}
            </button>
          </form>

          <div
            style={{
              marginTop: '24px',
              paddingTop: '20px',
              borderTop: '1px solid #eee',
              textAlign: 'center',
              fontSize: '12px',
              color: '#888',
            }}
          >
            <div>Credentials are provisioned by the platform administrator</div>
            <div style={{ marginTop: '4px' }}>(dev: see the API startup log or set ADMIN_PASSWORD / STAFF_PASSWORD)</div>
            <div style={{ marginTop: '16px' }}>
              <button
                onClick={() => onNavigate('/')}
                style={{ background: 'none', border: 'none', color: 'var(--orange)', cursor: 'pointer', fontWeight: 700 }}
              >
                &larr; Return to Public Website
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
