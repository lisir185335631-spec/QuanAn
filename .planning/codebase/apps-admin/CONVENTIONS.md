# Coding Conventions · apps/admin

**Analysis Date:** 2026-05-13

## Naming Patterns

**Files:**
- React component: `PascalCase.tsx` (TopBar.tsx / DenseTable.tsx / NsmFunnel.tsx / UserDetailDrawer.tsx)
- 主页: `index.tsx` 固定 (域目录下 · default export)
- Lib / util / route: `kebab-case.ts` (`admin-client.ts` / `admin-routes.ts`)
- CSS: `lowercase.css` (admin.css)
- Placeholder: 域名 `lowercase.tsx` (`evolution.tsx` / `compliance.tsx` / `reviewTrending.tsx`)

**Functions:**
- 顶级组件: `PascalCase` (TopBar / NsmDashboard / UsersPage)
- file-local 子组件: `PascalCase` (ActionChip / PageBtn / StatCard / Dialog / Label / GhostButton / PrimaryButton · 内联在使用文件)
- helper: `camelCase` (parseFilters / filtersToParams / formatDate / fmtValue / fmtDelta / extractPayloadHash / buildColumns / showToast / buildPieData)
- event handler: `handle<Event>` (handleCsvExport / handleExportPdf / handleSort / handleFiltersChange / handleAction / handleTraceSubmit / handleTabSwitch / handleUserSubmit) · **强制 handle 前缀**

**Variables:**
- camelCase (queryInput / openUserId / totalCount / totalPages / dialogTargetId / actionUser / topIndustries / changePlanUserId)
- Boolean 用 `is*` / `has*` / `should*` (isReadonly / isExporting / isPdfExporting / isError / isLoading / isBanned)
- Action mutation: `<Action>Mutation` (`changePlanMutation` / `triggerMutation` / `exportPdfMutation`)

**Constants:**
- UPPER_SNAKE_CASE 常量 (`ADMIN_ROUTES` / `ROUTE_GROUP_LABELS` / `TIME_RANGE_LABELS` / `DIMENSION_LABELS` / `PLANS` / `ROLES` / `INDUSTRIES` / `SORT_OPTIONS` / `STAGES` / `STAGE_LABELS` / `FILL_COLORS` / `PIE_COLORS` / `LINE_COLORS` / `SEVERITY_COLOR` / `CAT_COLORS` / `STEP_COUNT` / `ROW_HEIGHT` / `PAGE_SIZE`)
- 文件内常量: `const PAGE_SIZE = 20;`
- 模块导出常量: 显式 `export const ADMIN_ROUTES: AdminRouteItem[] = [...]`

**Types:**
- Interface: `PascalCase` (AdminRouteItem / FilterState / AccountFilterState / DenseTableColumn / UserRow / AccountRow / InviteRow / TimelineItem / DetailData / Alert / AnomalyFlag / PieEntry / StatusBarProps / Props)
- Type alias: `PascalCase` (AdminRole / TabId / TimeRange / Dimension / GroupBy / StatusFilter / ActiveTab / ActiveMode / LineMode / PlanType / SortDir)
- Generic 类型参数: 单字母 `T` (DenseTableColumn<T>)
- 主页 row 类型: `<Domain>Row` (UserRow / AccountRow / InviteRow)

**Routes:**
- Path: `/admin/<lowercase-or-camelCase>` (`/admin/nsm` 单词 lowercase · `/admin/reviewTrending` 多词 camelCase)
- 数据 group: kebab-case (`p0-core` / `p0-review` / `p1-health` / `p2-advanced`)

**CSS Class:**
- BEM 风格: `.admin-<block>__<element>--<modifier>` (`.admin-sidebar__item--active` / `.audit-drawer__title` / `.admin-statusbar__value--warn`)
- 根 class: 单段 `lowercase` (`.admin-layout` / `.admin-topbar` / `.admin-main` / `.admin-statusbar` / `.audit-drawer` / `.admin-dense-row`)

**CSS Variables (Aurelian Dark):**
- kebab-case 双连字符 (`--bg-panel` / `--text-muted` / `--gold-dim` / `--accent-purple` / `--status-err`)
- 集中定义在 `:root` (`apps/admin/src/styles/admin.css:3-36`)

## Code Style

