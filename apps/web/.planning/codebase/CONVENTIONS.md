# Coding Conventions

**Analysis Date:** 2026-05-19

## Naming Patterns

**Files:**
- React components: `PascalCase.tsx` (`FadeInWrapper.tsx`, `StepProgress.tsx`, `AccountSwitcher.tsx`)
- React hooks: `useCamelCase.ts` (`useStepData.ts`, `useActiveAccount.ts`)
- Utility/library modules: `kebab-case.ts` (`ls-namespace.ts`, `step-config.ts`) or `camelCase.ts` (`trpc.ts`, `utils.ts`)
- Constant files: `kebab-case.ts` under `src/lib/constants/` (`header-nav.ts`, `guide-faq.ts`)
- Test files: Same name as subject + `.test.tsx` or `.test.ts`
- Barrel files: `index.ts`

**Functions:**
- Regular functions: `camelCase` (`genTraceId`, `clearLsNamespace`, `handleSubmit`)
- React components: `PascalCase` named exports or default exports for pages
- Custom hooks: `useNoun` pattern (`useAuth`, `useEvolution`)

**Variables:**
- Runtime variables: `camelCase` (`accountId`, `trpcClient`, `filteredIndustries`)
- String literal constants: `SCREAMING_SNAKE_CASE` (`STEP1_CTA_LABEL`, `HEADER_NAV`, `LS_PREFIX`)
- Readonly arrays with count suffix: `STEP1_INDUSTRIES_56`, `STEP3_PLATFORMS_5`
- `as const` on all string literal constants and readonly arrays

**Types/Interfaces:**
- Interfaces: `PascalCase` + `Props` suffix for component props (`ButtonProps`, `StepFormProps`, `FadeInWrapperProps`)
- Output types: `PascalCaseOutput` (imported from `@quanqn/clients/router-types`: `AuthMeOutput`, `ActiveAccountOutput`)
- Domain types: `PascalCase` without suffix (`Industry`, `HeaderNavGroup`, `Turn`)
- Type unions: `PascalCase` (`PageStatus`, `IndustryCategory`, `TabValue`)

## Code Style

**Formatting:**
- Prettier (implied by ESLint config; config file not observed separately)
- Single quotes for strings
- 2-space indentation
- Trailing commas in multi-line structures
- No semicolon omission (semicolons used)

**Linting:**
- ESLint with `--max-warnings=0` (zero-tolerance) per `package.json` scripts
- Rules observed: `react-hooks/exhaustive-deps` (sometimes suppressed with comment)
- `@typescript-eslint/no-explicit-any` (one suppression in `StepForm.tsx`)
- `jsx-a11y/media-has-caption` (one suppression in `VoiceChat.tsx`)

## Import Organization

**Order (observed pattern):**
1. External packages (`react`, `react-router-dom`, `framer-motion`, `lucide-react`, `sonner`)
2. Internal aliases starting with `@/components/`
3. Internal aliases starting with `@/hooks/`
4. Internal aliases starting with `@/lib/`
5. Workspace packages (`@quanqn/clients/router-types`)
6. Relative imports (`./sub-component`)
7. Type-only imports (`import type { ... }`) at end of import block

**Path Aliases:**
- `@/*` → `src/*` (defined in `tsconfig.json` and `vite.config.ts`)
- `@quanqn/schemas` → `../../packages/schemas/src`
- `@quanqn/ui` → `../../packages/ui/src`
- `@quanqn/clients` → `../../packages/clients/src`
- Cross-package type imports always use `import type` to prevent bundling server code

## Error Handling

**Patterns:**
- Async mutation failures → `toast.error('...')` via sonner; no UX blocking
- Query failures → render `<ErrorState onRetry={...} />` component
- Render crashes → `ErrorBoundary` class component with reset button
- LS failures (QuotaExceededError) → `console.warn` + continue; non-fatal
- `console.error`/`console.warn` with `[ModuleName]` prefix for traceability (e.g., `[useStepData]`, `[ErrorBoundary]`)
- Failed DB writes on step save are intentionally not rolled back in LS (ADR-010 dual-write)

