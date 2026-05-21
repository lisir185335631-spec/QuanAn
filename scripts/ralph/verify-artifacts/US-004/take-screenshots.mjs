// Playwright screenshot script for US-004 admin dashboard verification
import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = __dirname;

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  // Capture console errors for debugging
  page.on('console', msg => {
    if (msg.type() === 'error') console.error('[browser error]', msg.text());
  });
  page.on('pageerror', err => console.error('[page error]', err.message));

  console.log('Navigating to http://localhost:5174 ...');
  await page.goto('http://localhost:5174', { waitUntil: 'networkidle', timeout: 30000 });

  // Check what page loaded
  const title = await page.title();
  const url = page.url();
  console.log(`Page title: ${title}, URL: ${url}`);

  // Take screenshot of login page for reference
  await page.screenshot({
    path: path.join(OUTPUT_DIR, 'admin-login-page.png'),
    fullPage: true,
  });
  console.log('Login page screenshot saved.');

  // Fill in email field
  const emailInput = page.locator('input[type="email"]');
  const emailCount = await emailInput.count();
  console.log(`Email inputs found: ${emailCount}`);

  if (emailCount > 0) {
    await emailInput.fill('super@quanan.com');
    console.log('Filled email with super@quanan.com');
  } else {
    console.log('No email input found, checking page content...');
    const bodyText = await page.locator('body').innerText();
    console.log('Body text (first 500 chars):', bodyText.substring(0, 500));
  }

  // Click the mock OAuth login button
  const mockLoginBtn = page.getByRole('button', { name: 'mock OAuth 登录' });
  const btnCount = await mockLoginBtn.count();
  console.log(`Mock login buttons found: ${btnCount}`);

  if (btnCount > 0) {
    await mockLoginBtn.click();
    console.log('Clicked mock OAuth login button');
  } else {
    // Try finding any submit button
    const submitBtn = page.locator('button[type="submit"]');
    const submitCount = await submitBtn.count();
    console.log(`Submit buttons found: ${submitCount}`);
    if (submitCount > 0) {
      await submitBtn.first().click();
      console.log('Clicked first submit button');
    } else {
      console.log('No login button found, checking all buttons...');
      const allBtns = await page.locator('button').all();
      for (const btn of allBtns) {
        const text = await btn.innerText();
        console.log('Button:', text);
      }
    }
  }

  // Wait for navigation to admin dashboard
  console.log('Waiting for admin dashboard to load...');
  try {
    await page.waitForURL('**/admin**', { timeout: 10000 });
    console.log('Navigated to admin URL:', page.url());
  } catch (e) {
    console.log('URL did not change to /admin, current URL:', page.url());
    // Wait a bit for any redirect
    await page.waitForTimeout(3000);
    console.log('After wait, URL:', page.url());
  }

  // Wait for key admin components to appear
  console.log('Waiting for admin layout components...');
  await page.waitForTimeout(2000);

  // Take full page screenshot of admin dashboard
  const dashboardPath = path.join(OUTPUT_DIR, 'admin-after-packages-lift.png');
  await page.screenshot({ path: dashboardPath, fullPage: true });
  console.log('Admin dashboard screenshot saved to:', dashboardPath);

  // Check what's visible
  const pageContent = await page.locator('body').innerText().catch(() => 'failed to get text');
  console.log('Page content (first 800 chars):', pageContent.substring(0, 800));

  // Look for the bell button (audit drawer trigger)
  const bellSelectors = [
    'button[aria-label*="bell"]',
    'button[title*="audit"]',
    'button[title*="审"]',
    'button:has-text("🔔")',
    '[data-testid="bell-button"]',
    '[data-testid="audit-bell"]',
  ];

  let bellFound = false;
  for (const selector of bellSelectors) {
    const count = await page.locator(selector).count();
    if (count > 0) {
      console.log(`Found bell button with selector: ${selector}`);
      await page.locator(selector).first().click();
      bellFound = true;
      break;
    }
  }

  if (!bellFound) {
    // Try finding by emoji or text
    const allButtons = await page.locator('button').all();
    console.log(`Total buttons on page: ${allButtons.length}`);
    for (const btn of allButtons) {
      try {
        const text = await btn.innerText();
        const ariaLabel = await btn.getAttribute('aria-label');
        const title = await btn.getAttribute('title');
        console.log(`Button - text: "${text}", aria-label: "${ariaLabel}", title: "${title}"`);
        if (text.includes('🔔') || (ariaLabel && ariaLabel.includes('audit')) ||
            (title && (title.includes('audit') || title.includes('审')))) {
          console.log('Found bell button, clicking...');
          await btn.click();
          bellFound = true;
          break;
        }
      } catch (e) {
        // skip
      }
    }
  }

  if (bellFound) {
    console.log('Bell button clicked, waiting for audit drawer...');
    await page.waitForTimeout(1500);
    const drawerPath = path.join(OUTPUT_DIR, 'admin-audit-drawer-open.png');
    await page.screenshot({ path: drawerPath, fullPage: true });
    console.log('Audit drawer screenshot saved to:', drawerPath);
  } else {
    console.log('Bell button not found — taking screenshot of current state anyway');
    const drawerPath = path.join(OUTPUT_DIR, 'admin-audit-drawer-open.png');
    await page.screenshot({ path: drawerPath, fullPage: true });
    console.log('Screenshot saved (no drawer visible):', drawerPath);
  }

  // Report visible components
  console.log('\n--- Component Visibility Report ---');
  const checks = [
    { name: 'Sidebar nav', selectors: ['nav', '[data-testid="sidebar"]', 'aside'] },
    { name: 'TopBar', selectors: ['header', '[data-testid="topbar"]'] },
    { name: 'StatusBar', selectors: ['[data-testid="status-bar"]', 'footer', '.status-bar'] },
    { name: 'AuditDrawer', selectors: ['[data-testid="audit-drawer"]', '[role="dialog"]', '.audit-drawer'] },
    { name: 'Brand text', selectors: [':text("QuanAn")'] },
    { name: 'Email/role display', selectors: [':text("super@quanan.com")', ':text("super_admin")'] },
  ];

  for (const check of checks) {
    for (const sel of check.selectors) {
      try {
        const count = await page.locator(sel).count();
        if (count > 0) {
          console.log(`✓ ${check.name}: found (selector: ${sel}, count: ${count})`);
          break;
        }
      } catch (e) {
        // skip invalid selectors
      }
    }
  }

  await browser.close();
  console.log('\nDone. All screenshots saved.');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
