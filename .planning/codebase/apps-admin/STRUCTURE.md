# Codebase Structure · apps/admin

**Analysis Date:** 2026-05-13

## Directory Layout

```
apps/admin/
├── index.html                              # Vite SPA 入口 · #root + main.tsx
├── package.json                            # @quanan/admin · workspace deps
├── tsconfig.json                           # extends ../../tsconfig.base.json
├── vite.config.ts                          # React plugin + @ alias + port 5174
├── vite-env.d.ts                           # Vite env type declaration
├── README.md                               # P0 占位说明 (旧 · 实施已超前)
├── .gstack/                                # gstack 浏览验证日志 (P0 调试产物)
│   ├── browse-console.log
│   └── browse-network.log
├── screenshots/                            # 验证截图 (人工 / Opus audit 用)
│   ├── evolution-page.png
│   └── ... (其他 PRD audit 留存)
├── src/
│   ├── App.tsx                             # tRPC + Query + Router Provider 装配 (19 行)
│   ├── main.tsx                            # createRoot(...).render(<App />) (5 行)
│   ├── router.tsx                          # 16 路由 Route 表 + /login + 404 (63 行)
│   ├── index.ts                            # 模块占位 (12 行 · export {})
│   │
│   ├── components/                         # 全局共享 UI (跨页/跨域)
│   │   └── admin/
│   │       ├── AuditDrawer.tsx             # 🔔 Drawer · Portal · 30s poll listMine (94)
│   │       ├── Sidebar.tsx                 # 240px · 16 路由 4 分组 (47)
│   │       ├── StatusBar.tsx               # 24px · 5 字段 stub (28)
│   │       └── TopBar.tsx                  # 60px · brand + role + bell + logout (111)
│   │
│   ├── layouts/
│   │   └── AdminLayout.tsx                 # CSS Grid shell + Outlet 槽 (35)
│   │
│   ├── lib/                                # 跨业务通用层
│   │   ├── admin-client.ts                 # tRPC react-query 客户端 (30 · /trpc/admin)
│   │   └── admin-routes.ts                 # 16 路由元数据 array (177)
│   │
│   ├── hooks/                              # ⚠️ 空目录 · 预留
│   │
│   ├── styles/
│   │   └── admin.css                       # Aurelian Dark token + Layout + Drawer (345)
│   │
│   └── pages/
│       ├── Login.tsx                       # Email + mock OAuth + Google stub (148)
│       │
│       ├── nsm/                            # P0-1 · /admin/nsm
│       │   ├── index.tsx                   # 主页 + ErrorBoundary + 2-col grid (113)
│       │   ├── NsmAlerts.tsx               # 右栏告警 list
│       │   ├── NsmDistributions.tsx        # 3 PieChart 行业/平台/画像 (139)
│       │   ├── NsmFunnel.tsx               # 6-stage FunnelChart (60)
│       │   └── NsmOverviewCards.tsx        # 4 big-number cards + 手动触发 (162)
│       │
│       ├── users/                          # P0-2 · /admin/users
│       │   ├── index.tsx                   # 主页 + URL params + DenseTable + dialogs (477)
│       │   ├── BanUserDialog.tsx           # 封禁 modal (138)
│       │   ├── ChangePlanDialog.tsx        # 改套餐 modal · 自含 showToast (174)
│       │   ├── PlanBadge.tsx               # plan 颜色徽章 free/pro/enterprise/banned (38)
│       │   ├── ResetPasswordDialog.tsx     # 重置密码 modal (128)
│       │   ├── UserDetailDrawer.tsx        # 5-tab 右抽屉 (603 · 注释 "avoid 13-file split")
│       │   ├── UserListFilters.tsx         # 多维筛选 + 300ms debounce (164)
│       │   └── UsersOverviewCards.tsx      # 顶部 4 stat card (59)
│       │
│       ├── accounts/                       # P0-3 · /admin/accounts
│       │   ├── index.tsx                   # 主页 + 2 tab(全部/异常) + Pie 分布 (566)
│       │   ├── AccountDetailDrawer.tsx     # 6-tab 抽屉 (630 · 最大文件)
│       │   ├── AccountListFilters.tsx      # 行业/平台/等级筛选 (184)
│       │   ├── AnomalyTab.tsx              # 异常 flag list + resolve/falsePositive (296)
│       │   ├── ForceFreezeDialog.tsx       # 强制冻结 modal · super_admin (232)
│       │   └── StepProgressChart.tsx       # 9-step BarChart · purple bar (52)
│       │
│       ├── cost/                           # P0-4 · /admin/cost
│       │   ├── index.tsx                   # 主页 + time/dim dropdown + CSV/PDF export (361)
│       │   ├── CostAlertsPanel.tsx         # 右栏 alerts (138)
│       │   ├── CostBreakdownChart.tsx      # LineChart × N + PieChart (235)
│       │   ├── CostOverviewCards.tsx       # 顶部统计 cards (109)
│       │   └── CostTopUsersChart.tsx       # Top users BarChart (139)
│       │
│       ├── audit/                          # P0-5 · /admin/audit
│       │   ├── index.tsx                   # 主页 + trace lookup + tab + PDF dialog (567)
│       │   ├── AuditDetailDrawer.tsx       # prompt/response/context 抽屉 (213)
│       │   ├── AuditTimeline.tsx           # DenseTable + payloadHash 列 (147)
│       │   └── TraceLookupInput.tsx        # traceId 输入 + validate
│       │
│       ├── invites/                        # P0-6 · /admin/invites
│       │   ├── index.tsx                   # 主页 + tab(list/campaigns) (602)
│       │   ├── BatchImportDialog.tsx       # CSV 批量导入 modal (250)
│       │   ├── CampaignFunnelChart.tsx     # 4-stage FunnelChart (84)
│       │   ├── CreateInviteDialog.tsx      # 单条创建 modal (194)
│       │   └── InviteDetailDrawer.tsx      # 邀请码详情抽屉 (200)
│       │
│       └── admin/
│           └── placeholder/                # P1/P2 域占位页 (10 个 · 4-12 行/个)
│               ├── ab.tsx
│               ├── approval.tsx
│               ├── compliance.tsx
│               ├── config.tsx
│               ├── evolution.tsx
│               ├── knowledge.tsx
│               ├── prompts.tsx
│               ├── quota.tsx
│               ├── reviewDeepLearn.tsx
│               └── reviewTrending.tsx
└── node_modules/                           # pnpm install (workspace-resolved)
```

