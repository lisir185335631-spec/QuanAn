// PRD-22 US-003 · prd22-boom-generate.spec.ts
// E2E tests for /boom-generate inline refactor
// AC-7: ≥ 4 tests (H1 存在 / 22 元素渲染 / 多选行为 / disabled 条件)

import { test, expect } from '@playwright/test';

test.describe('PRD-22 /boom-generate inline refactor', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/boom-generate');
    // Wait for page to be ready
    await page.waitForSelector('h1');
  });

  // AC-7 test 1: H1 exists with literal lock text
  test('H1 字面锁 "爆款元素自动生成" 存在', async ({ page }) => {
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
    await expect(h1).toHaveText('爆款元素自动生成');
  });

  // AC-7 test 2: 22+ elements render in 4 groups
  test('22+ 爆款元素 button 在 4 组中渲染', async ({ page }) => {
    // Wait for elements to render
    await page.waitForSelector('[data-element]');
    const elementButtons = page.locator('[data-element]');
    const count = await elementButtons.count();
    // ALL_ELEMENTS has 23 items (≥ 22 per spec)
    expect(count).toBeGreaterThanOrEqual(22);

    // AC-4: total DOM button count ≥ 25 (22+ elements + 1 CTA + 2 secondary)
    const allButtons = page.locator('button');
    const totalCount = await allButtons.count();
    expect(totalCount).toBeGreaterThanOrEqual(25);
  });

  // AC-7 test 3: multi-select behavior — selecting elements updates count
  test('多选行为 — 选择元素后计数更新且 CTA 启用', async ({ page }) => {
    await page.waitForSelector('[data-element]');

    // CTA should be disabled initially (no elements selected)
    const cta = page.locator('[data-testid="boom-generate-cta"]');
    await expect(cta).toBeDisabled();

    // Select first element button
    const firstElement = page.locator('[data-element]').first();
    await firstElement.click();

    // CTA should now be enabled
    await expect(cta).toBeEnabled();

    // Select a second element
    const secondElement = page.locator('[data-element]').nth(1);
    await secondElement.click();

    // Count text should reflect 2 selected
    const countText = page.locator('text=/已选 2 个/');
    await expect(countText).toBeVisible();

    // Deselect first element (toggle off)
    await firstElement.click();
    const countText1 = page.locator('text=/已选 1 个/');
    await expect(countText1).toBeVisible();
  });

  // AC-7 test 4: disabled condition — CTA disabled when no elements selected
  test('disabled 条件 — elements 为空时 CTA disabled', async ({ page }) => {
    await page.waitForSelector('[data-element]');

    const cta = page.locator('[data-testid="boom-generate-cta"]');

    // Initially disabled
    await expect(cta).toBeDisabled();

    // Select an element
    await page.locator('[data-element]').first().click();
    await expect(cta).toBeEnabled();

    // Clear all via clear button
    await page.locator('[data-testid="clear-elements"]').click();
    await expect(cta).toBeDisabled();
  });
});
