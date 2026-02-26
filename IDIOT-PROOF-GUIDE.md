# SAGE → ServiceNow: The Idiot-Proof Guide

> **What is this?** You have a React app on your Mac. You need it running inside ServiceNow. This guide gets you there.

---

## THE BIG PICTURE (Read This First)

React apps are just HTML, CSS, and JavaScript. That's it. The "React" part is a developer tool that compiles your code into plain browser files. ServiceNow can host plain browser files. So the process is:

```
Your React source code
        ↓  (npm run build)
Two files: sage-app.js + sage-app.css
        ↓  (copy-paste into ServiceNow)
UI Page loads them in a browser
        ↓  (talks to)
Script Includes + REST API (the backend)
```

**You are NOT running React inside ServiceNow.** You're running the *output* of React — compiled JavaScript — inside a ServiceNow UI Page. ServiceNow is just serving it like any web page.

---

## PHASE 1: BUILD THE FILES (5 minutes)

This happens on your Mac, in Terminal.

### Step 1: Open Terminal, navigate to the project

```bash
cd /Users/cortana/.openclaw/workspace/ECS/Sage\ Project/SAGE-React-App
```

### Step 2: Install dependencies (if you haven't already)

```bash
npm install
```

This downloads all the libraries the app needs. You'll see a `node_modules` folder appear (it's huge — that's normal, don't touch it).

### Step 3: Choose your mode

**Option A — Demo Mode (recommended first)**
Leave `api.js` as-is. The app will use fake/mock data so you can see the UI working before wiring up the backend. This lets you verify the UI renders correctly in ServiceNow before you connect it to live data.

**Option B — Live Mode**
Edit `src/services/api.js`:
1. Delete or comment out everything between `// MOCK IMPLEMENTATIONS` and `// REAL IMPLEMENTATIONS`
2. Uncomment the entire `// REAL IMPLEMENTATIONS` block at the bottom
3. Save

> **My recommendation:** Start with Option A. Get the UI loading in ServiceNow first. Switch to Option B after.

### Step 4: Build

```bash
npm run build
```

This takes ~5 seconds. When it's done, you'll have a `dist/` folder:

```
dist/
├── sage-app.js    ← THIS IS YOUR APP (one file, all the JavaScript)
├── sage-app.css   ← THIS IS YOUR STYLING (one file, all the CSS)
└── index.html     ← Ignore this, you don't need it
```

### Step 5: Verify

```bash
ls -la dist/sage-app.*
```

You should see two files. `sage-app.js` will be ~500KB-1MB. `sage-app.css` will be ~30-60KB. If you see them, Phase 1 is done.

---

## PHASE 2: GET THE UI INTO SERVICENOW (15 minutes)

Now you take those two files and put them in ServiceNow.

### Step 6: Upload the CSS

1. In ServiceNow, navigate to: **System UI → Style Sheets**
2. Click **New**
3. Fill in:
   - **Name:** `sage-app`
   - **CSS:** Open `dist/sage-app.css` in a text editor, **Select All, Copy**, paste it here
   - **Active:** ✅ checked
4. Click **Submit**

### Step 7: Upload the JavaScript

1. Navigate to: **System UI → UI Scripts**
2. Click **New**
3. Fill in:
   - **Name:** `sage-app`
   - **Script:** Open `dist/sage-app.js` in a text editor, **Select All, Copy**, paste it here
   - **Active:** ✅ checked
   - **Global:** ✅ checked
4. Click **Submit**

> ⚠️ **If the file is too large to paste** (ServiceNow may choke on big JS): Skip to the "Plan B" section at the bottom.

### Step 8: Create the UI Page

1. Navigate to: **System UI → UI Pages**
2. Click **New**
3. Fill in:
   - **Name:** `sage_app`
   - **Direct:** ✅ checked
4. In the **HTML** field, paste this:

```html
<?xml version="1.0" encoding="utf-8" ?>
<j:jelly trim="false" xmlns:j="jelly:core" xmlns:g="glide" xmlns:j2="null" xmlns:g2="null">
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SAGE — Smart Agent for Government Enterprise</title>

    <!-- Pull in the CSS you uploaded in Step 6 -->
    <g:requires name="sage-app.cssdbimage" />

    <style>
        /* Reset ServiceNow's default styles so they don't mess with SAGE */
        html, body { margin: 0; padding: 0; height: 100%; overflow: hidden; }
        #root { height: 100vh; }
    </style>
</head>
<body>
    <!-- React mounts here -->
    <div id="root"></div>

    <!-- Pull in the JS you uploaded in Step 7 -->
    <g:requires name="sage-app.jsdbimage" />
</body>
</html>
</j:jelly>
```

