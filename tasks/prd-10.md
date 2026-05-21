# PRD-10 · P9.0 admin 基础设施(monorepo workspace + 独立 lucia session + 6 闸鉴权链 + admin_audit_log + Layout 骨架)

> **派生** · ADMIN-ARCHITECTURE §1 系统总览(line 43-191)+ §2 部署形态(line 192-380)+ §4 数据访问与隔离(line 660-916)+ §5 接口契约 adminRouter(line 917-1014)+ §7 鉴权审计安全(line 1269-1459)+ §8.2 P9.0 实施路线(line 1493-1503)+ ARCHITECTURE §1.4b 主-admin 边界声明(line 143-247)+ AGENTS §10 admin 子系统宪法(line 2313-2570)+ DATA-MODEL §13 admin 14 表 schema(line 2856-3543)
> **风险** · **foundation**(下游 PRD-11 / PRD-12 / PRD-13 / PRD-14 共 4 PRD 全 depends_on 此 · downstream count = 4 admin PRDs · 升档自 high)
> **依赖** · PRD-1 ✅(P0 基础设施 · 单包 src/ 骨架就位)· PRD-9 ✅(主应用 P8 收官 · 5/5 PASSED · main commit 1a1300f)· 主应用 P0-P8 收官触发 admin P9 启动(ADMIN §8.7 严格串行 · 方案 A)
> **预估** · 1 周(7 stories · 同 ADMIN §8.2)· **branch** · 沿用 main(== ralph/prd-9-p8-knowledge-base-rag · 同 commit · D10 决策)· progress.txt 继续累积
> **目标** · apps/admin 骨架就绪 · super_admin(mock OAuth 通过)能登录看到空 Layout 16 sidebar 域占位 + audit drawer 显示 admin_login event · admin_audit_log 自动写 4 类 eventType · 6 闸鉴权链 stub + 单测齐 · 1 e2e 收官闭环(login → layout → audit_log)

---

## §0 引用清单(单一真理来源 · 不复制大段)

| 维度 | 来源(只引用 · 不复制) |
|---|---|
| **业务架构(总览)** | [`ADMIN-ARCHITECTURE.md`](../ADMIN-ARCHITECTURE.md) §1 系统总览(line 43-191)· §1.4 admin 9 层架构图(line 119-160)· §1.6 5 项默认决策落地(line 176-185) |
| **部署形态** | [`ADMIN-ARCHITECTURE.md`](../ADMIN-ARCHITECTURE.md) §2.1 子域名 admin.quanan.com(line 194-209 · **PRD-10 stub 不配真域名**)· §2.2 apps/admin SPA(line 211-243)· §2.3 同进程双 router 树隔离(line 244-307) |
| **数据访问与隔离** | [`ADMIN-ARCHITECTURE.md`](../ADMIN-ARCHITECTURE.md) §4.2 admin_audit_log schema(line 700-810)· §4.3 权限矩阵 6 类用户(line 811-870)· §4.4 14 类高风险 + Approval(line 871-916) |
| **adminRouter 接口契约** | [`ADMIN-ARCHITECTURE.md`](../ADMIN-ARCHITECTURE.md) §5.1 adminRouter 14 子树(line 925-985 · **PRD-10 仅落 1 子树 auth · 其他 13 PRD-11+**)· §5.2 6 闸鉴权链 middleware 链 |
| **鉴权审计安全** | [`ADMIN-ARCHITECTURE.md`](../ADMIN-ARCHITECTURE.md) §7.1 lucia-auth admin session(line 1271-1292)· §7.2 IP 白名单(line 1294-1311 · **PRD-10 stub · PRR 配真 Cloudflare WAF**)· §7.3 MFA(line 1313-1334 · **PRD-10 stub · PRR 真 TOTP**)· §7.5 audit_log 全量记录(line 1355-1372)· §7.6 approvalGateCheck middleware 完整代码(line 1373-1443 · **PRD-10 stub 版 throw 'PRD-13 真闭环'**) |
| **实施路线** | [`ADMIN-ARCHITECTURE.md`](../ADMIN-ARCHITECTURE.md) §8.2 P9.0 实施 1 周(line 1493-1503)· §8.7 P9 协同严格串行(line 1546-1576) |
| **主-admin 边界** | [`ARCHITECTURE.md`](../ARCHITECTURE.md) §1.4b A 双子系统全景图(line 149-194)· §1.4b B 三方独立部署(line 196-204)· §1.4b C monorepo workspace 结构(line 206-230 · **强制 · 不再可选**)· §1.4b D 6 类边界破坏禁止(line 233-244) |
| **代码层约束** | [`AGENTS.md`](../AGENTS.md) §10.1 5 LD-A(line 2320-2393 · LD-A1 独立部署+OAuth / LD-A2 router 严格分离 / LD-A3 跨账号查必带 adminRLS+audit / LD-A4 高风险必走 Approval / LD-A5 内容审核硬闸门)· §10.2 6 R-A 红线(line 2395-2455)· §10.3 14 类高风险清单(line 2457-2482 · **PRD-10 仅 stub middleware · 真高风险 procedure 留 PRD-11+**)· §10.4 audit_commands(line 2484-2543 · **PRD-10 落地 §10.4.1 LD-A 检测 + §10.4.2 R-A 红线检测 · §10.4.4 审计闭环留 PRD-11+**) |
| **数据契约** | [`DATA-MODEL.md`](../DATA-MODEL.md) §13.1 admin 数据模型概览(line 2861-2898)· §13.2 admin_audit_log schema(line 2899-2965 · **必加 · 4 类 eventType 落地**)· §13.3 approval_requests(line 2966-3013 · **PRD-10 仅建表 · stub middleware 写入 · 真闭环留 PRD-13**)· §13.4-§13.7 11 张其他 admin 表(**PRD-10 仅 schema 建表 + RLS DISABLE · 业务逻辑留 PRD-11~14**)· §13.8 RLS 策略扩展(line 3465-3504 · **PRD-10 必跑 · manual_admin_rls.sql DISABLE RLS for 13 表**)· §13.10 跟主应用 schema 兼容性(line 3532-3542) |
| **关联 ADR** | [`ADR.md`](../ADR.md) ADR-019 前后端分离 + monorepo workspace(line 1559-1622)· ADR-020 Approval Gates 两步审批(line 1623-1712 · **PRD-10 stub · 真闭环 PRD-13**)· ADR-021 管理后台独立 first-class 子系统(line 1713-1779) |
| **既有代码模式继承** | `apps/api/src/trpc/middleware/account-isolation.ts`(主应用 RLS · `$transaction wrap + $executeRawUnsafe set_config('app.activeAccountId', ...)` · adminRLS pattern 类比此模式 · C7 假设)· `apps/api/src/lib/auth/lucia.ts`(主应用 lucia-auth · admin 复用 lib 不重写)· `apps/web/src/layouts/`(主应用 Layout · admin Layout 参考但密度更高) |
| **设计系统** | `packages/ui/base/`(主应用 Aurelian Dark 复用)+ `packages/ui/admin/`(★ 本 PRD 新建 · 密集表格 + 数据可视化专属)· ADMIN §6.1 设计系统(line 1020-1080 · admin 密度模式 + topbar 60px / sidebar 240px / row-height 32px)· ARCHITECTURE §11.4 ScrollArea + h-N 沉淀 |
| **不做的事** | [`AGENTS.md`](../AGENTS.md) §1.4 全局不做(主应用部分)· 本 PRD §3 范围排除(B5 假设落地:WAF 真配置 / MFA 真启用 / 钉钉 webhook / Google Workspace 真 OAuth / admin.quanan.com 真域名 · 全留 PRR) |
| **反例库** | `~/.claude/playbooks/reject-examples.jsonl`(35+ 条 PRD-1~9 累计)· 关键 REJ-008(prisma 必带 accountId · adminRLS bypass 例外)/ REJ-009($executeRawUnsafe 仅 middleware 允许)/ REJ-013(protectedProcedure 必经)/ REJ-017(traceId 命名分层)/ REJ-035(LS-first dual-write)· 本 PRD 8 反例命中(详 §8) |
| **沉淀** | `.planning/retros/PRD-9-RETRO.md`(2026-05-12 · 4 Diff L4 升级建议 · Diff-2 daemon timeout robust handling · Diff-3 cleanup 自动化)· `scripts/ralph/progress.txt`(PRD-9 收官段 · "Codebase Patterns - PRD-9" 2 patterns 已沉淀:seed no-key mode + debugAssembleSystemPrompt 中文关键词) |
| **全局规则** | 全局 CLAUDE.md §5 质量第一不简化 + §5.4 升档(downstream count ≥ 3 → foundation)+ §9.1 5 步启 daemon SOP + §9.6 size 拆分硬规则 + 项目 CLAUDE.md §5.1 工程红线(R-001 BASE_LLM_URL 不暴露)+ §5.2 前后端边界(ADR-019) |
| **Assumptions** | `.planning/prd-10-assumptions.md`(待写 · 用户已 review 8 假设 / 4 类 = A 技术 4 ✅ / B 范围 7 stories ✅ / C 实现 4 ✅ / D 工作流 2 ✅ · 2026-05-12)· B5 PRR 留 5 件(WAF / MFA TOTP / 钉钉 webhook / Google Workspace OAuth / 真域名) |

★ **继承 PRD-1 / PRD-2**(主应用 P0 / P1 已就位)·
- src/ 单包骨架 → 本 PRD US-001 拆 monorepo(apps/web / apps/admin / apps/api / packages/{schemas,ui,clients})
- prisma/schema.prisma 18 主应用 model 已就位(PRD-1)· 本 PRD US-001 加 14 admin model(DATA-MODEL §13.2~§13.7)
- lucia-auth 主应用 session(`apps/api/src/lib/auth/lucia.ts`)· 本 PRD US-002 复用 lib · 新建 `lucia-admin.ts` 独立 Redis namespace `admin:session:*`
- RLS 主应用 18 表 ENABLED(PRD-2 跑 LD-009)· 本 PRD US-001 manual_admin_rls.sql DISABLE RLS for 13 admin 表(LD-A3 · DATA-MODEL §13.8)
- accountIsolationMiddleware pattern(`apps/api/src/trpc/middleware/account-isolation.ts` · PRD-2 落地)· 本 PRD US-003 adminRLS middleware 类比此模式(C7 假设)

★ **继承 PRD-9**(主应用 P8 收官 · 跟本 PRD 无业务依赖 · 仅共享 main commit)·
- cost_log 7 类 eventType 已落地(specialist/judge/image_gen/l5_agent/stt/tts/embedding)· admin_audit_log 是平级新表 · 独立 4 类 eventType(admin_login / cross_account_query / approval_request_create / approval_request_resolve)
- pgvector 0.8.0 已 enable(PRD-9 US-001)· admin 不调 RAG · 不依赖
- Aurelian Dark base tokens(`packages/ui/base/` 由 PRD-3 落地)· 本 PRD US-005 加 `packages/ui/admin/` 密集模式

★ **本 PRD 暂不做**(B5 假设全 PRR · 详 §3)·
- **WAF Cloudflare 真配置** · ipWhitelist middleware stub(env ADMIN_IP_WHITELIST_ENABLED=false 永远 pass)· PRR 阶段配真 Cloudflare yaml + nginx
- **MFA TOTP 真启用** · mfaCheck middleware stub(env ADMIN_MFA_REQUIRED=false 永远 pass)· PRR 阶段接 speakeasy / WebAuthn
- **钉钉 webhook 异常告警** · 异常事件仅写 admin_audit_log eventCategory='security_alert' · 不真推钉钉
- **Google Workspace 真 OAuth** · oauth-admin-google.ts stub(throw 'PRR config required')· OAUTH_PROVIDER=mock 时走 mock(开发期默认)· prod 必须 OAUTH_PROVIDER=google 否则启动 fail
- **admin.quanan.com 真域名** · 本 PRD 用 localhost:5174(apps/admin Vite dev)+ localhost:3000/admin 静态部署占位 · 域名 / DNS / CDN 留 PRR
- **真 Approval 闭环** · approvalGateCheck stub(meta.requiresApproval=true 时 throw 'PRD-13 真闭环 stub' · 不创建 approval_requests row)· 但 admin_audit_log 仍写 approval_request_create event 检测点
- **adminRouter 14 子树业务** · 仅落 1 子树 admin.auth(login/logout/me)+ 1 stub 子树 admin.health(GET /health · 返回 ok · 不需鉴权)· 其他 13 子树(users/accounts/cost/audit/invites/reviewTrending/reviewDeepLearn/evolution/prompts/quota/compliance/approval/ab/knowledge/config)留 PRD-11~14
- **16 sidebar 域真业务** · US-005 仅 16 域 placeholder route + 占位页 · 真业务在 PRD-11(6 域 P0)+ PRD-12(2 域 P0)+ PRD-13(5 域 P1)+ PRD-14(3 域 P2)

---

## §1 用户故事(US-001 ~ US-007)

> **risk_level 标注** · 按 AGENTS §1.4 + AUDIT-CHECKLIST §Z + 全局 CLAUDE.md §5.4 升档(downstream count ≥ 3 → foundation)
> **priority** · 数字小者先跑 · ralph.py wave 调度依此 · US-001 wave 1 / US-002~005 wave 2 / US-006~007 wave 3

---

### **US-001 · ★ Foundation · monorepo workspace 重构 + 13 admin 模型 + RLS DISABLE migration + 6 闸 middleware 模板预埋**

> **risk_level** · `foundation`(downstream 6 · 后续 6 个 US 全 depends_on 此 · 全局 §5.4 升档自 high)
> **priority** · 1
> **depends_on** · []

