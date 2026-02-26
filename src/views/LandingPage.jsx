import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import theme from '../styles/theme';

function Section({ children, delay = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay, ease: [0.4, 0, 0.2, 1] }}>
      {children}
    </motion.div>
  );
}

const FEATURES = [
  { icon: '💬', title: 'AI Conversational Interface', desc: 'Natural language interactions — ask SAGE to onboard employees, resolve IT issues, or manage workflows by simply typing what you need.' },
  { icon: '📊', title: 'Orchestration Dashboard', desc: 'Real-time process tracking with live status updates on every case, request, and task across your enterprise.' },
  { icon: '🛡️', title: 'Audit Trail & Compliance', desc: 'Every action logged, timestamped, and sealed. Full compliance visibility for government and enterprise standards.' },
  { icon: '📈', title: 'Performance Metrics', desc: 'AI-powered analytics including deflection rates, resolution times, and conversation intelligence across all workflows.' },
  { icon: '🤖', title: 'Multi-LLM Support', desc: 'Bring your own key — OpenAI, Google Gemini, Anthropic Claude, or NowAssist. Your choice, your control.' },
  { icon: '⚡', title: 'ServiceNow Integration', desc: 'Direct API integration with your ServiceNow instance. Create records, trigger workflows, and query data in real time.' },
];

const TIERS = [
  { name: 'Starter', price: '$99', period: '/mo', features: ['5 Users', 'BYOK LLM', '1 ServiceNow Instance', 'Core Features', 'Email Support'], cta: 'Get Started', highlight: false },
  { name: 'Professional', price: '$299', period: '/mo', features: ['25 Users', 'BYOK LLM', '3 ServiceNow Instances', 'User Management', 'Priority Support', 'Advanced Analytics'], cta: 'Get Started', highlight: true },
  { name: 'Enterprise', price: 'Contact Us', period: '', features: ['Unlimited Users', 'Included LLM', 'Unlimited Instances', 'Dedicated Support', 'SSO / SAML', 'Custom Integrations', 'White-Label Options'], cta: 'Contact Sales', highlight: false },
];

const SCREENSHOTS = [
  { src: '/sage_screenshot1.png', label: 'AI Chat Interface' },
  { src: '/sage_screenshot2.png', label: 'Orchestration Dashboard' },
  { src: '/sage_screenshot3.png', label: 'Audit Trail' },
  { src: '/sage_screenshot4.png', label: 'Performance Metrics' },
];

