// PRD-22 US-006 (was PRD-17 Step1 refactor) · prd17-step1-flow.spec.ts
// /step/1 · 6 tab 字面锁 + 56 emoji 卡 + 自定义 modal + 搜索 filter
// Run: pnpm test:e2e --grep 'prd17-step1'

import { expect, test } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:5173';
const API_BASE = process.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

test.describe('prd17-step1 · /step/1 行业赛道选择', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate via mock OAuth
    await page.goto(`${API_BASE}/auth/login`);
    await page.waitForURL(`${BASE_URL}/**`);
    await page.goto(`${BASE_URL}/step/1`);
    await page.waitForSelector('[data-testid="step1-cta"]');
  });

  // Test 1: H1 + 副标题 + 副标签字面锁 AC-1 + AC-2
  test('AC-1/2 · H1 字面锁 + 副标题 + 副标签 STEP 01', async ({ page }) => {
    await expect(page.locator('h1')).toHaveText('选择你的行业赛道');
    await expect(
      page.getByText('覆盖抖音、视频号等主流平台的 56+ 个细分行业。你也可以自定义输入行业。'),
    ).toBeVisible();
    await expect(page.getByText('STEP 01 · 选择行业赛道')).toBeVisible();
  });

  // Test 2: 6 tab 字面锁 + tab 1 默认 active + 显示全 56 卡 AC-3 + AC-5
  test('AC-3 · 6 tab 字面锁 D-218 · tab 1 "全部行业 (56)" 默认 active', async ({ page }) => {
    await expect(page.getByTestId('tab-all')).toHaveText('全部行业 (56)');
    await expect(page.getByTestId('tab-life')).toContainText('🏠 生活服务 (18)');
    await expect(page.getByTestId('tab-ecom')).toContainText('🛒 电商零售 (13)');
    await expect(page.getByTestId('tab-create')).toContainText('✍️ 内容创作 (7)');
    await expect(page.getByTestId('tab-pro')).toContainText('💼 专业服务 (14)');
    await expect(page.getByTestId('tab-mfg')).toContainText('🏭 产业制造 (4)');

    // Tab 1 默认 active
    await expect(page.getByTestId('tab-all')).toHaveAttribute('data-state', 'active');
    await expect(page.getByTestId('tab-life')).toHaveAttribute('data-state', 'inactive');

    // 全 56 卡显示
    const cards = page.locator('[data-testid^="industry-card-"]');
    await expect(cards).toHaveCount(56);
  });

  // Test 3: tab 切换筛选 AC-3 + AC-4
  test('AC-3/4 · tab 切换筛选 · 生活服务显示 18 卡', async ({ page }) => {
    await page.getByTestId('tab-life').click();
    await expect(page.getByTestId('tab-life')).toHaveAttribute('data-state', 'active');
    const cards = page.locator('[data-testid^="industry-card-"]');
    await expect(cards).toHaveCount(18);
  });

  // Test 4: 搜索 filter 联动 AC-4
  test('AC-4 · 搜索 filter · 输入"美容"过滤结果', async ({ page }) => {
    await page.getByTestId('industry-search').fill('美容');
    const cards = page.locator('[data-testid^="industry-card-"]');
    // Should have at least 1 (美业 has keywords: 美容院)
    expect(await cards.count()).toBeGreaterThanOrEqual(1);
  });

  // Test 5: 自定义 modal 弹出保存 + CTA enabled AC-7 + AC-8
  test('AC-7/8 · 自定义 modal 保存 · CTA 由 disabled→enabled', async ({ page }) => {
    // CTA should be disabled initially
    await expect(page.getByTestId('step1-cta')).toBeDisabled();

    // Open modal
    await page.getByTestId('custom-industry-trigger').click();
    await expect(page.getByTestId('custom-industry-input')).toBeVisible();

    // Type and confirm
    await page.getByTestId('custom-industry-input').fill('宠物美容');
    await page.getByTestId('custom-industry-confirm').click();

    // CTA should now be enabled
    await expect(page.getByTestId('step1-cta')).not.toBeDisabled();
  });
});
