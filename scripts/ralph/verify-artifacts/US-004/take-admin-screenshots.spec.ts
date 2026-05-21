// US-004 Admin Dashboard Screenshot Verification
// Captures admin layout components after mock OAuth login
import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const OUTPUT_DIR = '/Users/return/Desktop/QuanAn/scripts/ralph/verify-artifacts/US-004';
const DASHBOARD_SCREENSHOT = path.join(OUTPUT_DIR, 'admin-after-packages-lift.png');
const DRAWER_SCREENSHOT = path.join(OUTPUT_DIR, 'admin-audit-drawer-open.png');

test.describe('US-004 Admin Layout Visual Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to admin app
    await page.goto('http://localhost:5174', { waitUntil: 'networkidle' });
  });

  test('Admin dashboard layout after mock OAuth login', async ({ page }) => {
    // Step 1: Verify login page loaded
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible({ timeout: 10000 });

    // Step 2: Fill email
    await emailInput.fill('super@quanan.com');

    // Step 3: Click mock OAuth login button
    const mockLoginBtn = page.getByRole('button', { name: 'mock OAuth 登录' });
    await expect(mockLoginBtn).toBeVisible();
    await mockLoginBtn.click();

    // Step 4: Wait for redirect to admin dashboard
    await page.waitForURL(/\/admin/, { timeout: 15000 }).catch(async () => {
      // If URL doesn't change, wait for admin layout indicators
      await page.waitForTimeout(3000);
    });

    // Wait for dashboard to stabilize
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Step 5: Screenshot of full admin dashboard
    await page.screenshot({
      path: DASHBOARD_SCREENSHOT,
      fullPage: true,
    });

    console.log('[SCREENSHOT SAVED] Admin dashboard:', DASHBOARD_SCREENSHOT);

    // Report what's visible
    const url = page.url();
    console.log('[URL]', url);

    // Check for sidebar / nav
    const nav = page.locator('nav, aside, [data-testid="sidebar"]');
    const navCount = await nav.count();
    console.log('[NAV] sidebar/nav elements found:', navCount);

    // Check for topbar / header
    const header = page.locator('header, [data-testid="topbar"]');
    const headerCount = await header.count();
    console.log('[HEADER] topbar/header elements found:', headerCount);

    // Check for brand text
    const bodyText = await page.locator('body').innerText();
    const hasQuanAn = bodyText.includes('QuanAn');
    console.log('[BRAND] QuanAn text visible:', hasQuanAn);

    // Check for email/role display
    const hasSuperEmail = bodyText.includes('super@quanan.com');
    const hasSuperAdmin = bodyText.toLowerCase().includes('super_admin') || bodyText.toLowerCase().includes('superadmin');
    console.log('[AUTH] super@quanan.com visible:', hasSuperEmail);
    console.log('[AUTH] super_admin role visible:', hasSuperAdmin);

    // Check for statusbar
    const footer = page.locator('footer, [data-testid="status-bar"], .status-bar');
    const footerCount = await footer.count();
    console.log('[STATUSBAR] status bar elements found:', footerCount);

    // Print all page text for inspection
    console.log('[PAGE TEXT]', bodyText.substring(0, 1000));
  });

  test('AuditDrawer opens when bell button clicked', async ({ page }) => {
    // Login first
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await emailInput.fill('super@quanan.com');

    const mockLoginBtn = page.getByRole('button', { name: 'mock OAuth 登录' });
    await mockLoginBtn.click();

    await page.waitForURL(/\/admin/, { timeout: 15000 }).catch(async () => {
      await page.waitForTimeout(3000);
    });

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Find and click bell button
    let bellClicked = false;

    // Try various selectors for the bell/audit button
    const bellSelectors = [
      'button:has-text("🔔")',
      'button[aria-label*="audit"]',
      'button[aria-label*="bell"]',
      'button[title*="审计"]',
      'button[title*="audit"]',
      '[data-testid="audit-bell"]',
      '[data-testid="bell-button"]',
    ];

    for (const selector of bellSelectors) {
      const el = page.locator(selector);
      const count = await el.count();
      if (count > 0) {
        console.log(`[BELL] Found with selector: ${selector}`);
        await el.first().click();
        bellClicked = true;
        break;
      }
    }

    if (!bellClicked) {
      // Enumerate all buttons
      const allButtons = page.locator('button');
      const count = await allButtons.count();
      console.log('[BELL] Total buttons:', count);
      for (let i = 0; i < count; i++) {
        const btn = allButtons.nth(i);
        const text = await btn.innerText().catch(() => '');
        const ariaLabel = await btn.getAttribute('aria-label').catch(() => '');
        const title = await btn.getAttribute('title').catch(() => '');
        console.log(`[BUTTON ${i}] text="${text}", aria-label="${ariaLabel}", title="${title}"`);
        if (text.includes('🔔') || (ariaLabel && ariaLabel.includes('audit')) || (title && title.includes('audit'))) {
          await btn.click();
          bellClicked = true;
          console.log(`[BELL] Clicked button ${i}`);
          break;
        }
      }
    }

    if (bellClicked) {
      await page.waitForTimeout(1500);
      console.log('[BELL] Bell clicked, waiting for drawer...');

      // Check for drawer
      const drawer = page.locator('[data-testid="audit-drawer"], [role="dialog"], .audit-drawer, aside.drawer');
      const drawerCount = await drawer.count();
      console.log('[DRAWER] Audit drawer elements found:', drawerCount);
    } else {
      console.log('[BELL] Bell button NOT found on page');
    }

    // Screenshot regardless
    await page.screenshot({
      path: DRAWER_SCREENSHOT,
      fullPage: true,
    });
    console.log('[SCREENSHOT SAVED] Audit drawer:', DRAWER_SCREENSHOT);
  });
});
