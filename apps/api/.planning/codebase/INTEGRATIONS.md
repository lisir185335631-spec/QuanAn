# External Integrations

**Analysis Date:** 2026-05-21

## APIs & External Services

**LLM Providers:**
- Anthropic Claude — Primary LLM for all Specialist agents
  - SDK/Client: `@anthropic-ai/sdk` ^0.30.0 (restricted to `src/workers/llm-gateway/index.ts`)
  - Auth: `ANTHROPIC_API_KEY` env var
  - Models: `claude-sonnet-4-6` (reasoning/balanced tier), `claude-haiku-4-5` (lightweight tier)
  - Usage: Non-streaming `messages.create`, structured JSON output via system prompt constraints

- OpenAI — Fallback LLM when Anthropic fails
  - SDK/Client: `openai` ^4.70.0 (restricted to `src/workers/llm-gateway/index.ts`)
  - Auth: `OPENAI_API_KEY` env var
  - Models: `gpt-4o` (fallback for reasoning/balanced), `gpt-4o-mini` (fallback for lightweight)
  - Usage: `chat.completions.create`, JSON mode via `response_format: { type: 'json_object' }`

**Rate Limiting:**
- Upstash Redis — Token bucket rate limiter for LLM API quota
  - SDK/Client: `@upstash/ratelimit` ^2.0.0, `@upstash/redis` ^1.34.0
  - Auth: `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`
  - Plans: free=50/day, pro=500/day, enterprise=5000/day
  - Note: Skipped in local dev if Upstash env vars are absent (warm-path bypass)

**OAuth:**
- Google OAuth (main app) — via `arctic` v3.7
  - Config: `OAUTH_PROVIDER=google` + `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`
  - Callback: `/auth/callback`
- Google OAuth (admin) — separate application
  - Config: `ADMIN_OAUTH_*` env vars
  - Auth: `oauth-admin-google.ts`
- Mock OAuth (dev/test) — `OAUTH_PROVIDER=mock` or `NODE_ENV=development`
  - Dev login shortcut: `GET /auth/dev-login` (development only)

## Data Storage

**Databases:**
- PostgreSQL 16.13 (primary database)
  - Connection env: `DATABASE_URL` (default: `postgresql://return@localhost:5432/quanqn`)
  - Test DB env: `DATABASE_URL_TEST` (`postgresql://return@localhost:5432/quanqn_test`)
  - ORM: Prisma v5.22 via `@prisma/client`
  - Extensions: `pgvector` 0.8.0 for vector similarity search (RAG)
  - RLS: Enforced via `quanan_app` role + `set_config('app.current_account_id', ...)` per request
  - Connection: singleton `prisma` in `src/lib/prisma.ts`
  - Admin tables: RLS disabled (`quanan_admin` role), protected by 6-gate auth chain

**Redis:**
- ioredis v5.4 — Local Redis 8.6.3
  - Connection env: `REDIS_URL` (default: `redis://localhost:6379`)
  - Client: singleton `redis` in `src/lib/redis.ts`
  - Used by: BullMQ queues/workers, rate-limit (ioredis)
  - Config: `maxRetriesPerRequest: null` required for BullMQ blocking operations

**File Storage:**
- No production file storage integrated (pending PRD-7+)
- Deep learning file uploads use `mock-s3://` URLs in P1 (see `deepLearning.createFromFile`)
- File parsing deferred to PRD-7+ with real S3/OSS integration

**Caching:**
- In-memory only (no distributed cache beyond Redis for BullMQ)
- LLM Gateway lazy-initializes Anthropic/OpenAI SDK clients on first use

## Authentication & Identity

**App Auth:**
- Lucia v3.2 — Session-based auth
  - Session cookie: `app_session` (httpOnly, SameSite=Lax)
  - Adapter: custom Prisma adapter (`src/lib/auth/adapter.ts`)
  - Session storage: PostgreSQL `Session` table

