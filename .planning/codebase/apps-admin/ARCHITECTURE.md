<!-- refreshed: 2026-05-13 -->
# Architecture · apps/admin

**Analysis Date:** 2026-05-13

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                  Browser (admin.quanan.com)                  │
│                  Vite SPA · port 5174 dev                    │
├──────────────────────────────────────────────────────────────┤
│  App (BrowserRouter + tRPC Provider + QueryClient)          │
│  `apps/admin/src/App.tsx`                                    │
└──────────────────────┬───────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        ▼                              ▼
┌──────────────────┐         ┌────────────────────────────┐
│  /login          │         │  /admin (AdminLayout)      │
│  `pages/Login`   │         │  `layouts/AdminLayout.tsx` │
└──────────────────┘         └────────────┬───────────────┘
                                          │
                          ┌───────────────┼───────────────┐
                          ▼               ▼               ▼
                  ┌───────────┐   ┌──────────────┐   ┌──────────────┐
                  │  TopBar   │   │   Sidebar    │   │  StatusBar   │
                  │   60px    │   │   240px      │   │    24px      │
                  │ + 🔔 bell │   │ 16 routes    │   │ 5 status     │
                  │ + role    │   │ 4 groups     │   │ fields       │
                  └─────┬─────┘   └──────────────┘   └──────────────┘
                        │
                  ┌─────┴────────┐
                  ▼              ▼
            ┌──────────┐  ┌──────────────────────┐
            │   Main   │  │  AuditDrawer         │
            │ <Outlet> │  │ (React Portal)       │
            │          │  │ `components/admin/`  │
            └────┬─────┘  └──────────────────────┘
                 │
        ┌────────┴──────────┐
        ▼                    ▼
