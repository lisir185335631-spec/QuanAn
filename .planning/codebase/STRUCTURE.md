# Codebase Structure · QuanQn

**Analysis Date:** 2026-05-11
**Scope:** PRD-1 → PRD-8 完成期 · 6 workspace 全到位 · 14 Specialist · 9 Worker · 25 tRPC router · 34 web route
**Inputs:** AGENTS.md §4.6 (标准目录树) · pnpm-workspace.yaml · tsconfig.base.json · 实测 `ls -R` + `wc -l`

---

## §1 Directory Layout

```
QuanQn/  (monorepo root · pnpm 9.15.9 + turbo 2)
│
├── apps/  (3 个 deployable applications)
│   ├── api/                          # Hono + tRPC 后端 · @quanqn/api · 125 ts files
│   │   ├── src/
│   │   │   ├── index.ts              # Hono boot · CORS · OAuth · /trpc · cron / dev workers
│   │   │   ├── trpc/                 # tRPC v11 装配
│   │   │   │   ├── trpc.ts           # initTRPC + Meta{isGlobal?} + traceMw
│   │   │   │   ├── context.ts        # createContext (lucia → user + activeAccountId)
│   │   │   │   ├── middleware/
│   │   │   │   │   ├── account-isolation.ts  # ★ protectedProcedure ($tx + SET LOCAL)
│   │   │   │   │   └── trace.ts              # re-export + extractTraceId
│   │   │   │   └── routers/          # 25 routers (1 _app + 24 sub · 3302 LOC)
│   │   │   │       ├── _app.ts       # appRouter (merge 24 sub)
│   │   │   │       ├── auth.ts · ipAccounts.ts · stepData.ts
│   │   │   │       ├── costLog.ts · invite.ts · history.ts
│   │   │   │       ├── copywriting.ts · boomGenerate.ts
│   │   │   │       ├── analysis.ts · videoAnalysis.ts
│   │   │   │       ├── videoProduction.ts · acquisitionVideo.ts · aiVideo.ts
│   │   │   │       ├── monetization.ts · privateDomain.ts
│   │   │   │       ├── diagnosis.ts · deepLearning.ts
│   │   │   │       ├── knowledge.ts · trending.ts
│   │   │   │       ├── evolution.ts · dailyTasks.ts
│   │   │   │       └── stt.ts · tts.ts · voiceChat.ts  # PRD-8 加 3 个
│   │   │   │
│   │   │   ├── specialists/          # ★ 14 Specialist 类(主路径)
│   │   │   │   ├── base/
│   │   │   │   │   ├── BaseSpecialist.ts    # PRD-4 模板方法(276 LOC · active)
│   │   │   │   │   ├── errors.ts            # SchemaValidationError/LLMTimeoutError
│   │   │   │   │   └── types.ts             # SpecialistConfig/Request/Response
│   │   │   │   ├── PositioningAgent.ts     # 11 生成型(单路径 · active)
│   │   │   │   ├── BrandingAgent.ts
│   │   │   │   ├── MonetizationAgent.ts
│   │   │   │   ├── TopicAgent.ts
│   │   │   │   ├── CopywritingAgent.ts
│   │   │   │   ├── VideoAgent.ts
│   │   │   │   ├── LivestreamAgent.ts
│   │   │   │   ├── PrivateDomainAgent.ts
│   │   │   │   ├── AnalysisAgent.ts
│   │   │   │   ├── DiagnosisAgent.ts
│   │   │   │   ├── DeepLearnAgent.ts
│   │   │   │   ├── EvolutionAgent.ts        # 12 LOC re-export stub (双路径 §11.6.8)
│   │   │   │   ├── DailyTaskAgent.ts        # 107 LOC stub (throw '真接 US-007')
│   │   │   │   └── VoiceChatAgent.ts        # 398 LOC 真实施(单路径 + tRPC subscription)
│   │   │   │
│   │   │   ├── agents/               # ★ 双路径 L5 真实施 (TD-024 §11.6.8 接受)
│   │   │   │   ├── base/             # ⚠️ legacy BaseSpecialist (dead code · 仅 dailyTask import 引用 types · §11.6 §11.6.1)
│   │   │   │   │   ├── BaseSpecialist.ts    # 71 LOC 旧 run() 模板(不用)
│   │   │   │   │   ├── IPProgressService.ts # 44 LOC 旧版(不用)
│   │   │   │   │   └── types.ts             # 94 LOC SpecialistId enum · generateSpecialistTraceId · ★ 仍在用
│   │   │   │   ├── evolution/
│   │   │   │   │   └── EvolutionAgent.ts    # 429 LOC 真实施
│   │   │   │   └── specialists/
│   │   │   │       ├── CopywritingAgent.ts  # 168 LOC ⚠️ dead code (DRIFT TD-旧)
│   │   │   │       └── DailyTaskAgent.ts    # 296 LOC 真实施
│   │   │   │
│   │   │   ├── services/             # 业务服务层
│   │   │   │   ├── context-assembler/
│   │   │   │   │   ├── ContextAssembler.ts  # 205 LOC · 5 路并行 + 5s timeout
│   │   │   │   │   ├── templates/           # 14 Specialist persona / methodology 模板
│   │   │   │   │   └── types.ts             # AssembleRequest / AssembledContext
│   │   │   │   └── ip-progress/
│   │   │   │       └── IPProgressService.ts # 9 步主线进度计算
│   │   │   │
│   │   │   ├── memory/               # ★ 5 层记忆 helpers
│   │   │   │   ├── l1-buffer.ts      # Redis voice_chat:acc_{id}:turns
│   │   │   │   ├── l4-profile.ts     # getLatestInsight + getDeepLearningSamples
│   │   │   │   └── l5-trending.ts    # 占位(PRD-9 真接)
│   │   │   │
│   │   │   ├── workers/              # ★ 9 Worker(独立子目录)
│   │   │   │   ├── llm-gateway/      # ★ R-1 唯一 LLM SDK 入口
│   │   │   │   │   ├── index.ts            # LLMGateway 主入口(256 LOC)
│   │   │   │   │   ├── anthropic-provider.ts
│   │   │   │   │   ├── openai-provider.ts
│   │   │   │   │   ├── rate-limiter.ts     # Upstash REST token bucket
│   │   │   │   │   └── cost-logger.ts
│   │   │   │   ├── methodology-query/      # in-memory 常量查询
│   │   │   │   │   └── index.ts
│   │   │   │   ├── image-gen/              # DALL-E 3 + BullMQ
│   │   │   │   │   ├── index.ts            # interface IImageGenWorker
│   │   │   │   │   ├── dall-e-3.ts         # 实现
│   │   │   │   │   ├── queue.ts            # BullMQ 'image-gen'
│   │   │   │   │   └── worker.ts           # Worker instance
│   │   │   │   ├── daily-task/             # PRD-8 US-002/007
│   │   │   │   │   ├── index.ts
│   │   │   │   │   ├── queue.ts            # BullMQ 'daily-task' (jobId 幂等)
│   │   │   │   │   └── worker.ts           # concurrency=5
│   │   │   │   ├── evolution/              # PRD-8 US-002/003
│   │   │   │   │   ├── index.ts
│   │   │   │   │   ├── queue.ts            # BullMQ 'evolution'
│   │   │   │   │   └── worker.ts           # concurrency=5 + dead-letter alert stub
│   │   │   │   ├── stt/                    # PRD-8 US-009 Whisper-1
│   │   │   │   │   ├── index.ts            # interface ISttWorker
│   │   │   │   │   └── whisper.ts          # ★ D-038 OpenAI audio SDK 唯一处之一
│   │   │   │   ├── tts/                    # PRD-8 US-010 OpenAI TTS-1
│   │   │   │   │   ├── index.ts            # interface ITtsWorker
│   │   │   │   │   └── openai-tts.ts       # ★ D-038 OpenAI audio SDK 唯一处之一
│   │   │   │   ├── trending-scraper/       # 空目录(LD-017 留 PRD-9 第三方授权方案)
│   │   │   │   └── file-parser/            # 空目录(PRD-9+)
│   │   │   │
│   │   │   ├── cron/                 # node-cron 定时任务
│   │   │   │   └── daily-task-runner.ts    # 0 0 * * * Asia/Shanghai + fan-out
│   │   │   │
│   │   │   ├── notification/         # 空目录(P3+)
│   │   │   ├── audit/                # 空目录(留 admin PRD-10+)
│   │   │   ├── types/
│   │   │   │   └── node-cron.d.ts          # 第三方 type 补丁
│   │   │   │
│   │   │   └── lib/                  # 横切关注点 · 17 子文件
│   │   │       ├── prisma.ts                # PrismaClient 单例 + globalThis cache
│   │   │       ├── redis.ts                 # ioredis 单例(maxRetriesPerRequest: null)
│   │   │       ├── logger.ts                # pino + AsyncLocalStorage traceStore
│   │   │       ├── auth/
│   │   │       │   ├── lucia.ts             # Lucia v3 + cookie name 'app_session'
│   │   │       │   ├── adapter.ts           # Lucia + Prisma adapter
│   │   │       │   └── providers.ts         # MockProvider + GoogleProvider(arctic)
│   │   │       ├── compliance/
│   │   │       │   ├── pii-mask.ts          # email/phone/id_card/bank_card
│   │   │       │   └── disclaimer.ts        # 医疗/法律/金融 行业免责追加
│   │   │       ├── constants/               # 15 个常量文件(740 LOC total)
│   │   │       │   ├── index.ts             # barrel
│   │   │       │   ├── industries.ts · hotElements.ts · scriptTypes.ts
│   │   │       │   ├── presentStyles.ts · platforms.ts · steps.ts
│   │   │       │   ├── evolution.ts · diagnosis.ts · privateDomain.ts
│   │   │       │   ├── sttLimits.ts · ttsLimits.ts · imageStyles.ts
│   │   │       │   └── videoDurations.ts · videoTypes.ts
│   │   │       ├── evolution/
│   │   │       │   └── trigger.ts           # enqueueIfThresholdMet (INSERT ON CONFLICT)
│   │   │       ├── rate-limit/
│   │   │       │   ├── image-gen.ts         # 10/day
│   │   │       │   ├── stt.ts               # 50/day
│   │   │       │   └── tts.ts               # 100/day
│   │   │       └── voice-chat/
│   │   │           └── tools-dispatcher.ts  # 5 工具 prisma query + per-account lock
│   │   │
│   │   ├── package.json              # @quanqn/api · deps: hono/trpc/prisma/lucia/bullmq/anthropic/openai/pino
│   │   └── tsconfig.json
│   │
│   ├── web/                          # Vite + React SPA · @quanqn/web · 105 ts/tsx files
│   │   ├── src/
│   │   │   ├── main.tsx              # createRoot + Provider 三层套
│   │   │   ├── App.tsx               # 16 行 placeholder(MVP 已 deprecated)
│   │   │   ├── router.tsx            # createBrowserRouter · 34 routes · lazy 4 chunks
│   │   │   ├── vite-env.d.ts
│   │   │   │
│   │   │   ├── layouts/
│   │   │   │   ├── RootLayout.tsx           # Header + Toaster + Suspense fallback
│   │   │   │   └── StepLayout.tsx           # /step/* 嵌套 + FeedbackButton(STEP_AGENT_MAP)
│   │   │   │
│   │   │   ├── pages/                # 34 routes
│   │   │   │   ├── IpPlan.tsx · Login.tsx · NotFound.tsx · Settings.tsx
│   │   │   │   ├── step/             # 11 step pages (Step1~9 + 3b/4b)
│   │   │   │   ├── tools/            # 15 工具页(Trending/Copywriting/.../VoiceChat 612 LOC)
│   │   │   │   └── modules/          # 6 模块(Accounts/DailyTasks 319/Evolution 370/History 276/MyTopics/Diagnosis)
│   │   │   │
│   │   │   ├── components/
│   │   │   │   ├── ErrorBoundary.tsx
│   │   │   │   ├── FeedbackButton.tsx       # 唯一渲染点在 StepLayout(§11.3)
│   │   │   │   ├── Header.tsx               # ToolsDropdown(h-52) + AccountDropdown(h-60)
│   │   │   │   ├── StepProgress.tsx + test
│   │   │   │   ├── StepForm/                # 5 子组件(CategorySelect/IndustrySelect/PlatformSelect/StepForm/TextareaField)
│   │   │   │   ├── StepResult/              # 10 子组件(Step1~8Result + FallbackBanner + index)
│   │   │   │   ├── ToolForm/                # 工具页通用 form
│   │   │   │   ├── ToolResult/              # 工具页通用 result
│   │   │   │   └── ui/                      # 14 shadcn 基础组件 · ⚠️ DRIFT TD-005 应迁 packages/ui/src/base/
│   │   │   │       ├── avatar.tsx · button.tsx · card.tsx · dialog.tsx
│   │   │   │       ├── dropdown-menu.tsx · input.tsx · progress.tsx
│   │   │   │       ├── scroll-area.tsx · select.tsx · separator.tsx
│   │   │   │       ├── sheet.tsx · tabs.tsx · toast.tsx · tooltip.tsx
│   │   │   │
│   │   │   ├── hooks/
│   │   │   │   ├── useAuth.ts               # auth.me + login() fetch /auth/login
│   │   │   │   ├── useActiveAccount.ts      # switchTo + clearLsNamespace + reload
│   │   │   │   ├── useStepData.ts           # LS↔DB dual-write(LD-010 4 规则)
│   │   │   │   └── useEvolution.ts          # LS cache instant read
│   │   │   │
│   │   │   ├── lib/
│   │   │   │   ├── trpc.ts                  # createTRPCReact + httpBatchStreamLink + x-trace-id
│   │   │   │   ├── ls-namespace.ts          # aiip_memory_acc_{id}_{suffix} + 5MB cap + prune
│   │   │   │   ├── parseDesignTokens.js     # tailwind 配色派生 · 接 DESIGN.md YAML
│   │   │   │   ├── stepConfig.ts            # 9 step 配置
│   │   │   │   ├── utils.ts                 # cn() shadcn helper + 通用 util
│   │   │   │   ├── constants/               # 前端常量(从 packages/schemas 镜像 / 派生)
│   │   │   │   └── schemas/                 # 前端 zod 镜像
│   │   │   │
│   │   │   ├── styles/                      # globals.css(Tailwind + Aurelian Dark)
│   │   │   └── test/                        # vitest setup
│   │   │
│   │   ├── index.html
│   │   ├── package.json              # @quanqn/web · deps: react 18.3 / radix-ui / tanstack-query / trpc-client / lucide / sonner / zod / recharts / zustand
│   │   ├── postcss.config.js · tailwind.config.js
│   │   ├── vite.config.ts
│   │   └── tsconfig.json
│   │
│   └── admin/                        # ⚠️ P0 占位 · ADR-021 独立部署 · PRD-10+ 启动
│       ├── src/
│       │   ├── index.ts                     # 12 行 readme stub
│       │   ├── components/                  # 空目录
│       │   ├── hooks/                       # 空目录
│       │   ├── pages/                       # 空目录
│       │   └── styles/                      # 空目录
│       └── package.json              # @quanqn/admin · 占位(scripts 都 echo)
│
├── packages/  (3 个 shared libraries)
│   ├── schemas/                      # zod schema 真理来源 · @quanqn/schemas
│   │   └── src/
│   │       ├── index.ts                     # barrel(P0 占位仅 export entities + 5 video)
│   │       ├── entities/                    # 4 业务实体 schema
│   │       │   ├── ipAccount.schema.ts · stepData.schema.ts
│   │       │   ├── invite.schema.ts · knowledge.schema.ts · trending.schema.ts
│   │       │   └── index.ts
│   │       ├── step-results/                # 空目录(留 P1+)
│   │       ├── specialist-io/               # 19 个 schema 文件(14 Specialist I/O + 5 constants)
│   │       │   ├── index.ts · constants.ts
│   │       │   ├── analysis · branding · copywriting · livestream
│   │       │   ├── monetization · positioning · topic · video
│   │       │   ├── deepLearning · diagnosis · privateDomain
│   │       │   ├── evolution · dailyTask · voiceChat       # PRD-8 加
│   │       │   ├── stt · tts · imageGen
│   │       │   ├── boomGenerate · acquisitionVideo · acquisitionCopywriting
│   │       │   ├── videoAnalysis · videoProduction · aiVideo
│   │       │   └── step-inputs.schema.ts
│   │       └── admin/                       # 空目录(P9.0 起填 · PRD-10+)
│   │
│   ├── clients/                      # tRPC client 共享类型 · @quanqn/clients
│   │   └── src/
│   │       ├── index.ts              # 占位 export {}
│   │       └── router-types.ts       # ★ AppRouter shadow router(避免前端 bundle @trpc/server)
│   │
│   └── ui/                           # Aurelian Dark 设计系统 · @quanqn/ui
│       └── src/
│           ├── index.ts              # 占位 export {}
│           ├── base/                 # 占位(主应用通用)· ⚠️ TD-005 14 shadcn 实在 apps/web/components/ui/
│           │   └── index.ts
│           └── admin/                # 占位(admin 专属密度 token + AdminLayout)
│               └── index.ts
│
├── prisma/                           # Prisma 5.22 schema 真理来源
│   ├── schema.prisma                 # 39 models(18 主应用 + 13 admin + 4 支持 + 4 增量)
│   ├── migrations/                   # Prisma 迁移
│   └── seed.ts                       # 邀请码 / TrendingItem seed
│
├── tests/                            # 全局测试(应用层独立 vitest)
│   ├── unit/                         # vitest unit(应用 + worker + service)
│   │   └── api/                      # 118 unit tests
│   ├── integration/                  # vitest integration(testcontainers-postgresql)
│   │   └── api/
│   ├── e2e/                          # playwright e2e(27 spec 文件)
│   │   ├── account-isolation/switch · ip-flow-9-steps · evolution-loop
│   │   ├── feedback-evolution-loop · daily-task-flow · voice-chat-flow
│   │   └── tool-{generate,boom-generate,analysis,...}
│   ├── judge/                        # LLM-as-Judge 套件(21 judge case · vitest.judge.config.ts)
│   │   ├── judge-runner.ts                  # 共享 runJudge
│   │   └── 14 Specialist × 1-2 golden case
│   ├── llm-judge/                    # 空目录(占位 · LLM Judge 已迁 tests/judge)
│   └── setup.ts                      # vitest 全局 setup
│
├── scripts/
│   ├── audit-redlines.sh             # AGENTS §8 17 R audit grep
│   ├── audit-ld.sh                   # AGENTS §8 18 LD audit
│   ├── audit-all.sh                  # 合并跑
│   ├── seed-reject-examples.sh       # 反例库 seed (~/.claude/playbooks/reject-examples.jsonl)
│   └── ralph/                        # Coding 3.0 工具(全局复制 + 项目同步)
│       ├── ralph.py · ralph-tools.py · watch-audit-gate.py
│       ├── CLAUDE.md · VALIDATOR.md
│       ├── AUDIT-CHECKLIST-TEMPLATE.md · OPUS-AUDIT-CHEATSHEET.md
│       ├── TECH-DEBT-SCHEMA.md · REJECT-TEMPLATE.md
│       ├── audit-artifacts.py
│       ├── dashboard.py · dashboard.html · dashboard-p.html
│       ├── verify-artifacts/                # US-001~US-013 验证产物
│       ├── prd.json · prd-{1..8}.json       # PRD-N 的 prd.json 历史
│       ├── progress.txt · cost-log.jsonl
│       └── ralph-output.log · ralph-lock.json · audit-gate.json
│
├── .agents/                          # 项目内 agent 元数据
│   ├── tech-debt.json                # TD-001 ~ TD-024(2026-05-11 加 TD-024 双路径)
│   ├── plans/                        # /plan-feature 输出
│   ├── retros/                       # PRD-1~8 retros
│   │   └── prd-8-vs-prd-7-retrospective.md
│   └── rca/                          # RCA-001 audit-delay · RCA-002 developer-timeout
│
├── .planning/
│   ├── codebase/                     # /gsd-map-codebase 输出(7 文件)
│   │   ├── ARCHITECTURE.md           # ← 本次刷新
│   │   ├── STRUCTURE.md              # ← 本次刷新
│   │   ├── STACK.md · INTEGRATIONS.md
│   │   ├── CONVENTIONS.md · TESTING.md
│   │   └── CONCERNS.md
│   ├── codebase-stale-20260509-prd5/ # PRD-5 期快照(历史)
│   ├── prd-5-assumptions.md
│   ├── retros/ · verifications/
│
├── playwright-report/ · screenshots/ · test-results/  # CI 产物
│
├── tasks/                            # prd skill 生成
│   └── prd-{1..N}.md
│
├── ARCHITECTURE.md                   # 战略骨架(199K · 9 章 · 只读)
├── ADMIN-ARCHITECTURE.md             # admin 子系统骨架(114K · 留 PRD-10+)
├── AGENTS.md                         # 项目 LD + R + 后端 / 前端实施沉淀(2026-05-11 更新 §11.6.8)
├── ADR.md                            # 21 ADR(含 ADR-018 外部 orchestrator)
├── DATA-MODEL.md                     # Prisma schema 详情(144K · §13 admin)
├── PROMPTS.md                        # 14 Specialist prompt 模板
├── PRD-MASTER.md                     # 14 PRD 总纲
├── DEV-READINESS.md · HANDOFF.md · HANDOFF-PRD-8.md
├── SCAFFOLD.md · SCAFFOLD-COMPLETION.md
├── README.md · CLAUDE.md             # 项目级 AI 协作约束
│
├── package.json                      # root scripts (dev:web/api · build · test · audit)
├── pnpm-workspace.yaml               # packages: ['apps/*', 'packages/*']
├── pnpm-lock.yaml
├── turbo.json                        # tasks: build/dev/test/lint/typecheck
├── tsconfig.base.json                # strict + noUncheckedIndexedAccess + path aliases
├── tsconfig.json                     # root extend base
├── playwright.config.ts · vitest.config.ts · vitest.judge.config.ts
├── .eslintrc.cjs · .prettierrc
├── .env · .env.example               # ⚠️ .env 不 commit · 仅 env vars(无密钥进 logs)
├── .gitignore · .gitattributes · .nvmrc · .npmrc
└── .husky/                           # husky + lint-staged hook
```

