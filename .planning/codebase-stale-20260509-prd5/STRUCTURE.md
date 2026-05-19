# Codebase Structure · QuanAn

**Analysis Date:** 2026-05-09
**Scope:** PRD-1 → PRD-5 完成期 · 12 stories PRD-5 全 PASSED · 6 workspaces · pnpm + turbo · TS project references
**Inputs:** 实测 `find` + `ls` + `wc -l` + `grep -l` 边界验证

---

## §1 Top-Level Layout

```text
QuanAn/                                  ★ 根 monorepo (Node 20 · pnpm 9.15.9)
├─ apps/
│  ├─ api/                               ★ Hono + tRPC 后端服务 (主开发)
│  ├─ web/                               ★ React + Vite SPA 主应用前端 (主开发)
│  └─ admin/                             ★ admin SPA · P0 占位 (P9.0 起填)
├─ packages/
│  ├─ schemas/                           ★ zod schema 真理来源 (跨 app 共享)
│  ├─ clients/                           ★ tRPC 客户端配置 + AppRouter shadow type
│  └─ ui/                                ★ Aurelian Dark 共享 UI (P0 占位 · TD-005 待 lift)
├─ prisma/                               ★ Prisma schema + migrations (4 + 3 manual SQL)
├─ tests/                                ★ vitest unit/integration + Playwright e2e + LLM judge
├─ scripts/
│  ├─ ralph/                             ★ Ralph daemon 套件 (sync 自全局 ~/.claude/scripts/ralph/)
│  └─ {audit-redlines.sh, seed-reject-examples.sh}
├─ ui/                                   ★ HTML/CSS 设计参考稿 (~70 子目录 · 视觉来源 · 不入 build)
├─ screenshots/                          ★ 截图 + Playwright debug 输出
├─ test-results/                         ★ Playwright 输出
├─ playwright-report/
├─ .planning/
│  ├─ codebase/                          ★ /gsd-map-codebase 输出 (本文档所在)
│  ├─ verifications/                     ★ /goal-verify 输出 (PRD-1~4 各一份)
│  └─ retros/
├─ .agents/
│  ├─ plans/                             ★ /plan-feature 输出
│  ├─ rca/                               ★ RCA-001/002/003 流程加固
│  └─ tech-debt.json                     ★ 15 TD 完整列表
├─ tasks/                                ★ prd-1.md ... prd-5.md (PRD 文档)
├─ node_modules/                         ★ pnpm 工作目录 (gitignore)
├─ .gstack/, apps/web/.gstack/           ★ gstack browser 调试日志 (gitignore)
│
├─ AGENTS.md                             ★ 125K · 18 LD + 17 R + 锁定决策权威 (Ralph + Opus 必读)
├─ ARCHITECTURE.md                       ★ 199K · 9 章战略骨架 (实施期常驻参考)
├─ ADMIN-ARCHITECTURE.md                 ★ 114K · admin 子系统 (P9.0 起填用)
├─ ADR.md                                ★ 82K · 21 ADR 决策追溯
├─ DATA-MODEL.md                         ★ 144K · 主 18 表 + admin 13 表
├─ PROMPTS.md                            ★ 80K · 14 Specialist prompt 权威
├─ PRD-MASTER.md                         ★ 113K · 14 PRD 总纲 + 35 反例
├─ SCAFFOLD.md                           ★ 26K · monorepo 拓扑 + 10 步迁移
├─ DEV-READINESS.md                      ★ 37K · 8 维度就绪度
├─ HANDOFF.md                            ★ 9K · 跨会话交接
├─ CLAUDE.md                             ★ 13K · 项目级 AI 协作约束 (本项目 SOP)
├─ aiipznt-spec.md                       ★ 322K · 复刻基线 (历史)
├─ ARCHITECTURE-REVIEW.md                ★ 77K · 架构审查 (历史)
├─ SCAFFOLD-COMPLETION.md                ★ 10K · 历史
├─ README.md                             ★ 5.7K · 项目概览
│
├─ package.json                          ★ 根 workspace + 35 scripts
├─ pnpm-workspace.yaml                   ★ apps/* + packages/*
├─ pnpm-lock.yaml                        ★ 339K · pnpm 锁
├─ turbo.json                            ★ build/dev/test/lint/typecheck pipelines
├─ tsconfig.base.json                    ★ strict + noUncheckedIndexedAccess + 6 严格子项 + paths
├─ tsconfig.json                         ★ 顶层 references (web/api/admin/schemas/ui/clients)
├─ vitest.config.ts                      ★ root vitest (tests/unit + tests/integration)
├─ vitest.judge.config.ts                ★ LLM judge 独立 config
├─ playwright.config.ts                  ★ E2E test config
├─ .eslintrc.cjs                         ★ ESLint 8 + typescript-eslint + import order
├─ .prettierrc                           ★ Prettier 3 + tailwindcss plugin
├─ .nvmrc                                ★ "20"
├─ .env, .env.example                    ★ env (gitignore .env · .env.example 模板)
├─ .gitignore                            ★ node_modules/dist/.next/.env*/coverage/...
├─ .gitattributes                        ★ LF · binary 标注
├─ .npmrc                                ★ pnpm hoist 配置
├─ .husky/                               ★ pre-commit hook (lint-staged)
└─ stitch_premium_gold_ip_workflow.zip   ★ 24M · 视觉素材包 (gitignore? · 实际未 ignore)
```

---

## §2 Workspace Map

### §2.1 `apps/api` · 后端 API 服务 (`@quanan/api`)

**Type:** Node.js Hono 4 + tRPC v11 backend service
**Entry:** `apps/api/src/index.ts` (port 3000 · `tsx watch src/index.ts` for dev)
**LOC:** ~5800 across `apps/api/src/`
**Purpose:** HTTP API 入口 · tRPC 路由 · Specialist 编排 · LLM 调用 · DB 持久化

