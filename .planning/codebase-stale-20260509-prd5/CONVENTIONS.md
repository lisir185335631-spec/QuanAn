# Coding Conventions

**Analysis Date:** 2026-05-09
**Project:** QuanQn · IP 起号 / 内容创作 SaaS · TypeScript monorepo (pnpm 9.15.9 + turbo)
**Status (post PRD-5):** typecheck 6 workspaces · 0 errors · lint --max-warnings=0 通过 · 542 unit + 22 judge + 126 e2e 全绿

---

## 1. 命名约定 (Naming Patterns)

> **来源** · `AGENTS.md §6.1` 表 (line 1183-1200) · 实测 100% 落地

### 1.1 总表

| 对象 | 风格 | 实例 (file:line) |
|---|---|---|
| **类 / Specialist** | PascalCase + 语义后缀 | `class CopywritingAgent extends BaseSpecialist` (`apps/api/src/specialists/CopywritingAgent.ts:1`) · `class BaseSpecialist` (`apps/api/src/specialists/base/BaseSpecialist.ts:40`) |
| **React 组件文件** | PascalCase.tsx | `StepProgress.tsx` · `FeedbackButton.tsx` · `ToolForm.tsx` (`apps/web/src/components/`) |
| **Page 组件** | PascalCase.tsx | `Generate.tsx` · `BoomGenerate.tsx` · `VideoAnalysis.tsx` (`apps/web/src/pages/tools/`) · `Step1.tsx` ~ `Step9.tsx` (`apps/web/src/pages/step/`) |
| **业务模块文件 (api)** | camelCase.ts | `ipAccounts.ts` · `boomGenerate.ts` · `videoAnalysis.ts` · `videoProduction.ts` · `deepLearning.ts` (`apps/api/src/trpc/routers/`) |
| **基础设施文件** | kebab-case.ts | `account-isolation.ts` · `step-inputs.schema.ts` · `pii-mask.ts` |
| **目录名** | kebab-case | `apps/`、`packages/`、`tests/`、`workers/llm-gateway/`、`tests/llm-judge/` |
| **变量 / 函数** | camelCase | `accountId` · `assemblePrompt()` · `generateSpecialistTraceId()` |
| **常量 (模块级)** | SCREAMING_SNAKE_CASE | `STEP_INDUSTRY_KEYS` (`packages/schemas/src/specialist-io/step-inputs.schema.ts:7`) · `HOT_ELEMENT_KEYS_22` · `PASS_SCORE_THRESHOLD` (`tests/judge/judge-runner.ts:37`) · `HISTORY_SELECT` (`apps/api/src/trpc/routers/history.ts:27`) |
| **类型 / 接口** | PascalCase (无 I 前缀) | `SpecialistConfig` · `AssembledContext` · `JudgeCase` · `CopywritingMode` (✅ **不用** `ISpecialistConfig`) |
| **zod schema 变量** | camelCase + Schema 后缀 *或* camelCase + 直接命名 | `CopywritingOutputSchema` · `Step1InputSchema` (`packages/schemas/src/specialist-io/step-inputs.schema.ts:58`) · `analysisStructuralInput` / `analysisStructuralOutput` (`packages/schemas/src/specialist-io/analysis.schema.ts:13,26`) — 两种并存 · 新代码优先 PascalCase + Schema |
| **React Hook** | camelCase + use 前缀 | `useStepData` · `useActiveAccount` · `useAuth` (`apps/web/src/hooks/`) |
| **tRPC procedure** | camelCase 动词式 | `stepData.save` · `ipAccounts.create` · `copywriting.freeGenerate` · `history.list` |
| **tRPC sub-router 名** | camelCase (跟 procedure 字段一致) | `appRouter` 内键 `ipAccounts:` `copywriting:` `videoAnalysis:` (`apps/api/src/trpc/routers/_app.ts:26`) |
| **DB 表名 (prisma)** | snake_case 复数 | `step_data` · `evolution_insights` (model 名 `StepData` 单数) |
| **DB 列名** | snake_case | `account_id` · `created_at` · `trace_id` |
| **CSS 自定义类** | kebab-case + `aip-` 前缀 | `aip-card-glow` · `aip-step-header` |
| **测试文件** | `<原文件>.test.ts` 同名 | `copywriting-router.test.ts` · `BaseSpecialist.test.ts` · `tools-integration.spec.ts` (e2e) · `copywriting.judge.ts` (judge) |
| **e2e 测试 ID** | kebab-case (data-testid) | `tool-form-boom-generate` · `tool-result-generate` · `script-type-select` · `feedback-good` · `history-row-1002` · `analysis-dim-bar-钩子强度` |

