/**
 * E2E test — US-004 AC-3/4/7
 * 切账号 → clearLsNamespace(old) + window.location.reload()
 * 切到同一账号 → 幂等，不 reload
 */
import { test, expect } from '@playwright/test';

const API_BASE = process.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

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

test.describe('IP 账号切换', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    // Login via mock OAuth (skips CSRF, returns dev@local.test session)
    await page.goto(`${API_BASE}/auth/login`);
    await page.waitForURL('http://localhost:5173/**');
    await page.waitForSelector('[data-testid="app-header"]');
  });

  test('切换到不同账号 → clearLsNamespace + reload (AC-3/7)', async ({ page }) => {
    // Create 2 test IP accounts
    const acc1 = (await trpcMutate(page, 'ipAccounts.create', {
      name: 'E2E测试账号A',
      industry: '科技',
      platform: '抖音',
      stage: '初创',
    })) as { id: number };

    const acc2 = (await trpcMutate(page, 'ipAccounts.create', {
      name: 'E2E测试账号B',
      industry: '生活',
      platform: '小红书',
      stage: '成长',
    })) as { id: number };

    // Switch server-side to acc1 so it's the active account
    await trpcMutate(page, 'ipAccounts.switchActive', { accountId: acc1.id });

    // Reload to get fresh tRPC queries reflecting new active account
    await page.reload();
    await page.waitForSelector('[data-testid="app-header"]');

    // Seed a LS key in acc1 namespace (simulates step/evolution data)
    await page.evaluate(
      (id: number) => localStorage.setItem(`aiip_memory_acc_${id}_testKey`, 'sentinel'),
      acc1.id,
    );
    const keyBefore = await page.evaluate(
      (id: number) => localStorage.getItem(`aiip_memory_acc_${id}_testKey`),
      acc1.id,
    );
    expect(keyBefore).toBe('sentinel');

    // Open account dropdown
    await page.getByTestId('header-account-trigger').click();
    const menu = page.getByTestId('header-account-menu');
    await expect(menu).toBeVisible();

    // Click acc2 item — triggers switchActive mutation → clearLsNamespace → reload
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
      menu.getByTestId(`account-item-${acc2.id}`).click(),
    ]);

    await page.waitForSelector('[data-testid="app-header"]');

    // AC-7: old account namespace must be cleared
    const keyAfter = await page.evaluate(
      (id: number) => localStorage.getItem(`aiip_memory_acc_${id}_testKey`),
      acc1.id,
    );
    expect(keyAfter).toBeNull();
  });
});
