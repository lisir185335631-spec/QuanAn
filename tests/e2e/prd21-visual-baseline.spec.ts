// PRD-21 US-001 · prd21-visual-baseline.spec.ts
// Visual snapshot baseline: 4 fixtures comparing against aiipznt reference screenshots
// Run: pnpm test:visual (--update-snapshots first run)
// CI:  pnpm test:visual:check

import { test } from '@playwright/test';
import { expectVisualMatch } from '../../apps/web/scripts/visual-diff';

test.describe('PRD-21 Visual Baseline', () => {
  test.beforeEach(async ({ page }) => {
    // Disable all animations and transitions — double-guard on top of playwright config
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

  test('home page / matches 00-home.png', async ({ page }) => {
    await page.goto('/');
    await expectVisualMatch(page, {
      baseline: '00-home.png',
      viewport: { width: 1280, height: 900 },
      fullPage: true,
    });
  });

  test('guide page /guide matches 01-guide.png', async ({ page }) => {
    await page.goto('/guide');
    await expectVisualMatch(page, {
      baseline: '01-guide.png',
      viewport: { width: 1280, height: 900 },
      fullPage: true,
    });
  });

  test('ip-plan page /ip-plan matches 02-ip-plan.png', async ({ page }) => {
    await page.goto('/ip-plan');
    await expectVisualMatch(page, {
      baseline: '02-ip-plan.png',
      viewport: { width: 1280, height: 900 },
      fullPage: true,
    });
  });

  test('header desktop matches 00-home-header crop', async ({ page }) => {
    await page.goto('/');
    // Crop: capture header bar only (top 72px at desktop 1280px width)
    await expectVisualMatch(page, {
      baseline: '00-home-header.png',
      viewport: { width: 1280, height: 900 },
      fullPage: false,
      clip: { x: 0, y: 0, width: 1280, height: 72 },
    });
  });
});