## Logging

**Framework:** `console` (no structured logger or remote aggregation)

**Patterns:**
- Error boundary: `console.error('[ErrorBoundary]', error, info.componentStack)`
- DB write failure: `console.error('[useStepData] DB write failed', { traceId, stepKey, accountId })`
- Migration warning: `console.warn('[migrateLegacyLs] QuotaExceededError...')`
- Hooks use `[HookName]` prefix convention

## Comments

**When to Comment:**
- JSDoc at top of file with PRD/US reference and key AC numbers (observed consistently across step pages, hooks, and utility files)
- Inline comments for non-obvious logic (LS-first strategy, AC compliance, constant lock rationale)
- `// eslint-disable-next-line` only with companion reason comment (e.g., `// intentional: avoids infinite refetch loop`)

**File-level JSDoc pattern:**
```typescript
/**
 * ModuleName — US-XXX
 * AC-1: brief description
 * AC-N: brief description
 */
```

**Literal lock comments:**
```typescript
// D1=A 字面锁 — 来源 aiipznt-spec.md §7.1
const STEP1_LABEL = 'STEP 01 · 选择行业赛道' as const;
```

## Function Design

**Size:** Page component functions tend to be large (100-800 lines); sub-components extracted as local functions within the file (e.g., `HeroSection`, `UserChip` inside their parent file)

**Parameters:** Prefer destructured interfaces for component props; hooks accept primitive params (`accountId: number | null`, `stepKey: string`)

**Return Values:**
- Hooks return a plain object with named fields (not arrays)
- Utility functions return explicit typed values or `null`
- Page components return JSX (`<main>...</main>`)

## Module Design

**Exports:**
- Layouts, shared components: Named exports (`export function RootLayout`)
- Page components: Default exports (`export default function Home`)
- Hooks: Named exports (`export function useStepData`)
- Constants: Named exports with `as const`
- Types: Re-exported from hook files for co-location (`export type { ActiveAccountOutput }`)

**Barrel Files:**
- `src/components/states/index.ts` — re-exports EmptyState, LoadingState, ErrorState
- `src/components/StepResult/index.ts` — re-exports all step result components
- `src/pages/tools/index.ts` — re-exports all 14 tool page components

## Design Token Usage

**Colors:** Always use Tailwind token classes derived from `tailwind.config.js`:
- `text-primary`, `bg-primary/10`, `text-on-surface`, `bg-surface-container`
- Never hardcode hex values in JSX (enforced by AGENTS.md LD-015)

**Typography scale:** Use semantic size classes:
- `text-h1`, `text-h2`, `text-body-md`, `text-body-sm`, `text-label-md`, `text-label-sm`

**Font families:**
- `font-display` (Orbitron/Rajdhani) — headings, brand text, step numbers
- `font-cn` (Noto Sans SC) — Chinese body text
- `font-label` (Rajdhani) — labels, tags, button text

**Glass card pattern:**
```tsx
<div className="glass-card rounded-xl p-6">
```
(defined in `src/styles/aiipznt-motion.css` — do not replicate inline)

**Grid background:**
```tsx
<main className="data-grid-bg">
```
(defined in `src/styles/globals.css` — always apply to main content areas)

## tRPC Usage Patterns

**Queries:**
```typescript
const { data, isLoading, isError, refetch } = trpc.namespace.procedure.useQuery(
  input,
  { staleTime: 30_000, retry: false }
);
```

**Mutations:**
```typescript
const mutation = trpc.namespace.procedure.useMutation({
  onError: () => toast.error('...')
});
mutation.mutate(input);
```

**Type imports (required pattern):**
```typescript
import type { OutputType } from '@quanqn/clients/router-types';
```

---

*Convention analysis: 2026-05-19*
