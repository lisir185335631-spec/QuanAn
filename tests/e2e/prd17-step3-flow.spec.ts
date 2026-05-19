// PRD-22 US-007 · prd17-step3-flow.spec.ts
// /step/3 · 7 H3 字面锁 + PlatformInlineRadio + 多输入项
// Run: pnpm test:e2e --grep 'prd17-step3'

import { expect, test } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:5173';
const API_BASE = process.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

test.describe('prd17-step3 · /step/3 账号包装方案', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${API_BASE}/auth/login`);
    await page.waitForURL(`${BASE_URL}/**`);
    await page.goto(`${BASE_URL}/step/3`);
    await page.waitForLoadState('networkidle');
  });

  // AC-1 · H1 + 副标签字面锁
  test('AC-1 · H1 字面锁 "账号包装方案" + 副标签 STEP 03', async ({ page }) => {
    await expect(page.locator('h1')).toHaveText('账号包装方案');
    await expect(page.getByText('STEP 03 · 账号包装方案')).toBeVisible();
  });

  // AC-2 · PlatformInlineRadio 5 平台 radio
  test('AC-2 · 5 平台 radio 存在', async ({ page }) => {
    const platformButtons = page.locator('button').filter({ hasText: /抖音|小红书|视频号|快手|B站/ });
    await expect(platformButtons).toHaveCount(5);
  });

  // AC-2 · 目标受众 input 和现有账号情况 input 存在
  test('AC-2 · 目标受众 + 现有账号情况 input 存在', async ({ page }) => {
    await expect(page.getByPlaceholder('你想吸引什么样的粉丝？')).toBeVisible();
    await expect(page.getByPlaceholder('新账号/已有账号的粉丝量等')).toBeVisible();
  });

  // AC-3 + AC-8 · 7 H3 字面锁 (需要提交表单后显示)
  test('AC-3 · 输出区 7 H3 字面锁 · DOM H1+7H3=8', async ({ page }) => {
    // Fill in required fields
    await page.getByPlaceholder(/详细描述你的个人背景/).fill('我是一名美容师，有10年经验');
    // Select first platform
    await page.locator('button').filter({ hasText: '抖音' }).first().click();
    // Submit form
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(2000);

    // Check H3 count ≥ 7 (section header + 6 content blocks)
    const h3Count = await page.locator('h3').count();
    expect(h3Count).toBeGreaterThanOrEqual(7);

    // Check D-220 H3 字面锁
    const h3Texts = await page.locator('h3').allTextContents();
    expect(h3Texts).toContain('账号包装方案');
    expect(h3Texts).toContain('视频参考案例');
    expect(h3Texts).toContain('昵称推荐');
    expect(h3Texts).toContain('头像设计方案');
    expect(h3Texts).toContain('背景图设计方案');
    expect(h3Texts).toContain('简介文案方案');
    expect(h3Texts).toContain('整体包装策略');
  });

  // AC-3 · 顶部 [一键重新生成] + [复制全部] button
  test('AC-3 · 顶部 [一键重新生成] + [复制全部] button 显示', async ({ page }) => {
    await page.getByPlaceholder(/详细描述你的个人背景/).fill('我是一名美容师');
    await page.locator('button').filter({ hasText: '抖音' }).first().click();
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(2000);

    await expect(page.getByRole('button', { name: '一键重新生成' })).toBeVisible();
    await expect(page.getByRole('button', { name: '复制全部' })).toBeVisible();
  });
});
