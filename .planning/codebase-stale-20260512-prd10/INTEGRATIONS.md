# External Integrations

**Analysis Date:** 2026-05-11

## APIs & External Services

### AI / LLM (per LD-012 · R-001 · D-038)

**Anthropic Claude API** — primary reasoning + lightweight tier (sole-import chokepoint R-001):
- SDK: `@anthropic-ai/sdk` 0.30 — **only imported in `apps/api/src/workers/llm-gateway/index.ts:19`** (AC-7 comment marks this file as the sole allowed site)
- Models (`apps/api/src/workers/llm-gateway/index.ts:81-84`):
  - `claude-sonnet-4-6` — reasoning tier primary
  - `claude-haiku-4-5` — lightweight tier primary
- Auth: env `ANTHROPIC_API_KEY` (lazy client `getAnthropicClient()` at `:90`; fail-fast at `:121-123`)
- Timeouts: 60s reasoning / 30s lightweight; `AbortController` wired to `client.messages.create` (`:225-233`)
- Payload + parser: `apps/api/src/workers/llm-gateway/anthropic-provider.ts` (`buildAnthropicPayload` / `parseAnthropicResponse` / `isAnthropicModel`)

**OpenAI API** — multi-use; **4 worker import sites** (LLMGateway + 3 D-038 audio/image worker exemptions):
- SDK: `openai` 4.70 — imported at:
  1. `apps/api/src/workers/llm-gateway/index.ts:21` — fallback reasoning/lightweight (AC-8 chokepoint for chat completions)
  2. `apps/api/src/workers/image-gen/dall-e-3.ts:11` — DALL-E 3 image gen (PRD-6 US-009 · D-038 exemption documented at file header)
  3. `apps/api/src/workers/stt/whisper.ts:10` — Whisper-1 STT (PRD-8 US-009 · D-038 exemption)
  4. `apps/api/src/workers/tts/openai-tts.ts:11` — TTS-1 (PRD-8 US-010 · D-038 exemption)
- Each non-LLMGateway file carries `D-038: OpenAI {audio,image} API 仅限本文件 import · 不走 LLMGateway` comment to satisfy R-001 audit (e.g. `apps/api/src/workers/stt/whisper.ts:2-4`)
- Models used:
  - `gpt-4o` (fallback for reasoning), `gpt-4o-mini` (fallback for lightweight) — `apps/api/src/workers/llm-gateway/index.ts:81-84`
  - `dall-e-3` 1024×1024 standard quality, n=1 — `apps/api/src/workers/image-gen/dall-e-3.ts:149-154`; cost `$0.04/image`
  - `whisper-1`, `response_format='text'`, `language='zh'` — `apps/api/src/workers/stt/whisper.ts:86-91`; cost `$0.006/min` (`STT_COST_USD_PER_MIN`)
  - `tts-1`, voice=`nova` default, `response_format='mp3'` — `apps/api/src/workers/tts/openai-tts.ts:60-65`; cost `$0.015/1K chars` (`TTS_COST_USD_PER_1K_CHARS`)
  - `text-embedding-3-small` — **not yet wired** (LLMGateway `embed()` stub returns 1536-zero vector, `apps/api/src/workers/llm-gateway/index.ts:175`); PRD-9 RAG deliverable
- Auth: env `OPENAI_API_KEY` (per-call lazy `new OpenAI({ apiKey, timeout, maxRetries })` in each worker; LLMGateway uses cached singleton `getOpenAIClient()` at `:96`)
- Timeouts: `STT_TIMEOUT_MS` 30s · `TTS_TIMEOUT_MS` 30s · `IMAGE_GEN` 30s · LLM 30s/60s by tier

**LLMGateway invocation flow** (`apps/api/src/workers/llm-gateway/index.ts:111`):
```
Specialist → BaseSpecialist.execute() → contextAssembler.assemble()
          → llmGateway.complete(req) | llmGateway.stream(req)
          → checkRateLimit(userId)            [Upstash REST]
          → primary call (Anthropic, retry=1)
          → on primary failure → fallback (OpenAI, retry=0)
          → both fail → templated apology + cost_log(success=false, errorCode='BOTH_FAILED')
          → writeCostLog (always, success true/false)
          → return CompleteResponse (with optional .fallback metadata)
```

**14 Specialists** (per LD-002 · all 14 live as of PRD-8):

