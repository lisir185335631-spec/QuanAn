<!-- refreshed: 2026-05-11 -->
# Architecture · QuanQn

**Analysis Date:** 2026-05-11
**Scope:** PRD-1 → PRD-8 完成期 · 14/14 Specialist 类全部存在(11 生成型 active · 3 L5 自治型走双路径)· 3 orchestrator(BullMQ + node-cron + tRPC subscription)· 5 路 ContextAssembler · L1 Buffer Redis
**Inputs:** AGENTS.md §3(18 LD) / §4.5(单向依赖)/ §11.6(后端实施沉淀 8 条) · ARCHITECTURE.md(战略骨架)· apps/api/src 实测 grep + file:line · 与 PRD-5 期(8/14 Specialist · 4 路 ContextAssembler) 对比
**对账原则:** 本文是 "实际事实层" · 与 ARCHITECTURE.md(战略)有偏差用 **DRIFT** 标记 + 引 `.agents/tech-debt.json`

---

## §1 System Overview

### §1.1 顶层视图(实际 · PRD-8 完成态)

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│  Browser (Chrome 120+ / Safari 17+ · ES2022 · React 18.3 · Vite 5 SPA)        │
│  apps/web (105 ts/tsx files · 34 routes · React.lazy chunked)                 │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ RootLayout (Header + Toaster + Suspense)                                │  │
│  │ └─ StepLayout (FeedbackButton injection · STEP_AGENT_MAP)              │  │
│  │     └─ pages/step/*  (Step1~9 + 3b/4b · 11 pages)                       │  │
│  │ └─ pages/tools/*  (15 工具页 · Trending/Copywriting/.../VoiceChat)     │  │
│  │ └─ pages/modules/*  (6 模块 · Accounts/DailyTasks/Evolution/History/…) │  │
│  │ └─ pages/{Login,Settings,IpPlan,NotFound}                               │  │
│  │ └─ hooks/{useAuth,useStepData,useActiveAccount,useEvolution}            │  │
│  │ └─ components/{Header,FeedbackButton,StepForm,StepResult,ui/}           │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────┬─────────────────────────────────────────────────┘
                             │ HTTPS · cookies (app_session) + X-Trace-Id 头
                             │ tRPC v11 · httpBatchStreamLink + subscription
                             │   credentials:'include' · responseType=streaming
                             ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│  apps/api (Hono 4 + @hono/node-server · tRPC v11 · Node 20 · port 3000)      │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ apps/api/src/index.ts                                                │    │
│  │   · validateStartupConfig()  (启动前校验 env)                        │    │
│  │   · CORS + trace mw (X-Trace-Id ALS)                                 │    │
│  │   · /health · /auth/{login,callback,logout}  (Lucia v3 + arctic)     │    │
│  │   · /trpc/*  → fetchRequestHandler → appRouter                       │    │
│  │   · dev 模式 in-process: imageGenWorker + dailyTaskWorker           │    │
│  │   · dailyTaskCron.start()  (0 0 * * * Asia/Shanghai)                 │    │
│  └────────┬────────────────────────────────────────────────────────────┘    │
│           ▼                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ apps/api/src/trpc/                                                   │    │
│  │   trpc.ts                  initTRPC + Meta{isGlobal?} + traceMw      │    │
│  │   context.ts               lucia session → user + activeAccountId   │    │
│  │   middleware/                                                        │    │
│  │     account-isolation.ts   ★ protectedProcedure ($tx + SET LOCAL)   │    │
│  │     trace.ts               re-export traceMw + extractTraceId       │    │
│  │   routers/                 25 routers (1 _app + 24 sub · 3302 LOC)   │    │
│  │     ┌─────────────────────────────────────────────────────────────┐ │    │
│  │     │ auth · ipAccounts · stepData · costLog · invite · history   │ │    │
│  │     │ copywriting · boomGenerate · analysis · videoAnalysis       │ │    │
│  │     │ videoProduction · acquisitionVideo · aiVideo                │ │    │
│  │     │ monetization · privateDomain · diagnosis · deepLearning     │ │    │
│  │     │ knowledge · trending · evolution · dailyTasks               │ │    │
│  │     │ stt · tts · voiceChat (★ subscription)                      │ │    │
│  │     └─────────────────────────────────────────────────────────────┘ │    │
│  └────────┬────────────────────────────────────────────────────────────┘    │
│           ▼                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ apps/api/src/specialists/  ★ 14/14 类全部存在 (3528 LOC)             │    │
│  │   base/BaseSpecialist.ts   PRD-4 模板方法 (active · 276 LOC)         │    │
│  │   base/errors.ts           SchemaValidationError/LLMTimeoutError    │    │
│  │   base/types.ts            SpecialistConfig + SpecialistRequest     │    │
│  │                                                                      │    │
│  │   ┌── 11 生成型 (单路径 · 直接 active · 走 BaseSpecialist) ───────┐ │    │
│  │   │ PositioningAgent.ts    step1 + step4 (industry+execution)    │ │    │
│  │   │ BrandingAgent.ts        step3 + step3b (packaging+persona)   │ │    │
│  │   │ MonetizationAgent.ts    step4b                                │ │    │
│  │   │ TopicAgent.ts           step5 (SSE)                          │ │    │
│  │   │ VideoAgent.ts           step6 + 3 mode (production/...)      │ │    │
│  │   │ CopywritingAgent.ts     step7 + 3 mode (free/boom/acquis.)   │ │    │
│  │   │ LivestreamAgent.ts      step8                                │ │    │
│  │   │ AnalysisAgent.ts        viral + structural                   │ │    │
│  │   │ PrivateDomainAgent.ts   私域(占位 + active)                  │ │    │
│  │   │ DiagnosisAgent.ts       8 问卷 → 7 维度                       │ │    │
│  │   │ DeepLearnAgent.ts       样本写记忆                            │ │    │
│  │   └────────────────────────────────────────────────────────────┘ │    │
│  │                                                                      │    │
│  │   ┌── 3 L5 自治型 (双路径 · §11.6.8 TD-024) ──────────────────────┐ │    │
│  │   │ EvolutionAgent.ts       12 行 re-export stub                  │ │    │
│  │   │   ↳ @/agents/evolution/EvolutionAgent.ts  (429 LOC 真实施)    │ │    │
│  │   │     · override execute() · $transaction · merge Rule 3       │ │    │
│  │   │     · fallback → previousInsight (不写 insight)              │ │    │
│  │   │ DailyTaskAgent.ts       107 LOC stub (throw US-007 真接)      │ │    │
│  │   │   ↳ @/agents/specialists/DailyTaskAgent.ts (296 LOC 真实施)   │ │    │
│  │   │     · 冷启动模板 / LLM lightweight / upsert 幂等              │ │    │
│  │   │ VoiceChatAgent.ts       398 LOC (单路径 · 不走双路径)         │ │    │
│  │   │   · executeStream() · LLM tools (5 个) · L1 Buffer            │ │    │
│  │   │   · per-account session lock (Map)                            │ │    │
│  │   └────────────────────────────────────────────────────────────┘ │    │
│  └────────┬────────────────────────────────────────────────────────────┘    │
│           │ 每个 Specialist execute() 调                                     │
│           ▼                                                                   │
│  ┌──────────────────────┐    ┌──────────────────────────────────────────┐   │
│  │ services/             │    │ workers/llm-gateway/  ★ R-1 唯一 SDK 入口│   │
│  │   context-assembler/ │←──┐│   index.ts        LLMGateway              │   │
│  │     ContextAssembler │   ││     · complete() + stream()               │   │
│  │       ★ 5 路 fetch + │   ││     · primary→fallback→template 三级降级 │   │
│  │       Promise.allSet-│   ││     · MODEL_BY_TIER (reasoning/lightweight)│  │
│  │       tled + 5s cap  │   ││   anthropic-provider.ts                    │  │
│  │       (+ EvolutionIn-│   ││   openai-provider.ts                       │  │
│  │       sight L4 latest│   ││   rate-limiter.ts (Upstash REST)           │  │
│  │       第 5 路 PRD-8) │   ││   cost-logger.ts                           │  │
│  │     templates/       │   │└──────────┬───────────────────────────────┘  │
│  │     types.ts         │   │           │                                   │
│  │   ip-progress/       │   │           ▼                                   │
│  │     IPProgressService│   │  ┌─────────────────────┐                      │
│  └──────────┬───────────┘   │  │ ext: api.anthropic, │                      │
│             ▼               │  │   api.openai.com    │                      │
│  ┌──────────────────────┐   │  └─────────────────────┘                      │
│  │ memory/  ★ 5 层记忆  │   │                                                │
│  │   l1-buffer.ts       │   │  ┌──────────────────────────────────────┐    │
│  │     voice_chat:acc_  │   │  │ workers/ (9 个 · PRD-8 全到位)         │    │
│  │     {id}:turns       │   │  │  llm-gateway/      唯一 LLM SDK 入口  │    │
│  │     LPUSH/LTRIM/     │   │  │  methodology-query/ in-memory 常量    │    │
│  │     EXPIRE 1800 sec  │   │  │  image-gen/        DALL-E 3 + BullMQ   │    │
│  │   l4-profile.ts      │   │  │  daily-task/       BullMQ + Worker     │    │
│  │     getLatestInsight │   │  │  evolution/        BullMQ + Worker     │    │
│  │     getDeepLearning- │   │  │  stt/              Whisper-1 (PRD-8)   │    │
│  │     Samples          │   │  │  tts/              OpenAI TTS-1 (PRD-8)│    │
│  │   l5-trending.ts     │   │  │  trending-scraper/ 占位(LD-017 限制)  │    │
│  │     getHotTrending() │   │  │  file-parser/      占位                │    │
│  │     ⚠️ PRD-9 真接    │   │  └──────────────────────────────────────┘    │
│  └──────────────────────┘   │                                                │
│                              │  ┌──────────────────────────────────────┐    │
│  ┌──────────────────────┐   │  │ cron/                                  │    │
│  │ lib/                 │   │  │   daily-task-runner.ts                │    │
│  │   prisma.ts          │   │  │     · node-cron 0 0 * * * Asia/Shanghai│   │
│  │   logger.ts (pino    │   │  │     · runForAllActiveAccounts(date)   │    │
│  │     + ALS)           │   │  │     · 7-day active + queue.add (jobId  │    │
│  │   redis.ts (ioredis  │   │  │       = daily-task-{acc}-{date})       │    │
│  │     · maxRetries:null│   │  └──────────────────────────────────────┘    │
│  │     for BullMQ)      │   │                                                │
│  │   auth/{lucia,       │   │  ┌──────────────────────────────────────┐    │
│  │     adapter,         │   │  │ lib/voice-chat/tools-dispatcher.ts    │    │
│  │     providers}       │   │  │   5 工具 prisma query (per-account    │    │
│  │   compliance/        │   │  │     lock via Map)                     │    │
│  │     {pii-mask,       │   │  └──────────────────────────────────────┘    │
│  │     disclaimer}      │   │                                                │
│  │   constants/ (15 类  │   │  ┌──────────────────────────────────────┐    │
│  │     · industries/    │   │  │ lib/evolution/trigger.ts              │    │
│  │     scriptTypes/     │   │  │   enqueueIfThresholdMet(acc, traceId) │    │
│  │     hotElements/...) │   │  │     · INSERT ... ON CONFLICT UPDATE   │    │
│  │   evolution/         │   │  │       RETURNING count (atomic race    │    │
│  │     trigger.ts ★     │   │  │       protection)                     │    │
│  │   rate-limit/        │   │  │     · count ∈ {5,20,50,100} → enqueue │    │
│  │     {image-gen,      │   │  └──────────────────────────────────────┘    │
│  │     stt, tts}        │   │                                                │
│  │   voice-chat/        │   │                                                │
│  │     tools-dispatcher │   │                                                │
│  └──────────┬───────────┘   │                                                │
└─────────────┼───────────────┼─────────────────────────────────────────────────┘
              │ Prisma 5.22 ($transaction · SET LOCAL ROLE quanqn_app)
              ▼
   ┌──────────────────────────────────────────────────────────┐
   │ PostgreSQL 16 + pgvector 0.8                              │
   │   prisma/schema.prisma · 39 models                        │
   │     · 18 主应用表 (RLS 启用 14 张 · LD-009)               │
   │     · 13 admin 表 (RLS DISABLE · LD-A-3 · 留 PRD-10+)     │
   │     · 4 支持表 (User/Session/InviteCode/TrendingItem)     │
   │     · 4 增量表 (DailyTask/EvolutionInsight/...)           │
   │   manual_rls.sql (15 ENABLE RLS · 12 policies)            │
   └──────────────────────────────────────────────────────────┘
              │
              ▼
   ┌──────────────────────────────────────────────────────────┐
   │ Redis (ioredis singleton + Upstash REST · 双层)          │
   │   ioredis (apps/api/src/lib/redis.ts) ·                  │
   │     - BullMQ 3 Queue/Worker 用 (daily-task/evolution/    │
   │       image-gen)                                          │
   │     - rate-limit/{image-gen,stt,tts} INCR + EXPIRE 86400  │
   │     - L1 Buffer voice_chat:acc_{id}:turns LPUSH/LTRIM     │
   │   Upstash REST (workers/llm-gateway/rate-limiter.ts) ·   │
   │     - LLMGateway 限流 token bucket (key prefix quanqn:rl:)│
   └──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│  apps/admin (P0 占位 · ADR-021 独立部署 · PRD-10~14 启动)                     │
│    apps/admin/src/index.ts 仅 12 行 readme · pages/ + components/ 空目录     │
│    R-A1 ✅ 实证: grep 'admin' apps/web/src → 0 命中                          │
└──────────────────────────────────────────────────────────────────────────────┘
```

### §1.2 关键事实速查

| 事实 | 数值 | 来源 |
|---|:-:|---|
| Monorepo workspace 数 | **6** (apps × 3 + packages × 3) | `pnpm-workspace.yaml` |
| TypeScript strict + noUncheckedIndexedAccess | ✅ | `tsconfig.base.json:17-29` |
| Prisma models | **39** | `grep -c '^model ' prisma/schema.prisma` |
| tRPC routers (active) | **25** (1 _app + 24 sub) | `apps/api/src/trpc/routers/` |
| Specialist 类总数 / active | **14 / 14** (11 生成型 + 3 L5 自治) | `apps/api/src/specialists/*.ts` |
| Worker 总数 | **9** | `apps/api/src/workers/` 9 子目录 |
| LLM SDK 引用 | **3 处** (llm-gateway + workers/stt + workers/tts) | `grep '@anthropic-ai/sdk\|^import.*openai' apps/ -r` |
| 前端 routes | **34** (step 11 + tools 15 + modules 6 + aux 2) | `apps/web/src/router.tsx` |
| API LOC (ts) | ~12 000 | 125 ts files |
| Web LOC (ts/tsx) | ~10 000 | 105 ts/tsx files |
| 测试文件 | 总 130+ (unit 118 + e2e 27 + judge 21) | `find tests -name '*.ts'` |
| 双路径 L5 | EvolutionAgent + DailyTaskAgent | `apps/api/src/specialists/{Evolution,DailyTask}Agent.ts` (re-export) → `apps/api/src/agents/...` |

---

## §2 Component Responsibilities

| Component | 职责 | 主文件 | LOC |
|---|---|---|:-:|
| **Hono app** | HTTP 入口 · CORS · X-Trace-Id mw · OAuth /auth/* · dev in-process worker + cron 启动 | `apps/api/src/index.ts` | 233 |
| **tRPC context** | lucia session 解析 · activeAccountId 注入 · X-Trace-Id 读 | `apps/api/src/trpc/context.ts` | 58 |
| **traceMiddleware** | X-Trace-Id 生成或传 · AsyncLocalStorage 写 traceStore (pino mixin auto-attach) | `apps/api/src/trpc/trpc.ts:34-39` | — |
| **accountIsolationMiddleware** | `$transaction` · `SET LOCAL ROLE quanqn_app` · `set_config('app.current_account_id', …, true)` · ★ 唯一允许 `prisma.$executeRaw` 处(LD-009 · R-009) | `apps/api/src/trpc/middleware/account-isolation.ts` | 58 |
| **protectedProcedure** | publicProcedure + accountIsolationMw(默认) | `account-isolation.ts:52` | — |
| **globalProcedure** | publicProcedure + `meta({isGlobal:true})` — 跳过 RLS · 仅 User/InviteCode/TrendingItem | `account-isolation.ts:58` | — |
| **appRouter** | 24 sub-router 合并 → `AppRouter` type · packages/clients 同名 shadow 镜像导出 | `apps/api/src/trpc/routers/_app.ts` | 60 |
| **BaseSpecialist (active)** | 模板方法 · `execute()` 5 步 (parse → assemble → invokeLLM with retry → safeParse → writeCostLog) · `fallbackTemplate` 路径 · disclaimer 自动注入 | `apps/api/src/specialists/base/BaseSpecialist.ts` | 276 |
| **BaseSpecialist (legacy)** | 旧版 `run()` 模板方法 · ★ DRIFT · 仅 `apps/api/src/agents/specialists/CopywritingAgent` 旧拷贝引 · 主代码 0 import (dead code) | `apps/api/src/agents/base/BaseSpecialist.ts` | 71 |
| **11 生成型 Specialist** | 各 mode 子类 · 五层 `SpecialistConfig` · `invokeLLM(ctx, req) → InvokeLLMResult` · 单实例 export | `apps/api/src/specialists/{Positioning,Branding,...}.ts` | 82-643/file |
| **EvolutionAgent (L5)** | 真实施 override `execute()` · `recentFeedbacks(N=count/5) + samples(limit 10) + previousInsight` · `prisma.$transaction([profile.update, insight.create])` · merge Rule 3 (preferredCatchphrases ∪ prev 去重 top 10) · `inferLevel(count)` | `apps/api/src/agents/evolution/EvolutionAgent.ts`(真) + `apps/api/src/specialists/EvolutionAgent.ts`(stub re-export) | 429 + 12 |
| **DailyTaskAgent (L5)** | 真实施 · `LLMGateway.complete(lightweight)` · 冷启动判定(stepData=0 OR EvolutionProfile=null → 5 模板任务 · `modelUsed='cold-start-template'`) | `apps/api/src/agents/specialists/DailyTaskAgent.ts`(真) + `apps/api/src/specialists/DailyTaskAgent.ts`(stub) | 296 + 107 |
| **VoiceChatAgent (L5)** | `executeStream()` 真接 `LLMGateway.stream()` · 5 tools(get_current_step / search_history / query_diagnosis / get_today_tasks / get_evolution_insights)· module-level `_activeSessions: Map<number,boolean>` 防并发 · 单路径(不走双路径) | `apps/api/src/specialists/VoiceChatAgent.ts` | 398 |
| **ContextAssembler** | ★ 5 路并行 fetch · `Promise.allSettled` · 各 5s timeout · 降级跑空 · 拼 `systemPrompt` (persona + L2 stepData + L4 EvolutionInsight Section 4 + constants) · `_formatUserPrompt` 调 `piiMask` | `apps/api/src/services/context-assembler/ContextAssembler.ts` | 205 |
| **LLMGateway** | ★ R-1 唯一 SDK 入口 · `MODEL_BY_TIER` (reasoning=`claude-sonnet-4-6`→`gpt-4o` / lightweight=`claude-haiku-4-5`→`gpt-4o-mini`)· primary → fallback → template 三级降级 · `checkRateLimit`(Upstash)· `writeCostLog` · `complete()` + `stream()` (首 chunk `{type:'meta',meta:{model}}` D-019) | `apps/api/src/workers/llm-gateway/index.ts` | 256 |
| **methodologyQueryWorker** | in-memory 常量 (industries / hotElements / scriptTypes) · `getAll()` / `get(name)` · ContextAssembler 拼 prompt 用 | `apps/api/src/workers/methodology-query/index.ts` | 42 |
| **L1 Buffer** | Redis List `voice_chat:acc_{id}:turns` · `LPUSH` + `LTRIM 0 19` + `EXPIRE 1800` · `pushTurn`/`getTurns`/`clearBuffer` | `apps/api/src/memory/l1-buffer.ts` | 39 |
| **L4 Profile helpers** | `getLatestInsight(accountId)` 读 `EvolutionProfile.latestInsight` · `getDeepLearningSamples(accountId, 10)` 读 `DeepLearningArchive` (isActive=true · learningStatus=completed) | `apps/api/src/memory/l4-profile.ts` | 33 |
| **L5 Trending Cache** | `getHotTrending()` 占位返 `[]` · 留 PRD-9 真接 | `apps/api/src/memory/l5-trending.ts` | 22 |
| **enqueueIfThresholdMet** | `prisma.$queryRaw INSERT ON CONFLICT DO UPDATE RETURNING` 原子递增 · count ∈ {5,20,50,100} → `evolutionQueue.add('evo:{acc}:{count}')` 去重 | `apps/api/src/lib/evolution/trigger.ts` | 60 |
| **dailyTaskCron** | `node-cron schedule('0 0 * * *', cb, {scheduled:false, timezone:'Asia/Shanghai'})` · `dailyTaskCron.start()` 由 index.ts boot 时调 · `runForAllActiveAccounts(date)` 扫 7-day active + per-account enqueue | `apps/api/src/cron/daily-task-runner.ts` | 81 |
| **BullMQ Workers (3)** | daily-task: concurrency 5 + `prisma.dailyTask.upsert` 幂等(@@unique([accountId,taskDate])) · evolution: concurrency 5 + jobId 去重 + dead-letter alert stub · image-gen: 3 retry exp backoff | `apps/api/src/workers/{daily-task,evolution,image-gen}/worker.ts` | 100/65/(...) |
| **STTWorker (Whisper-1)** | 独立 worker · `OpenAI.audio.transcriptions.create` · WAV duration parse · `cost_usd` ($0.006/分钟) | `apps/api/src/workers/stt/whisper.ts` | (~150) |
| **TTSWorker (OpenAI TTS-1)** | 独立 worker · `OpenAI.audio.speech.create` · `cost_usd` ($15/1M chars) · `publicUrl` 占位 (S3 留 PRR) | `apps/api/src/workers/tts/openai-tts.ts` | (~140) |
| **DallE3ImageGenWorker** | 独立 worker · `OpenAI.images.generate` · BullMQ 'image-gen' queue · 3 retry · placeholder URL | `apps/api/src/workers/image-gen/dall-e-3.ts` | (~120) |
| **voice-chat/tools-dispatcher** | 5 tools 映射 · per-accountId concurrency lock(`_lockMap: Map<number, Promise<void>>`) · 各 ≤2s · 用 `ctx.prisma` (RLS-scoped transaction client) | `apps/api/src/lib/voice-chat/tools-dispatcher.ts` | (~150) |
| **Prisma client** | 单例 + globalThis cache (dev hot reload) · `checkDbConnection()` exit 1 on fail | `apps/api/src/lib/prisma.ts` | 44 |
| **Redis client** | `ioredis` 单例 · `maxRetriesPerRequest: null` (BullMQ 必需) · 全 BullMQ / rate-limit / L1 Buffer 共用 | `apps/api/src/lib/redis.ts` | 11 |
| **Lucia v3** | session cookie name=`app_session` (LD-A-1 与 admin 区分) · prismaAdapter | `apps/api/src/lib/auth/lucia.ts` + `adapter.ts` + `providers.ts` | 40+76+151 |
| **OAuth providers** | MockProvider(dev only) + GoogleProvider(arctic) · `validateStartupConfig()` 启动校验 SESSION_SECRET 长度 + provider name · prod 禁 mock | `apps/api/src/lib/auth/providers.ts` | 151 |
| **logger (pino)** | structured · AsyncLocalStorage `traceStore` mixin auto-inject traceId · 严禁 console.log (LD-013) | `apps/api/src/lib/logger.ts` | 31 |
| **PII / Disclaimer** | `piiMask` (email/phone/id_card/bank_card) 接 ContextAssembler `_formatUserPrompt` · `appendDisclaimerIfSensitive`(行业) + `attachDisclaimerMeta` 接 BaseSpecialist `_applyDisclaimer` (TD-016 修) | `apps/api/src/lib/compliance/{pii-mask,disclaimer}.ts` | (~30+30) |
| **rate-limit helpers** | 3 个 sliding window Redis INCR + EXPIRE 86400 · `_todayKey(acc)` UTC date · throws TRPCError TOO_MANY_REQUESTS · STT 50/day · TTS 100/day · image-gen 10/day | `apps/api/src/lib/rate-limit/{stt,tts,image-gen}.ts` | 33 each |
| **15 constants** | industries / hotElements / scriptTypes / presentStyles / platforms / steps / evolution / diagnosis / sttLimits / ttsLimits / videoDurations / videoTypes / imageStyles / privateDomain | `apps/api/src/lib/constants/` | 740 total |
| **packages/schemas** | zod schemas 真理来源 · entities (4 schemas) + step-results(空)+ specialist-io(19 schemas)+ admin(空 P9.0 起) | `packages/schemas/src/` | (~1500) |
| **packages/clients** | 跨 app tRPC 共享 · `router-types.ts` 是 shadow router(避免前端 bundle `@trpc/server`)· 镜像 25 router · PRD-8 加 stt/tts/voiceChat shadow types | `packages/clients/src/router-types.ts` | ~700 |
| **packages/ui** | 共享 UI · base + admin(占位)· ★ DRIFT TD-005: 12 shadcn 组件实际在 `apps/web/src/components/ui/` 而非 `packages/ui/src/base/` | `packages/ui/src/` | 占位 |
| **apps/web router** | `createBrowserRouter` · 34 routes · `React.lazy` + `webpackChunkName`("step", "tools", "modules")· `RootLayout` → `StepLayout` 嵌套 | `apps/web/src/router.tsx` | 122 |
| **apps/web tRPC client** | `createTRPCReact` + `httpBatchStreamLink` · `credentials:'include'` · `x-trace-id` 自动注入 · `staleTime: 30_000` | `apps/web/src/lib/trpc.ts` | 57 |
| **apps/web hooks (4)** | `useAuth` (auth.me) · `useStepData` (LS↔DB dual-write LD-010)· `useActiveAccount` (switchTo + reload)· `useEvolution` (LS cache instant read) | `apps/web/src/hooks/{useAuth,useStepData,useActiveAccount,useEvolution}.ts` | (~50/file) |
| **apps/web LS namespace** | `aiip_memory_acc_{id}_{suffix}` · per-account 隔离 · 5MB cap · `pruneLsNamespaces()` | `apps/web/src/lib/ls-namespace.ts` | 88 |
| **apps/admin** | P0 占位 · ADR-021 独立部署 · README + index.ts 仅 12 行 stub | `apps/admin/src/index.ts` | 12 |

---

## §3 Pattern Overview

**Overall:** **Layered Monorepo + 14 Specialist (11 单路径 + 3 双路径 L5) + LLMGateway 单入口 + RLS-tx-scoped 数据隔离 + 3 Orchestrator (BullMQ / node-cron / tRPC subscription)**

### §3.1 Key Characteristics

- **95/5 编排范式** (LD-001) · 25 router 全是确定性 procedure · 0 处 `while.*llm.complete` · 唯三 L5 自治走外部 orchestrator (ADR-018)
- **14 Specialist 全到位** · 11 生成型直接 active + 3 L5 走 §11.6.8 "双路径白名单" 模式 (re-export stub 在 `specialists/` · 真实施在 `agents/{evolution,specialists}/`)
- **LLMGateway 单入口** · `grep '@anthropic-ai/sdk\|^import.*openai'` 仅 3 处:`workers/llm-gateway/index.ts` + `workers/stt/whisper.ts` + `workers/tts/openai-tts.ts` · D-038 允许 STT/TTS/image-gen 独立 worker 不走 Gateway (audio/image 不用 chat)
- **ContextAssembler 唯一 prompt 入口** · 5 路 `Promise.allSettled` + 5s timeout (L2 stepData + L4 EvolutionInsight + L4 samples 跑空 + L5 RAG 跑空 + constants) · D-007 grep 在 `specialists/` 0 处自拼 systemPrompt
- **RLS 3 道闸** (LD-009) · 闸 1 = `protectedProcedure` · 闸 2 = `$transaction + SET LOCAL ROLE + set_config('app.current_account_id')` · 闸 3 = Redis/LS 命名空间 (`voice_chat:acc_{id}:turns` / `aiip_memory_acc_{id}_*`)
- **5 层记忆** (LD-006) · L1 Buffer (Redis) · L2 Core (stepData/feedbackLog/history)· L3 Recall(pgvector 留)· L4 Profile (EvolutionProfile)· L5 Trending (留)
- **反馈飞轮 5 阶段** (LD-008) · 生成 → costLog.logFeedback → enqueueIfThresholdMet (count ∈ {5,20,50,100}) → evolutionQueue → EvolutionAgent · 全闭环

### §3.2 关键 LD 实施状态(PRD-8 完成态)

| LD | 设计目标 | 实际状态 | 实证 |
|:-:|---|---|---|
| LD-001 | 95% Workflow + 5% Agent | ✅ 严格符合 · 25 router 0 处 while/递归 | `apps/api/src/trpc/routers/*.ts` |
| LD-002 | 14 能力域 Specialist | ✅ 14/14 类全部存在 (11 active + 3 L5 双路径) | `apps/api/src/specialists/*.ts` |
| LD-003 | 0 specialist 互调 | ✅ grep `specialists\.` in `apps/api/src/specialists/` 0 命中 | — |
| LD-004 | 3 L5 走外部 orchestrator | ✅ Evolution→BullMQ + DailyTask→Cron+BullMQ + VoiceChat→tRPC subscription | `apps/api/src/workers/{evolution,daily-task}/queue.ts` + `cron/daily-task-runner.ts` + `trpc/routers/voiceChat.ts` |
| LD-005 | BaseSpecialist 抽象 + 五层 | ✅ active 路径 14 / 14 继承 PRD-4 BaseSpecialist | `apps/api/src/specialists/base/BaseSpecialist.ts` |
| LD-006 | 5 层记忆(无 Summarizer) | ✅ L1/L4 真接 · L2 走 stepData · L3/L5 占位 · 0 处 `Summarizer\|Portrait` | `apps/api/src/memory/` 3 文件 |
| LD-007 | ContextAssembler 唯一 prompt 入口 | ✅ 11 生成型走 · 2 L5 走(Evolution + DailyTask)· VoiceChat 走但 5 工具 dispatcher 走 | `apps/api/src/services/context-assembler/ContextAssembler.ts` |
| LD-008 | 反馈飞轮 5 阶段 · account 级 | ✅ enqueueIfThresholdMet → evolutionQueue → EvolutionAgent · profile.accountId 唯一索引 | `apps/api/src/lib/evolution/trigger.ts` + Prisma `EvolutionProfile` |
| LD-009 | IpAccount 隔离 3 道闸 | ✅ 全 router 用 protectedProcedure · `SET LOCAL ROLE` + `set_config` · Redis/LS 命名空间 | `apps/api/src/trpc/middleware/account-isolation.ts` |
| LD-010 | LS↔DB 双写 4 规则 | ✅ useStepData LS 先写 · DB 后 mutation · 失败 toast 不回滚 · 切账号 reload | `apps/web/src/hooks/useStepData.ts` + `useActiveAccount.ts` |
| LD-011 | 不引向量库 SDK | ✅ pgvector(PG 扩展)· `package.json` 0 qdrant/pinecone/weaviate | — |
| LD-012 | LLMGateway 唯一 SDK 入口 | ✅ `@anthropic-ai/sdk\|openai` 仅 3 处(D-038 白名单) | — |
| LD-013 | zod + trace_id + 无 any | ✅ tsconfig strict + noUncheckedIndexedAccess · pino mixin 自动注 traceId | `tsconfig.base.json` + `apps/api/src/lib/logger.ts` |
| LD-014 | LLM 失败重试 1 次 + 降级 | ✅ BaseSpecialist Step 4 safeParse retry · LLMGateway primary→fallback→template · EvolutionAgent $transaction | `apps/api/src/specialists/base/BaseSpecialist.ts:102-119` + `workers/llm-gateway/index.ts` |
| LD-017 | 不自建爬虫 | ✅ workers/trending-scraper 空目录 · 0 puppeteer/playwright 引 | `apps/api/src/workers/trending-scraper/` 空 |
| LD-018 | 行业合规 + PII 脱敏 | ✅ TD-016 修 · `piiMask` 接 ContextAssembler `_formatUserPrompt` · `appendDisclaimerIfSensitive` 接 BaseSpecialist `_applyDisclaimer` | `apps/api/src/services/context-assembler/ContextAssembler.ts:198` + `apps/api/src/specialists/base/BaseSpecialist.ts:203-213` |

---

## §4 Layers

> 派生 AGENTS §4.5 · 严格单向 (上层调下层 · 下层禁调上层) · 同层用接口隔离。

```
┌────────────────────────────────────────────────┐
│ L1 · UI (React 组件 · apps/web/src/pages|components) │ ← 顶层
└────────────────────────────────────────────────┘
                  │ ↓ 调
┌────────────────────────────────────────────────┐
│ L2 · Hooks (useXxx · apps/web/src/hooks)            │
└────────────────────────────────────────────────┘
                  │ ↓ 调
┌────────────────────────────────────────────────┐
│ L3 · tRPC Client (apps/web/src/lib/trpc.ts)         │
└────────────────────────────────────────────────┘
   ────── 网络分割线 (X-Trace-Id 贯穿) ──────
                  │ ↓ 调
┌────────────────────────────────────────────────┐
│ L4 · tRPC Router (apps/api/src/trpc/routers · 24个)  │
│   全用 protectedProcedure · 守 LD-009 闸 1+2         │
└────────────────────────────────────────────────┘
                  │ ↓ 调
┌────────────────────────────────────────────────┐
│ L5 · Specialist Agents (apps/api/src/specialists · 14)│
│   + L5 真实施 (apps/api/src/agents/...) 双路径白名单 │
└────────────────────────────────────────────────┘
                  │ ↓ 调
┌────────────────────────────────────────────────┐
│ L6 · Services (apps/api/src/services)               │
│   ContextAssembler / IPProgressService              │
│   + Memory (apps/api/src/memory) L1/L4/L5 helpers   │
│   + Lib (apps/api/src/lib · pii-mask/disclaimer/    │
│        evolution/trigger/voice-chat/dispatcher)     │
└────────────────────────────────────────────────┘
                  │ ↓ 调
┌────────────────────────────────────────────────┐
│ L7 · Workers (apps/api/src/workers · 9 个)          │
│   llm-gateway / methodology-query / image-gen /     │
│   daily-task / evolution / stt / tts / trending /   │
│   file-parser                                       │
└────────────────────────────────────────────────┘ ← 底层
                  │ ↓ 调
External:   PostgreSQL 16 + pgvector · Redis · OpenAI · Anthropic
```

**禁止** · 跨层跳调 (如 L1 直接 import L5)· 必须经过 L3 tRPC。

---

## §5 Data Flow

### §5.1 Primary Request Path (User 主线 — Step 7 文案生成)

1. User clicks "生成文案" (`apps/web/src/pages/step/Step7.tsx`)
2. Hook `useStepData(accountId, 'step7')` writes LS first (`apps/web/src/hooks/useStepData.ts:23`)
3. `trpc.copywriting.generate.mutate({stepKey, ...})` (`apps/web/src/lib/trpc.ts`)
   - 自动注 `x-trace-id` header + cookie `app_session`
4. Hono 接到 POST `/trpc/copywriting.generate` (`apps/api/src/index.ts:200`)
5. Trace mw 写 `traceStore.run({traceId}, async () => next())` (`index.ts:42-49`)
6. `createContext(c)` lucia 验证 cookie · 注入 `user + activeAccountId` (`apps/api/src/trpc/context.ts:32`)
7. tRPC trace mw 再读 X-Trace-Id (avoid 'pending')(`apps/api/src/trpc/trpc.ts:34`)
8. `protectedProcedure` = publicProcedure + `accountIsolationMw` (`apps/api/src/trpc/middleware/account-isolation.ts:52`)
9. `accountIsolationMw` 校验 `activeAccountId !== null` → 进入 `$transaction`:
   - `SET LOCAL ROLE quanqn_app` (非超用户 · RLS 生效)
   - `SELECT set_config('app.current_account_id', <id>, true)` (tx-scoped)
   - `next({ctx: {...ctx, prisma: tx}})` (后续 resolver 用 tx)
10. `copywriting.generate` resolver 调 `copywritingAgent.execute({...})` (`apps/api/src/trpc/routers/copywriting.ts`)
11. `BaseSpecialist.execute()` (`apps/api/src/specialists/base/BaseSpecialist.ts:68`):
    a. `inputSchema.parse(req.userInput)` → ZodError on fail
    b. `contextAssembler.assemble({...})` → 5 路 `Promise.allSettled` · 5s cap
    c. `invokeLLM(ctx, req)` → 子类实现 · 调 `llmGateway.complete()`
    d. `outputSchema.safeParse(raw.content)` → retry 1 (再 `invokeLLM`) → 仍失败 throw `SchemaValidationError`
    e. `_applyDisclaimer(result, userInput)` (industry → 敏感行业 · markdown 末尾追加免责)
    f. `_writeCostLog(...)` → `prisma.costLog.create({...})` (callType='specialist_call' · target jsonb)
12. Resolver 写 history (`prisma.history.create({...accountId})`)
13. Response 经 tRPC batch stream → CORS 加 `x-trace-id` 头 → 客户端
14. `useStepData` 不滚回 LS · `useMutation.onError` 显 toast `已保存到本地 · 网络恢复后同步`

### §5.2 反馈飞轮闭环 (Feedback Loop · LD-008)

1. User clicks `<FeedbackButton>` good/bad (`apps/web/src/components/FeedbackButton.tsx`)
2. `trpc.costLog.logFeedback.mutate({stepKey, agentId, type})`
3. `costLogRouter.logFeedback` 写 `costLog (eventType=good|bad, callType=feedback)` (`apps/api/src/trpc/routers/costLog.ts:24`)
4. **同步异步分离** · resolver hook 调 `enqueueIfThresholdMet(accountId, traceId)` 不 await
5. `enqueueIfThresholdMet` (`apps/api/src/lib/evolution/trigger.ts:18`):
   - `prisma.$queryRaw INSERT INTO evolution_profiles ... ON CONFLICT DO UPDATE RETURNING feedback_count_total`
   - 原子递增 + 防 read-then-write race
   - `if (count ∈ {5,20,50,100})` → `evolutionQueue.add('evo:{acc}:{count}', {accountId, triggerType: 'threshold:{count}'})` (jobId 去重)
6. BullMQ evolutionWorker 拉 job (`apps/api/src/workers/evolution/worker.ts:24`)
7. `evolutionAgent.execute({accountId, userInput: {accountId, triggerType}})` (`apps/api/src/agents/evolution/EvolutionAgent.ts:96`):
   - `recentFeedbacks(N=count/5)` + `getDeepLearningSamples(10)` + `previousInsight (ctx.evolutionInsight)`
   - `llmGateway.complete(reasoning · eventType='l5_agent')`
   - merge Rule 3 (preferredCatchphrases ∪ prev top 10)
   - `prisma.$transaction([evolutionProfile.update, evolutionInsight.create])` 原子 · 任一失败全回滚
8. 下一次 Specialist 调用时 · ContextAssembler 第 5 路 `getLatestInsight(accountId)` 读 `EvolutionProfile.latestInsight` → 注入 systemPrompt `[Section 4] 用户偏好画像`

### §5.3 DailyTask Cron 链路 (LD-004 / ADR-018)

1. `dailyTaskCron.start()` 由 `index.ts:223` 启动 · cron expr `0 0 * * * Asia/Shanghai` (`apps/api/src/cron/daily-task-runner.ts:72`)
2. 每天 0 点触发 → `runForAllActiveAccounts()`
3. `prisma.ipAccount.findMany({isActive:true, updatedAt:{gt: 7-day-ago}})`
4. `Promise.all(accounts.map(a => dailyTaskQueue.add('daily-task', {accountId,scheduledDate}, {jobId: 'daily-task-{acc}-{date}'})))` (幂等 jobId)
5. BullMQ dailyTaskWorker (concurrency=5) 拉 job (`apps/api/src/workers/daily-task/worker.ts:36`)
6. `dailyTaskAgent.execute({accountId, userInput:{accountId, taskDate}})`:
   - 冷启动判定 · stepData=0 OR EvolutionProfile=null → 5 条模板 tasks(`modelUsed='cold-start-template'` · isFallback=false)
   - 否则 `llmGateway.complete(lightweight · eventType='l5_agent')` 生成 3-5 个任务
7. `prisma.dailyTask.upsert({where:{accountId_taskDate:{accountId,taskDate}}, ...})` (@@unique 保幂等)
8. User 早上打开 `/daily-tasks` · `trpc.dailyTasks.getToday.useQuery()` 拉今日记录

### §5.4 VoiceChat tRPC Subscription (L5 · 第 3 种 orchestrator)

1. User 发起 voice → `trpc.voiceChat.start.subscription({userMessage, sessionId})` (`apps/web/src/pages/tools/VoiceChat.tsx`)
2. tRPC subscription 用 `httpBatchStreamLink` (`apps/web/src/lib/trpc.ts:50`)
3. `voiceChatRouter.start` async generator(`apps/api/src/trpc/routers/voiceChat.ts:20`):
   - 校验 `activeAccountId !== null` → throw UNAUTHORIZED
   - `dispatch = (name, args) => dispatchTool(name, args, activeAccountId, prisma)` (RLS-scoped)
   - `yield* voiceChatAgent.executeStream({...}, dispatch)`
4. `VoiceChatAgent.executeStream()` (`apps/api/src/specialists/VoiceChatAgent.ts`):
   - check `_activeSessions.get(accountId)` → 拒并发 (AC-8 module-level Map)
   - `getTurns(accountId, 10)` 读 L1 Buffer
   - `llmGateway.stream({tier='reasoning', tools=VOICE_CHAT_TOOLS, ...})`
   - for-await chunk → if `tool_use` → `dispatch(name, args)` → push `tool_result` chunk → continue
   - 累积 delta · post-validate ≤ 80 字 截断 (AC-7)
   - `pushTurn(accountId, {role:'user'|'assistant', content})` (LPUSH/LTRIM/EXPIRE 1800)
5. yield 类型 · `delta | tool_call | tool_result | done | error` (5 种)
6. `_activeSessions.delete(accountId)` finally

---

## §6 Key Abstractions

### §6.1 SpecialistConfig (五层 · LD-005)

`apps/api/src/specialists/base/types.ts`

- `agentId` (写 cost_log.agentId · 14 SpecialistId 之一)
- `persona` (role / goal / boundaries[])
- `memory` (l1_readonly / l2_read / l2_write)
- `knowledge` (constants / rag / refresh_interval_sec)
- `tools` (string[]) — VoiceChat 用
- `execution` (timeout_ms / retry / model_tier / streaming / parallel_group?)

### §6.2 SpecialistRequest / SpecialistResponse

- Request · `accountId` + `userInput` + `mode?` + `traceId?` + `stepKey?`
- Response · `result` + `isFallback` + `durationMs` + `tokensUsed` + `modelUsed` + `traceId`

### §6.3 AssembledContext (ContextAssembler 输出)

`apps/api/src/services/context-assembler/types.ts`

- `systemPrompt` (拼 persona + L2 stepData + L4 EvolutionInsight Section 4 + constants methodology)
- `userPrompt` (`<user_input>{piiMasked}</user_input>`)
- `tools` (Specialist 用 · VoiceChat 5 个 + 其他空)
- `evolutionInsight` (PRD-8 第 5 路 · `EvolutionInsightContent | null`)
- `metadata` (`contextTokens` chars/4 粗算 + `layersUsed[]` + `ragHits[]`)

### §6.4 InvokeLLMResult (Specialist 子类返)

- `content` (string | object)
- `tokens` ({prompt, completion, total})
- `model` (实际 model · 反 D-019 stream meta chunk)
- `isFallback?` (boolean)

### §6.5 ModelTier (LLM 路由)

- `reasoning` (主 `claude-sonnet-4-6` → fallback `gpt-4o`)
- `lightweight` (主 `claude-haiku-4-5` → fallback `gpt-4o-mini`)

### §6.6 SpecialistId (14 个 · LD-002)

`apps/api/src/agents/base/types.ts:9-14`

PositioningAgent · BrandingAgent · MonetizationAgent · TopicAgent · CopywritingAgent · VideoAgent · LivestreamAgent · PrivateDomainAgent · AnalysisAgent · DiagnosisAgent · DeepLearnAgent · VoiceChatAgent ★L5 · EvolutionAgent ★L5 · DailyTaskAgent ★L5

---

## §7 Entry Points

### §7.1 Web (apps/web)

| Entry | 路径 | 职责 |
|---|---|---|
| `index.html` | `apps/web/index.html` | Vite 入口 · 加载 `/src/main.tsx` |
| `main.tsx` | `apps/web/src/main.tsx` | createRoot + Provider 套 (`<trpc.Provider>` + `<QueryClientProvider>` + `<RouterProvider>`) |
| `router.tsx` | `apps/web/src/router.tsx` | createBrowserRouter · 34 routes (lazy 4 chunks) |
| `RootLayout` | `apps/web/src/layouts/RootLayout.tsx` | Header + Toaster + Suspense fallback |
| `StepLayout` | `apps/web/src/layouts/StepLayout.tsx` | /step/* 嵌套 + FeedbackButton(STEP_AGENT_MAP) |

### §7.2 API (apps/api)

| Entry | 路径 | 职责 |
|---|---|---|
| `index.ts` | `apps/api/src/index.ts` | Hono boot · 启 cron · dev 模式启 in-process workers |
| `/trpc/*` | `apps/api/src/index.ts:200` | fetchRequestHandler · 25 router 合并 |
| `/auth/{login,callback,logout}` | `apps/api/src/index.ts:62-181` | Lucia v3 + arctic OAuth |
| `/health` | `apps/api/src/index.ts:59` | liveness probe |

### §7.3 Workers (apps/api/src/workers)

| Worker | 启动方式 | 入口 |
|---|---|---|
| llm-gateway | 应用层调 `llmGateway.complete/stream` | `apps/api/src/workers/llm-gateway/index.ts` (export const) |
| methodology-query | 应用层调 `methodologyQueryWorker.get/getAll` | `apps/api/src/workers/methodology-query/index.ts` |
| image-gen | BullMQ Queue 'image-gen' · prod 独立容器 `pnpm worker:image-gen` · dev in-process | `apps/api/src/workers/image-gen/worker.ts` |
| daily-task | BullMQ Queue 'daily-task' · cron 触发 enqueue · dev in-process | `apps/api/src/workers/daily-task/worker.ts` |
| evolution | BullMQ Queue 'evolution' · trigger.ts enqueue · 跑在 API 进程 | `apps/api/src/workers/evolution/worker.ts` |
| stt | 应用层 new `WhisperSttWorker()` · 调 transcribe(payload) | `apps/api/src/workers/stt/whisper.ts` |
| tts | 应用层 new `OpenAITtsWorker()` · 调 synthesize(payload) | `apps/api/src/workers/tts/openai-tts.ts` |
| trending-scraper | 空目录 (LD-017 留 PRD-9 第三方授权方案) | — |
| file-parser | 空目录 (PRD-9+) | — |

### §7.4 Cron (apps/api/src/cron)

| Cron | 表达式 | 入口 |
|---|---|---|
| daily-task-runner | `0 0 * * * Asia/Shanghai` | `apps/api/src/cron/daily-task-runner.ts:72` |

---

## §8 Architectural Constraints

- **Threading model** · Node 20 单线程事件循环 · `apps/api/src/index.ts` 单进程 · BullMQ Worker 用 `concurrency` 选项 (daily-task=5, evolution=5)· VoiceChat 用 module-level `_activeSessions: Map<number, boolean>` 防同 account 并发
- **Global state (module-level)** ·
  - `apps/api/src/lib/prisma.ts:14` `globalThis.__prisma` 单例 (dev hot reload 防多连接)
  - `apps/api/src/lib/redis.ts:7` `redis` 单例 export (ioredis · BullMQ 共用)
  - `apps/api/src/workers/llm-gateway/index.ts:90,95` lazy `_anthropicClient` + `_openaiClient`
  - `apps/api/src/lib/voice-chat/tools-dispatcher.ts:14` `_lockMap: Map<number, Promise<void>>` (per-account lock)
  - `apps/api/src/specialists/VoiceChatAgent.ts` `_activeSessions: Map<number, boolean>` (并发防护)
- **Circular imports** · `protectedProcedure` 定义在 `middleware/account-isolation.ts` 不是 `trpc.ts` (避免 publicProcedure 与 mw 循环)· `publicProcedure` 从 trpc.ts re-import 进 mw 文件
- **Transaction scope** · `accountIsolationMw` 把全 resolver 包在 `prisma.$transaction(async tx => ...)` · `SET LOCAL` 仅 tx-scoped · RLS 策略生效需 `SET LOCAL ROLE quanqn_app` (superuser bypass RLS by default)
- **dev mode in-process** · `NODE_ENV=development` 时 `index.ts:212` 启动 imageGenWorker + dailyTaskWorker 在 API 进程内 · prod 走独立 container
- **subscription long-lived** · tRPC v11 subscription 走 `httpBatchStreamLink` · 不是 websocket · `responseType=streaming`
- **TS strict** · `tsconfig.base.json` `strict:true + noUncheckedIndexedAccess + noImplicitOverride + useUnknownInCatchVariables`
- **`prisma.$executeRaw` 唯一允许处** · `apps/api/src/trpc/middleware/account-isolation.ts:38-41` (LD-009 · R-009 audit grep)
- **`@anthropic-ai/sdk` / `openai` 仅 3 处** · llm-gateway/index.ts (chat completion) + workers/stt/whisper.ts (Whisper audio · D-038) + workers/tts/openai-tts.ts (TTS audio · D-038)

---

## §9 Anti-Patterns

### §9.1 跨 Specialist 调用 (R-2 · LD-003)

**What happens:** Specialist A 在 execute 中直接 `specialistB.execute(...)` 共享 stepData
**Why it's wrong:** 破坏 ContextAssembler 单一入口 (D-007)· 失去 trace_id 父子链 · 单元测试隔离失败
**Do this instead:** 通过 `ContextAssembler.assemble()` 读 L2 stepData · EvolutionAgent 写 EvolutionProfile · 下次调用注入 prompt(`apps/api/src/services/context-assembler/ContextAssembler.ts:43`)

### §9.2 Specialist 内多轮 LLM 循环 (R-3 · LD-001)

**What happens:** Specialist.execute() 内 `for (i=0; i<5; i++) await gateway.complete()`
**Why it's wrong:** 违反 95/5 编排 · LLM 决策应走 L5 自治 + 外部 orchestrator (ADR-018)· 否则成本失控 + 无法熔断
**Do this instead:** 单次 `invokeLLM` + retry 1 次 · 多轮场景注册成 L5 · 用 BullMQ Worker 跑 (参 `apps/api/src/workers/evolution/worker.ts`)

### §9.3 直接 `import OpenAI` / `import Anthropic` 在应用代码 (R-1 · LD-012)

**What happens:** `apps/api/src/specialists/CopywritingAgent.ts` 直接 `new OpenAI()`
**Why it's wrong:** 跳过 LLMGateway · 失去限流 + 熔断 + 降级 + 计费 + trace 贯穿
**Do this instead:** `await this.llmGateway.complete({model_tier, systemPrompt, userPrompt, metadata})` (`apps/api/src/specialists/base/BaseSpecialist.ts:219`)· D-038 例外仅 STT/TTS/image-gen (audio/image 不用 chat completions)

### §9.4 router 不带 protectedProcedure (R-9 · LD-009)

**What happens:** `auth.publicProcedure.query(({ctx}) => prisma.stepData.findMany({where:{accountId:1}}))`
**Why it's wrong:** 跳过 RLS · 用户 A 看到 B 数据 · 严重 P0 bug
**Do this instead:** 全 router 用 `protectedProcedure` (`apps/api/src/trpc/middleware/account-isolation.ts:52`)· 全局表 (User/InviteCode/TrendingItem) 用 `globalProcedure` 显式跳 RLS

### §9.5 ContextAssembler 在 Specialist 内自拼 systemPrompt (D-007)

**What happens:** Specialist invokeLLM 内 `const systemPrompt = ` template literal 自拼
**Why it's wrong:** 5 路并行 + 5s timeout 降级丢失 · L4 EvolutionInsight 注入失效 · constants 失同步
**Do this instead:** `BaseSpecialist.execute()` Step 2 自动调 `_contextAssembler.assemble(...)` · invokeLLM 仅消费 `ctx.systemPrompt + ctx.userPrompt` (`apps/api/src/specialists/base/BaseSpecialist.ts:82-88`)

### §9.6 stepData.save 漏 step (PRD-4 US-017 教训 · §11.6.6)

**What happens:** `stepData.save` handler 漏 `step5/step7` · save 返回 null · UI skeleton 永挂
**Why it's wrong:** 静默失败 · e2e 跑时才发现 · 浪费 ralph 1 次 iteration
**Do this instead:** `apps/api/src/trpc/routers/stepData.ts` 必覆 9 step + `default: throw new Error('Unsupported stepKey')` (不是 return null)

### §9.7 双路径 L5 误用为标准 Specialist (§11.6.8 TD-024)

**What happens:** 把 EvolutionAgent / DailyTaskAgent 当 11 生成型 Specialist 走 ContextAssembler grep
**Why it's wrong:** L5 自治需多次 LLM 调用 + 异步触发 · BaseSpecialist 4 步模板不完全适用
**Do this instead:** EvolutionAgent + DailyTaskAgent 走双路径白名单 (specialists/ 是 re-export stub · agents/{evolution,specialists}/ 是真实施)· VoiceChat 单路径但走 tRPC subscription 不被 ContextAssembler grep

### §9.8 列表组件不套 ScrollArea (§11.4 · PRD-3 US-006 教训)

**What happens:** Radix DropdownMenuContent 套 `.map(items)` · items > 8 时 viewport 溢出
**Why it's wrong:** playwright click 56× retry 30s timeout · 用户也无法点击底部
**Do this instead:** 套 `<ScrollArea className="h-N">` · `ToolsDropdown` h-52 (14 工具) · `AccountDropdown` h-60

---

## §10 Error Handling

### §10.1 LLM 失败

| 错误类型 | 处理路径 |
|---|---|
| AbortError (timeout) | BaseSpecialist Step 3 catch → throw `LLMTimeoutError(agentId, timeout_ms)` |
| LLM 5xx | LLMGateway 内 primary → fallback 模型 · 反 `fallback: {from, to, reason}` |
| schema 校验失败 | safeParse 失败 → retry 1 次 invokeLLM → 二次失败 throw `SchemaValidationError(zodError, raw)` |
| Specialist 5xx / SchemaValidation / Timeout | BaseSpecialist catch → 若有 `fallbackTemplate[mode]` 用之 · 否则 re-throw · cost_log 写 `model='fallback' · tokens=0 · isFallback=true` |
| EvolutionAgent 失败 | 用 `previousInsight` 降级 · 不写新 insight (`apps/api/src/agents/evolution/EvolutionAgent.ts:127-133, 154-159`) |
| DailyTaskAgent 失败 | 用 5 条模板任务 · `modelUsed='cold-start-template'` · isFallback=false (`apps/api/src/agents/specialists/DailyTaskAgent.ts`) |

### §10.2 数据库失败

| 错误类型 | 处理路径 |
|---|---|
| 启动 DB 连接失败 | `checkDbConnection()` exit 1 (`apps/api/src/lib/prisma.ts:42`) |
| 写 cost_log 失败 | log only · 不 crash 业务 (`apps/api/src/specialists/base/BaseSpecialist.ts:272-274`) |
| EvolutionAgent $transaction 失败 | 整体回滚(profile + insight 同事务)· LD-014 ADR-014 |
| stepData.save DB 失败 | LS 不滚回 · 显 toast `已保存到本地 · 网络恢复后同步` (`apps/web/src/hooks/useStepData.ts:48-52`) |

### §10.3 Rate limit

- Upstash LLM 限流 · `RateLimitError` (`apps/api/src/workers/llm-gateway/rate-limiter.ts`)
- STT/TTS/image-gen 限流 · `TRPCError TOO_MANY_REQUESTS` (`apps/api/src/lib/rate-limit/{stt,tts,image-gen}.ts`)

### §10.4 Validation

- Input · `inputSchema.parse()` throws ZodError → tRPC 转 BAD_REQUEST
- Output · `outputSchema.safeParse()` → retry → `SchemaValidationError`
- OAuth state mismatch · `c.json({error:'state mismatch'}, 401)` + audit log `oauth_state_mismatch`

---

## §11 Cross-Cutting Concerns

### §11.1 Logging (pino + AsyncLocalStorage)

`apps/api/src/lib/logger.ts`

- pino structured · `mixin()` 读 `traceStore.getStore()?.traceId` 自动注入
- traceMw 用 `traceStore.run({traceId}, () => next())` 包裹 (`apps/api/src/trpc/trpc.ts:38`)
- dev `pino-pretty` colorize · prod 纯 JSON 给 vector
- LD-013 R-禁 `console.log` (audit grep `console\.(log|info|debug)` in `apps/api/src/` → reject)

### §11.2 Trace ID 贯穿

- Web client · `genTraceId()` 每请求 8 字节 hex 注入 `x-trace-id` header (`apps/web/src/lib/trpc.ts:25-31`)
- Hono trace mw · 读 header 或生成 8 字节 hex · 写响应 `x-trace-id` 头
- tRPC trace mw · 同读 + `traceStore.run`
- Specialist · `generateSpecialistTraceId(accountId, agentId)` 派生(REJ-017 · 不用 generateHttpTraceId)
- BullMQ job · `evolutionWorker` 派生 `evo-worker-{acc}-{Date.now()}` (`apps/api/src/workers/evolution/worker.ts:30`)

### §11.3 Validation (zod)

- packages/schemas SoT · `entities/*` 4 · `specialist-io/*` 19 · `admin/*` 0(P9.0)
- 双 schema 策略(§11.6.5)· `.refine()` 不能序列化 → `BaseSchema`(无 refine)给 LLM responseFormat + `OutputSchema`(含 refine)post-validate
- 多 mode getter(§11.6.3)· `_mode` instance state + `outputSchema` getter 按 `this._mode` 返(高并发 race window 留 TD-014)

### §11.4 Authentication

- Lucia v3 + arctic OAuth (Google + Mock dev)
- session cookie name=`app_session` (与 admin 区分 · LD-A-1)
- `validateStartupConfig()` 启动校验 SESSION_SECRET 长度 ≥ 32 · prod 禁 mock provider
- `protectedProcedure` 不直接校验 user · 校验 `activeAccountId !== null` · null 时 throw FORBIDDEN `no_active_account`

### §11.5 Disclaimer / PII (LD-018 · TD-016 修)

- `piiMask(input)` 接 ContextAssembler `_formatUserPrompt` · 替换 email/phone/id_card/bank_card 占位符
- `appendDisclaimerIfSensitive(markdown, industry)` 接 BaseSpecialist `_applyDisclaimer` · markdown 末尾追加免责
- `attachDisclaimerMeta(obj, industry)` JSON 输出加 `_disclaimer` 元数据
- 触发条件 · industry ∈ {医疗, 法律, 金融}(关键词 match)

### §11.6 Cost Tracking

- 全 LLM 调用走 LLMGateway · `cost-logger.ts` 写 `costLog` (eventType / agentId / accountId / traceId / modelUsed / tokens / durationMs / isFallback / target jsonb)
- Specialist 直接调 LLMGateway 时 · `metadata.eventType` 决定 cost_log 类别 (`specialist_call` / `l5_agent` / `judge_call` / `feedback`)
- LD-A-3 admin 审计表 append-only (留 PRD-10+)

---

*Architecture analysis: 2026-05-11 · PRD-8 完成期 · 14 Specialist 类全到位 · 3 orchestrator(BullMQ+cron+subscription)· 5 路 ContextAssembler · L1 Buffer Redis*
