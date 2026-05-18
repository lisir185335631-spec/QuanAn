// PRD-21 US-003 · prd21-mobile-nav.spec.ts
// Mobile nav panel: hamburger + MobileNavPanel below header (replaces Sheet drawer)

import { test, expect } from '@playwright/test';

test.describe('PRD-21 Mobile Nav Panel', () => {
  // viewport must be set at describe level, not via page.setViewportSize() — anti-pattern REJ-003
  test.use({ viewport: { width: 375, height: 667 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="app-header"]');
  });

  test('hamburger menu visible on mobile', async ({ page }) => {
    await expect(page.getByTestId('header-hamburger')).toBeVisible();
  });

  test('click hamburger opens MobileNavPanel below header', async ({ page }) => {
    await page.getByTestId('header-hamburger').click();
    await expect(page.getByTestId('header-mobile-panel')).toBeVisible();
  });

  test('panel shows 4 group labels (创作 / 策划 / 智能 / 更多)', async ({ page }) => {
    await page.getByTestId('header-hamburger').click();
    const panel = page.getByTestId('header-mobile-panel');
    await expect(panel.getByText('创作', { exact: true }).first()).toBeVisible();
    await expect(panel.getByText('策划', { exact: true })).toBeVisible();
    await expect(panel.getByText('智能', { exact: true })).toBeVisible();
    await expect(panel.getByText('更多', { exact: true })).toBeVisible();
  });

  test('panel shows ≥ 25 nav items', async ({ page }) => {
    await page.getByTestId('header-hamburger').click();
    const panel = page.getByTestId('header-mobile-panel');
    const links = panel.locator('a');
    const count = await links.count();
    expect(count).toBeGreaterThanOrEqual(25);
  });
});
