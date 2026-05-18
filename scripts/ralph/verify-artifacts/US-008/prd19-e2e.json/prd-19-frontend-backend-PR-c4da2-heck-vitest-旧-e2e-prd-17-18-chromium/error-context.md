# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: prd-19-frontend-backend.spec.ts >> PRD-19 · frontend ↔ backend 真接入 >> test (d) · zero-regression · typecheck + vitest + 旧 e2e prd-17/18
- Location: e2e/prd-19-frontend-backend.spec.ts:371:3

# Error details

```
Error: 旧 e2e specs failed:
Command failed: pnpm playwright test e2e/prd-17-step1-3-3b.spec.ts e2e/prd-18-step-4-5-6-7-8.spec.ts
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
    - paragraph [ref=e29]: STEP 01 · 选择行业赛道
    - heading "选择你的行业赛道" [level=1] [ref=e30]
    - paragraph [ref=e31]: 覆盖抖音、视频号等主流平台的 56+ 个细分行业。你也可以自定义输入行业。
    - textbox "搜索行业名称或关键词（如：美容院、餐饮、教育...）" [ref=e33]
    - generic [ref=e34]:
      - button "🌐 全部行业 (56)" [ref=e35] [cursor=pointer]
      - button "🏠 生活服务 (18)" [ref=e36] [cursor=pointer]
      - button "🛒 电商零售 (13)" [ref=e37] [cursor=pointer]
      - button "✍️ 内容创作 (7)" [ref=e38] [cursor=pointer]
      - button "💼 专业服务 (14)" [ref=e39] [cursor=pointer]
      - button "🏭 产业制造 (4)" [ref=e40] [cursor=pointer]
    - generic [ref=e41]:
      - generic [ref=e42] [cursor=pointer]:
        - generic [ref=e43]: 💅
        - generic [ref=e44]: 美业
      - generic [ref=e45] [cursor=pointer]:
        - generic [ref=e46]: 💄
        - generic [ref=e47]: 美妆护肤
      - generic [ref=e48] [cursor=pointer]:
        - generic [ref=e49]: 🍜
        - generic [ref=e50]: 餐饮美食
      - generic [ref=e51] [cursor=pointer]:
        - generic [ref=e52]: ☕
        - generic [ref=e53]: 茶饮咖啡
      - generic [ref=e54] [cursor=pointer]:
        - generic [ref=e55]: 🍷
        - generic [ref=e56]: 酒水
      - generic [ref=e57] [cursor=pointer]:
        - generic [ref=e58]: 🏥
        - generic [ref=e59]: 健康养生
      - generic [ref=e60] [cursor=pointer]:
        - generic [ref=e61]: 🩺
        - generic [ref=e62]: 医疗健康
      - generic [ref=e63] [cursor=pointer]:
        - generic [ref=e64]: 🧠
        - generic [ref=e65]: 心理咨询
      - generic [ref=e66] [cursor=pointer]:
        - generic [ref=e67]: 💪
        - generic [ref=e68]: 运动健身
      - generic [ref=e69] [cursor=pointer]:
        - generic [ref=e70]: ⚽
        - generic [ref=e71]: 体育运动
      - generic [ref=e72] [cursor=pointer]:
        - generic [ref=e73]: 👶
        - generic [ref=e74]: 母婴亲子
      - generic [ref=e75] [cursor=pointer]:
        - generic [ref=e76]: ✈️
        - generic [ref=e77]: 旅游出行
      - generic [ref=e78] [cursor=pointer]:
        - generic [ref=e79]: 🐾
        - generic [ref=e80]: 宠物
      - generic [ref=e81] [cursor=pointer]:
        - generic [ref=e82]: 💍
        - generic [ref=e83]: 婚庆婚嫁
      - generic [ref=e84] [cursor=pointer]:
        - generic [ref=e85]: 📍
        - generic [ref=e86]: 本地生活
      - generic [ref=e87] [cursor=pointer]:
        - generic [ref=e88]: 🧹
        - generic [ref=e89]: 家政服务
      - generic [ref=e90] [cursor=pointer]:
        - generic [ref=e91]: 📦
        - generic [ref=e92]: 物流快递
      - generic [ref=e93] [cursor=pointer]:
        - generic [ref=e94]: 🔧
        - generic [ref=e95]: 汽车服务
      - generic [ref=e96] [cursor=pointer]:
        - generic [ref=e97]: 👗
        - generic [ref=e98]: 服装穿搭
      - generic [ref=e99] [cursor=pointer]:
        - generic [ref=e100]: 👜
        - generic [ref=e101]: 奢侈品
      - generic [ref=e102] [cursor=pointer]:
        - generic [ref=e103]: 👟
        - generic [ref=e104]: 鞋靴箱包
      - generic [ref=e105] [cursor=pointer]:
        - generic [ref=e106]: 🚗
        - generic [ref=e107]: 汽车
      - generic [ref=e108] [cursor=pointer]:
        - generic [ref=e109]: 🛒
        - generic [ref=e110]: 电商零售
      - generic [ref=e111] [cursor=pointer]:
        - generic [ref=e112]: 🥬
        - generic [ref=e113]: 生鲜配送
      - generic [ref=e114] [cursor=pointer]:
        - generic [ref=e115]: 📺
        - generic [ref=e116]: 家电
      - generic [ref=e117] [cursor=pointer]:
        - generic [ref=e118]: 🛋️
        - generic [ref=e119]: 家装家居
      - generic [ref=e120] [cursor=pointer]:
        - generic [ref=e121]: 💎
        - generic [ref=e122]: 珠宝饰品
      - generic [ref=e123] [cursor=pointer]:
        - generic [ref=e124]: 💊
        - generic [ref=e125]: 营养保健
      - generic [ref=e126] [cursor=pointer]:
        - generic [ref=e127]: 🧴
        - generic [ref=e128]: 日用百货
      - generic [ref=e129] [cursor=pointer]:
        - generic [ref=e130]: 📖
        - generic [ref=e131]: 图书文创
      - generic [ref=e132] [cursor=pointer]:
        - generic [ref=e133]: ♻️
        - generic [ref=e134]: 二手闲置
      - generic [ref=e135] [cursor=pointer]:
        - generic [ref=e136]: 📲
        - generic [ref=e137]: 自媒体运营
      - generic [ref=e138] [cursor=pointer]:
        - generic [ref=e139]: 📷
        - generic [ref=e140]: 摄影摄像
      - generic [ref=e141] [cursor=pointer]:
        - generic [ref=e142]: 🎨
        - generic [ref=e143]: 设计创意
      - generic [ref=e144] [cursor=pointer]:
        - generic [ref=e145]: 🎮
        - generic [ref=e146]: 游戏
      - generic [ref=e147] [cursor=pointer]:
        - generic [ref=e148]: 🎬
        - generic [ref=e149]: 娱乐
      - generic [ref=e150] [cursor=pointer]:
        - generic [ref=e151]: 📰
        - generic [ref=e152]: 文化传媒
      - generic [ref=e153] [cursor=pointer]:
        - generic [ref=e154]: ❤️
        - generic [ref=e155]: 情感社交
      - generic [ref=e156] [cursor=pointer]:
        - generic [ref=e157]: 📚
        - generic [ref=e158]: 教育培训
      - generic [ref=e159] [cursor=pointer]:
        - generic [ref=e160]: 🎒
        - generic [ref=e161]: K12教育
      - generic [ref=e162] [cursor=pointer]:
        - generic [ref=e163]: 🧒
        - generic [ref=e164]: 早教托育
      - generic [ref=e165] [cursor=pointer]:
        - generic [ref=e166]: 🎨
        - generic [ref=e167]: 艺术培训
      - generic [ref=e168] [cursor=pointer]:
        - generic [ref=e169]: 🌍
        - generic [ref=e170]: 语言培训
      - generic [ref=e171] [cursor=pointer]:
        - generic [ref=e172]: 💻
        - generic [ref=e173]: IT培训
      - generic [ref=e174] [cursor=pointer]:
        - generic [ref=e175]: 🏠
        - generic [ref=e176]: 房产
      - generic [ref=e177] [cursor=pointer]:
        - generic [ref=e178]: 💰
        - generic [ref=e179]: 金融理财
      - generic [ref=e180] [cursor=pointer]:
        - generic [ref=e181]: 📱
        - generic [ref=e182]: 科技数码
      - generic [ref=e183] [cursor=pointer]:
        - generic [ref=e184]: ⚖️
        - generic [ref=e185]: 法律咨询
      - generic [ref=e186] [cursor=pointer]:
        - generic [ref=e187]: 🤝
        - generic [ref=e188]: 招商加盟
      - generic [ref=e189] [cursor=pointer]:
        - generic [ref=e190]: 👔
        - generic [ref=e191]: 人力招聘
      - generic [ref=e192] [cursor=pointer]:
        - generic [ref=e193]: 🏢
        - generic [ref=e194]: 企业服务
      - generic [ref=e195] [cursor=pointer]:
        - generic [ref=e196]: 🏛️
        - generic [ref=e197]: 政务公益
      - generic [ref=e198] [cursor=pointer]:
        - generic [ref=e199]: 🌾
        - generic [ref=e200]: 农业农村
      - generic [ref=e201] [cursor=pointer]:
        - generic [ref=e202]: 🏭
        - generic [ref=e203]: 工业制造
      - generic [ref=e204] [cursor=pointer]:
        - generic [ref=e205]: 🏗️
        - generic [ref=e206]: 建筑工程
      - generic [ref=e207] [cursor=pointer]:
        - generic [ref=e208]: 🔧
        - generic [ref=e209]: 其他行业
    - button "自定义输入行业" [ref=e211] [cursor=pointer]
    - generic [ref=e212]:
      - button "生成行业洞察" [disabled] [ref=e213]
      - paragraph [ref=e214]: 请先选择一个行业
    - generic [ref=e216]:
      - heading "行业洞察报告" [level=2] [ref=e217]
      - generic [ref=e218]:
        - generic [ref=e219]:
          - heading "市场分析" [level=3] [ref=e220]
          - paragraph [ref=e221]: 系统繁忙，暂时无法完成市场分析。当前内容市场竞争激烈，但垂直细分领域仍有较大增长空间。建议您围绕自身专业优势，打造差异化内容，持续输出有价值的内容以建立粉丝信任。稍后重试可获取更精准的市场分析数据与竞品洞察报告。
        - generic [ref=e222]:
          - heading "竞争程度" [level=3] [ref=e223]
          - paragraph [ref=e224]: 中等竞争
        - generic [ref=e225]:
          - heading "定位建议" [level=3] [ref=e226]
          - paragraph [ref=e227]: 建议稍后重试，AI 将根据您的行业背景输出差异化定位建议。目前可先聚焦您最擅长的细分领域，从小处着手，逐步建立专业权威形象。
      - button "进入 IP 定位 →" [ref=e229] [cursor=pointer]
  - generic [ref=e231]:
    - generic [ref=e232]: 内容有帮助吗？
    - button "有帮助" [ref=e233] [cursor=pointer]:
      - img
    - button "没帮助" [ref=e234] [cursor=pointer]:
      - img
```

# Test source

```ts
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
  397 |     // 3. 旧 e2e specs (prd-17 + prd-18) — reuseExistingServer picks up running dev server
  398 |     try {
  399 |       execSync(
  400 |         'pnpm playwright test e2e/prd-17-step1-3-3b.spec.ts e2e/prd-18-step-4-5-6-7-8.spec.ts',
  401 |         {
  402 |           cwd: WEB_DIR,
  403 |           stdio: 'pipe',
  404 |           timeout: 300_000,
  405 |         },
  406 |       );
  407 |     } catch (e) {
> 408 |       throw new Error(`旧 e2e specs failed:\n${(e as NodeJS.ErrnoException).message}`);
      |             ^ Error: 旧 e2e specs failed:
  409 |     }
  410 |   });
  411 | });
  412 | 
```