```text
apps/api/
├─ package.json                          @quanan/api · scripts {dev, start, build, typecheck, lint}
├─ tsconfig.json                         extends ../../tsconfig.base.json
├─ src/
│  ├─ index.ts                           ★ Hono app · CORS · trace mw · OAuth /auth/* · /trpc/*
│  ├─ trpc/
│  │  ├─ trpc.ts                         initTRPC + traceMiddleware · publicProcedure
│  │  ├─ context.ts                      createContext (lucia → user · activeAccountId)
│  │  ├─ middleware/
│  │  │  ├─ account-isolation.ts         ★ protectedProcedure + globalProcedure (RLS via $tx + SET LOCAL ROLE)
│  │  │  └─ trace.ts                     trace mw (alt impl 18 行)
│  │  └─ routers/
│  │     ├─ _app.ts                      18 sub-router 合并 → AppRouter type 导出
│  │     ├─ auth.ts                      auth.me (publicProcedure)
│  │     ├─ ipAccounts.ts                list/active/create/update/delete/switchActive
│  │     ├─ stepData.ts                  ★ 439 行 · get/getAll/save/saveStream(SSE)/progress
│  │     ├─ copywriting.ts               generate/optimize/list/delete/freeGenerate
│  │     ├─ boomGenerate.ts              generate (boom 5 candidates)
│  │     ├─ analysis.ts                  analyze (structural)
│  │     ├─ videoAnalysis.ts             analyze (viral)
│  │     ├─ history.ts                   list/detail/delete (PRD-5 US-011)
│  │     ├─ evolution.ts                 getProfile/evolve/history/feedbackTrend/...
│  │     ├─ diagnosis.ts                 latest
│  │     ├─ knowledge.ts                 getRecommendations/getFavorites/notes
│  │     ├─ trending.ts                  fetch/listByIndustry/listByStyle (globalProcedure)
│  │     ├─ invite.ts                    redeem (globalProcedure)
│  │     ├─ costLog.ts                   logFeedback
│  │     └─ {monetization, privateDomain, deepLearning, videoProduction}.ts
│  ├─ specialists/                       ★ 8 / 14 Specialist 实现 (active)
│  │  ├─ base/
│  │  │  ├─ BaseSpecialist.ts            ★ 254 行 · 模板方法 + fallback path
│  │  │  ├─ types.ts                     SpecialistConfig 五层 + Request/Response/InvokeLLMResult
│  │  │  └─ errors.ts                    SchemaValidationError + LLMTimeoutError
│  │  ├─ PositioningAgent.ts             197 行 · industry + execution
│  │  ├─ BrandingAgent.ts                279 行 · step3 + step3b
│  │  ├─ MonetizationAgent.ts            213 行 · step4b
│  │  ├─ TopicAgent.ts                   306 行 · step5 SSE 5 categories
│  │  ├─ VideoAgent.ts                   265 行 · step6
│  │  ├─ CopywritingAgent.ts             ★ 530 行 · step7+free+boom (acquisition→PRD-6)
│  │  ├─ LivestreamAgent.ts              162 行 · step8
│  │  └─ AnalysisAgent.ts                358 行 · viral + structural (PRD-5 US-002)
│  ├─ agents/                            ★ DRIFT TD-NEW-3 · 历史目录待清理
│  │  ├─ base/
│  │  │  ├─ BaseSpecialist.ts            71 行 · 老 run() 模板 · 0 业务引用 (dead)
│  │  │  ├─ types.ts                     ★ 仍在用 · SpecialistId / ModelTier / generateSpecialistTraceId
│  │  │  └─ IPProgressService.ts         ★ DRIFT · dead · 仅 unit test 引
│  │  └─ specialists/
│  │     └─ CopywritingAgent.ts          168 行 · PRD-2 老示例 · 0 业务引用 (dead)
│  ├─ services/
│  │  ├─ context-assembler/
│  │  │  ├─ ContextAssembler.ts          ★ 177 行 · 4 路 Promise.allSettled + 5s timeout
│  │  │  ├─ types.ts                     AssembleRequest / AssembledContext
│  │  │  └─ templates/
│  │  │     ├─ index.ts                  SPECIALIST_TEMPLATES (8 keys)
│  │  │     ├─ positioning.ts            persona + methodology
│  │  │     ├─ branding.ts
│  │  │     ├─ monetization.ts
│  │  │     ├─ topic.ts
│  │  │     ├─ video.ts
│  │  │     ├─ copywriting.ts
│  │  │     ├─ livestream.ts
│  │  │     └─ analysis.ts
│  │  └─ ip-progress/
│  │     └─ IPProgressService.ts         ★ active · getProgress(prisma, accountId) · stepData router 用
│  ├─ workers/                           ★ 仅 llm-gateway + methodology-query active
│  │  ├─ llm-gateway/
│  │  │  ├─ index.ts                     ★ 256 行 · LLMGateway · MODEL_BY_TIER · primary→fallback→template
│  │  │  ├─ anthropic-provider.ts        buildPayload + parseResponse + isAnthropicModel
│  │  │  ├─ openai-provider.ts           buildPayload + parseResponse
│  │  │  ├─ rate-limiter.ts              Upstash · token bucket 50/500/5000/d · pass-through if no Upstash env
│  │  │  └─ cost-logger.ts               writeCostLog · estimateCostUsd · provider 分发
│  │  ├─ methodology-query/
│  │  │  └─ index.ts                     in-memory 常量(industries/hotElements/scriptTypes)
│  │  ├─ file-parser/.gitkeep            ★ 占位 (PRD-9 用)
│  │  ├─ image-gen/.gitkeep              ★ 占位 (PRD-7 用)
│  │  ├─ stt/.gitkeep                    ★ 占位 (PRD-7 VoiceChat 用)
│  │  ├─ tts/.gitkeep                    ★ 占位 (PRD-7 VoiceChat 用)
│  │  └─ trending-scraper/.gitkeep       ★ 占位 (PRD-5 trending 用)
│  ├─ lib/
│  │  ├─ prisma.ts                       PrismaClient 单例 + globalThis.__prisma + checkDbConnection
│  │  ├─ logger.ts                       pino + AsyncLocalStorage traceStore mixin
│  │  ├─ auth/
│  │  │  ├─ lucia.ts                     Lucia v3 · cookie name 'app_session' (LD-A-1)
│  │  │  ├─ adapter.ts                   prismaAdapter
│  │  │  └─ providers.ts                 MockProvider + GoogleProvider · validateStartupConfig
│  │  ├─ compliance/
│  │  │  ├─ pii-mask.ts                  ★ 30 行 · 5 PII 模式 (email/phone/idcard/bankcard) · ⚠️ 0 接线
│  │  │  └─ disclaimer.ts                ★ 30 行 · medical/legal/finance · ⚠️ 0 接线
│  │  └─ constants/
│  │     ├─ index.ts                     barrel
│  │     ├─ industries.ts                isSensitiveIndustry · INDUSTRY_KEYS
│  │     ├─ hotElements.ts               22 元素 4 组分类
│  │     ├─ scriptTypes.ts               20 脚本类型
│  │     ├─ presentStyles.ts             呈现样式
│  │     ├─ platforms.ts                 platform enum
│  │     ├─ steps.ts                     STEPS · 9 step 元数据
│  │     ├─ evolution.ts                 evolution levels
│  │     ├─ diagnosis.ts                 5 维度
│  │     └─ privateDomain.ts             私域常量
│  ├─ audit/.gitkeep                     ★ 占位 (admin 用 · P9.0)
│  ├─ cron/.gitkeep                      ★ 占位
│  ├─ memory/.gitkeep                    ★ 占位
│  ├─ notification/.gitkeep              ★ 占位
│  └─ apps/api/                          ★ DRIFT 异常 · 嵌套空骨架(`apps/api/apps/api/src/trpc/routers/`)
│                                        可能历史误建 · 待清理 · 0 业务影响
├─ apps/                                 ★ 与上面同 · 与 src/apps/api/ 重叠 (DRIFT)
└─ node_modules/                         pnpm 工作目录
```

