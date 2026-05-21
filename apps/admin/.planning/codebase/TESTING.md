# Testing Patterns — apps/admin

**Analysis Date:** 2026-05-21

## Test Framework

**Unit Test Runner:**
- Vitest 2.1
- Config: `apps/admin/vitest.config.ts`
- Environment: jsdom (simulates browser DOM)

**Assertion Library:**
- `@testing-library/jest-dom` 6.6 — custom DOM matchers
- Vitest built-in `expect` — function matchers

**Component Rendering:**
- `@testing-library/react` 16 — `render`, `screen`

**Run Commands:**
```bash
# From apps/admin/
pnpm test                    # Run all unit tests once (vitest run)
pnpm typecheck               # tsc --noEmit type check

# From repo root:
pnpm --filter @quanan/admin test

# Playwright e2e (from repo root):
pnpm playwright test --project=admin        # Admin e2e only (port 5174)
pnpm playwright test tests/e2e/prd26-admin-visual-baseline.spec.ts --update-snapshots
pnpm playwright test tests/e2e/prd26-admin-role-matrix.spec.ts
pnpm playwright test tests/e2e/prd26-admin-pages-smoke.spec.ts
pnpm playwright test tests/e2e/admin/admin-foundation-loop.spec.ts
```

## Test File Organization

**Location:**
- Co-located inside page directories: `src/pages/<domain>/__tests__/<PageName>.test.tsx`
- 17 test files — one per admin domain page
- Test setup: `src/test/setup.ts` (imports `@testing-library/jest-dom`)

**Naming:**
- Unit: `<PascalCasePage>.test.tsx` (e.g., `NsmDashboard.test.tsx`, `FeatureFlagsPage.test.tsx`)
- E2e (Playwright): `<descriptive-name>.spec.ts` or `prd<N>-admin-<name>.spec.ts`

**Structure:**
```
src/pages/
└── nsm/
    ├── index.tsx
    ├── NsmAlerts.tsx
    └── __tests__/
        └── NsmDashboard.test.tsx

tests/e2e/
├── admin/
│   ├── _admin-seed.ts                       # Shared Prisma seed helpers
│   ├── admin-foundation-loop.spec.ts        # 7-step login/layout/logout loop
│   └── prd13-*.test.ts / prd14-*.test.ts   # Service-level integration tests
└── prd26-admin-pages-smoke.spec.ts          # 17-page smoke
    prd26-admin-visual-baseline.spec.ts      # 17-page visual diff
    prd26-admin-role-matrix.spec.ts          # 3-role RBAC matrix
```

## Test Structure

**Suite Organization:**

All 17 unit tests follow the exact same 3-test pattern:

```typescript
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import PageComponent from '../index';  // or '../PageName'

// 1. Declare hoisted mutable mock
const { mockPrimaryQuery } = vi.hoisted(() => ({ mockPrimaryQuery: vi.fn() }));

// 2. Mock entire admin-client module
vi.mock('@/lib/admin-client', () => {
  const q = (data: unknown = null) => () => ({
    data, isLoading: false, isPending: false, refetch: () => {},
  });
  const m = () => ({
    mutate: () => {}, mutateAsync: async () => ({}), isPending: false,
  });
  return {
    adminTrpc: {
      auth: { me: { useQuery: q({ role: 'admin' }) } },
      <domain>: {
        <primaryProcedure>: { useQuery: mockPrimaryQuery },
        <otherProcedure>: { useQuery: q() },   // fixed stub
        <mutation>: { useMutation: m },
      },
    },
    adminQueryClient: {},
    adminTrpcClient: {},
  };
});

// 3. Reset primary mock before each test
beforeEach(() => {
  mockPrimaryQuery.mockReturnValue({
    data: null, isLoading: false, isPending: false, refetch: () => {},
  });
});

// 4. Standard 3 test cases
describe('<PageName>', () => {
  it('renders without crash', () => {
    render(<PageComponent />, { wrapper: MemoryRouter });
  });

  it('<heading text> 主标题', () => {
    render(<PageComponent />, { wrapper: MemoryRouter });
    expect(screen.getByText(/<heading>/)).toBeInTheDocument();
  });

  it('loading state when isPending', () => {
    mockPrimaryQuery.mockReturnValue({
      data: undefined, isLoading: true, isPending: true, refetch: () => {},
    });
    render(<PageComponent />, { wrapper: MemoryRouter });
  });
});
```