> **Note on `g:requires`**: This is ServiceNow's Jelly way of pulling in UI Scripts and Style Sheets by name. If it doesn't resolve, see Plan B below.

5. Click **Submit**

### Step 9: TEST IT

Open your browser and go to:

```
https://YOUR-INSTANCE.service-now.com/sage_app.do
```

Replace `YOUR-INSTANCE` with your actual instance name.

**What you should see:** The SAGE landing page with a dark theme, hexagonal logo, and a "Get Started" or login screen.

**If you see a blank page:** Right-click → Inspect → Console tab. Look for errors. Common issues:
- JS/CSS didn't load → check the UI Script/Style Sheet names
- Content Security Policy blocking → see Troubleshooting section

---

## PHASE 3: ADD A NAV MODULE (2 minutes)

So people can find it in the ServiceNow menu.

### Step 10: Create the menu

1. Navigate to: **System Definition → Application Menus**
2. Click **New**
3. **Title:** `SAGE`
4. Click **Submit**

### Step 11: Create the module

1. Open the SAGE menu you just created
2. In the **Modules** related list, click **New**
3. Fill in:
   - **Title:** `SAGE Assistant`
   - **Link type:** `URL (from Arguments)`
   - **Arguments:** `sage_app.do`
4. Click **Submit**

Now "SAGE > SAGE Assistant" appears in the left nav.

---

## PHASE 4: SET UP THE BACKEND (30-60 minutes)

> **Skip this phase if you're running in Demo Mode (Option A from Step 3).** The mock data works without any backend. Come back here when you're ready to go live.

This phase creates the ServiceNow backend that the React app talks to. There are 4 layers:

```
React UI  →  REST API  →  Script Includes  →  Tables + Records
```

### Step 12: Create the custom tables

You need 2 new tables. Navigate to **System Definition → Tables → New** for each:

**Table 1: `sage_conversation_context`**
| Column Label | Column Name | Type | Max Length |
|---|---|---|---|
| Conversation ID | `conversation_id` | String | 100 |
| Context Data | `context_data` | String | 65000 |
| User | `user_id` | Reference → sys_user | — |
| Session ID | `session_id` | String | 100 |

**Table 2: `sage_conversation_log`**
| Column Label | Column Name | Type | Max Length |
|---|---|---|---|
| Conversation ID | `conversation_id` | String | 100 |
| Activity Type | `activity_type` | String | 50 |
| Message Content | `message_content` | String | 65000 |
| User | `user_id` | Reference → sys_user | — |

### Step 13: Create system properties

Navigate to **sys_properties.list** and create each:

| Name | Value |
|---|---|
| `sage.debug.enabled` | `false` |
| `sage.demo.mode` | `false` |
| `sage.demo.state` | `idle` |
| `sage.fallback.enabled` | `true` |
| `sage.llm.temperature` | `0.3` |
| `sage.llm.max_tokens` | `500` |
| `sage.llm.model` | *(leave empty)* |
| `sage.context.window.size` | `10` |

### Step 14: Create the Script Includes

Navigate to **System Definition → Script Includes → New** for each. Create them **in this order** (dependencies first):

| # | Name | Source File |
|---|---|---|
| 1 | SAGEContextStore | `servicenow/script-includes/SAGEContextStore.js` |
| 2 | SAGELLMProvider | `servicenow/script-includes/SAGELLMProvider.js` |
| 3 | SAGEPromptBuilder | `servicenow/script-includes/SAGEPromptBuilder.js` |
| 4 | SAGEActionHandler | `servicenow/script-includes/SAGEActionHandler.js` |
| 5 | SAGEConversationEngine | `servicenow/script-includes/SAGEConversationEngine.js` |
| 6 | SAGEDemoSeeder | `servicenow/demo-seeder/SAGEDemoSeeder.js` |

