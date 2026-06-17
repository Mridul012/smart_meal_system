// options: string[] or { label, value }[] — used on Login, StudentDashboard, AdminPanel
export default function SegmentedControl({ options, value, onChange, fullWidth = false }) {
  return (
    <div style={{ ...s.container, ...(fullWidth ? s.containerFull : {}) }}>
      {options.map((opt) => {
        const label  = typeof opt === 'object' ? opt.label : opt;
        const optVal = typeof opt === 'object' ? opt.value : opt;
        const active = optVal === value;

        return (
          <button
            key={String(optVal)}
            type="button"
            onClick={() => onChange(optVal)}
            className={active ? '' : 'seg-inactive'}
            style={{
              ...s.tab,
              ...(fullWidth ? s.tabFull   : {}),
              ...(active    ? s.tabActive : s.tabInactive),
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

const s = {
  container: {
    display: 'flex',
    backgroundColor: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '8px',
    padding: '4px',
    gap: '2px',
    width: 'fit-content',
  },
  containerFull: { width: '100%' },
  tab: {
    padding: '10px 24px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    textAlign: 'center',
    border: 'none',
    borderRadius: '6px',
    transition: 'all 0.15s ease',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
  },
  tabFull:    { flex: 1 },
  tabActive:  { backgroundColor: '#e63946', color: '#ffffff' },
  tabInactive: { backgroundColor: 'transparent', color: '#666666' },
};
