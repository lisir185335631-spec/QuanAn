/**
 * PRD-24 US-001 · /daily-tasks E2E flow
 * AC-10: ≥ 3 tests · H1 命中 / 3 任务卡渲染 / 智能标识可见
 */
import { expect, test } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:5173';
const API_BASE = process.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

test.describe('PRD-24 US-001 · /daily-tasks', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${API_BASE}/auth/dev-login`);
    await page.waitForURL(`${BASE_URL}/**`);
    await page.goto(`${BASE_URL}/daily-tasks`);
    await page.waitForLoadState('networkidle');
  });

  test('AC-1 · H1 "今日行动清单" 可见', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('今日行动清单');
  });

  test('AC-3 · 3 任务卡 H3 渲染(等待 800ms stub loading 完成)', async ({ page }) => {
    // Stub loading takes 800ms; give up to 3s for task H3s to appear
    await page.waitForSelector('h3', { timeout: 3000 });
    await expect(
      page.getByRole('heading', { level: 3, name: /今天发布 1 条 step\/7 生成的文案/ }),
    ).toBeVisible({ timeout: 3000 });
    await expect(
      page.getByRole('heading', { level: 3, name: /优化 step\/3 的简介/ }),
    ).toBeVisible({ timeout: 3000 });
    await expect(
      page.getByRole('heading', { level: 3, name: /回复粉丝评论 X 条/ }),
    ).toBeVisible({ timeout: 3000 });
  });

  test('AC-1 · "智能" 菜单分类标识可见', async ({ page }) => {
    // The header span with '智能' category label
    const smartLabel = page.locator('span.uppercase').filter({ hasText: '智能' }).first();
    await expect(smartLabel).toBeVisible();
  });
});