---

## §2 Directory Purposes

### §2.1 `apps/api/` — 后端 (Hono + tRPC)

- **Purpose:** HTTP 入口 · tRPC routers · Specialist 实施 · Worker · Cron · DB 访问
- **Contains:** TS 业务代码 · Prisma client wrapper · auth · cost / rate / trace
- **Key entry:** `src/index.ts` (Hono boot)
- **Key types:** tRPC AppRouter · SpecialistConfig · AssembledContext · ModelTier

### §2.2 `apps/api/src/specialists/` — 14 Specialist 主路径

- **Purpose:** LD-002 14 能力域 Specialist 类(11 生成型 active · 3 L5 stub re-export)
- **Contains:** 每个 Specialist 一个文件 · `base/` 子目录有 `BaseSpecialist`/`errors`/`types` (PRD-4 active)
- **Key files:**
  - `base/BaseSpecialist.ts` (276 LOC active 模板方法)
  - `CopywritingAgent.ts` (643 LOC 4 mode 最大)
  - `VideoAgent.ts` (608 LOC 4 mode)
  - `VoiceChatAgent.ts` (398 LOC L5 单路径 + tRPC subscription)
  - `EvolutionAgent.ts` (12 LOC re-export stub → `agents/evolution/`)
  - `DailyTaskAgent.ts` (107 LOC stub throw 'US-007 真接' · 真实施在 `agents/specialists/`)

