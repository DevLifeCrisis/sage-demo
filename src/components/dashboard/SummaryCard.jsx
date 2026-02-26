import { motion } from 'framer-motion';
import GlassPanel from '../GlassPanel.jsx';
import AnimatedCounter from '../AnimatedCounter.jsx';
import theme from '../../styles/theme.js';
import styles from './SummaryCard.module.css';

const SummaryCard = ({ value, label, prefix, suffix, decimals = 0, trend, icon, children, delay = 0 }) => {
  const trendColor = trend > 0 ? theme.colors.status.success : trend < 0 ? theme.colors.status.error : theme.colors.text.tertiary;
  const trendArrow = trend > 0 ? '↑' : trend < 0 ? '↓' : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      style={{ height: '100%' }}
    >
      <GlassPanel style={{ padding: '24px', position: 'relative', overflow: 'hidden', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {icon && (
          <div className={styles.icon}>{icon}</div>
        )}
        <div className={styles.content}>
          {children || (
            <AnimatedCounter
              value={value}
              prefix={prefix}
              suffix={suffix}
              decimals={decimals}
              style={{ fontSize: '36px', color: theme.colors.text.primary, lineHeight: 1 }}
            />
          )}
          <div className={styles.label}>{label}</div>
          {trend !== undefined && trend !== null && (
            <div className={styles.trend} style={{ color: trendColor }}>
              <span>{trendArrow}</span>
              <span>{Math.abs(trend)}%</span>
            </div>
          )}
        </div>
      </GlassPanel>
    </motion.div>
  );
};

export default SummaryCard;
