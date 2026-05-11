/**
 * E2E spec — PRD-9 US-005 AC-6
 * knowledge RAG loop: seed → search → RAG 注入 PositioningAgent prompt
 * workers=1 · fullyParallel=false (per playwright.config.ts global)
 *
 * AC-1: knowledge.list 返回 ≥67 case items (seed 验证)
 * AC-2: /knowledge 页面搜索"护肤"返回结果 + 0 ErrorBoundary
 * AC-3: evolution.debugAssembleSystemPrompt → systemPrompt 含 [Section 6] + ≥1 案例标题
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect, test } from '@playwright/test';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ARTIFACTS_DIR = path.resolve(__dirname, '../../scripts/ralph/verify-artifacts/US-005');

const API_BASE = process.env['VITE_API_BASE_URL'] ?? 'http://localhost:3000';
const WEB_BASE = process.env['E2E_BASE_URL'] ?? 'http://localhost:5173';

// ── tRPC helpers ─────────────────────────────────────────────────────────────

async function trpcQuery(
  page: import('@playwright/test').Page,
  procedure: string,
  input: unknown = null,
): Promise<unknown> {
  return page.evaluate(
    async ({ base, proc, inp }: { base: string; proc: string; inp: unknown }) => {
      const encoded = encodeURIComponent(JSON.stringify({ '0': inp }));
      const res = await fetch(`${base}/trpc/${proc}?batch=1&input=${encoded}`, {
        credentials: 'include',
      });
      const data = (await res.json()) as Array<{ result?: { data: unknown }; error?: unknown }>;
      if (data[0]?.error) throw new Error(JSON.stringify(data[0].error));
      return data[0]?.result?.data;
    },
    { base: API_BASE, proc: procedure, inp: input },
  );
}

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
      const data = (await res.json()) as Array<{ result?: { data: unknown }; error?: unknown }>;
      if (data[0]?.error) throw new Error(JSON.stringify(data[0].error));
      return data[0]?.result?.data;
    },
    { base: API_BASE, proc: procedure, inp: input },
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('knowledge RAG loop E2E (AC-6 · PRD-9 US-005)', () => {
  let testAccountId = 0;

  test.beforeAll(async ({ browser }) => {
    fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 720 });
    // Login via dev auth redirect
    await page.goto(`${API_BASE}/auth/login`);
    await page.waitForURL(`${WEB_BASE}/**`);
    await page.waitForSelector('[data-testid="app-header"]');

    const account = (await trpcMutate(page, 'ipAccounts.create', {
      name: `e2e-rag-loop-${Date.now()}`,
      platform: 'douyin',
      industry: 'beauty',
      stage: 'growth',
    })) as { id: number };
    testAccountId = account.id;
    await trpcMutate(page, 'ipAccounts.switchActive', { accountId: testAccountId });
    await page.close();
  });

  test('AC-1: knowledge.list 返回 ≥67 case items (seed 已完成)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    // knowledge.list is publicProcedure — no auth needed
    await page.goto(`${WEB_BASE}/knowledge`, { waitUntil: 'networkidle' });

    const items = (await trpcQuery(page, 'knowledge.list', { type: 'case', limit: 100 })) as unknown[];
    expect(items.length).toBeGreaterThanOrEqual(67);
  });

  test('AC-2: /knowledge 搜索"护肤"返回 ≥1 结果 · 0 ErrorBoundary · 截图', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(`${API_BASE}/auth/login`);
    await page.waitForURL(`${WEB_BASE}/**`);
    await page.waitForSelector('[data-testid="app-header"]');
    await trpcMutate(page, 'ipAccounts.switchActive', { accountId: testAccountId });

    await page.goto(`${WEB_BASE}/knowledge`, { waitUntil: 'networkidle' });

    // Verify 3 tabs visible
    const tabs = page.locator('[data-testid="knowledge-tabs"]');
    await expect(tabs).toBeVisible({ timeout: 5_000 });

    // Search for '护肤' (appears in ≥8 case chunks)
    const searchInput = page.locator('[data-testid="knowledge-search-input"]');
    await expect(searchInput).toBeVisible({ timeout: 5_000 });
    await searchInput.fill('护肤');

    // Wait for debounce (300ms) + search response
    await page.waitForTimeout(600);

    // Expect status bar not to show "no results" message
    const statusBar = page.locator('[data-testid="knowledge-status-bar"]');
    await expect(statusBar).not.toContainText('暂无匹配结果', { timeout: 5_000 });

    // 0 ErrorBoundary
    const errorBoundary = page.locator('text=Something went wrong').or(
      page.locator('[data-testid="error-boundary"]'),
    );
    await expect(errorBoundary).toHaveCount(0);

    // Screenshot
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'knowledge-page.png'),
      fullPage: false,
    });

    // Filter out non-critical console errors (auth redirect, Radix duplicate React)
    const criticalErrors = consoleErrors.filter(
      (e) =>
        !e.includes('401') &&
        !e.includes('Unauthorized') &&
        !e.includes('UNAUTHORIZED') &&
        !e.includes('useContext') &&
        !e.includes('Failed to fetch'),
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('AC-3: debugAssembleSystemPrompt PositioningAgent 含 [Section 6] + ≥1 案例标题', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(`${API_BASE}/auth/login`);
    await page.waitForURL(`${WEB_BASE}/**`);
    await page.waitForSelector('[data-testid="app-header"]');
    await trpcMutate(page, 'ipAccounts.switchActive', { accountId: testAccountId });

    // AC-3: PositioningAgent systemPrompt 含 [Section 6] RAG 知识库参考
    const ctx = (await trpcQuery(page, 'evolution.debugAssembleSystemPrompt')) as {
      systemPrompt: string;
    };

    // [Section 6] must be present (D-058: ContextAssembler RAG injection)
    expect(ctx.systemPrompt).toContain('[Section 6] RAG 知识库参考');

    // At least 1 case chunk title injected (any Chinese text from knowledge_chunk)
    // The system prompt contains chunk.title followed by similarity score
    const hasChunkTitle =
      ctx.systemPrompt.includes('护肤') ||
      ctx.systemPrompt.includes('健康') ||
      ctx.systemPrompt.includes('案例') ||
      ctx.systemPrompt.includes('月薪') ||
      ctx.systemPrompt.includes('减脂') ||
      ctx.systemPrompt.includes('学习');
    expect(hasChunkTitle).toBe(true);
  });
});
