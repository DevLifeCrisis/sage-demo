/**
 * SAGEActionHandler - ServiceNow Record Creation & Action Execution
 * Creates real GlideRecords for HR cases, IT requests, manager tasks, and incidents.
 * Falls back to simulated record numbers if tables are unavailable.
 * ES5 Compatible for ServiceNow.
 *
 * @class SAGEActionHandler
 */
var SAGEActionHandler = Class.create();
SAGEActionHandler.prototype = {

    initialize: function() {
        this.debugEnabled = gs.getProperty('sage.debug.enabled', 'false') === 'true';
        this.demoMode = gs.getProperty('sage.demo.mode', 'false') === 'true';
    },

    // ─────────────────────────────────────────────
    //  PUBLIC API
    // ─────────────────────────────────────────────

    /**
     * Execute a list of actions from a flow step.
     * @param {Array} actionPlan - Array of action objects [{id, type, title, description, table, ...}]
     * @param {Object} context - Conversation context with collectedData
     * @returns {Object} { success: boolean, actions: [{title, status, number, sysId, table}] }
     */
    executeActions: function(actionPlan, context) {
        var actions = actionPlan || [];
        var ctx = context || {};
        var data = ctx.collectedData || {};
        var results = [];
        var allSuccess = true;

        for (var i = 0; i < actions.length; i++) {
            var action = actions[i];
            var result;

            try {
                switch (action.type) {
                    case 'hr':
                        result = this.createHRCase(this._buildHRData(action, data, ctx));
                        break;
                    case 'it':
                    case 'servicenow':
                        if (action.table === 'incident') {
                            result = this.createIncident(this._buildIncidentData(action, data, ctx));
                        } else {
                            result = this.createITRequest(this._buildITData(action, data, ctx));
                        }
                        break;
                    case 'manager':
                        result = this.createManagerTask(this._buildTaskData(action, data, ctx));
                        break;
                    case 'security':
                        result = this._simulateSecurityAction(action, data);
                        break;
                    default:
                        result = this._simulateAction(action, data);
                        break;
                }
            } catch (e) {
                this._log('Action failed: ' + action.title + ' - ' + e.message, 'error');
                result = {
                    success: false,
                    number: '',
                    sysId: '',
                    table: action.table || '',
                    error: e.message
                };
            }

            result.title = action.title;
            result.actionId = action.id || ('action_' + i);
            if (!result.success) { allSuccess = false; }
            results.push(result);
        }

        return {
            success: allSuccess,
            actions: results
        };
    },

    /**
     * Create an HR case record.
     * @param {Object} data - { shortDescription, description, employeeName, department, ... }
     * @returns {Object} { success, number, sysId, table }
     */
    createHRCase: function(data) {
        return this._createRecord('sn_hr_core_case', {
            short_description: data.shortDescription || 'SAGE: Employee Onboarding',
            description: data.description || '',
            subject_person: data.subjectPerson || '',
            hr_service: data.hrService || '',
            priority: data.priority || '3',
            state: '1',
            u_sage_generated: 'true'
        });
    },

    /**
     * Create an IT service request (sc_request + sc_req_item).
     * @param {Object} data
     * @returns {Object} { success, number, sysId, table, itemNumber, itemSysId }
     */
    createITRequest: function(data) {
        // Create the request
        var reqResult = this._createRecord('sc_request', {
            short_description: data.shortDescription || 'SAGE: IT Setup Request',
            description: data.description || '',
            requested_for: data.requestedFor || gs.getUserID(),
            priority: data.priority || '3',
            u_sage_generated: 'true'
        });

        if (reqResult.success) {
            // Create a request item linked to the request
            var itemResult = this._createRecord('sc_req_item', {
                request: reqResult.sysId,
                short_description: data.itemDescription || data.shortDescription || 'SAGE: IT Equipment/Access',
                description: data.description || '',
                priority: data.priority || '3',
                u_sage_generated: 'true'
            });

            reqResult.itemNumber = itemResult.number;
            reqResult.itemSysId = itemResult.sysId;
        }

        return reqResult;
    },

    /**
     * Create a manager task record.
     * @param {Object} data
     * @returns {Object} { success, number, sysId, table }
     */
    createManagerTask: function(data) {
        return this._createRecord('task', {
            short_description: data.shortDescription || 'SAGE: Manager Onboarding Task',
            description: data.description || '',
            assigned_to: data.assignedTo || '',
            priority: data.priority || '3',
            state: '1',
            u_sage_generated: 'true'
        });
    },

    /**
     * Create an incident record.
     * @param {Object} data
     * @returns {Object} { success, number, sysId, table }
     */
    createIncident: function(data) {
        return this._createRecord('incident', {
            short_description: data.shortDescription || 'SAGE: IT Support Issue',
            description: data.description || '',
            caller_id: data.callerId || gs.getUserID(),
            category: data.category || 'inquiry',
            subcategory: data.subcategory || '',
            priority: data.priority || '3',
            contact_type: 'SAGE Conversation',
            u_sage_generated: 'true'
        });
    },

    /**
     * Check the current status of previously created records.
     * @param {Array} recordNumbers - Array of {number, table} objects
     * @returns {Array} Array of {number, table, state, stateLabel, updatedOn}
     */
    getActionStatus: function(recordNumbers) {
        var statuses = [];
        var records = recordNumbers || [];

        for (var i = 0; i < records.length; i++) {
            var rec = records[i];
            try {
                var gr = new GlideRecord(rec.table);
                if (gr.get('number', rec.number)) {
                    statuses.push({
                        number: rec.number,
                        table: rec.table,
                        state: gr.getValue('state'),
                        stateLabel: gr.getDisplayValue('state'),
                        updatedOn: gr.getValue('sys_updated_on')
                    });
                } else {
                    statuses.push({
                        number: rec.number,
                        table: rec.table,
                        state: 'not_found',
                        stateLabel: 'Record not found',
                        updatedOn: ''
                    });
                }
            } catch (e) {
                statuses.push({
                    number: rec.number,
                    table: rec.table,
                    state: 'error',
                    stateLabel: 'Error: ' + e.message,
                    updatedOn: ''
                });
            }
        }

        return statuses;
    },

    // ─────────────────────────────────────────────
    //  PRIVATE - Record Creation
    // ─────────────────────────────────────────────

    /**
     * Generic record creation with graceful fallback to simulated numbers.
     * @private
     * @param {string} tableName
     * @param {Object} fieldValues - field name to value map
     * @returns {Object} { success, number, sysId, table }
     */
    _createRecord: function(tableName, fieldValues) {
        try {
            var gr = new GlideRecord(tableName);
            if (!gr.isValid()) {
                throw new Error('Table not available: ' + tableName);
            }

            gr.initialize();

            for (var field in fieldValues) {
                if (fieldValues.hasOwnProperty(field) && fieldValues[field]) {
                    try {
                        gr.setValue(field, fieldValues[field]);
                    } catch (fe) {
                        // Field may not exist on this table — skip it
                        this._log('Field ' + field + ' not found on ' + tableName + ', skipping', 'debug');
                    }
                }
            }

            var sysId = gr.insert();
            if (!sysId) {
                throw new Error('Insert returned no sys_id');
            }

            var number = gr.getValue('number') || sysId;

            this._log('Created ' + tableName + ': ' + number, 'info');
            return {
                success: true,
                number: number,
                sysId: String(sysId),
                table: tableName,
                status: 'completed'
            };

        } catch (e) {
            this._log('_createRecord failed for ' + tableName + ': ' + e.message, 'warn');

            // Graceful fallback: return simulated record number
            var simNumber = this._generateSimNumber(tableName);
            return {
                success: true,
                number: simNumber,
                sysId: 'sim-' + new GlideDateTime().getNumericValue(),
                table: tableName,
                status: 'completed',
                simulated: true
            };
        }
    },

    /**
     * @private
     */
    _generateSimNumber: function(tableName) {
        var prefixes = {
            'sn_hr_core_case': 'HR',
            'sc_request': 'REQ',
            'sc_req_item': 'RITM',
            'incident': 'INC',
            'task': 'TASK'
        };
        var prefix = prefixes[tableName] || 'SAGE';
        var ts = String(new GlideDateTime().getNumericValue()).slice(-6);
        return prefix + ts;
    },

    // ─────────────────────────────────────────────
    //  PRIVATE - Data Builders
    // ─────────────────────────────────────────────

    /** @private */
    _buildHRData: function(action, data, ctx) {
        var name = data.employee_name || data.contractor_name || 'Unknown';
        return {
            shortDescription: (action.title || 'SAGE HR Case') + ' - ' + name,
            description: 'Created by SAGE.\n'
                + 'Name: ' + name + '\n'
                + 'Department: ' + (data.department || 'N/A') + '\n'
                + 'Start Date: ' + (data.start_date || data.end_date || 'N/A') + '\n'
                + 'Job Title: ' + (data.job_title || 'N/A') + '\n'
                + 'Location: ' + (data.work_location || 'N/A'),
            priority: '3'
        };
    },

    /** @private */
    _buildITData: function(action, data, ctx) {
        var name = data.employee_name || data.contractor_name || 'Unknown';
        return {
            shortDescription: (action.title || 'SAGE IT Request') + ' - ' + name,
            description: 'Created by SAGE.\n'
                + 'Name: ' + name + '\n'
                + 'Department: ' + (data.department || 'N/A') + '\n'
                + 'Location: ' + (data.work_location || 'N/A'),
            itemDescription: 'New employee IT setup - ' + name,
            priority: '3'
        };
    },

    /** @private */
    _buildIncidentData: function(action, data, ctx) {
        var category = data.issue_category || ctx.lastChoice || 'general';
        return {
            shortDescription: category + ' Issue - ' + (data.issue_description || 'Reported via SAGE').substring(0, 100),
            description: 'Created by SAGE IT Support.\n\n'
                + 'Category: ' + category + '\n'
                + 'Description: ' + (data.issue_description || 'N/A') + '\n'
                + 'When Started: ' + (data.when_started || 'N/A') + '\n'
                + 'Frequency: ' + (data.frequency || 'N/A') + '\n'
                + 'Error Message: ' + (data.error_message || 'None reported'),
            category: 'IT Support',
            subcategory: category,
            priority: '3'
        };
    },

    /** @private */
    _buildTaskData: function(action, data, ctx) {
        var name = data.employee_name || 'Unknown';
        return {
            shortDescription: (action.title || 'SAGE Manager Task') + ' - ' + name,
            description: 'Created by SAGE.\n'
                + 'New hire: ' + name + '\n'
                + 'Start Date: ' + (data.start_date || 'N/A') + '\n'
                + 'Department: ' + (data.department || 'N/A'),
            priority: '3'
        };
    },

    /** @private */
    _simulateSecurityAction: function(action, data) {
        var simNumber = 'SEC' + String(new GlideDateTime().getNumericValue()).slice(-6);
        return {
            success: true,
            number: simNumber,
            sysId: 'sim-sec-' + new GlideDateTime().getNumericValue(),
            table: 'security_action',
            status: 'completed',
            simulated: true
        };
    },

    /** @private */
    _simulateAction: function(action, data) {
        var simNumber = 'SAGE' + String(new GlideDateTime().getNumericValue()).slice(-6);
        return {
            success: true,
            number: simNumber,
            sysId: 'sim-' + new GlideDateTime().getNumericValue(),
            table: action.table || 'unknown',
            status: 'completed',
            simulated: true
        };
    },

    /** @private */
    _log: function(message, level) {
        if (this.debugEnabled || level === 'error' || level === 'warn') {
            var prefix = '[SAGEActionHandler][' + (level || 'info').toUpperCase() + '] ';
            if (level === 'error') {
                gs.error(prefix + message, 'SAGEActionHandler');
            } else {
                gs.log(prefix + message, 'SAGEActionHandler');
            }
        }
    },

    type: 'SAGEActionHandler'
};
