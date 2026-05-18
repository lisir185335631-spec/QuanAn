# External Integrations — apps/api

**Analysis Date:** 2026-05-13
**Scope:** `apps/api/` — admin + 主应用后端 · 外部服务清单 + auth env + webhook 接口

## APIs & External Services

**LLM Providers:**
- Anthropic Claude — `@anthropic-ai/sdk` ^0.30.0
  - 入口: `apps/api/src/workers/llm-gateway/anthropic-provider.ts`
  - Auth env: `ANTHROPIC_API_KEY`
  - 用途: 主应用 Specialist LLM 调用
- OpenAI — `openai` ^4.70.0
  - 入口: `apps/api/src/workers/llm-gateway/openai-provider.ts`
  - Auth env: `OPENAI_API_KEY`
  - 用途: GPT 调用 + DALL-E 3 图像生成(`apps/api/src/workers/image-gen/dall-e-3.ts`)+ embedding(TODO P3 占位)
- LLM Gateway 统一封装 — `apps/api/src/workers/llm-gateway/index.ts` · cost-logger 写 `cost_log` 表 · rate-limiter Upstash

**OAuth Providers:**
- 主应用 OAuth(用户登录)— `apps/api/src/lib/auth/providers.ts`
  - 实例化 · `getProvider()` 按 env 切换 · `requiresCsrfCheck()` 区分 mock vs 真实
  - Auth env: provider-specific(Google / WeChat 等 · validateStartupConfig 启动校验)
- admin OAuth(管理员登录 · ADR-021 隔离)— `apps/api/src/lib/auth/oauth-admin-factory.ts`
  - 提供 `getAdminOAuthProvider()` 返回 `(email) → AdminUser` 函数
  - 子实现: `oauth-admin-google.ts`(Workspace 域限定 @quanqn.com) + `oauth-admin-mock.ts`(dev)
  - Auth env: `OAUTH_PROVIDER`(=mock/google) + `QUANQN_ADMIN_CLIENT_ID` + Google secret

**Notification Services:**
- 钉钉 Webhook — `apps/api/src/services/admin/notifications/dingtalk.service.ts`
  - SDK: 原生 `fetch` POST(无第三方 SDK)
  - Auth env: `DINGTALK_WEBHOOK_URL` · 开关 `DINGTALK_ENABLE=true`
  - 用途: cost-anomaly + system-alert 告警推送 · 默认 `isMock=true`(D-077)
  - Fail-fast: `DINGTALK_ENABLE=true` 但 URL 空 → `ConfigurationError` 抛构造时

## Data Storage

**Databases:**
- PostgreSQL 16 + pgvector 0.8 — 唯一关系型存储
  - Connection: `DATABASE_URL`(`apps/api/src/lib/prisma.ts`)
  - Client: `@prisma/client` 5.22.0 · 单例 + globalThis HMR-safe
  - 测试 connection: `DATABASE_URL_TEST` → `quanqn_test`
  - RLS · 主应用 18 表强制 RLS(per-tenant)· admin 13 表 RLS DISABLE(per DATA-MODEL §13.8)
  - admin bypass · `SELECT set_config('app.role', 'admin', true)` 在 `$transaction` 内(`apps/api/src/trpc/middleware/admin/adminRLS.ts:11`)

**File Storage:**
- 未检出对象存储 SDK · 头像 / 文件 / PDF 输出当前内存生成后 base64 返回(`adminAuditRouter.exportPdf` 返回 base64)
- PDF 生成 · `@react-pdf/renderer` 服务端内存渲染 · `renderToBuffer()` · 不落盘
- ★ 待后续 PRD 接入(P6 / P7 文件上传 / 头像 / S3 类对象存储 — PRR 范围)

**Caching:**
- Redis(ioredis 单例)— `apps/api/src/lib/redis.ts`
  - admin idle session — key `admin:session:{id}` · TTL 30 min · `getex` 滑动续期(`lucia-admin.ts:142`)
  - BullMQ backend — Queue/Worker 复用同一 ioredis(`apps/api/src/jobs/admin/*.job.ts` + `workers/**/queue.ts`)
- Upstash Rate Limit — `@upstash/ratelimit` ^2.0.0 + `@upstash/redis` ^1.34.0
  - 入口: `apps/api/src/lib/rate-limit/{stt,tts,embedding,image-gen}.ts`(主应用速率限制)
  - Auth env: `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`(推断,代码未直读但 lib 默认 env 读)

## Authentication & Identity

**Auth Provider:**
- Lucia v3 — 双实例独立隔离
  - 主应用 `apps/api/src/lib/auth/lucia.ts` · sessionCookie name=`app_session`
  - admin `apps/api/src/lib/auth/lucia-admin.ts` · sessionCookie name=`admin_session_id` · TTL 12h
  - Custom adapter · `apps/api/src/lib/auth/adapter.ts`(主应用)+ 内联 `adminPrismaAdapter`(admin)
- admin 6 闸鉴权链 — `apps/api/src/trpc/procedures/admin.ts`
  - 顺序: adminAuth → roleCheck → ipWhitelist → mfaCheck → adminRLS → approvalGateCheck → auditLog
  - 角色层级 · `super_admin: 3` > `admin: 2` > `readonly_admin: 1`(`apps/api/src/lib/admin/constants.ts:12`)
  - MFA · 30 天滑动窗口验证(`ADMIN_MFA_CACHE_MS = 30*24*60*60*1000`)
- Approval Gate(stub)— PRD-13 真闭环 · 当前 `apps/api/src/trpc/middleware/admin/approvalGateCheck.ts` 抛 `TRPCError NOT_IMPLEMENTED`

