# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: prd-18-step-4-5-6-7-8.spec.ts >> PRD-18 Step 4 → 4b → 5 → 6 → 7 → 8 E2E >> test 6 · Step 8 · 选平台 + 选经验等级 → 生成直播话术 → 初版 + 优化版可见
- Location: e2e/prd-18-step-4-5-6-7-8.spec.ts:255:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('[data-testid="step-result-step8"]')
Expected: visible
Timeout: 30000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 30000ms
  - waiting for locator('[data-testid="step-result-step8"]')

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
    - heading "持续迭代与升级" [level=1] [ref=e18]
    - paragraph [ref=e19]: 基于数据与用户反馈持续优化 IP 定位与内容
    - generic [ref=e20]:
      - generic [ref=e21]:
        - generic [ref=e22]: 主要平台*
        - combobox "主要平台*" [ref=e23] [cursor=pointer]:
          - generic: 📱 抖音
          - img [ref=e24]
        - combobox [ref=e26]
      - generic [ref=e27]:
        - text: 产品信息
        - textbox "描述你要直播销售的产品" [ref=e28]
      - generic [ref=e29]:
        - text: 目标受众
        - textbox "描述你的直播目标观众" [ref=e30]
      - generic [ref=e31]:
        - generic [ref=e32]: 直播经验*
        - combobox "直播经验*" [ref=e33] [cursor=pointer]:
          - generic: 新手（从未直播）
          - img [ref=e34]
        - combobox [ref=e36]
      - button "开始生成" [ref=e37] [cursor=pointer]
  - generic [ref=e39]:
    - generic [ref=e40]: 内容有帮助吗？
    - button "有帮助" [ref=e41] [cursor=pointer]:
      - img
    - button "没帮助" [ref=e42] [cursor=pointer]:
      - img
```

# Test source

```ts
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
  226 |     page.on('console', (msg) => {
  227 |       if (msg.type() === 'error') consoleErrors.push(msg.text());
  228 |     });
  229 | 
  230 |     await page.goto(`${BASE_URL}/step/7`);
  231 |     await expect(page.locator('h1').first()).toContainText('变现规划', { timeout: 10_000 });
  232 | 
  233 |     // Select script type — click Radix Select trigger then option
  234 |     await page.locator('#step7-script-type').click();
  235 |     await page.getByRole('option', { name: '辩论对话' }).click();
  236 | 
  237 |     // Fill topic input (min 2 chars, it's an input not textarea)
  238 |     await page.locator('#step7-topic').fill('美容院到底该不该采购医美仪器');
  239 | 
  240 |     // Submit
  241 |     await page.locator('button[type="submit"]').click();
  242 | 
  243 |     // Wait for result (Step7Result renders markdown article)
  244 |     await expect(page.locator('[data-testid="step-result-step7"]')).toBeVisible({ timeout: 30_000 });
  245 | 
  246 |     await page.screenshot({ path: path.join(RESULTS_DIR, 'prd-18-step-7.png') });
  247 | 
  248 |     const unexpectedErrors = consoleErrors.filter(
  249 |       (e) => !e.includes('subscription') && !e.includes('ERR_CONNECTION_REFUSED'),
  250 |     );
  251 |     expect(unexpectedErrors, `Console errors: ${consoleErrors.join(', ')}`).toEqual([]);
  252 |   });
  253 | 
  254 |   // ─── test 6: Step 8 ──────────────────────────────────────────────────────────
  255 |   test('test 6 · Step 8 · 选平台 + 选经验等级 → 生成直播话术 → 初版 + 优化版可见', async ({ page }) => {
  256 |     const consoleErrors: string[] = [];
  257 |     page.on('console', (msg) => {
  258 |       if (msg.type() === 'error') consoleErrors.push(msg.text());
  259 |     });
  260 | 
  261 |     await page.goto(`${BASE_URL}/step/8`);
  262 |     await expect(page.locator('h1').first()).toContainText('持续迭代与升级', { timeout: 10_000 });
  263 | 
  264 |     // Select platform
  265 |     await page.locator('#platform-select').click();
  266 |     await page.getByRole('option', { name: /抖音/ }).click();
  267 | 
  268 |     // Select experience level (required)
  269 |     await page.locator('#step8-experience').click();
  270 |     await page.getByRole('option', { name: '新手（从未直播）' }).click();
  271 | 
  272 |     // Submit
  273 |     await page.locator('button[type="submit"]').click();
  274 | 
  275 |     // Wait for result (Step8Result renders "初版话术" + "优化版话术" cards)
> 276 |     await expect(page.locator('[data-testid="step-result-step8"]')).toBeVisible({ timeout: 30_000 });
      |                                                                     ^ Error: expect(locator).toBeVisible() failed
  277 |     await expect(page.locator('text=初版话术').first()).toBeVisible();
  278 |     await expect(page.locator('text=优化版话术').first()).toBeVisible();
  279 | 
  280 |     await page.screenshot({ path: path.join(RESULTS_DIR, 'prd-18-step-8.png') });
  281 | 
  282 |     const unexpectedErrors = consoleErrors.filter(
  283 |       (e) => !e.includes('subscription') && !e.includes('ERR_CONNECTION_REFUSED'),
  284 |     );
  285 |     expect(unexpectedErrors, `Console errors: ${consoleErrors.join(', ')}`).toEqual([]);
  286 |   });
  287 | });
  288 | 
```