### §2.3 `apps/api/src/agents/` — 双路径 L5 真实施

- **Purpose:** §11.6.8 TD-024 接受 · L5 自治 Agent 走"双路径白名单" · 真实施留这 · stub 留 `specialists/`
- **Contains:**
  - `base/` (⚠️ legacy · 旧版 `BaseSpecialist.run()` 71 LOC · 仅 types.ts 仍在用 — `SpecialistId` enum + `generateSpecialistTraceId`)
  - `evolution/EvolutionAgent.ts` (429 LOC · override execute() · $transaction · merge Rule 3)
  - `specialists/CopywritingAgent.ts` (168 LOC · ⚠️ dead code · grep 主代码 0 引用)
  - `specialists/DailyTaskAgent.ts` (296 LOC · 冷启动判定 · LLMGateway lightweight)
- **Why split:** L5 需 override execute() · 多次 LLM 调用 · 异步触发 · BaseSpecialist 4 步模板不完全适用

### §2.4 `apps/api/src/trpc/` — tRPC 装配

- **Purpose:** 25 router · context · middleware · meta type
- **Contains:**
  - `trpc.ts` (initTRPC + Meta + traceMw)
  - `context.ts` (lucia → user + activeAccountId)
  - `middleware/account-isolation.ts` (★ LD-009 RLS 闸 2 · 唯一 $executeRaw 处)
  - `middleware/trace.ts` (re-export + extractTraceId)
  - `routers/_app.ts` (25 router 合并)
  - `routers/{auth,ipAccounts,stepData,...}.ts` (24 sub-router)

