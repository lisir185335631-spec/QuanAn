# Testing Patterns

**Analysis Date:** 2026-05-09
**Project:** QuanQn · IP 起号 / 内容创作 SaaS · TypeScript monorepo
**Status (post PRD-5):**
- `pnpm test` (vitest) · **542 passed / 56 files**
- `pnpm test:judge` (LLM judge) · **22 passed / 11 files**
- `pnpm test:e2e` (playwright) · **126 passed + 2 skipped / 18 files**
- `pnpm typecheck` · 6 workspaces · 0 errors
- `pnpm lint` · web + api · `--max-warnings=0` 通过

---

## 1. 测试金字塔 (LD-016 · `AGENTS.md §7.1`)

```
                   ┌────────────────────────┐
                   │ ⑤ LLM Judge            │   22 tests · vitest.judge.config.ts
                   │   pnpm test:judge      │   独立 config · lightweight tier
                   │   < 5 min              │
                   └────────────────────────┘
              ┌──────────────────────────────────┐
              │ ④ E2E (playwright)              │   126 tests / 18 files
              │   pnpm test:e2e                  │   workers=1 · sharedPage 模式
              │   ~15 min · mock LLM             │
              └──────────────────────────────────┘
        ┌────────────────────────────────────────────┐
        │ ③ 集成测试 (vitest)                       │   ~30 tests / 11 files
        │   tests/integration/api/                   │   nock SDK + 真 DB
        │   pnpm test:integration                    │
        └────────────────────────────────────────────┘
   ┌────────────────────────────────────────────────────────┐
   │ ② 单元测试 (vitest · tests/unit/)                     │   ~512 tests / 45 files
   │   pnpm test                                            │   含 unit + integration include
   │   < 2 min · mock 一切外部                              │
   └────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│ ① 静态测试                                                       │
│   pnpm typecheck (tsc --noEmit) · pnpm lint (--max-warnings=0)  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.1 实测分布

| 层 | 文件数 | 用例数 | runner | config |
|---|:-:|:-:|---|---|
| Unit | 45 | ~520 | vitest | `vitest.config.ts` |
| Integration | 11 | ~22 | vitest | `vitest.config.ts` (合并 include) |
| Judge | 11 (×2 case = 22) | 22 | vitest | `vitest.judge.config.ts` (★ 独立 config) |
| E2E | 18 | 126 | playwright | `playwright.config.ts` |
| Web (jsdom) | 4 | ~30 | vitest | `apps/web/vitest.config.ts` (★ workspace 独立) |

### 1.2 命令 (package.json:23-29)

```bash
pnpm test                # vitest run (root config · 含 unit + integration)
pnpm test:unit           # vitest run --dir tests/unit
pnpm test:integration    # vitest run --dir tests/integration  (nock + real DB)
pnpm test:e2e            # playwright test (auto-start dev server)
pnpm test:judge          # vitest run --config vitest.judge.config.ts
pnpm test:llm-judge      # tsx tests/llm-judge/runner.ts (legacy · 留空)
pnpm typecheck           # pnpm -r typecheck (turbo · 6 workspace)
pnpm lint                # pnpm -r lint (各 workspace 独跑 eslint)
```

---

## 2. Test Framework

### 2.1 Runner

- **vitest** `^2.1.0` — unit / integration / judge / web
  - globals: true (`describe / it / expect / vi` 全局可用)
  - 三套 config: 根 `vitest.config.ts` + `vitest.judge.config.ts` + `apps/web/vitest.config.ts`
- **playwright** `^1.48.0` — E2E
  - `playwright.config.ts` 根级唯一
  - browsers: chromium + mobile (iPhone 14 Pro)

### 2.2 Assertion / Mocking

- 内建 `expect` (chai-style) + matchers
- `@testing-library/jest-dom` (web vitest setup) — `expect(el).toBeVisible() / .toBeInTheDocument()`
- `@testing-library/react` + `@testing-library/user-event` (web 单元)
- `vi.mock()` + `vi.hoisted()` — 模块 mock (★ 必读 §6)
- `nock` `^14.0.15` — 集成测试 HTTP intercept (兜底安全网)

---

## 3. 配置文件详解

### 3.1 根 `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      // API path alias — used when unit tests import from apps/api/src/**
      '@': path.resolve(__dirname, 'apps/api/src'),
      // zod lives in apps/api/node_modules (not root) — expose to root vitest
      'zod': path.resolve(__dirname, 'apps/api/node_modules/zod'),
    },
  },
  test: {
    globals: true,
    environment: 'node',                              // ★ Node env (集成 + unit api)
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      thresholds: {
        global: { lines: 80, functions: 80, branches: 75, statements: 80 },
        // === LD-016 严格门禁 ===
        'src/server/agents/**': { lines: 90, functions: 90, branches: 85, statements: 90 },
        'src/lib/**':           { lines: 95, functions: 95, branches: 90, statements: 95 },
      },
      exclude: [
        '**/*.test.ts', '**/*.spec.ts',
        'src/lib/constants/**',
        'tests/**', 'scripts/**',
        '**/index.ts',                                // barrel files 不算覆盖
      ],
    },
    include: [
      'tests/unit/**/*.{test.ts,test.tsx}',
      'tests/integration/**/*.test.ts',
    ],
    passWithNoTests: true,
    testTimeout: 30000,                               // 单 test 30s 兜底
    hookTimeout: 60000,                               // beforeAll / afterAll 60s
  },
});
```

**关键设计** ·
- `@/` alias 指向 `apps/api/src` (★ 根 vitest 默认对接 api 单元测试 · web 在自己的 config 处理)
- `zod` alias 显式指向 `apps/api/node_modules/zod` — 因 zod 装在 api workspace · 不在根 node_modules · 否则 unit 跑不动
- coverage 三档门槛 · `src/server/agents/**` 90% (Specialist 核心) · `src/lib/**` 95% (工具函数) · 整体 80%
- include 同时收 unit + integration (一次 `pnpm test` 跑两层)

### 3.2 `vitest.judge.config.ts` (★ 独立 config)

```typescript
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'apps/api/src'),
      zod: path.resolve(__dirname, 'apps/api/node_modules/zod'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    // AC-3: only judge tests — exclude regular unit/integration/e2e
    include: ['tests/judge/**/*.judge.ts'],
    exclude: [
      'tests/unit/**',
      'tests/integration/**',
      'tests/e2e/**',
      '**/node_modules/**',
    ],
    passWithNoTests: true,
    testTimeout: 15_000,                              // AC-13: single judge < 10s + buffer
    hookTimeout: 30_000,
    sequence: { concurrent: false },                  // ★ AC-8: 串行 · 失败时定位到具体 case
  },
});
```

**为什么独立 config** ·
- `include: ['tests/judge/**/*.judge.ts']` 只跑 `.judge.ts` 后缀 — 跟 `.test.ts` 区分开 (CI 单独跑 · 成本敏感)
- `sequence.concurrent=false` 串行 — 失败时一目了然定位哪个 specialist 的 golden case 挂了
- `testTimeout=15_000` — 单 judge < 10s + overhead
- 跟主 config 共享 `@/` 和 `zod` alias

### 3.3 `apps/web/vitest.config.ts` (★ workspace 独立)

```typescript
import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),                                // ★ web 自己的 @ → src
      '@quanqn/schemas': path.resolve(__dirname, '../../packages/schemas/src'),
      '@quanqn/ui':      path.resolve(__dirname, '../../packages/ui/src'),
      '@quanqn/clients': path.resolve(__dirname, '../../packages/clients/src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',                             // ★ 关键 · React 测试需要 DOM
    passWithNoTests: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],       // ★ 跟根 config 不重叠
    setupFiles: ['./src/test/setup.ts'],              // 仅 import '@testing-library/jest-dom'
  },
});
```

**关键差异 vs 根 config** ·
- `environment: 'jsdom'` (vs 'node') — React render 需要 document/window
- `@/` 指向 `apps/web/src` (vs apps/api/src)
- include 范围在 `apps/web/src/**` — 跟根 vitest `tests/unit/**` 互不重叠
- web 单元测试 4 文件 (`apps/web/src/test/feedback-button.test.tsx` · `pages.test.tsx` · `step-progress.test.tsx` · `apps/web/src/components/StepProgress.test.tsx`)
- 调用 · `pnpm --filter @quanqn/web test`

### 3.4 `playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 600_000,                                   // ★ AC-17 (US-017): 10 min · 真 LLM 调用慢
  fullyParallel: false,                               // ★ 关键 · 串行
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // workers=1: prevents shared-user activeAccountId race conditions across concurrent projects
  workers: 1,                                         // ★ 关键 · 单 worker
  reporter: [['html'], ['github']],

  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile',   use: { ...devices['iPhone 14 Pro'] } },
  ],

  webServer: {
    command: 'pnpm dev',                              // 自动起 dev server
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,                                 // dev server 启动 2 min 兜底
  },
});
```

**关键设计 · ★ workers=1 + fullyParallel=false** ·
- 因为所有 e2e 共享 `dev@local.test` mock user (`apps/api/src/lib/auth/providers.ts` mock provider)
- 同一 user 切 account 时会改 `activeAccountId` — 并发时有 race condition · 数据被互相污染
- `workers=1` 强制串行 · `fullyParallel=false` 防 describe 内部并发
- 配合 `test.describe.serial` (`tools-integration.spec.ts:141` · `ip-flow-9-steps.spec.ts:42`) 进一步约束顺序
- 配合 `sharedPage` 模式 (见 §5.3)

**timeout=600_000 (10 min)** · 真 LLM e2e (US-017 ip-flow-9-steps.spec.ts) 调真 Anthropic · 9 步链路 · 单 step 60s ≤ ~5 min 总

---

## 4. 测试文件组织

### 4.1 目录结构

```
tests/
├── setup.ts                              # 根 vitest setup · 当前空(留 PRD 用)
├── unit/                                 # 45 文件 · ~520 用例
│   ├── api/                              # 17 router/middleware unit (mock 一切)
│   │   ├── account-isolation.test.ts
│   │   ├── analysis-router.test.ts
│   │   ├── boom-generate-router.test.ts
│   │   ├── copywriting-router.test.ts
│   │   ├── history-router.test.ts
│   │   ├── llm-gateway-fallback.test.ts
│   │   ├── llm-gateway-rate.test.ts
│   │   └── ... (12 more)
│   ├── specialists/                       # 4 base + 8 Specialist 个体
│   │   ├── base.test.ts
│   │   ├── base.llm.test.ts
│   │   ├── fallback.test.ts
│   │   └── __tests__/                    # ★ 嵌套子目录 · 各 Specialist 独立
│   │       ├── PositioningAgent.test.ts
│   │       ├── BrandingAgent.test.ts
│   │       ├── CopywritingAgent.test.ts
│   │       ├── TopicAgent.test.ts
│   │       ├── VideoAgent.test.ts
│   │       ├── LivestreamAgent.test.ts
│   │       ├── MonetizationAgent.test.ts
│   │       └── AnalysisAgent.test.ts
│   ├── agents/base.test.ts               # 老路径 (TD-005)
│   ├── auth/providers.test.ts
│   ├── schemas/specialist-io.test.ts
│   ├── services/context-assembler.test.ts
│   └── web/                              # 8 web schema/hook unit (Node env · 不需 jsdom 的)
│       ├── hooks.test.ts
│       ├── ls-namespace.test.ts
│       ├── router.test.ts
│       ├── step-config.test.ts
│       ├── StepForm.test.tsx             # 注意 · 测的是 schema · 不渲染组件
│       ├── StepResult.test.tsx
│       ├── ToolForm.test.tsx
│       ├── ToolResult.test.tsx
│       └── pages/...
├── integration/
│   └── api/                              # 11 真 DB integration
│       ├── auth.test.ts                  # mock OAuth + 真 prisma
│       ├── auth.me.test.ts
│       ├── analysis-structural-llm.test.ts
│       ├── boom-generate-llm.test.ts
│       ├── copywriting-free-llm.test.ts
│       ├── ip-progress-integration.test.ts
│       ├── llm-gateway-real.test.ts
│       ├── rls-isolation.test.ts          # ★ RLS 真 DB 验证
│       ├── specialist-llm.test.ts
│       ├── trace.test.ts
│       └── video-analysis-viral-llm.test.ts
├── e2e/                                  # 18 playwright spec · 126 tests
│   ├── account-isolation.spec.ts         # RLS 端到端
│   ├── account-switch.spec.ts
│   ├── debug-network.spec.ts
│   ├── fallback.spec.ts                  # LLM 降级路径
│   ├── feedback-button.spec.ts
│   ├── feedback-log.spec.ts
│   ├── header.spec.ts
│   ├── history-flow.spec.ts
│   ├── ip-flow-9-steps.spec.ts           # ★ 9 步主链路 (真 LLM · 600s timeout)
│   ├── ip-flow-account-isolation.spec.ts
│   ├── ip-plan.spec.ts
│   ├── ls-db-sync.spec.ts                # LS↔DB 双写一致性
│   ├── routes-34.spec.ts                 # 34 路由可达性 smoke
│   ├── tool-analysis.spec.ts
│   ├── tool-boom-generate.spec.ts
│   ├── tool-generate.spec.ts
│   ├── tool-video-analysis.spec.ts
│   └── tools-integration.spec.ts         # ★ 4 工具 + history 收官 (US-012 · sharedPage)
├── judge/                                # 11 LLM Judge (US-016)
│   ├── judge-runner.ts                   # ★ 共享 runner (PASS_SCORE_THRESHOLD=6)
│   ├── analysis-structural.judge.ts
│   ├── analysis-viral.judge.ts
│   ├── branding.judge.ts
│   ├── copywriting.judge.ts
│   ├── copywriting-boom.judge.ts
│   ├── copywriting-free.judge.ts
│   ├── livestream.judge.ts
│   ├── monetization.judge.ts
│   ├── positioning.judge.ts
│   ├── topic.judge.ts
│   └── video.judge.ts
└── llm-judge/                            # 空 (legacy 路径 · 待清)

apps/web/src/                              # ★ web workspace 独立测试 · jsdom env
└── test/
    ├── setup.ts                          # import '@testing-library/jest-dom'
    ├── feedback-button.test.tsx          # 真 React 渲染 + userEvent
    ├── pages.test.tsx
    └── step-progress.test.tsx
```

### 4.2 文件命名

| 类别 | 后缀 | 实例 |
|---|---|---|
| Unit (vitest) | `.test.ts` 或 `.test.tsx` | `copywriting-router.test.ts` · `StepForm.test.tsx` |
| Integration | `.test.ts` (在 tests/integration/) | `copywriting-free-llm.test.ts` |
| E2E (playwright) | `.spec.ts` | `tools-integration.spec.ts` |
| Judge | `.judge.ts` (★ 特殊后缀) | `copywriting.judge.ts` |

**unit / integration 同后缀但靠路径区分** · vitest config `include` 路径不同。

---

## 5. E2E 测试模式 (playwright)

### 5.1 串行 + sharedPage 设计

E2E 共享 mock user `dev@local.test`，并发时有 `activeAccountId` race。强制串行：

```typescript
// tests/e2e/tools-integration.spec.ts:137-146
let sharedPage: Page;

test.describe.serial('4 工具 + history 收官集成 E2E (US-012)', () => {
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    sharedPage = await context.newPage();
    await sharedPage.setViewportSize({ width: 1280, height: 720 });

    // Login (shared user dev@local.test)
    await sharedPage.goto(`${API_BASE}/auth/login`);
    await sharedPage.waitForURL(`${WEB_BASE}/**`);

    // Create IP account once · all subsequent tests reuse
    await trpcMutate(sharedPage, 'ipAccounts.create', {
      name: 'E2E Integration Test', industry: '理财', platform: 'douyin', stage: 'growth',
    });

    // Install fetch mock once
    await sharedPage.addInitScript(...);
  });

  test.afterAll(async () => {
    await sharedPage.close();
  });

  test('Step 1: /generate → submit → 结果出现', async () => {
    const page = sharedPage;                          // ★ 复用 sharedPage · 不开新 page
    // ...
  });
}
```

**3 层串行保障** ·
1. `playwright.config.ts: workers=1` (worker 级)
2. `playwright.config.ts: fullyParallel=false` (project 级)
3. `test.describe.serial(...)` (test 级)

### 5.2 mock user · login 流程

`apps/api/src/lib/auth/providers.ts` 内置 mock provider · `mock-dev-001` openId · `dev@local.test` email · `Dev User` name:

```typescript
// 通用模板 (tests/e2e/account-isolation.spec.ts:57-61)
await page.goto(`${API_BASE}/auth/login`);          // → 重定向到 mock OAuth callback
await page.waitForURL('http://localhost:5173/**');  // 登录后跳回前端
await page.waitForSelector('[data-testid="app-header"]');  // header 出现 = 已登录
```

### 5.3 ★ tRPC v11 httpBatchStreamLink 3-line JSONL mock pattern

PRD-5 e2e 关键技巧 · 因 tRPC v11 客户端用 `httpBatchStreamLink`，response 必须是 chunked JSONL (3 行)。**直接 mock fetch** 比启 mock server 快：

```typescript
// tests/e2e/tools-integration.spec.ts:170-200 (实证 · US-006 AC-7 推证)
await sharedPage.addInitScript(({ freeRow, boomRow, ... }) => {
  const orig = window.fetch.bind(window);
  window.fetch = async (url: RequestInfo | URL, ...args: [RequestInit?]) => {
    const u = String(url);
    const jsonl = (data: unknown) => {
      // ★ 必须是 3 行 JSONL · 每行末加 \n · 整体末加 \n
      const lines = [
        JSON.stringify({ '0': [[{ result: 0 }], ['result', 0, 0]] }),
        JSON.stringify([0, 0, [[{ data: 0 }], ['data', 0, 1]]]),
        JSON.stringify([1, 0, [[data]]]),
      ].join('\n') + '\n';
      return new Response(new TextEncoder().encode(lines), {
        status: 200,
        headers: new Headers({
          'content-type': 'application/json',
          'transfer-encoding': 'chunked',           // ★ 关键 · 必须 chunked
        }),
      });
    };
    if (u.includes('copywriting.freeGenerate')) return jsonl(freeRow);
    if (u.includes('boomGenerate.generate'))   return jsonl(boomRow);
    if (u.includes('analysis.analyze'))        return jsonl(analysisRow);
    if (u.includes('videoAnalysis.analyze'))   return jsonl(videoRow);
    if (u.includes('history.list'))            return jsonl(historyList);
    if (u.includes('history.detail'))          return jsonl(historyDetail);
    return orig(url, ...args);                       // 其他请求透传
  };
}, { freeRow, boomRow, analysisRow, videoRow, historyList, historyDetail });
```

**3 行 JSONL 拆解** ·
- 第 1 行 · header (procedure 0 的 path) · `{"0": [[{"result":0}], ["result", 0, 0]]}`
- 第 2 行 · meta envelope · `[0, 0, [[{"data":0}], ["data", 0, 1]]]`
- 第 3 行 · 实际 data payload · `[1, 0, [[<your data>]]]`

每行末必带 `\n` · 整体末再带一个 `\n`。

### 5.4 tRPC 助手 (复用)

```typescript
// page.evaluate 进 browser context · 复用 session cookie
async function trpcMutate(page: Page, procedure: string, input: unknown): Promise<unknown> {
  return page.evaluate(
    async ({ base, proc, inp }) => {
      const res = await fetch(`${base}/trpc/${proc}?batch=1`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ '0': inp }),
        credentials: 'include',                      // ★ 必须带 cookie
      });
      const data = (await res.json()) as Array<{ result: { data: unknown } }>;
      return data[0]?.result?.data;
    },
    { base: API_BASE, proc: procedure, inp: input },
  );
}
```

### 5.5 选择器约定

```typescript
// ✅ 优先 data-testid (kebab-case · 允许中文)
page.getByTestId('tool-form-boom-generate')
page.getByTestId('history-row-1002')
page.getByTestId('analysis-dim-bar-钩子强度')

// ✅ 次选 ARIA role (中文 name)
page.getByRole('button', { name: /开始生成/ })
page.getByRole('option', { name: /教程演示/i }).first()

// ✅ 文本 (兜底)
page.getByText('财富自由')

// ⚠️ 慎用 CSS selector (脆)
form.locator('textarea').fill('...')
form.locator('#tool-boom-theme').fill('...')          // 仅在 data-testid 不便加时用
```

---

## 6. Mocking 模式

### 6.1 ★ `vi.hoisted` + `vi.mock` 模式 (跨 PRD 标准)

**问题** · `vi.mock` 工厂函数被自动 hoist 到文件顶部 · 不能引用工厂外的变量。

**解法** · `vi.hoisted` 也被 hoist · 在 hoist 后的工厂里可引用其结果：

```typescript
// tests/judge/copywriting.judge.ts:14-28 (标准模板)
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks ─────────────────────────────────────────────────────────────────────

// ★ Step 1: vi.hoisted 创建 mock fn (整体被 hoist 到文件顶)
const { mockComplete } = vi.hoisted(() => ({
  mockComplete: vi.fn(),
}));

// Step 2: vi.mock 用 hoisted 后的 mock (此时 mockComplete 已存在)
vi.mock('@/workers/llm-gateway', () => ({
  llmGateway: { complete: mockComplete },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: { costLog: { create: vi.fn().mockResolvedValue({ id: BigInt(1) }) } },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// Step 3: import 系统模块 (会被 mock 拦截)
// (judge-runner.ts 内部 import { llmGateway } 时拿到 mockComplete)

describe('CopywritingAgent LLM Judge', () => {
  beforeEach(() => {
    mockComplete.mockResolvedValue({                  // 在 test 内动态设返回
      content: { pass: true, score: 9, reason: '...' },
      tokens: { prompt: 350, completion: 95, total: 445 },
      model: 'claude-haiku-4-5',
      duration_ms: 1300,
      trace_id: 'judge-CopywritingAgent-test',
    });
  });

  it('runJudge calls llmGateway with lightweight tier', async () => {
    await runJudge(goldenCase);
    expect(mockComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        model_tier: 'lightweight',
        metadata: expect.objectContaining({ eventType: 'judge_call' }),
        timeout_ms: 10_000,
      }),
    );
  });
});
```

### 6.2 通用 mock 三件套 (单元测试必 mock)

每个 unit 测试都 mock 这 3 个 (避免触发真实副作用)：

```typescript
// ① ContextAssembler — 不读 DB
vi.mock('@/services/context-assembler/ContextAssembler', () => ({
  contextAssembler: {
    assemble: vi.fn().mockResolvedValue({
      systemPrompt: '[sys]',
      userPrompt: '[usr]',
      tools: [],
      metadata: { contextTokens: 0, layersUsed: ['L2'], ragHits: [] },
    }),
    assembleStep: vi.fn(),
  },
}));

// ② prisma — 不写 DB
vi.mock('@/lib/prisma', () => ({
  prisma: {
    costLog: { create: vi.fn().mockResolvedValue({ id: BigInt(1) }) },
  },
}));

// ③ logger — 不输出 stdout
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
```

### 6.3 LLM Gateway mock (Specialist 测试)

**两种** · `complete` (单次) · `stream` (流式)：

```typescript
// 单次 complete mock
function makeMockGateway(override?: Partial<InvokeLLMResult>): ILLMGateway {
  return {
    complete: vi.fn().mockResolvedValue({
      content: { positioning: '宠物博主·专注猫粮科普' },
      tokens: { prompt: 100, completion: 50, total: 150 },
      model: 'claude-sonnet-4-6',
      isFallback: false,
      ...override,
    }),
  };
}

// 流式 stream mock (CopywritingAgent SSE)
function makeStreamGateway(content: unknown, model = 'test-model-mock'): ILLMGateway {
  const json = JSON.stringify(content);
  return {
    complete: vi.fn() as unknown as ILLMGateway['complete'],
    stream: vi.fn().mockImplementation(async function* (): AsyncIterable<LLMStreamChunk> {
      yield { type: 'meta', meta: { model } };
      yield { type: 'delta', delta: json };
      yield { type: 'done', tokens: { prompt: 500, completion: 2500, total: 3000 } };
    }),
  };
}

// 注入到 Specialist
const agent = new CopywritingAgent(makeStreamGateway(content));
```

### 6.4 web mock (`@testing-library/react` + tRPC mock)

```typescript
// apps/web/src/test/feedback-button.test.tsx:5-17
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FeedbackButton } from '@/components/FeedbackButton';

const mockMutate = vi.fn();

// mock 整个 tRPC 模块
vi.mock('@/lib/trpc', () => ({
  trpc: {
    costLog: {
      logFeedback: {
        useMutation: () => ({ mutate: mockMutate, isPending: false }),
      },
    },
  },
}));

describe('FeedbackButton', () => {
  it('calls mutate with good type and agentId on thumbs-up click', async () => {
    const user = userEvent.setup();
    render(<FeedbackButton stepKey="step1" agentId="PositioningAgent" />);
    await user.click(screen.getByLabelText('有帮助'));
    expect(mockMutate).toHaveBeenCalledWith({
      stepKey: 'step1',
      agentId: 'PositioningAgent',                    // ★ 必须 PascalCase + Agent
      type: 'good',
    });
  });
});
```

### 6.5 哪些必 mock · 哪些不 mock

| 必 mock | 理由 |
|---|---|
| `@/workers/llm-gateway` | 不调真 LLM (省钱 · 防 flaky) |
| `@/lib/prisma` (unit 层) | 不写 DB · 用 fake ctx |
| `@/lib/logger` | 不输出 stdout 干扰 test runner |
| `@/services/context-assembler/ContextAssembler` | 不读 DB · 不调 RAG |
| 第三方 SDK (anthropic / openai) | 永不调 (rate limit + cost) |

| ★ 不 mock | 理由 |
|---|---|
| zod schema | 测的是 schema · 必须真跑 |
| 业务逻辑函数 | 测的是这部分 · mock 等于不测 |
| `apps/api/src/trpc/routers/*` 本身 (单元层) | 测 router callable · 用 `createCaller(ctx)` · ctx 给 fake prisma |

---

## 7. Fixtures and Factories

### 7.1 内联 fixture (优先 · 90% 用例)

```typescript
// tests/unit/api/copywriting-router.test.ts:28-66
const MOCK_FREE_MARKDOWN =
  '# 爆款文案标题\n\n第一段内容钩子...\n\n第二段...\n\n第三段...' + 'x'.repeat(300);

const MOCK_FREE_RESULT = {
  markdown: MOCK_FREE_MARKDOWN,
  metadata: {
    scriptType: 'tutorial',
    elements: ['curiosity'],
    structureSummary: '钩子→干货→行动',
    estimatedDuration: '60-90 秒',
  },
};

const MOCK_HISTORY_ROW = {
  id: 42,
  content: MOCK_FREE_MARKDOWN,
  contentType: 'markdown',
  agentId: 'CopywritingAgent',                        // ★ PascalCase
  agentMode: 'free',
  scriptType: 'tutorial',
  elements: ['curiosity'],
  isFallback: false,
  tokensUsed: 700,
  modelUsed: 'claude-sonnet-4-6',
  durationMs: 1200,
  traceId: 'test-trace-003',
  createdAt: new Date('2026-01-01'),
};

const VALID_INPUT = {
  scriptType: 'tutorial' as const,
  elements: ['curiosity' as const],
  topic: '如何快速涨粉 — 三步打造爆款内容框架',
};
```

### 7.2 helper factory (复杂构造)

```typescript
// tests/unit/specialists/__tests__/CopywritingAgent.test.ts:48-74
function makeValidMarkdown(): string {
  const para = '这是一段爆款文案内容...\n\n';
  return '# 爆款文案标题\n\n' + para.repeat(20);     // ★ ≥ 500 字符 · 通过 schema min(500)
}

function makeValidContent() {
  return {
    markdown: makeValidMarkdown(),
    structure: '痛点引入→解决方案→案例佐证→CTA',
    hooks: ['这个方法让我的粉丝翻了 10 倍', '99% 的人不知道的涨粉秘诀'],
    cta: '点击关注，获取更多 IP 起号干货',
  };
}

function makeStreamGateway(content: unknown, model = 'test-model-mock'): ILLMGateway { ... }
function makeErrorStreamGateway(): ILLMGateway { ... }    // 断流模拟
```

### 7.3 ctx factory (tRPC unit)

```typescript
// tests/unit/api/copywriting-router.test.ts:70-100
function makeCtx(overrides: Record<string, unknown> = {}) {
  const history = {
    create: vi.fn(async () => ({ ...MOCK_HISTORY_ROW })),
    findMany: vi.fn(async () => []),
    delete: vi.fn(async () => ({})),
  };

  const tx = {
    history,
    $executeRaw: vi.fn(async () => 0),               // RLS SET LOCAL no-op in unit
  };

  const prisma = {
    history,
    $transaction: vi.fn(async (fn) => fn(tx)),
    _tx: tx,                                          // 暴露给 test 断言用
  };

  return {
    ctx: {
      traceId: 'test-trace-003',
      activeAccountId: 1 as number | null,
      user: { id: 42, activeAccountId: 1 },
      prisma,
      req: new Request('http://localhost', { headers: { 'x-trace-id': 'test-trace-003' } }),
      sessionId: 'sess-003',
      ...overrides,
    },
    prisma,
  };
}

// 调用 router 用 createCaller (★ tRPC v11 标准)
const { ctx, prisma } = makeCtx();
const caller = copywritingRouter.createCaller(ctx);
const result = await caller.freeGenerate(VALID_INPUT);

// 断言 prisma 调用
const createArgs = prisma._tx.history.create.mock.calls[0]?.[0];
expect(createArgs.data).toMatchObject({ ... });
```

### 7.4 集成测试 fixture (真 DB · 含 cleanup)

```typescript
// tests/integration/api/copywriting-free-llm.test.ts:90-126
let testAccountId = 0;
let testUserId = 0;
let testTraceId = '';

async function createTestFixtures(): Promise<void> {
  const user = await prisma.user.create({
    data: {
      openId: `test-copywriting-free-llm-${Date.now()}`,    // ★ 用 timestamp 防冲突
      name: 'Test CopyFree User',
      email: `copywriting-free-llm-${Date.now()}@test.internal`,
      loginMethod: 'google',
    },
  });
  const account = await prisma.ipAccount.create({
    data: { userId: user.id, name: 'Test CopyFree Account', industry: '教育', platform: 'douyin' },
  });
  testAccountId = account.id;
  testUserId = user.id;
}

async function cleanupTestFixtures(): Promise<void> {
  if (testTraceId) {
    await prisma.history.deleteMany({ where: { traceId: testTraceId } });
    await prisma.costLog.deleteMany({ where: { traceId: testTraceId } });
  }
  if (testAccountId) {
    const account = await prisma.ipAccount.findUnique({ where: { id: testAccountId } });
    if (account) {
      await prisma.ipAccount.delete({ where: { id: testAccountId } });
      await prisma.user.delete({ where: { id: account.userId } });
    }
  }
}

beforeAll(async () => {
  nock.disableNetConnect();                           // ★ 安全网 · 禁所有真 HTTP
  process.env.ANTHROPIC_API_KEY = 'sk-ant-nock-...';
  await createTestFixtures();
});

afterAll(async () => {
  nock.enableNetConnect();
  nock.cleanAll();
  delete process.env.ANTHROPIC_API_KEY;
  await cleanupTestFixtures();                        // ★ 测完清干净
});

beforeEach(() => {
  nock.cleanAll();
  testTraceId = `tr_copyfree_int_${Date.now()}`;
});
```

---

## 8. Coverage

### 8.1 配置 (`vitest.config.ts:17-34`)

```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html', 'lcov'],
  thresholds: {
    global: { lines: 80, functions: 80, branches: 75, statements: 80 },
    'src/server/agents/**': { lines: 90, functions: 90, branches: 85, statements: 90 },
    'src/lib/**':           { lines: 95, functions: 95, branches: 90, statements: 95 },
  },
  exclude: [
    '**/*.test.ts', '**/*.spec.ts',
    'src/lib/constants/**',
    'tests/**', 'scripts/**',
    '**/index.ts',                                    // barrel 不算
  ],
}
```

### 8.2 三档门槛 (LD-016)

| 路径 | lines | functions | branches | statements |
|---|:-:|:-:|:-:|:-:|
| **整体** | 80 | 80 | 75 | 80 |
| `src/server/agents/**` (Specialist) | **90** | **90** | **85** | **90** |
| `src/lib/**` (工具函数) | **95** | **95** | **90** | **95** |

### 8.3 查看

```bash
pnpm test --coverage           # 跑完 + 生成 coverage/
open coverage/index.html       # 浏览器看 lcov 报告
```

> ⚠️ 当前 PRD-5 阶段未强制每次跑 coverage · CI 集成 PRR 后启用。

---

## 9. 测试类型详解

### 9.1 ② 单元测试 (vitest · 520+ 用例)

**范围** · `tests/unit/**/*.test.{ts,tsx}` (Node env 默认)

**职责** ·
- 单个函数 / 类 / router 行为 · mock 一切外部 (DB / LLM / logger)
- happy path · error path · boundary · zod 校验 · fallback

**实例分布** ·
- 17 router/middleware (`tests/unit/api/`)
- 4 base + 8 Specialist (`tests/unit/specialists/`)
- 8 web schema/hook/util (`tests/unit/web/`)
- 5 其他 (auth / schemas / services / agents / specialists/base)

**典型 unit 测试 4 块** (见 `copywriting-router.test.ts`)：

```typescript
// ① happy path
describe('copywriting.freeGenerate — happy path', () => {
  it('calls CopywritingAgent(mode=free), writes history with full fields, returns row', async () => {
    const { ctx, prisma } = makeCtx();
    vi.mocked(_mockedAgent.execute).mockResolvedValueOnce({ result: MOCK_FREE_RESULT, ... });

    const caller = copywritingRouter.createCaller(ctx);
    const result = await caller.freeGenerate(VALID_INPUT);

    // AC-1: agent called
    expect(vi.mocked(_mockedAgent.execute)).toHaveBeenCalledOnce();
    // AC-2: history.create with all required fields
    expect(prisma._tx.history.create.mock.calls[0]?.[0].data).toMatchObject({ ... });
    // returns row
    expect(result.id).toBe(42);
  });
});

