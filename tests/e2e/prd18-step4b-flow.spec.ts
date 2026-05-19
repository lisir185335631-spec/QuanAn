// PRD-22 US-008 · prd18-step4b-flow.spec.ts
// /step/4b · H1字面锁 + 5 H3 阶梯 + PlatformInlineRadio
// Run: pnpm test:e2e --grep 'prd18-step4b'

import { expect, test } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:5173';
const API_BASE = process.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

test.describe('prd18-step4b · /step/4b 变现路径规划', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${API_BASE}/auth/login`);
    await page.waitForURL(`${BASE_URL}/**`);
    await page.goto(`${BASE_URL}/step/4b`);
    await page.waitForLoadState('networkidle');
  });

  // AC-4 · H1 + 副标签字面锁 (uppercase B)
  test('AC-4 · H1 字面锁 "变现路径规划" + 副标签 STEP 04B', async ({ page }) => {
    await expect(page.locator('h1')).toHaveText('变现路径规划');
    await expect(page.getByText('STEP 04B · 变现路径规划')).toBeVisible();
  });

  // AC-5 · 输入项: textarea + 行业领域 input + PlatformInlineRadio
  test('AC-5 · textarea "产品/服务描述" + "行业领域" input + 5 平台 radio', async ({ page }) => {
    await expect(page.locator('label').filter({ hasText: '产品/服务描述' })).toBeVisible();
    await expect(page.locator('label').filter({ hasText: '行业领域' })).toBeVisible();
    // PlatformInlineRadio — 5 平台 buttons
    const platformButtons = page.locator('button').filter({ hasText: /抖音|小红书|视频号|快手|B站/ });
    await expect(platformButtons).toHaveCount(5);
  });

  // AC-5 · textarea placeholder 字面锁
  test('AC-5 · textarea placeholder 字面锁', async ({ page }) => {
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible();
    const placeholder = await textarea.getAttribute('placeholder');
    expect(placeholder).toContain('描述你的产品或服务，比如：');
    expect(placeholder).toContain('美容院皮肤管理项目，客单价500-3000元');
    expect(placeholder).toContain('线上知识付费课程，定价199-999元');
  });

  // AC-6 + AC-8 · 5 H3 字面锁 · DOM H = H1+5H3=6
  test('AC-6 · 输出区 5 H3 字面锁 · DOM H1+5H3=6', async ({ page }) => {
    // Fill required textarea
    await page.locator('textarea').fill('美容院皮肤管理项目，客单价500-3000元');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(1500);

    // Check H3 count = 5
    const h3Count = await page.locator('h3').count();
    expect(h3Count).toBe(5);

    // AC-6 D-220 H3 字面锁 — "初阶变现路径/中阶变现路径/高阶变现路径" 严守
    const h3Texts = await page.locator('h3').allTextContents();
    expect(h3Texts).toContain('初阶变现路径');
    expect(h3Texts).toContain('中阶变现路径');
    expect(h3Texts).toContain('高阶变现路径');
    expect(h3Texts).toContain('收入结构分析');
    expect(h3Texts).toContain('成功案例参考');

    // AC-8: total H tags = H1 + 5 H3 = 6
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1);
    expect(h1Count + h3Count).toBe(6);
  });

  // CTA · 产品/服务描述必填 · 空时禁用
  test('CTA · "生成变现路径" 空 textarea 时禁用', async ({ page }) => {
    const cta = page.getByRole('button', { name: '生成变现路径' });
    await expect(cta).toBeDisabled();
    await page.locator('textarea').fill('美容院皮肤管理');
    await expect(cta).not.toBeDisabled();
  });
});