### §2.5 `apps/api/src/workers/` — 9 Worker

- **Purpose:** 后台异步任务 · LLM SDK 唯一入口(R-1) · BullMQ Queue/Worker · 独立 worker
- **Contains:** 每个子目录一个 worker
- **Special files:**
  - `llm-gateway/index.ts` (256 LOC · R-1 LLMGateway 唯一处)
  - `stt/whisper.ts` · `tts/openai-tts.ts` (D-038 audio SDK 例外 2 处)
  - `image-gen/dall-e-3.ts` (D-038 image SDK 例外 1 处)
  - `evolution/{queue,worker}.ts` · `daily-task/{queue,worker}.ts` (BullMQ)
  - `methodology-query/index.ts` (in-memory 常量 · ContextAssembler 用)
  - `trending-scraper/` · `file-parser/` (空目录 · LD-017 留 PRD-9 第三方授权)

### §2.6 `apps/api/src/memory/` — 5 层记忆

- **Purpose:** LD-006 5 层记忆 helpers · L1 Buffer / L4 Profile / L5 Trending
- **Contains:**
  - `l1-buffer.ts` (39 LOC · Redis voice_chat:acc_{id}:turns · LPUSH/LTRIM/EXPIRE 1800)
  - `l4-profile.ts` (33 LOC · getLatestInsight + getDeepLearningSamples)
  - `l5-trending.ts` (22 LOC · 占位 PRD-9)