For each one:
1. Click **New**
2. **Name** = exactly as shown above
3. **Client Callable** = No
4. **Active** = ✅ Yes
5. **Script** = Open the source file, Select All, Copy, Paste
6. Click **Submit**

### Step 15: Create the Scripted REST API

1. Navigate to: **System Web Services → Scripted REST APIs → New**
2. Fill in:
   - **Name:** `SAGE API`
   - **API ID:** `sage`
   - **API Namespace:** `x_ecs_sage` *(must match your scoped app, or use `global`)*
   - **Requires authentication:** ✅ Yes
3. Click **Submit**
4. Open it back up. In the **Resources** related list, create **10 resources**.

The full details for all 10 resources are in `IMPLEMENTATION-GUIDE.md` Section 6.2. Here's the summary:

| # | Name | Method | Relative Path |
|---|---|---|---|
| 1 | Conversation Message | POST | `/conversation/message` |
| 2 | Conversation Choice | POST | `/conversation/choice` |
| 3 | Conversation Action | POST | `/conversation/action` |
| 4 | Conversation Reset | POST | `/conversation/reset` |
| 5 | Demo Start | POST | `/demo/start` |
| 6 | Demo Reset | POST | `/demo/reset` |
| 7 | Demo Status | GET | `/demo/status` |
| 8 | Dashboard Data | GET | `/dashboard/data` |
| 9 | Audit Data | GET | `/audit/data` |
| 10 | Metrics Data | GET | `/metrics/data` |

The script for each resource is in `IMPLEMENTATION-GUIDE.md` or `servicenow/rest-api/SAGERestAPI.js`.

### Step 16: Switch to Live Mode

Now go back and do **Option B from Step 3**:
1. Edit `src/services/api.js`
2. Delete the mock functions, uncomment the real ones
3. Run `npm run build` again
4. Re-paste the new `dist/sage-app.js` into the UI Script (Step 7)

### Step 17: Test end-to-end

Go to `https://YOUR-INSTANCE.service-now.com/sage_app.do` and try:
1. Type "I need to onboard a new employee"
2. Pick a department
3. Pick a start date
4. Watch it create real records

---

## PLAN B: If Paste is Too Large

ServiceNow UI Script fields sometimes can't handle 500KB+ of JavaScript. If that happens:

**Option 1: Use sys_ui_page directly**
1. Open your `sage_app` UI Page
2. Instead of `<g:requires>`, paste the CSS directly inside `<style>...</style>` tags
3. Paste the JS directly inside `<script>...</script>` tags
4. This bypasses the UI Script field limit

**Option 2: Use a Content Block / Attachment**
1. Navigate to `db_image.list`
2. Click **New**
3. Upload `sage-app.js` and `sage-app.css`
4. Note the generated URLs
5. Reference them in the UI Page with `<script src="...">` and `<link href="...">`

**Option 3: Host on a CDN**
Upload the built files to an S3 bucket, Azure Blob, or any CDN. Reference them in the UI Page. You'll need to allow the CDN domain in ServiceNow's Content Security Policy.

---

## TROUBLESHOOTING

| Problem | Fix |
|---|---|
| Blank page | Open browser console (F12). Look for 404s (files not loading) or JS errors |
| "root" div but nothing renders | JS loaded but React crashed. Check console for the actual error |
| CSP errors in console | ServiceNow is blocking inline scripts. Use the external file approach (Plan B) |
| API calls return 401 | User isn't logged in or doesn't have the right role. Make sure you're accessing `sage_app.do` while logged into ServiceNow |
| API calls return 404 | REST API namespace or path doesn't match. Check that `BASE_URL` in api.js matches your actual REST API path |
| Style looks wrong | ServiceNow's global CSS is interfering. Add more aggressive resets in the UI Page `<style>` block |

---

## QUICK REFERENCE

| What | Where |
|---|---|
| React source | `SAGE-React-App/src/` |
| Build output | `SAGE-React-App/dist/` (after `npm run build`) |
| ServiceNow backend code | `SAGE-React-App/servicenow/` |
| Full implementation details | `IMPLEMENTATION-GUIDE.md` |
| QA test report | `QA-REPORT.md` |
| Build command | `npm run build` |
| Dev server (local testing) | `npm run dev` → opens at `http://localhost:5173` |
| ServiceNow URL | `https://YOUR-INSTANCE.service-now.com/sage_app.do` |
