/**
 * PRD-22 US-009 — Step 5 爆款选题库 E2E flow
 * AC-1/2/3/4/16 验证: H1 字面锁 · 2 inputs · 2 file uploads · CTA · file upload dialog · no errors
 */
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:5173';

test.describe('PRD-22 US-009 · Step 5 爆款选题库', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/step/5`);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('AC-1 · H1 字面锁 "爆款选题库" + 副标签 "STEP 05 · 爆款选题库"', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('爆款选题库');
    await expect(page.locator('text=STEP 05 · 爆款选题库')).toBeVisible();
  });

  test('AC-2 · 2 inputs (行业领域 / 产品/服务) present', async ({ page }) => {
    await expect(page.locator('label').filter({ hasText: '行业领域' })).toBeVisible();
    await expect(page.locator('label').filter({ hasText: '产品/服务' })).toBeVisible();
  });

  test('AC-2 · 2 file upload areas (产品图 / 案例图) present', async ({ page }) => {
    await expect(page.locator('[data-testid="file-upload-产品图"]')).toBeVisible();
    await expect(page.locator('[data-testid="file-upload-案例图"]')).toBeVisible();
  });

  test('AC-2 · CTA "生成爆款选题库" disabled when inputs empty', async ({ page }) => {
    const cta = page.locator('[data-testid="step5-cta"]');
    await expect(cta).toContainText('生成爆款选题库');
    await expect(cta).toBeDisabled();
  });

  test('AC-2 · CTA enabled after filling both required inputs', async ({ page }) => {
    await page.locator('[data-testid="step5-input-industry"]').fill('美业');
    await page.locator('[data-testid="step5-input-product"]').fill('皮肤管理项目');
    await expect(page.locator('[data-testid="step5-cta"]')).toBeEnabled();
  });

  test('AC-4 + AC-16(a) · file upload trigger opens file chooser', async ({ page }) => {
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser', { timeout: 5000 }),
      page.locator('[data-testid="file-upload-trigger-产品图"]').click(),
    ]);
    expect(fileChooser).toBeTruthy();
    expect(fileChooser.isMultiple()).toBe(true);
  });

  test('AC-3 + AC-11 · 5 H3 字面锁同时存在于 DOM after submit', async ({ page }) => {
    await page.locator('[data-testid="step5-input-industry"]').fill('美业');
    await page.locator('[data-testid="step5-input-product"]').fill('皮肤管理');
    await page.locator('[data-testid="step5-cta"]').click();

    await expect(page.locator('[data-testid="step5-output-grid"]')).toBeVisible({ timeout: 5000 });

    await expect(page.getByRole('heading', { name: '知识科普类选题', level: 3 })).toBeVisible();
    await expect(page.getByRole('heading', { name: '产品种草类选题', level: 3 })).toBeVisible();
    await expect(page.getByRole('heading', { name: '情感共鸣类选题', level: 3 })).toBeVisible();
    await expect(page.getByRole('heading', { name: '争议讨论类选题', level: 3 })).toBeVisible();
    await expect(page.getByRole('heading', { name: '干货实操类选题', level: 3 })).toBeVisible();

    const hCount = await page.locator('h1, h2, h3, h4, h5, h6').count();
    expect(hCount, `Expected 6 H elements (H1 + 5 H3), got ${hCount}`).toBe(6);
  });

  test('AC-16(d) · no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto(`${BASE_URL}/step/5`);
    await page.waitForLoadState('networkidle');
    const critical = errors.filter((e) => !e.includes('favicon') && !e.includes('net::ERR_'));
    expect(critical).toEqual([]);
  });
});