// ② zod validation error
describe('copywriting.freeGenerate — zod validation', () => {
  it('empty topic → TRPCError BAD_REQUEST', async () => {
    const { ctx } = makeCtx();
    const caller = copywritingRouter.createCaller(ctx);
    await expect(
      caller.freeGenerate({ scriptType: 'tutorial', elements: ['curiosity'], topic: '' }),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });   // ★ 不 import TRPCError · 用 toMatchObject
  });
});

// ③ fallback path
describe('copywriting.freeGenerate — fallback path', () => {
  it('agent returns isFallback=true → history written with isFallback=true', async () => { ... });
});

// ④ field invariant
describe('copywriting.freeGenerate — agentMode field', () => {
  it('agentMode="free" is always written to history regardless of result', async () => { ... });
});
```

### 9.2 ③ 集成测试 (vitest · ~22 tests / 11 files)

**范围** · `tests/integration/api/**/*.test.ts`

**关键差异 vs unit** ·
- 用真 prisma (实测 DB · `quanqn` or `quanqn_test`)
- 用 nock 拦截 SDK HTTP (兜底 · 防真调 LLM)
- vi.mock LLM gateway 提供 mock stream
- 测完必 cleanup (deleteMany by traceId)

**典型** (`copywriting-free-llm.test.ts:152-218`) ·

```typescript
describe('US-003 AC-4: copywriting.freeGenerate integration — nock SDK + real DB', () => {
  it('freeGenerate: calls mock stream, writes history + cost_log to real DB', async () => {
    // 用真 prisma + 真 RLS context
    const ctx = {
      traceId: testTraceId,
      activeAccountId: testAccountId,
      user: { id: testUserId, activeAccountId: testAccountId },
      prisma,                                         // ★ 真 prisma
      req: new Request('http://localhost', { ... }),
      sessionId: 'int-sess-003',
    };

    const caller = copywritingRouter.createCaller(ctx);
    const result = await caller.freeGenerate({ ... });

    // 验证返回
    expect(result.agentId).toBe('CopywritingAgent');
    expect(result.modelUsed).toBe('claude-sonnet-4-6');

    // ★ 真 DB SQL 查 history
    const historyRow = await prisma.history.findFirst({
      where: { traceId: testTraceId, agentId: 'CopywritingAgent' },
    });
    expect(historyRow).not.toBeNull();
    expect(historyRow?.accountId).toBe(testAccountId);

    // ★ 真 DB SQL 查 cost_log (BaseSpecialist 自己写)
    const costRow = await prisma.costLog.findFirst({ where: { traceId: testTraceId } });
    expect(costRow?.callType).toBe('specialist_call');
    expect(costRow?.totalTokens).toBe(400);

    // ★ 验证 nock 没有 pending interceptor (没真调 HTTP)
    expect(nock.pendingMocks()).toHaveLength(0);
  });
});
```

**rls-isolation.test.ts** · 真 DB 真 RLS · 用两个 account 验证跨账号不可见 (LD-009 实证)。

### 9.3 ④ E2E 测试 (playwright · 126 tests / 18 files)

**范围** · `tests/e2e/**/*.spec.ts`

**职责** ·
- 用户旅程端到端 (browser → frontend → tRPC → backend → prisma → DB)
- mock 仅 LLM 层 (`window.fetch` JSONL pattern · 见 §5.3)
- 真 OAuth (mock provider) · 真 cookie · 真 RLS

**典型场景** ·

| spec | 场景 |
|---|---|
| `tools-integration.spec.ts` | 4 工具 + history 收官 (US-012 · sharedPage 串行 5 步) |
| `ip-flow-9-steps.spec.ts` | 9 步主链路 (US-017 · ★ 真 LLM · 600s timeout · 手动跑) |
| `account-isolation.spec.ts` | 创 2 账号 · A 写 stepData · 切 B · 不可见 |
| `fallback.spec.ts` | mock LLM 503 · 验证 fallback 路径 + isFallback=true |
| `ls-db-sync.spec.ts` | LS↔DB 双写一致性 (REJ-035) |
| `routes-34.spec.ts` | 34 路由 smoke · 验证可达 |

**断言** · 必用 web-first assertion (`expect(...).toBeVisible({ timeout: 10000 })`) 不用 `await page.waitFor` 再 `expect`。

### 9.4 ⑤ LLM Judge (vitest --judge config · 22 tests)

**范围** · `tests/judge/*.judge.ts`

**核心** · `tests/judge/judge-runner.ts` 共享 runner (★ 必读 · 130 行)：

```typescript
// tests/judge/judge-runner.ts:58-91
export async function runJudge(case_: JudgeCase): Promise<JudgeResult> {
  const userPrompt = buildJudgePrompt(case_);

  let lastErr: unknown;
  for (let attempt = 0; attempt <= 1; attempt++) {     // ★ AC-6: 内置 retry=1 防 flaky
    try {
      const response = await llmGateway.complete({
        model_tier: 'lightweight',                     // ★ AC-9: haiku/4o-mini · 成本敏感
        systemPrompt: JUDGE_SYSTEM_PROMPT,
        userPrompt,
        responseFormat: { type: 'json_schema', schema: JudgeResultSchema },
        metadata: {
          trace_id: `judge-${case_.specialistId}-${Date.now()}`,
          agentId: `Judge-${case_.specialistId}`,
          accountId: 0,
          userId: 0,
          eventType: 'judge_call',                     // ★ AC-5: D-023 · 中央设 (L74)
        },
        timeout_ms: 10_000,                            // AC-13: < 10s
        retry: 1,
      });

      const parsed = JudgeResultSchema.safeParse(response.content);
      if (!parsed.success) throw new Error(`Judge returned invalid schema: ...`);
      return parsed.data;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}
```

**Judge 输出 schema** (强约束)：

```typescript
export const JudgeResultSchema = z.object({
  pass: z.boolean(),
  score: z.number().int().min(0).max(10),
  reason: z.string().min(1),
});

export const PASS_SCORE_THRESHOLD = 6;                 // ★ AC-7 score/pass 一致性阈值
```

**Judge case 格式**：

```typescript
export interface JudgeCase {
  specialistId: string;
  mode?: string;
  input: Record<string, unknown>;
  actualOutput: Record<string, unknown>;
  /** AC-11: 必须可量化 — e.g. '含至少 3 段 markdown' not '看起来好' */
  criteria: string[];
  expectedKeyFields: string[];
}
```

**典型 judge 测试** (`tests/judge/copywriting.judge.ts:64-132`) ·

```typescript
const goldenCase: JudgeCase = {
  specialistId: 'CopywritingAgent',
  mode: 'step7',
  input: { industry: 'fitness', platform: 'xiaohongshu', topic: '健身新手第一年避坑指南' },
  actualOutput: {
    markdown: `# 健身新手必看：第一年这样练，效率提升300%\n\n${MARKDOWN_BODY}`,
    structure: '痛点钩子 → 问题拆解(3个核心问题) → 解决方案 → 行动清单 → 金句收尾',
    hooks: ['90%的健身新手第一年白练？看完这篇少走3年弯路', ...],
    cta: '点赞收藏，下次健身前再看一遍！有问题评论区见～',
  },
  criteria: [
    'markdown 字段长度不少于 500 个字符',                // ★ 量化
    'markdown 包含至少 1 个以 "# " 开头的标题行',          // ★ 量化
    'structure 为非空字符串，描述文案结构',
    'hooks 数组至少包含 1 个元素，每个元素为非空字符串',
    'cta 为非空字符串，包含行动引导语',
  ],
  expectedKeyFields: ['markdown', 'structure', 'hooks', 'cta'],
};

