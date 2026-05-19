// PRD-22 US-002 · prd22-visual-baseline.spec.ts
// Visual snapshot baseline: /generate fullPage inline refactor
// Run: pnpm test:visual:prd22 (--update-snapshots first run)
// CI:  pnpm test:visual:prd22:check

import { test } from '@playwright/test';
import { expectVisualMatch } from '../../apps/web/scripts/visual-diff';

test.describe('PRD-22 Visual Baseline', () => {
  test.beforeEach(async ({ page }) => {
    // Disable all animations and transitions
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
  });

  test('/generate fullPage inline matches prd22-generate.png', async ({ page }) => {
    await page.goto('/generate');
    await expectVisualMatch(page, {
      baseline: 'prd22-generate.png',
      viewport: { width: 1440, height: 900 },
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });
  });

  // AC-8 US-003: /boom-generate baseline
  test('/boom-generate fullPage inline matches prd22-boom-generate.png', async ({ page }) => {
    await page.goto('/boom-generate');
    await page.waitForSelector('[data-element]');
    await expectVisualMatch(page, {
      baseline: 'prd22-boom-generate.png',
      viewport: { width: 1440, height: 900 },
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });
  });
});
