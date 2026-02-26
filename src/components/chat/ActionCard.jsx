import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './chat.module.css';

function StatusIcon({ status }) {
  if (status === 'completed') {
    return <div className={styles.actionIconDone}>✓</div>;
  }
  if (status === 'in_progress') {
    return (
      <motion.div
        className={styles.actionIconProgress}
        animate={{ opacity: [1, 0.4, 1] }}
        transition={{ duration: 1.2, repeat: Infinity }}
      >
        <div className={styles.spinnerActive} />
      </motion.div>
    );
  }
  return (
    <div className={styles.actionIconPending}>
      <div className={styles.spinner} />
    </div>
  );
}

export default function ActionCard({ actionCard, onConfirm, onCancel, awaitingConfirmation }) {
  if (!actionCard) return null;

  return (
    <motion.div
      className={styles.actionCard}
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div className={styles.actionTitle}>{actionCard.title}</div>
      <div>
        <AnimatePresence>
          {actionCard.items.map((item, i) => (
            <motion.div
              key={item.label}
              className={styles.actionItem}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.15, duration: 0.3 }}
            >
              <StatusIcon status={item.status} />
              <span className={styles.actionLabel}>{item.label}</span>
              {item.detail && (
                <span className={styles.actionDetail}>{item.detail}</span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      {awaitingConfirmation && (
        <motion.div
          className={styles.actionButtons}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <button className={styles.btnConfirm} onClick={onConfirm}>
            Confirm
          </button>
          <button className={styles.btnCancel} onClick={onCancel}>
            Cancel
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