## Directory Purposes

**`apps/admin/src/components/admin/`:**
- Purpose: 全局 chrome 组件 (跨业务页共享 · 跟域无关)
- Contains: TopBar / Sidebar / StatusBar / AuditDrawer 4 件套
- Key files: `AuditDrawer.tsx` (Portal + 30s poll · 全局可用) · `Sidebar.tsx` (单一 ADMIN_ROUTES 渲染源)

**`apps/admin/src/layouts/`:**
- Purpose: 单一 SPA shell · CSS Grid 装配 4 区
- Contains: AdminLayout.tsx (唯一文件)
- Key files: `AdminLayout.tsx`

**`apps/admin/src/lib/`:**
- Purpose: 跨业务通用基础设施 · 不含业务逻辑
- Contains: tRPC 客户端 + 路由元数据
- Key files: `admin-client.ts` (adminTrpc + adminQueryClient + adminTrpcClient) · `admin-routes.ts` (ADMIN_ROUTES array)

**`apps/admin/src/styles/`:**
- Purpose: Aurelian Dark CSS token + Layout class 集中点
- Contains: 唯一 admin.css
- Key files: `admin.css` (`:root` token + .admin-layout grid + .audit-drawer + .admin-sidebar BEM class)

**`apps/admin/src/pages/<domain>/`:**
- Purpose: 单一业务域内聚 · 主页 + 同域所有子组件平铺
- Contains: `index.tsx` (主控) + `*Drawer/*Dialog/*Chart/*Filters/*Cards`
- Key files: 6 P0 域各自 1 个 `index.tsx`
- Pattern: 不嵌套子目录 · 同域全部文件平铺 (即使 18 个文件 · 见 accounts/)