**Formatting:**
- 单引号字符串 (`'apps/admin/src/lib/admin-client.ts'` · 全部)
- 分号结尾 (语句末)
- 2-space 缩进
- trailing comma 多行对象/数组末尾保留
- JSX prop 多于 2 个时换行 (e.g. `pages/users/index.tsx:417`)
- 长 inline style 多行展开

**Linting:**
- ESLint - `eslint src --ext ts,tsx --max-warnings=0` (零警告硬门禁 · `package.json:11`)
- 显式 eslint-disable 注释 (e.g. `// eslint-disable-next-line react-hooks/exhaustive-deps` 在 `users/index.tsx:232` · 必须写明理由)
- `// eslint-disable-next-line jsx-a11y/anchor-has-content` (隐藏 download anchor · `users/index.tsx:345`)

**Comments:**
- 文件顶部强制 `// PRD-<N> US-<NNN> · <description>` (例 `pages/users/index.tsx:1-3` / `lib/admin-routes.ts:1-3` / `components/admin/Sidebar.tsx:1-2`)
- AC 引用: `// AC-N: <description>` (`AdminLayout.tsx:2` / `Sidebar.tsx:2` / `nsm/index.tsx:3`)
- SHIELD 注释: `// SHIELD: <constraint>` (Recharts fill 必填 / DenseTable virtualScroll / payloadHash 必显 · `nsm/NsmFunnel.tsx:3` / `accounts/StepProgressChart.tsx:2` / `audit/AuditTimeline.tsx:3-4`) · 这是 ralph anti-pattern 注入的硬约束标记
- 区块分隔线: `// ── <SectionName> ──...─` (用于长文件结构化导航 · `users/index.tsx:18` / `accounts/index.tsx:34`)
- 行内 inline 仅在 trick 时说明 · 不重复变量名

## Import Organization

**Order (实测约定):**
1. React core (`useState` / `useEffect` / `useCallback` / `useMemo` / `Component` / 类型)
2. React Router (`useNavigate` / `useSearchParams` / `Outlet` / `Link` / `NavLink`)
3. 第三方库 (`@tanstack/react-query` / `@trpc/client` / `recharts`)
4. workspace package (`@quanan/ui/admin` / `@quanan/clients/admin-router-types`)
5. 相对路径 (`../../lib/admin-client` / `./PlanBadge` / `./UserDetailDrawer`)
6. type-only import (`import type { ... }`) 紧跟同源 value import 后 (verbatimModuleSyntax: true 要求)

**Path Aliases (apps/admin/tsconfig.json):**
- `@/*` → `./src/*` (lib/util 推荐用) · 但实际 99% 文件用相对路径 `../../lib/admin-client` (e.g. `pages/users/index.tsx:9`)
- 仅 `pages/Login.tsx:8` 使用 `@/lib/admin-client` · 习惯不统一 (tech debt)

**Workspace Aliases:**
- `@quanan/ui/admin` - 共享 UI 组件 (DenseTable 6 业务页全部用)
- `@quanan/clients/admin-router-types` - tRPC AdminRouter 类型
- `@quanan/schemas` - zod schema (admin app 当前未直接 import · 路径已就位)

**Type-only import:**
- 强制 `import type { ... }` 分开 (verbatimModuleSyntax: true)
- 例: `import { DenseTable } from '@quanan/ui/admin'; import type { DenseTableColumn } from '@quanan/ui/admin';` (`pages/users/index.tsx:7-8`)
- 例: `import type { FilterState } from './UserListFilters';` (`pages/users/index.tsx:17`)

## Error Handling

**Query 错误 (useQuery 三态):**
- 三态分支 `{isLoading, isError, refetch, data}` 显式处理 (e.g. `pages/users/index.tsx:244` / `pages/nsm/NsmOverviewCards.tsx:38`)
- isError → inline `<button onClick={() => void refetch()}>重试</button>` (统一文案 "数据加载失败 · 点击重试")
- isLoading → skeleton 或 "加载中…" (短文案 / 颜色 var(--text-muted))

**Mutation 错误 (useMutation):**
- `onError: (err) => showToast(\`失败: ${err.message}\`, 'err')` 通用 pattern (`ChangePlanDialog.tsx:30`)
- `onSuccess` 分支处理 status (e.g. `data.status === 'auto_executed' ? 'ok' : 'warn'` 改套餐 super vs admin 分流)

