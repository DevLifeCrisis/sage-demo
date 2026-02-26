/**
 * SAGEContextStore - Database-Backed Conversation Context Persistence
 * Stores and retrieves conversation state from the sage_conversation_context table.
 * ES5 Compatible for ServiceNow
 *
 * Table: sage_conversation_context
 * Fields:
 *   - conversation_id (string, indexed)
 *   - context_data (string/JSON, 65000 chars)
 *   - user_id (reference to sys_user)
 *   - session_id (string)
 *   - sys_created_on (auto)
 *   - sys_updated_on (auto)
 *
 * @class SAGEContextStore
 */
var SAGEContextStore = Class.create();
SAGEContextStore.prototype = {

    /** @type {string} */
    TABLE_NAME: 'sage_conversation_context',

    initialize: function() {
        this.debugEnabled = gs.getProperty('sage.debug.enabled', 'false') === 'true';
    },

    /**
     * Retrieve the conversation context for a given conversation ID.
     * @param {string} conversationId - Unique conversation identifier
     * @returns {Object|null} The context object, or null if not found
     */
    getContext: function(conversationId) {
        if (!conversationId) {
            return null;
        }

        try {
            var gr = new GlideRecord(this.TABLE_NAME);
            gr.addQuery('conversation_id', conversationId);
            gr.setLimit(1);
            gr.query();

            if (gr.next()) {
                var raw = gr.getValue('context_data');
                if (raw) {
                    return JSON.parse(raw);
                }
            }
        } catch (e) {
            this._log('getContext error for ' + conversationId + ': ' + e.message, 'error');
        }

        return null;
    },

    /**
     * Create or update the conversation context. Merges updates into
     * the existing context object (shallow merge).
     * @param {string} conversationId - Unique conversation identifier
     * @param {Object} updates - Key/value pairs to merge into the stored context
     * @returns {boolean} true on success
     */
    updateContext: function(conversationId, updates) {
        if (!conversationId) {
            return false;
        }

        try {
            var gr = new GlideRecord(this.TABLE_NAME);
            gr.addQuery('conversation_id', conversationId);
            gr.setLimit(1);
            gr.query();

            var ctx = {};
            var isNew = !gr.next();

            if (!isNew) {
                var raw = gr.getValue('context_data');
                if (raw) {
                    ctx = JSON.parse(raw);
                }
            } else {
                gr.initialize();
                gr.setValue('conversation_id', conversationId);
                gr.setValue('user_id', gs.getUserID());
                gr.setValue('session_id', gs.getSession().getSessionID());
            }

            // Shallow merge
            if (updates && typeof updates === 'object') {
                for (var key in updates) {
                    if (updates.hasOwnProperty(key)) {
                        ctx[key] = updates[key];
                    }
                }
            }

            ctx.lastUpdated = new GlideDateTime().getDisplayValue();
            gr.setValue('context_data', JSON.stringify(ctx));

            if (isNew) {
                gr.insert();
            } else {
                gr.update();
            }

            return true;
        } catch (e) {
            this._log('updateContext error for ' + conversationId + ': ' + e.message, 'error');
            return false;
        }
    },

    /**
     * Delete the conversation context record entirely.
     * @param {string} conversationId - Unique conversation identifier
     * @returns {boolean} true on success
     */
    deleteContext: function(conversationId) {
        if (!conversationId) {
            return false;
        }

        try {
            var gr = new GlideRecord(this.TABLE_NAME);
            gr.addQuery('conversation_id', conversationId);
            gr.query();

            while (gr.next()) {
                gr.deleteRecord();
            }

            return true;
        } catch (e) {
            this._log('deleteContext error for ' + conversationId + ': ' + e.message, 'error');
            return false;
        }
    },

    /**
     * Remove conversation contexts older than maxAgeMinutes.
     * Intended to be called from a scheduled job or periodically.
     * @param {number} [maxAgeMinutes=30] - Maximum age in minutes
     * @returns {number} Count of deleted records
     */
    cleanExpiredContexts: function(maxAgeMinutes) {
        var maxAge = maxAgeMinutes || 30;
        var count = 0;

        try {
            var cutoff = new GlideDateTime();
            cutoff.addSeconds(-maxAge * 60);

            var gr = new GlideRecord(this.TABLE_NAME);
            gr.addQuery('sys_updated_on', '<', cutoff);
            gr.query();

            while (gr.next()) {
                gr.deleteRecord();
                count++;
            }

            this._log('Cleaned ' + count + ' expired contexts (older than ' + maxAge + ' min)', 'info');
        } catch (e) {
            this._log('cleanExpiredContexts error: ' + e.message, 'error');
        }

        return count;
    },

    /**
     * @private
     */
    _log: function(message, level) {
        if (this.debugEnabled || level === 'error') {
            var prefix = '[SAGEContextStore][' + (level || 'info').toUpperCase() + '] ';
            if (level === 'error') {
                gs.error(prefix + message, 'SAGEContextStore');
            } else {
                gs.log(prefix + message, 'SAGEContextStore');
            }
        }
    },

    type: 'SAGEContextStore'
};
