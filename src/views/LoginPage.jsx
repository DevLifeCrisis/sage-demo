import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import styles from './LoginPage.module.css';

const DEMO_USER = {
  email: 'jonathan.harris@ecstech.com',
  password: 'demo123',
  name: 'Jonathan Harris',
  company: 'ECS Technology Solutions',
  role: 'admin',
};

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));

    if (email === DEMO_USER.email && password === DEMO_USER.password) {
      localStorage.setItem('sage_user', JSON.stringify({ email: DEMO_USER.email, name: DEMO_USER.name, company: DEMO_USER.company, role: DEMO_USER.role }));
      // Default demo account to Claude if no LLM config exists
      if (!localStorage.getItem('sage_llm_config')) {
        localStorage.setItem('sage_llm_config', JSON.stringify({ provider: 'claude', credentials: {} }));
      }
      navigate('/app/chat');
    } else {
      // For demo, accept any email/password combo
      localStorage.setItem('sage_user', JSON.stringify({ email, name: email.split('@')[0], company: 'Demo Company', role: 'user' }));
      navigate('/app/chat');
    }
  };

  return (
    <div className={styles.page}>
      <motion.div className={styles.card} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.175, 0.885, 0.32, 1.275] }}>
        <div className={styles.logoWrap}>
          <img src="/ecs-logo.png" alt="ECS" className={styles.logo} />
          <h1 className={styles.brand}>SAGE</h1>
          <p className={styles.subtitle}>Sign in to your account</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {error && <div className={styles.error}>{error}</div>}

          <label className={styles.label}>Email</label>
          <input className={styles.input} type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />

          <label className={styles.label}>Password</label>
          <input className={styles.input} type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />

          <div className={styles.forgotRow}>
            <a href="#" className={styles.forgotLink} onClick={(e) => e.preventDefault()}>Forgot password?</a>
          </div>

          <button className={styles.submitBtn} type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className={styles.switchText}>
          Don't have an account? <Link to="/signup" className={styles.switchLink}>Sign up</Link>
        </p>

        <div className={styles.demoHint}>
          <span>Demo: jonathan.harris@ecstech.com / demo123</span>
        </div>
      </motion.div>
    </div>
  );
}