### 1.2 路由 / URL 命名 (TS-001 case 协议)

| 层 | 风格 | 实例 |
|---|---|---|
| **URL path** | kebab-case (lowercase) | `/boom-generate` · `/video-analysis` · `/ip-plan` (`apps/web/src/router.tsx`) |
| **tRPC procedure name** | camelCase | `boomGenerate.generate` · `videoAnalysis.analyze` · `copywriting.freeGenerate` |
| **schema export** | camelCase or PascalCase+Schema | `copywritingFreeGenerateInput` (`packages/schemas/src/specialist-io/copywriting.schema.ts:50`) |
| **environment var** | UPPER_SNAKE | `DATABASE_URL` · `REDIS_URL` · `ANTHROPIC_API_KEY` · `VITE_API_BASE_URL` |

### 1.3 ★ agentId 命名硬约束 (TD-016 教训 · LD-002)

**铁律** · `agentId` 字段必须**精确匹配**类名 (PascalCase + `Agent` 后缀)，不允许小写 / kebab-case。

```typescript
// ✅ 正确 (apps/api/src/specialists/CopywritingAgent.ts:106)
const COPYWRITING_CONFIG: SpecialistConfig = {
  agentId: 'CopywritingAgent',
  // ...
};

// ❌ 禁止
agentId: 'copywriting'           // 小写
agentId: 'copywriting-agent'     // kebab-case
agentId: 'copywritingAgent'      // camelCase
agentId: 'Copywriting'           // 缺 Agent 后缀
```

**14 Specialist** (`apps/api/src/agents/base/types.ts:9`)：
- `PositioningAgent` `BrandingAgent` `MonetizationAgent` `TopicAgent`
- `CopywritingAgent` `VideoAgent` `LivestreamAgent` `PrivateDomainAgent`
- `AnalysisAgent` `DiagnosisAgent` `DeepLearnAgent` `VoiceChatAgent`
- `EvolutionAgent` `DailyTaskAgent`

**校验位置**：
- `cost_log.agent_id` 列 + `history.agent_id` 列 — 直接 string 存储 · join 报表用
- `Judge` 测试构造 `agentId: 'Judge-${case_.specialistId}'` (`tests/judge/judge-runner.ts:71`)
- `useFeedback` hook props 类型 `agentId: string` — UI 侧也透传，必须严格匹配

**为什么严格** · cost_log 报表按 `agentId` 聚合 · 不同大小写会拆成两条 · 影响成本归因。

### 1.4 文件大小 + 函数大小约束 (`AGENTS.md §6.3`)

| 对象 | 上限 | 软建议 | 实测中位 |
|---|:-:|:-:|:-:|
| 单文件行数 | 500 | 300 | 大多数 router < 300 (history.ts 120 / analysis.ts ~250) |
| 单 Specialist 文件 | 600 (放宽) | — | CopywritingAgent.ts ≈ 410 |
| 单函数行数 | 80 | 40 | execute() 模板方法 ~120 (BaseSpecialist · 不可压) |
| 单 import 数 | 25 | 15 | router 平均 6-12 |

---

## 2. 代码风格 (Code Style)

### 2.1 Prettier (`.prettierrc`)

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf",
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

**关键决策** ·
- **单引号** (`'foo'` 不是 `"foo"`)，但 JSON 文件保留双引号
- **trailingComma=all** — 所有 multiline 必带尾逗号 (函数参数、对象、数组)
- **printWidth=100** 不是 80 也不是 120 (cn 注释行多 · 100 折衷)
- **endOfLine=lf** + `.gitattributes` 强制 LF — 防 Windows CRLF 污染
- **prettier-plugin-tailwindcss** — 自动按 Tailwind 推荐顺序排 className

**调用** · `pnpm format` 全写盘 · `pnpm format:check` CI 用 · 范围 `{apps,packages,scripts,tests,prisma}/**/*.{ts,tsx,css,json,md}`

### 2.2 ESLint (`.eslintrc.cjs`)

**parser** · `@typescript-eslint/parser` + `parserOptions.project: './tsconfig.json'` (开 type-aware rules)

