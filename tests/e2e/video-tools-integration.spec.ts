/**
 * E2E test — PRD-6 US-014 AC-6
 * 4 视频工具 + history 收官集成 E2E · test.describe.serial
 * 覆盖: video-production + acquisition-video + ai-video + generate?mode=acquisition
 *
 * CI mock LLM (page.addInitScript window.fetch override · tRPC v11 JSONL 3行)
 * mock ImageGen: jobStatus 立即返回 completed · sceneImageUrl=mock url
 * workers=1 fullyParallel=false 序列化 (PRD-5 US-012 教训)
 */

import { test, expect, type Page } from '@playwright/test';

const API_BASE = process.env.VITE_API_BASE_URL ?? 'http://localhost:3000';
const WEB_BASE = process.env.E2E_BASE_URL ?? 'http://localhost:5173';

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_VP_CONTENT = JSON.stringify({
  shotList: [
    {
      scene: '开场', duration: '5s', action: '博主出镜', dialogue: '大家好！', cameraAngle: '正面',
      prop: '无', lighting: '柔光', transition: '切入', sfx: '轻BGM', voiceover: '欢迎收看',
      subtitle: '开场字幕', costume: '运动装', location: '室内',
      index: 1, angle: '正面', movement: '固定', description: '博主正面出镜', bgm: '轻BGM', reference: '无', note: '无',
    },
    {
      scene: '内容', duration: '30s', action: '讲解减脂步骤', dialogue: '今天分享3步减脂法', cameraAngle: '中景',
      prop: '白板', lighting: '补光灯', transition: '溶解', sfx: '背景音乐', voiceover: '三步方法',
      subtitle: '步骤字幕', costume: '运动装', location: '室内',
      index: 2, angle: '中景', movement: '手持', description: '讲解核心内容', bgm: '激励BGM', reference: '无', note: '无',
    },
  ],
  equipment: ['手机支架', '补光灯', '无线麦克风'],
  schedule: 'Day 1: 拍摄; Day 2: 剪辑',
});

const MOCK_VP_ROW = {
  id: 4001,
  content: MOCK_VP_CONTENT,
  contentType: 'json',
  agentId: 'VideoAgent',
  agentMode: 'production',
  scriptType: null,
  elements: [],
  isFallback: false,
  tokensUsed: 1200,
  modelUsed: 'claude-sonnet-4-6',
  durationMs: 5800,
  traceId: 'vti-vp-001',
  createdAt: new Date().toISOString(),
};

const MOCK_AV_CONTENT = JSON.stringify({
  script: '你是否也遇到过涨粉瓶颈？今天分享一套经过验证的精准涨粉方法，已帮助数百位创作者突破瓶颈，实现从0到10万粉丝的跨越。',
  ctaScript: '立即扫描下方二维码，免费加入创作者交流群，限时100名！',
  conversionPath: '视频引流→扫码→社群→付费课程',
  keyMessages: ['精准涨粉方法', '已验证的方案', '免费加入社群'],
});

const MOCK_AV_ROW = {
  id: 4002,
  content: MOCK_AV_CONTENT,
  contentType: 'json',
  agentId: 'VideoAgent',
  agentMode: 'acquisition',
  scriptType: null,
  elements: [],
  isFallback: false,
  tokensUsed: 950,
  modelUsed: 'claude-sonnet-4-6',
  durationMs: 4500,
  traceId: 'vti-av-001',
  createdAt: new Date().toISOString(),
};

const MOCK_STORYBOARD_RESPONSE = {
  historyId: 4003,
  jobIds: ['job-vti-1', 'job-vti-2', 'job-vti-3', 'job-vti-4', 'job-vti-5'],
  scenesPlaceholder: [
    { index: 1, description: '博主走进餐厅', imagePromptEn: 'blogger entering restaurant', sceneImageUrl: null, status: 'pending' },
    { index: 2, description: '特写菜品', imagePromptEn: 'closeup of food', sceneImageUrl: null, status: 'pending' },
    { index: 3, description: '品尝反应', imagePromptEn: 'tasting food reaction', sceneImageUrl: null, status: 'pending' },
    { index: 4, description: '厨师互动', imagePromptEn: 'chef interaction', sceneImageUrl: null, status: 'pending' },
    { index: 5, description: '总结推荐', imagePromptEn: 'final recommendation', sceneImageUrl: null, status: 'pending' },
  ],
};

const MOCK_JOB_STATUS_COMPLETE = {
  total: 5,
  completed: 5,
  pending: 0,
  failed: 0,
  scenes: [
    { index: 1, status: 'completed', sceneImageUrl: 'https://mock.example/scene-1.jpg' },
    { index: 2, status: 'completed', sceneImageUrl: 'https://mock.example/scene-2.jpg' },
    { index: 3, status: 'completed', sceneImageUrl: 'https://mock.example/scene-3.jpg' },
    { index: 4, status: 'completed', sceneImageUrl: 'https://mock.example/scene-4.jpg' },
    { index: 5, status: 'completed', sceneImageUrl: 'https://mock.example/scene-5.jpg' },
  ],
};

