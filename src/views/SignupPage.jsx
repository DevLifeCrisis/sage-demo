import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import styles from './LoginPage.module.css'; // reuse login styles

export default function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ company: '', name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    localStorage.setItem('sage_user', JSON.stringify({ email: form.email, name: form.name, company: form.company, role: 'admin' }));
    navigate('/app/chat');
  };

  return (
    <div className={styles.page}>
      <motion.div className={styles.card} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.175, 0.885, 0.32, 1.275] }}>
        <div className={styles.logoWrap}>
          <img src="/ecs-logo.png" alt="ECS" className={styles.logo} />
          <h1 className={styles.brand}>SAGE</h1>
          <p className={styles.subtitle}>Create your account</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {error && <div className={styles.error}>{error}</div>}

          <label className={styles.label}>Company Name</label>
          <input className={styles.input} placeholder="Acme Corp" value={form.company} onChange={set('company')} required />

          <label className={styles.label}>Full Name</label>
          <input className={styles.input} placeholder="Jane Doe" value={form.name} onChange={set('name')} required />

          <label className={styles.label}>Email</label>
          <input className={styles.input} type="email" placeholder="you@company.com" value={form.email} onChange={set('email')} required />

          <label className={styles.label}>Password</label>
          <input className={styles.input} type="password" placeholder="Min 6 characters" value={form.password} onChange={set('password')} required />

          <label className={styles.label}>Confirm Password</label>
          <input className={styles.input} type="password" placeholder="••••••••" value={form.confirm} onChange={set('confirm')} required />

          <button className={styles.submitBtn} type="submit" disabled={loading} style={{ marginTop: 16 }}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className={styles.switchText}>
          Already have an account? <Link to="/login" className={styles.switchLink}>Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
