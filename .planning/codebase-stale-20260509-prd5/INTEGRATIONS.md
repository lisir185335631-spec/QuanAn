# External Integrations

**Analysis Date:** 2026-05-09

## APIs & External Services

**AI / LLM (single chokepoint per LD-012 + R-1):**

- **Anthropic Claude API** — primary reasoning + lightweight tier
  - SDK: `@anthropic-ai/sdk` 0.30.1 — **only imported in `apps/api/src/workers/llm-gateway/index.ts:19`** (R-1 enforced; `AC-7` comment marks the file as the sole allowed import site)
  - Models: `claude-sonnet-4-6` (reasoning primary) + `claude-haiku-4-5` (lightweight primary), hardcoded in `MODEL_BY_TIER` (`apps/api/src/workers/llm-gateway/index.ts:81-84`)
  - Auth: env var `ANTHROPIC_API_KEY` (lazy client initialization in `getAnthropicClient()`, `apps/api/src/workers/llm-gateway/index.ts:90`)
  - Timeouts: 60s (reasoning) / 30s (lightweight); `AbortController` wired to `client.messages.create` (`apps/api/src/workers/llm-gateway/index.ts:225-233`)
  - Payload builder + response parser: `apps/api/src/workers/llm-gateway/anthropic-provider.ts` (`buildAnthropicPayload` / `parseAnthropicResponse` / `isAnthropicModel`)

- **OpenAI API** — fallback reasoning + lightweight (current); future image / STT / TTS / embedding
  - SDK: `openai` 4.104.0 — **only imported in `apps/api/src/workers/llm-gateway/index.ts:21`** (R-1 enforced; `AC-8` comment)
  - Models: `gpt-4o` (fallback for reasoning), `gpt-4o-mini` (fallback for lightweight) (`apps/api/src/workers/llm-gateway/index.ts:81-84`)
  - Auth: env var `OPENAI_API_KEY` (`getOpenAIClient()`, `apps/api/src/workers/llm-gateway/index.ts:96`)
  - Embedding: stub returns 1536-zero vector (`apps/api/src/workers/llm-gateway/index.ts:175`); production target `text-embedding-3-small` per AGENTS §2.4 — DEFERRED to PRD-6+

- **OpenAI image / STT / TTS** — declared in `.env.example` and AGENTS §2.4 but not yet wired
  - Worker dirs exist empty: `apps/api/src/workers/{image-gen,stt,tts}/` (no source files as of 2026-05-09)
  - Models per AGENTS §2.4: `dall-e-3`, `whisper-large-v3`, `tts-1-hd`

**LLMGateway invocation flow** (`apps/api/src/workers/llm-gateway/index.ts:111`):
```
Specialist → BaseSpecialist.execute() → contextAssembler.assemble()
          → llmGateway.complete(req) [or .stream(req)]
          → checkRateLimit(userId)            [Upstash]
          → primary call (Anthropic, retry=1)
          → fallback (OpenAI, retry=0) on primary failure
          → both fail → templated apology + cost_log(success=false)
          → writeCostLog (always)
          → return CompleteResponse (with optional .fallback metadata)
```

**14 Specialists routing through LLMGateway** (per LD-002, LD-007):

Live (`apps/api/src/specialists/`, 8 files as of PRD-5):
- `PositioningAgent.ts` (step 1-2)
- `BrandingAgent.ts` (step 3 / 3b)
- `MonetizationAgent.ts` (step 4b)
- `TopicAgent.ts` (step 5, SSE streaming)
- `CopywritingAgent.ts` (step 7 + free + boom modes, SSE streaming `apps/api/src/specialists/CopywritingAgent.ts:274`)
- `VideoAgent.ts` (step 6 shooting + analysis modes)
- `LivestreamAgent.ts` (step 8)
- `AnalysisAgent.ts` (lightweight tier · structural + viral modes; replaces standalone /analysis + /video-analysis backends)

Pending (per LD-002 14-agent target — PRD-6+):
- `PrivateDomainAgent` · `DiagnosisAgent` · `DeepLearnAgent` · `VoiceChatAgent` · `EvolutionAgent` · `DailyTaskAgent`

All 8 live specialists extend `BaseSpecialist<TIn, TOut>` (`apps/api/src/specialists/base/BaseSpecialist.ts:40`) and call `this.llmGateway.complete()` (or `.stream()` for SSE). The base class enforces:
- input zod parse → context assembly → invokeLLM → output zod safeParse (1 retry on schema fail) → `cost_log` write
- Fallback path on `SchemaValidationError` / `LLMTimeoutError` / `5xx` errors → static `fallbackTemplate[mode]` → `cost_log(model='fallback', tokens=0)` (US-015)

