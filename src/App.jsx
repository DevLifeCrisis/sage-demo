import { Outlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import TopoBg from './components/TopoBg';
import SideNav from './components/SideNav';
import TopBar from './components/TopBar';
import useDemo from './hooks/useDemo';
import theme from './styles/theme';

export default function App() {
  const { demoState, startDemo, resetDemo } = useDemo();
  const location = useLocation();

  return (
    <div style={{ height: '100vh', width: '100vw', overflow: 'hidden', background: theme.colors.bg.primary }}>
      <TopoBg />
      <SideNav />
      <TopBar demoState={demoState} onStartDemo={startDemo} onResetDemo={resetDemo} />

      {/* Main content area */}
      <main
        style={{
          position: 'absolute',
          top: 56, // topbar height
          left: 64,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          padding: theme.spacing.lg,
          overflowY: 'auto',
        }}
      >
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
        >
          <Outlet context={{ demoState, startDemo, resetDemo }} />
        </motion.div>
      </main>
    </div>
  );
}
