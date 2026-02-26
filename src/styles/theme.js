const theme = {
  colors: {
    bg: {
      primary: '#0A0A0F',
      secondary: '#12121A',
      tertiary: '#1A1A25',
      surface: 'rgba(255,255,255,0.03)',
    },
    teal: {
      500: '#00E5FF',
      400: '#33EBFF',
      300: '#66F0FF',
      200: '#99F5FF',
      glow: 'rgba(0,229,255,0.15)',
      glowStrong: 'rgba(0,229,255,0.35)',
    },
    text: {
      primary: '#FFFFFF',
      secondary: 'rgba(255,255,255,0.7)',
      tertiary: 'rgba(255,255,255,0.4)',
      disabled: 'rgba(255,255,255,0.2)',
    },
    status: {
      success: '#00E676',
      warning: '#FFD600',
      error: '#FF5252',
      info: '#00E5FF',
    },
    glass: {
      bg: 'rgba(255,255,255,0.05)',
      bgHover: 'rgba(255,255,255,0.08)',
      border: 'rgba(255,255,255,0.08)',
      borderHover: 'rgba(255,255,255,0.14)',
      blur: '20px',
    },
  },

  spacing: {
    xxs: '2px',
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
    xxxl: '64px',
  },

  typography: {
    fontFamily: {
      body: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      mono: "'JetBrains Mono', 'Fira Code', monospace",
    },
    fontSize: {
      xs: '0.6875rem',    // 11px
      sm: '0.75rem',      // 12px
      base: '0.875rem',   // 14px
      md: '1rem',         // 16px
      lg: '1.25rem',      // 20px
      xl: '1.5rem',       // 24px
      xxl: '2rem',        // 32px
      display: '3rem',    // 48px
    },
    fontWeight: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.7,
    },
    letterSpacing: {
      tight: '-0.02em',
      normal: '0',
      wide: '0.04em',
      wider: '0.08em',
      widest: '0.14em',
    },
  },

  radius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    xxl: '24px',
    full: '9999px',
  },

  shadows: {
    sm: '0 2px 8px rgba(0,0,0,0.3)',
    md: '0 4px 16px rgba(0,0,0,0.4)',
    lg: '0 8px 32px rgba(0,0,0,0.5)',
    xl: '0 16px 64px rgba(0,0,0,0.6)',
    glow: '0 0 20px rgba(0,229,255,0.15)',
    glowStrong: '0 0 40px rgba(0,229,255,0.25)',
    glowButton: '0 0 20px rgba(0,229,255,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
    inner: 'inset 0 1px 0 rgba(255,255,255,0.05)',
  },

  transitions: {
    fast: '0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    base: '0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    spring: '0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },

  zIndex: {
    background: 0,
    content: 10,
    sidebar: 300,
    topbar: 200,
    modal: 300,
    tooltip: 400,
    toast: 500,
  },
};

export default theme;
