import { motion } from 'framer-motion';
import GlassPanel from '../GlassPanel.jsx';
import StatusBadge from '../StatusBadge.jsx';
import theme from '../../styles/theme.js';
import styles from './Timeline.module.css';

const categoryColors = {
  HR: { color: theme.colors.teal[500], bg: theme.colors.teal.glow },
  Security: { color: theme.colors.status.warning, bg: theme.colors.status.warningDim },
  IT: { color: theme.colors.status.info, bg: theme.colors.status.infoDim },
  Compliance: { color: theme.colors.status.success, bg: theme.colors.status.successDim },
};

const priorityColors = {
  critical: theme.colors.status.error,
  high: theme.colors.status.warning,
  medium: theme.colors.teal[500],
  low: theme.colors.text.tertiary,
};

const TimelineEntry = ({ entry, delay = 0 }) => {
  const catConfig = categoryColors[entry.category] || categoryColors.IT;

  return (
    <motion.div
      className={styles.entry}
      initial={{ opacity: 0, x: -40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <motion.div
        className={styles.dot}
        style={{ background: theme.colors.teal[500], boxShadow: `0 0 12px ${theme.colors.teal.glowStrong}` }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: delay + 0.1 }}
      />
      <GlassPanel
        hover
        style={{ padding: '16px 20px', flex: 1, marginLeft: '24px' }}
        whileHover={{ y: -2, boxShadow: theme.shadows.glow }}
      >
        <div className={styles.entryHeader}>
          <span className={styles.timestamp}>
            {new Date(entry.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <div className={styles.badges}>
            <span
              className={styles.categoryBadge}
              style={{ color: catConfig.color, background: catConfig.bg }}
            >
              {entry.category}
            </span>
            <span
              className={styles.priorityDot}
              style={{ background: priorityColors[entry.priority] || theme.colors.text.tertiary }}
            />
          </div>
        </div>
        <div className={styles.entryTitle}>{entry.title}</div>
        <div className={styles.entryDesc}>{entry.description}</div>
        <div className={styles.entryFooter}>
          <StatusBadge status={entry.status} />
        </div>
      </GlassPanel>
    </motion.div>
  );
};

export default TimelineEntry;
