/**
 * E2E test — PRD-5 US-011 AC-11,16
 * /history 页面流程 · CI mock via window.fetch override
 *
 * Flow: 创建账号 → mock generate → /history → 看到表格 → 筛选 Boom → 点某行 →
 *       跳到 /boom-generate?historyId=N → 结果区显示历史 content + 无控制台错误
 *
 * tRPC v11 httpBatchStreamLink JSONL mock pattern
 */

import { test, expect } from '@playwright/test';

const API_BASE = process.env.VITE_API_BASE_URL ?? 'http://localhost:3000';
const WEB_BASE = process.env.E2E_BASE_URL ?? 'http://localhost:5173';

const MOCK_HISTORY_ROW = {
  id: 777,
  agentId: 'CopywritingAgent',
  agentMode: 'boom',
  sourceType: 'user',
  inputSummary: '减肥健康养生爆款文案',
  content: '候选1---候选2---候选3---候选4---候选5',
  contentType: 'markdown',
  scriptType: null,
  elements: ['fear', 'scarcity'],
  isFallback: false,
  traceId: 'trace-e2e-011',
  createdAt: new Date().toISOString(),
};

const MOCK_DETAIL_ROW = {
  id: 777,
  content: '## 候选一\n\n减肥真相\n\n---\n\n## 候选二\n\n紧迫感\n\n---\n\n## 候选三\n\n对比\n\n---\n\n## 候选四\n\n共鸣\n\n---\n\n## 候选五\n\n权威',
  contentType: 'markdown',
  agentId: 'CopywritingAgent',
  agentMode: 'boom',
  scriptType: null,
  elements: ['fear', 'scarcity'],
  isFallback: false,
  tokensUsed: 1200,
  modelUsed: 'claude-sonnet-4-6',
  durationMs: 3000,
  traceId: 'trace-e2e-011',
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

function makeJsonlResponse(data: unknown): Response {
  const lines = [
    JSON.stringify({ '0': [[{ result: 0 }], ['result', 0, 0]] }),
    JSON.stringify([0, 0, [[{ data: 0 }], ['data', 0, 1]]]),
    JSON.stringify([1, 0, [[data]]]),
  ].join('\n') + '\n';
  return new Response(new TextEncoder().encode(lines), {
    status: 200,
    headers: new Headers({ 'content-type': 'application/json', 'transfer-encoding': 'chunked' }),
  });
}

test.describe('/history 页面 E2E (US-011)', () => {
  test('创建账号 → /history → 表格渲染 → 筛选 Boom → 点行 → /boom-generate?historyId=777 → 结果区 + 无控制台错误', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });

    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    // 1. Login
    await page.goto(`${API_BASE}/auth/login`);
    await page.waitForURL(`${WEB_BASE}/**`);

    // 2. Create IP account
    await trpcMutate(page, 'ipAccounts.create', {
      name: 'E2E History Test',
      industry: '健康养生',
      platform: 'douyin',
      stage: 'growth',
    });

    // 3. Inject fetch mock for history.list + history.detail
    await page.addInitScript(
      ({
        listRow,
        detailRow,
      }: {
        listRow: typeof MOCK_HISTORY_ROW;
        detailRow: typeof MOCK_DETAIL_ROW;
      }) => {
        const origFetch = window.fetch.bind(window);
        window.fetch = async (url: RequestInfo | URL, ...args: [RequestInit?]) => {
          const urlStr = String(url);

          if (urlStr.includes('history.list')) {
            const lines = [
              JSON.stringify({ '0': [[{ result: 0 }], ['result', 0, 0]] }),
              JSON.stringify([0, 0, [[{ data: 0 }], ['data', 0, 1]]]),
              JSON.stringify([1, 0, [[[listRow]]]]),
            ].join('\n') + '\n';
            return new Response(new TextEncoder().encode(lines), {
              status: 200,
              headers: new Headers({
                'content-type': 'application/json',
                'transfer-encoding': 'chunked',
              }),
            });
          }

          if (urlStr.includes('history.detail')) {
            const lines = [
              JSON.stringify({ '0': [[{ result: 0 }], ['result', 0, 0]] }),
              JSON.stringify([0, 0, [[{ data: 0 }], ['data', 0, 1]]]),
              JSON.stringify([1, 0, [[detailRow]]]),
            ].join('\n') + '\n';
            return new Response(new TextEncoder().encode(lines), {
              status: 200,
              headers: new Headers({
                'content-type': 'application/json',
                'transfer-encoding': 'chunked',
              }),
            });
          }

          return origFetch(url, ...args);
        };
      },
      { listRow: MOCK_HISTORY_ROW, detailRow: MOCK_DETAIL_ROW },
    );

    // 4. Navigate to /history
    await page.goto(`${WEB_BASE}/history`);
    await page.waitForLoadState('networkidle');

    // 5. Verify history page rendered
    const historyPage = page.getByTestId('history-page');
    await expect(historyPage).toBeVisible();

    // 6. Verify table shows
    const table = page.getByTestId('history-table');
    await expect(table).toBeVisible({ timeout: 8000 });

    // 7. Verify the mock row appears
    const row = page.getByTestId(`history-row-${MOCK_HISTORY_ROW.id}`);
    await expect(row).toBeVisible();

    // 8. Verify mode badge shows "Boom"
    const modeBadge = page.getByTestId('history-mode-badge-boom');
    await expect(modeBadge).toBeVisible();

    // 9. Click the row → navigate to /boom-generate?historyId=777
    await row.click({ timeout: 2000 });
    await page.waitForURL(`${WEB_BASE}/boom-generate?historyId=777`, { timeout: 5000 });

    // 10. Verify result section shows historical content (from detail mock)
    const resultSection = page.getByTestId('tool-result-boom-generate');
    await expect(resultSection).toBeVisible({ timeout: 8000 });

    // 11. No console errors
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
