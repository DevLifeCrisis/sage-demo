// ============================================================
// LLM Service — Routes chat to the configured provider
// ============================================================

const SAGE_SYSTEM_PROMPT = `You are SAGE (Smart Agent for Guided Experiences), an AI-powered ServiceNow assistant built by ECS Technologies.

Your capabilities:
- Employee onboarding and offboarding workflows
- IT support ticket creation and troubleshooting
- ServiceNow record management (incidents, requests, cases)
- Workflow orchestration and automation
- Compliance and audit trail management

You are helpful, concise, and professional. When a user asks about onboarding, offboarding, IT support, or any ServiceNow workflow, guide them through the process step by step.

Keep responses focused and actionable. You're talking to enterprise IT professionals and government employees.`;

// Provider-specific API calls
async function callClaude(apiKey, messages, model = 'claude-haiku-4-5-20251001') {
  const res = await fetch('/api/anthropic/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      system: SAGE_SYSTEM_PROMPT,
      messages: messages.map(m => ({
        role: m.role === 'sage' ? 'assistant' : 'user',
        content: m.text,
      })),
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API error ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data.content?.[0]?.text || 'No response from Claude.';
}

async function callOpenAI(apiKey, messages, model = 'gpt-4o-mini') {
  const res = await fetch('/api/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      messages: [
        { role: 'system', content: SAGE_SYSTEM_PROMPT },
        ...messages.map(m => ({
          role: m.role === 'sage' ? 'assistant' : 'user',
          content: m.text,
        })),
      ],
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || 'No response from OpenAI.';
}

async function callGemini(apiKey, messages) {
  const res = await fetch(`/api/gemini/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SAGE_SYSTEM_PROMPT }] },
      contents: messages.map(m => ({
        role: m.role === 'sage' ? 'model' : 'user',
        parts: [{ text: m.text }],
      })),
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from Gemini.';
}

/**
 * Send a message to the configured LLM provider.
 * @param {string} text - User message
 * @param {Array} history - Previous messages [{role, text}, ...]
 * @returns {string} LLM response text
 */
export async function sendToLLM(text, history = []) {
  let config;
  try {
    config = JSON.parse(localStorage.getItem('sage_llm_config') || '{}');
  } catch {
    config = {};
  }

  const provider = config.provider;
  const apiKey = config.credentials?.apiKey;

  if (!provider || !apiKey) {
    return null; // No LLM configured — caller should fall back to mock
  }

  const messages = [...history, { role: 'user', text }];

  switch (provider) {
    case 'claude':
      return callClaude(apiKey, messages);
    case 'openai':
      return callOpenAI(apiKey, messages);
    case 'gemini':
      return callGemini(apiKey, messages);
    case 'nowassist':
      return null; // NowAssist requires SN instance — not yet implemented
    default:
      return null;
  }
}