**Edges (依赖):**
- 入: `apps/web` (HTTP/cookies) · `tests/integration/api/*` · `tests/unit/api/*`
- 出: PG (`postgresql://return@localhost:5432/quanan`) · Redis (Upstash optional) · Anthropic API · OpenAI API
- 包: `@quanan/schemas` (workspace:*)

### §2.2 `apps/web` · 主应用前端 (`@quanan/web`)

**Type:** React 18.3 + Vite 5 SPA
**Entry:** `apps/web/src/main.tsx` (port 5173 · `vite` for dev)
**LOC:** ~9000 across `apps/web/src/`
**Purpose:** 用户主界面 · 9 step IP 流程 · 14 工具页 · 6 模块页

```text
apps/web/
├─ package.json                          @quanan/web · 38 deps + 17 devDeps
├─ tsconfig.json                         extends base + paths {@quanan/{schemas,ui,clients}}
├─ vite.config.ts                        plugins:[react()] · alias · proxy /api/trpc → :3000 · manualChunks
├─ vitest.config.ts                      jsdom · setup tests/setup.ts
├─ tailwind.config.js                    Aurelian Dark token derived (LD-015)
├─ postcss.config.js
├─ index.html                            <div id="root">
├─ public/
│  └─ icons/                             SVG icons
├─ dist/                                 ★ build output (gitignore)
├─ src/
│  ├─ main.tsx                           ★ createRoot + StrictMode + trpc.Provider + RouterProvider
│  ├─ App.tsx                            14 行 · header + main shell (legacy · main.tsx 用 router 直接)
│  ├─ router.tsx                         ★ 122 行 · createBrowserRouter · 34 routes · React.lazy + chunkName
│  ├─ vite-env.d.ts
│  ├─ pages/
│  │  ├─ step/
│  │  │  ├─ Step1.tsx                    行业选择
│  │  │  ├─ Step2.tsx                    受众研究 (原版 404 · spec §XVII 不计入 9 步)
│  │  │  ├─ Step3.tsx                    账号包装
│  │  │  ├─ Step3b.tsx                   人设定制
│  │  │  ├─ Step4.tsx                    执行计划
│  │  │  ├─ Step4b.tsx                   变现路径
│  │  │  ├─ Step5.tsx                    爆款选题 (SSE)
│  │  │  ├─ Step6.tsx                    拍摄计划
│  │  │  ├─ Step7.tsx                    文案生成 (SSE)
│  │  │  ├─ Step8.tsx                    直播策划
│  │  │  └─ Step9.tsx                    商业化
│  │  ├─ tools/
│  │  │  ├─ index.ts                     barrel (15 export)
│  │  │  ├─ Trending.tsx                 热点榜单
│  │  │  ├─ Copywriting.tsx              爆款文案 (P3 占位 · PRD-4 实施)
│  │  │  ├─ Generate.tsx                 自由生成 (PRD-5 US-003)
│  │  │  ├─ BoomGenerate.tsx             5 篇炸场 (PRD-5 US-005)
│  │  │  ├─ Analysis.tsx                 文案分析 structural (PRD-5 US-007)
│  │  │  ├─ VideoAnalysis.tsx            爆款拆解 viral (PRD-5 US-009)
│  │  │  ├─ Monetization.tsx             变现规划
│  │  │  ├─ PrivateDomain.tsx            私域设计
│  │  │  ├─ PresentStyles.tsx            呈现样式
│  │  │  ├─ VideoProduction.tsx          视频生成 (P3 占位)
│  │  │  ├─ AcquisitionVideo.tsx         获客视频 (P3 占位)
│  │  │  ├─ AiVideo.tsx                  AI 视频 (P3 占位)
│  │  │  ├─ VoiceChat.tsx                语音教练 (P3 占位)
│  │  │  ├─ DeepLearning.tsx             深度学习
│  │  │  └─ Knowledge.tsx                知识库
│  │  ├─ modules/
│  │  │  ├─ Diagnosis.tsx                诊断报告
│  │  │  ├─ DailyTasks.tsx               每日任务
│  │  │  ├─ Evolution.tsx                进化档案
│  │  │  ├─ Accounts.tsx                 账号管理
│  │  │  ├─ MyTopics.tsx                 我的选题
│  │  │  └─ History.tsx                  ★ 历史 (PRD-5 US-011 · 真表格)
│  │  ├─ IpPlan.tsx                      IP 总览
│  │  ├─ Settings.tsx                    设置
│  │  ├─ Login.tsx                       登录页
│  │  └─ NotFound.tsx                    404
│  ├─ components/
│  │  ├─ Header.tsx                      ★ 顶部 nav + AccountDropdown (TD-007 + TD-011)
│  │  ├─ ErrorBoundary.tsx
│  │  ├─ FeedbackButton.tsx              ★ 全 step 通用 · costLog.logFeedback
│  │  ├─ StepProgress.tsx                ★ 9 步进度条 · STEP_ORDER 9 keys
│  │  ├─ StepProgress.test.tsx
│  │  ├─ StepForm/
│  │  │  ├─ StepForm.tsx                 通用 step form
│  │  │  ├─ TextareaField.tsx
│  │  │  ├─ CategorySelect.tsx
│  │  │  ├─ IndustrySelect.tsx
│  │  │  └─ PlatformSelect.tsx
│  │  ├─ StepResult/
│  │  │  ├─ index.ts                     barrel
│  │  │  ├─ StepResult.tsx               distributor by stepKey
│  │  │  ├─ Step1Result.tsx              ... Step8Result.tsx (含 3b/4b)
│  │  │  └─ FallbackBanner.tsx
│  │  ├─ ToolForm/
│  │  │  ├─ ToolForm.tsx                 通用 tool form (PRD-4)
│  │  │  ├─ ScriptTypeSelect.tsx
│  │  │  └─ ElementsMultiSelect.tsx
│  │  ├─ ToolResult/
│  │  │  ├─ ToolResult.tsx               distributor
│  │  │  ├─ FreeGenerateResult.tsx
│  │  │  ├─ BoomGenerateResult.tsx
│  │  │  ├─ AnalysisResult.tsx
│  │  │  └─ VideoAnalysisResult.tsx
│  │  └─ ui/                             ★ 12 shadcn 组件 (TD-005 · 应在 packages/ui/src/base/)
│  │     ├─ avatar.tsx, button.tsx, card.tsx, dialog.tsx, dropdown-menu.tsx,
│  │     ├─ input.tsx, progress.tsx, scroll-area.tsx, select.tsx, separator.tsx,
│  │     ├─ sheet.tsx, tabs.tsx, toast.tsx, tooltip.tsx
│  ├─ hooks/
│  │  ├─ useAuth.ts                      cookie + auth.me poll
│  │  ├─ useActiveAccount.ts             ipAccounts.active
│  │  ├─ useStepData.ts                  stepData.get + LS sync (LD-010)
│  │  └─ useEvolution.ts                 evolution.getProfile
│  ├─ layouts/
│  │  ├─ RootLayout.tsx                  Header + Outlet + ErrorBoundary
│  │  └─ StepLayout.tsx                  step 系列共享 layout (FeedbackButton 注入)
│  ├─ lib/
│  │  ├─ trpc.ts                         createTRPCReact + httpBatchStreamLink + X-Trace-Id 注入
│  │  ├─ utils.ts                        cn() · clsx + tailwind-merge
│  │  ├─ ls-namespace.ts                 LD-010 · aiip_memory_acc_{id}_{suffix} · 5MB cap
│  │  ├─ stepConfig.ts                   9 step (含 step2 · 元数据)
│  │  ├─ parseDesignTokens.js            DESIGN.md YAML → tailwind tokens (LD-015)
│  │  └─ constants/
│  │     └─ hotElementsZh.ts             22 元素中文 label
│  ├─ styles/
│  │  └─ globals.css                     Tailwind base + Aurelian Dark vars
│  └─ test/
│     ├─ setup.ts                        @testing-library/jest-dom + jsdom
│     ├─ feedback-button.test.tsx
│     ├─ pages.test.tsx
│     └─ step-progress.test.tsx
└─ .gstack/                              ★ gstack browser debug log (gitignore)
```

