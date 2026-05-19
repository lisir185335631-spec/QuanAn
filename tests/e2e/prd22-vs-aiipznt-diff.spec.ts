// Step D · prd22-vs-aiipznt-diff.spec.ts
// 目的: 量化 PRD-22 13 page QuanAn 实现 vs aiipznt 实拍 baseline 实际 pixel diff %
// 跑法: cd apps/web && pnpm exec playwright test ../tests/e2e/prd22-vs-aiipznt-diff.spec.ts
// 容忍度: maxDiffPixelRatio = 0.99(允许 99% 差异 · 仅为收集数据 · 不阻断)
// 输出: 每 page fail msg 含 actual pixel diff · 用于 TD-090/091 数据驱动决策

import { test } from '@playwright/test';
import { expectVisualMatch } from '../../apps/web/scripts/visual-diff';

test.describe('PRD-22 vs aiipznt baseline diff measurement', () => {
  test.beforeEach(async ({ page }) => {
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

  const HIGH_TOLERANCE = 0.99;

  test('/generate vs aiipznt 26-generate.png', async ({ page }) => {
    await page.goto('/generate');
    await expectVisualMatch(page, {
      baseline: '26-generate.png',
      viewport: { width: 1440, height: 900 },
      fullPage: true,
      maxDiffPixelRatio: HIGH_TOLERANCE,
    });
  });

  test('/boom-generate vs aiipznt 25-boom-generate.png', async ({ page }) => {
    await page.goto('/boom-generate');
    await page.waitForSelector('[data-element]');
    await expectVisualMatch(page, {
      baseline: '25-boom-generate.png',
      viewport: { width: 1440, height: 900 },
      fullPage: true,
      maxDiffPixelRatio: HIGH_TOLERANCE,
    });
  });

  test('/ai-video vs aiipznt 30-ai-video.png', async ({ page }) => {
    await page.goto('/ai-video');
    await page.waitForSelector('[data-testid="ai-video-textarea"]');
    await expectVisualMatch(page, {
      baseline: '30-ai-video.png',
      viewport: { width: 1440, height: 900 },
      fullPage: true,
      maxDiffPixelRatio: HIGH_TOLERANCE,
    });
  });

  test('/knowledge vs aiipznt 33-knowledge.png', async ({ page }) => {
    await page.goto('/knowledge');
    await page.waitForSelector('[data-testid="tab-scripts"]');
    await expectVisualMatch(page, {
      baseline: '33-knowledge.png',
      viewport: { width: 1440, height: 900 },
      fullPage: true,
      maxDiffPixelRatio: HIGH_TOLERANCE,
    });
  });

  test('/step/1 vs aiipznt 10-step-1-industry.png', async ({ page }) => {
    await page.goto('/step/1');
    await page.waitForSelector('[data-testid="step1-cta"]');
    await expectVisualMatch(page, {
      baseline: '10-step-1-industry.png',
      viewport: { width: 1440, height: 900 },
      fullPage: true,
      maxDiffPixelRatio: HIGH_TOLERANCE,
    });
  });

  test('/step/3 vs aiipznt 11-step-3-account.png', async ({ page }) => {
    await page.goto('/step/3');
    await page.waitForLoadState('networkidle');
    await expectVisualMatch(page, {
      baseline: '11-step-3-account.png',
      viewport: { width: 1440, height: 900 },
      fullPage: true,
      maxDiffPixelRatio: HIGH_TOLERANCE,
    });
  });

  test('/step/3b vs aiipznt 12-step-3b-persona.png', async ({ page }) => {
    await page.goto('/step/3b');
    await page.waitForLoadState('networkidle');
    await expectVisualMatch(page, {
      baseline: '12-step-3b-persona.png',
      viewport: { width: 1440, height: 900 },
      fullPage: true,
      maxDiffPixelRatio: HIGH_TOLERANCE,
    });
  });

  test('/step/4 vs aiipznt 13-step-4-execution.png', async ({ page }) => {
    await page.goto('/step/4');
    await page.waitForLoadState('networkidle');
    await expectVisualMatch(page, {
      baseline: '13-step-4-execution.png',
      viewport: { width: 1440, height: 900 },
      fullPage: true,
      maxDiffPixelRatio: HIGH_TOLERANCE,
    });
  });

  test('/step/4b vs aiipznt 14-step-4b-monetization.png', async ({ page }) => {
    await page.goto('/step/4b');
    await page.waitForLoadState('networkidle');
    await expectVisualMatch(page, {
      baseline: '14-step-4b-monetization.png',
      viewport: { width: 1440, height: 900 },
      fullPage: true,
      maxDiffPixelRatio: HIGH_TOLERANCE,
    });
  });

  test('/step/5 vs aiipznt 15-step-5-topics.png', async ({ page }) => {
    await page.goto('/step/5');
    await page.waitForSelector('[data-testid="step5-cta"]');
    await expectVisualMatch(page, {
      baseline: '15-step-5-topics.png',
      viewport: { width: 1440, height: 900 },
      fullPage: true,
      maxDiffPixelRatio: HIGH_TOLERANCE,
    });
  });

  test('/step/6 vs aiipznt 16-step-6-shooting.png', async ({ page }) => {
    await page.goto('/step/6');
    await page.waitForSelector('[data-testid="step6-cta"]');
    await expectVisualMatch(page, {
      baseline: '16-step-6-shooting.png',
      viewport: { width: 1440, height: 900 },
      fullPage: true,
      maxDiffPixelRatio: HIGH_TOLERANCE,
    });
  });

  test('/step/7 vs aiipznt 17-step-7-copywriting.png', async ({ page }) => {
    await page.goto('/step/7');
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(() => document.querySelectorAll('button').length >= 20);
    await expectVisualMatch(page, {
      baseline: '17-step-7-copywriting.png',
      viewport: { width: 1440, height: 900 },
      fullPage: true,
      maxDiffPixelRatio: HIGH_TOLERANCE,
    });
  });
});
