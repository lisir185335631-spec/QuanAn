import { test, expect } from '@playwright/test';

test.describe('Header 三 dropdown', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for React to hydrate
    await page.waitForSelector('[data-testid="app-header"]');
  });

  test('Header 可见', async ({ page }) => {
    await expect(page.getByTestId('app-header')).toBeVisible();
  });

  test('用户头像 dropdown 可见 + 点开', async ({ page }) => {
    // On desktop viewport, user trigger is visible
    const trigger = page.getByTestId('header-user-trigger');
    await expect(trigger).toBeVisible();
    await trigger.click();
    await expect(page.getByTestId('header-user-menu')).toBeVisible();
    // Close by pressing Escape
    await page.keyboard.press('Escape');
  });

  test('IP 账号 dropdown 可见 + 点开', async ({ page }) => {
    const trigger = page.getByTestId('header-account-trigger');
    await expect(trigger).toBeVisible();
    await trigger.click();
    const menu = page.getByTestId('header-account-menu');
    await expect(menu).toBeVisible();
    // 含 "新建账号"
    await expect(menu.getByText('新建账号')).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test('工具入口 dropdown 可见 + 点开', async ({ page }) => {
    const trigger = page.getByTestId('header-tools-trigger');
    await expect(trigger).toBeVisible();
    await trigger.click();
    const menu = page.getByTestId('header-tools-menu');
    await expect(menu).toBeVisible();
    // 14 工具中至少包含第一条
    await expect(menu.getByText('全网爆款库')).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test('移动端 ≤640px 显示 hamburger · 三 dropdown 隐藏', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    // Desktop dropdowns hidden
    await expect(page.getByTestId('header-account-trigger')).not.toBeVisible();
    await expect(page.getByTestId('header-tools-trigger')).not.toBeVisible();
    await expect(page.getByTestId('header-user-trigger')).not.toBeVisible();
    // Hamburger visible
    await expect(page.getByTestId('header-hamburger')).toBeVisible();
  });

  test('移动端 hamburger 点开 Sheet', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.getByTestId('header-hamburger').click();
    await expect(page.getByTestId('header-mobile-sheet')).toBeVisible();
    // Sheet 含账号和工具列表
    await expect(page.getByTestId('header-mobile-sheet').getByText('全网爆款库')).toBeVisible();
  });
});
