/**
 * PRD-29 US-010c · /step/3 账号包装方案 e2e spec
 * AC-1: 7 section titles render
 * AC-2: 5 platform emoji buttons + active state
 * AC-3: form submit → loading state + mocked result inject
 * AC-4: IntroCopyPlatformCard Copy button → sonner toast
 * AC-5: literal text locks (CTA / breadcrumb)
 *
 * Run: pnpm test:e2e --project=chromium tests/e2e/prd-29-step-3-flow.spec.ts
 */

import { expect, test } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:5173';
const API_BASE = process.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

// Mock result that adaptStep3Result will accept
const MOCK_STEP3_RESULT = {
  nickname: ['美业进化论', '皮肤管理师小A', '美业实战派', '10年美容师自白', '美业增长笔记'],
  avatar: { style: '专业温暖型', prompt: 'Professional beauty advisor, warm gold color scheme' },
  background: { prompt: 'Aurelian dark style', platformVersions: ['9:16 竖版', '3:4 竖版', '1:1 方版'] },
  bio: [
    { platform: 'douyin',       text: '皮肤管理师 10年 | 帮你少走3年弯路 | 每周分享真实案例 👇 点关注' },
    { platform: 'xiaohongshu',  text: '✨ 10年皮肤管理实战派 | 专业护肤知识 | 帮你科学变美不踩坑' },
    { platform: 'wechat',       text: '皮肤管理师｜10年行业经验｜帮助创业者少走弯路' },
    { platform: 'kuaishou',     text: '美容师日常 vlog | 行业内幕 + 从业技巧' },
    { platform: 'bilibili',     text: '美业增长笔记 | 干货60% + 案例20% + 互动20%' },
    { platform: 'other',        text: '专业美业知识分享' },
  ],
  overallStrategy: '头像→背景图→简介三件套使用同一配色体系(暖金+深底色) · 跨平台识别度统一',
};

// Build tRPC v11 httpBatchStreamLink JSONL response (same format as tool-generate.spec.ts)
function buildJSONL(data: unknown): string {
  return (
    [
      JSON.stringify({ '0': [[{ result: 0 }], ['result', 0, 0]] }),
      JSON.stringify([0, 0, [[{ data: 0 }], ['data', 0, 1]]]),
      JSON.stringify([1, 0, [[data]]]),
    ].join('\n') + '\n'
  );
}

