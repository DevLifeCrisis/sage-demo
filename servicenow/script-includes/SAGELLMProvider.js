/**
 * SAGELLMProvider - Now Assist LLM Provider
 * Unified interface for AI calls via ServiceNow's native GenAI platform (sn_gen_ai).
 * ES5 Compatible for ServiceNow.
 *
 * System Properties:
 *   sage.llm.temperature   - Generation temperature (default: 0.3)
 *   sage.llm.max_tokens    - Max response tokens (default: 500)
 *   sage.llm.model         - Now Assist model identifier
 *   sage.debug.enabled     - Verbose logging (default: false)
 *
 * @class SAGELLMProvider
 */
var SAGELLMProvider = Class.create();
SAGELLMProvider.prototype = {

    initialize: function() {
        this.model = gs.getProperty('sage.llm.model', '');
        this.temperature = parseFloat(gs.getProperty('sage.llm.temperature', '0.3'));
        this.maxTokens = parseInt(gs.getProperty('sage.llm.max_tokens', '500'), 10);
        this.debugEnabled = gs.getProperty('sage.debug.enabled', 'false') === 'true';
    },

    // ─────────────────────────────────────────────
    //  PUBLIC API
    // ─────────────────────────────────────────────

    /**
     * Generate a text response from the LLM.
     * @param {string} systemPrompt - System-level instructions
     * @param {string} userMessage - The user's message text
     * @param {Array} [conversationHistory] - Prior messages [{role, content}]
     * @returns {string} The generated text response
     */
    generate: function(systemPrompt, userMessage, conversationHistory) {
        var messages = [];
        var history = conversationHistory || [];

        // Build message array
        if (systemPrompt) {
            messages.push({ role: 'system', content: systemPrompt });
        }

        for (var i = 0; i < history.length; i++) {
            messages.push({
                role: history[i].role || 'user',
                content: history[i].content || ''
            });
        }

        // If userMessage is a string, add it; if it's an array (legacy compat), merge
        if (typeof userMessage === 'string') {
            messages.push({ role: 'user', content: userMessage });
        } else if (userMessage && typeof userMessage === 'object' && userMessage.length) {
            for (var j = 0; j < userMessage.length; j++) {
                messages.push(userMessage[j]);
            }
        }

        try {
            return this._callNowAssist(messages, this.temperature, this.maxTokens);
        } catch (e) {
            this._log('generate() failed: ' + e.message, 'error');
            return '{"message":"I apologize, but I\\'m experiencing a temporary issue with the AI service. Please try again in a moment or contact the service desk for immediate assistance.","flowSignal":"continue"}';
        }
    },

    /**
     * Classify user intent from a message.
     * @param {string} message - The user's raw message
     * @param {Array} categories - Available intent categories
     * @returns {string} The matched category string
     */
    classify: function(message, categories) {
        var cats = categories || ['onboarding', 'offboarding', 'it_support', 'general'];

        var systemPrompt = 'You are an intent classifier for SAGE, a government IT service desk assistant. '
            + 'Classify the user message into exactly ONE of these intents: ' + cats.join(', ') + '. '
            + 'Respond with ONLY a JSON object: {"intent":"<intent>","confidence":<0.0-1.0>}. '
            + 'If the message does not clearly match any specific intent, use "general". '
            + 'Do not include any other text.';

        try {
            var raw = this._callNowAssist(
                [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: message }
                ],
                0.1,
                60
            );

            var parsed = JSON.parse(raw);
            if (parsed && parsed.intent) {
                return parsed.intent;
            }
        } catch (e) {
            this._log('classify() parse failed: ' + e.message, 'warn');
        }

        // Fallback: scan raw text for category names
        if (typeof raw === 'string') {
            var lower = raw.toLowerCase();
            for (var i = 0; i < cats.length; i++) {
                if (lower.indexOf(cats[i]) !== -1) {
                    return cats[i];
                }
            }
        }

        return 'general';
    },

    /**
     * Extract structured entities from user text.
     * @param {string} message - The user's message
     * @param {Object} entitySchema - Field descriptors [{name, label, type, required}]
     * @returns {Object} Map of fieldName to extracted value
     */
    extractEntities: function(message, entitySchema) {
        var schema = entitySchema || [];
        var fieldList = [];
        for (var i = 0; i < schema.length; i++) {
            var f = schema[i];
            fieldList.push('- ' + f.name + ' (' + (f.label || f.name) + '): '
                + (f.type || 'text') + (f.required ? ' [REQUIRED]' : ''));
        }

        var systemPrompt = 'You are an entity extraction engine. Extract structured data from the user message.\n'
            + 'Fields to extract:\n' + fieldList.join('\n') + '\n\n'
            + 'Respond with ONLY a JSON object mapping field names to extracted values. '
            + 'Only include fields clearly present in the message. Do not guess. If nothing found, return {}.';

        try {
            var raw = this._callNowAssist(
                [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: message }
                ],
                0.1,
                300
            );

            var cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
            var parsed = JSON.parse(cleaned);
            if (parsed && typeof parsed === 'object') {
                return parsed;
            }
        } catch (e) {
            this._log('extractEntities() failed: ' + e.message, 'warn');
        }

        return {};
    },

    /**
     * Check if Now Assist is available and responsive.
     * @returns {boolean}
     */
    isAvailable: function() {
        try {
            var result = this._callNowAssist(
                [
                    { role: 'system', content: 'Respond with exactly: OK' },
                    { role: 'user', content: 'ping' }
                ],
                0,
                10
            );
            return !!(result && result.indexOf('OK') !== -1);
        } catch (e) {
            this._log('isAvailable() check failed: ' + e.message, 'warn');
            return false;
        }
    },

    // ─────────────────────────────────────────────
    //  NOW ASSIST ADAPTER (PRIVATE)
    // ─────────────────────────────────────────────

    /**
     * Call Now Assist via sn_gen_ai APIs.
     * Tries multiple API surfaces for compatibility across ServiceNow releases.
     * @private
     * @param {Array} messages - [{role, content}]
     * @param {number} temperature
     * @param {number} maxTokens
     * @returns {string} Generated text
     */
    _callNowAssist: function(messages, temperature, maxTokens) {
        this._log('Calling Now Assist, messages: ' + messages.length, 'debug');

        // Strategy 1: sn_gen_ai.GenAiController (Washington+)
        if (typeof sn_gen_ai !== 'undefined') {
            try {
                if (sn_gen_ai.GenAiController) {
                    var controller = new sn_gen_ai.GenAiController();
                    var request = {
                        messages: messages,
                        temperature: temperature,
                        max_tokens: maxTokens
                    };
                    if (this.model) {
                        request.model = this.model;
                    }

                    var response = controller.generateText(JSON.stringify(request));
                    if (response) {
                        return this._extractText(response);
                    }
                }
            } catch (e1) {
                this._log('GenAiController failed: ' + e1.message, 'warn');
            }

            // Strategy 2: sn_gen_ai.GenAiService
            try {
                if (sn_gen_ai.GenAiService) {
                    var service = new sn_gen_ai.GenAiService();
                    var combinedPrompt = this._messagesToPrompt(messages);
                    var result = service.generateText(combinedPrompt);
                    if (result) {
                        return this._extractText(result);
                    }
                }
            } catch (e2) {
                this._log('GenAiService failed: ' + e2.message, 'warn');
            }
        }

        // Strategy 3: GlideAIService (legacy)
        if (typeof GlideAIService !== 'undefined') {
            try {
                var aiService = new GlideAIService();
                var prompt = this._messagesToPrompt(messages);
                var aiResult = aiService.generateText(prompt);
                if (aiResult) {
                    return String(aiResult);
                }
            } catch (e3) {
                this._log('GlideAIService failed: ' + e3.message, 'warn');
            }
        }

        throw new Error('Now Assist APIs not available on this instance. Ensure Now Assist (sn_gen_ai) is activated.');
    },

    /**
     * Extract text content from various Now Assist response formats.
     * @private
     * @param {*} response
     * @returns {string}
     */
    _extractText: function(response) {
        if (typeof response === 'string') {
            try {
                var parsed = JSON.parse(response);
                if (parsed.choices && parsed.choices.length > 0) {
                    return parsed.choices[0].message
                        ? parsed.choices[0].message.content
                        : (parsed.choices[0].text || '');
                }
                if (parsed.text) { return parsed.text; }
                if (parsed.content) { return parsed.content; }
                if (parsed.message) { return parsed.message; }
            } catch (e) {
                // Not JSON — return raw string
            }
            return response;
        }
        return String(response);
    },

    /**
     * Convert message array to a single prompt string (for legacy APIs).
     * @private
     * @param {Array} messages
     * @returns {string}
     */
    _messagesToPrompt: function(messages) {
        var parts = [];
        for (var i = 0; i < messages.length; i++) {
            var m = messages[i];
            if (m.role === 'system') {
                parts.push('[System Instructions]\n' + m.content);
            } else if (m.role === 'assistant') {
                parts.push('Assistant: ' + m.content);
            } else {
                parts.push('User: ' + m.content);
            }
        }
        return parts.join('\n\n');
    },

    /**
     * @private
     */
    _log: function(message, level) {
        if (this.debugEnabled || level === 'error' || level === 'warn') {
            var prefix = '[SAGELLMProvider][' + (level || 'info').toUpperCase() + '] ';
            if (level === 'error') {
                gs.error(prefix + message, 'SAGELLMProvider');
            } else {
                gs.log(prefix + message, 'SAGELLMProvider');
            }
        }
    },

    type: 'SAGELLMProvider'
};
