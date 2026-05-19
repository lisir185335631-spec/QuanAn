# Technology Stack

**Analysis Date:** 2026-05-09

## Languages

**Primary:**
- TypeScript 5.9.3 (declared `^5.6.0`) — entire monorepo, strict mode enforced
- TSX/JSX (React 18.3.1)

**Secondary:**
- SQL — `prisma/migrations/*.sql` (4 migrations + 3 manual SQL: `manual_admin_rls.sql`, `manual_rls.sql`, `manual_vector_indexes.sql`)
- Bash — `scripts/audit-redlines.sh`, `scripts/audit-ld.sh`, `scripts/audit-all.sh`

## Runtime

**Environment:**
- Node.js 20 LTS (`.nvmrc: 20`, `package.json` engines `>=20`)
- Browser target: ES2022 (`tsconfig.base.json:3`, `apps/web/vite.config.ts:29`)

**Package Manager:**
- pnpm 9.15.9 (declared in root `package.json:9`)
- Lockfile: `pnpm-lock.yaml` present (workspace pinned via `pnpm-workspace.yaml`)
- Workspace: `apps/*` + `packages/*` (7 packages total)

## Frameworks

**Core (frontend — `apps/web`):**
- React 18.3.1 + react-dom 18.3.1 (locked v18, no v19 — AGENTS §2.1)
- Vite 5.4.21 (declared `^5.4.0`) — dev server / build / HMR
- react-router-dom 6.30.3 (SPA routing — `apps/web/src/router.tsx`, 34 routes lazy-chunked)
- Tailwind CSS 3.4.19 + tailwindcss-animate 1.0.7 + prettier-plugin-tailwindcss 0.6.14
- shadcn/ui (copy-style, no npm package) + 12 `@radix-ui/react-*` primitives (avatar / dialog / dropdown-menu / progress / scroll-area / select / separator / slot / tabs / toast / tooltip / popper)
- @tanstack/react-query 5.100.9 — paired with tRPC
- zustand 4.5.7 — global client state
- react-hook-form 7.75.0 + @hookform/resolvers 3.10.0 — all forms must be zod-backed
- lucide-react 0.460.0 — icons
- @fontsource/{manrope,plus-jakarta-sans,inter} 5.2.8 — self-hosted fonts (no Google Fonts CDN)
- react-markdown 9.1.0 + remark-gfm 4.0.1 — markdown rendering for step4 / step7
- sonner 1.7.4 — toast notifications
- class-variance-authority 0.7.0 + clsx 2.1.0 + tailwind-merge 2.5.0 — UI utility chain

**Core (backend — `apps/api`):**
- Hono 4.12.18 (declared `^4.5.0`) — HTTP framework (`apps/api/src/index.ts:15`)
- @hono/node-server 2.0.1 — Node adapter (`apps/api/src/index.ts:12`)
- @trpc/server 11.17.0-rc-derived (declared `^11.0.0-rc.0`) — type-safe RPC (`apps/api/src/index.ts:13`)
- Prisma 5.22.0 + @prisma/client 5.22.0 — ORM (`apps/api/src/lib/prisma.ts:7`)
- Lucia 3.2.2 — session auth (`apps/api/src/lib/auth/lucia.ts:6`)
- Arctic 3.7.0 — OAuth 2 client (Google) (`apps/api/src/lib/auth/providers.ts:7`)
- Pino 9.14.0 + pino-pretty 11.3.0 — structured logging (`apps/api/src/lib/logger.ts:10`)
- @upstash/ratelimit 2.0.8 + @upstash/redis 1.38.0 — token bucket rate limiting (`apps/api/src/workers/llm-gateway/rate-limiter.ts:7-8`)
- ioredis 5.10.1 — declared but currently unused in source
- bullmq 5.76.6 — declared but currently unused (queue infra reserved for L5 agents per LD-004)
- node-cron 3.0.3 — declared but currently unused (reserved for DailyTaskAgent / TrendingScraper)
- handlebars 4.7.9 — declared but currently unused
- zod 3.25.76 — schema validation, full-stack source of truth

