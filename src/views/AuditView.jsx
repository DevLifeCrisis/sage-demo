import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchAuditData } from '../services/api.js';
import GlassPanel from '../components/GlassPanel.jsx';
import ProgressRing from '../components/dashboard/ProgressRing.jsx';
import AnimatedCounter from '../components/AnimatedCounter.jsx';
import Timeline from '../components/audit/Timeline.jsx';
import theme from '../styles/theme.js';
import styles from './AuditView.module.css';

const TABS = [
  { key: 'audit', label: 'Audit Trail', icon: '📋' },
  { key: 'it', label: 'IT Operations', icon: '💻' },
  { key: 'hr', label: 'HR Onboarding', icon: '👤' },
  { key: 'offboard', label: 'Offboarding', icon: '🚪' },
];

const auditCategories = ['All', 'HR', 'Security', 'IT', 'Compliance'];

// --- Mock data for new tabs ---
const IT_TICKETS = [
  { id: 'INC-00234', title: 'VPN connectivity issue — East region', assignee: 'Mike Chen', status: 'In Progress', priority: 'High', device: 'Cisco ASA 5525-X', updated: '12 min ago' },
  { id: 'REQ-00891', title: 'Laptop provisioning — Jennifer Rodriguez', assignee: 'IT Provisioning', status: 'Open', priority: 'Medium', device: 'Dell Latitude 5540', updated: '25 min ago' },
  { id: 'INC-00231', title: 'Email sync failure — Outlook desktop', assignee: 'Sarah Kim', status: 'Resolved', priority: 'Medium', device: 'Exchange Server', updated: '1 hr ago' },
  { id: 'CHG-00089', title: 'Firewall rule update — DMZ segment', assignee: 'Network Ops', status: 'Pending Approval', priority: 'High', device: 'Palo Alto PA-850', updated: '2 hr ago' },
  { id: 'REQ-00887', title: 'Monitor replacement — Finance dept', assignee: 'IT Provisioning', status: 'Fulfilled', priority: 'Low', device: 'Dell U2723QE', updated: '3 hr ago' },
  { id: 'INC-00228', title: 'Badge reader malfunction — Building C', assignee: 'Facilities IT', status: 'In Progress', priority: 'Medium', device: 'HID iCLASS SE', updated: '4 hr ago' },
];

const HR_ONBOARDING = [
  { id: 'HR-00142', name: 'Jennifer Rodriguez', role: 'Software Engineer', dept: 'Engineering', startDate: 'Feb 24, 2026', status: 'In Progress', progress: 60, tasks: { total: 5, done: 3 } },
  { id: 'HR-00139', name: 'David Park', role: 'Security Analyst', dept: 'Cybersecurity', startDate: 'Feb 20, 2026', status: 'In Progress', progress: 80, tasks: { total: 5, done: 4 } },
  { id: 'HR-00136', name: 'Maria Santos', role: 'Project Manager', dept: 'PMO', startDate: 'Feb 17, 2026', status: 'Completed', progress: 100, tasks: { total: 5, done: 5 } },
  { id: 'HR-00134', name: 'Alex Thompson', role: 'Data Engineer', dept: 'Analytics', startDate: 'Mar 3, 2026', status: 'Not Started', progress: 0, tasks: { total: 5, done: 0 } },
];

const OFFBOARDING = [
  { id: 'OFF-00067', name: 'Robert Kim', role: 'Contractor — DevOps', dept: 'Infrastructure', endDate: 'Feb 21, 2026', status: 'In Progress', progress: 40, tasks: [
    { label: 'Access revocation', done: true },
    { label: 'Equipment return', done: false },
    { label: 'Knowledge transfer', done: true },
    { label: 'Final badge deactivation', done: false },
    { label: 'Exit interview', done: false },
  ]},
  { id: 'OFF-00065', name: 'Lisa Wang', role: 'UX Designer', dept: 'Product', endDate: 'Feb 18, 2026', status: 'Completed', progress: 100, tasks: [
    { label: 'Access revocation', done: true },
    { label: 'Equipment return', done: true },
    { label: 'Knowledge transfer', done: true },
    { label: 'Final badge deactivation', done: true },
    { label: 'Exit interview', done: true },
  ]},
  { id: 'OFF-00063', name: 'James Mitchell', role: 'Contractor — Network Eng', dept: 'Infrastructure', endDate: 'Feb 28, 2026', status: 'Pending', progress: 0, tasks: [
    { label: 'Access revocation', done: false },
    { label: 'Equipment return', done: false },
    { label: 'Knowledge transfer', done: false },
    { label: 'Final badge deactivation', done: false },
    { label: 'Exit interview', done: false },
  ]},
];

