/**
 * E2E test — PRD-2 US-008 AC-2 (multi-account RLS isolation)
 *
 * Verifies that step data written under account A is NOT visible when
 * the user switches to account B. Tests the RLS account-isolation middleware
 * end-to-end: browser → tRPC → Hono → Prisma → PostgreSQL RLS.
 */

import { test, expect } from '@playwright/test';

const API_BASE = process.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

/** POST a tRPC mutation via page.evaluate (uses browser session cookie) */
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
        body: JSON.stringify({ '0': { json: inp } }),
        credentials: 'include',
      });
      const data = (await res.json()) as Array<{ result: { data: unknown } }>;
      return data[0]?.result?.data;
    },
    { base: API_BASE, proc: procedure, inp: input },
  );
}

/** GET a tRPC query via page.evaluate (uses browser session cookie) */
async function trpcQuery(
  page: import('@playwright/test').Page,
  procedure: string,
  input: unknown = null,
): Promise<unknown> {
  return page.evaluate(
    async ({ base, proc, inp }: { base: string; proc: string; inp: unknown }) => {
      const encoded = encodeURIComponent(JSON.stringify({ '0': { json: inp } }));
      const res = await fetch(`${base}/trpc/${proc}?batch=1&input=${encoded}`, {
        credentials: 'include',
      });
      const data = (await res.json()) as Array<{ result: { data: unknown } }>;
      return data[0]?.result?.data;
    },
    { base: API_BASE, proc: procedure, inp: input },
  );
}

test.describe('多账号 RLS 隔离 E2E', () => {
  test('account A 的 stepData 在 switch 到 account B 后不可见', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });

    // Login via mock OAuth
    await page.goto(`${API_BASE}/auth/login`);
    await page.waitForURL('http://localhost:5173/**');
    await page.waitForSelector('[data-testid="app-header"]');

    // Create two accounts
    const accountA = (await trpcMutate(page, 'ipAccounts.create', {
      name: `e2e-iso-A-${Date.now()}`,
      platform: 'douyin',
      industry: 'beauty',
      stage: 'growth',
    })) as { id: number };

    const accountB = (await trpcMutate(page, 'ipAccounts.create', {
      name: `e2e-iso-B-${Date.now()}`,
      platform: 'xiaohongshu',
      industry: 'food',
      stage: 'start',
    })) as { id: number };

    expect(accountA.id).toBeGreaterThan(0);
    expect(accountB.id).toBeGreaterThan(0);

    // Switch to account A and save step data
    await trpcMutate(page, 'account.switchActive', { accountId: accountA.id });
    const saveResult = (await trpcMutate(page, 'step.saveStepData', {
      stepKey: 'e2e-iso',
      inputs: { owner: 'account-A', secret: 42 },
    })) as { ok: boolean };
    expect(saveResult.ok).toBe(true);

    // Verify step data is visible under account A
    const dataA = (await trpcQuery(page, 'stepData.getAll')) as Array<unknown>;
    expect(dataA.length).toBeGreaterThan(0);

    // Switch to account B — account B has NO step data
    await trpcMutate(page, 'account.switchActive', { accountId: accountB.id });

    // RLS isolation: account B must see zero rows
    const dataB = (await trpcQuery(page, 'stepData.getAll')) as Array<unknown>;
    expect(dataB.length).toBe(0);

    // Switch back to A — data must still be there (not deleted)
    await trpcMutate(page, 'account.switchActive', { accountId: accountA.id });
    const dataAAgain = (await trpcQuery(page, 'stepData.getAll')) as Array<unknown>;
    expect(dataAAgain.length).toBeGreaterThan(0);
  });
});