**plugins** · `@typescript-eslint` · `react` · `react-hooks` · `jsx-a11y` · `import`

**extends** (按顺序，`prettier` 必须最后) ·
1. `eslint:recommended`
2. `plugin:@typescript-eslint/recommended`
3. `plugin:@typescript-eslint/recommended-requiring-type-checking`
4. `plugin:react/recommended`
5. `plugin:react-hooks/recommended`
6. `plugin:jsx-a11y/recommended`
7. `plugin:import/recommended`
8. `plugin:import/typescript`
9. `prettier` ★ 必须末位 (关闭与 Prettier 冲突的格式 rule)

#### 关键规则 (强制 error 级)

```javascript
// LD-013 类型严格
'@typescript-eslint/no-explicit-any': 'error',                 // ★ 禁 any
'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],  // 用 _ 前缀豁免
'@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],  // 必须 import type
'@typescript-eslint/no-floating-promises': 'error',           // 必须 await 或 .catch()
'@typescript-eslint/no-misused-promises': 'error',            // forbid Promise<void> 在 onClick 等

// console 禁用 (§6.9 — 业务代码用 logger.info/warn/error)
'no-console': ['error', { allow: ['warn', 'error'] }],
'no-debugger': 'error',

// 风格
eqeqeq: ['error', 'always'],     // 必须 ===
'prefer-const': 'error',
'no-var': 'error',

// React
'react/react-in-jsx-scope': 'off',  // Vite 不需要 import React
'react-hooks/rules-of-hooks': 'error',
'react-hooks/exhaustive-deps': 'warn',
'react/prop-types': 'off',         // 用 TS 类型替代

// import 防循环 / 重复
'import/no-duplicates': 'error',
'import/no-cycle': 'error',
```

#### overrides (放宽场景)

```javascript
{
  files: ['tests/**/*.ts', '**/*.test.ts', '**/*.spec.ts'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',  // 测试 mock 允许 any
    'no-console': 'off',                          // 测试可 console.log debug
  },
},
{
  files: ['scripts/**/*.ts'],
  rules: { 'no-console': 'off' },                 // 脚本 CLI 用 console
}
```

**调用** · 各 workspace 自己跑 `pnpm lint` (`apps/web` `apps/api` `packages/schemas` 均为 `eslint . --ext ts[,tsx] --max-warnings=0`)

**根级** · `pnpm -r lint` (turbo) 跑全部 workspace · `pnpm lint:fix` 自动修

**门槛** · `--max-warnings=0` 一警告即 fail (Coding 3.0 audit hard fail)

### 2.3 lint-staged (pre-commit · husky)

```json
{
  "*.{ts,tsx}": ["eslint --fix --max-warnings=0", "prettier --write"],
  "*.{css,json,md}": ["prettier --write"]
}
```

`.husky/_/pre-commit` → 自动跑 `lint-staged`

---

## 3. Import 组织

### 3.1 ESLint `import/order` 规则 (`.eslintrc.cjs:38-43`)

```javascript
'import/order': ['error', {
  groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'type'],
  'newlines-between': 'always',                         // 每组之间空行强制
  alphabetize: { order: 'asc', caseInsensitive: true }, // 组内字母升序
  pathGroups: [{ pattern: '@/**', group: 'internal', position: 'before' }],  // @/ 归 internal
}],
```

**7 组 · 必空行分隔 · 组内字母升序：**

1. **builtin** — node 内置 (`node:crypto`, `node:async_hooks`)
2. **external** — npm 包 (`zod`, `@trpc/server`, `react`)
3. **internal** — `@/...` (workspace alias) 和 `@quanqn/...`
4. **parent** — `../foo`
5. **sibling** — `./foo`
6. **index** — `./`
7. **type** — `import type` 全归末尾 (跟 `consistent-type-imports` 配合)

### 3.2 实例 (`apps/api/src/specialists/CopywritingAgent.ts:16-27`)

```typescript
// external
import { z } from 'zod';

// sibling
import { BaseSpecialist } from './base/BaseSpecialist';

// type (末尾)
import type {
  SpecialistConfig,
  SpecialistRequest,
  InvokeLLMResult,
  AssembledContext,
  ILLMGateway,
  LLMCompleteRequest,
} from './base/types';
```

### 3.3 实例 (`apps/api/src/trpc/routers/copywriting.ts:12-19`)

