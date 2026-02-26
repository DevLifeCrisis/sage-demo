import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import theme from '../styles/theme';

const NAV_ITEMS = [
  {
    path: '/app/chat',
    label: 'Chat',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 4h14a1 1 0 011 1v8a1 1 0 01-1 1H7l-4 3V5a1 1 0 011-1z" />
      </svg>
    ),
  },
  {
    path: '/app/dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="6" height="6" rx="1" />
        <rect x="11" y="3" width="6" height="6" rx="1" />
        <rect x="3" y="11" width="6" height="6" rx="1" />
        <rect x="11" y="11" width="6" height="6" rx="1" />
      </svg>
    ),
  },
  {
    path: '/app/audit',
    label: 'Operations',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="6" y1="5" x2="17" y2="5" />
        <line x1="6" y1="10" x2="17" y2="10" />
        <line x1="6" y1="15" x2="17" y2="15" />
        <circle cx="3" cy="5" r="1" fill="currentColor" />
        <circle cx="3" cy="10" r="1" fill="currentColor" />
        <circle cx="3" cy="15" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    path: '/app/metrics',
    label: 'Metrics',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3,15 7,9 11,12 17,4" />
        <line x1="3" y1="17" x2="17" y2="17" />
      </svg>
    ),
  },
  {
    path: '/app/users',
    label: 'Users',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8" cy="6" r="3" />
        <path d="M2 17c0-3.3 2.7-6 6-6s6 2.7 6 6" />
        <circle cx="15" cy="6" r="2" />
        <path d="M15 10c2 0 3.5 1.5 3.5 3.5" />
      </svg>
    ),
  },
];

const SETTINGS_ITEM = {
  path: '/app/settings',
  label: 'Settings',
  icon: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="3" />
      <path d="M10 1v2M10 17v2M1 10h2M17 10h2M3.5 3.5l1.4 1.4M15.1 15.1l1.4 1.4M3.5 16.5l1.4-1.4M15.1 4.9l1.4-1.4" />
    </svg>
  ),
};

const COLLAPSED_W = 64;
const EXPANDED_W = 200;

function NavItem({ item, expanded, location }) {
  const active = location.pathname === item.path;
  return (
    <NavLink
      to={item.path}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 12px',
        borderRadius: theme.radius.md,
        color: active ? theme.colors.teal[500] : theme.colors.text.tertiary,
        background: active ? theme.colors.teal.glow : 'transparent',
        textDecoration: 'none',
        position: 'relative',
        transition: `all ${theme.transitions.base}`,
        fontSize: theme.typography.fontSize.sm,
        fontWeight: active ? theme.typography.fontWeight.medium : theme.typography.fontWeight.regular,
        letterSpacing: theme.typography.letterSpacing.wide,
      }}
    >
      {active && (
        <motion.div
          layoutId="nav-active"
          style={{
            position: 'absolute', left: 0, top: '20%', bottom: '20%', width: '3px',
            borderRadius: '0 3px 3px 0', background: theme.colors.teal[500],
            boxShadow: `0 0 10px ${theme.colors.teal[500]}`,
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}
      <span style={{ flexShrink: 0, display: 'flex' }}>{item.icon}</span>
      <AnimatePresence>
        {expanded && (
          <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.2 }} style={{ whiteSpace: 'nowrap' }}>
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
    </NavLink>
  );
}

export default function SideNav() {
  const [expanded, setExpanded] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <motion.nav
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      animate={{ width: expanded ? EXPANDED_W : COLLAPSED_W }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      style={{
        position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: theme.zIndex.sidebar,
        background: theme.colors.glass.bg, backdropFilter: `blur(${theme.colors.glass.blur})`,
        WebkitBackdropFilter: `blur(${theme.colors.glass.blur})`,
        borderRight: `1px solid ${theme.colors.glass.border}`,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}
    >
      {/* Logo */}
      <div
        onClick={() => navigate('/app/chat')}
        style={{
          height: '64px', display: 'flex', alignItems: 'center',
          justifyContent: expanded ? 'flex-start' : 'center',
          padding: expanded ? '0 16px' : '0', gap: '12px',
          borderBottom: `1px solid ${theme.colors.glass.border}`, flexShrink: 0, cursor: 'pointer',
        }}
      >
        <svg width="32" height="32" viewBox="0 0 32 32">
          <polygon points="16,2 28,9 28,23 16,30 4,23 4,9" fill="none" stroke={theme.colors.teal[500]} strokeWidth="1.5" />
          <text x="16" y="20" textAnchor="middle" fill={theme.colors.teal[500]} fontSize="13" fontFamily="'JetBrains Mono', monospace" fontWeight="700">S</text>
        </svg>
        <AnimatePresence>
          {expanded && (
            <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.2 }}
              style={{ fontFamily: theme.typography.fontFamily.mono, fontWeight: theme.typography.fontWeight.bold, fontSize: theme.typography.fontSize.md, color: theme.colors.teal[500], letterSpacing: theme.typography.letterSpacing.wider, whiteSpace: 'nowrap' }}>
              SAGE
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav Items */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '12px 8px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {NAV_ITEMS.map((item) => (
            <NavItem key={item.path} item={item} expanded={expanded} location={location} />
          ))}
        </div>
        <div style={{ borderTop: `1px solid ${theme.colors.glass.border}`, paddingTop: '8px' }}>
          <NavItem item={SETTINGS_ITEM} expanded={expanded} location={location} />
        </div>
      </div>
    </motion.nav>
  );
}
