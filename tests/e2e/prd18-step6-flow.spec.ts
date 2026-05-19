/**
 * PRD-22 US-009 — Step 6 拍摄计划 E2E flow
 * AC-5/6/7/8/16 验证: H1 字面锁 · textarea label · disabled 条件(<10字) · infobox · 跳step7 · no errors
 * TD-HINT: disabled 必须是 text.length < 10，不是 text.length === 0
 */
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:5173';

test.describe('PRD-22 US-009 · Step 6 拍摄计划', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/step/6`);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('AC-5 · H1 字面锁 "拍摄计划" + 副标签 "STEP 06 · 拍摄计划"', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('拍摄计划');
    await expect(page.locator('text=STEP 06 · 拍摄计划')).toBeVisible();
  });

  test('AC-6 · textarea label "短视频文案"', async ({ page }) => {
    await expect(page.locator('label').filter({ hasText: '短视频文案' })).toBeVisible();
  });

  test('AC-8 + TD-HINT · CTA disabled when empty', async ({ page }) => {
    await expect(page.locator('[data-testid="step6-cta"]')).toBeDisabled();
  });

  test('AC-8 + TD-HINT · CTA disabled when text.length = 9 (< 10)', async ({ page }) => {
    // 关键: 9字仍 disabled — 不是"非空就 enabled"
    await page.locator('[data-testid="step6-textarea"]').fill('123456789');
    await expect(page.locator('[data-testid="step6-cta"]')).toBeDisabled();
  });

  test('AC-8 + TD-HINT · CTA enabled when text.length >= 10', async ({ page }) => {
    await page.locator('[data-testid="step6-textarea"]').fill('1234567890');
    await expect(page.locator('[data-testid="step6-cta"]')).toBeEnabled();
  });

  test('AC-7 · infobox 可见 + "去文案生成" button 跳转 /step/7', async ({ page }) => {
    await expect(page.locator('[data-testid="step6-infobox"]')).toBeVisible();
    await expect(page.locator('text=你可以先去第七步「文案生成」生成文案')).toBeVisible();

    await page.locator('[data-testid="step6-goto-step7"]').click();
    await page.waitForURL('**/step/7', { timeout: 5000 });
  });

  test('AC-7 · "去文案生成" button text', async ({ page }) => {
    await expect(page.locator('[data-testid="step6-goto-step7"]')).toContainText('去文案生成');
  });

  test('AC-8 · CTA label "生成拍摄计划"', async ({ page }) => {
    await expect(page.locator('[data-testid="step6-cta"]')).toContainText('生成拍摄计划');
  });

  test('AC-16(b) + AC-16(c) · < 10 chars disabled, >= 10 enabled, goto step7 works', async ({ page }) => {
    const cta = page.locator('[data-testid="step6-cta"]');
    const textarea = page.locator('[data-testid="step6-textarea"]');

    await expect(cta).toBeDisabled(); // empty
    await textarea.fill('九个字的');
    await expect(cta).toBeDisabled(); // 4 chars
    await textarea.fill('十个字以上的测试文案');
    await expect(cta).toBeEnabled(); // 9 chars... let me use enough
    await textarea.fill('这是超过十个字的文案测试内容');
    await expect(cta).toBeEnabled();
  });

  test('AC-16(d) · no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto(`${BASE_URL}/step/6`);
    await page.waitForLoadState('networkidle');
    const critical = errors.filter((e) => !e.includes('favicon') && !e.includes('net::ERR_'));
    expect(critical).toEqual([]);
  });
});
