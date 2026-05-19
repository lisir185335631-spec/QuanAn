<!-- refreshed: 2026-05-13 -->
# Architecture — apps/api

**Analysis Date:** 2026-05-13
**Scope:** QuanAn `apps/api` 后端 · monorepo workspace `@quanan/api` · Hono + tRPC v11 双 endpoint(主应用 + admin)

## System Overview

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                          HTTP Layer (Hono · :3000)                            │
│  CORS(双 origin · admin / web 分离) · X-Trace-Id middleware · ESM 单进程     │
│  `apps/api/src/index.ts`                                                     │
└─────────┬─────────────────┬─────────────────┬────────────────┬───────────────┘
          │                 │                 │                │
          ▼                 ▼                 ▼                ▼
┌─────────────────┐ ┌────────────────┐ ┌─────────────┐ ┌──────────────────┐
│ OAuth REST      │ │ Admin REST     │ │ Admin tRPC  │ │ Main tRPC        │
│ /auth/*         │ │ /admin/export/*│ │ /trpc/admin │ │ /trpc/*          │
│ `index.ts`      │ │ `users.ts`     │ │ adminRouter │ │ appRouter        │
│                 │ │ Stream CSV     │ │             │ │                  │
└────────┬────────┘ └───────┬────────┘ └──────┬──────┘ └────────┬─────────┘
         │                  │                 │                  │
         │                  │                 ▼                  ▼
         │                  │  ┌──────────────────────────────────────────┐
         │                  │  │ tRPC Middleware Layer                    │
         │                  │  │                                          │
         │                  │  │ Admin (6-gate chain · 顺序硬约束):       │
         │                  │  │ adminAuth → roleCheck → ipWhitelist →    │
         │                  │  │ mfaCheck → adminRLS → approvalGateCheck  │
         │                  │  │ → auditLog                               │
         │                  │  │ `trpc/procedures/admin.ts`               │
         │                  │  │ `trpc/middleware/admin/*.ts`             │
         │                  │  │                                          │
         │                  │  │ Main: traceMiddleware →                  │
         │                  │  │ accountIsolationMiddleware(RLS · PRD-2)  │
         │                  │  │ `trpc/middleware/account-isolation.ts`   │
         │                  │  └─────────────────┬────────────────────────┘
         │                  │                    │
         │                  │                    ▼
         │                  │  ┌──────────────────────────────────────────┐
         │                  │  │ Service Layer                            │
         │                  │  │ `services/admin/{cost,audit,nsm,         │
         │                  │  │  accounts,invites,notifications}/`       │
         │                  │  │ Specialist + Agent · `specialists/`,     │
         │                  │  │ `agents/`                                │
         │                  │  └─────────────────┬────────────────────────┘
         │                  │                    │
         └──────────────────┴────────────────────┴───────────────┐
                                                                 │
                                                                 ▼
                                                  ┌──────────────────────────┐
                                                  │ Persistence Layer        │
                                                  │ Prisma 单例 + 双 Lucia   │
                                                  │ `lib/prisma.ts`          │
                                                  │ `lib/auth/lucia.ts` (主)  │
                                                  │ `lib/auth/lucia-admin.ts`│
                                                  └────────────┬─────────────┘
                                                               │
              ┌────────────────────────────┬───────────────────┴────────────┐
              ▼                            ▼                                ▼
       ┌──────────────┐         ┌───────────────────┐           ┌─────────────────┐
       │ PostgreSQL16 │         │ Redis (ioredis)   │           │ BullMQ Queues   │
       │ + pgvector   │         │ admin idle 30min  │           │ admin-kpi-      │
       │ RLS per LD-A3│         │ TTL · BullMQ +    │           │ snapshot /      │
       │              │         │ Upstash ratelimit │           │ cost-anomaly /  │
       │              │         │                   │           │ anomaly-detect /│
       │              │         │                   │           │ image-gen / etc │
       └──────────────┘         └───────────────────┘           └─────────────────┘
                                                                         │
                                                                         ▼
                                                              ┌──────────────────┐
                                                              │ Workers (sep    │
                                                              │ container in    │
                                                              │ prod · in-proc  │
                                                              │ in dev)         │
                                                              │ `workers/*`     │
                                                              └──────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| HTTP entry | Hono server bootstrap · CORS 注册顺序 · trace · OAuth REST · 两个 tRPC mount + 启动校验 | `apps/api/src/index.ts` |
| Main tRPC init | initTRPC for `TRPCContext` + traceMiddleware + meta `isGlobal` | `apps/api/src/trpc/trpc.ts` |
| Admin tRPC init | initTRPC for `AdminTRPCContext` + meta `{requiredRole,requiresApproval,actionType,riskLevel}` | `apps/api/src/trpc/trpc-admin.ts` |
| Main context factory | 校验 lucia `app_session` + 注入 prisma/user/traceId/activeAccountId | `apps/api/src/trpc/context.ts` |
| Admin context factory | 校验 luciaAdmin `admin_session_id` + 注入 adminSession/activeAdminUser/mfaVerifiedAt | `apps/api/src/server/context-admin.ts` |
| Admin 6-gate procedure | `publicAdminProcedure.use(adminAuth).use(roleCheck).use(ipWhitelist).use(mfaCheck).use(adminRLS).use(approvalGateCheck).use(auditLog)` | `apps/api/src/trpc/procedures/admin.ts` |
| Admin 7 routers | health(stub) + auth/audit/users/ipAccounts/inviteCodes/nsm/cost(real)+ trending/deepLearn/prompts/quota/evolution/config/ab(placeholders) | `apps/api/src/trpc/routers/admin/index.ts` |
| Admin services | NSM kpi snapshot · cost anomaly detect · forensic PDF · monthly bill PDF · campaign funnel | `apps/api/src/services/admin/{nsm,cost,audit,invites,accounts}/` |
| Admin BullMQ cron jobs | kpi-snapshot(daily/weekly/monthly)+ cost-anomaly(hourly)+ anomaly-detection(daily 5am) | `apps/api/src/jobs/admin/*.job.ts` |
| Admin audit service | logAdminAction(traceId+eventType 幂等 · payloadHash · redact · console.error 兜底) | `apps/api/src/services/admin/admin-audit-service.ts` |
| Main RLS middleware | $transaction + SET LOCAL ROLE quanan_app + set_config('app.current_account_id') + isGlobal bypass | `apps/api/src/trpc/middleware/account-isolation.ts` |
| Admin RLS middleware | $transaction + set_config('app.role','admin') + ctx.adminPrisma 注入 + crossAccountAccessed=true | `apps/api/src/trpc/middleware/admin/adminRLS.ts` |
| Prisma singleton | globalThis HMR-safe · dev query event log · checkDbConnection → process.exit(1) | `apps/api/src/lib/prisma.ts` |
| Redis singleton | maxRetriesPerRequest=null(BullMQ 要求)· 复用给 BullMQ + admin idle key | `apps/api/src/lib/redis.ts` |
| Logger | pino + AsyncLocalStorage(`traceStore`) · mixin 自动注 traceId · dev pretty | `apps/api/src/lib/logger.ts` |
| Workers(main) | LLM gateway / image-gen / RAG / embedding / TTS / STT / file-parser / trending-scraper / methodology-query / daily-task / evolution | `apps/api/src/workers/*/` |
| Specialists/Agents(主应用)| 14 Specialist(Positioning / Topic / Branding / Monetization / Analysis / Copywriting / Livestream / VoiceChat / DailyTask / DeepLearn / Video / ...)+ EvolutionAgent | `apps/api/src/specialists/`, `apps/api/src/agents/` |

## Pattern Overview

**Overall:** Layered modular monolith · 双 tRPC initTRPC 实例同进程并存 · admin 6 闸 middleware chain + 主应用 RLS middleware · 异步 worker via BullMQ + Redis queue · dev 内进程 spawn worker / prod 独立容器。

**Key Characteristics:**
- 单进程多 endpoint(主 + admin tRPC + REST · 同一 Hono `app.all`)
- 严格 OAuth + session 双隔离(app_session vs admin_session_id · ADR-021 / LD-A1)
- RLS 双轨 · 主应用 `set_config('app.current_account_id', $val, true)` · admin `set_config('app.role','admin', true)` bypass
- audit 全链路写入 · admin 自动 middleware · 主应用 OAuth 流程显式写 audit_log
- 全异步 · cron + worker · 无同步阻塞业务

## Layers

**HTTP Layer:**
- 目的: 接收 HTTP 请求 + 路由分发 + CORS + trace
- 位置: `apps/api/src/index.ts`(唯一文件)
- 包含: Hono `app` 实例 + 7 个 mount 点(/health, /auth/*, /admin/export/*, /trpc/admin/*, /trpc/*)
- 依赖: `@hono/node-server` · `lib/auth/{lucia, providers, oauth-admin-factory}`
- 被谁用: Node `serve()` 启动 + 测试 super-test 风格 mock

**tRPC initTRPC 双实例:**
- 主应用 · `apps/api/src/trpc/trpc.ts` · context `TRPCContext` · meta `{ isGlobal? }`
- admin · `apps/api/src/trpc/trpc-admin.ts` · context `AdminTRPCContext` · meta `{ requiredRole?, requiresApproval?, actionType?, riskLevel? }`
- 不允许跨实例 use middleware(类型不兼容 · 编译期阻止 LD-A2 越界)

**Middleware Layer(admin 6 闸 · 顺序硬约束):**
- 位置: `apps/api/src/trpc/middleware/admin/`
- 顺序依赖 · 在 `trpc/procedures/admin.ts` 的 `.use()` 链显式定义
  1. `adminAuth` — ctx 必须有 `activeAdminUser + adminSession` 否则 UNAUTHORIZED
  2. `roleCheck` — 读 `meta.requiredRole` 对照 ADMIN_ROLE_HIERARCHY · 不足 FORBIDDEN
  3. `ipWhitelist` — env 开关 + ipaddr.js CIDR 校验 · IPv4-mapped IPv6 归一
  4. `mfaCheck` — super_admin + MFA 强制 + 30 天 stale 窗口
  5. `adminRLS` — 启 `$transaction` + `SET LOCAL app.role='admin'` + 注入 `ctx.adminPrisma`(tx 内 client) + `crossAccountAccessed=true`
  6. `approvalGateCheck` — 读 `meta.requiresApproval` · 当前 stub 抛 `NOT_IMPLEMENTED` · PRD-13 完工
  7. `auditLog`(尾)— `wrapNext` 模式 · try/catch next() + 写 `cross_account_query` event(若 ctx.crossAccountAccessed)+ 重新 throw
- 异常 · 任何一闸抛 TRPCError · auditLog 仍捕获并尝试写失败 audit(payload 含 errorCode/errorMessage)

**Service Layer:**
- 位置: `apps/api/src/services/admin/{cost,audit,nsm,accounts,invites,notifications}/`
- 不直读 `ctx.adminPrisma` 而是接受 `PrismaClient` 参数(从 router 传入)— 见 `services/admin/cost/pdf-bill.service.ts:38` 签名
- 自己内部用 `$transaction` + `SET LOCAL app.role='admin'`(独立于 middleware · 防 cron 调用无 ctx · 见 `services/admin/cost/detect-anomalies.service.ts:38`)
- Decimal 全程 · money-critical 文件加 `// # $ money-critical: true` 注释

