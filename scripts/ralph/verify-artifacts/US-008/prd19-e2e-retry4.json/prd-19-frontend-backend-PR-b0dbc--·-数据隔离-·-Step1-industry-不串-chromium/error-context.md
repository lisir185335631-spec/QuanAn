# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: prd-19-frontend-backend.spec.ts >> PRD-19 · frontend ↔ backend 真接入 >> test (b) · acc 切换 · 数据隔离 · Step1 industry 不串
- Location: e2e/prd-19-frontend-backend.spec.ts:170:3

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Expected substring: "美食"
Received string:    "美妆护肤"
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
  151 |     await submitStep1(page, '美食');
  152 | 
  153 |     // AC-2: Verify LS mirror has been written
  154 |     const lsRaw = await getStepLs(page, accountId!, 'step1');
  155 |     expect(lsRaw, `LS key aiip_memory_acc_${accountId}_step1 should exist`).not.toBeNull();
  156 |     const lsData = JSON.parse(lsRaw!) as Record<string, unknown>;
  157 |     expect(String(lsData.industryLabel)).toContain('美食');
  158 | 
  159 |     // AC-2: Verify DB row via tRPC stepData.get (RLS auto-filters to active account)
  160 |     const dbRow = await queryStepData(page, 'step1');
  161 |     expect(dbRow, 'stepData.get should return non-null row').not.toBeNull();
  162 |     expect(String((dbRow!.inputs as Record<string, unknown>).industryLabel)).toContain('美食');
  163 | 
  164 |     // AC-2: status in ['completed', 'fallback']
  165 |     const status = dbRow!.isFallback ? 'fallback' : 'completed';
  166 |     expect(['completed', 'fallback']).toContain(status);
  167 |   });
  168 | 
  169 |   // ─── test (b): acc 切换 · 数据隔离 ──────────────────────────────────────────
  170 |   test('test (b) · acc 切换 · 数据隔离 · Step1 industry 不串', async ({ page }) => {
  171 |     await page.goto(`${BASE_URL}/step/1`);
  172 |     await expect(page.locator('h1').first()).toContainText('选择你的行业赛道', { timeout: 15_000 });
  173 | 
  174 |     // Get active account A ID via tRPC/LS (reliable — not affected by switcher item order)
  175 |     const accAId = await getActiveAccountId(page);
  176 |     expect(accAId, 'DEV_OAUTH_MOCK should provide active account A').not.toBeNull();
  177 | 
  178 |     // Find account B ID: open switcher, pick first item that is NOT accAId
  179 |     await page.locator('[data-testid="account-switcher-trigger"]').click();
  180 |     await page.locator('[data-testid^="account-switcher-item-"]').first().waitFor({ timeout: 5_000 });
  181 |     const items = page.locator('[data-testid^="account-switcher-item-"]');
  182 |     const itemCount = await items.count();
  183 |     let accBId: number | null = null;
  184 |     for (let i = 0; i < itemCount; i++) {
  185 |       const tid = await items.nth(i).getAttribute('data-testid');
  186 |       const cid = parseInt(tid!.replace('account-switcher-item-', ''), 10);
  187 |       if (cid !== accAId) { accBId = cid; break; }
  188 |     }
  189 |     expect(accBId, 'Should find a second account B in AccountSwitcher').not.toBeNull();
  190 |     await page.keyboard.press('Escape');
  191 | 
  192 |     // ── Account A: select '美食' (beforeEach already cleared accA's step1) ──
  193 |     await page.goto(`${BASE_URL}/step/1`);
  194 |     await expect(page.locator('h1').first()).toContainText('选择你的行业赛道', { timeout: 10_000 });
  195 |     await submitStep1(page, '美食');
  196 | 
  197 |     // Verify A's LS before switching away
  198 |     const lsA = await getStepLs(page, accAId, 'step1');
  199 |     expect(lsA, 'Account A LS should have step1').not.toBeNull();
  200 |     expect(String(JSON.parse(lsA!).industryLabel)).toContain('美食');
  201 | 
  202 |     // Verify A's DB
  203 |     const dbA1 = await queryStepData(page, 'step1');
  204 |     expect(dbA1).not.toBeNull();
  205 |     expect(String((dbA1!.inputs as Record<string, unknown>).industryLabel)).toContain('美食');
  206 | 
  207 |     // ── Switch to Account B (clears A's LS, reloads) ──
  208 |     await page.locator('[data-testid="account-switcher-trigger"]').click();
  209 |     await page.locator(`[data-testid="account-switcher-item-${accBId}"]`).waitFor({ timeout: 5_000 });
  210 |     await page.locator(`[data-testid="account-switcher-item-${accBId}"]`).click();
  211 |     await page.waitForLoadState('load');
  212 | 
  213 |     await page.goto(`${BASE_URL}/step/1`);
  214 |     await expect(page.locator('h1').first()).toContainText('选择你的行业赛道', { timeout: 10_000 });
  215 | 
  216 |     // Clear accB's step1 data to ensure fresh submission (accB may have pre-existing data)
  217 |     await clearStepDataForTest(page, ['step1']);
  218 |     await page.reload();
  219 |     await expect(page.locator('h1').first()).toContainText('选择你的行业赛道', { timeout: 10_000 });
  220 | 
  221 |     // Account B: select '美妆护肤'
  222 |     await submitStep1(page, '美妆');
  223 | 
  224 |     // Verify B's LS has '美妆' (NOT A's '美食')
  225 |     const lsB = await getStepLs(page, accBId, 'step1');
  226 |     expect(lsB, 'Account B LS should have step1').not.toBeNull();
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
> 251 |     expect(String((dbA2!.inputs as Record<string, unknown>).industryLabel)).toContain('美食');
      |                                                                             ^ Error: expect(received).toContain(expected) // indexOf
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
  327 |     await expect(page.locator('text=流量型')).toBeVisible({ timeout: 30_000 });
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
```