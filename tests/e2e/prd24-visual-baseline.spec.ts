// PRD-24 US-001 · prd24-visual-baseline.spec.ts
// Visual snapshot baseline: /daily-tasks
// AC-11: viewport 1440x900 · threshold 0.05 · baseline 'prd24-daily-tasks.png'
// Run first: pnpm exec playwright test tests/e2e/prd24-visual-baseline.spec.ts --update-snapshots
// CI check:  pnpm exec playwright test tests/e2e/prd24-visual-baseline.spec.ts

import { test } from '@playwright/test';
import { expectVisualMatch } from '../../apps/web/scripts/visual-diff';

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:5173';
const API_BASE = process.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

test.describe('PRD-24 Visual Baseline', () => {
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

  test('/daily-tasks fullPage matches prd24-daily-tasks.png', async ({ page }) => {
    await page.goto(`${API_BASE}/auth/dev-login`);
    await page.waitForURL(`${BASE_URL}/**`);
    await page.goto(`${BASE_URL}/daily-tasks`);
    await page.waitForLoadState('networkidle');
    await page.locator('h1').waitFor({ state: 'visible' });
    // Wait for stub loading (800ms) to finish and tasks to render
    await page.waitForSelector('h3', { timeout: 3000 }).catch(() => {});
    await expectVisualMatch(page, {
      baseline: 'prd24-daily-tasks.png',
      viewport: { width: 1440, height: 900 },
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });
  });

  test('/evolution fullPage matches prd24-evolution.png', async ({ page }) => {
    await page.goto(`${API_BASE}/auth/dev-login`);
    await page.waitForURL(`${BASE_URL}/**`);
    await page.goto(`${BASE_URL}/evolution`);
    await page.waitForLoadState('networkidle');
    await page.locator('h1').waitFor({ state: 'visible' });
    await page.waitForSelector('h3', { timeout: 3000 }).catch(() => {});
    await expectVisualMatch(page, {
      baseline: 'prd24-evolution.png',
      viewport: { width: 1440, height: 900 },
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });
  });

  test('/voice-chat fullPage matches prd24-voice-chat.png', async ({ page }) => {
    await page.goto(`${API_BASE}/auth/dev-login`);
    await page.waitForURL(`${BASE_URL}/**`);
    await page.goto(`${BASE_URL}/voice-chat`);
    await page.waitForLoadState('networkidle');
    await page.locator('h1').waitFor({ state: 'visible' });
    await expectVisualMatch(page, {
      baseline: 'prd24-voice-chat.png',
      viewport: { width: 1440, height: 900 },
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });
  });
});