**ContextAssembler — prompt injection chokepoint (LD-007):**
- `apps/api/src/services/context-assembler/ContextAssembler.ts:34`
- 4 parallel data fetches via `Promise.allSettled` + per-fetch 5s timeout: L2 stepData, L4 EvolutionProfile (stub), L4 Samples (stub), L5 RAG (stub) + constants
- L4 Profile / L4 Samples / L5 RAG return null/[] in current PRD-5 baseline (deferred to PRD-8)
- Templates: `apps/api/src/services/context-assembler/templates/index.ts` — per-agentId persona / methodology
- methodologyQueryWorker provides `scriptTypes / hotElements / industries` constants (`apps/api/src/workers/methodology-query/index.ts`)

## Data Storage

**Databases:**
- **PostgreSQL 16.13** (local dev: `postgresql://return@localhost:5432/quanan`; test DB: `postgresql://return@localhost:5432/quanan_test` per `CLAUDE.md §3`)
  - Production target: Supabase or Neon (managed, includes pgvector + Auth) — AGENTS §2.5
  - Connection: env vars `DATABASE_URL` (Prisma client) + `DIRECT_URL` (Prisma migrations) + `TEST_DATABASE_URL` (`.env.example:16-18`)
  - Client: Prisma 5.22.0 + @prisma/client 5.22.0
  - Singleton: `apps/api/src/lib/prisma.ts:16` (global var pattern; dev-only logging on `query` event)
  - Startup health check: `checkDbConnection()` calls `$queryRaw` `SELECT 1`; exits 1 on failure (`apps/api/src/lib/prisma.ts:33`)
  - Schema source: `prisma/schema.prisma` (declares `extensions = [vector]` and `previewFeatures = ["postgresqlExtensions"]`)
  - Migrations: 4 in `prisma/migrations/` (init 2026-05-07, sessions, cost_log target jsonb, feedback_log fields)
  - Manual SQL kept separately for RLS + vector indexes: `manual_rls.sql`, `manual_admin_rls.sql`, `manual_vector_indexes.sql`
- **pgvector 0.8.0** — Postgres extension; `vector` declared in `prisma/schema.prisma:14`. Used for embeddings on `knowledge_cases / formulas / elements / trending / user_samples / history` per AGENTS §2.3 + LD-011 (no separate vector DB).

**File Storage:**
- Declared in `.env.example`: `S3_BUCKET / S3_REGION / S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY` (lines 24-27)
- AGENTS §2.3 target: S3 / 阿里 OSS / Supabase Storage (max 20MB user upload)
- **Status: NOT WIRED** — no `@aws-sdk/*` or `oss` package in any `package.json`; no upload code in `apps/api/src/`. Deferred to PRD-7+.

**Caching / Queue:**
- **Upstash Redis (REST)** — only Redis path live currently
  - Client: `@upstash/redis` 1.38.0 instantiated at `apps/api/src/workers/llm-gateway/rate-limiter.ts:42`
  - Auth: env vars `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`
  - Use: `@upstash/ratelimit` token bucket — keyed `quanan:rl:{plan}:user:{userId}` (free=50/d, pro=500/d, enterprise=5000/d)
  - Graceful degrade: if `UPSTASH_REDIS_REST_URL` absent, `checkRateLimit()` warns and returns immediately (`apps/api/src/workers/llm-gateway/rate-limiter.ts:77-81`)
- **Local Redis 8.6.3** declared at `redis://localhost:6379` (CLAUDE.md §3, `.env.example REDIS_URL`)
  - **DRIFT: declared but not wired** — no `import 'ioredis'` or `import { createClient } from 'redis'` anywhere in `apps/api/src/`. ioredis is in deps awaiting bullmq use (PRD-6+).
- **bullmq 5.76.6** declared in deps but **no `new Queue` / `new Worker` calls yet** (`grep -rn "from 'bullmq'" apps/api/src` → empty). Reserved for L5 agents per LD-004.

**Browser storage** (per AGENTS §2.3 + LD-010):
- localStorage: 18 keys, namespaced via `apps/web/src/lib/ls-namespace.ts` (account-scoped per LD-009 闸 3)
- sessionStorage: `pendingInviteCode`
- 7 server-only entities (DiagnosisReport / EvolutionProfile / EvolutionInsight / FeedbackLog / DeepLearningArchive / KnowledgeFavorite / TrendingItem) explicitly NOT mirrored to LS

## Authentication & Identity

**Auth Provider Abstraction** (`apps/api/src/lib/auth/providers.ts`):

