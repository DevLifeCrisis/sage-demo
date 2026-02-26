import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import theme from '../styles/theme';

const glass = {
  background: theme.colors.glass.bg,
  backdropFilter: `blur(${theme.colors.glass.blur})`,
  border: `1px solid ${theme.colors.glass.border}`,
  borderRadius: theme.radius.lg,
  padding: '20px',
};

const MOCK_USERS = [
  { id: 1, name: 'Jonathan Harris', email: 'jonathan.harris@ecstech.com', role: 'Admin', status: 'Active', lastLogin: '2026-02-18', department: 'Engineering' },
  { id: 2, name: 'Sarah Chen', email: 'sarah.chen@ecstech.com', role: 'Manager', status: 'Active', lastLogin: '2026-02-17', department: 'HR' },
  { id: 3, name: 'Marcus Williams', email: 'marcus.williams@ecstech.com', role: 'Analyst', status: 'Active', lastLogin: '2026-02-18', department: 'IT' },
  { id: 4, name: 'Priya Patel', email: 'priya.patel@ecstech.com', role: 'Viewer', status: 'Active', lastLogin: '2026-02-16', department: 'Finance' },
  { id: 5, name: 'David Kim', email: 'david.kim@ecstech.com', role: 'Analyst', status: 'Invited', lastLogin: '—', department: 'Engineering' },
];

const ROLES = ['Admin', 'Manager', 'Analyst', 'Viewer'];
const roleColors = { Admin: '#B388FF', Manager: '#00E5FF', Analyst: '#00E676', Viewer: '#FFD600' };
const statusColors = { Active: '#00E676', Invited: '#FFD600', Disabled: '#FF5252' };

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

const inputStyle = {
  padding: '10px 14px', borderRadius: '8px',
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
  color: '#fff', fontSize: '14px', fontFamily: 'inherit', outline: 'none',
};

export default function UsersView() {
  const [users, setUsers] = useState(MOCK_USERS);
  const [search, setSearch] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [invite, setInvite] = useState({ name: '', email: '', role: 'Analyst', department: '' });

  const filtered = users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));

  const handleInvite = (e) => {
    e.preventDefault();
    const newUser = { ...invite, id: Date.now(), status: 'Invited', lastLogin: '—' };
    setUsers(prev => [...prev, newUser]);
    setInvite({ name: '', email: '', role: 'Analyst', department: '' });
    setShowInvite(false);
  };

  const toggleStatus = (id) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: u.status === 'Active' ? 'Disabled' : 'Active' } : u));
  };

  const summary = [
    { label: 'Total Users', value: users.length, icon: '👥' },
    { label: 'Active', value: users.filter(u => u.status === 'Active').length, icon: '✅' },
    { label: 'Pending Invites', value: users.filter(u => u.status === 'Invited').length, icon: '📩' },
    { label: 'Admins', value: users.filter(u => u.role === 'Admin').length, icon: '🔑' },
  ];

  return (
    <motion.div style={{ maxWidth: 1000, margin: '0 auto' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', margin: 0 }}>User Management</h1>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: '4px 0 0' }}>Manage your team's access and roles</p>
        </div>
        <button
          onClick={() => setShowInvite(!showInvite)}
          style={{
            padding: '10px 24px', borderRadius: '8px', border: 'none',
            background: 'rgba(0,229,255,0.2)', color: '#00E5FF', fontSize: '13px',
            fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          + Invite User
        </button>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {summary.map((s, i) => (
          <motion.div key={s.label} style={glass} {...fadeUp} transition={{ delay: i * 0.05 }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>{s.icon}</div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#fff', fontFamily: "'JetBrains Mono', monospace" }}>{s.value}</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Invite Form */}
      <AnimatePresence>
        {showInvite && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden', marginBottom: '20px' }}
          >
            <form onSubmit={handleInvite} style={{ ...glass, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '12px', alignItems: 'end' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '4px' }}>Name</label>
                <input style={{ ...inputStyle, width: '100%' }} value={invite.name} onChange={e => setInvite(p => ({ ...p, name: e.target.value }))} required placeholder="Jane Doe" />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '4px' }}>Email</label>
                <input style={{ ...inputStyle, width: '100%' }} type="email" value={invite.email} onChange={e => setInvite(p => ({ ...p, email: e.target.value }))} required placeholder="jane@company.com" />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '4px' }}>Role</label>
                <select style={{ ...inputStyle, width: '100%', cursor: 'pointer', appearance: 'none' }} value={invite.role} onChange={e => setInvite(p => ({ ...p, role: e.target.value }))}>
                  {ROLES.map(r => <option key={r} value={r} style={{ background: '#1a1a25' }}>{r}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '4px' }}>Department</label>
                <input style={{ ...inputStyle, width: '100%' }} value={invite.department} onChange={e => setInvite(p => ({ ...p, department: e.target.value }))} placeholder="Engineering" />
              </div>
              <button type="submit" style={{
                padding: '10px 20px', borderRadius: '8px', border: 'none',
                background: 'rgba(0,229,255,0.2)', color: '#00E5FF', fontSize: '13px',
                fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
              }}>
                Send Invite
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      <input
        style={{ ...inputStyle, width: '100%', marginBottom: '20px' }}
        placeholder="Search users..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {/* Table */}
      <motion.div style={{ ...glass, padding: 0, overflow: 'hidden' }} {...fadeUp} transition={{ delay: 0.15 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {['Name', 'Email', 'Role', 'Department', 'Status', 'Last Login', 'Actions'].map(h => (
                <th key={h} style={{ padding: '14px 16px', textAlign: 'left', color: 'rgba(255,255,255,0.4)', fontWeight: 500, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '14px 16px', color: '#fff', fontWeight: 500 }}>{u.name}</td>
                <td style={{ padding: '14px 16px', color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>{u.email}</td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, background: `${roleColors[u.role]}18`, color: roleColors[u.role] }}>{u.role}</span>
                </td>
                <td style={{ padding: '14px 16px', color: 'rgba(255,255,255,0.5)' }}>{u.department}</td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: statusColors[u.status], marginRight: '8px' }} />
                  {u.status}
                </td>
                <td style={{ padding: '14px 16px', color: 'rgba(255,255,255,0.5)', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px' }}>{u.lastLogin}</td>
                <td style={{ padding: '14px 16px' }}>
                  <button
                    onClick={() => toggleStatus(u.id)}
                    style={{
                      padding: '5px 14px', borderRadius: '6px', border: 'none', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                      background: u.status === 'Active' ? 'rgba(255,82,82,0.15)' : 'rgba(0,230,118,0.15)',
                      color: u.status === 'Active' ? '#FF5252' : '#00E676',
                    }}
                  >
                    {u.status === 'Active' ? 'Disable' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </motion.div>
  );
}
