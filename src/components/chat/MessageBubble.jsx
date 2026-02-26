import React from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import styles from './chat.module.css';

export default function MessageBubble({ message, index }) {
  const isUser = message.role === 'user';

  const variants = {
    hidden: {
      opacity: 0,
      scale: 0.95,
      x: isUser ? 30 : -30,
    },
    visible: {
      opacity: 1,
      scale: 1,
      x: 0,
      transition: {
        duration: 0.35,
        ease: [0.25, 0.46, 0.45, 0.94],
        delay: index * 0.05,
      },
    },
  };

  return (
    <motion.div
      className={isUser ? styles.messageRowUser : styles.messageRowSage}
      variants={variants}
      initial="hidden"
      animate="visible"
    >
      {!isUser && (
        <div className={styles.avatar}>S</div>
      )}
      <div className={styles.bubbleWrap}>
        <div className={isUser ? styles.bubbleUser : styles.bubbleSage}>
          {isUser ? message.text : (
            <div className={styles.markdown}>
              <ReactMarkdown>{message.text}</ReactMarkdown>
            </div>
          )}
        </div>
        <div className={isUser ? styles.timestampUser : styles.timestampSage}>
          {message.timestamp}
        </div>
      </div>
    </motion.div>
  );
}
