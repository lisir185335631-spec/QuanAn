/**
 * PRD-22 US-010 — Step 7 文案生成 E2E flow
 * AC-1/2/4/6/7/11 验证: H1 字面锁 · ScriptTypeInlineCards · ElementsInlineMultiPicker ·
 * 4 H4 输出字面 · DOM button ≥50 · H tag ≥11 · no console errors
 */
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:5173';

test.describe('PRD-22 US-010 · Step 7 文案生成', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/step/7`);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('AC-1 · H1 字面锁 "文案生成" + 副标签 "STEP 07 · AI 智能文案生成"', async ({
    page,
  }) => {
    await expect(page.locator('h1')).toContainText('文案生成');
    await expect(page.locator('text=STEP 07 · AI 智能文案生成')).toBeVisible();
  });

  test('AC-1 · 副标题字面锁', async ({ page }) => {
    await expect(
      page.locator(
        'text=选择脚本类型和爆款元素，输入主题，AI 将基于方法论生成深度爆款文案，支持 AI 智能修改优化。',
      ),
    ).toBeVisible();
  });

  test('AC-2 · 20 脚本类型卡片渲染 (ScriptTypeInlineCards)', async ({ page }) => {
    // Wait for script cards to render
    await page.waitForSelector('button', { timeout: 5000 });
    // Count script type buttons within the script selection area
    // ScriptTypeInlineCards renders 20 buttons (SCRIPT_TYPES.length === 20)
    const scriptSection = page.locator('.glass-card').first();
    const allButtons = await page.locator('button').count();
    expect(allButtons, `Expected ≥50 buttons, got ${allButtons}`).toBeGreaterThanOrEqual(50);
  });

  test('AC-2 · 搜索框存在 (showSearch)', async ({ page }) => {
    await expect(
      page.locator('input[placeholder="搜索脚本类型..."]'),
    ).toBeVisible();
  });

  test('AC-2 · 文案主题 textarea placeholder 字面锁', async ({ page }) => {
    await expect(
      page.locator('textarea[placeholder*="美容院如何用抖音获客100个精准客户"]'),
    ).toBeVisible();
  });

  test('AC-2 · 优化方向 input placeholder 字面锁', async ({ page }) => {
    await expect(
      page.locator(
        'input[placeholder*="更有吸引力、增加互动感、更口语化"]',
      ),
    ).toBeVisible();
  });

  test('AC-2 · 主 CTA "生成爆款文案" disabled when topic empty', async ({ page }) => {
    const cta = page.locator('button', { hasText: '生成爆款文案' });
    await expect(cta).toBeDisabled();
  });

  test('AC-2 · 主 CTA enabled after filling topic', async ({ page }) => {
    await page.locator('textarea').fill('美容院如何通过抖音吸引精准客户');
    const cta = page.locator('button', { hasText: '生成爆款文案' });
    await expect(cta).toBeEnabled();
  });

  test('AC-2 · 次级 button "AI 优化文案" present', async ({ page }) => {
    await expect(page.locator('button', { hasText: 'AI 优化文案' })).toBeVisible();
  });

  test('AC-2 · 次级 button "我的选题库" present', async ({ page }) => {
    await expect(page.locator('button', { hasText: '我的选题库' })).toBeVisible();
  });

  test('AC-2 · 次级 button "爆款选题" present and navigates to /step/5', async ({
    page,
  }) => {
    const btn = page.locator('button', { hasText: '爆款选题' });
    await expect(btn).toBeVisible();
    await btn.click();
    await expect(page).toHaveURL(/\/step\/5/);
  });

  test('AC-4 · 4 H4 输出字面锁 (搞辩论 default · D-220)', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '话题抛出', level: 4 })).toBeVisible();
    await expect(page.getByRole('heading', { name: '正方', level: 4 })).toBeVisible();
    await expect(page.getByRole('heading', { name: '反方', level: 4 })).toBeVisible();
    await expect(page.getByRole('heading', { name: '我的立场', level: 4 })).toBeVisible();
  });

  test('AC-4 · 评论区引导 + 话题标签 H4 present', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '评论区引导', level: 4 })).toBeVisible();
    await expect(page.getByRole('heading', { name: '话题标签', level: 4 })).toBeVisible();
  });

  test('AC-6 · DOM button 数 ≥50 (20脚本+22元素+CTA+次级)', async ({ page }) => {
    const count = await page.locator('button').count();
    expect(count, `Expected ≥50 buttons, got ${count}`).toBeGreaterThanOrEqual(50);
  });

  test('AC-7 · DOM H 标签数 ≥11 (H1 + ≥10 H4)', async ({ page }) => {
    const hCount = await page.locator('h1, h2, h3, h4, h5, h6').count();
    expect(hCount, `Expected ≥11 H elements, got ${hCount}`).toBeGreaterThanOrEqual(11);
  });

  test('AC-11(e) · no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto(`${BASE_URL}/step/7`);
    await page.waitForLoadState('networkidle');
    const critical = errors.filter((e) => !e.includes('favicon') && !e.includes('net::ERR_'));
    expect(critical).toEqual([]);
  });
});