**`apps/admin/src/pages/admin/placeholder/`:**
- Purpose: 未实装路由占位 · 10 个 P1/P2 域
- Contains: 4-12 行的 placeholder 函数组件
- Key files: 全部 export default function · 渲染 `<h2>PRD-X · 域 Y · 待落地</h2>`

**`apps/admin/src/hooks/`:**
- Purpose: 自定义 hook (预留)
- Contains: ⚠️ 当前空目录 · 0 文件
- Note: 未来 useToast / useAuth / useDebounce 应放这里

## Key File Locations

**Entry Points:**
- `apps/admin/index.html` · Vite SPA HTML 入口
- `apps/admin/src/main.tsx` · React root 挂载
- `apps/admin/src/App.tsx` · Provider 装配

**Configuration:**
- `apps/admin/package.json` · workspace deps (React/Vite/tRPC/Recharts/@quanan/{ui,clients})
- `apps/admin/tsconfig.json` · paths alias `@/*` + `@quanan/{schemas,ui,clients}/*`
- `apps/admin/vite.config.ts` · port 5174 + @ alias + dist-admin outDir
- `apps/admin/vite-env.d.ts` · import.meta.env 类型

**Core Routing:**
- `apps/admin/src/router.tsx` · React Router Route 表 (63 行)
- `apps/admin/src/lib/admin-routes.ts` · 16 路由元数据 array (177 行)

**Core Data Layer:**
- `apps/admin/src/lib/admin-client.ts` · adminTrpc + httpBatchLink /trpc/admin

**Shared UI (跨子项目):**
- `packages/ui/src/admin/DenseTable.tsx` · 32px 虚拟滚动表格
- `packages/ui/src/admin/index.ts` · barrel export
- `packages/ui/src/admin/tokens.ts` · Aurelian Dark 颜色 / 间距 token
- `packages/ui/src/admin/PdfBillTemplate.tsx` · 月度账单 PDF 模板
- `packages/ui/src/admin/PdfForensicTemplate.tsx` · 审计取证 PDF 模板

**Testing:** ⚠️ 当前 apps/admin/ 0 测试文件 (`*.test.*` / `*.spec.*` 全无) · 见 TESTING.md

## Naming Conventions

**Files:**
- Component: `PascalCase.tsx` (TopBar.tsx / DenseTable.tsx / NsmFunnel.tsx)
- 主页: `index.tsx` 固定 (符合 React Router lazy + default export 习惯)
- Lib / hook: `kebab-case.ts` (admin-client.ts / admin-routes.ts)
- CSS: `lowercase.css` (admin.css)
- Placeholder: 域名 `lowercase.tsx` (evolution.tsx / knowledge.tsx)

**Directories:**
- 业务域: `lowercase` 单复数随业务 (users / accounts / cost / audit / invites / nsm)
- 共享层: `lowercase` (components / layouts / lib / hooks / styles / pages)
- 平铺: 同域所有子组件平铺 · 不嵌套 (accounts/ 有 6 文件 · 不分 detail/ + dialog/)

**Components:**
- 主页函数: `export default function <Domain>Page()` (UsersPage / AccountsPage / CostPage / AuditPage / InvitesPage / NsmDashboard)
- 子组件: `export function <Domain><Role>()` (UsersOverviewCards / AccountListFilters / NsmFunnel / CampaignFunnelChart)
- Drawer: `<Domain>DetailDrawer` (UserDetailDrawer / AccountDetailDrawer / InviteDetailDrawer / AuditDetailDrawer)
- Dialog: `<Action>Dialog` (ChangePlanDialog / BanUserDialog / ResetPasswordDialog / ForceFreezeDialog / CreateInviteDialog / BatchImportDialog)
- Chart: `<Domain><Type>Chart` (StepProgressChart / CostBreakdownChart / CampaignFunnelChart)

