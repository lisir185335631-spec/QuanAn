# Codebase Structure — apps/api

**Analysis Date:** 2026-05-13
**Scope:** `apps/api/src/` 18 顶级子目录 · 173 src `.ts` 文件 · 16 测试 `.test.ts` 文件 · ~19.5k 行

## Directory Layout

```
apps/api/
├── .env.example                # 文档化必需 env vars(主 + admin + LLM + 钉钉)
├── package.json                # @quanqn/api workspace · dev/start/build/lint scripts
├── tsconfig.json               # extends base · paths 映射 @/* → src/* + @quanqn/* workspace
├── scripts/
│   └── seed-knowledge-chunk.ts # 知识库 chunk seed(KnowledgeChunk 表)
├── test-results/               # vitest 输出 · 不进 git
└── src/
    ├── index.ts                # ← HTTP server entry · 336 行 · 双 CORS + 双 tRPC mount + OAuth REST + cron register
    ├── agents/                 # 业务 Agent(主应用 · 跟 specialists/ 有部分重叠 · 历史迁移痕迹)
    │   ├── base/types.ts
    │   ├── evolution/EvolutionAgent.ts
    │   └── specialists/        # CopywritingAgent + DailyTaskAgent(子集)
    ├── audit/                  # (空目录 · 仅 .gitkeep · 留位)
    ├── cron/
    │   ├── .gitkeep
    │   ├── index.ts
    │   └── daily-task-runner.ts  # node-cron · 0 0 * * * Asia/Shanghai
    ├── jobs/
    │   └── admin/              # admin BullMQ cron jobs(PRD-11)
    │       ├── kpi-snapshot.job.ts     # daily/weekly/monthly · 跑 computeSnapshot
    │       ├── cost-anomaly.job.ts     # 每小时 *:15 · 跑 detectCostAnomalies
    │       ├── anomaly-detection.job.ts # 每日 5am · 跑 detectAccountAnomalies
    │       └── __tests__/
    ├── lib/                    # 共享 lib
    │   ├── admin/              # admin 子系统 lib
    │   │   ├── constants.ts    # ADMIN_ROLES + ADMIN_ROLE_HIERARCHY + AUDIT_EVENT_* + TTL ms
    │   │   ├── types.ts        # AdminUser / AdminSession / AdminAuditLogEntry
    │   │   └── audit-helpers.ts # redactSensitiveFields + extractActionType
    │   ├── auth/
    │   │   ├── adapter.ts            # 主应用 Lucia Prisma adapter
    │   │   ├── lucia.ts              # 主 Lucia 实例(app_session)
    │   │   ├── lucia-admin.ts        # admin Lucia 实例(admin_session_id · 12h TTL + Redis idle 30min)
    │   │   ├── oauth-admin-factory.ts # admin OAuth provider 工厂(mock/google 切换 + startup validate)
    │   │   ├── oauth-admin-google.ts # Google Workspace OAuth 实现(stub)
    │   │   ├── oauth-admin-mock.ts   # dev mock provider
    │   │   └── providers.ts          # 主应用 OAuth providers(arctic)
    │   ├── compliance/         # 合规检查(主应用)
    │   ├── constants/          # 业务常量(industries / personas / cases / ...)
    │   ├── evolution/          # Evolution 计算 lib
    │   ├── rate-limit/         # Upstash ratelimit(stt/tts/embedding/image-gen)
    │   ├── voice-chat/         # VoiceChat lib
    │   ├── logger.ts           # pino + AsyncLocalStorage traceStore
    │   ├── prisma.ts           # Prisma 单例 + checkDbConnection
    │   └── redis.ts            # ioredis 单例 + maxRetriesPerRequest=null
    ├── memory/                 # L1-L5 记忆层(主应用 · ContextAssembler 用)
    │   ├── l5-trending.ts      # ★ TODO PRD-9 真接 trending API
    │   └── ...
    ├── middleware/             # 主应用 Hono/HTTP 层 middleware
    │   ├── auth.ts             # updateLastLogin(login 后更新 IP + 时间 · 不阻塞)
    │   └── __tests__/auth-lastlogin.test.ts
    ├── notification/           # 主应用通知 lib(空架子 · 留位)
    ├── schemas/                # API schemas(主用 zod · 此目录补充)
    │   └── admin/nsm.schema.ts
    ├── server/
    │   └── context-admin.ts    # admin tRPC context factory · 注 adminSession + activeAdminUser + mfaVerifiedAt
    ├── services/
    │   ├── admin/                                  # ★ admin 业务 service 层(PRD-11)
    │   │   ├── admin-audit-service.ts              # logAdminAction · 幂等 + redact + payloadHash
    │   │   ├── accounts/
    │   │   │   ├── anomaly-detection.service.ts    # 4 类异常检测(inactive/evolution_stalled/freq_switch/cost_spike)
    │   │   │   └── __tests__/
    │   │   ├── audit/
    │   │   │   └── pdf-forensic.service.ts         # 法务取证 PDF · contentHash + redact 全链
    │   │   ├── cost/
    │   │   │   ├── detect-anomalies.service.ts     # 单用户日 > $5 检测 · Decimal 全程
    │   │   │   ├── pdf-bill.service.ts             # 月度 PDF bill 生成 · 含 YoY
    │   │   │   └── __tests__/
    │   │   ├── invites/
    │   │   │   ├── campaign.service.ts             # CRUD + getCampaignFunnel(4 阶段漏斗)
    │   │   │   └── __tests__/
    │   │   ├── notifications/
    │   │   │   └── dingtalk.service.ts             # 钉钉 webhook · isMock 默认 + fail-fast 配置
    │   │   └── nsm/
    │   │       ├── kpi-snapshot.service.ts         # 7 SQL 并行聚合 + upsert + 60s timeout
    │   │       └── __tests__/
    │   ├── context-assembler/                      # L1-L5 上下文组装(主应用 Specialist)
    │   │   └── ContextAssembler.ts + templates/
    │   └── ip-progress/                            # IP 进度服务(主应用)
    ├── specialists/             # 14 Specialist(主应用 LLM 调用)
    │   ├── base/{BaseSpecialist.ts, types.ts, errors.ts}
    │   ├── PositioningAgent.ts / TopicAgent.ts / BrandingAgent.ts / MonetizationAgent.ts
    │   ├── CopywritingAgent.ts / LivestreamAgent.ts / VoiceChatAgent.ts / VideoAgent.ts
    │   ├── AnalysisAgent.ts / DailyTaskAgent.ts / DeepLearnAgent.ts / ...
    ├── trpc/                    # ★ tRPC 双实例 + router + middleware
    │   ├── trpc.ts              # 主应用 initTRPC · publicProcedure + traceMiddleware + Meta isGlobal
    │   ├── trpc-admin.ts        # admin initTRPC · publicAdminProcedure + AdminMeta(requiredRole, etc.)
    │   ├── context.ts           # 主应用 context factory · 注 user + activeAccountId + sessionId
    │   ├── middleware/
    │   │   ├── account-isolation.ts  # 主应用 RLS · $transaction + SET LOCAL ROLE + set_config
    │   │   ├── trace.ts              # re-export from trpc.ts + extractTraceId 工具
    │   │   └── admin/                # ★ admin 6 闸 middleware
    │   │       ├── adminAuth.ts        # 闸1 · ctx 必须有 activeAdminUser+adminSession
    │   │       ├── roleCheck.ts        # 闸2 · meta.requiredRole + role hierarchy
    │   │       ├── ipWhitelist.ts      # 闸3 · ADMIN_IP_WHITELIST_ENABLED + ipaddr.js CIDR
    │   │       ├── mfaCheck.ts         # 闸4 · super_admin 30d 滑动窗口
    │   │       ├── adminRLS.ts         # 闸5 · $transaction + set_config('app.role','admin') + adminPrisma 注入
    │   │       ├── approvalGateCheck.ts # 闸6 · stub NOT_IMPLEMENTED(PRD-13)
    │   │       ├── auditLog.ts          # 闸7(尾)· wrapNext + cross_account_query 自动写
    │   │       └── index.ts             # barrel export
    │   ├── procedures/
    │   │   └── admin.ts          # ★ adminProcedure = publicAdminProcedure.use(6 gates).use(auditLog) 顺序锁
    │   └── routers/
    │       ├── _app.ts           # 主应用 appRouter root(24 子 router)
    │       ├── auth.ts / ipAccounts.ts / stepData.ts / evolution.ts / ...
    │       └── admin/            # ★ admin router 树(PRD-10/11)
    │           ├── index.ts           # adminRouter root(7 real + 7 placeholder)
    │           ├── auth.ts            # login/logout/me(publicAdminProcedure)
    │           ├── audit.ts           # listMine/byTraceId/byUserId/byAdminId/search/exportPdf(6 procs)
    │           ├── users.ts           # list/detail/changePlan/banUser/resetPassword + handleExportUsersCSV
    │           ├── accounts.ts        # list/detail/flag/unflag/addNote/forceFreeze(6 procs)
    │           ├── invites.ts         # list/create/batchImport/invalidate/detail/campaignFunnel(6 procs)
    │           ├── nsm.ts             # getOverview/getFunnel/getDistributions/getAlerts/triggerSnapshot
    │           ├── cost.ts            # aggregate/top10/specialistBreakdown/alerts/exportMonthlyPdf/exportCsv
    │           └── __tests__/         # 7 测试文件 · vitest + vi.hoisted mock
    ├── types/                   # 全局 type definition
    └── workers/                 # ★ BullMQ workers(主应用)
        ├── daily-task/{queue.ts, worker.ts}    # DailyTask cron fan-out
        ├── embedding/{queue.ts, worker.ts}     # vector embed
        ├── evolution/{queue.ts, worker.ts}     # Evolution recompute
        ├── file-parser/                        # 文件解析(留位 LD-A5 review queue)
        ├── image-gen/{queue.ts, worker.ts, dall-e-3.ts, index.ts}  # DALL-E 3
        ├── llm-gateway/{anthropic-provider.ts, openai-provider.ts, cost-logger.ts, rate-limiter.ts, index.ts}
        ├── methodology-query/
        ├── rag/
        ├── stt/ tts/
        └── trending-scraper/                   # 留位 LD-A5 review queue
```

