# SAGE — Service Portal Deployment Guide

This loads SAGE into ServiceNow via **Service Portal** (bypasses Next Experience completely).

---

## Step 1: Upload JS and CSS as UI Scripts

### Upload the CSS

1. In ServiceNow, navigate to **System UI → UI Scripts** (`sys_ui_script.list`)
2. Click **New**
3. Fill in:
   - **Name:** `SAGE App CSS`
   - **API Name:** `sage_app_css` (may auto-fill)
   - **UI Type:** `Desktop` (or `All`)
   - **Active:** ✅ checked
   - **Description:** `SAGE React App Stylesheet`
4. **IMPORTANT:** Check the **Global** checkbox if present
5. In the **Script** field, paste this wrapper:

```javascript
(function() {
  var css = document.createElement('style');
  css.textContent = `PASTE_CONTENTS_OF_SAGE_APP_CSS_HERE`;
  document.head.appendChild(css);
})();
```

6. Replace `PASTE_CONTENTS_OF_SAGE_APP_CSS_HERE` with the entire contents of `sage-app.css`
7. Click **Submit**

### Upload the JS

1. Still in **UI Scripts** (`sys_ui_script.list`)
2. Click **New**
3. Fill in:
   - **Name:** `SAGE App JS`
   - **API Name:** `sage_app_js`
   - **UI Type:** `Desktop` (or `All`)
   - **Active:** ✅ checked
   - **Description:** `SAGE React App Bundle`
4. In the **Script** field, paste the **entire contents** of `sage-app.js`
5. Click **Submit**

> ⚠️ If the Script field truncates (508KB is large), we'll use the attachment method instead. Check that it saved fully by reopening the record.

---

## Step 2: Create the Service Portal Widget

1. Navigate to **Service Portal → Widgets** (`sp_widget.list`)
2. Click **New**
3. Fill in:
   - **Name:** `SAGE App`
   - **ID:** `sage-app`

### Body HTML template:

Paste this in the **Body HTML template** field:

```html
<div id="root" style="height:100vh; width:100%; overflow:hidden;"></div>
```

### CSS — SCSS:

Paste this in the **CSS** field:

```css
:host {
  display: block;
  width: 100%;
  height: 100vh;
  padding: 0;
  margin: 0;
}

.panel-body {
  padding: 0 !important;
}
```

### Client Script:

Paste this in the **Client controller** field:

```javascript
api.controller = function($scope, $element, $timeout) {
  $timeout(function() {
    // Load CSS
    var cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = '/sage_app_css.jsdbx';
    document.head.appendChild(cssLink);

    // Load JS
    var script = document.createElement('script');
    script.src = '/sage_app_js.jsdbx';
    document.body.appendChild(script);
  }, 100);
};
```

4. Click **Submit**

---

## Step 3: Create the Service Portal Page

1. Navigate to **Service Portal → Pages** (`sp_page.list`)
2. Click **New**
3. Fill in:
   - **Title:** `SAGE`
   - **ID:** `sage`
4. Click **Submit**
5. Open the page record you just created
6. Click **Open in Designer** (or go to `/sp_config?id=sage`)

### In the Page Designer:

1. You'll see an empty page layout
2. Drag a **container** onto the page
3. Inside the container, drag a **12-column row**
4. In that row, search for the widget **SAGE App** and drop it in
5. **Save**

---

## Step 4: Configure the Portal Page (Remove Header/Footer)

For a clean full-screen SAGE experience:

1. Go to **Service Portal → Portals** (`sp_portal.list`)
2. Open your portal (likely **Service Portal** or create a new one)
3. Note the portal's **URL suffix** (e.g., `sp`)

OR — just access directly with no header/footer using the `?id=sage` parameter.

---

## Step 5: Access SAGE

Open in browser:

```
https://YOUR-INSTANCE.service-now.com/sp?id=sage
```

You should see the SAGE login screen with the dark theme and cyan accents.

---

## Troubleshooting

### Blank page?
- F12 → Console → look for errors
- Check that both UI Scripts are **Active**
- Try loading the JS directly: `https://YOUR-INSTANCE/sage_app_js.jsdbx` — should return JS code

### UI Script too large?
If the 508KB JS file gets truncated in the UI Script field, use **attachments** instead:

1. Create any record (e.g., a blank UI Page called `sage_assets`)
2. Attach `sage-app.js` and `sage-app.css` to that record
3. Get the attachment sys_ids from the attachments list
4. Update the widget Client Script to use attachment URLs:

```javascript
api.controller = function($scope, $element, $timeout) {
  $timeout(function() {
    var css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = '/sys_attachment.do?sys_id=CSS_ATTACHMENT_SYS_ID';
    document.head.appendChild(css);

    var script = document.createElement('script');
    script.src = '/sys_attachment.do?sys_id=JS_ATTACHMENT_SYS_ID';
    document.body.appendChild(script);
  }, 100);
};
```

### Content Security Policy errors?
If you see CSP errors in console, a ServiceNow admin may need to add exceptions. Check **System Properties → Security → Content Security Policy**.

---

## What's Next?

Once SAGE renders in Demo Mode:
1. Set up the backend (Script Includes, REST API, tables)
2. Swap `api.js` from mock to live
3. Rebuild and re-upload
