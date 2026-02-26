// ============================================================
// SAGE API Service Layer
// Mock implementations — swap with real fetch calls when deployed
// ============================================================

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// ----- Config -----
const BASE_URL = '/api/x_ecs_sage/sage';

// ============================================================
// MOCK IMPLEMENTATIONS
// All shapes match exactly what views/components expect
// ============================================================

// --- Chat ---

export async function sendMessage(text) {
  await delay(800 + Math.random() * 600);
  const lower = text.toLowerCase();

  // Onboarding intent
  if (lower.includes('onboard') || lower.includes('new hire') || lower.includes('new employee') || lower.includes('starting')) {
    return {
      message: "I'd be happy to help with employee onboarding! Let me gather some information to get everything set up. What department will the new employee be joining?",
      choices: [
        { label: 'Engineering', value: 'engineering' },
        { label: 'Human Resources', value: 'hr' },
        { label: 'Finance', value: 'finance' },
        { label: 'IT / Technology', value: 'it' },
      ],
      actionCard: null,
      flow: { intent: 'onboarding', currentStep: 'department_selection', totalSteps: 5, completedSteps: 1 },
      collectedData: {},
      activeRecords: [],
    };
  }

  // Offboarding intent
  if (lower.includes('offboard') || lower.includes('leaving') || lower.includes('contractor') || lower.includes('departure')) {
    return {
      message: "I can help manage the offboarding process. I'll ensure all security and compliance steps are completed. Is this for an employee or a contractor?",
      choices: [
        { label: 'Employee', value: 'employee_offboard' },
        { label: 'Contractor', value: 'contractor_offboard' },
      ],
      actionCard: null,
      flow: { intent: 'offboarding', currentStep: 'type_selection', totalSteps: 4, completedSteps: 1 },
      collectedData: {},
      activeRecords: [],
    };
  }

  // IT support intent
  if (lower.includes('vpn') || lower.includes('issue') || lower.includes('problem') || lower.includes('support') || lower.includes('help') || lower.includes('not working')) {
    return {
      message: "I can help troubleshoot that. What type of issue are you experiencing?",
      choices: [
        { label: 'VPN / Connectivity', value: 'vpn' },
        { label: 'Email Issues', value: 'email' },
        { label: 'Software Problem', value: 'software' },
        { label: 'Hardware Issue', value: 'hardware' },
      ],
      actionCard: null,
      flow: { intent: 'it_support', currentStep: 'issue_type', totalSteps: 4, completedSteps: 1 },
      collectedData: {},
      activeRecords: [],
    };
  }

  // Department selection (onboarding flow continuation)
  if (['engineering', 'hr', 'finance', 'it', 'operations'].includes(lower)) {
    return {
      message: `Great, ${text} department. And what is the employee's expected start date?`,
      choices: [
        { label: 'This Monday', value: 'this_monday' },
        { label: 'Next Monday', value: 'next_monday' },
        { label: 'In 2 Weeks', value: 'two_weeks' },
      ],
      actionCard: null,
      flow: { intent: 'onboarding', currentStep: 'start_date', totalSteps: 5, completedSteps: 2 },
      collectedData: { department: text },
      activeRecords: [],
    };
  }

  // Start date selection (triggers action execution)
  if (lower.includes('monday') || lower.includes('weeks')) {
    return {
      message: "I have everything I need. Here's what I'll set up for the new employee:",
      choices: null,
      actionCard: {
        type: 'checklist',
        title: 'Onboarding Actions',
        items: [
          { label: 'Create HR onboarding case', status: 'completed', detail: 'HR-00142' },
          { label: 'Submit IT equipment request', status: 'completed', detail: 'REQ-00891' },
          { label: 'Assign manager orientation task', status: 'completed', detail: 'TASK-00334' },
          { label: 'Send welcome email to employee', status: 'completed', detail: '' },
          { label: 'Schedule Day 1 orientation', status: 'completed', detail: '' },
        ],
      },
      flow: { intent: 'onboarding', currentStep: 'execution', totalSteps: 5, completedSteps: 5 },
      collectedData: { department: 'IT', startDate: text, employeeName: 'Jennifer Rodriguez' },
      activeRecords: [
        { number: 'HR-00142', table: 'HR Case', status: 'Active' },
        { number: 'REQ-00891', table: 'IT Request', status: 'Open' },
        { number: 'TASK-00334', table: 'Manager Task', status: 'Pending' },
      ],
    };
  }

  // Default
  return {
    message: "I can help with several services. What would you like to do?",
    choices: [
      { label: 'Employee Onboarding', value: 'employee onboarding' },
      { label: 'Contractor Offboarding', value: 'contractor offboarding' },
      { label: 'IT Support', value: 'it support' },
    ],
    actionCard: null,
    flow: null,
    collectedData: {},
    activeRecords: [],
  };
}

