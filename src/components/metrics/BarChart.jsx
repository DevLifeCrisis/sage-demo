import { motion } from 'framer-motion';
import GlassPanel from '../GlassPanel.jsx';
import theme from '../../styles/theme.js';
import styles from './Metrics.module.css';

const BarChart = ({ data = [], title = '' }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  const chartHeight = 220;
  const barWidth = 48;
  const gap = 32;

  return (
    <GlassPanel hover={false} style={{ padding: '24px' }}>
      <div className={styles.chartTitle}>{title}</div>
      <div className={styles.barChartContainer} style={{ height: chartHeight + 40 }}>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75, 1].map((pct) => (
          <div
            key={pct}
            className={styles.gridLine}
            style={{ bottom: `${pct * chartHeight + 30}px` }}
          />
        ))}

        <div className={styles.barGroup}>
          {data.map((item, i) => {
            const barHeight = (item.value / maxValue) * chartHeight;
            return (
              <div key={item.label} className={styles.barItem} style={{ width: barWidth }}>
                <motion.div className={styles.barValue}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 + i * 0.15 }}
                >
                  {item.value}
                </motion.div>
                <motion.div
                  className={styles.bar}
                  style={{ width: barWidth }}
                  initial={{ height: 0 }}
                  animate={{ height: barHeight }}
                  transition={{ duration: 0.8, delay: 0.2 + i * 0.15, ease: 'easeOut' }}
                />
                <div className={styles.barLabel}>{item.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </GlassPanel>
  );
};

export default BarChart;
