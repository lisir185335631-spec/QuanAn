<!-- refreshed: 2026-05-21 -->
# Architecture

**Analysis Date:** 2026-05-21

## System Overview

```text
┌────────────────────────────────────────────────────────────────────────┐
│                         HTTP Layer (Hono v4)                           │
│  GET /health  POST /auth/login  GET /auth/callback  GET /auth/logout   │
│  GET /auth/dev-login (dev)   GET /admin/export/users                  │
│                         `src/index.ts`                                 │
└───────────────┬───────────────────────────────────────┬───────────────┘
                │ /trpc/*                               │ /trpc/admin/*
                ▼                                       ▼
┌──────────────────────────┐             ┌──────────────────────────────┐
│  App tRPC Router (v11)   │             │  Admin tRPC Router (v11)     │
│  `src/trpc/routers/_app` │             │  `src/trpc/routers/admin/`   │
│  28 sub-routers          │             │  17 sub-routers              │
│  protectedProcedure      │             │  adminProtectedProcedure     │
│  (RLS via set_config)    │             │  (6-gate auth chain)         │
└───────────┬──────────────┘             └──────────────┬───────────────┘
            │                                           │
            ▼                                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│           Specialist Layer  `src/specialists/`                       │
│  14 agents extend BaseSpecialist<TIn,TOut>                           │
│  Template Method: inputSchema.parse → ContextAssembler.assemble      │
│                → invokeLLM (+ retry) → outputSchema.safeParse        │
│                → _writeCostLog → _applyDisclaimer                    │
└──────────────────────────┬───────────────────────────────────────────┘
                           │ this.llmGateway.complete()/stream()
                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│       LLM Gateway  `src/workers/llm-gateway/index.ts`                │
│  Sole SDK import point (Anthropic + OpenAI)                          │
│  Rate limit → primary call → fallback call → cost_log write          │
│  Tier routing: reasoning/lightweight/balanced                        │
│  Primary: claude-sonnet-4-6 / claude-haiku-4-5                       │
│  Fallback: gpt-4o / gpt-4o-mini                                       │
└──────────────┬───────────────────────────────────────────────────────┘
               │                       │
               ▼                       ▼
┌─────────────────────┐   ┌────────────────────────────────────────────┐
│  PostgreSQL         │   │  BullMQ Workers  `src/workers/`            │
│  (Prisma ORM)       │   │  deep-learning · daily-task · image-gen    │
│  `src/lib/prisma`   │   │  embedding · evolution · file-parser       │
│  RLS enforced via   │   │  methodology-query · rag · stt · tts       │
│  quanan_app role    │   │  trending-scraper                          │
└─────────────────────┘   └────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Hono server | HTTP routing, CORS, OAuth, trace middleware | `src/index.ts` |
| tRPC context | Session resolution, activeAccountId injection | `src/trpc/context.ts` |
| Account isolation middleware | RLS enforcement via `SET LOCAL ROLE quanan_app` + `set_config` | `src/trpc/middleware/account-isolation.ts` |
| App tRPC router | 28 sub-routers for user-facing features | `src/trpc/routers/_app.ts` |
| Admin tRPC router | 17 sub-routers for admin SPA | `src/trpc/routers/admin/index.ts` |
| BaseSpecialist | Template method pattern for all 14 LLM agents | `src/specialists/base/BaseSpecialist.ts` |
| LLMGateway | Single LLM entry point, rate-limit, fallback, cost logging | `src/workers/llm-gateway/index.ts` |
| ContextAssembler | 7-layer parallel context fetch for Specialist prompts | `src/services/context-assembler/ContextAssembler.ts` |
| BullMQ jobs | Async heavy tasks (deep learning, KPI snapshots, etc.) | `src/jobs/` |
| Lucia auth | Session cookie management for both app and admin | `src/lib/auth/lucia.ts` |

## Pattern Overview

**Overall:** Layered tRPC + Template Method + Gateway pattern

**Key Characteristics:**
- Every protected tRPC procedure wraps in a `$transaction` that sets Postgres `app.current_account_id` config, enforcing RLS at the DB level
- All LLM calls go through `llmGateway` — direct SDK imports are forbidden outside `src/workers/llm-gateway/index.ts` (AC-7/AC-8)
- All Specialist agents are singletons (`export const agentName = new AgentClass()`) instantiated once at module load
- BullMQ workers for CPU/LLM-heavy async work; in-process in dev, standalone processes in prod

## Layers

**HTTP Layer:**
- Purpose: Route HTTP requests, CORS, OAuth flow, trace ID propagation
- Location: `src/index.ts`
- Contains: Hono app, OAuth routes, tRPC mount points, CORS config
- Depends on: Lucia, Prisma, tRPC routers
- Used by: Frontend SPA (apps/web), Admin SPA (apps/admin)

**tRPC Router Layer:**
- Purpose: Type-safe RPC endpoints, input validation, procedure orchestration
- Location: `src/trpc/routers/app/` (28 routers), `src/trpc/routers/admin/` (17 routers)
- Contains: Mutations, queries, subscriptions (SSE)
- Depends on: Specialists, Prisma, BullMQ queues
- Used by: Frontend via `@trpc/client`

**Specialist Layer:**
- Purpose: 14 domain-specific LLM agents with 5-layer config
- Location: `src/specialists/`
- Contains: Agent classes extending `BaseSpecialist`, fallback templates, output schemas
- Depends on: LLMGateway, ContextAssembler, Prisma (cost_log writes)
- Used by: tRPC routers via singleton instances

**LLM Gateway Layer:**
- Purpose: Sole LLM SDK access point with rate-limiting, retry, provider failover
- Location: `src/workers/llm-gateway/`
- Contains: `index.ts` (gateway), `anthropic-provider.ts`, `openai-provider.ts`, `rate-limiter.ts`, `cost-logger.ts`
- Depends on: `@anthropic-ai/sdk`, `openai`, `@upstash/ratelimit`
- Used by: `BaseSpecialist` via DI

**Context Assembler:**
- Purpose: 7-layer parallel context assembly for Specialist system prompts
- Location: `src/services/context-assembler/`
- Contains: `ContextAssembler.ts`, `templates/`, `types.ts`
- Layers fetched: L1 (account), L2 (stepData), L4 (profile), L4 (samples), L5 (RAG), methodology constants, DB constants
- Depends on: Prisma, RAG worker, methodology-query worker

**BullMQ Jobs:**
- Purpose: Async processing for long-running LLM and compute tasks
- Location: `src/jobs/`, `src/workers/`
- Contains: Queue definitions, Worker processors
- Depends on: Redis (`src/lib/redis.ts`), Specialists, Prisma

## Data Flow

### App Specialist Call (e.g. monetization.generate)

1. Frontend calls `monetization.generate` via tRPC (`src/trpc/routers/app/monetization.ts`)
2. `protectedProcedure` validates session via Lucia, reads `activeAccountId` from context
3. `accountIsolationMiddleware` runs `SET LOCAL ROLE quanan_app` + `set_config('app.current_account_id', ...)` in a `$transaction`
4. Router calls `monetizationAgent.execute({ accountId, mode: 'monetization-tool', ... })`
5. `BaseSpecialist.execute()` template method runs: inputSchema.parse → ContextAssembler.assemble (7-layer parallel) → invokeLLM → outputSchema.safeParse (retry 1x) → _writeCostLog
6. `invokeLLM` calls `this.llmGateway.complete({ model_tier: 'balanced', ... })`
7. `LLMGateway` checks rate limit (Upstash) → calls Anthropic claude-sonnet-4-6 → fallback to gpt-4o on failure → writes cost_log
8. Result returned to router, written to `history` table, row returned to frontend

### BullMQ Deep Learning Job

1. Frontend calls `deepLearning.learn` → router creates `History` row with `status: 'queued'`, enqueues `deepLearningQueue.add('analyze-batch', payload)`
2. Returns `{ jobId, status: 'queued' }` immediately
3. `deepLearningWorker` picks up job (`src/jobs/deep-learning.job.ts`), updates History to `processing`
4. Worker calls `deepLearnAgent.execute({ accountId, userInput: { samples } })`
5. Agent → LLMGateway → Anthropic (model_tier='reasoning', timeout 60s)
6. History row updated with `completed` status + structured result
7. Frontend polls `deepLearning.learnStatus({ jobId })` until completed

**State Management:**
- No in-memory shared state beyond singleton agents (stateless per request)
- Session state: Lucia session cookies + PostgreSQL `Session` table
- RLS context: per-request Postgres `set_config` parameters (cleared on transaction commit)

## Key Abstractions

**BaseSpecialist<TIn, TOut>:**
- Purpose: Template method with 4-step pipeline, retry, fallback, cost logging
- Location: `src/specialists/base/BaseSpecialist.ts`
- Pattern: Abstract class with `abstract invokeLLM()`, `abstract config`, `abstract inputSchema`, `abstract outputSchema`

**SpecialistConfig (5 layers):**
- Purpose: Declarative agent configuration
- Fields: `persona`, `memory` (L1/L2 read/write), `knowledge` (constants, RAG), `tools`, `execution` (model_tier, timeout_ms, retry, streaming)
- Location: `src/specialists/base/types.ts`

**LLMGateway Tier System:**
- `reasoning`: claude-sonnet-4-6 primary / gpt-4o fallback (45-60s timeout)
- `lightweight`: claude-haiku-4-5 primary / gpt-4o-mini fallback (15-30s timeout)
- `balanced`: claude-sonnet-4-6 primary / gpt-4o fallback (30s timeout)

## 14 Specialist Topology

| Agent | Mode(s) | model_tier | Added |
|-------|---------|------------|-------|
| PositioningAgent | industry, execution, recommend | lightweight/reasoning | PRD-4 |
| BrandingAgent | step2, quick-analyze | balanced | PRD-4 |
| MonetizationAgent | default (step4b), monetization-tool | reasoning / balanced | PRD-4 / PRD-27 |
| TopicAgent | standard, boom-hook | balanced | PRD-4 |
| CopywritingAgent | step7, free, boom | reasoning | PRD-4 |
| VideoAgent | step8, quick-script | reasoning | PRD-4 |
| LivestreamAgent | full-script, quick | reasoning | PRD-4 |
| PrivateDomainAgent | phase-generate (6 phases) | balanced | PRD-27 |
| AnalysisAgent | structural, trend | reasoning | PRD-5 |
| DiagnosisAgent | analyze | reasoning | PRD-25 |
| DeepLearnAgent | analyze-batch | reasoning | PRD-27 |
| VoiceChatAgent | chat (function calling) | reasoning | PRD-4 |
| EvolutionAgent | (evolution loop) | reasoning | PRD-8 |
| **PresentationAgent** | **recommend (14 style enum)** | **balanced** | **PRD-27** |
| DailyTaskAgent | daily-plan | balanced | PRD-4 |

## Entry Points

**Development Server:**
- Location: `src/index.ts`
- Triggers: `pnpm dev` → `tsx watch src/index.ts`
- Responsibilities: Validate env/DB, start BullMQ workers in-process, register cron jobs, mount Hono

**BullMQ Workers (prod standalone):**
- `src/workers/image-gen/worker.ts`, `src/workers/daily-task/worker.ts`
- `src/jobs/deep-learning.job.ts` — PRD-27 addition; in-process in dev

## Architectural Constraints

- **SDK isolation:** `@anthropic-ai/sdk` and `openai` imports are restricted to `src/workers/llm-gateway/index.ts` only (R-001 / LD-012)
- **RLS enforcement:** All app queries must run under `quanan_app` role via `accountIsolationMiddleware`. Direct queries without `protectedProcedure` are forbidden (LD-009)
- **Admin isolation:** Admin routers live at `/trpc/admin/*` with separate auth context (`src/server/context-admin.ts`). Main app code never reads admin tables and vice versa (LD-A-1)
- **Audit log immutability:** `auditLog` table is append-only; no UPDATE/DELETE (LD-A-3)
- **Cost log writes:** BaseSpecialist writes `callType='specialist_call'`; LLMGateway writes `callType='complete'` — dual write is known and intentional (TD-013)
- **Singleton agents:** All Specialist instances are module-level singletons. `_mode` instance state has a race window under concurrent calls (TD-014, low risk in single-user flow)
- **Streaming:** `LLMGateway.stream()` emits a stub `meta + done` only (TODO P3 real streaming) — `privateDomain.generateStream` uses it

## Anti-Patterns

### Direct SDK Import Outside LLMGateway

**What happens:** Importing `@anthropic-ai/sdk` or `openai` in any file other than `src/workers/llm-gateway/index.ts`
**Why it's wrong:** Bypasses rate limiting, fallback, and cost logging; leaks API keys beyond the gateway
**Do this instead:** Call `this.llmGateway.complete(req)` from within `invokeLLM()` in the Specialist

### RLS-Only Single-Layer Guard

**What happens:** Queries relying solely on PostgreSQL RLS without explicit `accountId` in the WHERE clause
**Why it's wrong:** RLS depends on role switch working correctly; defense in depth requires explicit guard
**Do this instead:** Use `where: { id: input.id, accountId: activeAccountId! }` double-layer pattern (TD-019 lesson)

### Synchronous LLM in tRPC Mutation for Long Tasks

**What happens:** Awaiting `agent.execute()` inline in a mutation for tasks > 30s
**Why it's wrong:** HTTP timeout, poor UX; anti-pattern SHIELD D-262
**Do this instead:** Enqueue to BullMQ, return jobId immediately, poll via `learnStatus` query (see `deepLearning.learn` pattern)

## Error Handling

**Strategy:** Throw `TRPCError` from routers; let `BaseSpecialist` catch `SchemaValidationError`/`LLMTimeoutError` and apply fallback template

**Patterns:**
- Schema validation failures in Specialists: retry 1x → `SchemaValidationError` → `fallbackTemplate` if present, re-throw if not
- LLM 5xx / timeout: `LLMTimeoutError` → fallback template
- Rate limit exceeded: `RateLimitError` from gateway → propagate as `TRPCError FORBIDDEN`
- BullMQ job failures: logged, history row updated to `failed` status, job retried 3x with exponential backoff
- Missing DB: startup `checkDbConnection()` → `process.exit(1)`

## Cross-Cutting Concerns

**Logging:** Pino structured logger (`src/lib/logger.ts`). AsyncLocalStorage `traceStore` auto-injects `traceId` into every log line. `console.log` is forbidden (LD-013)
**Validation:** Zod schemas at tRPC input layer and Specialist I/O. Central `src/lib/env.ts` for startup env validation
**Authentication:** Lucia v3 session cookies (`app_session` for main app, `admin_session` for admin). OAuth via `arctic` library
**PII masking:** `src/lib/compliance/pii-mask.ts` — email/phone/ID/bank card redacted before entering LLM prompts (R-14 / LD-018)
**Disclaimer injection:** `src/lib/compliance/disclaimer.ts` — auto-appended to output for sensitive industries (medical/legal/finance)

---

*Architecture analysis: 2026-05-21*