const MOCK_AIV_HISTORY_CONTENT = JSON.stringify({
  title: '美食探店 vlog',
  totalDuration: '60s',
  scenes: [
    { index: 1, description: '博主走进餐厅', imagePromptEn: 'blogger entering restaurant', duration: '10s', sceneImageUrl: 'https://mock.example/scene-1.jpg', jobId: 'job-vti-1', status: 'completed' },
    { index: 2, description: '特写菜品', imagePromptEn: 'closeup of food', duration: '12s', sceneImageUrl: 'https://mock.example/scene-2.jpg', jobId: 'job-vti-2', status: 'completed' },
    { index: 3, description: '品尝反应', imagePromptEn: 'tasting food reaction', duration: '15s', sceneImageUrl: 'https://mock.example/scene-3.jpg', jobId: 'job-vti-3', status: 'completed' },
    { index: 4, description: '厨师互动', imagePromptEn: 'chef interaction', duration: '10s', sceneImageUrl: 'https://mock.example/scene-4.jpg', jobId: 'job-vti-4', status: 'completed' },
    { index: 5, description: '总结推荐', imagePromptEn: 'final recommendation', duration: '13s', sceneImageUrl: 'https://mock.example/scene-5.jpg', jobId: 'job-vti-5', status: 'completed' },
  ],
});

const MOCK_AIV_HISTORY_ROW = {
  id: 4003,
  agentId: 'VideoAgent',
  agentMode: 'storyboard',
  sourceType: 'user',
  inputSummary: '美食探店vlog制作',
  content: MOCK_AIV_HISTORY_CONTENT,
  contentType: 'json',
  scriptType: null,
  elements: [],
  isFallback: false,
  traceId: 'vti-aiv-001',
  createdAt: new Date().toISOString(),
};

const MOCK_ACQ_COPY_CONTENT = '# 育儿焦虑？这3个科学方法让妈妈不再崩溃\n\n很多新手妈妈都会经历这个阶段：宝宝哭闹不止，婆媳关系紧张，自己也在崩溃边缘。但其实，育儿焦虑90%来自信息不对称。\n\n## 方法一：建立可预期的日程\n\n固定作息不是束缚，而是给宝宝和你一个可预期的节奏。从出生第14天开始建立，坚持3周见效。\n\n## 方法二：放下完美主义\n\n60分妈妈就够了。宝宝需要的是情绪稳定的妈妈，不是事事完美的机器人。\n\n立即私信发"育儿"，获取我整理的0-1岁黄金养育手册，限时免费！';

const MOCK_ACQ_COPY_ROW = {
  id: 4004,
  content: MOCK_ACQ_COPY_CONTENT,
  contentType: 'markdown',
  agentId: 'CopywritingAgent',
  agentMode: 'acquisition',
  scriptType: null,
  elements: ['fear', 'social_proof'],
  isFallback: false,
  tokensUsed: 750,
  modelUsed: 'claude-sonnet-4-6',
  durationMs: 3200,
  traceId: 'vti-acq-001',
  createdAt: new Date().toISOString(),
};

const MOCK_HISTORY_LIST = [
  {
    id: 4004, agentId: 'CopywritingAgent', agentMode: 'acquisition', sourceType: 'user',
    inputSummary: '育儿焦虑获客文案', content: MOCK_ACQ_COPY_CONTENT.substring(0, 80),
    contentType: 'markdown', scriptType: null, elements: ['fear'], isFallback: false,
    traceId: 'vti-acq-001', createdAt: new Date().toISOString(),
  },
  {
    id: 4003, agentId: 'VideoAgent', agentMode: 'storyboard', sourceType: 'user',
    inputSummary: '美食探店vlog制作', content: MOCK_AIV_HISTORY_CONTENT.substring(0, 80),
    contentType: 'json', scriptType: null, elements: [], isFallback: false,
    traceId: 'vti-aiv-001', createdAt: new Date().toISOString(),
  },
  {
    id: 4002, agentId: 'VideoAgent', agentMode: 'acquisition', sourceType: 'user',
    inputSummary: '涨粉引流获客视频', content: MOCK_AV_CONTENT.substring(0, 80),
    contentType: 'json', scriptType: null, elements: [], isFallback: false,
    traceId: 'vti-av-001', createdAt: new Date().toISOString(),
  },
  {
    id: 4001, agentId: 'VideoAgent', agentMode: 'production', sourceType: 'user',
    inputSummary: '减脂视频分镜制作', content: MOCK_VP_CONTENT.substring(0, 80),
    contentType: 'json', scriptType: null, elements: [], isFallback: false,
    traceId: 'vti-vp-001', createdAt: new Date().toISOString(),
  },
];

