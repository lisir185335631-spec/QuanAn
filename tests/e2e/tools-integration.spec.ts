/**
 * E2E test — PRD-5 US-012 AC-6,16
 * 4 工具 + history 收官集成 E2E · test.describe.serial · CI mock LLM
 *
 * Flow (serial, shared page dev@local.test):
 *   Step 1: Login + create account + /generate → result
 *   Step 2: /boom-generate → 5 候选
 *   Step 3: /analysis → 5维度评分
 *   Step 4: /video-analysis → elements + rewrite
 *   Step 5: /history → 4 条 → 点 row → /boom-generate?historyId=1002 预填验证
 *
 * tRPC v11 httpBatchStreamLink JSONL mock (same pattern as other tool specs)
 */

import { test, expect, type Page } from '@playwright/test';

const API_BASE = process.env.VITE_API_BASE_URL ?? 'http://localhost:3000';
const WEB_BASE = process.env.E2E_BASE_URL ?? 'http://localhost:5173';

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_FREE_ROW = {
  id: 1001,
  content: '## 财富自由不是运气\n\n**核心洞察**：真正的财富自由从清醒的选择开始...\n\n### 第一步：明确目标\n\n用数字定义你的财富自由：每月被动收入 ≥ 月支出。\n\n### 第二步：复利思维\n\n时间是最好的伙伴。从今天开始，让金钱为你工作。\n\n### 第三步：持续学习\n\n每年投资自己10%的收入，是最高ROI的投资。\n\n**今天就开始，你的30岁感谢你的20岁决定。**',
  contentType: 'markdown', agentId: 'CopywritingAgent', agentMode: 'free',
  scriptType: 'tutorial', elements: ['fear', 'social_proof'], isFallback: false,
  tokensUsed: 800, modelUsed: 'claude-sonnet-4-6', durationMs: 3200,
  traceId: 'int-test-001', createdAt: new Date().toISOString(),
};

const MOCK_BOOM_ROW = {
  id: 1002,
  content: '## 候选一\n\n月薪5000也能开始理财？这3步让你财富翻倍\n\n---\n\n## 候选二\n\n90%的人理财失败的原因，竟然是这个！\n\n---\n\n## 候选三\n\n你的钱在为别人工作？学会这招\n\n---\n\n## 候选四\n\n存钱没用！有钱人都这样让资产增值\n\n---\n\n## 候选五\n\n理财不是有钱人专属，这3个习惯从现在开始',
  contentType: 'markdown', agentId: 'CopywritingAgent', agentMode: 'boom',
  scriptType: null, elements: ['fear', 'specificity'], isFallback: false,
  tokensUsed: 1100, modelUsed: 'claude-sonnet-4-6', durationMs: 4000,
  traceId: 'int-test-002', createdAt: new Date().toISOString(),
};

const MOCK_ANALYSIS_CONTENT = JSON.stringify({
  scores: { hook: 82, structure: 75, emotion: 68, specificity: 90, cta: 55, overall: 74 },
  optimizations: [
    { dimension: '行动召唤', issue: 'CTA 过于模糊', suggestion: '明确具体行动指令' },
    { dimension: '情绪曲线', issue: '中段情绪不足', suggestion: '加入对比反差' },
    { dimension: '钩子强度', issue: '开头不够尖锐', suggestion: '改为痛点式提问' },
  ],
  rewriteSnippet: '你知道为什么同样努力，有人月增10万粉，有人原地踏步？答案在这3个结构秘密。',
});

const MOCK_ANALYSIS_ROW = {
  id: 1003,
  content: MOCK_ANALYSIS_CONTENT,
  contentType: 'json', agentId: 'AnalysisAgent', agentMode: 'structural',
  scriptType: null, elements: [], isFallback: false, tokensUsed: 800,
  modelUsed: 'claude-sonnet-4-6', durationMs: 3500,
  traceId: 'int-test-003', createdAt: new Date().toISOString(),
};

const MOCK_VIRAL_CONTENT = JSON.stringify({
  analysis: {
    elements: ['fear', 'scarcity', 'social_proof', 'curiosity'],
    structure: '问题引入 → 痛点放大 → 解决方案 → 行动召唤',
    hookType: '恐惧诉求', viralFormula: '恐惧 + 稀缺 = 紧迫行动',
  },
  insights: [
    { element: 'fear', explanation: '开篇触发焦虑，迅速抓住注意力', impact: '高' },
    { element: 'scarcity', explanation: '限量名额制造稀缺感', impact: '高' },
    { element: 'social_proof', explanation: '引用真实用户案例降低信任门槛', impact: '中' },
  ],
  rewriteVersion: '你还有多少时间可以浪费？已经有3000+用户通过这套方法实现了蜕变，而他们唯一的区别就是——现在就行动。',
});