**Routes:**
- Path: `/admin/<lowercase>` (`/admin/nsm` / `/admin/users` / `/admin/reviewTrending`)
- camelCase 用于多词 (`reviewTrending` / `reviewDeepLearn` 不是 `review-trending`)

**CSS Class:**
- BEM: `.admin-<block>__<element>--<modifier>` (`.admin-sidebar__item--active` / `.audit-drawer__title`)
- Layout root: `.admin-layout` / `.admin-topbar` / `.admin-sidebar` / `.admin-main` / `.admin-statusbar` / `.audit-drawer`

**CSS Variables (Aurelian Dark):**
- 布局: `--topbar-height` / `--sidebar-width` / `--row-height` / `--font-size-dense`
- 色彩: `--gold` / `--gold-dim` / `--gold-text` / `--bg` / `--bg-panel` / `--text` / `--text-muted` / `--text-dim`
- 状态: `--status-ok` / `--status-warn` / `--status-err`
- 强调: `--accent-purple` / `--accent-blue` / `--accent-green` / `--accent-amber`

## Where to Add New Code

**New Business Page (e.g. PRD-13 域 ⑨ EvolutionMonitoring):**
- 删 `apps/admin/src/pages/admin/placeholder/evolution.tsx`
- 创建 `apps/admin/src/pages/evolution/` 目录
- 添加 `index.tsx` (主页 · 复制 nsm/users 模式 · OverviewCards + Filters + Table + Drawer)
- 同目录添加 `Evolution*` 子组件 (平铺 · 不开子目录)
- 改 `apps/admin/src/router.tsx` 把 `<Route path="evolution" element={<EvolutionPlaceholder />} />` 改成新组件
- `apps/admin/src/lib/admin-routes.ts` 路由元数据已就位 (group=p1-health) · 无需改

**New Drawer / Dialog (业务页内):**
- 直接放业务域目录 (e.g. `apps/admin/src/pages/users/NewActionDialog.tsx`)
- 复制 `ChangePlanDialog.tsx` 的 Dialog primitive (Label / GhostButton / PrimaryButton)
- ⚠️ 复用 primitive 而非每次重写 · 长期目标是抽到 `packages/ui/src/admin/Dialog.tsx`

**New Chart:**
- 同业务域目录 · 命名 `<Domain><Type>Chart.tsx`
- import recharts · ResponsiveContainer 包裹 · isAnimationActive={false}
- data point 必含 `fill: var(--accent-*)` (Recharts 不会自动用 CSS var)

**New Shared Component (跨业务页):**
- 放 `apps/admin/src/components/admin/` (chrome) 或 `packages/ui/src/admin/` (跨子项目)
- chrome 例: 加 GlobalSearchBar → components/admin/
- 跨子项目例: 抽 Dialog primitive → packages/ui/src/admin/Dialog.tsx + barrel export

**New tRPC Procedure (后端契约新增):**
- 不在 apps/admin 改 · 改 `apps/api/admin/routers/<domain>.ts` + 顶层 router 注册
- `packages/clients/src/admin-router-types.ts` 自动反映新 procedure
- apps/admin 用 `adminTrpc.<router>.<procedure>.useQuery / useMutation` 即得类型

**New Hook:**
- 创建 `apps/admin/src/hooks/<name>.ts` (当前空目录 · 待 useToast / useDebounce / useAuth 落地)

**New Util / Helper:**
- 业务域内: `apps/admin/src/pages/<domain>/helpers.ts`
- 跨业务: `apps/admin/src/lib/<name>.ts`

**New CSS:**
- 全局: 追加 `apps/admin/src/styles/admin.css`
- 业务页: 当前用 inline style · 长期目标抽到同目录 `<Domain>.css` 或 CSS module

## Special Directories