**Worker / Queue Layer:**
- 位置: `apps/api/src/workers/<name>/{queue,worker,index}.ts` · `apps/api/src/jobs/admin/*.job.ts`
- 模式: 每个 worker 一 BullMQ Queue + Worker · 复用 `lib/redis.ts` 单例 · `attempts: 3` + `exponential` backoff
- jobId 唯一 · 防 cron double-fire(`scheduleDailySnapshot` 用 `jobId: 'daily-snapshot-recurring'`)
- final failure handler · 写 `admin_audit_log eventCategory='system_alert' eventType='kpi_snapshot_failed'/'cron_failed'`

**Persistence Layer:**
- Prisma 单例 · `lib/prisma.ts` · `globalThis.__prisma` HMR
- Lucia 双实例 · `lib/auth/lucia.ts`(`app_session`)+ `lib/auth/lucia-admin.ts`(`admin_session_id`)
- adapter · `lib/auth/adapter.ts` 主 · `lucia-admin.ts` 内联 admin adapter(`prisma.adminSession`)
- admin idle TTL · Redis `admin:session:{id}` key · `getex` 滑动 30min

## Data Flow

### Admin Cross-Account Query(典型 PRD-11 流)

1. 前端 SPA 发请求到 `https://admin.quanan.com/trpc/admin/users.list` 携带 `admin_session_id` cookie
2. Hono CORS 校验 origin(只允许 `ADMIN_BASE_URL`)+ trace middleware 注 X-Trace-Id (`apps/api/src/index.ts:55-64, 92-101`)
3. `fetchRequestHandler` 创建 `AdminTRPCContext`(`createAdminContext` 在 `server/context-admin.ts`)· 调 `validateAdminSession`(`lucia-admin.ts:156`)· 检查 Lucia + Redis idle TTL
4. 进 6 闸 procedure(`procedures/admin.ts`)·
   - adminAuth 通过
   - roleCheck 通过(`users.list` 无 `requiredRole` 限定 · 任何 role 可调)
   - ipWhitelist 通过(如开启,IP CIDR 匹配)
   - mfaCheck 通过(role≠super_admin 直接 next)
   - adminRLS 启 `$transaction` + `SET LOCAL app.role='admin'` + 注入 `ctx.adminPrisma`
   - approvalGateCheck 通过(无 `requiresApproval` meta)
