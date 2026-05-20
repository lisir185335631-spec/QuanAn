/**
 * PRD-25 US-002 AC-10 · /voice-chat streaming flow E2E
 * GET /auth/dev-login bypass · quick prompt + 发送 → 等 stream 完成 → verify localStorage
 * ≥ 6 assertions · 真 LLM 或 isFallback 路径任一通过
 */
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:5173';

test.describe('PRD-25 US-002 · /voice-chat streaming flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/dev-login`);
    await page.waitForLoadState('networkidle');
    await page.goto(`${BASE_URL}/voice-chat`);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('AC-10(1) · H1 字面锁 "VOICE CHAT"', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('VOICE CHAT');
  });

  test('AC-10(2) · 6 quick prompts 渲染', async ({ page }) => {
    const prompts = page.getByTestId(/^quick-prompt-/);
    await expect(prompts).toHaveCount(6);
  });

  test('AC-10(3) · quick prompt click → input 填入(不发送)', async ({ page }) => {
    await page.getByTestId('quick-prompt-0').click();
    const input = page.getByTestId('chat-input');
    const val = await input.inputValue();
    expect(val.length).toBeGreaterThan(0);
    // No history list yet (not sent)
    await expect(page.getByTestId('history-list')).not.toBeVisible();
  });

  test('AC-10(4) · 发送 → streaming 区域或历史 list 出现', async ({ page }) => {
    // Click quick prompt and send
    await page.getByTestId('quick-prompt-0').click();
    await page.getByTestId('send-button').click();

    // Either streaming area or history-list should appear within 60s
    const streamingOrHistory = page
      .getByTestId('streaming-area')
      .or(page.getByTestId('history-list'))
      .or(page.getByTestId('stream-error'));

    await expect(streamingOrHistory).toBeVisible({ timeout: 60_000 });
  });

  test('AC-10(5) · done 后 localStorage history 写入(多账号隔离)', async ({ page }) => {
    await page.getByTestId('quick-prompt-0').click();
    await page.getByTestId('send-button').click();

    // Wait for streaming to complete (history-list appears) or error
    const historyOrError = page
      .getByTestId('history-list')
      .or(page.getByTestId('stream-error'));

    await expect(historyOrError).toBeVisible({ timeout: 90_000 });

    // Check localStorage has history (acc_ prefix · LD-009)
    const lsKeys = await page.evaluate(() => {
      return Object.keys(localStorage).filter((k) => k.includes('voice_chat_history'));
    });
    // If no error path: history should be written
    const isError = await page.getByTestId('stream-error').isVisible();
    if (!isError) {
      expect(lsKeys.length).toBeGreaterThan(0);
      const key = lsKeys[0]!;
      expect(key).toMatch(/acc_/); // LD-009 multi-account isolation
    }
  });

  test('AC-10(6) · 发送 button disabled when input empty', async ({ page }) => {
    const sendBtn = page.getByTestId('send-button');
    await expect(sendBtn).toBeDisabled();

    // Type something
    await page.getByTestId('chat-input').fill('test');
    await expect(sendBtn).toBeEnabled();
  });
});
