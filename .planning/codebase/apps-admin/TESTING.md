# Testing Patterns · apps/admin

**Analysis Date:** 2026-05-13

## Test Framework

**Runner:**
- ⚠️ **当前 apps/admin/ 0 测试文件 · 0 测试框架配置**
- 实测: `find apps/admin -name "*.test.*" -o -name "*.spec.*"` → 0 命中
- `package.json` devDependencies 无 vitest / jest / @testing-library / playwright

**Assertion Library:**
- ⚠️ 未配置

**Run Commands:**
```bash
# 当前可用:
pnpm typecheck      # tsc --noEmit · 类型检查 (类型即测试 · TS strict)
pnpm lint           # ESLint --max-warnings=0 · 静态检查

# ⚠️ 未配置:
# pnpm test         # 单元测试 · 待添加
# pnpm test:watch   # watch 模式 · 待添加
# pnpm test:e2e     # E2E · 待添加
```

## Quality Gates (替代测试的当前手段)

**TypeScript strict 模式 (`tsconfig.base.json:13-29`):**
- `strict: true` 全套子开关启用
- `noUncheckedIndexedAccess` (数组/object index 强制 T|undefined)
- `noImplicitReturns` / `noFallthroughCasesInSwitch`
- `noUnusedLocals` / `noUnusedParameters`
- `useUnknownInCatchVariables` (catch err 是 unknown · 不是 any)
- `verbatimModuleSyntax: true` (import type 强制)
- 上述策略让"类型即文档" · 代替部分单元测试 (对 helper 函数尤其有效)

**ESLint --max-warnings=0:**
- 任何 warning 阻塞 build (`package.json:11` lint script)
- react-hooks/exhaustive-deps 严格执行 (有 disable 必带理由 · 如 `users/index.tsx:232`)
- jsx-a11y rules 部分覆盖 (有 disable e.g. `users/index.tsx:345`)

**Build 即冒烟测试:**
- `pnpm build` → `tsc && vite build` · 类型 error 阻塞
- 任何 import / type / unused 错误阻塞产物输出

**Opus Audit 实测验证 (替代 E2E):**
- gstack browse headless 浏览器跑业务页 · 截图保存 `apps/admin/screenshots/`
- 实测产物已就位: `apps/admin/screenshots/evolution-page.png` (PRD-11 audit 留存)
- 这是当前的主测试方法 · Coding 3.0 流程 Step 5.5 Opus 审

## Test File Organization

**Location (规划 · 实际未落地):**
- 共置 (推荐) · `<Component>.test.tsx` 与 `<Component>.tsx` 同目录 (现代 React 习惯 · vitest 默认 picks up)
- 集中 (备选) · `apps/admin/src/__tests__/` (减少业务目录噪音 · 但失去就近原则)

**推荐 Naming:**
- 单元测试 · `<Component>.test.tsx` (e.g. `DenseTable.test.tsx` / `PlanBadge.test.tsx` / `Sidebar.test.tsx`)
- 集成测试 · `<Page>.integration.test.tsx` (e.g. `UsersPage.integration.test.tsx`)
- E2E · `e2e/<flow>.spec.ts` (Playwright 习惯)
- Helper 测试 · `<file>.test.ts` (e.g. `admin-routes.test.ts` · 测 getRouteByPath)

**Structure (规划):**
```
apps/admin/
├── src/
│   ├── components/admin/
│   │   ├── TopBar.tsx
│   │   ├── TopBar.test.tsx              # 计划
│   │   ├── Sidebar.tsx
│   │   ├── Sidebar.test.tsx             # 计划
│   │   ├── AuditDrawer.tsx
│   │   └── AuditDrawer.test.tsx         # 计划
│   ├── lib/
│   │   ├── admin-routes.ts
│   │   └── admin-routes.test.ts         # 计划
│   └── pages/users/
│       ├── index.tsx
│       ├── PlanBadge.tsx
│       └── PlanBadge.test.tsx           # 计划
└── e2e/
    ├── login.spec.ts                    # 计划
    └── users-crud.spec.ts               # 计划
```

