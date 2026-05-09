/**
 * E2E test — PRD-4 US-015 AC-17
 * isFallback 降级路径 · mock LLM fail → FallbackBanner 显示 + 重试恢复
 *
 * Strategy: inject window.fetch mock via addInitScript (runs on every nav) to return
 * a tRPC-v11 httpBatchStreamLink-compatible JSONL response with isFallback=true.
 * route.fulfill with JSON cannot work because the client reads res.body as a JSONL stream.
 *
 * JSONL wire format for a single mutation returning D:
 *   Line 1 (HEAD): {"0":[[{"result":0}],["result",0,0]]}
 *   Line 2 (chunk 0 → resolves to {data: Promise<D>}): [0,0,[[{"data":0}],["data",0,1]]]
 *   Line 3 (chunk 1 → resolves to D): [1,0,[[D]]]
 *
 * After FallbackBanner appears, clicking retry calls onRetry() = setResult(null),
 * which unmounts StepResult and re-mounts StepForm (no new API call).
 */
import { test, expect } from '@playwright/test';

const API_BASE = process.env.VITE_API_BASE_URL ?? 'http://localhost:3000';
const WEB_BASE = process.env.E2E_BASE_URL ?? 'http://localhost:5173';

const FALLBACK_RESULT = {
  ok: true,
  data: {
    stepKey: 'step1',
    result: {
      industry: '通用内容创作',
      marketAnalysis: '系统繁忙，暂时无法完成市场分析。建议稍后重试。',
      competitionLevel: 'medium',
      recommendation: '建议稍后重试，AI 将根据您的行业背景输出差异化定位建议。',
    },
    isFallback: true,
    version: 1,
    updatedAt: new Date().toISOString(),
    inputs: {},
  },
};

test.describe('FallbackBanner e2e (US-015)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(`${API_BASE}/auth/login`);
    await page.waitForURL(`${WEB_BASE}/**`);
    await page.waitForSelector('[data-testid="app-header"]');
  });

  test('AC-17: isFallback=true → FallbackBanner 显示 + 重试按钮 → 点击后清空结果显示表单', async ({
    page,
  }) => {
    // Inject fetch mock BEFORE navigating to /step/1
    // tRPC v11 httpBatchStreamLink reads res.body as a JSONL stream — can't use route.fulfill
    await page.addInitScript((mockData: typeof FALLBACK_RESULT) => {
      let interceptNext = true;
      const origFetch = window.fetch.bind(window);
      window.fetch = async (url: RequestInfo | URL, ...args: [RequestInit?]) => {
        if (interceptNext && String(url).includes('/trpc/stepData.save')) {
          interceptNext = false; // only mock the first call
          // JSONL format expected by jsonlStreamConsumer in tRPC client:
          // HEAD line: {"0": [[<obj_with_placeholders>], [<async_defs>...]]}
          // chunk lines: [chunkId, status, encode_result]
          const D = mockData;
          const lines = [
            JSON.stringify({ '0': [[{ result: 0 }], ['result', 0, 0]] }),
            JSON.stringify([0, 0, [[{ data: 0 }], ['data', 0, 1]]]),
            JSON.stringify([1, 0, [[D]]]),
          ].join('\n') + '\n';
          return new Response(new TextEncoder().encode(lines), {
            status: 200,
            headers: new Headers({ 'content-type': 'application/json', 'transfer-encoding': 'chunked' }),
          });
        }
        return origFetch(url, ...args);
      };
    }, FALLBACK_RESULT);

    await page.goto(`${WEB_BASE}/step/1`);
    await page.waitForLoadState('networkidle');

    // Step form should be visible
    const form = page.getByTestId('step-form-step1');
    await expect(form).toBeVisible();

    // Open the industry dropdown and select first item (so form passes validation)
    const combobox = page.locator('[data-testid="step-form-step1"] [role="combobox"]').first();
    const opened = await combobox.click({ timeout: 2000 }).then(() => true).catch(() => false);
    if (opened) {
      // Select first available option to close the dropdown and set industry value
      await page.locator('[role="option"]').first().click({ timeout: 2000 }).catch(async () => {
        await page.keyboard.press('Escape').catch(() => undefined);
      });
    }

    // Click submit — triggers tRPC stepData.save (intercepted by fetch mock)
    const submitBtn = page.getByRole('button', { name: /开始生成/ });
    await expect(submitBtn).toBeVisible({ timeout: 3000 });
    await submitBtn.click();

    // Wait for FallbackBanner to appear (AC-3)
    await expect(page.getByTestId('fallback-banner')).toBeVisible({ timeout: 8000 });
    // Verify banner text contains the required phrase (AC-3) — scoped to the banner element
    await expect(page.getByTestId('fallback-banner').getByText('系统繁忙', { exact: false })).toBeVisible();

    // FallbackBanner must have retry button (AC-14)
    const retryBtn = page.getByTestId('fallback-retry-btn');
    await expect(retryBtn).toBeVisible();

    // Click retry → onRetry() = setResult(null) → StepResult unmounts → StepForm mounts (AC-7)
    await retryBtn.click();

    // After retry, form should be visible again and fallback banner should be gone
    await expect(page.getByTestId('step-form-step1')).toBeVisible({ timeout: 3000 });
    await expect(page.getByTestId('fallback-banner')).not.toBeVisible();
  });
});