- **Notes:** L2 (stepData) 走 prisma 直接 · L3 (Recall pgvector) 留 P1+

### §2.7 `apps/api/src/services/` — 业务服务层

- **Purpose:** Specialist 之间共享逻辑 · 不属 Specialist 也不属 Worker
- **Contains:**
  - `context-assembler/ContextAssembler.ts` (205 LOC · 5 路并行 + Promise.allSettled + 5s timeout)
  - `context-assembler/templates/` (14 Specialist persona / methodology 模板)
  - `ip-progress/IPProgressService.ts` (9 步主线进度)

### §2.8 `apps/api/src/cron/` — node-cron 定时任务

- **Purpose:** L5 自治 Agent 的 cron 触发(ADR-018 外部 orchestrator)
- **Contains:** `daily-task-runner.ts` (0 0 * * * Asia/Shanghai + fan-out 活跃账号)
- **未来:** P3+ 加 evolution-runner.ts(若需周期跑而非阈值触发)

### §2.9 `apps/api/src/lib/` — 横切关注点

- **Purpose:** 不属 specialist/worker/service · 全局可用
- **Contains:**
  - `prisma.ts` · `redis.ts` · `logger.ts`
  - `auth/{lucia,adapter,providers}.ts`
  - `compliance/{pii-mask,disclaimer}.ts`
  - `constants/` (15 个常量 · 740 LOC)
  - `evolution/trigger.ts` (enqueueIfThresholdMet 原子)
  - `rate-limit/{image-gen,stt,tts}.ts`
  - `voice-chat/tools-dispatcher.ts`

### §2.10 `apps/web/` — 前端 (Vite + React + tRPC)

