import { chromium } from 'playwright';

const BASE = 'http://localhost:5173';
const OUT = 'public';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

// Login first
await page.goto(`${BASE}/login`);
await page.fill('input[type="email"]', 'jonathan.harris@ecstech.com');
await page.fill('input[type="password"]', 'demo123');
await page.click('button[type="submit"]');
await page.waitForURL('**/app/**', { timeout: 5000 });
await page.waitForTimeout(1000);

// Screenshot 1: Chat
await page.goto(`${BASE}/app`);
await page.waitForTimeout(1500);
await page.screenshot({ path: `${OUT}/sage_screenshot1.png` });
console.log('✓ Chat');

// Screenshot 2: Dashboard
await page.goto(`${BASE}/app/dashboard`);
await page.waitForTimeout(1500);
await page.screenshot({ path: `${OUT}/sage_screenshot2.png` });
console.log('✓ Dashboard');

// Screenshot 3: Audit
await page.goto(`${BASE}/app/audit`);
await page.waitForTimeout(1500);
await page.screenshot({ path: `${OUT}/sage_screenshot3.png` });
console.log('✓ Audit');

// Screenshot 4: Metrics
await page.goto(`${BASE}/app/metrics`);
await page.waitForTimeout(1500);
await page.screenshot({ path: `${OUT}/sage_screenshot4.png` });
console.log('✓ Metrics');

await browser.close();
console.log('Done — all 4 screenshots saved to public/');