## Test Structure (规划 / 当未落地)

**Suite Organization (推荐 vitest + @testing-library/react):**
```typescript
// 示例: apps/admin/src/pages/users/PlanBadge.test.tsx (计划)
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PlanBadge } from './PlanBadge';

describe('PlanBadge', () => {
  it('renders free plan with grey color', () => {
    render(<PlanBadge plan="free" />);
    expect(screen.getByText('free')).toHaveStyle({ color: '#888' });
  });

  it('shows banned label when isBanned=true regardless of plan', () => {
    render(<PlanBadge plan="pro" isBanned />);
    expect(screen.getByText('banned')).toBeInTheDocument();
  });
});
```

**Patterns (推荐 · 落地时执行):**
- 1 describe 块 / 1 component
- 每 it 块测单一行为 · 避免一个 it 多 assertion
- 先 render · 再 query · 最后 assert
- 用 `screen.getByRole` / `getByLabelText` 而不是 `getByTestId` (符合 a11y 习惯)

## Mocking (规划)

**tRPC Mock:**
- 推荐 · `msw` (Mock Service Worker) + tRPC msw handler
- 例: `setupServer(adminTrpcMsw.users.list.query(() => mockUserList))`
- 启动 · `vitest setup file` 全局 setupServer

**fetch / Blob / URL.createObjectURL Mock:**
- 测 CSV / PDF 导出路径需 mock global.URL / global.fetch
- 用 vitest `vi.stubGlobal('URL', mockURL)`

**Local Storage / Session Cookie:**
- admin app 不用 localStorage · 仅 cookie · cookie 由 tRPC mock 路径模拟即可

## Fixtures and Factories (规划)

**Test Data:**
- 推荐放 `apps/admin/src/__fixtures__/`
- e.g. `apps/admin/src/__fixtures__/users.ts` exports `mockUserList` / `makeUser({...})`
- 简单工厂 · `function makeUser(overrides = {}) { return { id: 1, email: '...', ...overrides } }`

**Schema-derived Fixtures:**
- 用 `@quanan/schemas` zod schema 推 default value · 保证 fixture 跟 contract 同步
- 但当前 apps/admin 未直接 import schemas · 直接走 tRPC 类型 (`@quanan/clients/admin-router-types`)

## Coverage

**Requirements:** ⚠️ 当前无 coverage 配置

**Target (PRR 前规划):**
- 单元测试 chrome 4 件套 (TopBar / Sidebar / StatusBar / AuditDrawer) · 100% 覆盖
- 单元测试 lib (admin-routes / admin-client setup) · 100% 覆盖
- 单元测试 helper (parseFilters / filtersToParams / pivotAggregations / extractPayloadHash) · 100% 覆盖
- 单元测试 primitive (PlanBadge / 抽取后的 Dialog/ActionChip/StatCard) · 100% 覆盖
- 集成测试 6 业务页 · happy path 各一 (登录后进页面 → table 渲染 → 点行 → drawer open → 点 action → dialog → submit)
- E2E 6 happy path × Playwright

**View Coverage (规划命令):**
```bash
pnpm test --coverage    # 计划 · vitest coverage v8
```

## Test Types

**Unit Tests:**
- Scope (规划): 单一函数 / 单一组件 · 不跨边界 · 不打 tRPC
- Approach: vitest + @testing-library/react · mock tRPC via msw
- 优先级: helper 函数 / primitive / lib

**Integration Tests:**
- Scope (规划): 单个业务页 + tRPC mock + URL router · happy path
- Approach: render page in MemoryRouter + msw tRPC handler
- 优先级: 6 P0 业务页各 1-2 个 happy path

