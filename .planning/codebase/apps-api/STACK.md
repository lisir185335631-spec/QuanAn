# Technology Stack — apps/api

**Analysis Date:** 2026-05-13
**Scope:** `apps/api/` (QuanAn 主应用 + admin 后端 · monorepo workspace `@quanan/api`)

## Languages

**Primary:**
- TypeScript 5.6.x — 全部业务源码 + 测试 · `apps/api/src/**/*.ts` · 173 src files / 16 test files / 总 ~19.5k 行
- SQL — 通过 Prisma `$queryRaw` template literal 嵌入(`apps/api/src/services/admin/nsm/kpi-snapshot.service.ts` · `accounts/anomaly-detection.service.ts` 等)

**Secondary:**
- TSX — admin 端 PDF 模板间接依赖(`packages/ui/src/admin/PdfBillTemplate.tsx` 等)· apps/api 端只用 React.createElement,不写 JSX

## Runtime

**Environment:**
- Node.js ≥ 20(monorepo 根 `package.json` engines)· 实际开发用 24.15.0(per CLAUDE.md)
- ESM(`"type": "module"`)+ TypeScript bundler resolution(`tsconfig.base.json` `moduleResolution: Bundler`)

**Package Manager:**
- pnpm 9.15.9(`packageManager` 字段固定 · monorepo workspace · `pnpm-workspace.yaml`)
- Lockfile: `pnpm-lock.yaml`(根) · 工作区子项目无独立 lock

## Frameworks

**Core:**
- Hono ^4.5.0 — HTTP server framework · 单一入口 `apps/api/src/index.ts` · 双 CORS + 双 tRPC 端点 + REST(`/admin/export/users`)
- @hono/node-server ^2.0.1 — Hono 在 Node.js 上的适配器(`serve({ fetch: app.fetch, port })`)
- @trpc/server ^11.0.0-rc.0 — type-safe RPC · 两个独立 initTRPC 实例(主应用 `@/trpc/trpc.ts` + admin `@/trpc/trpc-admin.ts`)· fetch adapter(`fetchRequestHandler`)

**Testing:**
- Vitest(from root)— 测试运行器 · 根 `vitest.config.ts` 集中配置 · `apps/api/src/**/__tests__/**/*.test.ts` glob 收集 · 测试用 `vi.hoisted` 标准模式 mock Prisma + service
- @testcontainers/postgresql ^10.0.0 — 集成测试用 PG 容器(workspace dep · 仅 ralph integration test 使用)
- nock ^14.0.15 — HTTP mock(集成测试外部 API)

**Build/Dev:**
- tsx ^4.19.0 — dev / start 用(`tsx watch src/index.ts` / `tsx src/index.ts`)· 跳过编译直接跑 TS
- TypeScript 5.6.0 — `tsc --noEmit` typecheck · `tsc -b` build 到 `dist/`
- ESLint 8.57.0 — `eslint . --ext ts --max-warnings=0`(零警告强约束)

## Key Dependencies

**Critical:**
- @prisma/client ^5.22.0 — 唯一 ORM · 单例 `apps/api/src/lib/prisma.ts` · 全局 HMR-safe(`globalThis.__prisma`)
- lucia ^3.2.0 — 双 session(主应用 `app_session` + admin `admin_session_id`)· 自写 adapter `apps/api/src/lib/auth/adapter.ts` + `lucia-admin.ts`
- bullmq ^5.0.0 — BullMQ Queue/Worker · 共用 ioredis 单例 · 多个 cron queue(`admin-kpi-snapshot` / `admin-cost-anomaly` / `admin-anomaly-detection` / `image-gen` 等)
- ioredis ^5.4.0 — Redis 客户端 · 单例 `apps/api/src/lib/redis.ts` · `maxRetriesPerRequest: null`(BullMQ 必需)
- zod ^3.23.0 — 全部 tRPC input 校验 · `z.object({...}).parse()` 在 `.input()` 调用中