## Monitoring & Observability

**Error Tracking:**
- 未接 Sentry / DataDog · 仅靠 pino + `console.error` 兜底(`apps/api/src/services/admin/admin-audit-service.ts:70` audit 写失败 fallback)
- ★ TODO P3 占位 · `apps/api/src/workers/evolution/worker.ts:65` "integrate with PagerDuty / Sentry alert"

**Logs:**
- 结构化日志 · pino 9.0.0 · `apps/api/src/lib/logger.ts`
- traceId 贯穿 · AsyncLocalStorage(`traceStore`)+ pino `mixin()` 自动注入 · Hono trace middleware 注入 X-Trace-Id 响应头
- 双层 trace
  - Hono 层 · `apps/api/src/index.ts:92-101` · 从 header 读 / nanoid-16 生成
  - tRPC 层 · `apps/api/src/trpc/trpc.ts:34-39` · `traceMiddleware`

**Audit Logging:**
- 主应用 audit_log 表 · 通过 `apps/api/src/index.ts:163-173, 222-232`(OAuth login / state mismatch)直接 `prisma.auditLog.create()`
- admin admin_audit_log 表 · 通过 `apps/api/src/services/admin/admin-audit-service.ts:logAdminAction()` 服务
  - 幂等 · 按 `traceId+eventType` `findFirst` 跳过重复写(`admin-audit-service.ts:38`)
  - 敏感字段自动 redact · `apps/api/src/lib/admin/audit-helpers.ts:redactSensitiveFields`(password / token / apikey / secret / credential / authorization)
  - SHA-256 payloadHash · 同一行(`admin-audit-service.ts:31`)
  - 写失败兜底 · `console.error` + 不抛(LD-A3 append-only 但不阻塞调用方)

## CI/CD & Deployment

**Hosting:**
- 未检出(留 PRR · 项目 CLAUDE.md §7)
- 推断 · Vercel / Railway / 阿里云 RDS(per `project CLAUDE.md §7`)
- 双部署目标 · `apps/web` 主前端 · `apps/api` 双 endpoint(主 + admin 同进程)· `apps/admin` 独立 SPA(admin.quanqn.com)

**CI Pipeline:**
- 未检出 .github/workflows · CI 待后续
- 代码内 audit script 仍可手跑 · 根 `package.json` scripts: `audit:redlines` / `audit:redlines-admin` / `audit:ld` / `audit:approval-gates` / `audit:admin-rls-tables`(bash + tsx)

## Environment Configuration

**Required env vars(基于 `.env.example` + 代码强读):**

```
# Database
DATABASE_URL                # 必须 · 启动时 SELECT 1 失败 → exit 1
DATABASE_URL_TEST           # 测试库

# Cache / Queue
REDIS_URL                   # 默认 redis://localhost:6379

# OAuth(用户)
APP_BASE_URL                # CORS · 默认 http://localhost:5173

# OAuth(admin · LD-A1 独立)
ADMIN_BASE_URL              # CORS · 默认 http://localhost:5174
OAUTH_PROVIDER              # mock | google
QUANQN_ADMIN_CLIENT_ID      # 推断(per AGENTS §10 LD-A1)

# Admin 6 闸
ADMIN_IP_WHITELIST_ENABLED  # true | false
ADMIN_IP_WHITELIST_CIDRS    # 逗号分隔 CIDR
ADMIN_MFA_REQUIRED          # true | false

# 通知
DINGTALK_ENABLE             # true | false (默认 mock)
DINGTALK_WEBHOOK_URL        # DINGTALK_ENABLE=true 时必填(fail-fast)

# LLM(workers)
ANTHROPIC_API_KEY           # Claude
OPENAI_API_KEY              # GPT + DALL-E

# Logging
LOG_LEVEL                   # pino level · 默认 info
NODE_ENV                    # development | production
PORT                        # 默认 3000
```

**Secrets location:**
- 本地 dev · `.env`(不进 git)
- prod · TBD(Vercel / Railway env vars 推断 · 见 PRR)
- ★ 红线 · 任何 secret 不允许暴露给前端(AGENTS R-001)· BASE_LLM_URL / LLM_API_KEY 仅服务端 worker 读

## Webhooks & Callbacks

**Incoming(HTTP routes 暴露给外部):**
- `GET /health` — 健康检查(无 auth · `apps/api/src/index.ts:103`)
- `GET /auth/login` — OAuth 重定向到 provider(`apps/api/src/index.ts:107`)
- `GET /auth/callback` — OAuth provider 回调(state + code 校验 · 第 141-239 行)
- `GET /auth/logout` — 会话失效(第 241 行)
- `GET /admin/export/users` — 管理员 CSV 流式导出(REST · 不走 tRPC · `apps/api/src/index.ts:259`)
- `POST/GET /trpc/admin/*` — admin tRPC endpoint(注册 `adminRouter` · 第 263 行)
- `POST/GET /trpc/*` — 主应用 tRPC endpoint(注册 `appRouter` · 第 277 行)

**Outgoing(主动发出):**
- 钉钉 webhook — `apps/api/src/services/admin/notifications/dingtalk.service.ts:53` · POST 到 `DINGTALK_WEBHOOK_URL`
- OAuth provider(Google 等)— `arctic` 的 `getAuthorizationUrl` + `validateCallback`
- LLM API — Anthropic + OpenAI provider 调用(workers)
- 暂无 outbound to 客户系统的 webhook

---

*Integration audit: 2026-05-13*
