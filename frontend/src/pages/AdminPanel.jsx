import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import SegmentedControl from '../components/SegmentedControl';

export default function AdminPanel() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div style={s.page}>

      {/* ── SIDEBAR ── */}
      <aside style={s.sidebar}>
        <div style={s.sidebarLogo}>
          <span style={s.logoWhite}>Smart</span>
          <span style={s.logoRed}>Meal</span>
        </div>
        <div style={s.sidebarBottom}>
          <p style={s.sidebarUser}>Logged in as {user?.name}</p>
          <button onClick={logout} className="btn-logout" style={s.logoutBtn}>
            Logout
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main style={s.main}>
        <SegmentedControl
          options={[
            { label: 'Users',    value: 0 },
            { label: 'Add User', value: 1 },
            { label: 'Menu',     value: 2 },
          ]}
          value={activeTab}
          onChange={setActiveTab}
        />
        <div style={{ marginTop: '28px' }}>
          {activeTab === 0 && <UsersTab />}
          {activeTab === 1 && <AddUserTab />}
          {activeTab === 2 && <MenuTab />}
        </div>
      </main>
    </div>
  );
}

// ─── TAB 1: USERS ─────────────────────────────────────────────────────────────
function UsersTab() {
  const { user: currentUser } = useAuth();
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get('/auth/users');
      setUsers(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/auth/users/${id}`);
      setUsers((prev) => prev.filter((u) => u._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user');
    }
  };

  if (loading) return <div style={s.centered}><span className="spinner" /></div>;
  if (error)   return <p style={s.errorText}>{error}</p>;

  const studentCount = users.filter((u) => u.role === 'student').length;
  const staffCount   = users.filter((u) => u.role === 'staff').length;

  return (
    <div>
      {/* Stats row */}
      <div style={s.statsRow}>
        {[
          { label: 'Total Users', value: users.length },
          { label: 'Students',    value: studentCount },
          { label: 'Staff',       value: staffCount   },
        ].map((stat) => (
          <div key={stat.label} style={s.statCard}>
            <p style={s.statNum}>{stat.value}</p>
            <p style={s.statLabel}>{stat.label}</p>
          </div>
        ))}
      </div>

      <h3 style={s.sectionTitle}>All Users</h3>

      <div style={s.tableWrap}>
        <table style={s.table}>
          <thead>
            <tr>
              {['Name', 'Email', 'Roll No', 'Role', ''].map((h) => (
                <th key={h} style={s.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="admin-row" style={s.tr}>
                <td style={s.td}>{u.name}</td>
                <td style={{ ...s.td, color: '#666666' }}>{u.email}</td>
                <td style={{ ...s.td, color: '#666666' }}>{u.rollNumber || '—'}</td>
                <td style={s.td}>
                  <span style={{ ...s.roleBadge, ...roleBadgeColor(u.role) }}>
                    {u.role}
                  </span>
                </td>
                <td style={s.td}>
                  {u._id !== currentUser._id && (
                    <button
                      onClick={() => handleDelete(u._id, u.name)}
                      className="btn-delete"
                      style={s.deleteBtn}
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── TAB 2: ADD USER ──────────────────────────────────────────────────────────
function AddUserTab() {
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'student', rollNumber: '', guestMealLimit: 3,
  });
  const [success, setSuccess] = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setSuccess('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');
    try {
      await api.post('/auth/register', form);
      setSuccess(`User "${form.name}" created successfully`);
      setForm({ name: '', email: '', password: '', role: 'student', rollNumber: '', guestMealLimit: 3 });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3 style={s.sectionTitle}>Create New User</h3>
      <form onSubmit={handleSubmit} style={s.form}>
        <div style={s.formGrid}>
          <Field label="Full Name">
            <input name="name" value={form.name} onChange={handleChange}
              placeholder="John Doe" required style={s.input} />
          </Field>
          <Field label="Email">
            <input name="email" type="email" value={form.email} onChange={handleChange}
              placeholder="john@example.com" required style={s.input} />
          </Field>
          <Field label="Password">
            <input name="password" type="password" value={form.password} onChange={handleChange}
              placeholder="Min 6 characters" required style={s.input} />
          </Field>
          <Field label="Role">
            <select name="role" value={form.role} onChange={handleChange} style={s.input}>
              <option value="student">Student</option>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
              <option value="guest">Guest</option>
            </select>
          </Field>
          {form.role === 'student' && (
            <Field label="Roll Number">
              <input name="rollNumber" value={form.rollNumber} onChange={handleChange}
                placeholder="e.g. 21CS045" style={s.input} />
            </Field>
          )}
          {form.role === 'guest' && (
            <Field label="Meal Limit">
              <input name="guestMealLimit" type="number" min={1} max={20}
                value={form.guestMealLimit} onChange={handleChange} style={s.input} />
            </Field>
          )}
        </div>

        {success && <p style={s.successText}>{success}</p>}
        {error   && <p style={s.errorText}>{error}</p>}

        <button type="submit" disabled={loading} className="btn-accent" style={s.submitBtn}>
          {loading ? <span className="spinner" /> : 'Create User'}
        </button>
      </form>
    </div>
  );
}

// ─── TAB 3: MENU ──────────────────────────────────────────────────────────────
function MenuTab() {
  const [menu, setMenu]           = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [form, setForm]           = useState({ date: today(), mealType: 'lunch', items: '' });
  const [success, setSuccess]     = useState('');
  const [error, setError]         = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchMenu = useCallback(async () => {
    try {
      const res = await api.get('/menu');
      setMenu(res.data);
    } catch {
      // silently ignore
    } finally {
      setMenuLoading(false);
    }
  }, []);

  useEffect(() => { fetchMenu(); }, [fetchMenu]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setSuccess('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccess('');
    setError('');

    const items = form.items.split(',').map((s) => s.trim()).filter(Boolean);
    if (items.length === 0) {
      setError('Add at least one menu item');
      setSubmitting(false);
      return;
    }
    try {
      const res = await api.post('/menu', { ...form, items });
      setMenu((prev) => [...prev, res.data.menu]);
      setSuccess('Menu entry added!');
      setForm({ date: today(), mealType: 'lunch', items: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add menu');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Add menu form — shown first so admin can add without scrolling */}
      <h3 style={s.sectionTitle}>Add Menu Entry</h3>
      <form onSubmit={handleSubmit} style={{ ...s.form, marginBottom: '32px' }}>
        <div style={s.formGrid}>
          <Field label="Date">
            <input name="date" type="date" value={form.date} onChange={handleChange}
              required style={s.input} />
          </Field>
          <Field label="Meal Type">
            <select name="mealType" value={form.mealType} onChange={handleChange} style={s.input}>
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
            </select>
          </Field>
          <Field label="Items (comma-separated)" fullWidth>
            <input name="items" value={form.items} onChange={handleChange}
              placeholder="Rice, Dal, Roti, Sabzi" required style={s.input} />
          </Field>
        </div>

        {success && <p style={s.successText}>{success}</p>}
        {error   && <p style={s.errorText}>{error}</p>}

        <button type="submit" disabled={submitting} className="btn-accent" style={s.submitBtn}>
          {submitting ? <span className="spinner" /> : 'Add Menu'}
        </button>
      </form>

      {/* Today's menu */}
      <h3 style={s.sectionTitle}>Today's Menu</h3>
      {menuLoading ? (
        <div style={s.centered}><span className="spinner" /></div>
      ) : menu.length === 0 ? (
        <p style={s.muted}>No menu for today yet.</p>
      ) : (
        <div style={s.menuGrid}>
          {menu.map((entry) => (
            <div key={entry._id} style={{ ...s.menuCard, borderLeft: `3px solid ${mealColor(entry.mealType)}` }}>
              <span style={{ ...s.menuBadge, color: mealColor(entry.mealType), backgroundColor: mealColor(entry.mealType) + '15' }}>
                {entry.mealType.toUpperCase()}
              </span>
              <ul style={s.menuList}>
                {entry.items.map((item, i) => (
                  <li key={i} style={s.menuItem}>{item}</li>
                ))}
              </ul>
              {entry.createdBy?.name && (
                <p style={s.menuMeta}>Added by {entry.createdBy.name}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Shared field wrapper ──────────────────────────────────────────────────────
function Field({ label, children, fullWidth }) {
  return (
    <div style={{ ...s.field, ...(fullWidth ? { gridColumn: '1 / -1' } : {}) }}>
      <label style={s.fieldLabel}>{label}</label>
      {children}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const today = () => new Date().toISOString().split('T')[0];

const roleBadgeColor = (role) => ({
  admin:   { backgroundColor: '#e6394620', color: '#e63946', border: '1px solid #e6394640' },
  staff:   { backgroundColor: '#f59e0b20', color: '#f59e0b', border: '1px solid #f59e0b40' },
  student: { backgroundColor: '#22c55e20', color: '#22c55e', border: '1px solid #22c55e40' },
  guest:   { backgroundColor: '#66666620', color: '#888888', border: '1px solid #66666640' },
}[role] || {});

const mealColor = (type) => ({ breakfast: '#f59e0b', lunch: '#22c55e', dinner: '#6366f1' }[type] || '#666666');

const s = {
  page: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#0f0f0f',
    fontFamily: "'Inter', system-ui, sans-serif",
  },

  // ── Sidebar ──
  sidebar: {
    width: '240px',
    flexShrink: 0,
    backgroundColor: '#0f0f0f',
    borderRight: '1px solid #2a2a2a',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    top: 0,
    left: 0,
    height: '100vh',
  },
  sidebarLogo: {
    padding: '24px',
    fontSize: '18px',
    fontWeight: '700',
    letterSpacing: '-0.02em',
  },
  logoWhite: { color: '#f5f5f5' },
  logoRed:   { color: '#e63946' },
  sidebarBottom: {
    padding: '20px 24px',
    borderTop: '1px solid #2a2a2a',
  },
  sidebarUser: {
    fontSize: '12px',
    color: '#666666',
    marginBottom: '8px',
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

  // ── Main content ──
  main: {
    marginLeft: '240px',
    flex: 1,
    backgroundColor: '#0f0f0f',
    padding: '32px',
    minHeight: '100vh',
  },
  centered: {
    display: 'flex',
    justifyContent: 'center',
    padding: '40px 0',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#f5f5f5',
    marginBottom: '16px',
  },
  muted: {
    fontSize: '14px',
    color: '#666666',
  },

  // ── Stats ──
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
    marginBottom: '32px',
  },
  statCard: {
    backgroundColor: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '8px',
    padding: '20px 24px',
  },
  statNum: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#f5f5f5',
    lineHeight: 1,
    marginBottom: '6px',
  },
  statLabel: {
    fontSize: '13px',
    color: '#666666',
  },

  // ── Table ──
  tableWrap: {
    border: '1px solid #2a2a2a',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
  },
  th: {
    textAlign: 'left',
    padding: '12px 16px',
    backgroundColor: '#0f0f0f',
    color: '#666666',
    fontSize: '11px',
    fontWeight: '600',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    borderBottom: '1px solid #2a2a2a',
  },
  tr: {
    borderBottom: '1px solid #2a2a2a',
    transition: 'background-color 0.1s',
  },
  td: {
    padding: '13px 16px',
    color: '#f5f5f5',
    backgroundColor: '#1a1a1a',
    verticalAlign: 'middle',
  },
  roleBadge: {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: '99px',
    fontSize: '11px',
    fontWeight: '600',
    letterSpacing: '0.03em',
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    color: '#666666',
    padding: '2px 0',
    transition: 'color 0.15s',
  },

  // ── Form ──
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '14px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  fieldLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#666666',
    letterSpacing: '0.07em',
    textTransform: 'uppercase',
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    fontSize: '14px',
    backgroundColor: '#0f0f0f',
    border: '1px solid #2a2a2a',
    borderRadius: '6px',
    color: '#f5f5f5',
    transition: 'border-color 0.15s',
    boxSizing: 'border-box',
  },
  submitBtn: {
    alignSelf: 'flex-start',
    padding: '10px 24px',
    fontSize: '14px',
    fontWeight: '600',
    backgroundColor: '#e63946',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    minHeight: '40px',
  },
  successText: {
    padding: '10px 14px',
    backgroundColor: '#22c55e15',
    border: '1px solid #22c55e40',
    borderRadius: '6px',
    color: '#22c55e',
    fontSize: '13px',
  },
  errorText: {
    padding: '10px 14px',
    backgroundColor: '#e6394615',
    border: '1px solid #e6394640',
    borderRadius: '6px',
    color: '#e63946',
    fontSize: '13px',
  },

  // ── Menu ──
  menuGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  menuCard: {
    padding: '14px 16px',
    backgroundColor: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '8px',
  },
  menuBadge: {
    display: 'inline-block',
    fontSize: '10px',
    fontWeight: '700',
    letterSpacing: '0.1em',
    padding: '3px 8px',
    borderRadius: '4px',
    marginBottom: '8px',
  },
  menuList: {
    paddingLeft: '16px',
    margin: 0,
  },
  menuItem: {
    fontSize: '14px',
    color: '#f5f5f5',
    marginBottom: '3px',
    lineHeight: '1.5',
  },
  menuMeta: {
    fontSize: '11px',
    color: '#444444',
    marginTop: '8px',
  },
};
