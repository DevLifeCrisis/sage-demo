/**
 * SAGE Scripted REST API - Resource Scripts
 * ==========================================
 * 
 * SETUP INSTRUCTIONS:
 * 
 * 1. Navigate to System Web Services > Scripted REST APIs
 * 2. Create new Scripted REST API:
 *    - Name: SAGE
 *    - API ID: sage
 *    - API Namespace: x_ecsf_gov_forum (auto-set by app scope)
 *    - Base API path will be: /api/x_ecsf_gov_forum/sage
 *    - Protection Policy: None (or Read-only as needed)
 * 
 * 3. Create each Resource below as a separate resource under this API.
 *    For each resource, set:
 *    - HTTP Method (GET or POST as noted)
 *    - Relative path (as noted)
 *    - Paste the script into the Script field
 * 
 * 4. Security: Each endpoint uses the session user. Ensure callers are
 *    authenticated (ServiceNow session cookie or Basic Auth).
 * 
 * 5. CORS: If calling from a separate domain (e.g., Vercel), configure
 *    CORS rules under System Web Services > REST CORS Rules:
 *    - Name: SAGE React App
 *    - REST API: SAGE [x_ecsf_gov_forum.sage]
 *    - Domain: https://your-vercel-app.vercel.app
 *    - Max Age: 86400
 *    - HTTP Methods: GET, POST
 *    - HTTP Headers: Content-Type, Accept, X-UserToken
 * 
 * TABLES USED:
 * - x_ecsf_gov_forum_conversation
 * - x_ecsf_gov_forum_message
 * - x_ecsf_gov_forum_audit_log
 * - x_ecsf_gov_forum_intent_config
 * - x_ecsf_gov_forum_known_issue
 * - x_ecsf_gov_forum_metrics
 * 
 * ALL SCRIPTS ARE ES5 COMPATIBLE
 */


// =============================================================================
// RESOURCE 1: POST /conversation/start
// =============================================================================
// Name: Start Conversation
// HTTP Method: POST
// Relative path: /conversation/start
// =============================================================================
(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
    var engine = new x_ecsf_gov_forum.SAGEConversationEngine();
    var result = engine.startConversation();
    response.setStatus(200);
    response.setBody(result);
})(request, response);


// =============================================================================
// RESOURCE 2: POST /conversation/message
// =============================================================================
// Name: Send Message
// HTTP Method: POST
// Relative path: /conversation/message
// =============================================================================
(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
    var body = request.body.data;
    var conversationId = body.conversationId || '';
    var message = body.message || '';

    if (!conversationId || !message) {
        response.setStatus(400);
        response.setBody({ error: 'conversationId and message are required' });
        return;
    }

    var engine = new x_ecsf_gov_forum.SAGEConversationEngine();
    var result = engine.processMessage(conversationId, message);
    response.setStatus(200);
    response.setBody(result);
})(request, response);


// =============================================================================
// RESOURCE 3: POST /conversation/choice
// =============================================================================
// Name: Send Choice
// HTTP Method: POST
// Relative path: /conversation/choice
// =============================================================================
(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
    var body = request.body.data;
    var conversationId = body.conversationId || '';
    var choice = body.choice || '';

    if (!conversationId || !choice) {
        response.setStatus(400);
        response.setBody({ error: 'conversationId and choice are required' });
        return;
    }

    var engine = new x_ecsf_gov_forum.SAGEConversationEngine();
    var result = engine.processChoice(conversationId, choice);
    response.setStatus(200);
    response.setBody(result);
})(request, response);


// =============================================================================
// RESOURCE 4: POST /conversation/action
// =============================================================================
// Name: Confirm Action
// HTTP Method: POST
// Relative path: /conversation/action
// =============================================================================
(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
    var body = request.body.data;
    var conversationId = body.conversationId || '';
    var actionId = body.actionId || '';
    var confirmed = body.confirmed === true || body.confirmed === 'true';

    if (!conversationId || !actionId) {
        response.setStatus(400);
        response.setBody({ error: 'conversationId and actionId are required' });
        return;
    }

    var engine = new x_ecsf_gov_forum.SAGEConversationEngine();
    var result = engine.processAction(conversationId, actionId, confirmed);
    response.setStatus(200);
    response.setBody(result);
})(request, response);