test.describe('prd-29-step-3-flow · /step/3 账号包装方案', () => {
  test.beforeEach(async ({ page }) => {
    // Mock clipboard API so navigator.clipboard.writeText() always resolves
    await page.addInitScript(() => {
      try {
        Object.defineProperty(navigator, 'clipboard', {
          configurable: true,
          value: { writeText: (_: string) => Promise.resolve() },
        });
      } catch {
        // clipboard already defined; noop
      }
    });

    // Mock window.fetch to intercept step3/stepData tRPC calls
    await page.addInitScript((mockResult: typeof MOCK_STEP3_RESULT) => {
      const origFetch = window.fetch.bind(window);
      let hasMutated = false;

      window.fetch = async (url: RequestInfo | URL, ...args: [RequestInit?]) => {
        const urlStr = String(url);

        // --- step3.generatePackage mutation ---
        if (urlStr.includes('step3.generatePackage')) {
          hasMutated = true;
          // 600ms delay so loading state is observable
          await new Promise<void>((resolve) => setTimeout(resolve, 600));
          const body = buildJSONL({ ok: true, data: { stepKey: 'step3', result: mockResult } });
          return new Response(new TextEncoder().encode(body), {
            status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
          });
        }

        // --- stepData.get query ---
        if (urlStr.includes('stepData.get')) {
          const data = hasMutated
            ? { stepKey: 'step3', result: mockResult, inputs: {}, isFallback: false }
            : null;
          const body = buildJSONL(data);
          return new Response(new TextEncoder().encode(body), {
            status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
          });
        }

        // --- stepData.save mutation (fire-and-forget, just ack) ---
        if (urlStr.includes('stepData.save')) {
          const body = buildJSONL({ ok: true });
          return new Response(new TextEncoder().encode(body), {
            status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
          });
        }

        return origFetch(url, ...args);
      };

      // helper available in page scope
      function buildJSONL(data: unknown): string {
        return (
          [
            JSON.stringify({ '0': [[{ result: 0 }], ['result', 0, 0]] }),
            JSON.stringify([0, 0, [[{ data: 0 }], ['data', 0, 1]]]),
            JSON.stringify([1, 0, [[data]]]),
          ].join('\n') + '\n'
        );
      }
    }, MOCK_STEP3_RESULT);

    // Auth via dev-login → redirects to frontend
    await page.goto(`${API_BASE}/auth/dev-login`);
    await page.waitForURL(`${BASE_URL}/**`);
    // Navigate to /step/3
    await page.goto(`${BASE_URL}/step/3`);
    await page.waitForLoadState('networkidle');
  });

  // ── AC-1: 7 section title 字面 verify ───────────────────────────────────────
  test('AC-1 · 7 section titles render (账号包装方案 H1+H2 + 6 H3)', async ({ page }) => {
    // H1 = '账号包装方案' (Step3PageHeader)
    await expect(page.locator('h1')).toContainText('账号包装方案');

    // H2 = '账号包装方案' (Step3SectionDivider · AC-1 counts as one of the 7)
    await expect(page.locator('h2')).toContainText('账号包装方案');

    // 6 H3 section headings — always rendered (D-292 锁 · even when no data)
    const h3Texts = await page.locator('h3').allTextContents();
    const flatH3 = h3Texts.map((t) => t.trim());
    expect(flatH3.some((t) => t.includes('视频参考案例'))).toBe(true);
    expect(flatH3.some((t) => t.includes('昵称推荐'))).toBe(true);
    expect(flatH3.some((t) => t.includes('头像设计方案'))).toBe(true);
    expect(flatH3.some((t) => t.includes('背景图设计方案'))).toBe(true);
    expect(flatH3.some((t) => t.includes('简介文案方案'))).toBe(true);
    expect(flatH3.some((t) => t.includes('整体包装策略'))).toBe(true);
  });

  // ── AC-2: 5 platform emoji buttons + active state (bg-primary/20) ──────────
  test('AC-2 · 5 platform emoji 渲染 + click → active class bg-primary/20', async ({ page }) => {
    // 5 buttons with emoji
    await expect(page.getByRole('button', { name: /📱/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /📕/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /🎬/ })).toBeVisible();

    // B站 shares 📺 emoji with 视频号 — verify both text labels render
    await expect(page.getByRole('button', { name: /视频号/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /B站/ })).toBeVisible();

    // Click 📱 抖音 → bg-primary/20 appears on clicked button
    const douyinBtn = page.getByRole('button', { name: /📱/ }).first();
    await douyinBtn.click();
    const cls = await douyinBtn.getAttribute('class');
    expect(cls).toContain('bg-primary/20');

    // Click 📕 小红书 → 小红书 becomes active; 抖音 loses active
    const xhsBtn = page.getByRole('button', { name: /📕/ }).first();
    await xhsBtn.click();
    const xhsCls = await xhsBtn.getAttribute('class');
    expect(xhsCls).toContain('bg-primary/20');
    const douyinClsAfter = await douyinBtn.getAttribute('class');
    expect(douyinClsAfter).not.toContain('bg-primary/20');
  });

  // ── AC-3: form submit → loading state → mocked result inject ────────────────
  test('AC-3 · form submit → loading state + result inject via mock', async ({ page }) => {
    // Fill required fields
    await page.locator('textarea').first().fill('我是一名美容师，有10年经验，擅长皮肤管理和抗衰项目');
    await page.getByRole('button', { name: /📱/ }).first().click();

    // Submit
    await page.locator('button[type="submit"]').click();

    // Loading state: button shows STEP3_CTA_LOADING = '[⟳ 深度分析中...]'
    await expect(page.getByText('[⟳ 深度分析中...]')).toBeVisible({ timeout: 3000 });

    // Loading resolves after mock delay (~600ms)
    await expect(page.getByText('[⟳ 深度分析中...]')).not.toBeVisible({ timeout: 5000 });

    // Result inject: IntroCopySection shows real platform label (from mock bio data)
    // BIO_LABEL_MAP.douyin → { label: '抖音主号' }
    await expect(page.getByText('抖音主号')).toBeVisible({ timeout: 5000 });
  });

  // ── AC-4: Copy button → sonner toast ────────────────────────────────────────
  test('AC-4 · IntroCopyPlatformCard Copy button → sonner toast 字面', async ({ page }) => {
    // Fill, select platform, submit to inject mock data
    await page.locator('textarea').first().fill('我是一名美容师，有10年经验');
    await page.getByRole('button', { name: /📱/ }).first().click();
    await page.locator('button[type="submit"]').click();

    // Wait for result to appear (mock data loaded)
    await expect(page.getByText('抖音主号')).toBeVisible({ timeout: 8000 });

    // IntroCopyPlatformCard renders: <div class="flex ..."><p>抖音主号</p><button ghost icon>...</button></div>
    // Use parent::div to find the flex row that directly contains the "抖音主号" <p>, then get its button sibling
    const copyBtn = page
      .locator('p', { hasText: '抖音主号' })
      .locator('xpath=parent::div')
      .locator('button')
      .first();
    await copyBtn.click();

    // Sonner toast: `已复制 抖音主号 简介文案`
    await expect(page.getByText('已复制 抖音主号 简介文案')).toBeVisible({ timeout: 3000 });
  });

  // ── AC-5: 字面对账 · CTA + regenerate + breadcrumb ───────────────────────────
  test('AC-5 · 字面锁 · 主 CTA "生成账号包装方案" + "重新生成" + breadcrumb "STEP 03 › 账号包装方案"', async ({
    page,
  }) => {
    // Breadcrumb uses '›' (U+203A) not '>' (U+003E)
    await expect(page.getByText('STEP 03 › 账号包装方案')).toBeVisible();

    // Main CTA button: '生成账号包装方案' · no '→'
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeVisible();
    const submitText = await submitBtn.textContent();
    expect(submitText?.trim()).toContain('生成账号包装方案');
    expect(submitText).not.toContain('→');

    // Regenerate button: STEP3_CTA_REGENERATE = '⟲ 重新生成' · no '→'
    // The form has a non-submit regen button (type="button")
    const regenBtn = page.locator('form button[type="button"]').last();
    await expect(regenBtn).toBeVisible();
    const regenText = await regenBtn.textContent();
    expect(regenText?.trim()).toContain('重新生成');
    expect(regenText).not.toContain('→');
  });
});