5. 业务 router (`routers/admin/users.ts:list`) 用 `ctx.adminPrisma ?? ctx.prisma` 跑 `Promise.all([findMany, count])`(`users.ts:277-280`)· 显式 `logAdminAction({ eventCategory: 'cross_account_query', eventType: 'list_users' })`
6. auditLog middleware 落尾 · 检测 `ctx.crossAccountAccessed=true` 再写一条 `cross_account_query` event(可能与显式日志同 traceId 但不同 eventType · 幂等 findFirst 跳过同 traceId+eventType)
7. tRPC 响应序列化 · Hono 写 `x-trace-id` 响应头返回

### Admin Mutation with Approval(高风险动作 banUser 例)

1-4 同上(进 6 闸)
5. `routers/admin/users.ts:banUser`(`users.ts:425`)·
   - `guardMutation` 拦截 readonly_admin → audit `privilege_escalation` + 抛 FORBIDDEN
   - super_admin 路径 · 创 `approvalRequest` status=`auto_executed` · 直接 update 用户 · audit `high_risk_action`/`ban_user`
   - 普通 admin 路径 · 创 `approvalRequest` status=`pending` · 不执行 · audit `high_risk_action`/`approval_request_create`
6. 返回 `{ status, approvalRequestId }`
7. ★ 当前 approvalGateCheck middleware 见 `meta.requiresApproval` 才抛 NOT_IMPLEMENTED · `banUser` 没标 `requiresApproval` meta · 走业务代码内的 super/普通分支 stub · PRD-13 完整闭环时 middleware 接管

