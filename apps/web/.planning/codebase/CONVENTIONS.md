# Coding Conventions

**Analysis Date:** 2026-05-20

## Naming Patterns

**Files:**
- React components: `PascalCase.tsx` (`FadeInWrapper.tsx`, `DiagnosisStepCard.tsx`, `IpAccountCard.tsx`)
- React hooks: `useCamelCase.ts` (`useStepData.ts`, `useActiveAccount.ts`)
- Utility/library modules: `kebab-case.ts` (`ls-namespace.ts`) or `camelCase.ts` (`trpc.ts`, `utils.ts`)
- Constant files: `kebab-case.ts` under `src/lib/constants/` (`diagnosis.ts`, `header-nav.ts`)
- Test files: `ComponentName.test.tsx` or `moduleName.test.ts`
- Barrel files: `index.ts`

**Functions:**
- Regular functions: `camelCase` (`genTraceId`, `clearLsNamespace`, `stubScore`)
- React components: `PascalCase` — named exports for shared components, default exports for pages
- Custom hooks: `useNoun` pattern (`useAuth`, `useEvolution`, `useActiveAccount`)

**Variables:**
- Runtime variables: `camelCase` (`accountId`, `trpcClient`, `filteredIndustries`)
- String literal constants: `SCREAMING_SNAKE_CASE` (`DIAGNOSIS_H1`, `STEP1_CTA_LABEL`, `HEADER_NAV`, `LS_PREFIX`)
- Readonly arrays with count suffix: `STEP1_INDUSTRIES_56`, `DIAGNOSIS_DIMENSIONS_8`, `REPORT_DIMENSIONS_7`
- All string literal constants must use `as const`

**Types/Interfaces:**
- Component props: `PascalCase` + `Props` suffix (`StepFormProps`, `FadeInWrapperProps`, `IpAccountCardProps`)
- API output types: `PascalCaseOutput` imported from `@quanan/clients/router-types` (`AuthMeOutput`, `ActiveAccountOutput`)
- Domain types: `PascalCase` without suffix (`StepMeta`, `HeaderNavGroup`, `DiagnosisProgress`)

## Code Style

**Formatting:**
- Single quotes for strings
- 2-space indentation
- Trailing commas in multi-line structures
- Semicolons used

**Linting:**
- ESLint with `--max-warnings=0` (zero-tolerance) per `package.json` scripts
- `react-hooks/exhaustive-deps` — suppressed in some step pages with `// eslint-disable-next-line`; new suppressions must include `// intentional: <reason>`
- `@typescript-eslint/no-explicit-any` — one suppression in `StepForm.tsx` for `ZodTypeAny` prop

## Import Organization

**Order (observed pattern):**
1. External packages (`react`, `react-router-dom`, `framer-motion`, `lucide-react`, `sonner`)
2. Internal `@/components/` aliases
3. Internal `@/hooks/` aliases
4. Internal `@/lib/` aliases
5. Workspace packages (`@quanan/clients/router-types`)
6. Relative imports (`./sub-component`)
7. Type-only imports (`import type { ... }`) at end of block

**Path Aliases:**
- `@/*` → `src/*` (defined in `tsconfig.app.json` and `vite.config.ts`)
- `@quanan/schemas` → `../../packages/schemas/src`
- `@quanan/ui` → `../../packages/ui/src`
- `@quanan/clients` → `../../packages/clients/src`
- Cross-package type imports always use `import type` to keep `@trpc/server` out of the browser bundle

## Error Handling

**Patterns:**
- Async mutation failures → `toast.error('...')` via sonner; never blocks UX
- Query failures → render `<ErrorState onRetry={...} />` component
- Render crashes → `ErrorBoundary` class component with reset button
- LS failures (`QuotaExceededError`) → `console.warn` + continue; non-fatal
- `console.error`/`console.warn` with `[ModuleName]` prefix (`[useStepData]`, `[migrateLegacyLs]`)
- Failed DB writes on step save intentionally not rolled back in LS (ADR-010 dual-write)
- Stub page button actions → `toast.info('功能 PRD-25+')` when feature deferred

## Logging

**Framework:** `console` (no structured logger or remote aggregation)

**Patterns:**
- Error boundary: `console.error('[ErrorBoundary]', error, info.componentStack)`
- DB write failure: `console.error('[useStepData] DB write failed', { traceId, stepKey, accountId })`
- Migration warning: `console.warn('[migrateLegacyLs] QuotaExceededError...')`
- Stub hooks use `[HookName]` prefix convention

