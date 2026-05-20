/**
 * PRD-23 US-005 · /analysis E2E flow
 * AC-7: ≥ 3 tests · H1 字面 / 字符计数 / disabled→enabled / 5 H3 stub 输出
 */
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:5173';
const API_BASE = process.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

test.describe('PRD-23 US-005 · /analysis', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${API_BASE}/auth/dev-login`);
    await page.waitForURL(`${BASE_URL}/**`);
    await page.goto(`${BASE_URL}/analysis`);
    await page.waitForLoadState('networkidle');
  });

  test('AC-1 · H1 "文案结构分析" + 副标题包含"多维度深度分析"', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('文案结构分析');
    await expect(page.locator('text=多维度深度分析')).toBeVisible();
  });

  test('AC-2/3 · 字符计数 0 字→N 字 + CTA disabled→enabled', async ({ page }) => {
    const charCount = page.getByTestId('char-count');
    await expect(charCount).toContainText('0 字');

    const cta = page.getByRole('button', { name: '开始分析' });
    await expect(cta).toBeDisabled();

    const textarea = page.getByPlaceholder(/至少 10 个字/);
    await textarea.fill('这是一段超过十个字的短视频文案内容用于测试');
    await expect(charCount).not.toContainText('0 字');
    await expect(cta).toBeEnabled();
  });

  test('AC-4 · 提交后渲染 5 H3 stub 区块 (字面锁)', async ({ page }) => {
    const textarea = page.getByPlaceholder(/至少 10 个字/);
    await textarea.fill('这是一段超过十个字的短视频文案内容，用来测试文案结构分析的五个输出模块');
    await page.getByRole('button', { name: '开始分析' }).click();

    await expect(page.getByRole('heading', { level: 3, name: '结构拆解' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: '节奏分析' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: '爆款元素识别' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: '多维评分' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: '优化建议' })).toBeVisible();
  });
});
