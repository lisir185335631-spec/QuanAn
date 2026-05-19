/**
 * PRD-23 US-003 — /step/8 直播策划 2 子功能 tabs E2E flow
 * AC-15: ≥ 5 tests · H1 / 2 tabs 切换 / tab 1 4 字段填写 / tab 2 textarea+优化目标 / CTA disabled 条件
 */
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:5173';
const API_BASE = process.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

test.describe('PRD-23 US-003 · /step/8 直播策划', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    // dev-login for auth bypass (avoids OAuth redirect)
    await page.goto(`${API_BASE}/auth/dev-login`);
    await page.waitForURL(`${BASE_URL}/**`);
    await page.goto(`${BASE_URL}/step/8`);
    await page.waitForLoadState('networkidle');
  });

  test('AC-1 · H1 "直播策划" + STEP_TAG + 副标题含 {industry} 模板', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('直播策划');
    await expect(page.locator('text=STEP 08 · 直播策划')).toBeVisible();
    await expect(
      page.locator('text=AI 将生成完整的直播方案，包含详细话术、引流策略、互动设计'),
    ).toBeVisible();
  });

  test('AC-2 · 2 tabs "生成直播方案" + "AI 优化话术" 可见且可切换', async ({ page }) => {
    const tab1 = page.getByRole('tab', { name: '生成直播方案' });
    const tab2 = page.getByRole('tab', { name: 'AI 优化话术' });
    await expect(tab1).toBeVisible();
    await expect(tab2).toBeVisible();

    // tab 1 active by default
    await expect(tab1).toHaveAttribute('data-state', 'active');

    // switch to tab 2
    await tab2.click();
    await expect(tab2).toHaveAttribute('data-state', 'active');
    await expect(page.locator('text=直播话术脚本')).toBeVisible();
  });

  test('AC-4 · tab 1 4 字段填写: 产品 textarea + 目标受众 + 5 平台 + 3 经验 radio', async ({
    page,
  }) => {
    // product textarea
    await page.fill('textarea[placeholder*="描述你要在直播中推广"]', '护肤品精华液');
    // target audience input
    await page.fill('input[placeholder*="25-40岁女性"]', '25-35岁女性白领');
    // platform: click 小红书
    await page.getByRole('button', { name: /小红书/ }).click();
    // experience: click 有经验
    await page.getByText('有经验').first().click();
    // CTA should now be enabled
    const cta = page.getByRole('button', { name: '生成直播方案' });
    await expect(cta).toBeEnabled();
  });

  test('AC-4 · CTA "生成直播方案" 初始 disabled · 填写产品后 enabled', async ({ page }) => {
    const cta = page.getByRole('button', { name: '生成直播方案' });
    await expect(cta).toBeDisabled();

    // Fill product only — still disabled (need platform + experience too)
    await page.fill('textarea[placeholder*="描述你要在直播中推广"]', '美妆产品');
    // click platform
    await page.getByRole('button', { name: /抖音/ }).click();
    // click experience
    await page.getByText('资深').first().click();
    await expect(cta).toBeEnabled();
  });

  test('AC-6 · tab 2: textarea 填写 + 优化目标 + CTA disabled → enabled', async ({ page }) => {
    // switch to tab 2
    await page.getByRole('tab', { name: 'AI 优化话术' }).click();
    await page.waitForTimeout(100);

    const cta = page.getByRole('button', { name: 'AI 优化话术' });
    await expect(cta).toBeDisabled();

    // fill < 10 chars — still disabled
    await page.fill('textarea[placeholder*="粘贴你的直播话术脚本"]', '短文本');
    await expect(cta).toBeDisabled();

    // fill ≥ 10 chars — enabled
    await page.fill(
      'textarea[placeholder*="粘贴你的直播话术脚本"]',
      '大家好欢迎来到今天的直播间，我是你们的主播！',
    );
    await expect(cta).toBeEnabled();

    // fill optimize goal (optional)
    await page.fill('input[placeholder*="优化目标"]', '提升互动率');
  });

  test('AC-5/17 · tab 1 提交后渲染 6 H3 stub 输出', async ({ page }) => {
    // Fill all required fields
    await page.fill('textarea[placeholder*="描述你要在直播中推广"]', '健身器材');
    await page.getByRole('button', { name: /快手/ }).click();
    await page.getByText('新手').first().click();
    // Submit
    await page.getByRole('button', { name: '生成直播方案' }).click();
    await page.waitForTimeout(300);

    // 6 H3 blocks
    await expect(page.getByRole('heading', { level: 3, name: '开场话术' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: '中场互动' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: '成交话术' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: '收尾' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: '引流策略' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: '互动设计' })).toBeVisible();

    // 3 stub action buttons
    await expect(page.getByRole('button', { name: '复制全部' })).toBeVisible();
    await expect(page.getByRole('button', { name: '导出 PDF' })).toBeVisible();
    await expect(page.getByRole('button', { name: '重新生成' })).toBeVisible();
  });
});
