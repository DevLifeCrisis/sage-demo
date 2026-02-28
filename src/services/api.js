/**
 * SAGE API Client - React Frontend
 * ==================================
 * 
 * Real implementations targeting ServiceNow Scripted REST API.
 * Base path: /api/x_ecsf_gov_forum/sage
 * 
 * CONFIGURATION:
 * - For same-origin (ServiceNow UI Page or Service Portal widget): leave INSTANCE_URL empty
 * - For cross-origin (Vercel/external deployment): set INSTANCE_URL to your SN instance
 * 
 * AUTHENTICATION:
 * - Same-origin: Uses ServiceNow session cookies automatically
 * - Cross-origin: Set credentials to 'include' and ensure CORS is configured,
 *   OR use Basic Auth header (less secure, for dev only)
 * 
 * ENVIRONMENT VARIABLES (for Vercel/external):
 * - REACT_APP_SN_INSTANCE_URL: e.g., https://yourinstance.service-now.com
 * - REACT_APP_SN_AUTH_TOKEN: (optional) Basic auth token for dev
 */

// --- Configuration ---
// Vite uses import.meta.env.VITE_* (not process.env.REACT_APP_*)
const INSTANCE_URL = import.meta.env.VITE_SN_INSTANCE_URL || '';
const BASE_URL = INSTANCE_URL + '/api/x_ecsf_gov_forum/sage';
const AUTH_TOKEN = import.meta.env.VITE_SN_AUTH_TOKEN || '';

/**
 * Internal fetch wrapper with auth and error handling.
 */
