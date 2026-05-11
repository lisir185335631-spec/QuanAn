<!-- refreshed: 2026-05-09 -->
# Architecture · QuanQn

**Analysis Date:** 2026-05-09
**Scope:** PRD-1 → PRD-5 完成期 · 12 stories PRD-5 全 PASSED · 8 / 14 Specialist 落地 · 2 子应用骨架 (apps/admin 占位)
**Inputs:** AGENTS.md §1.7 / §3 (18 LD) / §4.7 (17 R) · ARCHITECTURE.md (战略骨架) · 实测 grep + file:line
**对账原则:** 本文是"实际事实层" · 与 ARCHITECTURE.md "前瞻性设计" 偏差用 **DRIFT** 标记 + 引 `.agents/tech-debt.json`

---

## §1 System Overview

### §1.1 顶层视图(实际)

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  Browser (Chrome 120+ / Safari 17+ · ES2022 · React 18.3.1)                  │
│  └─ apps/web (Vite 5 · SPA · 34 routes lazy-chunked)                         │
│       ├─ RootLayout       `apps/web/src/layouts/RootLayout.tsx`              │
│       ├─ StepLayout       `apps/web/src/layouts/StepLayout.tsx`              │
│       ├─ pages/step/*     11 pages (step1~9 + step3b/4b)                    │
│       ├─ pages/tools/*    15 pages (Trending/Copywriting/Analysis/...)      │
│       ├─ pages/modules/*  6 pages (Diagnosis/Evolution/History/...)         │
│       └─ components/{ui,ToolForm,StepForm,ToolResult,StepResult}             │
└────────────────────────────┬────────────────────────────────────────────────┘
                             │ HTTPS · cookies (app_session) + X-Trace-Id
                             │ tRPC v11 batched POST /trpc/*
                             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  apps/api (Hono 4 + @hono/node-server · tRPC v11 · Node 20 · port 3000)     │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ apps/api/src/index.ts        Hono app + CORS + trace mw + OAuth      │   │
│  │   ├─ /auth/{login,callback,logout}  Lucia v3 + arctic OAuth          │   │
│  │   └─ /trpc/*                  fetchRequestHandler → appRouter        │   │
│  └──────────┬───────────────────────────────────────────────────────────┘   │
│             ▼                                                                │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ apps/api/src/trpc/                                                    │   │
│  │   ├─ trpc.ts                  initTRPC + traceMiddleware              │   │
│  │   ├─ context.ts               createContext (lucia → user)            │   │
│  │   ├─ middleware/                                                      │   │
│  │   │   └─ account-isolation.ts ★ protectedProcedure (RLS via $tx)     │   │
│  │   └─ routers/                 19 routers (1 _app + 18 sub)            │   │
│  │       ├─ auth.ts              auth.me (publicProcedure)               │   │
│  │       ├─ ipAccounts.ts        list/active/create/update/del/switch    │   │
│  │       ├─ stepData.ts          get/getAll/save/saveStream/progress     │   │
│  │       ├─ copywriting.ts       generate/freeGenerate/optimize/...      │   │
│  │       ├─ boomGenerate.ts      generate                                │   │
│  │       ├─ analysis.ts          analyze (structural)                    │   │
│  │       ├─ videoAnalysis.ts     analyze (viral)                         │   │
│  │       ├─ history.ts           list/detail/delete                      │   │
│  │       ├─ evolution.ts         getProfile/evolve/history/feedbackTrend │   │
│  │       ├─ diagnosis.ts         latest                                  │   │
│  │       ├─ knowledge.ts         getRecommendations/getFavorites/notes   │   │
│  │       ├─ trending.ts          fetch/listByIndustry/listByStyle        │   │
│  │       ├─ invite.ts            redeem                                  │   │
│  │       ├─ costLog.ts           logFeedback                             │   │
│  │       └─ {monetization,privateDomain,deepLearning,videoProduction}    │   │
│  └──────────┬───────────────────────────────────────────────────────────┘   │
│             ▼                                                                │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ apps/api/src/specialists/  ★ 8 / 14 Specialist 实现 (PRD-1~5)        │   │
│  │   ├─ base/BaseSpecialist.ts     PRD-4 模板方法 (active)               │   │
│  │   ├─ base/types.ts              五层 SpecialistConfig                 │   │
│  │   ├─ base/errors.ts             SchemaValidationError/LLMTimeoutError │   │
│  │   ├─ PositioningAgent.ts        step1 (industry) + step4 (execution)  │   │
│  │   ├─ BrandingAgent.ts           step3 (账号包装) + step3b (人设)      │   │
│  │   ├─ MonetizationAgent.ts       step4b (变现路径)                     │   │
│  │   ├─ TopicAgent.ts              step5 (爆款选题 · SSE)                │   │
│  │   ├─ VideoAgent.ts              step6 (拍摄计划)                      │   │
│  │   ├─ CopywritingAgent.ts        step7 (SSE) + free + boom             │   │
│  │   ├─ LivestreamAgent.ts         step8 (直播策划)                      │   │
│  │   └─ AnalysisAgent.ts           viral + structural (PRD-5)            │   │
│  │   未实现 (PRD-6+):                                                    │   │
│  │     PrivateDomainAgent · DiagnosisAgent · DeepLearnAgent ·            │   │
│  │     VoiceChatAgent · EvolutionAgent · DailyTaskAgent                  │   │
│  └──────────┬───────────────────────────────────────────────────────────┘   │
│             │   每个 Specialist execute() 内部强制走                          │
│             ▼                                                                │
│  ┌──────────────────────┐    ┌────────────────────────────────────────┐    │
│  │ services/             │    │ workers/llm-gateway/  ★ R-1 唯一入口   │    │
│  │   context-assembler/  │←─┐ │   ├─ index.ts        LLMGateway        │    │
│  │     ContextAssembler  │  │ │   ├─ anthropic-provider.ts             │    │
│  │       4 路 fetch +    │  │ │   ├─ openai-provider.ts                │    │
│  │       Promise.allSet- │  │ │   ├─ rate-limiter.ts (Upstash)         │    │
│  │       tled + 5s cap   │  │ │   └─ cost-logger.ts                    │    │
│  │   templates/ (8 mode) │  │ └────────┬───────────────────────────────┘    │
│  │   ip-progress/         │  │          │ Anthropic SDK + OpenAI SDK         │
│  │     IPProgressService │  │          │   (lazy · key 仅服务端)             │
│  └───────────┬───────────┘  │          ▼                                     │
│              │              │  ┌─────────────────────┐                       │
│              │              │  │ ext: api.anthropic, │                       │
│              │              │  │   api.openai.com    │                       │
│              │              │  └─────────────────────┘                       │
│              ▼              │                                                │
│  ┌──────────────────────┐  │  ┌──────────────────────┐                       │
│  │ workers/methodology- │  │  │ lib/                 │                       │
│  │   query/             │  │  │   prisma.ts (single) │                       │
│  │     getAll() / get() │  │  │   logger.ts (pino +  │                       │
│  │     in-memory const  │  │  │     ALS traceStore)  │                       │
│  └──────────────────────┘  │  │   auth/{lucia,       │                       │
│                            │  │     adapter,         │                       │
│                            │  │     providers}       │                       │
│                            │  │   compliance/        │                       │
│                            │  │     {pii-mask,       │                       │
│                            │  │     disclaimer} 🔴   │                       │
│                            │  │     ⚠️ 未接线 (§5.6) │                       │
│                            │  │   constants/ (9 类)  │                       │
│                            │  └──────────┬───────────┘                       │
└────────────────────────────────┼─────────┼──────────────────────────────────┘
                                 │ Prisma 5.22 ($transaction · SET LOCAL ROLE)
                                 ▼
                ┌────────────────────────────────────────────────┐
                │ PostgreSQL 16 + pgvector 0.8                   │
                │   prisma/schema.prisma · 39 models             │
                │     - 18 主应用表 (RLS 启用 14 张)              │
                │     - 13 admin 表 (RLS DISABLE · LD-A-3)        │
                │     - 4 支持表 (User/Session/InviteCode/...)    │
                │     - 4 P2 增量表                              │
                │   manual_rls.sql (15 ENABLE RLS · 12 policies) │
                │   manual_admin_rls.sql                         │
                │   manual_vector_indexes.sql (pgvector)         │
                └────────────────────────────────────────────────┘
                                 │
                                 ▼
                ┌────────────────────────────────────────────────┐
                │ Redis (Upstash REST · rate limit + future cache)│
                │   prefix: quanqn:rl:{plan}                     │
                │   token bucket 50/500/5000 calls/day            │
                └────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  apps/admin (P0 占位 · ADR-021 独立部署)                                     │
│    `apps/admin/src/index.ts` 仅 readme · 实施 P9.0 起 (PRD-10~14)           │
│    R-A1 ✅ 实证: grep 'admin' apps/web/src → 0 命中                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

### §1.2 关键事实速查

| 事实 | 数值 | 来源 |
|---|:-:|---|
| Monorepo workspace 数 | **6** (apps × 3 + packages × 3) | `pnpm-workspace.yaml` |
| TypeScript strict + noUncheckedIndexedAccess | ✅ | `tsconfig.base.json:17-29` |
| Prisma models | **39** | `grep -c '^model ' prisma/schema.prisma` |
| RLS-enabled tables | **15** | `grep -c 'ENABLE ROW LEVEL SECURITY' manual_rls.sql` |
| tRPC routers (active) | **19** (1 _app + 18 sub) | `apps/api/src/trpc/routers/` |
| Specialists 实现 / 总 | **8 / 14** | `apps/api/src/specialists/*.ts` (排 base/) |
| LLM SDK 引用 | **1 处** (LLMGateway 唯一) | `grep '@anthropic-ai/sdk\|from openai' apps -r` |
| 14 路由 routes | **34** (step 11 + tools 15 + modules 6 + aux 2) | `apps/web/src/router.tsx` |
| 测试文件 | **79** (unit 38 + integration 11 + e2e 19 + judge 11) | `find tests -name '*.ts' \| wc -l` |
| TS LOC (apps + packages) | ~16,000 | `wc -l` |

---

## §2 Component Responsibilities

| Component | 职责 | 主文件 | LOC |
|---|---|---|:-:|
| **Hono app** | HTTP 入口 · CORS · trace · OAuth /auth/* · tRPC 挂载 | `apps/api/src/index.ts` | 230 |
| **tRPC context** | lucia session 解析 · activeAccountId 注入 · X-Trace-Id 读取 | `apps/api/src/trpc/context.ts` | 58 |
| **traceMiddleware** | X-Trace-Id 生成或传 + AsyncLocalStorage 写入 (pino mixin auto-attach) | `apps/api/src/trpc/trpc.ts:34-39` | — |
| **accountIsolationMiddleware** | $transaction · SET LOCAL ROLE quanqn_app · set_config('app.current_account_id') · ★ 唯一允许 prisma.$executeRaw 处 | `apps/api/src/trpc/middleware/account-isolation.ts` | 58 |
| **protectedProcedure** | publicProcedure + accountIsolationMiddleware (默认) | `account-isolation.ts:52` | — |
| **globalProcedure** | publicProcedure + meta({isGlobal:true}) — 跳过 RLS · 仅用于 User/InviteCode/TrendingItem | `account-isolation.ts:58` | — |
| **appRouter** | 18 sub-router 合并 → AppRouter type → 由 packages/clients 同名 shadow 镜像导出给前端 | `apps/api/src/trpc/routers/_app.ts` | 47 |
| **BaseSpecialist (active)** | 模板方法 · execute() 4 步 (parse → assemble → invokeLLM with retry → writeCostLog) · fallback 路径 | `apps/api/src/specialists/base/BaseSpecialist.ts` | 254 |
| **BaseSpecialist (legacy)** | 旧版 run() 模板方法 · ★ DRIFT · `agents/specialists/CopywritingAgent` 仍用此版 但全代码无 import (dead code) | `apps/api/src/agents/base/BaseSpecialist.ts` | 71 |
| **8 Specialists** | 各 mode 子类 · 五层 SpecialistConfig · invokeLLM(ctx, req) → InvokeLLMResult | `apps/api/src/specialists/*.ts` | 162-530/file |
| **ContextAssembler** | 4 路并行 fetch (stepData / evolutionProfile / samples / RAG / constants) · Promise.allSettled · 5s timeout · 8 模板拼 systemPrompt | `apps/api/src/services/context-assembler/ContextAssembler.ts` | 177 |
| **LLMGateway** | ★ R-1 唯一 SDK 入口 · MODEL_BY_TIER (reasoning/lightweight) · primary→fallback→template 三级降级 · checkRateLimit (Upstash) · writeCostLog · stream/complete | `apps/api/src/workers/llm-gateway/index.ts` | 256 |
| **methodologyQueryWorker** | in-memory 常量(industries/hotElements/scriptTypes) · ContextAssembler 拼 prompt 用 | `apps/api/src/workers/methodology-query/index.ts` | 42 |
| **IPProgressService (active)** | getProgress(prisma, accountId) · 9 步进度 · 函数式 · 适配 RLS 事务 prisma | `apps/api/src/services/ip-progress/IPProgressService.ts` | 52 |
| **IPProgressService (legacy)** | progress() 单例服务 · ★ DRIFT · 仅 `tests/unit/api/ip-progress.test.ts` 引 · 主代码已迁 | `apps/api/src/agents/base/IPProgressService.ts` | 45 |
| **PII / Disclaimer** | maskString / appendDisclaimerIfSensitive · ★ DRIFT 严重 · 文件存在但 0 接线 (§5.6) | `apps/api/src/lib/compliance/{pii-mask,disclaimer}.ts` | 30+30 |
| **Prisma client** | 单例 + globalThis cache (dev hot reload) · checkDbConnection() | `apps/api/src/lib/prisma.ts` | 44 |
| **Lucia v3** | session cookie name=`app_session` (与 admin_session 区分 · LD-A-1) · prismaAdapter | `apps/api/src/lib/auth/lucia.ts` + `adapter.ts` + `providers.ts` | 40+76+151 |
| **OAuth providers** | MockProvider (dev) + GoogleProvider (arctic) · validateStartupConfig 启动时校验 SESSION_SECRET 长度 + provider name · prod 禁 mock | `apps/api/src/lib/auth/providers.ts` | 151 |
| **logger (pino)** | structured log · AsyncLocalStorage `traceStore` mixin auto-inject traceId · 严禁 console.log (LD-013) | `apps/api/src/lib/logger.ts` | 31 |
| **packages/schemas** | zod schemas 真理来源 · entities + step-results + specialist-io + admin (占位) | `packages/schemas/src/` | 1300 |
| **packages/clients** | 跨 app tRPC 共享 · router-types.ts 是 shadow router (避免前端 bundle @trpc/server) | `packages/clients/src/router-types.ts` | 343 |
| **packages/ui** | 共享 UI · base + admin (占位) · ★ DRIFT TD-005: 12 shadcn 组件实际在 `apps/web/src/components/ui/` 而非 `packages/ui/src/base/` | `packages/ui/src/` | 占位 |
| **apps/web router** | createBrowserRouter · 34 routes · React.lazy + webpackChunkName ("step", "tools", "modules") | `apps/web/src/router.tsx` | 122 |
| **apps/web tRPC client** | createTRPCReact + httpBatchStreamLink · credentials:include · 自动注入 X-Trace-Id | `apps/web/src/lib/trpc.ts` | 57 |
| **apps/web LS namespace** | aiip_memory_acc_{id}_{suffix} · per-account 隔离 · 5MB cap | `apps/web/src/lib/ls-namespace.ts` | 88 |
| **apps/admin** | P0 占位 · ADR-021 独立部署 · README + index.ts 仅 stub | `apps/admin/src/index.ts` | 12 |

---

## §3 Pattern Overview

**Overall:** **Layered Monorepo + 14 Specialist (8 实施) + LLMGateway 单入口 + RLS-tx-scoped 数据隔离**

### §3.1 Locked Decisions(已实施部分)

| LD | 设计目标 | 实际状态 | 实证 |
|:-:|---|---|---|
| **LD-001** | 95% Workflow + 5% Agent | ✅ 严格符合 · 全 router 都是确定性 procedure · 无自治循环 | `apps/api/src/trpc/routers/*.ts` 0 处 while/递归 |
| **LD-002** | 14 能力域 Specialist | 🟡 8 / 14 (PRD-1~5 完成 · 6 个未实施 · `SpecialistId` type 已声明 14 个) | `apps/api/src/agents/base/types.ts:9-14` |
| **LD-004** | 3 L5 自治 Agent 走外部 orchestrator (VoiceChatAgent/EvolutionAgent/DailyTaskAgent) | ⏭️ 未实施 (PRD-6+) | — |
| **LD-005** | BaseSpecialist 抽象类 + 模板方法 | ✅ 实施 · 8 specialist 全部 extends BaseSpecialist | `apps/api/src/specialists/base/BaseSpecialist.ts:40` |
| **LD-006** | 5 层记忆 (L1 hot / L2 core / L3 vector / L4 profile / L5 RAG) | 🟡 L2/L1 实施 · L3-L5 stub (return null/[]) · ContextAssembler `_fetchEvolutionProfile/_fetchSamples/_fetchRag` 全部 stub | `services/context-assembler/ContextAssembler.ts:97-113` |
| **LD-007** | IpProgressService + ContextAssembler 注入 | ✅ ContextAssembler 在 BaseSpecialist 模板 step 2 强制注入 | `specialists/base/BaseSpecialist.ts:80-86` |
| **LD-008** | 反馈飞轮 5 阶段 | 🟡 部分 · cost_log + feedback_log + EvolutionProfile 表存在 · 真实闭环留 PRD-6+ | `prisma/schema.prisma` (CostLog + FeedbackLog + EvolutionProfile) |
| **LD-009** | IpAccount 聚合根 + 多账号隔离 3 道闸 (RLS + middleware + UI) | ✅ middleware 实施 · RLS 14 表 · scripts/audit-redlines.sh 路径过期 (TD-NEW-2) | `account-isolation.ts:36-46` + `manual_rls.sql:17-30` |
| **LD-010** | LS↔DB 双写 4 规则 | ✅ 实施 · `apps/web/src/lib/ls-namespace.ts` + 各 page 用 stepLsKey/getToolLsKey | `apps/web/src/lib/ls-namespace.ts:21-31` |
| **LD-012** | 全部 LLM 调用走 LLMGateway | ✅ 强制 · `grep '@anthropic-ai/sdk\|from openai' apps -r` 仅命中 LLMGateway 一处 | `workers/llm-gateway/index.ts:13-21` |
| **LD-013** | 强类型 + zod | ✅ tsconfig.base.json strict + 6 严格子项 · 38 zod schemas in packages/schemas | `tsconfig.base.json:17-29` |
| **LD-A-1** | admin 子系统独立部署 | ✅ apps/admin 占位 · 主 web 0 引用 · admin_session vs app_session cookie 名隔离 | `apps/admin/src/index.ts` (12 行 stub) + `lucia.ts:14` |
| **LD-A-3** | admin 表 RLS DISABLE | ✅ admin 13 表不在 manual_rls.sql 启用列表 | `manual_rls.sql:32` 注释 |
| **LD-018** | PII mask + 行业免责 | 🔴 **DRIFT** · 文件存在 · 0 import · 0 接线 · 上线即合规风险 | `.planning/codebase/CONCERNS.md §1.6` |

**Key Characteristics:**
- 单进程 Hono + 单 PrismaClient + 内存常量(`methodologyQueryWorker`)
- 所有跨 layer 调用在 protectedProcedure transaction 内 — DB connection 持有时间 = 业务函数耗时(LLM 调用 5-30s 也在事务内)
- 无 worker 队列 · 无 BullMQ 实际接入(虽然 `bullmq` 在依赖里 · `apps/api/src/workers/` 6 个子目录全部 `.gitkeep` empty)
- 全 SDK lazy-load · API key 不入日志(`workers/llm-gateway/index.ts:86-100` AC-9 注释)

---

## §4 Layers

### §4.1 Presentation 层(`apps/web/`)

- **Purpose:** SPA 用户界面 · LS 双写 · 实时与 API 同步 · 表单 zod 校验 · markdown 渲染
- **Location:** `apps/web/src/`
- **Contains:** React 18 components · pages · layouts · lib (trpc/utils/ls-namespace) · hooks · 4 大组件目录(StepForm/StepResult/ToolForm/ToolResult/ui)
- **Depends on:** `@quanqn/schemas` (zod), `@quanqn/clients` (router types), `@quanqn/ui` (占位), 自身 `@/*`
- **Used by:** Browser

### §4.2 API 层(`apps/api/src/index.ts` + `apps/api/src/trpc/`)

- **Purpose:** HTTP 入口 + OAuth + tRPC 路由分发
- **Location:** `apps/api/src/index.ts` (Hono) + `apps/api/src/trpc/`
- **Contains:** Hono routes(/health, /auth/*, /trpc/*) + 19 tRPC routers
- **Depends on:** `lib/auth/lucia` · `lib/prisma` · `lib/logger` · `trpc/{context,trpc}` · `trpc/middleware/account-isolation`
- **Used by:** apps/web (cookies + X-Trace-Id)

### §4.3 Domain / Specialist 层(`apps/api/src/specialists/`)

- **Purpose:** 8 个领域 Agent · 每个对应一个/多个 mode · 模板方法 · 注 ContextAssembler + LLMGateway
- **Location:** `apps/api/src/specialists/`
- **Contains:** BaseSpecialist 抽象类 + 8 子类 + base/types + base/errors
- **Depends on:** `services/context-assembler` · `workers/llm-gateway` · `lib/{prisma,logger}` · `agents/base/types` (SpecialistId · ★ DRIFT TD-NEW-3 应迁)
- **Used by:** routers/{copywriting, boomGenerate, analysis, videoAnalysis, stepData} 等

### §4.4 Service 层(`apps/api/src/services/`)

- **Purpose:** 跨 router 复用的纯逻辑 · 无 LLM
- **Location:** `apps/api/src/services/`
- **Contains:**
  - `context-assembler/ContextAssembler.ts` (主) + types + 8 templates
  - `ip-progress/IPProgressService.ts` (函数式 getProgress)
- **Depends on:** `lib/prisma` · `workers/methodology-query`
- **Used by:** BaseSpecialist (assemble) · stepData router (progress)

### §4.5 Worker 层(`apps/api/src/workers/`)

- **Purpose:** 长尾基础设施 · LLM / 限流 / 计费 / RAG 查询 / 媒体处理
- **Location:** `apps/api/src/workers/`
- **Contains:**
  - `llm-gateway/{index, anthropic-provider, openai-provider, rate-limiter, cost-logger}.ts` (active)
  - `methodology-query/index.ts` (active)
  - `{file-parser, image-gen, stt, tts, trending-scraper}/.gitkeep` (占位 · 等 PRD-6+)
- **Depends on:** Anthropic SDK + OpenAI SDK + Upstash Redis + lib/prisma
- **Used by:** Specialists (LLMGateway 唯一) · ContextAssembler (methodologyQueryWorker)

### §4.6 Infrastructure 层(`apps/api/src/lib/`)

- **Purpose:** 跨切关注点 · DB 客户端 · 日志 · 鉴权 · 常量 · 合规
- **Location:** `apps/api/src/lib/`
- **Contains:**
  - `prisma.ts` (单例 + globalThis cache)
  - `logger.ts` (pino + AsyncLocalStorage `traceStore` mixin)
  - `auth/{lucia, adapter, providers}.ts`
  - `constants/` (9 类 · platforms/industries/hotElements/scriptTypes/...)
  - `compliance/{pii-mask, disclaimer}.ts` (★ 未接线)
- **Depends on:** Prisma · Lucia · Pino · arctic · @prisma/client/runtime
- **Used by:** 全 layer

### §4.7 Persistence 层(`prisma/` + PG + Redis)

- **Purpose:** 数据持久化 + RLS 强制隔离 + pgvector 向量(P5+)
- **Location:** `prisma/schema.prisma` + `prisma/migrations/`
- **Contains:**
  - 39 models (主 18 + admin 13 + global 4 + P2 4)
  - 4 prisma migrations + 3 manual SQL(manual_rls / manual_admin_rls / manual_vector_indexes)
  - 133 @@index/@@unique
- **Depends on:** PostgreSQL 16 + pgvector 0.8 + Redis 8
- **Used by:** lib/prisma

### §4.8 Cross-cutting · packages/

- **`@quanqn/schemas`** · zod schemas 真理来源 · 38 schemas across 5 sub-paths
- **`@quanqn/clients`** · 跨 app tRPC 类型导出 + shadow router (避免前端 bundle @trpc/server)
- **`@quanqn/ui`** · 主应用 + admin 共享 UI · ★ DRIFT 占位 · 12 shadcn 组件还在 apps/web/src/components/ui/ (TD-005)

---

## §5 Data Flow

### §5.1 主路径 · 用户调 Specialist 工具(以 PRD-5 freeGenerate 为例)

```text
1. 用户填表单
   apps/web/src/pages/tools/Generate.tsx (假设)
   ├─ react-hook-form + zod resolver (copywritingFreeGenerateInput from @quanqn/schemas)
   ├─ trpc.copywriting.freeGenerate.useMutation()
   └─ POST /trpc/copywriting.freeGenerate
      ↓
2. apps/api/src/index.ts:206 (Hono /trpc/* handler)
   ├─ trace mw 写 X-Trace-Id (index.ts:46-55) → traceStore.run()
   ├─ CORS check → cors mw (index.ts:33-42)
   └─ fetchRequestHandler → appRouter
      ↓
3. apps/api/src/trpc/context.ts:28 createContext(c)
   ├─ lucia.readSessionCookie(cookie 'app_session')
   ├─ lucia.validateSession() → user
   └─ ctx = { prisma, traceId, req, user, sessionId, activeAccountId: user.activeAccountId }
      ↓
4. apps/api/src/trpc/trpc.ts:34 traceMiddleware
   └─ traceStore.run({ traceId }, () => next({ ctx: { ...ctx, traceId } }))
      ↓
5. apps/api/src/trpc/middleware/account-isolation.ts:19 accountIsolationMiddleware
   ├─ if (meta?.isGlobal) → next() (跳过 RLS · 仅 ipAccounts.create/switchActive 等用)
   ├─ else if (!activeAccountId) → throw FORBIDDEN 'no_active_account'
   └─ ctx.prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SET LOCAL ROLE quanqn_app`              // 切非 superuser
        await tx.$executeRaw`SELECT set_config('app.current_account_id', ...)`
        await tx.$executeRaw`SELECT set_config('app.current_user_id', ...)`
        return next({ ctx: { ...ctx, prisma: tx } })  // ★ 后续 prisma 都是 tx
      })
      ↓
6. apps/api/src/trpc/routers/copywriting.ts:173 freeGenerate.mutation
   ├─ input zod parse: copywritingFreeGenerateInput
   ├─ const agentRes = await copywritingAgent.execute({ accountId, mode:'free', userInput, traceId })
      ↓
7. apps/api/src/specialists/CopywritingAgent.ts (extends BaseSpecialist)
   ↓ via BaseSpecialist.execute() template method
8. apps/api/src/specialists/base/BaseSpecialist.ts:67-191 BaseSpecialist.execute()
   ├─ Step 1: this.inputSchema.parse(req.userInput)   // zod 校验
   ├─ Step 2: ctx = await contextAssembler.assemble({ agentId, accountId, mode, userInput, needRag })
   │     ↓
   │   apps/api/src/services/context-assembler/ContextAssembler.ts:39 assemble()
   │   ├─ 4 路 Promise.allSettled (5s timeout each):
   │   │   - _fetchStepData(accountId)        // L2 真实
   │   │   - _fetchEvolutionProfile           // L4 stub return null (PRD-6+)
   │   │   - _fetchSamples                    // L4 stub return [] (PRD-6+)
   │   │   - _fetchRag                        // L5 stub return [] (D-025)
   │   │   - _fetchConstants → methodologyQueryWorker.getAll()
   │   ├─ _composeSystemPrompt(req, stepData, constants) → SPECIALIST_TEMPLATES[agentId].persona + ...
   │   │     ⚠️ DRIFT: 直接拼 stepData/userInput · 不 maskString (§5.6 LD-018 缺口)
   │   └─ return { systemPrompt, userPrompt, tools:[], metadata }
   ├─ Step 3: raw = await this.invokeLLM(ctx, req)  // 子类实现
   │     ↓
   │   apps/api/src/specialists/CopywritingAgent.ts invokeLLM(ctx, req)
   │   ├─ this._mode = req.mode ?? 'free'  // ⚠️ TD-014 _mode race
   │   └─ return await this._consumeStream(this.llmGateway.stream({...}))
   │        ↓
   │      apps/api/src/workers/llm-gateway/index.ts:111 complete() / stream()
   │      ├─ checkRateLimit(userId)  // Upstash · throws RateLimitError
   │      ├─ MODEL_BY_TIER[req.model_tier] → primary='claude-sonnet-4-6' fallback='gpt-4o'
   │      ├─ _callWithRetry(primary, req, 1)
   │      │   ├─ _callAnthropic / _callOpenAI (按 model 前缀分发)
   │      │   ├─ AbortController · timeout_ms (60s reasoning / 30s lightweight)
   │      │   └─ buildAnthropicPayload → client.messages.create({ signal })
   │      ├─ catch primary err → _callWithRetry(fallback, req, 0) → set fallback meta
   │      └─ writeCostLog({ req, res, success:true })  ★ Layer 1 (callType='complete')
   │           apps/api/src/workers/llm-gateway/cost-logger.ts:39
   ├─ Step 4: parsed = this.outputSchema.safeParse(raw.content)
   │   └─ if 失败 → retry 1 次 invokeLLM → 再失败 throw SchemaValidationError
   ├─ Step 5: this._writeCostLog(...)  ★ Layer 2 (callType='specialist_call')
   │           apps/api/src/specialists/base/BaseSpecialist.ts:208
   │           ⚠️ TD-013 双写 cost_log
   └─ return { result, isFallback, durationMs, tokensUsed, modelUsed, traceId }

   catch (err) {  // SchemaValidationError | LLMTimeoutError | 5xx → fallback path
     fallback = ctor.fallbackTemplate?.[req.mode]
     if (fallback) → write cost_log(model='fallback', tokens=0) → return fallback as TOut
     else throw err  // 让用户看真错(AC-9)
   }
      ↓
9. apps/api/src/trpc/routers/copywriting.ts:186 写 history 表
   ├─ prisma.history.create({
   │     accountId: activeAccountId!,
   │     agentId: 'CopywritingAgent', agentMode: 'free',
   │     content: freeResult.markdown, contentType: 'markdown',
   │     scriptType, elements, isFallback, tokensUsed, modelUsed, durationMs, traceId
   │   })
   ├─ select: HISTORY_FREE_SELECT
   └─ return row  → tRPC 序列化
      ↓
10. tx COMMIT (set_config 自动清除 · isolation 离 mw 即失效)
      ↓
11. Response 走 Hono · X-Trace-Id 写 response header (index.ts:54)
      ↓
12. apps/web 收 response
    └─ trpc.copywriting.freeGenerate.useMutation onSuccess
        - 写 LS (getToolLsKey + result)
        - setState 渲染 ToolResult (markdown via react-markdown + remark-gfm)
```

### §5.2 Auth 路径 · OAuth 登录

```text
1. /auth/login (apps/api/src/index.ts:61)
   ├─ getProvider() (mock | google · OAUTH_PROVIDER env)
   ├─ generateState() + provider.getAuthorizationUrl(state)
   ├─ setCookie('oauth_state', state) + 'oauth_code_verifier' (PKCE)
   └─ redirect → Google / mock callback URL

2. /auth/callback (apps/api/src/index.ts:95)
   ├─ requiresCsrfCheck(provider.name) → state vs storedState 校验
   │   失败 → audit_log 写 security_alert + 401
   ├─ provider.validateCallback({code, state, codeVerifier}) → userInfo
   ├─ prisma.user.upsert({ where:{openId}, update:{lastSignedIn}, create:{...} })
   ├─ lucia.createSession(user.id, {})
   ├─ setCookie(sessionCookie 'app_session' · httpOnly · sameSite:Lax · secure:isProd)
   ├─ audit_log.create({ userId, eventType:'auth.login', payload:{provider}, traceId })
   └─ redirect → APP_BASE_URL ('/')

3. /auth/logout (apps/api/src/index.ts:188)
   ├─ lucia.invalidateSession(sessionId)
   ├─ blank cookie
   └─ redirect → '/'
```

### §5.3 Step5 / Step7 SSE 流(saveStream subscription)

```text
apps/web step5/step7 调 trpc.stepData.saveStream.subscribe(input)
  ↓
apps/api/src/trpc/routers/stepData.ts:305 subscription async function*
  ├─ yield { type: 'started', traceId } 立即(首 chunk < 3s)
  ├─ const agentRes = await topicAgent.execute(...) | copywritingAgent.execute(...)
  ├─ prisma.stepData.upsert(完整字段 · status='completed'/'fallback')
  └─ yield { type: 'done', result }
  ↓
SSE chunks 经 trpc httpBatchStreamLink 流回 apps/web
```

### §5.4 RLS 强制路径

```text
任何 protectedProcedure → accountIsolationMiddleware → $transaction
   ├─ SET LOCAL ROLE quanqn_app  (非 superuser · RLS 强制启用)
   ├─ set_config('app.current_account_id', activeAccountId, true) ★ true=is_local=tx 范围
   ├─ set_config('app.current_user_id', user.id, true)
   └─ next({ ctx: { prisma: tx } })
      ↓
所有 prisma.<model>.<op>() 在 tx 内
   ↓ Postgres
RLS Policy 自动 WHERE: account_id = NULLIF(current_setting('app.current_account_id', true), '')::int
   - 缺 setting → NULLIF→NULL→::int=NULL → 0 行
   - 跨账号查 → 0 行
   - admin 13 表 RLS DISABLE → super_admin 跨账号(P9.0+ 实施)
   ↓
COMMIT → set_config 自动清除
```

### §5.5 Cost / Audit 写入

```text
LLMGateway.complete() 成功 / 失败:
  └─ cost-logger.ts:39 writeCostLog (callType='complete', userId, accountId, agentId,
       modelTier, modelUsed, provider, tokens, costUsd estimate, durationMs, success,
       fallback 字段, traceId)

BaseSpecialist.execute() 完成:
  └─ apps/api/src/specialists/base/BaseSpecialist.ts:208 _writeCostLog (callType='specialist_call',
       agentId, accountId, traceId, model, tokens, durationMs, isFallback, target jsonb={stepKey,agentId})

→ 同一 trace_id 2 行 cost_log · TD-013 待 PRD-11 admin 仪表盘治理
```

### §5.6 Feedback / Topic 写入

```text
trpc.costLog.logFeedback(stepKey, agentId, type='good'|'bad', traceId?)
  ├─ generateHttpTraceId() fallback (apps/api/src/trpc/trpc.ts:25)
  └─ prisma.costLog.create({ eventType: input.type, callType: 'feedback',
       modelTier:'none', modelUsed:'none', provider:'client', tokens:0,
       target: { stepKey, agentId, traceId } })
       (apps/api/src/trpc/routers/costLog.ts:25-58)

→ DB error 不 throw · log error + return { ok: false } (UX 不阻塞)
```

---

## §6 Key Abstractions

### §6.1 BaseSpecialist (active · `apps/api/src/specialists/base/BaseSpecialist.ts`)

**Purpose:** 统一所有 Specialist 的执行模板 · 强制 4 步 + fallback

```ts
export abstract class BaseSpecialist<TIn, TOut> {
  abstract readonly config: SpecialistConfig;
  abstract readonly inputSchema: z.ZodType<TIn>;
  abstract readonly outputSchema: z.ZodType<TOut>;
  static readonly fallbackTemplate?: Record<string, unknown>;
  protected readonly llmGateway: ILLMGateway;

  async execute(req: SpecialistRequest<TIn>): Promise<SpecialistResponse<TOut>> {
    /* Step 1-5 模板 */
  }

  protected abstract invokeLLM(ctx: AssembledContext, req: SpecialistRequest<TIn>): Promise<InvokeLLMResult>;
  private async _writeCostLog(data: {...}): Promise<void> { /* 写 cost_log */ }
}
```

**Five-Layer SpecialistConfig** (`specialists/base/types.ts`):
1. **persona** · role / goal / boundaries[]
2. **memory** · l1_readonly / l2_read / l2_write
3. **knowledge** · constants / rag / refresh_interval_sec
4. **tools** · llm.complete / llm.stream / image.generate / file.parse / tool.custom
5. **execution** · timeout_ms / retry / model_tier / streaming / parallel_group?

**已实施 8 specialists:**
| Specialist | Modes | streaming | model_tier | parallel_group | 文件 |
|---|---|:-:|---|---|---|
| PositioningAgent | industry / execution | ❌ | reasoning | — | `specialists/PositioningAgent.ts` |
| BrandingAgent | step3 / step3b | ❌ | reasoning | — | `specialists/BrandingAgent.ts` |
| MonetizationAgent | step4b | ❌ | reasoning | — | `specialists/MonetizationAgent.ts` |
| TopicAgent | step5 (5 categories SSE) | ✅ | reasoning | topic | `specialists/TopicAgent.ts` |
| VideoAgent | step6 | ❌ | reasoning | — | `specialists/VideoAgent.ts` |
| CopywritingAgent | step7 / free / boom (acquisition→PRD-6) | ✅ | reasoning | copywriting | `specialists/CopywritingAgent.ts` |
| LivestreamAgent | step8 | ❌ | reasoning | — | `specialists/LivestreamAgent.ts` |
| AnalysisAgent | viral / structural | ❌ | lightweight | — | `specialists/AnalysisAgent.ts` |

### §6.2 SpecialistRequest / SpecialistResponse

```ts
interface SpecialistRequest<TIn> {
  accountId: number;
  mode?: string;
  userInput: TIn;
  traceId?: string;
  stepKey?: string;
}

