import { motion } from 'framer-motion';
import AnimatedCounter from '../AnimatedCounter.jsx';
import theme from '../../styles/theme.js';

const ProgressRing = ({ percentage = 0, size = 80, strokeWidth = 6 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  const gradientId = `progress-grad-${size}`;

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={theme.colors.teal[500]} />
            <stop offset="100%" stopColor="#00B8D4" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={theme.colors.glass.border}
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - (circumference * percentage) / 100 }}
          transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
          filter="url(#glow)"
        />
      </svg>
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <AnimatedCounter
          value={percentage}
          suffix="%"
          style={{ fontSize: size * 0.22, color: theme.colors.text.primary }}
        />
      </div>
    </div>
  );
};

export default ProgressRing;