**Edges:**
- 入: 浏览器(用户)
- 出: `apps/api`(/trpc + /auth · cookies)
- 包: `@quanan/schemas` · `@quanan/clients` · `@quanan/ui`(占位)
- ✅ R-A1 验证: `grep import.*admin apps/web/src/ -r` → 0 命中
- ✅ R-1 验证: `grep '@anthropic-ai/sdk\|from openai' apps/web/src/ -r` → 0 命中

### §2.3 `apps/admin` · admin SPA (P0 占位 · `@quanan/admin`)

**Type:** Vite SPA (P9.0 起填)
**Entry:** `apps/admin/src/index.ts`(12 行 stub)
**LOC:** ~12 行
**Purpose:** 内容审核 + 账号 + 套餐 + 数据看板(ADR-021 独立部署 · admin.quanan.com 子域名)

```text
apps/admin/
├─ package.json                          @quanan/admin · scripts {dev,build} 全 echo 占位
├─ src/
│  ├─ index.ts                           12 行 README 注释
│  ├─ pages/.gitkeep                     占位
│  ├─ components/.gitkeep                占位
│  ├─ hooks/.gitkeep                     占位
│  └─ styles/.gitkeep                    占位
└─ README.md                             P9.0 启动清单
```

**Edges:**
- 入: 主应用 P8 完成后启动 · admin 用户(super_admin role)
- 出: `apps/api/admin/*` (子 router · 待 PRD-10 起建立)
- 边界: ★ R-A1 严格 · admin 子系统不能 import 主应用业务代码 · 反之亦然

### §2.4 `packages/schemas` · zod 真理来源 (`@quanan/schemas`)

