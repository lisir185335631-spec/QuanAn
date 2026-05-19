# External Integrations · apps/admin

**Analysis Date:** 2026-05-13

## APIs & External Services

**Backend (主开发期唯一外部依赖):**
- QuanAn API (`apps/api`) - admin tRPC router
  - 端点: `http://localhost:3000/trpc/admin` (默认 dev)
  - 生产: `${VITE_API_BASE_URL}/trpc/admin`
  - Client: @trpc/client httpBatchLink + @trpc/react-query
  - 类型: `import type { AdminRouter } from '@quanan/clients/admin-router-types'`
  - 凭证: lucia-auth session cookie 自动 (credentials: 'include')
  - 实现: `apps/admin/src/lib/admin-client.ts`

**未集成 (不在 1.0 范围 · 留 PRR):**
- Google Workspace OAuth (`apps/admin/src/pages/Login.tsx:111` · button disabled with title "Google Workspace OAuth · PRR required") · 上线前接入
- Sentry / OTel · 错误追踪 · CLAUDE §7 PRR
- Plausible / Analytics · 客户端埋点 · CLAUDE §7 PRR
- WAF / Cloudflare · 域名层防护 · 当前 StatusBar 显示 `WAF=stub` (`pages/admin/src/components/admin/StatusBar.tsx:19`)
- MFA · 多因子认证 · 当前 StatusBar 显示 `MFA=stub` (`StatusBar.tsx:22`)

## tRPC Procedures (按业务域)

**auth (chrome 用):**
- `adminTrpc.auth.me.useQuery()` - 当前登录 admin 信息 ({ email, role }) · 多页用
- `adminTrpc.auth.login.useMutation()` - email-based mock login (DEV only)
- `adminTrpc.auth.logout.useMutation()` - 注销 · onSuccess navigate('/login')
- 引用: `apps/admin/src/layouts/AdminLayout.tsx:15` / `pages/Login.tsx:15` / `TopBar.tsx:19-22`

**audit (chrome + business 用):**
- `adminTrpc.audit.listMine.useQuery({ enabled: open, refetchInterval: 30_000 })` - AuditDrawer 30s 轮询当前 admin 的最近 50 条
- `adminTrpc.audit.byTraceId.useQuery({ traceId })` - trace 反查 (enabled: traceId.length >= 8)
- `adminTrpc.audit.byUserId.useQuery({ userId, page, pageSize })` - 按用户查
- `adminTrpc.audit.byAdminId.useQuery({ adminUserId })` - 按 admin 查
- `adminTrpc.audit.exportPdf.useMutation()` - PDF 取证导出 (需 reason ≥10 字 + caseNumber)
- 引用: `apps/admin/src/components/admin/AuditDrawer.tsx:25` / `pages/audit/index.tsx:272-285`

**nsm (NSM 仪表盘):**
- `adminTrpc.nsm.getOverview.useQuery()` - 4 卡片数据 (latest + deltas vs prev day)
- `adminTrpc.nsm.getFunnel.useQuery({ granularity: 'day' })` - 6-stage funnel
- `adminTrpc.nsm.getDistributions.useQuery()` - 3 pie chart data (industry/platform/persona)
- `adminTrpc.nsm.triggerSnapshot.useMutation()` - super_admin 手动触发 KPI snapshot
- 引用: `apps/admin/src/pages/nsm/NsmOverviewCards.tsx:38-43` / `NsmFunnel.tsx:12-15` / `NsmDistributions.tsx:81-83`

**users (用户管理):**
- `adminTrpc.users.list.useQuery({ page, pageSize, search?, roleFilter?, planFilter?, industryFilter?, sortBy, sortDir })` - 主列表
- `adminTrpc.users.detail.useQuery({ userId })` - UserDetailDrawer 详情 (5 tab data)
- `adminTrpc.users.changePlan.useMutation()` - 改套餐 (super 直执行 · admin 进审批 · `pages/users/ChangePlanDialog.tsx:20`)
- `adminTrpc.users.ban.useMutation()` - 封禁
- `adminTrpc.users.resetPassword.useMutation()` - 重置密码
- 引用: `apps/admin/src/pages/users/index.tsx:244` / `UsersOverviewCards.tsx:33-44`

