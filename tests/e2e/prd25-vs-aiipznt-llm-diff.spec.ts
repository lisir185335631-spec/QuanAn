// prd25-vs-aiipznt-llm-diff.spec.ts
// 目的: 量化 PRD-25 LLM 接入后 12 page QuanAn 实现 vs aiipznt 实拍 baseline pixel diff %
// 跑法: cd apps/web && pnpm exec playwright test ../tests/e2e/prd25-vs-aiipznt-llm-diff.spec.ts
// 容忍度: maxDiffPixelRatio=0.5 (50% · 数据驱动 TD-090/091 决策)
// LLM seed: GET /auth/dev-login → 页面含真实 LLM 渲染内容
// 输出: .agents/verification/prd-25-vs-aiipznt-llm.md

import { test } from '@playwright/test';
import { expectVisualMatch } from '../../apps/web/scripts/visual-diff';

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:5173';
const LLM_TOLERANCE = 0.5; // 50% — 数据驱动 TD-090 决策, 不硬阻断

test.describe('PRD-25 LLM pages vs aiipznt baseline (TD-090 数据驱动)', () => {
  test.beforeEach(async ({ page }) => {
    // auth bypass — LLM content requires authenticated session
    await page.goto(`${BASE_URL}/auth/dev-login`);
    await page.waitForLoadState('networkidle');
    // disable animations for stable screenshot
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

  // US-001: /diagnosis
  test('/diagnosis vs aiipznt 40-diagnosis.png', async ({ page }) => {
    await page.goto(`${BASE_URL}/diagnosis`);
    await page.waitForLoadState('networkidle');
    await expectVisualMatch(page, {
      baseline: '40-diagnosis.png',
      viewport: { width: 1440, height: 900 },
      fullPage: true,
      maxDiffPixelRatio: LLM_TOLERANCE,
    });
  });

  // US-002: /voice-chat
  test('/voice-chat vs aiipznt 31-voice-chat.png', async ({ page }) => {
    await page.goto(`${BASE_URL}/voice-chat`);
    await page.waitForLoadState('networkidle');
    await expectVisualMatch(page, {
      baseline: '31-voice-chat.png',
      viewport: { width: 1440, height: 900 },
      fullPage: true,
      maxDiffPixelRatio: LLM_TOLERANCE,
    });
  });

  // US-003: /daily-tasks
  test('/daily-tasks vs aiipznt 41-daily-tasks.png', async ({ page }) => {
    await page.goto(`${BASE_URL}/daily-tasks`);
    await page.waitForLoadState('networkidle');
    await expectVisualMatch(page, {
      baseline: '41-daily-tasks.png',
      viewport: { width: 1440, height: 900 },
      fullPage: true,
      maxDiffPixelRatio: LLM_TOLERANCE,
    });
  });

  // US-004: /evolution
  test('/evolution vs aiipznt 42-evolution.png', async ({ page }) => {
    await page.goto(`${BASE_URL}/evolution`);
    await page.waitForLoadState('networkidle');
    await expectVisualMatch(page, {
      baseline: '42-evolution.png',
      viewport: { width: 1440, height: 900 },
      fullPage: true,
      maxDiffPixelRatio: LLM_TOLERANCE,
    });
  });

  // US-005: /video-analysis
  test('/video-analysis vs aiipznt 21-video-analysis.png', async ({ page }) => {
    await page.goto(`${BASE_URL}/video-analysis`);
    await page.waitForLoadState('networkidle');
    await expectVisualMatch(page, {
      baseline: '21-video-analysis.png',
      viewport: { width: 1440, height: 900 },
      fullPage: true,
      maxDiffPixelRatio: LLM_TOLERANCE,
    });
  });

  // US-005: /analysis
  test('/analysis vs aiipznt 27-analysis.png', async ({ page }) => {
    await page.goto(`${BASE_URL}/analysis`);
    await page.waitForLoadState('networkidle');
    await expectVisualMatch(page, {
      baseline: '27-analysis.png',
      viewport: { width: 1440, height: 900 },
      fullPage: true,
      maxDiffPixelRatio: LLM_TOLERANCE,
    });
  });

  // US-006: /video-production
  test('/video-production vs aiipznt 28-video-production.png', async ({ page }) => {
    await page.goto(`${BASE_URL}/video-production`);
    await page.waitForLoadState('networkidle');
    await expectVisualMatch(page, {
      baseline: '28-video-production.png',
      viewport: { width: 1440, height: 900 },
      fullPage: true,
      maxDiffPixelRatio: LLM_TOLERANCE,
    });
  });

  // US-006: /acquisition-video
  test('/acquisition-video vs aiipznt 29-acquisition-video.png', async ({ page }) => {
    await page.goto(`${BASE_URL}/acquisition-video`);
    await page.waitForLoadState('networkidle');
    await expectVisualMatch(page, {
      baseline: '29-acquisition-video.png',
      viewport: { width: 1440, height: 900 },
      fullPage: true,
      maxDiffPixelRatio: LLM_TOLERANCE,
    });
  });

  // US-007: /step/8 (LivestreamAgent)
  test('/step/8 vs aiipznt 18-step-8-livestream.png', async ({ page }) => {
    await page.goto(`${BASE_URL}/step/8`);
    await page.waitForLoadState('networkidle');
    await expectVisualMatch(page, {
      baseline: '18-step-8-livestream.png',
      viewport: { width: 1440, height: 900 },
      fullPage: true,
      maxDiffPixelRatio: LLM_TOLERANCE,
    });
  });

  // US-007: /accounts (smartRecommend)
  test('/accounts vs aiipznt 00-home.png (fallback — no direct account listing screenshot)', async ({ page }) => {
    await page.goto(`${BASE_URL}/accounts`);
    await page.waitForLoadState('networkidle');
    await expectVisualMatch(page, {
      baseline: '00-home.png',
      viewport: { width: 1440, height: 900 },
      fullPage: true,
      maxDiffPixelRatio: LLM_TOLERANCE,
    });
  });

  // LLM content pages from prior PRDs — now with real LLM data (TD-090 comparison)
  test('/generate vs aiipznt 26-generate.png (LLM content loaded)', async ({ page }) => {
    await page.goto(`${BASE_URL}/generate`);
    await page.waitForLoadState('networkidle');
    await expectVisualMatch(page, {
      baseline: '26-generate.png',
      viewport: { width: 1440, height: 900 },
      fullPage: true,
      maxDiffPixelRatio: LLM_TOLERANCE,
    });
  });

  test('/trending vs aiipznt 20-trending.png (LLM topic data)', async ({ page }) => {
    await page.goto(`${BASE_URL}/trending`);
    await page.waitForLoadState('networkidle');
    await expectVisualMatch(page, {
      baseline: '20-trending.png',
      viewport: { width: 1440, height: 900 },
      fullPage: true,
      maxDiffPixelRatio: LLM_TOLERANCE,
    });
  });
});
