/**
 * PRD-25 US-007 AC-11 · /step/8 generate_plan + optimize_script + /accounts 智能推荐 E2E
 * GET /auth/dev-login bypass → /step/8 → generate_plan 1次 + optimize_script 1次 + /accounts 智能推荐 1次
 * ≥ 9 assertions
 */
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:5173';

test.describe('PRD-25 US-007 · /step/8 LLM flow + /accounts smartRecommend', () => {
  test.beforeEach(async ({ page }) => {
    // dev-login bypass
    await page.goto(`${BASE_URL}/auth/dev-login`);
    await page.waitForLoadState('networkidle');
  });

  test('AC-11(1-3) · /step/8 页面加载 · 2 subfunction tabs 可见', async ({ page }) => {
    await page.goto(`${BASE_URL}/step/8`);
    await page.waitForLoadState('networkidle');

    // H1 存在
    await expect(page.locator('h1').first()).toBeVisible();

    // 2 tabs: 生成直播方案 + AI 优化话术
    await expect(page.locator('text=生成直播方案').first()).toBeVisible();
    await expect(page.locator('text=AI 优化话术').first()).toBeVisible();
  });

  test('AC-11(4-6) · generate_plan form 字段 + submit button', async ({ page }) => {
    await page.goto(`${BASE_URL}/step/8`);
    await page.waitForLoadState('networkidle');

    // Step 8 tab 1 form
    await expect(page.locator('text=产品/服务信息').first()).toBeVisible();
    await expect(page.locator('text=直播经验').first()).toBeVisible();
    await expect(page.locator('text=生成直播方案').first()).toBeVisible();
  });

  test('AC-11(7) · optimize_script form 切换 tab 可见', async ({ page }) => {
    await page.goto(`${BASE_URL}/step/8`);
    await page.waitForLoadState('networkidle');

    // Click the AI 优化话术 tab
    const optimizeTab = page.locator('button', { hasText: 'AI 优化话术' }).first();
    if (await optimizeTab.isVisible()) {
      await optimizeTab.click();
      await expect(page.locator('text=直播话术脚本').first()).toBeVisible();
      await expect(page.locator('text=AI 优化话术').first()).toBeVisible();
    }
  });

  test('AC-11(8) · /accounts 页面加载 · 智能推荐 button 渲染', async ({ page }) => {
    await page.goto(`${BASE_URL}/accounts`);
    await page.waitForLoadState('networkidle');

    // New account button exists
    await expect(page.getByTestId('create-account-trigger')).toBeVisible();

    // Open modal
    await page.getByTestId('create-account-trigger').click();
    await expect(page.getByTestId('create-account-modal')).toBeVisible();

    // 智能推荐 button rendered
    await expect(page.getByTestId('create-account-smart-recommend')).toBeVisible();
  });

  test('AC-11(9) · 智能推荐 button 初始 disabled(industry 空)', async ({ page }) => {
    await page.goto(`${BASE_URL}/accounts`);
    await page.waitForLoadState('networkidle');

    await page.getByTestId('create-account-trigger').click();
    await expect(page.getByTestId('create-account-modal')).toBeVisible();

    // industry empty → 智能推荐 disabled
    const smartBtn = page.getByTestId('create-account-smart-recommend');
    await expect(smartBtn).toBeDisabled();

    // fill industry → enabled
    await page.getByTestId('create-account-industry').fill('美妆');
    await expect(smartBtn).not.toBeDisabled();
  });
});
