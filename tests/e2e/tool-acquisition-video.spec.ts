/**
 * E2E test — PRD-6 US-006 AC-11
 * /acquisition-video 工具页真表单流程 · mock LLM via window.fetch override
 *
 * Flow: 创建账号 → /acquisition-video → 填 sourceCopy + 填 conversionGoal + 选 platform + 选 duration →
 *       submit → 看到 视频脚本 + CTA 高亮卡片 + 转化路径列表 + 无控制台错误
 *
 * tRPC v11 httpBatchStreamLink JSONL mock pattern (same as tool-video-production.spec.ts)
 * workers=1 fullyParallel=false 序列化
 */

import { test, expect } from '@playwright/test';

const API_BASE = process.env.VITE_API_BASE_URL ?? 'http://localhost:3000';
const WEB_BASE = process.env.E2E_BASE_URL ?? 'http://localhost:5173';

const MOCK_ACQUISITION_CONTENT = JSON.stringify({
  script: '你是否曾经遇到这个问题？每天花大量时间做内容，但粉丝增长却停滞不前？今天分享一个经过验证的方法，帮助你快速突破瓶颈，实现精准涨粉。我们的系统已帮助数百位创作者从 0 到 10 万粉丝，现在这个机会也属于你。关键是找到精准的目标用户，用他们听得懂的语言，讲他们最关心的问题。',
  ctaScript: '立即扫描下方二维码，免费获取详细涨粉方案，限时 48 小时开放，错过等下次！',
  conversionPath: '视频引流→扫码→咨询群→成交',
  keyMessages: ['经验证的涨粉方法', '针对创作者的专属方案', '免费咨询了解详情'],
});

const MOCK_ACQUISITION_ROW = {
  id: 888,
  content: MOCK_ACQUISITION_CONTENT,
  contentType: 'json',
  agentId: 'VideoAgent',
  agentMode: 'acquisition',
  scriptType: null,
  elements: [],
  isFallback: false,
  tokensUsed: 950,
  modelUsed: 'claude-sonnet-4-6',
  durationMs: 4500,
  traceId: 'test-trace-av-001',
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

test.describe('/acquisition-video 工具页 E2E (US-006)', () => {
  test('创建账号 → /acquisition-video → 填文案 + 填转化目标 + 选平台 + 选时长 → submit → 视频脚本 + CTA 高亮 + 转化路径 + 无控制台错误', async ({
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
      name: 'E2E AV Test',
      industry: '健康养生',
      platform: 'douyin',
      stage: 'growth',
    });

    // 3. Inject fetch mock for acquisitionVideo.generate before navigating
    // tRPC v11 httpBatchStreamLink JSONL 3-line format
    await page.addInitScript((mockRow: typeof MOCK_ACQUISITION_ROW) => {
      let intercepted = false;
      const origFetch = window.fetch.bind(window);
      window.fetch = async (url: RequestInfo | URL, ...args: [RequestInit?]) => {
        if (!intercepted && String(url).includes('acquisitionVideo.generate')) {
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
    }, MOCK_ACQUISITION_ROW);

    // 4. Navigate to /acquisition-video
    await page.goto(`${WEB_BASE}/acquisition-video`);
    await page.waitForLoadState('networkidle');

    // 5. Verify ToolForm renders with all required fields
    const form = page.getByTestId('tool-form-acquisition-video');
    await expect(form).toBeVisible();

    const sourceCopyArea = page.locator('#tool-av-source-copy');
    await expect(sourceCopyArea).toBeVisible();

    const conversionGoalInput = page.locator('#tool-av-conversion-goal');
    await expect(conversionGoalInput).toBeVisible();

    const platformSelect = page.locator('#tool-av-platform');
    await expect(platformSelect).toBeVisible();

    const durationSelect = page.locator('#tool-av-duration');
    await expect(durationSelect).toBeVisible();

    // 6. Fill sourceCopy textarea (≥10字)
    await sourceCopyArea.fill('今天分享一段内容创作经历，帮助大家从 0 开始涨粉，掌握精准涨粉的方法论，快速突破瓶颈。');

    // 7. Fill conversionGoal input (required)
    await conversionGoalInput.fill('扫码进群领取免费方案');

    // 8. Select platform = douyin
    await platformSelect.selectOption('douyin');

    // 9. Select duration = 60s
    await durationSelect.selectOption('60s');

    // 10. Submit form
    const submitBtn = form.getByRole('button', { name: /生成方案/ });
    await submitBtn.click({ timeout: 2000 });

    // 11. Verify result container appears
    const resultContainer = page.getByTestId('tool-result-acquisition-video');
    await expect(resultContainer).toBeVisible({ timeout: 10000 });

    // 12. Verify video script renders
    const scriptSection = page.getByTestId('acquisition-video-script');
    await expect(scriptSection).toBeVisible();

    // 13. Verify CTA highlighted card renders with '转化指令' title
    const ctaCard = page.getByTestId('acquisition-video-cta-card');
    await expect(ctaCard).toBeVisible();
    await expect(ctaCard).toContainText('转化指令');
    await expect(ctaCard).toContainText('立即扫描下方二维码');

    // 14. Verify conversion path section renders with ordered list
    const conversionPath = page.getByTestId('acquisition-video-conversion-path');
    await expect(conversionPath).toBeVisible();
    await expect(conversionPath).toContainText('转化路径');
    await expect(conversionPath).toContainText('视频引流→扫码→咨询群→成交');

    // 15. Verify FeedbackButton renders
    const feedbackBtns = page.getByTestId('feedback-buttons');
    await expect(feedbackBtns).toBeVisible();

    // 16. No console errors (filter known noise)
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
