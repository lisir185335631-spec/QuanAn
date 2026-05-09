/**
 * E2E test — PRD-5 US-004 AC-7
 * /generate 工具页真表单流程 · mock LLM via window.fetch override
 *
 * Flow: 创建账号 → /generate → 选 scriptType + elements + topic → submit →
 *       看结果出现 + isFallback=false + 无控制台错误
 *
 * tRPC v11 httpBatchStreamLink JSONL mock pattern (same as fallback.spec.ts)
 */

import { test, expect } from '@playwright/test';

const API_BASE = process.env.VITE_API_BASE_URL ?? 'http://localhost:3000';
const WEB_BASE = process.env.E2E_BASE_URL ?? 'http://localhost:5173';

const MOCK_FREE_GENERATE_ROW = {
  id: 999,
  content: '## 财富自由不是幸运\n\n**核心洞察**：30岁财富自由的人，早在20岁就开始了三件事...\n\n### 第一步：清晰目标\n\n目标不是梦想，而是计划。当你知道终点在哪里，每一步都有意义。\n\n### 第二步：复利思维\n\n时间是最好的朋友，但前提是你懂得让金钱工作。\n\n### 结语\n\n财富自由从来不是彩票，而是一场清醒的选择。你现在的每个决定，都在书写30岁的故事。',
  contentType: 'markdown',
  agentId: 'CopywritingAgent',
  agentMode: 'free',
  scriptType: 'tutorial',
  elements: ['fear', 'social_proof'],
  isFallback: false,
  tokensUsed: 800,
  modelUsed: 'claude-sonnet-4-6',
  durationMs: 3200,
  traceId: 'test-trace-001',
  createdAt: new Date().toISOString(),
};

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

test.describe('/generate 工具页 E2E (US-004)', () => {
  test('创建账号 → /generate → 选 scriptType + elements + topic → submit → 结果出现 + isFallback=false + 无控制台错误', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });

    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    // 1. Login via API
    await page.goto(`${API_BASE}/auth/login`);
    await page.waitForURL(`${WEB_BASE}/**`);

    // 2. Create an IP account for the session
    await trpcMutate(page, 'ipAccounts.create', {
      name: 'E2E Generate Test',
      industry: 'edu',
      platform: 'douyin',
      stage: 'growth',
    });

    // 3. Inject fetch mock for copywriting.freeGenerate before navigating
    // tRPC v11 httpBatchStreamLink expects JSONL 3-line format
    await page.addInitScript((mockRow: typeof MOCK_FREE_GENERATE_ROW) => {
      let intercepted = false;
      const origFetch = window.fetch.bind(window);
      window.fetch = async (url: RequestInfo | URL, ...args: [RequestInit?]) => {
        if (!intercepted && String(url).includes('copywriting.freeGenerate')) {
          intercepted = true;
          const D = mockRow;
          const lines = [
            JSON.stringify({ '0': [[{ result: 0 }], ['result', 0, 0]] }),
            JSON.stringify([0, 0, [[{ data: 0 }], ['data', 0, 1]]]),
            JSON.stringify([1, 0, [[D]]]),
          ].join('\n') + '\n';
          return new Response(new TextEncoder().encode(lines), {
            status: 200,
            headers: new Headers({ 'content-type': 'application/json', 'transfer-encoding': 'chunked' }),
          });
        }
        return origFetch(url, ...args);
      };
    }, MOCK_FREE_GENERATE_ROW);

    // 4. Navigate to /generate
    await page.goto(`${WEB_BASE}/generate`);
    await page.waitForLoadState('networkidle');

    // 5. Verify ToolForm renders
    const form = page.getByTestId('tool-form-freeGenerate');
    await expect(form).toBeVisible();

    // 6. Select scriptType: tutorial
    const scriptTypeSelect = page.getByTestId('script-type-select');
    await scriptTypeSelect.click();
    // Radix Select portal
    const tutorialOption = page.getByRole('option', { name: /教知识|tutorial/i }).first();
    await tutorialOption.click({ timeout: 2000 }).catch(async () => {
      // Fallback: try clicking by text
      await page.locator('[role="option"]').filter({ hasText: /教知识/ }).first().click({ timeout: 2000 });
    });

    // 7. Select elements: fear
    const fearBtn = page.locator('[data-element="fear"]');
    await fearBtn.click({ timeout: 2000 });

    // 8. Fill topic textarea
    const topicTextarea = form.locator('textarea');
    await topicTextarea.fill('为什么有的人30岁就财富自由');

    // 9. Submit form
    const submitBtn = form.getByRole('button', { name: /开始生成/ });
    await submitBtn.click();

    // 10. Verify result appears
    const resultContainer = page.getByTestId('tool-result-generate');
    await expect(resultContainer).toBeVisible({ timeout: 10000 });

    // 11. Verify isFallback=false (no fallback banner)
    const fallbackText = page.locator('text=AI 返回了备用结果');
    await expect(fallbackText).not.toBeVisible();

    // 12. Verify markdown content renders
    await expect(resultContainer).toContainText('财富自由');

    // 13. Verify FeedbackButton renders
    const feedbackBtns = page.getByTestId('feedback-buttons');
    await expect(feedbackBtns).toBeVisible();

    // 14. No console errors
    const relevantErrors = consoleErrors.filter(
      (e) => !e.includes('favicon') && !e.includes('ResizeObserver') && !e.includes('net::ERR'),
    );
    expect(relevantErrors).toHaveLength(0);
  });
});
