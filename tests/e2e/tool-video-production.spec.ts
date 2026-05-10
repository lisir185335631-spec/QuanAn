/**
 * E2E test — PRD-6 US-004 AC-13
 * /video-production 工具页真表单流程 · mock LLM via window.fetch override
 *
 * Flow: 创建账号 → /video-production → 填 sourceCopy + 选 videoType + 选 duration →
 *       submit → 看到 13 列分镜表 + 设备清单 + 排期 + 无控制台错误
 *
 * tRPC v11 httpBatchStreamLink JSONL mock pattern (same as tool-analysis.spec.ts)
 * workers=1 fullyParallel=false 序列化 (沿用 PRD-5 pattern)
 */

import { test, expect } from '@playwright/test';

const API_BASE = process.env.VITE_API_BASE_URL ?? 'http://localhost:3000';
const WEB_BASE = process.env.E2E_BASE_URL ?? 'http://localhost:5173';

const MOCK_PRODUCTION_CONTENT = JSON.stringify({
  shotList: [
    {
      scene: '开场介绍',
      transition: '特写',
      cameraAngle: '正面机位',
      action: '固定推镜',
      duration: '5s',
      voiceover: '博主正对镜头，自信介绍减脂经历',
      dialogue: '大家好，我是小李，三个月减了15kg',
      subtitle: '大家好 · 减脂15kg',
      sfx: '轻快背景音',
      lighting: '流行BGM副歌段',
      prop: '手机支架',
      costume: '运动装参考图',
      location: '家庭客厅',
    },
    {
      scene: '痛点共鸣',
      transition: '中景',
      cameraAngle: '斜侧45度',
      action: '手持小幅运动',
      duration: '8s',
      voiceover: '展示减脂前后对比照片',
      dialogue: '以前我也试过各种方法，都失败了',
      subtitle: '试过很多方法 · 都失败了',
      sfx: '沉重节拍',
      lighting: '低沉BGM',
      prop: '对比照片',
      costume: '宽松休闲装参考',
      location: '同一机位',
    },
    {
      scene: '解决方案',
      transition: '近景',
      cameraAngle: '俯拍30度',
      action: '推进特写',
      duration: '10s',
      voiceover: '展示饮食记录本和运动计划表',
      dialogue: '直到我找到了这套科学方法：饮食控制 + 有氧训练 + 力量训练',
      subtitle: '三步法 · 科学减脂',
      sfx: '激励节拍',
      lighting: '励志BGM',
      prop: '记录本、计划表',
      costume: '运动装备参考',
      location: '书桌旁',
    },
  ],
  equipment: ['手机或运动相机', '手机稳定器/三脚架', '补光灯（环形灯）', '无线麦克风', '绿幕背景布（可选）'],
  schedule: 'Day 1（上午 9:00-12:00）：室内场景 · 开场 + 痛点 + 解决方案\nDay 1（下午 14:00-16:00）：户外补充镜头 · 运动场景\nDay 2：剪辑 + 调色 + 字幕 + 配乐',
});

const MOCK_VIDEO_PRODUCTION_ROW = {
  id: 777,
  content: MOCK_PRODUCTION_CONTENT,
  contentType: 'json',
  agentId: 'VideoAgent',
  agentMode: 'production',
  scriptType: null,
  elements: [],
  isFallback: false,
  tokensUsed: 1200,
  modelUsed: 'claude-sonnet-4-6',
  durationMs: 5800,
  traceId: 'test-trace-vp-001',
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

test.describe('/video-production 工具页 E2E (US-004)', () => {
  test('创建账号 → /video-production → 填文案 + 选类型 + 选时长 → submit → 13列分镜表 + 设备清单 + 排期 + 无控制台错误', async ({
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
      name: 'E2E VP Test',
      industry: '健康养生',
      platform: 'douyin',
      stage: 'growth',
    });

    // 3. Inject fetch mock for videoProduction.generate before navigating
    // tRPC v11 httpBatchStreamLink JSONL 3-line format
    await page.addInitScript((mockRow: typeof MOCK_VIDEO_PRODUCTION_ROW) => {
      let intercepted = false;
      const origFetch = window.fetch.bind(window);
      window.fetch = async (url: RequestInfo | URL, ...args: [RequestInit?]) => {
        if (!intercepted && String(url).includes('videoProduction.generate')) {
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
    }, MOCK_VIDEO_PRODUCTION_ROW);

    // 4. Navigate to /video-production
    await page.goto(`${WEB_BASE}/video-production`);
    await page.waitForLoadState('networkidle');

    // 5. Verify ToolForm renders with all required fields
    const form = page.getByTestId('tool-form-video-production');
    await expect(form).toBeVisible();

    const sourceCopyArea = page.locator('#tool-vp-source-copy');
    await expect(sourceCopyArea).toBeVisible();

    const videoTypeSelect = page.locator('#tool-vp-video-type');
    await expect(videoTypeSelect).toBeVisible();

    const durationSelect = page.locator('#tool-vp-duration');
    await expect(durationSelect).toBeVisible();

    // 6. Fill sourceCopy textarea (≥10字)
    await sourceCopyArea.fill('今天分享一段健身减脂经历，三个月减了 15kg，从180斤到150斤。这段旅程让我学到了很多关于饮食控制和运动的知识，想和大家分享。');

    // 7. Select videoType = short_form
    await videoTypeSelect.selectOption('short_form');

    // 8. Select duration = 60s
    await durationSelect.selectOption('60s');

    // 9. Submit form
    const submitBtn = form.getByRole('button', { name: /生成方案/ });
    await submitBtn.click({ timeout: 2000 });

    // 10. Verify result container appears with storyboard table
    const resultContainer = page.getByTestId('tool-result-video-production');
    await expect(resultContainer).toBeVisible({ timeout: 10000 });

    // 11. Verify storyboard table renders
    const storyboardTable = page.getByTestId('video-production-storyboard-table');
    await expect(storyboardTable).toBeVisible();

    // 12. Verify at least first shot row renders
    const firstShot = page.getByTestId('video-production-shot-0');
    await expect(firstShot).toBeVisible();

    // 13. Verify equipment card renders
    const equipmentCard = page.getByTestId('video-production-equipment');
    await expect(equipmentCard).toBeVisible();

    // 14. Verify schedule card renders
    const scheduleCard = page.getByTestId('video-production-schedule');
    await expect(scheduleCard).toBeVisible();

    // 15. Verify FeedbackButton renders
    const feedbackBtns = page.getByTestId('feedback-buttons');
    await expect(feedbackBtns).toBeVisible();

    // 16. No console errors (filter known noise)
    // 'Importing a module script failed' + 'The above error occurred' are pre-existing mobile
    // noise from StepLayout lazy-chunk loading on login redirect — same filter as tool-analysis.spec.ts
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