┌──────────────────┐  ┌─────────────────────────────────┐
│ P0 业务核心 6    │  │  placeholder pages × 10         │
│ pages/{nsm,users,│  │  pages/admin/placeholder/*.tsx  │
│ accounts,cost,   │  │  (P1/P2 域 · 待实现)            │
│ audit,invites}/  │  │                                 │
└────────┬─────────┘  └─────────────────────────────────┘
         │
         ▼ tRPC react-query hooks
┌─────────────────────────────────────────────────────────────┐
│  adminTrpc · createTRPCReact<AdminRouter>()                 │
│  `apps/admin/src/lib/admin-client.ts`                       │
│  → POST http://localhost:3000/trpc/admin (credentials)      │
└─────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| App | Root · QueryClientProvider + tRPC Provider + BrowserRouter | `apps/admin/src/App.tsx` |
| AdminRoutes | 16 域 Route 表 + /login + 404 fallback | `apps/admin/src/router.tsx` |
| AdminLayout | CSS Grid topbar/sidebar/main/statusbar/drawer 装配 | `apps/admin/src/layouts/AdminLayout.tsx` |
| TopBar | 60px · brand + role badge + 🔔 audit toggle + logout dropdown | `apps/admin/src/components/admin/TopBar.tsx` |
| Sidebar | 240px · 16 链接 · 4 分组 · NavLink active 高亮 | `apps/admin/src/components/admin/Sidebar.tsx` |
| StatusBar | 24px · ENV/RLS/WAF/MFA/Role 5 字段 stub | `apps/admin/src/components/admin/StatusBar.tsx` |
| AuditDrawer | createPortal slide-right · listMine 30s poll · ESC close | `apps/admin/src/components/admin/AuditDrawer.tsx` |
| ADMIN_ROUTES | 16 路由元数据 · group/requiredRole/prd | `apps/admin/src/lib/admin-routes.ts` |
| adminTrpc | tRPC React-Query 客户端 · /trpc/admin + credentials:'include' | `apps/admin/src/lib/admin-client.ts` |

## Pattern Overview

**Overall:** SPA · Container + Sub-component + Dialog/Drawer 三层组合

**Key Characteristics:**
- 单一 SPA shell (AdminLayout) · 16 业务路由 Outlet 渲染
- 每个 P0 业务页统一三段结构 · OverviewCards → Filter/Table/Charts → Drawer/Dialog
- tRPC react-query 全量数据流 · 无 Redux / Zustand · server state = 唯一 state
- URL params 持久化列表状态 (`useSearchParams`) · 跨刷新可恢复
- React Portal 用于 Drawer / Dialog overlay
- Aurelian Dark 视觉令牌 (CSS vars `--gold/--bg-panel/--text-muted` 等) 全局统一

## Layers

**Routing Layer:**
- Purpose: 16 路由表 + AdminLayout 嵌套 + /login + 404 redirect
- Location: `apps/admin/src/router.tsx` + `apps/admin/src/lib/admin-routes.ts`
- Contains: Route 表 + 路由元数据 (path/label/emoji/prd/requiredRole/group)
- Depends on: react-router-dom v6
- Used by: App.tsx + Sidebar.tsx

**Layout Layer:**
- Purpose: 4 区 CSS Grid shell (topbar/sidebar/main/statusbar) + Drawer Portal 槽位
- Location: `apps/admin/src/layouts/AdminLayout.tsx` + `apps/admin/src/styles/admin.css`
- Contains: Grid 模板 + 全局 CSS 变量 + Aurelian Dark token (--gold #d4af37)
- Depends on: components/admin/* 4 套件
- Used by: 所有 /admin/* 路由通过 Outlet

**Page Layer (6 P0 已实装):**
- Purpose: 业务页主控 · 状态 (URL params + useState) + tRPC 查询 + 子组件协调
- Location: `apps/admin/src/pages/{nsm,users,accounts,cost,audit,invites}/index.tsx`
- Contains: 主页面 (300~600 行) · buildColumns / 子组件聚合 / Drawer/Dialog state
- Depends on: lib/admin-client + 同目录 sub-components + @quanan/ui/admin (DenseTable)
- Used by: AdminRoutes Route element

**Sub-component Layer (同目录):**
- Purpose: 主页面拆分 · *OverviewCards / *Filters / *DetailDrawer / *Dialog / *Chart
- Location: `apps/admin/src/pages/<domain>/*.tsx` (同 domain 平铺 · 不嵌套深目录)
- Contains: 单职责组件 · 自含 trpc useQuery / useMutation
- Depends on: lib/admin-client + recharts (chart only) + @quanan/ui/admin
- Used by: 同目录 `index.tsx`

**Shared / External:**
- `@quanan/ui/admin` · DenseTable + tokens + PdfBillTemplate (`packages/ui/src/admin/`)
- `@quanan/clients/admin-router-types` · AdminRouter 类型 (`packages/clients/src/admin-router-types.ts`)
- `@quanan/schemas` · zod schemas (admin app 当前未直接 import 但在 path alias 中可用)

## Data Flow

### Primary Request Path (用户列表查询)

1. URL 携带 `?page=2&plan=pro&sortBy=email&sortDir=asc` 进入 `/admin/users` (`apps/admin/src/pages/users/index.tsx:209`)
2. `useSearchParams()` 解析为 `filters` + `page` 本地变量 (line 212-216)
3. `useMemo(queryInput, [page, filters.*])` 构建查询参数对象 (line 221-242)
4. `adminTrpc.users.list.useQuery(queryInput, { staleTime: 30_000 })` 发出 tRPC 调用 (line 244)
5. 请求落到 `httpBatchLink` → `POST http://localhost:3000/trpc/admin` (`apps/admin/src/lib/admin-client.ts:21`)
6. `credentials: 'include'` 自动带 lucia-auth session cookie
7. React-Query 接管缓存 + 30s staleTime
8. 数据回流后 `DenseTable` 渲染 · 虚拟滚动 32px row (`packages/ui/src/admin/DenseTable.tsx`)
9. 用户点击行 → `openDrawer(row.id)` 更新 URL `?userId=42` (line 320-322) · 同时打开 `UserDetailDrawer`

### Audit Drawer (右上 🔔 全局抽屉)

1. TopBar `<button>` 点击 → `onAuditDrawerToggle()` 翻转 `drawerOpen` state (`apps/admin/src/layouts/AdminLayout.tsx:14`)
2. AuditDrawer `open=true` → `createPortal(... document.body)` 挂到 body (`apps/admin/src/components/admin/AuditDrawer.tsx:45`)
3. `adminTrpc.audit.listMine.useQuery(undefined, { enabled: open, refetchInterval: 30_000 })` (line 25-29)
4. ESC 键监听 / overlay click 双关闭路径 (line 34-41)

### Mutation 路径 (改套餐 · super_admin 直执行 · admin 走审批)

1. `<ActionChip label="改套餐">` 点击 → `setChangePlanUserId(user.id)` (`apps/admin/src/pages/users/index.tsx:332`)
2. `<ChangePlanDialog>` 条件渲染 · 内嵌 reason textarea + plan dropdown
3. 提交 → `mutation.mutate({ userId, newPlan, reason })` (`apps/admin/src/pages/users/ChangePlanDialog.tsx:68`)
4. tRPC POST · onSuccess 分支判断 `data.status === 'auto_executed'` vs `pending_approval`
5. showToast 反馈 + onSuccess() refetch 列表 → Drawer/Dialog 关闭

**State Management:**
- 列表查询/筛选/分页 · 全部 URL 持久化 (useSearchParams) · 刷新可恢复
- Dialog 开关 state · 局部 useState (ChangePlanUserId / BanUserId / ResetPwdUserId)
- 全局共享 state (me / role) · `adminTrpc.auth.me.useQuery()` 每页重新查 + 30s stale
- 无 Redux / Zustand / Context · server state = React-Query 唯一 store

## Key Abstractions

**AdminRouteItem (16 路由元数据 array):**
- Purpose: 单一 source of truth · Sidebar 渲染 + Route 表 + 权限元数据共用
- Examples: `apps/admin/src/lib/admin-routes.ts` (17~166)
- Pattern: const array of `{path, label, emoji, prd, requiredRole, summary, group}` · 4 分组 enum (`p0-core` / `p0-review` / `p1-health` / `p2-advanced`)

**DenseTable (统一虚拟滚动表格):**
- Purpose: 32px row · 13px font · @tanstack/react-virtual · 100k+ row 平滑滚动
- Examples: 6 P0 业务页全部直接 `import { DenseTable } from '@quanan/ui/admin'`
- Pattern: `columns: DenseTableColumn<T>[] { key, label, width, sortable?, render }` · `data: T[]` · `onRowClick` · `onSort` · `selectedKey`

**Detail Drawer (右侧 Tab 抽屉):**
- Purpose: 列表点行 → 右侧抽屉 · 多 Tab 展示详情
- Examples: `apps/admin/src/pages/users/UserDetailDrawer.tsx` (5 tab) · `apps/admin/src/pages/accounts/AccountDetailDrawer.tsx` (6 tab) · `apps/admin/src/pages/invites/InviteDetailDrawer.tsx` · `apps/admin/src/pages/audit/AuditDetailDrawer.tsx`
- Pattern: 所有 Tab 作为 file-local sub-components 内联在 Drawer 文件中 · 避免 N+1 文件爆炸 (UserDetailDrawer 显式注释 "AC-4 · avoid 13-file split")

**Recharts Chart (业务图):**
- Purpose: FunnelChart / BarChart / PieChart / LineChart 业务可视化
- Examples: `nsm/NsmFunnel.tsx` (6-stage) · `nsm/NsmDistributions.tsx` (3 pie) · `accounts/StepProgressChart.tsx` (9-step Bar) · `cost/CostBreakdownChart.tsx` (multi-line + pie) · `invites/CampaignFunnelChart.tsx` (4-stage)
- Pattern: 全部 `<ResponsiveContainer>` 包裹 · `isAnimationActive={false}` · `fill: var(--accent-*)` 用 CSS 变量 · SHIELD 注释明示 "data points 必含 fill field"

## Entry Points

**index.html:**
- Location: `apps/admin/index.html`
- Triggers: Vite dev server / build 入口
- Responsibilities: `#root` div + `<script type="module" src="/src/main.tsx">`

**main.tsx:**
- Location: `apps/admin/src/main.tsx`
- Triggers: index.html 加载
- Responsibilities: `createRoot(document.getElementById('root')!).render(<App />)` · 仅 1 行运行时入口

**App.tsx:**
- Location: `apps/admin/src/App.tsx`
- Triggers: main.tsx 实例化
- Responsibilities: `<adminTrpc.Provider>` + `<QueryClientProvider>` + `<BrowserRouter>` + 全局 CSS import

## Architectural Constraints

- **Threading:** 单一 browser main thread · React 18 concurrent mode 默认开 · 无 Web Worker
- **Global state:** 无 Redux/Zustand · React-Query cache 为唯一共享状态层 (`apps/admin/src/lib/admin-client.ts:12`)
- **Circular imports:** 未发现 · 单向依赖 router → layouts → pages → components+lib → @quanan/ui+clients
- **CSS vars 锁定:** Aurelian Dark token (`--gold #d4af37` / `--bg-panel #111111` / `--text #e0e0e0` 等) 在 `apps/admin/src/styles/admin.css:3-36` 集中定义 · 所有 inline style 引用 `var(--*)`
- **密集模式锁定 (AGENTS §10):** row 32px / font 13px / topbar 60px / sidebar 240px / statusbar 24px · CSS `:root` 变量 (`apps/admin/src/styles/admin.css:4-10`)
- **路由权限元数据:** `requiredRole` 在 `apps/admin/src/lib/admin-routes.ts` 仅作元数据 · 实际权限拦截由后端 6 闸 + sidebar 隐藏 (当前未启用前端隐藏 · 后续 PRD-13 接入)

## Anti-Patterns

### showToast 函数 6 文件重复定义

**What happens:** `showToast(msg, type)` 函数体在 `pages/cost/index.tsx:91` / `pages/accounts/ForceFreezeDialog.tsx:220` / `pages/accounts/AnomalyTab.tsx:284` / `pages/accounts/AccountDetailDrawer.tsx:618` / `pages/users/ChangePlanDialog.tsx:162` / `pages/users/BanUserDialog.tsx` / `pages/users/ResetPasswordDialog.tsx:98` 多处复制粘贴 · 完全相同实现 (createElement 直接 DOM 注入)
**Why it's wrong:** 6 处独立维护 · 任何样式/动画/超时调整需 6 次同步 · 难加 dedup / 队列 / queue limit
**Do this instead:** 抽到 `apps/admin/src/lib/toast.ts` 单一 export · 或升级到 `packages/ui/src/admin/Toast.tsx` 跨子项目共享

### Dialog / Label / GhostButton / PrimaryButton primitive 重复

**What happens:** `function Dialog({ title, onClose, children })` 重复出现于 `ChangePlanDialog.tsx:81` / `BanUserDialog.tsx:92` / `ResetPasswordDialog.tsx:98` / `ForceFreezeDialog.tsx:87` · 4 份独立实现
**Why it's wrong:** 同一 modal 视觉 (50% center + dark overlay + gold title + close ×) 4 处独立维护
**Do this instead:** 抽到 `packages/ui/src/admin/Dialog.tsx` + 同目录 `Label/GhostButton/PrimaryButton`

### ActionChip 3 文件重复 + PageBtn 3 文件重复 + StatCard 多文件重复

**What happens:** ActionChip 在 `pages/users/index.tsx:62` + `pages/accounts/index.tsx:62` + `pages/accounts/AnomalyTab.tsx:251` · PageBtn 在 `users/index.tsx:95` + `accounts/index.tsx:95` + `invites/index.tsx:92` · StatCard 在 `audit/index.tsx:18` + `invites/index.tsx:44` + `accounts/index.tsx:137` (OverviewCard) + `users/UsersOverviewCards.tsx:12` + `accounts/AccountDetailDrawer.tsx:224`
**Why it's wrong:** 6 业务页同一视觉单元彼此独立拷贝
**Do this instead:** 抽 `packages/ui/src/admin/{ActionChip,PageBtn,StatCard,OverviewCard}.tsx`

### Inline style 大量散落

**What happens:** 6 业务页几乎全部用 React inline `style={{...}}` · 仅 AdminLayout + TopBar/Sidebar/StatusBar/AuditDrawer 用 CSS class
**Why it's wrong:** Tree-shaking 弱 + 难做 hover/responsive · 同一 style block 多处重复
**Do this instead:** 业务页样式应迁到 `styles/admin.css` BEM class 或 CSS module · 这是已知 tech debt (后续 design system 重构)

## Error Handling

**Strategy:** React Error Boundary (局部) + 每个 useQuery 三态分支 (`isLoading` / `isError` / `data`)

**Patterns:**
- NSM 主页用 class component ErrorBoundary 包裹 `NsmDashboardInner` (`apps/admin/src/pages/nsm/index.tsx:18`) · fallback "数据加载失败 · 点击重试"
- 其他业务页 inline `{isError && <重试 button>}` (e.g. `users/index.tsx:396` / `accounts/index.tsx:504`)
- Mutation `onError: (err) => showToast(失败: ${err.message}, 'err')` 全局规约
- 空状态: `<empty-state>暂无邀请码 · 点击创建</empty-state>` / `<等待首次聚合>` · 主动引导而非空白

## Cross-Cutting Concerns

**Logging:** 未使用 logger · console.* 已 lint 禁 (源码 0 命中)

**Validation:** 简单 inline (e.g. reason.length < 10 / !newPlan disabled submit) · 未引 zod 客户端 schema

**Authentication:** lucia-auth session cookie · `credentials: 'include'` 由 tRPC httpBatchLink fetch override 注入 (`apps/admin/src/lib/admin-client.ts:23-26`) · 401 → BE 强制跳 `/login` (frontend 未做 401 拦截 + redirect · 待 PRD-13)

**Authorization (前端):** `adminTrpc.auth.me.useQuery()` 取 role · 业务页 `if (role === 'readonly_admin') return null` 隐藏 action chip · 实际拦截在后端 (LD-A-2 / 6 闸)

**Accessibility:** Sidebar/TopBar/StatusBar/AuditDrawer 用了 `role` / `aria-label` / `aria-pressed` / `aria-current` · 部分业务 Dialog 用 `aria-modal="true"` (CreateInviteDialog / BatchImportDialog) · 其他 Dialog 缺 aria 标签 (tech debt)

**Internationalization:** zh-CN only (1.0 锁定 · 不引 i18n lib) · `<html lang="zh-CN">` (`apps/admin/index.html:2`)

---

*Architecture analysis: 2026-05-13*
