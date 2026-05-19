/**
 * PRD-23 US-004 · /video-analysis E2E flow
 * AC-8: ≥ 3 tests · H1 字面 / 表单 disabled→enabled / 提交后 5 H3 stub 输出
 */
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:5173';
const API_BASE = process.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

test.describe('PRD-23 US-004 · /video-analysis', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${API_BASE}/auth/dev-login`);
    await page.waitForURL(`${BASE_URL}/**`);
    await page.goto(`${BASE_URL}/video-analysis`);
    await page.waitForLoadState('networkidle');
  });

  test('AC-1 · H1 "爆款文案解析" 渲染 + 副标题包含"支持一键仿写"', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('爆款文案解析');
    await expect(page.locator('text=AI 将深度拆解爆款密码，支持一键仿写')).toBeVisible();
  });

  test('AC-4 · CTA 初始 disabled；填 ≥ 10 字后 enabled', async ({ page }) => {
    const cta = page.getByRole('button', { name: '开始深度解析' });
    await expect(cta).toBeDisabled();

    const textarea = page.getByPlaceholder(/至少 10 个字/);
    await textarea.fill('这是一段超过十个字的视频文案内容用于测试');
    await expect(cta).toBeEnabled();
  });

  test('AC-5 · 提交后渲染 5 H3 stub 区块 + 一键仿写跳 /generate', async ({ page }) => {
    const textarea = page.getByPlaceholder(/至少 10 个字/);
    await textarea.fill('这是一段超过十个字的视频文案内容，用来测试爆款文案解析的5个输出模块');
    await page.getByRole('button', { name: '开始深度解析' }).click();

    await expect(page.getByRole('heading', { level: 3, name: '钩子拆解' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: '结构分析' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: '爆款元素识别' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: '多维评分' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: '一键仿写' })).toBeVisible();

    // 一键仿写 button → /generate
    await page.getByRole('button', { name: '一键仿写' }).click();
    await page.waitForURL(`${BASE_URL}/generate**`);
    await expect(page).toHaveURL(/\/generate/);
  });
});
