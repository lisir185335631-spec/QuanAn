# Codebase Structure

**Analysis Date:** 2026-05-19

## Directory Layout

```
apps/web/
├── src/                      # All application source
│   ├── main.tsx              # Entry point — providers + router mount
│   ├── App.tsx               # Legacy app shell (superseded by RootLayout; exists but unused by router)
│   ├── router.tsx            # 34-route browser router definition
│   ├── vite-env.d.ts         # Vite env type declarations
│   │
│   ├── layouts/              # Route layout shells
│   │   ├── RootLayout.tsx    # Header + Suspense + Toaster
│   │   └── StepLayout.tsx    # FeedbackButton injector for /step/* routes
│   │
│   ├── pages/                # One file per route
│   │   ├── Home.tsx          # /  (hero + IP progress + function matrix)
│   │   ├── Guide.tsx         # /guide
│   │   ├── IpPlan.tsx        # /ip-plan
│   │   ├── Login.tsx         # /login (placeholder)
│   │   ├── NotFound.tsx      # /* 404
│   │   ├── Settings.tsx      # /settings
│   │   ├── step/             # /step/1-9,3b,4b (9+2 steps)
│   │   │   ├── __tests__/    # Per-step vitest tests
│   │   │   ├── Step1.tsx     # Industry selection
│   │   │   ├── Step2.tsx     # Audience research (placeholder)
│   │   │   ├── Step3.tsx     # Account branding
│   │   │   ├── Step3b.tsx    # Persona customization
│   │   │   ├── Step4.tsx     # Execution plan
│   │   │   ├── Step4b.tsx    # Monetization path
│   │   │   ├── Step5.tsx     # Trending topics
│   │   │   ├── Step6.tsx     # Filming plan
│   │   │   ├── Step7.tsx     # Copywriting
│   │   │   ├── Step8.tsx     # Livestream planning
│   │   │   └── Step9.tsx     # Brand commercialization (placeholder)
│   │   ├── tools/            # 14 tool pages + shared tool sub-components
│   │   │   ├── components/   # Tool-specific sub-components
│   │   │   ├── index.ts      # Barrel re-export of all tool pages
│   │   │   ├── Trending.tsx, Copywriting.tsx, ... (14 files)
│   │   └── modules/          # 6 module pages
│   │       ├── Accounts.tsx, DailyTasks.tsx, Diagnosis.tsx,
│   │       ├── Evolution.tsx, History.tsx, MyTopics.tsx
│   │
│   ├── components/           # Shared and domain components
│   │   ├── ui/               # Radix UI + CVA primitive wrappers
│   │   │   ├── button.tsx, card.tsx, dialog.tsx, dropdown-menu.tsx,
│   │   │   ├── input.tsx, progress.tsx, scroll-area.tsx, select.tsx,
│   │   │   ├── separator.tsx, sheet.tsx, tabs.tsx, toast.tsx,
│   │   │   └── tooltip.tsx, avatar.tsx
│   │   ├── states/           # Empty, Loading, Error shared states
│   │   │   ├── __tests__/
│   │   │   ├── EmptyState.tsx, LoadingState.tsx, ErrorState.tsx
│   │   │   └── index.ts      # Barrel export
│   │   ├── header/           # Header sub-components
│   │   │   └── MobileNavPanel.tsx
│   │   ├── ip-plan/          # IP Plan page components
│   │   │   └── IpPlanStepGrid.tsx
│   │   ├── step3/            # Step 3 output renderer
│   │   ├── step3b/           # Step 3b output renderer
│   │   ├── step4b/           # Step 4b output renderer
│   │   ├── step5/            # Step 5 file upload + topic grid
│   │   ├── step7/            # Step 7 multi-select + script search
│   │   ├── step8/            # Step 8 generate plan + optimize script
│   │   ├── StepForm/         # Generic step form (react-hook-form)
│   │   │   ├── StepForm.tsx, CategorySelect.tsx, IndustrySelect.tsx,
│   │   │   ├── PlatformSelect.tsx, TextareaField.tsx
│   │   ├── StepResult/       # Per-step result display wrappers
│   │   │   ├── index.ts, StepResult.tsx, FallbackBanner.tsx,
│   │   │   ├── Step1Result.tsx .. Step8Result.tsx, Step3bResult.tsx, Step4bResult.tsx
│   │   ├── ToolForm/         # Tool input forms
│   │   │   ├── ToolForm.tsx, ElementsMultiSelect.tsx, ScriptTypeSelect.tsx
│   │   ├── ToolResult/       # Tool output renderers
│   │   │   ├── ToolResult.tsx, AcquisitionVideoResult.tsx, AiVideoResult.tsx,
│   │   │   ├── AnalysisResult.tsx, BoomGenerateResult.tsx, FreeGenerateResult.tsx,
│   │   │   ├── VideoAnalysisResult.tsx, VideoProductionResult.tsx
│   │   ├── AccountSwitcher.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── FadeInWrapper.tsx
│   │   ├── FeedbackButton.tsx
│   │   ├── Header.tsx
│   │   ├── IndustryDropdown.tsx
│   │   ├── StepProgress.tsx
│   │   └── StreamdownPreview.tsx
│   │
│   ├── hooks/                # Custom React hooks
│   │   ├── __tests__/
│   │   ├── useActiveAccount.ts
│   │   ├── useAuth.ts
│   │   ├── useEvolution.ts
│   │   └── useStepData.ts
│   │
│   ├── lib/                  # Pure utilities, constants, config
│   │   ├── trpc.ts           # tRPC client + queryClient singleton
│   │   ├── utils.ts          # cn() helper
│   │   ├── ls-namespace.ts   # LS key builders + pruning utilities
│   │   ├── stepConfig.ts     # 9-step metadata Map
│   │   ├── parseDesignTokens.js  # DESIGN.md token parser (JS, not TS)
│   │   ├── constants/        # UI string literals and data constants
│   │   │   ├── __tests__/
│   │   │   ├── guide.ts, guide-faq.ts, header-nav.ts
│   │   │   ├── function-matrix.ts, workflow.ts
│   │   │   ├── industries.ts, hotElementsZh.ts, scripts.ts
│   │   │   └── step3.ts .. step8.ts (per-step constant files)
│   │   ├── schemas/          # Frontend-only zod schemas
│   │   │   ├── acquisitionVideoFrontend.ts
│   │   │   └── aiVideoFrontend.ts
│   │   └── migration/        # LS key migration utilities
│   │       ├── __tests__/
│   │       └── legacy-ls.ts
│   │
│   ├── styles/               # Global CSS
│   │   ├── globals.css       # Tailwind directives + CSS vars + .data-grid-bg + .animate-ping-primary
│   │   └── aiipznt-motion.css # .glass-card definition
│   │
│   └── test/                 # Cross-cutting tests
│       ├── setup.ts          # @testing-library/jest-dom import
│       ├── pages.test.tsx    # Smoke tests for all page renders
│       ├── step-progress.test.tsx
│       └── feedback-button.test.tsx
│
├── e2e/                      # Playwright E2E tests
│   ├── prd-17-step1-3-3b.spec.ts
│   ├── prd-18-step-4-5-6-7-8.spec.ts
│   ├── prd-19-frontend-backend.spec.ts
│   ├── prd-20-real-llm.spec.ts
│   └── screenshots/
│
├── public/                   # Static assets
│   └── icons/
├── dist/                     # Build output (gitignored)
├── index.html                # SPA shell
├── package.json
├── vite.config.ts
├── vitest.config.ts
├── playwright.config.ts
├── tailwind.config.js
├── tsconfig.json
└── postcss.config.js
```

