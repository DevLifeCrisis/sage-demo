import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import theme from '../styles/theme';
import Button from './Button';
import StatusBadge from './StatusBadge';

const DEMO_LABELS = {
  idle: { text: 'Demo Ready', variant: 'pending' },
  seeding: { text: 'Seeding Data…', variant: 'warning' },
  ready: { text: 'Demo Ready', variant: 'info' },
  active: { text: 'Demo Active', variant: 'success' },
  complete: { text: 'Demo Complete', variant: 'success' },
};

export default function TopBar({ demoState = 'idle', onStartDemo, onResetDemo }) {
  const dl = DEMO_LABELS[demoState] || DEMO_LABELS.idle;
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('sage_user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('sage_user');
    navigate('/login');
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 64, right: 0, zIndex: theme.zIndex.topbar }}>
      {/* Main bar */}
      <div
        style={{
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          background: theme.colors.glass.bg,
          backdropFilter: `blur(${theme.colors.glass.blur})`,
          WebkitBackdropFilter: `blur(${theme.colors.glass.blur})`,
          borderBottom: `1px solid ${theme.colors.glass.border}`,
        }}
      >
        {/* Left — title */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
          <span
            style={{
              fontFamily: theme.typography.fontFamily.mono,
              fontWeight: theme.typography.fontWeight.bold,
              fontSize: theme.typography.fontSize.lg,
              letterSpacing: theme.typography.letterSpacing.wider,
              color: theme.colors.text.primary,
            }}
          >
            SAGE
          </span>
          <span
            style={{
              fontSize: theme.typography.fontSize.xs,
              color: theme.colors.text.tertiary,
              letterSpacing: theme.typography.letterSpacing.wide,
            }}
          >
            Smart Agent for Guided Experiences — by ECS
          </span>
        </div>

        {/* Right — status + user + button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <StatusBadge variant={dl.variant}>{dl.text}</StatusBadge>

          {demoState === 'idle' || demoState === 'ready' ? (
            <motion.div
              animate={{ boxShadow: ['0 0 15px rgba(0,229,255,0.15)', '0 0 30px rgba(0,229,255,0.3)', '0 0 15px rgba(0,229,255,0.15)'] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{ borderRadius: theme.radius.md }}
            >
              <Button variant="primary" size="sm" onClick={onStartDemo}>
                Start Demo
              </Button>
            </motion.div>
          ) : demoState === 'complete' ? (
            <Button variant="secondary" size="sm" onClick={onResetDemo}>
              Reset Demo
            </Button>
          ) : null}

          {user.name && (
            <span style={{ fontSize: '12px', color: theme.colors.text.tertiary }}>{user.name}</span>
          )}

          <button
            onClick={handleLogout}
            style={{
              padding: '6px 14px', borderRadius: theme.radius.md,
              border: '1px solid rgba(255,255,255,0.1)', background: 'transparent',
              color: 'rgba(255,255,255,0.5)', fontSize: '12px', cursor: 'pointer',
              fontFamily: 'inherit', transition: 'all 0.2s',
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