**AI SDKs (only allowed in `apps/api/src/workers/llm-gateway/index.ts` per R-1):**
- @anthropic-ai/sdk 0.30.1 — primary reasoning + lightweight (Claude)
- openai 4.104.0 — fallback reasoning + lightweight (GPT-4o / GPT-4o-mini); future image / STT / TTS / embedding

**Testing:**
- Vitest 2.1.9 — unit + integration (`vitest.config.ts`, threshold `lines/funcs/stmts ≥ 80%`, agents ≥ 90%, lib ≥ 95%)
- Vitest Judge runner — separate config `vitest.judge.config.ts` (sequential, 15s timeout, 7 golden cases)
- @playwright/test 1.59.1 — E2E (`playwright.config.ts`, 600s timeout, workers=1, chromium + iPhone 14 Pro projects)
- @testing-library/{react,jest-dom,user-event} (16.3.2 / 6.6.0 / 14.5.0)
- @testcontainers/postgresql 10.28.0 — ephemeral PG for integration tests
- nock 14.0.15 — HTTP mocking
- jsdom 25.0.0 — DOM env for vitest tsx tests
- Custom LLM Judge runner: `tests/llm-judge/runner.ts` (executable via `pnpm test:llm-judge`)

**Build / dev:**
- tsx 4.21.0 — TypeScript execution for dev / scripts (`apps/api: tsx watch src/index.ts`)
- tsc — type checking + apps/api builds (`tsc -b`)
- Turbo 2.9.9 — monorepo task runner (`turbo.json` defines build/dev/test/lint/typecheck)
- @vitejs/plugin-react 4.7.0 — Vite React plugin
- autoprefixer 10.4.20 + postcss 8.4.49 — CSS pipeline

## Key Dependencies

**Critical:**
- @prisma/client 5.22.0 — Single ORM, schema in `prisma/schema.prisma` (PG + pgvector extension declared)
- @trpc/server 11.17.0 + @trpc/client 11.17.0 + @trpc/react-query 11.17.0 — Full-stack types, 18 routers in `apps/api/src/trpc/routers/`
- zod 3.25.76 — Used everywhere; shared via `packages/schemas/src/{entities,step-results,specialist-io,admin}` (4 sub-paths exported)
- lucia 3.2.2 — Sessions; cookie name `app_session` (admin will use `admin_session` per LD-A-1)
- arctic 3.7.0 — Google OAuth provider abstraction; mock provider for dev (`OAUTH_PROVIDER=mock`)
- @anthropic-ai/sdk 0.30.1 + openai 4.104.0 — Wrapped exclusively by `LLMGateway` class (`apps/api/src/workers/llm-gateway/index.ts:104`)

**Infrastructure:**
- ioredis 5.10.1 — declared, awaiting LD-004 L5 agent introduction (PRD-6+)
- bullmq 5.76.6 — declared, awaiting LD-004 (EvolutionAgent / DailyTaskAgent / ImageGen workers)
- node-cron 3.0.3 — declared, awaiting DailyTaskAgent (0-point) and TrendingScraper (4h)
- @upstash/ratelimit 2.0.8 — currently the only Redis path live; falls back to no-op when `UPSTASH_REDIS_REST_URL` not set (`apps/api/src/workers/llm-gateway/rate-limiter.ts:77-81`)

## Configuration

**Environment:**
- `.env.example` (root) — full template; `.env` exists locally and is gitignored
- Required at startup (validated via `validateStartupConfig()` in `apps/api/src/lib/auth/providers.ts:133`):
  - `SESSION_SECRET` (≥32 chars, exit 1 if missing/short)
  - `OAUTH_PROVIDER` (must be `mock` or `google`; `mock` rejected in production)
  - `DATABASE_URL` (validated by `checkDbConnection()` in `apps/api/src/lib/prisma.ts:33`)