In `apps/api/src/specialists/`:
1. `PositioningAgent.ts` — step 1-2
2. `BrandingAgent.ts` — step 3 / 3b
3. `MonetizationAgent.ts` — step 4b
4. `TopicAgent.ts` — step 5, SSE streaming
5. `CopywritingAgent.ts` — step 7 + `free` + `boom` + `acquisition` modes, SSE streaming
6. `VideoAgent.ts` — step 6 shooting + analysis + storyboard modes (PRD-6)
7. `LivestreamAgent.ts` — step 8
8. `AnalysisAgent.ts` — lightweight tier · structural + viral modes
9. `PrivateDomainAgent.ts` — 6-stage private domain plan
10. `DiagnosisAgent.ts` — 8-dim diagnosis report
11. `DeepLearnAgent.ts` — sample ingestion + style vector (PRD-8 US-002 skeleton)
12. **`VoiceChatAgent.ts`** — L5 autonomous · streaming + 5 tools function calling + L1 Buffer (PRD-8 US-011) — overrides `execute()`, sets `outputSchema = z.never()` (SHIELD pattern, `apps/api/src/specialists/VoiceChatAgent.ts:154`)
13. **`EvolutionAgent.ts`** — L5 autonomous · `apps/api/src/agents/evolution/EvolutionAgent.ts` — atomic threshold trigger + `prisma.$transaction` for `evolution_insights` + `evolution_profile.update` (PRD-8 US-003)
14. **`DailyTaskAgent.ts`** — L5 autonomous · driven by node-cron `0 0 * * * Asia/Shanghai` + BullMQ fan-out (PRD-8 US-007)

All 14 extend `BaseSpecialist<TIn, TOut>` (`apps/api/src/specialists/base/BaseSpecialist.ts:41`); template-method `execute()` enforces input zod parse → context assembly → invokeLLM (1 retry on schema fail) → cost_log write. EvolutionAgent + VoiceChatAgent fully override `execute()` for transaction / streaming flows.

**Fallback path on `SchemaValidationError` / `LLMTimeoutError` / `5xx`** — static `fallbackTemplate[mode]` → `cost_log(model='fallback', tokens=0, isFallback=true)` (US-015 contract).

### ContextAssembler — prompt injection chokepoint (LD-007 · D-054)

- File: `apps/api/src/services/context-assembler/ContextAssembler.ts:38`
- **5 parallel data fetches** via `Promise.allSettled` + per-fetch 5s timeout (`:47-54`):
  1. L2 `step_data` rows (`_fetchStepData`)
  2. **L4 latest EvolutionInsight** (`getLatestInsight` from `apps/api/src/memory/l4-profile.ts:13`) — **PRD-8 US-001 AC-8 path**, injected into 11 generative specialists per D-054
  3. L4 DeepLearning samples (`_fetchSamples` — currently degrades to `[]`)
  4. **L5 RAG** (`_fetchRag` — **PRD-9 US-003 真接 ragRetrieveWorker** · D-025 placeholder → 真 RAG · D-058)
  5. Methodology constants (`methodologyQueryWorker.getAll()`)
- All 5 routes independently fail-safe; `metadata.layersUsed` reflects successful layers (AC-8) · 新加 `'L5_rag'` when ragChunks.length > 0
- **L5 RAG retrieve 策略** · 按 agentId 推断:
  - `CopywritingAgent` (non-boom) → 3 case + 1 formula + 1 element = 5 chunks
  - `TopicAgent` / `CopywritingAgent` mode=boom → 3 element + 2 case
  - 其他 8 生成型 → 3 case + 2 element
  - 非生成型 (`DiagnosisAgent` / `DeepLearnAgent` / `EvolutionAgent`) → 跳过返 `[]`
- **`[Section 6] RAG 知识库参考` 注入** · `_buildSection6` (`ContextAssembler.ts:201-212`) · ragChunks 空时跳过(D-020 降级)
- `contextTokens = chars/4` rough estimate (AC-9) · 算入 RAG chunks 字符
- `systemPrompt` MUST NOT contain LLM keys or API URLs (R-001 hard rule, AC-10)
- Templates: `apps/api/src/services/context-assembler/templates/index.ts` — per-agentId persona/methodology
- PII mask runs before assembly (`apps/api/src/lib/compliance/pii-mask.ts:piiMask`)
- Sensitive-industry disclaimer appended post-generation (`apps/api/src/lib/compliance/disclaimer.ts:appendDisclaimerIfSensitive`)
- **D-007 单一入口 grep** · `grep -rn 'ragChunks|ragRetrieve|knowledge_chunk' apps/api/src/specialists/` 应 **0 命中** · 11 generative agents 受益但 0 自拼接 · §11.6.8 双路径白名单仅 EvolutionAgent/DailyTaskAgent 例外

### VoiceChat tool function-calling (PRD-8 US-011)

