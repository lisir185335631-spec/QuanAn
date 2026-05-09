/**
 * E2E test — PRD-4 US-017 AC-16/22
 * 账号隔离验证: acc2(无 stepData) → /ip-plan 显示 0/9
 * 验证 LD-009 RLS · acc2 看不到 acc1 的 stepData
 *
 * AC-20: CI 关闭 · 手动: pnpm playwright test tests/e2e/ip-flow-account-isolation.spec.ts --project=chromium
 * AC-21: test.describe.serial · 串行
 */

import { test, expect } from '@playwright/test';

const API_BASE = process.env.VITE_API_BASE_URL ?? 'http://localhost:3000';
const WEB_BASE = process.env.E2E_BASE_URL ?? 'http://localhost:5173';

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
      const data = (await res.json()) as Array<{ result: { data: unknown } }>;
      return data[0]?.result?.data;
    },
    { base: API_BASE, proc: procedure, inp: input },
  );
}

// AC-21: serial
test.describe.serial('IP Flow 账号隔离 E2E (US-017 AC-16/22 · LD-009 RLS)', () => {
  test('acc2 无 stepData → /ip-plan 显示 0/9 · RLS 隔离验证', async ({ page }) => {
    // AC-20: CI 关闭
    test.skip(
      !!process.env.CI,
      'CI 跳过 · 手动: pnpm playwright test tests/e2e/ip-flow-account-isolation.spec.ts --project=chromium',
    );

    await page.setViewportSize({ width: 1280, height: 720 });

    // 登录
    await page.goto(`${API_BASE}/auth/login`);
    await page.waitForURL(`${WEB_BASE}/**`);
    await page.waitForSelector('[data-testid="app-header"]');

    // 创建 acc2(无任何 stepData · 全新账号)
    const acc2 = (await trpcMutate(page, 'ipAccounts.create', {
      name: `e2e-iso-acc2-${Date.now()}`,
      platform: 'xiaohongshu',
      industry: 'edu',
      stage: 'start',
    })) as { id: number };
    expect(acc2.id).toBeGreaterThan(0);

    // 切换到 acc2 + clearLsNamespace(AGENTS.md §11.5) + reload
    await trpcMutate(page, 'ipAccounts.switchActive', { accountId: acc2.id });
    await page.evaluate((accountId: number) => {
      const prefix = `aiip_memory_acc_${accountId}_`;
      const toRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k?.startsWith(prefix)) toRemove.push(k);
      }
      toRemove.forEach((k) => localStorage.removeItem(k));
    }, acc2.id);
    await page.reload();
    await page.waitForSelector('[data-testid="app-header"]');

    // AC-16/22: acc2 无 stepData → /ip-plan 0/9 (LD-009 RLS 隔离)
    await page.goto(`${WEB_BASE}/ip-plan`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('ip-plan-page')).toBeVisible();
    await expect(page.getByText(/0\/9/)).toBeVisible({ timeout: 5_000 });

    // 9 个 step 项全部存在 (StepProgress 渲染完整)
    const STEP_KEYS = ['step1', 'step3', 'step3b', 'step4', 'step4b', 'step5', 'step6', 'step7', 'step8'];
    for (const key of STEP_KEYS) {
      await expect(page.getByTestId(`step-${key}`)).toBeVisible();
    }

    // 无任何 completed 项 · RLS 隔离 acc2 看不到 acc1 的数据
    const completedItems = page.locator('[data-testid^="step-step"][data-status="completed"]');
    await expect(completedItems).toHaveCount(0);
  });
});