describe('CopywritingAgent LLM Judge — step7/fitness/xiaohongshu golden case', () => {
  beforeEach(() => {
    mockComplete.mockResolvedValue({
      content: { pass: true, score: 9, reason: 'markdown 超过500字✓；含# heading✓；structure完整✓' },
      tokens: { prompt: 350, completion: 95, total: 445 },
      model: 'claude-haiku-4-5',
      duration_ms: 1300,
      trace_id: 'judge-CopywritingAgent-test',
    });
  });

  it('golden case passes judge with score >= threshold', async () => {
    const result = await runJudge(goldenCase);

    expect(typeof result.pass).toBe('boolean');
    expect(typeof result.score).toBe('number');
    expect(result.score).toBeGreaterThanOrEqual(0).toBeLessThanOrEqual(10);

    // AC-7: pass/score consistency · 必须一致
    if (result.pass) expect(result.score).toBeGreaterThanOrEqual(PASS_SCORE_THRESHOLD);
    else expect(result.score).toBeLessThan(PASS_SCORE_THRESHOLD);

    expect(result.pass).toBe(true);
  });

  // AC-5 验证 eventType + tier
  it('runJudge calls llmGateway with lightweight tier and judge_call eventType', async () => {
    await runJudge(goldenCase);
    expect(mockComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        model_tier: 'lightweight',
        metadata: expect.objectContaining({ eventType: 'judge_call' }),
        timeout_ms: 10_000,
      }),
    );
  });
});
```

### 9.5 LLM Judge 22 tests 设计 (US-016)

| 文件 | Specialist + mode | tests |
|---|---|:-:|
| `analysis-structural.judge.ts` | AnalysisAgent / structural | 2 |
| `analysis-viral.judge.ts` | AnalysisAgent / viral | 2 |
| `branding.judge.ts` | BrandingAgent / packaging | 2 |
| `copywriting.judge.ts` | CopywritingAgent / step7 | 2 |
| `copywriting-boom.judge.ts` | CopywritingAgent / boom | 2 |
| `copywriting-free.judge.ts` | CopywritingAgent / free | 2 |
| `livestream.judge.ts` | LivestreamAgent | 2 |
| `monetization.judge.ts` | MonetizationAgent | 2 |
| `positioning.judge.ts` | PositioningAgent | 2 |
| `topic.judge.ts` | TopicAgent | 2 |
| `video.judge.ts` | VideoAgent | 2 |
| **合计** | **11 files × 2 cases** | **22** |

每个 file 2 tests · 一个测 golden case 通过 · 一个测 runner 调用形式 (lightweight tier + eventType)。

---

## 10. 常见模式

### 10.1 异步测试 (async / await)

```typescript
it('async happy path', async () => {
  const result = await caller.someAction(input);
  expect(result.id).toBeGreaterThan(0);
});
```

### 10.2 错误测试

```typescript
// ✅ rejects + matchers
await expect(caller.action(badInput)).rejects.toMatchObject({ code: 'BAD_REQUEST' });
await expect(caller.action(badInput)).rejects.toThrow();

