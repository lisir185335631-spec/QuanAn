# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: prd-19-frontend-backend.spec.ts >> PRD-19 · frontend ↔ backend 真接入 >> test (c) · 9 step 完整流程 · DB 真存 · 0 hardcode acc_step{N}
- Location: e2e/prd-19-frontend-backend.spec.ts:256:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=流量型')
Expected: visible
Error: strict mode violation: locator('text=流量型') resolved to 2 elements:
    1) <p class="text-body-md text-muted-foreground mb-8">输入你的行业和产品信息，还可以上传产品资料和人物介绍文档，AI 将结合这些素材一次性生成 5 大类…</p> aka getByText('输入你的行业和产品信息，还可以上传产品资料和人物介绍文档，')
    2) <button role="tab" type="button" tabindex="-1" data-state="active" aria-selected="true" data-orientation="horizontal" data-radix-collection-item="" id="radix-:rr:-trigger-traffic" aria-controls="radix-:rr:-content-traffic" class="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-5…>流量型</button> aka getByRole('tab', { name: '流量型' })

Call log:
  - Expect "toBeVisible" with timeout 30000ms
  - waiting for locator('text=流量型')

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - region "Notifications alt+T"
  - banner [ref=e3]:
    - generic [ref=e4]:
      - generic [ref=e6]: QuanQn
      - navigation [ref=e8]:
        - button "创作" [ref=e9] [cursor=pointer]:
          - generic [ref=e10]: 创作
          - img
        - button "策划" [ref=e11] [cursor=pointer]:
          - generic [ref=e12]: 策划
          - img
        - button "智能" [ref=e13] [cursor=pointer]:
          - generic [ref=e14]: 智能
          - img
        - button "更多" [ref=e15] [cursor=pointer]:
          - generic [ref=e16]: 更多
          - img
      - generic [ref=e19]:
        - button "IP 账号切换" [ref=e20] [cursor=pointer]:
          - img
          - generic [ref=e21]: AI 创业者小张
          - img
        - generic [ref=e26]: Dev User
        - button "退出登录" [ref=e27] [cursor=pointer]:
          - img
  - main [ref=e28]:
    - paragraph [ref=e29]: STEP 05 · 爆款选题库
    - heading "爆款选题库" [level=1] [ref=e30]
    - paragraph [ref=e31]: 输入你的行业和产品信息，还可以上传产品资料和人物介绍文档，AI 将结合这些素材一次性生成 5 大类爆款选题（流量型/变现型/人设型/认知型/案例型），每类 20 个选题，共 100 个。
    - generic [ref=e32]:
      - generic [ref=e33]:
        - generic [ref=e34]: 你的行业*
        - textbox "例如：美业、餐饮、教育培训、服装..." [ref=e35]: 美食
      - generic [ref=e36]:
        - generic [ref=e37]: 你的产品/服务*
        - textbox "例如：皮肤管理项目、火锅加盟、英语培训课..." [ref=e38]: 家常菜制作分享
      - generic [ref=e39]:
        - generic [ref=e40]: 上传产品资料
        - paragraph [ref=e41]: 产品介绍、卖点、价格体系、客户案例等。支持 PDF、Word、TXT、Markdown、CSV（最大 20MB）
        - button "Choose File" [ref=e42] [cursor=pointer]
      - generic [ref=e43]:
        - generic [ref=e44]: 上传人物介绍与行业
        - paragraph [ref=e45]: 个人经历、行业背景、专业资质、从业故事等。支持 PDF、Word、TXT、Markdown、CSV（最大 20MB）
        - button "Choose File" [ref=e46] [cursor=pointer]
      - button "一键生成 5大类 爆款选题" [ref=e47] [cursor=pointer]
    - generic [ref=e49]:
      - img [ref=e50]
      - paragraph [ref=e52]: AI 正在生成 100 个爆款选题，预计 60-120 秒...
  - generic [ref=e54]:
    - generic [ref=e55]: 内容有帮助吗？
    - button "有帮助" [ref=e56] [cursor=pointer]:
      - img
    - button "没帮助" [ref=e57] [cursor=pointer]:
      - img
