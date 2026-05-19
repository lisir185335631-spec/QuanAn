# Testing Patterns

**Analysis Date:** 2026-05-19

## Test Framework

**Runner:**
- vitest 2.1 (unit + component tests)
- Config: `vitest.config.ts`

**E2E Runner:**
- Playwright (version in workspace root `package.json`)
- Config: `playwright.config.ts` (apps/web local config for `e2e/` directory)

**Assertion Library:**
- vitest built-in (`expect`)
- @testing-library/jest-dom 6.6 (DOM matchers: `toBeInTheDocument`, `toHaveTextContent`, `toHaveAttribute`)

**Run Commands:**
```bash
pnpm test                      # Run all vitest tests (once)
pnpm typecheck                 # TypeScript type check (no test run)
pnpm lint                      # ESLint (zero warnings)
pnpm test:e2e                  # Run Playwright E2E (requires dev server)
pnpm test:visual               # Update visual baseline screenshots
pnpm test:visual:check         # Assert against baseline screenshots
```

## Test File Organization

**Location:**
- Co-located `__tests__/` subdirectory adjacent to the code under test (preferred pattern)
- Exception: `src/test/` for cross-cutting tests (`pages.test.tsx`, `step-progress.test.tsx`, `feedback-button.test.tsx`)
- Exception: Component tests co-located in same directory (`src/components/StepProgress.test.tsx`)

**Naming:**
- `ComponentName.test.tsx` for React component tests
- `hookName.test.tsx` for hook tests
- `module-name.test.ts` for pure utility/constant tests
- E2E: `prd-NN-description.spec.ts`

**Structure:**
```
src/
├── components/StepProgress.test.tsx       # Co-located
├── components/states/__tests__/
│   └── states.test.tsx
├── hooks/__tests__/
│   └── useStepData.test.tsx
├── lib/constants/__tests__/
│   ├── industries.test.ts
│   └── step3.ts .. step8.ts (one per constant file)
├── lib/migration/__tests__/
│   └── legacy-ls.test.ts
├── pages/step/__tests__/
│   ├── Step1.test.tsx .. Step8.test.tsx
└── test/
    ├── setup.ts               # Global test setup
    ├── pages.test.tsx         # Smoke tests for 20+ pages
    ├── step-progress.test.tsx
    └── feedback-button.test.tsx
```

## Test Structure

**Suite Organization:**
```typescript
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

describe('ComponentName', () => {
  it('renders correct heading', () => {
    render(<Component />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('...');
  });

  it('shows empty state when no data', () => {
    render(<Component />);
    expect(screen.getByText('暂无数据')).toBeInTheDocument();
  });
});
```

**Patterns:**
- Setup: `beforeEach(() => { localStorage.clear(); vi.clearAllMocks(); })`
- Teardown: `vi.restoreAllMocks()` / `spy.mockRestore()` in test body
- Assertion: RTL queries + jest-dom matchers; `data-testid` attributes for non-semantic elements
- Async: `userEvent.setup()` + `await user.click(...)` for interaction tests

## Mocking

**Framework:** vitest `vi.mock` and `vi.fn()`

**Standard tRPC Mock Pattern (used in every page/component test):**
```typescript
vi.mock('@/lib/trpc', () => ({
  trpc: {
    namespace: {
      procedure: {
        useQuery: () => ({ data: null, isLoading: false, refetch: vi.fn() }),
        useMutation: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false }),
      },
    },
  },
  queryClient: {},
  trpcClient: {
    subscription: { subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })) },
  },
}));
```

**Hoisted mocks pattern (for mutable mock references):**
```typescript
const { mockMutate, mockUseQuery } = vi.hoisted(() => ({
  mockMutate: vi.fn(),
  mockUseQuery: vi.fn(() => ({ data: null, isLoading: false })),
}));

vi.mock('@/lib/trpc', () => ({
  trpc: {
    stepData: {
      save: { useMutation: () => ({ mutate: mockMutate, isPending: false }) },
      get: { useQuery: mockUseQuery },
    },
  },
}));
```

**Sonner mock:**
```typescript
vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));
```

**What to Mock:**
- Always mock `@/lib/trpc` in component/page tests (prevents real HTTP calls + TRPCProvider requirement)
- Mock `sonner` when testing toast behavior
- Use `vi.spyOn(console, 'error').mockImplementation(() => {})` to suppress expected console errors in ErrorBoundary tests

**What NOT to Mock:**
- localStorage (jsdom provides a real in-memory implementation; use `localStorage.clear()` in `beforeEach`)
- React Router — use `<MemoryRouter>` instead of mocking
- Pure utility functions (`ls-namespace.ts`, `utils.ts`) — test them directly

