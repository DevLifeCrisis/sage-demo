# SAGE React App — QA Report

**Date:** 2026-02-17  
**Reviewer:** Automated QA (Subagent)  
**Files Reviewed:** 51

---

## 🔴 Critical Issues

### 1. Routes use placeholder components instead of real views
**File:** `src/main.jsx`  
**Severity:** 🔴 Critical  
**Issue:** `main.jsx` defines local `Placeholder` components for all 4 routes (`Chat`, `Dashboard`, `Audit`, `Metrics`) instead of importing the actual view components that exist in `src/views/`. The real `ChatView`, `DashboardView`, `AuditView`, and `MetricsView` are never used.

**Fix:**
```jsx
import ChatView from './views/ChatView';
import DashboardView from './views/DashboardView';
import AuditView from './views/AuditView';
import MetricsView from './views/MetricsView';

// Then in routes:
<Route path="chat" element={<ChatView />} />
<Route path="dashboard" element={<DashboardView />} />
<Route path="audit" element={<AuditView />} />
<Route path="metrics" element={<MetricsView />} />
```

### 2. Views import non-existent API functions
**File:** `src/views/DashboardView.jsx`, `src/views/AuditView.jsx`, `src/views/MetricsView.jsx`  
**Severity:** 🔴 Critical  
**Issue:** Views import `fetchDashboardData`, `fetchAuditData`, and `fetchMetricsData` from `../services/api.js`, but the API file exports `getDashboardData`, `getAuditTrail`, and `getMetrics` respectively. These are named import mismatches — the app will crash at runtime.

**Fix:** Either rename the exports in `api.js` or update the imports:
- `DashboardView.jsx`: `import { getDashboardData as fetchDashboardData } from '../services/api.js'` or rename in api.js
- `AuditView.jsx`: `import { getAuditTrail as fetchAuditData } from '../services/api.js'`
- `MetricsView.jsx`: `import { getMetrics as fetchMetricsData } from '../services/api.js'`

### 3. API mock data shapes don't match what views expect
**File:** `src/services/api.js` → `src/views/DashboardView.jsx`  
**Severity:** 🔴 Critical  
**Issue:** `getDashboardData()` returns `{ openIncidents, pendingApprovals, activeChanges, slaCompliance, recentIncidents }` but `DashboardView` expects `{ summary: { totalItems, activeItems, completionPercentage, avgProcessingTime, avgProcessingTimeTrend }, orchestrationCards: [{ id, title, number, status, type, assignedTo, priority, department, estimatedCompletion, description, created }] }`. Completely different shape.

**Fix:** Rewrite the mock `getDashboardData()` to return the shape DashboardView expects, or update DashboardView. Same issue applies to:
- `getAuditTrail()` returns flat array, but `AuditView` expects `{ auditTrail: [{ id, category, priority, title, description, status, timestamp }], completionStatus: { completionPercentage, completedActions, totalActions, totalDurationMinutes } }`
- `getMetrics()` returns `{ avgResolutionTime, firstContactResolution, ... }` but `MetricsView` expects `{ metrics: { deflectionRate, deflectionRateTrend, avgResolutionTime, avgResolutionTimeTrend, totalConversations, totalConversationsTrend, complianceScore, complianceScoreTrend }, charts: { barChart: [{ label, value }], lineChart: [{ month, value }] } }`

### 4. ChatView API response shape mismatch  
**File:** `src/views/ChatView.jsx` + `src/services/api.js`  
**Severity:** 🔴 Critical  
**Issue:** `ChatView.handleApiResponse` expects `{ message, choices, actionCard, flow, collectedData, activeRecords }` but `sendMessage()` returns `{ id, role, content, timestamp, actions }`. The response uses `content` not `message`, and has `actions` not `choices`/`actionCard`. Messages will display as `undefined`.