## Directory Purposes

**`apps/api/src/index.ts`(单文件 entry):**
- 目的: 唯一 HTTP server bootstrap
- 包含: Hono app + 双 CORS + trace middleware + OAuth REST 4 routes + admin REST(CSV)+ 双 tRPC mount + checkDbConnection + cron register
- 关键文件: `apps/api/src/index.ts:start()` 第 291 行

**`apps/api/src/lib/`:**
- 目的: 共享底层(无业务逻辑 · 单纯封装)
- 包含: prisma 单例 / redis 单例 / pino logger / auth(双 Lucia + OAuth provider 工厂)/ admin 常量 / rate-limit / 业务常量
- 关键文件: `apps/api/src/lib/prisma.ts`, `apps/api/src/lib/redis.ts`, `apps/api/src/lib/logger.ts`

**`apps/api/src/trpc/`:**
- 目的: tRPC 双实例 + router + 全部 middleware
- 包含: 主应用 24 router + admin 14 router(7 real + 7 placeholder)+ 7 admin middleware + 主应用 trace/RLS middleware
- 关键文件: `apps/api/src/trpc/procedures/admin.ts`(6 闸链)· `apps/api/src/trpc/middleware/admin/`(7 个 gate)· `apps/api/src/trpc/routers/admin/index.ts`(router 路由表)

