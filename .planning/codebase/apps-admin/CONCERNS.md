# Codebase Concerns · apps/admin

**Analysis Date:** 2026-05-13

## Tech Debt

**showToast 6 文件重复定义:**
- Issue: `function showToast(msg, type)` 在 6 个文件复制粘贴 · 完全相同实现 (createElement + appendChild + setTimeout 3500)
- Files: `apps/admin/src/pages/cost/index.tsx:91` · `apps/admin/src/pages/accounts/ForceFreezeDialog.tsx:220` · `apps/admin/src/pages/accounts/AnomalyTab.tsx:284` · `apps/admin/src/pages/accounts/AccountDetailDrawer.tsx:618` · `apps/admin/src/pages/users/ChangePlanDialog.tsx:162` · `apps/admin/src/pages/users/BanUserDialog.tsx` · `apps/admin/src/pages/users/ResetPasswordDialog.tsx:98`
- Impact: 任何样式/动画/超时调整需 6 次同步 · 无 dedup / queue limit / 堆叠避免 · 缺 react state 关联难做 a11y aria-live
- Fix approach: 抽到 `apps/admin/src/lib/toast.ts` 单一 export (低成本) · 或升级到 `packages/ui/src/admin/Toast.tsx` 跨子项目复用 + Provider context + queue management

**Dialog primitive 4 文件重复 (Dialog + Label + GhostButton + PrimaryButton):**
- Issue: `function Dialog({ title, onClose, children })` 在 4 处独立实现 · 视觉完全一致 (50% center + dark overlay + gold title + close ×)
- Files: `apps/admin/src/pages/users/ChangePlanDialog.tsx:81` · `apps/admin/src/pages/users/BanUserDialog.tsx:92` · `apps/admin/src/pages/users/ResetPasswordDialog.tsx:98` · `apps/admin/src/pages/accounts/ForceFreezeDialog.tsx:87`
- Impact: 缺 focus trap / ESC close / overlay click close 行为不一致 · a11y aria-modal 部分缺失 · 同一视觉改动需 4 次同步
- Fix approach: 抽 `packages/ui/src/admin/Dialog.tsx` + `Label.tsx` + `GhostButton.tsx` + `PrimaryButton.tsx` · 加 useFocusTrap hook + 统一 ESC handler

**Inline style 充斥业务页:**
- Issue: 6 P0 业务页大量 `style={{...}}` inline · OverviewCard / StatCard / dropdown / button / div container 都用 inline style
- Files: `apps/admin/src/pages/users/index.tsx:78-92` (ActionChip) · `apps/admin/src/pages/cost/index.tsx:80-90` (dropdownStyle) · 几乎所有业务页 (NSM/users/accounts/cost/audit/invites)
- Impact: Tree-shaking 弱 · 难做 hover/responsive · 同 inline style block 跨文件复制 · CSS-in-JS 抽 token 调整需 N 处改
- Fix approach: 长期目标 — 抽到 CSS module 或 `apps/admin/src/styles/business.css` BEM class · 中期 — primitive 抽到 packages/ui/src/admin + 集中 style

**ActionChip / PageBtn / StatCard / OverviewCard primitive 重复:**
- Issue: 同一 chip / button / card 视觉单元 6 处独立 copy/paste
- Files (ActionChip): `apps/admin/src/pages/users/index.tsx:62` + `apps/admin/src/pages/accounts/index.tsx:62` + `apps/admin/src/pages/accounts/AnomalyTab.tsx:251`
- Files (PageBtn): `apps/admin/src/pages/users/index.tsx:95` + `apps/admin/src/pages/accounts/index.tsx:95` + `apps/admin/src/pages/invites/index.tsx:92`
- Files (StatCard / OverviewCard): `apps/admin/src/pages/audit/index.tsx:18` + `apps/admin/src/pages/invites/index.tsx:44` + `apps/admin/src/pages/accounts/index.tsx:137` + `apps/admin/src/pages/users/UsersOverviewCards.tsx:12` + `apps/admin/src/pages/accounts/AccountDetailDrawer.tsx:224`
- Impact: 视觉一致性靠人工维护 · 改 padding/color/border-radius 需 N 处同步 · 测试覆盖难做
- Fix approach: 抽 `packages/ui/src/admin/{ActionChip,PageBtn,StatCard,OverviewCard}.tsx` + barrel export