## Fixtures and Factories

**Test Data:**
```typescript
// Direct inline data in test
localStorage.setItem('aiip_memory_acc_1_step1', JSON.stringify({ industry: '美妆' }));

// Constants from production code (verified in constant tests)
const STEP1_INDUSTRIES_56 — tested to have exactly 56 entries
```

**Location:**
- No separate fixtures directory; test data is inline in test files
- Production constants (`STEP1_INDUSTRIES_56`, `STEP_ORDER_KEYS`) are imported directly into tests to validate against spec

## Coverage

**Requirements:** Not enforced (no coverage threshold in `vitest.config.ts`)

**View Coverage:**
```bash
# Not configured; add --coverage flag to vitest run
pnpm vitest run --coverage
```

## Test Types

**Unit Tests:**
- Scope: Pure functions, constants, hook behavior, LS utilities
- Approach: Import directly, assert return values; localStorage test with jsdom
- Examples: `src/lib/constants/__tests__/industries.test.ts`, `src/lib/migration/__tests__/legacy-ls.test.ts`, `src/hooks/__tests__/useStepData.test.tsx`

**Component Tests:**
- Scope: Single component render + interaction; tRPC mocked
- Approach: `render()` + RTL queries; `userEvent` for interactions
- Examples: `src/test/feedback-button.test.tsx`, `src/test/step-progress.test.tsx`, `src/pages/step/__tests__/Step1.test.tsx`

**Smoke Tests (page render):**
- Scope: All 20+ pages render without crashing with mocked tRPC
- Approach: `render(<Page />)` → `screen.getByRole('heading', { level: 1 })` → assert text
- Location: `src/test/pages.test.tsx`

**E2E Tests:**
- Framework: Playwright
- Location: `e2e/` directory
- Scope: Full browser flow with real API (requires dev server + backend)
- Examples: `prd-17-step1-3-3b.spec.ts` — Step 1 → Step 3 → Step 3b flow with LS cross-step data passing
- Assertions: `page.locator('text=...')`, `page.screenshot()` for visual snapshots
- Console error gate: `consoleErrors === []` hard requirement per PRD-17

**Visual Regression Tests:**
- Framework: Playwright + `toHaveScreenshot`
- Location: E2E spec files with screenshot assertions
- Config: `maxDiffPixelRatio: 0.05`, `threshold: 0.2`, animations disabled
- Baseline management: `pnpm test:visual` to update, `pnpm test:visual:check` to assert

## Common Patterns

**Async Testing:**
```typescript
import userEvent from '@testing-library/user-event';

it('calls mutate on click', async () => {
  const user = userEvent.setup();
  render(<FeedbackButton stepKey="step1" agentId="test" />);
  await user.click(screen.getByLabelText('有帮助'));
  expect(mockMutate).toHaveBeenCalledWith({ stepKey: 'step1', agentId: 'test', type: 'good' });
});
```

**Error Testing (ErrorBoundary):**
```typescript
it('renders fallback when child throws', () => {
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
  render(<ErrorBoundary><BrokenComponent /></ErrorBoundary>);
  expect(screen.getByText('页面加载出错')).toBeInTheDocument();
  spy.mockRestore();
});
```

**Hook Testing:**
```typescript
import { renderHook, act } from '@testing-library/react';

it('save() writes LS then calls mutation', () => {
  const { result } = renderHook(() => useStepData(1, 'step1'));
  act(() => { result.current.save({ industry: '科技' }); });
  expect(localStorage.getItem('aiip_memory_acc_1_step1')).toBe(JSON.stringify({ industry: '科技' }));
  expect(mockMutate).toHaveBeenCalled();
});
```

**Router-dependent Component Testing:**
```typescript
// Always wrap in MemoryRouter when component uses Link, useNavigate, or useLocation
render(<MemoryRouter><Step1 /></MemoryRouter>);
```

**data-testid Conventions:**
- `data-testid="app-header"` — Header component
- `data-testid="header-login-button"` — Login button
- `data-testid="header-hamburger"` — Mobile menu toggle
- `data-testid="feedback-buttons"`, `"feedback-good"`, `"feedback-bad"` — FeedbackButton
- `data-testid="account-switcher-trigger"`, `"account-switcher-menu"` — AccountSwitcher
- `data-testid="step-{stepKey}"` — StepProgress step items (used with `data-status` attribute)
- `data-testid="ip-plan-page"` — IpPlan page root
- `data-testid="record-button"`, `"turn-list"` — VoiceChat

---

*Testing analysis: 2026-05-19*