**Infrastructure:**
- pino ^9.0.0 + pino-pretty ^11.0.0 — 结构化日志 · `apps/api/src/lib/logger.ts` · AsyncLocalStorage(`traceStore`)自动注入 traceId(`mixin()`)
- arctic ^3.7.0 — OAuth provider(state 生成 + callback 校验 · 主应用 OAuth · `apps/api/src/lib/auth/providers.ts`)
- ipaddr.js ^2.1.0 — admin IP CIDR 白名单解析(`apps/api/src/trpc/middleware/admin/ipWhitelist.ts`)
- handlebars ^4.7.8 — prompt 模板渲染(Specialist 用)
- node-cron ^3.0.0 — `daily-task` cron(`apps/api/src/cron/daily-task-runner.ts` · `0 0 * * *` Asia/Shanghai)
- papaparse ^5.5.3 + @types/papaparse — admin invites batchImport CSV 解析(`apps/api/src/trpc/routers/admin/invites.ts`)
- @react-pdf/renderer ^4.5.1 — admin PDF 生成(monthly bill + 法务取证 · `services/admin/cost/pdf-bill.service.ts` + `services/admin/audit/pdf-forensic.service.ts`)
- @upstash/ratelimit ^2.0.0 + @upstash/redis ^1.34.0 — 主应用速率限制(`apps/api/src/lib/rate-limit/*.ts`)
- @anthropic-ai/sdk ^0.30.0 + openai ^4.70.0 — LLM Gateway 双 provider(`apps/api/src/workers/llm-gateway/`)

**Workspace cross-imports:**
- @quanan/schemas — `packages/schemas/src/` · zod schemas 跨前后端复用(`workspace:*`)
- @quanan/ui ^ — UI primitive + admin PDF 模板(`workspace:^`)· `tsconfig.json` 显式映射 `@quanan/ui/admin/pdf`

## Configuration

**Environment:**
- 启动时校验(`apps/api/src/index.ts` 第 32-33 行)·`validateStartupConfig()` + `validateAdminStartupConfig()` · 缺失 OAuth 配置 → 进程 exit 1
- DB 连接校验 · `checkDbConnection()` 启动时跑 `SELECT 1` · 失败 → process.exit(1)(`apps/api/src/lib/prisma.ts`)
- `.env.example` 文档化所有必需 env vars · 实际 `.env` 不进 git(已在 .gitignore 内)

**Key configs required:**
- `DATABASE_URL` / `DATABASE_URL_TEST` — Prisma DB 连接(无默认 · 缺失 fail-fast)
- `REDIS_URL` — ioredis 默认 `redis://localhost:6379`(`apps/api/src/lib/redis.ts:9`)
- `APP_BASE_URL` / `ADMIN_BASE_URL` — CORS allow origin(默认 `http://localhost:5173` / `:5174`)
- `OAUTH_PROVIDER` — `mock` / `google`(`apps/api/src/lib/auth/oauth-admin-factory.ts`)
- `ADMIN_IP_WHITELIST_ENABLED` / `ADMIN_IP_WHITELIST_CIDRS` — admin 6 闸 IP 白名单
- `ADMIN_MFA_REQUIRED` — admin super_admin MFA 强制开关
- `DINGTALK_ENABLE` / `DINGTALK_WEBHOOK_URL` — 钉钉告警 webhook(异常检测告警)
- `LOG_LEVEL` — pino level
- `NODE_ENV` — `development` → in-process worker + pino-pretty · `production` → 严格 cookie + 无 query log

**Build:**
- `apps/api/tsconfig.json` — extends `tsconfig.base.json` · outDir `dist/` · paths `@/* → src/*`
- 根 `tsconfig.base.json` — 全 strict + `noUncheckedIndexedAccess` + `verbatimModuleSyntax` + `useUnknownInCatchVariables`(强类型门禁)

## Platform Requirements

**Development:**
- Node ≥ 20 · pnpm 9.15.9
- PostgreSQL 16 + pgvector 0.8(per project CLAUDE.md · 主开发库 `quanan` · 测试库 `quanan_test`)
- Redis 8.6.3(本地 brew 启动)
- 启动 · `pnpm --filter @quanan/api dev`(根 script `dev:api`)· tsx 直接跑 `src/index.ts`

**Production:**
- 推断目标 · Node container(Vercel / Railway 待 PRR · 见项目 CLAUDE.md §7)
- 双 worker 部署模式 · dev 内进程 spawn(`apps/api/src/index.ts:296-304`)· prod 独立 container(`pnpm worker:image-gen` 等)
- `DETACHED_PROCESS` 不适用 · daemon 模式仅限 ralph.py 编排器

---

*Stack analysis: 2026-05-13*