**`apps/api/src/services/admin/`:**
- 目的: admin 业务领域逻辑 · 独立于 tRPC layer · cron 可复用
- 包含: 6 个业务域(cost / audit / nsm / accounts / invites / notifications)+ 顶层 admin-audit-service(LogAdminAction 唯一入口)
- 关键文件: `apps/api/src/services/admin/admin-audit-service.ts`(LD-A3 实现)

**`apps/api/src/jobs/admin/`:**
- 目的: admin BullMQ cron jobs(Queue + Worker + schedule fn 三合一)
- 包含: 3 个 cron(kpi-snapshot · cost-anomaly · anomaly-detection)
- 关键文件: 每文件含 Queue/Worker 实例 + `schedule*` 注册函数 + `worker.on('failed')` system_alert 写入

**`apps/api/src/specialists/` + `apps/api/src/agents/`:**
- 目的: 主应用 14 Specialist + Agent · LLM 调用业务
- 包含: PositioningAgent / TopicAgent / BrandingAgent / Copywriting / ... + 基类 BaseSpecialist
- 关键文件: `apps/api/src/specialists/base/BaseSpecialist.ts`(基类 · 各 Specialist 继承)
- 注: `specialists/` vs `agents/specialists/` 有历史重叠(Copywriting + DailyTask)· 未清理

