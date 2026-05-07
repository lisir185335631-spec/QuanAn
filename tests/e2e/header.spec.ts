import { test, expect } from '@playwright/test';

test.describe('Header 三 dropdown', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="app-header"]');
  });

  test('Header 可见', async ({ page }) => {
    await expect(page.getByTestId('app-header')).toBeVisible();
  });

  test('用户头像 dropdown 可见 + 点开 (auth.me mock)', async ({ page }) => {
    // avatar trigger is in hidden sm:block — only visible at desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    // Use real mock OAuth to create a session — avoids tRPC v11 JSONL streaming format complexity.
    // Mock provider (OAUTH_PROVIDER=mock) skips CSRF and returns dev@local.test immediately.
    const apiBase = process.env.VITE_API_BASE_URL ?? 'http://localhost:3000';
    await page.goto(`${apiBase}/auth/login`);
    // Redirect chain: /auth/login → /auth/callback?mock=true → http://localhost:5173/
    await page.waitForURL('http://localhost:5173/**');
    await page.waitForSelector('[data-testid="app-header"]');

    const trigger = page.getByTestId('header-user-trigger');
    await expect(trigger).toBeVisible();
    // Verify AC-3: email shown in user menu
    await trigger.click();
    const menu = page.getByTestId('header-user-menu');
    await expect(menu).toBeVisible();
    await expect(menu.getByText('dev@local.test')).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test('IP 账号 dropdown 可见 + 点开', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 }); // desktop — element hidden on mobile
    const trigger = page.getByTestId('header-account-trigger');
    await expect(trigger).toBeVisible();
    await trigger.click();
    const menu = page.getByTestId('header-account-menu');
    await expect(menu).toBeVisible();
    await expect(menu.getByText('新建账号')).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test('工具入口 dropdown 可见 + 点开', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 }); // desktop — element hidden on mobile
    const trigger = page.getByTestId('header-tools-trigger');
    await expect(trigger).toBeVisible();
    await trigger.click();
    const menu = page.getByTestId('header-tools-menu');
    await expect(menu).toBeVisible();
    await expect(menu.getByText('全网爆款库')).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test('移动端 ≤640px 显示 hamburger · 三 dropdown 隐藏', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    // Desktop dropdowns hidden via Tailwind hidden sm:flex/sm:block
    await expect(page.getByTestId('header-account-trigger')).not.toBeVisible();
    await expect(page.getByTestId('header-tools-trigger')).not.toBeVisible();
    // Hamburger visible
    await expect(page.getByTestId('header-hamburger')).toBeVisible();
  });

  test('移动端 hamburger 点开 Sheet', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.getByTestId('header-hamburger').click();
    await expect(page.getByTestId('header-mobile-sheet')).toBeVisible();
    await expect(page.getByTestId('header-mobile-sheet').getByText('全网爆款库')).toBeVisible();
  });
});
