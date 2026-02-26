/**
 * ═══════════════════════════════════════════════════════════════════
 *  SAGE Scripted REST API - Resource Scripts
 *  Path: /api/x_ecs_sage/sage
 *
 *  SETUP INSTRUCTIONS (ServiceNow Studio or Navigator):
 *  1. Navigate to System Web Services > Scripted REST APIs
 *  2. Create a new Scripted REST API:
 *     - Name: SAGE API
 *     - API ID: sage
 *     - Namespace: x_ecs_sage (your app scope)
 *     - Protection Policy: None (or Read-Only for prod)
 *  3. Create each Resource below with the specified HTTP method,
 *     relative path, and script.
 *  4. Set "Requires authentication" = true on the API.
 *  5. Grant ACLs as needed for your users/roles.
 *
 *  ES5 Compatible for ServiceNow.
 * ═══════════════════════════════════════════════════════════════════
 */


// ═══════════════════════════════════════════════
//  RESOURCE 1: POST /conversation/message
//  Relative path: /conversation/message
//  HTTP method: POST
// ═══════════════════════════════════════════════

(function conversationMessage(request, response) {
    try {
        var body = request.body.data;
        var conversationId = body.conversationId || '';
        var message = body.message || '';
        var context = body.context || {};

        if (!conversationId || !message) {
            response.setStatus(400);
            response.setBody({
                success: false,
                error: 'conversationId and message are required'
            });
            return;
        }

        var engine = new SAGEConversationEngine();
        var result = engine.processMessage(conversationId, message, context);

        response.setStatus(200);
        response.setBody({
            success: true,
            response: result
        });

    } catch (e) {
        response.setStatus(500);
        response.setBody({
            success: false,
            error: 'Internal server error: ' + e.message
        });
    }
})(request, response);


// ═══════════════════════════════════════════════
//  RESOURCE 2: POST /conversation/choice
//  Relative path: /conversation/choice
//  HTTP method: POST
// ═══════════════════════════════════════════════

(function conversationChoice(request, response) {
    try {
        var body = request.body.data;
        var conversationId = body.conversationId || '';
        var choice = body.choice || {};
        var context = body.context || {};

        if (!conversationId || !choice.value) {
            response.setStatus(400);
            response.setBody({
                success: false,
                error: 'conversationId and choice (with value) are required'
            });
            return;
        }

        var engine = new SAGEConversationEngine();
        var result = engine.processChoice(conversationId, choice, context);

        response.setStatus(200);
        response.setBody({
            success: true,
            response: result
        });

    } catch (e) {
        response.setStatus(500);
        response.setBody({
            success: false,
            error: 'Internal server error: ' + e.message
        });
    }
})(request, response);


// ═══════════════════════════════════════════════
//  RESOURCE 3: POST /conversation/action
//  Relative path: /conversation/action
//  HTTP method: POST
// ═══════════════════════════════════════════════

(function conversationAction(request, response) {
    try {
        var body = request.body.data;
        var conversationId = body.conversationId || '';
        var actionId = body.actionId || '';
        var confirmed = body.confirmed === true || body.confirmed === 'true';
        var context = body.context || {};

        if (!conversationId || !actionId) {
            response.setStatus(400);
            response.setBody({
                success: false,
                error: 'conversationId and actionId are required'
            });
            return;
        }

        var engine = new SAGEConversationEngine();
        var result = engine.processAction(conversationId, actionId, confirmed, context);

        response.setStatus(200);
        response.setBody({
            success: true,
            response: result
        });

    } catch (e) {
        response.setStatus(500);
        response.setBody({
            success: false,
            error: 'Internal server error: ' + e.message
        });
    }
})(request, response);


// ═══════════════════════════════════════════════
//  RESOURCE 4: POST /conversation/reset
//  Relative path: /conversation/reset
//  HTTP method: POST
// ═══════════════════════════════════════════════

(function conversationReset(request, response) {
    try {
        var body = request.body.data;
        var conversationId = body.conversationId || '';

        if (!conversationId) {
            response.setStatus(400);
            response.setBody({
                success: false,
                error: 'conversationId is required'
            });
            return;
        }

        var engine = new SAGEConversationEngine();
        engine.resetConversation(conversationId);

        response.setStatus(200);
        response.setBody({ success: true });

    } catch (e) {
        response.setStatus(500);
        response.setBody({
            success: false,
            error: 'Internal server error: ' + e.message
        });
    }
})(request, response);