### Admin Cron(KPI Snapshot 每小时)

1. `apps/api/src/index.ts:316`(server start) 调 `scheduleDailySnapshot()` `scheduleWeeklySnapshot()` `scheduleMonthlySnapshot()`
2. BullMQ 按 cron `'0 * * * *'` tz `Asia/Shanghai` 触发 · `jobId: 'daily-snapshot-recurring'` 防 double-fire(`jobs/admin/kpi-snapshot.job.ts:88`)
3. Worker fn 调 `computeSnapshot(new Date(), 'day')`(`services/admin/nsm/kpi-snapshot.service.ts:285`)
4. service 内自 `$transaction` + `SET LOCAL app.role='admin'` + 7 个并行 `$queryRaw` 聚合 + Promise.all
5. upsert `kpi_snapshots` on `@@unique([snapshotDate, granularity])`
6. 60s timeout race · 超时 → `SnapshotComputationTimeout` 抛
7. `worker.on('failed')` 在第 3 次重试失败时写 `admin_audit_log` `system_alert`/`kpi_snapshot_failed`

**State Management:**
- 主要状态在 PostgreSQL(无内存 store · 无 in-mem session cache)
- 短期状态 · Redis(admin idle TTL · rate limit token bucket · BullMQ queue 内部)
- 进程内 · 仅 `globalThis.__prisma` 单例 · `traceStore`(AsyncLocalStorage 不算共享 · 每请求独立)

## Key Abstractions

**Lucia 双 session:**
- 目的: 主应用 + admin 完全隔离的会话管理 · ADR-021 / LD-A1 强约束
- 例: `lib/auth/lucia.ts`(主)+ `lib/auth/lucia-admin.ts`(admin)
- 模式: 自写 adapter + Custom getUserAttributes 返回 Register 不兼容的 admin 属性时 `as unknown as DatabaseUser['attributes']` 双 cast(`lucia-admin.ts:49`)

**adminProcedure / publicAdminProcedure:**
- 目的: 一处定义 6 闸顺序 · 所有 admin router 必经
- 例: `apps/api/src/trpc/procedures/admin.ts`
- 模式: chain `.use()` · 顺序硬编码 + 注释强调 LD-A-chain