**hooks/ 目录预留空:**
- Issue: `apps/admin/src/hooks/` 目录存在但 0 文件 · 占位
- Files: `apps/admin/src/hooks/` (空)
- Impact: 反复实现的 click-outside / ESC-close / debounce 散落在业务页
- Fix approach: 提取 `useClickOutside` (TopBar:24-32) + `useEscape` (AuditDrawer:34-41) + `useDebounce` (UserListFilters · 300ms) + `useToast` (替代 showToast)

**`@/` alias 用法不一致:**
- Issue: 99% 文件用相对路径 `../../lib/admin-client` · 仅 `pages/Login.tsx:8` 用 `@/lib/admin-client`
- Files: 全部 src/pages/ + src/components/ · 详 `grep -rn "from '\\.\\./" apps/admin/src/`
- Impact: 移动文件需手动调整相对路径 · `@/` 已配置好但未享用
- Fix approach: 统一改为 `@/` (或反过来全删 `@/` alias) · 推荐前者 · 工作量约 30 处

## Known Bugs

**401 未做前端拦截 → 用户看到无意义错误:**
- Symptoms: session 过期后业务页 useQuery 报 401 · 显示"数据加载失败 · 点击重试" · 重试无效
- Files: `apps/admin/src/lib/admin-client.ts:18-29` (httpBatchLink 未拦截 401)
- Trigger: lucia-auth session 过期 / cookie 被清 · 任何已打开的业务页操作
- Workaround: 用户手动跳 /login 重新登录

**CSV 导出 alert() 不友好:**
- Symptoms: 导出失败用 `alert("导出失败: <msg>")` (`apps/admin/src/pages/users/index.tsx:271`) · 阻塞 + 丑
- Files: `apps/admin/src/pages/users/index.tsx:271` + `:287`
- Trigger: CSV 端点 fail (后端 500 / 网络中断)
- Workaround: 改用 showToast (其他地方都用) · 一致性问题

**accounts 主页 DistributionCharts 用 sample 而不是全量:**
- Symptoms: 行业/平台 PieChart 只反映当前页 ≤ 200 行的分布 · 不是全数据库统计
- Files: `apps/admin/src/pages/accounts/index.tsx:198-219` (DistributionCharts 用 accounts={accounts} 当前页 row)
- Trigger: 业务方期望全局分布但看到的是 page-1 局部
- Workaround: 后端加 `admin.ipAccounts.distribution` 全量聚合 procedure · 前端调它而不是当前页 row 算

## Security Considerations

**OAuth 仍是 mock email login (DEV only):**
- Risk: 任何能接到 dev server 的人输 email 即可登录 · 0 鉴权
- Files: `apps/admin/src/pages/Login.tsx:90-108` (mock OAuth button + `import.meta.env.DEV` 限制)
- Current mitigation: button 仅 `import.meta.env.DEV === true` 时渲染 · production build 不显示
- Recommendations: PRR 阶段接入 Google Workspace Internal OAuth (button 已就位 disabled · `pages/Login.tsx:111`) · 后端走 `apps/api/admin/auth/oauth/google` 流程 · @quanqn.com 限定

**CSV 导出无前端 rate limit / size cap:**
- Risk: 恶意 admin 可触发大表 CSV 导出 · DOS 后端 / 浪费带宽 / 泄露大量个人信息
- Files: `apps/admin/src/pages/users/index.tsx:258` (handleCsvExport 无频次限制)
- Current mitigation: 后端 audit log 记录 · admin 行为可追溯 (LD-A-3 append-only audit)
- Recommendations: 前端加 debounce + cooldown (60s 内同 admin 不能再点 export) · 后端加 rate limit + 单次行数上限

