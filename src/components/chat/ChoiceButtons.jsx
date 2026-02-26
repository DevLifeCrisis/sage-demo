import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './chat.module.css';

export default function ChoiceButtons({ choices, onSelect, disabled }) {
  if (!choices || choices.length === 0) return null;

  return (
    <AnimatePresence>
      <div className={styles.choicesWrap}>
        {choices.map((choice, i) => (
          <motion.button
            key={choice.value}
            className={styles.choiceBtn}
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
            transition={{ delay: i * 0.05, duration: 0.3, ease: 'easeOut' }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => !disabled && onSelect(choice)}
            disabled={disabled}
          >
            {choice.label}
          </motion.button>
        ))}
      </div>
    </AnimatePresence>
  );
}