```

# Test source

```ts
  227 |     expect(String(JSON.parse(lsB!).industryLabel)).toContain('美妆');
  228 |     expect(String(JSON.parse(lsB!).industryLabel)).not.toContain('美食');
  229 | 
  230 |     // Verify B's DB has '美妆' — RLS returns B's row only
  231 |     const dbB = await queryStepData(page, 'step1');
  232 |     expect(dbB).not.toBeNull();
  233 |     expect(String((dbB!.inputs as Record<string, unknown>).industryLabel)).toContain('美妆');
  234 |     expect(String((dbB!.inputs as Record<string, unknown>).industryLabel)).not.toContain('美食');
  235 | 
  236 |     // ── Switch back to Account A (clears B's LS, reloads) ──
  237 |     await page.locator('[data-testid="account-switcher-trigger"]').click();
  238 |     await page.locator(`[data-testid="account-switcher-item-${accAId}"]`).waitFor({ timeout: 5_000 });
  239 |     await page.locator(`[data-testid="account-switcher-item-${accAId}"]`).click();
  240 |     await page.waitForLoadState('load');
  241 | 
  242 |     await page.goto(`${BASE_URL}/step/1`);
  243 |     await expect(page.locator('h1').first()).toContainText('选择你的行业赛道', { timeout: 10_000 });
  244 | 
  245 |     // A's LS was cleared by the B→A switch; page now fetches from DB
  246 |     await expect(page.locator('text=行业洞察报告')).toBeVisible({ timeout: 15_000 });
  247 | 
  248 |     // Verify A's DB still has '美食' — B's '美妆' did not contaminate A
  249 |     const dbA2 = await queryStepData(page, 'step1');
  250 |     expect(dbA2).not.toBeNull();
  251 |     expect(String((dbA2!.inputs as Record<string, unknown>).industryLabel)).toContain('美食');
  252 |     expect(String((dbA2!.inputs as Record<string, unknown>).industryLabel)).not.toContain('美妆');
  253 |   });
  254 | 
  255 |   // ─── test (c): 9 step 完整流程 ───────────────────────────────────────────────
  256 |   test('test (c) · 9 step 完整流程 · DB 真存 · 0 hardcode acc_step{N}', async ({ page }) => {
  257 |     // Long timeout: 9 steps × up to 30s each = 270s + overhead
  258 |     test.setTimeout(360_000);
  259 | 
  260 |     // Clear ALL step data for a fresh 9-step run
  261 |     // (beforeEach only cleared step1; prior prd-19 runs may have written other steps)
  262 |     await clearStepDataForTest(page, ['step1', 'step3', 'step3b', 'step4', 'step4b', 'step5', 'step6', 'step7', 'step8']);
  263 | 
  264 |     // ── Step 1 ─────────────────────────────────────────────────────────────────
  265 |     await page.goto(`${BASE_URL}/step/1`);
  266 |     await expect(page.locator('h1').first()).toContainText('选择你的行业赛道', { timeout: 15_000 });
  267 |     const accountId = await getActiveAccountId(page);
  268 |     expect(accountId).not.toBeNull();
  269 | 
  270 |     await submitStep1(page, '美食');
  271 |     expect(await getStepLs(page, accountId!, 'step1')).not.toBeNull();
  272 | 
  273 |     // Navigate to Step 3 via "进入 IP 定位 →"
  274 |     await page.locator('button', { hasText: '进入 IP 定位 →' }).click();
  275 |     await page.waitForURL('**/step/3', { timeout: 10_000 });
  276 | 
  277 |     // ── Step 3 ─────────────────────────────────────────────────────────────────
  278 |     await expect(page.locator('h1').first()).toContainText('账号包装方案', { timeout: 10_000 });
  279 |     await page.locator('textarea').first().fill(
  280 |       '我是一名有10年经验的美食博主，记录家常菜制作，帮助300+粉丝学会厨艺。',
  281 |     );
  282 |     await page.locator('label[for="douyin"]').click();
  283 |     await page.locator('button[type="submit"]', { hasText: '生成账号包装方案' }).click();
  284 |     // Wait for step3-output section (unique ID — avoids strict-mode multi-match on heading text)
  285 |     await expect(page.locator('#step3-output')).toBeVisible({ timeout: 30_000 });
  286 |     expect(await getStepLs(page, accountId!, 'step3')).not.toBeNull();
  287 | 
  288 |     // ── Step 3b ────────────────────────────────────────────────────────────────
  289 |     await page.goto(`${BASE_URL}/step/3b`);
  290 |     await expect(page.locator('h1').first()).toContainText('人设定制方案', { timeout: 10_000 });
  291 |     await page.locator('label[for="step3b-douyin"]').click();
  292 |     await page.locator('button[type="submit"]', { hasText: '生成专属人设方案' }).click();
  293 |     // Wait for step3b-output section (unique ID)
  294 |     await expect(page.locator('#step3b-output')).toBeVisible({ timeout: 30_000 });
  295 |     expect(await getStepLs(page, accountId!, 'step3b')).not.toBeNull();
  296 | 
  297 |     // ── Step 4 ─────────────────────────────────────────────────────────────────
  298 |     await page.goto(`${BASE_URL}/step/4`);
  299 |     await expect(page.locator('h1').first()).toContainText('执行计划', { timeout: 10_000 });
  300 |     await page.locator('label[for="step4-platform-douyin"]').click();
  301 |     await page.locator('button[type="submit"]', { hasText: '生成执行计划' }).click();
  302 |     await expect(page.locator('h3').filter({ hasText: '1. 每日任务表' })).toBeVisible({
  303 |       timeout: 30_000,
  304 |     });
  305 |     expect(await getStepLs(page, accountId!, 'step4')).not.toBeNull();
  306 | 
  307 |     // ── Step 4b ────────────────────────────────────────────────────────────────
  308 |     await page.goto(`${BASE_URL}/step/4b`);
  309 |     await expect(page.locator('h1').first()).toContainText('变现路径', { timeout: 10_000 });
  310 |     await page.locator('textarea').first().fill(
  311 |       '美食类特色农产品，展示家乡特产，客单价50-200元',
  312 |     );
  313 |     await page.locator('button[type="submit"]', { hasText: '生成变现路径' }).click();
  314 |     await expect(page.locator('h3').filter({ hasText: '1. 市场分析' })).toBeVisible({
  315 |       timeout: 30_000,
  316 |     });
  317 |     expect(await getStepLs(page, accountId!, 'step4b')).not.toBeNull();
  318 | 
  319 |     // ── Step 5 (SSE saveStream) ────────────────────────────────────────────────
  320 |     await page.goto(`${BASE_URL}/step/5`);
  321 |     await expect(page.locator('h1').first()).toContainText('爆款选题库', { timeout: 10_000 });
  322 |     // Fill 2 required inputs: industry + product
  323 |     await page.locator('input').nth(0).fill('美食');
  324 |     await page.locator('input').nth(1).fill('家常菜制作分享');
  325 |     await page.locator('button', { hasText: '一键生成 5大类 爆款选题' }).click();
  326 |     // Wait for any category tab to appear (streaming complete)
> 327 |     await expect(page.locator('text=流量型')).toBeVisible({ timeout: 30_000 });
      |                                            ^ Error: expect(locator).toBeVisible() failed
  328 |     expect(await getStepLs(page, accountId!, 'step5')).not.toBeNull();
  329 | 
  330 |     // ── Step 6 ─────────────────────────────────────────────────────────────────
  331 |     await page.goto(`${BASE_URL}/step/6`);
  332 |     await expect(page.locator('h1').first()).toContainText('拍摄计划', { timeout: 10_000 });
  333 |     await page.locator('textarea').first().fill(
  334 |       '美食博主如何用抖音获客100个精准粉丝，这是实操分享，帮你快速起号变现。',
  335 |     );
  336 |     await page.locator('button[type="submit"]', { hasText: '生成拍摄计划' }).click();
  337 |     await expect(page.locator('h3').filter({ hasText: '1. 分镜脚本' })).toBeVisible({
  338 |       timeout: 30_000,
  339 |     });
  340 |     expect(await getStepLs(page, accountId!, 'step6')).not.toBeNull();
  341 | 
  342 |     // ── Step 7 ─────────────────────────────────────────────────────────────────
  343 |     await page.goto(`${BASE_URL}/step/7`);
  344 |     await expect(page.locator('h1').first()).toContainText('文案生成', { timeout: 10_000 });
  345 |     await page.locator('textarea').first().fill('美食博主要不要专注一个垂类还是多元发展？正反方辩论');
  346 |     await page.locator('button[type="submit"]', { hasText: '生成爆款文案' }).click();
  347 |     await expect(page.locator('h4').filter({ hasText: '话题抛出' })).toBeVisible({
  348 |       timeout: 30_000,
  349 |     });
  350 |     expect(await getStepLs(page, accountId!, 'step7')).not.toBeNull();
  351 | 
  352 |     // ── Step 8 ─────────────────────────────────────────────────────────────────
  353 |     await page.goto(`${BASE_URL}/step/8`);
  354 |     await expect(page.locator('h1').first()).toContainText('直播策划', { timeout: 10_000 });
  355 |     // Sub-function 1 (generate_plan) is active by default
  356 |     await expect(page.locator('button', { hasText: '子功能 1：生成直播方案' })).toBeVisible();
  357 |     // Fill product textarea
  358 |     await page.locator('textarea').first().fill(
  359 |       '家常菜直播，分享健康营养食谱，帮助粉丝学会做饭',
  360 |     );
  361 |     await page.locator('button[type="submit"]', { hasText: '生成直播方案' }).click();
  362 |     await expect(page.locator('h3').filter({ hasText: '1. 开场话术' })).toBeVisible({
  363 |       timeout: 30_000,
  364 |     });
  365 |     expect(await getStepLs(page, accountId!, 'step8')).not.toBeNull();
  366 | 
  367 |     // ── AC: 0 hardcode localStorage.setItem('acc_step{N}') in source ───────────
  368 |     const grepOutput = execSync(
  369 |       `grep -rn "localStorage.setItem.*acc_step" "${PROJECT_ROOT}/apps/web/src/pages/step/" || true`,
  370 |     )
  371 |       .toString()
  372 |       .trim();
  373 |     expect(grepOutput, '期望 src/pages/step/ 中 0 hardcode acc_step{N} LS key').toBe('');
  374 |   });
  375 | 
  376 |   // ─── test (d): zero-regression ───────────────────────────────────────────────
  377 |   test('test (d) · zero-regression · typecheck + vitest + 旧 e2e prd-17/18', async () => {
  378 |     // 10 min: typecheck ~10s + vitest ~20s + playwright prd-17/18 ~3min
  379 |     test.setTimeout(600_000);
  380 | 
  381 |     // 1. Typecheck (whole project)
  382 |     try {
  383 |       execSync('pnpm typecheck', {
  384 |         cwd: PROJECT_ROOT,
  385 |         stdio: 'pipe',
  386 |         timeout: 120_000,
  387 |       });
  388 |     } catch (e) {
  389 |       throw new Error(`pnpm typecheck failed:\n${(e as NodeJS.ErrnoException).message}`);
  390 |     }
  391 | 
  392 |     // 2. Vitest unit tests (119+ tests)
  393 |     try {
  394 |       execSync('pnpm vitest run', {
  395 |         cwd: PROJECT_ROOT,
  396 |         stdio: 'pipe',
  397 |         timeout: 120_000,
  398 |       });
  399 |     } catch (e) {
  400 |       throw new Error(`pnpm vitest run failed:\n${(e as NodeJS.ErrnoException).message}`);
  401 |     }
  402 | 
  403 |     // 3. 旧 e2e specs (prd-17 + prd-18) — reuseExistingServer picks up running dev server
  404 |     try {
  405 |       execSync(
  406 |         'pnpm playwright test e2e/prd-17-step1-3-3b.spec.ts e2e/prd-18-step-4-5-6-7-8.spec.ts',
  407 |         {
  408 |           cwd: WEB_DIR,
  409 |           stdio: 'pipe',
  410 |           timeout: 300_000,
  411 |         },
  412 |       );
  413 |     } catch (e) {
  414 |       throw new Error(`旧 e2e specs failed:\n${(e as NodeJS.ErrnoException).message}`);
  415 |     }
  416 |   });
  417 | });
  418 | 
```