// =============================================================================
// RESOURCE 5: POST /demo/start
// =============================================================================
// Name: Start Demo
// HTTP Method: POST
// Relative path: /demo/start
// =============================================================================
(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
    try {
        // Seed intent_config table with demo configurations
        var configs = [
            {
                intent_name: 'onboarding',
                trigger_keywords: 'new hire,onboarding,new employee,start date,joining,new starter,equipment request,first day',
                initial_response: "Welcome! I'll help you with the new hire onboarding process. I'll need a few details to get everything set up.",
                flow_steps: JSON.stringify([
                    { step: 1, message: "What is the new employee's full name?", field: 'employee_name', type: 'text_input' },
                    { step: 2, message: "What department will they be joining?", field: 'department', type: 'choice', choices: [
                        { label: 'Engineering', value: 'engineering' }, { label: 'Human Resources', value: 'hr' },
                        { label: 'Finance', value: 'finance' }, { label: 'Operations', value: 'operations' }
                    ]},
                    { step: 3, message: "What is their planned start date?", field: 'start_date', type: 'text_input' },
                    { step: 4, message: "What equipment do they need?", field: 'equipment', type: 'choice', choices: [
                        { label: 'Standard Laptop + Monitor', value: 'standard' }, { label: 'Developer Workstation', value: 'developer' },
                        { label: 'Executive Setup', value: 'executive' }
                    ]},
                    { step: 5, message: "Any special access or software needed?", field: 'special_access', type: 'text_input' },
                    { step: 6, type: 'confirmation', action_id: 'create_onboarding', action_title: 'Submit Onboarding Request', message: 'Review and confirm:' }
                ]),
                escalation_message: "Let me connect you with HR for assistance.",
                active: true,
                priority: 1
            },
            {
                intent_name: 'offboarding',
                trigger_keywords: 'offboarding,leaving,exit,departure,termination,last day,resign,separation',
                initial_response: "I'll help you initiate the employee offboarding process. Let me gather the necessary information.",
                flow_steps: JSON.stringify([
                    { step: 1, message: "What is the departing employee's name?", field: 'employee_name', type: 'text_input' },
                    { step: 2, message: "What is their last working day?", field: 'last_day', type: 'text_input' },
                    { step: 3, message: "Reason for departure?", field: 'reason', type: 'choice', choices: [
                        { label: 'Voluntary Resignation', value: 'resignation' }, { label: 'Retirement', value: 'retirement' },
                        { label: 'End of Contract', value: 'contract_end' }, { label: 'Transfer', value: 'transfer' }
                    ]},
                    { step: 4, message: "Equipment to return?", field: 'has_equipment', type: 'choice', choices: [
                        { label: 'Yes - Laptop and accessories', value: 'yes_laptop' }, { label: 'Yes - Multiple devices', value: 'yes_multiple' },
                        { label: 'No equipment', value: 'no' }
                    ]},
                    { step: 5, message: "Additional notes?", field: 'notes', type: 'text_input' },
                    { step: 6, type: 'confirmation', action_id: 'create_offboarding', action_title: 'Submit Offboarding', message: 'Review and confirm:' }
                ]),
                escalation_message: "Let me connect you with HR.",
                active: true,
                priority: 2
            },
            {
                intent_name: 'it_resolution',
                trigger_keywords: 'vpn,password,reset,network,wifi,email,outlook,slow,not working,broken,error,ticket,incident',
                initial_response: "I'll help resolve your IT issue. Let me ask a few questions.",
                flow_steps: JSON.stringify([
                    { step: 1, message: "What category?", field: 'category', type: 'choice', choices: [
                        { label: 'VPN / Network', value: 'vpn' }, { label: 'Email / Outlook', value: 'email' },
                        { label: 'Software', value: 'software' }, { label: 'Hardware', value: 'hardware' },
                        { label: 'Access / Permissions', value: 'access' }
                    ]},
                    { step: 2, message: "Describe the issue:", field: 'issue_description', type: 'text_input' },
                    { step: 3, type: 'known_issue_check', message: "Checking known resolutions...", field: 'checked_known_issues' },
                    { step: 4, message: "What have you tried?", field: 'steps_tried', type: 'text_input' },
                    { step: 5, message: "Urgency?", field: 'urgency', type: 'choice', choices: [
                        { label: 'Critical', value: '1' }, { label: 'High', value: '2' },
                        { label: 'Medium', value: '3' }, { label: 'Low', value: '4' }
                    ]},
                    { step: 6, type: 'confirmation', action_id: 'create_incident', action_title: 'Create Incident', message: 'Review:' }
                ]),
                escalation_message: "Creating an incident for IT support.",
                active: true,
                priority: 3
            },
            {
                intent_name: 'general',
                trigger_keywords: 'help,hello,hi,hey,menu,what can you do',
                initial_response: "Hello! I'm SAGE. I can help with:\n• New Hire Onboarding\n• Employee Offboarding\n• IT Issue Resolution\n\nWhat do you need?",
                flow_steps: '[]',
                escalation_message: "Let me connect you with support.",
                active: true,
                priority: 10
            }
        ];

        // Insert intent configs
        for (var i = 0; i < configs.length; i++) {
            var cfg = configs[i];
            // Check if already exists
            var check = new GlideRecord('x_ecsf_gov_forum_intent_config');
            check.addQuery('intent_name', cfg.intent_name);
            check.query();
            if (check.hasNext()) continue; // Skip if exists

            var gr = new GlideRecord('x_ecsf_gov_forum_intent_config');
            gr.initialize();
            gr.setValue('intent_name', cfg.intent_name);
            gr.setValue('trigger_keywords', cfg.trigger_keywords);
            gr.setValue('initial_response', cfg.initial_response);
            gr.setValue('flow_steps', cfg.flow_steps);
            gr.setValue('escalation_message', cfg.escalation_message);
            gr.setValue('active', cfg.active);
            gr.setValue('priority', cfg.priority);
            gr.insert();
        }

        // Seed known issues
        var knownIssues = [
            {
                title: 'VPN Connection Timeout',
                category: 'vpn',
                match_criteria: JSON.stringify({ keywords: ['vpn', 'timeout', 'connect', 'disconnecting', 'drops'] }),
                resolution_text: 'VPN connection timeouts are often caused by outdated client software or DNS issues.\n\n1. Update your VPN client to the latest version\n2. Clear DNS cache: Run "ipconfig /flushdns" in Command Prompt\n3. Restart your network adapter\n4. Try connecting to an alternate VPN gateway',
                resolution_action: 'vpn_client_update',
                confidence: 0.85,
                active: true,
                hit_count: 0
            },
            {
                title: 'Outlook Not Syncing',
                category: 'email',
                match_criteria: JSON.stringify({ keywords: ['outlook', 'sync', 'email', 'not receiving', 'sending'] }),
                resolution_text: 'Outlook sync issues can be resolved by:\n\n1. Check your internet connection\n2. Go to File > Account Settings and verify your account\n3. Clear the Outlook cache: Close Outlook, delete files in %localappdata%\\Microsoft\\Outlook\\RoamCache\n4. Run the Microsoft Support and Recovery Assistant',
                resolution_action: 'outlook_cache_clear',
                confidence: 0.80,
                active: true,
                hit_count: 0
            },
            {
                title: 'Password Reset - Self Service',
                category: 'access',
                match_criteria: JSON.stringify({ keywords: ['password', 'reset', 'locked', 'expired', 'cannot login'] }),
                resolution_text: 'You can reset your password using Self-Service:\n\n1. Go to https://passwordreset.youragency.gov\n2. Verify your identity with security questions or MFA\n3. Set a new password (min 12 chars, 1 uppercase, 1 number, 1 special)\n4. Wait 5 minutes for sync, then try logging in',
                resolution_action: 'password_reset_link',
                confidence: 0.90,
                active: true,
                hit_count: 0
            }
        ];

        for (var k = 0; k < knownIssues.length; k++) {
            var ki = knownIssues[k];
            var kiCheck = new GlideRecord('x_ecsf_gov_forum_known_issue');
            kiCheck.addQuery('title', ki.title);
            kiCheck.query();
            if (kiCheck.hasNext()) continue;

            var kiGr = new GlideRecord('x_ecsf_gov_forum_known_issue');
            kiGr.initialize();
            kiGr.setValue('title', ki.title);
            kiGr.setValue('category', ki.category);
            kiGr.setValue('match_criteria', ki.match_criteria);
            kiGr.setValue('resolution_text', ki.resolution_text);
            kiGr.setValue('resolution_action', ki.resolution_action);
            kiGr.setValue('confidence', ki.confidence);
            kiGr.setValue('active', ki.active);
            kiGr.setValue('hit_count', ki.hit_count);
            kiGr.insert();
        }

        // Seed metrics data
        var metrics = [
            { metric_name: 'Total Conversations', metric_value: '1,247', metric_trend: 'up', display_order: 1, accent_color: '#4CAF50' },
            { metric_name: 'Auto-Resolved', metric_value: '834', metric_trend: 'up', display_order: 2, accent_color: '#2196F3' },
            { metric_name: 'Avg Resolution Time', metric_value: '3.2 min', metric_trend: 'down', display_order: 3, accent_color: '#FF9800' },
            { metric_name: 'Satisfaction Score', metric_value: '4.6/5', metric_trend: 'up', display_order: 4, accent_color: '#9C27B0' },
            { metric_name: 'Escalation Rate', metric_value: '12%', metric_trend: 'down', display_order: 5, accent_color: '#F44336' },
            { metric_name: 'Active Sessions', metric_value: '23', metric_trend: 'stable', display_order: 6, accent_color: '#607D8B' }
        ];

        for (var m = 0; m < metrics.length; m++) {
            var met = metrics[m];
            var mCheck = new GlideRecord('x_ecsf_gov_forum_metrics');
            mCheck.addQuery('metric_name', met.metric_name);
            mCheck.query();
            if (mCheck.hasNext()) continue;

            var mGr = new GlideRecord('x_ecsf_gov_forum_metrics');
            mGr.initialize();
            mGr.setValue('metric_name', met.metric_name);
            mGr.setValue('metric_value', met.metric_value);
            mGr.setValue('metric_trend', met.metric_trend);
            mGr.setValue('display_order', met.display_order);
            mGr.setValue('accent_color', met.accent_color);
            mGr.insert();
        }

        // Set a system property to track demo mode
        gs.setProperty('x_ecsf_gov_forum.demo_mode', 'true');

        response.setStatus(200);
        response.setBody({
            success: true,
            message: 'Demo data seeded successfully. Intent configs, known issues, and metrics have been created.'
        });
    } catch (e) {
        gs.error('SAGE Demo Start error: ' + e.message);
        response.setStatus(500);
        response.setBody({ success: false, message: 'Error seeding demo data: ' + e.message });
    }
})(request, response);