**Admin Service (PrismaClient injection):**
- 目的: cron 调用与 router 调用共享同一 service · service 不依赖 ctx
- 例: `services/admin/cost/pdf-bill.service.ts:34` `generateMonthlyBill(month, adminId, prismaClient)` · `services/admin/nsm/kpi-snapshot.service.ts:285` `computeSnapshot(date, granularity)`(自己开 prisma.$transaction)
- 模式: service 自管 transaction · 自己 `SET LOCAL app.role='admin'` · 不假设 ctx 已 bypass RLS

**logAdminAction:**
- 目的: admin audit 单一入口 · 幂等 + redact + payloadHash + console.error 兜底
- 例: `services/admin/admin-audit-service.ts:35`
- 模式: try-catch swallow · 永不抛(LD-A3 强约束 · audit 失败不阻塞业务)

## Entry Points

**HTTP server:**
- 位置: `apps/api/src/index.ts:start()` (第 291 行)
- 触发: `pnpm --filter @quanan/api dev` / `start`(`tsx src/index.ts`)
- 职责: validate config → checkDbConnection → dev 模式 spawn workers + cron + serve

**Admin cron 注册:**
- 位置: `apps/api/src/index.ts` 第 312-327 行 · server start 时 register
- 触发: serve 启动后异步 await
- 职责: 注册 4 个 cron(daily kpi / weekly / monthly / cost-anomaly / anomaly-detection)

**Workers(prod 独立进程):**
- 位置: `apps/api/src/workers/image-gen/worker.ts`(典型)
- 触发: `pnpm worker:image-gen`(根 script)· `tsx apps/api/src/workers/image-gen/worker.ts`
- 职责: 拉 BullMQ job · 处理 · history 反写

## Architectural Constraints

- **Threading:** Node 单线程事件循环 · 无 worker_threads · BullMQ worker 同进程 in-dev(`concurrency=2`)/ 独立 container in-prod
- **Global state:** `globalThis.__prisma` 单例(HMR 防双连)· `traceStore` AsyncLocalStorage(每请求独立 · 不共享)
- **Circular imports:** `trpc/trpc.ts` 的 `protectedProcedure` 故意不在此文件定义 · 移到 `middleware/account-isolation.ts` 来避免循环(`trpc.ts:44-45` 注释)
- **CORS 注册顺序硬约束:** admin 子 CORS 必须在 main app CORS 之前 · 因为 Hono CORS 早返 OPTIONS without next() · `apps/api/src/index.ts:42-44` 注释
- **Middleware 顺序硬约束:** admin 6 闸顺序不允许调换(`adminAuth → roleCheck → ipWhitelist → mfaCheck → adminRLS → approvalGateCheck → auditLog`)· `procedures/admin.ts:1` LD-A-chain 注释
- **RLS bypass scope:** 必须用 `SET LOCAL`(transaction-scoped)· 不允许 `SET`(connection-scoped · 跨 connection 泄露)· 见 `adminRLS.ts:10` 注释 + `services/admin/nsm/kpi-snapshot.service.ts:307`
- **money-critical:** 全程 `Prisma.Decimal` · 不允许 `.toNumber()`(精度丢失)· `services/admin/cost/*.ts` 文件头都有 SHIELD 注释

## Anti-Patterns

### 串行 await 多表查询

**What happens:** `await db.userTop10`; `await db.accountTop10` 串行执行 · cost.ts 早期版本曾有
**Why it's wrong:** 翻倍延迟 · prisma 连接池利用率低 · 大查询时显著慢
**Do this instead:** `Promise.all([db.userTop10(...), db.accountTop10(...)])` · 见 `routers/admin/cost.ts:153-170` 实证

### 不带 redact 写 payloadHash

**What happens:** payload 含 password/token · 直接 `sha256(JSON.stringify(payload))`
**Why it's wrong:** GDPR + LD-A3 红线 · 敏感数据落 audit log 数据库 · hash 可被彩虹表回溯
**Do this instead:** 先 `redactSensitiveFields` 再 sha256 · 见 `lib/admin/audit-helpers.ts:10` + `services/admin/cost/pdf-bill.service.ts:18` + `services/admin/audit/pdf-forensic.service.ts:27`

### `SET app.role='admin'` 全局污染

