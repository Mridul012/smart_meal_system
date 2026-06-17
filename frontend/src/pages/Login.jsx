import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import SegmentedControl from '../components/SegmentedControl';

const roleRedirect = {
  admin: '/admin',
  staff: '/staff',
  student: '/student',
  guest: '/student',
};

const TABS = [
  { label: 'Super Admin', hint: 'admin@mess.com / admin123',     email: 'admin@mess.com',   password: 'admin123'   },
  { label: 'Staff',       hint: 'staff@mess.com / staff123',     email: 'staff@mess.com',   password: 'staff123'   },
  { label: 'Student',     hint: 'student@mess.com / student123', email: 'student@mess.com', password: 'student123' },
];

export default function Login() {
  const [activeTab, setActiveTab] = useState(0);
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const { login }  = useAuth();
  const navigate   = useNavigate();

  const handleTabChange = (i) => {
    setActiveTab(i);
    setEmail(TABS[i].email);
    setPassword(TABS[i].password);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user } = res.data;
      login(token, user);
      navigate(roleRedirect[user.role] || '/student');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const currentTab = TABS[activeTab];

  return (
    <div style={s.page}>

      {/* ── LEFT HERO ── */}
      <div style={s.left}>
        <div style={s.logoWrap}>
          <span style={s.logoWhite}>Smart</span>
          <span style={s.logoRed}>Meal</span>
        </div>

        <div style={s.heroText}>
          <h1 style={s.heroHeading}>
            It's not just Food,<br />It's an Experience.
          </h1>
          <p style={s.heroPow}>Powering Newton School of Technology mess</p>
        </div>

        <p style={s.builtBy}>Built by Mridul • NST 2024</p>
      </div>

      {/* ── RIGHT FORM ── */}
      <div style={s.right}>
        <div style={s.formWrap}>
          <h2 style={s.title}>Welcome back</h2>
          <p style={s.subtitle}>Sign in to your account</p>

          {/* Role tabs */}
          <SegmentedControl
            options={TABS.map((tab, i) => ({ label: tab.label, value: i }))}
            value={activeTab}
            onChange={handleTabChange}
            fullWidth
          />

          <form onSubmit={handleSubmit} style={s.form}>
            <div style={s.field}>
              <label style={s.label}>EMAIL</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={currentTab.email}
                required
                style={s.input}
              />
            </div>

            <div style={s.field}>
              <label style={s.label}>PASSWORD</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={s.input}
              />
            </div>

            {error && <p style={s.error}>{error}</p>}

            <button type="submit" disabled={loading} style={s.submitBtn} className="btn-accent">
              {loading ? <span className="spinner" /> : 'Sign In'}
            </button>

            {/* Demo credentials box */}
            <div style={s.demoBox}>
              <span style={s.demoLabel}>Demo </span>
              <span style={s.demoCreds}>{currentTab.hint}</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: {
    display: 'flex',
    minHeight: '100vh',
    fontFamily: "'Inter', system-ui, sans-serif",
  },

  // ── Left side ──
  left: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    backgroundImage: 'radial-gradient(circle, #2a2a2a 1px, transparent 1px)',
    backgroundSize: '24px 24px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '40px 48px',
    position: 'relative',
  },
  logoWrap: {
    fontSize: '22px',
    fontWeight: '700',
    letterSpacing: '-0.02em',
  },
  logoWhite: { color: '#f5f5f5' },
  logoRed:   { color: '#e63946' },
  heroText:  { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '16px' },
  heroHeading: {
    fontSize: '48px',
    fontWeight: '800',
    color: '#f5f5f5',
    lineHeight: '1.1',
    letterSpacing: '-0.03em',
  },
  heroPow: {
    fontSize: '14px',
    color: '#666666',
    lineHeight: '1.5',
  },
  builtBy: {
    fontSize: '12px',
    color: '#444444',
  },

  // ── Right side ──
  right: {
    width: '50%',
    minWidth: '420px',
    backgroundColor: '#1a1a1a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px',
  },
  formWrap: {
    width: '100%',
    maxWidth: '380px',
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#f5f5f5',
    marginBottom: '-24px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#666666',
  },

  // ── Form ──
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#666666',
    letterSpacing: '0.07em',
    textTransform: 'uppercase',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '14px',
    backgroundColor: '#0f0f0f',
    border: '1px solid #2a2a2a',
    borderRadius: '6px',
    color: '#f5f5f5',
    transition: 'border-color 0.15s',
  },
  error: {
    padding: '10px 14px',
    backgroundColor: '#e6394610',
    border: '1px solid #e6394640',
    borderRadius: '6px',
    color: '#e63946',
    fontSize: '13px',
  },
  submitBtn: {
    width: '100%',
    padding: '14px',
    fontSize: '15px',
    fontWeight: '600',
    backgroundColor: '#e63946',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '48px',
  },
  demoBox: {
    padding: '10px 14px',
    backgroundColor: '#0f0f0f',
    border: '1px solid #2a2a2a',
    borderRadius: '6px',
    fontSize: '12px',
    textAlign: 'center',
  },
  demoLabel: {
    color: '#666666',
  },
  demoCreds: {
    fontFamily: 'monospace',
    color: '#f5f5f5',
    fontSize: '13px',
  },
};