**Error Boundary:**
- NSM 主页用 class component (`pages/nsm/index.tsx:18`) · `static getDerivedStateFromError` + override render
- 其他业务页未用 ErrorBoundary · 依赖 useQuery 错误三态 (tech debt · 应推广 ErrorBoundary 到所有主页)

**Try/Catch:**
- 仅在 async handler 用 (e.g. `handleCsvExport` / `handleExportPdf` · `pages/cost/index.tsx:166` / `users/index.tsx:258`)
- catch (err) → `err instanceof Error ? err.message : String(err)` 双兜底 (useUnknownInCatchVariables: true 强制)

## Logging

**Framework:** 无 logger lib (winston / pino / consola 未引)

**Patterns:**
- ⚠️ console.* 已被 lint 禁 · 源码 0 次 console.log/warn/error
- 错误反馈走 showToast (DOM-based)
- 调试日志 · 暂无规约 (上线前考虑接入 Sentry / 浏览器 OTel)

## Toast / 通知

**Pattern:** DOM-based showToast 函数 (非 React-managed · 直接 createElement + appendChild)

**位置:** 6 文件重复定义 (anti-pattern · 见 ARCHITECTURE.md)
- `pages/cost/index.tsx:91`
- `pages/accounts/ForceFreezeDialog.tsx:220`
- `pages/accounts/AnomalyTab.tsx:284`
- `pages/accounts/AccountDetailDrawer.tsx:618`
- `pages/users/ChangePlanDialog.tsx:162`
- `pages/users/BanUserDialog.tsx`
- `pages/users/ResetPasswordDialog.tsx:98`

**签名:**
```typescript
function showToast(msg: string, type: 'ok' | 'warn' | 'err'): void
```

**实现要点:**
- `document.createElement('div')`
- color map: ok=#22c55e / warn=#f59e0b / err=#ef4444
- position: fixed bottom 24px / right 24px / z-index 9999
- setTimeout 3500ms 后 `el.remove()`

**例外:** Login 页用本地 useState toast (一次性 · 不复用 showToast · `pages/Login.tsx:12`)

## Comments

**When to Comment:**
- 文件顶部强制 PRD/US/AC 引用 (溯源)
- SHIELD 块标记 anti-pattern 防护
- 区块分隔线 (`// ── X ──`) 用于长文件 (> 200 行) 导航
- 行内仅在 non-obvious trick 时加 (e.g. `// eslint-disable-next-line ... · <reason>`)

**JSDoc/TSDoc:**
- ⚠️ 未使用 JSDoc 类型注解 (TS 已足够)
- 业务函数有 `//` 上方单行说明 · 不强制 doc comment

