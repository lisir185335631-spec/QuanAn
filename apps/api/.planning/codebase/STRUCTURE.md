# Codebase Structure

**Analysis Date:** 2026-05-21

## Directory Layout

```
apps/api/
├── src/
│   ├── index.ts                    # Server entry: Hono app, OAuth routes, tRPC mount, cron/worker startup
│   ├── agents/                     # Legacy agent layer (pre-PRD-4 BaseSpecialist)
│   │   ├── base/                   # Legacy types + IPProgressService + DailyTaskAgent
│   │   │   ├── types.ts            # SpecialistId enum, legacy SpecialistConfig, generateSpecialistTraceId
│   │   │   ├── BaseSpecialist.ts   # Legacy base (some agents still use this path)
│   │   │   └── IPProgressService.ts
│   │   ├── evolution/              # EvolutionAgent (loop logic)
│   │   └── specialists/            # Legacy: DailyTaskAgent.ts (use src/specialists/ for new agents)
│   ├── specialists/                # Current specialist layer (PRD-4+, all new agents here)
│   │   ├── base/
│   │   │   ├── BaseSpecialist.ts   # Template method base class — THE canonical base
│   │   │   ├── types.ts            # SpecialistConfig, SpecialistRequest/Response, ILLMGateway
│   │   │   └── errors.ts           # SchemaValidationError, LLMTimeoutError
│   │   ├── __tests__/              # Unit tests + real-LLM tests per specialist
│   │   ├── PositioningAgent.ts
│   │   ├── BrandingAgent.ts
│   │   ├── MonetizationAgent.ts    # PRD-4 step4b + PRD-27 monetization-tool mode
│   │   ├── TopicAgent.ts
│   │   ├── CopywritingAgent.ts
│   │   ├── VideoAgent.ts
│   │   ├── LivestreamAgent.ts
│   │   ├── PrivateDomainAgent.ts   # PRD-27 US-002: 6-phase private domain scripts
│   │   ├── AnalysisAgent.ts
│   │   ├── DiagnosisAgent.ts
│   │   ├── DeepLearnAgent.ts       # PRD-27 US-004: batch sample analysis
│   │   ├── VoiceChatAgent.ts
│   │   └── PresentationAgent.ts   # PRD-27 US-003: 14-style presentation recommender
│   ├── trpc/
│   │   ├── trpc.ts                 # tRPC init, traceMiddleware, publicProcedure
│   │   ├── context.ts              # TRPCContext factory (session, activeAccountId, traceId)
│   │   ├── procedures/             # (reserved)
│   │   ├── middleware/
│   │   │   ├── account-isolation.ts # protectedProcedure + globalProcedure (RLS enforcement)
│   │   │   └── admin/              # Admin 6-gate middleware chain
│   │   │       ├── adminAuth.ts
│   │   │       ├── adminRLS.ts
│   │   │       ├── roleCheck.ts
│   │   │       ├── mfaCheck.ts
│   │   │       ├── ipWhitelist.ts
│   │   │       ├── approvalGateCheck.ts
│   │   │       └── auditLog.ts
│   │   └── routers/
│   │       ├── _app.ts             # Root app router (28 sub-routers)
│   │       ├── app/                # 28 user-facing routers
│   │       │   ├── auth.ts
│   │       │   ├── ipAccounts.ts
│   │       │   ├── stepData.ts
│   │       │   ├── copywriting.ts
│   │       │   ├── boomGenerate.ts
│   │       │   ├── analysis.ts
│   │       │   ├── diagnosis.ts
│   │       │   ├── deepLearning.ts # PRD-27: learn (BullMQ) + learnStatus + parse + applyFormula
│   │       │   ├── monetization.ts # PRD-27: generate (MonetizationAgent monetization-tool)
│   │       │   ├── presentStyles.ts # PRD-27: recommend (PresentationAgent)
│   │       │   ├── privateDomain.ts # PRD-27: generate + generateStream (SSE)
│   │       │   ├── trending.ts
│   │       │   ├── voiceChat.ts
│   │       │   ├── evolution.ts
│   │       │   ├── history.ts
│   │       │   ├── knowledge.ts
│   │       │   ├── dailyTasks.ts
│   │       │   ├── videoAnalysis.ts
│   │       │   ├── videoProduction.ts
│   │       │   ├── aiVideo.ts
│   │       │   ├── acquisitionVideo.ts
│   │       │   ├── stt.ts
│   │       │   ├── tts.ts
│   │       │   ├── invite.ts
│   │       │   ├── costLog.ts
│   │       │   ├── myTopics.ts
│   │       │   └── __tests__/
│   │       └── admin/              # 17 admin routers
│   │           ├── index.ts        # adminRouter root
│   │           ├── auth.ts
│   │           ├── users.ts
│   │           ├── accounts.ts
│   │           ├── audit.ts
│   │           ├── invites.ts
│   │           ├── nsm.ts
│   │           ├── cost.ts
│   │           ├── quota.ts
│   │           ├── compliance.ts
│   │           ├── prompts.ts
│   │           ├── approvals.ts
│   │           ├── featureFlags.ts
│   │           ├── abExperiments.ts
│   │           ├── constants.ts
│   │           ├── evolutionHealth.ts
│   │           ├── review-trending.ts
│   │           ├── review-deep-learn.ts
│   │           └── __tests__/
│   ├── workers/
│   │   ├── llm-gateway/            # LLM Gateway (sole SDK import point)
│   │   │   ├── index.ts            # LLMGateway class + llmGateway singleton
│   │   │   ├── anthropic-provider.ts
│   │   │   ├── openai-provider.ts
│   │   │   ├── rate-limiter.ts     # Upstash token bucket per plan
│   │   │   └── cost-logger.ts
│   │   ├── daily-task/             # BullMQ worker: daily IP task generation
│   │   ├── image-gen/              # BullMQ worker: AI image generation
│   │   ├── embedding/              # pgvector embedding (stub P3)
│   │   ├── evolution/              # Evolution loop worker
│   │   ├── file-parser/            # File upload → text extraction
│   │   ├── methodology-query/      # In-memory constants query
│   │   ├── rag/                    # pgvector RAG retrieval
│   │   ├── stt/                    # Speech-to-text
│   │   ├── trending-scraper/       # Trending content scraper
│   │   └── tts/                    # Text-to-speech
│   ├── jobs/
│   │   ├── deep-learning.job.ts    # PRD-27 BullMQ queue+worker for DeepLearnAgent
│   │   └── admin/                  # Admin BullMQ jobs
│   │       ├── kpi-snapshot.job.ts
│   │       ├── anomaly-detection.job.ts
│   │       ├── cost-anomaly.job.ts
│   │       ├── violation-detection.job.ts
│   │       ├── emergency-post-review.job.ts
│   │       ├── quota-expiry.job.ts
│   │       ├── ab-stop-loss.job.ts
│   │       └── constant-embed-rebuild.job.ts
│   ├── services/
│   │   ├── context-assembler/      # ContextAssembler: 7-layer parallel fetch
│   │   │   ├── ContextAssembler.ts
│   │   │   ├── templates/          # Specialist system prompt templates
│   │   │   └── types.ts
│   │   ├── ip-progress/            # IP flow step progress service
│   │   ├── quota/                  # User quota service
│   │   │   └── __tests__/
│   │   └── admin/                  # Admin domain services
│   │       ├── ab-experiment/
│   │       ├── accounts/
│   │       ├── approval/
│   │       ├── audit/
│   │       ├── constant-version/
│   │       ├── content-review/
│   │       ├── cost/
│   │       ├── evolution-health/
│   │       ├── feature-flag/
│   │       ├── invites/
│   │       ├── notifications/
│   │       ├── nsm/
│   │       ├── prompt-version/
│   │       └── quota/
│   ├── lib/
│   │   ├── prisma.ts               # PrismaClient singleton + checkDbConnection
│   │   ├── redis.ts                # ioredis singleton (BullMQ + rate-limit)
│   │   ├── logger.ts               # Pino + AsyncLocalStorage traceStore
│   │   ├── env.ts                  # LLM env validation (ANTHROPIC_API_KEY, OPENAI_API_KEY)
│   │   ├── auth/                   # Lucia adapters, OAuth providers, admin OAuth
│   │   ├── compliance/             # PII masking, disclaimer injection
│   │   ├── constants/              # Static knowledge: cases, elements, industries
│   │   ├── evolution/              # Evolution profile helpers
│   │   ├── rate-limit/             # App-level rate limiting helpers
│   │   └── voice-chat/             # Voice chat utilities
│   ├── memory/
│   │   ├── l1-buffer.ts            # L1: account profile buffer
│   │   ├── l4-profile.ts           # L4: evolution insight fetch
│   │   └── l5-trending.ts          # L5: trending data (TODO PRD-9 real API)
│   ├── middleware/
│   │   ├── auth.ts                 # Session validation, DEV_MOCK_USER_EMAIL
│   │   └── __tests__/
│   ├── cron/
│   │   └── daily-task-runner.ts    # node-cron daily task scheduler
│   ├── schemas/
│   │   └── admin/                  # Admin-specific Zod schemas
│   │       └── __tests__/
│   ├── server/
│   │   └── context-admin.ts        # Admin tRPC context factory
│   ├── audit/                      # Empty dir (.gitkeep) — TD-048
│   ├── notification/               # Empty dir (.gitkeep) — TD-048
│   └── types/
│       └── node-cron.d.ts          # Type declaration for node-cron
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

## Directory Purposes

**`src/specialists/`:**
- Purpose: All 14 LLM Specialist agents (PRD-4 onwards)
- Contains: Agent classes, `base/` (BaseSpecialist + types), `__tests__/`
- Key files: `base/BaseSpecialist.ts`, `base/types.ts`, `PresentationAgent.ts` (PRD-27 newest)

**`src/trpc/routers/app/`:**
- Purpose: 28 user-facing tRPC sub-routers
- Contains: One file per feature domain (e.g., `monetization.ts`, `deepLearning.ts`)
- New PRD-27 routers: `monetization.ts`, `privateDomain.ts`, `presentStyles.ts`

**`src/trpc/routers/admin/`:**
- Purpose: 17 admin management routers (separate auth context)
- Contains: Admin CRUD operations, moderation workflows, KPI dashboards

**`src/workers/llm-gateway/`:**
- Purpose: Single entry point for all LLM calls
- Key rule: Only file allowed to `import Anthropic from '@anthropic-ai/sdk'` or `import OpenAI from 'openai'`

**`src/jobs/`:**
- Purpose: BullMQ Queue + Worker co-located pairs for async tasks
- `deep-learning.job.ts` is the PRD-27 addition; admin jobs under `admin/`

**`src/services/context-assembler/`:**
- Purpose: Builds Specialist prompts by fetching 7 data layers in parallel
- Key file: `ContextAssembler.ts` — called in `BaseSpecialist.execute()` Step 2

**`src/lib/`:**
- Purpose: Shared infrastructure singletons (DB, Redis, Logger, Auth)
- Never import business logic here; only infrastructure

## Key File Locations

**Entry Points:**
- `src/index.ts`: Server startup, Hono app, all route mounting
- `src/trpc/routers/_app.ts`: App router root
- `src/trpc/routers/admin/index.ts`: Admin router root

**Configuration:**
- `tsconfig.json`: Path aliases `@/*` → `src/*`
- `vitest.config.ts`: Test runner config, includes `src/**/*.test.ts`
- `src/lib/env.ts`: Runtime env validation

**Core Logic:**
- `src/specialists/base/BaseSpecialist.ts`: Template method all agents inherit
- `src/workers/llm-gateway/index.ts`: LLM call dispatch with failover
- `src/services/context-assembler/ContextAssembler.ts`: Prompt assembly
- `src/trpc/middleware/account-isolation.ts`: RLS enforcement

**Testing:**
- Unit tests co-located: `src/specialists/__tests__/`, `src/trpc/routers/admin/__tests__/`
- Service tests: `src/services/admin/<domain>/__tests__/`

## Naming Conventions

**Files:**
- Specialist agents: `PascalCase.ts` (e.g., `PresentationAgent.ts`)
- tRPC routers: `camelCase.ts` matching router key (e.g., `presentStyles.ts` → `presentStylesRouter`)
- BullMQ jobs: `kebab-case.job.ts` (e.g., `deep-learning.job.ts`)
- Workers: `worker.ts` inside named subdirectory
- Services: `kebab-case.service.ts`
- Tests: `*.test.ts` for unit tests, `*.real-llm.test.ts` for live LLM integration tests

**Directories:**
- Feature domains: `kebab-case/` (e.g., `context-assembler/`, `llm-gateway/`)
- Admin sub-services: nested under `services/admin/<domain>/`

## Where to Add New Code

**New Specialist Agent:**
1. Create `src/specialists/<AgentName>.ts` — extend `BaseSpecialist<TIn, TOut>`
2. Add singleton export: `export const agentName = new AgentName()`
3. Add `SpecialistId` to `src/agents/base/types.ts` (legacy SpecialistId union)
4. Create unit test: `src/specialists/__tests__/<AgentName>.test.ts`
5. Wire into a tRPC router in `src/trpc/routers/app/<domain>.ts`
6. Register router in `src/trpc/routers/_app.ts`

**New tRPC App Router:**
1. Create `src/trpc/routers/app/<routerName>.ts`
2. Export `export const <routerName>Router = router({ ... })`
3. Add to `src/trpc/routers/_app.ts` imports + `appRouter` object

**New BullMQ Job:**
1. Create `src/jobs/<domain>.job.ts` with Queue + Worker + payload types
2. Import worker in `src/index.ts` (dev in-process) or as standalone process (prod)
3. Register cron/schedule in `src/index.ts` `start()` function

**New Admin Service:**
1. Create `src/services/admin/<domain>/<domain>.service.ts`
2. Add tests in `src/services/admin/<domain>/__tests__/`
3. Wire into an admin router in `src/trpc/routers/admin/<domain>.ts`

**Shared Infrastructure:**
- Singletons: add to `src/lib/`
- Zod schemas shared with frontend: add to `packages/schemas/src/specialist-io/`

## Special Directories

**`src/audit/` and `src/notification/`:**
- Purpose: Empty placeholder dirs (`.gitkeep` files only)
- Status: TD-048 — pending cleanup, not committed business code
- Action: `git rm` both dirs in a chore commit

**`src/agents/`:**
- Purpose: Pre-PRD-4 legacy agent layer (kept for `EvolutionAgent` and base types still referenced)
- Note: All new agents go in `src/specialists/`, not here

---

*Structure analysis: 2026-05-21*