**Patterns:**
- Setup: `vi.hoisted` + `vi.mock` at module level; `beforeEach` reset
- Teardown: None needed (jsdom auto-resets between tests via Vitest)
- Assertion: `screen.getByText(/pattern/)` + `toBeInTheDocument()`
- Wrapper: All renders use `{ wrapper: MemoryRouter }` to satisfy `useSearchParams` / `useLocation` dependencies

## Mocking

**Framework:** Vitest `vi.mock` + `vi.hoisted`

**Canonical mock pattern for `@/lib/admin-client`:**

```typescript
// q = useQuery factory
const q = (data: unknown = null) => () => ({
  data, isLoading: false, isPending: false, refetch: () => {},
});
// m = useMutation factory
const m = () => ({
  mutate: () => {}, mutateAsync: async () => ({}), isPending: false,
});
```

Pages that call `adminTrpc.useUtils()` need an extra stub:
```typescript
// Example from FeatureFlagsPage.test.tsx
adminTrpc: {
  useUtils: () => ({}),
  // ...
}
```

Pages with pending list fetches (e.g., ApprovalGatesPage) need nested utils:
```typescript
adminTrpc: {
  useUtils: () => ({
    approvals: {
      listPending: { fetch: async () => ({ items: [], nextCursor: null }) },
      listDecided: { fetch: async () => ({ items: [], nextCursor: null }) },
    },
  }),
  // ...
}
```

**What to Mock:**
- Always: `@/lib/admin-client` — replaces all tRPC hooks with synchronous stubs
- Always: React Router deps satisfied by `{ wrapper: MemoryRouter }` — no explicit mock needed

**What NOT to Mock:**
- `@quanan/ui/admin` components — render real UI (Sidebar, DenseTable, etc. are pure presentational)
- `react-router-dom` hooks — `MemoryRouter` wrapper handles them

## Fixtures and Factories

**Test Data (unit tests):**
- No fixture files; data is inlined in mock return values
- Null/empty data is the default; tests override with `mockReturnValue` per case

**Test Data (e2e / integration):**

```typescript
// tests/e2e/admin/_admin-seed.ts — shared Playwright/Vitest seed helpers
import { createPrismaClient, seedAdminUser } from './_admin-seed';

// Create real DB client for test DB
prisma = createPrismaClient();  // uses DATABASE_URL env

// Seed an admin user fixture
await seedAdminUser(prisma, {
  email: 'e2e-test@quanan.com',
  role: 'super_admin',
  allowedDomains: [],   // empty = all domains
});

// Seed domain-restricted user
await seedAdminUser(prisma, {
  email: 'domain-admin@quanan.com',
  role: 'domain_admin',
  allowedDomains: ['users', 'accounts', 'cost'],
});
```

**Storage State (Playwright auth reuse):**
```typescript
// Pattern in prd26-admin-visual-baseline.spec.ts and prd26-admin-pages-smoke.spec.ts
const STORAGE_STATE = '/tmp/prd26-admin-visual-auth.json';

// Pre-create empty file so Playwright context doesn't ENOENT
if (!existsSync(STORAGE_STATE)) {
  writeFileSync(STORAGE_STATE, JSON.stringify({ cookies: [], origins: [] }));
}

test.use({ storageState: STORAGE_STATE });  // all tests in describe block reuse this session

test.beforeAll(async ({ browser }) => {
  // Login + save session state once; all tests in the suite reuse it
  await page.goto('/login');
  // ... fill email + submit + waitForURL(/\/admin/)
  await page.context().storageState({ path: STORAGE_STATE });
});
```