**ipAccounts (IP 账号管理):**
- `adminTrpc.ipAccounts.list.useQuery({ page, pageSize, search?, industry?, platform?, level?, stage?, sortBy, sortDir, anomalyOnly? })` - 主列表 (anomalyOnly toggle 进异常 tab)
- `adminTrpc.ipAccounts.detail.useQuery({ accountId })` - AccountDetailDrawer (6 tab)
- `adminTrpc.ipAccounts.unflag.useMutation()` - 异常 flag resolve / falsePositive
- 引用: `apps/admin/src/pages/accounts/index.tsx:391` / `AnomalyTab.tsx:44-50`

**cost (成本仪表盘):**
- `adminTrpc.cost.aggregate.useQuery({ startDate, endDate, dimension, groupBy })` - 多维聚合 (user/specialist/model/provider × day/week/month)
- `adminTrpc.cost.alerts.useQuery({ refetchInterval: 60_000 })` - 单用户日 > $5 告警 list
- `adminTrpc.cost.exportCsv.useQuery({ enabled: false })` - CSV 导出 · 手动 fetchCsv() 触发
- `adminTrpc.cost.exportMonthlyPdf.useMutation()` - 月度账单 PDF · base64 解码 → blob
- 引用: `apps/admin/src/pages/cost/index.tsx:149-159` / `CostBreakdownChart.tsx:86-94` / `CostAlertsPanel.tsx:21`

**inviteCodes (邀请码管理):**
- `adminTrpc.inviteCodes.list.useQuery({ page, pageSize, status?, campaign?, sortBy, sortDir })` - 主列表
- `adminTrpc.inviteCodes.detail.useQuery({ inviteId })` - 邀请码详情
- `adminTrpc.inviteCodes.create.useMutation()` - 单条创建
- `adminTrpc.inviteCodes.batchImport.useMutation()` - CSV 批量导入
- `adminTrpc.inviteCodes.campaignFunnel.useQuery({ campaignKey })` - 4-stage 漏斗 (注册/激活/9步/30日留存)
- 引用: `apps/admin/src/pages/invites/CampaignFunnelChart.tsx:22` 等

## HTTP REST 端点 (非 tRPC)

**CSV 导出 (用户管理):**
- `GET ${VITE_API_BASE_URL}/admin/export/users?<filters>` - 用户列表 CSV
- 实现: `apps/admin/src/pages/users/index.tsx:267` (fetch + blob + anchor.click)
- 凭证: credentials: 'include'

**注:** CSV 走 REST 而不是 tRPC · 因为 tRPC JSON 序列化对超大 stream 不友好 · 用 HTTP fetch + Blob 更直接

## Data Storage

**Databases:**
- 前端不直接访问数据库 (LD-A-1 红线 · 通过后端 6 闸鉴权链)
- 后端实际访问: PostgreSQL 16 + pgvector (主开发库 quanan / 测试库 quanan_test) · 参 `CLAUDE.md §3`

**File Storage:**
- ⚠️ 客户端临时 · URL.createObjectURL → blob → anchor.click → download
- 不上传 (除了 BatchImportDialog 的 CSV file input · 本地解析 · 不暂存)

**Caching:**
- React Query 内存 cache (QueryClient · staleTime 30s 默认 · 业务页可 override)
- 无 localStorage / sessionStorage / IndexedDB (auth 走 cookie)

## Authentication & Identity

**Auth Provider:**
- lucia-auth (后端 issue session cookie · 前端透明)
- 当前实现 · email-based mock login (dev only · `pages/Login.tsx:15-23`)
- 上线前替换 · Google Workspace OAuth (Internal · @quanan.com 限定 · 见 ADR-021)
- Frontend 路径: 点 mock login → adminTrpc.auth.login.useMutation → cookie 写入 → navigate('/admin')

**Authorization:**
- 角色 enum: `super_admin` / `admin` / `readonly_admin` (`apps/admin/src/lib/admin-routes.ts:5`)
- 路由元数据 `requiredRole` 仅作元数据 · 前端未做 route guard (后端 6 闸 + sidebar 隐藏)
- 业务页 inline role check · `if (role === 'readonly_admin') return null;` (隐藏 action chip · `pages/users/index.tsx:122` / `accounts/index.tsx:276`)
- 改套餐 super_admin 直执行 / admin 走审批 (`ChangePlanDialog.tsx:21-29` 分支处理 status)

**Logout:**
- TopBar dropdown 唯一退出入口 (`apps/admin/src/components/admin/TopBar.tsx:99-105`)
- logout mutation onSuccess → navigate('/login')

## Monitoring & Observability

