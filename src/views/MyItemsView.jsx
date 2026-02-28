import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getMyItems } from '../services/api.js';
import SummaryCard from '../components/dashboard/SummaryCard.jsx';
import GlassPanel from '../components/GlassPanel.jsx';
import theme from '../styles/theme.js';
import styles from './MyItemsView.module.css';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'incident', label: 'Incidents' },
  { key: 'sc_request', label: 'Requests' },
  { key: 'sn_hr_core_case', label: 'HR Cases' },
];

const TYPE_META = {
  incident: { icon: '🔥', label: 'Incident', iconClass: styles.cardIconIncident },
  sc_request: { icon: '📝', label: 'Request', iconClass: styles.cardIconRequest },
  sn_hr_core_case: { icon: '💼', label: 'HR Case', iconClass: styles.cardIconCase },
};

function getStateBadge(state) {
  const s = (state || '').toLowerCase();
  if (['new', 'open', 'active', '1', '2'].includes(s)) return { label: s || 'Open', cls: styles.badgeOpen };
  if (['in progress', 'work in progress', '3'].includes(s)) return { label: 'In Progress', cls: styles.badgeInProgress };
  if (['resolved', '6'].includes(s)) return { label: 'Resolved', cls: styles.badgeResolved };
  if (['closed', 'complete', 'completed', '7', '4'].includes(s)) return { label: 'Closed', cls: styles.badgeClosed };
  return { label: state || 'Unknown', cls: styles.badgeOpen };
}

function priorityLabel(p) {
  const map = { '1': 'Critical', '2': 'High', '3': 'Medium', '4': 'Low', '5': 'Planning' };
  return map[p] || p || '';
}

function formatDate(d) {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return d; }
}

const MyItemsView = () => {
  const [items, setItems] = useState(null);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getMyItems()
      .then(data => { if (!cancelled) setItems(data.items || []); })
      .catch(err => { if (!cancelled) { setError(err.message); setItems([]); } });
    return () => { cancelled = true; };
  }, []);

  if (items === null && !error) {
    return <div className={styles.loading}>Loading your items…</div>;
  }

  const allItems = items || [];
  const filtered = filter === 'all' ? allItems : allItems.filter(it => it.table === filter);

  const openStates = ['new', 'open', 'active', 'in progress', 'work in progress', '1', '2', '3'];
  const resolvedStates = ['resolved', 'closed', 'complete', 'completed', '6', '7', '4'];
  const openCount = allItems.filter(it => openStates.includes((it.state || '').toLowerCase())).length;
  const resolvedCount = allItems.filter(it => resolvedStates.includes((it.state || '').toLowerCase())).length;
  const typeCounts = {};
  allItems.forEach(it => { typeCounts[it.table] = (typeCounts[it.table] || 0) + 1; });
  const typeStr = Object.entries(typeCounts).map(([k, v]) => `${(TYPE_META[k]?.label || k)}: ${v}`).join(' · ');

  return (
    <motion.div
      className={styles.container}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className={styles.header}>
        <h1 className={styles.title}>📋 My Items</h1>
        <p className={styles.subtitle}>Your incidents, requests, and HR cases</p>
      </div>

      <div className={styles.summaryRow}>
        <SummaryCard value={allItems.length} label="Total Items" icon="📊" delay={0.1} />
        <SummaryCard value={openCount} label="Open" icon="⚡" delay={0.2} />
        <SummaryCard value={resolvedCount} label="Resolved" icon="✅" delay={0.3} />
        <SummaryCard value={0} label={typeStr || 'No items'} icon="📂" delay={0.4} />
      </div>

      <div className={styles.filterBar}>
        {FILTERS.map(f => (
          <button
            key={f.key}
            className={`${styles.filterBtn} ${filter === f.key ? styles.filterBtnActive : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
            {f.key !== 'all' && typeCounts[f.key] !== undefined ? ` (${typeCounts[f.key]})` : ''}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📭</div>
          <h3 className={styles.emptyTitle}>No items found</h3>
          <p className={styles.emptyText}>
            {filter === 'all'
              ? "You don't have any open incidents, requests, or HR cases."
              : `No ${FILTERS.find(f => f.key === filter)?.label?.toLowerCase() || 'items'} found.`}
          </p>
        </div>
      ) : (
        <div className={styles.grid}>
          {filtered.map((item, i) => {
            const meta = TYPE_META[item.table] || { icon: '📄', label: item.table, iconClass: '' };
            const badge = getStateBadge(item.state);
            return (
              <motion.div
                key={item.sys_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 + i * 0.05 }}
              >
                <GlassPanel>
                  <div className={styles.card}>
                    <div className={styles.cardHeader}>
                      <div className={`${styles.cardIcon} ${meta.iconClass}`}>{meta.icon}</div>
                      <div>
                        <div className={styles.cardNumber}>{item.number}</div>
                        <div className={styles.cardType}>{meta.label}</div>
                      </div>
                    </div>
                    <p className={styles.cardDesc}>{item.short_description || 'No description'}</p>
                    <div className={styles.cardFooter}>
                      <span className={`${styles.badge} ${badge.cls}`}>{badge.label}</span>
                      {item.priority && (
                        <span className={styles.priority}>Priority: {priorityLabel(item.priority)}</span>
                      )}
                      <span className={styles.timestamps}>
                        Updated {formatDate(item.updated_on)}
                      </span>
                    </div>
                  </div>
                </GlassPanel>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default MyItemsView;
