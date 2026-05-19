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

  // AC-9 US-004: /ai-video baseline
  test('/ai-video fullPage inline matches prd22-ai-video.png', async ({ page }) => {
    await page.goto('/ai-video');
    await page.waitForSelector('[data-testid="ai-video-textarea"]');
    await expectVisualMatch(page, {
      baseline: 'prd22-ai-video.png',
      viewport: { width: 1440, height: 900 },
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });
  });

  // AC-9 US-005: /knowledge desktop baseline
  test('/knowledge desktop fullPage matches prd22-knowledge.png', async ({ page }) => {
    await page.goto('/knowledge');
    await page.waitForSelector('[data-testid="tab-scripts"]');
    await expectVisualMatch(page, {
      baseline: 'prd22-knowledge.png',
      viewport: { width: 1440, height: 900 },
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });
  });

  // AC-9 US-005: /knowledge mobile baseline
  test('/knowledge mobile fullPage matches prd22-knowledge-mobile.png', async ({ page }) => {
    await page.goto('/knowledge');
    await page.waitForSelector('[data-testid="tab-scripts"]');
    await expectVisualMatch(page, {
      baseline: 'prd22-knowledge-mobile.png',
      viewport: { width: 375, height: 812 },
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });
  });

  // AC-13 US-006: /step/1 baseline · prd22-step1
  test('/step/1 fullPage inline matches prd22-step1.png', async ({ page }) => {
    await page.goto('/step/1');
    await page.waitForSelector('[data-testid="step1-cta"]');
    await expectVisualMatch(page, {
      baseline: 'prd22-step1.png',
      viewport: { width: 1440, height: 900 },
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });
  });

  // AC-12 US-007: /step/3 baseline · prd22-step3
  test('/step/3 fullPage inline matches prd22-step3.png', async ({ page }) => {
    await page.goto('/step/3');
    await page.waitForLoadState('networkidle');
    await expectVisualMatch(page, {
      baseline: 'prd22-step3.png',
      viewport: { width: 1440, height: 900 },
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });
  });

  // AC-12 US-007: /step/3b baseline · prd22-step3b
  test('/step/3b fullPage inline matches prd22-step3b.png', async ({ page }) => {
    await page.goto('/step/3b');
    await page.waitForLoadState('networkidle');
    await expectVisualMatch(page, {
      baseline: 'prd22-step3b.png',
      viewport: { width: 1440, height: 900 },
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });
  });

  // AC-12 US-008: /step/4 baseline · prd22-step4
  test('/step/4 fullPage inline matches prd22-step4.png', async ({ page }) => {
    await page.goto('/step/4');
    await page.waitForLoadState('networkidle');
    await expectVisualMatch(page, {
      baseline: 'prd22-step4.png',
      viewport: { width: 1440, height: 900 },
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });
  });

  // AC-12 US-008: /step/4b baseline · prd22-step4b
  test('/step/4b fullPage inline matches prd22-step4b.png', async ({ page }) => {
    await page.goto('/step/4b');
    await page.waitForLoadState('networkidle');
    await expectVisualMatch(page, {
      baseline: 'prd22-step4b.png',
      viewport: { width: 1440, height: 900 },
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });
  });

  // AC-15 US-009: /step/5 baseline · prd22-step5
  test('/step/5 fullPage inline matches prd22-step5.png', async ({ page }) => {
    await page.goto('/step/5');
    await page.waitForSelector('[data-testid="step5-cta"]');
    await expectVisualMatch(page, {
      baseline: 'prd22-step5.png',
      viewport: { width: 1440, height: 900 },
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });
  });

  // AC-15 US-009: /step/6 baseline · prd22-step6
  test('/step/6 fullPage inline matches prd22-step6.png', async ({ page }) => {
    await page.goto('/step/6');
    await page.waitForSelector('[data-testid="step6-cta"]');
    await expectVisualMatch(page, {
      baseline: 'prd22-step6.png',
      viewport: { width: 1440, height: 900 },
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });
  });
});