**Type:** zod schema package(无 build · `main = ./src/index.ts`)
**Entry:** `packages/schemas/src/index.ts`(主 barrel · entities/* + stepData)
**LOC:** ~1300

```text
packages/schemas/
├─ package.json                          exports {., ./entities, ./step-results, ./specialist-io, ./admin}
├─ src/
│  ├─ index.ts                           主 barrel · 占位 · entities 部分
│  ├─ entities/
│  │  ├─ index.ts                        barrel
│  │  ├─ ipAccount.schema.ts
│  │  ├─ stepData.schema.ts
│  │  ├─ knowledge.schema.ts
│  │  ├─ trending.schema.ts
│  │  └─ invite.schema.ts
│  ├─ step-results/                      ★ 占位 · 待 PRD-X 实施
│  ├─ specialist-io/
│  │  ├─ index.ts                        barrel · 11 schema export
│  │  ├─ constants.ts                    HOT_ELEMENT_KEYS_22 · SCRIPT_TYPE_KEYS_20 · SCRIPT_TYPE_LABELS · 中文映射
│  │  ├─ analysis.schema.ts              viral + structural in/out
│  │  ├─ copywriting.schema.ts           step7/free schemas
│  │  ├─ boomGenerate.schema.ts          5 candidates schema
│  │  ├─ videoAnalysis.schema.ts         analyzeVideoInput
│  │  ├─ videoProduction.schema.ts       (PRD-6+)
│  │  ├─ monetization.schema.ts          step4b
│  │  ├─ privateDomain.schema.ts
│  │  ├─ diagnosis.schema.ts
│  │  ├─ evolution.schema.ts
│  │  ├─ deepLearning.schema.ts
│  │  └─ step-inputs.schema.ts           Step{1,3,3b,4,4b,5,6,7,8}InputSchema
│  └─ admin/                             ★ 占位 · P9.0 起填
└─ tsconfig.json
```

**Edges:**
- 入: `apps/api`(import canonical · 含 router 内 inline 副本 · 注释标注)· `apps/web`(form validation)· `packages/clients`
- 出: 0 (纯 schema)

### §2.5 `packages/clients` · tRPC 类型导出 (`@quanan/clients`)

**Type:** TS package(`main = ./src/index.ts`)
**Entry:** `packages/clients/src/index.ts`(占位)+ `router-types.ts`(shadow router)

```text
packages/clients/
├─ package.json                          exports {., ./router-types}
├─ src/
│  ├─ index.ts                           ★ 5 行 stub (P1 重构 · 共享 client factory)
│  └─ router-types.ts                    ★ 343 行 · shadow router · `export type AppRouter = typeof _shadowRouter`
└─ tsconfig.json
```

**Edges:**
- 入: `apps/web/src/lib/trpc.ts`(`import type { AppRouter } from '@quanan/clients/router-types'`)
- 出: 仅 type · 运行时 0 (Vite tree-shake)
- TD: P1 改 TypeScript project references(`router-types.ts:8` 注释)

### §2.6 `packages/ui` · Aurelian Dark 共享 UI (`@quanan/ui`)

**Type:** TS package(P0 占位)
**Entry:** `packages/ui/src/index.ts`

```text
packages/ui/
├─ package.json                          deps {react, lucide-react, class-variance-authority, clsx, tailwind-merge}
├─ src/
│  ├─ index.ts                           占位
│  ├─ base/
│  │  └─ index.ts                        占位 (★ TD-005 · 12 shadcn 组件应在此处 · 实际在 apps/web/src/components/ui/)
│  └─ admin/
│     └─ index.ts                        占位 (P9.0 起填)
└─ tsconfig.json
```

**Edges:**
- 入: 待 P9.0 admin 启动 · `apps/web` 占位 import (但实际未用 · 走 `@/components/ui/...`)
- 出: 0
- ★ DRIFT: TD-005 · admin 启动前必 lift `apps/web/src/components/ui/* → packages/ui/src/base/*`

---

## §3 Cross-Workspace Boundaries(实测验证)

### §3.1 R-A1 · web ⊥ admin(主应用 ⊥ admin 子系统)

```bash
# 验证 1 · web 不引 admin
grep -rl "import.*admin" apps/web/src 2>/dev/null
# 期望: 0 命中
# 实测: 0 命中 ✅

# 验证 2 · web 不引 @quanan/admin
grep -rl "@quanan/admin" apps/web/src 2>/dev/null
# 期望: 0 命中 (apps/admin · NOT @quanan/admin module)
# 实测: 0 命中 ✅
```

**结论:** R-A1 ✅ holds(在 P0 占位阶段 · admin 启动后需复测)

### §3.2 R-1 · LLM SDK 仅 LLMGateway 引用

```bash
grep -rln "@anthropic-ai/sdk\|from 'openai'" apps packages tests --include="*.ts" --include="*.tsx" 2>/dev/null
# 期望: 仅 apps/api/src/workers/llm-gateway/index.ts:13-21
# 实测: 仅 apps/api/src/workers/llm-gateway/index.ts ✅
```

### §3.3 R-009 · prisma.$executeRaw 仅 1 处

```bash
grep -rn "prisma.\$executeRaw\|tx.\$executeRaw" apps/api/src --include="*.ts" 2>/dev/null
# 期望: 仅 apps/api/src/trpc/middleware/account-isolation.ts:38-41
# 实测: 仅 account-isolation.ts:38-41 (3 处) ✅
```

### §3.4 R-LD012 · Specialist 不直接调 LLM

```bash
grep -rln "import.*'@anthropic-ai\|import.*'openai\|new Anthropic\|new OpenAI" apps/api/src/specialists 2>/dev/null
# 期望: 0 命中
# 实测: 0 命中 ✅
```

### §3.5 packages → apps 反向依赖禁止

```bash
grep -rn "from '@quanan/api'\|from '../../apps" packages/ 2>/dev/null
# 期望: 0 命中
# 实测: 0 命中 ✅
```

### §3.6 admin / web 共享 UI 边界(待 P9.0 验)

- 当前: web 自包含 `apps/web/src/components/ui/*` (12 shadcn) · admin 还未起
- 目标: 12 组件 lift 到 `packages/ui/src/base/*` · web + admin 都 import `@quanan/ui/base`(TD-005 · scheduled P9.0)

---

## §4 Special Directories

### §4.1 `tests/`

```text
tests/
├─ setup.ts                              vitest setup · @testing-library/jest-dom
├─ unit/                                 38 specs · vitest unit (mock + sqlite memory)
│  ├─ agents/
│  │  └─ base.test.ts
│  ├─ api/
│  │  ├─ account-isolation.test.ts
│  │  ├─ account-step-auth.test.ts
│  │  ├─ analysis-router.test.ts
│  │  ├─ boom-generate-router.test.ts
│  │  ├─ copywriting-router.test.ts
│  │  ├─ feedback-log.test.ts
│  │  ├─ history-router.test.ts
│  │  ├─ invite.test.ts
│  │  ├─ ip-progress.test.ts             ⚠️ 仅此 1 处引 agents/base/IPProgressService (legacy)
│  │  ├─ ipAccounts-stepData.test.ts
│  │  ├─ knowledge.test.ts
│  │  ├─ llm-gateway-fallback.test.ts
│  │  ├─ llm-gateway-rate.test.ts
│  │  ├─ specialists-creation.test.ts
│  │  ├─ specialists-flow.test.ts
│  │  ├─ trending.test.ts
│  │  └─ video-analysis-router.test.ts
│  ├─ auth/
│  │  └─ providers.test.ts
│  ├─ schemas/
│  │  └─ specialist-io.test.ts
│  ├─ services/
│  │  └─ context-assembler.test.ts
│  ├─ specialists/
│  │  ├─ base.test.ts
│  │  ├─ base.llm.test.ts
│  │  ├─ fallback.test.ts
│  │  └─ __tests__/
│  │     ├─ AnalysisAgent.test.ts
│  │     ├─ BrandingAgent.test.ts
│  │     ├─ CopywritingAgent.test.ts
│  │     ├─ LivestreamAgent.test.ts
│  │     ├─ MonetizationAgent.test.ts
│  │     ├─ PositioningAgent.test.ts
│  │     ├─ TopicAgent.test.ts
│  │     └─ VideoAgent.test.ts
│  ├─ web/
│  │  ├─ hooks.test.ts
│  │  ├─ ls-namespace.test.ts
│  │  ├─ router.test.ts
│  │  └─ step-config.test.ts
│  └─ parseDesignTokens.test.ts
├─ integration/
│  └─ api/                               真 PG + nock LLM mock
│     ├─ analysis-structural-llm.test.ts
│     ├─ auth.me.test.ts, auth.test.ts
│     ├─ boom-generate-llm.test.ts
│     ├─ copywriting-free-llm.test.ts
│     ├─ ip-progress-integration.test.ts
│     ├─ llm-gateway-real.test.ts        真 LLM 调用 · 不在 vitest 主套件
│     ├─ rls-isolation.test.ts           ★ RLS 双账号 0 跨读验证
│     ├─ specialist-llm.test.ts
│     ├─ trace.test.ts                   X-Trace-Id 端到端
│     └─ video-analysis-viral-llm.test.ts
├─ e2e/                                  Playwright · 19 specs · 真浏览器
│  ├─ account-isolation.spec.ts, account-switch.spec.ts
│  ├─ debug-network.spec.ts
│  ├─ fallback.spec.ts
│  ├─ feedback-button.spec.ts, feedback-log.spec.ts
│  ├─ header.spec.ts
│  ├─ history-flow.spec.ts
│  ├─ ip-flow-9-steps.spec.ts            ★ 9 步全流程
│  ├─ ip-flow-account-isolation.spec.ts
│  ├─ ip-plan.spec.ts
│  ├─ ls-db-sync.spec.ts                 LD-010 双写
│  ├─ routes-34.spec.ts                  ★ 34 路由全部可达
│  ├─ tool-{analysis, boom-generate, generate, video-analysis}.spec.ts
│  └─ tools-integration.spec.ts
├─ judge/                                LLM Judge 11 specs (vitest.judge.config.ts)
│  ├─ judge-runner.ts                    PASS_SCORE_THRESHOLD = 6 (10 分制)
│  ├─ analysis-{structural,viral}.judge.ts
│  ├─ branding.judge.ts
│  ├─ copywriting-{boom,free}.judge.ts, copywriting.judge.ts
│  ├─ livestream.judge.ts, monetization.judge.ts
│  ├─ positioning.judge.ts, topic.judge.ts
└─ llm-judge/                            legacy runner (待整合)
   └─ runner.ts
```

**Generated:** No
**Committed:** Yes
**约定:**
- unit · co-located NOT used · 集中在 `tests/unit/` 镜像 source
- integration · 真 PG (testcontainers) + nock mocks
- e2e · Playwright · `playwright.config.ts:14-17` baseURL `http://localhost:5173`

### §4.2 `prisma/`

```text
prisma/
├─ schema.prisma                         39 models · 主 18 + admin 13 + global 4 + P2 4
├─ seed.ts                               db:seed
└─ migrations/
   ├─ migration_lock.toml                provider = postgresql
   ├─ 20260507000000_init/migration.sql  ★ 1245 行 · 38 表 baseline (TD-004 越界但 accepted)
   ├─ 20260507154814_add_sessions/migration.sql
   ├─ 20260509000000_add_cost_log_target/migration.sql
   ├─ 20260509120000_add_feedback_log_fields/migration.sql
   ├─ manual_rls.sql                     ★ 必须手动跑 · 15 ENABLE RLS + 12 policies
   ├─ manual_admin_rls.sql               admin 13 表 RLS DISABLE 显式
   └─ manual_vector_indexes.sql          pgvector ivfflat/hnsw (P5+ 用)
```

**Generated:** No (`schema.prisma` 写 + `prisma migrate dev` 生成 migration · client 在 node_modules/.prisma/client 是 generated)
**Committed:** Yes (schema + migrations · 不含 generated client)
**注意:** `manual_rls.sql:5` 注释明确"必须在 prisma migrate 之后手动应用"· CI/CD 漏跑会丢屏障

### §4.3 `scripts/`

```text
scripts/
├─ audit-redlines.sh                     ★ 17 红线 grep · 但 monorepo 改造后路径过期 (TD-NEW-2)
├─ audit-ld.sh                           ★ 不存在 (TD-NEW-4 · package.json:24 引用但缺文件)
├─ audit-all.sh                          ★ 不存在
├─ seed-reject-examples.sh               跨 PRD 反例库 seed (35 条)
└─ ralph/                                ★ Ralph daemon 套件 (sync 自全局 ~/.claude/scripts/ralph/)
   ├─ ralph.py                           ~1400 行 · 主 daemon
   ├─ ralph-tools.py                     CLI · approve/reject/audit-status/check-risk
   ├─ watch-audit-gate.py                系统通知(macOS osascript / Linux notify-send / Windows beep)
   ├─ audit-artifacts.py                 产物校验
   ├─ dashboard.py + dashboard.html      进度监控 (Python 3.10+ syntax)
   ├─ dashboard-p.html                   像素风
   ├─ CLAUDE.md, VALIDATOR.md            Agent 指令
   ├─ AUDIT-CHECKLIST-TEMPLATE.md        Opus § 0 / § Z
   ├─ OPUS-AUDIT-CHEATSHEET.md           Opus 5 步 cheat sheet
   ├─ REJECT-TEMPLATE.md                 reject feedback 标准模板
   ├─ TECH-DEBT-SCHEMA.md                tech-debt.json 规范
   ├─ prd.json                           运行时副本
   ├─ prd-1.json ... prd-5.json          5 PRD 稳定源
   ├─ prd-{1,2,3,4,5}.start.json         首次启动备份
   ├─ unknown.done.json
   ├─ progress.txt                       自动追加执行记录
   ├─ ralph-output.log                   Monitor tail 用
   ├─ cost-log.jsonl                     成本追踪
   ├─ prd.json.bak.before-rca002         RCA 备份
   ├─ verify-artifacts/                  Validator 产物
   ├─ agent-logs/                        每 iter 完整 stdout
   ├─ backups/                           prd.json 备份
   └─ __pycache__/                       Python cache (gitignore)
```

**Generated:**
- `prd.json`(每次运行)· `audit-gate.json`(运行时)· `ralph-lock.json`(进程锁)· `cost-log.jsonl` · `agent-logs/*` · `backups/*`
**Committed:** scripts(.py/.md/.json templates)· prd-{1-5}.json · 不含 audit-gate/lock/output.log

### §4.4 `.planning/`

```text
.planning/
├─ codebase/                             ★ /gsd-map-codebase 输出 (本文档)
│  ├─ ARCHITECTURE.md                    ★ 当前生成
│  ├─ STRUCTURE.md                       ★ 当前生成
│  ├─ STACK.md                           PRD-1 期生成
│  ├─ INTEGRATIONS.md                    PRD-1 期生成
│  ├─ CONCERNS.md                        ★ 当前 Opus 写入 · 6 屏障 + 15 TD + 5 隐性 TD
│  └─ PRD-1-FACTS.md                     PRD-1 retro 输入
├─ verifications/                        /goal-verify 输出
│  ├─ PRD-1-VERIFICATION.md
│  ├─ PRD-2-VERIFICATION.md
│  ├─ PRD-3-VERIFICATION.md
│  └─ PRD-4-VERIFICATION.md
└─ retros/                               /prd-retro 输出
```

**Generated:** Yes (by GSD Coding 3.0 commands)
**Committed:** Yes
**Lifecycle:** 每 PRD 结束更 verifications/ + 复盘后更 retros/ + critical 时更 codebase/

### §4.5 `.agents/`

```text
.agents/
├─ tech-debt.json                        ★ 15 TD · TECH-DEBT-SCHEMA.md 规范
├─ rca/                                  ★ RCA 流程加固
│  ├─ RCA-001-audit-delay.md             US-001 · 31 min 空窗
│  ├─ RCA-002-developer-timeout.md       US-005 · 90 min 0 输出
│  └─ RCA-003-us012-econnreset.md        US-012 · 73 min 5 retry
└─ plans/                                /plan-feature 输出
```

**Generated:** No (Opus + 用户协作产出)
**Committed:** Yes

### §4.6 `tasks/`

```text
tasks/
├─ prd-1.md ... prd-5.md                 ★ 5 PRD 文档(prd skill 输出)
├─ plans/                                ★ /plan-feature 深度规划
└─ ...
```

**Lifecycle:** prd skill 写 → ralph skill 转 prd.json → 运行 → /goal-verify → /prd-retro

### §4.7 `ui/` · 视觉设计参考

```text
ui/
├─ aurelian_dark/                        ★ DESIGN.md (token 派生源 · LD-015)
├─ aip_*/                                aiipznt 复刻 HTML 参考稿
├─ step_*/                               9 step UI 设计稿
├─ ip_*/, market_intelligence_hub/, ...
└─ ...                                   ~70 子目录 · 全 HTML/CSS · 不入 build
```

**Generated:** No
**Committed:** Yes
**Build impact:** 0 · 仅作为视觉参考 · `apps/web/src/lib/parseDesignTokens.js` 解 `aurelian_dark/DESIGN.md` YAML

### §4.8 其他根目录

| 目录 | Purpose | Generated | Committed |
|---|---|:-:|:-:|
| `node_modules/` | pnpm 依赖 | ✅ | ❌ |
| `.gstack/`, `apps/web/.gstack/` | gstack browser 调试日志 | ✅ | ❌ |
| `playwright-report/`, `test-results/` | Playwright 输出 | ✅ | ❌ |
| `screenshots/` | 调试截图(43 png) | 部分 | ⚠️ 部分 |
| `.husky/` | git hook | 配 | ✅ |
| `.git/` | git | ✅ | ❌ |

---

## §5 Naming Conventions

### §5.1 Files

| 类型 | 模式 | 例子 |
|---|---|---|
| Specialist 类 | `PascalCase + Agent.ts` | `CopywritingAgent.ts` · `AnalysisAgent.ts` |
| tRPC router | `camelCase + .ts`(动词或域名)| `boomGenerate.ts` · `videoAnalysis.ts` · `costLog.ts` |
| Service / Worker | `camelCase + .ts` 或 `PascalCase + .ts`(类)| `IPProgressService.ts` · `methodology-query/index.ts` |
| zod schema | `camelCase + .schema.ts` | `analysis.schema.ts` · `step-inputs.schema.ts` |
| React page | `PascalCase + .tsx` | `Step1.tsx` · `BoomGenerate.tsx` |
| React component | `PascalCase + .tsx` | `StepProgress.tsx` · `FeedbackButton.tsx` |
| Hook | `camelCase use*.ts` | `useAuth.ts` · `useStepData.ts` |
| Utility | `camelCase + .ts` | `ls-namespace.ts` · `parseDesignTokens.js` |
| Config / lib singleton | `camelCase + .ts` 小驼峰 | `prisma.ts` · `logger.ts` · `lucia.ts` |
| Test | 与被测同名 + `.test.ts` 或 `.spec.ts` | `BoomGenerate.test.ts`(unit)· `tool-boom-generate.spec.ts`(e2e) |
| Migration | `<timestamp>_<snake_case>/migration.sql` | `20260509000000_add_cost_log_target/migration.sql` |
| RCA | `RCA-<seq>-<kebab-case>.md` | `RCA-001-audit-delay.md` |

### §5.2 Directories

| 模式 | 例子 |
|---|---|
| 业务域 kebab/单词 | `context-assembler/` · `llm-gateway/` · `ip-progress/` |
| 3 字母缩写 lowercase | `lib/` · `trpc/` · `lib/auth/` |
| 复数 lowercase | `routers/` · `specialists/` · `pages/` · `tools/` |
| `__tests__/` 仅在 specialists 复杂时 | `tests/unit/specialists/__tests__/` |
| `.gitkeep` 占位文件 | `audit/.gitkeep` · `image-gen/.gitkeep` |

### §5.3 Module ID

- 类:`PascalCase`(`BaseSpecialist`,`LLMGateway`,`MockProvider`)
- 实例:`camelCase`(`copywritingAgent`,`llmGateway`,`contextAssembler`)
- 类型:`PascalCase`(`SpecialistConfig`,`AssembledContext`,`AppRouter`)
- 常量:`SCREAMING_SNAKE_CASE`(`MODEL_BY_TIER`,`PLAN_LIMITS`,`STEP_KEYS_9`,`HOT_ELEMENT_KEYS_22`)
- enum:`SCREAMING_SNAKE_CASE` 数组形式(`as const`)+ `*_KEYS`/`*_VALUES` 后缀

### §5.4 Path Aliases

| Alias | Maps to | 在哪用 |
|---|---|---|
| `@/*` | 当前 workspace 的 src | `apps/{api,web,admin}/tsconfig.json` |
| `@quanan/schemas` | `packages/schemas/src` | `apps/api`,`apps/web`,`packages/clients` |
| `@quanan/schemas/*` | `packages/schemas/src/*` | 同上 |
| `@quanan/clients` | `packages/clients/src` | `apps/web` |
| `@quanan/clients/*` | `packages/clients/src/*` | 同上 |
| `@quanan/ui`/`@quanan/ui/*` | `packages/ui/src/*` | 占位 |

---

## §6 Where to Add New Code(给后续 PRD 用)

### §6.1 New Specialist(PRD-6 起)

| 任务 | 位置 |
|---|---|
| Specialist 类 | `apps/api/src/specialists/<NewName>Agent.ts`(extends BaseSpecialist) |
| input/output zod | `packages/schemas/src/specialist-io/<newName>.schema.ts` + barrel export in `index.ts` |
| Prompt 模板 | `apps/api/src/services/context-assembler/templates/<newName>.ts` + register in `templates/index.ts` |
| tRPC router | `apps/api/src/trpc/routers/<newName>.ts` + register in `_app.ts` |
| Shadow router | `packages/clients/src/router-types.ts` 加 `_shadowRouter.<newName>` |
| Specialist unit test | `tests/unit/specialists/__tests__/<NewName>Agent.test.ts` |
| Router unit test | `tests/unit/api/<newName>-router.test.ts` |
| Integration test | `tests/integration/api/<newName>-llm.test.ts`(if uses real LLM) |
| LLM Judge | `tests/judge/<newName>.judge.ts` |
| Frontend page | `apps/web/src/pages/tools/<NewName>.tsx`(or `pages/modules/`)+ barrel + add lazy import in `router.tsx` |
| Tool form/result | `apps/web/src/components/{ToolForm,ToolResult}/<NewName>{Form,Result}.tsx` |
| Constants | `apps/api/src/lib/constants/<domain>.ts` + `index.ts` barrel |

### §6.2 New tRPC Procedure(在已有 router 内加 endpoint)

- 位置:`apps/api/src/trpc/routers/<existing>.ts`
- 模板:
  ```ts
  myAction: protectedProcedure        // ★ 默认 protectedProcedure (REJ-013) · 仅 User/InviteCode/TrendingItem 用 globalProcedure
    .input(zodInputSchema)
    .mutation/query(async ({ ctx, input }) => {
      const { prisma, activeAccountId, traceId } = ctx;
      // 业务逻辑 · 自然走 RLS · 不要 manually 加 where:{accountId}(SHIELD 注释提示)
      return result;
    }),
  ```
- 别忘:`packages/clients/src/router-types.ts` `_shadowRouter` 同步 stub

### §6.3 New zod schema

- 位置:`packages/schemas/src/specialist-io/<name>.schema.ts` 或 `packages/schemas/src/entities/<name>.schema.ts`
- export 到对应子目录 `index.ts` barrel
- 主 `packages/schemas/src/index.ts` 不直接 re-export(防 tree-shaking 风险)
- ★ Inline duplicate: tRPC router 内允许 inline 副本 + 注释 `Note: Zod schemas inlined — @quanan/schemas/specialist-io has canonical definition for client use`

### §6.4 New Component / Page

- shared UI:**应** `packages/ui/src/base/<comp>.tsx`(P9.0 admin 启动前必 lift)· P0 当前在 `apps/web/src/components/ui/`
- web 业务组件:`apps/web/src/components/<ComponentName>.tsx`
- web 页面:`apps/web/src/pages/{step,tools,modules}/<Name>.tsx` + register `apps/web/src/router.tsx`
- web hooks:`apps/web/src/hooks/use<Name>.ts`
- web layouts:`apps/web/src/layouts/<Name>Layout.tsx`(已有 RootLayout / StepLayout)

### §6.5 New Migration

- ★ 步骤(必按顺序):
  1. 改 `prisma/schema.prisma`
  2. `pnpm db:migrate:dev --name <kebab_name>` → 生成 `prisma/migrations/<ts>_<name>/migration.sql`
  3. **手动 review** generated SQL · 含字段顺序 · index · 约束
  4. 跑 `pnpm db:generate` 更新 client
  5. 若 schema 涉及 RLS 表 · 同步加 ENABLE RLS + policy 到 `prisma/migrations/manual_rls.sql`
  6. 手动跑:`psql $DATABASE_URL -f prisma/migrations/manual_rls.sql`(prod CI 必跑)
  7. 改 `DATA-MODEL.md` · 必先(改 schema 前必读 DATA-MODEL §13)

### §6.6 New Worker(P5+ image/file/stt/tts)

- 位置:`apps/api/src/workers/<domain>/index.ts` + 必要 sub-files
- 当前占位:6 worker 子目录 全 `.gitkeep`(file-parser/image-gen/stt/tts/trending-scraper)
- BullMQ 已 in deps · 可直接用

### §6.7 New Test

- unit:`tests/unit/<layer>/<file>.test.ts`(镜像 source 路径)· vitest run --dir tests/unit
- integration:`tests/integration/api/<file>.test.ts` · 真 PG (testcontainers)
- e2e:`tests/e2e/<feature>.spec.ts` · Playwright · `pnpm test:e2e`
- LLM judge:`tests/judge/<specialist>.judge.ts` · `vitest.judge.config.ts`

### §6.8 New ADR / RCA

- ADR:append 到 `ADR.md`(单文件 · 不分多文件)
- RCA:`.agents/rca/RCA-<seq>-<kebab>.md`(seq 自增)· 同时在 `.agents/tech-debt.json` 加 fix 项 + 项目 CLAUDE.md §9.X 加硬规则

### §6.9 Tech Debt 登记

- 位置:`.agents/tech-debt.json` items[] 数组
- 规范:`scripts/ralph/TECH-DEBT-SCHEMA.md`
- 关键字段:id/category/title/discovered_at/discovered_by/severity/status/evidence/root_cause/scheduled_fix_in/audit_exemption

---

## §7 Build & Run Workflows

### §7.1 Local Dev

```bash
# 安装依赖
pnpm install

# 启动 PG + Redis(brew services 或本地 launchd)
brew services start postgresql@16
brew services start redis

# DB schema
pnpm db:migrate              # prisma migrate deploy (用 generated migrations)
psql $DATABASE_URL -f prisma/migrations/manual_rls.sql

# 启动 dev 双服务(并行)
pnpm dev:api                 # tsx watch :3000
pnpm dev:web                 # vite :5173 (proxy /api/trpc → :3000)
```

### §7.2 Build

```bash
pnpm build                   # turbo + tsc -b for all + vite build for web
# 输出:
#   apps/api/dist
#   apps/web/dist
```

### §7.3 Test

```bash
pnpm test                    # vitest unit + integration
pnpm test:unit               # 仅 unit
pnpm test:integration        # 仅 integration (真 PG)
pnpm test:e2e                # Playwright
pnpm test:judge              # LLM Judge (vitest.judge.config.ts)
pnpm test:llm-judge          # legacy runner
pnpm typecheck               # tsc --noEmit (workspace 递归)
pnpm lint                    # eslint --max-warnings=0
```

### §7.4 DB

```bash
pnpm db:generate             # prisma generate
pnpm db:migrate              # prisma migrate deploy
pnpm db:migrate:dev          # prisma migrate dev (创新 migration)
pnpm db:seed                 # tsx prisma/seed.ts
pnpm db:studio               # Prisma Studio GUI
```

### §7.5 Audit

```bash
pnpm audit:redlines          # ★ 当前路径过期 (TD-NEW-2 · 给假绿灯)
pnpm audit:ld                # ★ 脚本不存在 (TD-NEW-4)
pnpm audit:all               # ★ 脚本不存在
```

### §7.6 Ralph(自主开发)

```bash
# 启 Ralph daemon · 严守项目 CLAUDE.md §9.1 5 步 SOP
# 1. 确认 prd.json (cp prd-N.json prd.json)
# 2. 先启 Monitor (persistent · 项目 CLAUDE.md §9.1)
# 3. 启 daemon
python3.11 scripts/ralph/ralph.py --model sonnet --daemon
# 4. 等 PENDING_DETECTED:US-XXX
# 5. Opus audit · python3 scripts/ralph/ralph-tools.py approve / reject "..."
```

---

## §8 Snapshot Statistics(实测 2026-05-09)

| 维度 | 数 |
|---|:-:|
| Workspace 数 | 6 (apps × 3 + packages × 3) |
| TS LOC (apps + packages) | ~16,200 |
| TS LOC (tests) | ~14,300 |
| Prisma models | 39 |
| Prisma indexes/uniques | 133 |
| RLS-enabled tables | 15 |
| tRPC routers (active) | 19 (1 _app + 18 sub) |
| tRPC procedures (estimated) | ~50+ |
| Specialists 实施 | 8 / 14(模板就位)|
| ContextAssembler templates | 8 |
| LLM models in MODEL_BY_TIER | 4(claude-sonnet-4-6 / claude-haiku-4-5 / gpt-4o / gpt-4o-mini)|
| zod schemas | 38 (in `packages/schemas`)|
| 9 step pages | 11(含 step3b/4b)|
| 14 tool pages | 15 |
| 6 module pages | 6 |
| 总 routes | 34(`router.tsx`)|
| Tests · unit | 38 |
| Tests · integration | 11 |
| Tests · e2e | 19 |
| Tests · LLM judge | 11 |
| Tech debts | 15 (closed 3 · open 5 · scheduled 6 · accepted 1 · 加 5 隐性 TD 更细) |
| RCAs | 3 (RCA-001/002/003)|

---

## §9 References

- **AGENTS.md** §1.7 · §3 18 LD · §4.7 17 R · 决策权威
- **ARCHITECTURE.md** v0.4 · 9 章战略骨架(本文是事实层 + 与之对账)
- **ADR.md** 21 ADR(ADR-019/020/021 含分包决策)
- **DATA-MODEL.md** §13 admin 13 表 · §13.8 RLS DISABLE 例外
- **SCAFFOLD.md** §A.1 monorepo 拓扑 + §A.3 10 步迁移
- **PROMPTS.md** Specialist prompt 权威
- **PRD-MASTER.md** 14 PRD 总纲 + 35 反例
- **`.agents/tech-debt.json`** 15 TD(本文 §3 + CONCERNS.md §3 完整)
- **`.agents/rca/`** RCA-001/002/003
- **项目 CLAUDE.md** §9 Ralph daemon SOP + §9.6 large story 拆分
- **全局 ~/.claude/CLAUDE.md** Coding 3.0 12 步

---

*Structure analysis: 2026-05-09 · QuanAn PRD-1~PRD-5 完成期 · 6 workspaces · 39 prisma models · 8 / 14 Specialist · 34 routes · 79 tests*
