import { useRef } from 'react';
import { motion } from 'framer-motion';
import theme from '../styles/theme';

const sizes = {
  sm: { padding: '6px 14px', fontSize: theme.typography.fontSize.sm },
  md: { padding: '10px 22px', fontSize: theme.typography.fontSize.base },
  lg: { padding: '14px 32px', fontSize: theme.typography.fontSize.md },
};

const variants = {
  primary: {
    background: `linear-gradient(135deg, ${theme.colors.teal[500]}, ${theme.colors.teal[400]})`,
    color: '#0A0A0F',
    border: 'none',
    fontWeight: theme.typography.fontWeight.semibold,
  },
  secondary: {
    background: theme.colors.glass.bg,
    color: theme.colors.teal[500],
    border: `1px solid ${theme.colors.teal[500]}40`,
    backdropFilter: `blur(${theme.colors.glass.blur})`,
  },
  ghost: {
    background: 'transparent',
    color: theme.colors.text.secondary,
    border: '1px solid transparent',
  },
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style = {},
  onClick,
  ...rest
}) {
  const btnRef = useRef(null);

  const handleClick = (e) => {
    if (loading || disabled) return;
    // ripple
    const btn = btnRef.current;
    const circle = document.createElement('span');
    const rect = btn.getBoundingClientRect();
    const d = Math.max(rect.width, rect.height);
    circle.style.cssText = `
      position:absolute;width:${d}px;height:${d}px;border-radius:50%;
      background:rgba(255,255,255,0.25);transform:scale(0);
      animation:ripple 0.5s ease-out forwards;pointer-events:none;
      left:${e.clientX - rect.left - d / 2}px;top:${e.clientY - rect.top - d / 2}px;
    `;
    btn.appendChild(circle);
    setTimeout(() => circle.remove(), 600);
    onClick?.(e);
  };

  const s = sizes[size];
  const v = variants[variant];

  return (
    <motion.button
      ref={btnRef}
      onClick={handleClick}
      disabled={disabled || loading}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      style={{
        position: 'relative',
        overflow: 'hidden',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        borderRadius: theme.radius.md,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: `all ${theme.transitions.base}`,
        letterSpacing: theme.typography.letterSpacing.wide,
        fontFamily: theme.typography.fontFamily.body,
        lineHeight: 1,
        ...v,
        ...s,
        ...style,
      }}
      {...rest}
    >
      {loading && (
        <span
          style={{
            width: '14px', height: '14px',
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.6s linear infinite',
            flexShrink: 0,
          }}
        />
      )}
      {children}
    </motion.button>
  );
}
