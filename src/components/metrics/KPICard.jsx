import { motion } from 'framer-motion';
import GlassPanel from '../GlassPanel.jsx';
import AnimatedCounter from '../AnimatedCounter.jsx';
import theme from '../../styles/theme.js';
import styles from './Metrics.module.css';

const KPICard = ({ value, label, suffix = '', decimals = 0, trend, trendInverse = false, icon, delay = 0 }) => {
  const isPositive = trendInverse ? trend < 0 : trend > 0;
  const trendColor = trend === 0 || trend === undefined ? theme.colors.text.tertiary : isPositive ? theme.colors.status.success : theme.colors.status.error;
  const trendArrow = trend > 0 ? '↑' : trend < 0 ? '↓' : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <GlassPanel style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
        {icon && <div className={styles.kpiIcon}>{icon}</div>}
        <AnimatedCounter
          value={value}
          suffix={suffix}
          decimals={decimals}
          style={{ fontSize: '36px', color: theme.colors.text.primary, lineHeight: 1, display: 'block' }}
        />
        <div className={styles.kpiLabel}>{label}</div>
        {trend !== undefined && (
          <div className={styles.kpiTrend} style={{ color: trendColor }}>
            {trendArrow} {Math.abs(trend)}%
          </div>
        )}
      </GlassPanel>
    </motion.div>
  );
};

export default KPICard;