```typescript
// external
import { z } from 'zod';

// internal (@/ alias)
import { copywritingAgent, type CopywritingOutput, type CopywritingFreeOutput } from '@/specialists/CopywritingAgent';
import { protectedProcedure } from '@/trpc/middleware/account-isolation';
import { router } from '@/trpc/trpc';

// type
import type { Prisma } from '@prisma/client';
```

### 3.4 实例 (`apps/web/src/pages/tools/Generate.tsx:9-20`)

```typescript
// external (workspace 包归 external — eslint-import-resolver-typescript 视 @quanqn/* 为 external)
import { copywritingFreeGenerateInput } from '@quanqn/schemas/specialist-io';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

// internal (@/ alias)
import { FeedbackButton } from '@/components/FeedbackButton';
import { ToolForm } from '@/components/ToolForm/ToolForm';
import { ToolResult } from '@/components/ToolResult/ToolResult';
import { useActiveAccount } from '@/hooks/useActiveAccount';
import { getToolLsKey } from '@/lib/ls-namespace';
import { trpc } from '@/lib/trpc';

// type
import type { FreeGenerateHistoryRow } from '@quanqn/clients/router-types';
```

### 3.5 路径别名 (path aliases)

**根级 `tsconfig.base.json:33-39`** · workspace 共享：

```json
"paths": {
  "@quanqn/schemas":    ["./packages/schemas/src"],
  "@quanqn/schemas/*":  ["./packages/schemas/src/*"],
  "@quanqn/ui":         ["./packages/ui/src"],
  "@quanqn/ui/*":       ["./packages/ui/src/*"],
  "@quanqn/clients":    ["./packages/clients/src"],
  "@quanqn/clients/*":  ["./packages/clients/src/*"]
}
```

**各 app 子 tsconfig 加 `@/`** (`apps/web/tsconfig.json:6-14` · `apps/api/tsconfig.json:9-13` · `apps/admin/tsconfig.json:6-14`)：

```json
"paths": {
  "@/*": ["./src/*"],
  "@quanqn/schemas":   ["../../packages/schemas/src"],
  "@quanqn/schemas/*": ["../../packages/schemas/src/*"]
  // (admin/web 还含 @quanqn/ui · @quanqn/clients)
}
```

**runtime 解析** · vitest config (`vitest.config.ts:5-11`) + vite config 必须**镜像** tsconfig 别名 — TypeScript paths 不会自动传递到 runtime。

---

## 4. TypeScript 配置 (6 workspace)

### 4.1 根 `tsconfig.base.json` (所有 workspace 继承)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,            // 强制 import type 语法
    "jsx": "react-jsx",
    "skipLibCheck": true,
    "noEmit": true,

    /* === LD-013 严格度门禁 === */
    "strict": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "alwaysStrict": true,
    "noUncheckedIndexedAccess": true,        // ★ arr[0] 推断为 T | undefined
    "noImplicitOverride": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "useUnknownInCatchVariables": true       // catch (err: unknown)
  }
}
```

> **未开** · `exactOptionalPropertyTypes` (AGENTS.md §6.5 提及但实测未开 — 与 zod `.optional()` 兼容性问题)。

### 4.2 根 `tsconfig.json` (project references)

```json
{
  "files": [],
  "references": [
    { "path": "./apps/web" },
    { "path": "./apps/api" },
    { "path": "./apps/admin" },
    { "path": "./packages/schemas" },
    { "path": "./packages/ui" },
    { "path": "./packages/clients" }
  ]
}
```

### 4.3 各 workspace tsconfig.json 差异

| Workspace | `jsx` | `lib` | `rootDir` | 备注 |
|---|---|---|:-:|---|
| `apps/web` | `react-jsx` (继承) | `ES2022, DOM, DOM.Iterable` (继承) | (无 — include `vite.config.ts vitest.config.ts`) | jsdom 测试环境 |
| `apps/api` | `preserve` (覆盖) | `ES2022` only (覆盖 — 去 DOM) | `./src` | Node 服务端 · 不需 DOM 类型 |
| `apps/admin` | (继承) | (继承) | `./src` | 占位 (P9.0 起实施) |
| `packages/schemas` | (继承) | `ES2022` only (覆盖) | `./src` | 纯 zod schema · 跨 web/api 共享 |
| `packages/ui` | (继承 — react-jsx) | (继承) | `./src` | React 组件库 |
| `packages/clients` | (继承 — react-jsx) | (继承) | `./src` | tRPC client 类型导出 |

**调用** · `pnpm typecheck` (根) → `pnpm -r typecheck` (turbo) → 各 workspace `tsc --noEmit`

**当前状态** · 6 workspaces · 0 errors · 完全通过

---

## 5. tRPC procedure 命名 + 鉴权约定

### 5.1 三档 Procedure (`apps/api/src/trpc/`)

| Procedure | 路径 | 何时用 | RLS |
|---|---|---|---|
| **publicProcedure** | `apps/api/src/trpc/trpc.ts:42` | 仅登录前 (e.g. `auth.callback`) | 无 |
| **protectedProcedure** | `apps/api/src/trpc/middleware/account-isolation.ts:52` | ★ **业务 procedure 默认必用** · 自动注入 RLS context | `set_config('app.current_account_id')` 强制 |
| **globalProcedure** | `apps/api/src/trpc/middleware/account-isolation.ts:58` | 跨 account 全局表 (User / InviteCode / TrendingItem) | bypass (meta.isGlobal=true) |

### 5.2 ★ REJ-013 反例锁 (跨 PRD 强制)

```typescript
// ❌ 错 (REJ-013) — 业务 router 用 publicProcedure
list: publicProcedure
  .query(async ({ ctx, input }) => { ... })