export async function sendChoice(choice) {
  // Route choice through sendMessage so the flow logic works
  return sendMessage(choice.value || choice.label || choice);
}

export async function confirmAction(actionId, confirmed) {
  await delay(1200);
  if (!confirmed) {
    return {
      message: 'Action cancelled. How else can I help you?',
      choices: [
        { label: 'Employee Onboarding', value: 'employee onboarding' },
        { label: 'Contractor Offboarding', value: 'contractor offboarding' },
        { label: 'IT Support', value: 'it support' },
      ],
      actionCard: null,
    };
  }
  return {
    message: 'All actions have been executed successfully. The records are now available in the Orchestration Dashboard.',
    choices: null,
    actionCard: {
      type: 'checklist',
      title: 'Completed Actions',
      items: [
        { label: 'HR onboarding case created', status: 'completed', detail: 'HR-00142' },
        { label: 'IT equipment request submitted', status: 'completed', detail: 'REQ-00891' },
        { label: 'Manager task assigned', status: 'completed', detail: 'TASK-00334' },
      ],
    },
  };
}

// --- Demo ---

export async function startDemo() {
  await delay(2000);
  return { success: true, recordsSeeded: 47, message: 'Demo environment ready' };
}

export async function resetDemo() {
  await delay(1000);
  return { success: true, cleanedRecords: 12 };
}

// --- Dashboard ---
// Returns: { summary, orchestrationCards }

export async function fetchDashboardData() {
  await delay(600);
  return {
    summary: {
      totalItems: 3,
      activeItems: 1,
      completionPercentage: 67,
      avgProcessingTime: 4.2,
      avgProcessingTimeTrend: '-18%',
    },
    orchestrationCards: [
      {
        id: 'hr_001',
        type: 'hr',
        title: 'HR Onboarding Case',
        number: 'HR-00142',
        status: 'Active',
        assignedTo: 'HR Operations',
        priority: 'Medium',
        department: 'Human Resources',
        estimatedCompletion: '2 business days',
        description: 'New employee onboarding case for contractor position.',
        created: 'Just now',
      },
      {
        id: 'it_001',
        type: 'it',
        title: 'IT Equipment Request',
        number: 'REQ-00891 / RITM-00445',
        status: 'Open',
        assignedTo: 'IT Provisioning',
        priority: 'High',
        department: 'Information Technology',
        estimatedCompletion: '3 business days',
        description: 'Standard workstation setup including laptop, monitor, and peripherals.',
        created: 'Just now',
      },
      {
        id: 'mgr_001',
        type: 'manager',
        title: 'Manager Orientation Task',
        number: 'TASK-00334',
        status: 'Pending',
        assignedTo: 'Sarah Chen (Manager)',
        priority: 'Medium',
        department: 'Management',
        estimatedCompletion: '1 business day',
        description: 'Manager orientation and initial team introduction for new employee.',
        created: 'Just now',
      },
    ],
  };
}

// --- Audit Trail ---
// Returns: { auditTrail, completionStatus }

