# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: prd-19-frontend-backend.spec.ts >> PRD-19 · frontend ↔ backend 真接入 >> test (c) · 9 step 完整流程 · DB 真存 · 0 hardcode acc_step{N}
- Location: e2e/prd-19-frontend-backend.spec.ts:250:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('h3').filter({ hasText: '1. 每日任务表' })
Expected: visible
Timeout: 30000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 30000ms
  - waiting for locator('h3').filter({ hasText: '1. 每日任务表' })

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
          - generic [ref=e21]: OPC 经营者老王
          - img
        - generic [ref=e26]: Dev User
        - button "退出登录" [ref=e27] [cursor=pointer]:
          - img
  - main [ref=e28]:
    - paragraph [ref=e29]: STEP 04 · 制定执行计划
    - heading "执行计划" [level=1] [ref=e30]
    - paragraph [ref=e31]: 当前行业：餐饮美食。AI 将为你制定每天具体做什么、每周里程碑、每个阶段 KPI 的可执行运营计划。
    - generic [ref=e32]:
      - generic [ref=e33]:
        - generic [ref=e34]: 选择平台*
        - generic [ref=e35]:
          - generic [ref=e36] [cursor=pointer]:
            - radio "📱 抖音" [checked] [ref=e37]
            - generic [ref=e38]: 📱 抖音
          - generic [ref=e39] [cursor=pointer]:
            - radio "📕 小红书" [ref=e40]
            - generic [ref=e41]: 📕 小红书
          - generic [ref=e42] [cursor=pointer]:
            - radio "📺 视频号" [ref=e43]
            - generic [ref=e44]: 📺 视频号
          - generic [ref=e45] [cursor=pointer]:
            - radio "🎬 快手" [ref=e46]
            - generic [ref=e47]: 🎬 快手
          - generic [ref=e48] [cursor=pointer]:
            - radio "📺 B站" [ref=e49]
            - generic [ref=e50]: 📺 B站
      - generic [ref=e51]:
        - generic [ref=e52]: 当前粉丝量
        - textbox "如：0 / 500 / 1万 / 10万" [ref=e53]
      - generic [ref=e54]:
        - generic [ref=e55]: 目标
        - textbox "如：3个月涨粉1万、月入5万" [ref=e56]
      - generic [ref=e57]:
        - generic [ref=e58]: 个人信息
        - textbox "描述你的情况，比如： - 每天可投入2小时 - 有实体店/线上课程 - 擅长口播/拍摄" [ref=e59]:
          - /placeholder: "描述你的情况，比如：\n- 每天可投入2小时\n- 有实体店/线上课程\n- 擅长口播/拍摄"
      - button "生成执行计划" [ref=e60] [cursor=pointer]
    - generic [ref=e62]:
      - generic [ref=e63]:
        - heading "执行计划" [level=3] [ref=e64]
        - button "复制" [ref=e65] [cursor=pointer]:
          - img
          - text: 复制
      - article [ref=e66]:
        - heading "执行计划" [level=1] [ref=e67]
        - blockquote [ref=e68]:
          - paragraph [ref=e69]: ⚠️ 系统繁忙，以下为通用备用执行计划，请稍后重试获取针对您 IP 定位的个性化方案。
        - heading "第一阶段：账号冷启动（第 1-30 天）" [level=2] [ref=e70]
        - paragraph [ref=e71]:
          - strong [ref=e72]: 核心目标：
          - text: 完成账号基础建设，发布首批优质内容，建立初步粉丝基础。
        - heading "行动步骤" [level=3] [ref=e73]
        - list [ref=e74]:
          - listitem [ref=e75]:
            - paragraph [ref=e76]:
              - strong [ref=e77]: 账号资料完善
            - list [ref=e78]:
              - listitem [ref=e79]: 设置专业头像（建议使用真人照片，增强信任感）
              - listitem [ref=e80]: 撰写有吸引力的账号简介（突出价值主张，包含关键词）
              - listitem [ref=e81]: 制作统一风格的背景图与封面模板
          - listitem [ref=e82]:
            - paragraph [ref=e83]:
              - strong [ref=e84]: 内容规划
            - list [ref=e85]:
              - listitem [ref=e86]: 确定核心内容方向（建议聚焦 2-3 个内容支柱）
              - listitem [ref=e87]: 制定内容日历（建议每周更新 3-5 条）
              - listitem [ref=e88]: 准备首批 5-10 条内容备稿，确保冷启动期的稳定产出
          - listitem [ref=e89]:
            - paragraph [ref=e90]:
              - strong [ref=e91]: 平台适配
            - list [ref=e92]:
              - listitem [ref=e93]: 研究目标平台算法规则与流量分配机制
              - listitem [ref=e94]: 了解同领域头部账号的内容策略与爆款结构
              - listitem [ref=e95]: 测试不同内容形式（图文/短视频/直播）的数据表现
        - heading "第二阶段：内容矩阵搭建（第 31-90 天）" [level=2] [ref=e96]
        - paragraph [ref=e97]:
          - strong [ref=e98]: 核心目标：
          - text: 建立稳定内容输出体系，实现自然增粉。
        - heading "行动步骤" [level=3] [ref=e99]
        - list [ref=e100]:
          - listitem [ref=e101]:
            - paragraph [ref=e102]:
              - strong [ref=e103]: 内容系列化
            - list [ref=e104]:
              - listitem [ref=e105]: 建立固定内容栏目（系列感增强用户黏性）
              - listitem [ref=e106]: 开发爆款选题公式（结合热点 + 垂直领域）
              - listitem [ref=e107]: 打造个人 IP 标签，强化用户记忆点
          - listitem [ref=e108]:
            - paragraph [ref=e109]:
              - strong [ref=e110]: 互动运营
            - list [ref=e111]:
              - listitem [ref=e112]: 积极回复评论区互动，建立社区氛围
              - listitem [ref=e113]: 与同领域创作者互关互推，扩大曝光
              - listitem [ref=e114]: 发起话题讨论，提升用户参与度
        - heading "第三阶段：商业化启动（第 91-180 天）" [level=2] [ref=e115]
        - paragraph [ref=e116]:
          - strong [ref=e117]: 核心目标：
          - text: 粉丝达到变现门槛，启动初步商业合作。
        - heading "行动步骤" [level=3] [ref=e118]
        - list [ref=e119]:
          - listitem [ref=e120]:
            - paragraph [ref=e121]:
              - strong [ref=e122]: 变现布局
            - list [ref=e123]:
              - listitem [ref=e124]: 粉丝突破 1000/1 万里程碑，解锁直播、橱窗等功能
              - listitem [ref=e125]: 品牌合作：主动对接品牌方，提供数据报告
              - listitem [ref=e126]: 知识付费：考虑推出付费课程或社群
          - listitem [ref=e127]:
            - paragraph [ref=e128]:
              - strong [ref=e129]: 私域沉淀
            - list [ref=e130]:
              - listitem [ref=e131]: 将粉丝引导至微信、私域社群
              - listitem [ref=e132]: 建立会员体系，提升用户粘性
              - listitem [ref=e133]: 开发高价值内容产品，实现规模化变现
        - separator [ref=e134]
        - blockquote [ref=e135]:
          - paragraph [ref=e136]: 💡 以上为通用备用执行计划，实际执行计划需结合您的行业特点与个人资源定制。
        - paragraph [ref=e137]: 请稍后重试，AI 将根据您的行业定位与目标受众生成专属执行计划，包含更精准的时间节点、可执行的增粉策略以及针对您行业特点的差异化内容建议。每个阶段的目标与行动项均会根据您的实际情况定制，确保落地可执行。
  - generic [ref=e139]:
    - generic [ref=e140]: 内容有帮助吗？
    - button "有帮助" [ref=e141] [cursor=pointer]:
      - img
    - button "没帮助" [ref=e142] [cursor=pointer]:
      - img