**`apps/api/src/workers/`:**
- 目的: BullMQ 主应用 workers(11 个域 · dev in-process / prod 独立 container)
- 包含: llm-gateway / image-gen / rag / embedding / tts / stt / evolution / daily-task / methodology-query / trending-scraper / file-parser
- 关键文件: 每子目录 `queue.ts` 定义 Queue · `worker.ts` 定义 Worker · `index.ts` 导出类型

**`apps/api/src/middleware/`:**
- 目的: 主应用 Hono 层(非 tRPC)middleware
- 包含: `auth.ts` updateLastLogin(login 后异步更新 lastLoginAt/Ip)
- 关键文件: 数量很少 · 大部分 middleware 在 tRPC 层

**`apps/api/src/server/`:**
- 目的: server 入口辅助(context 工厂)
- 包含: `context-admin.ts` 唯一文件
- 关键文件: 应该跟 `trpc/context.ts` 在一起 · 历史拆分(主在 trpc/ · admin 在 server/)

## Key File Locations

**Entry Points:**
- `apps/api/src/index.ts`: HTTP server bootstrap(唯一入口)
- `apps/api/src/workers/image-gen/worker.ts`: 独立 worker(prod 用)
- `apps/api/src/cron/daily-task-runner.ts`: node-cron 入口(0 0 * * *)

**Configuration:**
- `apps/api/.env.example`: env vars 模板
- `apps/api/tsconfig.json`: TS config · paths 别名
- `apps/api/package.json`: dep + scripts(dev/start/build/typecheck/lint)
- 根 `pnpm-workspace.yaml`: workspace 定义
- 根 `vitest.config.ts`: 测试配置 · alias `@/* → apps/api/src/*`

**Core Logic(admin):**
- `apps/api/src/trpc/procedures/admin.ts`: 6 闸 procedure 顺序锁(★ 改这里必须重新 audit 整个 admin)
- `apps/api/src/trpc/routers/admin/index.ts`: admin router root · 控制 14 子树暴露
- `apps/api/src/services/admin/admin-audit-service.ts`: audit 唯一入口
- `apps/api/src/lib/admin/constants.ts`: ADMIN_ROLES / ADMIN_ROLE_HIERARCHY 单一来源

**Testing:**
- 根 `vitest.config.ts`: 包含 `apps/api/src/**/__tests__/**/*.test.ts`
- `apps/api/src/trpc/routers/admin/__tests__/`: 7 个 router 测试(audit / users / accounts / cost / nsm / invites / users-export / audit-forensic)
- `apps/api/src/services/admin/<domain>/__tests__/`: 5 个 service 测试
- `apps/api/src/jobs/admin/__tests__/`: 2 个 job 测试

## Naming Conventions

**Files:**
- camelCase 文件 · 表示业务实体(`adminAuth.ts` / `roleCheck.ts` / `kpiSnapshot.service.ts` ...)
- kebab-case 文件 · 表示模块或 SHIELD 文件(`admin-audit-service.ts` / `pdf-bill.service.ts` / `kpi-snapshot.service.ts` / `cost-anomaly.job.ts`)
- 混合 · admin tRPC middleware 用 camelCase(`adminAuth.ts` `mfaCheck.ts`) · admin service 用 kebab-case(`admin-audit-service.ts`)· 历史习惯不强统一

**Functions:**
- camelCase · 全部(`logAdminAction` / `computeSnapshot` / `detectCostAnomalies` / `generateForensicPdf`)
- Service factory 函数 · `generateXxx` / `createXxx` / `updateXxx` / `detectXxx`

**Variables:**
- camelCase · 局部 + 实例
- SCREAMING_SNAKE_CASE · 常量(`ADMIN_ROLES` / `ADMIN_SESSION_TTL_MS` / `MFA_STALE_MS` / `CSV_MAX_EXPORT_ROWS`)
- 文件级常量 · 都用 `const NAME = ...` 顶部(`apps/api/src/trpc/routers/admin/audit.ts:18` `HIGH_RISK_CATEGORIES`)

**Types:**
- PascalCase · interface + type(`AdminTRPCContext` / `AdminLuciaUser` / `KpiSnapshotData` / `LogAdminActionInput`)
- Suffix `Input` · zod schema 类型(`listInput` / `changePlanInput`)
- Suffix `Result` / `Output` · service 返回类型(`DetectCostAnomaliesResult` / `GenerateBillResult` / `DingtalkSendResult`)

