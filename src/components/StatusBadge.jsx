import { motion } from 'framer-motion';
import theme from '../styles/theme';

const variantColors = {
  success: theme.colors.status.success,
  warning: theme.colors.status.warning,
  error: theme.colors.status.error,
  info: theme.colors.status.info,
  pending: theme.colors.text.tertiary,
};

export default function StatusBadge({ variant, status, children }) {
  const v = (variant || status || 'info').toLowerCase();
  // Map common status strings to variants
  const statusMap = { active: 'info', open: 'info', completed: 'success', complete: 'success', pending: 'pending', 'in progress': 'info', 'in-progress': 'info', error: 'error', failed: 'error' };
  const resolved = statusMap[v] || v;
  const color = variantColors[resolved] || variantColors.info;
  const shouldPulse = resolved === 'pending' || resolved === 'info';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 12px',
        borderRadius: theme.radius.full,
        background: `${color}14`,
        border: `1px solid ${color}30`,
        fontSize: theme.typography.fontSize.xs,
        fontFamily: theme.typography.fontFamily.mono,
        fontWeight: theme.typography.fontWeight.medium,
        letterSpacing: theme.typography.letterSpacing.wide,
        color,
        textTransform: 'uppercase',
      }}
    >
      <motion.span
        animate={shouldPulse ? { scale: [1, 1.4, 1], opacity: [1, 0.5, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: color,
          flexShrink: 0,
        }}
      />
      {children}
    </span>
  );
}