**PDF 取证导出 reason 校验仅 10 字:**
- Risk: admin 写"调查123456"凑数 reason · 法务审计意义弱化
- Files: `apps/admin/src/pages/audit/index.tsx:114` (`if (reason.length < 10) return`)
- Current mitigation: caseNumber 字段必填 + 后端 audit log 记录 reason + caseNumber
- Recommendations: 加 reason ≥30 字 + 关键词检查 ("案件" / "调查" / "取证" 等) · 或后端加 LLM 判定是否真法务请求

**showToast 用 createElement + textContent · 无 XSS 风险:**
- 注: textContent 而非 innerHTML · 不会执行 HTML/script · OK
- Files: 各 showToast 实现 (e.g. `cost/index.tsx:99` `el.textContent = msg`)

**credentials: 'include' 跨域请求暴露 cookie:**
- Risk: 如果 VITE_API_BASE_URL 配错域名 · cookie 可能跨域泄露
- Files: `apps/admin/src/lib/admin-client.ts:25`
- Current mitigation: dev 默认 localhost:3000 + production 应通过 admin.quanqn.com 同源
- Recommendations: 后端 CORS 严格白名单 admin.quanqn.com (不开 *)

## Performance Bottlenecks

**accounts/index.tsx 主页有 3 个并发 ipAccounts.list useQuery:**
- Problem: AccountsOverviewCards 内 3 个并发 query (total + anomalyOnly + page-200 sample)
- Files: `apps/admin/src/pages/accounts/index.tsx:157-170` + 主页 :391 自己一个
- Cause: 4 个独立 query 完成 3 个独立网络请求 · 仅 staleTime 不同
- Improvement path: 后端加一个 `admin.ipAccounts.overview` 聚合 procedure 一次返回 (total / anomaly / top3industry) · 前端 1 query 代替 3 个

**Drawer 关闭后仍在内存:**
- Problem: AuditDrawer / UserDetailDrawer 等组件 mount 后即使关闭 · React Query cache 仍持有 detail data
- Files: 所有 *Drawer.tsx
- Cause: useQuery 默认 cacheTime 5 min · 多账号切来切去内存堆积
- Improvement path: 设 `gcTime: 60_000` 或 query keep 仅 open 期间

**Recharts 无 React.memo / 渲染开销:**
- Problem: 业务页 re-render 时 (e.g. URL params 变) chart 跟着重建
- Files: `nsm/NsmFunnel.tsx` / `accounts/StepProgressChart.tsx` / `cost/CostBreakdownChart.tsx` / `invites/CampaignFunnelChart.tsx`
- Cause: 未 React.memo · 父 re-render 触发子 chart re-render · 即使 data 没变
- Improvement path: chart 组件加 React.memo + 自定义 props comparison (浅比较 data ref)

**6 业务页主文件 300-600 行 · 渲染树深:**
- Problem: 主页大量内联子组件 + helper · 单文件复杂度高
- Files: `accounts/AccountDetailDrawer.tsx` (630) · `users/UserDetailDrawer.tsx` (603) · `invites/index.tsx` (602)
- Cause: 6 Tab 内容内联在 Drawer 文件 (注释明示 "AC-4 · avoid 13-file split") · 看似减文件实则单文件冲爆
- Improvement path: 折中 — Tab 内容用 lazy load (React.lazy) · 默认仅 active tab 渲染

## Fragile Areas

**adminTrpc.auth.me 多页重复请求:**
- Files: `AdminLayout.tsx:15` + `pages/nsm/index.tsx:65` + `pages/users/index.tsx:218` + `pages/accounts/index.tsx:373`
- Why fragile: 每个主页独立 useQuery · 实际同一份数据 · React Query dedup 保护但接口契约变化时多处同步
- Safe modification: 抽 `useMe()` hook (放预留的 `apps/admin/src/hooks/use-me.ts`) · 单 query 处复用
- Test coverage: ⚠️ 0 测试 (见 TESTING.md)

**useSearchParams URL params 持久化逻辑:**
- Files: `pages/users/index.tsx:38-58` (parseFilters / filtersToParams) · `pages/accounts/index.tsx:36-58`
- Why fragile: 每个主页独立实现 parseFilters/toParams · 字段加减需手动同步 · sortBy default 'createdAt' 散在多处
- Safe modification: 抽通用 `useUrlFilters<T>` hook · 通过 schema 化字段元数据驱动 parse/serialize
- Test coverage: 0

