/**
 * PRD-29 US-013 · /step/3 Visual Regression Spec
 * AC-3: playwright toHaveScreenshot pixel diff vs aiipznt baseline · maxDiffPixelRatio 0.05
 *
 * Compares QuanAn /step/3 (default form state, no submitted data) against
 * the aiipznt baseline screenshot.
 *
 * Run (update baseline):  pnpm test:visual:prd29
 * Run (check regression): pnpm test:visual:prd29:check
 *
 * Baseline stored in: /tmp/aiipznt-clone-research/screenshots/
 */
import { test } from '@playwright/test';
import { expectVisualMatch } from '../../apps/web/scripts/visual-diff';

const API_BASE = process.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

test.describe('PRD-29 /step/3 visual regression · default form state', () => {
  test.beforeEach(async ({ page }) => {
    // Disable all animations for stable screenshot
    await page.addStyleTag({
      content: [
        '*, *::before, *::after {',
        '  animation-duration: 0s !important;',
        '  animation-delay: 0s !important;',
        '  transition-duration: 0s !important;',
        '  transition-delay: 0s !important;',
        '}',
      ].join('\n'),
    });
    // Auth via dev-login
    await page.goto(`${API_BASE}/auth/dev-login`);
    await page.waitForURL(/localhost:5173/);
    // Navigate to /step/3 – default state (no submitted data)
    await page.goto('http://localhost:5173/step/3');
    await page.waitForLoadState('networkidle');
  });

  test('/step/3 · default form state vs stored baseline (maxDiffPixelRatio 0.05)', async ({
    page,
  }) => {
    // Wait for form and placeholder sections to render
    await page.waitForSelector('button[type="submit"]');
    // Scroll to top to ensure full-page capture starts from top
    await page.evaluate(() => window.scrollTo(0, 0));

    await expectVisualMatch(page, {
      baseline: 'prd29-step3-default',
      viewport: { width: 1440, height: 900 },
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });
  });
});
