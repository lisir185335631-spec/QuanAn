/**
 * prd22-ai-video.spec.ts — PRD-22 US-004 E2E
 * /ai-video inline 重构: H1 STORYBOARD / 5 平台 / 6 视频类型 / 分镜表 13 列字面 / 导出 CSV button
 * AC-8: ≥ 5 tests
 */

import { test, expect } from '@playwright/test';

const WEB_BASE = process.env.E2E_BASE_URL ?? 'http://localhost:5173';

// D-221: 13 列字面锁
const EXPECTED_HEADERS = [
  '镜号', '景别', '角度', '运镜', '时长',
  '画面描述', '台词/解说', '字幕', '背景音乐',
  '音效', '情绪', '拍摄要点', '剪辑建议',
];

const PLATFORM_LABELS = ['抖音', '小红书', '视频号', '快手', 'B站'];
const VIDEO_TYPE_LABELS = ['口播', '剧情', 'Vlog', '产品展示', '街头采访', '教程'];

test.describe('/ai-video 工具页 PRD-22 US-004', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${WEB_BASE}/ai-video`);
    await page.waitForLoadState('networkidle');
  });

  test('AC-1 · H1 字面 STORYBOARD 存在且可见', async ({ page }) => {
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
    await expect(h1).toContainText('STORYBOARD');
  });

  test('AC-2 · 5 平台 radio button 全部可见', async ({ page }) => {
    for (const label of PLATFORM_LABELS) {
      await expect(page.getByRole('button', { name: label })).toBeVisible();
    }
  });

  test('AC-3 · 6 视频类型 button 全部可见', async ({ page }) => {
    for (const label of VIDEO_TYPE_LABELS) {
      const btn = page.getByTestId(`video-type-${label === 'Vlog' ? 'vlog' : label === '口播' ? 'monologue' : label === '剧情' ? 'plot' : label === '产品展示' ? 'product' : label === '街头采访' ? 'interview' : 'tutorial'}`);
      await expect(btn).toBeVisible();
    }
  });

  test('AC-4 · 分镜表 13 列表头字面正确 (生成后)', async ({ page }) => {
    // 输入文案 → 点击生成 → 等待表格渲染
    const textarea = page.getByTestId('ai-video-textarea');
    await textarea.fill('这是一段测试文案，用于验证分镜表生成功能。');

    await page.getByTestId('ai-video-cta').click();
    await page.waitForSelector('[data-testid="ai-video-storyboard-table"]', { timeout: 5000 });

    const table = page.getByTestId('ai-video-storyboard-table');
    await expect(table).toBeVisible();

    // 验证 13 列表头全部存在
    for (const header of EXPECTED_HEADERS) {
      await expect(table.getByRole('columnheader', { name: header })).toBeVisible();
    }
  });

  test('AC-5 · 导出 CSV button 可见且可点击 (生成后)', async ({ page }) => {
    const textarea = page.getByTestId('ai-video-textarea');
    await textarea.fill('测试文案内容');

    await page.getByTestId('ai-video-cta').click();
    await page.waitForSelector('[data-testid="ai-video-export-csv"]', { timeout: 5000 });

    const exportBtn = page.getByTestId('ai-video-export-csv');
    await expect(exportBtn).toBeVisible();
    await expect(exportBtn).toContainText('导出 CSV');
  });

  test('AC-6 · DOM button 数 ≥ 14 (5 平台 + 6 视频类型 + CTA + 1 二级)', async ({ page }) => {
    const buttons = await page.getByRole('button').all();
    expect(buttons.length).toBeGreaterThanOrEqual(14);
  });

  test('AC-3(2) · textarea 字符计数显示 0/5000', async ({ page }) => {
    const counter = page.getByTestId('ai-video-char-count');
    await expect(counter).toBeVisible();
    await expect(counter).toContainText('0/5000');
  });
});