const statusColor = (s) => {
  const map = {
    'In Progress': { bg: 'rgba(0,229,255,0.12)', color: '#00E5FF' },
    'Open': { bg: 'rgba(255,171,0,0.12)', color: '#FFAB00' },
    'Resolved': { bg: 'rgba(0,230,118,0.12)', color: '#00E676' },
    'Fulfilled': { bg: 'rgba(0,230,118,0.12)', color: '#00E676' },
    'Completed': { bg: 'rgba(0,230,118,0.12)', color: '#00E676' },
    'Pending Approval': { bg: 'rgba(255,171,0,0.12)', color: '#FFAB00' },
    'Pending': { bg: 'rgba(255,171,0,0.12)', color: '#FFAB00' },
    'Not Started': { bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' },
    'High': { bg: 'rgba(255,82,82,0.12)', color: '#FF5252' },
    'Medium': { bg: 'rgba(255,171,0,0.12)', color: '#FFAB00' },
    'Low': { bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' },
  };
  return map[s] || { bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' };
};

function StatusBadge({ status }) {
  const c = statusColor(status);
  return (
    <span style={{ display: 'inline-block', fontSize: '11px', padding: '3px 10px', borderRadius: '10px', fontWeight: 600, letterSpacing: '0.3px', background: c.bg, color: c.color }}>
      {status}
    </span>
  );
}

function ProgressBar({ value }) {
  return (
    <div style={{ width: '100%', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.06)' }}>
      <div style={{ width: `${value}%`, height: '100%', borderRadius: '2px', background: value === 100 ? '#00E676' : '#00E5FF', transition: 'width 0.6s ease' }} />
    </div>
  );
}

// ===== Tab: Audit Trail =====
function AuditTab({ data }) {
  const [filter, setFilter] = useState('All');
  const { auditTrail, completionStatus } = data;
  const filtered = filter === 'All' ? auditTrail : auditTrail.filter(e => e.category === filter);

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <GlassPanel hover={false} style={{ padding: '24px', marginBottom: '24px' }}>
          <div className={styles.completionRow}>
            <ProgressRing percentage={completionStatus.completionPercentage} size={80} />
            <div className={styles.completionInfo}>
              <div className={styles.completionTitle}>
                {completionStatus.completionPercentage === 100
                  ? 'All compliance actions completed'
                  : `${completionStatus.completedActions} of ${completionStatus.totalActions} actions completed`}
              </div>
              <div className={styles.completionMeta}>
                Total duration:{' '}
                <AnimatedCounter value={completionStatus.totalDurationMinutes} suffix=" min" decimals={1} style={{ fontSize: '14px', color: theme.colors.teal }} />
              </div>
            </div>
          </div>
        </GlassPanel>
      </motion.div>

      <div className={styles.filterBar}>
        {auditCategories.map((cat) => (
          <motion.button key={cat} className={`${styles.filterBtn} ${filter === cat ? styles.filterBtnActive : ''}`} onClick={() => setFilter(cat)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            {cat}
          </motion.button>
        ))}
      </div>

      <Timeline entries={filtered} />
    </>
  );
}

// ===== Tab: IT Operations =====
function ITTab() {
  const summary = {
    open: IT_TICKETS.filter(t => ['Open', 'In Progress'].includes(t.status)).length,
    pending: IT_TICKETS.filter(t => t.status === 'Pending Approval').length,
    resolved: IT_TICKETS.filter(t => ['Resolved', 'Fulfilled'].includes(t.status)).length,
  };

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Active Tickets', value: summary.open, color: '#00E5FF' },
          { label: 'Pending Approval', value: summary.pending, color: '#FFAB00' },
          { label: 'Resolved Today', value: summary.resolved, color: '#00E676' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <GlassPanel hover={false} style={{ padding: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 700, color: s.color, marginBottom: '4px' }}>{s.value}</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>{s.label}</div>
            </GlassPanel>
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {IT_TICKETS.map((t, i) => (
          <motion.div key={t.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
            <GlassPanel hover style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", color: '#00E5FF' }}>{t.id}</span>
                    <StatusBadge status={t.status} />
                    <StatusBadge status={t.priority} />
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>{t.title}</div>
                </div>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap' }}>{t.updated}</span>
              </div>
              <div style={{ display: 'flex', gap: '24px', fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>
                <span>👤 {t.assignee}</span>
                <span>🖥️ {t.device}</span>
              </div>
            </GlassPanel>
          </motion.div>
        ))}
      </div>
    </>
  );
}

// ===== Tab: HR Onboarding =====
function HRTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {HR_ONBOARDING.map((emp, i) => (
        <motion.div key={emp.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
          <GlassPanel hover style={{ padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", color: '#00E5FF' }}>{emp.id}</span>
                  <StatusBadge status={emp.status} />
                </div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: '#fff', marginBottom: '2px' }}>{emp.name}</div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>{emp.role} · {emp.dept}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginBottom: '2px' }}>Start Date</div>
                <div style={{ fontSize: '13px', color: '#fff', fontWeight: 500 }}>{emp.startDate}</div>
              </div>
            </div>

            <div style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px' }}>
                <span>Onboarding Progress</span>
                <span>{emp.tasks.done}/{emp.tasks.total} tasks</span>
              </div>
              <ProgressBar value={emp.progress} />
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
              {['AD Account', 'Equipment', 'Orientation', 'Badge', 'Training'].map((task, j) => {
                const done = j < emp.tasks.done;
                return (
                  <span key={task} style={{
                    fontSize: '11px', padding: '3px 10px', borderRadius: '6px',
                    background: done ? 'rgba(0,230,118,0.1)' : 'rgba(255,255,255,0.04)',
                    color: done ? '#00E676' : 'rgba(255,255,255,0.3)',
                    border: `1px solid ${done ? 'rgba(0,230,118,0.2)' : 'rgba(255,255,255,0.06)'}`,
                  }}>
                    {done ? '✓ ' : ''}{task}
                  </span>
                );
              })}
            </div>
          </GlassPanel>
        </motion.div>
      ))}
    </div>
  );
}

// ===== Tab: Offboarding =====
function OffboardTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {OFFBOARDING.map((emp, i) => (
        <motion.div key={emp.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
          <GlassPanel hover style={{ padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", color: '#00E5FF' }}>{emp.id}</span>
                  <StatusBadge status={emp.status} />
                </div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: '#fff', marginBottom: '2px' }}>{emp.name}</div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>{emp.role} · {emp.dept}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginBottom: '2px' }}>End Date</div>
                <div style={{ fontSize: '13px', color: '#fff', fontWeight: 500 }}>{emp.endDate}</div>
              </div>
            </div>

            <div style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px' }}>
                <span>Offboarding Progress</span>
                <span>{emp.tasks.filter(t => t.done).length}/{emp.tasks.length} tasks</span>
              </div>
              <ProgressBar value={emp.progress} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '12px' }}>
              {emp.tasks.map((task) => (
                <div key={task.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                  <span style={{ color: task.done ? '#00E676' : 'rgba(255,255,255,0.2)', fontSize: '14px' }}>
                    {task.done ? '✓' : '○'}
                  </span>
                  <span style={{ color: task.done ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.4)' }}>
                    {task.label}
                  </span>
                </div>
              ))}
            </div>
          </GlassPanel>
        </motion.div>
      ))}
    </div>
  );
}

// ===== Main View =====
const AuditView = () => {
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('audit');

  useEffect(() => {
    let cancelled = false;
    fetchAuditData().then(d => { if (!cancelled) setData(d); });
    return () => { cancelled = true; };
  }, []);

  if (!data) return null;

  return (
    <motion.div className={styles.container} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <div className={styles.header}>
        <h1 className={styles.title}>Operations & Compliance</h1>
        <p className={styles.subtitle}>Track IT operations, onboarding, offboarding, and audit compliance</p>
      </div>

      {/* Tabs */}
      <div className={styles.tabBar}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`${styles.tabBtn} ${activeTab === tab.key ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <span style={{ fontSize: '16px' }}>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>
          {activeTab === 'audit' && <AuditTab data={data} />}
          {activeTab === 'it' && <ITTab />}
          {activeTab === 'hr' && <HRTab />}
          {activeTab === 'offboard' && <OffboardTab />}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

export default AuditView;
