// PRD-16 US-011 · prd16-guide-flow.spec.ts
// AC-3: /guide page e2e flow · 13 modules + filter + FAQ accordion + 5 recommended steps
// Updated for PRD-21 US-006: Link-based module cards + details/summary FAQ + GUIDE_FAQ_5 content
// Uses @playwright/test — requires dev server on http://localhost:5173

import { test, expect } from '@playwright/test';

test.describe('PRD-16 /guide page flow', () => {
  test('H1 "USER GUIDE" visible', async ({ page }) => {
    await page.goto('/guide');
    await expect(page.locator('h1').first()).toContainText('USER GUIDE');
  });

  test('13 module cards rendered', async ({ page }) => {
    await page.goto('/guide');
    // Module cards are Link elements with glass-card and cursor-pointer classes.
    // Footer card (使用说明) also has cursor-pointer but href=/guide (self-link),
    // so total .glass-card.cursor-pointer = 14 (13 modules + 1 footer card).
    // Only the 13 clickable module cards are in the main grid.
    const moduleCards = page.locator('.glass-card.cursor-pointer');
    const count = await moduleCards.count();
    expect(count).toBeGreaterThanOrEqual(13);
  });

  test('search filter narrows module cards', async ({ page }) => {
    await page.goto('/guide');
    // Actual placeholder in Guide.tsx is '搜索功能说明...'
    const searchInput = page.getByPlaceholder('搜索功能说明...');
    await expect(searchInput).toBeVisible();

    // Type a search query — '爆款' matches several modules
    await searchInput.fill('爆款');
    // RECOMMENDED_FLOW + SYSTEM_OVERVIEW sections are hidden when searching
    // Only filtered module cards (cursor-pointer) remain
    const filtered = page.locator('.glass-card.cursor-pointer');
    const filteredCount = await filtered.count();
    expect(filteredCount).toBeGreaterThan(0);
    expect(filteredCount).toBeLessThan(13);

    // Clear search → back to full module list (13 modules + footer)
    await searchInput.clear();
    const afterClear = await page.locator('.glass-card.cursor-pointer').count();
    expect(afterClear).toBeGreaterThanOrEqual(13);
  });

  test('FAQ accordion expand/collapse', async ({ page }) => {
    await page.goto('/guide');

    // FAQ section: 5 FAQ items using <details>/<summary>
    const faqItems = page.locator('details');
    await expect(faqItems).toHaveCount(5);

    // Click first FAQ summary to expand
    const firstSummary = page.locator('details summary').first();
    await expect(firstSummary).toBeVisible();
    await firstSummary.click();

    // After expanding, the details content should be visible
    const firstDetails = page.locator('details').first();
    await expect(firstDetails).toContainText(/建议作为参考|直接用吗/);
  });

  test('5 recommended flow steps visible', async ({ page }) => {
    await page.goto('/guide');
    // RECOMMENDED_FLOW has 5 steps: 01-05
    for (const num of ['01', '02', '03', '04', '05']) {
      await expect(page.getByText(num)).toBeVisible();
    }
  });

  test('module card links to module page', async ({ page }) => {
    await page.goto('/guide');
    // Module cards are Links — first card should have a valid href
    const firstModuleCard = page.locator('.glass-card.cursor-pointer').first();
    const href = await firstModuleCard.getAttribute('href');
    expect(href).toBeTruthy();
    expect(href).toMatch(/^\//);
  });
});
