// PRD-16 US-011 · prd16-guide-flow.test.ts
// AC-3: /guide page e2e flow · 13 modules + filter + FAQ accordion + 5 recommended steps
// Uses @playwright/test — requires dev server on http://localhost:5173

import { test, expect } from '@playwright/test';

test.describe('PRD-16 /guide page flow', () => {
  test('H1 "USER GUIDE" visible', async ({ page }) => {
    await page.goto('/guide');
    await expect(page.locator('h1').first()).toContainText('USER GUIDE');
  });

  test('13 module cards rendered', async ({ page }) => {
    await page.goto('/guide');
    // Each module is a glass-card with icon + title + desc
    // All 13 are always rendered (static data, no tRPC)
    const moduleCards = page.locator('.glass-card');
    await expect(moduleCards).toHaveCount(13);
  });

  test('search filter narrows module cards', async ({ page }) => {
    await page.goto('/guide');
    const searchInput = page.getByPlaceholder('搜索模块...');
    await expect(searchInput).toBeVisible();

    // Type a search query that matches a subset
    await searchInput.fill('爆款');
    // Should show fewer than 13 cards
    const filtered = page.locator('.glass-card');
    const filteredCount = await filtered.count();
    expect(filteredCount).toBeGreaterThan(0);
    expect(filteredCount).toBeLessThan(13);

    // Clear search → back to 13
    await searchInput.clear();
    await expect(page.locator('.glass-card')).toHaveCount(13);
  });

  test('FAQ accordion expand/collapse', async ({ page }) => {
    await page.goto('/guide');

    // FAQ section: 5 FAQ items
    // Each has a question button that toggles the answer
    const faqQuestions = page.locator('button').filter({ hasText: /生成的内容|语音对话|视频功能|更了解|数据会被/ });
    const count = await faqQuestions.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // Click first FAQ to expand
    await faqQuestions.first().click();
    // Answer should appear (looking for answer text elements after click)
    // The FAQItem renders answer in a div when open=true
    const firstQ = faqQuestions.first();
    const parentDiv = firstQ.locator('..').locator('..');
    await expect(parentDiv).toContainText(/参考|调整|建议/i);
  });

  test('5 recommended flow steps visible', async ({ page }) => {
    await page.goto('/guide');
    // RECOMMENDED_FLOW has 5 steps: 01-05
    for (const num of ['01', '02', '03', '04', '05']) {
      await expect(page.getByText(num)).toBeVisible();
    }
  });

  test('module card expand shows steps', async ({ page }) => {
    await page.goto('/guide');
    // Click on a module card (glass-card) to expand steps
    const firstCard = page.locator('.glass-card').first();
    await firstCard.click();
    // After click, steps list should appear (numbered list items)
    await expect(page.locator('ol li').first()).toBeVisible();
  });
});