// ✅ 对 — 业务 router 必用 protectedProcedure
list: protectedProcedure
  .input(...)
  .query(async ({ ctx, input }) => {
    const { prisma, activeAccountId } = ctx;
    return prisma.history.findMany({
      where: { accountId: activeAccountId!, ... },  // 必须显式 accountId 过滤
    });
  })
```

实测 · `apps/api/src/trpc/routers/` 18 个 router · 业务 procedure **100%** 用 `protectedProcedure` (history.ts:54,89,109 · copywriting.ts:94,125 · knowledge.ts:80,87,94,108 等)。

### 5.3 procedure 命名

- camelCase 动词式 · `list / create / update / delete / generate / analyze / save / freeGenerate`
- sub-router 名 = key in `appRouter` · `apps/api/src/trpc/routers/_app.ts:26-47`
- procedure 文件名 = sub-router 名 · `copywriting.ts` `videoAnalysis.ts` `boomGenerate.ts`

### 5.4 input / output schema 命名

**inline schema** (router 文件内) ·
- 组合形态 · `<Verb><Entity>Input` (camelCase) · 如 `generateCopywritingInput` `optimizeCopywritingInput`
- 注意 · 同一 schema 在 router 和 `@quanqn/schemas` 都有时 **inline equiv**, 注释标 "Zod schemas inlined — `@quanqn/schemas/specialist-io` has canonical definition for client use" (`apps/api/src/trpc/routers/copywriting.ts:9`)

**packages/schemas 中央 schema** ·
- 文件名 · `<entity>.schema.ts` (`copywriting.schema.ts` `analysis.schema.ts` `step-inputs.schema.ts`)
- export 命名 · 两种并存 ·
  - **camelCase + 直接命名** · `copywritingFreeGenerateInput` `analysisStructuralInput` `analysisViralOutput` (PRD-5 新代码偏好)
  - **PascalCase + Schema 后缀** · `Step1InputSchema` `CopywritingOutputSchema` (`packages/schemas/src/specialist-io/step-inputs.schema.ts:58` · 老代码 PRD-2 时期偏好)
- 同一 schema 同时 `export const` + `export type` (zod infer) ·

```typescript
export const copywritingFreeGenerateInput = z.object({ ... });
export type CopywritingFreeGenerateInput = z.infer<typeof copywritingFreeGenerateInput>;
```

---

## 6. 中文 zod errors (★ US-008 AC-7 实证)

### 6.1 铁律

**所有 zod schema 的 `min()` / `max()` / `enum()` 必须带中文 `message`** — 不允许默认英文 error message 漏到前端。

### 6.2 三种写法 (`packages/schemas/src/specialist-io/`)

```typescript
// ① string min/max/length — 第二参对象 { message: '...' }
lastIndustry: z.string().min(1, { message: '行业必填' }),
lastPersonalInfo: z.string().min(20, { message: '个人信息至少20字' }).max(500),
copy: z.string().min(10, { message: '文案至少10字' }).max(3000, { message: '文案不超过3000字' }),

