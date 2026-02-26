/**
 * SAGEConversationEngine - Main Conversational AI Engine for SAGE React App
 * Orchestrates conversation flow using Now Assist for AI, database-backed context,
 * and real ServiceNow record creation.
 *
 * ES5 Compatible for ServiceNow.
 *
 * Response shape (matches React UI contract):
 * {
 *   message: "string",
 *   choices: [{ label: "string", value: "string" }],       // optional
 *   actionCard: { type, title, items: [{label, status, detail}] }, // optional
 *   context: { intent, currentStep, collectedData, conversationId }
 * }
 *
 * @requires SAGELLMProvider
 * @requires SAGEPromptBuilder
 * @requires SAGEActionHandler
 * @requires SAGEContextStore
 *
 * @class SAGEConversationEngine
 */
var SAGEConversationEngine = Class.create();
SAGEConversationEngine.prototype = {

    initialize: function() {
        this.version = '3.0.0';
        this.debugEnabled = gs.getProperty('sage.debug.enabled', 'false') === 'true';
        this.fallbackEnabled = gs.getProperty('sage.fallback.enabled', 'true') === 'true';

        this.llm = new SAGELLMProvider();
        this.promptBuilder = new SAGEPromptBuilder();
        this.actionHandler = new SAGEActionHandler();
        this.contextStore = new SAGEContextStore();

        // Regex fallback patterns (used when Now Assist is unavailable)
        this._fallbackPatterns = {
            onboarding: [/onboard/i, /new\s*(hire|employee)/i, /(first|1st)\s*day/i, /start(ing|ed)?\s*(work|job|position)/i],
            offboarding: [/offboard/i, /contractor.*(end|leav|depart|last)/i, /access\s*removal/i, /(last|final)\s*day/i, /departure/i],
            it_support: [/(vpn|email|wifi|password|software|hardware).*(issue|problem|not\s*work)/i, /can'?t\s*(log|access|connect)/i, /tech\s*support/i, /computer.*(slow|broken|crash)/i]
        };
    },

    // ═══════════════════════════════════════════════
    //  PUBLIC API
    // ═══════════════════════════════════════════════

    /**
     * Process a free-text user message.
     * @param {string} conversationId
     * @param {string} userMessage
     * @param {Object} [context] - Optional context overrides from the client
     * @returns {Object} Response object matching the React UI contract
     */
    processMessage: function(conversationId, userMessage, context) {
        try {
            this._log('processMessage: conv=' + conversationId, 'info');

            if (!conversationId || !userMessage) {
                return this._errorResponse('Please provide a message.');
            }

            var ctx = this._loadContext(conversationId, context);

            // Track history
            if (!ctx.history) { ctx.history = []; }
            ctx.history.push({ role: 'user', content: userMessage });

            // Detect intent if not set
            if (!ctx.intent) {
                ctx.intent = this._detectIntent(userMessage);
                ctx.currentStep = 'step1';
            }

            // Extract entities if in data collection
            this._tryExtractEntities(userMessage, ctx);

            // Generate response
            var response = this._generateResponse(conversationId, userMessage, ctx);

            // Record assistant message
            ctx.history.push({ role: 'assistant', content: response.message || '' });

            // Save context
            this._saveContext(conversationId, ctx);

            // Attach context to response
            response.context = this._buildResponseContext(conversationId, ctx);

            return response;

        } catch (error) {
            this._log('processMessage error: ' + error.message, 'error');
            return this._errorResponse('I encountered an issue. Please try again or contact the service desk.');
        }
    },

    /**
     * Process a quick-reply choice selection.
     * @param {string} conversationId
     * @param {Object} choice - { label: string, value: string }
     * @param {Object} [context]
     * @returns {Object} Response object
     */
    processChoice: function(conversationId, choice, context) {
        try {
            this._log('processChoice: conv=' + conversationId + ', value=' + (choice && choice.value), 'info');

            var ctx = this._loadContext(conversationId, context);

            var choiceValue = (choice && (choice.value || choice.label)) || '';
            ctx.lastChoice = choiceValue;

            // Handle special choice routing
            this._handleChoiceRouting(ctx);

            // Process as a message
            return this.processMessage(conversationId, choiceValue, ctx);

        } catch (error) {
            this._log('processChoice error: ' + error.message, 'error');
            return this._errorResponse('I had trouble processing that selection.');
        }
    },

    /**
     * Process an action confirmation or cancellation.
     * @param {string} conversationId
     * @param {string} actionId
     * @param {boolean} confirmed
     * @param {Object} [context]
     * @returns {Object} Response object
     */
    processAction: function(conversationId, actionId, confirmed, context) {
        try {
            this._log('processAction: action=' + actionId + ', confirmed=' + confirmed, 'info');

            var ctx = this._loadContext(conversationId, context);

            if (!confirmed) {
                var cancelResponse = {
                    message: 'No problem — that action has been cancelled. How else can I help you?',
                    choices: [
                        { label: 'Start over', value: 'restart' },
                        { label: 'Get help with something else', value: 'help' }
                    ],
                    context: this._buildResponseContext(conversationId, ctx)
                };
                return cancelResponse;
            }

            // Find the action execution step
            var flowConfig = this.promptBuilder.getFlowConfig(ctx.intent);
            var actions = this._findActionsForStep(flowConfig, ctx);

            // Execute actions
            var result = this.actionHandler.executeActions(actions, ctx);

            // Build action card from results
            var items = [];
            for (var i = 0; i < result.actions.length; i++) {
                var a = result.actions[i];
                items.push({
                    label: a.title || 'Action',
                    status: a.success ? 'completed' : 'error',
                    detail: a.number || a.error || ''
                });
            }

            // Store created records in context
            ctx.createdRecords = result.actions;

            // Advance to next step
            this._advanceStep(ctx);
            this._saveContext(conversationId, ctx);

            return {
                message: result.success
                    ? 'All actions have been completed successfully.'
                    : 'Some actions encountered issues. Please review the details below.',
                actionCard: {
                    type: 'checklist',
                    title: 'Action Results',
                    items: items
                },
                context: this._buildResponseContext(conversationId, ctx)
            };

        } catch (error) {
            this._log('processAction error: ' + error.message, 'error');
            return this._errorResponse('There was a problem executing that action.');
        }
    },

    /**
     * Reset a conversation, clearing all stored context.
     * @param {string} conversationId
     * @returns {boolean}
     */
    resetConversation: function(conversationId) {
        this._log('resetConversation: ' + conversationId, 'info');
        return this.contextStore.deleteContext(conversationId);
    },

    // ═══════════════════════════════════════════════
    //  INTENT DETECTION
    // ═══════════════════════════════════════════════

    /** @private */
    _detectIntent: function(message) {
        // Try LLM classification first
        try {
            var result = this.llm.classify(message, ['onboarding', 'offboarding', 'it_support', 'general']);
            if (result && result !== 'general') {
                return result;
            }
            // If LLM returned a string directly
            if (typeof result === 'string' && result !== 'general') {
                return result;
            }
        } catch (e) {
            this._log('LLM classify failed, using fallback: ' + e.message, 'warn');
        }

        // Regex fallback
        if (this.fallbackEnabled) {
            return this._regexIntentDetect(message);
        }

        return 'general';
    },

    /** @private */
    _regexIntentDetect: function(message) {
        var lower = message.toLowerCase();
        for (var intent in this._fallbackPatterns) {
            if (this._fallbackPatterns.hasOwnProperty(intent)) {
                var patterns = this._fallbackPatterns[intent];
                for (var i = 0; i < patterns.length; i++) {
                    if (patterns[i].test(lower)) { return intent; }
                }
            }
        }
        return 'general';
    },

    // ═══════════════════════════════════════════════
    //  ENTITY EXTRACTION
    // ═══════════════════════════════════════════════

    /** @private */
    _tryExtractEntities: function(message, ctx) {
        var flowConfig = this.promptBuilder.getFlowConfig(ctx.intent);
        if (!flowConfig || !flowConfig.steps || !ctx.currentStep) { return; }

        var stepConfig = flowConfig.steps[ctx.currentStep];
        if (!stepConfig) { return; }

        var collectTypes = ['data_collection', 'sequential_data_collection', 'identity_verification', 'security_assessment'];
        var isCollect = false;
        for (var t = 0; t < collectTypes.length; t++) {
            if (stepConfig.type === collectTypes[t]) { isCollect = true; break; }
        }
        if (!isCollect) { return; }

        var schema = stepConfig.data_fields || stepConfig.verification_fields || [];
        if (schema.length === 0) { return; }

        if (!ctx.collectedData) { ctx.collectedData = {}; }

        try {
            var extracted = this.llm.extractEntities(message, schema);
            for (var key in extracted) {
                if (extracted.hasOwnProperty(key) && extracted[key]) {
                    ctx.collectedData[key] = extracted[key];
                }
            }
        } catch (e) {
            this._log('Entity extraction failed: ' + e.message, 'warn');
        }

        ctx.missingFields = this._getMissingFields(schema, ctx.collectedData);
    },

    /** @private */
    _getMissingFields: function(schema, collected) {
        var missing = [];
        for (var i = 0; i < schema.length; i++) {
            var f = schema[i];
            if (f.required && !collected[f.name]) {
                missing.push(f);
            }
        }
        return missing;
    },

    // ═══════════════════════════════════════════════
    //  RESPONSE GENERATION
    // ═══════════════════════════════════════════════

    /** @private */
    _generateResponse: function(conversationId, userMessage, ctx) {
        var flowConfig = this.promptBuilder.getFlowConfig(ctx.intent);
        var stepConfig = null;

        if (flowConfig && flowConfig.steps && ctx.currentStep) {
            stepConfig = flowConfig.steps[ctx.currentStep];
        }

        // No flow — general response
        if (!flowConfig || !stepConfig) {
            return this._generateGeneralResponse(userMessage, ctx);
        }

        // If data collection complete, advance
        if (ctx.missingFields && ctx.missingFields.length === 0 && this._isDataStep(stepConfig)) {
            this._advanceStep(ctx);
            stepConfig = (flowConfig.steps && ctx.currentStep) ? flowConfig.steps[ctx.currentStep] : null;
            if (!stepConfig) {
                return this._generateGeneralResponse(userMessage, ctx);
            }
        }

        // Build system prompt and generate
        var systemPrompt = this.promptBuilder.buildSystemPrompt(ctx.intent, flowConfig, ctx);
        var historyStr = this.promptBuilder.formatConversationHistory(ctx.history || []);

        try {
            var raw = this.llm.generate(systemPrompt, userMessage, ctx.history || []);
            var parsed = this._parseAIResponse(raw);

            // Handle flow signals
            if (parsed.flowSignal === 'complete') {
                this._advanceStep(ctx);
            } else if (parsed.flowSignal === 'escalate') {
                parsed.message = parsed.message || 'I\'m connecting you with a human agent who can better assist with this.';
            } else if (parsed.flowSignal === 'restart') {
                this.contextStore.deleteContext(conversationId);
            }

            // Merge extracted data from AI response
            if (parsed.extractedData) {
                if (!ctx.collectedData) { ctx.collectedData = {}; }
                for (var key in parsed.extractedData) {
                    if (parsed.extractedData.hasOwnProperty(key) && parsed.extractedData[key]) {
                        ctx.collectedData[key] = parsed.extractedData[key];
                    }
                }
                var schema = stepConfig.data_fields || stepConfig.verification_fields || [];
                ctx.missingFields = this._getMissingFields(schema, ctx.collectedData);
            }

            return this._buildUIResponse(parsed);

        } catch (e) {
            this._log('LLM generation failed: ' + e.message, 'warn');
            if (this.fallbackEnabled) {
                return this._fallbackResponse(stepConfig, ctx);
            }
            return this._errorResponse('I\'m having a temporary issue. Please try again.');
        }
    },

    /** @private */
    _generateGeneralResponse: function(userMessage, ctx) {
        try {
            var prompt = this.promptBuilder.buildSystemPrompt('general', null, ctx);
            var raw = this.llm.generate(prompt, userMessage, ctx.history || []);
            var parsed = this._parseAIResponse(raw);
            return this._buildUIResponse(parsed);
        } catch (e) {
            this._log('General response failed: ' + e.message, 'warn');
        }

        return {
            message: 'I can help with several services. What would you like to do?',
            choices: [
                { label: 'Employee Onboarding', value: 'employee onboarding' },
                { label: 'Contractor Offboarding', value: 'contractor offboarding' },
                { label: 'IT Support', value: 'it support' }
            ]
        };
    },

    // ═══════════════════════════════════════════════
    //  RESPONSE PARSING
    // ═══════════════════════════════════════════════

    /** @private */
    _parseAIResponse: function(raw) {
        if (!raw) {
            return { message: 'I\'m processing your request.', flowSignal: 'continue' };
        }

        // Try direct JSON parse
        try {
            var parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object' && parsed.message) {
                return parsed;
            }
        } catch (e) { /* not JSON */ }

        // Try extracting JSON from text
        var jsonMatch = raw.match(/\{[\s\S]*"message"[\s\S]*\}/);
        if (jsonMatch) {
            try {
                var extracted = JSON.parse(jsonMatch[0]);
                if (extracted && extracted.message) { return extracted; }
            } catch (e2) { /* fall through */ }
        }

        // Plain text fallback
        return {
            message: raw.replace(/```json\s*/gi, '').replace(/```/g, '').trim(),
            flowSignal: 'continue'
        };
    },

    /** @private */
    _buildUIResponse: function(parsed) {
        var response = {
            message: parsed.message || 'I\'m here to help. Could you tell me more?'
        };

        if (parsed.choices && parsed.choices.length > 0) {
            response.choices = [];
            for (var i = 0; i < parsed.choices.length; i++) {
                var c = parsed.choices[i];
                response.choices.push({
                    label: c.label || c.text || c.value,
                    value: c.value || c.label || c.text
                });
            }
        }

        if (parsed.actionCard) {
            response.actionCard = parsed.actionCard;
        }

        return response;
    },

    // ═══════════════════════════════════════════════
    //  FLOW NAVIGATION
    // ═══════════════════════════════════════════════

    /** @private */
    _handleChoiceRouting: function(ctx) {
        var flowConfig = this.promptBuilder.getFlowConfig(ctx.intent);
        if (!flowConfig || !flowConfig.steps || !ctx.currentStep) { return; }

        var stepConfig = flowConfig.steps[ctx.currentStep];
        if (!stepConfig) { return; }

        if (stepConfig.type === 'conditional_routing' && stepConfig.routing_logic) {
            var target = stepConfig.routing_logic[ctx.lastChoice];
            if (target) { ctx.currentStep = target; }
        }

        if (ctx.lastChoice === 'confirm') {
            this._advanceStep(ctx);
        } else if (ctx.lastChoice === 'edit' || ctx.lastChoice === 'restart') {
            ctx.currentStep = 'step1';
            ctx.collectedData = {};
            ctx.intent = null;
        }
    },

    /** @private */
    _advanceStep: function(ctx) {
        var flowConfig = this.promptBuilder.getFlowConfig(ctx.intent);
        if (!flowConfig || !flowConfig.steps || !ctx.currentStep) { return; }

        var stepConfig = flowConfig.steps[ctx.currentStep];
        if (stepConfig && stepConfig.nextStep) {
            ctx.currentStep = stepConfig.nextStep;
            ctx.missingFields = null;
        }
    },

    /** @private */
    _isDataStep: function(stepConfig) {
        if (!stepConfig) { return false; }
        var types = ['data_collection', 'sequential_data_collection', 'identity_verification', 'security_assessment'];
        for (var i = 0; i < types.length; i++) {
            if (stepConfig.type === types[i]) { return true; }
        }
        return false;
    },

    /** @private */
    _findActionsForStep: function(flowConfig, ctx) {
        if (!flowConfig || !flowConfig.steps) { return []; }

        // Look at current step first, then scan for action_execution
        var stepConfig = flowConfig.steps[ctx.currentStep];
        if (stepConfig && stepConfig.actions) {
            return stepConfig.actions;
        }

        for (var stepId in flowConfig.steps) {
            if (flowConfig.steps.hasOwnProperty(stepId)) {
                var s = flowConfig.steps[stepId];
                if ((s.type === 'action_execution' || s.type === 'secure_execution') && s.actions) {
                    return s.actions;
                }
            }
        }

        return [];
    },

    // ═══════════════════════════════════════════════
    //  CONTEXT MANAGEMENT
    // ═══════════════════════════════════════════════

    /** @private */
    _loadContext: function(conversationId, extraContext) {
        var ctx = this.contextStore.getContext(conversationId) || {
            history: [],
            collectedData: {},
            intent: null,
            currentStep: null,
            missingFields: null,
            lastChoice: null
        };

        if (extraContext && typeof extraContext === 'object') {
            for (var key in extraContext) {
                if (extraContext.hasOwnProperty(key)) {
                    ctx[key] = extraContext[key];
                }
            }
        }

        return ctx;
    },

    /** @private */
    _saveContext: function(conversationId, ctx) {
        this.contextStore.updateContext(conversationId, ctx);
    },

    /** @private */
    _buildResponseContext: function(conversationId, ctx) {
        return {
            conversationId: conversationId,
            intent: ctx.intent || null,
            currentStep: ctx.currentStep || null,
            collectedData: ctx.collectedData || {}
        };
    },

    // ═══════════════════════════════════════════════
    //  FALLBACK & ERROR RESPONSES
    // ═══════════════════════════════════════════════

    /** @private */
    _fallbackResponse: function(stepConfig, ctx) {
        var response = {
            message: (stepConfig && stepConfig.content) || 'How can I help you?'
        };

        if (stepConfig && stepConfig.choices && stepConfig.choices.length > 0) {
            response.choices = [];
            for (var i = 0; i < stepConfig.choices.length; i++) {
                var c = stepConfig.choices[i];
                response.choices.push({
                    label: c.text || c.label || c.value,
                    value: c.value || c.text || c.label
                });
            }
        }

        if (ctx.missingFields && ctx.missingFields.length > 0) {
            var field = ctx.missingFields[0];
            response.message = field.prompt || ('Could you please provide your ' + field.name + '?');
            if (field.choices && field.choices.length > 0) {
                response.choices = [];
                for (var j = 0; j < field.choices.length; j++) {
                    var ch = field.choices[j];
                    var label = typeof ch === 'string' ? ch : (ch.text || ch.label || ch.value);
                    var value = typeof ch === 'string' ? ch : (ch.value || ch.text || ch.label);
                    response.choices.push({ label: label, value: value });
                }
            }
        }

        return response;
    },

    /** @private */
    _errorResponse: function(msg) {
        return {
            message: msg || 'I apologize, but I encountered an error. Please try again or contact the service desk.'
        };
    },

    /** @private */
    _log: function(message, level) {
        if (this.debugEnabled || level === 'error' || level === 'warn') {
            var prefix = '[SAGEEngine v3][' + (level || 'info').toUpperCase() + '] ';
            if (level === 'error') {
                gs.error(prefix + message, 'SAGEConversationEngine');
            } else {
                gs.log(prefix + message, 'SAGEConversationEngine');
            }
        }
    },

    /**
     * @returns {string}
     */
    getVersion: function() {
        return this.version;
    },

    type: 'SAGEConversationEngine'
};
