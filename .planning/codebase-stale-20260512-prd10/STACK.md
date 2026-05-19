# Technology Stack

**Analysis Date:** 2026-05-11

## Languages

**Primary:**
- TypeScript 5.6+ (`^5.6.0` declared in every workspace) — entire monorepo, `strict` + `noUncheckedIndexedAccess` enforced (`tsconfig.base.json:21-28`)
- TSX/JSX — React 18.3 components in `apps/web/src/**` and `apps/admin/src/**` (admin still scaffold)

**Secondary:**
- SQL — `prisma/migrations/*.sql` (5 generated migrations + 3 manual SQL files: `manual_admin_rls.sql`, `manual_rls.sql`, `manual_vector_indexes.sql`)
- Bash — `scripts/audit-redlines.sh`, `scripts/audit-ld.sh`, `scripts/audit-all.sh`, `scripts/seed-reject-examples.sh`

## Runtime

**Environment:**
- Node.js 20 LTS (`.nvmrc: 20`, root `package.json` engines `>=20`)
- Browser target: ES2022 (`tsconfig.base.json:3`)
- Two server processes in prod plan: `apps/api` (Hono :3000) + standalone BullMQ worker process (`pnpm worker:image-gen`) — dev mode runs both in-process from `apps/api/src/index.ts:225-234`

**Package Manager:**
- pnpm 9.15.9 (declared `packageManager` field, root `package.json:9`)
- Lockfile: `pnpm-lock.yaml` present (10298 lines)
- Workspace: `pnpm-workspace.yaml` → `apps/*` + `packages/*` (7 workspaces total: `apps/web`, `apps/api`, `apps/admin`, `packages/schemas`, `packages/clients`, `packages/ui`, root)

## Frameworks

**Core (frontend — `apps/web`):**
- React 18.3 + react-dom 18.3 (locked v18 — AGENTS §2.1)
- Vite 5.4 — dev server / build / HMR (`apps/web/vite.config.ts`)
- react-router-dom 6.27 (SPA routing — `apps/web/src/router.tsx`, ~34 lazy-chunked routes: 9 step + 14 tool + 6 module + auxiliary)
- Tailwind CSS 3.4 + tailwindcss-animate 1.0.7 + prettier-plugin-tailwindcss 0.6
- shadcn/ui (copy-style, no npm) + 11 `@radix-ui/react-*` primitives (avatar / dialog / dropdown-menu / progress / scroll-area / select / separator / slot / tabs / toast / tooltip)
- @tanstack/react-query 5.59 — paired with tRPC
- zustand 4.5 — declared, **no `from 'zustand'` import currently in `apps/web/src/**`** (grep empty); reserved for future global state
- react-hook-form 7.53 + @hookform/resolvers 3.9 — all forms zod-backed (used in `apps/web/src/components/StepForm/*.tsx`, `ToolForm/*.tsx`)
- lucide-react 0.460 — icons
- @fontsource/{inter,manrope,plus-jakarta-sans} 5.0 — self-hosted fonts (no Google Fonts CDN)
- react-markdown 9.0 + remark-gfm 4.0 — markdown rendering for step4 / step7 / VideoAnalysisResult / BoomGenerateResult / FreeGenerateResult
- recharts 3.8 — single use site `apps/web/src/pages/modules/Evolution.tsx:15` (level progression chart)
- sonner 1.7 — toast notifications (`apps/web/src/App.tsx:1`)
- class-variance-authority 0.7 + clsx 2.1 + tailwind-merge 2.5 — UI utility chain

