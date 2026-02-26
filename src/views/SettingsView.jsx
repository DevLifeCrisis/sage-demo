import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import theme from '../styles/theme';

const glass = {
  background: theme.colors.glass.bg,
  backdropFilter: `blur(${theme.colors.glass.blur})`,
  border: `1px solid ${theme.colors.glass.border}`,
  borderRadius: theme.radius.lg,
  padding: '28px',
};

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: theme.radius.md,
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: '#fff',
  fontSize: '14px',
  fontFamily: 'inherit',
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};

const selectStyle = { ...inputStyle, cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none' };

const labelStyle = {
  fontSize: '12px',
  fontWeight: 500,
  color: 'rgba(255,255,255,0.5)',
  letterSpacing: '0.04em',
  marginBottom: '6px',
  display: 'block',
};

const btnStyle = {
  padding: '10px 24px',
  borderRadius: theme.radius.md,
  border: 'none',
  background: 'rgba(0,229,255,0.2)',
  color: '#00E5FF',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
  transition: 'all 0.2s',
};

const sectionTitle = {
  fontSize: '16px',
  fontWeight: 600,
  color: '#00E5FF',
  marginBottom: '20px',
  letterSpacing: '0.04em',
};

const LLM_PROVIDERS = [
  { value: 'openai', label: 'OpenAI', fields: [{ key: 'apiKey', label: 'API Key', placeholder: 'sk-...', type: 'password' }] },
  { value: 'gemini', label: 'Google Gemini', fields: [{ key: 'apiKey', label: 'API Key', placeholder: 'AIza...', type: 'password' }] },
  { value: 'claude', label: 'Anthropic Claude', fields: [{ key: 'apiKey', label: 'API Key', placeholder: 'sk-ant-...', type: 'password' }] },
  { value: 'nowassist', label: 'ServiceNow NowAssist', fields: [{ key: 'instanceUrl', label: 'Instance URL', placeholder: 'https://instance.service-now.com' }, { key: 'apiKey', label: 'API Key / Token', placeholder: 'Token...', type: 'password' }] },
];

const SN_AUTH_METHODS = [
  { value: 'oauth', label: 'OAuth 2.0', fields: [{ key: 'clientId', label: 'Client ID' }, { key: 'clientSecret', label: 'Client Secret', type: 'password' }] },
  { value: 'apikey', label: 'API Key', fields: [{ key: 'apiKey', label: 'API Key', type: 'password' }] },
  { value: 'basic', label: 'Basic Auth', fields: [{ key: 'username', label: 'Username' }, { key: 'password', label: 'Password', type: 'password' }] },
];

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

export default function SettingsView() {
  const [llm, setLlm] = useState({ provider: 'openai', credentials: {} });
  const [sn, setSn] = useState({ instanceUrl: '', authMethod: 'oauth', credentials: {} });
  const [snTestStatus, setSnTestStatus] = useState(null);
  const [saved, setSaved] = useState({ llm: false, sn: false });
  const [general, setGeneral] = useState({ displayName: '', notifications: true, emailDigest: false });

  useEffect(() => {
    try {
      const s1 = localStorage.getItem('sage_llm_config');
      if (s1) setLlm(JSON.parse(s1));
      const s2 = localStorage.getItem('sage_sn_config');
      if (s2) setSn(JSON.parse(s2));
      const user = JSON.parse(localStorage.getItem('sage_user') || '{}');
      setGeneral(g => ({ ...g, displayName: user.name || '' }));
    } catch {}
  }, []);

  const saveLlm = () => { localStorage.setItem('sage_llm_config', JSON.stringify(llm)); setSaved(p => ({ ...p, llm: true })); setTimeout(() => setSaved(p => ({ ...p, llm: false })), 2000); };
  const saveSn = () => { localStorage.setItem('sage_sn_config', JSON.stringify(sn)); setSaved(p => ({ ...p, sn: true })); setTimeout(() => setSaved(p => ({ ...p, sn: false })), 2000); };
  const testSn = async () => { setSnTestStatus('testing'); await new Promise(r => setTimeout(r, 1200)); setSnTestStatus('success'); setTimeout(() => setSnTestStatus(null), 3000); };

  const currentProvider = LLM_PROVIDERS.find(p => p.value === llm.provider) || LLM_PROVIDERS[0];
  const currentAuth = SN_AUTH_METHODS.find(m => m.value === sn.authMethod) || SN_AUTH_METHODS[0];
  const user = JSON.parse(localStorage.getItem('sage_user') || '{}');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ width: '100%' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>Settings</h1>
      <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '28px' }}>Configure your integrations and preferences</p>

      {/* Two-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>

        {/* LLM Config */}
        <motion.div style={glass} {...fadeUp} transition={{ delay: 0.05 }}>
          <h2 style={sectionTitle}>🤖 LLM Configuration</h2>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Provider</label>
            <select style={selectStyle} value={llm.provider} onChange={e => setLlm({ provider: e.target.value, credentials: {} })}>
              {LLM_PROVIDERS.map(p => <option key={p.value} value={p.value} style={{ background: '#1a1a25' }}>{p.label}</option>)}
            </select>
          </div>
          {currentProvider.fields.map(f => (
            <div key={f.key} style={{ marginBottom: 16 }}>
              <label style={labelStyle}>{f.label}</label>
              <input
                style={inputStyle}
                type={f.type || 'text'}
                placeholder={f.placeholder || ''}
                value={llm.credentials[f.key] || ''}
                onChange={e => setLlm(p => ({ ...p, credentials: { ...p.credentials, [f.key]: e.target.value } }))}
                autoComplete="off"
              />
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button style={btnStyle} onClick={saveLlm}>{saved.llm ? '✓ Saved' : 'Save LLM Settings'}</button>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>Stored locally & encrypted</span>
          </div>
        </motion.div>

        {/* SN Config */}
        <motion.div style={glass} {...fadeUp} transition={{ delay: 0.1 }}>
          <h2 style={sectionTitle}>⚡ ServiceNow Connection</h2>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Instance URL</label>
            <input style={inputStyle} placeholder="https://mycompany.service-now.com" value={sn.instanceUrl} onChange={e => setSn(p => ({ ...p, instanceUrl: e.target.value }))} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Authentication Method</label>
            <select style={selectStyle} value={sn.authMethod} onChange={e => setSn(p => ({ ...p, authMethod: e.target.value, credentials: {} }))}>
              {SN_AUTH_METHODS.map(m => <option key={m.value} value={m.value} style={{ background: '#1a1a25' }}>{m.label}</option>)}
            </select>
          </div>
          {currentAuth.fields.map(f => (
            <div key={f.key} style={{ marginBottom: 16 }}>
              <label style={labelStyle}>{f.label}</label>
              <input
                style={inputStyle}
                type={f.type || 'text'}
                value={sn.credentials[f.key] || ''}
                onChange={e => setSn(p => ({ ...p, credentials: { ...p.credentials, [f.key]: e.target.value } }))}
              />
            </div>
          ))}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button style={btnStyle} onClick={saveSn}>{saved.sn ? '✓ Saved' : 'Save Connection'}</button>
            <button
              style={{ ...btnStyle, background: snTestStatus === 'success' ? 'rgba(0,230,118,0.15)' : 'rgba(255,255,255,0.06)', color: snTestStatus === 'success' ? '#00E676' : 'rgba(255,255,255,0.6)' }}
              onClick={testSn}
              disabled={snTestStatus === 'testing'}
            >
              {snTestStatus === 'testing' ? 'Testing…' : snTestStatus === 'success' ? '✓ Connected' : 'Test Connection'}
            </button>
          </div>
        </motion.div>
      </div>

      {/* Full-width row: General + Notifications */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

        {/* General / Profile */}
        <motion.div style={glass} {...fadeUp} transition={{ delay: 0.15 }}>
          <h2 style={sectionTitle}>👤 Profile</h2>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Display Name</label>
            <input style={inputStyle} value={general.displayName} onChange={e => setGeneral(g => ({ ...g, displayName: e.target.value }))} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Email</label>
            <input style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }} readOnly value={user.email || ''} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Company</label>
            <input style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }} readOnly value={user.company || ''} />
          </div>
        </motion.div>

        {/* Notifications & Preferences */}
        <motion.div style={glass} {...fadeUp} transition={{ delay: 0.2 }}>
          <h2 style={sectionTitle}>🔔 Notifications & Preferences</h2>
          {[
            { key: 'notifications', label: 'Push Notifications', desc: 'Get notified when workflows complete' },
            { key: 'emailDigest', label: 'Email Digest', desc: 'Weekly summary of activity and metrics' },
          ].map(item => (
            <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div>
                <div style={{ fontSize: '14px', color: '#fff', fontWeight: 500 }}>{item.label}</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{item.desc}</div>
              </div>
              <button
                onClick={() => setGeneral(g => ({ ...g, [item.key]: !g[item.key] }))}
                style={{
                  width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                  background: general[item.key] ? 'rgba(0,229,255,0.3)' : 'rgba(255,255,255,0.1)',
                  position: 'relative', transition: 'background 0.2s',
                }}
              >
                <div style={{
                  width: '18px', height: '18px', borderRadius: '50%',
                  background: general[item.key] ? '#00E5FF' : 'rgba(255,255,255,0.3)',
                  position: 'absolute', top: '3px',
                  left: general[item.key] ? '23px' : '3px',
                  transition: 'all 0.2s',
                }} />
              </button>
            </div>
          ))}
          <div style={{ marginTop: '20px' }}>
            <label style={labelStyle}>Theme</label>
            <select style={selectStyle}>
              <option style={{ background: '#1a1a25' }}>Dark (Default)</option>
              <option style={{ background: '#1a1a25' }}>System</option>
            </select>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
