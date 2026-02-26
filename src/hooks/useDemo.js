import { useState, useCallback } from 'react';
import * as api from '../services/api';

export default function useDemo() {
  const [demoState, setDemoState] = useState('idle'); // idle | seeding | ready | active | complete

  const startDemo = useCallback(async () => {
    try {
      setDemoState('seeding');
      await api.startDemo();
      setDemoState('ready');
      // Auto-transition to active after brief pause
      setTimeout(() => setDemoState('active'), 800);
    } catch (err) {
      console.error('Demo start failed:', err);
      setDemoState('idle');
    }
  }, []);

  const resetDemo = useCallback(async () => {
    try {
      await api.resetDemo();
      setDemoState('idle');
    } catch (err) {
      console.error('Demo reset failed:', err);
    }
  }, []);

  return { demoState, startDemo, resetDemo };
}
