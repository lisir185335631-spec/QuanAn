/**
 * E2E test — PRD-4 US-017
 * 9步 IP Flow 全程跑通 · 真接 LLMGateway · LIVE LLM · 手动跑
 *
 * AC-20: CI 关闭 · 手动: pnpm playwright test tests/e2e/ip-flow-9-steps.spec.ts --project=chromium
 * AC-21: test.describe.serial · 串行防并发 DB 污染
 * AC-23: 全程 < 10 min (playwright.config timeout=600_000)
 * AC-24: playwright passes
 * AC-25: typecheck passes
 *
 * 每步流程:
 *   进 /step/N → 填表单 → 点「开始生成」→ 等 LLM(真实调用)→ 验证 result 显示
 * 最终: /ip-plan 显示 9/9 · 9 步全高亮 data-status="completed"
 */

import { test, expect } from '@playwright/test';

const API_BASE = process.env.VITE_API_BASE_URL ?? 'http://localhost:3000';
const WEB_BASE = process.env.E2E_BASE_URL ?? 'http://localhost:5173';

async function trpcMutate(
  page: import('@playwright/test').Page,
  procedure: string,
  input: unknown,
): Promise<unknown> {
  return page.evaluate(
    async ({ base, proc, inp }: { base: string; proc: string; inp: unknown }) => {
      const res = await fetch(`${base}/trpc/${proc}?batch=1`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ '0': inp }),
        credentials: 'include',
      });
      const data = (await res.json()) as Array<{ result: { data: unknown } }>;
      return data[0]?.result?.data;
    },
    { base: API_BASE, proc: procedure, inp: input },
  );
}