**`apps/admin/dist-admin/` (vite build output):**
- Purpose: `pnpm build` 产物
- Generated: Yes (`vite.config.ts:13` outDir)
- Committed: No (.gitignore 默认)

**`apps/admin/.gstack/`:**
- Purpose: gstack 浏览器自动验证日志 · PRD audit 阶段用
- Generated: Yes (gstack browse 命令产出)
- Committed: 部分 (`browse-console.log` / `browse-network.log` 在 git 看得到 · 可能是 audit 留存)

**`apps/admin/screenshots/`:**
- Purpose: 人工验证 / Opus audit 截图存档
- Generated: 手工 / Playwright (未来)
- Committed: Yes (帮助 PRD-11 retro 复盘)

**`apps/admin/src/pages/admin/placeholder/`:**
- Purpose: 占位组件目录 · 10 个 P1/P2 域待 PRD-13/14 实装
- Generated: PRD-10 US-005 手写
- Committed: Yes
- 替换协议: 实装时删 placeholder + 新建 `pages/<domain>/` 完整子目录 + 改 `router.tsx` import

**`apps/admin/node_modules/`:**
- Purpose: pnpm workspace 局部依赖 (大部分 hoisted 到 root)
- Generated: pnpm install
- Committed: No (.gitignore)

---

*Structure analysis: 2026-05-13*

---

## PRD-26 Update (2026-05-21)

> admin lift 后结构变化 · apps/admin lift packages/ui · React.lazy chunking · 17 page unit test

### 新增 / 改动

**`apps/admin/src/router.tsx` (PRD-26 US-006 · D-256 lazy load):**
- 18 React.lazy() import · Suspense fallback={<AdminLoading />} 包裹
- webpackChunkName comment 标 chunk 名 · ≤ 30 LOC AdminLoading 组件
- Route 表 17 + /login · 默认 redirect /admin → /admin/nsm

**`apps/admin/vite.config.ts` (US-006 manualChunks):**
- 4 chunk groups · p0-core(6 page · users/cost/nsm/featureFlags/audit/quota) · p0-review(2 page · reviewTrending/reviewDeepLearn) · p1-health(5 page · approvals/evolutionHealth/invites/compliance/prompts) · p2-advanced(4 page · abExperiments/constants/knowledge/accounts)
- 命名约定: `p<priority>-<theme>` · 优先级最高 = 最早下载

**`apps/admin/vitest.config.ts` + `apps/admin/src/test/setup.ts` (US-006 新建):**
- jsdom environment + @testing-library/jest-dom setup
- 独立 config(跟 apps/api / apps/web 隔离)

**`apps/admin/src/pages/<domain>/__tests__/<Page>.test.tsx` × 17 (US-006 新建):**
- 每 page 3 test minimum: AC-1 渲染不崩溃 · AC-2 loading state · AC-3 onSuccess 数据
- vi.hoisted + adminTrpc mock + MemoryRouter wrap
- 总 51 unit tests · vitest run ws 1.5s 全 PASS

### 抽包 (PRD-26 US-004 · TD-049)

**4 components lift from `apps/admin/src/components/admin/` → `packages/ui/src/admin/`:**
- Sidebar.tsx · TopBar.tsx · StatusBar.tsx · AuditDrawer.tsx
- props-injected · 0 trpc 依赖 · 由 AdminLayout 传 props
- `packages/ui/src/admin/index.ts` re-export 4 components + types
- `@quanan/ui/admin` alias 跨 apps 共享(packages/ui/package.json 不加 trpc 依赖严守)

### routers/app 拆分 (PRD-26 US-005 · TD-037 batch)

主应用 26 routers `git mv` 进 `apps/api/src/trpc/routers/app/` 子目录:
- `_app.ts` mergeRouters import 全改 from `@/trpc/routers/app/...`
- `admin/` 保持对称(13 admin routers)
- 35 test files import path 同步 · `readFileSync` path 同步

*PRD-26 Update: 2026-05-21*
