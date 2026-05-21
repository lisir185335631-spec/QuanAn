# Codebase Concerns

**Analysis Date:** 2026-05-21

## Tech Debt

**TD-013 · Dual cost_log writes per LLM call:**
- Issue: `LLMGateway.writeCostLog()` writes `callType='complete'` AND `BaseSpecialist._writeCostLog()` writes `callType='specialist_call'` — every Specialist call creates 2 records with ~80% overlapping fields
- Files: `src/workers/llm-gateway/index.ts:144`, `src/specialists/base/BaseSpecialist.ts:269`
- Impact: Admin cost dashboard shows doubled data; reports need `WHERE callType='specialist_call'` filter; confusing for analytics
- Fix approach: PRD-11 admin cost domain — choose Option A (document dual-write semantics) or Option B (merge to LLMGateway single write, pass `stepKey` via metadata)

**TD-014 · Specialist `_mode` instance state race window:**
- Issue: Multi-mode Specialists (PositioningAgent, MonetizationAgent, AnalysisAgent) store `_mode` as instance state, set in `invokeLLM()`, read by `outputSchema` getter. Concurrent `execute()` calls on the same singleton can race
- Files: `src/specialists/PositioningAgent.ts:90`, `src/specialists/MonetizationAgent.ts:126`, `src/specialists/AnalysisAgent.ts:185`
- Impact: Low risk in P1-P3 (single-user serial flow). High risk under concurrent requests (PRD-7+ scale)
- Fix approach: Change `outputSchema` to a method accepting `req.mode` parameter; or use `AsyncLocalStorage` per-execute isolation

**TD-008 · Duplicate `generateTraceId` function names:**
- Issue: Two functions named `generateTraceId` with different signatures exist in `src/trpc/trpc.ts:17` (no params, HTTP layer) and `src/agents/base/types.ts:90` (structured, Specialist layer). Already partially fixed: trpc.ts uses `generateHttpTraceId` but agents/base/types.ts still exports `generateSpecialistTraceId` as original
- Files: `src/trpc/trpc.ts`, `src/agents/base/types.ts`
- Impact: Naming confusion, potential wrong function used in future code
- Fix approach: Verify both files use distinct names — check that no import accidentally uses the wrong one

**TD-048 · Empty stub directories with .gitkeep files:**
- Issue: `src/audit/` and `src/notification/` are empty directories with `.gitkeep` only — historical migration artifacts, business code moved to `src/services/admin/`
- Files: `src/audit/`, `src/notification/`
- Impact: grep noise, misleads new contributors
- Fix approach: `git rm -r src/audit/ src/notification/` in a chore commit

**TD-065 · Vector table naming mismatch:**
- Issue: Code references `knowledge_cases_vec` / `formulas_vec` / `elements_vec` but correct names per schema are different
- Files: `src/workers/rag/` (RAG retrieval queries)
- Impact: RAG retrieval will fail at runtime when pgvector tables are queried by wrong name
- Fix approach: Audit actual Prisma schema table names vs code references; fix in a single migration+code update

**TD-067 · Dead code in constant-embed.service.ts:**
- Issue: `evaluateConstantVersion` function in `src/services/admin/constant-version/constant-embed.service.ts:108-125` is dead code; moved to LLM judge in PRD-14 US-008
- Files: `src/services/admin/constant-version/constant-embed.service.ts`
- Impact: Code confusion, maintenance burden
- Fix approach: Remove the dead function in a refactor commit

**TD-102 · Vitest file-level collection errors:**
- Issue: 15+ test files in PRD-13/14/15/25 e2e/integration tests have collection errors — likely missing stubs or import issues
- Files: Multiple in `src/trpc/routers/` and `src/specialists/__tests__/`
- Impact: Test suite partially broken; false confidence in passing runs
- Fix approach: Run `pnpm vitest run --reporter=verbose` and fix collection errors systematically

## Known Bugs

**Streaming stub in LLMGateway (`TODO P3`):**
- Symptoms: `llmGateway.stream()` only emits `meta + done` — no actual streaming content
- Files: `src/workers/llm-gateway/index.ts:165-173`
- Trigger: Any subscription procedure calling `llmGateway.stream()` (e.g., `privateDomain.generateStream`)
- Workaround: `privateDomain.generateStream` SSE subscription works but yields empty `result: null` — frontend must fall back to `generate` mutation result