interface SpecialistResponse<TOut> {
  result: TOut;
  isFallback: boolean;
  durationMs: number;
  tokensUsed: { prompt: number; completion: number; total: number };
  modelUsed: string;
  traceId: string;
}
```

### §6.3 LLMGateway (`apps/api/src/workers/llm-gateway/index.ts`)

```ts
class LLMGateway {
  selectTier(modelHint, _costBudget): ModelTier { return modelHint; }   // P0 pass-through
  async complete(req: CompleteRequest): Promise<CompleteResponse> { /* 限流→primary→fallback→template→costLog */ }
  async *stream(req): AsyncIterable<StreamChunk> { /* TODO P3 真流式 · P0 yield meta+done */ }
  embed(text): Promise<number[]> { /* TODO P3 OpenAI text-embedding-3-small */ }
}
const MODEL_BY_TIER = {
  reasoning:   { primary: 'claude-sonnet-4-6', fallback: 'gpt-4o' },
  lightweight: { primary: 'claude-haiku-4-5',  fallback: 'gpt-4o-mini' },
};
```

### §6.4 ContextAssembler (`apps/api/src/services/context-assembler/ContextAssembler.ts`)

```ts
class ContextAssembler {
  async assemble(req: AssembleRequest): Promise<AssembledContext> {
    // Promise.allSettled 4 路 + 5s cap
    // _fetchStepData (real) + _fetchEvolutionProfile (stub) + _fetchSamples (stub) + _fetchRag (stub) + _fetchConstants (real)
    // _composeSystemPrompt(req, stepData, constants) → SPECIALIST_TEMPLATES[agentId].persona/methodology
    // _formatUserPrompt(input) → JSON string in <user_input>...</user_input>
    return { systemPrompt, userPrompt, tools:[], metadata };
  }
}
const FETCH_TIMEOUT_MS = 5_000;
```

**8 templates:** `services/context-assembler/templates/{positioning, branding, monetization, topic, video, copywriting, livestream, analysis}.ts`

### §6.5 protectedProcedure / globalProcedure

```ts
// apps/api/src/trpc/middleware/account-isolation.ts:52-58
export const protectedProcedure = publicProcedure.use(accountIsolationMiddleware);
export const globalProcedure = publicProcedure.meta({ isGlobal: true });
```

**用法分布(实测):**
- protectedProcedure · 49 处(全部业务 router 默认)
- globalProcedure · 4 处:
  - `routers/ipAccounts.ts:57` create (用户首次创账号 · 还无 activeAccountId)
  - `routers/ipAccounts.ts:101` switchActive (切账号本身)
  - `routers/invite.ts:39` redeem
  - `routers/trending.ts:42-56` fetch + listByIndustry + listByStyle (TrendingItem 全局表)
- publicProcedure · 1 处:`routers/auth.ts:9` me (允许未登录返回 ok:false)

### §6.6 traceStore (AsyncLocalStorage · `apps/api/src/lib/logger.ts`)

```ts
export const traceStore = new AsyncLocalStorage<{ traceId: string }>();
export const logger = pino({
  ...,
  mixin() {
    const store = traceStore.getStore();
    return store?.traceId ? { traceId: store.traceId } : {};
  },
});
```

→ Hono mw + tRPC traceMiddleware 都 `traceStore.run({ traceId }, () => next())` · pino 自动 inject

### §6.7 Shadow Router (`packages/clients/src/router-types.ts`)

```ts
const _t = initTRPC.create();
const _shadowRouter = _t.router({ auth: _t.router({ me: _t.procedure.query(...) }), ... });
export type AppRouter = typeof _shadowRouter;
```

**Why:** 前端 import type AppRouter · TS 类型擦除 · @trpc/server 不进 browser bundle
**TD:** P1 改 TypeScript project references(`packages/clients/src/router-types.ts:8` 注释)

---

## §7 Entry Points

### §7.1 apps/api · Hono server

- **Location:** `apps/api/src/index.ts`
- **Triggers:** `tsx watch src/index.ts` (dev) / `tsx src/index.ts` (start) / `tsc -b` (build)
- **Port:** 3000 (default · `process.env.PORT`)
- **Responsibilities:**
  - validateStartupConfig() (env 校验 · prod 禁 mock · SESSION_SECRET ≥ 32)
  - cors mw (origin = APP_BASE_URL || http://localhost:5173 · credentials:include)
  - Hono trace mw (X-Trace-Id 写入 response + traceStore.run)
  - /health (no-op)
  - /auth/{login,callback,logout} (Lucia + arctic OAuth)
  - /trpc/* (fetchRequestHandler → appRouter)
  - checkDbConnection() 启动时验 DB · 失败 process.exit(1)
- **Bind:** `serve({ fetch: app.fetch, port })`

### §7.2 apps/web · Vite SPA

- **Location:** `apps/web/src/main.tsx`
- **Triggers:** `vite` (dev :5173 · proxy /api/trpc → :3000) / `vite build` (dist/) / `vite preview`
- **Responsibilities:**
  - createRoot('#root')
  - StrictMode + trpc.Provider + QueryClientProvider + RouterProvider
  - Aurelian Dark fonts (`@fontsource/{manrope,plus-jakarta-sans,inter}` self-hosted)
  - 34 routes (createBrowserRouter 在 `apps/web/src/router.tsx`)

### §7.3 apps/admin · 占位

- **Location:** `apps/admin/src/index.ts` (12 行 stub)
- **Triggers:** P9.0 启动 (PRD-10 起)
- **Responsibilities:** 待实施 · ADMIN-ARCHITECTURE.md §8.2

### §7.4 Test Runners

- `vitest run` (root vitest.config.ts) · 跑 tests/unit + tests/integration
- `vitest run --config vitest.judge.config.ts` (LLM Judge · 22 cases)
- `playwright test` (tests/e2e · 19 specs)
- `tsx tests/llm-judge/runner.ts` (legacy · 待整合)

---

## §8 Architectural Constraints

- **Threading:** 单 Node 进程 · event loop · 无 worker_threads · LLM 调用 await(non-blocking) · pgvector 查询 future 走 Promise.all
- **Global state:**
  - `globalThis.__prisma` (dev hot reload 防泄漏 · `apps/api/src/lib/prisma.ts:11-14`)
  - `_anthropicClient` / `_openaiClient` lazy 单例 (`workers/llm-gateway/index.ts:87-88`)
  - `_provider` lazy 单例 (`lib/auth/providers.ts:93`)
  - `_limiters` Map<plan, Ratelimit> (`workers/llm-gateway/rate-limiter.ts:34`)
  - `Specialist._mode` instance state — ★ TD-014 · 5 specialists 都有 · 单 user 串行安全 · 高并发 race
- **Connection pool:** Prisma 默认 `physical_cpus * 2 + 1` · accountIsolationMiddleware 每请求 wrap $transaction · DB conn 持有 = LLM 时长 · ★ 高 QPS 风险(留 PRR)
- **Circular imports:** 0 已知(verbatimModuleSyntax + tsc strict 防住)
- **No console.log:** LD-013 + AGENTS §6.9 · 强制用 logger
- **No direct LLM SDK:** R-1 · grep 仅命中 `workers/llm-gateway/index.ts:13-21`
- **No prisma.$executeRaw 除一处:** AC-6 · 仅 `account-isolation.ts:38-41`
- **strict + noUncheckedIndexedAccess:** `tsconfig.base.json:17-29` 强制
- **eslint --max-warnings=0:** `apps/api/package.json:11`(0 warning 强制)

---

## §9 Anti-Patterns(本项目历史/待修)

### Anti-Pattern A · 双 BaseSpecialist 时序错位

**What happens:** `apps/api/src/agents/base/BaseSpecialist.ts` 与 `apps/api/src/specialists/base/BaseSpecialist.ts` 共存 · 字段不同(老版 run() / 新版 execute()) · 老版唯一活引用是 `agents/specialists/CopywritingAgent.ts` (示例代码 · 0 业务引用)
**Why it's wrong:** Ralph 找文件容易选错 · 类型仍依赖 `agents/base/types`(SpecialistId)却又用新版 BaseSpecialist · 半途
**Do this instead:** 把 `agents/base/types.ts` (`SpecialistId`/`ModelTier`/`generateSpecialistTraceId`) 迁到 `specialists/base/types.ts` · 删 `agents/` 目录 · TD-NEW-3 已记录

### Anti-Pattern B · cost_log 双写

**What happens:** LLMGateway.complete() 写一条(callType='complete') · BaseSpecialist.execute() 后再写一条(callType='specialist_call') · 同 trace_id 2 行
**Why it's wrong:** 未来仪表盘按 trace_id 聚合时需去重 · 字段重叠 80% · 容易解释为 bug
**Do this instead:** PRD-11 admin 启动时治理 · 选项 A 仪表盘按 callType 分维度 / 选项 B 合并到 LLMGateway 单写 + 在元数据里 emit stepKey
**Tracker:** TD-013

### Anti-Pattern C · Specialist._mode instance state

**What happens:** PositioningAgent / BrandingAgent / AnalysisAgent / VideoAgent / CopywritingAgent 等 5 个 specialist 都有 `private _mode: Mode = 'industry'` instance state · invokeLLM 内 set · outputSchema getter 读
**Why it's wrong:** 高并发(同 specialist 实例并发处理多个 user 请求)时 race window · 读到错误 mode → outputSchema 错配
**Do this instead:** 选项 A · BaseSpecialist 接口改 `outputSchema(req)` method · 选项 B · AsyncLocalStorage 隔离 _mode
**Tracker:** TD-014 · 留 PRD-7+ 高并发治理

### Anti-Pattern D · ContextAssembler 直接拼 stepData/userInput 进 prompt(无 PII mask)

**What happens:** `services/context-assembler/ContextAssembler.ts:75 _composeSystemPrompt` + `:169 _formatUserPrompt` 直接 `JSON.stringify(input)` 进 prompt · 用户邮箱/手机号/身份证/银行卡原文进 LLM
**Why it's wrong:** 违 LD-018 / R-14 · 上线即合规风险(数据保护法 + 行业准入)
**Do this instead:** ContextAssembler `_formatUserPrompt(input)` 强制走 `lib/compliance/pii-mask.ts maskString()` · BaseSpecialist 末尾按 industry 走 `appendDisclaimerIfSensitive` · audit-ld.sh 加 grep 强制
**Tracker:** TD-NEW-1 · 🔴 CRITICAL · §5.6

### Anti-Pattern E · 12 shadcn 组件路径偏差

**What happens:** SCAFFOLD §A.1 + PRD-1 US-005 AC 要求 `packages/ui/src/base/` · 实际写在 `apps/web/src/components/ui/`
**Why it's wrong:** admin 子应用 P9.0 启动时无法 `import from '@quanqn/ui/base'` 复用 · 必须 lift 一遍
**Do this instead:** P9.0 admin 启动前 · `mv apps/web/src/components/ui/* packages/ui/src/base/` · web import 改 `@quanqn/ui/base`
**Tracker:** TD-005 · scheduled

### Anti-Pattern F · 6 worker 子目录全空

**What happens:** `apps/api/src/workers/{file-parser, image-gen, stt, tts, trending-scraper}/.gitkeep` 全 0 字节 · `bullmq` 依赖 install 但无任何 use
**Why it's wrong:** 占位骨架 OK · 但下一个新人/Ralph 看到 `import bullmq` 期望存在 BullMQ 队列基础设施 · 实际无
**Do this instead:** 留占位但更新 README/AGENTS 注明"PRD-X 启动时实施" · 或 P0 阶段从 package.json 移除 `bullmq` 依赖直到真用

### Anti-Pattern G · saveStream 长事务持锁

**What happens:** `apps/api/src/trpc/routers/stepData.ts:305 saveStream subscription` 在 protectedProcedure transaction 内 · LLM 调用 5-30s 全程持有 1 个 DB connection
**Why it's wrong:** 高 QPS 时 connection pool 耗尽风险
**Do this instead:** 真实负载测试时(PRR)· 把 LLM 调用挪出事务 · 仅 result 写 stepData 时再开短事务
**Tracker:** §2.5 风险点 · 待 PRR 测

---

## §10 Error Handling

**Strategy:** 分层 throw + 顶层 catch · LLM 错误 fallback · cost_log 错误吞掉 · DB 错误传到 tRPC

**Patterns:**
- **InputSchema 错误:** zod throws ZodError → tRPC 自动 BAD_REQUEST(详 `apps/api/src/specialists/base/BaseSpecialist.ts:77`)
- **OutputSchema 错误:** retry 1 次 → 仍失败 → throw `SchemaValidationError` → BaseSpecialist 顶层 catch 触发 fallback path(若有 fallbackTemplate)否则 re-throw
- **LLM Timeout:** AbortController · `Error.name === 'AbortError'` → throw `LLMTimeoutError(agentId, timeout_ms)` → 顶层 catch fallback
- **5xx Error:** message includes '5xx' → 顶层 catch fallback
- **RateLimitError:** `RateLimitError` extends Error · 由 LLMGateway throw · tRPC 不捕获 → 暴露给前端
- **OAuth FailedCallback:** `validateCallback` throws → /auth/callback 写 audit_log security_alert + 401
- **DB FORBIDDEN:** activeAccountId 缺失 → `accountIsolationMiddleware` throws TRPCError({code:'FORBIDDEN'})
- **cost_log 写失败:** try-catch + log error · 不 throw(LLM 调用主线不阻塞 · `BaseSpecialist.ts:249-251` AC-8/AC-11)
- **DB 错误(business):** propagate · tRPC `onError` log + INTERNAL_SERVER_ERROR
- **logFeedback DB 错:** 吞掉 + return `{ ok: false }`(UX 不阻塞 · `costLog.ts:55-57` AC-12)
- **Hono 顶层 unhandled:** `start().catch(err => { logger.error; process.exit(1) })`(`index.ts:226-229`)

---

## §11 Cross-Cutting Concerns

### §11.1 Logging

- **Framework:** pino 9 + pino-pretty (dev only · `lib/logger.ts:18-20`)
- **Approach:**
  - 严禁 console.log (LD-013)
  - traceId 自动 inject(AsyncLocalStorage `traceStore` mixin)
  - 每个关键事件用结构化 key:`logger.info({ traceId, agentId, accountId }, 'specialist.start')`
  - level via `process.env.LOG_LEVEL`(default 'info')

### §11.2 Validation

- **Framework:** zod 3.23
- **Approach:**
  - input schemas in `packages/schemas/src/specialist-io/*.schema.ts`(canonical)
  - tRPC routers inline duplicate(comment 注:`Note: Zod schemas inlined — @quanqn/schemas/specialist-io has canonical definition for client use`)
  - BaseSpecialist `inputSchema.parse` Step 1 + `outputSchema.safeParse` Step 4(retry 1)
  - 前端 react-hook-form `@hookform/resolvers` + zodResolver

### §11.3 Authentication

- **Framework:** Lucia v3 + arctic 3
- **Approach:**
  - cookie name `app_session`(主)vs `admin_session`(P9.0 启动 · LD-A-1)
  - cookie httpOnly + sameSite:Lax + secure (prod) + AC-15 prod 禁 mock provider
  - session 存 PG `sessions` 表(Prisma adapter)
  - prod 必须 google · OAUTH_PROVIDER env 校验 startup
  - X-CSRF · state cookie + storedState 校验 (mock 跳过)
  - PKCE codeVerifier cookie

### §11.4 Authorization

- **Strategy:** RLS-tx-scoped + middleware
- **Approach:**
  - protectedProcedure 默认 · activeAccountId 缺失 → FORBIDDEN
  - globalProcedure for User/InviteCode/TrendingItem(无账号上下文)
  - SET LOCAL ROLE quanqn_app 切非 superuser(superuser 默认 BYPASSRLS)
  - PG RLS policy 12 张账号表 · `ip_accounts` 用 user_id 隔离(聚合根)· 其他用 account_id

### §11.5 Trace Propagation

- HTTP 入: `index.ts:46-55` Hono mw 读 X-Trace-Id 或 `randomBytes(8).toString('hex')`(8 byte=16 hex char)
- ALS 写: `traceStore.run({ traceId }, () => next())`
- pino 自动 inject (mixin)
- tRPC 单独 mw 同样 read + run (`trpc.ts:34-39`)
- BaseSpecialist 读 `req.traceId` 或调 `generateSpecialistTraceId(accountId, agentId)` (含语义 · `tr_${accountId}_${agentId}_${ts}_${rand}`)
- LLMGateway request `metadata.trace_id` 写入 cost_log

### §11.6 Cost Tracking

- 双层(TD-013):
  - Layer 1 LLMGateway · `cost-logger.ts:39 writeCostLog` (callType='complete')
  - Layer 2 BaseSpecialist · `BaseSpecialist.ts:208 _writeCostLog` (callType='specialist_call' · target jsonb={stepKey,agentId})
- LLMGateway 失败时(BOTH_FAILED)仍写 1 行 errorCode='BOTH_FAILED'
- prisma.costLog.create 失败 → log + 不 throw(AC-8)

### §11.7 PII / 行业免责(LD-018)

- 文件: `apps/api/src/lib/compliance/{pii-mask,disclaimer}.ts` 已存在
- 接线: 🔴 **未接线** · `grep import.*compliance apps/api/src` → 0 命中
- 影响: 上线即合规风险 · §5.6 / TD-NEW-1
- 修复: §6 P0 critical action(详 CONCERNS.md §5)

---

## §12 Tech Stack 速查(详 STACK.md)

- **Languages:** TypeScript 5.6+ (strict + noUncheckedIndexedAccess) · SQL · Bash
- **Backend:** Node 20 · Hono 4 · tRPC v11 · Prisma 5.22 · Lucia 3 · arctic 3 · pino 9 · zod 3 · Anthropic SDK 0.30 · OpenAI SDK 4.70
- **Frontend:** React 18.3 · Vite 5.4 · Tailwind 3.4 · shadcn (本地 12 组件) · @radix-ui (12 primitives) · @tanstack/react-query 5.59 · zustand 4.5 · react-hook-form 7.53 · sonner 1.7
- **Test:** vitest 2.1 · Playwright 1.48 · @testcontainers/postgresql 10 · nock 14
- **DB:** PostgreSQL 16 · pgvector 0.8 · Redis 8 (Upstash REST optional)
- **Build:** turbo 2 · pnpm 9.15.9 · TS project references

---

## §13 References

- **AGENTS.md** §1.7 设计决策 + §3 18 LD + §4.7 17 R · 决策权威
- **ARCHITECTURE.md** v0.4 · 199K · 9 章战略骨架(本文是事实层 · 与之对账)
- **ADMIN-ARCHITECTURE.md** v0.2 · 114K · admin 子系统(P9.0 启动)
- **DATA-MODEL.md** §9 RLS + §13 admin 13 表 + §13.8 admin RLS DISABLE
- **PROMPTS.md** Specialist prompt 模板权威
- **PRD-MASTER.md** 14 PRD 总纲 + 35 反例
- **`.agents/tech-debt.json`** 15 TD(本文 §9 + CONCERNS.md §3 完整)
- **`.agents/rca/`** RCA-001(audit delay)/ RCA-002(developer timeout)/ RCA-003(econnreset)
- **`.planning/codebase/CONCERNS.md`** Security boundaries + 流程加固 + critical action items

---

*Architecture analysis: 2026-05-09 · QuanQn PRD-1~PRD-5 完成期 · 8 / 14 Specialist 落地 · 文件总数 ~16K LOC · 39 prisma models · 19 tRPC routers · 0 critical bug · 1 critical compliance gap (PII 未接线)*