**Fix:** Align the mock API to return the expected shape:
```js
export async function sendMessage(text) {
  await delay(800);
  return {
    message: `I understand you're asking about "${text}".`,
    choices: [{ label: 'Create Incident', value: 'create_incident' }],
    actionCard: null,
  };
}
```

### 5. TimelineEntry references non-existent theme properties
**File:** `src/components/audit/TimelineEntry.jsx`  
**Severity:** 🔴 Critical  
**Issue:** References `theme.colors.teal` (expects a string), `theme.colors.tealDim`, `theme.colors.amber`, `theme.colors.amberDim`, `theme.colors.blue`, `theme.colors.blueDim`, `theme.colors.green`, `theme.colors.greenDim`, `theme.colors.red`, `theme.colors.textDimmed`, `theme.colors.tealGlow`, `theme.colors.white`, `theme.colors.border`, `theme.shadow.glow`. None of these exist in `theme.js`. The theme uses `theme.colors.teal[500]`, `theme.colors.status.success`, etc.

**Fix:** Update TimelineEntry to use actual theme tokens:
```js
const categoryColors = {
  HR: { color: theme.colors.teal[500], bg: theme.colors.teal.glow },
  Security: { color: theme.colors.status.warning, bg: 'rgba(255,214,0,0.1)' },
  IT: { color: theme.colors.status.info, bg: 'rgba(0,229,255,0.1)' },
  Compliance: { color: theme.colors.status.success, bg: 'rgba(0,230,118,0.1)' },
};
```

### 6. ProgressRing and SummaryCard reference non-existent theme properties
**File:** `src/components/dashboard/ProgressRing.jsx`, `SummaryCard.jsx`  
**Severity:** 🔴 Critical  
**Issue:** `ProgressRing` references `theme.colors.teal` (string), `theme.colors.border`, `theme.colors.white`. `SummaryCard` references `theme.colors.green`, `theme.colors.red`, `theme.colors.textDimmed`, `theme.colors.white`. These flat color properties don't exist in theme.js.

**Fix:** Use correct paths: `theme.colors.teal[500]`, `theme.colors.glass.border`, `theme.colors.text.primary`, `theme.colors.status.success`, `theme.colors.status.error`, `theme.colors.text.tertiary`.

### 7. KPICard references non-existent theme properties
**File:** `src/components/metrics/KPICard.jsx`  
**Severity:** 🔴 Critical  
**Issue:** Same pattern — `theme.colors.textDimmed`, `theme.colors.green`, `theme.colors.red`, `theme.colors.white` don't exist.

---

## 🟡 Medium Issues

### 8. StatusBadge prop mismatch across consumers
**File:** `src/components/StatusBadge.jsx`, `src/components/audit/TimelineEntry.jsx`, `src/components/dashboard/OrchestrationCard.jsx`  
**Severity:** 🟡 Medium  
**Issue:** `StatusBadge` accepts `variant` prop (`success`, `warning`, `error`, `info`, `pending`). But `TimelineEntry` and `OrchestrationCard` pass `status` prop instead of `variant`. The badge will always render as `info` default.

**Fix:** Change callers to use `variant`:
```jsx
<StatusBadge variant={entry.status} />  // TimelineEntry
<StatusBadge variant={card.status} />   // OrchestrationCard
```
Or map status values to valid variants.

### 9. GlassPanel receives unsupported props
**File:** `src/components/GlassPanel.jsx`, used with `hover` and `whileHover` in `TimelineEntry`, `OrchestrationCard`  
**Severity:** 🟡 Medium  
**Issue:** `GlassPanel` doesn't accept `hover`, `whileHover`, or `onClick` props. It spreads `...rest` to the motion.div, so `whileHover` will work on the motion path but `hover` is ignored (no-op). `onClick` will work via rest spread. Not broken but `hover` prop is dead code.

### 10. MessageBubble reads `message.text` but API returns `message.content`
**File:** `src/components/chat/MessageBubble.jsx`  
**Severity:** 🟡 Medium  
**Issue:** The component renders `{message.text}`. ChatView constructs messages with `text` property, so this works for the current mock flow. But if switching to real API responses that use `content`, it'll break. Currently consistent internally.

### 11. `confirmAction` API function signature mismatch
**File:** `src/views/ChatView.jsx` → `src/services/api.js`  
**Severity:** 🟡 Medium  
**Issue:** ChatView calls `confirmAction('current', true)` and `confirmAction('current', false)` with 2 args, but the mock `confirmAction(actionId)` only takes 1. The second arg is silently ignored, and the cancel path still returns success data. Should return different shapes for confirm vs cancel.

### 12. Missing `useEffect` cleanup in views
**File:** `src/views/DashboardView.jsx`, `AuditView.jsx`, `MetricsView.jsx`  
**Severity:** 🟡 Medium  
**Issue:** All three views call `.then(setData)` in useEffect without cleanup. If the component unmounts before the promise resolves, React will warn about setting state on an unmounted component.

**Fix:** Use an abort pattern:
```js
useEffect(() => {
  let cancelled = false;
  fetchData().then(d => { if (!cancelled) setData(d); });
  return () => { cancelled = true; };
}, []);
```

### 13. CSS hardcoded colors instead of theme tokens
**File:** `src/components/chat/chat.module.css`, `Timeline.module.css`, `OrchestrationCard.module.css`, `SummaryCard.module.css`, `Metrics.module.css`  
**Severity:** 🟡 Medium  
**Issue:** CSS modules necessarily use hardcoded hex values (`#00E5FF`, `#00E676`, `rgba(0,229,255,...)`) since CSS modules can't reference JS theme tokens. This is an architectural limitation — not a bug per se, but creates maintenance burden. The hardcoded values do match the theme's teal `#00E5FF` and green `#00E676`.

