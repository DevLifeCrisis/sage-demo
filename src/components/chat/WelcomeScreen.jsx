import React from 'react';
import { motion } from 'framer-motion';
import styles from './chat.module.css';

const scenarios = [
  {
    icon: '👤',
    title: 'Employee Onboarding',
    desc: 'Set up new employees with accounts, access, and equipment',
    message: 'I need to onboard a new employee',
  },
  {
    icon: '🔒',
    title: 'Contractor Offboarding',
    desc: 'Revoke access, collect assets, and close out contractors',
    message: 'I need to offboard a contractor',
  },
  {
    icon: '💻',
    title: 'IT Support',
    desc: 'Resolve technical issues, request software, or get help',
    message: 'I need IT support',
  },
];

export default function WelcomeScreen({ onScenarioSelect }) {
  return (
    <div className={styles.welcome}>
      <motion.div
        className={styles.logoHex}
        initial={{ opacity: 0, scale: 0.8, rotate: -30 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        S
      </motion.div>
      <motion.h1
        className={styles.welcomeTitle}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
      >
        Welcome to SAGE
      </motion.h1>
      <motion.p
        className={styles.welcomeSubtitle}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
      >
        Smart Agent for Guided Experiences
      </motion.p>
      <div className={styles.scenarioCards}>
        {scenarios.map((s, i) => (
          <motion.div
            key={s.title}
            className={styles.scenarioCard}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 + i * 0.1, duration: 0.4, ease: 'easeOut' }}
            whileHover={{ y: -4, boxShadow: '0 8px 32px rgba(0, 229, 255, 0.12)' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onScenarioSelect(s.message)}
          >
            <div className={styles.scenarioIcon}>{s.icon}</div>
            <div className={styles.scenarioTitle}>{s.title}</div>
            <div className={styles.scenarioDesc}>{s.desc}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
