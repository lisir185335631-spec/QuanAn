# Technology Stack

**Analysis Date:** 2026-05-21

## Languages

**Primary:**
- TypeScript 5.6 — all source files in `src/`

**Secondary:**
- None (backend is pure TypeScript/Node.js)

## Runtime

**Environment:**
- Node.js v24.15.0 (LTS)
- ESM modules (`"type": "module"` in `package.json`)

**Package Manager:**
- pnpm 9.15.9 (monorepo workspaces)
- Lockfile: present (`pnpm-lock.yaml` at repo root)

## Frameworks

**Core:**
- Hono v4.5 — HTTP server (with `@hono/node-server` v2.0)
- tRPC v11.0.0-rc (Server) — type-safe RPC framework
- Prisma v5.22 — ORM for PostgreSQL
- BullMQ v5.0 — Redis-backed job queues

**Auth:**
- Lucia v3.2 — session management (cookie-based)
- Arctic v3.7 — OAuth provider adapter (Google, mock)

**Testing:**
- Vitest (no version pinned in package.json devDeps — uses workspace vitest)
- `@testcontainers/postgresql` v10 — integration tests with real PostgreSQL
- `nock` v14 — HTTP mocking

**Build/Dev:**
- tsx v4.19 — TypeScript ESM runner (dev + prod start)
- TypeScript compiler for `typecheck` / `build`

## Key Dependencies

**Critical:**
- `@anthropic-ai/sdk` ^0.30.0 — Anthropic Claude API (used ONLY in `src/workers/llm-gateway/index.ts`)
- `openai` ^4.70.0 — OpenAI API (used ONLY in `src/workers/llm-gateway/index.ts`)
- `@prisma/client` ^5.22.0 — Database access
- `bullmq` ^5.0.0 — Async job processing
- `ioredis` ^5.4.0 — Redis client (BullMQ + shared rate-limit)
- `zod` ^3.23.0 — Runtime schema validation (I/O contracts for all Specialists and routers)

**Infrastructure:**
- `@upstash/ratelimit` ^2.0.0 — Token bucket rate limiting (LLM API quota per user/plan)
- `@upstash/redis` ^1.34.0 — Upstash Redis client for rate limiter
- `pino` ^9.0.0 + `pino-pretty` ^11.0.0 — Structured JSON logging
- `handlebars` ^4.7.8 — Template rendering (prompt templates)
- `node-cron` ^3.0.0 — Cron job scheduling
- `ipaddr.js` ^2.1.0 — IP address parsing (admin IP whitelist)

**Utilities:**
- `papaparse` ^5.5.3 — CSV parsing (admin user export)
- `@react-pdf/renderer` ^4.5.1 — PDF bill generation (admin cost reports)
- `react` 18.3.1 — Required by `@react-pdf/renderer` (server-side only)
- `@stdlib/stats-base-dists-chisquare-cdf` ^0.3.1 — A/B test significance (chi-square)
- `@stdlib/stats-base-dists-t-cdf` ^0.2.3 — A/B test significance (t-test)

**Workspace packages:**
- `@quanan/schemas` — Shared Zod schemas (specialist I/O, specialist-io/*, packages/schemas/src/)
- `@quanan/ui` — Shared UI components (admin PDF template)

## Configuration

**Environment:**
- `DATABASE_URL` — PostgreSQL connection (local: `postgresql://return@localhost:5432/quanqn`)
- `DATABASE_URL_TEST` — Test DB (`postgresql://return@localhost:5432/quanqn_test`)
- `REDIS_URL` — Redis connection (default: `redis://localhost:6379`)
- `ANTHROPIC_API_KEY` — Anthropic Claude API key (optional; fallback mode if absent)
- `OPENAI_API_KEY` — OpenAI fallback API key (optional)
- `LLM_DEFAULT_MODEL` — Default model name (default: `claude-sonnet-4-6`)
- `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` — Rate limiter (skipped in local dev if absent)
- `APP_BASE_URL` — Frontend origin for CORS (default: `http://localhost:5173`)
- `ADMIN_BASE_URL` — Admin SPA origin for CORS (default: `http://localhost:5174`)
- `OAUTH_PROVIDER` + provider-specific keys — Auth
- `ADMIN_OAUTH_*` — Admin Google OAuth
- `NODE_ENV` — `development` | `production` | `test`
- `PORT` — HTTP port (default: `3000`)
- `LOG_LEVEL` — Pino log level (default: `info`)

**LLM Mode:**
- Startup `validateEnv()` in `src/lib/env.ts` determines `llmMode: 'real' | 'fallback'`
- If both `ANTHROPIC_API_KEY` and `OPENAI_API_KEY` are absent, gateway passes through fallback templates

**Build:**
- `tsconfig.json` — extends `../../tsconfig.base.json`, path alias `@/*` → `./src/*`
- Output dir: `./dist`

## Platform Requirements

**Development:**
- Node.js v24.15.0
- PostgreSQL 16.13 (local brew, `postgresql@16` LaunchAgent)
- Redis 8.6.3 (local brew)
- pgvector 0.8.0 extension on PG 16
- pnpm 9.15.9

**Production:**
- Deployment target: TBD (Vercel / Railway / 阿里云 RDS — PRR item)
- BullMQ workers as separate processes
- Standalone `pnpm worker:image-gen` container

---

*Stack analysis: 2026-05-21*