**Core (backend — `apps/api`):**
- Hono 4.5 — HTTP framework (`apps/api/src/index.ts:15`)
- @hono/node-server 2.0 — Node adapter (`apps/api/src/index.ts:12`)
- @trpc/server 11 RC — type-safe RPC (`apps/api/src/index.ts:13`)
- Prisma 5.22 + @prisma/client 5.22 — single ORM (`apps/api/src/lib/prisma.ts`)
- Lucia 3.2 — session auth (`apps/api/src/lib/auth/lucia.ts:6`)
- Arctic 3.7 — OAuth 2 client (Google) (`apps/api/src/lib/auth/providers.ts:7`)
- Pino 9.0 + pino-pretty 11.0 — structured logging (`apps/api/src/lib/logger.ts:10`)
- @upstash/ratelimit 2.0 + @upstash/redis 1.34 — token bucket rate limiting against LLM gateway (`apps/api/src/workers/llm-gateway/rate-limiter.ts:7-8`)
- ioredis 5.4 — **now live** (PRD-6 introduced shared singleton `apps/api/src/lib/redis.ts:9`); used by BullMQ + L1 Buffer + per-feature rate limits
- bullmq 5.0 — **now live** (PRD-6 + PRD-8); 4 queues active: `image-gen`, `evolution`, `daily-task` (file-parser planned)
- node-cron 3.0 — **now live** (PRD-8 US-007); single job `0 0 * * * Asia/Shanghai` daily-task fan-out (`apps/api/src/cron/daily-task-runner.ts:68`)
- handlebars 4.7 — declared, **not yet imported** anywhere under `apps/api/src/` (grep empty; reserved for future prompt templating)
- zod 3.23 — schema validation, full-stack source of truth (shared via `packages/schemas/`)

**AI SDKs (4 import sites total per R-001):**
- @anthropic-ai/sdk 0.30 — **only `apps/api/src/workers/llm-gateway/index.ts:19`** (sole LLM Gateway path)
- openai 4.70 — **4 worker import sites only**, each documented as D-038 exemption:
  - `apps/api/src/workers/llm-gateway/index.ts:21` (Anthropic fallback path)
  - `apps/api/src/workers/image-gen/dall-e-3.ts:11` (DALL-E 3 — PRD-6)
  - `apps/api/src/workers/stt/whisper.ts:10` (Whisper-1 — PRD-8 US-009)
  - `apps/api/src/workers/tts/openai-tts.ts:11` (TTS-1 — PRD-8 US-010)

**Models in use:**
- LLM (via LLMGateway, `apps/api/src/workers/llm-gateway/index.ts:81-84`):
  - `claude-sonnet-4-6` (reasoning primary) + `gpt-4o` (fallback)
  - `claude-haiku-4-5` (lightweight primary) + `gpt-4o-mini` (fallback)
- Image: `dall-e-3` 1024×1024 standard quality (`apps/api/src/workers/image-gen/dall-e-3.ts:149-154`) — $0.04/image
- STT: `whisper-1` `response_format='text'` `language='zh'` (`apps/api/src/workers/stt/whisper.ts:86-91`) — $0.006/min
- TTS: `tts-1` voice=`nova` default `response_format='mp3'` (`apps/api/src/workers/tts/openai-tts.ts:60-65`) — $0.015/1K chars
- Embedding: stub `Promise<number[1536]>` of zeros (`apps/api/src/workers/llm-gateway/index.ts:175`) — `text-embedding-3-small` deferred to PRD-9 RAG

**Testing:**
- Vitest 2.1 — unit + integration (`vitest.config.ts`, coverage thresholds `lines/funcs/stmts ≥ 80%`, agents ≥ 90%, lib ≥ 95%)
- Vitest Judge runner — separate config `vitest.judge.config.ts` (sequential, 15s per case, golden cases under `tests/llm-judge/`)
- @playwright/test 1.48 — E2E (`playwright.config.ts`, 600s timeout, `workers=1`, projects `chromium` + `iPhone 14 Pro mobile`)
- @testing-library/{react,jest-dom,user-event} (16 / 6.6 / 14.5)
- @testcontainers/postgresql 10 — ephemeral PG for integration tests
- nock 14 — HTTP mocking
- jsdom 25 — DOM env for `apps/web` vitest tests
- Custom LLM Judge runner: `tests/llm-judge/runner.ts` (`pnpm test:llm-judge`)

**Build / dev:**
- tsx 4.19 — TypeScript execution for dev / scripts (`apps/api: tsx watch src/index.ts`)
- tsc — type checking + builds (`tsc -b` for `apps/api`)
- Turbo 2.0 — monorepo task runner (`turbo.json`: build/dev/test/lint/typecheck DAG)
- @vitejs/plugin-react 4.3 — Vite React plugin
- autoprefixer 10.4 + postcss 8.4 — CSS pipeline

