/**
 * PRD-18 US-013 — E2E 集成验收
 * Step 4 → 4b → 5 → 6 → 7 → 8 完整流程
 * AC: consoleErrors === [] 硬门禁 · 6 截图 · 字面 1:1 渲染
 */
import * as path from 'path';
import { fileURLToPath } from 'url';
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:5173';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Screenshots go into apps/web/test-results/ per AC-3
const RESULTS_DIR = path.join(__dirname, '..', 'test-results');

test.describe('PRD-18 Step 4 → 4b → 5 → 6 → 7 → 8 E2E', () => {
  // ─── test 1: Step 4 ──────────────────────────────────────────────────────────
  test('test 1 · Step 4 · 选平台 → 生成执行计划 → 3 H3', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto(`${BASE_URL}/step/4`);
    await page.evaluate(() => localStorage.clear());

    // 先设 step1 industry 供副标题渲染
    await page.evaluate(() => {
      localStorage.setItem('acc_step1', JSON.stringify({ industry: '美业' }));
    });
    await page.reload();

    await expect(page.locator('h1')).toContainText('执行计划', { timeout: 10_000 });

    // AC: step tag
    await expect(page.locator('text=STEP 04 · 制定执行计划')).toBeVisible();

    // 选平台 抖音
    await page.locator('label[for="step4-platform-douyin"]').click();

    // 提交表单
    await page.locator('button[type="submit"]', { hasText: '生成执行计划' }).click();

    // 等 3 H3 输出
    await expect(page.locator('h3').filter({ hasText: '1. 每日任务表' })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.locator('h3').filter({ hasText: '2. 每周里程碑' })).toBeVisible();
    await expect(page.locator('h3').filter({ hasText: '3. 阶段 KPI' })).toBeVisible();

    await page.screenshot({ path: path.join(RESULTS_DIR, 'prd-18-step-4.png') });

    expect(consoleErrors, `Console errors: ${consoleErrors.join(', ')}`).toEqual([]);
  });

  // ─── test 2: Step 4b ─────────────────────────────────────────────────────────
  test('test 2 · Step 4b · 填产品 → 生成变现路径 → 5 H3 + 3 阶梯', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto(`${BASE_URL}/step/4b`);
    await page.evaluate(() => localStorage.clear());

    await page.evaluate(() => {
      localStorage.setItem('acc_step1', JSON.stringify({ industry: '美业' }));
    });
    await page.reload();

    await expect(page.locator('h1')).toContainText('变现路径', { timeout: 10_000 });

    // AC: step tag
    await expect(page.locator('text=STEP 04b · 变现路径规划')).toBeVisible();

    // 填产品描述 textarea (必填)
    const productTextarea = page.locator('textarea').first();
    await productTextarea.fill('专业皮肤管理服务，提供光子嫩肤、热玛吉等医美项目，客单价 2000-10000 元');

    // 提交
    await page.locator('button[type="submit"]', { hasText: '生成变现路径' }).click();

    // 等 5 H3 输出
    await expect(page.locator('h3').filter({ hasText: '1. 市场分析' })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.locator('h3').filter({ hasText: '2. 三阶梯变现路径' })).toBeVisible();
    await expect(page.locator('h3').filter({ hasText: '3. 收入结构' })).toBeVisible();
    await expect(page.locator('h3').filter({ hasText: '4. 成功案例参考' })).toBeVisible();
    await expect(page.locator('h3').filter({ hasText: '5. 这个结果对你有帮助吗？' })).toBeVisible();

    // 3 阶梯字面验证
    await expect(page.locator('text=0→90万')).toBeVisible();
    await expect(page.locator('text=100万→1000万')).toBeVisible();
    await expect(page.locator('text=1000万→1亿')).toBeVisible();

    await page.screenshot({ path: path.join(RESULTS_DIR, 'prd-18-step-4b.png') });

    expect(consoleErrors, `Console errors: ${consoleErrors.join(', ')}`).toEqual([]);
  });

  // ─── test 3: Step 5 → Step 7 链路 ────────────────────────────────────────────
  test('test 3 · Step 5 → 5 tabs 100 选题 → 点选题 → 跳 step7 主题预填', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto(`${BASE_URL}/step/5`);
    await page.evaluate(() => localStorage.clear());

    await expect(page.locator('h1')).toContainText('爆款选题库', { timeout: 10_000 });

    // AC: step tag
    await expect(page.locator('text=STEP 05 · 爆款选题库')).toBeVisible();

    // 填 2 必填 input
    const inputs = page.locator('input[type="text"], input:not([type])').filter({ hasNot: page.locator('[placeholder="搜索"]') });
    await page.locator('input').nth(0).fill('美业');
    await page.locator('input').nth(1).fill('专业皮肤管理项目');

    // 提交生成
    await page.locator('button', { hasText: '一键生成 5大类 爆款选题' }).click();

    // 等 5 类 tab
    await expect(page.locator('text=流量型')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('text=变现型')).toBeVisible();
    await expect(page.locator('text=人设型')).toBeVisible();
    await expect(page.locator('text=认知型')).toBeVisible();
    await expect(page.locator('text=案例型')).toBeVisible();

    // 当前 tab(流量型) 下应有 20 个选题 card
    const topicCards = page.locator('[role="tabpanel"] button');
    await expect(topicCards).toHaveCount(20, { timeout: 10_000 });

    await page.screenshot({ path: path.join(RESULTS_DIR, 'prd-18-step-5.png') });

    // 点第一个选题 → 跳 /step/7 + 主题预填
    const firstTopic = topicCards.first();
    // 记录该选题文字，用于后续验证预填
    const firstTopicText = await firstTopic.textContent();
    await firstTopic.click();

    // 等待跳转到 step/7
    await page.waitForURL('**/step/7', { timeout: 10_000 });
    await expect(page.locator('h1')).toContainText('文案生成', { timeout: 10_000 });

    // 主题 textarea 应已预填 (acc_step5_selected_topic.title)
    const topicTextarea = page.locator('textarea').first();
    const prefilledValue = await topicTextarea.inputValue();
    expect(
      prefilledValue.length,
      `Step7 topic textarea should be prefilled from Step5 selected topic, got: "${prefilledValue}"`
    ).toBeGreaterThan(0);

    expect(consoleErrors, `Console errors: ${consoleErrors.join(', ')}`).toEqual([]);
  });

  // ─── test 4: Step 6 ──────────────────────────────────────────────────────────
  test('test 4 · Step 6 · 粘贴文案 → 生成拍摄计划 → 3 模块', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto(`${BASE_URL}/step/6`);
    await page.evaluate(() => localStorage.clear());

    await expect(page.locator('h1')).toContainText('拍摄计划', { timeout: 10_000 });

    // AC: step tag
    await expect(page.locator('text=STEP 06 · 生成拍摄计划')).toBeVisible();

    // 粘贴文案 (≥10 字)
    const textarea = page.locator('textarea').first();
    await textarea.fill('美容院如何用抖音获客100个精准客户，这是一个实操分享，帮助你快速起号变现。');

    // 提交
    await page.locator('button[type="submit"]', { hasText: '生成拍摄计划' }).click();

    // 等 3 模块 H3
    await expect(page.locator('h3').filter({ hasText: '1. 分镜脚本' })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.locator('h3').filter({ hasText: '2. 拍摄方案' })).toBeVisible();
    await expect(page.locator('h3').filter({ hasText: '3. 口播提词器' })).toBeVisible();

    await page.screenshot({ path: path.join(RESULTS_DIR, 'prd-18-step-6.png') });

    expect(consoleErrors, `Console errors: ${consoleErrors.join(', ')}`).toEqual([]);
  });

  // ─── test 5: Step 7 ──────────────────────────────────────────────────────────
  test('test 5 · Step 7 · 选 debate → 填主题 → 生成爆款文案 → 4 H4 + 评论引导', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto(`${BASE_URL}/step/7`);
    await page.evaluate(() => localStorage.clear());

    await expect(page.locator('h1')).toContainText('文案生成', { timeout: 10_000 });

    // AC: step tag
    await expect(page.locator('text=STEP 07 · AI 智能文案生成')).toBeVisible();

    // 脚本类型第一项为 '搞辩论'(debate) · 默认已选 · 确认可见(显示文本含 debate 定位)
    await expect(page.locator('text=搞辩论').first()).toBeVisible();

    // 填主题 textarea (必填)
    const topicTextarea = page.locator('textarea').first();
    await topicTextarea.fill('美容院到底该不该采购医美仪器？正反方辩论');

    // 提交
    await page.locator('button[type="submit"]', { hasText: '生成爆款文案' }).click();

    // 等 4 H4 (debate 模式)
    await expect(page.locator('h4').filter({ hasText: '话题抛出' })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.locator('h4').filter({ hasText: '正方' })).toBeVisible();
    await expect(page.locator('h4').filter({ hasText: '反方' })).toBeVisible();
    await expect(page.locator('h4').filter({ hasText: '我的立场' })).toBeVisible();

    // 评论引导区
    await expect(page.locator('text=评论区引导')).toBeVisible();

    await page.screenshot({ path: path.join(RESULTS_DIR, 'prd-18-step-7.png') });

    expect(consoleErrors, `Console errors: ${consoleErrors.join(', ')}`).toEqual([]);
  });

  // ─── test 6: Step 8 ──────────────────────────────────────────────────────────
  test('test 6 · Step 8 · 切子功能1 → 填字段 → 生成直播方案 → 6 H3', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto(`${BASE_URL}/step/8`);
    await page.evaluate(() => localStorage.clear());

    await page.evaluate(() => {
      localStorage.setItem('acc_step1', JSON.stringify({ industry: '美业' }));
    });
    await page.reload();

    await expect(page.locator('h1')).toContainText('直播策划', { timeout: 10_000 });

    // AC: step tag
    await expect(page.locator('text=STEP 08 · 直播策划')).toBeVisible();

    // 子功能 1(默认激活) — 验证 H3 "子功能 1：生成直播方案"
    await expect(page.locator('button', { hasText: '子功能 1：生成直播方案' })).toBeVisible();

    // 填产品信息 textarea
    const productTextarea = page.locator('textarea').first();
    await productTextarea.fill('专业皮肤管理项目，提供光子嫩肤、热玛吉等项目，帮助客户改善肌肤');

    // 提交
    await page.locator('button[type="submit"]', { hasText: '生成直播方案' }).click();

    // 等 6 H3 输出模块
    await expect(page.locator('h3').filter({ hasText: '1. 开场话术' })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.locator('h3').filter({ hasText: '2. 中场互动' })).toBeVisible();
    await expect(page.locator('h3').filter({ hasText: '3. 成交话术' })).toBeVisible();
    await expect(page.locator('h3').filter({ hasText: '4. 收尾' })).toBeVisible();
    await expect(page.locator('h3').filter({ hasText: '5. 引流策略' })).toBeVisible();
    await expect(page.locator('h3').filter({ hasText: '6. 互动设计' })).toBeVisible();

    await page.screenshot({ path: path.join(RESULTS_DIR, 'prd-18-step-8.png') });

    expect(consoleErrors, `Console errors: ${consoleErrors.join(', ')}`).toEqual([]);
  });
});