- **Strategy pattern**: `OAuthProvider` interface with two implementations.
- Provider selected at startup via `OAUTH_PROVIDER` env var (validated in `validateStartupConfig()`); unknown value → `process.exit(1)`.

| Provider | Class | Selector | Use Case | CSRF state check |
|---|---|---|---|:-:|
| Mock | `MockProvider` (`apps/api/src/lib/auth/providers.ts:32`) | `OAUTH_PROVIDER=mock` (default) | Local dev — returns hardcoded `{openId: 'mock-dev-001', email: 'dev@local.test', name: 'Dev User'}` | ❌ skipped |
| Google | `GoogleProvider` (`apps/api/src/lib/auth/providers.ts:54`) | `OAUTH_PROVIDER=google` | Production | ✅ enforced |

- **Google OAuth client**: `arctic` 3.7.0 `Google` class (`apps/api/src/lib/auth/providers.ts:7,59`); requires `GOOGLE_CLIENT_ID` (hard-throw if missing for `google` provider) + `GOOGLE_CLIENT_SECRET` + `GOOGLE_REDIRECT_URL` (defaults `http://localhost:3000/auth/callback`)
- PKCE: `codeVerifier` generated via `arctic.generateCodeVerifier`, stored in 600s httpOnly cookie `oauth_code_verifier`
- State CSRF cookie: `oauth_state` (600s httpOnly, secure in prod) — validated against query param in callback
- ID token decode: `arctic.decodeIdToken` extracts `sub / email / name`
- **Production guard**: `OAUTH_PROVIDER=mock` rejected when `NODE_ENV=production` → `process.exit(1)` (`apps/api/src/lib/auth/providers.ts:146`)

**Session backend**: Lucia 3.2.2
- Singleton: `apps/api/src/lib/auth/lucia.ts:12`
- Cookie name: `app_session` (admin uses `admin_session` per LD-A-1, AGENTS §10)
- Adapter: custom Prisma adapter implementing Lucia v3 `Adapter` interface (`apps/api/src/lib/auth/adapter.ts`); 7 methods backed by `prisma.session` model
- Session attributes: `email / name / activeAccountId` (`apps/api/src/lib/auth/lucia.ts:20-26`)
- TypeScript module augmentation: `declare module 'lucia'` registers `UserId: number` + `DatabaseUserAttributes` (`apps/api/src/lib/auth/lucia.ts:29-39`)

**Session entry/exit endpoints** (`apps/api/src/index.ts`):
- `GET /auth/login` (line 61) — provider.getAuthorizationUrl → set state/codeVerifier cookies → 302 redirect
- `GET /auth/callback` (line 95) — CSRF check → provider.validateCallback → `prisma.user.upsert` (by `openId`) → `lucia.createSession` → cookie + audit log
- `GET /auth/logout` (line 188) — invalidate session + blank cookie

**Audit logging on auth events** (`apps/api/src/index.ts:117, 169`): `prisma.auditLog.create` with `eventType in {auth.login, security_alert}` + `traceId` from `traceStore` (AsyncLocalStorage).

## Monitoring & Observability

**Structured logs:**
- Pino 9.14.0 (`apps/api/src/lib/logger.ts:10`)
- Log level: env `LOG_LEVEL` (default `info`)
- Pretty-print: `pino-pretty` 11.3.0 wired only when `NODE_ENV=development`
- Trace propagation: `AsyncLocalStorage<{ traceId: string }>` exported as `traceStore` (used by Hono trace middleware in `apps/api/src/index.ts:46-55`)
- Trace header: `x-trace-id` echoed back on every response (US-007)

**Error tracking:**
- Sentry envelope `SENTRY_DSN` declared in `.env.example:60`
- **NOT WIRED** — no `@sentry/*` package in any `package.json`. Deferred to pre-launch readiness (CLAUDE.md §7 PRR list).

**Analytics:**
- `PLAUSIBLE_DOMAIN` declared in `.env.example:59`
- **NOT WIRED** — no Plausible script in `apps/web/src/main.tsx` or `apps/web/index.html` checked. Deferred to pre-launch.

**Database audit log:**
- `prisma.auditLog` model (`prisma/schema.prisma`) — append-only, written from:
  - `apps/api/src/index.ts:117` (`security_alert` on OAuth state mismatch)
  - `apps/api/src/index.ts:169` (`auth.login` on successful sign-in)
  - `apps/api/src/trpc/routers/ipAccounts.ts:128` (`account.switch` event)
- All entries carry `traceId` for cross-stack correlation

