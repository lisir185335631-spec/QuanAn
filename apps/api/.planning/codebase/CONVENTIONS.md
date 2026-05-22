# Coding Conventions

**Analysis Date:** 2026-05-21

## Naming Patterns

**Files:**
- Specialist agents: `PascalCase.ts` matching class name (e.g., `PresentationAgent.ts`)
- tRPC routers: `camelCase.ts` matching the router key in `_app.ts` (e.g., `presentStyles.ts`)
- BullMQ jobs: `kebab-case.job.ts` (e.g., `deep-learning.job.ts`, `kpi-snapshot.job.ts`)
- BullMQ workers: `worker.ts` inside named subdirectory (e.g., `workers/daily-task/worker.ts`)
- Services: `kebab-case.service.ts` (e.g., `feature-flag.service.ts`)
- Test files: `*.test.ts` for unit tests, `*.real-llm.test.ts` for live-LLM integration tests

**Classes:**
- Specialist agents: `PascalCase` (e.g., `PresentationAgent`, `MonetizationAgent`)
- Error classes: `PascalCase` with `Error` suffix (e.g., `SchemaValidationError`, `LLMTimeoutError`)

**Variables/Functions:**
- `camelCase` for all variables, functions, methods
- `UPPER_SNAKE_CASE` for module-level constants (e.g., `PRESENTATION_CONFIG`, `DEEP_LEARNING_QUEUE_NAME`)
- Singleton exports: `camelCase` matching the class name lowercased (e.g., `export const presentationAgent = new PresentationAgent()`)
- Router exports: `camelCase` with `Router` suffix (e.g., `export const presentStylesRouter = router({...})`)

**Types/Interfaces:**
- `PascalCase` for all types and interfaces
- Schema types: `PascalCase` with `Schema` suffix for Zod objects (e.g., `PresentationOutputBaseSchema`)
- Types derived from Zod: `z.infer<typeof XxxSchema>` named `XxxOutput` / `XxxInput`

## Code Style

**Formatting:**
- No Prettier or Biome config found at `apps/api/` level — follows workspace root config
- TypeScript strict mode inherited from `tsconfig.base.json`

**Linting:**
- ESLint via `pnpm lint` → `eslint . --ext ts --max-warnings=0`
- Common patterns enforced: no `console.log` (use `logger`), no direct SDK imports outside gateway

## Import Organization

**Order (observed pattern):**
1. Node built-ins (e.g., `import { randomBytes } from 'node:crypto'`) — with `node:` prefix
2. Third-party packages (`@trpc/server`, `bullmq`, `zod`, etc.)
3. Workspace packages (`@quanan/schemas`)
4. Internal absolute imports via `@/` alias (`@/lib/prisma`, `@/specialists/BaseSpecialist`)
5. Relative imports (`./types`, `./errors`)
6. Type-only imports last with `import type`

**Example:**
```typescript
import { randomBytes } from 'node:crypto';          // 1. built-in

import { TRPCError } from '@trpc/server';            // 2. third-party
import { z } from 'zod';

import { BaseSpecialist } from './base/BaseSpecialist';  // 5. relative
import type { SpecialistConfig } from './base/types';    // 6. type import
```

**Path Aliases:**
- `@/*` → `./src/*` (defined in `tsconfig.json`)
- `@quanan/schemas` → `../../packages/schemas/src`
- `zod` → `./node_modules/zod` (pinned to local version)

## Error Handling

**Patterns:**
- tRPC routers: throw `new TRPCError({ code: 'NOT_FOUND' | 'FORBIDDEN' | 'BAD_REQUEST' | 'INTERNAL_SERVER_ERROR', message })` — never let raw errors propagate
- Specialists: throw `SchemaValidationError` or `LLMTimeoutError` — `BaseSpecialist.execute()` catches these for fallback
- BullMQ workers: catch and update History row with `status: 'failed'`, re-throw for BullMQ retry
- Critical startup failures: `process.exit(1)` after logging (e.g., `checkDbConnection`)
- Non-critical failures (cost_log write, audit log): `.catch(() => undefined)` to avoid cascading failures

## Logging

**Framework:** Pino via `src/lib/logger.ts`

**Import:**
```typescript
import { logger } from '@/lib/logger';
```

**Patterns:**
- Use `logger.info`, `logger.warn`, `logger.error` — never `console.log`
- Always pass a structured object as first arg, message as second:
  ```typescript
  logger.info({ accountId, traceId }, 'deep_learning_job.started');
  logger.error({ err, historyId }, 'deep_learning_job.failed');
  ```
- Log key: `snake_case.verb` pattern (e.g., `'server.starting'`, `'rate_limit.exceeded'`, `'deep_learning_job.completed'`)
- `traceId` auto-injected from `AsyncLocalStorage` `traceStore` when within a trace context

## Comments

**When to Comment:**
- All Specialist files begin with a JSDoc block listing PRD references, US numbers, and AC constraints
- Public methods with non-obvious behavior get inline comments
- TD references for known tech debt: `// TD-014: _mode race window...`
- SHIELD blocks for anti-patterns: `// SHIELD: must not await deepLearnAgent.execute synchronously`

**JSDoc pattern:**
```typescript
/**
 * QuanAn · PRD-27 US-003
 * PresentationAgent — describe purpose
 * AC-1: specific acceptance criterion
 * AC-2: another criterion
 */
```

## Function Design

**Size:** Specialist `invokeLLM()` implementations are typically 15-30 lines. Router handlers 20-60 lines. Large prompt builders are private `_buildSystemPrompt()` / `_buildUserPrompt()` helpers.

**Parameters:** Prefer explicit object destructuring from `ctx` in tRPC procedures. Specialist `invokeLLM(ctx: AssembledContext, req: SpecialistRequest<TIn>)` signature is fixed by base class.

**Return Values:**
- tRPC mutations return Prisma `history` row using a `HISTORY_SELECT` `satisfies Prisma.HistorySelect` constant
- Specialist `execute()` always returns `SpecialistResponse<TOut>` (never throws in the outer execute after fallback path)

## Module Design

**Exports:**
- Specialist agents: named class export + singleton instance export (e.g., `export class PresentationAgent` + `export const presentationAgent = new PresentationAgent()`)
- tRPC routers: named export `export const xyzRouter = router({...})`
- Zod schemas: named exports from the schema file (e.g., `export const PresentationOutputSchema = z.object({...})`)
- Types: `export interface` / `export type` — avoid barrel files except in `@quanan/schemas`

**Barrel Files:**
- Workspace packages (`@quanan/schemas`) use barrel exports
- `src/` internals do NOT use barrel `index.ts` files — import directly from the module file

## Specialist Implementation Checklist

When adding a new Specialist:
1. `readonly config: SpecialistConfig` — all 5 layers populated
2. `get inputSchema()` — returns `z.ZodType<TIn>`
3. `get outputSchema()` — returns `z.ZodType<TOut>` (mode-dependent via getter if multi-mode)
4. `static override readonly fallbackTemplate` — keyed by mode, typed as `satisfies TOut`
5. `protected async invokeLLM(ctx, req)` — calls `this.llmGateway.complete()` with `model_tier` from config, `responseFormat: { type: 'json_schema', schema: BaseSchema }`, explicit `timeout_ms`, explicit `metadata`
6. Use a lenient `BaseSchema` (no `.min()/.length()` constraints) for LLM response parsing; strict `OutputSchema` for Zod validation
7. Singleton at module bottom: `export const agentName = new AgentName()`

---

*Convention analysis: 2026-05-21*