**Recommendation:** Consider CSS custom properties (`:root { --teal-500: #00E5FF; }`) in `global.css` synced with theme.js, then reference `var(--teal-500)` in modules.

### 14. TopoBg uses direct DOM manipulation
**File:** `src/components/TopoBg.jsx`  
**Severity:** 🟡 Medium  
**Issue:** Uses `svg.querySelectorAll('path')` and `p.setAttribute('d', d)` — direct DOM manipulation in React. Works because it's a background animation, but violates React patterns. Could cause issues with strict mode double-rendering.

### 15. `sendMessage` mock returns `role: 'assistant'` but chat expects `role: 'sage'`
**File:** `src/services/api.js` vs `src/components/chat/MessageList.jsx`  
**Severity:** 🟡 Medium  
**Issue:** `MessageList` checks `msg.role === 'sage'` to decide whether to show choices/actionCard. The mock API returns `role: 'assistant'`. Even after fixing the response shape, choices/actionCards won't render unless role is `'sage'`.

---

## 🟢 Minor Issues

### 16. `useDemo` hook not consuming `useOutletContext` in views
**File:** `src/App.jsx`, view components  
**Severity:** 🟢 Minor  
**Issue:** `App.jsx` passes `{ demoState, startDemo, resetDemo }` via `<Outlet context={...} />` but none of the views use `useOutletContext()` to consume it. Not a bug — just unused context passing.

### 17. Button component uses `document.createElement` for ripple
**File:** `src/components/Button.jsx`  
**Severity:** 🟢 Minor  
**Issue:** Creates DOM elements directly for ripple effect. Works but is un-React-like. Consider a CSS-only or React state-based ripple.

### 18. `MessageList` uses array index as key
**File:** `src/components/chat/MessageList.jsx`  
**Severity:** 🟢 Minor  
**Issue:** `key={i}` on messages. Since messages only append (never reorder/delete), this works in practice. Ideally use a unique message ID.

### 19. Vite config missing `chunkFileNames` 
**File:** `vite.config.js`  
**Severity:** 🟢 Minor  
**Issue:** `inlineDynamicImports: true` means no chunks, so `chunkFileNames` isn't needed. Config is correct for single-bundle ServiceNow deployment. ✅

