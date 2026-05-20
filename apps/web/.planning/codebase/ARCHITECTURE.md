<!-- refreshed: 2026-05-20 -->
# Architecture

**Analysis Date:** 2026-05-20

## System Overview

```text
┌──────────────────────────────────────────────────────────────────────┐
│                          Browser SPA                                  │
│   main.tsx → trpc.Provider → QueryClientProvider → RouterProvider     │
├──────────────────┬───────────────────────┬───────────────────────────┤
│   RootLayout     │      StepLayout        │   (direct route renders)  │
│  src/layouts/    │  src/layouts/          │   Tool / Module pages     │
│  RootLayout.tsx  │  StepLayout.tsx        │   src/pages/tools/        │
│  (Header +       │  (adds FeedbackButton  │   src/pages/modules/      │
│   Suspense +     │   to all /step/* pages)│                           │
│   Toaster)       │                        │                           │
└────────┬─────────┴──────────┬─────────────┴───────────────────────────┘
         │                    │
         ▼                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          Page Components                                │
│  src/pages/                                                             │
│  ├── Home.tsx            /                                              │
│  ├── Guide.tsx           /guide                                         │
│  ├── IpPlan.tsx          /ip-plan                                       │
│  ├── step/               /step/1-9,3b,4b  (lazy, "step" chunk)         │
│  ├── tools/              /trending, /analysis, /acquisition-video...    │
│  │                       (15 pages total · lazy · "tools" chunk)        │
│  └── modules/            /diagnosis, /accounts, /evolution...           │
│                          (6 pages · lazy · "modules" chunk)             │
└─────────────────────┬──────────────────────────────────────────────────┘
                      │
         ┌────────────┴──────────────┐
         ▼                           ▼
┌─────────────────┐       ┌──────────────────────────────────────┐
│  Custom Hooks   │       │        Component Library              │
│ src/hooks/      │       │ src/components/                       │
│ useActiveAcc.ts │       │ ├── ui/           (Radix wrappers)    │
│ useAuth.ts      │       │ ├── states/       (Empty/Load/Error)  │
│ useEvolution.ts │       │ ├── StepForm/     (generic form)      │
│ useStepData.ts  │       │ ├── StepResult/   (per-step output)   │
└────────┬────────┘       │ ├── ToolForm/     (tool input forms)  │
         │                │ ├── ToolResult/   (tool outputs)      │
         ▼                │ ├── step{N}/      (step-specific)     │
┌─────────────────┐       │ ├── accounts/     (PRD-23 · modal +  │
│  tRPC Client    │       │ │                  card components)   │
│ src/lib/trpc.ts │       │ ├── diagnosis/    (PRD-23 · wizard    │
│ splitLink:      │       │ │                  step card)         │
│  batch→http     │       │ └── ip-plan/      (IP plan grid)      │
│  sub→SSE        │       └──────────────────────────────────────┘
└────────┬────────┘
         │
         ▼ (HTTP + SSE to API server)
┌────────────────────┐
│  Backend API        │
│  apps/api           │
│  localhost:3000     │
└────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| `RootLayout` | Header + Suspense boundary + Toaster + Outlet | `src/layouts/RootLayout.tsx` |
| `StepLayout` | Injects `FeedbackButton` under all `/step/*` routes | `src/layouts/StepLayout.tsx` |
| `Header` | Sticky nav: logo + dropdown nav groups + AccountSwitcher + auth | `src/components/Header.tsx` |
| `AccountSwitcher` | IP account dropdown; calls `switchTo` on select | `src/components/AccountSwitcher.tsx` |
| `FeedbackButton` | Thumbs up/down → `trpc.costLog.logFeedback` mutation | `src/components/FeedbackButton.tsx` |
| `ErrorBoundary` | Class component catch-all with reset button | `src/components/ErrorBoundary.tsx` |
| `FadeInWrapper` | framer-motion fade-in with directional offset | `src/components/FadeInWrapper.tsx` |
| `StepProgress` | 9-step progress tracker; `data-status` attributes | `src/components/StepProgress.tsx` |
| `StreamdownPreview` | Typewriter markdown renderer (requestAnimationFrame) | `src/components/StreamdownPreview.tsx` |
| `StepForm` | Generic react-hook-form wrapper; switch on `stepKey` for fields | `src/components/StepForm/StepForm.tsx` |
| `ToolForm` | Generic tool input form; switch on `toolKey` for fields | `src/components/ToolForm/ToolForm.tsx` |
| `DiagnosisStepCard` | One wizard step in the 8-step IP diagnosis flow | `src/components/diagnosis/DiagnosisStepCard.tsx` |
| `IpAccountCard` | Displays one IP account with activate/edit/delete actions | `src/components/accounts/IpAccountCard.tsx` |
| `CreateAccountModal` | Radix Dialog for creating a new IP account via tRPC | `src/components/accounts/CreateAccountModal.tsx` |
| `EmptyState` / `LoadingState` / `ErrorState` | Reusable feedback states | `src/components/states/` |
| `ui/*` | Radix UI + CVA wrappers: Button, Card, Dialog, Tabs, etc. | `src/components/ui/` |

## Pattern Overview

**Overall:** Layered SPA with LS-first dual-write persistence

**Key Characteristics:**
- Pages are thin orchestrators; business logic lives in custom hooks
- All server communication goes through a single `trpc` client in `src/lib/trpc.ts`
- localStorage is the primary read path; DB is async secondary (dual-write, ADR-010)
- Code split into 3 lazy chunks: `step`, `tools`, `modules`; auxiliary pages are non-lazy
- PRD-23 stub pages use local state only (no tRPC calls) — tagged with `// Stub: ... (no tRPC)` comments

## Layers

**Routing Layer:**
- Purpose: Define URL → component mapping with lazy loading
- Location: `src/router.tsx`
- Contains: `createBrowserRouter` config (34 routes), lazy imports, layout nesting
- Depends on: Layout components, page components
- Used by: `src/main.tsx` (RouterProvider)

**Layout Layer:**
- Purpose: Provide consistent shell (header, suspense, toast)
- Location: `src/layouts/`
- Contains: `RootLayout.tsx`, `StepLayout.tsx`
- Depends on: Header, FeedbackButton, Outlet
- Used by: Router (as parent element for nested routes)

**Page Layer:**
- Purpose: Compose domain UI for a specific route
- Location: `src/pages/`
- Depends on: Hooks, shared components, tRPC, constants
- Used by: Router
- Two modes:
  - **Full (tRPC-connected):** calls `trpc.*` hooks for live data
  - **Stub (local state only):** uses `useState` + hardcoded output; marked in file header comments (PRD-23 pages)

**Component Layer:**
- Purpose: Reusable UI building blocks
- Location: `src/components/`
- Contains: Primitive wrappers (`ui/`), shared states (`states/`), domain components (`StepResult/`, `ToolResult/`, `step{N}/`, `accounts/`, `diagnosis/`)
- Depends on: `src/lib/utils.ts`, `@/components/ui/`
- Used by: Pages, layouts

**Hook Layer:**
- Purpose: Encapsulate data fetching and LS interaction
- Location: `src/hooks/`
- Contains: `useAuth.ts`, `useActiveAccount.ts`, `useStepData.ts`, `useEvolution.ts`
- Depends on: `trpc`, `ls-namespace.ts`, `sonner`
- Used by: Page and component layers

**Library Layer:**
- Purpose: Pure utilities, constants, schemas, config
- Location: `src/lib/`
- Contains: `trpc.ts`, `utils.ts`, `ls-namespace.ts`, `stepConfig.ts`, `constants/`, `schemas/`, `migration/`
- Depends on: External packages only
- Used by: All layers above

## Data Flow

### Step Form Submit → Save → Result

1. User fills form in step page (`src/pages/step/StepN.tsx`)
2. `save()` from `useStepData` called (`src/hooks/useStepData.ts:48`)
3. LS write immediately: `localStorage.setItem(stepLsKey(accountId, stepKey), JSON.stringify(inputs))`
4. `trpc.stepData.save.mutate` fires (fire-and-forget; DB failure shows toast but no LS rollback)
5. Page state shows `<LoadingState>` while pending
6. On success, `dbQuery.data.result` arrives → page renders result section

### Account Switch Flow

1. `AccountSwitcher` → `switchTo(newAccountId)` (`src/hooks/useActiveAccount.ts:38`)
2. `trpc.ipAccounts.switchActive.mutate`
3. On success: `clearLsNamespace(localStorage, oldAccountId)` + `window.location.reload()`
4. On error: `toast.error('切换失败 · 请重试')`

### Diagnosis Wizard Flow (PRD-23 · local state only)

1. `Diagnosis` page manages `DiagnosisProgress` state with `useState` (`src/pages/modules/Diagnosis.tsx`)
2. 8 steps via `DiagnosisStepCard` component; progress saved to `localStorage.setItem(getLsKey(accountId, 'diagnosis_progress'), ...)`
3. After step 8 next, `showReport: true` → renders 7-dimension report with stub scores
4. Export PDF button → `toast.info('导出功能 PRD-25+')` (stub)
5. No tRPC calls — fully client-side

### Stub Tool Page Flow (PRD-23 · AcquisitionVideo, VideoAnalysis, Analysis, VideoProduction)

1. Page renders input form with `useState` (no hook dependencies)
2. Submit sets `submitted: true`
3. Stub output section renders (static "AI 生成中…" placeholders)
4. No tRPC mutations fired

### Voice Chat (SSE Subscription)

1. `trpcClient.voiceChat.start.subscribe(...)` → SSE stream (`src/pages/tools/VoiceChat.tsx`)
2. `VoiceChatStreamChunk` events: text delta → assemble turn bubble
3. `done` event → `trpc.tts.synthesize` → audio URL → `<audio>` autoplay

**State Management:**
- Server state: React Query (via tRPC)
- Persistent local state: `localStorage` with `aiip_memory_acc_` namespace
- Ephemeral UI state: React `useState` within page components
- URL state: `useSearchParams` in Trending, History, DeepLearning

## Key Abstractions

**LS Namespace:**
- Purpose: Per-account localStorage isolation
- Examples: `src/lib/ls-namespace.ts`
- Pattern: `stepLsKey(accountId, stepKey)` → `aiip_memory_acc_{id}_{key}`

**tRPC Client (splitLink):**
- Purpose: Single HTTP client routing subscriptions to SSE, rest to batch-stream
- Examples: `src/lib/trpc.ts`
- Pattern: `splitLink({ condition: op.type === 'subscription', true: httpSubscriptionLink, false: httpBatchStreamLink })`

**Constants as Literal Locks:**
- Purpose: 1:1 spec compliance — UI strings are exported named `const` from `src/lib/constants/`
- Examples: `src/lib/constants/diagnosis.ts` (`DIAGNOSIS_H1`, `DIAGNOSIS_DIMENSIONS_8`, `REPORT_DIMENSIONS_7`)
- Pattern: `export const DIAGNOSIS_H1 = '7 维度 IP 诊断报告' as const`

**Design Tokens:**
- Purpose: Colors/spacing from `../../ui/aurelian_dark/DESIGN.md` YAML → Tailwind classes
- Pattern: Never hardcode hex values; always use token names (`text-primary`, `bg-surface-container`)

**Stub Page Pattern (PRD-23):**
- Purpose: Visual-complete pages without backend integration (placeholder for future LLM wiring)
- Pattern: File header comment `// Stub: local state form (no tRPC) + N output sections`; `submitted` state gates output section
- Examples: `src/pages/tools/AcquisitionVideo.tsx`, `src/pages/tools/Analysis.tsx`

## Entry Points

**Application:**
- Location: `src/main.tsx`
- Triggers: Browser loads `index.html` → imports `main.tsx`
- Responsibilities: Mount React tree with providers (tRPC, QueryClient, Router)

**Router:**
- Location: `src/router.tsx`
- Triggers: `RouterProvider` render
- Responsibilities: 34 routes across 3 lazy chunk groups + auxiliary pages

## Architectural Constraints

- **Threading:** Single-threaded browser event loop; SSE handled via `@trpc/client` observable
- **Global state:** Single `queryClient` and `trpcClient` instances in `src/lib/trpc.ts`; no other module-level mutable state
- **Circular imports:** None detected; `@quanan/clients` uses `import type` to prevent circular dependency
- **LS-first:** Step data always written to LS before DB; DB failure must never roll back LS (ADR-010)
- **No SSR:** Pure SPA; `#root` must exist in `index.html`
- **Stub pages must not call tRPC:** PRD-23 stubs are intentionally isolated; wiring happens in a dedicated future PRD

## Anti-Patterns

### Suppressed `react-hooks/exhaustive-deps` in Page Effects

**What happens:** Step pages (`Step1.tsx`, `Step3.tsx`, `Step4b.tsx`, etc.) have `// eslint-disable-next-line react-hooks/exhaustive-deps` on `useEffect` hooks.

**Why it's wrong:** Suppressing this rule masks potential stale-closure bugs.

**Do this instead:** Use a `useRef` to track previous values (pattern in `Step1.tsx:prevIsSavingRef`) or stabilize callbacks with `useCallback`. Never add new suppressions without `// intentional: <reason>` comment.

### Inline Tailwind Class Arrays (Array.join)

**What happens:** Some pages build `className` strings with `[...].join(' ')` instead of `cn()`.

**Why it's wrong:** `cn()` handles deduplication and conditional merging correctly; array join does not.

**Do this instead:** `cn('base-class', condition && 'conditional-class')` from `src/lib/utils.ts`.

### Native `<select>` in Stub Pages

**What happens:** PRD-23 stub tool pages (`AcquisitionVideo.tsx`, etc.) use native HTML `<select>` with inline Tailwind rather than the shadcn `Select` component.

**Why it's wrong:** Inconsistent with the design system; visual regressions when global styles change.

**Do this instead:** Use `<Select>` from `src/components/ui/select.tsx` (Radix-based) when wiring stubs to real implementations.

## Error Handling

**Strategy:** Layered — React ErrorBoundary for render crashes; toast for async failures

**Patterns:**
- Render errors: `ErrorBoundary` class component (`src/components/ErrorBoundary.tsx`)
- Mutation failures: `toast.error(...)` via sonner (never blocks UX)
- Query failures: Pages render `<ErrorState onRetry={...} />` (`src/components/states/ErrorState.tsx`)
- Auth failure on login: `toast.error('登录暂不可用...')` (`src/hooks/useAuth.ts`)
- LS quota exceeded: Toast + continue to DB write (`src/hooks/useStepData.ts`)

## Cross-Cutting Concerns

**Logging:** `console.error/warn` with `[Module]` prefix; no remote aggregation
**Validation:** zod schemas via `StepForm`/`ToolForm`; stub pages have no form validation
**Authentication:** Cookie-based; `useAuth` reads `trpc.auth.me`; no route guards

---

*Architecture analysis: 2026-05-20*
