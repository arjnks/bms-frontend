import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/auth';
import { showToast } from '../components/ui/Toast';

export default function Login() {
  const [tab, setTab] = useState('login');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginErr, setLoginErr] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [regStep, setRegStep] = useState(1);
  const [selRole, setSelRole] = useState('');
  const [regForm, setRegForm] = useState({ name: '', email: '', phone: '', customer_code: '', username: '', password: '' });
  const [regErr, setRegErr] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [submitted, setSubmitted] = useState(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginForm.email || !loginForm.password) { setLoginErr('Please enter email and password.'); return; }
    setLoginErr(''); setLoginLoading(true);
    try {
      const user = await login(loginForm);
      navigate(user.role === 'admin' ? '/dashboard' : '/portal', { replace: true });
    } catch (err) {
      if (err?.status === 403) {
        setLoginErr('Your account is awaiting admin approval');
      } else if (err?.status === 401) {
        setLoginErr('Invalid username or password');
      } else {
        setLoginErr(err?.message || 'Login failed. Please try again.');
      }
    } finally { setLoginLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const { name, email, phone, username, password } = regForm;
    if (!name || !email || !phone || !username || !password) { setRegErr('All fields are required.'); return; }
    if (password.length < 8) { setRegErr('Password must be at least 8 characters.'); return; }
    setRegErr(''); setRegLoading(true);
    try {
      await authApi.register({
        name, email, phone, username, password,
        password_confirmation: password,
        role: selRole,
        ...(selRole !== 'admin' ? { customer_code: regForm.customer_code } : {}),
      });
      setSubmitted({ name, email, role: selRole, time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) });
    } catch (err) {
      const msg = err?.errors ? Object.values(err.errors).flat().join(' ') : (err?.message || 'Registration failed. Please try again.');
      setRegErr(msg);
    } finally { setRegLoading(false); }
  };

  return (
    <div className="login-page">
      <div className="login-card-wrap">
        {/* LOGO */}
        <div className="login-logo-block">
          <img src="/leo-logo.png" alt="Leo Group" className="login-card-logo" />
          <div className="login-card-brand-sub">Bill Management Portal</div>
        </div>

        <div className="login-box">
          {/* TABS */}
          <div className="m-tabs">
            <button className={`m-tab${tab === 'login' ? ' active' : ''}`} onClick={() => setTab('login')}>Login</button>
            <button className={`m-tab${tab === 'register' ? ' active' : ''}`} onClick={() => { setTab('register'); setRegStep(1); setSubmitted(null); }}>Register</button>
          </div>

          {/* LOGIN FORM */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} noValidate>
              <div className="mf-group">
                <label className="mf-label">Email</label>
                <input className="mf-input" type="email" placeholder="you@example.com" autoComplete="email"
                  value={loginForm.email}
                  onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="mf-group">
                <label className="mf-label">Password</label>
                <input className="mf-input" type="password" placeholder="••••••••" autoComplete="current-password"
                  value={loginForm.password}
                  onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))} />
              </div>
              {loginErr && <div className="mf-err show">{loginErr}</div>}
              <button className="btn-submit" type="submit" disabled={loginLoading}>
                {loginLoading ? 'Signing in…' : 'Sign In'}
              </button>
              <div className="m-switch">Don't have an account?{' '}
                {/* BUG-17 fix: use button styled as link for proper a11y */}
                <button type="button" style={{ background: 'none', border: 'none', padding: 0, color: 'var(--blue)', cursor: 'pointer', fontSize: 'inherit', textDecoration: 'underline' }}
                  onClick={() => { setTab('register'); setRegStep(1); setSubmitted(null); }}>Register here</button>
              </div>
            </form>
          )}

          {/* REGISTER FORM */}
          {tab === 'register' && !submitted && (
            <>
              <div className="step-bar">
                <div className={`s-dot ${regStep >= 1 ? 'done' : 'idle'}`}>1</div>
                <div className={`s-line ${regStep >= 2 ? 'done' : ''}`} />
                <div className={`s-dot ${regStep >= 2 ? 'active' : 'idle'}`}>2</div>
              </div>

              {regStep === 1 && (
                <>
                  <div className="f-title">Create account</div>
                  <div className="f-sub">Select your account type to get started</div>
                  <div className="role-grid role-grid-3">
                    {[
                      { id: 'admin', name: 'Admin' },
                      { id: 'customer', name: 'Customer' },
                      { id: 'marketing_company', name: 'Marketing Company' },
                    ].map(r => (
                      <label key={r.id} className={`role-card${selRole === r.id ? ' sel' : ''}`} onClick={() => setSelRole(r.id)}>
                        <input type="radio" name="role" value={r.id} />
                        <div className="rc-check"><svg viewBox="0 0 24 24"><polyline points="20,6 9,17 4,12" /></svg></div>
                        <div className="rc-name">{r.name}</div>
                      </label>
                    ))}
                  </div>
                  <button className="btn-submit" type="button"
                    onClick={() => { if (!selRole) { showToast('Please select a role.', 'warn'); return; } setRegStep(2); }}>
                    Continue →
                  </button>
                </>
              )}

              {regStep === 2 && (
                <form onSubmit={handleRegister} noValidate>
                  <div className="f-title">Your details</div>
                  <div className="f-sub">Fill in your info — admin will verify and approve your account</div>
                  <div className="mf-row2">
                    <div className="mf-group">
                      <label className="mf-label">Full Name</label>
                      <input className="mf-input" placeholder="John Doe" value={regForm.name}
                        onChange={e => setRegForm(f => ({ ...f, name: e.target.value }))} />
                    </div>
                    <div className="mf-group">
                      <label className="mf-label">Username</label>
                      <input className="mf-input" placeholder="e.g. rajeshk" value={regForm.username}
                        onChange={e => setRegForm(f => ({ ...f, username: e.target.value }))} />
                    </div>
                  </div>
                  <div className="mf-row2">
                    <div className="mf-group">
                      <label className="mf-label">Phone</label>
                      <input className="mf-input" placeholder="+91 98765 43210" value={regForm.phone}
                        onChange={e => setRegForm(f => ({ ...f, phone: e.target.value }))} />
                    </div>
                    <div className="mf-group">
                      <label className="mf-label">Email</label>
                      <input className="mf-input" type="email" placeholder="you@example.com" value={regForm.email}
                        onChange={e => setRegForm(f => ({ ...f, email: e.target.value }))} />
                    </div>
                  </div>
                  {/* BUG-13 fix: Customer Code only shown to non-admin roles */}
                  {selRole !== 'admin' && (
                    <div className="mf-group">
                      <label className="mf-label">Customer Code (if known)</label>
                      <input className="mf-input" placeholder="e.g. RK-2041" value={regForm.customer_code}
                        onChange={e => setRegForm(f => ({ ...f, customer_code: e.target.value }))} />
                    </div>
                  )}
                  <div className="mf-group">
                    <label className="mf-label">Password</label>
                    <input className="mf-input" type="password" placeholder="Min. 8 characters" value={regForm.password}
                      onChange={e => setRegForm(f => ({ ...f, password: e.target.value }))} />
                  </div>
                  {regErr && <div className="mf-err show">{regErr}</div>}
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="button" className="btn-submit" style={{ flex: '0 0 auto', width: 'auto', padding: '13px 20px', background: 'var(--gray-4)', color: 'var(--text)' }}
                      onClick={() => setRegStep(1)}>← Back</button>
                    <button type="submit" className="btn-submit" style={{ flex: 1 }} disabled={regLoading}>
                      {regLoading ? 'Submitting…' : 'Submit Request'}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          {/* PENDING STATE */}
          {tab === 'register' && submitted && (
            <div className="pend-wrap">
              <div className="pend-icon">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><polyline points="12,6 12,12 16,14" /></svg>
              </div>
              <div className="pend-title">Request Submitted!</div>
              <div className="pend-sub">Your registration is pending admin approval. You'll receive a WhatsApp message once approved.</div>
              <div className="pend-info">
                <div className="pend-row"><span className="pend-key">Name</span><span className="pend-val">{submitted.name}</span></div>
                <div className="pend-row"><span className="pend-key">Email</span><span className="pend-val">{submitted.email}</span></div>
                <div className="pend-row"><span className="pend-key">Role</span><span className="pend-val">{submitted.role}</span></div>
                <div className="pend-row"><span className="pend-key">Submitted</span><span className="pend-val">{submitted.time}</span></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, color: 'var(--text-2)', marginBottom: '1.25rem' }}>
                <div className="pdot" />
                Awaiting admin review…
              </div>
              <button className="btn-submit" onClick={() => { setTab('login'); setSubmitted(null); }}>
                Back to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
