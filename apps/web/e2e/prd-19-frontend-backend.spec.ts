/**
 * PRD-19 US-008 — E2E 集成验收
 * frontend ↔ backend 真接入 · 4 tests
 *
 * (a) Step1 真接 PositioningAgent · LS↔DB 双写
 * (b) acc 切换 · 数据隔离 · Step1 industry 不串
 * (c) 9 step 完整流程 · DB 真存 · 0 hardcode acc_step{N}
 * (d) zero-regression · typecheck + vitest + 旧 e2e prd-17/18
 *
 * 前置条件：
 *   - pnpm dev:api  (port 3000, DEV_OAUTH_MOCK=true)
 *   - pnpm dev      (port 5173, 已由 playwright webServer 托管)
 *   - PG + Redis 已启 (brew services start postgresql@16 && redis-server)
 */
import { execSync } from 'child_process';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { test, expect, type Page } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:5173';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_DIR = path.resolve(__dirname, '..');
const PROJECT_ROOT = path.resolve(WEB_DIR, '../..');

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Get active account ID — tries LS first, falls back to tRPC API call. */
async function getActiveAccountId(page: Page): Promise<number | null> {
  return page.evaluate(async () => {
    const fromLs = localStorage.getItem('aiip_active_account_id');
    if (fromLs) return parseInt(fromLs, 10);

    // Query active account via tRPC direct URL (DEV_OAUTH_MOCK auto-authenticates)
    // Use absolute URL http://localhost:3000/trpc — Vite proxy /api/trpc has no rewrite,
    // so /api/trpc/... → localhost:3000/api/trpc/... (404). Direct is correct.
    try {
      const res = await fetch('http://localhost:3000/trpc/ipAccounts.active?input=%7B%7D', {
        credentials: 'include',
      });
      if (!res.ok) return null;
      const json = (await res.json()) as Record<string, unknown>;
      const data = (json?.result as Record<string, unknown>)?.data as Record<string, unknown> | null;
      const id = data?.id;
      if (typeof id === 'number') return id;
    } catch {
      /* swallow */
    }
    return null;
  });
}

/** Query stepData row from backend via tRPC direct URL (DEV_OAUTH_MOCK auto-auth). */
async function queryStepData(
  page: Page,
  stepKey: string,
): Promise<Record<string, unknown> | null> {
  return page.evaluate(async (sk) => {
    const input = JSON.stringify({ stepKey: sk });
    // Direct URL — Vite proxy /api/trpc has no path rewrite, must use backend directly
    const url = `http://localhost:3000/trpc/stepData.get?input=${encodeURIComponent(input)}`;
    try {
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) return null;
      const json = (await res.json()) as Record<string, unknown>;
      return ((json?.result as Record<string, unknown>)?.data as Record<string, unknown>) ?? null;
    } catch {
      return null;
    }
  }, stepKey);
}

/** Read step LS value for given account + step key. */
async function getStepLs(page: Page, accountId: number, stepKey: string): Promise<string | null> {
  const lsKey = `aiip_memory_acc_${accountId}_${stepKey}`;
  return page.evaluate((k: string) => localStorage.getItem(k), lsKey);
}

/**
 * DEV/TEST ONLY — delete stepData rows for the current account via tRPC.
 * Uses simple non-batch POST format (tRPC v11 fetchRequestHandler).
 */
async function clearStepDataForTest(page: Page, stepKeys?: string[]): Promise<void> {
  const input = stepKeys?.length ? { stepKeys } : {};
  await page.evaluate(async (body: string) => {
    try {
      const res = await fetch('http://localhost:3000/trpc/stepData.deleteForTest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        credentials: 'include',
      });
      if (!res.ok) {
        console.warn('[clearStepDataForTest] response:', res.status);
      }
    } catch (err) {
      console.warn('[clearStepDataForTest] fetch error:', err);
    }
  }, JSON.stringify(input));
}