**What happens:** 用 `SET` 而非 `SET LOCAL` · role 跨 connection 残留
**Why it's wrong:** Prisma 连接池复用 · 下一个用户请求拿到 admin role 全表 bypass RLS · 严重权限泄露
**Do this instead:** `SET LOCAL app.role='admin'` 或 `set_config('app.role','admin', true)`(等价 · 第三参 `is_local=true`)· 见 `services/admin/cost/detect-anomalies.service.ts:40` 注释 "SHIELD"

### admin procedure 漏 audit

**What happens:** procedure 直接 `prisma.xxx.create` 返回 · 不调 `logAdminAction`
**Why it's wrong:** R-A4 红线 · 法务取证链断裂 · 合规风险
**Do this instead:** 业务体内 + auditLog middleware 双层兜底 · cross_account_query event 自动由 middleware 写 · 业务级 event(如 `ban_user` / `change_user_plan`)显式调 `logAdminAction`

### admin router 调主应用 router

**What happens:** `from '@/trpc/routers/auth'` 在 `routers/admin/*` 内
**Why it's wrong:** LD-A2 红线 · 两域必须严格分离
**Do this instead:** admin 业务复用通过 service 层(`services/admin/*`)· router 间不直接 import · 见 AGENTS §10 §10.4 grep 检测

### 高风险 procedure 硬编码 `requiresApproval=false`

**What happens:** banUser / changePlan 等 meta 内写 `requiresApproval: false` 跳过 gate
**Why it's wrong:** LD-A4 红线 + ADR-020 违反
**Do this instead:** 必须先开新 ADR 改 §10.3 清单 · 否则 14 高风险动作必带 `requiresApproval=true`

## Error Handling

**Strategy:** 显式 `TRPCError` 在 router/middleware · service 抛 named Error class(`ValidationError` / `AdminRLSBypassError` / `SnapshotComputationTimeout` / `CampaignKeyConflictError` 等)· logger.error 落日志 · audit 写失败用 `.catch(console.error)` 兜底但不抛。

**Patterns:**
- tRPC 公共错误 · `throw new TRPCError({ code, message })` · code 用 `UNAUTHORIZED`/`FORBIDDEN`/`NOT_FOUND`/`BAD_REQUEST`/`NOT_IMPLEMENTED`/`PRECONDITION_FAILED`/`INTERNAL_SERVER_ERROR`
- service 域错误 · 自定义 Error 类含 `name` 字段(便于 toString debug)· 见 `services/admin/nsm/kpi-snapshot.service.ts:17-36` 三个 class
- audit log 写失败 · `.catch((err) => console.error('[ADMIN AUDIT WRITE FAILED]', err))` 既不阻塞业务也不静默(`middleware/admin/auditLog.ts:52` + `services/admin/admin-audit-service.ts:70`)
- worker final failure · `worker.on('failed')` 跑 try/catch 写 system_alert audit · 二次 catch 落 logger.error(`jobs/admin/kpi-snapshot.job.ts:45-76`)

## Cross-Cutting Concerns

**Logging:**
- pino + AsyncLocalStorage(`traceStore`)· `lib/logger.ts`
- 严禁 `console.log`(AGENTS §6.9)· 例外: audit 写失败兜底用 `console.error` · 临时 password reset 用 `console.log(`[ADMIN RESET PASSWORD]`)`(`users.ts:523` · 待 PRD 真发邮件)

**Validation:**
- 所有 tRPC input 用 zod `z.object()`(`.input(z.object({...}))`)· 不存在跳 zod 直接 destructure 的 router
- service 层 named ValidationError(`kpi-snapshot.service.ts:17` / `campaign.service.ts:14`)

**Authentication:**
- 主 · `lib/auth/providers.ts` arctic OAuth + cookie state + CSRF check(mock 跳过)
- admin · `lib/auth/oauth-admin-factory.ts` + mock/google 两实现 + Workspace 域限定(@quanan.com per LD-A1)

**Authorization:**
- 主 · accountIsolationMiddleware + `meta.isGlobal` 旁路
- admin · 6 闸 chain + role hierarchy + IP CIDR + MFA stale + approval gate

**Trace:**
- 双层 trace · Hono 层(`index.ts:92-101`)+ tRPC 层(`trpc/trpc.ts:34-39`)
- 后端日志 + audit + 错误响应都带 traceId · 前端可在响应头 `x-trace-id` 拿到回传

---

*Architecture analysis: 2026-05-13*