export default function LandingPage() {
  return (
    <div style={{ background: '#0A0A0F', color: '#fff', minHeight: '100vh', overflowX: 'hidden', overflowY: 'auto', height: '100vh' }}>
      {/* Nav */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 40px',
        background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/ecs-logo.png" alt="ECS" style={{ height: '32px' }} onError={e => e.target.style.display = 'none'} />
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: '18px', color: '#00E5FF', letterSpacing: '0.08em' }}>SAGE</span>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link to="/login" style={{ padding: '8px 20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '13px', fontWeight: 500 }}>Sign In</Link>
          <Link to="/signup" style={{ padding: '8px 20px', borderRadius: '8px', background: 'rgba(0,229,255,0.2)', color: '#00E5FF', textDecoration: 'none', fontSize: '13px', fontWeight: 600, border: 'none' }}>Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: '160px 40px 100px', textAlign: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '-100px', left: '50%', transform: 'translateX(-50%)', width: '800px', height: '800px', background: 'radial-gradient(circle, rgba(0,229,255,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <img src="/ecs-logo.png" alt="ECS" style={{ height: '60px', marginBottom: '24px' }} onError={e => e.target.style.display = 'none'} />
          <h1 style={{ fontSize: '56px', fontWeight: 700, margin: '0 0 16px', lineHeight: 1.1 }}>
            <span style={{ color: '#00E5FF' }}>SAGE</span>
          </h1>
          <p style={{ fontSize: '20px', color: 'rgba(255,255,255,0.5)', maxWidth: '600px', margin: '0 auto 12px', letterSpacing: '0.02em' }}>
            Smart Agent for Guided Experiences — by ECS
          </p>
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.4)', maxWidth: '540px', margin: '0 auto 40px', lineHeight: 1.6 }}>
            AI-powered ServiceNow orchestration for the modern enterprise. Automate onboarding, resolve tickets, and manage workflows through natural conversation.
          </p>
          <Link to="/signup" style={{
            display: 'inline-block', padding: '14px 40px', borderRadius: '10px',
            background: 'rgba(0,229,255,0.2)', color: '#00E5FF', textDecoration: 'none',
            fontSize: '15px', fontWeight: 600, border: '1px solid rgba(0,229,255,0.3)',
            transition: 'all 0.2s', boxShadow: '0 0 30px rgba(0,229,255,0.15)',
          }}>
            Get Started Free →
          </Link>
        </motion.div>
      </section>

      {/* Features */}
      <section style={{ padding: '80px 40px', maxWidth: '1100px', margin: '0 auto' }}>
        <Section>
          <h2 style={{ fontSize: '32px', fontWeight: 700, textAlign: 'center', marginBottom: '12px' }}>Everything You Need</h2>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginBottom: '48px' }}>Enterprise-grade AI orchestration for ServiceNow</p>
        </Section>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          {FEATURES.map((f, i) => (
            <Section key={f.title} delay={i * 0.08}>
              <div style={{
                padding: '28px 24px', borderRadius: '14px',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                transition: 'all 0.25s', height: '100%',
              }}>
                <div style={{ fontSize: '32px', marginBottom: '16px' }}>{f.icon}</div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: '#fff' }}>{f.title}</h3>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            </Section>
          ))}
        </div>
      </section>

      {/* Screenshots */}
      <section style={{ padding: '80px 40px', maxWidth: '1100px', margin: '0 auto' }}>
        <Section>
          <h2 style={{ fontSize: '32px', fontWeight: 700, textAlign: 'center', marginBottom: '12px' }}>See It In Action</h2>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginBottom: '48px' }}>A premium experience built for enterprise teams</p>
        </Section>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
          {SCREENSHOTS.map((s, i) => (
            <Section key={s.label} delay={i * 0.1}>
              <div style={{
                borderRadius: '12px', overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.02)',
              }}>
                <img src={s.src} alt={s.label} style={{ width: '100%', display: 'block' }} />
                <div style={{ padding: '12px 16px', fontSize: '13px', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{s.label}</div>
              </div>
            </Section>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section style={{ padding: '80px 40px', maxWidth: '1000px', margin: '0 auto' }}>
        <Section>
          <h2 style={{ fontSize: '32px', fontWeight: 700, textAlign: 'center', marginBottom: '12px' }}>Simple, Transparent Pricing</h2>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginBottom: '48px' }}>Start free, scale as you grow</p>
        </Section>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', alignItems: 'start' }}>
          {TIERS.map((t, i) => (
            <Section key={t.name} delay={i * 0.1}>
              <div style={{
                padding: '32px 24px', borderRadius: '16px',
                background: t.highlight ? 'rgba(0,229,255,0.06)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${t.highlight ? 'rgba(0,229,255,0.3)' : 'rgba(255,255,255,0.06)'}`,
                position: 'relative',
                boxShadow: t.highlight ? '0 0 40px rgba(0,229,255,0.1)' : 'none',
              }}>
                {t.highlight && (
                  <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', padding: '4px 16px', borderRadius: '20px', background: '#00E5FF', color: '#0A0A0F', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em' }}>
                    MOST POPULAR
                  </div>
                )}
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>{t.name}</h3>
                <div style={{ marginBottom: '24px' }}>
                  <span style={{ fontSize: '36px', fontWeight: 700, color: '#fff' }}>{t.price}</span>
                  <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>{t.period}</span>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px' }}>
                  {t.features.map(f => (
                    <li key={f} style={{ padding: '8px 0', fontSize: '13px', color: 'rgba(255,255,255,0.6)', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#00E5FF', fontSize: '14px' }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link to="/signup" style={{
                  display: 'block', textAlign: 'center', padding: '12px',
                  borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: 600,
                  background: t.highlight ? 'rgba(0,229,255,0.25)' : 'rgba(255,255,255,0.06)',
                  color: t.highlight ? '#00E5FF' : 'rgba(255,255,255,0.6)',
                  border: `1px solid ${t.highlight ? 'rgba(0,229,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
                }}>
                  {t.cta}
                </Link>
              </div>
            </Section>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '100px 40px', textAlign: 'center' }}>
        <Section>
          <h2 style={{ fontSize: '36px', fontWeight: 700, marginBottom: '16px' }}>Ready to Transform Your Enterprise?</h2>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.4)', marginBottom: '32px', maxWidth: '480px', margin: '0 auto 32px' }}>
            Join the next generation of AI-powered ServiceNow management.
          </p>
          <Link to="/signup" style={{
            display: 'inline-block', padding: '16px 48px', borderRadius: '10px',
            background: 'rgba(0,229,255,0.2)', color: '#00E5FF', textDecoration: 'none',
            fontSize: '16px', fontWeight: 600, border: '1px solid rgba(0,229,255,0.3)',
            boxShadow: '0 0 40px rgba(0,229,255,0.15)',
          }}>
            Get Started Free →
          </Link>
        </Section>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '32px 40px', borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/ecs-logo.png" alt="ECS" style={{ height: '24px' }} onError={e => e.target.style.display = 'none'} />
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>© 2026 ECS Technologies. All rights reserved.</span>
        </div>
        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)' }}>Powered by SAGE</span>
      </footer>
    </div>
  );
}
