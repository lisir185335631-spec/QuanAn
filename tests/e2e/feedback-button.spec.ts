/**
 * E2E test — US-006 AC-3
 * 点击反馈按钮 → tRPC costLog.logFeedback mutation called with stepKey
 * Uses request interception (spy) to verify the mutation fires — avoids DB dependency.
 */
import { test, expect } from '@playwright/test';

const API_BASE = process.env.VITE_API_BASE_URL ?? 'http://localhost:3000';
const WEB_BASE = process.env.E2E_BASE_URL ?? 'http://localhost:5173';

test.describe('FeedbackButton e2e', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(`${API_BASE}/auth/login`);
    await page.waitForURL(`${WEB_BASE}/**`);
    await page.waitForSelector('[data-testid="app-header"]');
  });

  test('点击 thumbs-up → costLog.logFeedback mutation 请求发出', async ({ page }) => {
    // Intercept tRPC requests to verify the mutation fires
    const requests: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('/trpc/costLog.logFeedback')) {
        requests.push(req.url());
      }
    });

    await page.goto(`${WEB_BASE}/step/1`);
    await page.waitForLoadState('networkidle');

    const feedbackGood = page.getByTestId('feedback-good');
    await expect(feedbackGood).toBeVisible();
    await feedbackGood.click();

    // Wait for the tRPC mutation request to be fired
    await page.waitForTimeout(500);
    expect(requests.length).toBeGreaterThan(0);
    expect(requests[0]).toContain('costLog.logFeedback');
  });

  test('点击 thumbs-down → costLog.logFeedback mutation 请求发出', async ({ page }) => {
    const requests: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('/trpc/costLog.logFeedback')) {
        requests.push(req.url());
      }
    });

    await page.goto(`${WEB_BASE}/step/2`);
    await page.waitForLoadState('networkidle');

    const feedbackBad = page.getByTestId('feedback-bad');
    await expect(feedbackBad).toBeVisible();
    await feedbackBad.click();

    await page.waitForTimeout(500);
    expect(requests.length).toBeGreaterThan(0);
  });

  test('/ip-plan FeedbackButton fires with stepKey=ip-plan', async ({ page }) => {
    let capturedBody: string | null = null;
    page.on('request', (req) => {
      if (req.url().includes('/trpc/costLog.logFeedback')) {
        capturedBody = req.postData();
      }
    });

    await page.goto(`${WEB_BASE}/ip-plan`);
    await page.waitForLoadState('networkidle');

    await page.getByTestId('feedback-good').click();
    await page.waitForTimeout(500);

    expect(capturedBody).toBeTruthy();
    expect(capturedBody).toContain('ip-plan');
  });

  test('FeedbackButton visible on all 9 step pages', async ({ page }) => {
    for (const stepNum of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
      await page.goto(`${WEB_BASE}/step/${stepNum}`);
      await page.waitForLoadState('networkidle');
      await expect(page.getByTestId('feedback-buttons')).toBeVisible();
    }
  });
});
