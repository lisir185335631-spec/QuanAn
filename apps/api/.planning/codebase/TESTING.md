# apps/api — Testing Fact Layer
> Generated: 2026-05-21 (PRD-27 §0 gsd-map-codebase)

## Test Suite Status (PRD-27 final state)

| Suite | Count | Status |
|---|---|---|
| Vitest unit (routers/__tests__) | ~800+ tests | ✅ all pass |
| Vitest integration (tests/integration/api/) | ~100 tests | ⚠️ requires live DB (PostgreSQL) |
| E2E admin (tests/e2e/admin/*.test.ts) | ~200 tests | ⚠️ requires live DB + admin seed |
| LLM Judge (tests/judge/) | 14 tests | ⏭️ skipIf no API keys |

## Vitest Configuration

- Config: `apps/api/vitest.config.ts`
- Setup: `tests/unit/setup.ts` (prisma mock + vi.mock patterns)
- Judge config: `vitest.judge.config.ts` (separate · lightweight model tier)
- Run unit: `cd apps/api && pnpm test`
- Run judge: `pnpm test:judge`

## Unit Test Patterns

- **Router unit tests**: `apps/api/src/trpc/routers/{app,admin}/__tests__/*.test.ts`
  - vi.mock('@/lib/prisma') + custom mock methods
  - vi.mock specialist agent (resolve success/fallback/error cases)
  - Creates mock ctx with activeAccountId + traceId
- **Specialist flow tests**: `tests/unit/api/specialists-flow.test.ts`
  - Tests router → agent call flow · verifies History row creation
  - Validates isFallback propagation · tokensUsed tracking

## Integration Test Requirements

- `tests/integration/api/` require:
  - Live PostgreSQL at `DATABASE_URL`
  - pgvector extension enabled
  - Test DB: `quanqn_test`
  - Run: `DATABASE_URL_TEST=... pnpm test:integration`

## LLM Judge Tests

- 7 Specialist × 1-2 golden cases each
- describe.skipIf(!API_KEY) pattern — CI safe · 0 cost when no keys
- Each test validates fallbackSchema alignment even without real API call
- Run: `ANTHROPIC_API_KEY=... pnpm test:judge`