## Comments

**When to Comment:**
- File-level JSDoc with PRD/US reference and key AC numbers (consistent across step pages, hooks, utilities)
- Inline comments for AC compliance rationale, LS-first strategy, constant lock source
- `// eslint-disable-next-line` only with companion `// intentional: <reason>` comment

**File-level JSDoc pattern:**
```typescript
/**
 * ModuleName — PRD-N US-XXX
 * AC-1: brief description
 * AC-N: brief description
 */
```

**Stub page header pattern (PRD-23+):**
```typescript
/**
 * PageName.tsx — /route · PRD-23 US-NNN
 * Stub: local state form (no tRPC) + N output sections
 * AC-1: H1 'Literal' + subtitle 字面锁
 * AC-N: stub output description
 */
```

**Literal lock comments:**
```typescript
// AC-1 · H1/subtitle 字面锁 · D-226/227 严守
export const DIAGNOSIS_H1 = '7 维度 IP 诊断报告' as const;
```

## Function Design

**Size:** Page components tend to be large (100-800 lines); sub-components extracted as local functions within the file when used only in that file (e.g., `UserChip`, `HeaderNav` inside `Header.tsx`)

**Parameters:** Destructured interfaces for component props; hooks accept primitives (`accountId: number | null`, `stepKey: string`)

**Return Values:**
- Hooks: plain object with named fields (not tuples)
- Utility functions: explicit typed values or `null`
- Page components: `<main>...</main>` JSX

## Module Design

**Exports:**
- Layouts, shared components: Named exports (`export function RootLayout`)
- Page components: Default exports (`export default function Diagnosis`)
- Hooks: Named exports (`export function useStepData`)
- Constants: Named exports with `as const` (`export const DIAGNOSIS_H1 = '...' as const`)
- Types: Re-exported from hook files for co-location (`export type { ActiveAccountOutput }`)

**Barrel Files:**
- `src/components/states/index.ts` — EmptyState, LoadingState, ErrorState
- `src/components/StepResult/index.ts` — all step result components
- `src/pages/tools/index.ts` — all 15 tool page components

## Design Token Usage

**Colors:** Always use Tailwind token classes from `tailwind.config.ts` (parsed from DESIGN.md YAML):
- `text-primary`, `bg-primary/10`, `text-on-surface`, `bg-surface-container`, `text-muted-foreground`
- Never hardcode hex values in JSX (AGENTS.md LD-015)

**Typography scale:** Use semantic size classes:
- `text-h1`, `text-h2`, `text-h3`, `text-h4`, `text-body-md`, `text-body-sm`, `text-label-md`, `text-label-sm`

**Font families:**
- `font-display` — headings, step numbers, brand text
- `font-cn` — Chinese body text
- `font-label` — labels, tags, button text

**Signature layout patterns:**
```tsx
{/* Page header — consistent across all pages */}
<span className="text-label-sm font-label text-primary uppercase tracking-wide">分类标签</span>
<h1 className="mt-1 text-h1 font-display text-on-surface">页面标题</h1>
<p className="mt-2 text-body-md text-muted-foreground">{SUBTITLE}</p>
```

```tsx
{/* Glass card — output/result containers */}
<div className="glass-card rounded-xl p-5 space-y-4">
```

```tsx
{/* Grid background — all main content areas */}
<main className="flex-1 container py-8 data-grid-bg">
```

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

**Type imports (required — keeps @trpc/server out of browser bundle):**
```typescript
import type { OutputType } from '@quanan/clients/router-types';
```

## Stub Page Pattern (PRD-23)

Pages with local state only (no tRPC) follow this structure:

```typescript
// File header marks stub status
/**
 * PageName.tsx — /route · PRD-23 US-NNN
 * Stub: local state form (no tRPC) + N output sections
 */

// Constants extracted at module level
const SUBTITLE = '副标题文案' as const;

// State: form inputs + submitted flag
const [inputField, setInputField] = useState('');
const [submitted, setSubmitted] = useState(false);

// CTA disabled guard
const isDisabled = !inputField.trim();

// Output conditional on submitted
{submitted && (
  <div data-testid="page-output">
    {/* stub content */}
  </div>
)}
```

---

*Convention analysis: 2026-05-20*
