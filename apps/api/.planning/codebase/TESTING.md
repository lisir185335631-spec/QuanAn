# Testing Patterns

**Analysis Date:** 2026-05-21

## Test Framework

**Runner:**
- Vitest (version from workspace root devDependencies)
- Config: `apps/api/vitest.config.ts`

**Assertion Library:**
- Vitest built-in (`expect`, `vi`)

**Run Commands:**
```bash
cd apps/api && pnpm vitest run          # Run all tests once
cd apps/api && pnpm vitest              # Watch mode
cd apps/api && pnpm vitest run --coverage   # Coverage
# Run specific test file:
cd apps/api && pnpm vitest run src/specialists/__tests__/DiagnosisAgent.test.ts
```

## Test File Organization

**Location:**
- Co-located in `__tests__/` subdirectories adjacent to the source file:
  - `src/specialists/__tests__/` — Specialist agent unit tests + real-LLM tests
  - `src/trpc/routers/admin/__tests__/` — Admin router integration/unit tests
  - `src/trpc/routers/__tests__/` — App router tests
  - `src/services/admin/<domain>/__tests__/` — Admin service tests
  - `src/workers/<name>/__tests__/` — Worker tests
  - `src/jobs/admin/__tests__/` — Admin job tests
  - `src/middleware/__tests__/` — Middleware tests
  - `src/schemas/admin/__tests__/` — Admin schema tests

**Naming:**
- Unit tests: `<ClassName>.test.ts` (e.g., `DiagnosisAgent.test.ts`, `PositioningAgent.test.ts`)
- Real LLM tests: `<ClassName>.real-llm.test.ts` (e.g., `BrandingAgent.real-llm.test.ts`)
- LLM Judge tests: `<ClassName>.judge.test.ts` (e.g., `DiagnosisAgent.judge.test.ts`)
- Service tests: `<service-name>.service.test.ts` or `<feature>.test.ts`

**Vitest config:**
```typescript
include: ['src/**/*.test.ts']
testTimeout: 30000
environment: 'node'
globals: true
resolve.alias: { '@': 'src/', 'zod': './node_modules/zod' }
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoisted mocks (MUST be at top, before imports) ──────────────────────────

const { mockComplete } = vi.hoisted(() => ({
  mockComplete: vi.fn(),
}));

// Module-level mocks declared immediately after hoisted
vi.mock('@/workers/llm-gateway', () => ({
  llmGateway: { complete: mockComplete },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    costLog: { create: vi.fn().mockResolvedValue({ id: 1 }) },
    stepData: { findMany: vi.fn().mockResolvedValue([]) },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

describe('AgentName', () => {
  beforeEach(() => {
    mockComplete.mockResolvedValue({
      content: VALID_LLM_RESULT,
      tokens: { prompt: 800, completion: 400, total: 1200 },
      model: 'claude-sonnet-4-6',
    });
  });

  it('(a) does specific thing', async () => {
    const agent = new AgentName();
    const result = await agent.execute({ accountId: 9999, userInput: VALID_INPUT });
    expect(result.isFallback).toBe(false);
  });
});
```

**Patterns:**
- `beforeEach` resets mock implementations via `mockResolvedValue`
- Test IDs labeled `(a)`, `(b)`, `(c)` matching PRD AC references in comments
- Large valid fixture objects defined as module-level `const` (e.g., `VALID_LLM_RESULT`, `VALID_ANSWERS`)

## Mocking

**Framework:** Vitest `vi.mock` + `vi.hoisted`

**Critical pattern — hoisted mocks:**
```typescript
// Must use vi.hoisted() to reference mock function BEFORE module is loaded
const { mockComplete } = vi.hoisted(() => ({
  mockComplete: vi.fn(),
}));

vi.mock('@/workers/llm-gateway', () => ({
  llmGateway: { complete: mockComplete },
}));
```

**Standard mock set for Specialist unit tests (always mock all 5):**
```typescript
vi.mock('@/workers/llm-gateway', ...)    // LLM calls → mockComplete
vi.mock('@/lib/prisma', ...)              // DB writes (costLog.create, stepData.findMany)
vi.mock('@/lib/logger', ...)              // suppress pino output
vi.mock('@/memory/l4-profile', ...)       // ContextAssembler L4 dependency
vi.mock('@/workers/rag', ...)             // ContextAssembler L5 RAG dependency
```

**Router test mocks:**
```typescript
// Admin router tests mock the service layer:
vi.mock('@/services/admin/feature-flag/feature-flag.service', () => ({
  getFeatureFlag: vi.fn().mockResolvedValue({ enabled: true }),
}));

// App router tests with real DB via @testcontainers/postgresql
```

**What to Mock:**
- `LLMGateway.complete` — always mock in unit tests; prevents real HTTP calls
- `prisma` — mock in unit tests; use real DB (testcontainers) in integration tests
- `logger` — always mock to suppress stdout noise in test output
- ContextAssembler dependencies (`l4-profile`, `rag`) — mock to isolate Specialist logic