**E2E Tests:**
- Framework (规划): Playwright (`apps/api` 主项目已有 playwright 习惯 · 可复用 fixture)
- Scope: 真实浏览器 · 真实后端 (test DB quanan_test) · 模拟 admin 登录 → 操作
- 优先级: 上线前 PRR (P9.4 后)

## Common Patterns (规划落地时遵守)

**Async Testing:**
```typescript
// vitest + react-testing-library async
await waitFor(() => {
  expect(screen.getByText('加载完成')).toBeInTheDocument();
});
```

**Error Testing:**
```typescript
// mock tRPC error response · 验 UI 显示重试 button
adminTrpcMsw.users.list.query(() => { throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' }) });
render(<UsersPage />);
await waitFor(() => expect(screen.getByText('数据加载失败')).toBeInTheDocument());
await userEvent.click(screen.getByText('重试'));
```

**URL Params Testing:**
```typescript
// MemoryRouter 初始 URL 模拟 useSearchParams
render(
  <MemoryRouter initialEntries={['/admin/users?page=2&plan=pro']}>
    <Routes><Route path="/admin/users" element={<UsersPage />} /></Routes>
  </MemoryRouter>
);
// 验 useSearchParams 解析正确
```

**Recharts Testing:**
- 难点: Recharts 内部用 ResizeObserver / 浏览器 API · vitest jsdom 环境不全
- 推荐: 用 `Recharts.ResponsiveContainer` mock 成固定 size · 或仅测 props 传递 + skip render

## Current State Summary

| Test Type | Status | Files |
|-----------|--------|-------|
| Unit tests | ❌ 0 | - |
| Integration tests | ❌ 0 | - |
| E2E tests | ❌ 0 | - |
| Visual regression | ❌ 0 | - |
| Type checks | ✅ tsc strict | `pnpm typecheck` |
| Lint | ✅ ESLint zero-warning | `pnpm lint` |
| Build smoke | ✅ tsc + vite build | `pnpm build` |
| gstack browse verify | ✅ 截图存档 | `apps/admin/screenshots/` |
| Opus audit | ✅ 4 维度审 + 5 步 Cheat Sheet | `~/.claude/scripts/ralph/OPUS-AUDIT-CHEATSHEET.md` |

## Risks of 0-Test State

**For Refactoring:**
- 任何重构 (e.g. 抽 showToast → useToast) 无安全网
- 需依赖 Opus audit 全量 review 6 业务页
- 重构成本 = 实施成本 + Opus audit 成本 · 时间 / token 开销大

**For Regression:**
- AGENTS.md §10 LD-A 新增约束时 · 旧业务页可能 silent break · 唯靠人测
- Aurelian Dark token 改动 → 视觉回归无 catch (Chromatic / Percy 未接入)
- tRPC contract 变化 → 类型检查 catch · 运行时行为 (e.g. JSON 序列化 Date string 处理) 不 catch

**For New Developer Onboarding:**
- 无测试即无文档 · 新人靠读 600 行业务页学规约
- 加 component prop 时不知该如何被使用 · 容易写错

## Recommended PRR Roadmap

**Phase 1 (P9.4 + PRR 前 · 必做):**
- 添加 vitest + @testing-library/react + msw + jsdom 配置
- chrome 4 件套单测 + lib helper 单测 · 目标 50 test cases
- happy path 集成测试 × 6 业务页 (每页 1 个)
- 计预算: 2-3 天工作量 · 1 开发者

**Phase 2 (上线后稳定迭代期):**
- Playwright E2E × 6 happy path
- Chromatic visual regression
- 覆盖率门禁 80%+ for chrome + lib · 60%+ for pages
- 计预算: 1 周 · 1 开发者

**Phase 3 (长期):**
- 抽 primitive 到 packages/ui/src/admin · 测覆盖率应 90%+
- 性能 / a11y 自动化 (Lighthouse CI · axe-core)

---

*Testing analysis: 2026-05-13*