### 20. `SAGELLMProvider.classify()` references `raw` outside try scope
**File:** `servicenow/script-includes/SAGELLMProvider.js`  
**Severity:** 🟢 Minor  
**Issue:** The fallback section after the catch block references `raw` which was declared inside the try block. In ES5 with `var` hoisting this actually works (var is function-scoped), but the value may be undefined if the try block threw before assignment.

### 21. Demo seeder `_seedSampleContexts` instantiates `SAGEContextStore` without scope check
**File:** `servicenow/demo-seeder/SAGEDemoSeeder.js`  
**Severity:** 🟢 Minor  
**Issue:** `new SAGEContextStore()` assumes the Script Include is in scope. In ServiceNow this works via global scope resolution, but should be noted.

---

## ✅ ServiceNow Code Quality

### ES5 Compliance ✅
All 7 ServiceNow files use proper ES5: `var` declarations, `function()` expressions, string concatenation (no template literals), no destructuring, no arrow functions, no `const`/`let`, no `async`/`await`.

### Class.create() Pattern ✅
All 5 Script Includes use correct `Class.create()` with `initialize`, `type` property, and `prototype` pattern.

### GlideRecord Usage ✅
Correct API usage throughout: `initialize()`, `addQuery()`, `query()`, `next()`, `insert()`, `update()`, `getValue()`, `setValue()`, `getUniqueValue()`, `deleteRecord()`, `isValid()`, `setLimit()`.

### Response Contract ✅ (with caveats)
`SAGEConversationEngine` returns `{ message, choices?, actionCard?, context }` which matches the documented contract. The React UI just needs to consume it correctly (see Critical issues above).

### REST API ✅
All 10 resource scripts correctly parse `request.body.data`, use try/catch with proper HTTP status codes (400, 500, 200), and have consistent error response shapes.

### Context Store ✅
Correctly serializes/deserializes JSON via `JSON.stringify`/`JSON.parse`. Proper shallow merge on update. Cleanup method for expired contexts.

### Demo Seeder ✅
Tags records with `u_sage_generated: 'true'` and has cleanup by tag + username pattern fallback.

### Now Assist Integration ✅
`SAGELLMProvider` tries 3 strategies: `sn_gen_ai.GenAiController`, `sn_gen_ai.GenAiService`, `GlideAIService` — good multi-release compatibility.

---

## 📦 Conflicts Section

### Potentially Overwritten Files (4-agent parallel build)

Since 4 agents built in parallel, these shared files may have been written multiple times:

| File | Risk | Assessment |
|------|------|------------|
| `src/styles/theme.js` | High | Current version is comprehensive and well-structured. **Keep as-is.** |
| `src/components/GlassPanel.jsx` | High | Clean implementation with animate toggle. **Keep as-is.** |
| `src/components/AnimatedCounter.jsx` | Medium | Uses framer-motion `animate` + `useInView`. **Keep as-is.** |
| `src/components/StatusBadge.jsx` | Medium | Current version uses `variant` prop. Consumers pass `status` — needs alignment (see issue #8). |
| `src/services/api.js` | High | **CONFLICT DETECTED.** The mock API was likely written by the shell/infrastructure agent with generic ITSM shapes, but the view agents expected SAGE-specific shapes. The views were built to different data contracts than what api.js provides. **Resolution: api.js must be rewritten to match view expectations.** |

### No Missing Files
All imported files exist. No broken file references detected.

---

## 📋 Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical | 7 |
| 🟡 Medium | 8 |
| 🟢 Minor | 6 |

### Top Priority Fixes (in order):
1. **Wire up real views in `main.jsx`** — Remove placeholder components, import actual views
2. **Fix API function name mismatches** — `fetchDashboardData` → `getDashboardData`, etc.
3. **Rewrite mock API data shapes** — Match what each view actually destructures
4. **Fix theme property references** — ~15 references to non-existent flat theme properties across dashboard/audit/metrics components
5. **Fix StatusBadge prop name** — Consumers use `status`, component expects `variant`
6. **Fix ChatView API contract** — `content` → `message`, `role: 'assistant'` → `role: 'sage'`
