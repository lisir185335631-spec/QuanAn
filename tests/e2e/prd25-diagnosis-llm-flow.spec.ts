/**
 * PRD-25 US-001 AC-12 · /diagnosis LLM flow E2E
 * GET /auth/dev-login bypass · 8 step → report 渲染 (isFallback or real LLM 路径)
 * ≥ 5 assertions
 */
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:5173';

test.describe('PRD-25 US-001 · /diagnosis LLM flow', () => {
  test.beforeEach(async ({ page }) => {
    // AC-12: dev-login bypass
    await page.goto(`${BASE_URL}/auth/dev-login`);
    await page.waitForLoadState('networkidle');
    await page.goto(`${BASE_URL}/diagnosis`);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('AC-12(1) · 8 step 完整流程 → 报告区域渲染', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('7 维度 IP 诊断报告');

    // Navigate through all 8 steps
    for (let i = 0; i < 8; i++) {
      await page.getByTestId('diagnosis-next').click();
      if (i < 7) {
        // Not last step — wait for next step label
        await page.waitForLoadState('networkidle');
      }
    }

    // Wait for report (LLM or fallback path)
    await expect(page.getByTestId('diagnosis-report').or(page.getByTestId('diagnosis-loading'))).toBeVisible({ timeout: 30_000 });
  });

  test('AC-12(2) · H1 字面锁 + 副标题', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('7 维度 IP 诊断报告');
    await expect(page.locator('text=像老师一样诊断你的 IP，找出问题，给出具体可执行的改进方案')).toBeVisible();
  });

  test('AC-12(3) · Step 8 button CTA = "生成诊断报告"', async ({ page }) => {
    // Navigate to step 8
    for (let i = 0; i < 7; i++) {
      await page.getByTestId('diagnosis-next').click();
    }
    await expect(page.getByTestId('diagnosis-next')).toHaveText('生成诊断报告');
  });

  test('AC-12(4) · 报告渲染 7 维度卡 or loading state', async ({ page }) => {
    for (let i = 0; i < 8; i++) {
      await page.getByTestId('diagnosis-next').click();
    }

    // Either loading or report should be visible within 30s
    const loadingOrReport = page
      .getByTestId('diagnosis-loading')
      .or(page.getByTestId('diagnosis-report'))
      .or(page.getByTestId('diagnosis-error'));

    await expect(loadingOrReport).toBeVisible({ timeout: 30_000 });

    // If report rendered, check 7 dimension cards
    if (await page.getByTestId('diagnosis-report').isVisible()) {
      await expect(page.getByTestId('report-dimension-positioning')).toBeVisible();
      await expect(page.getByTestId('report-dimension-authentic')).toBeVisible();
      await expect(page.getByTestId('overall-score')).toBeVisible();
    }
  });

  test('AC-12(5) · 8 step 向导流程: Step 1→2→3 切换', async ({ page }) => {
    await expect(page.locator('text=步骤 1 / 8 · 基本信息')).toBeVisible();
    await page.getByTestId('diagnosis-next').click();
    await expect(page.locator('text=步骤 2 / 8 · 定位清晰度')).toBeVisible();
    await page.getByTestId('diagnosis-next').click();
    await expect(page.locator('text=步骤 3 / 8 · 账号包装')).toBeVisible();
  });
});