## Directory Purposes

**`src/pages/`:**
- Purpose: One React component per route; acts as orchestrator
- Contains: Page-level components, `__tests__/` subdirectory per group
- Key files: `Home.tsx`, `IpPlan.tsx`, `Guide.tsx`, `step/Step1.tsx`

**`src/components/ui/`:**
- Purpose: Low-level Radix UI + CVA primitive wrappers — the component library primitives
- Contains: `button.tsx`, `card.tsx`, `dialog.tsx`, `input.tsx`, etc.
- Note: All use `cn()` + CVA variant pattern; no business logic

**`src/components/states/`:**
- Purpose: Standardized empty, loading, and error states
- Contains: `EmptyState.tsx`, `LoadingState.tsx`, `ErrorState.tsx`, `index.ts` barrel

**`src/hooks/`:**
- Purpose: React hooks that abstract tRPC queries/mutations and LS access
- Contains: `useAuth`, `useActiveAccount`, `useStepData`, `useEvolution`

**`src/lib/constants/`:**
- Purpose: All UI string literals ("literal locks" matching aiipznt-spec.md 1:1)
- Contains: Per-step constant files (`step3.ts` through `step8.ts`), nav, guide, industries

**`src/lib/migration/`:**
- Purpose: One-shot LS key migration from legacy `acc_step{N}` format to namespaced format
- Contains: `legacy-ls.ts` with `migrateLegacyLs()`; runs once in `App.tsx`

**`src/styles/`:**
- Purpose: Global CSS — Tailwind base, CSS custom properties (dark theme tokens), utility classes
- Key: `.glass-card`, `.data-grid-bg`, `.animate-ping-primary`

**`e2e/`:**
- Purpose: Playwright end-to-end integration tests (requires running dev server at port 5173)