**Error Tracking:**
- ⚠️ 当前未接入 (Sentry / Bugsnag 留 PRR)
- 客户端错误反馈: showToast (DOM-based) + ErrorBoundary fallback (仅 NSM)

**Performance:**
- ⚠️ 未接入 (web-vitals / Datadog RUM 留 PRR)
- 虚拟滚动用于大列表性能 (DenseTable 32px row · @tanstack/react-virtual)

**Analytics:**
- ⚠️ 未接入 (Plausible / GA 留 PRR · admin 后台一般不做用户行为分析)

**Logs:**
- 客户端 console.* 已 lint 禁
- 服务端日志在 apps/api 处理

## CI/CD & Deployment

**Hosting:**
- 当前 · 本地 dev (`pnpm dev` → port 5174)
- 生产 (PRR 后) · admin.quanan.com 子域名 (ADR-021 独立部署)
- 静态站托管 · 候选 Vercel / Cloudflare Pages / 阿里云 OSS+CDN (上线前 PRR 决定)

**CI Pipeline:**
- ⚠️ 当前未配置 GitHub Actions / GitLab CI (CLAUDE.md §7 PRR)
- 本地手工 · `pnpm typecheck` + `pnpm lint` + `pnpm build`

**Build:**
- `pnpm build` → `tsc && vite build` → `dist-admin/` (static assets)
- TypeScript 类型检查为硬门禁 (类型错误阻塞 build)

## Environment Configuration

**Required env vars:**
- `VITE_API_BASE_URL` (可选 · 默认 `http://localhost:3000`)
  - 用途: tRPC client + CSV 导出 URL 拼接
  - 引用: `apps/admin/src/lib/admin-client.ts:21` + `pages/users/index.tsx:261`

**Vite 内置 import.meta.env:**
- `import.meta.env.DEV` - dev mode flag · Login mock OAuth button 条件渲染 (`pages/Login.tsx:90`)
- `import.meta.env.MODE` - 'development' / 'production' (未用)

**Secrets location:**
- ⚠️ 当前 apps/admin/ 无 .env 文件 (无敏感配置 · 走 Vite 默认 + 上级目录)
- 生产 · `.env.production` (gitignored · 由部署平台注入)

## Webhooks & Callbacks

**Incoming:**
- ⚠️ 无 webhook endpoint (apps/admin 是纯静态 SPA · 无服务端)
- 任何回调都走后端 apps/api

**Outgoing:**
- ⚠️ 无
- 所有外发请求都是 tRPC 调用到 apps/api

## File Upload / Download

**Upload (BatchImportDialog):**
- CSV file input · `<input type="file" accept=".csv">` (`apps/admin/src/pages/invites/BatchImportDialog.tsx`)
- 本地 FileReader 解析 · 校验列名后通过 tRPC mutation 上送

**Download (3 路径):**
- CSV 用户导出 · REST GET + Blob + anchor.click (`pages/users/index.tsx:258-291`)
- CSV 成本导出 · tRPC.cost.exportCsv 返回 csv string + Blob (`pages/cost/index.tsx:190-215`)
- PDF 月度账单 · tRPC.cost.exportMonthlyPdf 返回 base64 + atob + Uint8Array + Blob (`pages/cost/index.tsx:166-188`)
- PDF 审计取证 · tRPC.audit.exportPdf 返回 base64 + atob + Uint8Array + Blob (`pages/audit/index.tsx:113-129`)
- 所有下载用临时 anchor + URL.createObjectURL + 10s 后 revokeObjectURL

## Cross-App Isolation (LD-A-1 验证)

**实测结果 ✅ 完全隔离:**
- apps/admin/src 内 `grep "apps/web\|@quanan/web"` → **0 命中**
- apps/admin 仅 import `@quanan/ui` / `@quanan/clients` (workspace shared packages · 双向可用 · 不算违反)
- apps/admin 用独立 `/trpc/admin` 端点 (不复用 apps/web 的 `/trpc/user`)
- apps/admin 用 `<AdminRouter>` 类型 (`packages/clients/src/admin-router-types.ts`) · 与 apps/web 的 `router-types.ts` 分开
- 端口隔离 · apps/admin dev port 5174 / apps/web port 5173

**结论:** AGENTS.md §10 LD-A-1 (admin 子系统独立部署 + 独立 OAuth) 在代码层得到执行。生产部署进一步通过独立子域名 + 独立 WAF (ADR-021) 强化。

---

*Integration audit: 2026-05-13*
