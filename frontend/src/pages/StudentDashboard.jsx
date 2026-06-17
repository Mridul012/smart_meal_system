import { useState, useEffect, useRef } from 'react';
import QRCode from 'react-qr-code';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import SegmentedControl from '../components/SegmentedControl';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning,';
  if (h < 17) return 'Good afternoon,';
  return 'Good evening,';
};

const formatDate = () =>
  new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

const mealBorderColor = { breakfast: '#f59e0b', lunch: '#22c55e', dinner: '#6366f1' };

export default function StudentDashboard() {
  const { user, logout } = useAuth();

  const [mealType, setMealType]   = useState('lunch');
  const [qrToken, setQrToken]     = useState(null);
  const [qrExpired, setQrExpired] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError]     = useState('');

  const [menu, setMenu]               = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);

  const timerRef = useRef(null);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await api.get('/menu');
        setMenu(res.data);
      } catch {
        // Menu failing shouldn't block the page
      } finally {
        setMenuLoading(false);
      }
    };
    fetchMenu();
  }, []);

  useEffect(() => {
    if (!qrToken) return;
    setCountdown(60);
    setQrExpired(false);
    clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setQrToken(null);
          setQrExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [qrToken]);

  const handleGenerate = async () => {
    setQrError('');
    setQrToken(null);
    setQrExpired(false);
    clearInterval(timerRef.current);
    setQrLoading(true);
    try {
      const res = await api.get('/qr/generate', { params: { userId: user._id, mealType } });
      setQrToken(res.data.token);
    } catch (err) {
      setQrError(err.response?.data?.message || 'Failed to generate QR. Try again.');
    } finally {
      setQrLoading(false);
    }
  };

  return (
    <div style={s.page}>

      {/* ── TOP BAR ── */}
      <header style={s.topBar}>
        <div style={s.logoWrap}>
          <span style={s.logoWhite}>Smart</span>
          <span style={s.logoRed}>Meal</span>
        </div>
        <div style={s.topRight}>
          <span style={s.welcomeText}>
            {user?.role === 'guest' ? 'Guest' : user?.rollNumber || ''}
          </span>
          <button onClick={logout} className="btn-logout" style={s.logoutBtn}>Logout</button>
        </div>
      </header>

      {/* ── CONTENT ── */}
      <div style={s.content}>

        {/* Greeting */}
        <div style={s.greeting}>
          <p style={s.greetingLine}>{getGreeting()}</p>
          <h1 style={s.greetingName}>{user?.name}</h1>
          <p style={s.greetingDate}>{formatDate()}</p>
        </div>

        {/* Meal type pill selector */}
        <SegmentedControl
          options={[
            { label: 'Breakfast', value: 'breakfast' },
            { label: 'Lunch',     value: 'lunch'      },
            { label: 'Dinner',    value: 'dinner'     },
          ]}
          value={mealType}
          onChange={(val) => { setMealType(val); setQrToken(null); setQrExpired(false); }}
          fullWidth
        />

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={qrLoading}
          className="btn-accent"
          style={s.generateBtn}
        >
          {qrLoading ? <span className="spinner" /> : 'Generate QR Code'}
        </button>

        {qrError && <p style={s.errorBox}>{qrError}</p>}

        {/* QR Card */}
        {qrToken && (
          <div style={s.qrCard}>
            <p style={s.qrLabel}>SCAN THIS CODE</p>
            <div style={s.qrWrap}>
              <QRCode value={qrToken} size={200} />
            </div>
            <div style={s.timerRow}>
              <div
                style={{
                  ...s.timerBar,
                  width: `${(countdown / 60) * 100}%`,
                  backgroundColor: countdown > 15 ? '#e63946' : '#f59e0b',
                }}
              />
            </div>
            <p style={s.timerText}>
              <span style={{ fontSize: '28px', fontWeight: '700', color: countdown > 15 ? '#e63946' : '#f59e0b' }}>
                {countdown}
              </span>
              <span style={s.timerSub}> seconds remaining</span>
            </p>
          </div>
        )}

        {/* Expired state */}
        {qrExpired && !qrToken && (
          <div style={s.expiredBox}>
            <p style={s.expiredText}>QR Expired — Generate a new one</p>
          </div>
        )}

        {/* Today's Menu */}
        <div style={s.menuCard}>
          <p style={s.menuTitle}>Today's Menu</p>
          {menuLoading ? (
            <div style={s.centered}><span className="spinner" /></div>
          ) : menu.length === 0 ? (
            <p style={s.muted}>No menu posted for today yet.</p>
          ) : (
            <div style={s.menuList}>
              {menu.map((entry) => (
                <div
                  key={entry._id}
                  style={{ ...s.menuEntry, borderLeft: `3px solid ${mealBorderColor[entry.mealType] || '#444'}` }}
                >
                  <p style={{ ...s.menuMealType, color: mealBorderColor[entry.mealType] }}>
                    {entry.mealType.toUpperCase()}
                  </p>
                  <ul style={s.menuItems}>
                    {entry.items.map((item, i) => (
                      <li key={i} style={s.menuItem}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#0f0f0f',
    fontFamily: "'Inter', system-ui, sans-serif",
    display: 'flex',
    flexDirection: 'column',
  },

  // ── Top bar ──
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    height: '56px',
    borderBottom: '1px solid #2a2a2a',
    backgroundColor: '#0f0f0f',
    flexShrink: 0,
  },
  logoWrap: {
    fontSize: '16px',
    fontWeight: '700',
  },
  logoWhite: { color: '#f5f5f5' },
  logoRed:   { color: '#e63946' },
  topRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  welcomeText: {
    fontSize: '13px',
    color: '#666666',
  },
  logoutBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    color: '#666666',
    padding: 0,
    transition: 'color 0.15s',
  },

  // ── Content ──
  content: {
    maxWidth: '480px',
    width: '100%',
    margin: '0 auto',
    padding: '40px 16px 40px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },

  // ── Greeting ──
  greeting: {
    marginBottom: '8px',
  },
  greetingLine: {
    fontSize: '16px',
    color: '#666666',
    marginBottom: '4px',
  },
  greetingName: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#f5f5f5',
    letterSpacing: '-0.02em',
    marginBottom: '4px',
  },
  greetingDate: {
    fontSize: '13px',
    color: '#444444',
  },

  // ── Generate button ──
  generateBtn: {
    width: '100%',
    padding: '14px',
    fontSize: '15px',
    fontWeight: '600',
    backgroundColor: '#e63946',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '50px',
  },
  errorBox: {
    padding: '10px 14px',
    backgroundColor: '#e6394610',
    border: '1px solid #e6394640',
    borderRadius: '6px',
    color: '#e63946',
    fontSize: '13px',
  },

  // ── QR Card ──
  qrCard: {
    backgroundColor: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '8px',
    padding: '28px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
  },
  qrLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#666666',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
  },
  qrWrap: {
    backgroundColor: '#ffffff',
    padding: '16px',
    borderRadius: '6px',
    lineHeight: 0,
  },
  timerRow: {
    width: '200px',
    height: '3px',
    backgroundColor: '#2a2a2a',
    borderRadius: '99px',
    overflow: 'hidden',
  },
  timerBar: {
    height: '100%',
    borderRadius: '99px',
    transition: 'width 1s linear, background-color 0.3s',
  },
  timerText: {
    textAlign: 'center',
    color: '#666666',
    fontSize: '14px',
  },
  timerSub: {
    color: '#666666',
    fontSize: '14px',
  },

  // ── Expired ──
  expiredBox: {
    padding: '14px 20px',
    backgroundColor: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '8px',
    textAlign: 'center',
  },
  expiredText: {
    fontSize: '14px',
    color: '#666666',
  },

  // ── Menu card ──
  menuCard: {
    backgroundColor: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '8px',
    padding: '20px',
    marginTop: '8px',
  },
  menuTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#f5f5f5',
    marginBottom: '16px',
  },
  menuList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  menuEntry: {
    paddingLeft: '14px',
    paddingBottom: '4px',
  },
  menuMealType: {
    fontSize: '10px',
    fontWeight: '700',
    letterSpacing: '0.1em',
    marginBottom: '6px',
  },
  menuItems: {
    paddingLeft: '16px',
    margin: 0,
  },
  menuItem: {
    fontSize: '14px',
    color: '#f5f5f5',
    marginBottom: '3px',
    lineHeight: '1.5',
  },
  muted: {
    fontSize: '14px',
    color: '#666666',
  },
  centered: {
    display: 'flex',
    justifyContent: 'center',
    padding: '20px 0',
  },
};