**What NOT to Mock:**
- `BaseSpecialist.execute()` template logic — instantiate real agent class
- Zod schema `parse`/`safeParse` — test against real schemas (core output contract)
- Error classes (`SchemaValidationError`, `LLMTimeoutError`) — test real error paths

## Fixtures and Factories

**Test Data:**
```typescript
// Typical Specialist test fixtures (module-level const):
const VALID_ANSWERS = [
  { dimension: 'basic', score: 8, comment: '美业|皮肤管理|startup' },
  { dimension: 'positioning', score: 7 },
  // ...must include all required dimensions
];

const VALID_LLM_RESULT = {
  dimensions: {
    positioning: { score: 7, issues: ['定位略模糊'], suggestions: ['明确赛道'] },
    branding:    { score: 6, issues: ['头像待优化'], suggestions: ['换真人照片'] },
    // ...all 7 dimensions to satisfy outputSchema
  },
  overallScore: 61,
  priority: ['完善定位', '增加案例', '强化破圈'],
};
```

**Location:**
- Inline in each test file as module-level `const` — no shared fixture factory file
- `@testcontainers/postgresql` v10 for integration tests needing real PostgreSQL

## Coverage

**Requirements:** None enforced (no thresholds configured in `vitest.config.ts`)

**View Coverage:**
```bash
cd apps/api && pnpm vitest run --coverage
```

## Test Types

**Unit Tests (`.test.ts`):**
- Scope: Single Specialist agent or service function with all dependencies mocked
- Approach: Assert on prompt content, schema conformance, isFallback flag, model_tier from config
- Example: `src/specialists/__tests__/DiagnosisAgent.test.ts` — 4 cases: (a) prompt keywords, (b) schema conformance, (c) responseFormat type, (d) isFallback=false on success

**Real LLM Tests (`.real-llm.test.ts`):**
- Scope: Integration test against actual Anthropic/OpenAI API — no mocks
- Approach: Full `execute()` call; validates output matches `outputSchema`
- Run: Manual only; requires `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`
- Example: `src/specialists/__tests__/BrandingAgent.real-llm.test.ts`

**LLM Judge Tests (`.judge.test.ts`):**
- Scope: Output quality validation using golden fixture data
- Approach: Mock LLM to return known golden output; assert schema + content structure
- Example: `src/specialists/__tests__/DiagnosisAgent.judge.test.ts` — validates 7-dimension golden output with assertion on each dimension key

**Admin Integration Tests:**
- Scope: Admin service + router with real DB via `@testcontainers/postgresql`
- Pattern: Spin up test container, run migrations, seed minimal data, test full request path
- Examples: `src/trpc/routers/admin/__tests__/users.test.ts`, `src/services/admin/quota/__tests__/quota-adjustment.test.ts`

**BullMQ Job Tests:**
- Scope: Job processor logic with mocked Queue/Worker and Prisma
- Examples: `src/jobs/admin/__tests__/kpi-snapshot.job.test.ts`, `src/jobs/admin/__tests__/cost-anomaly.job.test.ts`

## Common Patterns

**Async Testing:**
```typescript
it('executes agent successfully', async () => {
  const agent = new DiagnosisAgent();
  const result = await agent.execute({
    accountId: 9999,
    userInput: { answers: VALID_ANSWERS },
  });
  expect(result.isFallback).toBe(false);
  expect(result.modelUsed).toBe('claude-sonnet-4-6');
  expect(result.tokensUsed.total).toBe(1200);
});
```

**Schema Conformance Testing:**
```typescript
it('output conforms to outputSchema', async () => {
  const agent = new DiagnosisAgent();
  const result = await agent.execute({ accountId: 9999, userInput: VALID_INPUT });

  const parsed = diagnosisOutput.safeParse(result.result);
  expect(parsed.success).toBe(true);
  if (parsed.success) {
    expect(Object.keys(parsed.data.dimensions)).toHaveLength(7);
    expect(parsed.data.overallScore).toBeGreaterThanOrEqual(0);
  }
});
```

**Mock Capture + Assertion on Prompt:**
```typescript
// Capture gateway call to assert on prompt content and config
it('uses model_tier from config, not hardcoded', async () => {
  const agent = new DiagnosisAgent();
  await agent.execute({ accountId: 9999, userInput: VALID_INPUT });

  const callArg = mockComplete.mock.calls[0]?.[0] as {
    model_tier: string;
    responseFormat: { type: string };
    systemPrompt: string;
  };
  expect(callArg.model_tier).toBe('reasoning');           // from config
  expect(callArg.responseFormat.type).toBe('json_schema'); // structured output
  expect(callArg.systemPrompt).toContain('positioning');   // prompt content
});
```

**Fallback Path Testing:**
```typescript
it('returns fallback result when LLM fails', async () => {
  mockComplete.mockRejectedValue(new Error('API_KEY missing'));

  const agent = new DiagnosisAgent();
  // Only works if static fallbackTemplate is defined for the mode
  const result = await agent.execute({ accountId: 9999, userInput: VALID_INPUT });
  expect(result.isFallback).toBe(true);
  expect(result.modelUsed).toBe('fallback');
  expect(result.tokensUsed.total).toBe(0);
});
```

---

*Testing analysis: 2026-05-21*