## Key Dependencies

**Critical:**
- @prisma/client 5.22 — single ORM, schema `prisma/schema.prisma` (PG + pgvector extension declared `extensions = [vector]`)
- @trpc/server 11 + @trpc/client 11 + @trpc/react-query 11 — full-stack types, 25 routers mounted in `apps/api/src/trpc/routers/_app.ts:33-57`
- zod 3.23 — used everywhere; shared via `packages/schemas/src/{entities,step-results,specialist-io,admin}` (4 sub-paths exported in `packages/schemas/package.json:8-13`)
- lucia 3.2 — sessions; cookie name `app_session` (admin will use `admin_session` per LD-A-1)
- arctic 3.7 — Google OAuth abstraction; `MockProvider` for dev (`OAUTH_PROVIDER=mock`, default) vs `GoogleProvider` for prod
- ioredis 5.4 — shared singleton `apps/api/src/lib/redis.ts`; underpins BullMQ + L1 Buffer + 3 daily-rate-limit counters

**Infrastructure (now wired):**
- bullmq 5.0 — 4 queues: `image-gen` (concurrency=2), `evolution` (concurrency=5, jobId-deduped per accountId), `daily-task` (concurrency=5) — file-parser dir present with `.gitkeep` only
- node-cron 3.0 — `dailyTaskCron` (`apps/api/src/cron/daily-task-runner.ts:68`), started in `apps/api/src/index.ts:237-239`
- @upstash/ratelimit 2.0 — LLM gateway token bucket; falls back to no-op when `UPSTASH_REDIS_REST_URL` not set (`apps/api/src/workers/llm-gateway/rate-limiter.ts:77-81`)

**Per-feature rate limits (PRD-6/PRD-8, all on shared ioredis):**
- `IMAGE_GEN_DAILY_LIMIT_PER_USER` default 10/day (`apps/api/src/lib/rate-limit/image-gen.ts`)
- `STT_DAILY_LIMIT_PER_USER` default 50/day (`apps/api/src/lib/rate-limit/stt.ts`)
- `TTS_DAILY_LIMIT_PER_USER` default 100/day (`apps/api/src/lib/rate-limit/tts.ts`)
- Key pattern: `rate:{feature}:user:{accountId}:{YYYY-MM-DD}` with `EXPIRE 86400`

## 5-Layer Memory Architecture (LD-002 · PRD-8 US-001)

| Layer | Storage | Module | Use site |
|-------|---------|--------|----------|
| L1 short-term | Redis List | `apps/api/src/memory/l1-buffer.ts` | VoiceChatAgent — max 20 turns, 1800s TTL, key `voice_chat:acc_{accountId}:turns` |
| L2 session | `step_data` table (Prisma) | `prisma.stepData.findMany` | ContextAssembler 5-route fetch (`apps/api/src/services/context-assembler/ContextAssembler.ts:46`) |
| L3 history | `histories` table + `content_embedding vector(1536)` | Prisma + pgvector ivfflat (`prisma/migrations/manual_vector_indexes.sql:30-33`, commented MVP-off) | RAG retrieval (PRD-9, currently stubbed empty) |
| L4 evolution | `evolution_profile.latestInsight` (jsonb) + `evolution_insights` (history) | `apps/api/src/memory/l4-profile.ts:getLatestInsight` | ContextAssembler injects to 11 generative specialists (D-054) |
| L5 trending | `trending_items` table + `content_embedding vector(1536)` | `apps/api/src/memory/l5-trending.ts` (returns `[]` placeholder) | TopicAgent / Trending router (PRD-9 deliverable) |

## Configuration

**Environment template:**
- `.env.example` (root, 86 lines) — covers DB / Redis / S3 / AI keys / OAuth / Trending / monitoring / Coding 3.0 dev knobs
- `.env` exists locally and is gitignored

**Required at startup** (validated via `validateStartupConfig()` in `apps/api/src/lib/auth/providers.ts:133`):
- `SESSION_SECRET` (≥32 chars; `process.exit(1)` if missing/short)
- `OAUTH_PROVIDER` (`mock` | `google`; `mock` rejected in production)
- `DATABASE_URL` (validated via `checkDbConnection()` in `apps/api/src/lib/prisma.ts:33`)