// ✅ try-catch (复杂场景)
try {
  await caller.action(badInput);
  expect.fail('should have thrown');
} catch (err) {
  expect(err).toBeInstanceOf(SchemaValidationError);
}
```

### 10.3 BigInt mock (Prisma id 字段)

```typescript
// ★ 必须 BigInt(1) · 不能 1 (Prisma 返回 BigInt)
prisma: { costLog: { create: vi.fn().mockResolvedValue({ id: BigInt(1) }) } }
```

### 10.4 `vi.clearAllMocks` (test 隔离)

```typescript
beforeEach(() => {
  vi.clearAllMocks();                                 // ★ 清调用历史 · 不清实现
});
```

`vi.resetAllMocks` 会清实现 · 慎用。

### 10.5 `vi.mocked` 类型助手

```typescript
import { copywritingAgent as _mockedAgent } from '@/specialists/CopywritingAgent';
// ...
vi.mocked(_mockedAgent.execute).mockResolvedValueOnce({ ... });
```

### 10.6 console error capture (e2e 兜底)

```typescript
const consoleErrors: string[] = [];
page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text());
});
// ... actions ...
expect(consoleErrors).toEqual([]);                    // 验证无控制台错误
```

### 10.7 测试隔离 traceId (集成测试)

```typescript
beforeEach(() => {
  testTraceId = `tr_copyfree_int_${Date.now()}`;      // ★ 每 test 唯一 traceId
});