```

# Test source

```ts
  196 |     // Verify A's DB
  197 |     const dbA1 = await queryStepData(page, 'step1');
  198 |     expect(dbA1).not.toBeNull();
  199 |     expect(String((dbA1!.inputs as Record<string, unknown>).industryLabel)).toContain('美食');
  200 | 
  201 |     // ── Switch to Account B (clears A's LS, reloads) ──
  202 |     await page.locator('[data-testid="account-switcher-trigger"]').click();
  203 |     await page.locator(`[data-testid="account-switcher-item-${accBId}"]`).waitFor({ timeout: 5_000 });
  204 |     await page.locator(`[data-testid="account-switcher-item-${accBId}"]`).click();
  205 |     await page.waitForLoadState('load');
  206 | 
  207 |     await page.goto(`${BASE_URL}/step/1`);
  208 |     await expect(page.locator('h1').first()).toContainText('选择你的行业赛道', { timeout: 10_000 });
  209 | 
  210 |     // Clear accB's step1 data to ensure fresh submission (accB may have pre-existing data)
  211 |     await clearStepDataForTest(page, ['step1']);
  212 |     await page.reload();
  213 |     await expect(page.locator('h1').first()).toContainText('选择你的行业赛道', { timeout: 10_000 });
  214 | 
  215 |     // Account B: select '美妆护肤'
  216 |     await submitStep1(page, '美妆');
  217 | 
  218 |     // Verify B's LS has '美妆' (NOT A's '美食')
  219 |     const lsB = await getStepLs(page, accBId, 'step1');
  220 |     expect(lsB, 'Account B LS should have step1').not.toBeNull();
  221 |     expect(String(JSON.parse(lsB!).industryLabel)).toContain('美妆');
  222 |     expect(String(JSON.parse(lsB!).industryLabel)).not.toContain('美食');
  223 | 
  224 |     // Verify B's DB has '美妆' — RLS returns B's row only
  225 |     const dbB = await queryStepData(page, 'step1');
  226 |     expect(dbB).not.toBeNull();
  227 |     expect(String((dbB!.inputs as Record<string, unknown>).industryLabel)).toContain('美妆');
  228 |     expect(String((dbB!.inputs as Record<string, unknown>).industryLabel)).not.toContain('美食');
  229 | 
  230 |     // ── Switch back to Account A (clears B's LS, reloads) ──
  231 |     await page.locator('[data-testid="account-switcher-trigger"]').click();
  232 |     await page.locator(`[data-testid="account-switcher-item-${accAId}"]`).waitFor({ timeout: 5_000 });
  233 |     await page.locator(`[data-testid="account-switcher-item-${accAId}"]`).click();
  234 |     await page.waitForLoadState('load');
  235 | 
  236 |     await page.goto(`${BASE_URL}/step/1`);
  237 |     await expect(page.locator('h1').first()).toContainText('选择你的行业赛道', { timeout: 10_000 });
  238 | 
  239 |     // A's LS was cleared by the B→A switch; page now fetches from DB
  240 |     await expect(page.locator('text=行业洞察报告')).toBeVisible({ timeout: 15_000 });
  241 | 
  242 |     // Verify A's DB still has '美食' — B's '美妆' did not contaminate A
  243 |     const dbA2 = await queryStepData(page, 'step1');
  244 |     expect(dbA2).not.toBeNull();
  245 |     expect(String((dbA2!.inputs as Record<string, unknown>).industryLabel)).toContain('美食');
  246 |     expect(String((dbA2!.inputs as Record<string, unknown>).industryLabel)).not.toContain('美妆');
  247 |   });
  248 | 
  249 |   // ─── test (c): 9 step 完整流程 ───────────────────────────────────────────────
  250 |   test('test (c) · 9 step 完整流程 · DB 真存 · 0 hardcode acc_step{N}', async ({ page }) => {
  251 |     // Long timeout: 9 steps × up to 30s each = 270s + overhead
  252 |     test.setTimeout(360_000);
  253 | 
  254 |     // Clear ALL step data for a fresh 9-step run
  255 |     // (beforeEach only cleared step1; prior prd-19 runs may have written other steps)
  256 |     await clearStepDataForTest(page, ['step1', 'step3', 'step3b', 'step4', 'step4b', 'step5', 'step6', 'step7', 'step8']);
  257 | 
  258 |     // ── Step 1 ─────────────────────────────────────────────────────────────────
  259 |     await page.goto(`${BASE_URL}/step/1`);
  260 |     await expect(page.locator('h1').first()).toContainText('选择你的行业赛道', { timeout: 15_000 });
  261 |     const accountId = await getActiveAccountId(page);
  262 |     expect(accountId).not.toBeNull();
  263 | 
  264 |     await submitStep1(page, '美食');
  265 |     expect(await getStepLs(page, accountId!, 'step1')).not.toBeNull();
  266 | 
  267 |     // Navigate to Step 3 via "进入 IP 定位 →"
  268 |     await page.locator('button', { hasText: '进入 IP 定位 →' }).click();
  269 |     await page.waitForURL('**/step/3', { timeout: 10_000 });
  270 | 
  271 |     // ── Step 3 ─────────────────────────────────────────────────────────────────
  272 |     await expect(page.locator('h1').first()).toContainText('账号包装方案', { timeout: 10_000 });
  273 |     await page.locator('textarea').first().fill(
  274 |       '我是一名有10年经验的美食博主，记录家常菜制作，帮助300+粉丝学会厨艺。',
  275 |     );
  276 |     await page.locator('label[for="douyin"]').click();
  277 |     await page.locator('button[type="submit"]', { hasText: '生成账号包装方案' }).click();
  278 |     // Wait for step3-output section (unique ID — avoids strict-mode multi-match on heading text)
  279 |     await expect(page.locator('#step3-output')).toBeVisible({ timeout: 30_000 });
  280 |     expect(await getStepLs(page, accountId!, 'step3')).not.toBeNull();
  281 | 
  282 |     // ── Step 3b ────────────────────────────────────────────────────────────────
  283 |     await page.goto(`${BASE_URL}/step/3b`);
  284 |     await expect(page.locator('h1').first()).toContainText('人设定制方案', { timeout: 10_000 });
  285 |     await page.locator('label[for="step3b-douyin"]').click();
  286 |     await page.locator('button[type="submit"]', { hasText: '生成专属人设方案' }).click();
  287 |     // Wait for step3b-output section (unique ID)
  288 |     await expect(page.locator('#step3b-output')).toBeVisible({ timeout: 30_000 });
  289 |     expect(await getStepLs(page, accountId!, 'step3b')).not.toBeNull();
  290 | 
  291 |     // ── Step 4 ─────────────────────────────────────────────────────────────────
  292 |     await page.goto(`${BASE_URL}/step/4`);
  293 |     await expect(page.locator('h1').first()).toContainText('执行计划', { timeout: 10_000 });
  294 |     await page.locator('label[for="step4-platform-douyin"]').click();
  295 |     await page.locator('button[type="submit"]', { hasText: '生成执行计划' }).click();
> 296 |     await expect(page.locator('h3').filter({ hasText: '1. 每日任务表' })).toBeVisible({
      |                                                                      ^ Error: expect(locator).toBeVisible() failed
  297 |       timeout: 30_000,
  298 |     });
  299 |     expect(await getStepLs(page, accountId!, 'step4')).not.toBeNull();
  300 | 
  301 |     // ── Step 4b ────────────────────────────────────────────────────────────────
  302 |     await page.goto(`${BASE_URL}/step/4b`);
  303 |     await expect(page.locator('h1').first()).toContainText('变现路径', { timeout: 10_000 });
  304 |     await page.locator('textarea').first().fill(
  305 |       '美食类特色农产品，展示家乡特产，客单价50-200元',
  306 |     );
  307 |     await page.locator('button[type="submit"]', { hasText: '生成变现路径' }).click();
  308 |     await expect(page.locator('h3').filter({ hasText: '1. 市场分析' })).toBeVisible({
  309 |       timeout: 30_000,
  310 |     });
  311 |     expect(await getStepLs(page, accountId!, 'step4b')).not.toBeNull();
  312 | 
  313 |     // ── Step 5 (SSE saveStream) ────────────────────────────────────────────────
  314 |     await page.goto(`${BASE_URL}/step/5`);
  315 |     await expect(page.locator('h1').first()).toContainText('爆款选题库', { timeout: 10_000 });
  316 |     // Fill 2 required inputs: industry + product
  317 |     await page.locator('input').nth(0).fill('美食');
  318 |     await page.locator('input').nth(1).fill('家常菜制作分享');
  319 |     await page.locator('button', { hasText: '一键生成 5大类 爆款选题' }).click();
  320 |     // Wait for any category tab to appear (streaming complete)
  321 |     await expect(page.locator('text=流量型')).toBeVisible({ timeout: 30_000 });
  322 |     expect(await getStepLs(page, accountId!, 'step5')).not.toBeNull();
  323 | 
  324 |     // ── Step 6 ─────────────────────────────────────────────────────────────────
  325 |     await page.goto(`${BASE_URL}/step/6`);
  326 |     await expect(page.locator('h1').first()).toContainText('拍摄计划', { timeout: 10_000 });
  327 |     await page.locator('textarea').first().fill(
  328 |       '美食博主如何用抖音获客100个精准粉丝，这是实操分享，帮你快速起号变现。',
  329 |     );
  330 |     await page.locator('button[type="submit"]', { hasText: '生成拍摄计划' }).click();
  331 |     await expect(page.locator('h3').filter({ hasText: '1. 分镜脚本' })).toBeVisible({
  332 |       timeout: 30_000,
  333 |     });
  334 |     expect(await getStepLs(page, accountId!, 'step6')).not.toBeNull();
  335 | 
  336 |     // ── Step 7 ─────────────────────────────────────────────────────────────────
  337 |     await page.goto(`${BASE_URL}/step/7`);
  338 |     await expect(page.locator('h1').first()).toContainText('文案生成', { timeout: 10_000 });
  339 |     await page.locator('textarea').first().fill('美食博主要不要专注一个垂类还是多元发展？正反方辩论');
  340 |     await page.locator('button[type="submit"]', { hasText: '生成爆款文案' }).click();
  341 |     await expect(page.locator('h4').filter({ hasText: '话题抛出' })).toBeVisible({
  342 |       timeout: 30_000,
  343 |     });
  344 |     expect(await getStepLs(page, accountId!, 'step7')).not.toBeNull();
  345 | 
  346 |     // ── Step 8 ─────────────────────────────────────────────────────────────────
  347 |     await page.goto(`${BASE_URL}/step/8`);
  348 |     await expect(page.locator('h1').first()).toContainText('直播策划', { timeout: 10_000 });
  349 |     // Sub-function 1 (generate_plan) is active by default
  350 |     await expect(page.locator('button', { hasText: '子功能 1：生成直播方案' })).toBeVisible();
  351 |     // Fill product textarea
  352 |     await page.locator('textarea').first().fill(
  353 |       '家常菜直播，分享健康营养食谱，帮助粉丝学会做饭',
  354 |     );
  355 |     await page.locator('button[type="submit"]', { hasText: '生成直播方案' }).click();
  356 |     await expect(page.locator('h3').filter({ hasText: '1. 开场话术' })).toBeVisible({
  357 |       timeout: 30_000,
  358 |     });
  359 |     expect(await getStepLs(page, accountId!, 'step8')).not.toBeNull();
  360 | 
  361 |     // ── AC: 0 hardcode localStorage.setItem('acc_step{N}') in source ───────────
  362 |     const grepOutput = execSync(
  363 |       `grep -rn "localStorage.setItem.*acc_step" "${PROJECT_ROOT}/apps/web/src/pages/step/" || true`,
  364 |     )
  365 |       .toString()
  366 |       .trim();
  367 |     expect(grepOutput, '期望 src/pages/step/ 中 0 hardcode acc_step{N} LS key').toBe('');
  368 |   });
  369 | 
  370 |   // ─── test (d): zero-regression ───────────────────────────────────────────────
  371 |   test('test (d) · zero-regression · typecheck + vitest + 旧 e2e prd-17/18', async () => {
  372 |     // 10 min: typecheck ~10s + vitest ~20s + playwright prd-17/18 ~3min
  373 |     test.setTimeout(600_000);
  374 | 
  375 |     // 1. Typecheck (whole project)
  376 |     try {
  377 |       execSync('pnpm typecheck', {
  378 |         cwd: PROJECT_ROOT,
  379 |         stdio: 'pipe',
  380 |         timeout: 120_000,
  381 |       });
  382 |     } catch (e) {
  383 |       throw new Error(`pnpm typecheck failed:\n${(e as NodeJS.ErrnoException).message}`);
  384 |     }
  385 | 
  386 |     // 2. Vitest unit tests (119+ tests)
  387 |     try {
  388 |       execSync('pnpm vitest run', {
  389 |         cwd: PROJECT_ROOT,
  390 |         stdio: 'pipe',
  391 |         timeout: 120_000,
  392 |       });
  393 |     } catch (e) {
  394 |       throw new Error(`pnpm vitest run failed:\n${(e as NodeJS.ErrnoException).message}`);
  395 |     }
  396 | 
```