**Runtime-checked (first call):**
- `ANTHROPIC_API_KEY` — fail fast in `LLMGateway.complete()` (`apps/api/src/workers/llm-gateway/index.ts:121-123`)
- `OPENAI_API_KEY` — required for any of 4 import sites; throws if missing
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` — gateway rate-limiting; absent → warn + pass
- `REDIS_URL` — defaults `redis://localhost:6379` (`apps/api/src/lib/redis.ts:9`)

**Feature flags / quotas:**
- `IMAGE_GEN_ENABLED` (default `false` in dev; `true` triggers real DALL-E 3 calls)
- `IMAGE_GEN_DAILY_LIMIT_PER_USER` (default 10), `IMAGE_GEN_MAX_SCENES_PER_REQUEST` (default 8)
- `STT_DAILY_LIMIT_PER_USER` (default 50), `TTS_DAILY_LIMIT_PER_USER` (default 100)
- `TRENDING_VENDOR` (`xinbang | cmm | feigua | official`) + `TRENDING_API_KEY` + `TRENDING_FETCH_INTERVAL_HOURS` (default 4) — declared, no scraper wired
- `RALPH_MODEL` / `OPUS_AUDIT_ENABLED` (Coding 3.0 dev only)

**Build:**
- `tsconfig.json` — root project references → `apps/{web,api,admin}` + `packages/{schemas,ui,clients}`
- `tsconfig.base.json` — strict + `noUncheckedIndexedAccess` + `useUnknownInCatchVariables` + path aliases `@quanan/{schemas,ui,clients}`
- `turbo.json` — `build`/`typecheck` depend on `^build`
- ESLint 8.57 — `@typescript-eslint/eslint-plugin` 6.21 + import / react / react-hooks / jsx-a11y plugins (`--max-warnings=0`)
- Prettier 3 + `prettier-plugin-tailwindcss` 0.6 (class sort)
- husky 9 + lint-staged 15 — pre-commit eslint + prettier on staged `*.{ts,tsx,css,json,md}`

## Platform Requirements

**Development (verified local, 2026-05-07):**
- Node.js 20+ (per `.nvmrc` and `package.json` engines)
- pnpm 9.15.9
- PostgreSQL 16.13 local (brew, `postgresql://return@localhost:5432/quanan` + `_test`)
- pgvector 0.8.0 extension (DB declares `extensions = [vector]` in `prisma/schema.prisma:14`)
- Redis 8.6.3 local (brew, `redis://localhost:6379`) — used by **3 active subsystems**: BullMQ (`apps/api/src/lib/redis.ts`), L1 Buffer (`apps/api/src/memory/l1-buffer.ts`), 3 daily-rate-limit counters (`apps/api/src/lib/rate-limit/*.ts`)
- `.gitattributes` enforces LF line endings for `*.ts/tsx/sh/py/json/md/sql/yaml/prisma`

**Production (target per AGENTS §2.5; not yet deployed):**
- Frontend host: Vercel or Cloudflare Pages
- Backend host: Railway or Fly.io
- DB: Supabase or Neon (managed PG + pgvector + connection pooling)
- Redis: Upstash REST (only the gateway rate-limiter currently uses Upstash; the BullMQ/L1/feature-rate stack uses **local ioredis**, which will need a managed Redis target for prod)
- Standalone worker process: `pnpm worker:image-gen` (containerized) — `apps/api/src/workers/image-gen/worker.ts` runs in-process for `NODE_ENV=development` and as standalone in prod

## DRIFT vs AGENTS.md §2 (Locked)