- **Purpose:** SPA 入口 · 34 routes · Aurelian Dark 视觉 · 4 hooks · shadcn UI
- **Contains:** `src/` 标准 React 项目布局
- **Key entry:** `src/main.tsx` → Provider 套 → `RouterProvider`
- **Notes:** components/ui/* 14 shadcn 组件 ⚠️ TD-005 应迁 packages/ui/src/base/

### §2.11 `apps/admin/` — 管理后台 (P0 占位)

- **Purpose:** ADR-021 独立部署 admin 前端 · 主应用 0 import
- **Contains:** 占位 stub · 12 行 readme · 空 pages/components/hooks/styles
- **Activation:** PRD-10 起填充(auth + 6 闸鉴权链 + 内容审核 + 邀请码管理)

### §2.12 `packages/schemas/` — zod 真理来源

- **Purpose:** packages/clients (前端镜像)和 apps/api (后端校验)共用 zod schema
- **Contains:**
  - `entities/` (4 业务实体)
  - `specialist-io/` (19 schema · 14 Specialist I/O + 5 constants/utility · PRD-8 加 voiceChat/stt/tts/dailyTask/evolution/aiVideo/...)
  - `admin/` (空 P9.0+)
  - `step-results/` (空 P1+)

### §2.13 `packages/clients/` — tRPC shadow router

- **Purpose:** ★ AppRouter 跨 package 共享 · 避免 web bundle `@trpc/server`
- **Contains:** `router-types.ts` (~700 LOC · 25 router shadow · output types)
- **Why:** apps/api 直接 export AppRouter type 会让 web Vite/esbuild 把 `@trpc/server` 拖进 bundle · shadow 用 `_shadowRouter` 镜像 + `export type AppRouter = typeof _shadowRouter` 解决
- **TD:** PRD-11+ 迁 TypeScript project references (`AppRouter` 类型直接走 reference)

### §2.14 `packages/ui/` — Aurelian Dark 设计系统

- **Purpose:** 共享 UI 组件 · base (主应用) + admin (PRD-10+)
- **Contains:** 占位 export {} · ⚠️ TD-005 14 shadcn 组件实际在 `apps/web/src/components/ui/` 而非这里

### §2.15 `prisma/` — DB schema 真理来源

- **Purpose:** Prisma 5.22 schema · 39 models · migrations · seed
- **Contains:**
  - `schema.prisma` (主文件)
  - `migrations/` (Prisma 自动生成迁移)
  - `seed.ts` (邀请码 + TrendingItem mock)

### §2.16 `tests/` — 全局测试

- **Purpose:** unit + integration + e2e + LLM-as-Judge 四类测试
- **Contains:**
  - `unit/api/` (118 unit tests · vitest)
  - `integration/api/` (testcontainers-postgresql 集成)
  - `e2e/*.spec.ts` (playwright · 27 spec)
  - `judge/*.judge.ts` (LLM Judge · 21 case · vitest.judge.config.ts)
  - `llm-judge/` (空目录 · 已迁 tests/judge)
  - `setup.ts` (vitest 全局 setup · 环境变量 + DB cleanup)

### §2.17 `scripts/ralph/` — Coding 3.0 工具

- **Purpose:** Ralph daemon 自主执行 + Validator + Opus Audit · 从 ~/.claude/ 同步
- **Contains:** ralph.py · ralph-tools.py · CLAUDE.md · VALIDATOR.md · audit templates · prd.json · cost-log.jsonl · verify-artifacts/
- **Notes:** 跨项目复用 · `~/.claude/scripts/ralph/sync-to-project.sh` 同步

### §2.18 `.agents/` — 项目内 agent 元数据

- **Purpose:** 项目 specific 的 TD + retros + RCA
- **Contains:**
  - `tech-debt.json` (TD-001 ~ TD-024 · 加 TD-024 双路径白名单 2026-05-11)
  - `retros/` (PRD-1~8 retrospective)
  - `rca/` (RCA-001 audit-delay · RCA-002 developer-timeout)

### §2.19 `.planning/codebase/` — GSD 事实层

- **Purpose:** /gsd-map-codebase 输出 · 7 文件(ARCHITECTURE/STRUCTURE/STACK/CONVENTIONS/INTEGRATIONS/CONCERNS/TESTING)
- **Contains:** 本次刷新 PRD-8 完成态 · 旧版备份在 codebase-stale-20260509-prd5/
- **使用方:** /goal-verify §0 自动跑 · 用于 AGENTS.md 设计约束对账

---

## §3 Key File Locations

### §3.1 Entry Points

| Type | 路径 | 职责 |
|---|---|---|
| API HTTP | `apps/api/src/index.ts` | Hono boot + CORS + OAuth + /trpc/* |
| Web HTML | `apps/web/index.html` | Vite entry · 加载 main.tsx |
| Web TSX | `apps/web/src/main.tsx` | createRoot + Provider 套 |
| Web Router | `apps/web/src/router.tsx` | createBrowserRouter · 34 routes |
| Cron | `apps/api/src/cron/daily-task-runner.ts` | 0 0 * * * Asia/Shanghai |
| Image worker (prod) | `apps/api/src/workers/image-gen/worker.ts` | `pnpm worker:image-gen` (root scripts) |

### §3.2 Configuration

| File | 职责 |
|---|---|
| `pnpm-workspace.yaml` | packages: ['apps/*', 'packages/*'] |
| `turbo.json` | tasks: build/dev/test/lint/typecheck (outputs cache) |
| `tsconfig.base.json` | strict + noUncheckedIndexedAccess + path aliases |
| `tsconfig.json` | root extend base |
| `package.json` (root) | scripts: dev:* · build:* · test · audit:* · worker:image-gen |
| `apps/web/vite.config.ts` | Vite + React plugin + tailwind |
| `apps/web/postcss.config.js` · `tailwind.config.js` | Tailwind + Aurelian Dark |
| `playwright.config.ts` | e2e baseURL + 浏览器 |
| `vitest.config.ts` | unit/integration · setupFiles |
| `vitest.judge.config.ts` | LLM Judge 独立 config (lightweight model) |
| `.eslintrc.cjs` · `.prettierrc` | code style |
| `.env` (gitignored) · `.env.example` | env vars 模板 |
| `.husky/` | git hook (pre-commit lint-staged) |

### §3.3 Core Logic

| 域 | 路径 | 行数 |
|---|---|:-:|
| BaseSpecialist (active) | `apps/api/src/specialists/base/BaseSpecialist.ts` | 276 |
| ContextAssembler | `apps/api/src/services/context-assembler/ContextAssembler.ts` | 205 |
| LLMGateway | `apps/api/src/workers/llm-gateway/index.ts` | 256 |
| account-isolation middleware | `apps/api/src/trpc/middleware/account-isolation.ts` | 58 |
| EvolutionAgent (真) | `apps/api/src/agents/evolution/EvolutionAgent.ts` | 429 |
| DailyTaskAgent (真) | `apps/api/src/agents/specialists/DailyTaskAgent.ts` | 296 |
| VoiceChatAgent | `apps/api/src/specialists/VoiceChatAgent.ts` | 398 |
| enqueueIfThresholdMet | `apps/api/src/lib/evolution/trigger.ts` | 60 |
| Daily-task cron | `apps/api/src/cron/daily-task-runner.ts` | 81 |
| VoiceChat tools dispatcher | `apps/api/src/lib/voice-chat/tools-dispatcher.ts` | ~150 |
| AppRouter shadow | `packages/clients/src/router-types.ts` | ~700 |
| useStepData hook | `apps/web/src/hooks/useStepData.ts` | ~70 |

### §3.4 Testing

| Type | 路径 |
|---|---|
| Unit (vitest) | `tests/unit/api/*.test.ts` (118 files) |
| Integration | `tests/integration/api/*.test.ts` |
| E2E (playwright) | `tests/e2e/*.spec.ts` (27 files) |
| LLM Judge | `tests/judge/*.judge.ts` (21 files · vitest.judge.config.ts) |
| Web component test | `apps/web/src/**/*.test.tsx` (~4 files) |
| Test setup | `tests/setup.ts` |

---

## §4 Naming Conventions

### §4.1 Files

| Type | Convention | Example |
|---|---|---|
| Specialist class | `PascalCaseAgent.ts` | `CopywritingAgent.ts` · `VoiceChatAgent.ts` |
| BaseSpecialist subclass | `extends BaseSpecialist<TIn, TOut>` | `class CopywritingAgent extends BaseSpecialist<...>` |
| tRPC router | `camelCaseRouter` export · file `camelCase.ts` | `copywritingRouter` in `copywriting.ts` |
| BullMQ queue | `kebab-case-queue` constant · file `queue.ts` | `'daily-task'` in `workers/daily-task/queue.ts` |
| BullMQ worker | `camelCaseWorker` export · file `worker.ts` | `dailyTaskWorker` in `workers/daily-task/worker.ts` |
| Hook | `useCamelCase.ts` | `useStepData.ts` · `useActiveAccount.ts` |
| Page | `PascalCase.tsx` (route 组件) | `Step1.tsx` · `VoiceChat.tsx` · `DailyTasks.tsx` |
| Layout | `PascalCaseLayout.tsx` | `RootLayout.tsx` · `StepLayout.tsx` |
| UI 组件 | `kebab-case.tsx` (shadcn 约定) | `dropdown-menu.tsx` · `scroll-area.tsx` |
| zod schema | `camelCase.schema.ts` | `videoProduction.schema.ts` · `copywriting.schema.ts` |
| Constant module | `camelCase.ts` | `industries.ts` · `hotElements.ts` |
| Test | `kebab-case.test.ts` (unit) · `*.spec.ts` (e2e) · `*.judge.ts` (judge) | `copywriting-router.test.ts` |

### §4.2 Directories

| Type | Convention | Example |
|---|---|---|
| App workspace | lowercase | `apps/api/`, `apps/web/`, `apps/admin/` |
| Package | lowercase | `packages/schemas/`, `packages/clients/`, `packages/ui/` |
| Domain dir | kebab-case | `context-assembler/`, `trending-scraper/`, `voice-chat/`, `daily-task/`, `methodology-query/`, `llm-gateway/`, `image-gen/`, `file-parser/` |
| Generic dir | lowercase 单数 | `auth/`, `compliance/`, `constants/`, `rate-limit/`, `evolution/`, `memory/`, `cron/`, `services/`, `workers/`, `specialists/`, `agents/`, `trpc/`, `routers/`, `middleware/`, `lib/`, `types/` |

### §4.3 Variables / Functions

| Type | Convention | Example |
|---|---|---|
| Function | `camelCase` | `enqueueIfThresholdMet`, `getLatestInsight`, `runForAllActiveAccounts` |
| Class | `PascalCase` | `CopywritingAgent`, `ContextAssembler`, `WhisperSttWorker` |
| Type / Interface | `PascalCase` | `SpecialistConfig`, `AssembledContext`, `EvolutionInsightContent` |
| Constant | `SCREAMING_SNAKE_CASE` (uppercase) | `EVOLUTION_QUEUE_NAME`, `MAX_TURNS`, `STT_DAILY_LIMIT_DEFAULT`, `MODEL_BY_TIER` |
| Singleton export | `camelCase` (instance) | `evolutionAgent`, `contextAssembler`, `llmGateway`, `methodologyQueryWorker`, `dailyTaskQueue`, `prisma`, `redis` |
| zod schema export | `PascalCaseSchema` | `EvolutionInsightContentSchema`, `DailyTaskOutputSchema` · 或 `camelCase` 输入 schema (`evolutionAgentInput`) |
| Trace ID | `traceId` (camelCase 一律) · 不用 `trace_id` (snake) | `generateSpecialistTraceId(accountId, agentId)` |
| Account ID | `accountId` (camelCase) | — |

### §4.4 SpecialistId (LD-002 · 14 个枚举)

`apps/api/src/agents/base/types.ts:9-14`

```ts
type SpecialistId =
  | 'PositioningAgent' | 'BrandingAgent' | 'MonetizationAgent'
  | 'TopicAgent'       | 'CopywritingAgent' | 'VideoAgent'
  | 'LivestreamAgent'  | 'PrivateDomainAgent' | 'AnalysisAgent'
  | 'DiagnosisAgent'   | 'DeepLearnAgent'
  | 'VoiceChatAgent'   | 'EvolutionAgent' | 'DailyTaskAgent'
