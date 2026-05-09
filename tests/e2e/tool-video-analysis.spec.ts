/**
 * E2E test — PRD-5 US-010 AC-7
 * /video-analysis 工具页真表单流程 · mock LLM via window.fetch override
 *
 * Flow: 创建账号 → /video-analysis → 粘贴爆款文案 200+ 字 → submit →
 *       看到 elements tag + 3+ insights + rewriteVersion 全文 + 无控制台错误
 *
 * tRPC v11 httpBatchStreamLink JSONL mock pattern (same as tool-analysis.spec.ts)
 */

import { test, expect } from '@playwright/test';

const API_BASE = process.env.VITE_API_BASE_URL ?? 'http://localhost:3000';
const WEB_BASE = process.env.E2E_BASE_URL ?? 'http://localhost:5173';

const MOCK_VIRAL_CONTENT = JSON.stringify({
  analysis: {
    elements: ['fear', 'scarcity', 'social_proof', 'curiosity'],
    structure: '问题引入 → 痛点放大 → 解决方案 → 行动召唤',
    hookType: '恐惧诉求',
    viralFormula: '恐惧 + 稀缺 = 紧迫行动',
  },
  insights: [
    {
      element: 'fear',
      explanation: '开篇用"时间不等人"触发用户对错失机会的焦虑，迅速抓住注意力',
      impact: '高',
    },
    {
      element: 'scarcity',
      explanation: '限量名额制造稀缺感，加速用户决策，减少拖延行为',
      impact: '高',
    },
    {
      element: 'social_proof',
      explanation: '引用真实用户案例（3000人验证），降低信任门槛',
      impact: '中',
    },
  ],
  rewriteVersion:
    '你还有多少时间可以浪费？\n\n很多人知道自己需要改变，却迟迟不行动。等到机会关闭，才后悔莫及。\n\n已经有**3000+用户**通过这套方法实现了蜕变，而他们唯一的区别就是——**现在就行动**。\n\n名额仅剩最后20席，今天是最后截止日期。',
});

const MOCK_VIDEO_ANALYSIS_ROW = {
  id: 999,
  content: MOCK_VIRAL_CONTENT,
  contentType: 'json',
  agentId: 'AnalysisAgent',
  agentMode: 'viral',
  scriptType: null,
  elements: ['fear', 'scarcity', 'social_proof', 'curiosity'],
  isFallback: false,
  tokensUsed: 900,
  modelUsed: 'claude-sonnet-4-6',
  durationMs: 4200,
  traceId: 'test-trace-va-001',
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

test.describe('/video-analysis 工具页 E2E', () => {
  const consoleErrors: string[] = [];

  test.beforeEach(({ page }) => {
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
  });

  test('粘贴爆款文案 200+ 字 → submit → elements tag + insights + rewriteVersion 渲染', async ({
    page,
  }) => {
    // Force desktop viewport (desktop-only nav elements)
    await page.setViewportSize({ width: 1280, height: 720 });

    // 1. Login via API
    await page.goto(`${API_BASE}/auth/login`);
    await page.waitForURL(`${WEB_BASE}/**`);

    // 2. Create an IP account for the session
    await trpcMutate(page, 'ipAccounts.create', {
      name: 'E2E VideoAnalysis Test',
      industry: '健康养生',
      platform: 'douyin',
      stage: 'growth',
    });

    // 3. Inject fetch mock for videoAnalysis.analyze before navigating
    // tRPC v11 httpBatchStreamLink JSONL 3-line format
    await page.addInitScript((mockRow: typeof MOCK_VIDEO_ANALYSIS_ROW) => {
      let intercepted = false;
      const origFetch = window.fetch.bind(window);
      window.fetch = async (url: RequestInfo | URL, ...args: [RequestInit?]) => {
        if (!intercepted && String(url).includes('videoAnalysis.analyze')) {
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
    }, MOCK_VIDEO_ANALYSIS_ROW);

    // 4. Navigate to /video-analysis
    await page.goto(`${WEB_BASE}/video-analysis`);
    await page.waitForLoadState('networkidle');

    // 5. Verify ToolForm renders
    const form = page.getByTestId('tool-form-video-analysis');
    await expect(form).toBeVisible();

    // 6. Fill lastCopy textarea with 200+ char content
    const copyArea = page.locator('#tool-va-copy');
    await copyArea.fill(
      '你还有多少时间可以浪费？很多人知道自己需要改变，却迟迟不行动，等到机会关闭，才后悔莫及。' +
      '已经有3000+用户通过这套方法实现了蜕变，而他们唯一的区别就是现在就行动。' +
      '名额仅剩最后20席，今天是最后截止日期。如果你还在观望，那就只能看着机会从指尖溜走。' +
      '不要让三年后的自己，后悔今天的拖延。这不是贩卖焦虑，这是事实。',
    );

    // 7. Submit form
    const submitBtn = form.getByRole('button', { name: /开始深度解析/ });
    await submitBtn.click({ timeout: 2000 });

    // 8. Verify result container appears
    const resultContainer = page.getByTestId('tool-result-video-analysis');
    await expect(resultContainer).toBeVisible({ timeout: 10000 });

    // 9. Verify elements tag list renders (4 elements from mock)
    const elementsContainer = page.getByTestId('video-analysis-elements');
    await expect(elementsContainer).toBeVisible();

    // Verify Chinese labels are used (fear → 恐惧)
    await expect(page.getByTestId('video-analysis-tag-fear')).toBeVisible();
    await expect(page.getByTestId('video-analysis-tag-scarcity')).toBeVisible();

    // 10. Verify 3+ insight cards
    for (let i = 0; i < 3; i++) {
      const card = page.getByTestId(`video-analysis-insight-${i}`);
      await expect(card).toBeVisible();
    }

    // 11. Verify rewriteVersion markdown card
    const rewrite = page.getByTestId('video-analysis-rewrite');
    await expect(rewrite).toBeVisible();

    // 12. Verify FeedbackButton renders
    const feedbackBtns = page.getByTestId('feedback-buttons');
    await expect(feedbackBtns).toBeVisible();

    // 13. No console errors
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
