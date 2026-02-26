import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { fetchMetricsData } from '../services/api.js';
import KPICard from '../components/metrics/KPICard.jsx';
import BarChart from '../components/metrics/BarChart.jsx';
import LineChart from '../components/metrics/LineChart.jsx';
import styles from './MetricsView.module.css';

const MetricsView = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchMetricsData().then(d => { if (!cancelled) setData(d); });
    return () => { cancelled = true; };
  }, []);

  if (!data) return null;

  const { metrics, charts } = data;

  return (
    <motion.div
      className={styles.container}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className={styles.header}>
        <h1 className={styles.title}>Performance Metrics</h1>
        <p className={styles.subtitle}>AI agent analytics and insights</p>
      </div>

      <div className={styles.kpiRow}>
        <KPICard
          value={metrics.deflectionRate}
          suffix="%"
          label="Deflection Rate"
          trend={metrics.deflectionRateTrend}
          icon="🎯"
          delay={0.1}
        />
        <KPICard
          value={metrics.avgResolutionTime}
          suffix=" min"
          decimals={1}
          label="Avg Resolution Time"
          trend={metrics.avgResolutionTimeTrend}
          trendInverse
          icon="⏱️"
          delay={0.2}
        />
        <KPICard
          value={metrics.totalConversations}
          label="Total Conversations"
          trend={metrics.totalConversationsTrend}
          icon="💬"
          delay={0.3}
        />
        <KPICard
          value={metrics.complianceScore}
          suffix="%"
          decimals={1}
          label="Compliance Score"
          trend={metrics.complianceScoreTrend}
          icon="🛡️"
          delay={0.4}
        />
      </div>

      <div className={styles.chartRow}>
        <div className={styles.chartCell}>
          <BarChart data={charts.barChart} title="Conversations by Intent" />
        </div>
        <div className={styles.chartCell}>
          <LineChart data={charts.lineChart} title="Deflection Rate Trend" />
        </div>
      </div>
    </motion.div>
  );
};

export default MetricsView;