// ② enum — 第二参 errorMap
lastPlatform: z.enum(STEP_PLATFORM_KEYS, {
  errorMap: () => ({ message: '请选择平台' }),
}),

// ③ array min/max
lastElements: z.array(z.enum(HOT_ELEMENT_KEYS_22)).min(1).max(5),  // ★ array 的 min/max 也应带 message · TODO 补
```

### 6.3 反例 (US-008 reject 反例 · 入库)

```typescript
// ❌ 不允许 — 默认英文 message 暴露给前端
copy: z.string().min(10).max(3000)
// 用户看到 "String must contain at least 10 character(s)"

// ✅ 必带 message
copy: z.string().min(10, { message: '文案至少10字' }).max(3000, { message: '文案不超过3000字' })
```

### 6.4 测试断言 (`tests/unit/web/StepForm.test.tsx:104-118`)

```typescript
it('Step3InputSchema shows error when personalInfo is too short', () => {
  const result = Step3InputSchema.safeParse({
    lastPlatform: 'douyin',
    lastPersonalInfo: '短文本',
    lastTargetAudience: '目标用户',
  });
  expect(result.success).toBe(false);
  if (!result.success) {
    const personalInfoError = result.error.issues.find((i) =>
      i.path.includes('lastPersonalInfo'),
    );
    expect(personalInfoError?.message).toBe('个人信息至少20字');  // ★ 精确匹配中文
  }
});
```

> **TRPCError message 例外** · `throw new TRPCError({ code: 'NOT_FOUND', message: 'history_not_found' })` 用 snake_case 英文 — 这是**机器消费**的错误码 · 前端 catch 后映射成中文用户消息。区分 ·
> - **zod schema message** = 给用户看 (中文)
> - **TRPCError message** = 给前端 i18n 用 (英文/snake_case 编码)

---

## 7. 错误处理 (`AGENTS.md §6.4`)

### 7.1 4 类错误必区分

```typescript
// ① 用户输入错误 (4xx)
throw new TRPCError({
  code: 'BAD_REQUEST',
  message: '行业字段必须从 56 个预设中选择',  // 中文 · 给用户看
  cause: { trace_id }
});

// ② 鉴权错误 (401/403)
throw new TRPCError({ code: 'UNAUTHORIZED', cause: { trace_id } });
throw new TRPCError({ code: 'FORBIDDEN', cause: { trace_id } });
// 实例: account-isolation.ts:30 missing activeAccountId → FORBIDDEN

// ③ 系统错误 (5xx) — 必先 logger.error 再抛
logger.error({ err, trace_id, agentId }, 'LLM Gateway timeout');
throw new TRPCError({
  code: 'INTERNAL_SERVER_ERROR',
  message: '系统繁忙 · 请稍后再试',
  cause: { trace_id }
});

// ④ Specialist 失败降级 (不抛 · 标 isFallback=true)
return { ...fallback, isFallback: true, traceId };
// 实例: BaseSpecialist.ts:120-160 fallback path
```

### 7.2 错误处理铁律

| ✅ 必须 | ❌ 不允许 |
|---|---|
| 所有 catch 必带 trace_id 写日志 | `try { ... } catch {}` 静默吞错 |
| 用户看到的 message 是中文 + 友好 | 直接把 `err.stack` 暴露给用户 |
| 系统错误用 `logger.error` 不用 `console.log` | 生产代码出现 `console.log` (eslint error 级) |
| Specialist 失败有 `fallbackTemplate` 路径 | LLM 失败直接抛 500 |
| EvolutionAgent 失败异步重试 | EvolutionAgent 失败影响用户主流程 |

### 7.3 自定义 Error 类 (`apps/api/src/specialists/base/errors.ts`)

- `SchemaValidationError` (zod 二次失败)
- `LLMTimeoutError` (AbortError → throw)
- `FallbackTriggeredError` (降级标记)

---

## 8. 日志 (Logging)

### 8.1 框架

`pino` (`apps/api/src/lib/logger.ts:10`) · ESM 安全 import · pino-pretty 仅 NODE_ENV=development 用。

### 8.2 trace_id 自动注入

```typescript
// AsyncLocalStorage + pino mixin 自动把 traceId 注入每条日志
export const traceStore = new AsyncLocalStorage<{ traceId: string }>();

