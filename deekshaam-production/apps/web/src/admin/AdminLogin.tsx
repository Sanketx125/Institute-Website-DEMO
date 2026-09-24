import React, { useState } from 'react';
import { Icon } from '@deekshaam/ui';
import { api, setAuthToken } from '../services/api';
import { SEOHead } from '../components/SEOHead';
interface AdminLoginProps { onLoginSuccess: (user?: any) => void; onNavigate: (path: string) => void; }
export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onNavigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const signIn = async () => {
    setLoading(true); setError('');
    try { const result = await api.login({ email: email.trim(), password }); setAuthToken(result.token); onLoginSuccess(result.user); }
    catch (err: any) { setError(err.message || 'Unable to sign in. Please try again.'); }
    finally { setLoading(false); }
  };
  return <><SEOHead title="Staff sign in" /><main className="login-page">
    <div className="login-story"><a href="/" onClick={e => { e.preventDefault(); onNavigate('/'); }} className="login-brand"><img src="/favicon.svg" alt="" /><span>Deekshaam<small>BUSINESS SCHOOL</small></span></a><div><span className="eyebrow light">One campus. A connected team.</span><h1>Good work starts<br />with the right access.</h1><p>Manage the website, support applicants and keep campus operations moving from one shared workspace.</p></div><div className="login-student"><strong>Applying to Deekshaam?</strong><p>You do not need a staff account. Use your application reference and registered email to track progress.</p><button onClick={() => onNavigate('/track')}>Track your application <Icon name="arrow" size={16} /></button></div></div>
    <div className="login-content"><div className="login-form-wrap"><span className="eyebrow">Staff workspace</span><h2>Welcome back.</h2><p>Sign in with your staff email. Your account determines which tools you can access.</p>
      {error && <div className="inline-feedback error" role="alert">{error}</div>}
      <form onSubmit={e => { e.preventDefault(); signIn(); }} className="staff-login-form">
        <label>Staff email<input type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@deekshaam.edu" required /></label>
        <label>Password<span className="password-field"><input type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)}><Icon name={showPassword ? 'eye-off' : 'eye'} size={18} /></button></span></label>
        <button className="btn btn-primary full" disabled={loading}>{loading ? 'Signing in...' : 'Sign in to workspace'} <Icon name="arrow" size={16} /></button>
      </form>
      <details className="login-help"><summary>Need an account or forgot your password?</summary><p>Ask your institution administrator to create an account in Team &amp; access. Password recovery is handled by your administrator; automated email reset is not configured.</p><a href="mailto:admission@deekshaedu.in">Contact the campus team</a></details>
      <button className="text-link login-back" onClick={() => onNavigate('/')}>Back to the website</button>
    </div></div>
  </main></>;
};