**Cost tracking (per AGENTS §3 LD-014 / `cost_log` table):**
- Writer: `apps/api/src/workers/llm-gateway/cost-logger.ts` (`writeCostLog` — called from gateway on every LLM call, success or fail)
- Specialist-level writer: `apps/api/src/specialists/base/BaseSpecialist.ts:208` (`_writeCostLog` — `callType='specialist_call'`, includes `target jsonb {stepKey, agentId}`, `provider` derived from model name prefix)
- Decimal: `@prisma/client/runtime/library` `Decimal` type for `costUsd` (currently always `0.000000` — pricing TBD)

## CI/CD & Deployment

**Hosting (target per AGENTS §2.5; not yet deployed):**
- Frontend: Vercel or Cloudflare Pages
- Backend: Railway or Fly.io
- DB: Supabase or Neon

**CI Pipeline:** GitHub Actions (per AGENTS §2.6) — config NOT YET present in repo (`.github/` not located in repo root scan)

**Local dev workflow** (per `package.json` scripts):
- `pnpm dev:web` → vite dev server on :5173 with proxy `/api/trpc → :3000`
- `pnpm dev:api` → `tsx watch src/index.ts` on :3000
- `pnpm dev:admin` → echo placeholder (apps/admin not implemented; AGENTS-Architecture P9.0+)
- `pnpm test` (vitest) / `pnpm test:e2e` (playwright) / `pnpm test:judge` (LLM judge config) / `pnpm test:llm-judge` (custom runner `tests/llm-judge/runner.ts`)
- `pnpm db:migrate:dev` (Prisma migrate dev) / `pnpm db:seed` (`tsx prisma/seed.ts`) / `pnpm db:studio` (Prisma Studio)
- `pnpm audit:redlines / audit:ld / audit:all` — bash scripts under `scripts/` (Opus audit hooks per CLAUDE.md)

## Environment Configuration

**Required env vars** (validated at startup or first call — not all are declared "required" but consequences vary):

| Var | Required | Validation site | Behavior on miss |
|---|:-:|---|---|
| `DATABASE_URL` | ✅ | `apps/api/src/lib/prisma.ts:33` | `process.exit(1)` after `$connect` failure |
| `SESSION_SECRET` (≥32 chars) | ✅ | `apps/api/src/lib/auth/providers.ts:134` | `process.exit(1)` |
| `OAUTH_PROVIDER` | ✅ default `mock` | `apps/api/src/lib/auth/providers.ts:140` | `process.exit(1)` if not in `{mock,google}` |
| `ANTHROPIC_API_KEY` | ✅ for any LLM call | `apps/api/src/workers/llm-gateway/index.ts:91` | throws on first call (caught by retry/fallback) |
| `OPENAI_API_KEY` | ✅ for fallback path | `apps/api/src/workers/llm-gateway/index.ts:97` | throws on fallback (template apology returned) |
| `GOOGLE_CLIENT_ID` | conditional (when `OAUTH_PROVIDER=google`) | `apps/api/src/lib/auth/providers.ts:110` | runtime `Error` returns 500, not exit |
| `GOOGLE_CLIENT_SECRET` | conditional | reads but no validation | empty string fallback `''` |
| `GOOGLE_REDIRECT_URL` | conditional | defaults `http://localhost:3000/auth/callback` | uses default |
| `UPSTASH_REDIS_REST_URL` | optional | `apps/api/src/workers/llm-gateway/rate-limiter.ts:77` | warn + skip rate limit (dev-friendly) |
| `UPSTASH_REDIS_REST_TOKEN` | conditional w/URL | `apps/api/src/workers/llm-gateway/rate-limiter.ts:38` | throws `Upstash not configured` |
| `APP_BASE_URL` | optional | `apps/api/src/index.ts:31` | defaults `http://localhost:5173` |
| `API_BASE_URL` | optional | `apps/api/src/lib/auth/providers.ts:36` | defaults `http://localhost:3000` |
| `PORT` | optional | `apps/api/src/index.ts:218` | defaults 3000 |
| `LOG_LEVEL` | optional | `apps/api/src/lib/logger.ts:16` | defaults `info` |
| `NODE_ENV` | optional | multiple | development-style behavior |

**Frontend env vars** (Vite, prefixed `VITE_`):
- `VITE_API_BASE_URL` (`apps/web/src/lib/trpc.ts:44`) — defaults `http://localhost:3000`

**Secrets location:**
- Local dev: `.env` file (gitignored per `.gitignore:14-19`); `.env.example` is the template
- Production: AGENTS §2.5 spec — Vercel / Railway / Supabase Secret Manager (no in-repo secret files)

## Webhooks & Callbacks

