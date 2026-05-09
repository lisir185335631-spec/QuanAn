/**
 * E2E test — PRD-5 US-008 AC-6
 * /analysis 工具页真表单流程 · mock LLM via window.fetch override
 *
 * Flow: 创建账号 → /analysis → 粘贴文案 → submit →
 *       看到 5 维度 progress bar + 3+ 优化建议 + rewriteSnippet + 无控制台错误
 *
 * tRPC v11 httpBatchStreamLink JSONL mock pattern (same as tool-boom-generate.spec.ts)
 */

import { test, expect } from '@playwright/test';

const API_BASE = process.env.VITE_API_BASE_URL ?? 'http://localhost:3000';
const WEB_BASE = process.env.E2E_BASE_URL ?? 'http://localhost:5173';

const MOCK_ANALYSIS_CONTENT = JSON.stringify({
  scores: {
    hook: 82,
    structure: 75,
    emotion: 68,
    specificity: 90,
    cta: 55,
    overall: 74,
  },
  optimizations: [
    {
      dimension: '行动召唤',
      issue: 'CTA 过于模糊，用户不清楚下一步行动',
      suggestion: '明确具体行动指令，如"点击链接立即获取"或"评论区留言666领取资料"',
    },
    {
      dimension: '情绪曲线',
      issue: '中段情绪渲染不足，读者容易流失',
      suggestion: '在第三段加入对比反差或具体数据，强化情绪冲击力',
    },
    {
      dimension: '钩子强度',
      issue: '开头问题设置不够尖锐',
      suggestion: '将问题改为痛点式提问，直接戳中目标用户的核心焦虑',
    },
  ],
  rewriteSnippet: '你知道为什么同样努力，有人月增10万粉，有人原地踏步吗？答案不在内容质量，而在这3个结构秘密。',
});

const MOCK_ANALYSIS_ROW = {
  id: 888,
  content: MOCK_ANALYSIS_CONTENT,
  contentType: 'json',
  agentId: 'AnalysisAgent',
  agentMode: 'structural',
  scriptType: null,
  elements: [],
  isFallback: false,
  tokensUsed: 800,
  modelUsed: 'claude-sonnet-4-6',
  durationMs: 3500,
  traceId: 'test-trace-analysis-001',
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

test.describe('/analysis 工具页 E2E (US-008)', () => {
  test('创建账号 → /analysis → 粘贴文案 → submit → 5维度 progress bar + 3+ 优化建议 + rewriteSnippet + 无控制台错误', async ({
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
      name: 'E2E Analysis Test',
      industry: '健康养生',
      platform: 'douyin',
      stage: 'growth',
    });

    // 3. Inject fetch mock for analysis.analyze before navigating
    // tRPC v11 httpBatchStreamLink JSONL 3-line format
    await page.addInitScript((mockRow: typeof MOCK_ANALYSIS_ROW) => {
      let intercepted = false;
      const origFetch = window.fetch.bind(window);
      window.fetch = async (url: RequestInfo | URL, ...args: [RequestInit?]) => {
        if (!intercepted && String(url).includes('analysis.analyze')) {
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
    }, MOCK_ANALYSIS_ROW);

    // 4. Navigate to /analysis
    await page.goto(`${WEB_BASE}/analysis`);
    await page.waitForLoadState('networkidle');

    // 5. Verify ToolForm renders
    const form = page.getByTestId('tool-form-analysis');
    await expect(form).toBeVisible();

    // 6. Fill copy textarea with 200+ char content
    const copyArea = page.locator('#tool-analysis-copy');
    await copyArea.fill(
      '很多人做内容失败，不是因为内容质量不好，而是结构出了问题。一篇爆款文案通常具备三个核心要素：强钩子开头、情绪渲染中段、清晰行动召唤结尾。今天我们来拆解一篇经典爆款文案，看看它是如何做到这三点的，以及我们可以从中学到什么可复用的写作框架。',
    );

    // 7. Verify character count updates
    const charCount = page.getByTestId('analysis-char-count');
    await expect(charCount).toBeVisible();

    // 8. Submit form
    const submitBtn = form.getByRole('button', { name: /开始分析/ });
    await submitBtn.click({ timeout: 2000 });

    // 9. Verify result container appears
    const resultContainer = page.getByTestId('tool-result-analysis');
    await expect(resultContainer).toBeVisible({ timeout: 10000 });

    // 10. Verify 5 dimension progress bars render
    for (const label of ['钩子强度', '起承转合', '情绪曲线', '具体性', '行动召唤']) {
      const bar = page.getByTestId(`analysis-dim-bar-${label}`);
      await expect(bar).toBeVisible();
    }

    // 11. Verify 3+ optimization cards
    for (let i = 0; i < 3; i++) {
      const card = page.getByTestId(`analysis-opt-${i}`);
      await expect(card).toBeVisible();
    }

    // 12. Verify rewriteSnippet card
    const rewrite = page.getByTestId('analysis-rewrite');
    await expect(rewrite).toBeVisible();

    // 13. Verify overall score is shown (74 from mock)
    const overallScore = page.getByTestId('analysis-overall-score');
    await expect(overallScore).toBeVisible();
    await expect(overallScore).toHaveText('74');

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