// =============================================================================
// RESOURCE 6: POST /demo/reset
// =============================================================================
// Name: Reset Demo
// HTTP Method: POST
// Relative path: /demo/reset
// =============================================================================
(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
    try {
        var tables = [
            'x_ecsf_gov_forum_conversation',
            'x_ecsf_gov_forum_message',
            'x_ecsf_gov_forum_audit_log',
            'x_ecsf_gov_forum_intent_config',
            'x_ecsf_gov_forum_known_issue',
            'x_ecsf_gov_forum_metrics'
        ];

        for (var i = 0; i < tables.length; i++) {
            var gr = new GlideRecord(tables[i]);
            gr.deleteMultiple();
        }

        gs.setProperty('x_ecsf_gov_forum.demo_mode', 'false');

        response.setStatus(200);
        response.setBody({
            success: true,
            message: 'All demo data has been cleared from SAGE tables.'
        });
    } catch (e) {
        gs.error('SAGE Demo Reset error: ' + e.message);
        response.setStatus(500);
        response.setBody({ success: false, message: 'Error resetting demo data: ' + e.message });
    }
})(request, response);


// =============================================================================
// RESOURCE 7: GET /demo/status
// =============================================================================
// Name: Demo Status
// HTTP Method: GET
// Relative path: /demo/status
// =============================================================================
(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
    var demoMode = gs.getProperty('x_ecsf_gov_forum.demo_mode', 'false') === 'true';

    // Count records to determine state
    var convCount = new GlideAggregate('x_ecsf_gov_forum_conversation');
    convCount.addAggregate('COUNT');
    convCount.query();
    var conversations = 0;
    if (convCount.next()) {
        conversations = parseInt(convCount.getAggregate('COUNT'), 10);
    }

    var configCount = new GlideAggregate('x_ecsf_gov_forum_intent_config');
    configCount.addAggregate('COUNT');
    configCount.query();
    var configs = 0;
    if (configCount.next()) {
        configs = parseInt(configCount.getAggregate('COUNT'), 10);
    }

    response.setStatus(200);
    response.setBody({
        demoMode: demoMode,
        state: {
            conversations: conversations,
            intentConfigs: configs,
            seeded: configs > 0
        }
    });
})(request, response);


