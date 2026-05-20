# PRD-26 · admin UI MVP polish + 真启用 · 9 TD 清 + e2e 验证

> **状态** · 待启动(2026-05-21 PRD-25 ship + L4 进化 apply + PRD-26-prep cleanup 完成)
> **branch** · `ralph/prd-26-admin-ui-mvp`(待 daemon 启动时建)
> **依赖** · main(commit 2ea9e17 · 25 commits ahead pre-PRD-25)
> **范围分档** · 7 US(7 medium · 0 high)· 预期 daemon 25-35h · ≈ 1 周 wall time

---

## §0 引用清单 + 元数据 + 决策定调

### §0.1 上游文档(7 份核心)

| # | 文档 | 用途 |
|:-:|---|---|
| 1 | [ADMIN-ARCHITECTURE.md](../ADMIN-ARCHITECTURE.md) | 4500+ 行 admin 设计 · 9 层架构 + 16 业务管理域 + 接口契约 + 前端架构 |
| 2 | [AGENTS.md](../AGENTS.md) | §10 admin 5 LD-A + 6 R-A 红线 · §11.16 PRD-25 LLM 接入沉淀 |
| 3 | [tasks/prd-25.md](prd-25.md) | §9 PRD-26+ handoff · admin UI MVP 范围参考 |
| 4 | [.agents/retros/prd-25-vs-prd-24-retrospective.md](../.agents/retros/prd-25-vs-prd-24-retrospective.md) | 662 行 · §12 M-1/M-2/M-3 L4 进化(2026-05-20 apply)· §13 Skill 升级 diff |
| 5 | [.agents/tech-debt.json](../.agents/tech-debt.json) | 98 items · 9 admin-related open TDs · 关键 TD-031/037/038/039/040/041/042/049 + TD-099 |
| 6 | `apps/admin/src/router.tsx` 67 行 · `AdminLayout.tsx` | 17 page 路由 + grid layout + 5 admin component(Sidebar/TopBar/StatusBar/AuditDrawer)|
| 7 | `tests/e2e/admin/admin-foundation-loop.spec.ts` | PRD-10 US-007 7-step auth/sidebar/audit drawer e2e(继承基线) |

### §0.2 元数据

| 项 | 值 |
|---|---|
| **branchName** | `ralph/prd-26-admin-ui-mvp` |
| **Locked Decisions** | D-252 起延续(PRD-25 收尾 D-251 · 总 7 D · D-252~D-258) |
| **风险分档** | medium × 7(0 high · admin 业务已建 95% · polish + cleanup 不引入新 specialist/LLM) |
| **anti_patterns 注入** | 7 US 从 reject-examples.jsonl 检索 · 关键词 `'admin 隔离'` / `'LD-A 红线'` / `'monorepo lint scope'`(M-2)/ `'protectedProcedure'` / `'audit-friendly 注释'` / `'lazy load'` |
| **依赖前置 PRD** | PRD-1~25 全 ship · 严格保留不动业务逻辑 · 仅 polish + cleanup |
| **下游 PRD** | PRD-27 候选 · evaluation 完整化 + 多用户压测 + 移动端 / PRR |
| **失败回滚** | `git branch backup/before-prd-26 main` 待建(daemon 启动前) |

### §0.3 现状校准(2026-05-21 prime 探查)

**admin SPA 95% 完成**(prime 误判 0% · 修正):
- ✅ 97 tsx files · 24,634 LOC · 17 page domains 全有真 page
- ✅ AdminLayout + Sidebar + TopBar + StatusBar + AuditDrawer · 全建
- ✅ Login.tsx + adminTrpc.auth.login · 真实施
- ✅ admin SPA 已跑 curl :5174 → 200
- ✅ admin-foundation-loop e2e 7-step PRD-10 US-007 sealed
- ⏸️ 7 个未用 placeholder(`pages/admin/placeholder/{ab,approval,compliance,config,evolution,prompts,quota}.tsx`)
- ⏸️ index.ts 12 行 placeholder text(TD-031)
- ⏸️ 5 admin component 还在 apps/admin/src/components/admin/(TD-049 期望抽 packages/ui/src/admin/)
- ⏸️ 9 admin-related open TDs(TD-031/037/038/039/040/041/042/049 + TD-099)

### §0.4 D-252 ~ D-258 Locked Decisions(本 PRD 新建)

