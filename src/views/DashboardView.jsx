import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { fetchDashboardData } from '../services/api.js';
import SummaryCard from '../components/dashboard/SummaryCard.jsx';
import ProgressRing from '../components/dashboard/ProgressRing.jsx';
import OrchestrationCard from '../components/dashboard/OrchestrationCard.jsx';
import theme from '../styles/theme.js';
import styles from './DashboardView.module.css';

const DashboardView = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchDashboardData().then(d => { if (!cancelled) setData(d); });
    return () => { cancelled = true; };
  }, []);

  if (!data) return null;

  const { summary, orchestrationCards } = data;

  return (
    <motion.div
      className={styles.container}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className={styles.header}>
        <h1 className={styles.title}>Orchestration Dashboard</h1>
        <p className={styles.subtitle}>Real-time process tracking</p>
      </div>

      <div className={styles.summaryRow}>
        <SummaryCard
          value={summary.totalItems}
          label="Total Items"
          icon="📊"
          delay={0.1}
        />
        <SummaryCard
          value={summary.activeItems}
          label="Active Processes"
          icon="⚡"
          trend={null}
          delay={0.2}
        />
        <SummaryCard
          label="Completion Rate"
          icon="🎯"
          delay={0.3}
        >
          <ProgressRing percentage={summary.completionPercentage} size={72} />
        </SummaryCard>
        <SummaryCard
          value={summary.avgProcessingTime}
          suffix=" min"
          decimals={1}
          label="Avg Processing Time"
          icon="⏱️"
          trend={summary.avgProcessingTimeTrend}
          delay={0.4}
        />
      </div>

      <div className={styles.grid}>
        {orchestrationCards.map((card, i) => (
          <OrchestrationCard key={card.id} card={card} delay={0.3 + i * 0.1} />
        ))}
      </div>
    </motion.div>
  );
};

export default DashboardView;