| AGENTS.md §2 spec | Lockfile installed | Status | Notes |
|---|---|:-:|---|
| `react` 18.x | 18.3.x | ✅ | matches |
| `react-router-dom` 6.x | 6.27.x | ✅ | matches |
| `vite` 5.x | 5.4.x | ✅ | matches |
| `tailwindcss` 3.4+ | 3.4.x | ✅ | matches |
| `@tanstack/react-query` 5.x | 5.59.x | ✅ | matches |
| `zustand` 4.x | 4.5.x | 🟡 | declared in `apps/web/package.json`, **0 imports** in `apps/web/src/**`; reserved for global state |
| `@trpc/{client,server,react-query}` 11.x | 11 RC | ✅ | matches |
| `react-hook-form` 7.x + `@hookform/resolvers/zod` | 7.53.x + 3.9.x | ✅ | matches |
| `zod` 3.23+ | 3.23.x | ✅ | matches |
| `lucide-react` latest | 0.460.x | ✅ | matches |
| `recharts` | 3.8.x | ✅ | matches (added in PRD-8 for Evolution module chart) |
| `@fontsource/{manrope,plus-jakarta-sans,inter}` | 5.0.x each | ✅ | matches |
| Node 20 LTS | `.nvmrc: 20`, engines `>=20` | ✅ | matches |
| `hono` 4.x | 4.5.x | ✅ | matches |
| `prisma` 5.x | 5.22.x | ✅ | matches |
| `bullmq` + `ioredis` 5.x | 5.0.x + 5.4.x | ✅ | **NOW WIRED** (PRD-6: image-gen queue; PRD-8: evolution + daily-task + L1 Buffer) |
| `node-cron` 3.x | 3.0.x | ✅ | **NOW WIRED** (PRD-8 US-007: daily-task cron `0 0 * * * Asia/Shanghai`) |
| `pino` + `pino-pretty` | 9.0.x + 11.0.x | ✅ | matches |
| `@upstash/ratelimit` + `@upstash/redis` | 2.0.x + 1.34.x | ✅ | matches |
| **`lucia-auth`** (AGENTS §2.2) | **`lucia` 3.2.x** | 🔴 **DRIFT (naming only)** | package renamed from `lucia-auth` → `lucia` in v3. Code uses `lucia` everywhere. Update AGENTS.md §2.2 string — no functional drift. |
| `claude-sonnet-4-6` (reasoning primary) | hardcoded `apps/api/src/workers/llm-gateway/index.ts:82` | ✅ | matches AGENTS §2.4 |
| `claude-haiku-4-5` (lightweight primary) | hardcoded `:83` | ✅ | matches |
| `gpt-4o` / `gpt-4o-mini` (fallback) | hardcoded `:82-83` | ✅ | matches |
| `dall-e-3` | `apps/api/src/workers/image-gen/dall-e-3.ts:149` | ✅ | **NOW WIRED** (PRD-6 US-009) |
| `whisper-1` | `apps/api/src/workers/stt/whisper.ts:88` | ✅ | **NOW WIRED** (PRD-8 US-009) |
| `tts-1` | `apps/api/src/workers/tts/openai-tts.ts:61` | ✅ | **NOW WIRED** (PRD-8 US-010) |
| `text-embedding-3-small` | not wired (stub returns zero-vector) | 🟡 deferred | `apps/api/src/workers/llm-gateway/index.ts:175` — PRD-9 RAG deliverable |
| `handlebars` | 4.7.x declared, 0 imports | 🟡 unused | reserved for future prompt templating; current ContextAssembler builds strings directly |
| pnpm | 9.15.9 | ✅ | matches |
| TS strict + `noUncheckedIndexedAccess` | enforced `tsconfig.base.json:23-28` | ✅ | matches |
| vitest + playwright | 2.1.x + 1.48.x | ✅ | matches |
| eslint + plugins | 8.57.x + plugins per root `package.json:47-55` | ✅ | matches |
| husky + lint-staged | 9.1.x + 15.2.x | ✅ | matches |

## Tech Introduced During PRD-6 / PRD-7 / PRD-8

Tracking lockfile + commit deltas since `.planning/codebase-stale-20260509-prd5/STACK.md`:

