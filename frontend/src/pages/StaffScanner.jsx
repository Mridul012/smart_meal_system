import { useState, useRef } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const STATE = {
  SCANNING:   'scanning',
  LOADING:    'loading',
  PREVIEW:    'preview',
  CONFIRMING: 'confirming',
  SUCCESS:    'success',
  ERROR:      'error',
};

export default function StaffScanner() {
  const { user, logout } = useAuth();

  const [state, setState]             = useState(STATE.SCANNING);
  const [scannedToken, setScannedToken] = useState(null);
  const [preview, setPreview]         = useState(null);
  const [message, setMessage]         = useState('');

  const resetTimer = useRef(null);

  const resetToScanner = () => {
    clearTimeout(resetTimer.current);
    setState(STATE.SCANNING);
    setScannedToken(null);
    setPreview(null);
    setMessage('');
  };

  const scheduleReset = () => {
    resetTimer.current = setTimeout(resetToScanner, 3000);
  };

  const handleScan = async (detectedCodes) => {
    if (state !== STATE.SCANNING || detectedCodes.length === 0) return;
    const qrToken = detectedCodes[0].rawValue;
    setScannedToken(qrToken);
    setState(STATE.LOADING);
    try {
      const res = await api.post('/qr/scan-info', { token: qrToken });
      setPreview(res.data);
      setState(STATE.PREVIEW);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to read QR. Try again.');
      setState(STATE.ERROR);
      scheduleReset();
    }
  };

  const handleConfirm = async () => {
    setState(STATE.CONFIRMING);
    try {
      const res = await api.post('/qr/validate', { token: scannedToken, staffId: user._id });
      setMessage(`Meal served to ${res.data.userName}!`);
      setState(STATE.SUCCESS);
      scheduleReset();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Validation failed. Try again.');
      setState(STATE.ERROR);
      scheduleReset();
    }
  };

  const isScanning = state === STATE.SCANNING || state === STATE.LOADING;

  return (
    <div style={s.page}>

      {/* ── TOP BAR ── */}
      <header style={s.topBar}>
        <div style={s.logoWrap}>
          <span style={s.logoWhite}>Smart</span>
          <span style={s.logoRed}>Meal</span>
        </div>
        <span style={s.pageTitle}>Staff Scanner</span>
        <div style={s.topRight}>
          <span style={s.welcomeText}>Welcome, {user?.name}</span>
          <button onClick={logout} className="btn-logout" style={s.logoutBtn}>Logout</button>
        </div>
      </header>

      {/* ── CONTENT ── */}
      <div style={s.content}>

        {/* Scanner card */}
        <div style={s.card}>
          <p style={s.cardTitle}>Scan Student QR</p>

          <div style={s.scannerWrap}>
            <Scanner
              onScan={handleScan}
              onError={(err) => console.log('Scanner error:', err?.message)}
              paused={!isScanning}
              formats={['qr_code']}
              styles={{ container: { borderRadius: '6px', overflow: 'hidden' } }}
            />
            {/* Animated scan line — only while camera is live */}
            {state === STATE.SCANNING && <div className="scan-line" />}

            {/* Loading overlay */}
            {state === STATE.LOADING && (
              <div style={s.scannerOverlay}>
                <span className="spinner" />
                <p style={s.overlayText}>Reading QR…</p>
              </div>
            )}
          </div>

          {state === STATE.SCANNING && (
            <p style={s.hint}>Point camera at student's QR code</p>
          )}
        </div>

        {/* Preview card — PREVIEW state */}
        {state === STATE.PREVIEW && preview && (
          <div style={{ ...s.card, borderLeft: '3px solid #f59e0b', backgroundColor: '#f59e0b08' }}>
            <div style={s.previewRow}>
              <div style={s.avatar}>{preview.name?.[0]?.toUpperCase()}</div>
              <div style={s.previewInfo}>
                <p style={s.previewName}>{preview.name}</p>
                <p style={s.previewMeta}>
                  {preview.rollNumber ? `Roll No: ${preview.rollNumber}` : preview.role}
                </p>
                <span style={s.mealBadge}>{preview.mealType?.toUpperCase()}</span>
              </div>
            </div>
            <div style={s.btnRow}>
              <button onClick={resetToScanner} className="btn-cancel" style={s.cancelBtn}>
                Cancel
              </button>
              <button onClick={handleConfirm} className="btn-confirm" style={s.confirmBtn}>
                Confirm Serve
              </button>
            </div>
          </div>
        )}

        {/* Confirming state */}
        {state === STATE.CONFIRMING && (
          <div style={s.card}>
            <div style={s.centered}>
              <span className="spinner" />
              <p style={s.hint}>Serving meal…</p>
            </div>
          </div>
        )}

        {/* Success card */}
        {state === STATE.SUCCESS && (
          <div style={{ ...s.statusCard, borderLeft: '3px solid #22c55e', backgroundColor: '#22c55e0d' }} className="toast-enter">
            <p style={s.statusIcon}>✓</p>
            <div>
              <p style={{ ...s.statusTitle, color: '#22c55e' }}>Meal Served</p>
              <p style={s.statusMsg}>{message}</p>
              <p style={s.statusSub}>Resetting in 3 seconds…</p>
            </div>
          </div>
        )}

        {/* Error card */}
        {state === STATE.ERROR && (
          <div style={{ ...s.statusCard, borderLeft: '3px solid #e63946', backgroundColor: '#e639460d' }} className="toast-enter">
            <p style={{ ...s.statusIcon, color: '#e63946' }}>✕</p>
            <div>
              <p style={{ ...s.statusTitle, color: '#e63946' }}>Access Denied</p>
              <p style={s.statusMsg}>{message}</p>
              <p style={s.statusSub}>Resetting in 3 seconds…</p>
            </div>
          </div>
        )}
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
  pageTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#f5f5f5',
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
  },
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
    flex: 1,
    maxWidth: '480px',
    width: '100%',
    margin: '0 auto',
    padding: '32px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },

  // ── Cards ──
  card: {
    backgroundColor: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '8px',
    padding: '20px',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#f5f5f5',
    marginBottom: '16px',
  },

  // ── Scanner ──
  scannerWrap: {
    position: 'relative',
    borderRadius: '6px',
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  scannerOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
  },
  overlayText: {
    color: '#f5f5f5',
    fontSize: '14px',
    fontWeight: '500',
  },
  hint: {
    marginTop: '12px',
    fontSize: '13px',
    color: '#666666',
    textAlign: 'center',
  },

  // ── Preview ──
  previewRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    marginBottom: '16px',
  },
  avatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: '#e63946',
    color: '#fff',
    fontSize: '20px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  previewInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
  },
  previewName: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#f5f5f5',
    margin: 0,
  },
  previewMeta: {
    fontSize: '13px',
    color: '#666666',
    margin: 0,
  },
  mealBadge: {
    display: 'inline-block',
    marginTop: '4px',
    fontSize: '10px',
    fontWeight: '700',
    letterSpacing: '0.1em',
    color: '#f59e0b',
    backgroundColor: '#f59e0b15',
    border: '1px solid #f59e0b40',
    padding: '3px 8px',
    borderRadius: '4px',
  },
  btnRow: {
    display: 'flex',
    gap: '10px',
  },
  cancelBtn: {
    flex: 1,
    padding: '11px',
    fontSize: '14px',
    fontWeight: '600',
    border: '1px solid #2a2a2a',
    borderRadius: '6px',
    backgroundColor: '#1a1a1a',
    color: '#f5f5f5',
    cursor: 'pointer',
    transition: 'border-color 0.15s',
  },
  confirmBtn: {
    flex: 1,
    padding: '11px',
    fontSize: '14px',
    fontWeight: '600',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#22c55e',
    color: '#fff',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  },

  // ── Status cards ──
  statusCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '14px',
    padding: '16px 20px',
    border: '1px solid #2a2a2a',
    borderRadius: '8px',
  },
  statusIcon: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#22c55e',
    flexShrink: 0,
    lineHeight: 1,
    marginTop: '2px',
  },
  statusTitle: {
    fontSize: '15px',
    fontWeight: '700',
    marginBottom: '3px',
  },
  statusMsg: {
    fontSize: '13px',
    color: '#f5f5f5',
    marginBottom: '4px',
  },
  statusSub: {
    fontSize: '12px',
    color: '#666666',
  },
  centered: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '16px 0',
  },
};