// =============================================================================
// RESOURCE 8: GET /dashboard/data
// =============================================================================
// Name: Dashboard Data
// HTTP Method: GET
// Relative path: /dashboard/data
// =============================================================================
(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
    var records = [];
    var summary = {
        total: 0,
        active: 0,
        completed: 0,
        escalated: 0,
        resolved: 0,
        byIntent: {}
    };

    var gr = new GlideRecord('x_ecsf_gov_forum_conversation');
    gr.orderByDesc('started_at');
    gr.setLimit(100);
    gr.query();

    while (gr.next()) {
        var intent = gr.getValue('intent') || 'unknown';
        var state = gr.getValue('state') || 'active';
        var outcome = gr.getValue('outcome') || '';

        records.push({
            sys_id: gr.getUniqueValue(),
            number: gr.getValue('number'),
            user: gr.getDisplayValue('user'),
            intent: intent,
            state: state,
            outcome: outcome,
            channel: gr.getValue('channel'),
            started_at: gr.getValue('started_at'),
            ended_at: gr.getValue('ended_at'),
            turn_count: parseInt(gr.getValue('turn_count') || '0', 10),
            satisfaction: gr.getValue('satisfaction')
        });

        summary.total++;
        if (state === 'active' || state === 'awaiting_input') summary.active++;
        if (state === 'completed') summary.completed++;
        if (state === 'escalated') summary.escalated++;
        if (outcome === 'resolved') summary.resolved++;

        if (!summary.byIntent[intent]) summary.byIntent[intent] = 0;
        summary.byIntent[intent]++;
    }

    response.setStatus(200);
    response.setBody({
        records: records,
        summary: summary
    });
})(request, response);


