/**
 * PRD-23 US-006 · /video-production E2E flow
 * AC-7: ≥ 3 tests · H1 字面 / CTA disabled→enabled / 提交后 4 H3 stub 输出
 */
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:5173';
const API_BASE = process.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

test.describe('PRD-23 US-006 · /video-production', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${API_BASE}/auth/dev-login`);
    await page.waitForURL(`${BASE_URL}/**`);
    await page.goto(`${BASE_URL}/video-production`);
    await page.waitForLoadState('networkidle');
  });

  test('AC-1 · H1 "短视频一键制作" 渲染 + 副标题包含"口播提词器和剪辑指导"', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('短视频一键制作');
    await expect(page.locator('text=AI 自动生成分镜脚本、拍摄方案、口播提词器和剪辑指导')).toBeVisible();
  });

  test('AC-3 · CTA 初始 disabled；填 ≥ 10 字后 enabled', async ({ page }) => {
    const cta = page.getByRole('button', { name: '生成制作方案' });
    await expect(cta).toBeDisabled();

    const textarea = page.getByPlaceholder(/至少 10 个字/);
    await textarea.fill('这是一段超过十个字的短视频文案内容用于测试');
    await expect(cta).toBeEnabled();
  });

  test('AC-4 · 提交后渲染 4 H3 stub 区块(分镜脚本/拍摄方案/口播提词器/剪辑指导)', async ({ page }) => {
    const textarea = page.getByPlaceholder(/至少 10 个字/);
    await textarea.fill('这是一段超过十个字的短视频文案内容，用来测试短视频一键制作的4个输出模块');
    await page.getByRole('button', { name: '生成制作方案' }).click();

    await expect(page.getByRole('heading', { level: 3, name: '分镜脚本' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: '拍摄方案' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: '口播提词器' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: '剪辑指导' })).toBeVisible();
  });
});
