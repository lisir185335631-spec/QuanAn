// PRD-23 US-001/002 · prd23-visual-baseline.spec.ts
// Visual snapshot baseline: /diagnosis 8 步问卷向导 + /accounts IP 账号管理
// AC-15: viewport 1440x900 · threshold 0.05 · baseline 'prd23-diagnosis.png'
// AC-13: /accounts · baseline 'prd23-accounts.png' · viewport 1440x900 · 阈值 0.05
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

  // AC-13 · /accounts IP 账号管理 baseline
  test('/accounts fullPage matches prd23-accounts.png', async ({ page }) => {
    await page.goto('/accounts');
    await page.waitForLoadState('networkidle');
    await expectVisualMatch(page, {
      baseline: 'prd23-accounts.png',
      viewport: { width: 1440, height: 900 },
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });
  });

  // AC-16 · /step/8 直播策划 visual baseline
  test('/step/8 fullPage matches prd23-step8.png', async ({ page }) => {
    const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:5173';
    const API_BASE = process.env.VITE_API_BASE_URL ?? 'http://localhost:3000';
    await page.goto(`${API_BASE}/auth/dev-login`);
    await page.waitForURL(`${BASE_URL}/**`);
    await page.goto('/step/8');
    await page.waitForLoadState('networkidle');
    await page.getByRole('tab', { name: '生成直播方案' }).waitFor({ state: 'visible' });
    await expectVisualMatch(page, {
      baseline: 'prd23-step8.png',
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

  // AC-8 (US-005) · /analysis visual baseline
  test('/analysis fullPage matches prd23-analysis.png', async ({ page }) => {
    const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:5173';
    const API_BASE = process.env.VITE_API_BASE_URL ?? 'http://localhost:3000';
    await page.goto(`${API_BASE}/auth/dev-login`);
    await page.waitForURL(`${BASE_URL}/**`);
    await page.goto('/analysis');
    await page.waitForLoadState('networkidle');
    await page.locator('h1').waitFor({ state: 'visible' });
    await expectVisualMatch(page, {
      baseline: 'prd23-analysis.png',
      viewport: { width: 1440, height: 900 },
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });
  });

  // AC-9 · /video-analysis visual baseline
  test('/video-analysis fullPage matches prd23-video-analysis.png', async ({ page }) => {
    const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:5173';
    const API_BASE = process.env.VITE_API_BASE_URL ?? 'http://localhost:3000';
    await page.goto(`${API_BASE}/auth/dev-login`);
    await page.waitForURL(`${BASE_URL}/**`);
    await page.goto('/video-analysis');
    await page.waitForLoadState('networkidle');
    await page.locator('h1').waitFor({ state: 'visible' });
    await expectVisualMatch(page, {
      baseline: 'prd23-video-analysis.png',
      viewport: { width: 1440, height: 900 },
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });
  });

  // AC-8 (US-006) · /video-production visual baseline
  test('/video-production fullPage matches prd23-video-production.png', async ({ page }) => {
    const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:5173';
    const API_BASE = process.env.VITE_API_BASE_URL ?? 'http://localhost:3000';
    await page.goto(`${API_BASE}/auth/dev-login`);
    await page.waitForURL(`${BASE_URL}/**`);
    await page.goto('/video-production');
    await page.waitForLoadState('networkidle');
    await page.locator('h1').waitFor({ state: 'visible' });
    await expectVisualMatch(page, {
      baseline: 'prd23-video-production.png',
      viewport: { width: 1440, height: 900 },
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });
  });

  // AC-9 (US-007) · /acquisition-video visual baseline
  test('/acquisition-video fullPage matches prd23-acquisition-video.png', async ({ page }) => {
    const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:5173';
    const API_BASE = process.env.VITE_API_BASE_URL ?? 'http://localhost:3000';
    await page.goto(`${API_BASE}/auth/dev-login`);
    await page.waitForURL(`${BASE_URL}/**`);
    await page.goto('/acquisition-video');
    await page.waitForLoadState('networkidle');
    await page.locator('h1').waitFor({ state: 'visible' });
    await expectVisualMatch(page, {
      baseline: 'prd23-acquisition-video.png',
      viewport: { width: 1440, height: 900 },
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });
  });
});
