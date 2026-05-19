// PRD-22 US-007 · prd17-step3b-flow.spec.ts
// /step/3b · 6 H3 字面锁 + 多 textarea
// Run: pnpm test:e2e --grep 'prd17-step3b'

import { expect, test } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:5173';
const API_BASE = process.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

test.describe('prd17-step3b · /step/3b 人设定制方案', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${API_BASE}/auth/login`);
    await page.waitForURL(`${BASE_URL}/**`);
    await page.goto(`${BASE_URL}/step/3b`);
    await page.waitForLoadState('networkidle');
  });

  // AC-4 · H1 + 副标签字面锁 (uppercase B)
  test('AC-4 · H1 字面锁 "人设定制方案" + 副标签 STEP 03B', async ({ page }) => {
    await expect(page.locator('h1')).toHaveText('人设定制方案');
    await expect(page.getByText('STEP 03B · 人设定制方案')).toBeVisible();
  });

  // AC-4 · 3 textarea 存在 (无平台 radio)
  test('AC-4 · 3 textarea 存在 + 无平台 radio', async ({ page }) => {
    const textareas = page.locator('textarea');
    await expect(textareas).toHaveCount(3);

    // No platform radio (Step3b doesn't have platform selection per AC-4)
    const platformButtons = page.locator('button').filter({ hasText: /^📱 抖音$|^📕 小红书$|^📺 视频号$|^🎬 快手$|^📺 B站$/ });
    await expect(platformButtons).toHaveCount(0);
  });

  // AC-4 · textarea labels 字面锁
  test('AC-4 · textarea labels 字面锁', async ({ page }) => {
    // Use label locator to avoid matching subtitle text
    await expect(page.locator('label').filter({ hasText: '你的个人信息' }).first()).toBeVisible();
    await expect(page.locator('label').filter({ hasText: '你的独特优势' })).toBeVisible();
    await expect(page.locator('label').filter({ hasText: '你的个人故事' })).toBeVisible();
  });

  // AC-5 + AC-9 · 6 H3 字面锁 (需要提交表单后显示)
  test('AC-5 · 输出区 6 H3 字面锁 · DOM H1+6H3=7', async ({ page }) => {
    // Fill in required personalInfo
    await page.locator('textarea').first().fill('我是一名美容师，有10年经验');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(2000);

    // Check H3 count ≥ 6 (section header + 6 content blocks)
    const h3Count = await page.locator('h3').count();
    expect(h3Count).toBeGreaterThanOrEqual(6);

    // Check D-220 H3 字面锁
    const h3Texts = await page.locator('h3').allTextContents();
    expect(h3Texts).toContain('人设定位');
    expect(h3Texts).toContain('人设标签');
    expect(h3Texts).toContain('内容方向');
    expect(h3Texts).toContain('差异化策略');
    expect(h3Texts).toContain('内容方向建议');
    expect(h3Texts).toContain('IP 故事框架');
  });

  // AC-5 · 每 H3 块有 [复制] + [重新生成] button
  test('AC-5 · 复制 + 重新生成 buttons per H3 block', async ({ page }) => {
    await page.locator('textarea').first().fill('我是一名美容师');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(2000);

    const copyButtons = page.getByRole('button', { name: '复制' });
    const regenButtons = page.getByRole('button', { name: '重新生成' });
    expect(await copyButtons.count()).toBeGreaterThanOrEqual(6);
    expect(await regenButtons.count()).toBeGreaterThanOrEqual(6);
  });
});
