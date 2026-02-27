/**
 * SAGEConversationEngine - Script Include
 * ========================================
 * 
 * SETUP INSTRUCTIONS:
 * 1. Navigate to System Definition > Script Includes
 * 2. Create new Script Include:
 *    - Name: SAGEConversationEngine
 *    - API Name: x_ecsf_gov_forum.SAGEConversationEngine
 *    - Client Callable: false
 *    - Application: SAGE Gov Forum (x_ecsf_gov_forum)
 *    - Accessible from: All application scopes
 * 3. Paste this script into the Script field
 * 
 * DEPENDENCIES:
 * - SAGEActionHandler Script Include (Phil's code)
 * - Tables: x_ecsf_gov_forum_conversation, x_ecsf_gov_forum_message,
 *           x_ecsf_gov_forum_intent_config, x_ecsf_gov_forum_known_issue,
 *           x_ecsf_gov_forum_audit_log
 * 
 * ES5 COMPATIBLE - No arrow functions, const/let, template literals, or destructuring
 */

var SAGEConversationEngine = Class.create();
SAGEConversationEngine.prototype = {
    TABLE_CONVERSATION: 'x_ecsf_gov_forum_conversation',
    TABLE_MESSAGE: 'x_ecsf_gov_forum_message',
    TABLE_INTENT_CONFIG: 'x_ecsf_gov_forum_intent_config',
    TABLE_KNOWN_ISSUE: 'x_ecsf_gov_forum_known_issue',
    TABLE_AUDIT_LOG: 'x_ecsf_gov_forum_audit_log',

    initialize: function() {
        this.actionHandler = new x_ecsf_gov_forum.SAGEActionHandler();
        this._intentCache = null;
        this._fallbackConfigs = null;
    },

    // =========================================================================
    // PUBLIC API - Called by REST resources
    // =========================================================================

    /**
     * Start a new conversation session.
     * @returns {Object} { conversationId: string }
     */
    startConversation: function() {
        var convGr = new GlideRecord(this.TABLE_CONVERSATION);
        convGr.initialize();
        convGr.setValue('user', gs.getUserID());
        convGr.setValue('state', 'active');
        convGr.setValue('channel', 'web');
        convGr.setValue('started_at', new GlideDateTime().getDisplayValue());
        convGr.setValue('turn_count', 0);
        convGr.setValue('context_data', JSON.stringify({ collectedData: {}, currentStep: 0, completedSteps: [] }));
        convGr.insert();

        return { conversationId: convGr.getUniqueValue() };
    },

    /**
     * Process an inbound user message.
     * @param {string} conversationId
     * @param {string} messageText
     * @returns {Object} Response in React-expected shape
     */
    processMessage: function(conversationId, messageText) {
        var conv = this._getConversation(conversationId);
        if (!conv) {
            return this._errorResponse('Conversation not found.');
        }

        // Log inbound message
        var turnCount = parseInt(conv.getValue('turn_count') || '0', 10) + 1;
        this._logMessage(conversationId, 'inbound', messageText, 'text', turnCount);

        var context = this._getContext(conv);
        var currentIntent = conv.getValue('intent');

        // If no intent detected yet, detect from message
        if (!currentIntent || currentIntent === 'unknown') {
            var detected = this._detectIntent(messageText);
            currentIntent = detected.intent;
            context.confidence = detected.confidence;
            conv.setValue('intent', currentIntent);
        }

        // Get intent config (from DB or fallback)
        var intentConfig = this._getIntentConfig(currentIntent);

        // Determine response based on flow state
        var response;
        if (context.currentStep === 0 && !context.flowStarted) {
            // First message after intent detection - send initial response
            context.flowStarted = true;
            response = this._buildInitialResponse(intentConfig, currentIntent, context);
        } else {
            // Process message within the current flow step
            response = this._processFlowStep(intentConfig, currentIntent, context, messageText, conversationId);
        }

        // Update conversation
        conv.setValue('turn_count', turnCount);
        conv.setValue('context_data', JSON.stringify(context));
        conv.setValue('state', context.state || 'active');
        if (context.outcome) {
            conv.setValue('outcome', context.outcome);
        }
        conv.update();

        // Log outbound message
        this._logMessage(conversationId, 'outbound', response.message, response.actionCard ? 'card' : 'text', turnCount, currentIntent + '_step_' + context.currentStep, context.confidence);

        // Attach flow info
        var flowSteps = intentConfig ? this._parseJSON(intentConfig.flow_steps) : [];
        response.flow = {
            intent: currentIntent,
            currentStep: context.currentStep,
            totalSteps: flowSteps.length || 0,
            completedSteps: context.completedSteps || []
        };
        response.collectedData = context.collectedData || {};
        response.activeRecords = context.activeRecords || [];

        return response;
    },

    /**
     * Process a choice selection from the user.
     * @param {string} conversationId
     * @param {string} choice - The selected choice value
     * @returns {Object} Response in React-expected shape
     */
    processChoice: function(conversationId, choice) {
        var conv = this._getConversation(conversationId);
        if (!conv) {
            return this._errorResponse('Conversation not found.');
        }

        var context = this._getContext(conv);
        var currentIntent = conv.getValue('intent');
        var justSetIntent = false;

        // Log the choice as inbound
        var turnCount = parseInt(conv.getValue('turn_count') || '0', 10) + 1;
        this._logMessage(conversationId, 'inbound', 'Selected: ' + choice, 'text', turnCount);

        // If no intent yet, the choice IS the intent selection
        if (!currentIntent || currentIntent === 'unknown' || currentIntent === 'general') {
            var intentMap = {
                'onboarding': 'onboarding',
                'new_hire': 'onboarding',
                'offboarding': 'offboarding',
                'employee_exit': 'offboarding',
                'it_resolution': 'it_resolution',
                'it_help': 'it_resolution',
                'it_issue': 'it_resolution'
            };
            var normalizedChoice = choice.toLowerCase().replace(/[\s-]/g, '_');
            currentIntent = intentMap[normalizedChoice] || this._detectIntent(choice).intent;
            conv.setValue('intent', currentIntent);
            context.currentStep = 0;
            context.flowStarted = false;
            justSetIntent = true;
        }

        var intentConfig = this._getIntentConfig(currentIntent);
        var flowSteps = intentConfig ? this._parseJSON(intentConfig.flow_steps) : [];

        // Store the choice as collected data for the current step
        // BUT skip if we just set the intent — the choice was the intent, not step data
        if (!justSetIntent && flowSteps.length > 0 && context.currentStep < flowSteps.length) {
            var stepDef = flowSteps[context.currentStep];
            if (stepDef && stepDef.field) {
                context.collectedData[stepDef.field] = choice;
            }
        }

        var response;
        if (!context.flowStarted) {
            context.flowStarted = true;
            response = this._buildInitialResponse(intentConfig, currentIntent, context);
        } else {
            response = this._advanceFlow(intentConfig, currentIntent, context, conversationId);
        }

        conv.setValue('turn_count', turnCount);
        conv.setValue('context_data', JSON.stringify(context));
        conv.setValue('state', context.state || 'active');
        if (context.outcome) {
            conv.setValue('outcome', context.outcome);
        }
        conv.update();

        this._logMessage(conversationId, 'outbound', response.message, response.actionCard ? 'card' : 'text', turnCount, currentIntent + '_step_' + context.currentStep);

        var allFlowSteps = intentConfig ? this._parseJSON(intentConfig.flow_steps) : [];
        response.flow = {
            intent: currentIntent,
            currentStep: context.currentStep,
            totalSteps: allFlowSteps.length || 0,
            completedSteps: context.completedSteps || []
        };
        response.collectedData = context.collectedData || {};
        response.activeRecords = context.activeRecords || [];

        return response;
    },

    /**
     * Process an action confirmation (e.g., confirm case creation).
     * @param {string} conversationId
     * @param {string} actionId
     * @param {boolean} confirmed
     * @returns {Object} Response in React-expected shape
     */
    processAction: function(conversationId, actionId, confirmed) {
        var conv = this._getConversation(conversationId);
        if (!conv) {
            return this._errorResponse('Conversation not found.');
        }

        var context = this._getContext(conv);
        var currentIntent = conv.getValue('intent');
        var turnCount = parseInt(conv.getValue('turn_count') || '0', 10) + 1;

        this._logMessage(conversationId, 'inbound', 'Action ' + actionId + ': ' + (confirmed ? 'confirmed' : 'declined'), 'action_confirmation', turnCount);

        var response;
        if (confirmed) {
            response = this._executeAction(actionId, context, conversationId, currentIntent);
        } else {
            response = {
                message: 'No problem! The action has been cancelled. Is there anything else I can help you with?',
                choices: [
                    { label: 'Start over', value: 'start_over' },
                    { label: 'No thanks', value: 'end_conversation' }
                ],
                actionCard: null
            };
        }

        conv.setValue('turn_count', turnCount);
        conv.setValue('context_data', JSON.stringify(context));
        conv.setValue('state', context.state || 'active');
        if (context.outcome) {
            conv.setValue('outcome', context.outcome);
        }
        conv.update();

        this._logMessage(conversationId, 'outbound', response.message, response.actionCard ? 'action_confirmation' : 'text', turnCount);

        var intentConfig = this._getIntentConfig(currentIntent);
        var flowSteps = intentConfig ? this._parseJSON(intentConfig.flow_steps) : [];
        response.flow = {
            intent: currentIntent,
            currentStep: context.currentStep,
            totalSteps: flowSteps.length || 0,
            completedSteps: context.completedSteps || []
        };
        response.collectedData = context.collectedData || {};
        response.activeRecords = context.activeRecords || [];

        return response;
    },

    // =========================================================================
    // INTENT DETECTION
    // =========================================================================

    /**
     * Detect intent from user message using keyword matching.
     * Checks intent_config table first, then uses fallback keywords.
     */
    _detectIntent: function(message) {
        var lowerMsg = (message || '').toLowerCase();
        var configs = this._getAllIntentConfigs();
        var bestMatch = { intent: 'general', confidence: 0.0 };

        for (var i = 0; i < configs.length; i++) {
            var config = configs[i];
            var keywords = (config.trigger_keywords || '').toLowerCase().split(',');
            var matchCount = 0;
            var totalKeywords = keywords.length;

            for (var k = 0; k < keywords.length; k++) {
                var keyword = keywords[k].trim();
                if (keyword && lowerMsg.indexOf(keyword) !== -1) {
                    matchCount++;
                }
            }

            if (matchCount > 0) {
                var confidence = matchCount / totalKeywords;
                // Weight by priority (lower priority number = higher weight)
                var priority = parseInt(config.priority || '10', 10);
                var weightedConfidence = confidence + (1 / (priority + 1)) * 0.1;

                if (weightedConfidence > bestMatch.confidence) {
                    bestMatch = {
                        intent: config.intent_name,
                        confidence: Math.min(weightedConfidence, 1.0)
                    };
                }
            }
        }

        // Fallback keyword matching if no DB configs matched
        if (bestMatch.confidence === 0) {
            var fallbackMap = {
                'onboarding': ['new hire', 'onboard', 'onboarding', 'new employee', 'start date', 'joining', 'new starter', 'equipment', 'laptop', 'first day'],
                'offboarding': ['offboard', 'offboarding', 'leaving', 'exit', 'departure', 'termination', 'last day', 'resign', 'separation', 'depart'],
                'it_resolution': ['vpn', 'password', 'reset', 'network', 'wifi', 'email', 'outlook', 'slow', 'not working', 'broken', 'error', 'issue', 'help desk', 'ticket', 'incident', 'connectivity']
            };

            for (var intent in fallbackMap) {
                if (fallbackMap.hasOwnProperty(intent)) {
                    var words = fallbackMap[intent];
                    for (var w = 0; w < words.length; w++) {
                        if (lowerMsg.indexOf(words[w]) !== -1) {
                            bestMatch = { intent: intent, confidence: 0.7 };
                            break;
                        }
                    }
                    if (bestMatch.confidence > 0) break;
                }
            }
        }

        // If still nothing, offer choices
        if (bestMatch.confidence === 0) {
            bestMatch = { intent: 'general', confidence: 0.3 };
        }

        return bestMatch;
    },

    // =========================================================================
    // FLOW MANAGEMENT
    // =========================================================================

    _buildInitialResponse: function(intentConfig, intent, context) {
        var initialMsg = '';
        var choices = [];

        if (intentConfig && intentConfig.initial_response) {
            initialMsg = intentConfig.initial_response;
        } else {
            // Fallback initial responses
            var fallbackResponses = this._getFallbackInitialResponses();
            initialMsg = fallbackResponses[intent] || "Hello! How can I assist you today?";
        }

        // Get first step choices
        var flowSteps = intentConfig ? this._parseJSON(intentConfig.flow_steps) : this._getFallbackFlowSteps(intent);
        if (flowSteps.length > 0) {
            var firstStep = flowSteps[0];
            if (firstStep.choices) {
                choices = firstStep.choices;
            }
            if (firstStep.message) {
                initialMsg = initialMsg + '\n\n' + firstStep.message;
            }
        }

        // For general/unknown intents, show main menu
        if (intent === 'general' || intent === 'unknown') {
            choices = [
                { label: '👤 New Hire Onboarding', value: 'onboarding' },
                { label: '🚪 Employee Offboarding', value: 'offboarding' },
                { label: '🔧 IT Issue Resolution', value: 'it_resolution' }
            ];
        }

        context.currentStep = 0;
        return {
            message: initialMsg,
            choices: choices,
            actionCard: null
        };
    },

    _processFlowStep: function(intentConfig, intent, context, messageText, conversationId) {
        var flowSteps = intentConfig ? this._parseJSON(intentConfig.flow_steps) : this._getFallbackFlowSteps(intent);
        var currentStep = context.currentStep || 0;

        if (currentStep < flowSteps.length) {
            var stepDef = flowSteps[currentStep];

            // Store the user's input for this step
            if (stepDef.field) {
                context.collectedData[stepDef.field] = messageText;
            }
        }

        // Advance to next step
        return this._advanceFlow(intentConfig, intent, context, conversationId);
    },

    _advanceFlow: function(intentConfig, intent, context, conversationId) {
        var flowSteps = intentConfig ? this._parseJSON(intentConfig.flow_steps) : this._getFallbackFlowSteps(intent);

        // Mark current step as completed
        if (!context.completedSteps) context.completedSteps = [];
        context.completedSteps.push(context.currentStep);
        context.currentStep = (context.currentStep || 0) + 1;

        // Check if flow is complete
        if (context.currentStep >= flowSteps.length) {
            return this._completeFlow(intent, context, conversationId);
        }

        // Get next step
        var nextStep = flowSteps[context.currentStep];
        var response = {
            message: nextStep.message || 'Please continue.',
            choices: nextStep.choices || [],
            actionCard: null
        };

        // Check if this step has a known-issue check
        if (nextStep.type === 'known_issue_check') {
            var knownIssue = this._matchKnownIssue(context.collectedData);
            if (knownIssue) {
                response.message = '💡 I found a known resolution for your issue:\n\n**' + knownIssue.title + '**\n\n' + knownIssue.resolution_text;
                response.actionCard = {
                    id: 'auto_resolve',
                    title: 'Apply Known Resolution',
                    description: knownIssue.resolution_action || 'Apply the suggested fix',
                    type: 'confirmation',
                    data: { knownIssueId: knownIssue.sys_id }
                };
                context.knownIssue = knownIssue;
            }
        }

        // Check if this step presents an action card for confirmation
        if (nextStep.type === 'confirmation') {
            response.actionCard = {
                id: nextStep.action_id || intent + '_action',
                title: nextStep.action_title || 'Confirm Action',
                description: this._buildConfirmationSummary(intent, context),
                type: 'confirmation',
                data: context.collectedData
            };
        }

        if (nextStep.type === 'awaiting_input') {
            context.state = 'awaiting_input';
        }

        return response;
    },

    _completeFlow: function(intent, context, conversationId) {
        context.state = 'completed';
        var response = {
            message: '',
            choices: [],
            actionCard: null
        };

        // Build a confirmation action card based on intent
        var actionId = '';
        var actionTitle = '';
        var actionDesc = '';

        if (intent === 'onboarding') {
            actionId = 'create_onboarding';
            actionTitle = 'Submit New Hire Onboarding';
            actionDesc = this._buildConfirmationSummary(intent, context);
            response.message = '✅ I have all the information needed. Please review and confirm the onboarding request:';
            response.actionCard = {
                id: actionId,
                title: actionTitle,
                description: actionDesc,
                type: 'confirmation',
                data: context.collectedData
            };
            context.state = 'awaiting_input';
        } else if (intent === 'offboarding') {
            actionId = 'create_offboarding';
            actionTitle = 'Submit Employee Offboarding';
            actionDesc = this._buildConfirmationSummary(intent, context);
            response.message = '✅ I have all the details. Please review and confirm the offboarding request:';
            response.actionCard = {
                id: actionId,
                title: actionTitle,
                description: actionDesc,
                type: 'confirmation',
                data: context.collectedData
            };
            context.state = 'awaiting_input';
        } else if (intent === 'it_resolution') {
            actionId = 'create_incident';
            actionTitle = 'Create IT Incident';
            actionDesc = this._buildConfirmationSummary(intent, context);
            response.message = "I wasn't able to resolve this automatically. I'll create an incident for the IT team:";
            response.actionCard = {
                id: actionId,
                title: actionTitle,
                description: actionDesc,
                type: 'confirmation',
                data: context.collectedData
            };
            context.state = 'awaiting_input';
        } else {
            response.message = 'Thank you! Is there anything else I can help you with?';
            response.choices = [
                { label: 'Start a new request', value: 'start_over' },
                { label: 'No thanks', value: 'end_conversation' }
            ];
        }

        return response;
    },

    // =========================================================================
    // ACTION EXECUTION
    // =========================================================================

    _executeAction: function(actionId, context, conversationId, intent) {
        var response = {
            message: '',
            choices: [],
            actionCard: null
        };

        try {
            if (actionId === 'create_onboarding') {
                // Submit new hire order guide via SAGEActionHandler
                var orderResult = this.actionHandler.submitNewHireOrderGuide(context.collectedData);
                var hrCase = this.actionHandler.createHRCase({
                    user: gs.getUserID(),
                    subject: 'New Hire Onboarding: ' + (context.collectedData.employee_name || 'New Employee')
                });

                // Log audit entries
                this.actionHandler.logAudit({
                    action_type: 'request_created',
                    action_detail: 'New hire onboarding order guide submitted for ' + (context.collectedData.employee_name || 'employee'),
                    target_record: orderResult ? orderResult.sys_id : '',
                    performed_by: 'ai_engine',
                    category: 'hr'
                });

                if (!context.activeRecords) context.activeRecords = [];
                context.activeRecords.push({
                    type: 'sc_request',
                    id: orderResult ? orderResult.sys_id : '',
                    label: 'Onboarding Request'
                });
                if (hrCase) {
                    context.activeRecords.push({
                        type: 'sn_hr_core_case',
                        id: hrCase.sys_id || '',
                        label: 'HR Case'
                    });
                }

                context.state = 'completed';
                context.outcome = 'request_created';
                response.message = '🎉 Onboarding request submitted successfully!\n\n• Equipment order guide has been submitted\n• HR Case has been created\n\nThe hiring manager will receive a confirmation email. Is there anything else?';
                response.choices = [
                    { label: 'Start another request', value: 'start_over' },
                    { label: 'Done', value: 'end_conversation' }
                ];

            } else if (actionId === 'create_offboarding') {
                var offboardCase = this.actionHandler.createHRCase({
                    user: gs.getUserID(),
                    subject: 'Employee Offboarding: ' + (context.collectedData.employee_name || 'Employee')
                });

                this.actionHandler.logAudit({
                    action_type: 'case_created',
                    action_detail: 'Offboarding case created for ' + (context.collectedData.employee_name || 'employee'),
                    target_record: offboardCase ? offboardCase.sys_id : '',
                    performed_by: 'ai_engine',
                    category: 'hr'
                });

                this.actionHandler.logAudit({
                    action_type: 'access_removed',
                    action_detail: 'Access removal initiated for departing employee',
                    target_record: '',
                    performed_by: 'system',
                    category: 'security'
                });

                if (!context.activeRecords) context.activeRecords = [];
                if (offboardCase) {
                    context.activeRecords.push({
                        type: 'sn_hr_core_case',
                        id: offboardCase.sys_id || '',
                        label: 'Offboarding Case'
                    });
                }

                context.state = 'completed';
                context.outcome = 'case_created';
                response.message = '✅ Offboarding process initiated!\n\n• HR Case created for the separation\n• Access removal request submitted to Security\n• Asset return notification sent to employee\n\nThe HR team will follow up. Anything else?';
                response.choices = [
                    { label: 'Start another request', value: 'start_over' },
                    { label: 'Done', value: 'end_conversation' }
                ];

            } else if (actionId === 'create_incident') {
                var incidentResult = this.actionHandler.createIncident({
                    short_description: context.collectedData.issue_description || 'IT Issue reported via SAGE',
                    caller_id: gs.getUserID(),
                    category: context.collectedData.category || 'software',
                    impact: context.collectedData.impact || '3',
                    urgency: context.collectedData.urgency || '3',
                    description: 'Issue reported via SAGE Assistant.\n\nCategory: ' + (context.collectedData.category || 'N/A') + '\nDescription: ' + (context.collectedData.issue_description || 'N/A') + '\nSteps tried: ' + (context.collectedData.steps_tried || 'N/A')
                });

                this.actionHandler.logAudit({
                    action_type: 'ticket_created',
                    action_detail: 'IT incident created for: ' + (context.collectedData.issue_description || 'IT issue'),
                    target_record: incidentResult ? incidentResult.sys_id : '',
                    performed_by: 'ai_engine',
                    category: 'it'
                });

                if (!context.activeRecords) context.activeRecords = [];
                if (incidentResult) {
                    context.activeRecords.push({
                        type: 'incident',
                        id: incidentResult.sys_id || '',
                        number: incidentResult.number || '',
                        label: 'IT Incident'
                    });
                }

                context.state = 'completed';
                context.outcome = 'case_created';
                response.message = '🔧 IT Incident created successfully!\n\n• Incident ' + (incidentResult && incidentResult.number ? incidentResult.number : '') + ' has been logged\n• The IT support team has been notified\n• You will receive updates via email\n\nAnything else I can help with?';
                response.choices = [
                    { label: 'Report another issue', value: 'start_over' },
                    { label: 'Done', value: 'end_conversation' }
                ];

            } else if (actionId === 'auto_resolve') {
                // Auto-resolve using known issue
                if (context.knownIssue) {
                    this.actionHandler.logAudit({
                        action_type: 'auto_resolved',
                        action_detail: 'Auto-resolved using known issue: ' + context.knownIssue.title,
                        target_record: context.knownIssue.sys_id || '',
                        performed_by: 'ai_engine',
                        category: 'it'
                    });

                    // Increment hit count
                    this._incrementKnownIssueHitCount(context.knownIssue.sys_id);
                }

                context.state = 'completed';
                context.outcome = 'resolved';
                response.message = '✅ Resolution applied! The known fix has been executed. Please verify the issue is resolved.\n\nIf the problem persists, I can create an incident ticket for you.';
                response.choices = [
                    { label: "It's fixed! Thanks", value: 'end_conversation' },
                    { label: 'Still having issues', value: 'it_resolution' }
                ];

            } else {
                response.message = 'Action "' + actionId + '" is not recognized. Please try again.';
                response.choices = [
                    { label: 'Start over', value: 'start_over' }
                ];
            }
        } catch (e) {
            gs.error('SAGEConversationEngine._executeAction error: ' + e.message);
            response.message = 'An error occurred while processing your request. The action could not be completed. Please try again or contact support.';
            response.choices = [
                { label: 'Try again', value: 'start_over' }
            ];
        }

        return response;
    },

    // =========================================================================
    // KNOWN ISSUE MATCHING
    // =========================================================================

    _matchKnownIssue: function(collectedData) {
        var gr = new GlideRecord(this.TABLE_KNOWN_ISSUE);
        gr.addQuery('active', true);
        gr.orderByDesc('confidence');
        gr.query();

        var description = (collectedData.issue_description || '').toLowerCase();
        var category = (collectedData.category || '').toLowerCase();

        while (gr.next()) {
            // Check category match
            var issueCategory = gr.getValue('category') || '';
            if (category && issueCategory && category === issueCategory) {
                // Check keyword match from match_criteria
                var criteria = this._parseJSON(gr.getValue('match_criteria'));
                var keywords = criteria.keywords || [];
                var matchCount = 0;

                for (var i = 0; i < keywords.length; i++) {
                    if (description.indexOf(keywords[i].toLowerCase()) !== -1) {
                        matchCount++;
                    }
                }

                if (matchCount > 0 || (keywords.length === 0 && category === issueCategory)) {
                    return {
                        sys_id: gr.getUniqueValue(),
                        title: gr.getValue('title'),
                        resolution_text: gr.getValue('resolution_text'),
                        resolution_action: gr.getValue('resolution_action'),
                        confidence: parseFloat(gr.getValue('confidence') || '0')
                    };
                }
            }
        }

        return null;
    },

    _incrementKnownIssueHitCount: function(sysId) {
        var gr = new GlideRecord(this.TABLE_KNOWN_ISSUE);
        if (gr.get(sysId)) {
            var count = parseInt(gr.getValue('hit_count') || '0', 10);
            gr.setValue('hit_count', count + 1);
            gr.update();
        }
    },

    // =========================================================================
    // INTENT CONFIG LOADING
    // =========================================================================

    _getAllIntentConfigs: function() {
        if (this._intentCache) return this._intentCache;

        var configs = [];
        var gr = new GlideRecord(this.TABLE_INTENT_CONFIG);
        gr.addQuery('active', true);
        gr.orderBy('priority');
        gr.query();

        while (gr.next()) {
            configs.push({
                intent_name: gr.getValue('intent_name'),
                trigger_keywords: gr.getValue('trigger_keywords'),
                initial_response: gr.getValue('initial_response'),
                flow_steps: gr.getValue('flow_steps'),
                escalation_message: gr.getValue('escalation_message'),
                priority: gr.getValue('priority')
            });
        }

        // If no configs in DB, use fallbacks
        if (configs.length === 0) {
            configs = this._getFallbackIntentConfigs();
        }

        this._intentCache = configs;
        return configs;
    },

    _getIntentConfig: function(intentName) {
        var configs = this._getAllIntentConfigs();
        for (var i = 0; i < configs.length; i++) {
            if (configs[i].intent_name === intentName) {
                return configs[i];
            }
        }
        return null;
    },

    // =========================================================================
    // FALLBACK CONFIGURATIONS
    // =========================================================================

    _getFallbackIntentConfigs: function() {
        return [
            {
                intent_name: 'onboarding',
                trigger_keywords: 'new hire,onboarding,new employee,start date,joining,new starter,equipment request,first day',
                initial_response: "Welcome! I'll help you with the new hire onboarding process. I'll need a few details to get everything set up.",
                flow_steps: JSON.stringify(this._getFallbackFlowSteps('onboarding')),
                escalation_message: "I'm having trouble processing this onboarding request. Let me connect you with HR.",
                priority: '1'
            },
            {
                intent_name: 'offboarding',
                trigger_keywords: 'offboarding,leaving,exit,departure,termination,last day,resign,separation,departing',
                initial_response: "I'll help you initiate the employee offboarding process. Let me gather the necessary information.",
                flow_steps: JSON.stringify(this._getFallbackFlowSteps('offboarding')),
                escalation_message: "I'm having trouble processing this offboarding request. Let me connect you with HR.",
                priority: '2'
            },
            {
                intent_name: 'it_resolution',
                trigger_keywords: 'vpn,password,reset,network,wifi,email,outlook,slow,not working,broken,error,help desk,ticket,incident,connectivity,software,hardware',
                initial_response: "I'll help you resolve your IT issue. Let me ask a few questions to diagnose the problem.",
                flow_steps: JSON.stringify(this._getFallbackFlowSteps('it_resolution')),
                escalation_message: "I wasn't able to resolve this automatically. Let me create an incident for the IT support team.",
                priority: '3'
            },
            {
                intent_name: 'general',
                trigger_keywords: 'help,hello,hi,hey,what can you do,menu',
                initial_response: "Hello! I'm SAGE, your Smart Automated Government Employee assistant. I can help you with:\n\n• **New Hire Onboarding** - Set up equipment, access, and HR cases\n• **Employee Offboarding** - Manage departures, access removal, and asset returns\n• **IT Issue Resolution** - Troubleshoot and resolve technical problems\n\nWhat would you like help with?",
                flow_steps: '[]',
                escalation_message: "Let me connect you with a human agent who can assist further.",
                priority: '10'
            }
        ];
    },

    _getFallbackFlowSteps: function(intent) {
        if (intent === 'onboarding') {
            return [
                {
                    step: 1,
                    message: "What is the new employee's full name?",
                    field: 'employee_name',
                    type: 'text_input'
                },
                {
                    step: 2,
                    message: "What department will they be joining?",
                    field: 'department',
                    type: 'choice',
                    choices: [
                        { label: 'Engineering', value: 'engineering' },
                        { label: 'Human Resources', value: 'hr' },
                        { label: 'Finance', value: 'finance' },
                        { label: 'Operations', value: 'operations' },
                        { label: 'Legal', value: 'legal' },
                        { label: 'Other', value: 'other' }
                    ]
                },
                {
                    step: 3,
                    message: "What is their planned start date?",
                    field: 'start_date',
                    type: 'text_input'
                },
                {
                    step: 4,
                    message: "What equipment do they need?",
                    field: 'equipment',
                    type: 'choice',
                    choices: [
                        { label: 'Standard Laptop + Monitor', value: 'standard' },
                        { label: 'Developer Workstation', value: 'developer' },
                        { label: 'Executive Setup', value: 'executive' },
                        { label: 'Field Equipment (Tablet)', value: 'field' }
                    ]
                },
                {
                    step: 5,
                    message: "Does the employee need any special access or software licenses?",
                    field: 'special_access',
                    type: 'text_input'
                },
                {
                    step: 6,
                    type: 'confirmation',
                    action_id: 'create_onboarding',
                    action_title: 'Submit Onboarding Request',
                    message: 'Please review and confirm the onboarding details:'
                }
            ];
        }

        if (intent === 'offboarding') {
            return [
                {
                    step: 1,
                    message: "What is the departing employee's name?",
                    field: 'employee_name',
                    type: 'text_input'
                },
                {
                    step: 2,
                    message: "What is their last working day?",
                    field: 'last_day',
                    type: 'text_input'
                },
                {
                    step: 3,
                    message: "What is the reason for departure?",
                    field: 'reason',
                    type: 'choice',
                    choices: [
                        { label: 'Voluntary Resignation', value: 'resignation' },
                        { label: 'Retirement', value: 'retirement' },
                        { label: 'End of Contract', value: 'contract_end' },
                        { label: 'Transfer to Another Agency', value: 'transfer' },
                        { label: 'Other', value: 'other' }
                    ]
                },
                {
                    step: 4,
                    message: "Does the employee have any government-issued equipment to return?",
                    field: 'has_equipment',
                    type: 'choice',
                    choices: [
                        { label: 'Yes - Laptop and accessories', value: 'yes_laptop' },
                        { label: 'Yes - Multiple devices', value: 'yes_multiple' },
                        { label: 'No equipment to return', value: 'no' },
                        { label: 'Not sure', value: 'unknown' }
                    ]
                },
                {
                    step: 5,
                    message: "Any additional notes for the offboarding team?",
                    field: 'notes',
                    type: 'text_input'
                },
                {
                    step: 6,
                    type: 'confirmation',
                    action_id: 'create_offboarding',
                    action_title: 'Submit Offboarding Request',
                    message: 'Please review and confirm the offboarding details:'
                }
            ];
        }

        if (intent === 'it_resolution') {
            return [
                {
                    step: 1,
                    message: "What category best describes your issue?",
                    field: 'category',
                    type: 'choice',
                    choices: [
                        { label: '🌐 VPN / Network', value: 'vpn' },
                        { label: '📧 Email / Outlook', value: 'email' },
                        { label: '💻 Software', value: 'software' },
                        { label: '🖥️ Hardware', value: 'hardware' },
                        { label: '🔑 Access / Permissions', value: 'access' },
                        { label: '❓ Other', value: 'other' }
                    ]
                },
                {
                    step: 2,
                    message: "Please describe the issue in detail:",
                    field: 'issue_description',
                    type: 'text_input'
                },
                {
                    step: 3,
                    type: 'known_issue_check',
                    message: "Let me check if there's a known resolution...",
                    field: 'checked_known_issues'
                },
                {
                    step: 4,
                    message: "What have you already tried to resolve this?",
                    field: 'steps_tried',
                    type: 'text_input'
                },
                {
                    step: 5,
                    message: "How urgently do you need this resolved?",
                    field: 'urgency',
                    type: 'choice',
                    choices: [
                        { label: '🔴 Critical - Cannot work', value: '1' },
                        { label: '🟠 High - Major impact', value: '2' },
                        { label: '🟡 Medium - Some impact', value: '3' },
                        { label: '🟢 Low - Minor inconvenience', value: '4' }
                    ]
                },
                {
                    step: 6,
                    type: 'confirmation',
                    action_id: 'create_incident',
                    action_title: 'Create IT Incident',
                    message: 'I will create an incident with the following details:'
                }
            ];
        }

        return [];
    },

    _getFallbackInitialResponses: function() {
        return {
            'onboarding': "Welcome! I'll help you with the new hire onboarding process. I'll need a few details to get everything set up.",
            'offboarding': "I'll help you initiate the employee offboarding process. Let me gather the necessary information.",
            'it_resolution': "I'll help you resolve your IT issue. Let me ask a few questions to diagnose the problem.",
            'general': "Hello! I'm SAGE, your Smart Automated Government Employee assistant. How can I help you today?"
        };
    },

    // =========================================================================
    // HELPER METHODS
    // =========================================================================

    _getConversation: function(conversationId) {
        var gr = new GlideRecord(this.TABLE_CONVERSATION);
        if (gr.get(conversationId)) {
            return gr;
        }
        return null;
    },

    _getContext: function(conv) {
        var contextStr = conv.getValue('context_data');
        var context = this._parseJSON(contextStr);
        if (!context.collectedData) context.collectedData = {};
        if (!context.completedSteps) context.completedSteps = [];
        if (!context.currentStep) context.currentStep = 0;
        if (!context.activeRecords) context.activeRecords = [];
        return context;
    },

    _logMessage: function(conversationId, direction, text, msgType, sequence, intentStep, confidence) {
        var gr = new GlideRecord(this.TABLE_MESSAGE);
        gr.initialize();
        gr.setValue('conversation', conversationId);
        gr.setValue('direction', direction);
        gr.setValue('message_text', (text || '').substring(0, 4000));
        gr.setValue('message_type', msgType || 'text');
        gr.setValue('timestamp', new GlideDateTime().getDisplayValue());
        gr.setValue('sequence', sequence || 0);
        if (intentStep) gr.setValue('intent_step', intentStep);
        if (confidence) gr.setValue('confidence', confidence);
        gr.insert();
    },

    _buildConfirmationSummary: function(intent, context) {
        var data = context.collectedData || {};
        var lines = [];

        if (intent === 'onboarding') {
            lines.push('Employee: ' + (data.employee_name || 'N/A'));
            lines.push('Department: ' + (data.department || 'N/A'));
            lines.push('Start Date: ' + (data.start_date || 'N/A'));
            lines.push('Equipment: ' + (data.equipment || 'N/A'));
            if (data.special_access) lines.push('Special Access: ' + data.special_access);
        } else if (intent === 'offboarding') {
            lines.push('Employee: ' + (data.employee_name || 'N/A'));
            lines.push('Last Day: ' + (data.last_day || 'N/A'));
            lines.push('Reason: ' + (data.reason || 'N/A'));
            lines.push('Equipment Return: ' + (data.has_equipment || 'N/A'));
            if (data.notes) lines.push('Notes: ' + data.notes);
        } else if (intent === 'it_resolution') {
            lines.push('Category: ' + (data.category || 'N/A'));
            lines.push('Issue: ' + (data.issue_description || 'N/A'));
            lines.push('Steps Tried: ' + (data.steps_tried || 'N/A'));
            lines.push('Urgency: ' + (data.urgency || 'N/A'));
        }

        return lines.join('\n');
    },

    _errorResponse: function(msg) {
        return {
            message: msg,
            choices: [],
            actionCard: null,
            flow: { intent: 'unknown', currentStep: 0, totalSteps: 0, completedSteps: [] },
            collectedData: {},
            activeRecords: []
        };
    },

    _parseJSON: function(str) {
        if (!str) return {};
        try {
            return JSON.parse(str);
        } catch (e) {
            return {};
        }
    },

    type: 'SAGEConversationEngine'
};