**Comments 反例 (Don't):**
- 不写"该函数做 X"(显而易见)
- 不写历史注释 (`// 2026-05-XX 改了 Y`) · 用 git blame
- 不留 commented-out code

## Function Design

**Size:**
- 文件级 · 100-700 行可接受 (主页 300-600 · sub-component 50-250)
- 函数级 · 单一组件函数 50-150 行典型 · Drawer 组件可到 600 行 (5-6 Tab 内联)
- 主页拆分: `index.tsx` 只装配 · 业务逻辑下放到 sub-component

**Parameters:**
- React 组件 props 用 `interface <Component>Props` 定义 (`apps/admin/src/components/admin/StatusBar.tsx:4`)
- 解构在函数签名 (`function StatusBar({ role = '...' }: StatusBarProps)`)
- 长 props 列表 (> 5 项) 多行展开
- 可选 prop 用 `?` 而不是 default = null

**Return Values:**
- 组件返回 JSX 单一根节点 (有时 Fragment `<>...</>`)
- helper 返回 `{ data: T[], keys: string[] }` 命名对象而不是 tuple
- `Date | string` 联合类型反复出现 (tRPC JSON 序列化无 superjson · ISO string 回来) · 主页 row type 显式标 `string` · 解析时 `new Date(String(row.field))`

## Module Design

**Exports:**
- 主页: `export default function <Page>()` (UsersPage / NsmDashboard / CostPage / AuditPage / InvitesPage / AccountsPage)
- 子组件: `export function <Component>()` named export
- 类型: `export interface <Type>` / `export type <Type>` (e.g. `pages/users/UserListFilters.tsx:5`)
- 常量: `export const <NAME>: <Type> = [...]`

**Barrel Files:**
- ⚠️ `apps/admin/src/index.ts` 仅 `export {}` 占位 · 不导出业务
- 各业务页无 barrel (即 pages/users/index.ts 不存在 · `pages/users/index.tsx` 是页面本体)
- 跨模块导入直接走具体文件 (e.g. `import { PlanBadge } from './PlanBadge'`)
- @quanan/ui/admin 有 barrel (`packages/ui/src/admin/index.ts`)

**Default Export:**
- 仅页面级 (`export default function <Page>()`) · 配合 React Router lazy 习惯
- placeholder 也用 default · `export default function EvolutionPlaceholder()`
- 子组件 / hook / util 都用 named export

## React Patterns

**State 选择:**
- URL params (列表 / 筛选 / 分页 / Drawer 打开): `useSearchParams()` (`pages/users/index.tsx:210` / `accounts/index.tsx:363` / `invites/index.tsx:231`)
- 局部 modal 开关: `useState` (changePlanUserId / banUserId / resetPwdUserId / drawerOpen)
- 全局共享 (me / role): `adminTrpc.auth.me.useQuery()` 每页重查 + 30s stale
- 派生计算: `useMemo` (queryInput / openUser / actionUser / columns / pivotAggregations)
- 回调记忆: `useCallback` (setPage / handleFiltersChange / handleSort / openDrawer / closeDrawer / handleAction)

**Memoization:**
- queryInput 用 `useMemo` 包 deps array · 避免每次 useQuery 重发 (`users/index.tsx:221-242`)
- columns 用 `useMemo` (deps role + handleAction · `users/index.tsx:340`)
- 列表派生 (openUser / actionUser) 用 `.find()` 不 memo (短 array · 性能 OK)

**Effect:**
- 局部 effect 仅在 AuditDrawer (ESC keydown) / TopBar (click outside) / UserListFilters (debounce search) 使用
- 不用 useEffect 做数据请求 (走 useQuery)

**Conditional Rendering:**
- 三元: `{isError ? <重试> : isLoading ? <加载中> : <数据>}` (实测 cost/users/accounts 主页)
- 短路: `{condition && <element>}` (e.g. `{role === 'super_admin' && <手动触发>}`)
- early return: `if (!userId) return null;` (Dialog · 见 `ChangePlanDialog.tsx:35`)

**Forms:**
- 受控组件 (value / onChange) · `<input>` `<textarea>` `<select>`
- 提交按钮 disabled 直接 `disabled={reason.length < 10 || !newPlan || mutation.isPending}` (内联条件 · 不抽 useFormState)
- 无 React Hook Form / Formik (1.0 不引)

## Accessibility (a11y)

**实测覆盖 (部分):**
- `<header role="banner">` / `<footer role="contentinfo">` / `<main role="main">` / `<nav aria-label="管理导航">` (chrome 全套)
- `aria-current="page"` Sidebar 活动项 (`Sidebar.tsx:33`)
- `aria-pressed` / `aria-haspopup` / `aria-expanded` TopBar dropdown (`TopBar.tsx:51-65`)
- `aria-label` Drawer / button / 表单 input (部分覆盖)
- `aria-modal="true"` + `aria-label` 在 invites Dialog (`CreateInviteDialog.tsx:52-53` / `BatchImportDialog.tsx:81-82`)
- `data-testid` 仅 chrome 用 (audit-drawer / audit-drawer-overlay / admin-layout · 3 处)

**缺口 (tech debt):**
- 业务页 Dialog (ChangePlan / Ban / ResetPassword / ForceFreeze) 缺 aria-modal
- 字段 input/label 关联 (`<label htmlFor>` 仅 Login 用 · 业务页 Dialog 都用孤立 div Label)
- 业务 Drawer 缺 focus trap (ESC 关闭已有 · Tab 循环未做)
- 表格行 onClick · 缺 keyboard handler (DenseTable 内部应处理)

## Async Patterns

**Async Function:**
- 全用 `async function` + `await` (无 .then chain)
- void IIFE 用于 fire-and-forget (e.g. `() => void refetch()` 给 onClick 用 · 因 onClick 不返 Promise)

**Promise Cleanup:**
- `setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000)` 显式释放 blob URL (`users/index.tsx:285`)
- `removeEventListener` 在 useEffect 返回 cleanup (`AuditDrawer.tsx:40` / `TopBar.tsx:31`)

---

*Convention analysis: 2026-05-13*
