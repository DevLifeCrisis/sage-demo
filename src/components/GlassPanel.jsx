import { motion } from 'framer-motion';
import theme from '../styles/theme';

export default function GlassPanel({
  children,
  className = '',
  glow = false,
  animate = true,
  style = {},
  ...rest
}) {
  const base = {
    background: theme.colors.glass.bg,
    backdropFilter: `blur(${theme.colors.glass.blur})`,
    WebkitBackdropFilter: `blur(${theme.colors.glass.blur})`,
    border: `1px solid ${glow ? 'rgba(0,229,255,0.2)' : theme.colors.glass.border}`,
    borderRadius: theme.radius.lg,
    boxShadow: glow
      ? `${theme.shadows.md}, ${theme.shadows.glow}`
      : theme.shadows.md,
    ...style,
  };

  if (!animate) {
    return (
      <div className={className} style={base} {...rest}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={className}
      style={base}
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
