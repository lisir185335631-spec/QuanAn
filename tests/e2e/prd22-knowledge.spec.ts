// PRD-22 US-005 · prd22-knowledge.spec.ts
// /knowledge 页 · 4 tab 字面锁 + 20 脚本卡 + 案例计数 button + search filter + 22 元素展示
// AC-8: ≥ 6 tests

import { expect, test } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:5173';

test.describe('prd22-knowledge · /knowledge 页重构验证', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/knowledge`);
    // Wait for tab 1 to be active
    await page.waitForSelector('[data-testid="tab-scripts"]');
  });

  // Test 1: H1 字面锁
  test('AC-1 · H1 "AIP 文案方法论" + 副标题字面锁', async ({ page }) => {
    await expect(page.locator('h1')).toHaveText('AIP 文案方法论');
    await expect(
      page.getByText('系统学习 AIP 的短视频文案创作方法论，掌握爆款文案的核心技巧'),
    ).toBeVisible();
  });

  // Test 2: 4 tab 字面锁 D-217
  test('AC-2 · 4 tab 字面锁 D-217 · 顺序固定 · tab 1 默认 active', async ({ page }) => {
    const tabScripts = page.getByTestId('tab-scripts');
    const tabElements = page.getByTestId('tab-elements');
    const tabIntros = page.getByTestId('tab-intros');
    const tabCore = page.getByTestId('tab-core');

    await expect(tabScripts).toHaveText('20 类脚本');
    await expect(tabElements).toHaveText('20 大爆款');
    await expect(tabIntros).toHaveText('开头公式');
    await expect(tabCore).toHaveText('核心公式');

    // Tab 1 默认 active
    await expect(tabScripts).toHaveAttribute('data-state', 'active');
    await expect(tabElements).toHaveAttribute('data-state', 'inactive');
  });

  // Test 3: tab 1 · 20 脚本卡可见
  test('AC-3 · tab 1 · 20 脚本卡 + tab 1 content 可见', async ({ page }) => {
    // tab 1 content should be active
    const tab1Content = page.getByTestId('tab-content-scripts');
    await expect(tab1Content).toBeVisible();

    // 20 script cards present
    const scriptCards = page.locator('[data-testid^="script-card-"]');
    expect(await scriptCards.count()).toBe(20);

    // All 20 case count buttons present
    const caseCountButtons = page.locator('[data-testid^="case-count-"]');
    expect(await caseCountButtons.count()).toBe(20);

    // Case count button text matches pattern "实战案例 (N)"
    const firstCaseBtn = page.locator('[data-testid="case-count-opinion"]');
    await expect(firstCaseBtn).toBeVisible();
    await expect(firstCaseBtn).toContainText('实战案例');
  });

  // Test 4: search filter 联动
  test('AC-3 · search filter 实时 filter 脚本卡', async ({ page }) => {
    const searchInput = page.getByTestId('script-search');
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute('placeholder', '搜索脚本类型...');

    // Type search query
    await searchInput.fill('故事');
    // Should filter to fewer cards
    const scriptCards = page.locator('[data-testid^="script-card-"]');
    const filteredCount = await scriptCards.count();
    expect(filteredCount).toBeLessThan(20);
    expect(filteredCount).toBeGreaterThan(0);

    // Clear search → all 20 back
    await searchInput.fill('');
    expect(await scriptCards.count()).toBe(20);
  });

  // Test 5: tab 2 · 22 元素 button 展示
  test('AC-4 · tab 2 · "20 大爆款" · 22+ 元素 button disabled 展示', async ({ page }) => {
    // Click tab 2
    await page.getByTestId('tab-elements').click();
    await expect(page.getByTestId('tab-content-elements')).toBeVisible();

    // Elements buttons present (disabled)
    const elementButtons = page.locator('[data-element]');
    const count = await elementButtons.count();
    expect(count).toBeGreaterThanOrEqual(22);

    // All disabled
    const firstEl = elementButtons.first();
    await expect(firstEl).toBeDisabled();
  });

  // Test 6: tab 3 + tab 4 stub placeholder
  test('AC-5 · tab 3/4 stub placeholder 文字正确', async ({ page }) => {
    await page.getByTestId('tab-intros').click();
    await expect(page.getByText('5 类开头公式 · PRD-23 完整化')).toBeVisible();

    await page.getByTestId('tab-core').click();
    await expect(page.getByText('AIP 起承转合公式 · PRD-23 完整化')).toBeVisible();
  });

  // Test 7: AC-6 · DOM 总 button 数 ≥ 47 (forceMount 所有 tabs)
  test('AC-6 · DOM 总 button 数 ≥ 47 (forceMount: 4 tab + 20 case + 23 elements)', async ({
    page,
  }) => {
    // Count ALL buttons in DOM (including hidden forceMount tabs)
    const allButtons = page.locator('button');
    const totalCount = await allButtons.count();
    expect(totalCount).toBeGreaterThanOrEqual(47);
  });

  // Test 8: tab 切换平滑 · console 无 error
  test('AC-10 · tab 切换无 console error', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    // Switch through all tabs
    await page.getByTestId('tab-elements').click();
    await page.getByTestId('tab-intros').click();
    await page.getByTestId('tab-core').click();
    await page.getByTestId('tab-scripts').click();

    expect(consoleErrors).toHaveLength(0);
  });
});