**Admin Auth:**
- Lucia v3.2 — Separate admin Lucia instance (`lucia-admin.ts`)
  - Session cookie: `admin_session` (distinct from `app_session` per LD-A-1)
  - 6-gate middleware chain: `adminAuth → adminRLS → roleCheck → mfaCheck → ipWhitelist → approvalGateCheck → auditLog`

**Identity Attributes:**
- `user.email`, `user.name`, `user.activeAccountId` exposed via Lucia `getUserAttributes`
- `activeAccountId` drives RLS enforcement on every protected request

## Monitoring & Observability

**Error Tracking:**
- Not yet integrated (Sentry / OTel deferred to post-PRD deployment — PRR item)
- BullMQ dead-letter: `worker.on('error')` logs to Pino, Sentry integration stubbed with `// P2` comment

**Logs:**
- Pino structured JSON to stdout
- `pino-pretty` in development (colorized, human-readable)
- Trace ID auto-injected via `AsyncLocalStorage` from HTTP layer through all log calls
- Log level: `LOG_LEVEL` env var (default: `info`)

**Cost Tracking:**
- All LLM calls write to `CostLog` table via two paths:
  1. `LLMGateway.writeCostLog()` — `callType='complete'`, records LLM call dimensions
  2. `BaseSpecialist._writeCostLog()` — `callType='specialist_call'`, records Specialist call + `target.stepKey`
  - Known dual-write (TD-013) — intentional dual-layer logging

## CI/CD & Deployment

**Hosting:**
- TBD (Vercel / Railway / 阿里云 RDS — post-14-PRD PRR)

**CI Pipeline:**
- None configured at repo level (planned post-launch)

## Webhooks & Callbacks

**Incoming:**
- `GET /auth/callback` — OAuth callback from Google (state/CSRF validated)
- `GET /admin/auth/callback` — Admin OAuth callback

**Outgoing:**
- None (no outbound webhooks implemented)

## Cron Jobs (server-internal)

All registered at startup in `src/index.ts`:

| Job | Schedule | Purpose |
|-----|----------|---------|
| `dailyTaskCron` | `0 0 * * *` (00:00 Asia/Shanghai) | Daily IP task generation |
| `scheduleDailySnapshot` | BullMQ repeatable | KPI daily snapshot |
| `scheduleWeeklySnapshot` | BullMQ repeatable | KPI weekly snapshot |
| `scheduleMonthlySnapshot` | BullMQ repeatable | KPI monthly snapshot |
| `scheduleAnomalyDetection` | `0 5 * * *` (05:00 Asia/Shanghai) | User anomaly detection |
| `scheduleCostAnomalyDetection` | `15 * * * *` (hourly :15) | LLM cost anomaly alert |
| `scheduleViolationDetection` | `0 4 * * *` (04:00 Asia/Shanghai) | Content violation scan |
| `scheduleEmergencyPostReview` | `30 3 * * *` (03:30 Asia/Shanghai) | Emergency content review |
| `scheduleQuotaCleanup` | `30 0 * * *` (00:30 Asia/Shanghai) | Expired quota cleanup |
| `scheduleAbStopLoss` | `0 * * * *` (hourly) | A/B test stop-loss |
| `constantEmbedWorker` | Event-driven | Rebuild constants embedding after publish |

## Environment Configuration

**Required for full functionality:**
- `DATABASE_URL` — PostgreSQL
- `REDIS_URL` — Redis (BullMQ)
- `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` — at least one for real LLM calls
- `APP_BASE_URL` / `ADMIN_BASE_URL` — CORS origins

**Optional (feature-dependent):**
- `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` — Rate limiting (bypassed locally)
- `OAUTH_PROVIDER` + provider credentials — Authentication (mock in dev)
- `ADMIN_OAUTH_*` — Admin authentication

**Secrets location:**
- Local `.env` file (not committed); referenced via `process.env` directly
- Validated at startup by `src/lib/env.ts` (`validateEnv()`) and `src/lib/auth/providers.ts` (`validateStartupConfig()`)

---

*Integration audit: 2026-05-21*