- Runtime-checked (per LLMGateway call):
  - `ANTHROPIC_API_KEY` (required for `reasoning`/`lightweight` Claude tiers)
  - `OPENAI_API_KEY` (required for fallback path)
  - `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (rate-limiting; absence → warn + pass through)
- Optional (per `.env.example`):
  - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_REDIRECT_URL`
  - `S3_BUCKET` / `S3_REGION` / `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY`
  - `TRENDING_VENDOR` / `TRENDING_API_KEY` (PRD-6+)
  - `PLAUSIBLE_DOMAIN` / `SENTRY_DSN`
  - `NODE_ENV` / `APP_BASE_URL` / `API_BASE_URL` / `PORT` (default 3000) / `LOG_LEVEL`
  - `RALPH_MODEL` / `OPUS_AUDIT_ENABLED` (Coding 3.0 dev only)

**Build:**
- `tsconfig.json` — root project references → `apps/web` + `apps/api` + `apps/admin` + `packages/{schemas,ui,clients}`
- `tsconfig.base.json` — strict + `noUncheckedIndexedAccess` + `useUnknownInCatchVariables` + path aliases for `@quanan/{schemas,ui,clients}`
- `apps/web/vite.config.ts` — manual chunks (`react`, `trpc`, `ui`), proxy `/api/trpc → :3000`, port 5173
- `turbo.json` — task DAG; `build` and `typecheck` depend on `^build`
- ESLint 8.57.1 — `@typescript-eslint/eslint-plugin` 6.21.0 + import / react-hooks / jsx-a11y plugins (`max-warnings=0`)
- Prettier 3 + `prettier-plugin-tailwindcss` 0.6.14 (autoload tailwind class sort)
- husky 9 + lint-staged 15 — pre-commit eslint + prettier on staged `*.{ts,tsx,css,json,md}`

## Platform Requirements

**Development:**
- Node.js 20+ (per `.nvmrc` and `package.json` engines)
- pnpm 9.15.9
- PostgreSQL 16.13 (local dev: `postgresql://return@localhost:5432/quanan` — confirmed in `CLAUDE.md §3`)
- pgvector 0.8.0 extension installed for PG 16 (DB declares `extensions = [vector]` in `prisma/schema.prisma:14`)
- Redis 8.6.3 (`redis://localhost:6379`) — currently only used by `@upstash/ratelimit` against Upstash REST endpoint; **local Redis not yet wired** (DRIFT vs `.env.example REDIS_URL`)

**Production:**
- Frontend host: Vercel or Cloudflare Pages (AGENTS §2.5 — MVP)
- Backend host: Railway or Fly.io (AGENTS §2.5 — MVP)
- DB: Supabase or Neon (managed PG with pgvector)
- Redis: Upstash REST (currently the only wired Redis path: `@upstash/redis` REST client)
- Build: `pnpm -r build` runs `tsc -b` (api) and `tsc -b && vite build` (web)

## DRIFT vs AGENTS.md §2 (Locked)