**deepLearning.parse and applyFormula use mock analysis:**
- Symptoms: `parse` and `applyFormula` procedures return hardcoded mock analysis, not real LLM output
- Files: `src/trpc/routers/app/deepLearning.ts:69-81` (`mockAnalysis` function)
- Trigger: Any call to `deepLearning.parse` or `deepLearning.applyFormula`
- Workaround: None — P1 intentional; real DeepLearnAgent integration planned for PRD-7+

**ContextAssembler L5 trending data is a stub:**
- Symptoms: `src/memory/l5-trending.ts` returns empty/placeholder trending data
- Files: `src/memory/l5-trending.ts`
- Trigger: All Specialist calls that request L5 trending layer
- Workaround: Trending layer gracefully degrades (empty segment in prompt); no hard failure

## Security Considerations

**LLM API key exposure:**
- Risk: `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` must never reach frontend or logs
- Files: `src/workers/llm-gateway/index.ts` (sole SDK import location), `src/lib/env.ts`
- Current mitigation: Keys only read in `getAnthropicClient()` / `getOpenAIClient()`, never logged (comment: `API keys never logged — AC-9`), `validateEnv()` logs only `✓/✗` presence
- Recommendations: Add ESLint rule enforcing no SDK imports outside gateway file

**RLS bypass via missing activeAccountId:**
- Risk: Procedures using `protectedProcedure` but not checking `activeAccountId` could expose cross-account data if RLS has bugs
- Files: `src/trpc/middleware/account-isolation.ts`
- Current mitigation: `accountIsolationMiddleware` throws `FORBIDDEN` if `activeAccountId === null`; double-layer explicit `where: { accountId }` in queries (TD-019 pattern)
- Recommendations: Periodically audit new router procedures for explicit `accountId` in WHERE clauses

**Admin session cookie naming:**
- Risk: Session cookie name collision between app (`app_session`) and admin (`admin_session`) if same domain
- Files: `src/lib/auth/lucia.ts`, `src/lib/auth/lucia-admin.ts`
- Current mitigation: Distinct names enforced by LD-A-1; CORS configured for separate origins

**OAuth CSRF protection:**
- Risk: State mismatch in OAuth callback
- Files: `src/index.ts:173-189`
- Current mitigation: CSRF check enforced for all non-mock providers; state mismatch → 401 + `auditLog.create(security_alert)`

## Performance Bottlenecks

**ContextAssembler 7-layer fetch on every Specialist call:**
- Problem: Every `BaseSpecialist.execute()` runs 7 parallel DB queries before invoking the LLM
- Files: `src/services/context-assembler/ContextAssembler.ts:53-60`
- Cause: No caching of assembled context; each tRPC call re-fetches all layers
- Improvement path: Redis cache of assembled context keyed by `(accountId, agentId)` with TTL from `config.knowledge.refresh_interval_sec`

**Dual cost_log writes per LLM call:**
- Problem: 2 `prisma.costLog.create()` calls per Specialist invocation (see TD-013)
- Files: `src/workers/llm-gateway/cost-logger.ts`, `src/specialists/base/BaseSpecialist.ts`
- Improvement path: Merge into single write (see TD-013 fix options)

## Fragile Areas

**`src/index.ts` startup sequence:**
- Files: `src/index.ts:363-433`
- Why fragile: `start()` registers 10+ cron jobs and workers via sequential `import()` calls. A failure in one job registration crashes the whole server. No retry or isolation.
- Safe modification: Add each cron/worker registration in its own try/catch with `logger.warn` on failure (non-critical jobs should not crash startup)
- Test coverage: No startup integration tests

**`BaseSpecialist._mode` in multi-mode Specialists:**
- Files: `src/specialists/PositioningAgent.ts`, `src/specialists/MonetizationAgent.ts`, `src/specialists/AnalysisAgent.ts`
- Why fragile: Instance state mutated inside async `invokeLLM()` creates race under concurrent calls (TD-014)
- Safe modification: Never add new modes to existing multi-mode Specialists without addressing TD-014 first