**Location:**
- E2e seed helper: `tests/e2e/admin/_admin-seed.ts`
- Storage states: `/tmp/` (ephemeral, per run)

## Coverage

**Requirements:** No enforced coverage threshold in `vitest.config.ts`

**Current state:** 51 `it()` assertions across 17 test files (3 per file standard)

**View Coverage:**
```bash
# From apps/admin/:
pnpm vitest run --coverage   # Requires @vitest/coverage-v8 (not in devDeps — would need adding)
```

## Test Types

**Unit Tests:**
- Scope: Individual page components in isolation
- Approach: Mock all tRPC calls; verify render + heading text + loading state
- Count: 51 `it()` calls in 17 `__tests__/` files
- Runner: Vitest + jsdom

**Integration Tests (Playwright service-level, in `tests/e2e/admin/`):**
- Scope: Backend services with real test DB (e.g., `prd14-ab-experiment-e2e.test.ts`)
- Approach: Real Prisma to `quanqn_test`; mock only Redis + BullMQ
- Runner: Vitest (via `describe`/`it`) — these are in the e2e folder but run with Vitest, not Playwright

**E2E Tests (Playwright, `admin` project):**
- Scope: Full browser → login → page navigation → DB verification
- Config: `playwright.config.ts` `admin` project — `baseURL: http://localhost:5174`, `workers: 1`, `fullyParallel: false`
- Key specs:
  - `tests/e2e/admin/admin-foundation-loop.spec.ts` — 7-step login/layout/audit/logout loop
  - `tests/e2e/prd26-admin-pages-smoke.spec.ts` — HTTP 200 + heading visible + 0 console errors + render <3s for all 17 pages
  - `tests/e2e/prd26-admin-visual-baseline.spec.ts` — screenshot diff at `maxDiffPixelRatio: 0.05` for all 17 pages at 1440x900
  - `tests/e2e/prd26-admin-role-matrix.spec.ts` — 3-role RBAC matrix (super_admin / domain_admin / reviewer), sidebar filtering, redirect behavior

**Visual Baseline Tests:**
- Framework: Playwright `toHaveScreenshot` via `expectVisualMatch` helper
- Baseline storage: `/tmp/aiipznt-clone-research/screenshots/` (configured in `snapshotDir`)
- Threshold: `maxDiffPixelRatio: 0.05`, `threshold: 0.2`
- Viewport: 1440x900 (Desktop Chrome)
- Regenerate: `playwright test prd26-admin-visual-baseline.spec.ts --update-snapshots`

## Common Patterns

**Async Testing (unit):**
```typescript
// Not needed for unit tests — all hooks are synchronous stubs
// For rare async cases:
it('handles async mutation', async () => {
  const { mutate } = adminTrpc.users.banUser.useMutation();
  // stubs return resolved promises in `m()` factory
  await expect(mutate({ userId: 1, reason: 'test' })).resolves.not.toThrow();
});
```

**Error Testing:**
```typescript
// Unit: test error display by mocking with isError state
// Note: current tests don't explicitly test error state — coverage gap
// Pattern to add:
const { mockList } = vi.hoisted(() => ({ mockList: vi.fn() }));
beforeEach(() => mockList.mockReturnValue({ data: null, isLoading: false, isPending: false, error: new Error('fail'), isError: true }));
it('shows error state', () => {
  render(<UsersPage />, { wrapper: MemoryRouter });
  expect(screen.getByText(/error|失败/i)).toBeInTheDocument();
});
```

**E2E Auth Reuse Pattern:**
```typescript
// Seed once in beforeAll + save storageState
// Use test.use({ storageState: STORAGE_STATE }) at suite level
// All tests in suite skip login entirely
```

---

*Testing analysis: 2026-05-21*
