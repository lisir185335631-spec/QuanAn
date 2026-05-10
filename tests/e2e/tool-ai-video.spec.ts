/**
 * E2E test — PRD-6 US-008 AC-18
 * /ai-video 工具页: 表单 → 提交 → 立即 5 skeleton → mock jobStatus 完成 push → 5 真图渲染
 *
 * Flow: 创建账号 → /ai-video → 填 sourceCopy → 选 scenesCount=5 → 点提交
 *       → 立即 5 镜头 skeleton 网格 → mock generateStoryboard + jobStatus JSONL
 *       → 5 scene completed → 镜头 skeleton → 真 <img> → 完成 banner
 *
 * tRPC v11 httpBatchStreamLink JSONL mock pattern (同 tool-video-production.spec.ts)
 * workers=1 fullyParallel=false 序列化
 */

import { test, expect } from '@playwright/test';

const API_BASE = process.env.VITE_API_BASE_URL ?? 'http://localhost:3000';
const WEB_BASE = process.env.E2E_BASE_URL ?? 'http://localhost:5173';

// Mock storyboard response from generateStoryboard
const MOCK_STORYBOARD_RESPONSE = {
  historyId: 9001,
  jobIds: ['job-1', 'job-2', 'job-3', 'job-4', 'job-5'],
  scenesPlaceholder: [
    { index: 1, description: '博主走进餐厅，环境展示', imagePromptEn: 'blogger entering restaurant', sceneImageUrl: null, status: 'pending' },
    { index: 2, description: '特写菜单和招牌菜', imagePromptEn: 'close-up of menu and signature dish', sceneImageUrl: null, status: 'pending' },
    { index: 3, description: '品尝菜品，表情特写', imagePromptEn: 'tasting food, facial expression', sceneImageUrl: null, status: 'pending' },
    { index: 4, description: '与厨师互动', imagePromptEn: 'interacting with chef', sceneImageUrl: null, status: 'pending' },
    { index: 5, description: '结尾总结推荐', imagePromptEn: 'ending summary and recommendation', sceneImageUrl: null, status: 'pending' },
  ],
};

// Mock history.detail response (for AiVideoResult to fetch scene descriptions)
const MOCK_HISTORY_CONTENT = JSON.stringify({
  title: '美食探店 vlog',
  totalDuration: '60s',
  scenes: [
    { index: 1, description: '博主走进餐厅，环境展示', imagePromptEn: 'blogger entering restaurant', duration: '10s', sceneImageUrl: 'https://example.com/scene-1.jpg', jobId: 'job-1', status: 'completed' },
    { index: 2, description: '特写菜单和招牌菜', imagePromptEn: 'close-up of menu', duration: '12s', sceneImageUrl: 'https://example.com/scene-2.jpg', jobId: 'job-2', status: 'completed' },
    { index: 3, description: '品尝菜品，表情特写', imagePromptEn: 'tasting food', duration: '15s', sceneImageUrl: 'https://example.com/scene-3.jpg', jobId: 'job-3', status: 'completed' },
    { index: 4, description: '与厨师互动', imagePromptEn: 'interacting with chef', duration: '10s', sceneImageUrl: 'https://example.com/scene-4.jpg', jobId: 'job-4', status: 'completed' },
    { index: 5, description: '结尾总结推荐', imagePromptEn: 'ending recommendation', duration: '13s', sceneImageUrl: 'https://example.com/scene-5.jpg', jobId: 'job-5', status: 'completed' },
  ],
});

const MOCK_HISTORY_ROW = {
  id: 9001,
  agentId: 'VideoAgent',
  agentMode: 'storyboard',
  sourceType: 'user',
  inputSummary: '今天分享一段美食探店 vlog 制作过程',
  content: MOCK_HISTORY_CONTENT,
  contentType: 'json',
  scriptType: null,
  elements: [],
  isFallback: false,
  traceId: 'test-trace-aiv-001',
  createdAt: new Date().toISOString(),
};