**Drawer / Dialog state via URL + useState 混合:**
- Files: `pages/users/index.tsx:213-254` (openUserId 在 URL · changePlanUserId/banUserId/resetPwdUserId 在 useState)
- Why fragile: Drawer 跟 URL 同步 · Dialog 只在 useState · 刷新页面 Drawer 恢复但 Dialog 消失 (设计如此但混合容易乱)
- Safe modification: 明确规则 — 详情查看走 URL · 操作 modal 不走 URL (符合 UX 直觉) · 加文档说明
- Test coverage: 0

**Recharts SHIELD fill 约束:**
- Files: `nsm/NsmFunnel.tsx:3` · `accounts/StepProgressChart.tsx:2` · `invites/CampaignFunnelChart.tsx:2` · `audit/AuditTimeline.tsx:3-4`
- Why fragile: 注释明示 "data points 必含 fill" · 未填会显示无色 · ralph anti-pattern 注入的硬约束 · 容易在新 chart 漏
- Safe modification: 把约束写到 `packages/ui/src/admin/Chart.tsx` 包装 + util `assertFill(data)` 校验
- Test coverage: 0 (需 visual regression test 才能 catch)

## Scaling Limits

**DenseTable 大数据 (已用 react-virtual):**
- Current capacity: 32px row · @tanstack/react-virtual · 100k+ row 平滑
- Limit: 当前 PAGE_SIZE = 20 + 后端分页 · 不会触发瓶颈
- Scaling path: 后端如开放 50k row 列表 · DenseTable 配置 maxHeight 充足即可

**业务页 Drawer 子组件数:**
- Current capacity: AccountDetailDrawer 6 Tab · UserDetailDrawer 5 Tab · 单文件 600+ 行可读
- Limit: > 8 Tab 时单文件会超 1000 行 · 维护困难
- Scaling path: 折中拆分 — Tab 渲染体内联 (避免文件爆炸) + helper 抽到同目录 `<Domain>Detail.helpers.ts`

**Sidebar 16 路由:**
- Current capacity: 4 分组 · 容易扫
- Limit: 单组 > 8 项时密度可能不够 (当前 p0-core 6 / p1-health 5 是上限)
- Scaling path: 加二级折叠菜单 (sidebar 容量翻倍) · 但 PRD-MASTER 锁定 14 PRD · 16 域估计不会再扩

## Dependencies at Risk