export async function fetchAuditData() {
  await delay(500);
  return {
    auditTrail: [
      { id: 'a1', timestamp: '2:14:30 PM', title: 'HR Case Created', category: 'HR', status: 'Completed', description: 'Onboarding case HR-00142 created and assigned to HR Operations.', priority: 'medium' },
      { id: 'a2', timestamp: '2:14:45 PM', title: 'Access Provisioning Initiated', category: 'Security', status: 'Completed', description: 'Active Directory and VPN access scheduled for new employee.', priority: 'high' },
      { id: 'a3', timestamp: '2:15:02 PM', title: 'IT Equipment Requested', category: 'IT', status: 'Completed', description: 'Equipment request REQ-00891 submitted for standard workstation.', priority: 'medium' },
      { id: 'a4', timestamp: '2:15:18 PM', title: 'Manager Notified', category: 'HR', status: 'Completed', description: 'Orientation task TASK-00334 assigned to Sarah Chen.', priority: 'medium' },
      { id: 'a5', timestamp: '2:15:30 PM', title: 'Compliance Audit Sealed', category: 'Compliance', status: 'Completed', description: 'All onboarding actions verified and audit trail sealed.', priority: 'critical' },
    ],
    completionStatus: {
      totalActions: 5,
      completedActions: 5,
      completionPercentage: 100,
      totalDurationMinutes: 1,
    },
  };
}

// --- Metrics ---
// Returns: { metrics, charts }

export async function fetchMetricsData() {
  await delay(700);
  return {
    metrics: {
      deflectionRate: 73,
      deflectionRateTrend: '+12%',
      avgResolutionTime: 4.2,
      avgResolutionTimeTrend: '-18%',
      totalConversations: 1247,
      totalConversationsTrend: '+23%',
      complianceScore: 99.8,
      complianceScoreTrend: '+0.3%',
    },
    charts: {
      barChart: [
        { label: 'Onboarding', value: 450 },
        { label: 'IT Resolution', value: 380 },
        { label: 'Offboarding', value: 267 },
        { label: 'General', value: 150 },
      ],
      lineChart: [
        { month: 'Jan', value: 41 },
        { month: 'Feb', value: 48 },
        { month: 'Mar', value: 55 },
        { month: 'Apr', value: 62 },
        { month: 'May', value: 68 },
        { month: 'Jun', value: 73 },
      ],
    },
  };
}

// ============================================================
// REAL IMPLEMENTATIONS (uncomment when REST API is deployed)
// ============================================================
/*
const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };

export async function sendMessage(text) {
  const res = await fetch(`${BASE_URL}/conversation/message`, {
    method: 'POST', headers,
    body: JSON.stringify({ conversationId: sessionStorage.getItem('sage_conv_id') || '', message: text }),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const json = await res.json();
  if (json.result?.context?.conversationId) sessionStorage.setItem('sage_conv_id', json.result.context.conversationId);
  return json.result?.response || json.result;
}

export async function sendChoice(choice) {
  const res = await fetch(`${BASE_URL}/conversation/choice`, {
    method: 'POST', headers,
    body: JSON.stringify({ conversationId: sessionStorage.getItem('sage_conv_id') || '', choice }),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const json = await res.json();
  return json.result?.response || json.result;
}

export async function confirmAction(actionId, confirmed) {
  const res = await fetch(`${BASE_URL}/conversation/action`, {
    method: 'POST', headers,
    body: JSON.stringify({ conversationId: sessionStorage.getItem('sage_conv_id') || '', actionId, confirmed }),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const json = await res.json();
  return json.result?.response || json.result;
}

export async function startDemo() {
  const res = await fetch(`${BASE_URL}/demo/start`, { method: 'POST', headers });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return (await res.json()).result;
}

export async function resetDemo() {
  const res = await fetch(`${BASE_URL}/demo/reset`, { method: 'POST', headers });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return (await res.json()).result;
}

export async function fetchDashboardData() {
  const res = await fetch(`${BASE_URL}/dashboard/data`, { headers });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return (await res.json()).result;
}

export async function fetchAuditData() {
  const res = await fetch(`${BASE_URL}/audit/data`, { headers });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return (await res.json()).result;
}

export async function fetchMetricsData() {
  const res = await fetch(`${BASE_URL}/metrics/data`, { headers });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return (await res.json()).result;
}
*/
