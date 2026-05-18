/**
 * PRD-18 US-013 — E2E 集成验收 (updated for StepForm/StepResult abstraction)
 * Step 4 → 4b → 5 → 6 → 7 → 8 完整流程
 * AC: consoleErrors === [] 硬门禁 · 6 截图 · data-testid result 可见
 * TD-82 fix: test 3 (5 tab SSE) requires real LLM — skip without OPENAI_API_KEY
 *
 * Auth: test.beforeEach logs in via mock OAuth + creates + activates an IP account
 * so that stepData.save (protectedProcedure) can succeed.
 */
import * as path from 'path';
import { fileURLToPath } from 'url';
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:5173';
const API_BASE = process.env.VITE_API_BASE_URL ?? 'http://localhost:3000';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RESULTS_DIR = path.join(__dirname, '..', 'test-results');

const HAS_OPENAI_KEY = !!process.env.OPENAI_API_KEY;

type TrpcResult = { result: { data: unknown } };

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
      const data = (await res.json()) as TrpcResult[];
      return data[0]?.result?.data;
    },
    { base: API_BASE, proc: procedure, inp: input },
  );
}

test.describe('PRD-18 Step 4 → 4b → 5 → 6 → 7 → 8 E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    // Login via mock OAuth (OAUTH_PROVIDER=mock · skips CSRF)
    await page.goto(`${API_BASE}/auth/login`);
    await page.waitForURL(`${BASE_URL}/**`);
    // Wait for user to appear in header (indicates session is active)
    await expect(page.locator('[data-testid="header-user-trigger"]')).toBeVisible({ timeout: 10_000 });
    // Create a fresh IP account for this test and set it as active
    const acc = await trpcMutate(page, 'ipAccounts.create', {
      name: 'E2E 测试号',
      industry: '美业',
      platform: '抖音',
      stage: '初创',
    }) as { id: number };
    await trpcMutate(page, 'ipAccounts.switchActive', { accountId: acc.id });
  });

  // ─── test 1: Step 4 ──────────────────────────────────────────────────────────
  test('test 1 · Step 4 · 选平台 + 粉丝量 + 填信息 + 选目标 → 生成执行计划 → 结果可见', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto(`${BASE_URL}/step/4`);
    await expect(page.locator('h1').first()).toContainText('内容生产准备', { timeout: 10_000 });

    // Select platform via Radix Select
    await page.locator('#platform-select').click();
    await page.getByRole('option', { name: /抖音/ }).click();

    // Select followers range
    await page.locator('#step4-followers').click();
    await page.getByRole('option', { name: /0.*1千/ }).click();

    // Fill personal info (min 50 chars)
    await page.locator('[data-testid="step-form-step4"] textarea').first().fill(
      '我是美业从业者，在皮肤管理领域工作多年，希望通过短视频分享专业护肤知识，帮助更多人解决肌肤困扰，建立专业 IP 形象。',
    );

    // Select goals
    await page.locator('#step4-goals').click();
    await page.getByRole('option', { name: '从零起号' }).click();

    // Submit
    await page.locator('button[type="submit"]').click();

    // Wait for result component to appear
    await expect(page.locator('[data-testid="step-result-step4"]')).toBeVisible({ timeout: 30_000 });

    await page.screenshot({ path: path.join(RESULTS_DIR, 'prd-18-step-4.png') });

    const unexpectedErrors = consoleErrors.filter(
      (e) => !e.includes('subscription') && !e.includes('ERR_CONNECTION_REFUSED'),
    );
    expect(unexpectedErrors, `Console errors: ${consoleErrors.join(', ')}`).toEqual([]);
  });

  // ─── test 2: Step 4b ─────────────────────────────────────────────────────────
  test('test 2 · Step 4b · 填产品描述 + 选营收 → 生成变现路径 → 结果可见', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto(`${BASE_URL}/step/4b`);
    await expect(page.locator('h1').first()).toContainText('变现规划', { timeout: 10_000 });

    // Fill product description (min 20 chars)
    await page.locator('[data-testid="step-form-step4b"] textarea').first().fill(
      '专业皮肤管理服务，提供光子嫩肤、热玛吉等医美项目，客单价 2000-10000 元',
    );

    // Select revenue range
    await page.locator('#step4b-revenue').click();
    await page.getByRole('option', { name: '尚未变现' }).click();

    // Submit
    await page.locator('button[type="submit"]').click();

    // Wait for result
    await expect(page.locator('[data-testid="step-result-step4b"]')).toBeVisible({ timeout: 30_000 });
    // Verify key result sections (Step4bResult renders CardTitles)
    await expect(page.locator('text=现状分析').first()).toBeVisible();

    await page.screenshot({ path: path.join(RESULTS_DIR, 'prd-18-step-4b.png') });

    const unexpectedErrors = consoleErrors.filter(
      (e) => !e.includes('subscription') && !e.includes('ERR_CONNECTION_REFUSED'),
    );
    expect(unexpectedErrors, `Console errors: ${consoleErrors.join(', ')}`).toEqual([]);
  });

  // ─── test 3: Step 5 → Step 7 链路 ────────────────────────────────────────────
  // TD-82: requires real LLM SSE to produce 5 chunks (5 tab 渐进 visible)
  test('test 3 · Step 5 → 5 tabs 100 选题 → 点选题 → 跳 step7 主题预填', async ({ page }) => {
    test.skip(!HAS_OPENAI_KEY, 'requires OPENAI_API_KEY for real LLM 5 tab SSE');

    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto(`${BASE_URL}/step/5`);
    await page.evaluate(() => localStorage.clear());

    await expect(page.locator('h1')).toContainText('爆款选题库', { timeout: 10_000 });

    // AC: step tag (Step5 still renders STEP5_STEP_TAG constant)
    await expect(page.locator('text=STEP 05 · 爆款选题库')).toBeVisible();

    // 填 2 必填 input
    await page.locator('input').nth(0).fill('美业');
    await page.locator('input').nth(1).fill('专业皮肤管理项目');

    // 提交生成
    await page.locator('button', { hasText: '一键生成 5大类 爆款选题' }).click();

    // 等 5 类 tab — 流量型 先出；后续 4 类等 SSE 流续出，给足 30s
    await expect(page.getByRole('tab', { name: '流量型' })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('tab', { name: '变现型' })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('tab', { name: '人设型' })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('tab', { name: '认知型' })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('tab', { name: '案例型' })).toBeVisible({ timeout: 30_000 });

    // 当前 tab(流量型) 下应有 20 个选题 card
    const topicCards = page.locator('[role="tabpanel"] button');
    await expect(topicCards).toHaveCount(20, { timeout: 10_000 });

    await page.screenshot({ path: path.join(RESULTS_DIR, 'prd-18-step-5.png') });

    // 点第一个选题 → 跳 /step/7 + 主题预填
    const firstTopic = topicCards.first();
    await firstTopic.click();

    // 等待跳转到 step/7
    await page.waitForURL('**/step/7', { timeout: 10_000 });
    await expect(page.locator('h1').first()).toContainText('变现规划', { timeout: 10_000 });

    // 主题 input 应已预填 (acc_step5_selected_topic.title)
    const topicInput = page.locator('#step7-topic');
    const prefilledValue = await topicInput.inputValue();
    expect(
      prefilledValue.length,
      `Step7 topic input should be prefilled from Step5 selected topic, got: "${prefilledValue}"`,
    ).toBeGreaterThan(0);

    expect(consoleErrors, `Console errors: ${consoleErrors.join(', ')}`).toEqual([]);
  });

  // ─── test 4: Step 6 ──────────────────────────────────────────────────────────
  test('test 4 · Step 6 · 粘贴文案 → 生成分镜表 → 分镜表可见', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto(`${BASE_URL}/step/6`);
    await expect(page.locator('h1').first()).toContainText('数据分析与复盘', { timeout: 10_000 });

    // 粘贴文案 (≥50 字)
    const textarea = page.locator('textarea').first();
    await textarea.fill('美容院如何用抖音获客100个精准客户，这是一个实操分享，帮助你快速起号变现。通过精准的内容策略和互动运营，实现从流量到客户的转化。');

    // 提交
    await page.locator('button[type="submit"]').click();

    // Wait for result (Step6Result renders "分镜表" card)
    await expect(page.locator('[data-testid="step-result-step6"]')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('text=分镜表').first()).toBeVisible();

    await page.screenshot({ path: path.join(RESULTS_DIR, 'prd-18-step-6.png') });

    const unexpectedErrors = consoleErrors.filter(
      (e) => !e.includes('subscription') && !e.includes('ERR_CONNECTION_REFUSED'),
    );
    expect(unexpectedErrors, `Console errors: ${consoleErrors.join(', ')}`).toEqual([]);
  });

  // ─── test 5: Step 7 ──────────────────────────────────────────────────────────
  test('test 5 · Step 7 · 选脚本类型 + 填话题 → 生成文案 → 结果可见', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto(`${BASE_URL}/step/7`);
    await expect(page.locator('h1').first()).toContainText('变现规划', { timeout: 10_000 });

    // Select script type — click Radix Select trigger then option
    await page.locator('#step7-script-type').click();
    await page.getByRole('option', { name: '辩论对话' }).click();

    // Fill topic input (min 2 chars, it's an input not textarea)
    await page.locator('#step7-topic').fill('美容院到底该不该采购医美仪器');

    // Submit
    await page.locator('button[type="submit"]').click();

    // Wait for result (Step7Result renders markdown article)
    await expect(page.locator('[data-testid="step-result-step7"]')).toBeVisible({ timeout: 30_000 });

    await page.screenshot({ path: path.join(RESULTS_DIR, 'prd-18-step-7.png') });

    const unexpectedErrors = consoleErrors.filter(
      (e) => !e.includes('subscription') && !e.includes('ERR_CONNECTION_REFUSED'),
    );
    expect(unexpectedErrors, `Console errors: ${consoleErrors.join(', ')}`).toEqual([]);
  });

  // ─── test 6: Step 8 ──────────────────────────────────────────────────────────
  test('test 6 · Step 8 · 选平台 + 选经验等级 → 生成直播话术 → 初版 + 优化版可见', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto(`${BASE_URL}/step/8`);
    await expect(page.locator('h1').first()).toContainText('持续迭代与升级', { timeout: 10_000 });

    // Select platform
    await page.locator('#platform-select').click();
    await page.getByRole('option', { name: /抖音/ }).click();

    // Select experience level (required)
    await page.locator('#step8-experience').click();
    await page.getByRole('option', { name: '新手（从未直播）' }).click();

    // Submit
    await page.locator('button[type="submit"]').click();

    // Wait for result (Step8Result renders "初版话术" + "优化版话术" cards)
    await expect(page.locator('[data-testid="step-result-step8"]')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('text=初版话术').first()).toBeVisible();
    await expect(page.locator('text=优化版话术').first()).toBeVisible();

    await page.screenshot({ path: path.join(RESULTS_DIR, 'prd-18-step-8.png') });

    const unexpectedErrors = consoleErrors.filter(
      (e) => !e.includes('subscription') && !e.includes('ERR_CONNECTION_REFUSED'),
    );
    expect(unexpectedErrors, `Console errors: ${consoleErrors.join(', ')}`).toEqual([]);
  });
});
