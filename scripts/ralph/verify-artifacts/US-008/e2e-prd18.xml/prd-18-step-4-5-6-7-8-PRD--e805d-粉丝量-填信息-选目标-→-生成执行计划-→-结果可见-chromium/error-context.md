# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: prd-18-step-4-5-6-7-8.spec.ts >> PRD-18 Step 4 → 4b → 5 → 6 → 7 → 8 E2E >> test 1 · Step 4 · 选平台 + 粉丝量 + 填信息 + 选目标 → 生成执行计划 → 结果可见
- Location: e2e/prd-18-step-4-5-6-7-8.spec.ts:62:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('[data-testid="step-result-step4"]')
Expected: visible
Timeout: 30000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 30000ms
  - waiting for locator('[data-testid="step-result-step4"]')

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - region "Notifications alt+T"
  - banner [ref=e3]:
    - generic [ref=e4]:
      - generic [ref=e6]: QuanQn
      - generic [ref=e7]:
        - button "IP 账号切换" [ref=e8] [cursor=pointer]:
          - img
          - generic [ref=e9]: E2E 测试号
          - img
        - button "工具入口" [ref=e10] [cursor=pointer]:
          - img
          - generic [ref=e11]: 工具
          - img
      - button "用户菜单" [ref=e14] [cursor=pointer]:
        - generic [ref=e16]: DU
  - main [ref=e17]:
    - heading "内容生产准备" [level=1] [ref=e18]
    - paragraph [ref=e19]: 搭建内容生产 SOP，选型工具与工作流
    - generic [ref=e20]:
      - generic [ref=e21]:
        - generic [ref=e22]: 主要平台*
        - combobox "主要平台*" [ref=e23] [cursor=pointer]:
          - generic: 📱 抖音
          - img [ref=e24]
        - combobox [ref=e26]
      - generic [ref=e27]:
        - generic [ref=e28]: 当前粉丝数量*
        - combobox "当前粉丝数量*" [ref=e29] [cursor=pointer]:
          - generic: 0–1千
          - img [ref=e30]
        - combobox [ref=e32]
      - generic [ref=e33]:
        - generic [ref=e34]: 个人信息*
        - textbox "详细描述你的背景和现状（至少50字）" [ref=e35]: 我是美业从业者，在皮肤管理领域工作多年，希望通过短视频分享专业护肤知识，帮助更多人解决肌肤困扰，建立专业 IP 形象。
      - generic [ref=e36]:
        - generic [ref=e37]: 当前目标*
        - combobox "当前目标*" [ref=e38] [cursor=pointer]:
          - generic: 从零起号
          - img [ref=e39]
        - combobox [ref=e41]
      - button "开始生成" [ref=e42] [cursor=pointer]
  - generic [ref=e44]:
    - generic [ref=e45]: 内容有帮助吗？
    - button "有帮助" [ref=e46] [cursor=pointer]:
      - img
    - button "没帮助" [ref=e47] [cursor=pointer]:
      - img