afterAll(async () => {
  await prisma.history.deleteMany({ where: { traceId: testTraceId } });
  await prisma.costLog.deleteMany({ where: { traceId: testTraceId } });
});
```

### 10.8 Hooks 全局生效域

```typescript
// 文件级 (file-scoped)
beforeAll(...)    // 整个 file 跑前一次
afterAll(...)     // 整个 file 跑完一次

// describe 级 (block-scoped)
describe('xxx', () => {
  beforeEach(...) // 块内每个 it 跑前
  afterEach(...)
});
```

集成测试常见 · `beforeAll` 创 fixtures + `afterAll` cleanup + `beforeEach` 重置 traceId。

---

## 11. 测试约定 · 命名

### 11.1 describe / it 命名

```typescript
// ✅ describe = 被测对象 + 场景
describe('copywriting.freeGenerate — happy path', () => { ... });
describe('copywriting.freeGenerate — zod validation', () => { ... });
describe('copywriting.freeGenerate — fallback path', () => { ... });
describe('CopywritingAgent — step7/fitness/xiaohongshu golden case', () => { ... });

// ✅ it = 行为描述 (中英都可 · 实测中文居多 · 可读性高)
it('calls CopywritingAgent(mode=free), writes history with full fields, returns row', ...);
it('AC-4: throws FORBIDDEN when activeAccountId is null', ...);
it('Step3InputSchema shows error when personalInfo is too short', ...);

