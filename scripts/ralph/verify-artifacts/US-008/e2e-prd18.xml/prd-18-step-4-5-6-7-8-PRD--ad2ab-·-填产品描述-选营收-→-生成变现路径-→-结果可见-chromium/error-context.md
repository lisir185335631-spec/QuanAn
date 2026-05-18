# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: prd-18-step-4-5-6-7-8.spec.ts >> PRD-18 Step 4 → 4b → 5 → 6 → 7 → 8 E2E >> test 2 · Step 4b · 填产品描述 + 选营收 → 生成变现路径 → 结果可见
- Location: e2e/prd-18-step-4-5-6-7-8.spec.ts:103:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('[data-testid="step-result-step4b"]')
Expected: visible
Timeout: 30000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 30000ms
  - waiting for locator('[data-testid="step-result-step4b"]')

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
    - heading "变现规划" [level=1] [ref=e18]
    - paragraph [ref=e19]: 制定你的 IP 变现路径和商业模式
    - generic [ref=e20]:
      - generic [ref=e21]:
        - generic [ref=e22]: 产品/服务描述*
        - textbox "描述你的产品或服务（至少20字）" [ref=e23]: 专业皮肤管理服务，提供光子嫩肤、热玛吉等医美项目，客单价 2000-10000 元
      - generic [ref=e24]:
        - text: 目标受众
        - textbox "描述你的目标买家" [ref=e25]
      - generic [ref=e26]:
        - text: IP 定位
        - textbox "IP 定位" [ref=e27]:
          - /placeholder: 你的IP定位方向
      - generic [ref=e28]:
        - generic [ref=e29]: 当前营收*
        - combobox "当前营收*" [ref=e30] [cursor=pointer]:
          - generic: 尚未变现
          - img [ref=e31]
        - combobox [ref=e33]
      - button "开始生成" [ref=e34] [cursor=pointer]
  - generic [ref=e36]:
    - generic [ref=e37]: 内容有帮助吗？
    - button "有帮助" [ref=e38] [cursor=pointer]:
      - img
    - button "没帮助" [ref=e39] [cursor=pointer]:
      - img
```

# Test source

```ts
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
  92  |     await expect(page.locator('[data-testid="step-result-step4"]')).toBeVisible({ timeout: 30_000 });
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
> 125 |     await expect(page.locator('[data-testid="step-result-step4b"]')).toBeVisible({ timeout: 30_000 });
      |                                                                      ^ Error: expect(locator).toBeVisible() failed
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
  193 | 
  194 |   // ─── test 4: Step 6 ──────────────────────────────────────────────────────────
  195 |   test('test 4 · Step 6 · 粘贴文案 → 生成分镜表 → 分镜表可见', async ({ page }) => {
  196 |     const consoleErrors: string[] = [];
  197 |     page.on('console', (msg) => {
  198 |       if (msg.type() === 'error') consoleErrors.push(msg.text());
  199 |     });
  200 | 
  201 |     await page.goto(`${BASE_URL}/step/6`);
  202 |     await expect(page.locator('h1').first()).toContainText('数据分析与复盘', { timeout: 10_000 });
  203 | 
  204 |     // 粘贴文案 (≥50 字)
  205 |     const textarea = page.locator('textarea').first();
  206 |     await textarea.fill('美容院如何用抖音获客100个精准客户，这是一个实操分享，帮助你快速起号变现。通过精准的内容策略和互动运营，实现从流量到客户的转化。');
  207 | 
  208 |     // 提交
  209 |     await page.locator('button[type="submit"]').click();
  210 | 
  211 |     // Wait for result (Step6Result renders "分镜表" card)
  212 |     await expect(page.locator('[data-testid="step-result-step6"]')).toBeVisible({ timeout: 30_000 });
  213 |     await expect(page.locator('text=分镜表').first()).toBeVisible();
  214 | 
  215 |     await page.screenshot({ path: path.join(RESULTS_DIR, 'prd-18-step-6.png') });
  216 | 
  217 |     const unexpectedErrors = consoleErrors.filter(
  218 |       (e) => !e.includes('subscription') && !e.includes('ERR_CONNECTION_REFUSED'),
  219 |     );
  220 |     expect(unexpectedErrors, `Console errors: ${consoleErrors.join(', ')}`).toEqual([]);
  221 |   });
  222 | 
  223 |   // ─── test 5: Step 7 ──────────────────────────────────────────────────────────
  224 |   test('test 5 · Step 7 · 选脚本类型 + 填话题 → 生成文案 → 结果可见', async ({ page }) => {
  225 |     const consoleErrors: string[] = [];
```