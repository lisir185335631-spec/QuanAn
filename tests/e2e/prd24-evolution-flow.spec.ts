/**
 * PRD-24 US-002 · /evolution E2E flow
 * AC-10: ≥ 4 tests
 */
import { expect, test } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:5173';
const API_BASE = process.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

test.describe('PRD-24 US-002 · /evolution', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${API_BASE}/auth/dev-login`);
    await page.waitForURL(`${BASE_URL}/**`);
    await page.goto(`${BASE_URL}/evolution`);
    await page.waitForLoadState('networkidle');
  });

  test('AC-1 · H1 "智能体进化中心" 可见', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('智能体进化中心');
  });

  test('AC-1 · spec §8.5.3 副标文字可见', async ({ page }) => {
    await expect(
      page.getByText('你的智能体通过反馈学习和深度学习持续进化，越用越懂你'),
    ).toBeVisible();
  });

  test('AC-5 · 5 级 badge 全部渲染(L1~L5) + 4 指标卡', async ({ page }) => {
    // 5 badges
    await expect(page.getByTestId('badge-L1')).toBeVisible();
    await expect(page.getByTestId('badge-L2')).toBeVisible();
    await expect(page.getByTestId('badge-L3')).toBeVisible();
    await expect(page.getByTestId('badge-L4')).toBeVisible();
    await expect(page.getByTestId('badge-L5')).toBeVisible();
    // 4 metrics
    await expect(page.getByTestId('metric-好评数')).toBeVisible();
    await expect(page.getByTestId('metric-待改进')).toBeVisible();
    await expect(page.getByTestId('metric-学习档案')).toBeVisible();
    await expect(page.getByTestId('metric-满意率')).toBeVisible();
  });

  test('AC-3/AC-4 · 5 H3 模块字面 + 4 进化方向 radio 可见', async ({ page }) => {
    // 5 H3 modules in correct order
    const h3s = await page.locator('h3').allTextContents();
    expect(h3s).toContain('进化等级');
    expect(h3s).toContain('进化洞察');
    expect(h3s).toContain('最近反馈');
    expect(h3s).toContain('深度学习档案');
    expect(h3s).toContain('进化设置');
    // 4 direction radio buttons
    await expect(page.getByTestId('direction-综合优化（积累反馈后自动生成）')).toBeVisible();
    await expect(page.getByTestId('direction-创意性优先')).toBeVisible();
    await expect(page.getByTestId('direction-转化率优先')).toBeVisible();
    await expect(page.getByTestId('direction-真实感优先')).toBeVisible();
  });

  test('AC-6 · radio click → direction 切换(aria-pressed=true)', async ({ page }) => {
    const btn = page.getByTestId('direction-创意性优先');
    await btn.click();
    await expect(btn).toHaveAttribute('aria-pressed', 'true');
  });

  test('AC-12 · console 无 error', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    expect(errors).toHaveLength(0);
  });
});