// ═══════════════════════════════════════════════
//  RESOURCE 5: POST /demo/start
//  Relative path: /demo/start
//  HTTP method: POST
// ═══════════════════════════════════════════════

(function demoStart(request, response) {
    try {
        var seeder = new SAGEDemoSeeder();
        var result = seeder.seedDemo();

        response.setStatus(result.success ? 200 : 500);
        response.setBody(result);

    } catch (e) {
        response.setStatus(500);
        response.setBody({
            success: false,
            error: 'Internal server error: ' + e.message
        });
    }
})(request, response);


// ═══════════════════════════════════════════════
//  RESOURCE 6: POST /demo/reset
//  Relative path: /demo/reset
//  HTTP method: POST
// ═══════════════════════════════════════════════

(function demoReset(request, response) {
    try {
        var seeder = new SAGEDemoSeeder();
        var result = seeder.resetDemo();

        response.setStatus(200);
        response.setBody(result);

    } catch (e) {
        response.setStatus(500);
        response.setBody({
            success: false,
            error: 'Internal server error: ' + e.message
        });
    }
})(request, response);


// ═══════════════════════════════════════════════
//  RESOURCE 7: GET /demo/status
//  Relative path: /demo/status
//  HTTP method: GET
// ═══════════════════════════════════════════════

(function demoStatus(request, response) {
    try {
        var seeder = new SAGEDemoSeeder();
        var result = seeder.getDemoStatus();

        response.setStatus(200);
        response.setBody(result);

    } catch (e) {
        response.setStatus(500);
        response.setBody({
            success: false,
            error: 'Internal server error: ' + e.message
        });
    }
})(request, response);


// ═══════════════════════════════════════════════
//  RESOURCE 8: GET /dashboard/data
//  Relative path: /dashboard/data
//  HTTP method: GET
// ═══════════════════════════════════════════════

(function dashboardData(request, response) {
    try {
        var cards = [];
        var summary = {
            totalProcesses: 0,
            completedToday: 0,
            pendingActions: 0,
            activeConversations: 0
        };

        // Query recent SAGE-generated records across tables
        var tables = [
            { table: 'sn_hr_core_case', type: 'HR Case', icon: 'user' },
            { table: 'sc_request', type: 'IT Request', icon: 'laptop' },
            { table: 'incident', type: 'IT Incident', icon: 'warning' },
            { table: 'task', type: 'Task', icon: 'clipboard' }
        ];

        for (var i = 0; i < tables.length; i++) {
            var t = tables[i];
            try {
                var gr = new GlideRecord(t.table);
                if (!gr.isValid()) { continue; }

                // Try to filter by sage-generated
                try { gr.addQuery('u_sage_generated', 'true'); } catch (e) { /* skip filter */ }
                gr.orderByDesc('sys_created_on');
                gr.setLimit(10);
                gr.query();

                while (gr.next()) {
                    summary.totalProcesses++;
                    var state = gr.getDisplayValue('state') || 'New';
                    if (state === 'Closed' || state === 'Resolved') {
                        summary.completedToday++;
                    } else {
                        summary.pendingActions++;
                    }

                    cards.push({
                        type: t.type,
                        icon: t.icon,
                        number: gr.getValue('number') || gr.getUniqueValue(),
                        shortDescription: gr.getValue('short_description') || '',
                        state: state,
                        createdOn: gr.getValue('sys_created_on'),
                        table: t.table
                    });
                }
            } catch (e) {
                // Table may not exist
            }
        }

        // Count active conversations
        try {
            var ctxGr = new GlideRecord('sage_conversation_context');
            if (ctxGr.isValid()) {
                var cutoff = new GlideDateTime();
                cutoff.addSeconds(-1800); // 30 min
                ctxGr.addQuery('sys_updated_on', '>', cutoff);
                ctxGr.query();
                summary.activeConversations = ctxGr.getRowCount();
            }
        } catch (e) { /* table may not exist */ }

        response.setStatus(200);
        response.setBody({
            orchestrationCards: cards,
            summary: summary
        });

    } catch (e) {
        response.setStatus(500);
        response.setBody({
            success: false,
            error: 'Internal server error: ' + e.message
        });
    }
})(request, response);