**Directories:**
- kebab-case · 多词目录(`context-assembler` / `voice-chat` / `rate-limit` / `daily-task`)
- snake_case 不用 · 全是 kebab 或 camel
- 单数 vs 复数 · 不统一(`admin/` `accounts/` `invites/` 复数 · `audit/` `cost/` `nsm/` 单数)· 习惯按域名

## Where to Add New Code

**New admin router(域 ⑦~⑭ 待 PRD-12/13/14 完整化):**
- 主代码: `apps/api/src/trpc/routers/admin/<domain>.ts`
- 在 `apps/api/src/trpc/routers/admin/index.ts` 用 `import + export` 接入 adminRouter
- 测试: `apps/api/src/trpc/routers/admin/__tests__/<domain>.test.ts`(对照 `audit.test.ts` 写 vi.hoisted mock)
- 必须用 `adminProcedure`(已带 6 闸链)· 不允许 `publicAdminProcedure` 跑业务 query · 仅 health/auth 例外

**New admin service:**
- 主代码: `apps/api/src/services/admin/<domain>/<name>.service.ts`
- 测试: `apps/api/src/services/admin/<domain>/__tests__/<name>.test.ts`
- service 必须自己开 `prisma.$transaction(async tx => { await tx.$executeRawUnsafe("SET LOCAL app.role='admin'"); ... })` · 因为 cron / 非 ctx 场景调用时无 adminRLS middleware

**New admin BullMQ cron:**
- 主代码: `apps/api/src/jobs/admin/<name>.job.ts` · 含 Queue + Worker + `schedule*` fn
- 在 `apps/api/src/index.ts` 的 `start()` 函数 import + await schedule fn(参考第 312-327 行模式)
- jobId 必须设(`jobId: '<name>-recurring'`)· 防 server restart double-fire
- tz 必须 `Asia/Shanghai`
- `worker.on('failed')` 必须写 system_alert audit + console.error 兜底

**New main app router:**
- 主代码: `apps/api/src/trpc/routers/<name>.ts`
- 在 `apps/api/src/trpc/routers/_app.ts` import + 加到 `router({})` 字典
- 用 `protectedProcedure`(from `@/trpc/middleware/account-isolation`)· 不允许 `publicProcedure` 跑 business
- 若是全局(无 active account)用 `globalProcedure`(`.meta({ isGlobal: true })`)

**New worker:**
- 主代码: `apps/api/src/workers/<name>/{queue.ts, worker.ts, index.ts}`
- index.ts 导出 JobPayload type · queue.ts 定义 Queue + 复用 `lib/redis.ts` · worker.ts 定义 Worker
- prod 独立 container · 加 `pnpm worker:<name>` 到根 `package.json` scripts
- dev mode · 在 `apps/api/src/index.ts:296-304` 模式内 spawn(in-process)

**Utilities:**
- 共享 helper: `apps/api/src/lib/` 下按域分(`lib/admin/` / `lib/auth/` / `lib/rate-limit/`)
- admin-only · `apps/api/src/lib/admin/`(constants / types / audit-helpers)
- 跨子项目 · 用 workspace `packages/{schemas,ui,clients}` 不进 apps/api/lib

## Special Directories

**`apps/api/.gstack/`:**
- 目的: gstack browse skill 本地缓存(用户私有 · 非项目代码)
- 生成: gstack tool 运行时
- 提交: ❌ 应该在 .gitignore

**`apps/api/test-results/`:**
- 目的: vitest 输出
- 生成: `pnpm test` 运行后
- 提交: ❌ 不进 git

**`apps/api/node_modules/`:**
- 目的: pnpm 工作区依赖(workspace hoist)
- 生成: `pnpm install`
- 提交: ❌

**`apps/api/apps/api/` 子目录:**
- 注: 嵌套同名目录 · 含 `apps/api/apps/api/src/trpc/routers/` 残留
- 推断: 历史误操作或 sync-to-project 残留
- 处置: ★ CONCERNS.md 标 cleanup 待办

**`apps/api/src/audit/.gitkeep`:**
- 目的: 空目录占位(`apps/api/src/audit/` 仅含 .gitkeep)
- 生成: 留位等业务实现
- 提交: ✅ .gitkeep 进 git · 实际代码未实现

---

*Structure analysis: 2026-05-13*
