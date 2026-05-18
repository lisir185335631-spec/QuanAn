/**
 * PRD-17 US-010 — E2E 集成验收
 * Step 1 → Step 3 → Step 3b 完整流程
 * AC: consoleErrors === [] 硬门禁 · stepData 跨 step localStorage 传递 · 字面 1:1 渲染
 */
import * as path from 'path';
import { fileURLToPath } from 'url';
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:5173';
// ESM-compatible __dirname
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');

// personalInfo 含 '美容师' → Step3b 预填验证
const PERSONAL_INFO =
  '我是一名有10年经验的美容师，擅长皮肤管理和抗衰项目，帮助了300+客户改善肌肤状态。';

test.describe('PRD-17 Step1 → Step3 → Step3b E2E', () => {
  test('完整流程：行业选择 → 账号包装 → 人设定制', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    // ─── Step 1 ────────────────────────────────────────────────────────────────
    await page.goto(`${BASE_URL}/step/1`);
    // Clear localStorage once after first load — addInitScript would re-run on page.goto('/step/3b')
    await page.evaluate(() => localStorage.clear());
    await expect(page.locator('h1')).toContainText('选择你的行业赛道', { timeout: 10_000 });

    // AC-2: step tag + 6 tabs 验证
    await expect(page.locator('text=STEP 01 · 选择行业赛道')).toBeVisible();
    await expect(page.locator('text=全部行业 (56)')).toBeVisible();
    await expect(page.locator('text=生活服务 (18)')).toBeVisible();
    await expect(page.locator('text=电商零售 (13)')).toBeVisible();
    await expect(page.locator('text=内容创作 (7)')).toBeVisible();
    await expect(page.locator('text=专业服务 (14)')).toBeVisible();
    await expect(page.locator('text=产业制造 (4)')).toBeVisible();

    // AC-2: screenshot Step 1
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'prd-17-step1.png') });

    // 选择 '美业' 行业卡
    await page.locator('.glass-card', { hasText: '美业' }).first().click();

    // PRD-19: CTA 改为 '生成行业洞察' → 等 LLM/fallback 结果 → 再点 '进入 IP 定位 →'
    await page.locator('button', { hasText: '生成行业洞察' }).click();
    await expect(page.locator('text=行业洞察报告')).toBeVisible({ timeout: 30_000 });
    await page.locator('button', { hasText: '进入 IP 定位 →' }).click();

    // ─── Step 3 ────────────────────────────────────────────────────────────────
    await page.waitForURL('**/step/3', { timeout: 10_000 });
    await expect(page.locator('h1')).toContainText('账号包装方案', { timeout: 10_000 });

    // AC-3: step tag + 副标题 + 5 platforms
    await expect(page.locator('text=STEP 03 · 账号包装方案')).toBeVisible();
    await expect(page.locator('text=当前行业：美业')).toBeVisible();
    await expect(page.locator('text=📱 抖音')).toBeVisible();
    await expect(page.locator('text=📕 小红书')).toBeVisible();
    await expect(page.locator('text=📺 视频号')).toBeVisible();
    await expect(page.locator('text=🎬 快手')).toBeVisible();
    await expect(page.locator('text=📺 B站')).toBeVisible();

    // 填写 personalInfo (含 '美容师' for Step3b prefill 验证)
    const step3Textarea = page.locator('textarea').first();
    await step3Textarea.fill(PERSONAL_INFO);

    // 选择平台 '📱 抖音'
    await page.locator('label[for="douyin"]').click();

    // 提交表单
    await page.locator('button[type="submit"]', { hasText: '生成账号包装方案' }).click();

    // 等待 6 H3 输出区出现 (1500ms mock timeout + render)
    await expect(page.locator('h3').filter({ hasText: '1. 视频参考案例' })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.locator('h3').filter({ hasText: '2. 昵称推荐' })).toBeVisible();
    await expect(page.locator('h3').filter({ hasText: '3. 头像设计方案' })).toBeVisible();
    await expect(page.locator('h3').filter({ hasText: '4. 背景图设计方案' })).toBeVisible();
    await expect(page.locator('h3').filter({ hasText: '5. 简介文案方案' })).toBeVisible();
    await expect(page.locator('h3').filter({ hasText: '6. 整体包装策略' })).toBeVisible();

    // AC-3: screenshot Step 3 (output visible)
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'prd-17-step3.png') });

    // ─── Step 3b ───────────────────────────────────────────────────────────────
    // acc_step1 + acc_step3 已写入 localStorage · 直接导航
    await page.goto(`${BASE_URL}/step/3b`);
    await expect(page.locator('h1')).toContainText('人设定制方案', { timeout: 10_000 });

    // AC-4: step tag + 副标题 + personalInfo 预填
    await expect(page.locator('text=STEP 03b · 人设定制方案')).toBeVisible();
    await expect(page.locator('text=当前行业：美业')).toBeVisible();

    // personalInfo textarea 自动预填 · toHaveValue /美容师/
    const step3bPersonalInfo = page.locator('textarea').first();
    await expect(step3bPersonalInfo).toHaveValue(/美容师/, { timeout: 5_000 });

    // AC-4: screenshot Step 3b (prefilled, before submit)
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'prd-17-step3b.png') });

    // 选择平台 + 提交
    await page.locator('label[for="step3b-douyin"]').click();
    await page.locator('button[type="submit"]', { hasText: '生成专属人设方案' }).click();

    // 等待 5 H3 输出区
    await expect(page.locator('h3').filter({ hasText: '1. 核心身份定位' })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.locator('h3').filter({ hasText: '2. 思想体系' })).toBeVisible();
    await expect(page.locator('h3').filter({ hasText: '3. 内容人设' })).toBeVisible();
    await expect(page.locator('h3').filter({ hasText: '4. 信任构建体系' })).toBeVisible();
    await expect(page.locator('h3').filter({ hasText: '5. 人设打造路线图' })).toBeVisible();

    // AC-1: 硬门禁 · 全程 consoleErrors === []
    expect(consoleErrors, `Console errors detected: ${consoleErrors.join(', ')}`).toEqual([]);
  });
});
