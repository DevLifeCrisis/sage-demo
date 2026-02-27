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

/**
 * Build displayable items from the action card.
 * Supports both legacy format (items array) and ServiceNow format (description string / data object).
 */
function getItems(actionCard) {
  // Legacy format — already has items array
  if (actionCard.items && Array.isArray(actionCard.items)) {
    return actionCard.items;
  }

  // ServiceNow format — build items from description or data
  const items = [];

  if (actionCard.description) {
    // Parse "Key: Value" lines from description
    const lines = actionCard.description.split('\n').filter(l => l.trim());
    lines.forEach(line => {
      const colonIdx = line.indexOf(':');
      if (colonIdx > 0) {
        items.push({
          label: line.substring(0, colonIdx).trim(),
          detail: line.substring(colonIdx + 1).trim(),
          status: 'pending',
        });
      } else {
        items.push({ label: line.trim(), detail: '', status: 'pending' });
      }
    });
  } else if (actionCard.data && typeof actionCard.data === 'object') {
    // Fall back to raw data keys
    Object.entries(actionCard.data).forEach(([key, value]) => {
      items.push({
        label: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        detail: String(value),
        status: 'pending',
      });
    });
  }

  return items;
}

function hasAwaitingItems(actionCard) {
  if (actionCard.items && Array.isArray(actionCard.items)) {
    return actionCard.items.some(it => it.status === 'pending');
  }
  // ServiceNow confirmation cards are always awaiting
  return actionCard.type === 'confirmation';
}

export default function ActionCard({ actionCard, onConfirm, onCancel, awaitingConfirmation }) {
  if (!actionCard) return null;

  const items = getItems(actionCard);
  const showButtons = awaitingConfirmation || hasAwaitingItems(actionCard);

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
          {items.map((item, i) => (
            <motion.div
              key={item.label + i}
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
      {showButtons && (
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