// =============================================================================
// RESOURCE 9: GET /audit/data
// =============================================================================
// Name: Audit Data
// HTTP Method: GET
// Relative path: /audit/data
// =============================================================================
(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
    var entries = [];
    var stats = {
        total: 0,
        byActionType: {},
        byCategory: {},
        byStatus: {},
        byPerformer: {}
    };

    var gr = new GlideRecord('x_ecsf_gov_forum_audit_log');
    gr.orderByDesc('timestamp');
    gr.setLimit(200);
    gr.query();

    while (gr.next()) {
        var actionType = gr.getValue('action_type') || '';
        var category = gr.getValue('category') || '';
        var status = gr.getValue('status') || '';
        var performedBy = gr.getValue('performed_by') || '';

        entries.push({
            sys_id: gr.getUniqueValue(),
            conversation: gr.getDisplayValue('conversation'),
            action_type: actionType,
            action_detail: gr.getValue('action_detail'),
            target_record: gr.getValue('target_record'),
            performed_by: performedBy,
            timestamp: gr.getValue('timestamp'),
            category: category,
            status: status
        });

        stats.total++;
        if (!stats.byActionType[actionType]) stats.byActionType[actionType] = 0;
        stats.byActionType[actionType]++;
        if (!stats.byCategory[category]) stats.byCategory[category] = 0;
        stats.byCategory[category]++;
        if (!stats.byStatus[status]) stats.byStatus[status] = 0;
        stats.byStatus[status]++;
        if (!stats.byPerformer[performedBy]) stats.byPerformer[performedBy] = 0;
        stats.byPerformer[performedBy]++;
    }

    response.setStatus(200);
    response.setBody({
        entries: entries,
        stats: stats
    });
})(request, response);


