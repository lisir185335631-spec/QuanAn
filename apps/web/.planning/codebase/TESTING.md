# Testing Patterns

**Analysis Date:** 2026-05-20

## Test Framework

**Runner:**
- vitest 2.1 (unit + component tests)
- Config: `vitest.config.ts`

**E2E Runner:**
- Playwright (workspace root `playwright.config.ts`)
- Web-app-scoped E2E specs live in `apps/web/e2e/`
- Project-level visual baseline specs at `tests/e2e/prd21-visual-baseline.spec.ts`, `prd22-visual-baseline.spec.ts`, `prd23-visual-baseline.spec.ts`

**Assertion Library:**
- vitest built-in (`expect`)
- `@testing-library/jest-dom` 6.6 — DOM matchers (`toBeInTheDocument`, `toHaveTextContent`, `toBeDisabled`)

**Run Commands:**
```bash
pnpm test                         # Run all vitest tests (once)
pnpm typecheck                    # TypeScript type check only
pnpm lint                         # ESLint zero-warnings check
pnpm test:e2e                     # Playwright E2E (requires dev server at 5173 + API at 3000)
pnpm test:visual                  # Update visual baseline screenshots (PRD-21)
pnpm test:visual:check            # Assert against baseline screenshots
pnpm test:visual:prd22            # Update PRD-22 visual baseline
pnpm test:visual:prd22:check      # Assert PRD-22 baseline
```

## Test File Organization

**Location pattern:**
- `__tests__/` subdirectory adjacent to the code under test (primary pattern)
- `src/test/` for cross-cutting tests (`pages.test.tsx`, `feedback-button.test.tsx`, `step-progress.test.tsx`)
- Exception: `src/components/StepProgress.test.tsx` co-located directly in `src/components/`

**Naming:**
- `ComponentName.test.tsx` for React component tests
- `hookName.test.tsx` for hook tests
- `kebab-name.test.ts` for pure utility/constant tests
- E2E: `prd-NN-description.spec.ts`

**Test directory map:**
```
src/
├── components/StepProgress.test.tsx
├── components/accounts/__tests__/
│   ├── CreateAccountModal.test.tsx
│   └── IpAccountCard.test.tsx
├── components/diagnosis/__tests__/
│   └── DiagnosisStepCard.test.tsx
├── components/inline-pickers/__tests__/
│   ├── ElementsInlineMultiPicker.test.tsx
│   ├── PlatformInlineRadio.test.tsx
│   └── ScriptTypeInlineCards.test.tsx
├── components/states/__tests__/
│   └── states.test.tsx
├── hooks/__tests__/
│   └── useStepData.test.tsx
├── lib/constants/__tests__/
│   ├── diagnosis.test.ts
│   ├── industries.test.ts
│   └── step3.ts .. step8.ts (per constant file)
├── lib/migration/__tests__/
│   └── legacy-ls.test.ts
├── pages/__tests__/
│   ├── Accounts.test.tsx
│   └── Diagnosis.test.tsx
├── pages/step/__tests__/
│   ├── Step1.test.tsx .. Step8.test.tsx
├── pages/tools/__tests__/
│   ├── AcquisitionVideo.test.tsx
│   ├── Analysis.test.tsx
│   ├── VideoAnalysis.test.tsx
│   └── VideoProduction.test.tsx
└── test/
    ├── setup.ts
    ├── pages.test.tsx          # Smoke tests for 25+ pages
    ├── step-progress.test.tsx
    └── feedback-button.test.tsx
```

## Test Structure

**Suite Organization:**
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