**描述** · 作为 PRD-10 的协议锁前置,我需要集中处理 5 件工程改造:(1) **拆 monorepo workspace**(SCAFFOLD §A.3 10 步迁移协议)· 现 src/ 单包 → apps/web + apps/admin(新)+ apps/api + packages/{schemas, ui, clients}· pnpm-workspace.yaml 强制 · tsconfig.json references 互链 · 全部主应用 src/* 移到 apps/web 和 apps/api 对应位置 · **保证 PRD-9 全套绿灯不破**(vitest 907+ / typecheck 6ws 0 / lint 0 / e2e 164+)· (2) **加 13 admin 模型到 prisma/schema.prisma**(DATA-MODEL §13.2~§13.7)· admin_audit_log + approval_requests + admin_users + admin_sessions + prompt_versions + prompt_canary_config + user_quota + quota_adjustment_log + trending_review_queue + deep_learn_review_queue + admin_invite_campaign + admin_constants + admin_config + admin_ab_experiment(共 13)· (3) **跑 manual_admin_rls.sql migration**(DATA-MODEL §13.8 · LD-A3)· DISABLE RLS for 13 admin tables · `ALTER TABLE <table> DISABLE ROW LEVEL SECURITY;` × 13 · 含 enable/disable helper SQL functions(`enable_admin_rls()` / `disable_admin_rls()` · 调试用)· (4) **apps/admin 空 Vite 应用骨架**(`apps/admin/{vite.config.ts, package.json, tsconfig.json, index.html, src/main.tsx, src/App.tsx}` · React 18 + Vite 5 + tailwind + Aurelian Dark base · build target `dist-admin`)· (5) **6 闸 middleware 模板预埋**(stub 版本)· `apps/api/src/trpc/middleware/admin/{adminAuth, roleCheck, ipWhitelist, mfaCheck, adminRLS, approvalGateCheck, auditLog}.ts`(7 文件 · 6 闸 + auditLog 合并)· 6 闸全 stub `return next()` · 单测验证 stub pass-through · US-002~004 才填真逻辑。

**触发场景** · ralph 实施起步前置 · 后续 6 US(US-002 lucia / US-003 6 闸真接 / US-004 audit_log / US-005 Layout / US-006 集成测试 / US-007 收官) 全 depends_on 此 · 本 US 失败 → 后续全 blocked。**0 业务影响要求**:跑完此 US 后,PRD-9 全套绿灯必须仍过(typecheck 6ws 0 / vitest 907+ / lint 0 / e2e 164+)· 仅多 13 admin table + 6 stub middleware + 1 apps/admin 空骨架。

**为什么 foundation** · 7 个 US 全 depends_on 此(downstream 6)· 升档 foundation(全局 CLAUDE.md §5.4 阈值)· 同时跨 4 个下游 PRD(PRD-11/12/13/14)都依赖 monorepo + 13 admin model · 复合升档证据。Audit 必须按 OPUS-AUDIT-CHEATSHEET §F4 + §F5(协议锁与既有代码现状双对账 · PRD-4 US-001 / PRD-5 US-001 教训)严审 · 加 §G(monorepo 改造前后回归)。

**files_to_create** ·
- `apps/admin/`(完整 Vite SPA 骨架)
  - `apps/admin/vite.config.ts`(build target dist-admin · port 5174 · plugins react + tailwind · alias `@/admin` → `src/`)
  - `apps/admin/package.json`(`@quanan/admin` · deps: react 18 / react-router-dom 6 / @trpc/client + @trpc/react-query / zustand / packages/ui + packages/clients + packages/schemas workspace ref · scripts: dev / build / preview / typecheck / test)
  - `apps/admin/tsconfig.json`(extends ../../tsconfig.base.json · paths `@/admin/*` `@quanan/ui/admin` `@quanan/schemas`)
  - `apps/admin/index.html`(SPA shell · meta noindex · Aurelian Dark CSS var preload)
  - `apps/admin/src/main.tsx`(React root · BrowserRouter · QueryClient · admin tRPC provider)
  - `apps/admin/src/App.tsx`(空壳 · 路由占位 · loading state)
  - `apps/admin/.env.example`(QUANQN_ADMIN_CLIENT_ID / OAUTH_PROVIDER / ADMIN_IP_WHITELIST_ENABLED / ADMIN_MFA_REQUIRED / VITE_ADMIN_API_URL)
- `prisma/migrations/admin-init/migration.sql`(prisma generate 输出 · 13 admin model + 索引)
- `prisma/migrations/manual_admin_rls.sql`(★ 手写 SQL · DISABLE RLS for 13 admin tables + helper functions · DATA-MODEL §13.8 · 含验证 SQL `SELECT relname, relrowsecurity FROM pg_class WHERE relname IN (...)` 跑完必 0 命中 enabled)
- `apps/api/src/trpc/middleware/admin/adminAuth.ts`(stub · 30 行 · 注解 'PRD-10 US-002 真接 lucia-admin')
- `apps/api/src/trpc/middleware/admin/roleCheck.ts`(stub · 30 行 · 注解 'PRD-10 US-003 真接 meta.requiredRole 检测')
- `apps/api/src/trpc/middleware/admin/ipWhitelist.ts`(stub · 30 行 · env ADMIN_IP_WHITELIST_ENABLED=false 时纯 pass · 注解 'PRR Cloudflare WAF 真接')
- `apps/api/src/trpc/middleware/admin/mfaCheck.ts`(stub · 30 行 · env ADMIN_MFA_REQUIRED=false 时纯 pass · 注解 'PRR TOTP/WebAuthn 真接')
- `apps/api/src/trpc/middleware/admin/adminRLS.ts`(stub · 50 行 · `$transaction wrap + $executeRawUnsafe set_config('app.role','admin',true)` 类比 accountIsolationMiddleware · 注解 'PRD-10 US-003 真接 + audit 写入')
- `apps/api/src/trpc/middleware/admin/approvalGateCheck.ts`(stub · 40 行 · meta.requiresApproval=true 时 throw `TRPCError({ code: 'NOT_IMPLEMENTED', message: 'PRD-13 真闭环 stub · PRD-10 stub middleware' })` · 注解 'PRD-13 真 approval_requests 闭环')
- `apps/api/src/trpc/middleware/admin/auditLog.ts`(stub · 40 行 · US-004 真接)
- `apps/api/src/trpc/middleware/admin/index.ts`(barrel · export 7 middleware + types)
- `apps/api/src/trpc/routers/admin/index.ts`(空 adminRouter · `t.router({ health: t.procedure.query(() => ({ ok: true, ts: Date.now() })) })` · auth 子树 PRD-10 US-002 加 · 其他 13 子树 PRD-11+ 加)
- `apps/api/src/lib/admin/constants.ts`(ADMIN_ROLES = ['super_admin', 'admin', 'readonly_admin'] · AUDIT_EVENT_TYPES = ['admin_login', 'cross_account_query', 'approval_request_create', 'approval_request_resolve'] · ADMIN_API_PREFIX = '/trpc/admin')
- `apps/api/src/lib/admin/types.ts`(AdminUser / AdminSession / AdminAuditLog types · 跟 prisma model 对齐)
- `pnpm-workspace.yaml`(★ 强制 · `packages:\n  - 'apps/*'\n  - 'packages/*'`)
- `tsconfig.base.json`(root 共享 base · target ES2022 · module ESNext · strict · paths 共享)
- `tests/unit/admin/middleware-stubs.test.ts`(★ 7 unit · 6 闸 stub pass-through + approvalGateCheck throw stub 验证)
- `tests/unit/admin/admin-schema.test.ts`(★ 6 unit · prisma admin_audit_log / approval_requests / admin_users / admin_sessions / user_quota / trending_review_queue create + RLS DISABLED 验证)
- `scripts/migrate-monorepo.sh`(★ 一次性脚本 · 10 步迁移 · SCAFFOLD §A.3)
- `apps/admin/src/styles/admin.css`(空 · US-005 填 Aurelian Dark 密集模式 CSS · 占位 import 'tailwindcss/base')
- `packages/ui/admin/index.ts`(空 barrel · US-005 加密集表格 + 数据可视化组件)

**files_to_modify** ·
- `prisma/schema.prisma`(★ 加 13 admin model · 跟 DATA-MODEL §13.2~§13.7 严格对齐 · 主应用 18 model 不动 · 末尾 append · 索引必加(audit_log createdAt DESC · approval_requests status+expiresAt · admin_sessions adminUserId+expiresAt))
- `package.json`(root · 新 scripts `dev:web` / `dev:admin` / `dev:api` / `build:web` / `build:admin` / `build:api` / `typecheck` 改 6 workspace 全扫 / `test` 改 workspace per-package + collect)
- `tsconfig.json`(root · `references` 数组互链 5 子项目 · `composite: true`)
- `vitest.config.ts`(改 root 配 · workspace projects 5 个 · `test.workspace = ['./apps/web', './apps/admin', './apps/api', './packages/schemas', './packages/ui']`)
- `playwright.config.ts`(改 baseURL · 双 baseURL · main app `http://localhost:5173` + admin `http://localhost:5174`)
- `.gitignore`(加 `apps/*/dist` / `apps/*/node_modules` / `packages/*/dist` / `packages/*/node_modules`)
- `src/*` 全部移到 `apps/web/src/*`(主应用前端代码 · 9 步向导 / 14 工具 / 14 Specialist 调用层 / 路由 / Aurelian Dark base 用)
- `src/server/*` 全部移到 `apps/api/src/*`(后端 tRPC / agents / workers / lib)
- `src/lib/schemas/*` 全部移到 `packages/schemas/src/*`(共享 zod)
- `packages/ui/base/*` ← 从 `src/components/ui/*` 抽离(主应用 UI 组件库 base)

**反例 grep**(US-001 audit 必跑) ·
- `grep -rn "from '\.\./web\|from '\.\./admin'" apps/web/src/ apps/admin/src/` 应 0(R-A1 · apps/web 不 import apps/admin · 反之亦然)
- `grep -rn "/admin" apps/web/src/` 应 0(R-A2 · 主应用前端不暴露 admin 入口)
- `grep -rn "import.*LLMGateway\|import.*Specialist" apps/admin/src/` 应 0(R-A5 · admin 不调 LLM)
- `psql quanan -c "SELECT relname, relrowsecurity FROM pg_class WHERE relname IN ('admin_audit_log','approval_requests','admin_users','admin_sessions','prompt_versions','prompt_canary_config','user_quota','quota_adjustment_log','trending_review_queue','deep_learn_review_queue','admin_invite_campaign','admin_constants','admin_config','admin_ab_experiment') AND relrowsecurity = true;"` 应 0 rows(LD-A3 · 13 admin 表 RLS DISABLED)
- `psql quanan -c "SELECT relname FROM pg_class WHERE relname IN (... 主应用 18 表 ...) AND relrowsecurity = false;"` 应 0 rows(主应用 18 表 RLS 仍 ENABLED · 0 副作用)

**test_command** · `pnpm install && pnpm prisma migrate dev && pnpm prisma db execute --file prisma/migrations/manual_admin_rls.sql && pnpm test tests/unit/admin/middleware-stubs.test.ts tests/unit/admin/admin-schema.test.ts && pnpm typecheck && pnpm lint && pnpm test:e2e tests/e2e/knowledge-rag-loop.spec.ts`(★ 末尾跑 PRD-9 收官 e2e · 验证 0 回归)

---

### **US-002 · lucia-auth admin session + mock OAuth provider + admin.auth router**

> **risk_level** · `high`(改鉴权 · 但 stub OAuth · 真 session 持久化 · Redis namespace 隔离敏感)
> **priority** · 2
> **depends_on** · [US-001]

**描述** · 新建 `apps/api/src/lib/auth/lucia-admin.ts`(类比主应用 `apps/api/src/lib/auth/lucia.ts` · 复用 lucia-auth lib 不重写)· 独立 Redis namespace `admin:session:*`(LD-A1 · 跟主应用 `app:session:*` 完全隔离)· session ttl 12h(短于主应用 30 天 · ADMIN §7.1)· idle timeout 30min(无操作自动登出)· session table `admin_sessions`(US-001 已加)· 引入 mock OAuth provider(`apps/api/src/lib/auth/oauth-admin-mock.ts` · OAUTH_PROVIDER=mock 时读 admin_users.email + isMock=true 自动通过 · prod 必须 OAUTH_PROVIDER=google 否则 startup throw config error)· 留 `apps/api/src/lib/auth/oauth-admin-google.ts` 真 Google Workspace stub(throw 'PRR config required: GOOGLE_WORKSPACE_CLIENT_ID / CLIENT_SECRET · hd=quanan.com · 邮箱白名单二次过滤')· 新建 `apps/api/src/trpc/routers/admin/auth.ts`(adminRouter.auth 子树 · 3 procedure:`auth.login`(input: email · output: { sessionId, expiresAt, user })· `auth.logout`(session 注销)· `auth.me`(返回 ctx.activeAdminUser · 用于 admin SPA 启动 fetch))· 前端 `apps/admin/src/lib/admin-client.ts`(tRPC client 连 `/trpc/admin` · 带 admin session cookie `admin_session_id` · cookie httpOnly + secure(prod)+ sameSite=lax + domain `admin.quanan.com`(prod)/ `localhost`(dev))。

**触发场景** ·
- super_admin 访问 `admin.quanan.com/login`(stub 阶段 `localhost:5174/login`)
- 输入 email(white-listed admin_users 表已存在 · isMock=true)→ 点"用 mock OAuth 登录"(dev only · prod 隐藏 + 必经 Google OAuth flow)
- POST `/trpc/admin.auth.login` `{ email: 'super@quanan.com' }`
- mock provider 跳过真 OAuth · 直接读 admin_users + 校验 isMock=true + isActive=true
- lucia-admin.createSession 写 Redis `admin:session:{sessionId}` + admin_sessions table row
- 返回 sessionId + 写 cookie `admin_session_id`
- 跳 `/admin` → AdminLayout 显示空 16 sidebar 域占位

**为什么 high(不升 foundation)** · 仅 US-003/US-004/US-005/US-006/US-007 5 下游 · 但 US-005(Layout)只挂在 ctx.activeAdminUser 不直接调 auth.login · US-006 集成测试用 mock · US-007 e2e 也用 mock · 实际"直接调 admin.auth.login"的下游只 US-003(rolecheck 需要 ctx.user.role)· 不升 foundation(downstream-direct < 3)。但仍 high · 鉴权链改动 + Redis namespace 隔离 + session cookie 安全配置敏感。

**files_to_create** ·
- `apps/api/src/lib/auth/lucia-admin.ts`(~120 行 · `import { Lucia } from 'lucia'` · adapter PrismaAdapter(admin_sessions / admin_users 表)· sessionCookie name='admin_session_id' · expires false(滚动 idle 30min)+ session table absoluteExpiration ttl 12h · `validateSession` + `invalidateSession` 函数)
- `apps/api/src/lib/auth/oauth-admin-mock.ts`(~60 行 · `mockOAuthCallback(email): Promise<AdminUser>` · 校验 isMock + isActive · 不真验 password · 返回 user)
- `apps/api/src/lib/auth/oauth-admin-google.ts`(~80 行 stub · `googleOAuthCallback(code, state): Promise<AdminUser>` · throw 'PRR config required · 5 env: GOOGLE_WORKSPACE_CLIENT_ID / SECRET / REDIRECT_URI / HD(=quanan.com) / WHITELIST_EMAILS')
- `apps/api/src/lib/auth/oauth-admin-factory.ts`(~30 行 · `getAdminOAuthProvider()` · 读 env OAUTH_PROVIDER · 'mock' 返 mock · 'google' 返 google · 其他 throw config error · prod startup gate)
- `apps/api/src/trpc/routers/admin/auth.ts`(~150 行 · 3 procedure:login(input email · 调 mock/google factory · createSession · 返 { sessionId, expiresAt, user, role })· logout(ctx.adminSession.id · invalidateSession · 清 cookie)· me(返 ctx.activeAdminUser · 不带 sensitive fields))
- `apps/api/src/server/context-admin.ts`(~80 行 · `createAdminContext(req, res)` · 读 admin_session_id cookie · validateSession · 注入 ctx.adminSession + ctx.activeAdminUser · null 表 未登录 · 跟 createContext 主应用版严格隔离)
- `apps/admin/src/lib/admin-client.ts`(~60 行 · `createTRPCReact<AdminRouter>()` · httpBatchLink url='/trpc/admin' · `headers: () => ({ cookie: document.cookie })` · admin tRPC client)
- `apps/admin/src/pages/Login.tsx`(~120 行 · email input · "mock OAuth 登录"按钮(dev only · `import.meta.env.DEV`)· "Google Workspace OAuth"按钮(prod stub · disabled + tooltip 'PRR 配置后启用')· LS 写 last login email · 错误 toast)
- `tests/unit/admin/auth-lucia.test.ts`(★ 12 unit · createSession / validateSession / invalidateSession / idle timeout 30min / absolute ttl 12h / mock provider isMock=true 通过 / mock provider isActive=false 拒 / mock provider 不在白名单 throw / google provider throw 'PRR' / factory env=mock 返 mock / factory env=google 返 google / factory env=invalid throw config error)
- `tests/unit/admin/auth-router.test.ts`(★ 8 unit · login happy / login zod fail email 非 email / login 用户不存在 throw / login isMock=false throw / logout happy / logout 无 session throw / me 已登录返 user / me 未登录 throw UNAUTHORIZED)
- `tests/integration/admin/auth-flow.test.ts`(★ 集成测试 · 真 DB · seed 1 admin_user · POST login → 拿 sessionId → GET me 验证 → POST logout → GET me throw UNAUTHORIZED)

**files_to_modify** ·
- `apps/api/src/trpc/routers/admin/index.ts`(挂 `auth: authRouter` 子树 · US-001 空 router 真接)
- `apps/api/src/trpc/middleware/admin/adminAuth.ts`(US-001 stub 真接 · 调 lucia-admin.validateSession + 注入 ctx.activeAdminUser · null throw UNAUTHORIZED · 不动 stub 注解改为 'PRD-10 US-002 完成 真接 lucia-admin')
- `apps/api/src/server/index.ts`(挂 `/trpc/admin` route · 调 createAdminContext)
- `prisma/schema.prisma`(微调 admin_users / admin_sessions index · 加 `@@index([email])` admin_users / `@@index([adminUserId, expiresAt])` admin_sessions)
- `apps/admin/src/App.tsx`(US-001 空壳真接 · React Router 路由 · `/login` `/admin/*` · ProtectedRoute wrapper 读 admin_session_id cookie + me query)

**反例 grep**(US-002 audit 必跑) ·
- `grep -rn "import.*lucia.*from.*'@/lib/auth/lucia'" apps/api/src/trpc/routers/admin/` 应 0(LD-A1 · admin 不复用主应用 lucia.ts · 必须用 lucia-admin.ts)
- `grep -rn "app:session:\|user_session_id" apps/api/src/lib/auth/lucia-admin.ts apps/api/src/trpc/routers/admin/` 应 0(LD-A1 · admin 不沾主应用 session 标识)
- `grep -rn "admin:session:" apps/api/src/lib/auth/lucia.ts` 应 0(反向 · 主应用 lucia 不污染 admin namespace)
- `grep "OAUTH_PROVIDER.*google" apps/api/src/lib/auth/oauth-admin-google.ts` 应 ≥ 1(stub 仍写 google 关键字)
- `grep "throw.*'PRR config required'" apps/api/src/lib/auth/oauth-admin-google.ts` 应 ≥ 1(stub throw 一致)

**test_command** · `pnpm test tests/unit/admin/auth-lucia.test.ts tests/unit/admin/auth-router.test.ts tests/integration/admin/auth-flow.test.ts && pnpm typecheck && pnpm lint`

---

### **US-003 · 6 闸 middleware 真实现 · adminAuth → roleCheck → ipWhitelist → mfaCheck → adminRLS → approvalGateCheck · 每闸单测**

> **risk_level** · `high`(完整鉴权链 · 数据隔离 · 但 ipWhitelist + mfaCheck + approvalGateCheck 仍 stub mode)
> **priority** · 3
> **depends_on** · [US-002]

**描述** · 把 US-001 6 闸 stub 真接(adminAuth 已 US-002 完成 · 本 US 接剩 5 个 + auditLog)· 6 闸链组合 `adminProcedure = t.procedure.use(adminAuth).use(roleCheck).use(ipWhitelist).use(mfaCheck).use(adminRLS).use(approvalGateCheck).use(auditLog)`(★ auditLog 在最后 · 这样上游任一闸失败 也能写失败 audit · LD-A3 + R-A4)· 每闸独立测试(7 unit suite × 4-8 case = 35+ case)· 同时确认 6 闸**顺序不能调** · 测试覆盖每闸单独失败时返回的 error code(401 / 403 / 412 等)。

**6 闸详细逻辑**:

1. **adminAuth**(US-002 已完成 · 本 US 不动 · 仅文档化)· 读 `admin_session_id` cookie → `luciaAdmin.validateSession` → 注入 `ctx.activeAdminUser` · null → throw UNAUTHORIZED 401
2. **roleCheck** · 读 `procedure.meta.requiredRole` · `'super_admin'` / `'admin'` / `'readonly_admin'` / `undefined`(任意 admin)· `ctx.activeAdminUser.role` 必须 `>=` requiredRole 等级(权限矩阵:super_admin > admin > readonly_admin)· 不满足 throw FORBIDDEN 403
3. **ipWhitelist** · env `ADMIN_IP_WHITELIST_ENABLED=false`(开发期默认 · PRR 改 true)· 永远 pass · `=true` 时读 `req.ip`(或 `x-forwarded-for` 首段 · 注意 spoofing 警告)· 校验 CIDR 列表(env `ADMIN_IP_WHITELIST_CIDRS=10.0.0.0/8,172.16.0.0/12`)· 不在白名单 throw FORBIDDEN 403 · 同时写 `admin_audit_log eventCategory='security_alert' eventType='ip_blocked'`(US-004 接 auditLog · 本 US 仅 throw)
4. **mfaCheck** · env `ADMIN_MFA_REQUIRED=false`(开发期默认)· 永远 pass · `=true` 时 + `ctx.activeAdminUser.role === 'super_admin'` 时 → 检查 `ctx.adminSession.mfaVerifiedAt > Date.now() - 30 * 24 * 3600 * 1000`(30 天内 MFA 过)· 失败 throw PRECONDITION_REQUIRED 412 'MFA_REQUIRED'(前端跳 MFA 流程页 · PRR 真接)· admin 角色"推荐 MFA"但本 PRD stub 不强制
5. **adminRLS**(★ 核心)· 类比 `apps/api/src/trpc/middleware/account-isolation.ts`(C7 假设)· `$transaction wrap + $executeRawUnsafe set_config('app.role', 'admin', true)`(LOCAL true → 仅本事务生效 · 不污染连接池)· 调 `next({ ctx: { ...ctx, adminPrisma: txPrisma } })` · adminPrisma 是事务内 prismaClient · 13 admin 表 + 18 主应用表都跨账号查通(因 RLS DISABLED for admin tables + admin role bypass for 主应用 18 表 by RLS policy)· 测试:set_config 真生效 → SELECT current_setting('app.role') = 'admin'
6. **approvalGateCheck**(★ stub · 真闭环 PRD-13)· 读 `procedure.meta.requiresApproval` · undefined / false → pass · true → throw `TRPCError({ code: 'NOT_IMPLEMENTED', message: 'PRD-13 真闭环 stub · 请见 ADR-020' · cause: { actionType: meta.actionType, riskLevel: meta.riskLevel } })` · 不创建 approval_requests row · 但 **写 admin_audit_log eventType='approval_request_create' status='stub_rejected'**(US-004 自动写 · 本 US 仅 throw)· 这样 audit_log 仍有完整闭环检测点

**触发场景** ·
- super_admin 调任何 admin procedure(`adminProcedure`)→ 6 闸顺序执行 → 全 pass → next(ctx)
- admin 调 `admin.users.banUser`(`requiresApproval: true`)→ adminAuth ✓ → roleCheck(requiredRole=admin)✓ → ipWhitelist(env=false)✓ → mfaCheck(env=false)✓ → adminRLS set_config ✓ → approvalGateCheck throw NOT_IMPLEMENTED(stub)· **审 PRD-13 才真闭环**
- readonly_admin 调 `admin.users.changePlan`(`requiredRole='admin'`)→ adminAuth ✓ → roleCheck throw FORBIDDEN(readonly_admin < admin)

**files_to_create** ·
- `apps/api/src/trpc/middleware/admin/roleCheck.ts`(US-001 stub 重写 · ~70 行 · ADMIN_ROLE_HIERARCHY = { super_admin: 3, admin: 2, readonly_admin: 1 } · 比较函数 + meta 读取 + throw FORBIDDEN)
- `apps/api/src/trpc/middleware/admin/ipWhitelist.ts`(US-001 stub 重写 · ~80 行 · env 开关 + CIDR 解析 + req.ip 提取 · `import ipaddr from 'ipaddr.js'` 依赖)
- `apps/api/src/trpc/middleware/admin/mfaCheck.ts`(US-001 stub 重写 · ~60 行 · env 开关 + role super_admin 强制 + 30 天 cache 检测 + throw PRECONDITION_REQUIRED)
- `apps/api/src/trpc/middleware/admin/adminRLS.ts`(US-001 stub 重写 · ~120 行 · `$transaction` wrap · `$executeRawUnsafe set_config('app.role','admin',true)` · 注入 adminPrisma 到 ctx · 跨账号查时仍带 audit hook · 类比 account-isolation.ts 的 ADMIN-MIDDLEWARE pattern · LD-A3)
- `apps/api/src/trpc/middleware/admin/approvalGateCheck.ts`(US-001 stub 重写 · ~80 行 · meta.requiresApproval + meta.actionType + meta.riskLevel 读取 + throw NOT_IMPLEMENTED stub · LD-A4)
- `apps/api/src/trpc/procedures/admin.ts`(~50 行 · `adminProcedure = t.procedure.use(...链 6 闸 + auditLog)` · `superAdminProcedure = adminProcedure.use(meta requiredRole='super_admin' enforce)`)
- `tests/unit/admin/roleCheck.test.ts`(★ 6 unit · super_admin 调 admin → pass / admin 调 readonly → pass / admin 调 admin → pass / readonly 调 admin → FORBIDDEN / undefined requiredRole → pass(任意 admin)/ 角色不在 enum throw config error)
- `tests/unit/admin/ipWhitelist.test.ts`(★ 6 unit · env=false → pass / env=true + CIDR 命中 → pass / env=true + CIDR 不命中 → FORBIDDEN / env=true + x-forwarded-for 首段 → pass / env=true + 多 CIDR 任一命中 → pass / env=true + CIDR 解析失败 throw config error)
- `tests/unit/admin/mfaCheck.test.ts`(★ 6 unit · env=false → pass / env=true + role=admin → pass / env=true + role=super_admin + mfa fresh → pass / env=true + role=super_admin + mfa stale → PRECONDITION_REQUIRED / env=true + role=super_admin + 无 mfa → PRECONDITION_REQUIRED / env=true + role=readonly → pass)
- `tests/unit/admin/adminRLS.test.ts`(★ 8 unit · set_config 真生效 · current_setting='admin' / $transaction wrap 验证 / adminPrisma 注入 ctx / 跨账号 findMany 不拦 / 主应用 18 表跨账号查通 / 异常时 $transaction rollback / 嵌套调 prismaClient throw / Prisma 客户端类型推断验证)
- `tests/unit/admin/approvalGateCheck.test.ts`(★ 5 unit · requiresApproval=undefined → pass / requiresApproval=false → pass / requiresApproval=true → NOT_IMPLEMENTED throw / cause 含 actionType + riskLevel / message 含 'PRD-13')

**files_to_modify** ·
- `apps/api/src/trpc/routers/admin/index.ts`(改 router builder · 用 adminProcedure 替换 t.procedure · 留 health stub 用 t.procedure 不带鉴权 · 其他全用 adminProcedure)
- `apps/api/src/trpc/routers/admin/auth.ts`(US-002 微调 · login/logout 不带 admin 鉴权链(因 login 本身就是建 session)· me 改用 adminProcedure)
- `package.json`(加 deps `ipaddr.js ^2.1.0`)
- `apps/api/.env.example`(加 ADMIN_IP_WHITELIST_ENABLED=false / ADMIN_IP_WHITELIST_CIDRS=/ ADMIN_MFA_REQUIRED=false)

**反例 grep**(US-003 audit 必跑) ·
- `grep -rn "\\\$executeRawUnsafe\|\\\$queryRawUnsafe" apps/api/src/trpc/routers/admin/` 应 0(R-A6 · admin procedure 不绕过 adminRLS 直接用 raw SQL)
- `grep -rn "approvalRequestId.*['\"]mock['\"]" apps/api/src/` 应 0(R-A6 · 不 mock approval 绕过)
- `grep -rEn "adminProcedure\..*requiresApproval.*false" apps/api/src/trpc/routers/admin/` 应 0(LD-A4 · 高风险 hardcode false 禁止)
- `grep -n "app.role.*admin\|set_config.*admin" apps/api/src/trpc/middleware/admin/adminRLS.ts` 应 ≥ 1(LD-A3 · adminRLS 必含 set_config 调用)

**test_command** · `pnpm test tests/unit/admin/{roleCheck,ipWhitelist,mfaCheck,adminRLS,approvalGateCheck}.test.ts && pnpm typecheck && pnpm lint`

---

### **US-004 · admin_audit_log 自动 middleware 写入 · 4 类 eventType(admin_login / cross_account_query / approval_request_create / approval_request_resolve)**

> **risk_level** · `medium`(audit middleware 写入 · 异常路径覆盖)
> **priority** · 4
> **depends_on** · [US-003]

**描述** · 实现 `auditLog` middleware(US-001 stub 真接)· 挂在 6 闸鉴权链最末位 · 自动写 4 类 eventType 到 admin_audit_log 表:

1. **admin_login**(由 auth.login procedure 完成后写 · 而非 auditLog middleware · 因 login 不经鉴权链)· eventCategory='auth' · status='success' / 'failed' · ipAddress / userAgent / oauthProvider('mock'/'google')+ adminUserId(success 时)
2. **cross_account_query**(★ 由 adminRLS middleware 触发 · 当 procedure input 含 `accountId` 字段且 `accountId !== ctx.activeAdminUser.linkedAccountId`(linkedAccountId 仅供 cs 角色"自查"用 · admin/super_admin 无 linked)· 或调 `adminPrisma.X.findMany({})` 不带 accountId 过滤(扫全表)· **检测策略**:adminRLS middleware 注入 `ctx.crossAccountAccessed=true` flag · auditLog 读 flag 写入)· eventCategory='data_access' · accessedAccountIds 数组(从 result 推断 + WHERE 解析 · stub 版仅记录 procedure name + input)· latencyMs
3. **approval_request_create**(由 approvalGateCheck stub throw NOT_IMPLEMENTED 触发 · 即使 stub 也 log)· eventCategory='approval' · status='stub_rejected'(PRD-13 真闭环时改 'pending')· actionType + riskLevel(从 meta 读)· requestedPayload(input json)
4. **approval_request_resolve**(留 PRD-13 真闭环时由 admin.approval.resolve procedure 写 · 本 PRD 仅占位 eventType enum 注册)

**触发场景**(详 US-006 集成测试) ·
- mock admin login → admin_audit_log 1 row(admin_login · success)
- super_admin 调 `admin.audit.list` (查全表)→ adminRLS set_config + ctx.crossAccountAccessed=true → next 完成 → auditLog 写 cross_account_query · accessedAccountIds=null(扫全表)
- admin 调 `admin.users.banUser`(requiresApproval=true)→ approvalGateCheck throw → auditLog catch try-finally → 写 approval_request_create · status='stub_rejected'
- 同一 admin 任一 procedure 完成 / 失败 · auditLog 都执行(用 `next({ throwOnError: false }) → catch` pattern · 失败也写 audit)

**failure 路径**(audit 写入失败时):
- audit_log 写失败 → `console.error('[ADMIN AUDIT WRITE FAILED]', err)` + 仍返回 next 结果(business operation 不应被 audit 阻塞 · 但需 Sentry 告警 · PRR)
- 性能:audit 写入异步 fire-and-forget · 但本 PRD 同步等(避免测试 flaky)· PRR 可异步化

**files_to_create** ·
- `apps/api/src/trpc/middleware/admin/auditLog.ts`(US-001 stub 重写 · ~180 行 · `wrapNext + try-catch + write to admin_audit_log` · 含 4 类 eventType 分支逻辑 + latencyMs 计算 + ipAddress/userAgent/oauthProvider 抓取)
- `apps/api/src/services/admin/admin-audit-service.ts`(~120 行 · `logAdminAction(input: { ... }): Promise<AdminAuditLog>` · prisma create · idempotency(若 traceId 已存在 → 跳过)· 用于 middleware 调 + auth router 直接调(login event 不经 middleware))
- `apps/api/src/lib/admin/audit-helpers.ts`(~80 行 · `extractCrossAccountFlag(input, ctx, result): boolean` · `extractActionType(procedurePath): string` · `redactSensitiveFields(payload): unknown`(redact password / token / secret))
- `tests/unit/admin/auditLog-middleware.test.ts`(★ 10 unit · 4 类 eventType 各 1 happy + audit 写失败仍 next + latencyMs 计算 + sensitive field redact + cross_account flag 检测 + approval throw 仍写 + duplicate traceId idempotent)
- `tests/unit/admin/admin-audit-service.test.ts`(★ 6 unit · logAdminAction happy / idempotent(traceId 重复)/ accessedAccountIds null / status 4 类 enum / eventCategory 4 类 enum / 写入后 row count + 1)
- `tests/integration/admin/audit-log-write.test.ts`(★ 集成 · 真 DB · seed admin_user · 调 mock login → 写 admin_login row · 跑 audit.list → 写 cross_account_query row(stub adminPrisma · 设 ctx.crossAccountAccessed=true)· trigger requiresApproval procedure → catch NOT_IMPLEMENTED + 写 approval_request_create row · 最终 admin_audit_log 应有 3 rows)

**files_to_modify** ·
- `apps/api/src/trpc/middleware/admin/index.ts`(barrel · auditLog 真 export)
- `apps/api/src/trpc/procedures/admin.ts`(adminProcedure 链末位接 auditLog · 顺序:adminAuth → roleCheck → ipWhitelist → mfaCheck → adminRLS → approvalGateCheck → auditLog)
- `apps/api/src/trpc/routers/admin/auth.ts`(login procedure 完成后调 `adminAuditService.logAdminAction({ eventType: 'admin_login', ... })` · 不经 middleware 但仍 audit)
- `apps/api/src/trpc/middleware/admin/adminRLS.ts`(注入 `ctx.crossAccountAccessed=true` flag · 当 set_config 真生效后 · 供 auditLog 读)
- `apps/api/src/trpc/middleware/admin/approvalGateCheck.ts`(throw 前先 await `adminAuditService.logAdminAction({ eventType: 'approval_request_create', status: 'stub_rejected' })` · 然后 throw)

**反例 grep**(US-004 audit 必跑) ·
- `grep -rn "adminProcedure.\\.use(auditLog)" apps/api/src/trpc/routers/admin/` 应 0(R-A4 · adminProcedure 已统一挂 auditLog · 业务代码不再重复挂)
- `grep -rEn "prisma\\.adminAuditLog\\.update\|prisma\\.adminAuditLog\\.delete\|prisma\\.adminAuditLog\\.upsert" apps/api/src/` 应 0(LD-A3 partial · audit 仅 append · 不允许 UPDATE/DELETE/UPSERT · 项目 CLAUDE.md §5.1 第 3 条)
- `grep -n "console.error.*ADMIN AUDIT WRITE FAILED" apps/api/src/trpc/middleware/admin/auditLog.ts` 应 ≥ 1(failure 路径必带 console.error · PRR Sentry 接)
- `grep -n "redactSensitiveFields\|redact" apps/api/src/lib/admin/audit-helpers.ts` 应 ≥ 1(敏感字段 redact)

**test_command** · `pnpm test tests/unit/admin/auditLog-middleware.test.ts tests/unit/admin/admin-audit-service.test.ts tests/integration/admin/audit-log-write.test.ts && pnpm typecheck && pnpm lint`

---

### **US-005 · admin Layout 骨架 · topbar(60px)+ sidebar 16 域占位(240px)+ audit drawer + status bar · Aurelian Dark 密集模式**

> **risk_level** · `medium`(前端 16 占位页 + Layout 4 组件 + Aurelian Dark 密度变体)
> **priority** · 5
> **depends_on** · [US-001, US-002]

**描述** · 实现 admin SPA 主 Layout · 复用 packages/ui/base/(Aurelian Dark base tokens · 由 PRD-3 落地)+ 新建 packages/ui/admin/(★ 本 US 加 · 密集模式 · row-height 32px(vs main 48px)/ table dense 模式 / topbar 60px(vs main 72px)/ sidebar 240px(vs main collapsed 56/expanded 280))· 4 主组件:**TopBar**(品牌色 +"QuanAn Admin"标识 + activeAdminUser 头像 / role badge / logout)· **Sidebar**(16 域分类: P0 业务核心 6 项 / P0 内容审核 2 项 / P1 健康度 5 项 / P2 高级 3 项 · 每域 emoji + 名字 + 路由 path · 折叠 / 展开 / 当前 highlight)· **AuditDrawer**(右侧抽屉 · 默认隐藏 · topbar 点🔔图标展开 · 显示当前 admin 最近 50 条 audit_log · 实时 polling 30s)· **StatusBar**(底部 1 行 · ENV mode / RLS state / WAF state / MFA state / current admin role)· 16 域 placeholder route 各一 page(渲染 "PRD-XX · 域 ⑨ 进化档案监控 · 待落地" · 含 PRD 编号映射)

**16 域分类**(ADMIN §3 业务管理域全景 + §8 P9 路线图):
- **P0 业务核心 6 项**(PRD-11)· ① NSM 仪表盘 · ② 用户管理 · ③ IP 账号管理 · ④ 成本仪表盘 · ⑤ 审计日志查询 · ⑥ 邀请码管理
- **P0 内容审核 2 项**(PRD-12)· ⑦ TrendingItem 审核 · ⑧ DeepLearning 审核
- **P1 健康度 5 项**(PRD-13)· ⑨ 进化档案监控 · ⑩ Prompt 版本管理 · ⑪ 配额管理 · ⑫ 合规仪表盘 · ⑬ Approval Gates 工作流
- **P2 高级 3 项**(PRD-14)· ⑭ A/B 测试 · ⑮ 常量管理 · ⑯ 系统配置中心

**触发场景** · super_admin 登录 mock OAuth(US-002 完成)→ 跳转 `/admin` → AdminLayout 渲染 → 看到 topbar + sidebar 16 域 + 空主区(默认占位 "选择左侧域进入")· 点击 sidebar "NSM 仪表盘" → 跳 `/admin/nsm` → 渲染占位页 "PRD-11 · 域 ① NSM 仪表盘 · 待落地"· 点击 topbar 🔔 → audit drawer 展开 · 显示当前 admin 最近 50 条 log(stub admin 应有 1 条 admin_login)· 点击 logout → 调 admin.auth.logout → 跳 `/login`

**files_to_create** ·
- `apps/admin/src/layouts/AdminLayout.tsx`(~150 行 · 主 layout grid 模板 · topbar(top, 60px)+ sidebar(left, 240px)+ main + audit-drawer-portal(absolute, right))
- `apps/admin/src/components/admin/TopBar.tsx`(~120 行 · 品牌 + activeAdminUser + role badge + logout dropdown + audit drawer toggle · packages/ui/admin/TopBar 复用)
- `apps/admin/src/components/admin/Sidebar.tsx`(~250 行 · 16 域分组 P0/P0/P1/P2 · Folding section header · NavLink + isActive highlight · ScrollArea + h-[calc(100vh-60px-48px)] PRD-9 沉淀复用 · sidebar collapse 折叠模式 stub · PRR 真接)
- `apps/admin/src/components/admin/AuditDrawer.tsx`(~180 行 · React Portal · slide-from-right · admin.audit.listMine query · React Query 30s polling · 关闭按 ESC + 点击外部 · 50 条 row 列表 · row click → 全屏 modal 详情)
- `apps/admin/src/components/admin/StatusBar.tsx`(~80 行 · 底部 absolute · 1 行 · ENV / RLS / WAF / MFA / Role 5 显示 · color 状态绿/黄/红 · stub 模式全黄)
- `apps/admin/src/pages/admin/placeholder/{nsm,users,accounts,cost,audit,invites,reviewTrending,reviewDeepLearn,evolution,prompts,quota,compliance,approval,ab,knowledge,config}.tsx`(★ 16 文件 · 每个 30 行 · 渲染域 emoji + 名字 + PRD-XX 待落地 + 域 N 简介(从 ADMIN §3 复制))
- `apps/admin/src/router.tsx`(~120 行 · BrowserRouter · 16 域 route + /login + /admin 默认 + 404 catch-all)
- `apps/admin/src/styles/admin.css`(US-001 占位真接 · ~80 行 · 密集模式 CSS var · table row hover · sidebar active state · audit drawer slide animation)
- `packages/ui/admin/index.ts`(US-001 空 barrel 真接 · ~30 行 · re-export 4 组件 + admin tokens)
- `packages/ui/admin/tokens.ts`(~40 行 · ADMIN_TOPBAR_HEIGHT=60 / ADMIN_SIDEBAR_WIDTH=240 / ADMIN_ROW_HEIGHT=32 / ADMIN_FONT_SIZE_BASE=13 · etc)
- `packages/ui/admin/DenseTable.tsx`(~100 行 stub · 密集表格 wrapper · 复用 packages/ui/base/Table · 但 row-height=32 / font-size=13 · PRD-11 业务表格落地)
- `apps/admin/src/lib/admin-routes.ts`(~80 行 · 16 域 metadata array · path + label + emoji + prd + summary + requiredRole · sidebar 渲染读此 · sidebar order 严格按 ADMIN §3)
- `tests/unit/admin/layout.test.tsx`(★ 6 unit · AdminLayout render + topbar 显示 user + sidebar 16 域 + logout 调 mutation + audit drawer toggle + 404 catch)
- `tests/unit/admin/sidebar.test.tsx`(★ 6 unit · 16 域分 4 组 · P0 业务核心 6 + P0 审核 2 + P1 5 + P2 3 · NavLink isActive · folding · keyboard nav 'tab' 焦点遍历)
- `tests/unit/admin/audit-drawer.test.tsx`(★ 6 unit · open / close / list 渲染 / row click 详情 / 30s polling / 0 row empty state)

**files_to_modify** ·
- `apps/admin/src/App.tsx`(US-001 真接 · 套 AdminLayout 包 router · ProtectedRoute 读 me query · 未登录跳 /login)
- `apps/admin/src/main.tsx`(US-001 真接 · QueryClient 配置 + admin tRPC provider · React Router · suspense fallback)
- `apps/admin/tailwind.config.ts`(extends ../../tailwind.base.config · 加 admin tokens fontSize: { adminBase: '13px' } + spacing 32 = '32px')
- `apps/api/src/trpc/routers/admin/index.ts`(挂 `audit: auditRouter` 子树 · audit.listMine query stub · 返当前 admin 最近 50 条 admin_audit_log · 真 admin.audit.list 跨账号查 PRD-11 落地)
- `apps/api/src/trpc/routers/admin/audit.ts`(新建 · ~80 行 · listMine procedure · 仅查 ctx.activeAdminUser.id 自己的 audit · 不跨 admin · PRD-11 加 admin.audit.list 跨 admin 查)

**反例 grep**(US-005 audit 必跑) ·
- `grep -rn "import.*from.*'@/web\|from.*'@/main'" apps/admin/src/` 应 0(R-A1 · admin 不 import web)
- `grep -rn "import.*LLMGateway\|llmGateway" apps/admin/src/` 应 0(R-A5 · admin 不调 LLM)
- `grep -rn "process\\.env\\.OPENAI_API_KEY\|process\\.env\\.ANTHROPIC_API_KEY" apps/admin/src/` 应 0(R-A5 · admin 不持 LLM key)
- `grep -rn "useAdminRoutes\|admin-routes" apps/admin/src/pages/admin/` 应 ≥ 1(16 placeholder 用 admin-routes metadata)
- 16 placeholder 文件 must exist · `ls apps/admin/src/pages/admin/placeholder/*.tsx | wc -l` 应 = 16

**test_command** · `pnpm test tests/unit/admin/{layout,sidebar,audit-drawer}.test.tsx && pnpm --filter @quanan/admin typecheck && pnpm --filter @quanan/admin lint`

---

### **US-006 · adminRLS bypass 跨账号查集成测试 · 验证 set_config('app.role','admin') 真 bypass + admin_audit_log 自动写**

> **risk_level** · `high`(数据隔离硬验证 · 跨账号 bypass 真过 SQL 验证 · LD-A3 核心)
> **priority** · 6
> **depends_on** · [US-003, US-004]

**描述** · 跨账号查集成测试 · 真 PostgreSQL DB + 真 Redis(quanan_test 测试库)· seed 2 个 account(account_a / account_b)+ 每账号加 5 条 history row(共 10 条)· seed 1 admin_user(super_admin · isMock=true)· 测试矩阵:

1. **不走 adminRLS 直接调主应用 ctx.prisma**(对照组)· `await ctx.prisma.history.findMany({})` · 因主应用 RLS ENABLED + 无 activeAccountId → 应**返回 0 rows**(RLS 全挡)
2. **走 adminRLS 调 ctx.adminPrisma**(主测试)· 6 闸鉴权链通过(env stub mode)→ adminRLS set_config 真生效 → `await ctx.adminPrisma.history.findMany({})` → **返回 10 rows**(bypass RLS 成功)
3. **adminRLS 注入 ctx.crossAccountAccessed=true**(★ 检测点)· 测试 ctx 对象含此 flag(US-004 auditLog 读此 flag)
4. **admin_audit_log 自动写 cross_account_query**(端到端验证)· 跑完上述 query 后 `await prisma.adminAuditLog.findMany({})` 应有 ≥1 row · eventType='cross_account_query' · adminUserId=mock admin · accessedAccountIds=null(全表扫)or [account_a.id, account_b.id]
5. **$transaction rollback 验证**(异常路径)· 在 adminRLS middleware 内 throw 模拟错误 → SELECT 应仍为空(transaction 回滚)
6. **set_config 不污染连接池**(并发安全)· 同一个连接 · 先跑 adminRLS query · 后跑非 admin query · 第二次 SELECT current_setting('app.role') 应为空(因 LOCAL=true 仅事务内)
7. **多账号 isolation 保持**(主应用 RLS 不破)· 同一 test session 内 · 主应用 query 仍带 activeAccountId 隔离 · 不被 adminRLS 污染

**触发场景**(测试代码内部):
- beforeEach · truncate 测试库 · seed 2 account + 10 history + 1 admin_user
- test 1 · `ctx.prisma.history.findMany({})` → assert rows.length === 0(主应用 RLS 默认全挡)
- test 2 · 通过 adminProcedure 调 mock procedure → ctx.adminPrisma 注入 + set_config 已 SET → query → assert rows.length === 10
- test 3 · 上 test 同步 assert ctx.crossAccountAccessed === true
- test 4 · 上 test 之后 + 同 admin login session → query admin_audit_log → assert ≥1 row · 字段验证
- test 5 · adminRLS internally throw → transaction rolled back → admin_audit_log 不写(因 audit 在 RLS 之后 next 内)
- test 6 · 连续 2 个 connection.execute() · 第二个不在 transaction → SELECT current_setting 空
- test 7 · 主应用 protectedProcedure(走 accountIsolation 不走 adminRLS)· 加 activeAccountId=account_a · query history → 5 rows(仅 account_a)· 不被本 PRD adminRLS 污染

**files_to_create** ·
- `tests/integration/admin/rls-bypass-cross-account.test.ts`(★ 主 · ~280 行 · 7 test case · 真 DB + 真 Redis · beforeEach seed · afterAll cleanup)
- `tests/integration/admin/fixtures/admin-seed.ts`(~120 行 · seedAccounts(N) · seedHistoryPerAccount(accountId, M) · seedAdminUser(role, isMock) · seedAdminSession(adminUserId, ttl))
- `tests/integration/admin/helpers/admin-context.ts`(~80 行 · `createMockAdminContext(adminUserId)` · 模拟 ctx.activeAdminUser + ctx.adminSession + req/res stub · 用于跑 procedure)
- `tests/integration/admin/helpers/sql-introspect.ts`(~60 行 · `getCurrentSetting(connection, key)` · `getRLSEnabled(table)` · 用于断言 SQL state)

**files_to_modify** ·
- `prisma/seed.ts`(若不存在新建 · 加 admin 子项目 dev seed · `seedDevAdminUser({ email: 'dev-admin@quanan.com', isMock: true, role: 'super_admin' })`)
- `package.json`(加 script `test:admin-integration` · 跑 `vitest run tests/integration/admin/`)
- `vitest.config.ts`(integration test 用 testTimeout=30000 · pool='forks' singleFork=true · DB 串行避免冲突)

**反例 grep**(US-006 audit 必跑) ·
- `grep -rEn "prisma\\.[A-Z][a-zA-Z]+\\.findMany\\({}\\)" tests/integration/admin/` 应 ≤ 2(仅本测试 cross-account 用 · 其他必带 where)
- `grep -n "set_config.*'app.role'.*'admin'" tests/integration/admin/rls-bypass-cross-account.test.ts` 应 ≥ 1(断言 set_config 真生效)
- `grep -n "current_setting.*'app.role'" tests/integration/admin/rls-bypass-cross-account.test.ts` 应 ≥ 2(test 2 + test 6 都 assert)
- `grep -n "crossAccountAccessed.*true" tests/integration/admin/rls-bypass-cross-account.test.ts` 应 ≥ 1(test 3 + test 4 assert)
- `grep -rn "DROP\|TRUNCATE.*history\|ALTER.*history" tests/integration/admin/fixtures/admin-seed.ts` 应 0(seed 用 prisma client 不直接改 schema)

**test_command** · `pnpm test:admin-integration && pnpm typecheck`

---

### **US-007 · 收官 · 全套绿灯 + LD-A 5 grep + R-A 6 grep + 1 new e2e(admin login → layout 16 域 → audit drawer 显 admin_login → audit_log 1 row)**

> **risk_level** · `medium`(收官 · 走门禁 · 但跨多 US 验证容易误踩边缘)
> **priority** · 7
> **depends_on** · [US-001, US-002, US-003, US-004, US-005, US-006]

**描述** · 全套绿灯 + audit 完整闭环:

**Part 1 · 全套绿灯门禁**:
- `pnpm test`(workspace 全扫)≥ PRD-9 基线 907 + 本 PRD 新 ≥ 80 unit = **≥ 987**
- `pnpm test:judge` ≥ 55(PRD-9 累计 · 本 PRD 不加 judge)
- `pnpm test:admin-integration`(US-006 + 任何 admin 集成)≥ 8 test cases
- `pnpm test:e2e` ≥ PRD-9 基线 164 + 本 PRD 新 1 = **≥ 165**
- `pnpm typecheck` 7 workspace(原 6 + admin 1 新)0 errors
- `pnpm lint --max-warnings=0` 0 warnings

**Part 2 · LD-A 5 grep(scripts/audit-redlines-admin.sh)**:
- LD-A1 · `grep -rn "QUANQN_WEB_CLIENT" apps/admin/` = 0
- LD-A2 · `grep -rn "from.*routers/app" apps/api/src/trpc/routers/admin/` = 0 · `grep -rn "from.*routers/admin" apps/api/src/trpc/routers/app/` = 0
- LD-A3 · 跑 `node scripts/audit-admin-rls.ts`(AST 检测每个 admin procedure 必经 adminRLS · 本 PRD 仅 auth/health 两个 procedure 不经 adminRLS · 例外列表 = ['auth.login', 'auth.logout', 'health'])
- LD-A4 · 跑 `node scripts/audit-approval-gates.ts`(14 高风险 procedure 名单 · 本 PRD 这些 procedure 都不存在 · 仅 stub 验证未来 attach 机制)
- LD-A5 · `grep -rn "prisma.trendingItem.create" apps/api/src/workers/trending-scraper/` = 0(PRD-9 已为 0 · 仅核对 PRD-12 落地前未引入)+ `grep -rn "prisma.deepLearningArchive.create" apps/api/src/workers/file-parser/` = 0(同上)

**Part 3 · R-A 6 grep**:
- R-A1 · `grep -rn "from '@quanan/admin\|from '\.\./admin'" apps/web/src/` = 0 · 反向 = 0
- R-A2 · `grep -rn "/admin" apps/web/src/` = 0(主应用 route 不指 /admin)
- R-A3 · 部署前 gate 跳过(本 PRD 不部署到 prod · 仅 CI gate 占位:`test -f infra/cloudflare-waf-admin.yaml.template` ≥ 0 文件占位)
- R-A4 · 每个 admin procedure 必含 audit · 本 PRD adminProcedure 已统一挂 auditLog · 业务 procedure 体内不再重复挂 · grep `adminProcedure.*\\.use(auditLog)` in routers/admin/ = 0
- R-A5 · admin 不调 LLM · `grep -rn "import.*LLMGateway\|llmGateway" apps/admin/ apps/api/src/trpc/routers/admin/` = 0
- R-A6 · admin 不用 raw SQL 绕过 · `grep -rn "\\\$executeRawUnsafe\|\\\$queryRawUnsafe" apps/api/src/trpc/routers/admin/` = 0(adminRLS middleware 内部例外 · 不在 routers/admin/)

**Part 4 · 1 new e2e 闭环**(`tests/e2e/admin/admin-foundation-loop.spec.ts`)·
- playwright project `quanan-admin` baseURL `http://localhost:5174`
- workers=1 + fullyParallel=false(继承 PRD-4 US-018 教训)
- 路径 · seed admin_user via API helper → goto `/login` → 输 email super@quanan.com → 点 "mock OAuth 登录" → 跳 `/admin` → 看到 TopBar(super_admin badge)+ Sidebar(16 域 4 分组)+ StatusBar(ENV=dev / RLS=ON / WAF=stub / MFA=stub / Role=super_admin)→ 点 sidebar "NSM 仪表盘" → 跳 `/admin/nsm` → 看到 placeholder "PRD-11 · 域 ① NSM 仪表盘 · 待落地" → 点 topbar 🔔 audit drawer 展开 → 看到 1 条 audit_log "admin_login · 2026-MM-DD HH:MM" → drawer 关闭 → 点 logout → 跳 `/login` → expect API admin_audit_log 表有 ≥ 2 rows(admin_login + admin_logout)+ admin_sessions 表 isActive=false

**Part 5 · verify-artifacts manifest**(US-007 收官 manifest · 继承 PRD-4 US-018 / PRD-5 US-012 模式) ·
- `scripts/ralph/verify-artifacts/US-007/manifest.json` 写入:
  - vitest result(total / passed / failed / skipped)
  - admin-integration result(total / passed)
  - playwright result(total / passed · admin spec specific)
  - typecheck result(7 ws · 0 errors)
  - lint result(0 warnings)
  - LD-A grep result(5 commands · 全 0 hits)
  - R-A grep result(6 commands · 全 0 hits)
  - 13 admin tables RLS state(全 false)
  - 主应用 18 表 RLS state(全 true · 0 副作用验证)

**files_to_create** ·
- `tests/e2e/admin/admin-foundation-loop.spec.ts`(★ ~280 行 · 收官 e2e · 7 个 step · seed → login → layout → sidebar → placeholder → audit drawer → logout · 含 helper functions)
- `tests/e2e/helpers/admin-mock-oauth.ts`(~80 行 · `mockAdminLogin(page, { email, role })` · UI 自动化 · 等待 redirect)
- `tests/e2e/helpers/admin-db-seed.ts`(~60 行 · 通过 admin API endpoint `/__test__/seed` 或直接 prisma · seed 1 admin_user 测试用)
- `scripts/audit-redlines-admin.sh`(★ ~120 行 · 5 LD-A + 6 R-A 一键 grep · 输出 PASS / FAIL · 收官 must 全 PASS)
- `scripts/audit-admin-rls.ts`(★ ~150 行 · AST 检测 · 用 `@typescript-eslint/parser` 解析 apps/api/src/trpc/routers/admin/*.ts · 找 procedure 定义 + 检查 .use chain 是否含 adminRLS · 例外列表 ['auth.login', 'auth.logout', 'health'])
- `scripts/audit-approval-gates.ts`(★ ~100 行 · AST 检测 · 14 类高风险 procedure 名单 · 检查 meta.requiresApproval=true · 本 PRD 全 stub 仅占位检查机制)
- `scripts/audit-admin-rls-tables.sh`(~40 行 · 一键 psql · 验证 13 admin 表 RLS DISABLED + 主应用 18 表 RLS ENABLED · 0 副作用)
- `scripts/ralph/verify-artifacts/US-007/manifest.json`(★ 收官 manifest · 写入测试 + grep + RLS state 全验证)

**files_to_modify** ·
- `package.json`(加 scripts:`audit:redlines-admin` `audit:admin-rls` `audit:approval-gates` `audit:admin-rls-tables` · 一键跑全套)
- `playwright.config.ts`(加 admin project · baseURL · workers=1 for admin · projects = ['quanan-web', 'quanan-admin'] · 改 default project)
- `tests/e2e/global-setup.ts`(若存在则改 · 加 admin DB seed step · 复用 helpers/admin-db-seed.ts)

**反例 grep**(US-007 audit 必跑 · 上述 LD-A 5 + R-A 6 + 以下补充) ·
- `grep -rn "TODO\|FIXME\|XXX" apps/admin/src/ apps/api/src/trpc/routers/admin/ apps/api/src/trpc/middleware/admin/` 应 ≤ 5(允许少量 stub TODO 注解 · 但不超 5 · 防滥用)
- `grep -rEn "console\\.log" apps/admin/src/ apps/api/src/trpc/routers/admin/ apps/api/src/trpc/middleware/admin/` 应 ≤ 2(除 auditLog 错误路径 console.error 外 · 其他生产代码不 console.log)
- 跑 `bash scripts/audit-redlines-admin.sh` 必 exit 0 · stdout 含 "ALL PASS · 5 LD-A + 6 R-A"
- 跑 `psql quanan -c "SELECT relname FROM pg_class WHERE relname IN (... 13 admin 表 ...) AND relrowsecurity=true;"` 应 0 rows
- 跑 `psql quanan -c "SELECT relname FROM pg_class WHERE relname IN (... 主应用 18 表 ...) AND relrowsecurity=false;"` 应 0 rows
- 跑 `pnpm typecheck` exit 0 · 7 workspace 全扫
- 跑 `pnpm test` exit 0 · 全套 ≥ 987 + judge 55 + integration 8 + e2e 165(verify-artifacts manifest 写入)

**test_command** · `bash scripts/audit-redlines-admin.sh && bash scripts/audit-admin-rls-tables.sh && pnpm test && pnpm test:judge && pnpm test:admin-integration && pnpm test:e2e && pnpm typecheck && pnpm lint --max-warnings=0`(★ 全套绿灯 + 全 audit 一键跑 · 收官)

---

## §2 验收标准(AC · ★ 4 类必含 · H/E/B/P)

> **强制规范**(对应 PRD-MASTER §0.1 维度 2 + §2.2-C)· 每个 US 必有以下 4 类 AC + Common 通用门禁 · 每 US 共 4-7 条 AC

---

### **US-001 · monorepo workspace 重构 + 13 admin 模型**

#### AC-001-H(happy)
- **Given** · 跑 prerequisites · `pnpm install` 成功 + PostgreSQL quanan DB up + Redis up
- **When** · 顺序跑 `bash scripts/migrate-monorepo.sh` + `pnpm prisma migrate dev --name admin-init` + `pnpm prisma db execute --file prisma/migrations/manual_admin_rls.sql`
- **Then** ·
  - apps/web / apps/admin / apps/api / packages/{schemas,ui,clients} 5 子项目存在(`ls apps packages` 应有 7 项)
  - pnpm-workspace.yaml 含 `apps/*` + `packages/*`
  - prisma schema 13 admin model 全列出(`grep -c "^model.*Admin\\|^model.*Approval\\|^model.*Prompt\\|^model.*Quota\\|^model.*Review\\|^model.*Compliance\\|^model.*Ab" prisma/schema.prisma` ≥ 13)
  - `psql quanan -c "SELECT relname, relrowsecurity FROM pg_class WHERE relname IN ('admin_audit_log', ...)"` 13 行 · 全 relrowsecurity=false
  - `pnpm typecheck` 7 ws 0 errors
  - `pnpm test tests/unit/admin/{middleware-stubs,admin-schema}.test.ts` 13 unit 全 pass
  - **零回归** · `pnpm test` 全套 ≥ 907(PRD-9 基线)+ 13 新 = ≥ 920

#### AC-001-E(error)
- **场景 E1** · prisma migrate 失败(schema 冲突)· 比如 admin_audit_log 名跟主应用某表冲突
  - Given · 主应用已有同名 model 'admin_audit_log'(假设的冲突场景)
  - When · `pnpm prisma migrate dev --name admin-init`
  - Then · migrate 报错 exit 1 · 输出含 'duplicate model name' · prd-10 必须**预先确认 DATA-MODEL §13.10 兼容性**(0 冲突)
- **场景 E2** · manual_admin_rls.sql 跑失败(某 admin 表名拼错)
  - Given · prisma generate 写错某 admin 表名(如 `admin_audit_log_v2`)
  - When · `pnpm prisma db execute --file prisma/migrations/manual_admin_rls.sql`
  - Then · SQL 报错 'relation does not exist' · exit 1 · ralph fail-over 修表名同步

#### AC-001-B(boundary)
- **场景 B1** · monorepo 重构后 PRD-9 e2e 不破
  - Given · 已跑完 US-001 全套(workspace 拆 + 13 model + RLS DISABLE)
  - When · `pnpm test:e2e tests/e2e/knowledge-rag-loop.spec.ts`(PRD-9 收官 e2e · 6 tests)
  - Then · 6 tests 全 pass · 0 regression · 验证 PRD-9 RAG 闭环不被本 PRD 改动破
- **场景 B2** · 13 admin model 中 admin_audit_log 必含 createdAt 索引(IO 性能)
  - Given · prisma schema 13 admin model
  - When · `pnpm prisma format && grep -A 5 "model AdminAuditLog" prisma/schema.prisma`
  - Then · `@@index([createdAt(sort: Desc)])` 存在(高频查最近 audit)+ `@@index([actorAdminId, createdAt(sort: Desc)])` 存在(查特定 admin 的 audit)

#### AC-001-P(performance)
- **场景 P1** · monorepo 重构后 pnpm install 时长
  - cold(`rm -rf node_modules apps/*/node_modules packages/*/node_modules && pnpm install`)< 90s
  - warm(`pnpm install` no changes)< 10s
- **场景 P2** · 13 admin table migration 时长
  - `pnpm prisma migrate dev --name admin-init` < 30s(13 model + 索引 · 本地 PG)
- **场景 P3** · typecheck 时长(7 workspace)
  - cold < 30s · warm(增量)< 8s

---

### **US-002 · lucia-auth admin session + mock OAuth**

#### AC-002-H(happy)
- **Given** · US-001 完成 · admin_users 表有 row(email='super@quanan.com', isMock=true, isActive=true, role='super_admin')· OAUTH_PROVIDER=mock
- **When** · POST `/trpc/admin.auth.login` · input=`{ email: 'super@quanan.com' }`
- **Then** ·
  - 响应含 sessionId(uuid v4) · expiresAt(now + 12h) · user(id, email, role)
  - `psql quanan -c "SELECT count(*) FROM admin_sessions WHERE adminUserId='...' AND isActive=true"` = 1
  - `redis-cli KEYS 'admin:session:*'` ≥ 1 hit
  - 响应 Set-Cookie header 含 `admin_session_id=...; HttpOnly; SameSite=Lax`(dev · 无 Secure)
  - 响应时间 < 200ms

#### AC-002-E(error)
- **场景 E1** · admin_users 表无对应 email
  - Given · email='ghost@quanan.com' 不在表
  - When · POST login
  - Then · throw NOT_FOUND 404 'Admin user not found' · admin_audit_log eventType='admin_login' status='failed' reason='user_not_found' 写入 1 row
- **场景 E2** · admin_user isActive=false
  - Given · email='dormant@quanan.com' 存在但 isActive=false
  - When · POST login
  - Then · throw FORBIDDEN 403 'Admin user inactive' · admin_audit_log eventType='admin_login' status='failed' reason='user_inactive' 写入
- **场景 E3** · OAUTH_PROVIDER=google + stub
  - Given · env OAUTH_PROVIDER=google(prod 配置)
  - When · POST login(任意 email)
  - Then · throw `'PRR config required · GOOGLE_WORKSPACE_CLIENT_ID 等 5 env'`

#### AC-002-B(boundary)
- **场景 B1** · idle timeout 30min · 自动登出
  - Given · 登录成功 · sessionId='xxx' · createdAt=Date.now()
  - When · 31min 后调 `admin.auth.me`(用同 sessionId)
  - Then · session 已 idle expired · `lucia.validateSession` 返 null · me throw UNAUTHORIZED 401
- **场景 B2** · absolute ttl 12h
  - Given · 登录 12h+1min 前
  - When · 调 me
  - Then · throw UNAUTHORIZED · 即使中间有活动也 hard expired
- **场景 B3** · 并发同账号双 session
  - Given · 同 admin 在 2 个浏览器各登录一次(连续调 2 次 login)
  - When · 拿 sessionId_1 调 me · 拿 sessionId_2 调 me
  - Then · 都 pass(支持并发 · admin_sessions 表 2 行 · isActive=true × 2)· 但 logout 一个不影响另一个

#### AC-002-P(performance)
- **场景 P1** · login mock 路径
  - lucia.createSession + DB write · P50 < 50ms · P99 < 150ms
  - DB connection pool 不阻塞主应用(独立 connection 或 pool segment)
- **场景 P2** · me 调用频率(admin SPA 每次刷新都调)
  - validateSession cached at Redis · P50 < 5ms · P99 < 30ms

---

### **US-003 · 6 闸 middleware 真接 · 每闸单测**

#### AC-003-H(happy)
- **Given** · super_admin 登录 mock OAuth(US-002)· env IP_WHITELIST=false / MFA_REQUIRED=false
- **When** · 调任意 `adminProcedure`(如 `admin.health` 改用 adminProcedure 实验 · 或 audit.listMine)
- **Then** ·
  - 6 闸顺序执行(adminAuth → roleCheck → ipWhitelist → mfaCheck → adminRLS → approvalGateCheck → auditLog)
  - 全 pass · 返回 result
  - 测试 spy 验证 6 个 middleware 都被调用
  - 响应时间 < 100ms(单 procedure)

#### AC-003-E(error)
- **场景 E1** · readonly_admin 调 admin 角色 procedure
  - Given · email='readonly@quanan.com' role='readonly_admin' 已登录
  - When · 调 `adminProcedure` with `meta.requiredRole='admin'`
  - Then · roleCheck throw FORBIDDEN 403 · code='FORBIDDEN' message includes 'insufficient role'
- **场景 E2** · super_admin 调 requiresApproval=true 的 procedure(stub)
  - Given · super_admin 登录
  - When · 调 procedure with `meta.requiresApproval=true actionType='ban_user'`
  - Then · approvalGateCheck throw NOT_IMPLEMENTED 501 · message 含 'PRD-13' · admin_audit_log eventType='approval_request_create' status='stub_rejected' 写入 1 row
- **场景 E3** · 未登录访问 adminProcedure
  - Given · 无 cookie
  - When · 调 adminProcedure
  - Then · adminAuth throw UNAUTHORIZED 401 · 6 闸链短路 · roleCheck 等不执行

#### AC-003-B(boundary)
- **场景 B1** · adminRLS · set_config 真生效
  - Given · adminProcedure 执行 · 进入 adminRLS middleware
  - When · `await ctx.adminPrisma.$queryRaw\`SELECT current_setting('app.role')\``
  - Then · 返回 [{ current_setting: 'admin' }](真在事务内 LOCAL=true 生效)
- **场景 B2** · adminRLS · $transaction 异常自动 rollback
  - Given · adminProcedure 内业务 throw
  - When · 抛 throw
  - Then · `$transaction` rollback · 任何 admin_audit_log 写入也 rolled back · 测试 row count 不变
- **场景 B3** · 6 闸顺序不可调
  - Given · 改 adminProcedure 链顺序 · auditLog 移到 adminAuth 之前
  - When · 跑测试
  - Then · 测试 fail(auditLog 试图读 ctx.activeAdminUser 但 adminAuth 还没注入 → undefined throw)

#### AC-003-P(performance)
- **场景 P1** · 6 闸链 overhead
  - 总 middleware 耗时 < 30ms(P99 · 包含 lucia validateSession Redis + adminRLS $transaction wrap)
- **场景 P2** · ipWhitelist + mfaCheck(env stub 模式)
  - 单闸耗时 < 1ms(纯 env check + return next)

---

### **US-004 · admin_audit_log 自动 middleware 写入 · 4 类 eventType**

#### AC-004-H(happy)
- **Given** · super_admin 登录(US-002)· 调任意 adminProcedure(US-003 通过 6 闸)
- **When** · procedure 完成 · auditLog middleware 后置写入
- **Then** ·
  - admin_audit_log 表 1 row 写入
  - eventType='cross_account_query'(若 adminRLS 触发)or 'request_completed'(普通查)· 字段:adminUserId / eventCategory='data_access' / latencyMs / ipAddress / userAgent / traceId / requestedPayload(input redact 后)
  - latencyMs > 0 < 200ms
- **场景 H2** · login 写 admin_login event(不经 middleware · 由 auth.login 直接调 service)
  - Given · 同 H
  - When · 完整 login flow
  - Then · admin_audit_log eventType='admin_login' status='success' adminUserId=xxx oauthProvider='mock' 1 row

#### AC-004-E(error)
- **场景 E1** · audit_log 写失败(prisma error)
  - Given · admin_audit_log 表 schema 临时坏(模拟)
  - When · adminProcedure 完成 · auditLog middleware 试写
  - Then · `console.error('[ADMIN AUDIT WRITE FAILED]', err)` · 但 procedure result 仍返回(audit 失败不阻塞 business)
- **场景 E2** · login failed event(用户不存在)
  - Given · email='ghost@quanan.com'
  - When · POST login
  - Then · admin_audit_log eventType='admin_login' status='failed' adminUserId=null reason='user_not_found' email_attempted='ghost@quanan.com'(redact 不 redact email · 但 redact 任何 password / token)1 row 写入

#### AC-004-B(boundary)
- **场景 B1** · cross_account_query 检测点
  - Given · super_admin 调 adminProcedure 内部 `ctx.adminPrisma.history.findMany({})`(扫全表 · 跨账号)
  - When · 完成
  - Then · adminRLS 设 `ctx.crossAccountAccessed=true` · auditLog 读 flag · 写 eventType='cross_account_query' · accessedAccountIds=null(扫全表 stub · 真业务可改 deep inspect WHERE)
- **场景 B2** · 不跨账号查不写 cross_account_query
  - Given · super_admin 调 adminProcedure 内部 `ctx.adminPrisma.adminUser.findMany({ where: { id: ctx.activeAdminUser.id } })`(查自己)
  - When · 完成
  - Then · auditLog 写 eventType='request_completed'(普通 audit · 非跨账号)· 不写 cross_account_query
- **场景 B3** · sensitive field redact
  - Given · adminProcedure input 含 `{ email, password }`
  - When · auditLog 写
  - Then · requestedPayload JSON `{ email: 'x@y.com', password: '[REDACTED]' }` · 不存明文密码 · 类似 token / apiKey / secret 字段也 redact

#### AC-004-P(performance)
- **场景 P1** · audit 写入耗时
  - prisma create P50 < 5ms · P99 < 30ms(admin_audit_log 是 append-only · 索引 createdAt DESC + adminUserId+createdAt DESC)
- **场景 P2** · 大量 audit log 累积(模拟 1000 行)
  - admin_audit_log 表 1000 rows · `SELECT * FROM admin_audit_log WHERE adminUserId=xxx ORDER BY createdAt DESC LIMIT 50` < 50ms(索引有效)

---

### **US-005 · Layout 骨架 + 16 域占位**

#### AC-005-H(happy)
- **Given** · super_admin 已登录(US-002)· 浏览器访问 `http://localhost:5174/admin`
- **When** · AdminLayout 渲染
- **Then** ·
  - TopBar 显示 "QuanAn Admin" 品牌 + super_admin badge + email + logout dropdown
  - Sidebar 显示 16 域分 4 组(P0 业务核心 6 + P0 内容审核 2 + P1 健康度 5 + P2 高级 3)· 每域 emoji + label + 灰色 "待落地 PRD-XX" tag
  - 主区显示空 placeholder "选择左侧域进入"
  - StatusBar 底部 1 行 · ENV=dev / RLS=ON(13 admin 表 DISABLED · 主应用 18 表 ENABLED · 双重显示)/ WAF=stub / MFA=stub / Role=super_admin · 5 字段都显示
  - 响应时间(首屏渲染)< 500ms · LCP < 2s

#### AC-005-E(error)
- **场景 E1** · 未登录访问 /admin
  - Given · 无 admin_session_id cookie
  - When · 浏览器跳 /admin
  - Then · ProtectedRoute 跳 /login · 不显示 layout
- **场景 E2** · 16 域占位 click 跳 404 / blank
  - Given · 已登录 · 点 sidebar "NSM 仪表盘"
  - When · 跳 `/admin/nsm`
  - Then · 显示 placeholder.tsx 页 · 内容 "PRD-11 · 域 ① NSM 仪表盘 · 待落地" + 域简介(从 ADMIN §3 copy)· 不是 404 · 不是空页

#### AC-005-B(boundary)
- **场景 B1** · 16 域 sidebar 滚动
  - Given · 16 域全展开 + 浏览器窗高 600px(小窗)
  - When · sidebar 渲染
  - Then · ScrollArea + h-[calc(100vh-60px-48px)] 生效 · 无 overflow · 滚动到底显示最后 3 域(配置中心 · 常量 · A/B)
- **场景 B2** · audit drawer toggle
  - Given · admin 在 /admin/nsm 页 · 点 topbar 🔔
  - When · drawer 展开
  - Then · 右侧 slide-in 320px wide · 显示 listMine 最近 50 条 · 自己的 admin_login row 1 条 · 关闭按 ESC 或点 overlay
- **场景 B3** · logout flow
  - Given · 已登录 · 点 topbar logout dropdown → "退出登录"
  - When · 调 admin.auth.logout
  - Then · session destroyed · 跳 /login · admin_audit_log eventType='admin_logout' 1 row(也归 admin_login 类 · 但 status='logout')

#### AC-005-P(performance)
- **场景 P1** · admin bundle size
  - apps/admin build dist-admin · `du -sh dist-admin/` < 1.5MB(gzipped · 复用 packages/ui 共享 chunk)
- **场景 P2** · 路由切换响应
  - sidebar click → URL 改变 → placeholder.tsx 渲染 < 100ms(纯 React route swap · 无数据请求)
- **场景 P3** · audit drawer polling
  - 30s polling 1 次 admin.audit.listMine · 单次 < 200ms

---

### **US-006 · adminRLS bypass 跨账号查集成测试**

#### AC-006-H(happy)
- **Given** · 测试库 quanan_test seed 2 account(account_a / account_b)+ 每账号 5 history rows + 1 admin_user(super_admin · isMock=true)
- **When** · 通过 adminProcedure 调 mock procedure · 内部 `ctx.adminPrisma.history.findMany({})`
- **Then** ·
  - 返回 10 rows(5 + 5 · bypass RLS 成功)
  - `current_setting('app.role')` = 'admin'(测试用 raw SQL 验证)
  - ctx.crossAccountAccessed === true
  - 测试结束后 admin_audit_log 表 ≥ 1 row · eventType='cross_account_query' · adminUserId=mock admin

#### AC-006-E(error)
- **场景 E1** · 不走 adminRLS 直接调主应用 ctx.prisma
  - Given · 同上 seed
  - When · 调 protectedProcedure(主应用)· 内部 `ctx.prisma.history.findMany({})`
  - Then · 返回 0 rows(主应用 RLS 默认 + 无 activeAccountId 全挡)
- **场景 E2** · adminRLS 内 throw 触发 rollback
  - Given · adminProcedure 内业务故意 throw
  - When · 抛
  - Then · `$transaction` rollback · admin_audit_log 不写新 row(因 audit 在 procedure result 之后 next 内)
- **场景 E3** · current_setting 连接池不污染
  - Given · 跑完 adminProcedure 后
  - When · 同 connection 再跑非 admin query · `SELECT current_setting('app.role')`
  - Then · 返回空字符串 / null(LOCAL=true 仅事务内 · 不持久化)

#### AC-006-B(boundary)
- **场景 B1** · 主应用 RLS 不破
  - Given · 同 seed · admin 登录 + 主应用 protectedProcedure 也在跑(两条 path)
  - When · 调主应用 `protectedProcedure` `ctx.prisma.history.findMany({})` with activeAccountId=account_a
  - Then · 返回 5 rows(仅 account_a · 主应用 RLS 仍生效 · 不被本 PRD adminRLS 污染)
- **场景 B2** · admin 跨账号 + 后置 audit 写
  - Given · adminProcedure 跑 + adminRLS 触发
  - When · procedure 完成 · auditLog middleware
  - Then · admin_audit_log row · accessedAccountIds=null(stub)or [account_a, account_b](real implementation · v1 留 PRD-11)

#### AC-006-P(performance)
- **场景 P1** · adminRLS 跨账号查性能
  - 10 rows history (跨 2 account)· P50 < 50ms · P99 < 200ms(本地 PG · 测试库)
- **场景 P2** · $transaction wrap overhead
  - vs 不带 wrap 直查 · 增加 10-30ms(LOCAL set_config + COMMIT)

---

### **US-007 · 收官全套绿灯 + LD-A 5 + R-A 6 + 1 e2e**

#### AC-007-H(happy)
- **Given** · US-001 ~ US-006 全部完成
- **When** · 跑 `bash scripts/audit-redlines-admin.sh && pnpm test && pnpm test:judge && pnpm test:admin-integration && pnpm test:e2e && pnpm typecheck && pnpm lint --max-warnings=0`
- **Then** ·
  - audit-redlines-admin.sh exit 0 · 输出 "ALL PASS · 5 LD-A + 6 R-A"
  - vitest ≥ 987 / ≥ 987(907 PRD-9 累计 + ≥ 80 PRD-10 新)0 failures
  - test:judge 55 / 55(PRD-9 累计 · 本 PRD 不加 judge)
  - test:admin-integration ≥ 8 / ≥ 8
  - test:e2e ≥ 165 / ≥ 165(164 PRD-9 + 1 admin-foundation-loop)
  - typecheck 7 ws 0 errors
  - lint 0 warnings
  - playwright admin-foundation-loop.spec.ts 1 test pass · 7 step 全通过

#### AC-007-E(error)
- **场景 E1** · audit 某项 grep 命中(R-A6 红线触发)
  - Given · 假设 ralph 误写 `prisma.$executeRawUnsafe` in admin router
  - When · 跑 `audit-redlines-admin.sh`
  - Then · exit 1 · 输出含 "FAIL R-A6 · apps/api/src/trpc/routers/admin/xxx.ts:N · 必须用 adminProcedure" · ralph fail-over 修
- **场景 E2** · e2e flaky
  - Given · admin-foundation-loop.spec.ts 跑 · audit drawer polling 时机敏感
  - When · audit drawer 展开时 polling 间隔未触发新数据
  - Then · 测试 retry 1 · 仍 fail · ralph 改 e2e 加 explicit waitFor · 不假成功

#### AC-007-B(boundary)
- **场景 B1** · 13 admin 表 RLS DISABLED + 主应用 18 表 RLS ENABLED 双向 0 副作用
  - Given · US-001 跑完 manual_admin_rls.sql
  - When · `bash scripts/audit-admin-rls-tables.sh`
  - Then · stdout "13 admin tables · RLS DISABLED · OK / 18 main app tables · RLS ENABLED · OK"
- **场景 B2** · 6 闸顺序硬验证(B3 已含 US-003 测试 · 本 US 加 e2e 级)
  - 跑 e2e admin-foundation-loop.spec.ts · 验证 6 闸全经过(API logs 含 6 个 middleware name · 顺序 adminAuth → ... → auditLog)

#### AC-007-P(performance)
- **场景 P1** · 收官全套绿灯总耗时
  - audit-redlines-admin.sh < 10s
  - vitest + judge + integration + e2e + typecheck + lint 全跑 < 8min(CI 单 worker)
- **场景 P2** · admin login → layout → audit drawer e2e 总时长
  - playwright 单 test < 30s

---

### **Common · 通用门禁(每 US 完成都跑)**

#### Common-A · 零回归硬门禁(继承 PRD-5 US-001 / PRD-9 US-005 模式)

- [ ] **vitest 全套绿** · `pnpm test` ≥ PRD-9 基线 907 + 本 US 新 unit 数 · 0 failures · 0 skipped(skipped 必备注 PR 内说明)
- [ ] **typecheck 7 ws** · `pnpm typecheck` 0 errors(原 6 + admin 1 新)· tsc --build references 链通畅
- [ ] **lint 0 warnings** · `pnpm lint --max-warnings=0`(防 PRD-1 lint debt 重现)
- [ ] **PRD-9 e2e 不破** · 每 US 完成后跑 `pnpm test:e2e tests/e2e/knowledge-rag-loop.spec.ts` · 6 tests 全 pass(0 副作用 · LD-A2 + R1 缓解硬验证)
- [ ] **PRD-1~9 主应用主功能 0 影响** · 跑 `pnpm test:e2e -g 'main-app'`(若有 label 标签 · 否则跑全套 e2e)· 全 pass

#### Common-B · AGENTS §10 红线 grep(US-003+ 起每 US 必跑相关项 · US-007 跑全套)

- [ ] **R-A1 web/admin 不互相 import** · `grep -rn "from '@quanan/admin\|from '\.\./admin'" apps/web/src/` 应 0 · 反向同
- [ ] **R-A2 主应用前端不暴露 admin 入口** · `grep -rn "/admin" apps/web/src/` 应 0
- [ ] **R-A3 admin 部署前 gate** · 本 PRD stub · CI 占位 `test -f infra/cloudflare-waf-admin.yaml.template`(不必真生效)
- [ ] **R-A4 admin procedure 必有 audit** · adminProcedure 已统一挂 auditLog · 业务 procedure 不再手挂 · `grep -rEn "\.use\(auditLog\)" apps/api/src/trpc/routers/admin/` 应 0
- [ ] **R-A5 admin 不调 LLM** · `grep -rn "import.*LLMGateway\|llmGateway" apps/admin/ apps/api/src/trpc/routers/admin/` 应 0
- [ ] **R-A6 admin 不用 raw SQL 绕过** · `grep -rn "\\\$executeRawUnsafe\|\\\$queryRawUnsafe" apps/api/src/trpc/routers/admin/` 应 0(adminRLS middleware 内部例外)
- [ ] **LD-A1 OAuth 独立** · `grep -rn "QUANQN_WEB_CLIENT" apps/admin/` 应 0 · `grep -rn "app:session:" apps/admin/ apps/api/src/lib/auth/lucia-admin.ts apps/api/src/trpc/routers/admin/` 应 0
- [ ] **LD-A2 adminRouter / appRouter 严格分离** · `grep -rn "from.*routers/app" apps/api/src/trpc/routers/admin/` 应 0 · `grep -rn "from.*routers/admin" apps/api/src/trpc/routers/app/` 应 0
- [ ] **LD-A3 admin 跨账号查必带 adminRLS** · `node scripts/audit-admin-rls.ts`(AST 检测 · 例外 ['auth.login', 'auth.logout', 'health'])
- [ ] **LD-A4 高风险必带 requiresApproval** · `node scripts/audit-approval-gates.ts`(14 类高风险 procedure 检测 · 本 PRD 仅 stub 验证机制)
- [ ] **LD-A5 内容审核硬闸门**(本 PRD 不涉 · grep 仅核对 PRD-12 落地前未误引入) · `grep -rn "prisma.trendingItem.create" apps/api/src/workers/trending-scraper/` 应 0(PRD-9 已为 0)

#### Common-C · 数据契约 / migration / RLS 验证

- [ ] **prisma migration backward compatible** · `pnpm prisma migrate dev` 可重跑 idempotent · 不破已有 row · 不影响主应用 18 model
- [ ] **manual_admin_rls.sql 双向验证** · 跑 `bash scripts/audit-admin-rls-tables.sh` · 13 admin 表 RLS DISABLED + 主应用 18 表 RLS ENABLED · exit 0(R2 缓解硬门禁)
- [ ] **schema 加注释** · 13 admin model 前面加 `// @rls(disabled)` 注释(D-067 落地)· grep 验证 `grep -B 1 "^model.*Admin" prisma/schema.prisma` 含注释 ≥ 13 处
- [ ] **DATA-MODEL §13.10 兼容性** · 13 admin model 命名跟主应用 18 model 0 冲突 · `grep -E "^model " prisma/schema.prisma | sort | uniq -d` 应 0(无重复 model 名)

#### Common-D · 测试 / mock / dev 环境隔离

- [ ] **mock OAuth 不进 prod** · `grep -rn "OAUTH_PROVIDER.*mock" apps/api/.env.production` 应 0 / 文件不存在(prod env 不能含 mock 配置 · R3 致命级缓解)
- [ ] **mock UI 仅 dev 显** · `grep "import.meta.env.DEV" apps/admin/src/pages/Login.tsx` 应 ≥ 1(R3)
- [ ] **测试库隔离** · 跑 admin-integration 必用 quanan_test 库 · `grep -n "DATABASE_URL_TEST" tests/integration/admin/` 应 ≥ 1(防误污染 dev 库)

#### Common-E · verify-artifacts + commit / cleanup

- [ ] **verify-artifacts** · 每 US 完成后写 `scripts/ralph/verify-artifacts/US-XXX/manifest.json` · 含 typecheck / vitest / lint / e2e 结果(同 PRD-9 模式)
- [ ] **commit 干净** · 每 US 1-3 commit · 不含临时文件 · `git status` 在 commit 后必干净(0 untracked)
- [ ] **orphan 文件 cleanup** · US-001 monorepo 重构涉及 mv · 旧 src/* 路径 commit 删除 · `git status` 检测 0 deleted-but-not-staged · `find src/ -type f 2>/dev/null` 应 0 文件(全移到 apps/*)

#### Common-F · agent-browser 实测(US-005 / US-007 强制)

- [ ] **agent-browser 实测** · US-007 收官 必跑 `agent-browser-skill` 真浏览器测 1 次 · 路径:goto localhost:5174/login → mock login → /admin → 看 16 sidebar 域 + status bar → audit drawer 看 admin_login → logout · 截图存 `screenshots/admin-foundation-loop.png`

---

## §3 范围排除(8 项 · 详 §0 「本 PRD 暂不做」+ Assumptions §B5)

| # | 排除项 | 留 PRD / 阶段 | 理由 |
|:-:|---|:-:|---|
| 1 | WAF Cloudflare 真配置 + yaml 部署 + IP 白名单真生效 | PRR | ADMIN §7.2 + B5 假设 · 上线前法务 + IT 协调 · 本地 dev 不需 |
| 2 | MFA TOTP / WebAuthn 真启用 | PRR | ADMIN §7.3 + B5 假设 · super_admin 强制 · 涉及 speakeasy / @simplewebauthn 第三方库 + secret 存储设计 · 留 PRR |
| 3 | 钉钉 / Slack webhook 异常告警真接 | PRR | ADMIN §7.4 + B5 假设 · 涉及钉钉 bot 注册 + 签名校验 · 留 PRR |
| 4 | Google Workspace OAuth 真接(hd=quanan.com + 邮箱白名单) | PRR | ADMIN §7.1 + B5 假设 · 涉及 Google Workspace Admin SDK + client_id/secret 申请 · 留 PRR |
| 5 | admin.quanan.com 真域名 · DNS / Cloudflare Pages / 子域名隔离 | PRR | ADMIN §2.1 + B5 假设 · 涉及 ICP 备案 / DNS / CDN 配置 · 留 PRR |
| 6 | 真 Approval Gates 闭环 · approval_requests CRUD + 通知 + 二次审批 + 紧急通道 + 24h 复核 cron | PRD-13(P9.3 域 ⑬) | ADMIN §7.6 完整 middleware + 通知逻辑 · 本 PRD stub middleware 仅 throw NOT_IMPLEMENTED + audit 写入 |
| 7 | adminRouter 14 子树业务逻辑(13 子树 · 仅 auth 本 PRD 落地)· users / accounts / cost / audit / invites / reviewTrending / reviewDeepLearn / evolution / prompts / quota / compliance / approval / ab / knowledge / config | PRD-11(6 P0 业务)+ PRD-12(2 内容审核)+ PRD-13(5 P1 健康度)+ PRD-14(3 P2 高级) | ADMIN §5.1 + §8.3-§8.6 路线图 · 本 PRD 仅基础设施 + Layout 占位 |
| 8 | 16 sidebar 域真业务页面 · NSM 仪表盘 / 用户管理 / 成本仪表盘 / 等 | PRD-11~14 | 本 PRD 仅 16 placeholder.tsx 占位页 · 真业务页面跟 procedure 一一对应 |

---

## §4 风险 + 缓解(6 项 · 详 Assumptions §A5)

| # | 风险 | 严重度 | 缓解 | 触发回滚条件 |
|:-:|---|:-:|---|---|
| **R1** | monorepo 重构破坏主应用现有代码 · PRD-9 全套绿灯被打破 · 0 业务影响要求严格 | **🔴 高** | (a) US-001 全套 PRD-9 e2e 回归 · (b) AC-001-B 场景 B1 强制跑 PRD-9 e2e · (c) 改 src/ → apps/web 用 mv + path alias 渐进式 · 不一次性删 src/ 旧路径 · (d) tsconfig references 互链 + ts-prune 检测 dead code · (e) commit per US-001 step(10 步迁移)细粒度备份 | 跑 PRD-9 knowledge-rag-loop.spec.ts 失败 · 立即 git revert + 重做 |
| **R2** | manual_admin_rls.sql 副作用 · 主应用 18 表 RLS 被误关 · 数据隔离漏 | **🔴 高** | (a) SQL 用 `ALTER TABLE X DISABLE ROW LEVEL SECURITY` 显式指定 13 表 · 不用 wildcard · (b) US-007 audit-admin-rls-tables.sh 双向验证(13 表 DISABLED + 18 表 ENABLED)· (c) AC-007-B 场景 B1 收官硬检测 · (d) prisma schema 加注释 `// @rls(disabled)` 13 admin model | 主应用 RLS 任一表被误关(audit-admin-rls-tables.sh fail)· 立即 rollback SQL |
| **R3** | mock OAuth 误进 prod · 安全大漏 | **🔴 致命** | (a) `getAdminOAuthProvider()` factory · prod 必须 OAUTH_PROVIDER=google · 'mock' 时 startup throw config error · (b) `oauth-admin-mock.ts` 文件名含 'mock' · `if (import.meta.env.PROD) throw 'mock not allowed in prod'` · (c) US-007 加 grep `grep -rn "OAUTH_PROVIDER.*mock" apps/api/.env.production` 应 0(.env.production 不存在或不含 mock 配置)· (d) Login.tsx 内 "mock OAuth 登录" 按钮 `import.meta.env.DEV` 才显示 | OAUTH_PROVIDER=mock 进入 prod build · 立即 deploy block + 通知 |
| **R4** | adminRLS $transaction wrap 嵌套使用 · 死锁 / 性能差 | **🟠 中** | (a) US-003 测试 AC-003-B 场景 B3 验证不嵌套 · (b) 业务 procedure 不能再开 $transaction · 测试用 spy 验证 transaction depth=1 · (c) AC-003-P P2 < 30ms middleware 总耗时门禁 | adminProcedure P99 > 200ms 持续一周 · 调连接池或拆 $transaction wrap |
| **R5** | admin_audit_log 表爆炸 · 13 admin 高频 audit → 1 月 1M rows | **🟡 中** | (a) admin_audit_log 加 createdAt(sort: Desc) 索引 + adminUserId+createdAt 复合索引 · (b) Schema 留 `retentionDays` 字段 stub · PRR 加 cron 删除 > 90 天 · (c) 不审计读型 listMine 等高频 query(US-004 描述明确)· (d) AC-004-P P2 1000 rows 性能门禁 | admin_audit_log 单月 row > 5M · 触发 archive cron 计划 |
| **R6** | 16 sidebar 域 placeholder 路由跟 PRD-11~14 命名不一致 · 后续撞名重构 | **🟡 中** | (a) admin-routes.ts metadata array · path / label / emoji / prd / requiredRole 锁定 · 16 域路由严格按 ADMIN §3 命名(如 `/admin/nsm` `/admin/users` `/admin/cost` 等)· (b) ADMIN §8.3-§8.6 路线图复制路径 · (c) US-005 sidebar.test.tsx 6 unit 验证 16 域分组 + path | PRD-11 启动时发现 path 跟实际 procedure 命名冲突 · 改 admin-routes.ts |

---

## §5 测试配额(对齐 AGENTS §7 + ADMIN §10.5 admin 增量)

### §5.1 单元测试配额

| 来源 | 数量 |
|---|:-:|
| US-001 middleware-stubs.test.ts(6 闸 stub + auditLog stub) | 7 |
| US-001 admin-schema.test.ts(13 admin model + RLS DISABLED) | 6 |
| US-002 auth-lucia.test.ts(session lifecycle + mock/google provider + factory) | 12 |
| US-002 auth-router.test.ts(login/logout/me + zod fail + 4 happy/error) | 8 |
| US-003 roleCheck.test.ts | 6 |
| US-003 ipWhitelist.test.ts | 6 |
| US-003 mfaCheck.test.ts | 6 |
| US-003 adminRLS.test.ts(set_config + transaction + crossAccountAccessed flag) | 8 |
| US-003 approvalGateCheck.test.ts | 5 |
| US-004 auditLog-middleware.test.ts(4 类 eventType + failure path + redact) | 10 |
| US-004 admin-audit-service.test.ts(logAdminAction + idempotent) | 6 |
| US-005 layout.test.tsx(AdminLayout + topbar + sidebar + audit toggle) | 6 |
| US-005 sidebar.test.tsx(16 域 4 组 + isActive + folding) | 6 |
| US-005 audit-drawer.test.tsx(open/close/list/polling/empty) | 6 |
| **小计** | **98 新** |

### §5.2 集成测试配额(★ admin 专属类别 · 主应用之外新增)

| 文件 | 内容 |
|---|---|
| `tests/integration/admin/auth-flow.test.ts`(US-002) | 1 e2e style · seed → login → me → logout |
| `tests/integration/admin/audit-log-write.test.ts`(US-004) | 1 · 3 类 eventType 端到端 |
| `tests/integration/admin/rls-bypass-cross-account.test.ts`(US-006) | ★ 主 · 7 test case · LD-A3 核心验证 |
| **小计 9 case · 3 文件** | |

### §5.3 E2E 配额

| 文件 | 路径 |
|---|---|
| `tests/e2e/admin-foundation-loop.spec.ts`(US-007) | 1 e2e · 7 step · admin login → layout 16 域 → placeholder click → audit drawer → admin_login row → logout |
| **小计 1 新 · 累计 ≥ 165**(164 PRD-9 + 1 新) | |

### §5.4 LLM Judge 配额

| | |
|---|---|
| 本 PRD 不加 LLM Judge | admin 不调 LLM(R-A5)· 无 Specialist 输出可 judge |
| 累计 55 / 55 | 继承 PRD-9 基线 |

### §5.5 全套绿灯门禁(US-007 收官硬门禁)

```
vitest:              ≥ 987 / ≥ 987 ✓ (907 PRD-9 累计 + ≥ 80 新 unit)
test:judge:          55 / 55 ✓ (PRD-9 累计 · 本 PRD 不加)
test:admin-integration: 9 / 9 ✓ (admin 专属集成)
playwright:          ≥ 165 / ≥ 165 ✓ (164 PRD-9 + 1 admin-foundation-loop)
typecheck:           7 ws · 0 error ✓ (6 PRD-9 + apps/admin 1 新)
lint:                0 warnings (--max-warnings=0) ✓
audit-redlines-admin.sh: exit 0 · 5 LD-A + 6 R-A 全 PASS
audit-admin-rls-tables.sh: exit 0 · 13 表 RLS=false + 18 表 RLS=true
```

---

## §6 退出条件(7 项 · 对齐 ADMIN §8.2 退出条件 + AC 总和)

> **ADMIN §8.2 P9.0 退出条件原文** · super_admin 用 admin@quanan.com 登录 admin.quanan.com · 必经 OAuth + MFA · 看到空 layout · admin_audit_log 有 admin_login 记录 · WAF 拒绝非白名单 IP

| # | 退出条件 | 验证 |
|:-:|---|---|
| 1 | apps/admin SPA 骨架就绪 · super_admin(mock OAuth)能 login 看到空 Layout 16 sidebar 域占位 + 4 区域(TopBar/Sidebar/MainArea/AuditDrawer + StatusBar) | tests/e2e/admin-foundation-loop.spec.ts step 1-3 + agent-browser 实测 |
| 2 | admin OAuth 跟主应用 OAuth 完全隔离(独立 Redis namespace · 独立 session cookie · 独立 admin_users / admin_sessions 表) | tests/unit/admin/auth-lucia.test.ts + AC-002-P P1 验证 · 项目 CLAUDE.md §5.1 R-001 |
| 3 | 6 闸鉴权链(adminAuth → roleCheck → ipWhitelist → mfaCheck → adminRLS → approvalGateCheck → auditLog)实施完整 · 每闸单测齐(35+ case)· 顺序硬约束 · stub mode 端到端可跑 | tests/unit/admin/{roleCheck,ipWhitelist,mfaCheck,adminRLS,approvalGateCheck}.test.ts + AC-003-H + AC-003-B B3 验证 |
| 4 | admin_audit_log 自动写入 4 类 eventType(admin_login 由 auth.login 直接调 · cross_account_query / approval_request_create 由 middleware 触发 · approval_request_resolve 留 PRD-13 占位) | tests/integration/admin/audit-log-write.test.ts + AC-004-H/E/B 全部 |
| 5 | adminRLS bypass 跨账号查通过(LD-A3 核心 · set_config('app.role','admin') 真生效 · $transaction wrap · 主应用 RLS 不破) | tests/integration/admin/rls-bypass-cross-account.test.ts 7 test case 全 pass + audit-admin-rls-tables.sh 双向验证 |
| 6 | 16 sidebar 域占位 path 严格按 admin-routes.ts metadata · 跟 PRD-11~14 路线图 path 一致(no 撞名)· 4 分组排序按 ADMIN §3 · 每占位页含 "PRD-XX 待落地" 标记 | tests/unit/admin/sidebar.test.tsx 6 unit + ls apps/admin/src/pages/admin/placeholder/*.tsx wc -l=16 |
| 7 | lint clean(--max-warnings=0)+ typecheck 0(7 ws)+ vitest 987+ + admin-integration 9 + e2e 165+ + audit-redlines-admin.sh 全 PASS · US-007 收官 manifest.json 写入完整 metric | US-007 verify-artifacts 完整 + AC-007-H 收官命令 |

**总和验收清单**:
- [ ] ADMIN §8.2 退出条件 super_admin 登录 + 空 layout + admin_audit_log admin_login row 已验证(stub 模式 · OAuth/MFA/WAF 标 stub 状态在 StatusBar 显示)
- [ ] PRD §2 全部 AC-XXX-H 通过(7 个)
- [ ] PRD §2 全部 AC-XXX-E 通过(7 × ≥1 关键错误场景)
- [ ] PRD §2 全部 AC-XXX-B 通过(7 × ≥1 关键边界)
- [ ] PRD §2 全部 AC-XXX-P 满足性能阈值(7 × ≥1 性能)
- [ ] §5 测试配额全部达成(unit 98 + admin-integration 9 + e2e 1 = 108 new)
- [ ] LLM Judge 不涉及(本 PRD admin 不调 LLM · R-A5)
- [ ] AGENTS §10 红线 0 触发(grep audit-redlines-admin.sh 全 PASS)
- [ ] §4 风险 R1-R6 无未缓解项(US-001 加 PRD-9 回归 + US-007 加 RLS 双向验证 + R3 startup gate)

---

## §7 Locked Decisions(D-059 ~ D-068 · 跨 PRD 编号延续 · D9 假设)

> **跨 PRD 编号延续规则** · D-001~D-058 已用(PRD-1~9)· PRD-10 从 **D-059** 起(D9 假设确认)· 不重置。

| 编号 | 决策 | 理由 | 替代选项(为什么不选) |
|:-:|---|---|---|
| **D-059** | apps/admin 跟 apps/web 独立 SPA build · 用 vite 5 + React 18 + tailwind + Aurelian Dark base 复用 packages/ui/base/ + 新 packages/ui/admin/ 密集模式 | LD-A1 + ADR-021 强制独立 build · 复用 base tokens 减少视觉漂移 + admin 密度模式独立 tokens · build target dist-admin / dist-web 分离 | 嵌入主应用单 SPA 用 `/admin` 子路径(违反 LD-A1 + 6 类边界破坏 D 之 b)· 完全独立用 Next.js / Remix(技术栈不一致 · 团队学习成本) |
| **D-060** | lucia-auth admin 复用 lib 不重写 · 新建 `lucia-admin.ts` adapter PrismaAdapter(admin_sessions/admin_users)· 独立 Redis namespace `admin:session:*` · session ttl 12h · idle 30min | LD-A1 + ADMIN §7.1 · 库复用减开发量 · namespace 隔离防 session 串台 · 12h+30min 平衡安全/体验 | 重写一套 admin auth lib(浪费 · 维护成本高)· 用主应用 lucia 加 isAdmin flag(违反 namespace 隔离硬约束)· session ttl 24h+ idle 1h(安全过低 · 跟决策 4=B super_admin 强 MFA 不匹配) |
| **D-061** | OAuth provider factory 模式 · `getAdminOAuthProvider()` 读 env OAUTH_PROVIDER · 'mock'(dev only · `import.meta.env.DEV` 才显示登录按钮)+ 'google'(prod · stub throw 'PRR config required')· prod startup gate(OAUTH_PROVIDER=mock 时 throw) | R3 缓解 · mock OAuth 误进 prod 致命 · 多层防护(factory startup gate + UI 按钮 isDev + 文件名 'mock' 显式)· 留 PRR 真接 google provider | 直接写 mock provider 不留 google stub(留 PRD-15+ 时再加 · 但 stub 占位更清晰)· 不做 factory pattern 用 if-else(prod 漏检风险) |
| **D-062** | adminRouter 树结构 · `apps/api/src/trpc/routers/admin/{index.ts, auth.ts, audit.ts, [13 子树留 PRD-11+]}` · 6 闸链统一在 `apps/api/src/trpc/procedures/admin.ts` 定义 `adminProcedure` · 业务 procedure 用 adminProcedure 链 · health stub 用 t.procedure 不带鉴权 | LD-A2 router 严格分离 + 链统一减重复 · adminProcedure 写一次复用 · health 不带鉴权方便 prod 健康检查 | 每 procedure 各自挂 middleware chain(违反 DRY · adminProcedure 一处改 N 处生效)· 全部 procedure 包括 health 都走链(health 健康检查不应需鉴权 · prod load balancer 直接挂) |
| **D-063** | adminRLS middleware 用 `$transaction wrap + $executeRawUnsafe set_config('app.role','admin',true)` 类比主应用 accountIsolation pattern(C7 假设)· LOCAL=true 仅事务内生效 · 不污染连接池 | LD-A3 + 主应用 pattern 复用(2026-04-21 PRD-2 落地的 accountIsolation)· LOCAL=true 防连接池污染(R4 缓解)· $transaction wrap 异常自动 rollback(AC-006-E E2) | 用 prisma client per-account(连接池爆炸)· 用 SET(global · 污染连接池)· 不 wrap transaction(异常不 rollback 中间态污染) |
| **D-064** | admin_audit_log 4 类 eventType + 4 类 eventCategory 分离 · eventType=`admin_login\|cross_account_query\|approval_request_create\|approval_request_resolve` · eventCategory=`auth\|data_access\|approval\|admin_action`(留扩展 security_alert future)· 仅 4 类落地 · 其他 enum 占位留 PRD-11+ | LD-A3 + ADMIN §7.5 全量审计 + 项目 CLAUDE.md §5.1(admin 审计仅 append · 不 UPDATE/DELETE)· 4 类分离让 PRD-11 审计查询时 facet filter 更准确 · enum 占位让 schema migration 一次到位 | 单一 eventType 字段 string(不结构化 · query 慢)· event 字段全打散到 N 个 bool 字段(schema 暴胀) |
| **D-065** | approvalGateCheck middleware stub 版 · `meta.requiresApproval=true` 时 throw NOT_IMPLEMENTED + 写 admin_audit_log eventType='approval_request_create' status='stub_rejected' · 不创建 approval_requests row · PRD-13 真闭环时 status 改 'pending' + 创建 row + 通知审批人 | LD-A4 + ADR-020 + 项目 CLAUDE.md §5(质量第一 · stub 仍写完整 audit · 不简化路径)· stub 让本 PRD audit 完整闭环(eventType 4 类全测试)· PRD-13 升级仅改 status + 通知逻辑 · 不破坏 schema | stub 不写 audit_log(PRD-13 时少一个 eventType 的测试)· stub 创建空 approval_requests row(状态混乱 · 后续清理麻烦)· stub 时直接放行不 throw(违反 LD-A4 高风险硬约束) |
| **D-066** | 16 sidebar 域 metadata 在 `apps/admin/src/lib/admin-routes.ts` 集中 array · path / label / emoji / prd(PRD-11/12/13/14)/ requiredRole / summary(从 ADMIN §3 复制 1 行)· sidebar.tsx 读此 metadata 渲染 · 16 placeholder.tsx 读此渲染占位内容 | R6 缓解 · 集中 metadata 防路径不一致 · sidebar + placeholder 共用 source of truth · PRD-11 启动时只改 metadata + 落业务页(0 sidebar 改动) | 16 域硬编码 sidebar.tsx + 16 placeholder 各自写 path(漂移源)· 用文件名约定 path(放 path 锁不住业务命名) |
| **D-067** | 13 admin 表 RLS DISABLE 用 manual_admin_rls.sql 单文件 · 跟 prisma migration `admin-init` 分离 · 跑顺序 `pnpm prisma migrate dev → pnpm prisma db execute --file manual_admin_rls.sql` · 含 helper SQL function `enable_admin_rls()` / `disable_admin_rls()`(调试 prod 用)· schema.prisma 加注释 `// @rls(disabled)` | LD-A3 + DATA-MODEL §13.8 · prisma migration 不支持 DISABLE RLS 自动生成 · 手写 SQL 显式 · helper function 让 prod 调试方便切换 · 注释让代码 review 时清楚 | 改 prisma 加自定义 attribute(prisma-extensions 复杂 · 维护成本高)· 用 raw SQL 嵌入到 migration init(混杂 · 不清晰) |
| **D-068** | apps/admin Layout 用 grid 模板 · TopBar 60px(高于主应用 main 72px 实际是更紧凑 · 按 ADMIN §6.1 admin 密度模式)+ Sidebar 240px + Main 自适应 + AuditDrawer 320px slide-from-right portal + StatusBar 24px bottom · Aurelian Dark base tokens + admin tokens override(row-height 32 / font-size 13) | ADMIN §6.1 + D-059 admin 密度模式 · 紧凑 + 数据可视化优化 · 60/240/320/24 dim 跟主流 enterprise admin 一致(Salesforce Lightning / Atlassian 等) | 复用主应用 main layout(密度过松 · admin 信息量大撑不开)· 240px sidebar 折叠 56px(本 PRD 不实施 · stub 模式默认展开 · 折叠留 PRR · D-068 仅锁定展开模式 dim) |

### §7.1 继承前序 LD(不重复 · 仅引用)

- **继承 D-009 RLS**(主应用 18 表强制 RLS · LD-009 / AGENTS §3)· PRD-10 不动主应用 RLS · 仅加 13 admin 表 DISABLE
- **继承 D-017 LLMGateway 唯一**(LD-005)· PRD-10 admin 不调 LLM(R-A5)· 跟 D-017 隔离
- **继承 D-019 model 不硬编码**(D-019)· PRD-10 admin 不调 LLM · 跟 D-019 隔离
- **继承 D-024 cost_log eventType 区分**(D-024 PRD-4)· admin_audit_log 是 admin 独立表 · 跟 cost_log 隔离不共用 schema
- **继承 D-031 LS namespace**(D-031 PRD-5)· admin SPA 用独立 LS namespace `admin_acc_{adminUserId}_*`(不跟 main acc_{accountId} 共用)
- **继承 D-038 同步调用模式**(D-038 PRD-7+)· admin auditLog middleware 同步写(避免测试 flaky · PRR 可异步化)
- **继承 D-054/D-058 RAG**(D-054 / D-058 PRD-9)· admin 不调 RAG · 跟决策隔离
- **继承 LD-A1~LD-A5**(AGENTS §10.1 · 本 PRD 第一次完整落地这 5 条 LD)

---

## §8 反例库自动注入(ralph skill 转 prd.json 时关键词命中)

> **机制** · ~/.claude/scripts/ralph/ralph.py + ralph-tools.py reject 自动入库 · prd skill 转 prd.json 时按关键词检索 · 注入到 anti_patterns 字段

### §8.1 关键词命中清单(PRD-10 US 全继承 35+ 反例)

| 关键词 | 命中 reject 反例(数)|
|---|:-:|
| `admin` / `adminProcedure` / `adminRouter` | REJ-013(protectedProcedure)+ REJ-008(prisma 必带 accountId · adminRLS bypass 例外)+ AGENTS §10.1 LD-A1~A5 · = 5 |
| `lucia` / `session` / `oauth` | REJ-013 + REJ-008 + AGENTS §10 + 项目 CLAUDE.md §5.1 R-001 = 4 |
| `rls` / `set_config` / `executeRaw` | REJ-009(executeRaw 仅 middleware)+ REJ-008(prisma accountId)+ LD-A3 = 3 |
| `audit_log` / `admin_audit_log` | LD-A3 + R-A4(audit 仅 append)+ §10.1 LD-A4(approval 必关联 audit)= 3 |
| `approval` / `requiresApproval` | LD-A4 + AGENTS §10.3 14 高风险 + ADR-020 = 3 |
| `monorepo` / `workspace` / `apps/web` / `apps/admin` | R-A1(web/admin 不互相 import)+ R-A2(web 不暴露 admin 入口)+ R-A5(admin 不调 LLM)+ ADR-019 = 5 |
| `prisma` / `migration` / `schema` | REJ-008 + REJ-009 + REJ-013 + LD-A5 = 4 |
| `middleware` / `pipeline` / `procedure` | LD-A2 + LD-A3 + LD-A4 + REJ-009 = 4 |
| `layout` / `sidebar` / `topbar` | REJ-010(LS namespace)+ REJ-035(LS-first dual-write)= 2 |
| `mock` / `stub` | R3 风险 + D-061(mock OAuth 误进 prod 致命)· 项目 CLAUDE.md §5(stub 仍写完整 audit 不简化)= 3 |

### §8.2 anti_patterns 注入示例(US-001 内会自动注入)

```json
{
  "id": "US-001",
  "anti_patterns": [
    { "source_prd": "QuanAn-base", "source_story": "REJ-008", "lesson": "prisma 查询必带 accountId 过滤(除 adminRLS bypass 例外)", "antipattern": "❌ ctx.prisma.history.findMany({})  // 主应用 RLS 默认全挡 + admin 应走 adminPrisma", "correct": "✅ admin 跨账号查必走 ctx.adminPrisma + adminRLS middleware · 主应用查必带 where: { accountId: ctx.activeAccountId }" },
    { "source_prd": "QuanAn-base", "source_story": "REJ-009", "lesson": "$executeRawUnsafe / $queryRawUnsafe 仅 middleware 允许 · 业务代码禁用", "antipattern": "❌ adminProcedure.mutation 内直接 ctx.prisma.$executeRawUnsafe('UPDATE ... WHERE ...')", "correct": "✅ raw SQL 仅在 adminRLS / accountIsolation middleware · 业务用 prisma client typesafe API" },
    { "source_prd": "QuanAn-PRD-10", "source_story": "LD-A1", "lesson": "admin OAuth / session 跟主应用完全隔离", "antipattern": "❌ apps/admin 复用 QUANQN_WEB_CLIENT_ID OAuth · 或共享 app:session: Redis namespace", "correct": "✅ apps/admin 用 QUANQN_ADMIN_CLIENT_ID + admin:session: namespace · 独立 Redis key + 独立 admin_users / admin_sessions 表" }
  ]
}
```

```json
{
  "id": "US-003",
  "anti_patterns": [
    { "source_prd": "QuanAn-PRD-10", "source_story": "LD-A2", "lesson": "adminRouter 跟 appRouter 严格分离 · 不互相 import", "antipattern": "❌ apps/api/src/trpc/routers/admin/users.ts import { history } from '@/trpc/routers/app/history.ts'", "correct": "✅ admin 跨表查统一走 prisma client + adminRLS middleware · 不调主应用 router procedure" },
    { "source_prd": "QuanAn-PRD-10", "source_story": "LD-A3", "lesson": "admin 跨账号查必走 adminRLS bypass + 必写 admin_audit_log cross_account_query", "antipattern": "❌ adminProcedure 内 ctx.prisma.findMany({}) 直接绕过 RLS · 或不写 audit", "correct": "✅ ctx.adminPrisma.findMany({}) 由 adminRLS middleware 注入 + auditLog 后置自动写 cross_account_query event" }
  ]
}
```

```json
{
  "id": "US-007",
  "anti_patterns": [
    { "source_prd": "QuanAn-PRD-10", "source_story": "R3-D061", "lesson": "mock OAuth 不可进 prod · multi-layer 防护", "antipattern": "❌ 改 oauth-admin-factory.ts 让 prod OAUTH_PROVIDER=mock 也走 · 或 Login.tsx mock 按钮 prod 仍显示", "correct": "✅ factory startup throw 'mock not allowed in prod' + Login.tsx import.meta.env.DEV 才显示 mock 按钮 + grep 验证 .env.production 不含 mock" },
    { "source_prd": "QuanAn-PRD-1", "source_story": "REJ-013", "lesson": "protectedProcedure / adminProcedure 必经 · 不能用 t.procedure 直接挂业务", "antipattern": "❌ apps/api/src/trpc/routers/admin/users.ts: list = t.procedure.query(...)  // 没经 adminProcedure", "correct": "✅ list = adminProcedure.query(...) · 6 闸鉴权 + auditLog 全经过" }
  ]
}
```

### §8.3 PRD-9 retro 沉淀继承(Diff-2 / Diff-3 / Diff-4 升级建议)

- **Diff-2 daemon timeout robust handling** · 本 PRD US-001 monorepo 重构是大 IO + 13 table migration 可能耗时长 → 监控 dev/validator agent 超 30min 无输出 · 拆分 US-001 内部子步(10 步迁移每步 commit)
- **Diff-3 cleanup 自动化** · 本 PRD orphan 文件可能多(monorepo 重构)· US-007 收官 必跑 `git status` 严格检查 + 删 orphan src/ 旧路径
- **Diff-4 audit gate 5 min lockfile** · 本 PRD foundation 档 US-001 多人 audit 风险 · 严守 watch-audit lockfile + 5 min stale 检测

---

## §10 跟 Coding 3.0 的协同协议(★ admin 专属扩展 · 对应 PRD-MASTER §2.1 §7)

> 每份 PRD 显式声明跟 prd skill / ralph / Opus audit / goal-verify / prd-retro 的协议 · 让 Opus 知道在每个步骤检查什么。本 PRD foundation 档 · audit 协议比 medium 档加严。

### §10.1 工具链每步协议

| 步骤 | 本 PRD 在该步的输入 / 输出 |
|---|---|
| `prd skill` 写 PRD | 输入 ARCHITECTURE / ADMIN-ARCHITECTURE / DATA-MODEL / AGENTS §10 / ADR-019/020/021 · 输出本文件 tasks/prd-10.md(seed 文档 · 1200-1500 行)· 已经完成 |
| `ralph skill` 转 prd.json | 输入 tasks/prd-10.md · 输出 scripts/ralph/prd-10.json + cp prd.json · 关键转换:7 US → 7 story · risk_level 严格按 §1 标(US-001 foundation / US-002/003/006 high / US-004/005/007 medium)· depends_on 严格按 §1 declarations · anti_patterns 关键词自动注入 (§8 命中清单 grep reject-examples.jsonl) · meta 加 prd='PRD-10' workspace='apps/api' or 'apps/admin' |
| `/plan-check` | 检查 7 项门禁:(1) §1 7 US 完整 + risk_level 4 档分布合理(foundation 1 + high 3 + medium 3) · (2) §2 AC 4 类齐 (28 个 AC) · (3) §3 范围排除 8 项 + 跟 §1 不矛盾 · (4) §4 风险 6 项 + 缓解 + 触发回滚条件齐 · (5) §5 测试配额合理(unit 98+ / admin-integration 9+ / e2e 1+) · (6) §6 退出条件 7 条 · (7) §7 LD 编号正确(D-059~D-068 · 不跟 D-001~058 撞)+ §8 反例库注入示例 ≥ 3 |
| `ralph.py --daemon --model sonnet` | 读 prd.json · 按 risk_level(foundation 单跑 wave-1)+ depends_on(US-001 → US-002~005 wave-2 → US-006/007 wave-3) 拓扑执行 · 每 US 完成自动 commit · audit-gate.json(pending) 等 Opus |
| Opus audit(每 story 后) | 看 §2 AC 4 类是否过(每 US H/E/B/P 全过)· 看 AGENTS §10 红线 5 LD-A + 6 R-A 全 0 hits(grep audit-redlines-admin.sh)· 看 ADMIN §8.2 退出条件是否在 §6 完整 · 看 §10.3 risk_level 分档审深度(US-001 foundation → 最深审 §0 §F4/F5/G + 全部 §10.4 audit_commands × 5 类)· 看 LD-A3 跨账号查必带 adminRLS(AST 检测) |
| `/goal-verify` | §0 先跑 /gsd-map-codebase × N(apps/web / apps/admin / apps/api / packages/*) 生成 .planning/codebase/ 7 文件 · §1+ Goal-backward 验证:对比 §1 US 描述 vs 实际代码 · 对比 §6 退出条件 vs 实测 · 对比 AGENTS §10 5 LD-A vs 实际 audit grep · 对比 ADMIN §8.2 退出条件 vs admin SPA 实测(super_admin 真跑一遍 login → layout → audit drawer) |
| `/prd-retro` | 跟 PRD-9 复盘对比 · 8 维度:(1) story 拆分粒度 · (2) risk_level 准确率 · (3) audit deviation 数 · (4) cost 实际 vs 估 · (5) timeline 实际 vs 估 1w · (6) reject 反例新增数 · (7) TD 新增 / 关闭 · (8) Codebase Patterns 沉淀(monorepo 改造经验 + admin 6 闸链 pattern)· 回传 ~/.claude/playbooks/reject-examples.jsonl + progress.txt |

### §10.2 risk_level 分档审 + Opus audit 深度(对应 OPUS-AUDIT-CHEATSHEET §Z)

| US | risk_level | downstream count | foundation 升档证据 | Opus audit 深度 |
|---|:-:|:-:|:-:|---|
| US-001 | **foundation** | 6 | 全 6 后续 US 都 depends_on(US-002/003/004/005/006/007)+ 跨 4 下游 PRD(PRD-11/12/13/14)依赖 monorepo + 13 admin model | §0 4 项实测 + §F4(协议锁 vs 既有代码现状)+ §F5(monorepo 改造前后回归)+ §G(LD-A 5 全 grep + R-A 6 全 grep)+ 全部 §10.4 audit_commands × 5 类 · ~15 min 深审 |
| US-002 | high | 5(US-003/004/005/006/007)| 不升 foundation(downstream-direct < 3 · 仅 US-003 直接调 auth)| §0 + 通用 4 维度 + 域 grep(lucia / session / oauth / mock factory)+ 关键函数阅读 · ~8 min 标审 |
| US-003 | high | 4(US-004/005/006/007)| 不升 foundation | §0 + 通用 + adminRLS / approvalGate / roleCheck / mfaCheck grep + 6 闸顺序硬验证 · ~10 min |
| US-004 | medium | 3(US-005/006/007)| 边缘升档 · 但 US-005/007 主要 depends_on US-002 而非 US-004 audit · 保 medium | §0 + 通用 + cross_account_query / redact / failure path grep · ~5-8 min |
| US-005 | medium | 2(US-006 实际 depends_on US-003 而非 005 · 仅 US-007 直接验证 Layout)| 保 medium | §0 + 通用 + 16 sidebar / placeholder count(=16)+ admin-routes.ts metadata · ~5 min |
| US-006 | high | 1(US-007)| 高风险数据 + LD-A3 核心验证 · 但下游单 | §0 + 通用 + adminRLS / set_config / current_setting / crossAccountAccessed flag grep + SQL 实测 · ~10 min |
| US-007 | medium | 0 | 收官 · 走全套门禁 + manifest 写入 | §0 + 通用 + 全套门禁验证 + agent-browser 实测 · ~8 min |

### §10.3 PRD-10 完成后 Audit Pattern 总和(对应 §10.4 admin audit_commands 5 类)

**§10.4.1 LD-A 检测**(收官 US-007 必跑):
```bash
# LD-A1 · admin OAuth 独立
grep -rn "QUANQN_WEB_CLIENT" apps/admin/ || echo "OK · LD-A1"

# LD-A2 · adminRouter / appRouter 严格分离
grep -rn "from.*routers/app" apps/api/src/trpc/routers/admin/ || echo "OK · LD-A2-1"
grep -rn "from.*routers/admin" apps/api/src/trpc/routers/app/ || echo "OK · LD-A2-2"

# LD-A3 · admin 跨账号查必带 adminRLS
node scripts/audit-admin-rls.ts && echo "OK · LD-A3"

# LD-A4 · 14 类高风险动作必带 requiresApproval(本 PRD stub · 仅占位检测)
node scripts/audit-approval-gates.ts && echo "OK · LD-A4(stub)"

# LD-A5 · TrendingScraper / FileParser 不直接写主表
grep -rn "prisma.trendingItem.create" apps/api/src/workers/trending-scraper/ || echo "OK · LD-A5"
grep -rn "prisma.deepLearningArchive.create" apps/api/src/workers/file-parser/ || echo "OK · LD-A5"
```

**§10.4.2 R-A 红线检测**:
```bash
bash scripts/audit-redlines-admin.sh && echo "ALL PASS · 6 R-A"
```

**§10.4.3 admin 集成测试**(US-006 主跑 · US-007 收官重跑):
```bash
pnpm --filter @quanan/api test:admin-integration  # rls-bypass-cross-account.test.ts 7 case
pnpm test:e2e tests/e2e/admin-foundation-loop.spec.ts  # US-007 收官 e2e
```

**§10.4.4 admin 审计闭环检测**:
```bash
# 跨账号查必写 admin_audit_log(US-006 集成测试 + 端到端 sanity)
node scripts/audit-cross-account-query.ts  # AST 检测 · stub · PRD-11 真接

# 高风险动作必带 approvalRequestId 关联(本 PRD stub mode · 仅占位)
node scripts/audit-approval-link.ts  # stub
```

**§10.4.5 部署前 gate**(本 PRD 不部署 prod · 仅 CI 占位):
```bash
# admin SPA 上 prod 前必检(PRR 真接 · 本 PRD CI placeholder)
test -f infra/cloudflare-waf-admin.yaml.template && echo "PRR template OK"
# grep -q "MFA_REQUIRED.*true" apps/admin/.env.production  # PRR 真接
# grep -q "QUANQN_ADMIN_CLIENT_ID" apps/admin/.env.production  # PRR 真接
```

### §10.4 数据库 schema 验证(R2 + AC-001-B B2 落地)

```bash
# 13 admin tables RLS DISABLED · 主应用 18 表 RLS ENABLED · 双向验证(US-007 收官)
bash scripts/audit-admin-rls-tables.sh

# 期望输出:
# 13 admin tables · RLS DISABLED · OK
#   - admin_audit_log: false
#   - approval_requests: false
#   - admin_users: false
#   - admin_sessions: false
#   - prompt_versions: false
#   - prompt_canary_config: false
#   - user_quota: false
#   - quota_adjustment_log: false
#   - trending_review_queue: false
#   - deep_learn_review_queue: false
#   - admin_invite_campaign: false
#   - admin_constants: false
#   - admin_config: false
#   - admin_ab_experiment: false
# 18 main app tables · RLS ENABLED · OK
#   - users / accounts / ip_account / history / cost_log / ... 18 tables 全 true
```

---

## §11 跟 PRD-11~14 接入预备(★ admin 后续 PRD 启动协议)

> 本 PRD 是 admin foundation · 后续 PRD-11/12/13/14 全 depends_on 此。本节明确"PRD-10 完成 → PRD-11 启动"的接入点。

### §11.1 PRD-11 启动协议(6 个 P0 业务核心域 · 3 周)

**PRD-10 必交付的 PRD-11 启动前置**:
- ✅ apps/admin SPA 骨架 + AdminLayout(US-005)· PRD-11 加业务页只填 placeholder 内容
- ✅ 6 闸鉴权链 + adminProcedure(US-003)· PRD-11 业务 procedure 直接挂 adminProcedure
- ✅ adminRLS bypass(US-003+006)· PRD-11 业务跨账号查直接 ctx.adminPrisma
- ✅ admin_audit_log 4 类 eventType(US-004)· PRD-11 业务 procedure 完成 auditLog middleware 自动写 eventType='request_completed' 或 'cross_account_query'
- ✅ 13 admin tables RLS DISABLED + schema 就位(US-001)· PRD-11 业务不动 schema · 仅查
- ✅ admin-routes.ts metadata(US-005 · D-066)· PRD-11 加业务页:替换 placeholder.tsx 为真业务页 · sidebar 不动
- ⏳ PRD-11 加 7 个新 adminRouter 子树(users / accounts / cost / audit / invites / nsm 仪表盘共享)· 改 apps/api/src/trpc/routers/admin/index.ts 挂新子树
- ⏳ PRD-11 加 6 业务页(NSM 仪表盘 / 用户管理 / IP 账号管理 / 成本仪表盘 / 审计日志查询 / 邀请码管理)· 替换 6 placeholder.tsx
- ⏳ PRD-11 触发 Approval Gates 闭环 stub 升真(域 ⑬ 留 PRD-13)· 本 PRD approvalGateCheck stub throw NOT_IMPLEMENTED · PRD-11 仍 throw + 写 audit · PRD-13 真接

**PRD-11 必带的 verification**:
- 6 闸链每 procedure 必经(LD-A2 grep + AST)
- 跨账号查必经 adminRLS + audit(LD-A3 grep + AST)
- 高风险 procedure(banUser / changePlan / invite batchInvalidate)必带 meta.requiresApproval=true(LD-A4 stub PRD-13 真接)

### §11.2 PRD-12 启动协议(2 个 P0 内容审核域 · 2 周)

**PRD-10 必交付的 PRD-12 启动前置**:
- ✅ trending_review_queue + deep_learn_review_queue schema(US-001 含 13 admin model)· PRD-12 业务直接用
- ⏳ PRD-12 改 TrendingScraper Worker / FileParser Worker · LD-A5 硬闸门 · 直接 .create(trending_review_queue) status=pending 不再写主表
- ⏳ PRD-12 加 2 业务页(TrendingItem 审核 / DeepLearning 审核)· 替换 2 placeholder.tsx
- ⏳ PRD-12 加 2 adminRouter 子树(reviewTrending / reviewDeepLearn)

### §11.3 PRD-13 启动协议(5 个 P1 健康度域 + Approval Gates 真闭环 · 2 周)

**PRD-10 必交付的 PRD-13 启动前置**:
- ✅ approval_requests schema(US-001 含)· PRD-13 直接用
- ✅ approvalGateCheck middleware stub(US-003)· PRD-13 升真闭环
- ✅ admin_audit_log eventType='approval_request_create' / 'approval_request_resolve'(US-004)· PRD-13 完整闭环时 status=pending → approved/rejected
- ⏳ PRD-13 真接 approvalGateCheck 创建 row + 通知审批人 + 二次审批 + 紧急通道 + 24h 后置复核 cron(ADR-020 完整)
- ⏳ PRD-13 加 5 业务页(进化档案监控 / Prompt 版本管理 / 配额管理 / 合规仪表盘 / Approval Gates 工作流)
- ⏳ PRD-13 加 5 adminRouter 子树(evolution / prompts / quota / compliance / approval)

### §11.4 PRD-14 启动协议(3 个 P2 高级域 · 1 周 可后续)

**PRD-10 必交付的 PRD-14 启动前置**:
- ✅ admin_ab_experiment / admin_constants / admin_config schema(US-001 含)
- ⏳ PRD-14 加 3 业务页(A/B 测试 / 常量管理 / 系统配置中心)
- ⏳ PRD-14 加 3 adminRouter 子树(ab / knowledge / config)
- ⏳ PRD-14 域 ⑯ 系统配置中心 emergencyStop · 复用 PRD-13 紧急通道 · 1 click + 后置 24h 复核

### §11.5 跨 PRD 11~14 共用 Audit Commands(本 PRD §10.3 落地的 scripts/audit-* 全继承)

| 脚本 | 本 PRD(US-007 写)| PRD-11+ 继承使用 |
|---|---|---|
| `scripts/audit-redlines-admin.sh` | 落地 6 R-A | 加新业务 procedure 后再跑 · 验证 0 红线触发 |
| `scripts/audit-admin-rls.ts`(AST) | 落地 例外 ['auth.login', 'auth.logout', 'health'] | 新增 admin procedure 必经 adminRLS · 例外列表只加不删 |
| `scripts/audit-approval-gates.ts`(AST) | 落地 14 高风险名单 stub 验证 | PRD-11+ 真高风险 procedure 写入时验证 meta.requiresApproval=true |
| `scripts/audit-admin-rls-tables.sh` | 落地 13 表 + 18 表双向验证 | 加新 admin table(若有)必加入 13 表清单 |
| `scripts/audit-cross-account-query.ts` | stub 占位 | PRD-11 业务跨账号查真落地 + 加深度 WHERE 解析 |

### §11.6 跨 PRD admin 共用 Codebase Patterns(预沉淀给 §10 retro · PRD-10 完成后 progress.txt 写入)

预计沉淀(US-007 收官 + /prd-retro 提炼):
- **Pattern · admin 6 闸链 procedure 模板** · adminProcedure 用法 + meta 字段(requiredRole / requiresApproval / actionType / riskLevel)写法 · PRD-11~14 业务 procedure 直接复用
- **Pattern · adminRLS bypass 跨账号查** · ctx.adminPrisma 用法 + crossAccountAccessed flag 检测 · PRD-11~13 业务跨账号查统一模式
- **Pattern · admin_audit_log 自动写入** · auditLog middleware 后置 + 业务 procedure 不手挂 · 4 类 eventType 分类规则
- **Pattern · admin SPA Layout 集成** · 16 域 placeholder → 真业务页面替换协议(改 admin-routes.ts metadata + 替换 placeholder.tsx · sidebar 自动 picks up)
- **Pattern · monorepo workspace 改造** · 10 步迁移协议(脚本 scripts/migrate-monorepo.sh)· 后续 packages/ 或 apps/ 加新模块时复用

---

## §9 修订记录

- **2026-05-12 v0.1** · 初稿(prd skill 写完整版 · 1200-1500 行 · 不简化 · 详细度优先 · 全局 CLAUDE.md §5 质量第一不简化)· Opus 主对话 · 用户已 review Assumptions 8 项 / 4 类 ✅ 全确认(A 技术 4 + B 范围 7 stories + C 实现 4 + D 工作流 2)
- 章节统计(预估) · §0 引用清单(120 行)· §1 US-001~007(740 行)· §2 AC + Common(370 行)· §3 排除(20 行)· §4 风险(30 行)· §5 配额(70 行)· §6 退出(40 行)· §7 LD D-059~068(85 行)· §8 反例库注入(70 行)· §10 Coding 3.0 协同(110 行 · admin 专属扩展)· §11 PRD-11~14 接入预备(120 行)· §9 修订(15 行)= 总 ~1790 行(超 1500 上限 · 收官按需精简 · 或保 1500+ 当 seed 高密度版本)
- 跨 PRD 决策 D-NN · D-001 ~ D-058 已用(PRD-1~9)· PRD-10 从 **D-059 ~ D-068**(10 个新)· 跟 D9 假设确认一致 · 不重置
- 分支策略 · 沿用 main(== ralph/prd-9-p8-knowledge-base-rag · 同 commit 1a1300f)· progress.txt 继续累积 · 跟 D10 假设确认一致
- 等下步 · ralph skill 转 prd.json + /plan-check 7 项门禁 + SOP §9.1 5 步启 daemon + Monitor 必启(项目 CLAUDE.md §9.1 硬规则)+ PRD-10 是首个 admin PRD · 整体 audit 必走 §10.2 risk_level 分档审表(US-001 foundation 15 min 深审 · US-002/003/006 high 8-10 min · US-004/005/007 medium 5-8 min · 总 audit ~55-65 min · 7 US 收官)

---

> **本文件由 prd skill(Opus 主对话)在 Assumptions 模式经用户全 ✅ 确认后写出 · 完整版 · 不简化 · seed 文档标准 · 等 ralph skill 转 prd.json + /plan-check 7 项门禁 + SOP §9.1 5 步启 daemon。**