// =============================================================================
// RESOURCE 10: GET /metrics/data
// =============================================================================
// Name: Metrics Data
// HTTP Method: GET
// Relative path: /metrics/data
// =============================================================================
(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
    var cards = [];

    var gr = new GlideRecord('x_ecsf_gov_forum_metrics');
    gr.orderBy('display_order');
    gr.query();

    while (gr.next()) {
        cards.push({
            sys_id: gr.getUniqueValue(),
            metric_name: gr.getValue('metric_name'),
            metric_value: gr.getValue('metric_value'),
            metric_trend: gr.getValue('metric_trend'),
            display_order: parseInt(gr.getValue('display_order') || '0', 10),
            accent_color: gr.getValue('accent_color')
        });
    }

    // Build charts data from conversations (aggregated)
    var charts = {
        intentDistribution: {},
        outcomeDistribution: {},
        dailyVolume: []
    };

    // Intent distribution
    var intentAgg = new GlideAggregate('x_ecsf_gov_forum_conversation');
    intentAgg.addAggregate('COUNT');
    intentAgg.groupBy('intent');
    intentAgg.query();
    while (intentAgg.next()) {
        var intentName = intentAgg.getValue('intent') || 'unknown';
        charts.intentDistribution[intentName] = parseInt(intentAgg.getAggregate('COUNT'), 10);
    }

    // Outcome distribution
    var outcomeAgg = new GlideAggregate('x_ecsf_gov_forum_conversation');
    outcomeAgg.addAggregate('COUNT');
    outcomeAgg.groupBy('outcome');
    outcomeAgg.query();
    while (outcomeAgg.next()) {
        var outcomeName = outcomeAgg.getValue('outcome') || 'none';
        charts.outcomeDistribution[outcomeName] = parseInt(outcomeAgg.getAggregate('COUNT'), 10);
    }

    // If no metrics exist, return demo placeholders
    if (cards.length === 0) {
        cards = [
            { metric_name: 'Total Conversations', metric_value: '0', metric_trend: 'stable', display_order: 1, accent_color: '#4CAF50' },
            { metric_name: 'Auto-Resolved', metric_value: '0', metric_trend: 'stable', display_order: 2, accent_color: '#2196F3' },
            { metric_name: 'Avg Resolution Time', metric_value: 'N/A', metric_trend: 'stable', display_order: 3, accent_color: '#FF9800' },
            { metric_name: 'Satisfaction Score', metric_value: 'N/A', metric_trend: 'stable', display_order: 4, accent_color: '#9C27B0' }
        ];
    }

    response.setStatus(200);
    response.setBody({
        cards: cards,
        charts: charts
    });
})(request, response);
