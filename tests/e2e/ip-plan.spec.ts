/**
 * E2E test — US-006 AC-2
 * /ip-plan 显示 0/9 进度 · 切账号后自动 refetch
 */
import { test, expect } from '@playwright/test';

const API_BASE = process.env.VITE_API_BASE_URL ?? 'http://localhost:3000';
const WEB_BASE = process.env.E2E_BASE_URL ?? 'http://localhost:5173';

type TrpcResult = { result: { data: unknown } };

async function trpcMutate(
  page: import('@playwright/test').Page,
  procedure: string,
  input: unknown,
): Promise<unknown> {
  return page.evaluate(
    async ({ base, proc, inp }: { base: string; proc: string; inp: unknown }) => {
      const res = await fetch(`${base}/trpc/${proc}?batch=1`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ '0': inp }),
        credentials: 'include',
      });
      const data = (await res.json()) as TrpcResult[];
      return data[0]?.result?.data;
    },
    { base: API_BASE, proc: procedure, inp: input },
  );
}

test.describe('/ip-plan 进度可视化', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(`${API_BASE}/auth/login`);
    await page.waitForURL(`${WEB_BASE}/**`);
    await page.waitForSelector('[data-testid="app-header"]');
  });

  test('/ip-plan 显示 0/9 进度条', async ({ page }) => {
    await page.goto(`${WEB_BASE}/ip-plan`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('ip-plan-page')).toBeVisible();
    // StepProgress shows "0/9" when no steps completed
    await expect(page.getByText(/0\/9/)).toBeVisible();
    // All 9 step items present
    const stepItems = page.locator('[data-testid^="step-step"]');
    await expect(stepItems).toHaveCount(9);
  });

  test('切换账号后 /ip-plan 重新 fetch 进度', async ({ page }) => {
    // Create a second account for the switch
    const acc = (await trpcMutate(page, 'ipAccounts.create', {
      name: `e2e-ipplan-${Date.now()}`,
      industry: '科技',
      platform: '抖音',
      stage: '初创',
    })) as { id: number };

    await page.goto(`${WEB_BASE}/ip-plan`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('ip-plan-page')).toBeVisible();

    // Switch to new account via header
    await page.getByTestId('header-account-trigger').click();
    const menu = page.getByTestId('header-account-menu');
    await expect(menu).toBeVisible();

    // Click the new account — triggers reload
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
      menu.getByTestId(`account-item-${acc.id}`).click(),
    ]);

    // After reload, /ip-plan should still show 0/9 for the new account
    await page.goto(`${WEB_BASE}/ip-plan`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/0\/9/)).toBeVisible();
  });

  test('/ip-plan shows feedback button', async ({ page }) => {
    await page.goto(`${WEB_BASE}/ip-plan`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('feedback-buttons')).toBeVisible();
  });
});