// History detail for video-production row (click prefill test)
const MOCK_HISTORY_DETAIL_VP = {
  id: 4001, content: MOCK_VP_CONTENT, contentType: 'json',
  agentId: 'VideoAgent', agentMode: 'production', scriptType: null,
  elements: [], isFallback: false, tokensUsed: 1200, modelUsed: 'claude-sonnet-4-6',
  durationMs: 5800, traceId: 'vti-vp-001', createdAt: new Date().toISOString(),
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

test.describe.serial('4 视频工具 + history 收官集成 E2E (US-014)', () => {
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    sharedPage = await context.newPage();
    await sharedPage.setViewportSize({ width: 1280, height: 720 });

    // Login (shared user dev@local.test)
    await sharedPage.goto(`${API_BASE}/auth/login`);
    await sharedPage.waitForURL(`${WEB_BASE}/**`);

    // Create IP account
    await trpcMutate(sharedPage, 'ipAccounts.create', {
      name: 'E2E Video Integration',
      industry: '健康养生',
      platform: 'douyin',
      stage: 'growth',
    });

    // Install comprehensive fetch mock for all 4 video tools + history + jobStatus
    // CI mock LLM (page.addInitScript window.fetch) + mock ImageGen (jobStatus returns completed)
    await sharedPage.addInitScript(
      ({
        vpRow, avRow, storyboardResp, jobStatusComplete, aivHistoryRow, acqCopyRow,
        historyList, historyDetailVp,
      }: {
        vpRow: typeof MOCK_VP_ROW;
        avRow: typeof MOCK_AV_ROW;
        storyboardResp: typeof MOCK_STORYBOARD_RESPONSE;
        jobStatusComplete: typeof MOCK_JOB_STATUS_COMPLETE;
        aivHistoryRow: typeof MOCK_AIV_HISTORY_ROW;
        acqCopyRow: typeof MOCK_ACQ_COPY_ROW;
        historyList: typeof MOCK_HISTORY_LIST;
        historyDetailVp: typeof MOCK_HISTORY_DETAIL_VP;
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
              headers: new Headers({ 'content-type': 'application/json', 'transfer-encoding': 'chunked' }),
            });
          };
          if (u.includes('videoProduction.generate')) return jsonl(vpRow);
          if (u.includes('acquisitionVideo.generate')) return jsonl(avRow);
          if (u.includes('aiVideo.generateStoryboard')) return jsonl(storyboardResp);
          // mock ImageGen: jobStatus 立即返回所有 completed (mock BullMQ queue done event)
          if (u.includes('aiVideo.jobStatus')) return jsonl(jobStatusComplete);
          if (u.includes('aiVideo.dailyUsage')) return jsonl({ count: 0, limit: 5 });
          if (u.includes('history.detail')) return jsonl(historyDetailVp);
          if (u.includes('history.list')) return jsonl(historyList);
          if (u.includes('copywriting.acquisitionGenerate')) return jsonl(acqCopyRow);
          // Passthrough ai-video history mock for AiVideoResult re-query
          if (u.includes('history') && !u.includes('history.list') && !u.includes('history.detail')) {
            return jsonl(aivHistoryRow);
          }
          return orig(url, ...args);
        };
      },
      {
        vpRow: MOCK_VP_ROW,
        avRow: MOCK_AV_ROW,
        storyboardResp: MOCK_STORYBOARD_RESPONSE,
        jobStatusComplete: MOCK_JOB_STATUS_COMPLETE,
        aivHistoryRow: MOCK_AIV_HISTORY_ROW,
        acqCopyRow: MOCK_ACQ_COPY_ROW,
        historyList: MOCK_HISTORY_LIST,
        historyDetailVp: MOCK_HISTORY_DETAIL_VP,
      },
    );
  });

  test.afterAll(async () => {
    await sharedPage.close();
  });

  test('Step 1: /video-production → submit → 13列分镜表出现', async () => {
    const page = sharedPage;
    await page.goto(`${WEB_BASE}/video-production`);
    await page.waitForLoadState('networkidle');

    const form = page.getByTestId('tool-form-video-production');
    await expect(form).toBeVisible({ timeout: 8000 });

    await page.locator('#tool-vp-source-copy').fill('今天分享一段健身减脂经历，三个月减了15kg，想和大家分享科学减脂的方法和经验。');
    await page.locator('#tool-vp-video-type').selectOption('short_form');
    await page.locator('#tool-vp-duration').selectOption('60s');

    await form.getByRole('button', { name: /生成方案/ }).click();

    const result = page.getByTestId('tool-result-video-production');
    await expect(result).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('video-production-storyboard-table')).toBeVisible();
  });

  test('Step 2: /acquisition-video → submit → CTA 高亮卡片出现', async () => {
    const page = sharedPage;
    await page.goto(`${WEB_BASE}/acquisition-video`);
    await page.waitForLoadState('networkidle');

    const form = page.getByTestId('tool-form-acquisition-video');
    await expect(form).toBeVisible({ timeout: 8000 });

    await page.locator('#tool-av-source-copy').fill('分享内容创作经历，帮助大家从0开始涨粉，掌握精准涨粉方法论，快速突破瓶颈。');
    await page.locator('#tool-av-conversion-goal').fill('扫码进群领取免费方案');
    await page.locator('#tool-av-platform').selectOption('douyin');
    await page.locator('#tool-av-duration').selectOption('60s');

    await form.getByRole('button', { name: /生成方案/ }).click();

    const result = page.getByTestId('tool-result-acquisition-video');
    await expect(result).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('acquisition-video-cta-card')).toBeVisible();
  });

  test('Step 3: /ai-video → submit → 5 镜头 skeleton → mock 完成 → 完成 banner', async () => {
    const page = sharedPage;
    await page.goto(`${WEB_BASE}/ai-video`);
    await page.waitForLoadState('networkidle');

    const sourceCopyArea = page.locator('#tool-aiv-source-copy');
    await expect(sourceCopyArea).toBeVisible({ timeout: 8000 });

    await sourceCopyArea.fill('今天分享一段美食探店 vlog 制作过程，感谢大家关注支持！');
    await page.locator('#tool-aiv-scenes-count').selectOption('5');

    await page.getByRole('button', { name: /生成 AI 视频/ }).click();

    const resultContainer = page.getByTestId('ai-video-result');
    await expect(resultContainer).toBeVisible({ timeout: 10000 });

    // mock ImageGen: jobStatus returns completed — verify complete banner
    const completeBanner = page.getByTestId('ai-video-complete-banner');
    await expect(completeBanner).toBeVisible({ timeout: 10000 });
    await expect(completeBanner).toContainText('所有镜头已完成');
  });

  test('Step 4: /generate?mode=acquisition → submit → 结果出现', async () => {
    const page = sharedPage;
    await page.goto(`${WEB_BASE}/generate?mode=acquisition`);
    await page.waitForLoadState('networkidle');

    // Acquisition mode tab should be active
    const acquisitionTab = page.getByTestId('mode-tab-acquisition');
    await expect(acquisitionTab).toBeVisible({ timeout: 8000 });

    const form = page.getByTestId('tool-form-acquisition');
    await expect(form).toBeVisible({ timeout: 8000 });

    // Select script type (Radix UI Select: trigger → portal option)
    await page.getByTestId('script-type-select').click();
    await page.getByRole('option', { name: /教程演示/i }).first().click({ timeout: 2000 });

    // Select at least 1 element (psychological group is open by default)
    await page.locator('[data-element="fear"]').click({ timeout: 2000 });

    // Fill required inputs (acquisition form uses input, not textarea)
    await page.locator('#tool-acq-conversion-goal').fill('私信关注获取免费资料');
    await page.locator('#tool-acq-topic').fill('育儿焦虑的新手妈妈如何保持心态平稳');

    await form.getByRole('button', { name: /生成/ }).click();

    const result = page.getByTestId('tool-result-generate');
    await expect(result).toBeVisible({ timeout: 10000 });
  });

  test('Step 5: /history → 4条 → 点 video-production row → /video-production?historyId=4001 预填', async () => {
    const page = sharedPage;
    await page.goto(`${WEB_BASE}/history`, { waitUntil: 'networkidle' });

    await expect(page.getByTestId('history-page')).toBeVisible({ timeout: 10000 });

    const table = page.getByTestId('history-table');
    await expect(table).toBeVisible({ timeout: 8000 });

    // Verify 4 history rows (one per tool)
    await expect(page.getByTestId('history-row-4004')).toBeVisible();
    await expect(page.getByTestId('history-row-4003')).toBeVisible();
    await expect(page.getByTestId('history-row-4002')).toBeVisible();
    await expect(page.getByTestId('history-row-4001')).toBeVisible();

    // Click video-production row → verify prefill navigation
    await page.getByTestId('history-row-4001').click({ timeout: 2000 });
    await page.waitForURL(`${WEB_BASE}/video-production?historyId=4001`, { timeout: 5000 });

    // Verify prefilled result shows historical production content
    const resultSection = page.getByTestId('tool-result-video-production');
    await expect(resultSection).toBeVisible({ timeout: 8000 });
    await expect(page.getByTestId('video-production-storyboard-table')).toBeVisible();
  });
});