| AGENTS.md §2 spec | Lockfile installed | Status | Notes |
|---|---|:-:|---|
| `react` 18.x | 18.3.1 | ✅ | matches |
| `react-router-dom` 6.x | 6.30.3 | ✅ | matches |
| `vite` 5.x | 5.4.21 | ✅ | matches |
| `tailwindcss` 3.4+ | 3.4.19 | ✅ | matches |
| `@tanstack/react-query` 5.x | 5.100.9 | ✅ | matches |
| `zustand` 4.x | 4.5.7 | ✅ | matches |
| `@trpc/client` + `@trpc/react-query` 11.x | 11.17.0 | ✅ | matches |
| `react-hook-form` 7.x + `@hookform/resolvers/zod` | 7.75.0 + 3.10.0 | ✅ | matches |
| `zod` 3.23+ | 3.25.76 | ✅ | matches |
| `lucide-react` latest | 0.460.0 | ✅ | matches |
| `@fontsource/{manrope,plus-jakarta-sans,inter}` | 5.2.8 each | ✅ | matches |
| Node 20 LTS | `.nvmrc: 20`, engines `>=20` | ✅ | matches |
| `hono` 4.x | 4.12.18 | ✅ | matches |
| `@trpc/server` 11.x | 11.17.0 | ✅ | matches |
| `prisma` 5.x | 5.22.0 + @prisma/client 5.22.0 | ✅ | matches |
| `bullmq` + `ioredis` 5.x | 5.76.6 + 5.10.1 | 🟡 declared not used | reserved for PRD-6+ L5 agents (LD-004) |
| `node-cron` 3.x | 3.0.3 | 🟡 declared not used | reserved for DailyTaskAgent / TrendingScraper |
| `pino` + `pino-pretty` 9.x | 9.14.0 + 11.3.0 | ✅ | matches; pino-pretty minor higher than spec example |
| `@upstash/ratelimit` | 2.0.8 | ✅ | matches |
| **`lucia-auth`** (AGENTS §2.2 line 145) | **`lucia` 3.2.2** | 🔴 **DRIFT (naming)** | Package was renamed from `lucia-auth` → `lucia` in v3. Code uses `lucia` throughout. Update AGENTS.md §2.2 to read `lucia` (no functional drift). |
| `claude-sonnet-4-6` (reasoning primary) | hardcoded in `apps/api/src/workers/llm-gateway/index.ts:82` | ✅ | matches AGENTS §2.4 |
| `claude-haiku-4-5` (lightweight primary) | hardcoded in `apps/api/src/workers/llm-gateway/index.ts:83` | ✅ | matches AGENTS §2.4 |
| `gpt-4o` / `gpt-4o-mini` (fallback) | hardcoded in `apps/api/src/workers/llm-gateway/index.ts:82-83` | ✅ | matches AGENTS §2.4 |
| `dall-e-3` / `whisper` / `tts-1-hd` / `text-embedding-3-small` | not yet wired | 🟡 deferred | `embed()` returns zero-vector stub (`apps/api/src/workers/llm-gateway/index.ts:175`); image/STT/TTS workers exist as empty dirs |
| pnpm | 9.15.9 | ✅ | matches |
| TS strict + `noUncheckedIndexedAccess` | enforced (`tsconfig.base.json:23`) | ✅ | matches |
| vitest + playwright | 2.1.9 + 1.59.1 | ✅ | matches |
| eslint + plugins | 8.57.1 + plugins listed in root `package.json:47-55` | ✅ | matches |
| husky + lint-staged | 9.1 + 15.2 | ✅ | matches |
| **(prompt hint)** TanStack Router | **react-router-dom 6.30.3** | 🔴 **prompt hint wrong** | Prompt described stack as "TanStack Router" but actual + AGENTS-locked = `react-router-dom`. AGENTS §2.1 line 118 is authoritative. |

## Tech Introduced During PRD-1 ~ PRD-5

Inferred from `git log` (137 commits since 2026-04, lockfile dates align):
- **PRD-1 / PRD-2 (foundation)**: hono, @hono/node-server, @trpc/server, prisma, @prisma/client, pino, lucia, arctic, zod, @upstash/ratelimit, @upstash/redis (foundation: 2026-05-07 init migration `20260507000000_init`)
- **PRD-3 (frontend shell)**: react-router-dom, react, react-dom, all @radix-ui/* primitives, @tanstack/react-query, @trpc/client, @trpc/react-query, sonner, react-hook-form, @hookform/resolvers, lucide-react, @fontsource/*, react-markdown, remark-gfm, zustand
- **PRD-4 (Specialist foundation)**: @anthropic-ai/sdk, openai (added with first specialist `BrandingAgent.ts` etc, commit `b4cfcd0` `e5acb34`), nock + @testcontainers/postgresql for integration tests
- **PRD-5 (creation modules · current state)**: no new core deps; analysis/copywriting/videoAnalysis/boomGenerate/history routers added (all Prisma + zod), LLM Judge config introduced (`vitest.judge.config.ts`), playwright `mobile` project added

**Current verification baseline** (from prompt): 542 vitest + 22 judge + 126 e2e + 6-workspace typecheck 0 errors + lint 0 warnings.

---

*Stack analysis: 2026-05-09*