| ID | 决策 | Why |
|---|---|---|
| **D-252** | **PRD-26 范围 = polish + cleanup + e2e 验证 · 不引入新 admin 业务功能** · 删 7 unused placeholder + 修 9 TD + 17 page e2e smoke + 真启用验证 | 现状 95% 完成 · 不重写 · ROI 高 |
| **D-253** | **admin visual baseline = internal regression**(不强行 1:1 aiipznt 实拍)· aiipznt 无 admin · QuanAn admin 是自设计 · 跨 page baseline 防 regression | 继承 PRD-22 TD-090/091 决策模式 |
| **D-254** | **admin UI primitive 抽 packages/ui/src/admin/**(TD-049 修复)· Sidebar/TopBar/StatusBar/AuditDrawer 4 component 抽包 · apps/admin import @quanan/ui/admin · DenseTable + tokens.ts 复用 | LD-A-1 + AGENTS §10.1 · monorepo 共享原则 |
| **D-255** | **routers 拆 routers/app/ + admin/ 对称**(TD-037 修复)· apps/api/src/trpc/routers/app/(18 主应用 router)+ routers/admin/(17 admin router · 已对称结构)· _app.ts mergeRouters 同步 | ADMIN-ARCHITECTURE §5.4 · 模块化 |
| **D-256** | **admin lazy load + chunking**(performance)· React.lazy 拆 17 page · vite.config.ts chunk strategy 按 P0/P0-审核/P1/P2 4 chunks · 测 first paint < 2s | 24K LOC 直接 mount 慢 |
| **D-257** | **17 page e2e smoke test** · 每 page 1 个 smoke(render + h1 visible + 0 console error)· 不强求功能覆盖 · 补 admin-foundation-loop 跨 page · 复用 admin browser session | admin 三档角色 e2e 留 PRD-27 |
| **D-258** | **verify-prd-26.sh ≥ 30 checks** · TD 关闭验证(9 closed) + visual baseline(17 pages) + lazy load(chunk count) + audit coverage(22 tables 完整) + admin tests pass | 历史可追溯 |

---

## §1 介绍/概述

PRD-25 LLM 接入征程完成(10 page · 5 TD close · L4 进化 apply)· main 当前 23 commits ahead 未 push。

**Prep 期发现** · admin UI 不是 0% · 实际 **95% 完成**(97 tsx files · 24K LOC · 17 page domains 全建)· PRD-10~14 admin core 不仅做了 backend(17 router)· UI 也做了大部分。

**PRD-26 真正目标** · admin UI 从 95% → 100% · polish + cleanup + e2e 验证 + 9 TD 关闭:

### 1.1 7 medium US 范围

- **US-001** · admin index + 7 unused placeholder cleanup(TD-031)
- **US-002** · 17 page 渲染验证 + visual baseline(internal regression · 17 baselines)
- **US-003** · admin auth + 三档权限 e2e(扩展 admin-foundation-loop)
- **US-004** · admin UI primitive 抽 packages/ui/src/admin/(TD-049 · Medium)
- **US-005** · routers/app/ + admin/ 对称 + audit coverage + 文档 typo(TD-037/038/039/040/041/042 batch)
- **US-006** · admin lazy load + chunking + 17 page unit test 补(TD-099)
- **US-007** · 收官 verify-prd-26.sh + /goal-verify + /prd-retro 6 PRD + handoff PRD-27+

### 1.2 估时

| US | risk | 预期 ralph | Opus audit |
|---|:-:|:-:|:-:|
| US-001~007 | medium × 7 | 3-5h × 7 = 25-35h | 8-12 min × 7 ≈ 80-90 min |
| **累计** | **medium 全档** | **25-35h daemon** | **≈ 1 周 wall time** |

---

## §2 目标

- ✅ admin SPA 17 page 全 e2e smoke pass(render + h1 + 0 console error)
- ✅ 17 visual baseline 建立(internal regression · `tests/e2e/prd26-admin-visual-baseline.spec.ts`)
- ✅ admin auth full flow e2e(admin-foundation-loop 7 step 扩展含 3 档角色 · super_admin / domain_admin / reviewer)
- ✅ packages/ui/src/admin/ 含 5 components(Sidebar/TopBar/StatusBar/AuditDrawer + 已有 DenseTable)· apps/admin import @quanan/ui/admin · TD-049 closed
- ✅ apps/api/src/trpc/routers/app/(18 router) + admin/(17 router · 已对称) · _app.ts mergeRouters · TD-037 closed
- ✅ audit-admin-rls-tables.sh coverage 22 tables 完整 · TD-039/042 closed
- ✅ admin SPA lazy load · 17 page 拆 React.lazy · 4 chunks · first paint < 2s
- ✅ 7 unused placeholder 删 · index.ts 改 barrel export · TD-031 closed
- ✅ 9 TD 关闭(TD-031/037/038/039/040/041/042/049 + 部分 TD-099)
- ✅ verify-prd-26.sh ALL CHECKS PASSED(≥ 30 checks)· /goal-verify + /prd-retro 跨 6 PRD
- ✅ 7 US 全 audit approved · D-233 unit test 同步硬规则严守 · L4 进化 M-1/M-2/M-3 自然验证

---

## §3 User Stories(7)

### US-001 medium · admin index + 7 unused placeholder cleanup(TD-031 closed)

**风险分档** · 🟡 medium(纯文件删 + barrel export · 不动业务逻辑 · 但 TD-031 是 LD-A-1 字面违反 · severity low 但红线类)
**Story 大小** · medium(5 files modify/delete · ~80 LOC)
**downstream count** · 0(独立) · risk_level=medium

**前置依赖** · apps/admin/src/index.ts 12 行 placeholder text + 7 unused placeholder pages

**用户故事** ·
作为项目维护者 · admin SPA 已 95% 完成但 `apps/admin/src/index.ts` 仍是 12 行 placeholder 文字(写 "管理后台前端入口(占位)" + 5 行 PRD-10~14 时间线注释 + `export {}`)· 这是 LD-A-1 字面违反(admin code 不为 placeholder)· 同时 `pages/admin/placeholder/` 目录有 7 个未使用 placeholder pages(ab/approval/compliance/config/evolution/prompts/quota)· 仅 knowledge.tsx 被 router 用 · 其他 7 个全是历史 PRD-10 ralph 写的 stub 没删 · 应该 cleanup。

**验收标准** ·

- **AC-1** · `apps/admin/src/index.ts` 改 barrel export · 完整内容:
  ```typescript
  // @quanan/admin · 管理后台前端入口 barrel(PRD-26 US-001 cleanup · TD-031 closed)
  export { AdminRoutes } from './router';
  export { AdminLayout } from './layouts/AdminLayout';
  ```
  · 不再 `export {}` 占位 · 不再 placeholder 文字
- **AC-2** · 删 7 unused placeholder pages · `apps/admin/src/pages/admin/placeholder/{ab,approval,compliance,config,evolution,prompts,quota}.tsx` · 保留 `knowledge.tsx`(router.tsx L37 import 用) · `rm` 操作不留死代码
- **AC-3** · grep `pages/admin/placeholder/` 全项目 import 命中 == 1(只 router.tsx 引用 knowledge) · 验证 0 dead import
- **AC-4** · router.tsx 17 page import 全验证不 dead · `pnpm typecheck` 0 errors(typecheck 会 catch 删除的 import)
- **AC-5** · `.agents/tech-debt.json` TD-031 status='resolved' + resolved_at='2026-05-21' + resolved_in_prd='PRD-26' + close_evidence 完整描述(index.ts barrel export + 7 placeholder deleted + grep 验证)
- **AC-6** · 删 7 file 后 · vitest run apps/admin 仍全 pass(不 regression) · pnpm vitest run 全 ws 0 tests fail(继承 PRD-26-prep 状态)
- **AC-7** · 删 file 后 admin SPA dev server :5174 仍能跑(`curl localhost:5174` 200)· admin-foundation-loop e2e 仍 pass
- **AC-8** · TypeScript typecheck 5 ws 0 errors(`pnpm typecheck` from ROOT · M-2 严守)
- **AC-9** · M-2 monorepo lint scope · `pnpm lint` from PROJECT_ROOT(不 cd apps/admin) · 跨 ws 全检查 · US-001 引入 files 0 errors
- **AC-10** · grep `apiKey|import OpenAI|import Anthropic` apps/admin/ 0 命中(R-001 严守 · admin 也不暴露 LLM SDK)
- **AC-11** · admin SPA 三档角色(super_admin / domain_admin / reviewer)admin-foundation-loop seed 不破坏 · admin-foundation-loop.spec.ts 仍 pass
- **AC-12** · Use agent-browser to open http://localhost:5174/admin · 验证 admin SPA 渲染 sidebar + topbar + 默认 nsm page · 截图 verify-artifacts/US-001/admin-after-cleanup.png

**files_to_create** · `[]`
**files_to_modify**(共 9 files · ≤ 12 medium 安全区):
- `apps/admin/src/index.ts`(barrel export)
- `apps/admin/src/pages/admin/placeholder/ab.tsx`(delete)
- `apps/admin/src/pages/admin/placeholder/approval.tsx`(delete)
- `apps/admin/src/pages/admin/placeholder/compliance.tsx`(delete)
- `apps/admin/src/pages/admin/placeholder/config.tsx`(delete)
- `apps/admin/src/pages/admin/placeholder/evolution.tsx`(delete)
- `apps/admin/src/pages/admin/placeholder/prompts.tsx`(delete)
- `apps/admin/src/pages/admin/placeholder/quota.tsx`(delete)
- `.agents/tech-debt.json`(TD-031 resolved)

**test_command** · `cd /Users/return/Desktop/QuanAn && pnpm typecheck && pnpm lint && pnpm vitest run`
**size_hint** · medium · **risk_level** · medium

**anti_patterns 注入候选**(从 reject-examples.jsonl 检索):
- `LD-A-1 admin/web 严格 import 隔离`(PRD-10 US-005 反例)
- `R-A-2 admin 入口隐藏`(prod-build admin/* 路径不暴露)
- `M-2 monorepo lint scope`(PRD-25 US-009 反例 · pnpm lint 必 ROOT 跑)
- `index.ts barrel export 模式`(不 placeholder text)

---

### US-002 medium · 17 page 渲染 + visual baseline(D-253 internal regression)

**风险分档** · 🟡 medium(纯 e2e + visual fixture · 不改业务代码 · 但 17 page 全覆盖 + admin 三档角色 seed 需要 reuse)
**Story 大小** · medium(2 files create + 1 modify · ~250 LOC)
**downstream count** · US-003 e2e 扩展依赖 · US-006 lazy load 测试依赖 · risk_level=medium

**前置依赖** · admin SPA :5174 dev server + `admin-foundation-loop.spec.ts` 已实施 seed + login + sidebar + audit drawer pattern + playwright.config.ts admin browser project

**用户故事** ·
作为项目维护者 · admin SPA 17 page 当前全建但缺整体 visual + smoke baseline · 现状有 8 个 admin e2e files(PRD-13/14 期间)但需要 dev server + real DB 才能跑(`tests/e2e/admin/prd1[34]-*.test.ts` 全 file setup fail 当无 dev server) · PRD-26 加 admin SPA 内部 visual regression baseline + e2e smoke pattern · 让未来 admin polish/refactor 时有跨 page 验证机制(继承 PRD-21~24 visual baseline 征程精神)。

**验收标准** ·

- **AC-1** · 新建 `tests/e2e/prd26-admin-visual-baseline.spec.ts` · 复用 admin-foundation-loop seed(super_admin email='e2e-foundation@quanan.com')+ login(POST /admin/auth/login mock OAuth flow) · 用 `test.beforeAll` 一次性 seed + login + storageState 复用 · 然后 17 individual test 跑 visual baseline
- **AC-2** · 17 baseline 矩阵(`prd26-admin-{page-slug}.png` · viewport 1440×900 · fullPage true · threshold 0.05 继承 PRD-21 D-206):
  - P0 核心(6) · `prd26-admin-nsm.png` / `prd26-admin-users.png` / `prd26-admin-accounts.png` / `prd26-admin-cost.png` / `prd26-admin-audit.png` / `prd26-admin-invites.png`
  - P0 审核(2) · `prd26-admin-review-trending.png` / `prd26-admin-review-deep-learn.png`
  - P1 健康度(5) · `prd26-admin-evolution-health.png` / `prd26-admin-prompts.png` / `prd26-admin-quota.png` / `prd26-admin-compliance.png` / `prd26-admin-approvals.png`
  - P2 高级(4) · `prd26-admin-ab-experiments.png` / `prd26-admin-constants.png` / `prd26-admin-knowledge.png` / `prd26-admin-feature-flags.png`
- **AC-3** · 17 baseline 首跑 `pnpm exec playwright test tests/e2e/prd26-admin-visual-baseline.spec.ts --update-snapshots` 生成 · 复跑 `pnpm exec playwright test` 全 pass · 阈值 0.05
- **AC-4** · `package.json` 加 `"test:visual:prd26": "playwright test tests/e2e/prd26-admin-visual-baseline.spec.ts"` script(继承 PRD-21~24 命名模式)
- **AC-5** · 新建 `tests/e2e/prd26-admin-pages-smoke.spec.ts` · 17 page e2e smoke · 每 page 1 test · 复用 same beforeAll · 每 test 验证:
  - (a) page navigation HTTP 200(无 redirect to /login)
  - (b) page h1 / 主标题 visible(grep DOM `h1, h2` first element 非 null + non-empty text)
  - (c) console error count == 0(`page.on('console', ...)` 收 errors)
  - (d) page 渲染时间 < 3s(`page.waitForLoadState('networkidle', { timeout: 3000 })`)
- **AC-6** · 任 1 page 路由 broken / 渲染 crash / console error / 超时 · test FAIL · ralph 必修(不允许 skip / xfail)
- **AC-7** · admin SPA dev server 必启(M-2 + TD-095 dev server 自启在 ralph daemon · daemon `--with-dev-server` 默认开 · admin :5174 自动 fork)· Validator browse 前必 curl 健康检查(per VALIDATOR.md §X)
- **AC-8** · unit test 不需新增本 US(e2e 已 cover · 17 page unit test 留 US-006 lazy load 时一并补)
- **AC-9** · TypeScript typecheck 0 errors · `pnpm typecheck` 5 ws ALL Done
- **AC-10** · M-2 monorepo lint · `pnpm lint` from PROJECT_ROOT · 0 errors in US-002 引入 files
- **AC-11** · grep `apiKey|import OpenAI|import Anthropic` `tests/e2e/prd26-*` 0 命中(e2e 不应 import LLM SDK)
- **AC-12** · `tests/e2e/prd26-admin-pages-smoke.spec.ts` 加 `console.error` capture 装饰 · 失败时输出 page url + first 3 console errors(辅助 debug)
- **AC-13** · Use agent-browser to open 17 admin pages 各 1 次 · 截图 verify-artifacts/US-002/admin-pages-{slug}.png(17 张)· 验证渲染 OK · 复用 admin browser session storageState

**files_to_create** · `tests/e2e/prd26-admin-visual-baseline.spec.ts` + `tests/e2e/prd26-admin-pages-smoke.spec.ts`(共 2 files · ~250 LOC)
**files_to_modify** · `package.json`(加 test:visual:prd26 script)· `playwright.config.ts`(maybe 加 prd26 project 单独配 grep / timeout)

**anti_patterns 注入候选**:
- `visual baseline 跑前必 git status clean`(PRD-21 沉淀)
- `admin browser session 复用 storageState · 不每 test 重新登录`(性能 + 稳定性)
- `console error == 0 是硬门禁 · 不允许 expect(errors).lessThan(N)`
- `e2e fixture 必 prisma.adminUser.upsert · 不直接 INSERT SQL`(LD-A 红线类似)
- `M-2 monorepo lint scope`(PRD-25 US-009 反例)

---

### US-003 medium · admin auth + 三档权限矩阵 e2e

**风险分档** · 🟡 medium(扩展 admin-foundation-loop · 不改 auth core · 但跨 3 角色 × 3 操作 = 9 case matrix)
**Story 大小** · medium(2 files create + 1 modify · ~250 LOC)
**downstream count** · US-005 routers/app/ 拆分时 admin auth 不能破 · risk_level=medium

**前置依赖** · admin-foundation-loop.spec.ts 已实施(super_admin 单角色 7 step) · admin_audit_log schema 已建(PRD-10 US-005) · admin sidebar 16 domain config 已实施(apps/admin/src/lib/admin-routes.ts)· admin 6 闸鉴权链已实施(PRD-10 §5.3)

**用户故事** ·
作为 admin 维护者 · 我需要验证 admin 三档角色权限矩阵真生效(super_admin 全权 · domain_admin 限部分 · reviewer 仅审核) · 不仅是 router 层 procedure-level check · 还要 admin SPA UI 层 sidebar / navigation / 路由 redirect 全验证 · 同时 audit log 真写入(每角色每操作 1 row · 9 rows matrix)。

**验收标准** ·

- **AC-1** · 新建 `tests/e2e/prd26-admin-role-matrix.spec.ts` · 三档角色 fixture · 用 `test.describe.serial` 跑(因为 admin_audit_log 累加验证 order-sensitive):
  - super_admin seed · email='e2e-super-admin@quanan.com' · role='super_admin' · isMock=true
  - domain_admin seed · email='e2e-domain-admin@quanan.com' · role='domain_admin' · allowedDomains=['users','accounts','cost']
  - reviewer seed · email='e2e-reviewer@quanan.com' · role='reviewer' · allowedDomains=['review_trending','review_deep_learn']
- **AC-2** · super_admin 登入后:
  - sidebar 16 domain 全显(grep DOM `[data-testid^="sidebar-item-"]` count == 16)
  - 可访问 /admin/users / /admin/cost / /admin/audit · 全 HTTP 200
  - StatusBar 显示 `super_admin` badge
- **AC-3** · domain_admin 登入后:
  - sidebar 仅显 allowedDomains 子集(users / accounts / cost · count == 3)
  - 访问 /admin/audit · HTTP 403 or redirect to /admin/users(白名单 fallback)
  - 访问 /admin/reviewTrending · HTTP 403(非 allowedDomains)
- **AC-4** · reviewer 登入后:
  - sidebar 仅显 review_* 2 domains(count == 2)
  - 可访问 /admin/reviewTrending + /admin/reviewDeepLearn · HTTP 200
  - 访问 /admin/users · HTTP 403
  - 访问 /admin/cost · HTTP 403
- **AC-5** · 三档全跑 audit 写入验证 · `admin_audit_log` 累加 ≥ 9 rows 在 test 结束时(3 role × {login + page_view + logout} = 9 min · 实际可能更多)· 用 prisma raw query 验证 row count
- **AC-6** · 复用 admin-foundation-loop seed helper · 不重写 prisma.adminUser.upsert · DRY · 提 `tests/e2e/admin/_admin-seed.ts` 作为 shared helper · `admin-foundation-loop.spec.ts` 同步用 helper(refactor 但行为不变)
- **AC-7** · 每角色 logout 后 admin_session_id cookie 清空 · 再次访问 /admin/* 跳 /admin/login
- **AC-8** · 跨 3 角色 storageState 独立(用 playwright `test.use({ storageState: ... })` 隔离)· 不互相污染
- **AC-9** · TypeScript typecheck 0 errors
- **AC-10** · M-2 monorepo lint from ROOT · 0 errors in US-003 引入 files
- **AC-11** · admin SPA dev server :5174 自启(per TD-095 daemon --with-dev-server)· Validator browse 前 curl 健康检查
- **AC-12** · grep `apiKey|admin role hardcoded` apps/admin/src/ 0 命中(权限走 6 闸 · 不前端硬编码 LD-A-3 检查)
- **AC-13** · Use agent-browser to verify 3 roles 各 1 page · 截图 verify-artifacts/US-003/role-{super_admin,domain_admin,reviewer}.png · 各显 sidebar 不同状态

**files_to_create** · `tests/e2e/prd26-admin-role-matrix.spec.ts` + `tests/e2e/admin/_admin-seed.ts`(shared helper)
**files_to_modify** · `tests/e2e/admin/admin-foundation-loop.spec.ts`(refactor 用 _admin-seed helper · 行为不变)

**anti_patterns 注入候选**:
- `admin role check 走 6 闸鉴权链 · 不在前端硬编码`(LD-A-3 + PRD-10 沉淀)
- `e2e seed 必 prisma.adminUser.upsert · 不直接 INSERT SQL`(数据完整性)
- `跨角色 storageState 必独立 · 防 cookie 污染`
- `audit_log row count 验证用 prisma raw query · 不依赖 UI 反映`

---

### US-004 medium · admin UI primitive 抽 packages/ui/src/admin/(TD-049 Medium closed · D-254 字面锁)

**风险分档** · 🟡 medium(跨包重构 · 影响 apps/admin import paths · packages/ui 接口变更需 apps/admin 同步 · 但 0 业务逻辑改)
**Story 大小** · medium(10 files move/modify · ~100 LOC import path 改 + helper 抽)
**downstream count** · US-006 lazy load 依赖 Sidebar 抽包 stable · risk_level=medium

**前置依赖** · packages/ui/src/admin/ 已含 5 files(DenseTable + 2 PDF + index + tokens) · apps/admin/src/components/admin/ 4 components(Sidebar/TopBar/StatusBar/AuditDrawer) · TD-049 Medium 跨 6 admin pages 重复 · admin-router-types shadow 已建

**用户故事** ·
作为 admin 维护者 · admin SPA 4 个 layout component(Sidebar/TopBar/StatusBar/AuditDrawer)当前在 `apps/admin/src/components/admin/` · 但 admin SPA polish 后未来 apps/web 部分(/dashboard 等)可能复用同模式 · 或未来 admin SPA 拆 multi-app 时复用 · 应该按 LD-A-1 + AGENTS §10.1 抽到 `packages/ui/src/admin/` · 跟 DenseTable 同位(已在 packages 共享) · `@quanan/ui/admin` alias 已配。

**验收标准** ·

- **AC-1** · 移 4 components · `apps/admin/src/components/admin/{Sidebar,TopBar,StatusBar,AuditDrawer}.tsx` → `packages/ui/src/admin/{Sidebar,TopBar,StatusBar,AuditDrawer}.tsx` · 内部 import paths 修正(去除 `../lib/admin-client` 类应用层依赖 · 改 props 传入)
- **AC-2** · `packages/ui/src/admin/index.ts` 加 4 个 named export · 完整:
  ```typescript
  export { DenseTable } from './DenseTable';
  export { Sidebar } from './Sidebar';
  export { TopBar } from './TopBar';
  export { StatusBar } from './StatusBar';
  export { AuditDrawer } from './AuditDrawer';
  // PDF templates 仍在 / 单独导出(apps/api server-side use)
  ```
- **AC-3** · apps/admin import 改 `@quanan/ui/admin` · `apps/admin/src/layouts/AdminLayout.tsx` 改:
  ```typescript
  // 改前: import { Sidebar } from '../components/admin/Sidebar';
  // 改后: import { Sidebar, TopBar, StatusBar, AuditDrawer } from '@quanan/ui/admin';
  ```
- **AC-4** · vite.config.ts alias 复用现有 `@quanan/ui/admin → packages/ui/src/admin/index.ts`(已配 · 不需改)
- **AC-5** · 4 component 内部应用层依赖(`adminTrpc.auth.me.useQuery()` 等)改 **props 传入**:
  - Sidebar · 加 `role: string` prop(替代内部 adminTrpc 调用)
  - TopBar · 加 `userEmail: string | undefined` + `onLogout: () => void` props
  - StatusBar · 已有 `role` prop · 验证不引入新依赖
  - AuditDrawer · 加 `logs: AuditLog[]` + `onClose: () => void` props(替代内部查询)
  - AdminLayout 调用方注入 props(adminTrpc 调用留 AdminLayout · 不下沉到 packages/ui)
- **AC-6** · 4 删除位置 · `apps/admin/src/components/admin/{Sidebar,TopBar,StatusBar,AuditDrawer}.tsx` 全 `rm` · 0 dead file
- **AC-7** · `pnpm typecheck` 5 ws 0 errors(typecheck catch packages/ui 类型变化 propagate)
- **AC-8** · `pnpm vitest run` 全 ws pass · admin-foundation-loop e2e 仍 pass(behavior 不变)
- **AC-9** · packages/ui 不引入 admin-client / trpc 任何依赖 · grep `from '@quanan/clients'` packages/ui/ == 0 · grep `from '@/lib/'` packages/ui/ == 0(packages/ui 是纯 UI · 不依赖 app 层)
- **AC-10** · `.agents/tech-debt.json` TD-049 status='resolved' + resolved_at='2026-05-21' + resolved_in_prd='PRD-26' + close_evidence(完整描述 4 components 抽 + 0 循环依赖)
- **AC-11** · admin SPA dev server :5174 仍跑 · admin sidebar / topbar 渲染 OK(不破坏 UX)
- **AC-12** · unit test 不需新增本 US(component 行为不变 · 只 import path 改 · 但 packages/ui/__tests__/ 可加 ≥ 4 unit test smoke · 验证 4 components 能从 packages 导入 + render · 留 US-006 一并补)
- **AC-13** · M-2 monorepo lint from ROOT · 0 errors in US-004 引入 files
- **AC-14** · Use agent-browser to open admin SPA · 截图 verify-artifacts/US-004/admin-after-packages-lift.png · 验证 Sidebar + TopBar + StatusBar 渲染 OK · AuditDrawer 触发 OK

**files_to_create** · `[]`(纯 move + index update)
**files_to_modify**(共 11 files · 边界 12 安全区):
- `packages/ui/src/admin/Sidebar.tsx`(new from move)
- `packages/ui/src/admin/TopBar.tsx`(new from move)
- `packages/ui/src/admin/StatusBar.tsx`(new from move)
- `packages/ui/src/admin/AuditDrawer.tsx`(new from move)
- `packages/ui/src/admin/index.ts`(加 4 export)
- `apps/admin/src/layouts/AdminLayout.tsx`(import 改 + props 传入)
- `apps/admin/src/components/admin/Sidebar.tsx`(delete)
- `apps/admin/src/components/admin/TopBar.tsx`(delete)
- `apps/admin/src/components/admin/StatusBar.tsx`(delete)
- `apps/admin/src/components/admin/AuditDrawer.tsx`(delete)
- `.agents/tech-debt.json`(TD-049 resolved)

**anti_patterns 注入候选**:
- `跨包 import 不引入循环`(packages/ui 是纯 UI 层 · 不能 import apps/*)
- `packages/ui 不依赖 apps trpc client`(继承 §11.2 跨包类型共享)
- `props 注入替代内部 hooks`(packages/ui 不调 react-query · 不调 trpc)
- `4 components 抽包后 apps/admin 必同步 import path · 不留 dead file`

---

### US-005 medium · routers/app/ + admin/ 对称 + audit coverage + typo 修(TD-037/038/039/040/041/042 batch 6 TD)

**风险分档** · 🟡 medium(routers 目录拆 + 28 file 移动 + _app.ts mergeRouters import 改 + 跨 layer 改动 · 但 0 业务逻辑改 · 纯 file structure refactor)
**Story 大小** · medium(28 file move + 1 _app.ts 大改 + audit script 改 + 3 文档 typo · ~80 LOC 改)
**downstream count** · US-006 lazy load 后端 routes import 可能改 · risk_level=medium(若计 file 数算 large 边界 · 但每 file 改动是 namespace import path · single line)

**前置依赖** · `apps/api/src/trpc/routers/` 现 ~25 个 .ts 文件(主应用 router + admin/ 子目录 17 + _app.ts + index.ts) · _app.ts 已 mergeRouters · admin/ 子目录已对称 · TD-037/038/039/040/041/042 全 low severity historical typo

**用户故事** ·
作为 API 维护者 · 主应用 trpc routers 当前平铺在 `apps/api/src/trpc/routers/` 28 file(含 admin/ 子目录)· 跟 ADMIN-ARCHITECTURE §5.4 + AGENTS §10.1 LD-A-2 设计期望 routers/app/(主应用) + routers/admin/(admin · 已对称)不一致 · 是 TD-037 长期 deferred · PRD-26 期间一次性整理 + 顺手清 5 个相关 low TD(全是 PRD-10 期间留下的 typo / 漂移 · 半天 cleanup ROI 高)。

**验收标准** ·

- **AC-1** · 新建 `apps/api/src/trpc/routers/app/` 目录 · 移 18 主应用 router 进去:
  - `acquisitionVideo.ts` · `aiVideo.ts` · `analysis.ts` · `auth.ts` · `boomGenerate.ts` · `copywriting.ts` · `costLog.ts` · `dailyTasks.ts` · `deepLearning.ts` · `diagnosis.ts` · `evolution.ts` · `history.ts` · `invite.ts` · `ipAccounts.ts` · `knowledge.ts` · `monetization.ts` · `myTopics.ts` · `presentStyles.ts` · `privateDomain.ts` · `stepData.ts` · `stt.ts` · `trending.ts` · `tts.ts` · `videoAnalysis.ts` · `videoProduction.ts` · `voiceChat.ts`(实际 26 router · 待 grep ls 确认数量)
- **AC-2** · `_app.ts` mergeRouters import 全改 `from './app/...'`(主应用)+ `from './admin/...'`(admin · 不动) · 跟 AGENTS §10.1 LD-A-2 对称
- **AC-3** · 所有 import 路径同步 · grep `from '@/trpc/routers/[^a]'`(非 admin/ 开头)apps/api/src/ → 改 `from '@/trpc/routers/app/...'` · jobs / services / middleware 全扫
- **AC-4** · `apps/api/src/trpc/routers/__tests__/` 测试文件路径同步(可能也要拆 `__tests__/app/` + `__tests__/admin/`)· 但留 PRD-27 评估 · US-005 仅 routers/ 层移动 · tests 保留平铺(避免范围爆炸)
- **AC-5** · TD-038 修复 · 改 `tasks/prd-10.md §0` 字面 '13 admin model' → '14 admin model'(简单 typo · 1 line edit)
- **AC-6** · TD-039 + TD-042 修复 · `scripts/audit-admin-rls-tables.sh` 加 8 missing admin model coverage · 完整列表:
  - `admin_users` · `admin_sessions` · `admin_invite_campaign` · `admin_constants` · `admin_config` · `admin_ab_experiment` · `prompt_canary_config` · `quota_adjustment_log`
  - 加入 audit script 的 admin_tables 数组 · 跑 `pnpm audit:rls-tables` 验证 22 tables 全 coverage(14 主应用 + 14 admin = 实际 28 表 · 但 admin RLS DISABLE · audit 验"已 DISABLE"状态)
- **AC-7** · TD-040 修复 · 改 `tasks/prd-10.md §1 US-001 AC-13` 字面 'adminUserId+createdAt 索引' → 'actorAdminId+createdAt 索引'(对齐 schema.prisma 实际字段名)
- **AC-8** · TD-041 修复 · 改 `tasks/prd-10.md §1 US-007` e2e path 字面 'tests/e2e/admin-foundation-loop.spec.ts' → 'tests/e2e/admin/admin-foundation-loop.spec.ts'(对齐实际位置)
- **AC-9** · `pnpm typecheck` 5 ws 0 errors(全 import 改完后 propagate 验证)
- **AC-10** · `pnpm vitest run` 全 ws pass · 0 tests fail · 不破坏 PRD-26-prep 状态
- **AC-11** · `pnpm test:rls-tables` audit 跑通 22 tables 全覆盖 · exit 0 · 22 row output(14 主应用 RLS ON + 8 admin RLS DISABLE)
- **AC-12** · admin-foundation-loop e2e 仍 pass(不破坏 PRD-10 sealed)
- **AC-13** · `.agents/tech-debt.json` 批量更新 · TD-037/038/039/040/041/042 全 status='resolved' + resolved_at='2026-05-21' + resolved_in_prd='PRD-26' + 各自 close_evidence
- **AC-14** · M-2 monorepo lint from ROOT · 0 errors in US-005 引入 files(routers/app/* import order)
- **AC-15** · git mv 优先 `git mv old-path new-path`(保留 git history blame) · 不用 cp + rm

**files_to_create** · `apps/api/src/trpc/routers/app/`(directory 创建)
**files_to_modify**(共 28+ files · 但每 file 改动是 file path move + 1-2 line import 改 · 不是 logic 改 · M-1 PATH-B 时长应充足):
- 26 主应用 router(move into app/ via git mv)
- `apps/api/src/trpc/routers/_app.ts`(import paths 改)
- ~10-15 个 services/jobs 文件(从其他位置 import routers 的 · 改 import path)
- `scripts/audit-admin-rls-tables.sh`(8 missing admin model 加)
- `tasks/prd-10.md`(3 处 typo · §0 13→14 + AC-13 adminUserId→actorAdminId + §1 e2e path)
- `.agents/tech-debt.json`(6 TD resolved)

**test_command** · `cd /Users/return/Desktop/QuanAn && pnpm typecheck && pnpm vitest run && pnpm test:rls-tables`
**size_hint** · medium · **risk_level** · medium(28+ file move 是机械操作 · 不算 logic 改)

**anti_patterns 注入候选**:
- `git mv 保 history · 不 cp + rm`(blame 完整性)
- `routers move 不破坏 import order(M-2 lint)`
- `audit script 改后跑实测验 22 tables`(M-3 类似双 review · audit script 元验证)
- `_app.ts mergeRouters 改 import 必跑 typecheck 全过 · 避免 procedure 路径错`

---

### US-006 medium · admin lazy load + chunking + 17 page unit test 补(TD-099 部分 + D-256 字面锁)

**风险分档** · 🟡 medium(React.lazy 改 17 routes · vite chunk 策略 · 17 unit test 创建 · 工作量较大但低风险)
**Story 大小** · medium(2-3 file 大改 + 17 unit test 创建 · ~600 LOC · 边界 12 files 内)
**downstream count** · US-007 收官 verify-prd-26.sh 验证 chunk count + admin tests count · risk_level=medium

**前置依赖** · React 18 Suspense + react-router-dom v6 lazy route + vite manualChunks · admin SPA 当前 router.tsx 直接 import 17 page · main.tsx 一次性 mount · 24K LOC 单 bundle 加载

**用户故事** ·
作为 admin 用户 · admin SPA 当前 24K LOC 单 bundle · 首次加载需 ~3-5s · 各 page 实际只用 1-2 个 · 浪费 80%+ JS 体积。PRD-26 加 React.lazy 拆 17 page + vite chunk 4 组(P0 核心 / P0 审核 / P1 健康度 / P2 高级) · first paint < 2s · 同时补 17 page unit test smoke(继承 D-233 unit test 同步 + 修 TD-099 admin 部分)。

**验收标准** ·

- **AC-1** · `apps/admin/src/router.tsx` 改 17 page 全 `React.lazy` · 例:
  ```typescript
  const NsmDashboard = lazy(() => import(/* webpackChunkName: "p0-core" */ './pages/nsm/index'));
  ```
  · `Suspense fallback={<AdminLoading />}` wrap 在 `<AdminLayout>` 内或 `<Routes>` 外 · 单 fallback component
- **AC-2** · 新建 `apps/admin/src/components/AdminLoading.tsx` · 简单 Loader2 spinner + "加载页面..." text · ≤ 30 行 · 继承 PRD-25 Diagnosis loading pattern
- **AC-3** · `apps/admin/vite.config.ts` 加 manualChunks 策略 · 4 chunks 分组:
  - `p0-core`(6 page) · nsm / users / accounts / cost / audit / invites
  - `p0-review`(2 page) · reviewTrending / reviewDeepLearn
  - `p1-health`(5 page) · evolutionHealth / prompts / quota / compliance / approvals
  - `p2-advanced`(4 page) · abExperiments / constants / knowledge / featureFlags
  - 完整 manualChunks fn signature:`manualChunks(id) { if (id.includes('pages/nsm') || ...) return 'p0-core'; ... }`
- **AC-4** · `pnpm --filter @quanan/admin build` 跑通 · `dist-admin/assets/` 含 ≥ 5 chunks(main + 4 page chunks)· 用 `ls dist-admin/assets/*.js | wc -l` 验证 ≥ 5
- **AC-5** · 测加载性能 baseline · 用 puppeteer 或 lighthouse(可选 · 优先 visual smoke 即可)· first paint < 2s
- **AC-6** · 17 page 每 page 加 ≥ 3 unit test in `apps/admin/src/pages/{page}/__tests__/{Page}.test.tsx` · 继承 PRD-25 Diagnosis.test.tsx mock pattern · `vi.hoisted` + `adminTrpc` mock + MemoryRouter wrap · 完整列表 17 文件:
  - nsm/__tests__/NsmDashboard.test.tsx
  - users/__tests__/UsersPage.test.tsx
  - accounts/__tests__/AccountsPage.test.tsx
  - cost/__tests__/CostPage.test.tsx
  - audit/__tests__/AuditPage.test.tsx
  - invites/__tests__/InvitesPage.test.tsx
  - reviewTrending/__tests__/ReviewTrendingPage.test.tsx
  - reviewDeepLearn/__tests__/ReviewDeepLearnPage.test.tsx
  - evolutionHealth/__tests__/EvolutionHealthPage.test.tsx
  - prompts/__tests__/PromptsPage.test.tsx
  - quota/__tests__/QuotaPage.test.tsx
  - compliance/__tests__/CompliancePage.test.tsx
  - approvals/__tests__/ApprovalGatesPage.test.tsx
  - abExperiments/__tests__/AbExperimentsPage.test.tsx
  - constants/__tests__/ConstantsPage.test.tsx
  - featureFlags/__tests__/FeatureFlagsPage.test.tsx
  - placeholder/__tests__/knowledge.test.tsx
- **AC-7** · 每 page 3 tests(共 51+ tests):
  - (a) page renders without crash(MemoryRouter wrap + adminTrpc.X.useQuery mock 返 stub data)
  - (b) h1 / 主标题字面正确(grep DOM `h1, h2` text)
  - (c) loading state shown when adminTrpc query isPending
- **AC-8** · `pnpm --filter @quanan/admin test` 全 pass · admin tests 累加 ≥ 51 个(17 page × 3 = 51 min)
- **AC-9** · admin tests 整合到 root `pnpm vitest run` · 不破坏 PRD-26-prep 0 tests fail 状态
- **AC-10** · TypeScript typecheck 5 ws 0 errors · lazy import 的 dynamic import 类型必正确(use `await import` 模式)
- **AC-11** · admin-foundation-loop e2e 仍 pass(Suspense fallback 显示 < 500ms · 不破坏 e2e timing)
- **AC-12** · M-2 monorepo lint from ROOT · 0 errors in US-006 引入 files(17 unit test + router lazy + vite chunk · 全 import order 严守)
- **AC-13** · `.agents/tech-debt.json` TD-099 admin 部分 status update(close admin sub-task · 留 web 部分 AiVideo/BoomGenerate/Generate 待 PRD-27 cleanup)
- **AC-14** · M-3 plan-check LLM 接入 AC 双 review(US-006 不接 LLM · 应 noise-free · 但 trpc.adminX.useQuery mock pattern 跟 PRD-25 一致)
- **AC-15** · Use agent-browser to open http://localhost:5174/admin/nsm · 验证 lazy loading 跑通 · 首次进 page 短暂 fallback flash · 截图 verify-artifacts/US-006/admin-lazy-load-{nsm,users,cost}.png

**files_to_create**(17 unit test + 1 AdminLoading · 共 18 files · 边界 12 略超 · 但 unit test 是 D-233 必需):
- 17 `apps/admin/src/pages/{page}/__tests__/{Page}.test.tsx`(继承 Diagnosis.test.tsx template)
- `apps/admin/src/components/AdminLoading.tsx`

**files_to_modify**:
- `apps/admin/src/router.tsx`(17 page 全 lazy + Suspense wrap)
- `apps/admin/vite.config.ts`(manualChunks 加)
- `.agents/tech-debt.json`(TD-099 update)

**test_command** · `cd /Users/return/Desktop/QuanAn && pnpm typecheck && pnpm vitest run && pnpm --filter @quanan/admin build`
**size_hint** · medium · **risk_level** · medium

**anti_patterns 注入候选**:
- `React.lazy 必 Suspense 包裹 · 否则 SSR 同步加载报错`
- `unit test mock trpc 必 vi.hoisted(M-3 TD-027 修复模式)`
- `vi.fn().mockResolvedValue 不固定 pass · 用 hoisted + beforeEach`(继承 AGENTS §11.6.7)
- `lazy import 路径必相对 · 不 alias(vite chunk fn parse `id.includes(...)` 用相对路径更稳)`
- `M-2 lint scope · pnpm lint ROOT 跑`

---

### US-007 medium · 收官 verify-prd-26.sh + /goal-verify + /prd-retro 6 PRD + handoff PRD-27+(D-258 字面锁)

**风险分档** · 🟡 medium(收官 · 不动业务代码 · 但 verify ≥ 30 checks + /goal-verify §0 跑 4 子项目事实层 + /prd-retro 跨 6 PRD)
**Story 大小** · medium(4-5 files create · 收官产物)
**downstream count** · 0(US-007 是最后一个) · risk_level=medium

**前置依赖** · US-001~006 完成 · 9 TD closed(TD-031/037/038/039/040/041/042/049 + TD-099 部分) · 17 visual baseline + 17 e2e smoke + 17 unit test 累加 ≥ 51 admin tests · admin lazy load + 4 chunks build · admin SPA :5174 跑通

**用户故事** ·
作为项目维护者 · PRD-26 admin polish 完成时 · 跑一键 verify-prd-26.sh 看 ALL CHECKS PASSED · /goal-verify §0 跑 4 子项目事实层同步 + 对账 AGENTS.md 设计约束 + 偏差登记 TD · /prd-retro 跨 PRD-21~26 6 PRD 复盘提炼 playbook 回传 progress.txt · 准备 PRR + PRD-27+ handoff(evaluation / 多用户压测 / 移动端 / 海外版 / PRR)。

**验收标准** ·

- **AC-1** · `scripts/verify-prd-26.sh` 创建 · ≥ 30 checks 跨 7 sections:
  - §1 TD closed verification(8 checks · TD-031/037/038/039/040/041/042/049 各 grep `"status": "resolved"` in tech-debt.json + close_evidence 字段存在)
  - §2 visual baseline matrix(5 checks · 17 baseline 文件存在 + threshold 0.05 + viewport 1440×900 + fullPage true + test:visual:prd26 script 在 package.json)
  - §3 e2e smoke pass(5 checks · prd26-admin-pages-smoke.spec.ts + prd26-admin-role-matrix.spec.ts 文件存在 + 跑通 exit 0 + 三档角色 fixture + admin_audit_log ≥ 9 rows + admin-foundation-loop 仍 pass)
  - §4 lazy load + chunking(3 checks · pnpm --filter @quanan/admin build 跑通 + dist-admin/assets/*.js ≥ 5 chunks + 17 page React.lazy in router.tsx)
  - §5 admin tests count(5 checks · admin/__tests__ tests 总数 ≥ 51 · 各 page __tests__/*.test.tsx 存在 + vi.hoisted pattern · vitest pass)
  - §6 packages/ui/src/admin(5 checks · 5 components 文件存在 + index.ts 5 named export + apps/admin import `@quanan/ui/admin` + packages/ui 无 trpc 依赖 + AdminLayout 通过 props 注入)
  - §7 audit coverage 22 tables(2 checks · audit-admin-rls-tables.sh contains 22 tables · pnpm audit:rls-tables exit 0)
- **AC-2** · `verify-prd-26.sh` 跑通 exit 0 · echo "PRD-26 RESULT: 30+ 通过 · 0 失败 · 0 跳过" + "ALL CHECKS PASSED"
- **AC-3** · `/goal-verify §0` 跑 · 4 sub-project 事实层同步:
  - apps/web · `apps/web/.planning/codebase/` 7 文件(已有)
  - apps/api · `.planning/codebase/apps-api/` 7 文件(已有)
  - apps/admin · `.planning/codebase/apps-admin/` 7 文件(已有 · 验证 PRD-26 改动 propagate)
  - packages · `.planning/codebase/PACKAGES.md`(已有 PRD-26-prep)
  - 偏差登记 TD(若发现 design-drift)
- **AC-4** · `/goal-verify §1+` Goal-backward 验证 · 写入 `.agents/verification/prd-26-goal-backward.md` · 至少 4 段:
  - §1 7 US 目标 vs 实际实现对账(表格)
  - §2 9 TD closed verification(state transition)
  - §3 admin lazy load 性能 baseline(before/after first paint 数据)
  - §4 VERDICT PASS / PASS-WITH-DEBT / FAIL
- **AC-5** · `/prd-retro` 跨 PRD-21~26 6 PRD 复盘 · 写入 `.agents/retros/prd-26-vs-prd-25-retrospective.md` · 至少 8 section:
  - §0 数据总览(成功率 + reject 数 + TD 净变化)
  - §1 PRD-26 严格通过率分析
  - §2 跨 PRD-21~26 6 PRD 趋势(视觉征程 → LLM 接入 → admin polish 三阶段)
  - §3 TD 净变化分析(关 9 · 开 ?)
  - §4 反例库注入有效率(L4 M-1/M-2/M-3 真触发情况)
  - §5 Playbook 提炼 ≥ 5 条
  - §6 反向发现(偶然成功 / 不可复制)
  - §7 PRD-27+ 建议 + Skill 升级 diff(若有)
  - §8 文档回流建议
- **AC-6** · `progress.txt` 追加 PRD-26 retro 摘要 · `[PRD-26 retro] 6-PRD 复盘 · 严格通过率 X% · 9 TD closed · admin UI 95% → 100% · lazy load + 4 chunks · 17 e2e smoke + 17 unit test + 17 visual baseline · L4 进化 M-1/M-2/M-3 真触发 N 次`
- **AC-7** · `tasks/prd-26.md §9 PRD-27+ Handoff` 写明:
  - PRD-27 候选 · evaluation 完整化(LLM Judge staging 真调 · 多 agent 跨场景 · admin evaluation UI 完整)
  - PRD-28 · 多用户压测(100/1k 用户 · LLM Gateway 限流 · BullMQ 饱和)
  - PRD-29 · 移动端响应式 polish + native App 评估
  - PRD-30 · 海外版评估(英文版 + 多供应商海外节点)
  - PRR · 法务/部署 prep(域名/ICP/OAuth/Sentry 配置)
- **AC-8** · TypeScript typecheck 0 errors · vitest tests pass(全 ws + LLM Judge) · pnpm lint 0 errors in PRD-26 files(M-2 ROOT 跑)
- **AC-9** · admin-foundation-loop e2e 仍 pass · admin 三档角色 e2e pass · 17 visual baseline regression pass
- **AC-10** · git 状态干净 · 仅本 US 改 4-5 files + retro · 不动业务代码

**files_to_create**:
- `scripts/verify-prd-26.sh`(≥ 30 checks · chmod +x)
- `.agents/verification/prd-26-goal-backward.md`(/goal-verify §1+ 报告)
- `.agents/retros/prd-26-vs-prd-25-retrospective.md`(6 PRD 复盘)

**files_to_modify**:
- `tasks/prd-26.md`(§9 PRD-27+ Handoff section)
- `progress.txt`(追加 retro 摘要)

**test_command** · `cd /Users/return/Desktop/QuanAn && bash scripts/verify-prd-26.sh`
**size_hint** · medium · **risk_level** · medium

**anti_patterns 注入候选**:
- `收官不跳 /goal-verify §0`(继承 PRD-25 D-251)
- `retro 数据驱动 · 不写'全部 1iter PASS'假设(per Opus 视角 vs ralph 自报区分 · 继承 PRD-25 retro §8.1 校准模式)`
- `verify-prd-26.sh ≥ 30 checks 是 AC-1 字面锁 · 不允许减条数`
- `/prd-retro § Opus 补强必含 9 反向发现 + 应固化机制(继承 PRD-25 retro §9/§12 模式)`

---

## §4 验收标准摘要

### §4.1 9 TD close 矩阵

| US | TD | severity | 操作 |
|:-:|:-:|:-:|---|
| US-001 | TD-031 | low | admin/src/index.ts barrel export + 7 placeholder 删 |
| US-004 | TD-049 | **Medium** | packages/ui/src/admin/ 抽 4 components |
| US-005 | TD-037 | low | routers/app/ + admin/ 对称 |
| US-005 | TD-038 | low | PRD-10 §0 typo '13 → 14 admin model' |
| US-005 | TD-039 | low | audit-admin-rls-tables.sh 22 tables coverage |
| US-005 | TD-040 | low | PRD-10 AC-13 'adminUserId → actorAdminId' typo |
| US-005 | TD-041 | low | PRD-10 §1 e2e path 字面 typo |
| US-005 | TD-042 | low | audit coverage 8 missing admin model |
| US-006 | TD-099 | low | 17 admin page unit test 补(继承 D-233) |

### §4.2 共享 AC

- **AC-COMMON-1** · TypeScript typecheck 5 ws 0 errors
- **AC-COMMON-2** · `pnpm lint` **从 PROJECT_ROOT 跑**(M-2 monorepo lint scope 严守)· 0 errors in PRD-26 引入 files
- **AC-COMMON-3** · vitest run 全 ws pass · 0 tests fail(剩 15 file setup-fail 全 pre-existing TD-083)
- **AC-COMMON-4** · admin-foundation-loop e2e 仍 pass(不破坏 PRD-10 sealed)
- **AC-COMMON-5** · D-233 unit test 同步严守
- **AC-COMMON-6** · LD-A-1 admin/web import 隔离严守 · R-A 6 红线严守

---

## §5 风险红线

- **R-A** · 不引入新 admin specialist / LLM 调用(PRD-26 polish only · PRD-27 留 evaluation)
- **R-B** · 不动 main app 业务代码(apps/web/src/pages/* 不改 · 除非 TD-099 unit test 补 cleanup)
- **R-C** · 不改 admin RLS policy / admin schema(数据层稳定)
- **R-D** · packages/ui/src/admin/ 抽包不引入循环依赖(packages 不依赖 apps/)
- **R-E** · routers/app/ 拆 不破坏 import paths · _app.ts mergeRouters 同步
- **R-F** · admin lazy load 不破坏 admin-foundation-loop e2e(Suspense fallback 必 visible)

---

## §6 失败回滚 + 拆 story 协议

- backup branch · `git branch backup/before-prd-26 main`(daemon 启动前 30 min 内由 Opus 主对话或 ralph 启动 hook 建)
- 拆 story 触发(继承全局 §9.6):
  - prompt 字节 > 12K · 强制拆
  - files_to_create + files_to_modify > 12 · 强制拆(US-005 是边界 · 28 文件 move + import 改 · 但实际改动是 import path · 单 file rename 不破坏 12 限)
  - size_hint=large · 强制拆(本 PRD 0 large · 全 medium)
  - 单 US round ≥ 6 · 触发 §9.6.4 拆分流程

---

## §7 依赖图谱

```
US-001 (admin index + placeholder cleanup)
  ↓
US-002 (17 page render + visual baseline)
  ↓
US-003 (admin auth + role matrix e2e)
  ↓
US-004 (UI primitive 抽 packages/ui/admin)
  ↓
US-005 (routers/app/ + admin/ + audit coverage TD batch)
  ↓
US-006 (lazy load + chunking + 17 unit test)
  ↓
US-007 (收官 verify-prd-26 + retro + handoff)
```

**串行执行** · 每个 US 依赖前者(US-004 抽包前 US-001 cleanup · US-006 lazy load 前 US-004 抽包稳定 · 等)

---

## §8 进度跟踪

### §8.1 daemon 命令

```bash
cd /Users/return/Desktop/QuanAn
ls scripts/ralph/prd-26.json && cp scripts/ralph/prd-26.json scripts/ralph/prd.json
python3 scripts/ralph/ralph-tools.py status

git branch backup/before-prd-26 main

# Monitor 启(§9.1 5 步 SOP · 必先于 daemon)
# Monitor command: tail -n 0 -F scripts/ralph/ralph-output.log | grep -E --line-buffered 'PENDING_DETECTED|审计门禁已激活|APPROVED|REJECTED|所有任务已完成|All stories resolved|非零退出码|最大重试次数|级联阻断|通过 Opus 质量审查|⛔|Traceback|Error:'

# Daemon
/Users/return/.local/bin/python3.11 scripts/ralph/ralph.py --model sonnet --daemon
```

### §8.2 预期时间线

| US | risk | ralph 预期 | Opus audit | 累计 |
|:-:|:-:|:-:|:-:|:-:|
| US-001 | medium | 1.5-2h | 8 min | 2h |
| US-002 | medium | 3-4h | 10 min | 6h |
| US-003 | medium | 3-4h | 10 min | 10h |
| US-004 | medium | 4-5h | 12 min | 15h |
| US-005 | medium | 5-6h | 12 min | 21h |
| US-006 | medium | 5-7h | 12 min | 28h |
| US-007 | medium | 2-3h | 8 min | 31h |
| **累计** | — | **23-31h daemon** | **72 min Opus** | **24-32h wall time** |

### §8.3 大门禁

1. ✅ US-001 完成 · admin index 真 barrel · 7 placeholder 删
2. ✅ US-002 完成 · 17 visual baseline + 17 e2e smoke 全 pass
3. ✅ US-003 完成 · 三档角色 e2e 通 · admin_audit_log 9 rows
4. ✅ US-004 完成 · packages/ui/src/admin/ 5 components · apps/admin import @quanan/ui/admin · TD-049 closed
5. ✅ US-005 完成 · routers/app/ + admin/ 对称 · 6 TD closed
6. ✅ US-006 完成 · admin 4 chunks · 17 page unit test ≥ 51 · TD-099 部分 closed
7. ✅ US-007 完成 · PRD-26 ship · verify-prd-26.sh ALL CHECKS PASSED · /goal-verify + /prd-retro 跨 6 PRD

---

## §9 PRD-27+ Handoff(收官时填)

留 US-007 收官时基于 retro 数据写入。预期方向:
- **PRD-27** · evaluation 完整化(LLM Judge staging 真调 · 多 agent 跨场景测试 · admin evaluation UI 完整化)
- **PRD-28** · 多用户压测 + 性能 baseline(100/1k 用户 · LLM Gateway 限流 · BullMQ 饱和)
- **PRD-29** · 移动端响应式 polish + native App 评估
- **PRD-30** · 海外版评估(英文版 + 多供应商海外节点)
- **PRR** · 法务/部署 prep(域名/ICP/OAuth/Sentry 配置 · 主开发完成后)

---

> **本 PRD 由 Claude(Opus 4.7)在 PRD-26 启动期写 · 2026-05-21 · 跟 PRD-25 互补 · 7 medium US · admin polish + 9 TD 清 + e2e 验证 · 不引入新业务功能 · 完整版不紧凑版 · 待 prd skill 转 prd-26.json + plan-check + 启 daemon。**