// AC-21: serial — 防并发 DB 污染
test.describe.serial('IP Flow 9步 E2E (US-017 · 真 LLM · 手动跑)', () => {
  test('全程跑通: step1→step3→step3b→step4→step4b→step5→step6→step7→step8 → /ip-plan 9/9', async ({
    page,
  }) => {
    // AC-20: 默认跳过 · 手动触发: RUN_LIVE_TESTS=1 pnpm playwright test tests/e2e/ip-flow-9-steps.spec.ts --project=chromium
    test.skip(
      !process.env.RUN_LIVE_TESTS,
      '手动跑: RUN_LIVE_TESTS=1 pnpm playwright test tests/e2e/ip-flow-9-steps.spec.ts --project=chromium',
    );

    // AC-2: 桌面视口 (desktop-only 元素需要 1280px)
    await page.setViewportSize({ width: 1280, height: 720 });

    // AC-15: 监听控制台错误
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    // ── 登录 ──────────────────────────────────────────────────────────────────
    await page.goto(`${API_BASE}/auth/login`);
    await page.waitForURL(`${WEB_BASE}/**`);
    await page.waitForSelector('[data-testid="app-header"]');

    // ── AC-3: 创建新 IP 账号 ──────────────────────────────────────────────────
    const acc = (await trpcMutate(page, 'ipAccounts.create', {
      name: `e2e-9steps-${Date.now()}`,
      platform: 'douyin',
      industry: 'medical',
      stage: 'start',
    })) as { id: number };
    expect(acc.id).toBeGreaterThan(0);

    // ── AC-4: 切换账号 + clearLsNamespace(AGENTS.md §11.5) + reload ──────────
    await trpcMutate(page, 'ipAccounts.switchActive', { accountId: acc.id });
    await page.evaluate((accountId: number) => {
      const prefix = `aiip_memory_acc_${accountId}_`;
      const toRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k?.startsWith(prefix)) toRemove.push(k);
      }
      toRemove.forEach((k) => localStorage.removeItem(k));
    }, acc.id);
    await page.reload();
    await page.waitForSelector('[data-testid="app-header"]');

    // ── AC-5: step1 — 行业选择 (PositioningAgent · industry mode) ────────────
    await page.goto(`${WEB_BASE}/step/1`);
    await page.waitForSelector('[data-testid="step-form-step1"]');
    // 打开行业下拉框 → 选「医疗健康」
    await page.getByTestId('step-form-step1').getByRole('combobox').click();
    await page.getByRole('option', { name: '医疗健康' }).click();
    await page.getByRole('button', { name: /开始生成/ }).click();
    // AC-5: 等 LLM < 60s · 显示 result
    await expect(page.getByTestId('step-result-step1')).toBeVisible({ timeout: 60_000 });

    // ── AC-6: step3 — 账号包装 (BrandingAgent · packaging mode) ─────────────
    await page.goto(`${WEB_BASE}/step/3`);
    await page.waitForSelector('[data-testid="step-form-step3"]');
    await page.getByTestId('step-form-step3').getByRole('combobox').click();
    await page.getByRole('option', { name: /抖音/ }).click();
    await page.getByPlaceholder('描述你的职业、背景、经历（至少20字）').fill(
      '医疗健康行业专业人士，有10年临床经验，专注分享医学科普与健康养生知识',
    );
    await page.getByPlaceholder('描述你的目标受众（至少5字）').fill('关注健康养生的都市白领和中老年群体');
    await page.getByRole('button', { name: /开始生成/ }).click();
    await expect(page.getByTestId('step-result-step3')).toBeVisible({ timeout: 60_000 });

    // ── AC-7: step3b — 人设定制 (BrandingAgent · persona mode) ──────────────
    await page.goto(`${WEB_BASE}/step/3b`);
    await page.waitForSelector('[data-testid="step-form-step3b"]');
    await page.getByTestId('step-form-step3b').getByRole('combobox').click();
    await page.getByRole('option', { name: /抖音/ }).click();
    await page.getByPlaceholder('详细描述你的职业、背景、经历（至少50字）').fill(
      '从事医疗健康行业超过十年，拥有丰富的临床实践经验与医学科普知识，致力于用通俗易懂的语言分享专业医学知识，帮助普通人做出更健康的生活决策和就医选择。',
    );
    await page.getByPlaceholder('描述你的目标受众').fill('关注健康养生的都市中青年');
    await page.getByPlaceholder('你有哪些独特优势？').fill('专业医学背景，十年临床经验，擅长简单化复杂医学知识');
    await page.getByPlaceholder('分享一个能体现你价值观的故事').fill(
      '曾帮助一位误信偏方的患者及时就医，避免了严重健康后果，这让我深刻意识到医学科普的重要性。',
    );
    await page.getByRole('button', { name: /开始生成/ }).click();
    await expect(page.getByTestId('step-result-step3b')).toBeVisible({ timeout: 45_000 });

    // ── AC-8: step4 — 执行计划 (PositioningAgent · execution mode) ──────────
    await page.goto(`${WEB_BASE}/step/4`);
    await page.waitForSelector('[data-testid="step-form-step4"]');
    const form4 = page.getByTestId('step-form-step4');
    // 平台 (combobox nth 0)
    await form4.getByRole('combobox').nth(0).click();
    await page.getByRole('option', { name: /抖音/ }).click();
    // 粉丝量 (combobox nth 1)
    await form4.getByRole('combobox').nth(1).click();
    await page.getByRole('option', { name: /0–1千/ }).click();
    // 个人信息 ≥50 chars
    await page.getByPlaceholder('详细描述你的背景和现状（至少50字）').fill(
      '医疗健康领域内容创作者，专注分享医学科普知识超过一年，粉丝以关注健康的都市中青年为主，账号刚起步，希望在抖音快速积累医疗健康领域的精准粉丝群体。',
    );
    // 目标 (combobox nth 2)
    await form4.getByRole('combobox').nth(2).click();
    await page.getByRole('option', { name: /从零起号/ }).click();
    await page.getByRole('button', { name: /开始生成/ }).click();
    await expect(page.getByTestId('step-result-step4')).toBeVisible({ timeout: 60_000 });

    // ── AC-9: step4b — 变现路径 (MonetizationAgent) ──────────────────────────
    await page.goto(`${WEB_BASE}/step/4b`);
    await page.waitForSelector('[data-testid="step-form-step4b"]');
    const form4b = page.getByTestId('step-form-step4b');
    // 产品描述 ≥20 chars
    await page.getByPlaceholder('描述你的产品或服务（至少20字）').fill(
      '医学健康科普付费专栏，提供专业的医疗健康咨询和健康管理方案服务',
    );
    await page.getByPlaceholder('描述你的目标买家').fill('关注健康养生的都市中青年');
    await page.getByPlaceholder('你的IP定位方向').fill('医疗健康科普专家');
    // 营收 (only combobox in step4b)
    await form4b.getByRole('combobox').click();
    await page.getByRole('option', { name: /尚未变现/ }).click();
    await page.getByRole('button', { name: /开始生成/ }).click();
    await expect(page.getByTestId('step-result-step4b')).toBeVisible({ timeout: 45_000 });

    // ── AC-10: step5 — 爆款选题 (TopicAgent · streaming · category=traffic) ──
    await page.goto(`${WEB_BASE}/step/5`);
    await page.waitForSelector('[data-testid="step-form-step5"]');
    const form5 = page.getByTestId('step-form-step5');
    // 行业 (text input, 非 IndustrySelect)
    await page.getByPlaceholder('例如：教育、美妆、健康').fill('医疗健康');
    // 产品 ≥5 chars
    await page.getByPlaceholder('你的核心产品或服务是什么？（至少5字）').fill('医学科普与健康管理咨询服务');
    // 选题类别 = traffic (引流涨粉)
    await form5.getByRole('combobox').click();
    await page.getByRole('option', { name: '引流涨粉' }).click();
    await page.getByRole('button', { name: /开始生成/ }).click();
    // AC-10: 等 LLM 流式 < 60s · 显示 20 选题
    await expect(page.getByTestId('step-result-step5')).toBeVisible({ timeout: 60_000 });

    // ── AC-11: step6 — 拍摄计划 (VideoAgent · shooting mode) ────────────────
    await page.goto(`${WEB_BASE}/step/6`);
    await page.waitForSelector('[data-testid="step-form-step6"]');
    // 文案源 ≥50 chars
    await page.getByPlaceholder('粘贴你的原始文案或脚本（至少50字）').fill(
      '今天给大家分享高血压管理的重要知识：高血压患者应该如何正确用药？很多患者以为血压正常了就可以停药，这是非常危险的认知误区。高血压是慢性病，需要长期规范用药，不能自行停药或减药，否则会引起严重并发症。',
    );
    await page.getByRole('button', { name: /开始生成/ }).click();
    await expect(page.getByTestId('step-result-step6')).toBeVisible({ timeout: 45_000 });

    // ── AC-12: step7 — 文案生成 (CopywritingAgent · streaming · markdown) ────
    await page.goto(`${WEB_BASE}/step/7`);
    await page.waitForSelector('[data-testid="step-form-step7"]');
    const form7 = page.getByTestId('step-form-step7');
    // 脚本类型
    await form7.getByRole('combobox').click();
    await page.getByRole('option', { name: '聊观点' }).click();
    // 爆款元素 (optional · click 1 for realism)
    await form7.getByRole('button', { name: '猎奇' }).click();
    // 话题方向
    await page.getByPlaceholder('例如：减肥打卡 / 职场晋升 / 亲子教育').fill('高血压患者日常饮食禁忌与正确用药');
    await page.getByRole('button', { name: /开始生成/ }).click();
    // AC-12: 等 LLM 流式 < 60s · 显示 markdown 文案
    await expect(page.getByTestId('step-result-step7')).toBeVisible({ timeout: 60_000 });

    // ── AC-13: step8 — 直播话术 (LivestreamAgent · 2 段话术) ────────────────
    await page.goto(`${WEB_BASE}/step/8`);
    await page.waitForSelector('[data-testid="step-form-step8"]');
    const form8 = page.getByTestId('step-form-step8');
    // 平台 (combobox nth 0)
    await form8.getByRole('combobox').nth(0).click();
    await page.getByRole('option', { name: /抖音/ }).click();
    await page.getByPlaceholder('描述你要直播销售的产品').fill('健康养生付费课程和医疗咨询服务');
    await page.getByPlaceholder('描述你的直播目标观众').fill('关注健康的中青年群体');
    // 经验 (combobox nth 1)
    await form8.getByRole('combobox').nth(1).click();
    await page.getByRole('option', { name: /新手/ }).click();
    await page.getByRole('button', { name: /开始生成/ }).click();
    // AC-13: 等 LLM < 30s · 显示 2 段直播话术
    await expect(page.getByTestId('step-result-step8')).toBeVisible({ timeout: 30_000 });

    // ── AC-14: /ip-plan 显示 9/9 + 9 个 step 全高亮 ─────────────────────────
    await page.goto(`${WEB_BASE}/ip-plan`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('ip-plan-page')).toBeVisible();
    // 9/9 进度文字
    await expect(page.getByText(/9\/9/)).toBeVisible({ timeout: 5_000 });
    // 9 步全部 data-status="completed"
    for (const key of [
      'step1', 'step3', 'step3b', 'step4', 'step4b',
      'step5', 'step6', 'step7', 'step8',
    ]) {
      await expect(page.getByTestId(`step-${key}`)).toHaveAttribute('data-status', 'completed');
    }

    // ── AC-15: 无控制台错误 ───────────────────────────────────────────────────
    const criticalErrors = consoleErrors.filter(
      (e) =>
        !e.includes('ResizeObserver') &&
        !e.includes('favicon') &&
        !e.includes('[vite]') &&
        !e.includes('Warning:'),
    );
    expect(criticalErrors, `控制台错误:\n${criticalErrors.join('\n')}`).toHaveLength(0);
  });
});
