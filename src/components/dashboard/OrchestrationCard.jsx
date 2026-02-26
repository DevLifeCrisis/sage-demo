import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassPanel from '../GlassPanel.jsx';
import StatusBadge from '../StatusBadge.jsx';
import theme from '../../styles/theme.js';
import styles from './OrchestrationCard.module.css';

const typeIcons = { hr: '👤', it: '🖥️', manager: '📋' };
const borderColors = {
  active: theme.colors.teal[500],
  completed: theme.colors.status.success,
  pending: theme.colors.status.warning,
  'in-progress': theme.colors.teal[500],
};

const OrchestrationCard = ({ card, delay = 0 }) => {
  const [expanded, setExpanded] = useState(false);
  const borderColor = borderColors[card.status] || theme.colors.teal[500];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      layout
    >
      <GlassPanel
        hover
        style={{
          padding: '20px',
          borderLeft: `3px solid ${borderColor}`,
          cursor: 'pointer',
        }}
        onClick={() => setExpanded(!expanded)}
        whileHover={{ y: -4, boxShadow: `0 12px 40px rgba(0,0,0,0.4), 0 0 20px ${borderColor}22` }}
      >
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.typeIcon}>{typeIcons[card.type] || '📄'}</span>
            <div>
              <div className={styles.title}>{card.title}</div>
              <div className={styles.number}>{card.number}</div>
            </div>
          </div>
          <StatusBadge status={card.status} />
        </div>

        <div className={styles.details}>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Assigned</span>
            <span className={styles.detailValue}>{card.assignedTo}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Priority</span>
            <span className={styles.detailValue}>{card.priority}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Department</span>
            <span className={styles.detailValue}>{card.department}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Est. Completion</span>
            <span className={styles.detailValue}>{card.estimatedCompletion}</span>
          </div>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ overflow: 'hidden' }}
            >
              <div className={styles.description}>{card.description}</div>
              <div className={styles.created}>
                Created: {isNaN(Date.parse(card.created)) ? card.created : new Date(card.created).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassPanel>
    </motion.div>
  );
};

export default OrchestrationCard;