```

---

## §5 Where to Add New Code

> **Decision tree:** AGENTS §4.7 5 步判断
> 1. 新 Specialist? → §4.2 5 原则 · 大概率加 mode
> 2. Workflow 还是 Agent? → §4.1 决策树 · 默认 Workflow
> 3. 数据放哪? → §4.3 3 道闸 · 带 accountId
> 4. 调 LLM? → 经 LLMGateway · 必带 trace_id
> 5. 文件放哪? → 本节查表

### §5.1 加新 Specialist mode (推荐)

- 改 `apps/api/src/specialists/{Specialist}Agent.ts` 加 `mode` 分支
- 加 `apps/api/src/services/context-assembler/templates/{mode}.ts` 模板
- 加 `packages/schemas/src/specialist-io/{specialist}.schema.ts` 加 mode 子 schema
- 加 `apps/api/src/trpc/routers/{specialist}.ts` 加 procedure(用 protectedProcedure)
- 镜像 `packages/clients/src/router-types.ts` 加 shadow

### §5.2 加新 Specialist 类(罕见 · ADR 论证)

- 必先开 ADR(参 ADR-003)给"为什么 14 不够"
- 加 `apps/api/src/agents/base/types.ts SpecialistId` 枚举
- 加 `apps/api/src/specialists/{NewAgent}.ts` 继承 BaseSpecialist
- 加 ContextAssembler templates + persona
- 加 LD-002 audit grep 检测放行

### §5.3 加新 tRPC router

- 加 `apps/api/src/trpc/routers/{name}.ts`(用 `protectedProcedure` 默认 · `globalProcedure` 跳 RLS)
- 注册 `apps/api/src/trpc/routers/_app.ts` `appRouter` 合并
- 镜像 `packages/clients/src/router-types.ts` shadow router

### §5.4 加新 Worker

- 加 `apps/api/src/workers/{name}/index.ts` · `queue.ts`(if BullMQ)· `worker.ts`(if BullMQ)
- 如需 LLM SDK · 必走 LLMGateway(R-1) · 或开 D-038 例外 ADR
- 加 `package.json` script `"worker:{name}": "tsx apps/api/src/workers/{name}/worker.ts"`(prod 独立 container 用)

### §5.5 加新 BullMQ Queue

- 加 `apps/api/src/workers/{name}/queue.ts` export const `{name}Queue = new Queue(...)`
- 加 worker.ts 用 `new Worker(QUEUE_NAME, async (job) => ..., { concurrency: 5 })`
- 用 `defaultJobOptions: {attempts:3, backoff: {type:'exponential', delay:5000}}`
- jobId 幂等 · `{queue}-{accountId}-{date}` 等

### §5.6 加新 Cron

- 加 `apps/api/src/cron/{name}-runner.ts` · `node-cron schedule(expr, cb, {scheduled:false, timezone:'Asia/Shanghai'})`
- export const `{name}Cron`
- 注册 `apps/api/src/index.ts` `start()` 内调 `{name}Cron.start()`

### §5.7 加新 Web 页

- 加 `apps/web/src/pages/{group}/{Name}.tsx` (group: step|tools|modules|空)
- 在 `apps/web/src/router.tsx` 加 `React.lazy` + 路由(用 `webpackChunkName: "step|tools|modules"` 共享 chunk)
- 如 step 页 · 加 `step` group · 不加 FeedbackButton(StepLayout 已渲)

### §5.8 加新 Hook

- 加 `apps/web/src/hooks/use{Name}.ts`
- 用 `trpc.{router}.{procedure}.useQuery/useMutation` (`apps/web/src/lib/trpc.ts`)
- 涉 LS · 用 `ls-namespace.ts` `aiip_memory_acc_{id}_{suffix}` 命名

### §5.9 加新 UI 组件

- 共享组件 · 应加 `packages/ui/src/base/` (但 TD-005 当前 14 shadcn 在 `apps/web/src/components/ui/`)
- App-specific · 加 `apps/web/src/components/{Name}.tsx`
- shadcn pull · `apps/web/src/components/ui/{name}.tsx` (kebab-case)
- Storybook(若加)放 `apps/web/src/components/{Name}.stories.tsx`

### §5.10 加新 utility

- 后端 · `apps/api/src/lib/{domain}/{util}.ts` (按 domain 分子目录)
- 前端 · `apps/web/src/lib/{util}.ts`
- 共享 · `packages/schemas/src/...` (若仅 zod)· 否则 P1+ 加 `packages/utils/`

### §5.11 加新 zod schema

- 业务实体 · `packages/schemas/src/entities/{name}.schema.ts`
- Specialist I/O · `packages/schemas/src/specialist-io/{name}.schema.ts`
- admin · `packages/schemas/src/admin/{name}.schema.ts` (P9.0 起)
- 在 `packages/schemas/src/index.ts` barrel export (慎防 tree-shaking issue · 见 SCHEMAS README)

### §5.12 加新 Prisma model

- 改 `prisma/schema.prisma` 加 model + 关系 + @@unique/@@index
- 跑 `pnpm db:migrate:dev --name {name}` 生成迁移
- 跑 `pnpm db:generate` 更新 client
- 如非全局表 · 必加 `accountId Int` + RLS 策略(`prisma/migrations/manual_rls.sql` 加 `ENABLE ROW LEVEL SECURITY` + policy)
- 跑 `prisma db push --skip-generate` 后手工 apply manual_rls.sql

### §5.13 加新测试

- Unit · `tests/unit/api/{feature}.test.ts` (vitest · 调 prisma 用 testcontainers)
- Integration · `tests/integration/api/{feature}.test.ts`
- E2E · `tests/e2e/{feature}.spec.ts` (playwright · 默认 baseURL `http://localhost:5173`)
- LLM Judge · `tests/judge/{specialist}.judge.ts` (用 shared `judgeRunner`)
- Web component · `apps/web/src/{path}/{Component}.test.tsx`

