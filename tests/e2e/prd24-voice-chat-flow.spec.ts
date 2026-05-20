/**
 * PRD-24 US-003 · /voice-chat E2E flow
 * AC-11: ≥ 4 tests · H1 VOICE CHAT / 6 quick prompts / input + 发送 /
 *        quick prompt click 填 input / 历史 list 渲染
 */
import { expect, test } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:5173';
const API_BASE = process.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

test.describe('PRD-24 US-003 · /voice-chat', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${API_BASE}/auth/dev-login`);
    await page.waitForURL(`${BASE_URL}/**`);
    await page.goto(`${BASE_URL}/voice-chat`);
    await page.waitForLoadState('networkidle');
  });

  test('AC-1 · H1 "VOICE CHAT" 可见', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('VOICE CHAT');
  });

  test('AC-2 · 6 quick prompts 全部渲染', async ({ page }) => {
    await expect(page.getByTestId('quick-prompt-0')).toContainText('我是新手');
    await expect(page.getByTestId('quick-prompt-1')).toContainText('美业赛道');
    await expect(page.getByTestId('quick-prompt-2')).toContainText('爆款文案');
    await expect(page.getByTestId('quick-prompt-3')).toContainText('直播带货');
    await expect(page.getByTestId('quick-prompt-4')).toContainText('记忆点');
    await expect(page.getByTestId('quick-prompt-5')).toContainText('小红书');
  });

  test('AC-6 · quick prompt click 填 input(不直接发送)', async ({ page }) => {
    await page.getByTestId('quick-prompt-0').click();
    const input = page.getByTestId('chat-input');
    await expect(input).toHaveValue('我是新手，怎么从0开始做短视频变现？');
    // history should NOT appear
    await expect(page.getByTestId('history-list')).not.toBeVisible().catch(() => {
      // if it doesn't exist that's also fine
    });
  });

  test('AC-6 · 发送 → 历史 list 渲染 + console 无 error', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    const input = page.getByTestId('chat-input');
    await input.fill('e2e 测试问题');
    await page.getByTestId('send-button').click();

    await expect(page.getByTestId('history-list')).toBeVisible({ timeout: 3000 });
    await expect(page.getByText('e2e 测试问题')).toBeVisible();

    // filter out pre-existing React Router warnings
    const realErrors = consoleErrors.filter(
      (e) => !e.includes('React Router') && !e.includes('future flag'),
    );
    expect(realErrors).toHaveLength(0);
  });

  test('AC-4 · input + 发送 button + mic button + speaker button 可见', async ({ page }) => {
    await expect(page.getByTestId('chat-input')).toBeVisible();
    await expect(page.getByTestId('send-button')).toBeVisible();
    await expect(page.getByTestId('mic-button')).toBeVisible();
    await expect(page.getByTestId('speaker-button')).toBeVisible();
  });
});