describe('ComponentName', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('AC-1 · H1 字面锁 "Expected Heading Text"', () => {
    render(<MemoryRouter><Component /></MemoryRouter>);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Expected Heading Text');
  });
});
```

**Patterns:**
- Setup: `beforeEach(() => { localStorage.clear(); vi.clearAllMocks(); })`
- Teardown: `spy.mockRestore()` in test body when spying on console
- Assertions: RTL queries + jest-dom matchers; `data-testid` for non-semantic elements
- Async: `userEvent.setup()` + `await user.click(...)` for interaction tests

## Mocking

**Framework:** vitest `vi.mock` and `vi.fn()`

**Standard tRPC Mock Pattern (required in every page/component test):**
```typescript
vi.mock('@/lib/trpc', () => ({
  trpc: {
    namespace: {
      procedure: {
        useQuery: () => ({ data: null, isLoading: false, refetch: vi.fn() }),
        useMutation: () => ({ mutate: vi.fn(), mutateAsync: vi.fn().mockResolvedValue({}), isPending: false }),
      },
    },
  },
}));
```

**Hoisted mock pattern (for mutable references across tests):**
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

**Stub page hook mock pattern (PRD-23 pages mock only useActiveAccount):**
```typescript
vi.mock('@/hooks/useActiveAccount', () => ({
  useActiveAccount: () => ({
    account: { id: 1, name: 'Test', industry: '企业服务', platform: 'douyin', stage: 'starter' },
    switchTo: vi.fn(),
    isSwitching: false,
    isLoading: false,
  }),
}));
```

**Sonner mock:**
```typescript
vi.mock('sonner', () => ({ toast: { error: vi.fn(), info: vi.fn(), success: vi.fn() } }));
```

**What to Mock:**
- Always mock `@/lib/trpc` in component/page tests (prevents real HTTP + TRPCProvider requirement)
- Mock `sonner` when testing toast.error/info/success calls
- Mock `@/hooks/useActiveAccount` in stub pages (they only read account.industry, not tRPC)
- Use `vi.spyOn(console, 'error').mockImplementation(() => {})` to suppress expected errors

**What NOT to Mock:**
- `localStorage` — jsdom provides real in-memory impl; use `localStorage.clear()` in `beforeEach`
- React Router — use `<MemoryRouter>` wrapping instead
- Pure utility functions (`ls-namespace.ts`, `utils.ts`) — test directly

## Fixtures and Factories

**Test Data:**
```typescript
// LS seeding for hook tests
localStorage.setItem('aiip_memory_acc_1_step1', JSON.stringify({ industry: '美妆' }));

// Account factory in stub page tests
account: { id: 1, name: 'AI 创业者小张', industry: '企业服务', platform: 'douyin', stage: 'starter' }
```

**Location:** No separate fixtures directory; test data inline in test files.
Constants from production code imported directly to validate against spec (e.g., `STEP1_INDUSTRIES_56` tested to have exactly 56 entries).

## Coverage

**Requirements:** Not enforced (no threshold in `vitest.config.ts`)

**View Coverage:**
```bash
pnpm vitest run --coverage
```

## Test Types

**Unit Tests:**
- Scope: Pure functions, constants, hook behavior, LS utilities
- Approach: Direct import; assert return values; localStorage tested via jsdom
- Examples: `src/lib/constants/__tests__/diagnosis.test.ts`, `src/lib/migration/__tests__/legacy-ls.test.ts`, `src/hooks/__tests__/useStepData.test.tsx`

**Component Tests (tRPC-connected pages):**
- Scope: Full page render with mocked tRPC; interaction flows
- Approach: `render(<MemoryRouter><Page /></MemoryRouter>)` + RTL queries + `fireEvent`
- Examples: `src/pages/step/__tests__/Step1.test.tsx`, `src/pages/__tests__/Diagnosis.test.tsx`

**Component Tests (stub pages — PRD-23 pattern):**
- Scope: Local state form + CTA disabled/enabled + output grid render
- Approach: Mock only `useActiveAccount`; no tRPC mock needed
- Standard assertions: H1 字面锁 / subtitle 字面锁 / CTA disabled initially / CTA enabled after fill / output section renders
- Example: `src/pages/tools/__tests__/AcquisitionVideo.test.tsx` — ≥5 tests per stub page
- Minimum test count: 4 tests per stub tool page (AC-6 requirement in PRD-23)

**Smoke Tests (pages.test.tsx):**
- Scope: All 25+ pages render without crashing; H1 heading present
- Approach: Full tRPC mock covering all namespaces used; `render` + `getByRole('heading', { level: 1 })`
- Location: `src/test/pages.test.tsx`
- Note: Growing file — new pages must be added to the tRPC mock and the smoke test suite

**E2E Tests (Playwright):**
- Location: `apps/web/e2e/` (web-app flow tests); `tests/e2e/` (project-level + visual baseline)
- Scope: Full browser flow with real API (requires dev server + backend running)
- Console error gate: `consoleErrors === []` hard requirement per PRD-17
- Visual regression: `toHaveScreenshot` with `maxDiffPixelRatio: 0.05`, `threshold: 0.2`
- PRD-23 visual baseline spec: `tests/e2e/prd23-visual-baseline.spec.ts`

## Common Patterns

**Async Testing:**
```typescript
import userEvent from '@testing-library/user-event';