// ═══════════════════════════════════════════════
//  RESOURCE 9: GET /audit/data
//  Relative path: /audit/data
//  HTTP method: GET
// ═══════════════════════════════════════════════

(function auditData(request, response) {
    try {
        var auditTrail = [];
        var completionStatus = {
            total: 0,
            completed: 0,
            inProgress: 0,
            failed: 0
        };

        // Pull from conversation log table
        try {
            var logGr = new GlideRecord('sage_conversation_log');
            if (logGr.isValid()) {
                logGr.orderByDesc('sys_created_on');
                logGr.setLimit(100);
                logGr.query();

                while (logGr.next()) {
                    completionStatus.total++;
                    auditTrail.push({
                        conversationId: logGr.getValue('conversation_id'),
                        activityType: logGr.getValue('activity_type'),
                        content: logGr.getValue('message_content'),
                        userId: logGr.getValue('user_id'),
                        timestamp: logGr.getValue('sys_created_on')
                    });
                }
            }
        } catch (e) { /* table may not exist */ }

        // Aggregate record statuses
        var recordTables = ['sn_hr_core_case', 'sc_request', 'incident', 'task'];
        for (var i = 0; i < recordTables.length; i++) {
            try {
                var gr = new GlideRecord(recordTables[i]);
                if (!gr.isValid()) { continue; }
                try { gr.addQuery('u_sage_generated', 'true'); } catch (e) { continue; }
                gr.query();
                while (gr.next()) {
                    var state = gr.getValue('state');
                    if (state === '3' || state === '7') { // Closed/Resolved common values
                        completionStatus.completed++;
                    } else {
                        completionStatus.inProgress++;
                    }
                }
            } catch (e) { /* skip */ }
        }

        response.setStatus(200);
        response.setBody({
            auditTrail: auditTrail,
            completionStatus: completionStatus
        });

    } catch (e) {
        response.setStatus(500);
        response.setBody({
            success: false,
            error: 'Internal server error: ' + e.message
        });
    }
})(request, response);


// ═══════════════════════════════════════════════
//  RESOURCE 10: GET /metrics/data
//  Relative path: /metrics/data
//  HTTP method: GET
// ═══════════════════════════════════════════════

(function metricsData(request, response) {
    try {
        var metrics = {
            totalConversations: 0,
            avgResponseTime: '< 2s',
            intentBreakdown: { onboarding: 0, offboarding: 0, it_support: 0, general: 0 },
            recordsCreated: 0,
            userSatisfaction: 'N/A'
        };

        var barChart = [];
        var lineChart = [];

        // Count conversations from context store
        try {
            var ctxGa = new GlideAggregate('sage_conversation_context');
            ctxGa.addAggregate('COUNT');
            ctxGa.query();
            if (ctxGa.next()) {
                metrics.totalConversations = parseInt(ctxGa.getAggregate('COUNT'), 10) || 0;
            }
        } catch (e) { /* table may not exist */ }

        // Count records created per table
        var tableCounts = [
            { table: 'sn_hr_core_case', label: 'HR Cases' },
            { table: 'sc_request', label: 'IT Requests' },
            { table: 'incident', label: 'Incidents' },
            { table: 'task', label: 'Tasks' }
        ];

        for (var i = 0; i < tableCounts.length; i++) {
            var tc = tableCounts[i];
            var count = 0;
            try {
                var ga = new GlideAggregate(tc.table);
                try { ga.addQuery('u_sage_generated', 'true'); } catch (e) { /* no filter */ }
                ga.addAggregate('COUNT');
                ga.query();
                if (ga.next()) {
                    count = parseInt(ga.getAggregate('COUNT'), 10) || 0;
                }
            } catch (e) { /* skip */ }

            metrics.recordsCreated += count;
            barChart.push({ label: tc.label, value: count });
        }

        // Build a simple 7-day line chart (conversations per day)
        for (var d = 6; d >= 0; d--) {
            var day = new GlideDateTime();
            day.addDaysLocalTime(-d);
            var dayStr = day.getLocalDate().toString();
            lineChart.push({ date: dayStr, value: 0 }); // Placeholder — real impl would query
        }

        response.setStatus(200);
        response.setBody({
            metrics: metrics,
            charts: {
                barChart: barChart,
                lineChart: lineChart
            }
        });

    } catch (e) {
        response.setStatus(500);
        response.setBody({
            success: false,
            error: 'Internal server error: ' + e.message
        });
    }
})(request, response);
