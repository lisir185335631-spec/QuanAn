/**
 * E2E test — PRD-5 US-006 AC-7
 * /boom-generate 工具页真表单流程 · mock LLM via window.fetch override
 *
 * Flow: 创建账号 → /boom-generate → 选 elements + theme → submit →
 *       看到 5 卡片 grid + 每篇 copy button + 无控制台错误
 *
 * tRPC v11 httpBatchStreamLink JSONL mock pattern (same as tool-generate.spec.ts)
 */

import { test, expect } from '@playwright/test';

const API_BASE = process.env.VITE_API_BASE_URL ?? 'http://localhost:3000';
const WEB_BASE = process.env.E2E_BASE_URL ?? 'http://localhost:5173';

// 5 candidates joined with '\n\n---\n\n' (D-032 format)
const FIVE_CANDIDATES = [
  '## 候选文案一：减肥的真相\n\n很多人减肥失败，不是因为意志力不够，而是方法错了。研究显示，90%的减肥者在3个月内放弃。',
  '## 候选文案二：紧迫感驱动\n\n你还有多少时间？每天拖延减肥，身体在偷偷积累更多脂肪。现在开始，比明天开始少花一倍时间。',
  '## 候选文案三：对比冲击\n\n同样是努力，为什么有人越来越瘦，有人越来越胖？答案不在基因，在认知差距。',
  '## 候选文案四：情感共鸣\n\n你有没有试过穿不上去年的衣服？那种感觉让人沮丧。今天分享一个方法，让你3个月重新穿上它。',
  '## 候选文案五：权威背书\n\n营养学博士用10年研究证明：减肥最快的方法，不是节食，不是运动，而是这3个认知改变。',
].join('\n\n---\n\n');

const MOCK_BOOM_GENERATE_ROW = {
  id: 999,
  content: FIVE_CANDIDATES,
  contentType: 'markdown',
  agentId: 'CopywritingAgent',
  agentMode: 'boom',
  scriptType: null,
  elements: ['fear', 'scarcity'],
  isFallback: false,
  tokensUsed: 1200,
  modelUsed: 'claude-sonnet-4-6',
  durationMs: 4200,
  traceId: 'test-trace-boom-001',
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

test.describe('/boom-generate 工具页 E2E (US-006)', () => {
  test('创建账号 → /boom-generate → 选 elements + theme → submit → 5 卡片 grid + copy button + 无控制台错误', async ({
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
      name: 'E2E BoomGenerate Test',
      industry: '健康养生',
      platform: 'douyin',
      stage: 'growth',
    });

    // 3. Inject fetch mock for boomGenerate.generate before navigating
    // tRPC v11 httpBatchStreamLink JSONL 3-line format
    await page.addInitScript((mockRow: typeof MOCK_BOOM_GENERATE_ROW) => {
      let intercepted = false;
      const origFetch = window.fetch.bind(window);
      window.fetch = async (url: RequestInfo | URL, ...args: [RequestInit?]) => {
        if (!intercepted && String(url).includes('boomGenerate.generate')) {
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
    }, MOCK_BOOM_GENERATE_ROW);

    // 4. Navigate to /boom-generate
    await page.goto(`${WEB_BASE}/boom-generate`);
    await page.waitForLoadState('networkidle');

    // 5. Verify ToolForm renders
    const form = page.getByTestId('tool-form-boom-generate');
    await expect(form).toBeVisible();

    // 6. Select elements: fear
    const fearBtn = page.locator('[data-element="fear"]');
    await fearBtn.click({ timeout: 2000 });

    // 7. Select elements: scarcity — scarcity 属于 信息密度 组(默认折叠) · 先展开
    const infoGroupBtn = page.locator('button').filter({ hasText: '信息密度' });
    await infoGroupBtn.click({ timeout: 2000 });
    const scarcityBtn = page.locator('[data-element="scarcity"]');
    await scarcityBtn.click({ timeout: 3000 });

    // 8. Fill theme input
    const themeInput = page.locator('#tool-boom-theme');
    await themeInput.fill('减肥');

    // 9. Submit form
    const submitBtn = form.getByRole('button', { name: /一键生成爆款文案/ });
    await submitBtn.click();

    // 10. Verify result container appears
    const resultContainer = page.getByTestId('tool-result-boom-generate');
    await expect(resultContainer).toBeVisible({ timeout: 10000 });

    // 11. Verify 5 cards render
    for (let i = 0; i < 5; i++) {
      const card = page.getByTestId(`boom-candidate-${i}`);
      await expect(card).toBeVisible();
    }

    // 12. Verify each card has a copy button
    for (let i = 0; i < 5; i++) {
      const copyBtn = page.getByTestId(`boom-copy-${i}`);
      await expect(copyBtn).toBeVisible();
    }

    // 13. Verify format error is NOT shown (5 candidates split correctly)
    const formatError = page.getByTestId('boom-format-error');
    await expect(formatError).not.toBeVisible();

    // 14. Verify FeedbackButton renders
    const feedbackBtns = page.getByTestId('feedback-buttons');
    await expect(feedbackBtns).toBeVisible();

    // 15. No console errors
    const relevantErrors = consoleErrors.filter(
      (e) =>
        !e.includes('favicon') &&
        !e.includes('ResizeObserver') &&
        !e.includes('net::ERR') &&
        !e.includes('Importing a module script failed') &&
        !e.includes('The above error occurred in one of your React components'),
    );
    expect(relevantErrors).toHaveLength(0);
  });
});