### §5.14 加新 env var

- 加 `.env.example` 占位说明 · `.env` 本地填值(不 commit)
- 后端读 · `process.env.NAME` (启动校验在 `apps/api/src/lib/auth/providers.ts validateStartupConfig`)
- 前端读 · `import.meta.env.VITE_NAME` (Vite 仅 VITE_ 前缀暴露给浏览器)
- ⚠️ R-001 · LLM API key / DATABASE_URL 严禁前端暴露

---

## §6 Special Directories

| Dir | Purpose | Generated | Committed | Notes |
|---|---|:-:|:-:|---|
| `node_modules/` | pnpm 依赖 | Yes | No | gitignored |
| `playwright-report/` | playwright 报告 | Yes | No | CI 产物 |
| `screenshots/` | playwright screenshots | Yes | No | CI 产物 |
| `test-results/` | vitest/playwright xml | Yes | No | CI 产物 |
| `scripts/ralph/verify-artifacts/` | Ralph US-* validator 产物 | Yes | Yes | 留审计追溯 |
| `prisma/migrations/` | Prisma 自动迁移 | Yes | Yes | git tracked |
| `.husky/` | git hook | No(手工 init) | Yes | husky install |
| `apps/admin/src/{pages,components,hooks,styles}/` | admin 占位空目录 | No | Yes | PRD-10+ 填充 |
| `apps/api/src/workers/{trending-scraper,file-parser}/` | 占位空目录 | No | Yes | LD-017 / PRD-9+ |
| `apps/api/src/{audit,notification}/` | 占位空目录 | No | Yes | P3+ |
| `.planning/codebase-stale-*` | 旧 GSD 事实层快照 | Yes(/goal-verify §0) | Yes | 历史追溯 |
| `.agents/retros/` | PRD retros | Yes(/prd-retro) | Yes | 复盘文档 |
| `.agents/rca/` | RCA-* 根因分析 | Yes(人写) | Yes | 项目硬规则派生 |

---

*Structure analysis: 2026-05-11 · PRD-8 完成态 · 14 Specialist 类全到位 · 双路径 L5 + 单路径 VoiceChat · 6 workspace 6 个 active(admin 占位)*