it('calls mutation on click', async () => {
  const user = userEvent.setup();
  render(<MemoryRouter><FeedbackButton stepKey="step1" agentId="test" /></MemoryRouter>);
  await user.click(screen.getByLabelText('有帮助'));
  expect(mockMutate).toHaveBeenCalledWith({ stepKey: 'step1', agentId: 'test', type: 'good' });
});
```

**Multi-step Wizard Testing (Diagnosis pattern):**
```typescript
it('8 step navigation', () => {
  render(<MemoryRouter><Diagnosis /></MemoryRouter>);
  // Navigate through all steps
  for (let i = 0; i < 8; i++) {
    fireEvent.click(screen.getByTestId('diagnosis-next'));
  }
  expect(screen.getByTestId('diagnosis-report')).toBeInTheDocument();
});
```

**Hook Testing:**
```typescript
import { renderHook, act } from '@testing-library/react';

it('save() writes LS then calls mutation', () => {
  const { result } = renderHook(() => useStepData(1, 'step1'));
  act(() => { result.current.save({ industry: '科技' }); });
  expect(localStorage.getItem('aiip_memory_acc_1_step1')).toBe(JSON.stringify({ industry: '科技' }));
});
```

**Router-dependent Testing:**
```typescript
// Always wrap in MemoryRouter when component uses Link, useNavigate, or useLocation
render(<MemoryRouter><Step1 /></MemoryRouter>);
```

## data-testid Conventions

**Global components:**
- `data-testid="app-header"` — Header
- `data-testid="header-login-button"` — Login button
- `data-testid="header-hamburger"` — Mobile menu toggle
- `data-testid="header-logout-icon"` — Logout button
- `data-testid="feedback-buttons"`, `"feedback-good"`, `"feedback-bad"` — FeedbackButton

**Diagnosis page (PRD-23):**
- `data-testid="diagnosis-next"` — Next step button
- `data-testid="diagnosis-prev"` — Previous step button
- `data-testid="diagnosis-industry"` — Industry input (step 1)
- `data-testid="diagnosis-product"` — Product input (step 1)
- `data-testid="diagnosis-checkbox-{label}"` — Checkbox options (step 2+)
- `data-testid="diagnosis-report"` — Report container (after step 8)
- `data-testid="export-pdf-button"` — Export PDF button
- `data-testid="report-dimension-{id}"` — Individual dimension card

**Stub tool pages (PRD-23):**
- `data-testid="acq-industry-select"` — AcquisitionVideo industry select
- `data-testid="acq-audience-textarea"` — AcquisitionVideo audience input
- `data-testid="acq-selling-points-textarea"` — AcquisitionVideo selling points
- `data-testid="acquisition-video-output"` — AcquisitionVideo result grid
- `data-testid="analysis-output"` — Analysis output container
- `data-testid="video-analysis-output"` — VideoAnalysis output container

**Account management (PRD-23):**
- `data-testid="accounts-grid"` — Accounts page grid
- `data-testid="account-card-{id}"` — IpAccountCard
- `data-testid="account-create-modal-trigger"` — CreateAccountModal trigger

---

*Testing analysis: 2026-05-20*
