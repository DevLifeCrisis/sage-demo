import { useEffect, useRef, useState } from 'react';
import { useInView, animate } from 'framer-motion';
import theme from '../styles/theme';

export default function AnimatedCounter({
  value = 0,
  prefix = '',
  suffix = '',
  duration = 1.5,
  decimals = 0,
  style = {},
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });
  const [display, setDisplay] = useState(`${prefix}0${suffix}`);

  useEffect(() => {
    if (!isInView) return;
    const controls = animate(0, value, {
      duration,
      ease: [0.4, 0, 0.2, 1],
      onUpdate: (v) => setDisplay(`${prefix}${v.toFixed(decimals)}${suffix}`),
    });
    return () => controls.stop();
  }, [isInView, value, prefix, suffix, duration, decimals]);

  return (
    <span
      ref={ref}
      style={{
        fontFamily: theme.typography.fontFamily.mono,
        fontWeight: theme.typography.fontWeight.bold,
        fontVariantNumeric: 'tabular-nums',
        ...style,
      }}
    >
      {display}
    </span>
  );
}