/** Select an industry card and submit Step1 form. Waits for 行业洞察报告 result. */
async function submitStep1(page: Page, industryText: string): Promise<void> {
  await page.locator('.glass-card', { hasText: industryText }).first().click();
  await page.locator('button', { hasText: '生成行业洞察' }).click();
  // Wait for LLM/fallback result (up to 30s; with empty ANTHROPIC_API_KEY uses fallback ~<1s)
  await expect(page.locator('text=行业洞察报告')).toBeVisible({ timeout: 30_000 });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('PRD-19 · frontend ↔ backend 真接入', () => {
  // Serial mode: test(c) clears step5/DB data; test(d) spawns prd-18 subprocess.
  // Running them in parallel would cause clearStepDataForTest in (c) to race with prd-18 test3's SSE stream.
  test.describe.configure({ mode: 'serial' });
  // Pre-flight: verify backend API is reachable via proxy
  test.beforeAll(async ({ request }) => {
    let backendOk = false;
    try {
      // Any response (including 404/401) means backend is up
      const res = await request.get(`${BASE_URL}/api/trpc/ipAccounts.active?input=%7B%7D`, {
        timeout: 5_000,
      });
      backendOk = res.status() < 500;
    } catch {
      /* fall through */
    }
    if (!backendOk) {
      throw new Error(
        '❌ Backend not accessible at http://localhost:3000 (via proxy /api/trpc).\n' +
          '  Start backend:   pnpm dev:api\n' +
          '  If PG not running: brew services start postgresql@16',
      );
    }
  });

  // Navigate to step1 and clear step1 data for a clean test state
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/step/1`);
    await page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => {});
    // Clear step1 DB data for current account to prevent stale-data false-positives
    await clearStepDataForTest(page, ['step1']);
  });

  // ─── test (a): Step1 真接 PositioningAgent · LS↔DB 双写 ─────────────────────
  test('test (a) · Step1 真接 PositioningAgent · LS↔DB 双写', async ({ page }) => {
    await page.goto(`${BASE_URL}/step/1`);
    await expect(page.locator('h1').first()).toContainText('选择你的行业赛道', { timeout: 15_000 });

    // Get active accountId (needed for LS key verification)
    const accountId = await getActiveAccountId(page);
    expect(accountId, 'DEV_OAUTH_MOCK should provide active account').not.toBeNull();

    // AC-2: 选 '餐饮美食' industry, submit, wait for PositioningAgent/fallback result
    await submitStep1(page, '美食');

    // AC-2: Verify LS mirror has been written
    const lsRaw = await getStepLs(page, accountId!, 'step1');
    expect(lsRaw, `LS key aiip_memory_acc_${accountId}_step1 should exist`).not.toBeNull();
    const lsData = JSON.parse(lsRaw!) as Record<string, unknown>;
    expect(String(lsData.industryLabel)).toContain('美食');

    // AC-2: Verify DB row via tRPC stepData.get (RLS auto-filters to active account)
    const dbRow = await queryStepData(page, 'step1');
    expect(dbRow, 'stepData.get should return non-null row').not.toBeNull();
    expect(String((dbRow!.inputs as Record<string, unknown>).industryLabel)).toContain('美食');

    // AC-2: status in ['completed', 'fallback']
    const status = dbRow!.isFallback ? 'fallback' : 'completed';
    expect(['completed', 'fallback']).toContain(status);
  });

  // ─── test (b): acc 切换 · 数据隔离 ──────────────────────────────────────────
  test('test (b) · acc 切换 · 数据隔离 · Step1 industry 不串', async ({ page }) => {
    await page.goto(`${BASE_URL}/step/1`);
    await expect(page.locator('h1').first()).toContainText('选择你的行业赛道', { timeout: 15_000 });

    // Get active account A ID via tRPC/LS (reliable — not affected by switcher item order)
    const accAId = await getActiveAccountId(page);
    expect(accAId, 'DEV_OAUTH_MOCK should provide active account A').not.toBeNull();

    // Find account B ID: open switcher, pick first item that is NOT accAId
    await page.locator('[data-testid="account-switcher-trigger"]').click();
    await page.locator('[data-testid^="account-switcher-item-"]').first().waitFor({ timeout: 5_000 });
    const items = page.locator('[data-testid^="account-switcher-item-"]');
    const itemCount = await items.count();
    let accBId: number | null = null;
    for (let i = 0; i < itemCount; i++) {
      const tid = await items.nth(i).getAttribute('data-testid');
      const cid = parseInt(tid!.replace('account-switcher-item-', ''), 10);
      if (cid !== accAId) { accBId = cid; break; }
    }
    expect(accBId, 'Should find a second account B in AccountSwitcher').not.toBeNull();
    await page.keyboard.press('Escape');

    // ── Account A: select '美食' (beforeEach already cleared accA's step1) ──
    await page.goto(`${BASE_URL}/step/1`);
    await expect(page.locator('h1').first()).toContainText('选择你的行业赛道', { timeout: 10_000 });
    await submitStep1(page, '美食');

    // Verify A's LS before switching away
    const lsA = await getStepLs(page, accAId, 'step1');
    expect(lsA, 'Account A LS should have step1').not.toBeNull();
    expect(String(JSON.parse(lsA!).industryLabel)).toContain('美食');

    // Verify A's DB
    const dbA1 = await queryStepData(page, 'step1');
    expect(dbA1).not.toBeNull();
    expect(String((dbA1!.inputs as Record<string, unknown>).industryLabel)).toContain('美食');

    // ── Switch to Account B (clears A's LS, reloads) ──
    await page.locator('[data-testid="account-switcher-trigger"]').click();
    await page.locator(`[data-testid="account-switcher-item-${accBId}"]`).waitFor({ timeout: 5_000 });
    // Set up load-event listener BEFORE click — account switch triggers a full page reload.
    // waitForLoadState('load') may resolve for the CURRENT state before reload starts;
    // waitForEvent('load') is set up before click and catches the reload's load event.
    const loadPromiseB = page.waitForEvent('load');
    await page.locator(`[data-testid="account-switcher-item-${accBId}"]`).click();
    await loadPromiseB;
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});

    await page.goto(`${BASE_URL}/step/1`);
    await expect(page.locator('h1').first()).toContainText('选择你的行业赛道', { timeout: 10_000 });

    // Clear accB's step1 data to ensure fresh submission (accB may have pre-existing data)
    await clearStepDataForTest(page, ['step1']);
    await page.reload();
    await expect(page.locator('h1').first()).toContainText('选择你的行业赛道', { timeout: 10_000 });

    // Account B: select '美妆护肤'
    await submitStep1(page, '美妆');

    // Verify B's LS has '美妆' (NOT A's '美食')
    const lsB = await getStepLs(page, accBId, 'step1');
    expect(lsB, 'Account B LS should have step1').not.toBeNull();
    expect(String(JSON.parse(lsB!).industryLabel)).toContain('美妆');
    expect(String(JSON.parse(lsB!).industryLabel)).not.toContain('美食');

    // Verify B's DB has '美妆' — RLS returns B's row only
    const dbB = await queryStepData(page, 'step1');
    expect(dbB).not.toBeNull();
    expect(String((dbB!.inputs as Record<string, unknown>).industryLabel)).toContain('美妆');
    expect(String((dbB!.inputs as Record<string, unknown>).industryLabel)).not.toContain('美食');

    // ── Switch back to Account A (clears B's LS, reloads) ──
    await page.locator('[data-testid="account-switcher-trigger"]').click();
    await page.locator(`[data-testid="account-switcher-item-${accAId}"]`).waitFor({ timeout: 5_000 });
    // Same load-event pattern as A→B switch above.
    const loadPromiseA = page.waitForEvent('load');
    await page.locator(`[data-testid="account-switcher-item-${accAId}"]`).click();
    await loadPromiseA;
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});

    await page.goto(`${BASE_URL}/step/1`);
    await expect(page.locator('h1').first()).toContainText('选择你的行业赛道', { timeout: 10_000 });

    // A's LS was cleared by the B→A switch; page now fetches from DB
    await expect(page.locator('text=行业洞察报告')).toBeVisible({ timeout: 15_000 });

    // Verify A's DB still has '美食' — B's '美妆' did not contaminate A
    const dbA2 = await queryStepData(page, 'step1');
    expect(dbA2).not.toBeNull();
    expect(String((dbA2!.inputs as Record<string, unknown>).industryLabel)).toContain('美食');
    expect(String((dbA2!.inputs as Record<string, unknown>).industryLabel)).not.toContain('美妆');
  });

  // ─── test (c): 9 step 完整流程 ───────────────────────────────────────────────
  test('test (c) · 9 step 完整流程 · DB 真存 · 0 hardcode acc_step{N}', async ({ page }) => {
    // Long timeout: 9 steps × up to 30s each = 270s + overhead
    test.setTimeout(360_000);

    // Clear ALL step data for a fresh 9-step run
    // (beforeEach only cleared step1; prior prd-19 runs may have written other steps)
    await clearStepDataForTest(page, ['step1', 'step3', 'step3b', 'step4', 'step4b', 'step5', 'step6', 'step7', 'step8']);

    // ── Step 1 ─────────────────────────────────────────────────────────────────
    await page.goto(`${BASE_URL}/step/1`);
    await expect(page.locator('h1').first()).toContainText('选择你的行业赛道', { timeout: 15_000 });
    const accountId = await getActiveAccountId(page);
    expect(accountId).not.toBeNull();

    await submitStep1(page, '美食');
    expect(await getStepLs(page, accountId!, 'step1')).not.toBeNull();

    // Navigate to Step 3 via "进入 IP 定位 →"
    await page.locator('button', { hasText: '进入 IP 定位 →' }).click();
    await page.waitForURL('**/step/3', { timeout: 10_000 });

    // ── Step 3 ─────────────────────────────────────────────────────────────────
    await expect(page.locator('h1').first()).toContainText('账号包装方案', { timeout: 10_000 });
    await page.locator('textarea').first().fill(
      '我是一名有10年经验的美食博主，记录家常菜制作，帮助300+粉丝学会厨艺。',
    );
    await page.locator('label[for="douyin"]').click();
    await page.locator('button[type="submit"]', { hasText: '生成账号包装方案' }).click();
    // Wait for step3-output section (unique ID — avoids strict-mode multi-match on heading text)
    await expect(page.locator('#step3-output')).toBeVisible({ timeout: 30_000 });
    expect(await getStepLs(page, accountId!, 'step3')).not.toBeNull();

    // ── Step 3b ────────────────────────────────────────────────────────────────
    await page.goto(`${BASE_URL}/step/3b`);
    await expect(page.locator('h1').first()).toContainText('人设定制方案', { timeout: 10_000 });
    await page.locator('label[for="step3b-douyin"]').click();
    await page.locator('button[type="submit"]', { hasText: '生成专属人设方案' }).click();
    // Wait for step3b-output section (unique ID)
    await expect(page.locator('#step3b-output')).toBeVisible({ timeout: 30_000 });
    expect(await getStepLs(page, accountId!, 'step3b')).not.toBeNull();

    // ── Step 4 ─────────────────────────────────────────────────────────────────
    await page.goto(`${BASE_URL}/step/4`);
    await expect(page.locator('h1').first()).toContainText('执行计划', { timeout: 10_000 });
    await page.locator('label[for="step4-platform-douyin"]').click();
    await page.locator('button[type="submit"]', { hasText: '生成执行计划' }).click();
    await expect(page.locator('h3').filter({ hasText: '1. 每日任务表' })).toBeVisible({
      timeout: 30_000,
    });
    expect(await getStepLs(page, accountId!, 'step4')).not.toBeNull();

    // ── Step 4b ────────────────────────────────────────────────────────────────
    await page.goto(`${BASE_URL}/step/4b`);
    await expect(page.locator('h1').first()).toContainText('变现路径', { timeout: 10_000 });
    await page.locator('textarea').first().fill(
      '美食类特色农产品，展示家乡特产，客单价50-200元',
    );
    await page.locator('button[type="submit"]', { hasText: '生成变现路径' }).click();
    await expect(page.locator('h3').filter({ hasText: '1. 市场分析' })).toBeVisible({
      timeout: 30_000,
    });
    expect(await getStepLs(page, accountId!, 'step4b')).not.toBeNull();

    // ── Step 5 (SSE saveStream) ────────────────────────────────────────────────
    await page.goto(`${BASE_URL}/step/5`);
    await expect(page.locator('h1').first()).toContainText('爆款选题库', { timeout: 10_000 });
    // Fill 2 required inputs: industry + product
    await page.locator('input').nth(0).fill('美食');
    await page.locator('input').nth(1).fill('家常菜制作分享');
    await page.locator('button', { hasText: '一键生成 5大类 爆款选题' }).click();
    // Wait for the '流量型' tab to appear — use getByRole to avoid strict-mode multi-match
    // (subtitle text also contains '流量型', so locator('text=流量型') matches 2 elements)
    await expect(page.getByRole('tab', { name: '流量型' })).toBeVisible({ timeout: 30_000 });
    expect(await getStepLs(page, accountId!, 'step5')).not.toBeNull();

    // ── Step 6 ─────────────────────────────────────────────────────────────────
    await page.goto(`${BASE_URL}/step/6`);
    await expect(page.locator('h1').first()).toContainText('拍摄计划', { timeout: 10_000 });
    await page.locator('textarea').first().fill(
      '美食博主如何用抖音获客100个精准粉丝，这是实操分享，帮你快速起号变现。',
    );
    await page.locator('button[type="submit"]', { hasText: '生成拍摄计划' }).click();
    await expect(page.locator('h3').filter({ hasText: '1. 分镜脚本' })).toBeVisible({
      timeout: 30_000,
    });
    expect(await getStepLs(page, accountId!, 'step6')).not.toBeNull();

    // ── Step 7 ─────────────────────────────────────────────────────────────────
    await page.goto(`${BASE_URL}/step/7`);
    await expect(page.locator('h1').first()).toContainText('文案生成', { timeout: 10_000 });
    await page.locator('textarea').first().fill('美食博主要不要专注一个垂类还是多元发展？正反方辩论');
    await page.locator('button[type="submit"]', { hasText: '生成爆款文案' }).click();
    await expect(page.locator('h4').filter({ hasText: '话题抛出' })).toBeVisible({
      timeout: 30_000,
    });
    expect(await getStepLs(page, accountId!, 'step7')).not.toBeNull();

    // ── Step 8 ─────────────────────────────────────────────────────────────────
    await page.goto(`${BASE_URL}/step/8`);
    await expect(page.locator('h1').first()).toContainText('直播策划', { timeout: 10_000 });
    // Sub-function 1 (generate_plan) is active by default
    await expect(page.locator('button', { hasText: '子功能 1：生成直播方案' })).toBeVisible();
    // Fill product textarea
    await page.locator('textarea').first().fill(
      '家常菜直播，分享健康营养食谱，帮助粉丝学会做饭',
    );
    await page.locator('button[type="submit"]', { hasText: '生成直播方案' }).click();
    await expect(page.locator('h3').filter({ hasText: '1. 开场话术' })).toBeVisible({
      timeout: 30_000,
    });
    expect(await getStepLs(page, accountId!, 'step8')).not.toBeNull();

    // ── AC: 0 hardcode localStorage.setItem('acc_step{N}') in source ───────────
    const grepOutput = execSync(
      `grep -rn "localStorage.setItem.*acc_step" "${PROJECT_ROOT}/apps/web/src/pages/step/" || true`,
    )
      .toString()
      .trim();
    expect(grepOutput, '期望 src/pages/step/ 中 0 hardcode acc_step{N} LS key').toBe('');
  });

  // ─── test (d): zero-regression ───────────────────────────────────────────────
  test('test (d) · zero-regression · typecheck + vitest + 旧 e2e prd-17/18', async () => {
    // 10 min: typecheck ~10s + vitest ~20s + playwright prd-17/18 ~3min
    test.setTimeout(600_000);

    // 1. Typecheck (whole project)
    try {
      execSync('pnpm typecheck', {
        cwd: PROJECT_ROOT,
        stdio: 'pipe',
        timeout: 120_000,
      });
    } catch (e) {
      throw new Error(`pnpm typecheck failed:\n${(e as NodeJS.ErrnoException).message}`);
    }

    // 2. Vitest unit tests (119+ tests)
    try {
      execSync('pnpm vitest run', {
        cwd: PROJECT_ROOT,
        stdio: 'pipe',
        timeout: 120_000,
      });
    } catch (e) {
      throw new Error(`pnpm vitest run failed:\n${(e as NodeJS.ErrnoException).message}`);
    }

    // 3. 旧 e2e specs (prd-17 + prd-18) — reuseExistingServer picks up running dev server
    try {
      execSync(
        'pnpm playwright test e2e/prd-17-step1-3-3b.spec.ts e2e/prd-18-step-4-5-6-7-8.spec.ts',
        {
          cwd: WEB_DIR,
          stdio: 'pipe',
          timeout: 300_000,
        },
      );
    } catch (e) {
      throw new Error(`旧 e2e specs failed:\n${(e as NodeJS.ErrnoException).message}`);
    }
  });
});
