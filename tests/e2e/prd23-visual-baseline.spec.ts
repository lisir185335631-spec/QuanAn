// PRD-23 US-001 · prd23-visual-baseline.spec.ts
// Visual snapshot baseline: /diagnosis 8 步问卷向导
// AC-15: viewport 1440x900 · threshold 0.05 · baseline 'prd23-diagnosis.png'
// Run first: pnpm exec playwright test tests/e2e/prd23-visual-baseline.spec.ts --update-snapshots
// CI check:  pnpm exec playwright test tests/e2e/prd23-visual-baseline.spec.ts

import { test } from '@playwright/test';
import { expectVisualMatch } from '../../apps/web/scripts/visual-diff';

test.describe('PRD-23 Visual Baseline', () => {
  test.beforeEach(async ({ page }) => {
    // Disable all animations and transitions for stable snapshots
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

  // AC-15 · /diagnosis Step 1 wizard baseline
  test('/diagnosis fullPage matches prd23-diagnosis.png', async ({ page }) => {
    await page.goto('/diagnosis');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="diagnosis-step-card"]');
    await expectVisualMatch(page, {
      baseline: 'prd23-diagnosis.png',
      viewport: { width: 1440, height: 900 },
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });
  });

  // /diagnosis Step 8 报告页 baseline
  test('/diagnosis Step 8 report matches prd23-diagnosis-report.png', async ({ page }) => {
    await page.goto('/diagnosis');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');
    // Navigate through all 8 steps
    for (let i = 0; i < 8; i++) {
      await page.getByTestId('diagnosis-next').click();
    }
    await page.waitForSelector('[data-testid="diagnosis-report"]');
    await expectVisualMatch(page, {
      baseline: 'prd23-diagnosis-report.png',
      viewport: { width: 1440, height: 900 },
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });
  });
});