## Naming Conventions

**Files:**
- React components: `PascalCase.tsx` (e.g., `FadeInWrapper.tsx`, `StepProgress.tsx`)
- Non-component TypeScript: `camelCase.ts` (e.g., `useStepData.ts`, `ls-namespace.ts`)
- Test files: `ComponentName.test.tsx` or `camelCase.test.ts`
- Test directories: `__tests__/` subdirectory adjacent to the code under test
- Constants files: `kebab-case.ts` under `src/lib/constants/` (e.g., `header-nav.ts`, `guide-faq.ts`)

**Directories:**
- Page groups: lowercase (`step/`, `tools/`, `modules/`)
- Component groups: PascalCase for multi-file domain groups (`StepForm/`, `StepResult/`)
- Domain-specific component folders: lowercase kebab (`step3/`, `ip-plan/`, `header/`)

**Constants:**
- String literals: `SCREAMING_SNAKE_CASE` (e.g., `STEP1_CTA_LABEL`, `HEADER_NAV`)
- Arrays/lists: `SCREAMING_SNAKE_CASE` with numeric suffix indicating count (e.g., `STEP1_INDUSTRIES_56`, `STEP3_PLATFORMS_5`)

## Key File Locations

**Entry Points:**
- `src/main.tsx`: Root render, provider setup, font and CSS imports
- `src/router.tsx`: All route definitions (34 routes)
- `index.html`: HTML shell with `<div id="root">`

**Configuration:**
- `tailwind.config.js`: Design tokens, color palette, typography scale, animations
- `vite.config.ts`: Dev server port, API proxy, build output, manual chunks
- `tsconfig.json`: Path aliases (`@/*`, `@quanqn/*`)
- `vitest.config.ts`: Test environment (jsdom), setup file, include glob

**Core Logic:**
- `src/lib/trpc.ts`: tRPC client singleton, queryClient, trace ID generation
- `src/lib/ls-namespace.ts`: All localStorage key builders and namespace management
- `src/lib/stepConfig.ts`: Step metadata map (9 steps)
- `src/hooks/useStepData.ts`: Step data read/write with dual-write pattern

**Testing:**
- `src/test/setup.ts`: Test global setup (jest-dom matchers)
- `src/test/pages.test.tsx`: Smoke tests for 20+ pages with full tRPC mock

## Where to Add New Code

**New Step Page (e.g., Step10):**
- Primary code: `src/pages/step/Step10.tsx`
- Constants: `src/lib/constants/step10.ts`
- Tests: `src/pages/step/__tests__/Step10.test.tsx`
- Router: Add to `step` lazy group in `src/router.tsx`
- StepLayout: Automatically inherits FeedbackButton

**New Tool Page:**
- Implementation: `src/pages/tools/NewTool.tsx`
- Sub-components: `src/pages/tools/components/NewToolSpecific.tsx`
- Export: Add to `src/pages/tools/index.ts` barrel
- Router: Add lazy import + route to `tools` chunk in `src/router.tsx`

**New Module Page:**
- Implementation: `src/pages/modules/NewModule.tsx`
- Router: Add lazy import + route to `modules` chunk in `src/router.tsx`

**New Shared Component:**
- If generic primitive: `src/components/ui/new-component.tsx` (follow Radix + CVA pattern)
- If shared feedback state: `src/components/states/NewState.tsx` + export from `index.ts`
- If domain-specific: `src/components/domain-name/ComponentName.tsx`

**New Custom Hook:**
- Implementation: `src/hooks/useNewHook.ts`
- Tests: `src/hooks/__tests__/useNewHook.test.tsx`

**New Constant Set:**
- Implementation: `src/lib/constants/feature-name.ts`
- Tests: `src/lib/constants/__tests__/feature-name.test.ts`

**New Frontend-Only Schema:**
- Implementation: `src/lib/schemas/newFeatureFrontend.ts`

## Special Directories

**`dist/`:**
- Purpose: Vite production build output
- Generated: Yes
- Committed: No (gitignored)

**`e2e/screenshots/`:**
- Purpose: Playwright screenshot artifacts for visual regression
- Generated: Yes (by test runs)
- Committed: Partially (baseline screenshots checked in)

**`.planning/codebase/`:**
- Purpose: GSD codebase map documents (this directory)
- Generated: Yes (by `/gsd-map-codebase`)
- Committed: Yes

**`apps/web/apps/web/src/lib/migration/`:**
- Purpose: An internal copy of the migration module (unusual nested `apps/web/apps/web/` path)
- Note: This appears to be a stale artefact at `apps/web/apps/web/src/lib/migration/` — the canonical source is `src/lib/migration/`
- Committed: Yes (warrants cleanup)

---

*Structure analysis: 2026-05-19*
