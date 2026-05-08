/**
 * E2E test — PRD-4 US-014 AC-19
 * /step/1 点击 thumbs-up → costLog.logFeedback mutation 发出 (request interception)
 * DB write verified via request payload containing stepKey + agentId
 */
import { test, expect } from '@playwright/test';

const API_BASE = process.env.VITE_API_BASE_URL ?? 'http://localhost:3000';
const WEB_BASE = process.env.E2E_BASE_URL ?? 'http://localhost:5173';

test.describe('FeedbackLog e2e (US-014)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(`${API_BASE}/auth/login`);
    await page.waitForURL(`${WEB_BASE}/**`);
    await page.waitForSelector('[data-testid="app-header"]');
  });

  test('AC-19: /step/1 点击 thumbs-up → mutation 请求含 stepKey=step1 + agentId=PositioningAgent', async ({
    page,
  }) => {
    const payloads: unknown[] = [];

    page.on('request', (req) => {
      if (req.url().includes('/trpc/costLog.logFeedback') && req.method() === 'POST') {
        try {
          payloads.push(JSON.parse(req.postData() ?? '{}'));
        } catch {
          payloads.push(req.postData());
        }
      }
    });

    await page.goto(`${WEB_BASE}/step/1`);
    await page.waitForLoadState('networkidle');

    const feedbackGood = page.getByTestId('feedback-good');
    await expect(feedbackGood).toBeVisible();
    await feedbackGood.click();

    await page.waitForTimeout(500);

    expect(payloads.length).toBeGreaterThan(0);
    const body = payloads[0] as Record<string, unknown>;
    const json = (body['json'] ?? body) as Record<string, unknown>;
    expect(json['stepKey']).toBe('step1');
    expect(json['agentId']).toBe('PositioningAgent');
    expect(json['type']).toBe('good');
  });
});