export const logger = pino({
  // ...
  mixin() {
    const store = traceStore.getStore();
    return store?.traceId ? { traceId: store.traceId } : {};
  },
});
```

`traceMiddleware` (`apps/api/src/trpc/trpc.ts:34`) 用 `traceStore.run({ traceId }, () => next(...))` 在每个 tRPC 请求作用域内传 traceId。

### 8.3 用法 (强制结构化)

```typescript
// ✅ 对 — 第一参对象 (上下文) · 第二参 message string
logger.info({ accountId, agentId, durationMs }, 'specialist.execute.success');
logger.warn({ agentId, traceId, issues: parsed.error.message }, 'specialist.schema_validation.retry');
logger.error({ err, agentId, traceId }, 'llm.gateway.timeout');

// ❌ 错 — 不允许 console (eslint error)
console.log('user logged in');           // 业务代码禁
console.warn('rate limit hit');          // 业务代码也禁 (allow=['warn','error'] 只是 lint 不挂 · 但仍应改 logger)
console.error('LLM failed:', err);       // 业务代码禁
```

**msg 命名** · `<domain>.<action>.<outcome>` · 例 `specialist.execute.success` `auth.login.failed` `llm.gateway.timeout`

---

## 9. 注释 (Comments)

### 9.1 头部注释 (强制)

每个文件顶部 JSDoc 块 · 含 ·
- 文件用途 (1-2 行 · 中文)
- 关联 PRD / US / AC (e.g. `PRD-5 US-003`)
- 关键 SHIELD / REJ 反例锁 (e.g. `SHIELD REJ-013: protectedProcedure (non-publicProcedure)`)

实例 (`apps/api/src/trpc/routers/history.ts:1-11`) ·

```typescript
/**
 * history router — PRD-5 US-011
 * AC-1: list query (protectedProcedure · agentId?, agentMode?, sourceType?, dateRange?, limit, offset)
 * AC-2: list select { id, agentId, agentMode, ... }
 * SHIELD REJ-013: protectedProcedure (non-publicProcedure)
 * SHIELD REJ-008: explicit accountId where + RLS via protectedProcedure
 */
```

### 9.2 区段分隔 (推荐 · 高频)

```typescript
// ── Mocks ────────────────────────────────────────────────────────────────────
// ── Test fixtures ─────────────────────────────────────────────────────────────
// ── Tests ─────────────────────────────────────────────────────────────────────
// ── Helpers ───────────────────────────────────────────────────────────────────
```

(见 `tests/unit/specialists/__tests__/CopywritingAgent.test.ts:32,46,95` · `tests/judge/judge-runner.ts:13,23,35`)

### 9.3 行内注释 (中文 · 解释 why 不解释 what)

- `// AC-7: pass/score consistency`
- `// LD-016 严格门禁`
- `// REJ-035 LS先写 + DB后写 · DB fail 时 LS 保留 + toast.error`
- `// ★ 必须设 SET LOCAL ROLE quanqn_app 否则 superuser 跳过 RLS`

---

## 10. 函数 / 模块设计

### 10.1 函数

- 上限 80 行 · 软建议 40 行
- **小函数原则** · `buildDateFilter` (`history.ts:42`) · `buildJudgePrompt` (`judge-runner.ts:93`) · `makeStreamGateway` (test helper)
- **参数对象优先** (>2 个参数) · 避免位置参数歧义
- **return type 显式** · 所有 export function 必标 return type · `Promise<JudgeResult>` `Promise<unknown>`

### 10.2 模块导出

- **named export 优先** · `export const copywritingRouter = router({ ... })`
- **default export 仅 React 页面** · `export default function Generate()`
- **type + value 同时导出** · `export const X = z.object({...}); export type X = z.infer<typeof X>;`

### 10.3 barrel files (索引文件)

`packages/schemas/src/index.ts` + `packages/schemas/src/specialist-io/index.ts` 等 · 重新导出 sub-module。

**铁律** (`vitest.config.ts:31`) · coverage 排除 `**/index.ts` (barrel 不算覆盖)

### 10.4 类设计

- **抽象基类 + 模板方法** · `BaseSpecialist<TIn, TOut>` (`apps/api/src/specialists/base/BaseSpecialist.ts:40`) — 子类只实现 `invokeLLM` + 3 abstract 属性 (`config` `inputSchema` `outputSchema`)
- **DI 注入** · constructor 接受可选 mock gateway · `constructor(gateway?: ILLMGateway)` (BaseSpecialist.ts:58)
- **静态可选模板** · `static readonly fallbackTemplate?: Record<string, unknown>` (用于 fallback 路径)