**@trpc/* 11.0.0-rc.0 (release candidate · 非稳定版):**
- Risk: rc 版本 API 可能 breaking · 升正式版时需调整
- Impact: 整个 tRPC 客户端层 (`apps/admin/src/lib/admin-client.ts`)
- Migration plan: 跟踪 tRPC v11 release · 升正式版时统一 apps/api + apps/admin + apps/web + packages/clients

**recharts 3.8.1 (3.x 系列 · 早期版本):**
- Risk: 3.x 跟 2.x API 有差异 · 早期版本 bug 多 · FunnelChart / Funnel 在 3.x 中较新
- Impact: NSM Funnel / Account StepProgress / Cost Breakdown / Invite CampaignFunnel
- Migration plan: 升级前跑 visual regression test (当前 0) · 或固定版本 + 关键路径手测

**React Router 6.27.0:**
- Risk: React Router v7 已发布 · 升 v7 是大变更 (data router / lazy / loader API)
- Impact: `apps/admin/src/router.tsx` 全部 Route 树
- Migration plan: 短期不升 · 1.0 锁定 v6 · 上线后稳定再评估 v7

## Missing Critical Features

**前端 401 拦截 + 自动跳登录:**
- Problem: session 过期 · 用户陷入"重试无效"循环
- Blocks: 良好的 UX · admin 用户每天工作前几小时不被烦
- Fix priority: High (PRD-13 应做)

**ErrorBoundary 全局推广:**
- Problem: 仅 NSM 主页有 ErrorBoundary · 其他 5 业务页崩溃 → 白屏
- Blocks: 后端 contract 变化 / undefined access 等 runtime error 没有 fallback
- Fix priority: Medium

**useToast hook + Toast Provider:**
- Problem: 6 处 showToast 重复 · 无队列 / 无 a11y aria-live / 无 dedup
- Blocks: Toast UX 优化 · a11y 合规
- Fix priority: Medium

**Dialog focus trap + ESC handler:**
- Problem: 4 处 Dialog 无 focus trap · Tab 键可以跳出 · 部分 Dialog 无 ESC close
- Blocks: a11y 合规 · 键盘用户体验
- Fix priority: Medium

**Sidebar 折叠 / 角色隐藏:**
- Problem: readonly_admin 看到 super_admin only 路由 · 点进去后端 403
- Blocks: UX · readonly 体验混乱
- Fix priority: Low (后端拦截已有 · 仅 UX 优化)

**i18n (1.0 锁定 zh-CN · 不做):**
- 故意不做 · 标 "1.0 不在范围" (CLAUDE.md §5.4)
- 留 v2

## Test Coverage Gaps

**0% 单元测试覆盖:**
- What's not tested: 全部 - 没有任何 *.test.tsx / *.spec.tsx 文件 (find 确认)
- Files: `apps/admin/src/**/*.{ts,tsx}` 全部
- Risk: 任何改动靠人工 + Opus audit + gstack 浏览验证 catch · 重构成本高 · 回归风险大
- Priority: High - 至少 chrome 组件 (TopBar / Sidebar / StatusBar / AuditDrawer) + 关键 helper (parseFilters / filtersToParams / pivotAggregations / extractPayloadHash) 应有单元测试

**0 集成测试:**
- What's not tested: 主页面 + Drawer + Dialog + tRPC mock 集成
- Files: 全部业务页 `apps/admin/src/pages/*/index.tsx`
- Risk: Story implementation 不会因测试失败 · 仅 Opus audit / 用户手测发现
- Priority: Medium - 6 P0 业务页应有 happy path 集成测试

**0 E2E 测试:**
- What's not tested: 登录 → Sidebar 切换 → 业务页操作 → 退出
- Files: 整个 SPA
- Risk: 真实浏览器路径未守护 · 改动后可能 SPA crash 都不知道
- Priority: Medium - PRR 前应有 Playwright happy path × 6 业务页

**Visual regression 0:**
- What's not tested: Aurelian Dark 视觉 token / Sidebar 4 group / DenseTable 32px row
- Files: 全部 UI
- Risk: 设计 token 改动 (e.g. --gold 颜色变) 不知不觉影响 6 业务页
- Priority: Low - 上线前接入 Chromatic / Percy 即可

详见 TESTING.md 进一步分析。

## Architecture Mismatches (vs AGENTS.md §10)

**LD-A-1 隔离 · ✅ 已执行:**
- 实测无 apps/web 引用 (verified)
- 独立 /trpc/admin 端点
- 独立端口 5174
- LD 满足

**LD-A-2 6 闸鉴权链 · ⚠️ 前端层未做:**
- 路由元数据 `requiredRole` 仅作元数据 · 未做前端 route guard
- 当前依赖后端 6 闸 + 业务页内联 role check
- Fix: PRD-13 前端 route guard wrapper component (`<RequireRole role="super_admin"><EvolutionPage /></RequireRole>`)

**LD-A-3 audit append-only · ✅ 前端不写 audit (后端职责)**

**LD-A-4 / LD-A-5 (需 AGENTS §10 详读 · 当前未扫):** ⚠️ 待 audit 后扩充

## Bundle Size / Build Output

**未检测当前 build 产物大小** (apps/admin/dist-admin/ 当前不存在 · 未 build)

**预估关注点:**
- recharts 3.8.1 · 整库较大 (200KB+ gzipped) · 但 Vite tree-shake 应 OK · 仅按需的 FunnelChart/BarChart/PieChart/LineChart
- @tanstack/react-virtual 体积较小 (10KB)
- @trpc/react-query + @tanstack/react-query 合计 ~50KB
- React 18 + React DOM ~140KB

**Recommendation:** 上线前跑 `vite build --report` (rollup-plugin-visualizer) 看 chunk 分布 · 视情况 manual chunk split

---

*Concerns audit: 2026-05-13*
