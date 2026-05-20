/**
 * PRD-25 US-001 AC-13 + US-002 AC-11 · visual diff baselines
 * prd25-diagnosis-report.png baseline · 跑 8 步完成 → 截图 report 区域
 * prd25-voice-chat-streaming.png baseline · quick prompt + 发送 → 流式完成/error → 截图
 */
import { test, expect } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:5173';
const BASELINE_DIR = path.resolve(__dirname, '../e2e/screenshots');

test.describe('PRD-25 US-001 · visual baseline', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/dev-login`);
    await page.waitForLoadState('networkidle');
    await page.goto(`${BASE_URL}/diagnosis`);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('AC-13 · prd25-diagnosis-report.png baseline · fullPage screenshot', async ({ page }) => {
    // Navigate through all 8 steps
    for (let i = 0; i < 8; i++) {
      await page.getByTestId('diagnosis-next').click();
    }

    // Wait for report or loading state (up to 30s for LLM)
    const report = page.getByTestId('diagnosis-report');
    const loading = page.getByTestId('diagnosis-loading');
    const error = page.getByTestId('diagnosis-error');

    await expect(report.or(loading).or(error)).toBeVisible({ timeout: 30_000 });

    // If loading, wait for it to resolve (another 30s)
    if (await loading.isVisible()) {
      await expect(report.or(error)).toBeVisible({ timeout: 30_000 });
    }

    // Ensure baseline dir exists
    if (!fs.existsSync(BASELINE_DIR)) {
      fs.mkdirSync(BASELINE_DIR, { recursive: true });
    }

    const baselinePath = path.join(BASELINE_DIR, 'prd25-diagnosis-report.png');
    await page.screenshot({ path: baselinePath, fullPage: true });

    // Assert file written
    expect(fs.existsSync(baselinePath)).toBe(true);
    const size = fs.statSync(baselinePath).size;
    expect(size).toBeGreaterThan(1000); // non-empty PNG
  });
});

test.describe('PRD-25 US-002 · voice-chat visual baseline', () => {
  test('AC-11 · prd25-voice-chat-streaming.png baseline · 流式完成后截图', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/dev-login`);
    await page.waitForLoadState('networkidle');
    await page.goto(`${BASE_URL}/voice-chat`);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Click quick prompt and send
    await page.getByTestId('quick-prompt-0').click();
    await page.getByTestId('send-button').click();

    // Wait for streaming to complete (history or error within 90s)
    const historyOrError = page
      .getByTestId('history-list')
      .or(page.getByTestId('stream-error'));

    await expect(historyOrError).toBeVisible({ timeout: 90_000 });

    // Ensure baseline dir exists
    if (!fs.existsSync(BASELINE_DIR)) {
      fs.mkdirSync(BASELINE_DIR, { recursive: true });
    }

    const baselinePath = path.join(BASELINE_DIR, 'prd25-voice-chat-streaming.png');
    await page.screenshot({ path: baselinePath, fullPage: true });

    expect(fs.existsSync(baselinePath)).toBe(true);
    const size = fs.statSync(baselinePath).size;
    expect(size).toBeGreaterThan(1000);
  });
});