// ★ AC 注释 · 每个 it 应能映射回 PRD AC
it('AC-7: pass/score consistency', ...);
it('AC-1: agent called with correct args', ...);
```

### 11.2 注释 AC 编号 (强制)

每个测试上面的 JSDoc 块必标 PRD + US + AC ·

```typescript
/**
 * Unit tests — PRD-5 US-003
 * copywriting.freeGenerate: 4 unit tests
 * AC-1: protectedProcedure · calls CopywritingAgent(mode='free')
 * AC-2: history.create writes all required fields
 * AC-6: zod input fail → TRPCError BAD_REQUEST
 * AC-7: agent isFallback=true → history written with isFallback=true
 */
```

---

## 12. 跑测试速查

```bash
# 全跑
pnpm test                           # vitest run · root config (unit + integration · ~3 min)
pnpm test:judge                     # vitest run · judge config (22 tests · ~30s mock)
pnpm test:e2e                       # playwright test (126 tests · ~15 min)

# 子集
pnpm test:unit                      # 仅 unit
pnpm test:integration               # 仅 integration · 需启 PG + Redis
pnpm test -- copywriting            # 跑名字含 copywriting 的
pnpm test:e2e -- tools-integration  # 跑指定 spec

# Web workspace
pnpm --filter @quanqn/web test      # 仅 web jsdom unit (4 tests)