**`LLMGateway.stream()` stub:**
- Files: `src/workers/llm-gateway/index.ts:164-173`
- Why fragile: Returns stub only; any feature depending on real streaming is silently broken
- Safe modification: Do not add new subscription endpoints relying on `llmGateway.stream()` until P3 real streaming is implemented

## Scaling Limits

**Upstash rate limiter:**
- Current capacity: Free 50/day, Pro 500/day, Enterprise 5000/day per user
- Limit: Hardcoded in `src/workers/llm-gateway/rate-limiter.ts:PLAN_LIMITS`
- Scaling path: Update `PLAN_LIMITS` constants; add new plan tiers

**BullMQ concurrency:**
- Deep learning worker: `concurrency: 3` (`src/jobs/deep-learning.job.ts:116`)
- Image gen worker: set in `src/workers/image-gen/worker.ts`
- Limit: Single Redis instance; BullMQ scales horizontally with more worker processes
- Scaling path: Increase concurrency or run multiple worker processes in prod

## Dependencies at Risk

**`@trpc/server` at `^11.0.0-rc.0`:**
- Risk: Release candidate version; breaking changes possible before stable release
- Impact: tRPC type signatures could change; all 28 app routers + 17 admin routers affected
- Migration plan: Pin to stable v11 when released; run typecheck after upgrade

**`tsx` as prod runner:**
- Risk: `tsx src/index.ts` is used for both dev and prod `start` script — no compiled build for production
- Impact: TypeScript compilation overhead at runtime; no tree-shaking; `dist/` build exists but `start` script uses tsx
- Migration plan: Use `tsc -b` + `node dist/index.js` for production

## Missing Critical Features

**Real LLM streaming:**
- Problem: `LLMGateway.stream()` is a stub — emits only `meta + done`
- Blocks: `privateDomain.generateStream` subscription returning real streaming content
- Files: `src/workers/llm-gateway/index.ts:164-173`

**Real RAG retrieval (pgvector):**
- Problem: RAG worker uses text-search fallback when no vector embeddings exist (TD-035); embeddings are zero-vectors (1536-dimension zeros in `LLMGateway.embed()`)
- Blocks: Meaningful RAG hits in ContextAssembler L5 layer
- Files: `src/workers/llm-gateway/index.ts:175-179`, `src/workers/rag/`, `src/workers/embedding/`

**File upload + parsing:**
- Problem: `deepLearning.createFromFile` uses `mock-s3://` URLs; no real file storage
- Blocks: Learning from uploaded video scripts or documents
- Files: `src/trpc/routers/app/deepLearning.ts:150-169`

## Test Coverage Gaps

**PresentationAgent (PRD-27 new):**
- What's not tested: No unit test file found for `PresentationAgent.ts`
- Files: `src/specialists/PresentationAgent.ts`
- Risk: Fallback template structure, 14 enum enforcement, schema validation untested
- Priority: High (new PRD-27 agent)

**PrivateDomainAgent (PRD-27 new):**
- What's not tested: No unit test file found for `PrivateDomainAgent.ts`
- Files: `src/specialists/PrivateDomainAgent.ts`
- Risk: 6-phase prompt templates, schema validation, fallback untested
- Priority: High (new PRD-27 agent)

**DeepLearnAgent BullMQ job (PRD-27 new):**
- What's not tested: `src/jobs/deep-learning.job.ts` has no test file
- Files: `src/jobs/deep-learning.job.ts`
- Risk: Job status transitions (`queued → processing → completed/failed`) untested; history row update logic untested
- Priority: High (BullMQ error paths fragile)

**TD-057/060/061 · Admin service/router test gaps:**
- What's not tested: `evolution-health` service/router (TD-057), `prompts` router backend (TD-060), `approval-gates` UI (TD-061)
- Files: `src/services/admin/evolution-health/`, `src/trpc/routers/admin/prompts.ts`
- Priority: Medium

**TD-083 · Integration tests hit localhost:3000:**
- What's not tested: Some integration tests use `fetch('http://localhost:3000/...')` and fail with ECONNREFUSED when no server is running
- Files: Various `__tests__/` integration test files in tRPC router tests
- Risk: Integration tests silently skipped/failing in CI
- Priority: Medium (use `@testcontainers` or supertest pattern instead)

---

*Concerns audit: 2026-05-21*
