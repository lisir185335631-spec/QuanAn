// PRD-22 US-008 · prd18-step4-flow.spec.ts
// /step/4 · H1字面锁 + 3 KPI H3 + 无平台 radio
// Run: pnpm test:e2e --grep 'prd18-step4'

import { expect, test } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:5173';
const API_BASE = process.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

test.describe('prd18-step4 · /step/4 执行计划', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${API_BASE}/auth/login`);
    await page.waitForURL(`${BASE_URL}/**`);
    await page.goto(`${BASE_URL}/step/4`);
    await page.waitForLoadState('networkidle');
  });

  // AC-1 · H1 + 副标签字面锁
  test('AC-1 · H1 字面锁 "执行计划" + 副标签 STEP 04 · 执行计划', async ({ page }) => {
    await expect(page.locator('h1')).toHaveText('执行计划');
    await expect(page.getByText('STEP 04 · 执行计划')).toBeVisible();
  });

  // AC-2 · 3 input/textarea 存在 · 无平台 radio
  test('AC-2 · 3 输入项存在 · 无平台 radio', async ({ page }) => {
    await expect(page.locator('label').filter({ hasText: '当前粉丝量' })).toBeVisible();
    await expect(page.locator('label').filter({ hasText: '目标(如：6个月做到5万粉)' })).toBeVisible();
    await expect(page.locator('label').filter({ hasText: '详细描述你的情况' })).toBeVisible();

    // No platform radio buttons
    const platformButtons = page.locator('button').filter({ hasText: /^📱 抖音$|^📕 小红书$|^📺 视频号$|^🎬 快手$|^📺 B站$/ });
    await expect(platformButtons).toHaveCount(0);
  });

  // AC-2 · textarea placeholder 字面锁
  test('AC-2 · textarea placeholder 字面锁', async ({ page }) => {
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible();
    const placeholder = await textarea.getAttribute('placeholder');
    expect(placeholder).toContain('描述你的情况，比如：');
    expect(placeholder).toContain('每天可投入2小时');
    expect(placeholder).toContain('有实体店/线上课程');
    expect(placeholder).toContain('擅长口播/拍摄');
  });

  // AC-3 + AC-8 · 3 KPI H3 字面锁 · DOM H = H1+3H3=4
  test('AC-3 · 输出区 3 KPI H3 字面锁 · DOM H1+3H3=4', async ({ page }) => {
    // Submit form (all optional)
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(1500);

    // Check H3 count = 3
    const h3Count = await page.locator('h3').count();
    expect(h3Count).toBe(3);

    // Check D-220 H3 字面锁
    const h3Texts = await page.locator('h3').allTextContents();
    expect(h3Texts).toContain('每日 KPI');
    expect(h3Texts).toContain('每周 KPI');
    expect(h3Texts).toContain('阶段 KPI');

    // AC-8: total H tags = H1 + 3 H3 = 4
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1);
    expect(h1Count + h3Count).toBe(4);
  });

  // CTA · 无必填 · CTA 默认可点击
  test('CTA · "生成执行计划" 按钮默认可点击(无必填)', async ({ page }) => {
    const cta = page.getByRole('button', { name: '生成执行计划' });
    await expect(cta).toBeVisible();
    await expect(cta).not.toBeDisabled();
  });
});