# Watch mode
pnpm test --watch                   # vitest watch
pnpm test:e2e --ui                  # playwright UI mode

# Coverage
pnpm test --coverage                # 生成 coverage/

# Static
pnpm typecheck                      # 6 workspace tsc --noEmit
pnpm lint                           # 6 workspace eslint --max-warnings=0
pnpm format:check                   # prettier --check
```

---

## 13. 已知约束 / 限制

| 项 | 状态 | 备注 |
|---|---|---|
| coverage 门槛实测 | 当前未在 CI 强制 | LD-016 写在 vitest.config · 但 CI 集成 PRR 后启用 |
| 真 LLM e2e (`ip-flow-9-steps.spec.ts`) | 🟡 手动跑 | 跑一次 ~$2 成本 · 默认 skip · `RUN_LIVE_TESTS=1 pnpm test:e2e` 启用 |
| `apps/web/src/test/` 与 `tests/unit/web/` 共存 | 🟢 故意 | 前者 jsdom (真 React) · 后者 Node (测 schema/util) |
| `tests/llm-judge/` 空 | 🟡 legacy | US-016 后弃用 · 改 `tests/judge/*.judge.ts` · 待清 |
| 单 worker e2e | 🔴 不能改 | shared `dev@local.test` user race · LD-018 锁 |
| `tests/integration/api/` testTimeout 30s | 🟢 OK | 真 DB + nock + mock LLM · 1-3s 居多 |
| Specialist judge 11 个但只 11 file | 🟡 缺 | DiagnosisAgent / DeepLearnAgent / VoiceChatAgent / EvolutionAgent / DailyTaskAgent / PrivateDomainAgent 未加 judge — PRD-6+ 补 |

---

*Testing analysis: 2026-05-09 · derived from vitest.config.ts · vitest.judge.config.ts · playwright.config.ts · apps/web/vitest.config.ts · 实读 tests/judge/judge-runner.ts (130 lines) · tests/e2e/tools-integration.spec.ts (330 lines) · tests/unit/api/copywriting-router.test.ts · tests/integration/api/copywriting-free-llm.test.ts · tests/unit/specialists/__tests__/CopywritingAgent.test.ts*
