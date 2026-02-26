/**
 * SAGEDemoSeeder - Demo Data Seeder for Controlled Demonstrations
 * Seeds the instance with demo users, catalog items, and system properties.
 * All demo records are tagged with sage_demo markers for easy cleanup.
 * ES5 Compatible for ServiceNow.
 *
 * @class SAGEDemoSeeder
 */
var SAGEDemoSeeder = Class.create();
SAGEDemoSeeder.prototype = {

    /** @type {string} Demo marker value used to tag all seeded records */
    DEMO_TAG: 'sage_demo_record',

    /** @type {string} System property tracking demo state */
    STATE_PROP: 'sage.demo.state',

    initialize: function() {
        this.debugEnabled = gs.getProperty('sage.debug.enabled', 'false') === 'true';
    },

    // ─────────────────────────────────────────────
    //  PUBLIC API
    // ─────────────────────────────────────────────

    /**
     * Seed the instance with demo data.
     * @returns {Object} { success, seededRecords: [...], message }
     */
    seedDemo: function() {
        try {
            var seeded = [];

            // 1. Set system properties for demo mode
            this._setDemoProperties();
            seeded.push({ type: 'property', name: 'sage.demo.mode', value: 'true' });

            // 2. Create or find demo users
            var users = this._seedDemoUsers();
            for (var i = 0; i < users.length; i++) {
                seeded.push({ type: 'user', name: users[i].name, sysId: users[i].sysId });
            }

            // 3. Create demo catalog items (if service catalog is available)
            var catItems = this._seedCatalogItems();
            for (var j = 0; j < catItems.length; j++) {
                seeded.push({ type: 'catalog_item', name: catItems[j].name, sysId: catItems[j].sysId });
            }

            // 4. Create sample conversation context
            var contexts = this._seedSampleContexts();
            for (var k = 0; k < contexts.length; k++) {
                seeded.push({ type: 'context', id: contexts[k].id });
            }

            // Mark state
            gs.setProperty(this.STATE_PROP, 'seeded');

            this._log('Demo seeded successfully with ' + seeded.length + ' records', 'info');

            return {
                success: true,
                seededRecords: seeded,
                message: 'Demo environment ready. ' + seeded.length + ' records created/configured.'
            };

        } catch (e) {
            this._log('seedDemo failed: ' + e.message, 'error');
            return {
                success: false,
                seededRecords: [],
                message: 'Failed to seed demo: ' + e.message
            };
        }
    },

    /**
     * Clean up all demo data created by previous seedDemo runs.
     * @returns {Object} { success, cleanedRecords: number }
     */
    resetDemo: function() {
        try {
            var count = 0;

            // Clean tagged records from common tables
            var tables = [
                'sys_user', 'sc_cat_item', 'sn_hr_core_case', 'sc_request',
                'sc_req_item', 'incident', 'task', 'sage_conversation_context',
                'sage_conversation_log'
            ];

            for (var i = 0; i < tables.length; i++) {
                count += this._cleanTable(tables[i]);
            }

            // Reset properties
            gs.setProperty('sage.demo.mode', 'false');
            gs.setProperty(this.STATE_PROP, 'idle');

            this._log('Demo reset: cleaned ' + count + ' records', 'info');

            return {
                success: true,
                cleanedRecords: count
            };

        } catch (e) {
            this._log('resetDemo failed: ' + e.message, 'error');
            return {
                success: false,
                cleanedRecords: 0,
                message: 'Failed to reset demo: ' + e.message
            };
        }
    },

    /**
     * Get current demo environment status.
     * @returns {Object} { status, activeRecords: [...] }
     */
    getDemoStatus: function() {
        var state = gs.getProperty(this.STATE_PROP, 'idle');
        var activeRecords = [];

        var tables = ['sn_hr_core_case', 'sc_request', 'incident', 'task'];
        for (var i = 0; i < tables.length; i++) {
            var recs = this._countTagged(tables[i]);
            if (recs > 0) {
                activeRecords.push({ table: tables[i], count: recs });
            }
        }

        // If we have records but state says idle, correct it
        if (activeRecords.length > 0 && state === 'idle') {
            state = 'active';
        }

        return {
            status: state,
            activeRecords: activeRecords,
            demoMode: gs.getProperty('sage.demo.mode', 'false') === 'true'
        };
    },

    // ─────────────────────────────────────────────
    //  PRIVATE - Seeding Methods
    // ─────────────────────────────────────────────

    /** @private */
    _setDemoProperties: function() {
        gs.setProperty('sage.demo.mode', 'true');
        gs.setProperty('sage.debug.enabled', 'true');
        gs.setProperty('sage.fallback.enabled', 'true');
        gs.setProperty('sage.llm.temperature', '0.3');
        gs.setProperty('sage.llm.max_tokens', '500');
    },

    /** @private */
    _seedDemoUsers: function() {
        var users = [];
        var demoUsers = [
            { user_name: 'sage.demo.newhire', first_name: 'Alex', last_name: 'Rivera', title: 'Software Engineer', department: 'Engineering', email: 'alex.rivera@agency.gov' },
            { user_name: 'sage.demo.manager', first_name: 'Jordan', last_name: 'Chen', title: 'Engineering Manager', department: 'Engineering', email: 'jordan.chen@agency.gov' },
            { user_name: 'sage.demo.contractor', first_name: 'Morgan', last_name: 'Smith', title: 'Security Consultant', department: 'IT Security', email: 'morgan.smith@contractor.gov' }
        ];

        for (var i = 0; i < demoUsers.length; i++) {
            var u = demoUsers[i];
            var result = this._findOrCreateUser(u);
            users.push(result);
        }

        return users;
    },

    /** @private */
    _findOrCreateUser: function(userData) {
        try {
            var gr = new GlideRecord('sys_user');
            gr.addQuery('user_name', userData.user_name);
            gr.setLimit(1);
            gr.query();

            if (gr.next()) {
                return { name: userData.first_name + ' ' + userData.last_name, sysId: gr.getUniqueValue(), existing: true };
            }

            gr.initialize();
            gr.setValue('user_name', userData.user_name);
            gr.setValue('first_name', userData.first_name);
            gr.setValue('last_name', userData.last_name);
            gr.setValue('title', userData.title);
            gr.setValue('department', userData.department);
            gr.setValue('email', userData.email);
            gr.setValue('active', true);

            try { gr.setValue('u_sage_generated', 'true'); } catch (e) { /* field may not exist */ }

            var sysId = gr.insert();
            return { name: userData.first_name + ' ' + userData.last_name, sysId: String(sysId), existing: false };

        } catch (e) {
            this._log('Failed to create user ' + userData.user_name + ': ' + e.message, 'warn');
            return { name: userData.first_name + ' ' + userData.last_name, sysId: '', existing: false, error: e.message };
        }
    },

    /** @private */
    _seedCatalogItems: function() {
        var items = [];
        var catItems = [
            { name: 'SAGE: New Employee IT Setup', short_description: 'Automated IT provisioning for new employees via SAGE', category: 'Hardware' },
            { name: 'SAGE: Employee Onboarding Package', short_description: 'Complete onboarding automation via SAGE', category: 'Services' }
        ];

        for (var i = 0; i < catItems.length; i++) {
            var item = catItems[i];
            try {
                var gr = new GlideRecord('sc_cat_item');
                gr.addQuery('name', item.name);
                gr.setLimit(1);
                gr.query();

                if (gr.next()) {
                    items.push({ name: item.name, sysId: gr.getUniqueValue(), existing: true });
                    continue;
                }

                gr.initialize();
                gr.setValue('name', item.name);
                gr.setValue('short_description', item.short_description);
                gr.setValue('active', true);
                try { gr.setValue('u_sage_generated', 'true'); } catch (e) { /* field may not exist */ }

                var sysId = gr.insert();
                items.push({ name: item.name, sysId: String(sysId), existing: false });

            } catch (e) {
                this._log('Failed to create catalog item: ' + e.message, 'warn');
            }
        }

        return items;
    },

    /** @private */
    _seedSampleContexts: function() {
        var contexts = [];
        try {
            var store = new SAGEContextStore();
            store.updateContext('demo-onboarding-001', {
                intent: 'onboarding',
                currentStep: 'step1',
                collectedData: {},
                history: []
            });
            contexts.push({ id: 'demo-onboarding-001' });

            store.updateContext('demo-offboarding-001', {
                intent: 'offboarding',
                currentStep: 'step1',
                collectedData: {},
                history: []
            });
            contexts.push({ id: 'demo-offboarding-001' });
        } catch (e) {
            this._log('Failed to seed contexts: ' + e.message, 'warn');
        }

        return contexts;
    },

    // ─────────────────────────────────────────────
    //  PRIVATE - Cleanup
    // ─────────────────────────────────────────────

    /** @private */
    _cleanTable: function(tableName) {
        var count = 0;
        try {
            var gr = new GlideRecord(tableName);
            if (!gr.isValid()) { return 0; }

            // Try u_sage_generated field first
            try {
                gr.addQuery('u_sage_generated', 'true');
                gr.query();
                while (gr.next()) {
                    gr.deleteRecord();
                    count++;
                }
                return count;
            } catch (e) {
                // Field doesn't exist — try by username pattern for sys_user
            }

            // For sys_user, clean by username pattern
            if (tableName === 'sys_user') {
                gr = new GlideRecord(tableName);
                gr.addQuery('user_name', 'STARTSWITH', 'sage.demo.');
                gr.query();
                while (gr.next()) {
                    gr.deleteRecord();
                    count++;
                }
            }

            // For conversation context, clean demo prefixed
            if (tableName === 'sage_conversation_context') {
                gr = new GlideRecord(tableName);
                gr.addQuery('conversation_id', 'STARTSWITH', 'demo-');
                gr.query();
                while (gr.next()) {
                    gr.deleteRecord();
                    count++;
                }
            }

        } catch (e) {
            this._log('Error cleaning table ' + tableName + ': ' + e.message, 'warn');
        }

        return count;
    },

    /** @private */
    _countTagged: function(tableName) {
        try {
            var ga = new GlideAggregate(tableName);
            ga.addQuery('u_sage_generated', 'true');
            ga.addAggregate('COUNT');
            ga.query();
            if (ga.next()) {
                return parseInt(ga.getAggregate('COUNT'), 10) || 0;
            }
        } catch (e) {
            // Field or table doesn't exist
        }
        return 0;
    },

    /** @private */
    _log: function(message, level) {
        if (this.debugEnabled || level === 'error' || level === 'warn') {
            var prefix = '[SAGEDemoSeeder][' + (level || 'info').toUpperCase() + '] ';
            if (level === 'error') {
                gs.error(prefix + message, 'SAGEDemoSeeder');
            } else {
                gs.log(prefix + message, 'SAGEDemoSeeder');
            }
        }
    },

    type: 'SAGEDemoSeeder'
};
