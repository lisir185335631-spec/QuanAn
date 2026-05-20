/**
 * PRD-25 US-005 AC-9 · /video-analysis + /analysis LLM flow E2E
 * GET /auth/dev-login bypass · 真 LLM 或 fallback 路径任一通过 · ≥ 8 assertions
 */
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:5173';

test.describe('PRD-25 US-005 · /video-analysis + /analysis content tools flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/dev-login`);
    await page.waitForLoadState('networkidle');
  });

  test('AC-9(1) · /video-analysis H1 字面锁 + CTA disabled on load', async ({ page }) => {
    await page.goto(`${BASE_URL}/video-analysis`);
    await page.waitForLoadState('networkidle');

    // H1 字面锁
    await expect(page.locator('h1')).toContainText('爆款文案解析');
    // 副标题
    await expect(page.locator('text=AI 将深度拆解爆款密码，支持一键仿写')).toBeVisible();
    // CTA disabled 初始
    await expect(page.getByRole('button', { name: '开始深度解析' })).toBeDisabled();
    // infobox 存在
    await expect(page.getByTestId('video-analysis-infobox')).toBeVisible();
  });

  test('AC-9(2) · /analysis H1 字面锁 + CTA disabled on load', async ({ page }) => {
    await page.goto(`${BASE_URL}/analysis`);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1')).toContainText('文案结构分析');
    await expect(page.locator('text=多维度深度分析')).toBeVisible();
    await expect(page.getByRole('button', { name: '开始分析' })).toBeDisabled();
    // char-count 初始 0
    await expect(page.getByTestId('char-count')).toContainText('0 字');
  });

  test('AC-9(3) · /video-analysis copy ≥ 10 字 → CTA enabled', async ({ page }) => {
    await page.goto(`${BASE_URL}/video-analysis`);
    await page.waitForLoadState('networkidle');

    await page.locator('textarea').fill('这是一段超过十个字的爆款视频文案内容');
    await expect(page.getByRole('button', { name: '开始深度解析' })).not.toBeDisabled();
  });

  test('AC-9(4) · /analysis text ≥ 10 字 → CTA enabled + 字符计数更新', async ({ page }) => {
    await page.goto(`${BASE_URL}/analysis`);
    await page.waitForLoadState('networkidle');

    const testText = '这是一段超过十个字的短视频文案内容';
    await page.locator('textarea').fill(testText);
    await expect(page.getByRole('button', { name: '开始分析' })).not.toBeDisabled();
    await expect(page.getByTestId('char-count')).toContainText(`${testText.length} 字`);
  });

  test('AC-9(5) · /video-analysis 提交 → loading 或结果区块渲染(真 LLM 或 fallback)', async ({ page }) => {
    await page.goto(`${BASE_URL}/video-analysis`);
    await page.waitForLoadState('networkidle');

    await page.locator('textarea').fill(
      '今天给大家分享一个让我改变命运的秘密，90%的人都不知道的财富密码，看完你就懂了！'
    );
    await page.getByRole('button', { name: '开始深度解析' }).click();

    // 等 loading 出现 or 结果区块
    const loadingOrOutput = page
      .getByTestId('video-analysis-loading')
      .or(page.getByTestId('video-analysis-output'))
      .or(page.getByTestId('video-analysis-fallback-banner'));

    await expect(loadingOrOutput).toBeVisible({ timeout: 5_000 });

    // 若有 loading，等结果出现（最多 60s）
    if (await page.getByTestId('video-analysis-loading').isVisible()) {
      await expect(
        page.getByTestId('video-analysis-output').or(page.getByTestId('video-analysis-fallback-banner'))
      ).toBeVisible({ timeout: 60_000 });
    }

    // 结果区 或 fallback banner 至少一个可见
    const hasOutput = await page.getByTestId('video-analysis-output').isVisible();
    const hasFallback = await page.getByTestId('video-analysis-fallback-banner').isVisible();
    expect(hasOutput || hasFallback).toBe(true);
  });

  test('AC-9(6) · /analysis 提交 → loading 或结果区块渲染(真 LLM 或 fallback)', async ({ page }) => {
    await page.goto(`${BASE_URL}/analysis`);
    await page.waitForLoadState('networkidle');

    await page.locator('textarea').fill(
      '今天给大家分享一个让我改变命运的方法，很多人都不知道这个技巧，学会了可以少走十年弯路！'
    );
    await page.getByRole('button', { name: '开始分析' }).click();

    const loadingOrOutput = page
      .getByTestId('analysis-loading')
      .or(page.getByTestId('analysis-output'))
      .or(page.getByTestId('analysis-fallback-banner'));

    await expect(loadingOrOutput).toBeVisible({ timeout: 5_000 });

    if (await page.getByTestId('analysis-loading').isVisible()) {
      await expect(
        page.getByTestId('analysis-output').or(page.getByTestId('analysis-fallback-banner'))
      ).toBeVisible({ timeout: 60_000 });
    }

    const hasOutput = await page.getByTestId('analysis-output').isVisible();
    const hasFallback = await page.getByTestId('analysis-fallback-banner').isVisible();
    expect(hasOutput || hasFallback).toBe(true);
  });

  test('AC-9(7) · /video-analysis 结果包含 5 H3 区块(成功路径)', async ({ page }) => {
    await page.goto(`${BASE_URL}/video-analysis`);
    await page.waitForLoadState('networkidle');

    await page.locator('textarea').fill(
      '今天给大家分享一个让我改变命运的秘密，90%的人都不知道的财富密码，看完你就懂了！'
    );
    await page.getByRole('button', { name: '开始深度解析' }).click();

    // Wait for output (up to 60s for LLM)
    await expect(
      page.getByTestId('video-analysis-output').or(page.getByTestId('video-analysis-fallback-banner'))
    ).toBeVisible({ timeout: 60_000 });

    // If result rendered, check H3 sections
    if (await page.getByTestId('video-analysis-output').isVisible()) {
      await expect(page.getByRole('heading', { level: 3, name: '结构拆解' })).toBeVisible();
      await expect(page.getByRole('heading', { level: 3, name: '节奏分析' })).toBeVisible();
      await expect(page.getByRole('heading', { level: 3, name: '爆款元素识别' })).toBeVisible();
      await expect(page.getByRole('heading', { level: 3, name: '多维评分' })).toBeVisible();
      await expect(page.getByRole('heading', { level: 3, name: '优化建议' })).toBeVisible();
      // 一键仿写 button
      await expect(page.getByTestId('video-analysis-imitate')).toBeVisible();
    }
  });

  test('AC-9(8) · /analysis 结果包含 5 H3 区块 + 一键仿写(成功路径)', async ({ page }) => {
    await page.goto(`${BASE_URL}/analysis`);
    await page.waitForLoadState('networkidle');

    await page.locator('textarea').fill(
      '今天给大家分享一个让我改变命运的方法，很多人都不知道这个技巧，学会了可以少走十年弯路！'
    );
    await page.getByRole('button', { name: '开始分析' }).click();

    await expect(
      page.getByTestId('analysis-output').or(page.getByTestId('analysis-fallback-banner'))
    ).toBeVisible({ timeout: 60_000 });

    if (await page.getByTestId('analysis-output').isVisible()) {
      await expect(page.getByRole('heading', { level: 3, name: '结构拆解' })).toBeVisible();
      await expect(page.getByRole('heading', { level: 3, name: '节奏分析' })).toBeVisible();
      await expect(page.getByRole('heading', { level: 3, name: '爆款元素识别' })).toBeVisible();
      await expect(page.getByRole('heading', { level: 3, name: '多维评分' })).toBeVisible();
      await expect(page.getByRole('heading', { level: 3, name: '优化建议' })).toBeVisible();
      await expect(page.getByTestId('analysis-imitate')).toBeVisible();
    }
  });
});