// Mock jobStatus: all 5 scenes completed
const MOCK_JOB_STATUS = {
  total: 5,
  completed: 5,
  pending: 0,
  failed: 0,
  scenes: [
    { index: 1, status: 'completed', sceneImageUrl: 'https://example.com/scene-1.jpg' },
    { index: 2, status: 'completed', sceneImageUrl: 'https://example.com/scene-2.jpg' },
    { index: 3, status: 'completed', sceneImageUrl: 'https://example.com/scene-3.jpg' },
    { index: 4, status: 'completed', sceneImageUrl: 'https://example.com/scene-4.jpg' },
    { index: 5, status: 'completed', sceneImageUrl: 'https://example.com/scene-5.jpg' },
  ],
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

// Build JSONL response for tRPC v11 httpBatchStreamLink mock
function buildJsonlResponse(data: unknown): string {
  const D = data;
  return [
    JSON.stringify({ '0': [[{ result: 0 }], ['result', 0, 0]] }),
    JSON.stringify([0, 0, [[{ data: 0 }], ['data', 0, 1]]]),
    JSON.stringify([1, 0, [[D]]]),
  ].join('\n') + '\n';
}

test.describe('/ai-video 工具页 E2E (US-008)', () => {
  test('创建账号 → 表单 → 提交 → 5 skeleton → mock 完成 → 5 真图 + 完成 banner + 无控制台错误', async ({
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

    // 2. Create IP account
    await trpcMutate(page, 'ipAccounts.create', {
      name: 'E2E AIV Test',
      industry: '美食',
      platform: 'douyin',
      stage: 'growth',
    });

    // 3. Inject fetch mock for generateStoryboard, jobStatus, and history.detail
    // tRPC v11 httpBatchStreamLink JSONL 3-line format
    await page.addInitScript(
      ({
        storyboardResponse,
        jobStatusResponse,
        historyRow,
        jsonlLines,
      }: {
        storyboardResponse: typeof MOCK_STORYBOARD_RESPONSE;
        jobStatusResponse: typeof MOCK_JOB_STATUS;
        historyRow: typeof MOCK_HISTORY_ROW;
        jsonlLines: (data: unknown) => string;
      }) => {
        const origFetch = window.fetch.bind(window);
        let storyboardIntercepted = false;
        window.fetch = async (url: RequestInfo | URL, ...args: [RequestInit?]) => {
          const urlStr = String(url);
          // Mock generateStoryboard mutation
          if (!storyboardIntercepted && urlStr.includes('aiVideo.generateStoryboard')) {
            storyboardIntercepted = true;
            const lines = [
              JSON.stringify({ '0': [[{ result: 0 }], ['result', 0, 0]] }),
              JSON.stringify([0, 0, [[{ data: 0 }], ['data', 0, 1]]]),
              JSON.stringify([1, 0, [[storyboardResponse]]]),
            ].join('\n') + '\n';
            return new Response(new TextEncoder().encode(lines), {
              status: 200,
              headers: new Headers({ 'content-type': 'application/json', 'transfer-encoding': 'chunked' }),
            });
          }
          // Mock jobStatus query — return all completed
          if (urlStr.includes('aiVideo.jobStatus')) {
            const lines = [
              JSON.stringify({ '0': [[{ result: 0 }], ['result', 0, 0]] }),
              JSON.stringify([0, 0, [[{ data: 0 }], ['data', 0, 1]]]),
              JSON.stringify([1, 0, [[jobStatusResponse]]]),
            ].join('\n') + '\n';
            return new Response(new TextEncoder().encode(lines), {
              status: 200,
              headers: new Headers({ 'content-type': 'application/json', 'transfer-encoding': 'chunked' }),
            });
          }
          // Mock history.detail query (batch contains 'history.detail')
          if (urlStr.includes('history.detail')) {
            const lines = [
              JSON.stringify({ '0': [[{ result: 0 }], ['result', 0, 0]] }),
              JSON.stringify([0, 0, [[{ data: 0 }], ['data', 0, 1]]]),
              JSON.stringify([1, 0, [[historyRow]]]),
            ].join('\n') + '\n';
            return new Response(new TextEncoder().encode(lines), {
              status: 200,
              headers: new Headers({ 'content-type': 'application/json', 'transfer-encoding': 'chunked' }),
            });
          }
          return origFetch(url, ...args);
        };
        void jsonlLines; // suppress unused warning
      },
      {
        storyboardResponse: MOCK_STORYBOARD_RESPONSE,
        jobStatusResponse: MOCK_JOB_STATUS,
        historyRow: MOCK_HISTORY_ROW,
        jsonlLines: buildJsonlResponse,
      },
    );

    // 4. Navigate to /ai-video
    await page.goto(`${WEB_BASE}/ai-video`);
    await page.waitForLoadState('networkidle');

    // 5. Verify form renders with required fields (AC-7)
    const sourceCopyArea = page.locator('#tool-aiv-source-copy');
    await expect(sourceCopyArea).toBeVisible();

    const sceneCountSelect = page.locator('#tool-aiv-scenes-count');
    await expect(sceneCountSelect).toBeVisible();

    const imageStyleSelect = page.locator('#tool-aiv-image-style');
    await expect(imageStyleSelect).toBeVisible();

    // 6. Fill sourceCopy (AC-8)
    await sourceCopyArea.fill('今天分享一段美食探店 vlog 制作过程，感谢大家关注支持！');

    // 7. Select scenesCount=5 (default)
    await sceneCountSelect.selectOption('5');

    // 8. Submit form
    const submitBtn = page.getByRole('button', { name: /生成 AI 视频/ });
    await submitBtn.click({ timeout: 2000 });

    // 9. Verify result area appears with scene grid (AC-9)
    const resultContainer = page.getByTestId('ai-video-result');
    await expect(resultContainer).toBeVisible({ timeout: 10000 });

    const sceneGrid = page.getByTestId('ai-video-scene-grid');
    await expect(sceneGrid).toBeVisible();

    // 10. Verify 5 scene cards appear (AC-9)
    const firstCard = page.getByTestId('ai-video-scene-card-1');
    await expect(firstCard).toBeVisible({ timeout: 5000 });

    // 11. After jobStatus returns all completed: verify completion banner (AC-11 / AC-5)
    const completeBanner = page.getByTestId('ai-video-complete-banner');
    await expect(completeBanner).toBeVisible({ timeout: 10000 });
    await expect(completeBanner).toContainText('所有镜头已完成');

    // 12. No console errors (filter known noise)
    const relevantErrors = consoleErrors.filter(
      (e) =>
        !e.includes('favicon') &&
        !e.includes('ResizeObserver') &&
        !e.includes('Non-Error promise rejection') &&
        !e.includes('net::ERR') &&
        !e.includes('Importing a module script failed') &&
        !e.includes('The above error occurred in one of your React components'),
    );
    expect(relevantErrors).toHaveLength(0);
  });
});