**Incoming:**
- `GET /auth/callback` (`apps/api/src/index.ts:95`) — Google OAuth callback
- `GET /health` (`apps/api/src/index.ts:57`) — liveness probe
- `POST/GET /trpc/*` (`apps/api/src/index.ts:206`) — single tRPC mount; handles 18 routers (analysis, auth, boomGenerate, copywriting, costLog, deepLearning, diagnosis, evolution, history, invite, ipAccounts, knowledge, monetization, privateDomain, stepData, trending, videoAnalysis, videoProduction)

**Outgoing:**
- Anthropic Claude API (HTTPS, via @anthropic-ai/sdk)
- OpenAI API (HTTPS, via openai SDK)
- Upstash Redis REST API (HTTPS, via @upstash/redis)
- Google OAuth 2 token endpoint (via arctic)
- **No Trending vendor calls yet** — `trending.ts` router returns mock data (`apps/api/src/trpc/routers/trending.ts:31`); `TRENDING_VENDOR / TRENDING_API_KEY` declared in `.env.example` (`xinbang | cmm | feigua | official`) but no scraper code (worker dir empty: `apps/api/src/workers/trending-scraper/`). PRD-6 deliverable.

## Streaming / SSE

- tRPC v11 `httpBatchStreamLink` (`apps/web/src/lib/trpc.ts:43`) — supports SSE for streaming procedures
- Server-side SSE: only `CopywritingAgent` (free / boom / step7 modes) currently consumes streams; uses `gateway.stream()` async iterable (`apps/api/src/specialists/CopywritingAgent.ts:274-280`)
- TopicAgent.ts also marked as SSE per commit history but check current code for consumption pattern (US-007 — `feat: TopicAgent step5 22KB 5 category SSE 流式`)
- Fetch headers: client always injects `x-trace-id` per request (`apps/web/src/lib/trpc.ts:51`); `credentials: 'include'` for cookie auth

## Cron / Scheduled Jobs

- Currently NONE wired — `apps/api/src/cron/` directory is empty
- Per AGENTS §2.2 + LD-004: future jobs use `node-cron` 3.0.3 (declared); planned:
  - `DailyTaskAgent` — daily 0:00
  - `TrendingScraper` — every 4h (`TRENDING_FETCH_INTERVAL_HOURS=4` in `.env.example:54`)
  - `EvolutionAgent` — manual / scheduled

## Background Workers / Queues

- Currently NONE wired — `apps/api/src/workers/{file-parser,image-gen,stt,tts,trending-scraper}/` are all empty directories
- Per LD-004: future L5 autonomous agents use bullmq 5.76.6 + ioredis 5.10.1 (both declared, both unused)
- Active worker stubs:
  - `apps/api/src/workers/llm-gateway/` (the only actually-used worker; not a queue worker but the LLM dispatch layer)
  - `apps/api/src/workers/methodology-query/index.ts` (in-memory constants provider used by ContextAssembler)

## DRIFT vs AGENTS.md §2 / §3 (Integrations)

| Spec | Reality | Status |
|---|---|:-:|
| `LD-007 ContextAssembler 唯一入口` | enforced — all 8 specialists call `_contextAssembler.assemble()` via `BaseSpecialist.execute()` | ✅ |
| `R-1 LLMGateway 唯一 SDK 入口` | enforced — `@anthropic-ai/sdk` and `openai` only imported in `apps/api/src/workers/llm-gateway/index.ts` (verified by grep) | ✅ |
| `LD-009 3 道闸 (RLS + Redis ns + ORM where)` | RLS in `prisma/migrations/manual_rls.sql` + admin variant; ORM `where: { accountId }` enforced in tRPC middleware (`apps/api/src/trpc/middleware/account-isolation.ts`); Redis ns N/A (Redis effectively unused except per-user rate-limit key) | 🟡 partial — Redis namespace pending real Redis use |
| AGENTS §2.4 OAuth: `lucia-auth` or `next-auth` | uses `lucia` (renamed package) | 🟡 update doc, not code |
| `node-cron` 3.x for cron | declared, no jobs wired | 🟡 deferred PRD-6+ |
| `bullmq` + `ioredis` for queue | declared, no queues wired | 🟡 deferred PRD-6+ |
| Trending vendor (xinbang/cmm/feigua) | mock router only | 🟡 deferred PRD-6 |
| Sentry / Plausible | declared in `.env.example` only | 🟡 PRR (deferred per CLAUDE.md §7) |
| S3 / OSS upload | env declared, no SDK installed | 🟡 deferred PRD-7+ |
| OpenAI image / STT / TTS | env declared, worker dirs empty | 🟡 deferred PRD-6+ |

---

*Integration audit: 2026-05-09*