- Tool dispatcher: `apps/api/src/lib/voice-chat/tools-dispatcher.ts:dispatchTool` — 5 tools, each ≤ 2s, **per-accountId concurrency lock** to prevent same-session race (`:14-30`)
- Tools (defined `apps/api/src/specialists/VoiceChatAgent.ts:43-76`):
  1. `get_current_step` → reads `step_data`
  2. `search_history` → reads `histories`
  3. `query_diagnosis` → reads `diagnosis_reports`
  4. `get_today_tasks` → reads `daily_tasks` (today's UTC date)
  5. `get_evolution_insights` → reads `evolution_profile` + recent `evolution_insights`
- All queries use `ctx.prisma` (RLS-scoped transaction client) — accountId injection mandatory (REJ-008 reject lesson encoded as comment)

## Data Storage

**Databases:**

**PostgreSQL 16.13** (local dev: `postgresql://return@localhost:5432/quanqn`; test: `..._test`):
- Production target: Supabase or Neon (managed, includes pgvector + Auth) — AGENTS §2.5
- Connection env vars: `DATABASE_URL` (Prisma client) + `DIRECT_URL` (Prisma migrations) + `TEST_DATABASE_URL` (`.env.example:16-18`)
- Client: Prisma 5.22 + @prisma/client 5.22
- Singleton: `apps/api/src/lib/prisma.ts:16` (global var pattern; dev `query` event logging)
- Startup health check: `checkDbConnection()` calls `$queryRaw SELECT 1`; exits 1 on failure (`apps/api/src/lib/prisma.ts:33`)
- Schema source: `prisma/schema.prisma` (1142 lines · 18 main app tables + 13 admin tables + 4 P2 future tables)
- Migrations: 5 generated (`prisma/migrations/`)
  - `20260507000000_init`
  - `20260507154814_add_sessions`
  - `20260509000000_add_cost_log_target`
  - `20260509120000_add_feedback_log_fields`
  - `20260510000000_add_scene_index_to_assets` (PRD-6 storyboard scenes)
- Manual SQL applied separately:
  - `prisma/migrations/manual_rls.sql` — RLS policies on 18 main app tables
  - `prisma/migrations/manual_admin_rls.sql` — `DISABLE ROW LEVEL SECURITY` on 13 admin tables (per LD-A-3)
  - `prisma/migrations/manual_vector_indexes.sql` — pgvector ivfflat indexes (`trending_items.content_embedding` lists=100; `deep_learning_archives.style_vector` lists=316; `histories.content_embedding` commented MVP-off)

**pgvector 0.8.0** — Postgres extension; `vector` declared in `prisma/schema.prisma:14`:
- `trending_items.content_embedding vector(1536)`
- `histories.content_embedding vector(1536)`
- `deep_learning_archives.style_vector vector(1536)`
- **`knowledge_chunk.embedding vector(1536)` (PRD-9 US-001 新加)** · 67 案例 + 23 公式 + 23 元素 · 113 总行 · OpenAI text-embedding-3-small
- ivfflat indexes on `trending_items` + `deep_learning_archives` (`histories` commented out — MVP cost saving per AGENTS §2.3)
- **HNSW index on `knowledge_chunk_embedding_hnsw` (PRD-9 新)** · `USING hnsw (embedding vector_cosine_ops)` · 比 ivfflat 检索质量更好 · 适用于 RAG 实时检索

**RAG Knowledge Base (PRD-9 US-001~005)**:
- Worker: `apps/api/src/workers/embedding/openai-embedding.ts` (OpenAI text-embedding-3-small · 1536 dim · 同步调用不走 BullMQ · cost_log eventType='embedding_call')
- Retrieve: `apps/api/src/workers/rag/retrieve.ts:32` (`ragRetrieveWorker.retrieve(params)`) · pgvector cosine `<=>` 操作符 · `similarity = 1 - cosine_distance`
- **Dev no-key fallback** (US-004 fb0c206 · TD-035 PRR 决策) · `OPENAI_API_KEY not configured` 时降级到 PostgreSQL ILIKE 文本搜索(`textSearchFallback`)· 参数化 SQL($1/$2)防注入 · topK ≤ 20 + keywords ≤ 5 限 DOS · production pgvector path 不污染
- tRPC endpoint: `apps/api/src/trpc/routers/knowledge.ts:99-150` · 3 publicProcedure (`list` / `search` / `getById`) · accountId=0 系统账户 · select 0 embedding 字段防泄露
- Frontend page: `apps/web/src/pages/tools/Knowledge.tsx` · 3 tabs(案例/公式/元素)+ debounce 300ms 语义检索 · shadcn Tabs + Card · Aurelian Dark

**Data Seeding (PRD-9 US-002 + US-005)**:
- `pnpm seed:knowledge [--dry-run]` · `package.json:scripts` (`tsx --tsconfig apps/api/tsconfig.json apps/api/scripts/seed-knowledge-chunk.ts`)
- 数据源: `apps/api/src/lib/constants/{cases.ts (67) · formulas.ts (23) · hotElements.ts (23)}` · 113 chunks
- 幂等: `INSERT ON CONFLICT (type, title) DO UPDATE` · 任意环境可重跑
- **no-key fallback mode (US-005 16e5a78)** · `OPENAI_API_KEY` 未设 → null embedding 插入 + token 粗算 `content.length / 1.5` · 让 dev / CI 也能 seed · text-search fallback (TD-035) 配合此模式工作
- 真 seed (有 API key): 总 cost ≈ $0.0003 · 13K tokens · 耗时 ~60s
- 推到 staging 真验 AC-6 (TD-034 PRR 决策)

**File Storage:**
- Declared in `.env.example`: `S3_BUCKET / S3_REGION / S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY` (lines 23-27)
- AGENTS §2.3 target: S3 / 阿里 OSS / Supabase Storage (max 20MB user upload)
- **Status: NOT WIRED** — no `@aws-sdk/*` / `oss` / `aliyun` packages in any `package.json`; no upload code in `apps/api/src/`
- Current placeholders:
  - DALL-E 3 output stored as `Asset { storageProvider: 'openai', publicUrl: <OpenAI CDN URL> }` — direct URL from OpenAI, no re-upload (`apps/api/src/workers/image-gen/dall-e-3.ts:54-71`)
  - TTS-1 output stored as `Asset { storageProvider: 'placeholder', publicUrl: '/static/placeholder-audio.mp3' }` — AC-9 PRR deferral (`apps/api/src/workers/tts/openai-tts.ts:24, 80-95`)
- S3 signed URL upload deferred to PRR (post-launch readiness)

**Caching / Queue / Streaming State (Redis):**

**Local Redis 8.6.3** (`redis://localhost:6379`) — **now actively used by 3 subsystems**:

| Subsystem | Module | Key pattern | Use |
|---|---|---|---|
| BullMQ queues | `apps/api/src/lib/redis.ts:9` (shared singleton with `maxRetriesPerRequest: null`) | `bull:{queueName}:*` | 4 queues: `image-gen`, `evolution`, `daily-task`, file-parser planned |
| L1 Buffer (VoiceChat) | `apps/api/src/memory/l1-buffer.ts` | `voice_chat:acc_{accountId}:turns` | List · LPUSH + LTRIM 20 + EXPIRE 1800s |
| Daily rate limits | `apps/api/src/lib/rate-limit/{image-gen,stt,tts}.ts` | `rate:{feature}:user:{accountId}:{YYYY-MM-DD}` | INCR + EXPIRE 86400; throws `TRPCError TOO_MANY_REQUESTS` when count > limit |

**Upstash Redis (REST)** — separate from local Redis; used **only** by LLMGateway rate limiter:
- Client: `@upstash/redis` 1.34 instantiated at `apps/api/src/workers/llm-gateway/rate-limiter.ts:42`
- Auth: env `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`
- `@upstash/ratelimit` 2.0 token bucket — keyed `quanqn:rl:{plan}:user:{userId}` (free=50/d, pro=500/d, enterprise=5000/d)
- Graceful degrade: if URL absent, `checkRateLimit()` warns and returns immediately (`:77-81`)

> ⚠️ **Two Redis stacks coexist**: local ioredis (BullMQ + L1 + 3 per-feature rate limits) vs Upstash REST (LLM gateway rate limit). For prod, either consolidate to managed Redis or keep dual (more cost but cleaner separation).

**BullMQ Queues (4 active, all on shared ioredis):**

| Queue | File | Concurrency | Job ID strategy | Trigger |
|-------|------|:-:|---|---|
| `image-gen` | `apps/api/src/workers/image-gen/queue.ts:15` | 2 | (no dedup) | tRPC `aiVideo` router enqueues per scene |
| `evolution` | `apps/api/src/workers/evolution/queue.ts:18` | 5 (global) | `evo:{accountId}:{count}` — per-account dedup | `enqueueIfThresholdMet` from feedback router (atomic `INSERT ON CONFLICT UPDATE RETURNING`, `apps/api/src/lib/evolution/trigger.ts:25-32`) at thresholds `{5, 20, 50, 100}` |
| `daily-task` | `apps/api/src/workers/daily-task/queue.ts:18` | 5 | `daily-task-{accountId}-{YYYY-MM-DD}` — idempotent | `dailyTaskCron` 0 0 * * * Asia/Shanghai (`apps/api/src/cron/daily-task-runner.ts:68`) fans out to all `IpAccount where isActive AND updatedAt > now-7d` |
| `file-parser` | dir exists empty (`apps/api/src/workers/file-parser/.gitkeep`) | — | — | reserved for PRD-9 knowledge base ingestion |

All queues share defaults: `attempts: 3`, `backoff: { type: 'exponential', delay: 5000 }`, `removeOnComplete: { count: 100 }`, `removeOnFail: { count: 50 }`.

**Workers (BullMQ):**
- `apps/api/src/workers/image-gen/worker.ts:28` — dev: spawned in `apps/api/src/index.ts:225-228` when `NODE_ENV=development`; prod: standalone via `pnpm worker:image-gen` (root `package.json:38`)
- `apps/api/src/workers/daily-task/worker.ts:68` — dev: spawned at `apps/api/src/index.ts:231-233`; prod: standalone (not yet scripted in root package.json)
- `apps/api/src/workers/evolution/worker.ts:36` — currently not auto-spawned in dev mode (one fix-up candidate; instantiation happens on import)

**Cron Jobs (node-cron):**
- 1 job active: `dailyTaskCron` (`apps/api/src/cron/daily-task-runner.ts:68`) — `0 0 * * *` Asia/Shanghai
- Started by `apps/api/src/index.ts:237-239` (`dailyTaskCron.start()`)
- `scheduled: false` default; index.ts must explicitly start

**Browser storage** (per AGENTS §2.3 + LD-010):
- localStorage: 18 keys, namespaced via `apps/web/src/lib/ls-namespace.ts` (account-scoped per LD-009 闸 3)
- sessionStorage: `pendingInviteCode`
- 7 server-only entities (DiagnosisReport / EvolutionProfile / EvolutionInsight / FeedbackLog / DeepLearningArchive / KnowledgeFavorite / TrendingItem) explicitly NOT mirrored to LS

## Authentication & Identity

**Auth Provider Abstraction** (`apps/api/src/lib/auth/providers.ts`):
- Strategy pattern: `OAuthProvider` interface with two implementations
- Provider selected at startup via `OAUTH_PROVIDER` env (validated in `validateStartupConfig()`; unknown → `process.exit(1)`)

| Provider | Class | Selector | Use Case | CSRF state check |
|---|---|---|---|:-:|
| Mock | `MockProvider` (`apps/api/src/lib/auth/providers.ts:32`) | `OAUTH_PROVIDER=mock` (default dev) | Returns hardcoded `{openId: 'mock-dev-001', email: 'dev@local.test', name: 'Dev User'}` | ❌ skipped |
| Google | `GoogleProvider` (`apps/api/src/lib/auth/providers.ts:54`) | `OAUTH_PROVIDER=google` | Production | ✅ enforced |

- Google OAuth client: `arctic` 3.7 `Google` class (`apps/api/src/lib/auth/providers.ts:7,59`); requires `GOOGLE_CLIENT_ID` (hard-throw if missing) + `GOOGLE_CLIENT_SECRET` + `GOOGLE_REDIRECT_URL` (defaults `http://localhost:3000/auth/callback`)
- PKCE: `codeVerifier` generated via `arctic.generateCodeVerifier`, stored in 600s httpOnly cookie `oauth_code_verifier`
- State CSRF cookie: `oauth_state` (600s httpOnly, secure in prod) — validated against query param in callback
- ID token decode: `arctic.decodeIdToken` extracts `sub / email / name`
- **Production guard**: `OAUTH_PROVIDER=mock` rejected when `NODE_ENV=production` → `process.exit(1)` (`apps/api/src/lib/auth/providers.ts:146`)

**Session backend**: Lucia 3.2
- Singleton: `apps/api/src/lib/auth/lucia.ts:12`
- Cookie name: `app_session` (admin will use `admin_session` per LD-A-1, AGENTS §10)
- Adapter: custom Prisma adapter (`apps/api/src/lib/auth/adapter.ts`); 7 methods backed by `prisma.session` model
- Session attributes: `email / name / activeAccountId` (`apps/api/src/lib/auth/lucia.ts:20-26`)
- TypeScript module augmentation: `declare module 'lucia'` registers `UserId: number` + `DatabaseUserAttributes`

**Session entry/exit endpoints** (`apps/api/src/index.ts`):
- `GET /auth/login` (line 61) — provider.getAuthorizationUrl → set state/codeVerifier cookies → 302 redirect
- `GET /auth/callback` (line 95) — CSRF check → provider.validateCallback → `prisma.user.upsert` (by `openId`) → `lucia.createSession` → cookie + audit log
- `GET /auth/logout` (line 188) — invalidate session + blank cookie

**Audit logging on auth events** (`apps/api/src/index.ts:117, 169`): `prisma.auditLog.create` with `eventType in {auth.login, security_alert}` + `traceId` from `traceStore` (AsyncLocalStorage).

**Account isolation (RLS-enforcing middleware)** — `apps/api/src/trpc/middleware/account-isolation.ts:21`:
- Sets `app.current_account_id` + `app.current_user_id` via `set_config()` per-request (transaction-scoped, equivalent to `SET LOCAL`)
- AC-5: procedures with `meta.isGlobal=true` skip (User / InviteCode / TrendingItem)
- AC-6: **sole location of `prisma.$executeRaw`** in `apps/api/src/` (LD-009 R-009)

## Monitoring & Observability

**Structured logs:**
- Pino 9 (`apps/api/src/lib/logger.ts:10`)
- Log level: env `LOG_LEVEL` (default `info`)
- Pretty-print: `pino-pretty` 11 only when `NODE_ENV=development`
- Trace propagation: `AsyncLocalStorage<{ traceId: string }>` exported as `traceStore`
- Hono trace middleware: `apps/api/src/index.ts:46-55` — accepts incoming `x-trace-id` header or generates 16-char hex; echoes on every response (US-007)

**Error tracking:**
- `SENTRY_DSN` declared in `.env.example:79`
- **NOT WIRED** — no `@sentry/*` package in any `package.json`. PRR deferral (CLAUDE.md §7).

**Analytics:**
- `PLAUSIBLE_DOMAIN` declared in `.env.example:78`
- **NOT WIRED** — no Plausible script in `apps/web/`. PRR deferral.

**Database audit log:**
- `prisma.auditLog` model — append-only, written from:
  - `apps/api/src/index.ts:117` (`security_alert` on OAuth state mismatch)
  - `apps/api/src/index.ts:169` (`auth.login` on successful sign-in)
  - `apps/api/src/trpc/routers/ipAccounts.ts` (`account.switch` event)
- All entries carry `traceId` for cross-stack correlation
- `prisma.adminAuditLog` (admin subsystem) — separate table per LD-A-3 append-only

**Cost tracking** (per AGENTS §3 LD-014 / `cost_log` table):
- Writer (LLM): `apps/api/src/workers/llm-gateway/cost-logger.ts` (`writeCostLog`) — called on every LLM call, success or fail
- Writer (Specialist wrapper): `apps/api/src/specialists/base/BaseSpecialist.ts:_writeCostLog` — `callType='specialist_call'`, target jsonb `{stepKey, agentId}`, provider derived from model prefix
- Writer (Image): `apps/api/src/workers/image-gen/dall-e-3.ts:27-50` — `eventType='image_gen'`, `imageCount=1`, `provider='openai'`, `costUsd=Decimal('0.04')`
- Writer (STT): `apps/api/src/workers/stt/whisper.ts:107-128` — `eventType='stt_call'`, `audioSeconds`, `provider='openai'`, cost `audioDurationSec/60 * 0.006`
- Writer (TTS): `apps/api/src/workers/tts/openai-tts.ts:100-122` — `eventType='tts_call'`, `charactersIn`, `provider='openai'`, cost `ceil(textLen/1000) * 0.015`
- Writer (L5 VoiceChat): `apps/api/src/specialists/VoiceChatAgent.ts:350-387` — `eventType='l5_agent'`, `agentMode=null`
- Decimal precision: `@prisma/client/runtime/library` `Decimal` type for `costUsd`

**cost_log eventType taxonomy (D-040, extended through PRD-8):**
- `specialist_call` — BaseSpecialist standard path
- `l5_agent` — L5 autonomous (Evolution / DailyTask / VoiceChat)
- `image_gen` — DALL-E 3
- `stt_call` — Whisper-1
- `tts_call` — TTS-1

## CI/CD & Deployment

**Hosting (target per AGENTS §2.5; not yet deployed):**
- Frontend: Vercel or Cloudflare Pages
- Backend: Railway or Fly.io
- DB: Supabase or Neon
- Background workers: standalone process (`pnpm worker:image-gen`) on Railway/Fly worker dyno

**CI Pipeline:** GitHub Actions (per AGENTS §2.6) — config NOT YET present in repo (`.github/` not located in repo root scan)

**Local dev workflow** (per `package.json` scripts):
- `pnpm dev:web` → vite dev server on :5173 with proxy `/api/trpc → :3000`
- `pnpm dev:api` → `tsx watch src/index.ts` on :3000 (auto-spawns image-gen + daily-task workers + cron job)
- `pnpm dev:admin` → echo placeholder (apps/admin not implemented; PRD-10 P9.0+)
- `pnpm test` (vitest) / `pnpm test:e2e` (playwright, mobile + chromium) / `pnpm test:judge` (LLM judge config) / `pnpm test:llm-judge` (custom runner)
- `pnpm db:migrate:dev` / `pnpm db:seed` / `pnpm db:studio`
- `pnpm worker:image-gen` → standalone BullMQ worker (`tsx apps/api/src/workers/image-gen/worker.ts`)
- `pnpm audit:redlines / audit:ld / audit:all` — Opus audit hooks (CLAUDE.md)

## Environment Configuration

**Required env vars** (validated at startup or first call):

| Var | Required | Validation site | Behavior on miss |
|---|:-:|---|---|
| `DATABASE_URL` | ✅ | `apps/api/src/lib/prisma.ts:33` | `process.exit(1)` after `$connect` failure |
| `SESSION_SECRET` (≥32 chars) | ✅ | `apps/api/src/lib/auth/providers.ts:134` | `process.exit(1)` |
| `OAUTH_PROVIDER` | ✅ default `mock` | `apps/api/src/lib/auth/providers.ts:140` | `process.exit(1)` if not in `{mock,google}` |
| `ANTHROPIC_API_KEY` | ✅ for any LLM call | `apps/api/src/workers/llm-gateway/index.ts:91, 121` | throws on first call (caught by retry/fallback) |
| `OPENAI_API_KEY` | ✅ for fallback + image/stt/tts | each worker's lazy client init | throws on first OpenAI call |
| `REDIS_URL` | ✅ for BullMQ + L1 + rate limits | `apps/api/src/lib/redis.ts:9` | defaults `redis://localhost:6379`; no startup validation (lazy `IORedis()`) |
| `GOOGLE_CLIENT_ID` | conditional (`OAUTH_PROVIDER=google`) | `apps/api/src/lib/auth/providers.ts:110` | runtime `Error` returns 500 |
| `GOOGLE_CLIENT_SECRET` | conditional | reads, no validation | empty string fallback |
| `GOOGLE_REDIRECT_URL` | conditional | defaults `http://localhost:3000/auth/callback` | uses default |
| `UPSTASH_REDIS_REST_URL` | optional | `apps/api/src/workers/llm-gateway/rate-limiter.ts:77` | warn + skip LLM gateway rate limit |
| `UPSTASH_REDIS_REST_TOKEN` | conditional w/URL | `:38` | throws `Upstash not configured` |
| `IMAGE_GEN_ENABLED` | optional | `apps/api/src/workers/image-gen/dall-e-3.ts:125` | default `false` → returns placeholder URL · no OpenAI call |
| `IMAGE_GEN_DAILY_LIMIT_PER_USER` | optional | `apps/api/src/lib/rate-limit/image-gen.ts:20` | default 10 |
| `IMAGE_GEN_MAX_SCENES_PER_REQUEST` | optional | tRPC aiVideo input | default 8 |
| `STT_DAILY_LIMIT_PER_USER` | optional | `apps/api/src/lib/rate-limit/stt.ts:19` | default 50 |
| `TTS_DAILY_LIMIT_PER_USER` | optional | `apps/api/src/lib/rate-limit/tts.ts` | default 100 |
| `APP_BASE_URL` | optional | `apps/api/src/index.ts:31` | defaults `http://localhost:5173` |
| `API_BASE_URL` | optional | `apps/api/src/lib/auth/providers.ts:36` | defaults `http://localhost:3000` |
| `PORT` | optional | `apps/api/src/index.ts:218` | defaults 3000 |
| `LOG_LEVEL` | optional | `apps/api/src/lib/logger.ts:16` | defaults `info` |
| `NODE_ENV` | optional | multiple sites | `development` enables in-process workers + pino-pretty |
| `TRENDING_VENDOR` | optional | `.env.example:71` | `xinbang | cmm | feigua | official`; **no scraper code reads this yet** |
| `TRENDING_API_KEY` | optional | declared only | no use |
| `TRENDING_FETCH_INTERVAL_HOURS` | optional | declared only | default 4 |

**Frontend env vars** (Vite, prefixed `VITE_`):
- `VITE_API_BASE_URL` (`apps/web/src/lib/trpc.ts:44`) — defaults `http://localhost:3000`

**Secrets location:**
- Local dev: `.env` file (gitignored per `.gitignore:14-19`); `.env.example` is the template
- Production: AGENTS §2.5 — Vercel / Railway / Supabase Secret Manager (no in-repo secrets)

## Webhooks & Callbacks

**Incoming:**
- `GET /auth/callback` (`apps/api/src/index.ts:95`) — Google OAuth callback
- `GET /health` (`apps/api/src/index.ts:57`) — liveness probe
- `POST/GET /trpc/*` (`apps/api/src/index.ts:206`) — single tRPC mount; handles 25 routers (auth, acquisitionVideo, aiVideo, dailyTasks, evolution, ipAccounts, stepData, stt, tts, copywriting, videoAnalysis, videoProduction, boomGenerate, monetization, privateDomain, diagnosis, deepLearning, knowledge, trending, invite, costLog, analysis, history, voiceChat — `apps/api/src/trpc/routers/_app.ts:33-57`)

**Outgoing (HTTPS, all SDK-mediated):**
- Anthropic Claude API (via `@anthropic-ai/sdk`)
- OpenAI API — chat (LLMGateway), DALL-E 3 (image-gen worker), Whisper-1 (stt worker), TTS-1 (tts worker)
- Upstash Redis REST API (LLM gateway rate limit only)
- Google OAuth 2 token endpoint (via `arctic`)
- **No Trending vendor calls yet** — `trending` router returns mock data; `apps/api/src/workers/trending-scraper/` is empty `.gitkeep`. PRD-9 deliverable.

## Streaming / SSE / Subscriptions

- tRPC v11 `httpBatchStreamLink` (`apps/web/src/lib/trpc.ts:43`) — supports SSE for streaming procedures and `subscription` AsyncGenerator type
- **Server-side SSE / streaming subscriptions:**
  - `CopywritingAgent` step7 / free / boom modes (`apps/api/src/specialists/CopywritingAgent.ts` — `gateway.stream()` consumption)
  - `TopicAgent` step5 (22KB 5-category SSE)
  - **`voiceChat.start` tRPC subscription** (`apps/api/src/trpc/routers/voiceChat.ts:23-52`) — yields `delta` / `tool_call` / `tool_result` / `done` / `error` chunks via `voiceChatAgent.executeStream()` AsyncGenerator (PRD-8 US-011)
- Fetch headers: client injects `x-trace-id` per request (`apps/web/src/lib/trpc.ts:51`); `credentials: 'include'` for cookie auth

## Compliance / Safety

**PII masking** (`apps/api/src/lib/compliance/pii-mask.ts`):
- Regex sequence (order-sensitive): EMAIL → ID_CARD → BANK_CARD → PHONE_CN → PHONE_INTL
- Hit types: `email / id_card / bank_card / phone_cn / phone_intl`
- Recursive object mask with whitelist for Date/RegExp/Map/Set/Error/Buffer
- Invoked by ContextAssembler before prompt assembly

**Sensitive-industry disclaimers** (`apps/api/src/lib/compliance/disclaimer.ts`):
- 3 categories: medical / legal / finance
- Auto-appended to markdown content via `appendDisclaimerIfSensitive(content, industry)`
- Or attached as `_disclaimer` field via `attachDisclaimerMeta(result, industry)` for JSON results

## DRIFT vs AGENTS.md §2 / §3 (Integrations)

| Spec | Reality | Status |
|---|---|:-:|
| `LD-007 ContextAssembler 唯一入口` | enforced — all 11 generative specialists hit `_contextAssembler.assemble()` via `BaseSpecialist.execute()`; PRD-8 US-001 AC-8 adds 5th L4 fetch | ✅ |
| `R-001 LLMGateway 唯一 SDK 入口` | enforced for **chat completions** — Anthropic only in `apps/api/src/workers/llm-gateway/index.ts`; OpenAI in 4 files with D-038 audio/image worker exemptions (each carrying redline comment) | ✅ |
| `D-038 Worker 独立 (STT/TTS/ImageGen 不走 LLMGateway)` | enforced — each non-gateway OpenAI import file headers `D-038` + writes its own `cost_log` independently | ✅ |
| `D-054 ContextAssembler 集中注入 EvolutionInsight (11 生成型 specialist)` | enforced — L4 fetched as `Promise.allSettled` route #2; AssembledContext exposes `evolutionInsight` field for downstream specialists | ✅ |
| `LD-009 3 道闸 (RLS + Redis ns + ORM where)` | RLS in `prisma/migrations/manual_rls.sql` + admin `DISABLE`; ORM `where: { accountId }` enforced in tRPC `account-isolation` middleware (sole `$executeRaw` site); Redis namespace partially in place (L1 keys `voice_chat:acc_{accountId}:`, rate-limit `rate:{feature}:user:{accountId}:`) | 🟡 partial — formal Redis namespace policy not in `~/.claude` but de-facto consistent |
| AGENTS §2.4 OAuth: `lucia-auth` | code uses `lucia` (renamed package v3) | 🟡 update doc string only |
| `node-cron` 3.x for cron | **WIRED** — `dailyTaskCron` 0 0 * * * Asia/Shanghai | ✅ |
| `bullmq` + `ioredis` for queue | **WIRED** — 4 queues + shared ioredis singleton + 3 worker spawn points | ✅ |
| Trending vendor (xinbang/cmm/feigua) | `trending` router returns mock data; `apps/api/src/workers/trending-scraper/` empty | 🟡 deferred PRD-9 |
| Sentry / Plausible | declared in `.env.example` only | 🟡 PRR (deferred per CLAUDE.md §7) |
| S3 / OSS upload | env declared, no SDK installed; DALL-E uses OpenAI CDN URL; TTS uses placeholder URL | 🟡 PRR deferral (AC-9 on TTS worker explicitly notes this) |
| OpenAI image / STT / TTS | **WIRED** in PRD-6 + PRD-8 (DALL-E 3 / Whisper-1 / TTS-1) | ✅ |
| `text-embedding-3-small` | `LLMGateway.embed()` returns 1536-zero stub | 🟡 deferred PRD-9 RAG |

---

*Integration audit: 2026-05-11*