**PRD-6 (P5 video module · 2026-05-10):**
- BullMQ wired live for first time — `image-gen` queue (`apps/api/src/workers/image-gen/{queue,worker,dall-e-3}.ts`)
- ioredis shared singleton introduced (`apps/api/src/lib/redis.ts`)
- OpenAI SDK 2nd import site (DALL-E 3 — D-038 exemption documented at `apps/api/src/workers/image-gen/dall-e-3.ts:2-4`)
- `Asset` schema extended with `sceneIndex` field (PRD-6 storyboard scenes — migration `20260510000000_add_scene_index_to_assets`)
- Per-feature rate limits begun (`apps/api/src/lib/rate-limit/image-gen.ts`)
- recharts added (visible only in PRD-8 Evolution page; reserved during PRD-6)
- New tRPC routers: `acquisitionVideo`, `aiVideo`

**PRD-7 (cleanup PRD · no new core deps):** TD resolutions only — schema field SoT lock-in (TD-022), ralph daemon hygiene; no stack additions.

**PRD-8 (P7 智能模块 · current state):**
- 14 Specialist set completed: `VoiceChatAgent.ts`, `EvolutionAgent.ts` (`apps/api/src/agents/evolution/EvolutionAgent.ts`), `DailyTaskAgent.ts`, `DeepLearnAgent.ts`, `DiagnosisAgent.ts`, `PrivateDomainAgent.ts` added to `apps/api/src/specialists/`
- 5-layer memory schema landed: `prisma.evolutionInsight`, `evolutionProfile.latestInsight` jsonb, `feedbackLog.consumedByEvolution / consumedAt / consumedByInsightId`, `voice_chat:acc_{accountId}:turns` Redis List
- L1 Buffer module (`apps/api/src/memory/l1-buffer.ts`) — first real Redis List use
- L4 helpers (`apps/api/src/memory/l4-profile.ts`: `getLatestInsight`, `getDeepLearningSamples`)
- L5 placeholder (`apps/api/src/memory/l5-trending.ts` — returns `[]` for PRD-9)
- 2 new queues wired: `evolution` (US-002, US-003 — jobId-deduped per accountId via `evo:{accountId}:{count}`), `daily-task` (US-007)
- 1 new cron job: `dailyTaskCron` (`apps/api/src/cron/daily-task-runner.ts`)
- 2 new OpenAI SDK import sites (D-038 audio worker exemptions): `apps/api/src/workers/stt/whisper.ts`, `apps/api/src/workers/tts/openai-tts.ts`
- 2 more per-feature rate limits: `apps/api/src/lib/rate-limit/stt.ts`, `apps/api/src/lib/rate-limit/tts.ts`
- 4 new tRPC routers: `voiceChat` (subscription/streaming), `stt`, `tts`, `dailyTasks`, `evolution`
- VoiceChatAgent SHIELD pattern: `outputSchema = z.never()` (streaming + tool-calling specialist; `execute()` fully overridden, `BaseSpecialist` template-method bypassed; `apps/api/src/specialists/VoiceChatAgent.ts:154`)
- `consumedByEvolution` workflow: feedback → atomic threshold trigger `enqueueIfThresholdMet` (`apps/api/src/lib/evolution/trigger.ts:20`) → BullMQ → `EvolutionAgent.execute` writes `evolution_insights` + updates `evolution_profile` in `prisma.$transaction`
- ContextAssembler upgraded to 5-route `Promise.allSettled` (`apps/api/src/services/context-assembler/ContextAssembler.ts:44-51`) — adds L4 EvolutionInsight as 5th parallel fetch (D-054 · injects to 11 generative specialists)
- PII mask + sensitive-industry disclaimer middleware (`apps/api/src/lib/compliance/{pii-mask,disclaimer}.ts`)
- 5 new lib constants (PRD-8 enums): `sttLimits.ts`, `ttsLimits.ts`, `evolution.ts`, `videoTypes.ts`, `videoDurations.ts`, `privateDomain.ts`, `imageStyles.ts`, `diagnosis.ts`

**Current verification baseline** (per PRD-8 final state commit `fe41dc1`): vitest + judge + e2e + 6-workspace typecheck + lint all green; 25 tRPC routers, 14 Specialists, 4 BullMQ queues, 1 cron job, 6 OpenAI/Anthropic SDK import sites (1 Anthropic + 4 OpenAI worker exemptions + LLMGateway openai for fallback).

---

*Stack analysis: 2026-05-11*