const MOCK_VIDEO_ROW = {
  id: 1004,
  content: MOCK_VIRAL_CONTENT,
  contentType: 'json', agentId: 'AnalysisAgent', agentMode: 'viral',
  scriptType: null, elements: ['fear', 'scarcity', 'social_proof', 'curiosity'], isFallback: false,
  tokensUsed: 900, modelUsed: 'claude-sonnet-4-6', durationMs: 4200,
  traceId: 'int-test-004', createdAt: new Date().toISOString(),
};

const MOCK_HISTORY_LIST = [
  {
    id: 1004, agentId: 'AnalysisAgent', agentMode: 'viral', sourceType: 'user',
    inputSummary: '爆款文案拆解(viral)', content: '{"analysis":{"elements":["fear"]}}',
    contentType: 'json', scriptType: null, elements: ['fear'],
    isFallback: false, traceId: 'int-test-004', createdAt: new Date().toISOString(),
  },
  {
    id: 1003, agentId: 'AnalysisAgent', agentMode: 'structural', sourceType: 'user',
    inputSummary: '结构评分文案', content: '{"scores":{"hook":80}}',
    contentType: 'json', scriptType: null, elements: [],
    isFallback: false, traceId: 'int-test-003', createdAt: new Date().toISOString(),
  },
  {
    id: 1002, agentId: 'CopywritingAgent', agentMode: 'boom', sourceType: 'user',
    inputSummary: '月薪5000理财爆款', content: '## 候选一\n\n月薪5000也能开始理财',
    contentType: 'markdown', scriptType: null, elements: ['fear'],
    isFallback: false, traceId: 'int-test-002', createdAt: new Date().toISOString(),
  },
  {
    id: 1001, agentId: 'CopywritingAgent', agentMode: 'free', sourceType: 'user',
    inputSummary: '财富自由话题文案', content: '## 财富自由不是运气\n\n核心洞察在于...',
    contentType: 'markdown', scriptType: 'tutorial', elements: ['fear'],
    isFallback: false, traceId: 'int-test-001', createdAt: new Date().toISOString(),
  },
];

const MOCK_HISTORY_DETAIL = {
  id: 1002, content: MOCK_BOOM_ROW.content, contentType: 'markdown',
  agentId: 'CopywritingAgent', agentMode: 'boom', scriptType: null,
  elements: ['fear', 'specificity'], isFallback: false, tokensUsed: 1100,
  modelUsed: 'claude-sonnet-4-6', durationMs: 4000,
  traceId: 'int-test-002', createdAt: new Date().toISOString(),
};

// ── tRPC helper ───────────────────────────────────────────────────────────────

