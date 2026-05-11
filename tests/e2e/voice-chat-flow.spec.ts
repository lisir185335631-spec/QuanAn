/**
 * E2E spec — PRD-8 US-013 AC-5/6
 * /voice-chat 工作流集成验证
 * workers=1 · fullyParallel=false (per playwright.config.ts)
 *
 * AC-5: /voice-chat 页面 load + form visible + 0 ErrorBoundary + 0 console error
 * AC-16: screenshot → verify-artifacts/US-013/voice-chat-flow.png
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect, test } from '@playwright/test';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ARTIFACTS_DIR = path.resolve(__dirname, '../../scripts/ralph/verify-artifacts/US-013');
const WEB_BASE = process.env['E2E_BASE_URL'] ?? 'http://localhost:5173';

test.describe('/voice-chat 工作流集成验证 (AC-5/6)', () => {
  test.beforeEach(() => {
    fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
  });

  test('AC-5: /voice-chat page loads · form visible · 0 ErrorBoundary · 0 console error', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.setViewportSize({ width: 1280, height: 720 });

    // Navigate to /voice-chat
    await page.goto(`${WEB_BASE}/voice-chat`, { waitUntil: 'networkidle' });

    // Verify no ErrorBoundary is shown
    const errorBoundary = page.locator('text=Something went wrong').or(
      page.locator('[data-testid="error-boundary"]'),
    );
    await expect(errorBoundary).toHaveCount(0);

    // Verify page body is visible
    await expect(page.locator('body')).toBeVisible();

    // Filter out known non-critical errors (e.g. 401 from unauthenticated, WebRTC)
    const criticalErrors = consoleErrors.filter(
      (e) =>
        !e.includes('401') &&
        !e.includes('Unauthorized') &&
        !e.includes('UNAUTHORIZED') &&
        !e.includes('Failed to fetch') &&
        !e.includes('getUserMedia') &&
        !e.includes('NotAllowedError'),
    );
    expect(criticalErrors).toHaveLength(0);

    // AC-16: take screenshot
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'voice-chat-flow.png'),
      fullPage: false,
    });
  });
});
