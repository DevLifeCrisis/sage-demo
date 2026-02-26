import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './chat.module.css';

function Section({ title, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={styles.contextSection}>
      <div className={styles.sectionHeader} onClick={() => setOpen(!open)}>
        <span className={styles.sectionTitle}>{title}</span>
        <span className={open ? styles.sectionChevronOpen : styles.sectionChevron}>▾</span>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden' }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ContextPanel({ flow, collectedData, activeRecords }) {
  const hasContent = flow || (collectedData && Object.keys(collectedData).length) || (activeRecords && activeRecords.length);

  if (!hasContent) {
    return (
      <div className={styles.contextPanel}>
        <div className={styles.emptyContext}>
          Context will appear here as the conversation progresses.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.contextPanel}>
      {flow && (
        <Section title="Current Flow">
          <div className={styles.flowLabel}>{flow.name}</div>
          <div className={styles.flowSteps}>
            {Array.from({ length: flow.totalSteps || 4 }, (_, i) => (
              <div
                key={i}
                className={
                  i < flow.currentStep
                    ? styles.flowStepDone
                    : i === flow.currentStep
                    ? styles.flowStepActive
                    : styles.flowStep
                }
              />
            ))}
          </div>
        </Section>
      )}

      {collectedData && Object.keys(collectedData).length > 0 && (
        <Section title="Collected Data">
          {Object.entries(collectedData).map(([key, value], i) => (
            <motion.div
              key={key}
              className={styles.dataRow}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <span className={styles.dataKey}>{key}</span>
              <span className={styles.dataValue}>{value}</span>
            </motion.div>
          ))}
        </Section>
      )}

      {activeRecords && activeRecords.length > 0 && (
        <Section title="Active Records">
          {activeRecords.map((rec, i) => (
            <motion.div
              key={rec.number || i}
              className={styles.recordCard}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className={styles.recordNumber}>{rec.number}</div>
              <div className={styles.recordType}>{rec.type}</div>
              <span className={rec.status === 'completed' ? styles.statusComplete : styles.statusOpen}>
                {rec.status}
              </span>
            </motion.div>
          ))}
        </Section>
      )}
    </div>
  );
}