```

# Test source

```ts
  1   | /**
  2   |  * PRD-18 US-013 — E2E 集成验收 (updated for StepForm/StepResult abstraction)
  3   |  * Step 4 → 4b → 5 → 6 → 7 → 8 完整流程
  4   |  * AC: consoleErrors === [] 硬门禁 · 6 截图 · data-testid result 可见
  5   |  * TD-82 fix: test 3 (5 tab SSE) requires real LLM — skip without OPENAI_API_KEY
  6   |  *
  7   |  * Auth: test.beforeEach logs in via mock OAuth + creates + activates an IP account
  8   |  * so that stepData.save (protectedProcedure) can succeed.
  9   |  */
  10  | import * as path from 'path';
  11  | import { fileURLToPath } from 'url';
  12  | import { test, expect } from '@playwright/test';
  13  | 
  14  | const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:5173';
  15  | const API_BASE = process.env.VITE_API_BASE_URL ?? 'http://localhost:3000';
  16  | const __dirname = path.dirname(fileURLToPath(import.meta.url));
  17  | const RESULTS_DIR = path.join(__dirname, '..', 'test-results');
  18  | 
  19  | const HAS_OPENAI_KEY = !!process.env.OPENAI_API_KEY;
  20  | 
  21  | type TrpcResult = { result: { data: unknown } };
  22  | 
  23  | async function trpcMutate(
  24  |   page: import('@playwright/test').Page,
  25  |   procedure: string,
  26  |   input: unknown,
  27  | ): Promise<unknown> {
  28  |   return page.evaluate(
  29  |     async ({ base, proc, inp }: { base: string; proc: string; inp: unknown }) => {
  30  |       const res = await fetch(`${base}/trpc/${proc}?batch=1`, {
  31  |         method: 'POST',
  32  |         headers: { 'Content-Type': 'application/json' },
  33  |         body: JSON.stringify({ '0': inp }),
  34  |         credentials: 'include',
  35  |       });
  36  |       const data = (await res.json()) as TrpcResult[];
  37  |       return data[0]?.result?.data;
  38  |     },
  39  |     { base: API_BASE, proc: procedure, inp: input },
  40  |   );
  41  | }
  42  | 
  43  | test.describe('PRD-18 Step 4 → 4b → 5 → 6 → 7 → 8 E2E', () => {
  44  |   test.beforeEach(async ({ page }) => {
  45  |     await page.setViewportSize({ width: 1280, height: 720 });
  46  |     // Login via mock OAuth (OAUTH_PROVIDER=mock · skips CSRF)
  47  |     await page.goto(`${API_BASE}/auth/login`);
  48  |     await page.waitForURL(`${BASE_URL}/**`);
  49  |     // Wait for user to appear in header (indicates session is active)
  50  |     await expect(page.locator('[data-testid="header-user-trigger"]')).toBeVisible({ timeout: 10_000 });
  51  |     // Create a fresh IP account for this test and set it as active
  52  |     const acc = await trpcMutate(page, 'ipAccounts.create', {
  53  |       name: 'E2E 测试号',
  54  |       industry: '美业',
  55  |       platform: '抖音',
  56  |       stage: '初创',
  57  |     }) as { id: number };
  58  |     await trpcMutate(page, 'ipAccounts.switchActive', { accountId: acc.id });
  59  |   });
  60  | 
  61  |   // ─── test 1: Step 4 ──────────────────────────────────────────────────────────
  62  |   test('test 1 · Step 4 · 选平台 + 粉丝量 + 填信息 + 选目标 → 生成执行计划 → 结果可见', async ({ page }) => {
  63  |     const consoleErrors: string[] = [];
  64  |     page.on('console', (msg) => {
  65  |       if (msg.type() === 'error') consoleErrors.push(msg.text());
  66  |     });
  67  | 
  68  |     await page.goto(`${BASE_URL}/step/4`);
  69  |     await expect(page.locator('h1').first()).toContainText('内容生产准备', { timeout: 10_000 });
  70  | 
  71  |     // Select platform via Radix Select
  72  |     await page.locator('#platform-select').click();
  73  |     await page.getByRole('option', { name: /抖音/ }).click();
  74  | 
  75  |     // Select followers range
  76  |     await page.locator('#step4-followers').click();
  77  |     await page.getByRole('option', { name: /0.*1千/ }).click();
  78  | 
  79  |     // Fill personal info (min 50 chars)
  80  |     await page.locator('[data-testid="step-form-step4"] textarea').first().fill(
  81  |       '我是美业从业者，在皮肤管理领域工作多年，希望通过短视频分享专业护肤知识，帮助更多人解决肌肤困扰，建立专业 IP 形象。',
  82  |     );
  83  | 
  84  |     // Select goals
  85  |     await page.locator('#step4-goals').click();
  86  |     await page.getByRole('option', { name: '从零起号' }).click();
  87  | 
  88  |     // Submit
  89  |     await page.locator('button[type="submit"]').click();
  90  | 
  91  |     // Wait for result component to appear
> 92  |     await expect(page.locator('[data-testid="step-result-step4"]')).toBeVisible({ timeout: 30_000 });
      |                                                                     ^ Error: expect(locator).toBeVisible() failed
  93  | 
  94  |     await page.screenshot({ path: path.join(RESULTS_DIR, 'prd-18-step-4.png') });
  95  | 
  96  |     const unexpectedErrors = consoleErrors.filter(
  97  |       (e) => !e.includes('subscription') && !e.includes('ERR_CONNECTION_REFUSED'),
  98  |     );
  99  |     expect(unexpectedErrors, `Console errors: ${consoleErrors.join(', ')}`).toEqual([]);
  100 |   });
  101 | 
  102 |   // ─── test 2: Step 4b ─────────────────────────────────────────────────────────
  103 |   test('test 2 · Step 4b · 填产品描述 + 选营收 → 生成变现路径 → 结果可见', async ({ page }) => {
  104 |     const consoleErrors: string[] = [];
  105 |     page.on('console', (msg) => {
  106 |       if (msg.type() === 'error') consoleErrors.push(msg.text());
  107 |     });
  108 | 
  109 |     await page.goto(`${BASE_URL}/step/4b`);
  110 |     await expect(page.locator('h1').first()).toContainText('变现规划', { timeout: 10_000 });
  111 | 
  112 |     // Fill product description (min 20 chars)
  113 |     await page.locator('[data-testid="step-form-step4b"] textarea').first().fill(
  114 |       '专业皮肤管理服务，提供光子嫩肤、热玛吉等医美项目，客单价 2000-10000 元',
  115 |     );
  116 | 
  117 |     // Select revenue range
  118 |     await page.locator('#step4b-revenue').click();
  119 |     await page.getByRole('option', { name: '尚未变现' }).click();
  120 | 
  121 |     // Submit
  122 |     await page.locator('button[type="submit"]').click();
  123 | 
  124 |     // Wait for result
  125 |     await expect(page.locator('[data-testid="step-result-step4b"]')).toBeVisible({ timeout: 30_000 });
  126 |     // Verify key result sections (Step4bResult renders CardTitles)
  127 |     await expect(page.locator('text=现状分析').first()).toBeVisible();
  128 | 
  129 |     await page.screenshot({ path: path.join(RESULTS_DIR, 'prd-18-step-4b.png') });
  130 | 
  131 |     const unexpectedErrors = consoleErrors.filter(
  132 |       (e) => !e.includes('subscription') && !e.includes('ERR_CONNECTION_REFUSED'),
  133 |     );
  134 |     expect(unexpectedErrors, `Console errors: ${consoleErrors.join(', ')}`).toEqual([]);
  135 |   });
  136 | 
  137 |   // ─── test 3: Step 5 → Step 7 链路 ────────────────────────────────────────────
  138 |   // TD-82: requires real LLM SSE to produce 5 chunks (5 tab 渐进 visible)
  139 |   test('test 3 · Step 5 → 5 tabs 100 选题 → 点选题 → 跳 step7 主题预填', async ({ page }) => {
  140 |     test.skip(!HAS_OPENAI_KEY, 'requires OPENAI_API_KEY for real LLM 5 tab SSE');
  141 | 
  142 |     const consoleErrors: string[] = [];
  143 |     page.on('console', (msg) => {
  144 |       if (msg.type() === 'error') consoleErrors.push(msg.text());
  145 |     });
  146 | 
  147 |     await page.goto(`${BASE_URL}/step/5`);
  148 |     await page.evaluate(() => localStorage.clear());
  149 | 
  150 |     await expect(page.locator('h1')).toContainText('爆款选题库', { timeout: 10_000 });
  151 | 
  152 |     // AC: step tag (Step5 still renders STEP5_STEP_TAG constant)
  153 |     await expect(page.locator('text=STEP 05 · 爆款选题库')).toBeVisible();
  154 | 
  155 |     // 填 2 必填 input
  156 |     await page.locator('input').nth(0).fill('美业');
  157 |     await page.locator('input').nth(1).fill('专业皮肤管理项目');
  158 | 
  159 |     // 提交生成
  160 |     await page.locator('button', { hasText: '一键生成 5大类 爆款选题' }).click();
  161 | 
  162 |     // 等 5 类 tab — 流量型 先出；后续 4 类等 SSE 流续出，给足 30s
  163 |     await expect(page.getByRole('tab', { name: '流量型' })).toBeVisible({ timeout: 15_000 });
  164 |     await expect(page.getByRole('tab', { name: '变现型' })).toBeVisible({ timeout: 30_000 });
  165 |     await expect(page.getByRole('tab', { name: '人设型' })).toBeVisible({ timeout: 30_000 });
  166 |     await expect(page.getByRole('tab', { name: '认知型' })).toBeVisible({ timeout: 30_000 });
  167 |     await expect(page.getByRole('tab', { name: '案例型' })).toBeVisible({ timeout: 30_000 });
  168 | 
  169 |     // 当前 tab(流量型) 下应有 20 个选题 card
  170 |     const topicCards = page.locator('[role="tabpanel"] button');
  171 |     await expect(topicCards).toHaveCount(20, { timeout: 10_000 });
  172 | 
  173 |     await page.screenshot({ path: path.join(RESULTS_DIR, 'prd-18-step-5.png') });
  174 | 
  175 |     // 点第一个选题 → 跳 /step/7 + 主题预填
  176 |     const firstTopic = topicCards.first();
  177 |     await firstTopic.click();
  178 | 
  179 |     // 等待跳转到 step/7
  180 |     await page.waitForURL('**/step/7', { timeout: 10_000 });
  181 |     await expect(page.locator('h1').first()).toContainText('变现规划', { timeout: 10_000 });
  182 | 
  183 |     // 主题 input 应已预填 (acc_step5_selected_topic.title)
  184 |     const topicInput = page.locator('#step7-topic');
  185 |     const prefilledValue = await topicInput.inputValue();
  186 |     expect(
  187 |       prefilledValue.length,
  188 |       `Step7 topic input should be prefilled from Step5 selected topic, got: "${prefilledValue}"`,
  189 |     ).toBeGreaterThan(0);
  190 | 
  191 |     expect(consoleErrors, `Console errors: ${consoleErrors.join(', ')}`).toEqual([]);
  192 |   });
```