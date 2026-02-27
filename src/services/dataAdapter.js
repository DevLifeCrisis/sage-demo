/**
 * SAGE Data Adapter
 * =================
 * Transforms ServiceNow API responses into the shapes expected by React views.
 */

// =============================================================================
// DASHBOARD ADAPTER
// =============================================================================

/**
 * Transform ServiceNow /dashboard/data response into DashboardView shape.
 *
 * Input:  { records: [...], summary: { total, active, completed, escalated, resolved, byIntent } }
 * Output: { summary: { totalItems, activeItems, completionPercentage, avgProcessingTime, avgProcessingTimeTrend },
 *           orchestrationCards: [{ id, title, number, status, type, assignedTo, priority, department, estimatedCompletion, description, created }] }
 */
export function transformDashboardData(raw) {
  const { records = [], summary = {} } = raw || {};

  const total = summary.total || records.length || 0;
  const completed = summary.completed || 0;
  const resolved = summary.resolved || 0;
  const active = summary.active || 0;
  const completionPercentage = total > 0 ? Math.round(((completed + resolved) / total) * 100) : 0;

  // Compute average processing time from records that have both started_at and ended_at
  const completedRecords = records.filter(r => r.started_at && r.ended_at);
  let avgProcessingTime = 0;
  if (completedRecords.length > 0) {
    const totalMinutes = completedRecords.reduce((sum, r) => {
      const start = new Date(r.started_at).getTime();
      const end = new Date(r.ended_at).getTime();
      return sum + (end - start) / 60000; // ms -> minutes
    }, 0);
    avgProcessingTime = totalMinutes / completedRecords.length;
  }

  // Map intent to type for cards
  const intentToType = {
    onboarding: 'hr',
    offboarding: 'hr',
    password_reset: 'it',
    access_request: 'it',
    general: 'manager',
    equipment: 'it',
  };

  // Map state to card status
  const stateToStatus = (state) => {
    const map = {
      active: 'active',
      open: 'active',
      completed: 'completed',
      resolved: 'completed',
      closed: 'completed',
      escalated: 'in-progress',
      pending: 'pending',
      new: 'pending',
    };
    return map[(state || '').toLowerCase()] || 'active';
  };

  const orchestrationCards = records.map((r) => ({
    id: r.sys_id,
    title: `${(r.intent || 'General').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} — ${r.user || 'Unknown User'}`,
    number: r.number || r.sys_id?.slice(0, 12),
    status: stateToStatus(r.state),
    type: intentToType[(r.intent || '').toLowerCase()] || 'manager',
    assignedTo: r.user || 'Unassigned',
    priority: r.turn_count > 10 ? 'High' : r.turn_count > 5 ? 'Medium' : 'Low',
    department: (r.intent || 'General').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    estimatedCompletion: r.ended_at
      ? new Date(r.ended_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : 'In Progress',
    description: `Channel: ${r.channel || 'N/A'} · Turns: ${r.turn_count || 0} · Outcome: ${r.outcome || 'Pending'} · Satisfaction: ${r.satisfaction ?? 'N/A'}`,
    created: r.started_at || new Date().toISOString(),
  }));

  return {
    summary: {
      totalItems: total,
      activeItems: active,
      completionPercentage,
      avgProcessingTime: Math.round(avgProcessingTime * 10) / 10,
      avgProcessingTimeTrend: null, // No historical data to compute trend
    },
    orchestrationCards,
  };
}


// =============================================================================
// METRICS ADAPTER
// =============================================================================

/**
 * Transform ServiceNow /metrics/data response into MetricsView shape.
 *
 * Input:  { cards: [], charts: { intentDistribution: {}, outcomeDistribution: {}, dailyVolume: [] } }
 * Output: { metrics: { deflectionRate, deflectionRateTrend, avgResolutionTime, avgResolutionTimeTrend,
 *                       totalConversations, totalConversationsTrend, complianceScore, complianceScoreTrend },
 *           charts: { barChart: [{ label, value }], lineChart: [{ month, value }] } }
 */
export function transformMetricsData(raw) {
  const { cards = [], charts = {} } = raw || {};
  const { intentDistribution = {}, outcomeDistribution = {}, dailyVolume = [] } = charts;

  // Build KPI metrics from cards array or derive from charts
  // cards may contain pre-computed values; use them if available
  const cardMap = {};
  cards.forEach(c => { cardMap[c.key || c.name] = c; });

  const totalConversations = Object.values(intentDistribution).reduce((s, v) => s + v, 0)
    || cardMap.totalConversations?.value || 0;

  // Deflection rate: resolved without escalation / total
  const resolved = outcomeDistribution.resolved || outcomeDistribution.Resolved || 0;
  const escalated = outcomeDistribution.escalated || outcomeDistribution.Escalated || 0;
  const deflectionRate = totalConversations > 0
    ? Math.round((resolved / totalConversations) * 100)
    : cardMap.deflectionRate?.value || 0;

  // Compliance score: approximate from outcome success rate
  const completedOutcomes = (outcomeDistribution.completed || 0) + resolved;
  const complianceScore = totalConversations > 0
    ? Math.round(((completedOutcomes / totalConversations) * 100) * 10) / 10
    : cardMap.complianceScore?.value || 98.5;

  // Avg resolution time from cards or placeholder
  const avgResolutionTime = cardMap.avgResolutionTime?.value || cardMap.avg_resolution_time?.value || 4.2;

  // Bar chart: intent distribution -> [{ label, value }]
  const barChart = Object.entries(intentDistribution).map(([label, value]) => ({
    label: label.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    value,
  }));

  // Line chart: dailyVolume -> aggregate by month or use directly
  let lineChart = [];
  if (dailyVolume.length > 0) {
    // Group by month
    const byMonth = {};
    dailyVolume.forEach(d => {
      const date = new Date(d.date || d.day);
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      byMonth[month] = (byMonth[month] || 0) + (d.count || d.value || 0);
    });
    lineChart = Object.entries(byMonth).map(([month, value]) => ({ month, value }));
  }

  // If no line data, generate placeholder
  if (lineChart.length === 0) {
    lineChart = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map(month => ({
      month,
      value: Math.round(deflectionRate + (Math.random() - 0.5) * 10),
    }));
  }

  return {
    metrics: {
      deflectionRate,
      deflectionRateTrend: cardMap.deflectionRate?.trend || 3,
      avgResolutionTime,
      avgResolutionTimeTrend: cardMap.avgResolutionTime?.trend || -5,
      totalConversations,
      totalConversationsTrend: cardMap.totalConversations?.trend || 12,
      complianceScore,
      complianceScoreTrend: cardMap.complianceScore?.trend || 0.5,
    },
    charts: { barChart, lineChart },
  };
}


// =============================================================================
// AUDIT ADAPTER
// =============================================================================

/**
 * Transform ServiceNow /audit/data response into AuditView shape.
 *
 * Input:  { entries: [{ sys_id, action_type, action_detail, target_record, performed_by, category, timestamp, conversation }],
 *           stats: { total, byActionType, byCategory, byStatus, byPerformer } }
 * Output: { auditTrail: [{ id, timestamp, category, priority, title, description, status }],
 *           completionStatus: { completionPercentage, completedActions, totalActions, totalDurationMinutes } }
 */
export function transformAuditData(raw) {
  const { entries = [], stats = {} } = raw || {};

  // Map action_type to priority
  const actionPriority = (type) => {
    const map = {
      create: 'medium',
      update: 'low',
      delete: 'high',
      escalate: 'critical',
      escalation: 'critical',
      resolve: 'medium',
      access_grant: 'high',
      access_revoke: 'critical',
      compliance_check: 'high',
    };
    return map[(type || '').toLowerCase()] || 'medium';
  };

  // Map to status from action_type
  const actionStatus = (type) => {
    const map = {
      create: 'completed',
      update: 'in-progress',
      delete: 'completed',
      escalate: 'pending',
      escalation: 'pending',
      resolve: 'completed',
      access_grant: 'completed',
      access_revoke: 'completed',
      compliance_check: 'in-progress',
    };
    return map[(type || '').toLowerCase()] || 'completed';
  };

  const auditTrail = entries.map((e) => ({
    id: e.sys_id,
    timestamp: e.timestamp,
    category: mapCategory(e.category),
    priority: actionPriority(e.action_type),
    title: `${(e.action_type || 'Action').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} — ${e.target_record || 'Record'}`,
    description: e.action_detail || `Performed by ${e.performed_by || 'System'}`,
    status: actionStatus(e.action_type),
  }));

  // Completion status from stats
  const totalActions = stats.total || entries.length;
  const completedByStatus = stats.byStatus?.completed || stats.byStatus?.Completed || 0;
  const completedActions = completedByStatus || auditTrail.filter(e => e.status === 'completed').length;
  const completionPercentage = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;

  // Approximate total duration: assume ~2 min per action
  const totalDurationMinutes = totalActions * 2.0;

  return {
    auditTrail,
    completionStatus: {
      completionPercentage,
      completedActions,
      totalActions,
      totalDurationMinutes: Math.round(totalDurationMinutes * 10) / 10,
    },
  };
}

/**
 * Map ServiceNow category strings to the categories the UI expects.
 */
function mapCategory(cat) {
  if (!cat) return 'IT';
  const normalized = cat.toLowerCase();
  if (normalized.includes('hr') || normalized.includes('human') || normalized.includes('onboard') || normalized.includes('offboard')) return 'HR';
  if (normalized.includes('security') || normalized.includes('access')) return 'Security';
  if (normalized.includes('compliance') || normalized.includes('audit')) return 'Compliance';
  return 'IT';
}