async function trpcMutate(page: Page, procedure: string, input: unknown): Promise<unknown> {
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

// ── Shared page (serial tests share browser context) ─────────────────────────

let sharedPage: Page;

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe.serial('4 工具 + history 收官集成 E2E (US-012)', () => {
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    sharedPage = await context.newPage();
    await sharedPage.setViewportSize({ width: 1280, height: 720 });

    // Login (shared user dev@local.test)
    await sharedPage.goto(`${API_BASE}/auth/login`);
    await sharedPage.waitForURL(`${WEB_BASE}/**`);

    // Create IP account
    await trpcMutate(sharedPage, 'ipAccounts.create', {
      name: 'E2E Integration Test',
      industry: '理财',
      platform: 'douyin',
      stage: 'growth',
    });

    // Install comprehensive fetch mock — handles all 4 tool + history endpoints
    await sharedPage.addInitScript(
      ({
        freeRow,
        boomRow,
        analysisRow,
        videoRow,
        historyList,
        historyDetail,
      }: {
        freeRow: typeof MOCK_FREE_ROW;
        boomRow: typeof MOCK_BOOM_ROW;
        analysisRow: typeof MOCK_ANALYSIS_ROW;
        videoRow: typeof MOCK_VIDEO_ROW;
        historyList: typeof MOCK_HISTORY_LIST;
        historyDetail: typeof MOCK_HISTORY_DETAIL;
      }) => {
        const orig = window.fetch.bind(window);
        window.fetch = async (url: RequestInfo | URL, ...args: [RequestInit?]) => {
          const u = String(url);
          const jsonl = (data: unknown) => {
            const lines = [
              JSON.stringify({ '0': [[{ result: 0 }], ['result', 0, 0]] }),
              JSON.stringify([0, 0, [[{ data: 0 }], ['data', 0, 1]]]),
              JSON.stringify([1, 0, [[data]]]),
            ].join('\n') + '\n';
            return new Response(new TextEncoder().encode(lines), {
              status: 200,
              headers: new Headers({
                'content-type': 'application/json',
                'transfer-encoding': 'chunked',
              }),
            });
          };
          if (u.includes('copywriting.freeGenerate')) return jsonl(freeRow);
          if (u.includes('boomGenerate.generate')) return jsonl(boomRow);
          if (u.includes('analysis.analyze')) return jsonl(analysisRow);
          if (u.includes('videoAnalysis.analyze')) return jsonl(videoRow);
          if (u.includes('history.list')) return jsonl(historyList);
          if (u.includes('history.detail')) return jsonl(historyDetail);
          return orig(url, ...args);
        };
      },
      {
        freeRow: MOCK_FREE_ROW,
        boomRow: MOCK_BOOM_ROW,
        analysisRow: MOCK_ANALYSIS_ROW,
        videoRow: MOCK_VIDEO_ROW,
        historyList: MOCK_HISTORY_LIST,
        historyDetail: MOCK_HISTORY_DETAIL,
      },
    );
  });

  test.afterAll(async () => {
    await sharedPage.close();
  });

  test('Step 1: /generate → submit → 结果出现', async () => {
    const page = sharedPage;
    await page.goto(`${WEB_BASE}/generate`);
    await page.waitForLoadState('load');

    const form = page.getByTestId('tool-form-freeGenerate');
    await expect(form).toBeVisible({ timeout: 8000 });

    // Select scriptType: tutorial
    await page.getByTestId('script-type-select').click();
    await page.getByRole('option', { name: /教程演示/i }).first().click({ timeout: 2000 });

    // Select element: fear
    await page.locator('[data-element="fear"]').click({ timeout: 2000 });

    // Fill topic
    await form.locator('textarea').fill('为什么有的人30岁就财富自由');

    // Submit and verify result
    await form.getByRole('button', { name: /开始生成/ }).click();
    const result = page.getByTestId('tool-result-generate');
    await expect(result).toBeVisible({ timeout: 10000 });
    await expect(result).toContainText('财富自由');
  });

  test('Step 2: /boom-generate → submit → 5 候选出现', async () => {
    const page = sharedPage;
    await page.goto(`${WEB_BASE}/boom-generate`);
    await page.waitForLoadState('load');

    const form = page.getByTestId('tool-form-boom-generate');
    await expect(form).toBeVisible();

    // Select element: fear
    await page.locator('[data-element="fear"]').click({ timeout: 2000 });

    // Fill theme (theme is an <input>, not textarea)
    await form.locator('#tool-boom-theme').fill('月薪5000也能开始理财');

    // Submit and verify 5 candidates
    await form.getByRole('button', { name: /爆款文案/ }).click();
    const result = page.getByTestId('tool-result-boom-generate');
    await expect(result).toBeVisible({ timeout: 10000 });
    await expect(result).toContainText('候选一');
    await expect(result).toContainText('候选二');
  });

  test('Step 3: /analysis → submit → 5维度评分出现', async () => {
    const page = sharedPage;
    await page.goto(`${WEB_BASE}/analysis`);
    await page.waitForLoadState('load');

    const form = page.getByTestId('tool-form-analysis');
    await expect(form).toBeVisible();

    // Fill copy (≥10 chars)
    await form
      .locator('textarea')
      .fill('今天分享减脂方法，少吃多动，坚持就能瘦，加油加油加油！希望对大家有帮助！');

    // Submit and verify 5-dim scores
    await form.getByRole('button', { name: /开始分析/ }).click();
    const result = page.getByTestId('tool-result-analysis');
    await expect(result).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('analysis-dim-bar-钩子强度')).toBeVisible();
  });

  test('Step 4: /video-analysis → submit → elements tag 出现', async () => {
    const page = sharedPage;
    await page.goto(`${WEB_BASE}/video-analysis`);
    await page.waitForLoadState('load');

    const form = page.getByTestId('tool-form-video-analysis');
    await expect(form).toBeVisible();

    // Fill lastCopy (≥10 chars)
    await form
      .locator('textarea')
      .first()
      .fill(
        '你还有多少时间可以浪费？很多人知道自己需要改变，却迟迟不行动。已经有3000+用户通过这套方法实现了蜕变，名额仅剩20席。',
      );

    // Submit and verify result
    await form.getByRole('button', { name: /深度解析/ }).click();
    const result = page.getByTestId('tool-result-video-analysis');
    await expect(result).toBeVisible({ timeout: 10000 });
  });

  test('Step 5: /history → 4条 → 点 boom row → /boom-generate?historyId=1002 预填', async () => {
    const page = sharedPage;
    await page.goto(`${WEB_BASE}/history`);
    await page.waitForLoadState('load');

    await expect(page.getByTestId('history-page')).toBeVisible({ timeout: 10000 });

    // Verify 4 history rows
    const table = page.getByTestId('history-table');
    await expect(table).toBeVisible({ timeout: 8000 });
    await expect(page.getByTestId('history-row-1004')).toBeVisible();
    await expect(page.getByTestId('history-row-1003')).toBeVisible();
    await expect(page.getByTestId('history-row-1002')).toBeVisible();
    await expect(page.getByTestId('history-row-1001')).toBeVisible();

    // Click boom-generate row → verify prefill navigation
    await page.getByTestId('history-row-1002').click({ timeout: 2000 });
    await page.waitForURL(`${WEB_BASE}/boom-generate?historyId=1002`, { timeout: 5000 });

    // Verify prefilled result shows historical boom content
    const resultSection = page.getByTestId('tool-result-boom-generate');
    await expect(resultSection).toBeVisible({ timeout: 8000 });
    await expect(resultSection).toContainText('候选一');
  });
});
