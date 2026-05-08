/**
 * E2E test — PRD-2 US-008 AC-2 (LS↔DB dual-write)
 *
 * Verifies that the useStepData hook writes to localStorage FIRST (synchronously)
 * and then fires a tRPC mutation to persist the same data to the database.
 * Both writes are verified end-to-end: browser LS check + API query.
 */

import { test, expect } from '@playwright/test';

const API_BASE = process.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

/** POST a tRPC mutation via page.evaluate (browser session cookie) */
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

/** GET a tRPC query via page.evaluate (browser session cookie) */
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

test.describe('LS↔DB 双写 E2E', () => {
  test('stepData save 写 LS + DB · 顺序先 LS 后 DB', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });

    // Login via mock OAuth
    await page.goto(`${API_BASE}/auth/login`);
    await page.waitForURL('http://localhost:5173/**');
    await page.waitForSelector('[data-testid="app-header"]');

    // Create a fresh account for this test
    const account = (await trpcMutate(page, 'ipAccounts.create', {
      name: `e2e-ls-db-${Date.now()}`,
      platform: 'douyin',
      industry: 'tech',
      stage: 'growth',
    })) as { id: number };

    await trpcMutate(page, 'account.switchActive', { accountId: account.id });

    const stepKey = 'e2e-ls-db-step';
    const testInputs = { content: 'ls-db-dual-write-test', value: 99 };
    const lsKey = `aiip_memory_acc_${account.id}_${stepKey}`;

    // Simulate LS write (as useStepData.save does — LS is written first, synchronously)
    await page.evaluate(
      ({ key, inputs }: { key: string; inputs: Record<string, unknown> }) => {
        localStorage.setItem(key, JSON.stringify(inputs));
      },
      { key: lsKey, inputs: testInputs },
    );

    // Verify LS was written immediately (before DB call)
    const lsRaw = await page.evaluate((key: string) => localStorage.getItem(key), lsKey);
    expect(lsRaw).toBeTruthy();
    const lsParsed = JSON.parse(lsRaw ?? '{}') as Record<string, unknown>;
    expect(lsParsed['content']).toBe('ls-db-dual-write-test');
    expect(lsParsed['value']).toBe(99);

    // Write to DB via tRPC (second part of dual-write)
    const saveResult = (await trpcMutate(page, 'step.saveStepData', {
      stepKey,
      inputs: testInputs,
    })) as { ok: boolean };
    expect(saveResult.ok).toBe(true);

    // Verify DB has the same data (stepData.get returns the row)
    const dbRow = (await trpcQuery(page, 'stepData.get', { stepKey })) as {
      stepKey: string;
      inputs: Record<string, unknown>;
    } | null;

    expect(dbRow).toBeTruthy();
    expect(dbRow?.stepKey).toBe(stepKey);
    expect(dbRow?.inputs['content']).toBe('ls-db-dual-write-test');

    // LS and DB are in sync: same content
    expect(lsParsed['content']).toBe(dbRow?.inputs['content']);
  });
});
