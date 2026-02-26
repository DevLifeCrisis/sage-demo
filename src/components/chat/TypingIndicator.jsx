import React from 'react';
import { motion } from 'framer-motion';
import styles from './chat.module.css';

export default function TypingIndicator() {
  return (
    <motion.div
      className={styles.typingWrap}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5, transition: { duration: 0.2 } }}
      transition={{ duration: 0.3 }}
    >
      <div className={styles.avatar}>S</div>
      <div className={styles.typingBubble}>
        <div className={styles.dots}>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className={styles.dot}
              animate={{ y: [0, -6, 0] }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.15,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
        <span className={styles.typingText}>SAGE is thinking…</span>
      </div>
    </motion.div>
  );
}