async function sageFetch(endpoint, options = {}) {
  const url = BASE_URL + endpoint;

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(options.headers || {}),
  };

  // Add Basic Auth header if token is configured (dev/external use only)
  if (AUTH_TOKEN) {
    headers['Authorization'] = 'Basic ' + AUTH_TOKEN;
  }

  const fetchOptions = {
    ...options,
    headers,
    // Include cookies for same-origin ServiceNow session auth
    // For cross-origin, CORS must allow credentials
    credentials: INSTANCE_URL ? 'include' : 'same-origin',
  };

  try {
    const res = await fetch(url, fetchOptions);

    if (!res.ok) {
      const errorBody = await res.text();
      console.error(`SAGE API error [${res.status}] ${endpoint}:`, errorBody);
      throw new Error(`API request failed: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();

    // ServiceNow wraps responses in { result: ... } — unwrap if present
    return data.result !== undefined ? data.result : data;
  } catch (error) {
    console.error(`SAGE API fetch error for ${endpoint}:`, error);
    throw error;
  }
}


// =============================================================================
// CONVERSATION ENDPOINTS
// =============================================================================

/**
 * Start a new conversation session.
 * @returns {Promise<{conversationId: string}>}
 */
export async function startConversation() {
  return sageFetch('/conversation/start', { method: 'POST', body: JSON.stringify({}) });
}

/* --- MOCK FALLBACK ---
export async function startConversation() {
  return { conversationId: 'mock-conv-' + Date.now() };
}
--- END MOCK --- */


/**
 * Send a text message in an existing conversation.
 * @param {string} conversationId
 * @param {string} message
 * @returns {Promise<{message: string, choices: Array, actionCard: Object|null, flow: Object, collectedData: Object, activeRecords: Array}>}
 */
export async function sendMessage(conversationId, message) {
  return sageFetch('/conversation/message', {
    method: 'POST',
    body: JSON.stringify({ conversationId, message }),
  });
}

/* --- MOCK FALLBACK ---
export async function sendMessage(conversationId, message) {
  return {
    message: 'Mock response to: ' + message,
    choices: [],
    actionCard: null,
    flow: { intent: 'general', currentStep: 0, totalSteps: 0, completedSteps: [] },
    collectedData: {},
    activeRecords: [],
  };
}
--- END MOCK --- */


/**
 * Send a choice selection in an existing conversation.
 * @param {string} conversationId
 * @param {string} choice
 * @returns {Promise<{message: string, choices: Array, actionCard: Object|null, flow: Object, collectedData: Object, activeRecords: Array}>}
 */
export async function sendChoice(conversationId, choice) {
  return sageFetch('/conversation/choice', {
    method: 'POST',
    body: JSON.stringify({ conversationId, choice }),
  });
}

/* --- MOCK FALLBACK ---
export async function sendChoice(conversationId, choice) {
  return {
    message: 'You selected: ' + choice,
    choices: [],
    actionCard: null,
    flow: { intent: 'general', currentStep: 0, totalSteps: 0, completedSteps: [] },
    collectedData: {},
    activeRecords: [],
  };
}
--- END MOCK --- */


/**
 * Confirm or decline an action in an existing conversation.
 * @param {string} conversationId
 * @param {string} actionId
 * @param {boolean} confirmed
 * @returns {Promise<{message: string, choices: Array, actionCard: Object|null, flow: Object, collectedData: Object, activeRecords: Array}>}
 */
export async function sendAction(conversationId, actionId, confirmed) {
  return sageFetch('/conversation/action', {
    method: 'POST',
    body: JSON.stringify({ conversationId, actionId, confirmed }),
  });
}

/* --- MOCK FALLBACK ---
export async function sendAction(conversationId, actionId, confirmed) {
  return {
    message: confirmed ? 'Action confirmed.' : 'Action cancelled.',
    choices: [],
    actionCard: null,
    flow: { intent: 'general', currentStep: 0, totalSteps: 0, completedSteps: [] },
    collectedData: {},
    activeRecords: [],
  };
}
--- END MOCK --- */


// =============================================================================
// DEMO ENDPOINTS
// =============================================================================

/**
 * Seed demo data into ServiceNow tables.
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function startDemo() {
  return sageFetch('/demo/start', { method: 'POST', body: JSON.stringify({}) });
}

/* --- MOCK FALLBACK ---
export async function startDemo() {
  return { success: true, message: 'Mock demo started' };
}
--- END MOCK --- */


/**
 * Clear all demo data from ServiceNow tables.
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function resetDemo() {
  return sageFetch('/demo/reset', { method: 'POST', body: JSON.stringify({}) });
}

/* --- MOCK FALLBACK ---
export async function resetDemo() {
  return { success: true, message: 'Mock demo reset' };
}
--- END MOCK --- */


/**
 * Get demo mode status.
 * @returns {Promise<{demoMode: boolean, state: Object}>}
 */
export async function getDemoStatus() {
  return sageFetch('/demo/status', { method: 'GET' });
}

/* --- MOCK FALLBACK ---
export async function getDemoStatus() {
  return { demoMode: false, state: {} };
}
--- END MOCK --- */


// =============================================================================
// DASHBOARD / AUDIT / METRICS ENDPOINTS
// =============================================================================

/**
 * Get dashboard data (conversation records and summary).
 * @returns {Promise<{records: Array, summary: Object}>}
 */
export async function getDashboardData() {
  return sageFetch('/dashboard/data', { method: 'GET' });
}

/* --- MOCK FALLBACK ---
export async function getDashboardData() {
  return { records: [], summary: { total: 0, active: 0, completed: 0, escalated: 0, resolved: 0, byIntent: {} } };
}
--- END MOCK --- */


/**
 * Get audit log data (entries and stats).
 * @returns {Promise<{entries: Array, stats: Object}>}
 */
export async function getAuditData() {
  return sageFetch('/audit/data', { method: 'GET' });
}

/* --- MOCK FALLBACK ---
export async function getAuditData() {
  return { entries: [], stats: { total: 0, byActionType: {}, byCategory: {}, byStatus: {}, byPerformer: {} } };
}
--- END MOCK --- */


/**
 * Get metrics data (cards and charts).
 * @returns {Promise<{cards: Array, charts: Object}>}
 */
export async function getMetricsData() {
  return sageFetch('/metrics/data', { method: 'GET' });
}

/* --- MOCK FALLBACK ---
export async function getMetricsData() {
  return { cards: [], charts: { intentDistribution: {}, outcomeDistribution: {}, dailyVolume: [] } };
}
--- END MOCK --- */

// =============================================================================
// MY ITEMS ENDPOINT
// =============================================================================

/**
 * Get current user's incidents, requests, and HR cases.
 * @returns {Promise<{items: Array}>}
 */
export async function getMyItems() {
  return sageFetch('/my-items', { method: 'GET' });
}

// Alias for backward compatibility with ChatView
export async function confirmAction(conversationId, confirmed) {
  return sendAction(conversationId, "pending", confirmed);
}

// =============================================================================
// TRANSFORMED DATA FETCHERS (used by views)
// =============================================================================

import { transformDashboardData, transformMetricsData, transformAuditData } from './dataAdapter.js';

/**
 * Fetch dashboard data and transform to DashboardView shape.
 */
export async function fetchDashboardData() {
  const raw = await getDashboardData();
  return transformDashboardData(raw);
}

/**
 * Fetch audit data and transform to AuditView shape.
 */
export async function fetchAuditData() {
  const raw = await getAuditData();
  return transformAuditData(raw);
}

/**
 * Fetch metrics data and transform to MetricsView shape.
 */
export async function fetchMetricsData() {
  const raw = await getMetricsData();
  return transformMetricsData(raw);
}
