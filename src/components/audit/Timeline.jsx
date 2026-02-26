import { motion } from 'framer-motion';
import TimelineEntry from './TimelineEntry.jsx';
import theme from '../../styles/theme.js';
import styles from './Timeline.module.css';

const Timeline = ({ entries = [] }) => {
  return (
    <div className={styles.timeline}>
      <motion.div
        className={styles.line}
        initial={{ height: 0 }}
        animate={{ height: '100%' }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      />
      {entries.map((entry, i) => (
        <TimelineEntry key={entry.id} entry={entry} delay={0.2 + i * 0.15} />
      ))}
    </div>
  );
};

export default Timeline;