---

## 11. React / Web 约定

### 11.1 组件文件

- PascalCase.tsx (`Header.tsx` `FeedbackButton.tsx`)
- 同名目录 + index 复合组件 (`components/StepForm/StepForm.tsx` + `components/StepForm/IndustrySelect.tsx` + `TextareaField.tsx`)

### 11.2 Hook

- `use<Name>` camelCase · 一个文件一 hook (`hooks/useActiveAccount.ts`)

### 11.3 数据获取

- ★ 必用 tRPC client (`@/lib/trpc`) · **不允许直接 fetch / axios**
- mutation · `trpc.copywriting.freeGenerate.useMutation()`
- query · `trpc.history.detail.useQuery({ id }, { enabled: !!id })`

### 11.4 表单

- ★ 必用 `react-hook-form` + `zodResolver(@hookform/resolvers/zod)` (`apps/web/src/components/ToolForm/ToolForm.tsx:9-12`)
- schema 来源 · `@quanqn/schemas/specialist-io` (前后端共享)

### 11.5 LS-first dual-write (REJ-035)

- 表单数据先写 localStorage · 再写 DB · DB fail 时 LS 保留 + toast.error
- LS namespace · `getToolLsKey(accountId, toolKey, 'input')` (`apps/web/src/lib/ls-namespace.ts`)

### 11.6 a11y

- `jsx-a11y/recommended` · `click-events-have-key-events: warn`
- 所有交互按钮带 `aria-label` (中文 · `aria-label="有帮助"`)

### 11.7 data-testid (e2e 必加)

- kebab-case · `tool-form-boom-generate` · `analysis-dim-bar-钩子强度` (允许中文)
- 命名规则 · `<role>-<sub-role>-<id>` · 见 `tools-integration.spec.ts` 实测

---

## 12. 提交 / Git 约定

### 12.1 .gitattributes (强制 LF)

`.gitattributes` 强制所有文本 `eol=lf` — 防 Windows CRLF 混入。

### 12.2 commit message (PRD-5 实测格式)

```
feat: [US-011] - /history 接入 · 新建 history.ts router + History.tsx 真表格 + 跳转预填
fix: [US-008] - AC-7 中文 zod error · analysisStructuralInput copy min/max 加中文 message
```

格式 · `<type>: [<US-XXX>] - <短描述>`
- type · `feat` `fix` `refactor` `test` `docs` `chore`
- US-XXX · prd.json 的 story id (链接到验收标准)
- 描述 · 中文 · 用 `·` 分隔多个改动

### 12.3 husky + lint-staged

- `.husky/_/pre-commit` → `lint-staged` → eslint --fix + prettier --write
- `.husky/_/commit-msg` 暂未启 (可选 · 未配 commitlint)

---

## 13. 已知约定例外 (technical decisions)

| 例外 | 位置 | 理由 |
|---|---|---|
| `agents/specialists/CopywritingAgent.ts` 与 `specialists/CopywritingAgent.ts` 共存 | `apps/api/src/agents/specialists/` 仅 1 文件 (旧路径) · `apps/api/src/specialists/` 8 Specialist (新路径) | TD-005 历史目录残留 · 待 PRD-6 收敛到 `specialists/` |
| `Schema` 后缀 vs 直接命名 zod schema | 老 `Step*InputSchema` PascalCase · 新 `analysisStructuralInput` camelCase | PRD-2 vs PRD-5 风格漂移 · 新代码靠 camelCase · 老代码不强制改 |
| eslint allow `console.warn / .error` | `.eslintrc.cjs:49` `no-console: ['error', { allow: ['warn', 'error'] }]` | logger 兜底 · 但业务代码仍优先 logger |
| `import/no-named-as-default` 禁用对 pino | `apps/api/src/lib/logger.ts:9` `// eslint-disable-next-line import/no-named-as-default` | pino 是 CJS default export · 必须 import 默认 |

---

*Convention analysis: 2026-05-09 · derived from .eslintrc.cjs · .prettierrc · 6 tsconfig.json · AGENTS.md §6 · 实读 6 个 router + 3 个 Specialist + 4 个测试文件抽样验证*
