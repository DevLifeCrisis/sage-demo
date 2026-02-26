import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import styles from './chat.module.css';

export default function ChatInput({ onSend, disabled }) {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [text, disabled, onSend]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e) => {
    setText(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  return (
    <div className={styles.inputBar}>
      <motion.div
        className={styles.inputInner}
        animate={disabled ? { opacity: 0.5 } : { opacity: 1 }}
      >
        {disabled ? (
          <span className={styles.disabledText}>SAGE is responding…</span>
        ) : (
          <textarea
            ref={textareaRef}
            className={styles.inputField}
            value={text}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
          />
        )}
        <button
          className={styles.sendBtn}
          onClick={handleSend}
          disabled={disabled || !text.trim()}
        >
          ↑
        </button>
      </motion.div>
    </div>
  );
}
