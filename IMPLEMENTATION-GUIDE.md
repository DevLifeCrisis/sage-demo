# SAGE React App — ServiceNow Implementation Guide

> **Version:** 1.0 · **Last Updated:** February 2026  
> **Audience:** ServiceNow administrators deploying SAGE into a ServiceNow instance  
> **Time Estimate:** 2–4 hours for a complete deployment

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Build the React App](#2-build-the-react-app)
3. [Tables to Create](#3-tables-to-create)
4. [System Properties to Create](#4-system-properties-to-create)
5. [Script Includes to Create](#5-script-includes-to-create)
6. [Scripted REST API Setup](#6-scripted-rest-api-setup)
7. [UI Page Setup](#7-ui-page-setup)
8. [Application Menu & Module](#8-application-menu--module)
9. [Now Assist Configuration](#9-now-assist-configuration)
10. [Security & ACLs](#10-security--acls)
11. [Testing Checklist](#11-testing-checklist)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Prerequisites

### ServiceNow Instance Requirements

| Requirement | Details |
|---|---|
| **Version** | **Washington DC** or later (required for `sn_gen_ai` APIs). Xanadu recommended. |
| **Instance Type** | Developer, sub-production, or production. PDI (Personal Developer Instance) works for testing. |

### Plugins That Must Be Active

Navigate to **System Definition > Plugins** and verify each is installed and active:

| Plugin | ID | Why Needed |
|---|---|---|
| Now Assist for ITSM | `sn_now_assist` | Provides the GenAI Controller and LLM integration |
| Generative AI Controller | `sn_gen_ai` | Core API (`sn_gen_ai.GenAiController`) used by SAGELLMProvider |
| HR Service Delivery | `sn_hr_core` | Provides the `sn_hr_core_case` table for HR cases |
| Service Catalog | `com.glideapp.servicecatalog` | Provides `sc_request`, `sc_req_item`, `sc_cat_item` tables |
| IT Service Management | `com.snc.incident` | Provides the `incident` table |
| Scripted REST APIs | `com.glide.scripted_rest_api` | Allows creating custom REST endpoints |

> **To check:** Type the plugin ID in the filter navigator search, or go to **System Definition > Plugins**, search by name, and confirm **Status = Active**.

### Local Development Requirements (for building the React app)

| Tool | Version | Install |
|---|---|---|
| **Node.js** | v18+ (v22 recommended) | [nodejs.org](https://nodejs.org) |
| **npm** | v9+ (comes with Node) | Included with Node.js |
| **Git** (optional) | Any | For cloning the repo |

---

## 2. Build the React App

### 2.1 Install Dependencies

Open a terminal in the `SAGE-React-App/` directory and run:

```bash
npm install
```

This installs React 18, React Router, Framer Motion, Vite, and build tools.

### 2.2 Switch API from Mock to Live (Important!)

Before building, you must switch the API service layer from mock to live ServiceNow endpoints.

Edit **`src/services/api.js`**:

1. **Uncomment** the line near the top:
   ```js
   const BASE_URL = '/api/x_ecs_sage/sage';  // ServiceNow REST endpoint
   ```

2. **Delete or comment out** the entire `// MOCK IMPLEMENTATIONS` section (all the functions with `await delay(...)`)

3. **Uncomment** the entire `// REAL IMPLEMENTATIONS` section at the bottom of the file

4. **Save the file**

### 2.3 Build

```bash
npm run build
```

### 2.4 Verify the Build

After the build completes, check the `dist/` folder. You should see:

```
dist/
├── sage-app.js       ← Single bundled JavaScript file
├── sage-app.css      ← Single bundled CSS file
└── index.html        ← (not used in ServiceNow)
```

The key files are **`sage-app.js`** and **`sage-app.css`**. These are what you'll upload to ServiceNow.

> **Why single files?** The `vite.config.js` is configured with `inlineDynamicImports: true` and `cssCodeSplit: false` to produce exactly one JS and one CSS file — perfect for embedding in a ServiceNow UI Page.

---

## 3. Tables to Create

You need to create **2 custom tables**. The other tables referenced in the code (`incident`, `task`, `sc_request`, `sc_req_item`, `sn_hr_core_case`, `sys_user`, `sc_cat_item`) are standard ServiceNow tables and already exist.

### 3.1 Table: `sage_conversation_context`

> **Navigate to:** System Definition > Tables > New

| Setting | Value |
|---|---|
| **Label** | SAGE Conversation Context |
| **Name** | `sage_conversation_context` |
| **Extends** | -- None -- (new table) |
| **Add module to menu** | ✅ (optional, useful for debugging) |
| **Create access controls** | ✅ |

**Columns to add** (click "New" in the Columns related list):

| Column Label | Column Name | Type | Max Length | Required | Default | Description |
|---|---|---|---|---|---|---|
| Conversation ID | `conversation_id` | String | 100 | ✅ Yes | — | Unique conversation identifier. **Create an index on this field** (see below). |
| Context Data | `context_data` | String | 65000 | No | — | JSON-serialized conversation state (intent, collected data, history). |
| User | `user_id` | Reference → `sys_user` | — | No | — | The user who initiated the conversation. |
| Session ID | `session_id` | String | 100 | No | — | ServiceNow session ID for the conversation. |

> **sys_created_on** and **sys_updated_on** are automatically present on all ServiceNow tables.

**Create an index on `conversation_id`:**
1. Navigate to **System Definition > Tables**
2. Open the `sage_conversation_context` table record
3. Scroll to the **Database Indexes** related list
4. Click **New**
5. Set Index name: `sage_conv_id_idx`
6. Add `conversation_id` as the indexed column
7. Save

### 3.2 Table: `sage_conversation_log`

> **Navigate to:** System Definition > Tables > New

| Setting | Value |
|---|---|
| **Label** | SAGE Conversation Log |
| **Name** | `sage_conversation_log` |
| **Extends** | -- None -- |
| **Add module to menu** | ✅ (optional) |
| **Create access controls** | ✅ |

**Columns to add:**

| Column Label | Column Name | Type | Max Length | Required | Default | Description |
|---|---|---|---|---|---|---|
| Conversation ID | `conversation_id` | String | 100 | ✅ Yes | — | Links to the conversation context. |
| Activity Type | `activity_type` | String | 50 | No | — | Type of activity (message, action, choice, etc.). |
| Message Content | `message_content` | String | 65000 | No | — | The message or action content. |
| User | `user_id` | Reference → `sys_user` | — | No | — | The user associated with this log entry. |

### 3.3 Add `u_sage_generated` Field to Existing Tables

The code tags SAGE-created records with a `u_sage_generated` field. Add this field to each of these **existing** tables:

- `incident`
- `task`
- `sc_request`
- `sc_req_item`
- `sn_hr_core_case`
- `sc_cat_item`
- `sys_user`

**For each table:**

1. Navigate to **System Definition > Tables**
2. Search for and open the table (e.g., `incident`)
3. In the **Columns** related list, click **New**
4. Set:
   - **Column label:** SAGE Generated
   - **Column name:** `u_sage_generated`  
   - **Type:** True/False
   - **Default value:** `false`
5. Click **Submit**

> **Note:** If you're working in a scoped app, field names will be prefixed with your scope (e.g., `x_ecs_sage_sage_generated`). The code tries to set this field but catches errors gracefully if it doesn't exist — so this step is **optional but recommended** for demo cleanup functionality.

---

## 4. System Properties to Create

> **Navigate to:** System Properties > All Properties > New  
> (Or use the filter navigator: `sys_properties.list`)

Create each property below:

| Property Name | Type | Default Value | Description |
|---|---|---|---|
| `sage.debug.enabled` | `true/false` | `false` | Enable verbose debug logging for all SAGE Script Includes. Set to `true` during initial setup and testing. |
| `sage.demo.mode` | `true/false` | `false` | Enable demo mode. When `true`, the action handler may use simulated record numbers. Managed automatically by the Demo Seeder. |
| `sage.demo.state` | `string` | `idle` | Tracks demo seeder state (`idle`, `seeded`, `active`). Managed automatically — do not edit manually. |
| `sage.fallback.enabled` | `true/false` | `true` | Enable regex-based fallback intent detection when Now Assist is unavailable. Recommended: keep `true`. |
| `sage.llm.temperature` | `string` | `0.3` | LLM generation temperature (0.0–1.0). Lower = more deterministic. |
| `sage.llm.max_tokens` | `string` | `500` | Maximum tokens in LLM responses. |
| `sage.llm.model` | `string` | *(empty)* | Now Assist model identifier. Leave empty to use the instance default. Set to a specific model ID if you have multiple configured. |
| `sage.context.window.size` | `string` | `10` | Maximum number of conversation history messages to include in LLM prompts. |

**To create each property:**
1. Navigate to **System Properties > All Properties**
2. Click **New**
3. Fill in **Name**, **Value** (the default), and **Description**
4. Set **Type** to `string` (ServiceNow stores all sys_properties as strings)
5. Click **Submit**

---

## 5. Script Includes to Create

> **Navigate to:** System Definition > Script Includes > New

Create these **5 Script Includes** in the order listed below (dependencies should exist before dependents).

### 5.1 SAGEContextStore

| Field | Value |
|---|---|
| **Name** | SAGEContextStore |
| **API Name** | global.SAGEContextStore (or your scoped app prefix) |
| **Client Callable** | No |
| **Active** | ✅ Yes |
| **Description** | Database-backed conversation context persistence. Stores and retrieves conversation state from the sage_conversation_context table. |
| **Script** | Paste the **entire contents** of: `servicenow/script-includes/SAGEContextStore.js` |

### 5.2 SAGELLMProvider

| Field | Value |
|---|---|
| **Name** | SAGELLMProvider |
| **API Name** | global.SAGELLMProvider |
| **Client Callable** | No |
| **Active** | ✅ Yes |
| **Description** | Now Assist LLM integration layer. Provides generate(), classify(), and extractEntities() methods using ServiceNow's GenAI platform. |
| **Script** | Paste the **entire contents** of: `servicenow/script-includes/SAGELLMProvider.js` |

### 5.3 SAGEPromptBuilder

| Field | Value |
|---|---|
| **Name** | SAGEPromptBuilder |
| **API Name** | global.SAGEPromptBuilder |
| **Client Callable** | No |
| **Active** | ✅ Yes |
| **Description** | Builds system prompts and manages flow configurations for onboarding, offboarding, and IT support conversation flows. |
| **Script** | Paste the **entire contents** of: `servicenow/script-includes/SAGEPromptBuilder.js` |

### 5.4 SAGEActionHandler

| Field | Value |
|---|---|
| **Name** | SAGEActionHandler |
| **API Name** | global.SAGEActionHandler |
| **Client Callable** | No |
| **Active** | ✅ Yes |
| **Description** | Executes actions from conversation flows by creating real ServiceNow records (HR cases, IT requests, incidents, tasks). Falls back to simulated record numbers if tables are unavailable. |
| **Script** | Paste the **entire contents** of: `servicenow/script-includes/SAGEActionHandler.js` |

### 5.5 SAGEConversationEngine

| Field | Value |
|---|---|
| **Name** | SAGEConversationEngine |
| **API Name** | global.SAGEConversationEngine |
| **Client Callable** | No |
| **Active** | ✅ Yes |
| **Description** | Main conversational AI engine for SAGE. Orchestrates intent detection, data collection, action execution, and response generation. Requires: SAGELLMProvider, SAGEPromptBuilder, SAGEActionHandler, SAGEContextStore. |
| **Script** | Paste the **entire contents** of: `servicenow/script-includes/SAGEConversationEngine.js` |

### 5.6 SAGEDemoSeeder

| Field | Value |
|---|---|
| **Name** | SAGEDemoSeeder |
| **API Name** | global.SAGEDemoSeeder |
| **Client Callable** | No |
| **Active** | ✅ Yes |
| **Description** | Seeds the instance with demo users, catalog items, and sample conversations. All demo records are tagged for easy cleanup. Requires: SAGEContextStore. |
| **Script** | Paste the **entire contents** of: `servicenow/demo-seeder/SAGEDemoSeeder.js` |

> **Scoped App Note:** If deploying in a scoped application (e.g., `x_ecs_sage`), change the API Name prefix accordingly (e.g., `x_ecs_sage.SAGEConversationEngine`). All Script Includes must be in the **same scope**.

---

## 6. Scripted REST API Setup

### 6.1 Create the REST API Record

> **Navigate to:** System Web Services > Scripted REST APIs > New

| Field | Value |
|---|---|
| **Name** | SAGE API |
| **API ID** | `sage` |
| **API Namespace** | `x_ecs_sage` (must match your application scope) |
| **Protection Policy** | None (or Read-Only for production) |
| **Requires authentication** | ✅ Yes |
| **Active** | ✅ Yes |

Click **Submit**.

> **Resulting base path:** `/api/x_ecs_sage/sage`  
> This must match the `BASE_URL` in `src/services/api.js`.

### 6.2 Create API Resources

Open the SAGE API record you just created. In the **Resources** related list, click **New** for each resource below.

---

#### Resource 1: Send Message

| Field | Value |
|---|---|
| **Name** | Conversation Message |
| **HTTP Method** | POST |
| **Relative path** | `/conversation/message` |
| **Requires authentication** | ✅ Yes |

**Script** — paste this exactly:

```javascript
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
```

---

#### Resource 2: Send Choice

| Field | Value |
|---|---|
| **Name** | Conversation Choice |
| **HTTP Method** | POST |
| **Relative path** | `/conversation/choice` |

**Script:**

```javascript
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
```

---

#### Resource 3: Confirm/Cancel Action

| Field | Value |
|---|---|
| **Name** | Conversation Action |
| **HTTP Method** | POST |
| **Relative path** | `/conversation/action` |

**Script:**

```javascript
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
```

---

#### Resource 4: Reset Conversation

| Field | Value |
|---|---|
| **Name** | Conversation Reset |
| **HTTP Method** | POST |
| **Relative path** | `/conversation/reset` |

**Script:**

```javascript
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
```

---

#### Resource 5: Start Demo

| Field | Value |
|---|---|
| **Name** | Demo Start |
| **HTTP Method** | POST |
| **Relative path** | `/demo/start` |

**Script:**

```javascript
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
```

---

#### Resource 6: Reset Demo

| Field | Value |
|---|---|
| **Name** | Demo Reset |
| **HTTP Method** | POST |
| **Relative path** | `/demo/reset` |

**Script:**

```javascript
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
```

---

#### Resource 7: Demo Status

| Field | Value |
|---|---|
| **Name** | Demo Status |
| **HTTP Method** | GET |
| **Relative path** | `/demo/status` |

**Script:**

```javascript
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
```

---

#### Resource 8: Dashboard Data

| Field | Value |
|---|---|
| **Name** | Dashboard Data |
| **HTTP Method** | GET |
| **Relative path** | `/dashboard/data` |

**Script:** Paste the `dashboardData` function from `servicenow/rest-api/SAGERestAPI.js` (Resource 8 section — it's lengthy, copy the entire IIFE from `(function dashboardData...` through `})(request, response);`).

---

#### Resource 9: Audit Data

| Field | Value |
|---|---|
| **Name** | Audit Data |
| **HTTP Method** | GET |
| **Relative path** | `/audit/data` |

**Script:** Paste the `auditData` function from `servicenow/rest-api/SAGERestAPI.js` (Resource 9 section).

---

#### Resource 10: Metrics Data

| Field | Value |
|---|---|
| **Name** | Metrics Data |
| **HTTP Method** | GET |
| **Relative path** | `/metrics/data` |

**Script:** Paste the `metricsData` function from `servicenow/rest-api/SAGERestAPI.js` (Resource 10 section).

---

### 6.3 Resource Summary Table

| # | Name | Method | Relative Path | Source Function |
|---|---|---|---|---|
| 1 | Conversation Message | POST | `/conversation/message` | `conversationMessage` |
| 2 | Conversation Choice | POST | `/conversation/choice` | `conversationChoice` |
| 3 | Conversation Action | POST | `/conversation/action` | `conversationAction` |
| 4 | Conversation Reset | POST | `/conversation/reset` | `conversationReset` |
| 5 | Demo Start | POST | `/demo/start` | `demoStart` |
| 6 | Demo Reset | POST | `/demo/reset` | `demoReset` |
| 7 | Demo Status | GET | `/demo/status` | `demoStatus` |
| 8 | Dashboard Data | GET | `/dashboard/data` | `dashboardData` |
| 9 | Audit Data | GET | `/audit/data` | `auditData` |
| 10 | Metrics Data | GET | `/metrics/data` | `metricsData` |

---

## 7. UI Page Setup

### 7.1 Upload Built Assets to ServiceNow

You need to upload `sage-app.js` and `sage-app.css` as system UI Scripts and Style Sheets (or as attachments on a record). The simplest approach:

**Option A: UI Scripts + Style Sheets (Recommended)**

**Upload the CSS:**

1. Navigate to **System UI > Style Sheets > New**
2. Set:
   - **Name:** `sage-app`
   - **CSS:** Paste the entire contents of `dist/sage-app.css`
   - **Active:** ✅ Yes
3. Click **Submit**

**Upload the JavaScript:**

1. Navigate to **System UI > UI Scripts > New**
2. Set:
   - **Name:** `sage-app`
   - **Script:** Paste the entire contents of `dist/sage-app.js`
   - **Active:** ✅ Yes
   - **Global:** ✅ Yes (so it's available to UI Pages)
3. Click **Submit**

**Option B: Sys Attachment / Content Block (Alternative)**

1. Navigate to **System UI > Images & Stylesheets > Images** or use **db_image.list**
2. Upload both files and note the resulting URLs (e.g., `/sage-app.js`, `/sage-app.cssdbimage.do?...`)

### 7.2 Create the UI Page

> **Navigate to:** System UI > UI Pages > New

| Field | Value |
|---|---|
| **Name** | `sage_app` |
| **Category** | General |
| **Direct** | ✅ Yes |

**HTML field** — paste the following:

```html
<?xml version="1.0" encoding="utf-8" ?>
<j:jelly trim="false" xmlns:j="jelly:core" xmlns:g="glide" xmlns:j2="null" xmlns:g2="null">
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SAGE — Smart Agent for Government Enterprise</title>
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,&lt;svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'&gt;&lt;polygon points='16,2 28,9 28,23 16,30 4,23 4,9' fill='%230A0A0F' stroke='%2300E5FF' stroke-width='2'/&gt;&lt;text x='16' y='21' text-anchor='middle' fill='%2300E5FF' font-size='14' font-family='monospace' font-weight='bold'&gt;S&lt;/text&gt;&lt;/svg&gt;" />
    
    <!-- SAGE Styles -->
    <style>
        /* Paste contents of sage-app.css here, OR use the style sheet reference below */
    </style>
    <!-- OR reference the uploaded style sheet: -->
    <!-- <link rel="stylesheet" href="/css_sage-app.cssdbimage" /> -->
</head>
<body>
    <div id="root"></div>
    
    <!-- SAGE Application Bundle -->
    <script>
        // Paste contents of sage-app.js here, OR reference it externally
    </script>
    <!-- OR reference the uploaded UI Script: -->
    <!-- <script src="/scripts/sage-app.js"></script> -->
</body>
</html>
</j:jelly>
```

> **Important:** If your built JS/CSS files are large, the inline approach may hit ServiceNow field limits. In that case, use **Option B** from section 7.1 and reference the files via `<script src="...">` and `<link rel="stylesheet" href="...">` tags.

**Test the UI Page directly:** Navigate to `https://<your-instance>.service-now.com/sage_app.do`

---

## 8. Application Menu & Module

### 8.1 Create the Application Menu

> **Navigate to:** System Definition > Application Menus > New

| Field | Value |
|---|---|
| **Title** | SAGE |
| **Description** | Smart Agent for Government Enterprise |
| **Active** | ✅ Yes |
| **Roles** | *(leave empty for now, or restrict to a custom role)* |

Click **Submit**.

### 8.2 Create the Module

> Open the SAGE menu you just created. In the **Modules** related list, click **New**.

| Field | Value |
|---|---|
| **Title** | SAGE Assistant |
| **Order** | 100 |
| **Link type** | URL (from Arguments) |
| **Arguments** | `sage_app.do` |
| **Active** | ✅ Yes |
| **Roles** | *(leave empty or restrict)* |

Click **Submit**.

Now users can find **SAGE > SAGE Assistant** in the left navigation.

### 8.3 Optional: Additional Modules

You may want to add debug/admin modules:

| Module Title | Arguments | Description |
|---|---|---|
| Conversation Contexts | `sage_conversation_context_list.do` | View active conversation records |
| Conversation Logs | `sage_conversation_log_list.do` | View audit log entries |
| SAGE Properties | `sys_properties_list.do?sysparm_query=nameLIKEsage.` | Quick access to SAGE properties |

---

## 9. Now Assist Configuration

### 9.1 Verify the GenAI Controller is Active

1. Navigate to **Now Assist Administration > Setup** (or search for `sn_gen_ai` in the filter navigator)
2. Confirm the **Generative AI Controller** plugin is active
3. Check that at least one **LLM connection** is configured and active

### 9.2 LLM Connection Configuration

> **Navigate to:** Now Assist Administration > LLM Connections (or **System Definition > Connections & Credentials**)

You need an active LLM provider. Options:
- **Azure OpenAI** (most common in government)
- **ServiceNow's built-in Now LLM** (if available on your instance)
- **AWS Bedrock** / **Google Vertex AI**

Ensure:
1. A connection credential exists with valid API keys
2. The connection is tested and **Active**
3. The model supports chat/completion endpoints

### 9.3 Set the SAGE Model Property (Optional)

If you have multiple LLM connections and want to specify which one SAGE uses:

1. Navigate to **System Properties > All Properties**
2. Find `sage.llm.model`
3. Set it to the model identifier from your LLM connection (e.g., `gpt-4`, or the sys_id of the Now Assist model record)

> If left empty, SAGE will use whatever default model the `sn_gen_ai.GenAiController` resolves to.

### 9.4 Fallback Mode

If Now Assist is **not available** (e.g., on a PDI without GenAI), SAGE will still work in limited mode:

- Intent detection falls back to **regex pattern matching**
- Response generation falls back to **scripted prompt-based responses** from the flow configs
- This is controlled by the `sage.fallback.enabled` property (default: `true`)

---

## 10. Security & ACLs

### 10.1 Create a SAGE Role (Recommended)

> **Navigate to:** User Administration > Roles > New

| Field | Value |
|---|---|
| **Name** | `x_ecs_sage.user` (or `sage_user`) |
| **Description** | Access to SAGE conversation interface and REST APIs |

### 10.2 Table-Level ACLs

> **Navigate to:** System Security > Access Control (ACL) > New

Create ACLs for each custom table:

#### sage_conversation_context

| ACL | Type | Operation | Role | Condition |
|---|---|---|---|---|
| `sage_conversation_context` | Record | Read | `sage_user` | — |
| `sage_conversation_context` | Record | Write | `sage_user` | — |
| `sage_conversation_context` | Record | Create | `sage_user` | — |
| `sage_conversation_context` | Record | Delete | `admin` | — |

#### sage_conversation_log

| ACL | Type | Operation | Role | Condition |
|---|---|---|---|---|
| `sage_conversation_log` | Record | Read | `sage_user` | — |
| `sage_conversation_log` | Record | Write | `sage_user` | — |
| `sage_conversation_log` | Record | Create | `sage_user` | — |
| `sage_conversation_log` | Record | Delete | `admin` | — |

### 10.3 REST API Security

The Scripted REST API has **Requires authentication = true**, which means:

- Users must be logged into ServiceNow (session-based auth for the UI Page)
- External callers must use Basic Auth or OAuth tokens
- Assign the `sage_user` role to any user who should access SAGE

### 10.4 Assign Roles to Users

> **Navigate to:** User Administration > Users > [select user]

In the **Roles** related list, add:
- `sage_user` (custom role for SAGE access)
- `itil` (if they need to view/create incidents and tasks)
- `sn_hr_core.case_writer` (if they need to create HR cases)

---

## 11. Testing Checklist

Complete these steps in order to verify every component works.

### Step 1: Verify System Properties

1. Navigate to **sys_properties_list.do?sysparm_query=nameLIKEsage.**
2. Confirm all 8 properties exist with correct default values
3. Set `sage.debug.enabled` to `true` for testing

### Step 2: Test Script Includes

1. Navigate to **System Definition > Scripts - Background**
2. Run:
   ```javascript
   var engine = new SAGEConversationEngine();
   gs.info('SAGE Engine version: ' + engine.getVersion());
   ```
3. Expected output: `SAGE Engine version: 3.0.0`

### Step 3: Test Context Store

Run in Scripts - Background:
```javascript
var store = new SAGEContextStore();
store.updateContext('test-001', { intent: 'onboarding', step: 'step1' });
var ctx = store.getContext('test-001');
gs.info('Context: ' + JSON.stringify(ctx));
store.deleteContext('test-001');
gs.info('Cleanup done');
```

### Step 4: Test REST API Endpoints

Use the **REST API Explorer** (System Web Services > REST API Explorer):

1. Select **SAGE API** from the dropdown
2. Test the **Demo Status** endpoint (GET `/demo/status`)
3. Expected: `200 OK` with `{ "status": "idle", "activeRecords": [], "demoMode": false }`

Test the **Conversation Message** endpoint (POST `/conversation/message`):
```json
{
  "conversationId": "test-rest-001",
  "message": "I need to onboard a new employee"
}
```
Expected: `200 OK` with a response containing `message` and possibly `choices`.

### Step 5: Test the UI Page

1. Navigate to `https://<instance>.service-now.com/sage_app.do`
2. Verify the React app loads (you should see the SAGE interface)
3. Check the browser console (F12) for any JavaScript errors

### Step 6: Test the Demo Seeder

1. In the SAGE UI, use the demo start feature (or call `POST /api/x_ecs_sage/sage/demo/start`)
2. Verify demo users are created: search `sys_user` for usernames starting with `sage.demo.`
3. Verify demo state: call `GET /api/x_ecs_sage/sage/demo/status`

### Step 7: End-to-End Conversation Test

1. Open the SAGE UI
2. Type: "I need to onboard a new employee"
3. SAGE should detect the onboarding intent and offer service selection choices
4. Select "Complete Onboarding Package"
5. Provide requested information (name, start date, department, etc.)
6. Confirm the actions
7. Verify records were created:
   - Check `sn_hr_core_case_list.do` for the HR case
   - Check `sc_request_list.do` for the IT request
   - Check `task_list.do` for the manager task

### Step 8: Reset & Cleanup

1. Call `POST /api/x_ecs_sage/sage/demo/reset`
2. Verify tagged demo records are cleaned up
3. Set `sage.debug.enabled` back to `false` for production

---

## 12. Troubleshooting

### REST API Returns 401 Unauthorized

- **Cause:** User is not authenticated or lacks permissions
- **Fix:**
  1. Ensure the user is logged into ServiceNow
  2. Assign the `sage_user` role to the user
  3. Check that the REST API has **Requires authentication = true** (not false, which would break differently)
  4. If calling externally, provide Basic Auth: `Authorization: Basic base64(username:password)`

### REST API Returns 403 Forbidden

- **Cause:** ACLs are blocking access
- **Fix:**
  1. Navigate to **System Security > Access Control (ACL)**
  2. Check that ACLs exist for `sage_conversation_context` and `sage_conversation_log`
  3. Temporarily impersonate the user and test
  4. Check **System Logs > Security** for ACL denial messages

### Now Assist / LLM Calls Fail

- **Symptoms:** Responses are generic fallback text, or errors mentioning `sn_gen_ai`
- **Fix:**
  1. Verify the GenAI plugin is active: search for `sn_gen_ai` in plugins
  2. Check LLM connection status in **Now Assist Administration**
  3. Run in Scripts - Background:
     ```javascript
     var llm = new SAGELLMProvider();
     gs.info('LLM Available: ' + llm.isAvailable());
     ```
  4. If `false`: check LLM connection credentials, network connectivity, and plugin activation
  5. SAGE will still work using regex fallback if `sage.fallback.enabled` is `true`

### React App Doesn't Load

- **Symptoms:** Blank page, "root" div is empty, or JavaScript errors in console
- **Fix:**
  1. Open browser DevTools (F12) → Console tab → look for errors
  2. Verify `sage-app.js` is loading (Network tab should show the script)
  3. If using inline script in UI Page, check that the Jelly XML is valid (no unclosed tags)
  4. If the JS file is too large for inline, switch to external file reference (Option B in Section 7.1)
  5. Check for Content Security Policy (CSP) violations in the console

### Demo Seeder Fails

- **Symptoms:** `POST /demo/start` returns errors or 0 records seeded
- **Fix:**
  1. Check the **System Logs > System Log > All** for entries from source `SAGEDemoSeeder`
  2. Ensure the `sage_conversation_context` table exists
  3. Ensure the user running the seeder has `admin` role (needed to create `sys_user` records and set system properties)
  4. If `sn_hr_core_case` or `sc_cat_item` tables are missing, install the required plugins

### Records Not Creating

- **Symptoms:** Actions complete but with "simulated" record numbers (e.g., `INC784523` without a real record)
- **Fix:**
  1. This happens when the table isn't accessible or `gr.insert()` fails
  2. Check system logs for `SAGEActionHandler` entries
  3. Verify the user has create permissions on `incident`, `task`, `sc_request`, `sn_hr_core_case`
  4. Check that `u_sage_generated` field exists on target tables (or the code gracefully skips it)

### CSS/Styling Issues in ServiceNow

- **Symptoms:** SAGE app looks wrong, unstyled, or conflicts with ServiceNow UI
- **Fix:**
  1. If using the SAGE app inside the ServiceNow frame (not direct), ServiceNow's CSS may conflict
  2. Best practice: open SAGE via `sage_app.do` **directly** (not inside the platform frame)
  3. In the module configuration, set **Link type** to **URL (from Arguments)** — this opens in the content frame
  4. If styling conflicts persist, wrap SAGE content in a scoped container with CSS reset
  5. Verify `sage-app.css` is loaded (check Network tab in DevTools)

### Conversation Context Gets Lost

- **Symptoms:** SAGE "forgets" what was said, restarts the flow mid-conversation
- **Fix:**
  1. The `sage_conversation_context` table may have stale cleanup running
  2. Check if `cleanExpiredContexts()` is being called with too-short `maxAgeMinutes`
  3. Verify the `conversation_id` is consistent across API calls (React app should maintain this)
  4. Check that `context_data` column has max length of **65000** (not the default 255)

### General Debugging

1. Set `sage.debug.enabled` = `true`
2. Navigate to **System Logs > System Log > All**
3. Filter by **Source** containing `SAGE`
4. All SAGE components log with prefixes like `[SAGEEngine v3]`, `[SAGEContextStore]`, etc.

---

## Quick Reference: Full API Endpoint Map

| Endpoint | Method | Full Path |
|---|---|---|
| Send Message | POST | `/api/x_ecs_sage/sage/conversation/message` |
| Send Choice | POST | `/api/x_ecs_sage/sage/conversation/choice` |
| Confirm Action | POST | `/api/x_ecs_sage/sage/conversation/action` |
| Reset Conversation | POST | `/api/x_ecs_sage/sage/conversation/reset` |
| Start Demo | POST | `/api/x_ecs_sage/sage/demo/start` |
| Reset Demo | POST | `/api/x_ecs_sage/sage/demo/reset` |
| Demo Status | GET | `/api/x_ecs_sage/sage/demo/status` |
| Dashboard Data | GET | `/api/x_ecs_sage/sage/dashboard/data` |
| Audit Data | GET | `/api/x_ecs_sage/sage/audit/data` |
| Metrics Data | GET | `/api/x_ecs_sage/sage/metrics/data` |

---

## Quick Reference: File → ServiceNow Mapping

| Source File | ServiceNow Record Type | Record Name |
|---|---|---|
| `servicenow/script-includes/SAGEContextStore.js` | Script Include | SAGEContextStore |
| `servicenow/script-includes/SAGELLMProvider.js` | Script Include | SAGELLMProvider |
| `servicenow/script-includes/SAGEPromptBuilder.js` | Script Include | SAGEPromptBuilder |
| `servicenow/script-includes/SAGEActionHandler.js` | Script Include | SAGEActionHandler |
| `servicenow/script-includes/SAGEConversationEngine.js` | Script Include | SAGEConversationEngine |
| `servicenow/demo-seeder/SAGEDemoSeeder.js` | Script Include | SAGEDemoSeeder |
| `servicenow/rest-api/SAGERestAPI.js` | Scripted REST API Resources | 10 individual resources |
| `dist/sage-app.js` | UI Script or Image | sage-app |
| `dist/sage-app.css` | Style Sheet or Image | sage-app |
