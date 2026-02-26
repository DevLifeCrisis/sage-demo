import { motion } from 'framer-motion';
import GlassPanel from '../GlassPanel.jsx';
import theme from '../../styles/theme.js';
import styles from './Metrics.module.css';

const LineChart = ({ data = [], title = '' }) => {
  const width = 500;
  const height = 220;
  const padding = { top: 20, right: 20, bottom: 40, left: 40 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxVal = Math.max(...data.map(d => d.value));
  const minVal = Math.min(...data.map(d => d.value));
  const range = maxVal - minVal || 1;

  const points = data.map((d, i) => ({
    x: padding.left + (i / (data.length - 1)) * chartW,
    y: padding.top + chartH - ((d.value - minVal) / range) * chartH,
    ...d,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`;

  const pathLength = points.reduce((acc, p, i) => {
    if (i === 0) return 0;
    const prev = points[i - 1];
    return acc + Math.sqrt((p.x - prev.x) ** 2 + (p.y - prev.y) ** 2);
  }, 0);

  return (
    <GlassPanel hover={false} style={{ padding: '24px' }}>
      <div className={styles.chartTitle}>{title}</div>
      <svg viewBox={`0 0 ${width} ${height}`} className={styles.lineChartSvg}>
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={theme.colors.teal[500]} stopOpacity="0.2" />
            <stop offset="100%" stopColor={theme.colors.teal[500]} stopOpacity="0" />
          </linearGradient>
          <filter id="lineGlow">
            <feGaussianBlur stdDeviation="3" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
          <line
            key={pct}
            x1={padding.left}
            x2={width - padding.right}
            y1={padding.top + chartH * (1 - pct)}
            y2={padding.top + chartH * (1 - pct)}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1"
          />
        ))}

        {/* Area fill */}
        <motion.path
          d={areaPath}
          fill="url(#lineGrad)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
        />

        {/* Line */}
        <motion.path
          d={linePath}
          fill="none"
          stroke={theme.colors.teal[500]}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#lineGlow)"
          strokeDasharray={pathLength}
          initial={{ strokeDashoffset: pathLength }}
          animate={{ strokeDashoffset: 0 }}
          transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
        />

        {/* Data points */}
        {points.map((p, i) => (
          <motion.circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="4"
            fill={theme.colors.teal[500]}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 + (i / (points.length - 1)) * 1.5, duration: 0.3 }}
          />
        ))}

        {/* X axis labels */}
        {points.map((p, i) => (
          <text
            key={i}
            x={p.x}
            y={height - 8}
            textAnchor="middle"
            fill="rgba(255,255,255,0.4)"
            fontSize="11"
            fontFamily="'JetBrains Mono', monospace"
          >
            {p.month}
          </text>
        ))}

        {/* Y axis labels */}
        {[0, 0.5, 1].map((pct) => (
          <text
            key={pct}
            x={padding.left - 8}
            y={padding.top + chartH * (1 - pct) + 4}
            textAnchor="end"
            fill="rgba(255,255,255,0.3)"
            fontSize="10"
            fontFamily="'JetBrains Mono', monospace"
          >
            {Math.round(minVal + range * pct)}
          </text>
        ))}
      </svg>
    </GlassPanel>
  );
};

export default LineChart;
