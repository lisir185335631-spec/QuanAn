/**
 * PRD-23 US-007 · /acquisition-video E2E flow
 * AC-8: ≥ 3 tests · H1 字面 / 3 字段填写 / 3 方案 grid stub 显示
 */
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:5173';
const API_BASE = process.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

test.describe('PRD-23 US-007 · /acquisition-video', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${API_BASE}/auth/dev-login`);
    await page.waitForURL(`${BASE_URL}/**`);
    await page.goto(`${BASE_URL}/acquisition-video`);
    await page.waitForLoadState('networkidle');
  });

  test('AC-1 · H1 "获客型视频制作" + 副标题 "专为获客设计的短视频方案"', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('获客型视频制作');
    await expect(page.locator('text=专为获客设计的短视频方案，让精准客户主动找上门')).toBeVisible();
  });

  test('AC-3 · 3 字段均填写后 CTA enabled；否则 disabled', async ({ page }) => {
    const cta = page.getByRole('button', { name: '生成获客方案' });
    await expect(cta).toBeDisabled();

    // Fill audience + sellingPoints (industry may be auto-filled from account)
    await page.getByTestId('acq-audience-textarea').fill('想要创业的30-45岁宝妈群体，有一定积蓄但缺乏方向');
    await page.getByTestId('acq-selling-points-textarea').fill('0基础可学、3个月回本、一对一指导');

    // Ensure industry is selected
    const select = page.getByTestId('acq-industry-select');
    const currentValue = await select.inputValue();
    if (!currentValue) {
      await select.selectOption({ label: /自媒体运营/ });
    }

    await expect(cta).toBeEnabled();
  });

  test('AC-4 · 提交后渲染 3 方案 grid · 每方案含 4 H4(主题角度/钩子/内容结构/CTA)', async ({ page }) => {
    // Fill all fields
    const select = page.getByTestId('acq-industry-select');
    const currentValue = await select.inputValue();
    if (!currentValue) {
      await select.selectOption({ label: /自媒体运营/ });
    }
    await page.getByTestId('acq-audience-textarea').fill('想要创业的30-45岁宝妈群体，有一定积蓄但缺乏方向');
    await page.getByTestId('acq-selling-points-textarea').fill('0基础可学、3个月回本、一对一指导');
    await page.getByRole('button', { name: '生成获客方案' }).click();

    // Verify 3 plans × 4 H4
    await expect(page.getByTestId('acquisition-video-output')).toBeVisible();
    await expect(page.getByRole('heading', { level: 4, name: '主题角度' }).first()).toBeVisible();
    await expect(page.getByRole('heading', { level: 4, name: '钩子' }).first()).toBeVisible();
    await expect(page.getByRole('heading', { level: 4, name: '内容结构' }).first()).toBeVisible();
    await expect(page.getByRole('heading', { level: 4, name: 'CTA' }).first()).toBeVisible();

    // All 3 plans present
    await expect(page.getByRole('heading', { level: 4, name: '主题角度' })).toHaveCount(3);
    await expect(page.getByRole('heading', { level: 4, name: 'CTA' })).toHaveCount(3);
  });
});
