<!-- refreshed: 2026-05-19 -->
# Architecture

**Analysis Date:** 2026-05-19

## System Overview

```text
┌─────────────────────────────────────────────────────────────────────┐
│                         Browser SPA                                  │
│   main.tsx → trpc.Provider → QueryClientProvider → RouterProvider    │
├─────────────────┬───────────────────────┬───────────────────────────┤
│   RootLayout    │      StepLayout        │   (direct route renders)  │
│  src/layouts/   │  src/layouts/          │   Tool / Module pages     │
│  RootLayout.tsx │  StepLayout.tsx        │   src/pages/tools/        │
│                 │  (adds FeedbackButton  │   src/pages/modules/      │
│                 │   to all /step/* pages)│                           │
└────────┬────────┴──────────┬────────────┴───────────────────────────┘
         │                   │
         ▼                   ▼
┌────────────────────────────────────────────────────────────────────┐
│                       Page Components                               │
│  src/pages/                                                         │
│  ├── Home.tsx           /                                           │
│  ├── Guide.tsx          /guide                                      │
│  ├── IpPlan.tsx         /ip-plan                                    │
│  ├── step/              /step/1-9,3b,4b  (lazy, "step" chunk)      │
│  ├── tools/             /trending, /copywriting... (lazy, "tools")  │
│  └── modules/           /diagnosis, /evolution... (lazy, "modules") │
└────────────────────┬───────────────────────────────────────────────┘
                     │
         ┌───────────┴──────────────┐
         ▼                          ▼
┌────────────────┐       ┌──────────────────────────────────┐
│  Custom Hooks  │       │      Component Library           │
│ src/hooks/     │       │ src/components/                  │
│ useActiveAcc.  │       │ ├── ui/          (Radix wrappers) │
│ useAuth.ts     │       │ ├── states/      (Empty/Load/Err) │
│ useEvolution.ts│       │ ├── StepForm/    (generic form)   │
│ useStepData.ts │       │ ├── StepResult/  (per-step output)│
└───────┬────────┘       │ ├── ToolForm/   (tool forms)      │
        │                │ ├── ToolResult/ (tool outputs)    │
        ▼                │ ├── step{N}/    (step-specific)   │
┌────────────────┐       │ └── ip-plan/   (IP plan grid)    │
│  tRPC Client   │       └──────────────────────────────────┘
│ src/lib/trpc.ts│
│ splitLink:     │
│  batch→http   │
│  sub→SSE      │
└───────┬────────┘
        │
        ▼ (HTTP + SSE to API server)
┌────────────────────┐
│  Backend API       │
│  apps/api          │
│  localhost:3000    │
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
| `StepProgress` | 9-step progress tracker; data-status attributes | `src/components/StepProgress.tsx` |
| `StreamdownPreview` | Typewriter markdown renderer (requestAnimationFrame) | `src/components/StreamdownPreview.tsx` |
| `StepForm` | Generic react-hook-form wrapper for step input forms | `src/components/StepForm/StepForm.tsx` |
| `EmptyState` / `LoadingState` / `ErrorState` | Reusable feedback states | `src/components/states/` |
| `IpPlanStepGrid` | 9-card grid for IP plan page | `src/components/ip-plan/IpPlanStepGrid.tsx` |
| `ui/*` | Radix UI + CVA wrappers: Button, Card, Dialog, etc. | `src/components/ui/` |

## Pattern Overview

**Overall:** Layered SPA with LS-first dual-write persistence

**Key Characteristics:**
- Pages are thin orchestrators; business logic lives in custom hooks
- All server communication goes through a single `trpc` client object
- LocalStorage is the primary read path; DB is async secondary (dual-write pattern)
- Code-split into 3 lazy chunks: `step`, `tools`, `modules`

## Layers

**Routing Layer:**
- Purpose: Define URL → component mapping with lazy loading
- Location: `src/router.tsx`
- Contains: `createBrowserRouter` config, lazy imports, layout nesting
- Depends on: Layout components, page components
- Used by: `src/main.tsx` (RouterProvider)

**Layout Layer:**
- Purpose: Provide consistent shell (header, suspense fallback, toast)
- Location: `src/layouts/`
- Contains: `RootLayout.tsx`, `StepLayout.tsx`
- Depends on: Header, FeedbackButton, Outlet
- Used by: Router (as parent element)

**Page Layer:**
- Purpose: Compose domain UI for a specific route
- Location: `src/pages/`
- Contains: `Home.tsx`, `Guide.tsx`, `IpPlan.tsx`, `step/`, `tools/`, `modules/`
- Depends on: Hooks, shared components, tRPC, constants
- Used by: Router

**Component Layer:**
- Purpose: Reusable UI building blocks
- Location: `src/components/`
- Contains: Primitive wrappers (`ui/`), shared state components (`states/`), domain-specific display components (`StepResult/`, `ToolResult/`, `step{N}/`)
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
2. `save()` from `useStepData` called with form values (`src/hooks/useStepData.ts:48`)
3. LS write immediately: `localStorage.setItem(stepLsKey(accountId, stepKey), JSON.stringify(inputs))`
4. `trpc.stepData.save.mutate` fires (fire-and-forget; failure shows toast but no LS rollback)
5. Page state `isSaving=true` → shows `<LoadingState>`
6. On `isSaving: true → false`, `dbQuery.refetch()` triggered
7. `dbQuery.data.result` arrives → page renders result section

### Account Switch Flow

1. `AccountSwitcher` → `switchTo(newAccountId)` (`src/hooks/useActiveAccount.ts:38`)
2. `trpc.ipAccounts.switchActive.mutate`
3. On success: `clearLsNamespace(localStorage, oldAccountId)` + `window.location.reload()`
4. On error: `toast.error('切换失败 · 请重试')` — no reload

### Voice Chat (SSE Subscription)

1. `trpcClient.voiceChat.start.subscribe(...)` → SSE stream (`src/pages/tools/VoiceChat.tsx`)
2. `VoiceChatStreamChunk` events: text delta → assemble turn bubble
3. `done` event → `trpc.tts.synthesize` → audio URL → `<audio>` element autoplay

**State Management:**
- Server state: React Query (via tRPC)
- Persistent local state: localStorage with `aiip_memory_acc_` namespace pattern
- Ephemeral UI state: React `useState` within page components (no global client state store in use; zustand is installed but not currently used)
- URL state: `useSearchParams` in Trending, History, DeepLearning for filter/tab persistence

## Key Abstractions

**LS Namespace:**
- Purpose: Per-account localStorage isolation
- Examples: `src/lib/ls-namespace.ts`
- Pattern: `stepLsKey(accountId, stepKey)` → `aiip_memory_acc_{id}_{key}`

**tRPC Client (splitLink):**
- Purpose: Single HTTP client that routes subscriptions to SSE and everything else to batch-stream
- Examples: `src/lib/trpc.ts`
- Pattern: `splitLink({ condition: op.type === 'subscription', true: httpSubscriptionLink, false: httpBatchStreamLink })`

**Constants as Literal Locks:**
- Purpose: 1:1 spec compliance — UI strings tied to `aiipznt-spec.md` are exported as named `const` from `src/lib/constants/`
- Examples: `src/lib/constants/industries.ts` (STEP1_CTA_LABEL etc.), `src/lib/constants/step3.ts`
- Pattern: `export const STEP1_CTA_LABEL = '生成行业洞察' as const`

**Design Tokens:**
- Purpose: All colors, spacing, radii derived from `../../ui/aurelian_dark/DESIGN.md` YAML
- Examples: `tailwind.config.js` consumes `parseTokensFromFile()`
- Pattern: Never hardcode hex values; always use token names (`text-primary`, `bg-surface-container`)

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

- **Threading:** Single-threaded browser event loop; SSE subscription handled via `@trpc/client` observable
- **Global state:** Single `queryClient` and `trpcClient` instances in `src/lib/trpc.ts`; no module-level mutable state elsewhere
- **Circular imports:** None detected; `@quanan/clients` package uses `import type` to avoid circular dependency (`@trpc/server` excluded from browser bundle)
- **LS-first:** Step data is always written to LS before DB; DB failure must not roll back LS (ADR-010)
- **No SSR:** Pure SPA; `#root` must exist in `index.html`
- **Font loading:** Fonts loaded via `@fontsource` in `src/main.tsx` before React tree renders

## Anti-Patterns

### Suppressed `react-hooks/exhaustive-deps` in Page Effects

**What happens:** Step pages (`Step1.tsx`, `Step3.tsx`, `Step4b.tsx`, etc.) have `// eslint-disable-next-line react-hooks/exhaustive-deps` on `useEffect` hooks that intentionally omit dependencies to avoid infinite re-render loops.

**Why it's wrong:** Suppressing this rule masks potential stale-closure bugs and makes effect intent harder to reason about.

**Do this instead:** Use a `useRef` to track previous values (already done correctly in `Step1.tsx:prevIsSavingRef`) or stabilize callbacks with `useCallback`. Do not add new `eslint-disable` suppressions without a `// intentional: <reason>` comment.

### Inline Tailwind Class Arrays (Array.join)

**What happens:** Some step pages build className strings with `[...].join(' ')` instead of using `cn()`.

**Why it's wrong:** Inconsistent; `cn()` handles deduplication and conditional merging correctly.

**Do this instead:** `cn('base-class', condition && 'conditional-class')` from `src/lib/utils.ts`.

## Error Handling

**Strategy:** Layered — React ErrorBoundary for render crashes; toast for async operation failures

**Patterns:**
- Render errors: `ErrorBoundary` class component (`src/components/ErrorBoundary.tsx`) — catches all children, shows reset button
- Mutation failures: `toast.error(...)` via sonner (never blocks UX)
- Query failures: Pages render `<ErrorState onRetry={...} />` (`src/components/states/ErrorState.tsx`)
- Auth failure on login: `toast.error('登录暂不可用...')` (`src/hooks/useAuth.ts`)
- LS quota exceeded: Toast + continue to DB write (`src/hooks/useStepData.ts:56`)

## Cross-Cutting Concerns

**Logging:** `console.error/warn` with `[Module]` prefix convention (e.g., `[ErrorBoundary]`, `[useStepData]`, `[readOtherStep]`); no remote log aggregation
**Validation:** zod schemas at form layer; `react-hook-form` + `zodResolver` in `StepForm`
**Authentication:** Cookie-based; `useAuth` hook reads `trpc.auth.me`; protected pages don't redirect — they show logged-out state (no route guard)

---

*Architecture analysis: 2026-05-19*
