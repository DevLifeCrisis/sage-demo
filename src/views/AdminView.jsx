import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './AdminView.module.css';

const MOCK_COMPANIES = [
  { id: 1, name: 'Meridian Healthcare', plan: 'Enterprise', users: 48, status: 'Active', created: '2025-08-12', snInstances: 3, llmProvider: 'OpenAI', ticketsResolved: 12450, avgResponseTime: '1.2s', mrr: 2499 },
  { id: 2, name: 'TechVault Solutions', plan: 'Pro', users: 22, status: 'Active', created: '2025-09-03', snInstances: 1, llmProvider: 'Anthropic Claude', ticketsResolved: 5820, avgResponseTime: '1.8s', mrr: 799 },
  { id: 3, name: 'Pinnacle Financial', plan: 'Enterprise', users: 65, status: 'Active', created: '2025-07-21', snInstances: 4, llmProvider: 'Google Gemini', ticketsResolved: 18900, avgResponseTime: '0.9s', mrr: 2499 },
  { id: 4, name: 'CloudBridge Inc', plan: 'Starter', users: 8, status: 'Trial', created: '2026-01-15', snInstances: 1, llmProvider: 'OpenAI', ticketsResolved: 340, avgResponseTime: '2.1s', mrr: 0 },
  { id: 5, name: 'Nova Logistics', plan: 'Pro', users: 15, status: 'Suspended', created: '2025-10-28', snInstances: 2, llmProvider: 'ServiceNow NowAssist', ticketsResolved: 3100, avgResponseTime: '1.5s', mrr: 0 },
];

const PLAN_COLORS = { Starter: '#FFD600', Pro: '#00E5FF', Enterprise: '#B388FF' };
const STATUS_COLORS = { Active: '#00E676', Trial: '#FFD600', Suspended: '#FF5252' };

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

export default function AdminView() {
  const [companies, setCompanies] = useState(MOCK_COMPANIES);
  const [search, setSearch] = useState('');
  const [filterPlan, setFilterPlan] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [expandedId, setExpandedId] = useState(null);

  const filtered = useMemo(() => {
    return companies.filter((c) => {
      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterPlan !== 'All' && c.plan !== filterPlan) return false;
      if (filterStatus !== 'All' && c.status !== filterStatus) return false;
      return true;
    });
  }, [companies, search, filterPlan, filterStatus]);

  const stats = useMemo(() => ({
    totalCompanies: companies.length,
    activeUsers: companies.reduce((s, c) => s + c.users, 0),
    activeSubs: companies.filter((c) => c.status === 'Active').length,
    mrr: companies.reduce((s, c) => s + c.mrr, 0),
  }), [companies]);

  const toggleStatus = (id) => {
    setCompanies((cs) => cs.map((c) =>
      c.id === id ? { ...c, status: c.status === 'Active' ? 'Suspended' : 'Active', mrr: c.status === 'Active' ? 0 : (c.plan === 'Enterprise' ? 2499 : c.plan === 'Pro' ? 799 : 199) } : c
    ));
  };

  const summaryCards = [
    { label: 'Total Companies', value: stats.totalCompanies, icon: '🏢' },
    { label: 'Active Users', value: stats.activeUsers, icon: '👥' },
    { label: 'Active Subscriptions', value: stats.activeSubs, icon: '✅' },
    { label: 'MRR', value: `$${stats.mrr.toLocaleString()}`, icon: '💰' },
  ];

  return (
    <div className={styles.container}>
      <motion.h1 className={styles.pageTitle} {...fadeUp}>Admin Dashboard</motion.h1>

      {/* Summary Cards */}
      <div className={styles.cardGrid}>
        {summaryCards.map((card, i) => (
          <motion.div key={card.label} className={styles.summaryCard} {...fadeUp} transition={{ delay: i * 0.05 }}>
            <span className={styles.cardIcon}>{card.icon}</span>
            <div>
              <div className={styles.cardValue}>{card.value}</div>
              <div className={styles.cardLabel}>{card.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <motion.div className={styles.filterBar} {...fadeUp} transition={{ delay: 0.2 }}>
        <input className={styles.searchInput} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search companies…" />
        <select className={styles.filterSelect} value={filterPlan} onChange={(e) => setFilterPlan(e.target.value)}>
          <option value="All">All Plans</option>
          <option>Starter</option>
          <option>Pro</option>
          <option>Enterprise</option>
        </select>
        <select className={styles.filterSelect} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="All">All Status</option>
          <option>Active</option>
          <option>Trial</option>
          <option>Suspended</option>
        </select>
      </motion.div>

      {/* Table */}
      <motion.div className={styles.tableWrap} {...fadeUp} transition={{ delay: 0.25 }}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Company</th>
              <th>Plan</th>
              <th>Users</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <>
                <tr key={c.id} className={styles.row} onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}>
                  <td className={styles.companyName}>{c.name}</td>
                  <td><span className={styles.badge} style={{ background: `${PLAN_COLORS[c.plan]}22`, color: PLAN_COLORS[c.plan] }}>{c.plan}</span></td>
                  <td>{c.users}</td>
                  <td><span className={styles.statusDot} style={{ background: STATUS_COLORS[c.status] }} />{c.status}</td>
                  <td className={styles.date}>{c.created}</td>
                  <td>
                    <button
                      className={c.status === 'Active' ? styles.btnDanger : styles.btnSuccess}
                      onClick={(e) => { e.stopPropagation(); toggleStatus(c.id); }}
                    >
                      {c.status === 'Active' ? 'Suspend' : 'Activate'}
                    </button>
                  </td>
                </tr>
                <AnimatePresence>
                  {expandedId === c.id && (
                    <tr key={`${c.id}-detail`}>
                      <td colSpan={6} className={styles.detailCell}>
                        <motion.div
                          className={styles.detailPanel}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                        >
                          <div className={styles.detailGrid}>
                            <div className={styles.detailItem}><span className={styles.detailLabel}>Plan</span><span className={styles.detailValue}>{c.plan}</span></div>
                            <div className={styles.detailItem}><span className={styles.detailLabel}>Users</span><span className={styles.detailValue}>{c.users}</span></div>
                            <div className={styles.detailItem}><span className={styles.detailLabel}>SN Instances</span><span className={styles.detailValue}>{c.snInstances}</span></div>
                            <div className={styles.detailItem}><span className={styles.detailLabel}>LLM Provider</span><span className={styles.detailValue}>{c.llmProvider}</span></div>
                            <div className={styles.detailItem}><span className={styles.detailLabel}>Tickets Resolved</span><span className={styles.detailValue}>{c.ticketsResolved.toLocaleString()}</span></div>
                            <div className={styles.detailItem}><span className={styles.detailLabel}>Avg Response</span><span className={styles.detailValue}>{c.avgResponseTime}</span></div>
                            <div className={styles.detailItem}><span className={styles.detailLabel}>MRR</span><span className={styles.detailValue}>${c.mrr.toLocaleString()}</span></div>
                          </div>
                        </motion.div>
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className={styles.empty}>No companies match your filters.</div>}
      </motion.div>
    </div>
  );
}
