# Codebase Structure

**Analysis Date:** 2026-05-20

## Directory Layout

```
apps/web/
├── src/                        # All application source
│   ├── main.tsx                # Entry point — providers + router mount + font imports
│   ├── App.tsx                 # Dead file (legacy shell; router uses RootLayout instead)
│   ├── router.tsx              # 34-route browser router definition
│   ├── vite-env.d.ts           # Vite env type declarations
│   │
│   ├── layouts/                # Route layout shells
│   │   ├── RootLayout.tsx      # Header + Suspense + Toaster + Outlet
│   │   └── StepLayout.tsx      # FeedbackButton injector for /step/* routes
│   │
│   ├── pages/                  # One file per route
│   │   ├── Home.tsx            # /
│   │   ├── Guide.tsx           # /guide
│   │   ├── IpPlan.tsx          # /ip-plan
│   │   ├── Login.tsx           # /login (placeholder)
│   │   ├── NotFound.tsx        # /* 404
│   │   ├── Settings.tsx        # /settings
│   │   ├── step/               # /step/1-9,3b,4b (11 step routes)
│   │   │   ├── __tests__/      # Per-step vitest tests (Step1-8)
│   │   │   ├── Step1.tsx       # Industry selection
│   │   │   ├── Step2.tsx       # Placeholder
│   │   │   ├── Step3.tsx       # Account branding
│   │   │   ├── Step3b.tsx      # Persona customization
│   │   │   ├── Step4.tsx       # Execution plan
│   │   │   ├── Step4b.tsx      # Monetization path
│   │   │   ├── Step5.tsx       # Trending topics
│   │   │   ├── Step6.tsx       # Filming plan
│   │   │   ├── Step7.tsx       # Copywriting
│   │   │   ├── Step8.tsx       # Livestream planning (Tabs: generate + optimize)
│   │   │   └── Step9.tsx       # Placeholder
│   │   ├── tools/              # 15 tool pages (lazy "tools" chunk)
│   │   │   ├── __tests__/      # Tool page tests (AcquisitionVideo, Analysis, VideoAnalysis, VideoProduction)
│   │   │   ├── components/     # Tool-specific sub-components
│   │   │   ├── index.ts        # Barrel re-export
│   │   │   ├── Trending.tsx    # /trending
│   │   │   ├── Copywriting.tsx # /copywriting
│   │   │   ├── Analysis.tsx    # /analysis  (PRD-23 stub)
│   │   │   ├── VideoAnalysis.tsx   # /video-analysis  (PRD-23 stub)
│   │   │   ├── VideoProduction.tsx # /video-production  (PRD-23 stub)
│   │   │   ├── AcquisitionVideo.tsx # /acquisition-video  (PRD-23 stub)
│   │   │   ├── AiVideo.tsx     # /ai-video
│   │   │   ├── VoiceChat.tsx   # /voice-chat (SSE subscription)
│   │   │   ├── BoomGenerate.tsx, Generate.tsx, PresentStyles.tsx
│   │   │   ├── DeepLearning.tsx, Knowledge.tsx, Monetization.tsx
│   │   │   ├── PrivateDomain.tsx
│   │   │   └── Knowledge.tsx
│   │   └── modules/            # 6 module pages (lazy "modules" chunk)
│   │       ├── __tests__/      # Diagnosis.test.tsx, Accounts.test.tsx
│   │       ├── Accounts.tsx    # /accounts  (PRD-23 · IP account management grid)
│   │       ├── DailyTasks.tsx  # /daily-tasks
│   │       ├── Diagnosis.tsx   # /diagnosis  (PRD-23 · 8-step wizard + report)
│   │       ├── Evolution.tsx   # /evolution
│   │       ├── History.tsx     # /history (839 lines — largest file)
│   │       └── MyTopics.tsx    # /my-topics
│   │
│   ├── components/             # Shared and domain components
│   │   ├── ui/                 # Radix UI + CVA primitive wrappers
│   │   │   └── button.tsx, card.tsx, dialog.tsx, dropdown-menu.tsx,
│   │   │       glass-card.tsx, input.tsx, progress.tsx, scroll-area.tsx,
│   │   │       select.tsx, separator.tsx, sheet.tsx, tabs.tsx,
│   │   │       textarea.tsx, toast.tsx, tooltip.tsx, avatar.tsx
│   │   ├── states/             # EmptyState, LoadingState, ErrorState + index.ts
│   │   │   └── __tests__/
│   │   ├── header/             # MobileNavPanel.tsx
│   │   ├── ip-plan/            # IpPlanStepGrid.tsx
│   │   ├── accounts/           # PRD-23 · IP account management components
│   │   │   ├── __tests__/      # CreateAccountModal.test.tsx, IpAccountCard.test.tsx
│   │   │   ├── CreateAccountModal.tsx  # Radix Dialog + trpc.ipAccounts.create
│   │   │   └── IpAccountCard.tsx       # Account card (activate/edit stub/delete stub)
│   │   ├── diagnosis/          # PRD-23 · Diagnosis wizard step card
│   │   │   ├── __tests__/      # DiagnosisStepCard.test.tsx
│   │   │   └── DiagnosisStepCard.tsx
│   │   ├── inline-pickers/     # ElementsInlineMultiPicker, PlatformInlineRadio, ScriptTypeInlineCards
│   │   │   └── __tests__/
│   │   ├── step3/              # Step 3 output renderer
│   │   ├── step3b/             # Step 3b output renderer
│   │   ├── step4b/             # Step 4b output renderer
│   │   ├── step5/              # Step 5 file upload + topic grid
│   │   ├── step7/              # Step 7 multi-select + script search
│   │   ├── step8/              # Step8GeneratePlan.tsx, Step8OptimizeScript.tsx
│   │   ├── StepForm/           # StepForm.tsx + CategorySelect, IndustrySelect, PlatformSelect, TextareaField
│   │   ├── StepResult/         # StepResult.tsx + per-step results (Step1-8) + FallbackBanner + index.ts
│   │   ├── ToolForm/           # ToolForm.tsx + ElementsMultiSelect, ScriptTypeSelect
│   │   ├── ToolResult/         # ToolResult.tsx + per-tool results (7 variants)
│   │   ├── AccountSwitcher.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── FadeInWrapper.tsx
│   │   ├── FeedbackButton.tsx
│   │   ├── Header.tsx
│   │   ├── IndustryDropdown.tsx
│   │   ├── StepProgress.tsx
│   │   └── StreamdownPreview.tsx
│   │
│   ├── hooks/                  # Custom React hooks
│   │   ├── __tests__/          # useStepData.test.tsx
│   │   ├── useActiveAccount.ts # tRPC ipAccounts.active + switchActive
│   │   ├── useAuth.ts          # tRPC auth.me + login/logout redirects
│   │   ├── useEvolution.ts     # tRPC evolution.getProfile + LS cache
│   │   └── useStepData.ts      # LS-first dual-write; readOtherStep static helper
│   │
│   ├── lib/                    # Pure utilities, constants, config
│   │   ├── trpc.ts             # tRPC client + queryClient + trace ID
│   │   ├── utils.ts            # cn() = twMerge(clsx())
│   │   ├── ls-namespace.ts     # LS key builders + prune utilities
│   │   ├── stepConfig.ts       # 9-step metadata Map<string, StepMeta>
│   │   ├── parseDesignTokens.js # DESIGN.md YAML token parser (JS, build-time only)
│   │   ├── constants/          # All UI string literals (spec-locked)
│   │   │   ├── __tests__/      # Per-constant validation tests
│   │   │   ├── diagnosis.ts    # DIAGNOSIS_H1, DIAGNOSIS_DIMENSIONS_8, REPORT_DIMENSIONS_7 (PRD-23)
│   │   │   ├── elements.ts, function-matrix.ts, guide-faq.ts, guide.ts
│   │   │   ├── header-nav.ts   # HEADER_NAV groups + items
│   │   │   ├── hotElementsZh.ts, industries.ts, platforms.ts, scripts.ts
│   │   │   ├── step3.ts .. step8.ts  # Per-step constant files
│   │   │   ├── video-types.ts, workflow.ts
│   │   ├── schemas/            # Frontend-only Zod schemas
│   │   │   ├── acquisitionVideoFrontend.ts
│   │   │   └── aiVideoFrontend.ts
│   │   └── migration/          # One-shot LS key migration
│   │       ├── __tests__/
│   │       └── legacy-ls.ts    # migrateLegacyLs() — acc_step{N} → aiip_memory_acc_{id}_{key}
│   │
│   ├── styles/                 # Global CSS
│   │   ├── globals.css         # Tailwind directives + CSS vars (dark theme) + .data-grid-bg + .animate-ping-primary
│   │   └── aiipznt-motion.css  # .glass-card definition
│   │
│   └── test/                   # Cross-cutting tests
│       ├── setup.ts            # @testing-library/jest-dom import
│       ├── pages.test.tsx      # Smoke tests for 25+ pages with full tRPC mock
│       ├── step-progress.test.tsx
│       └── feedback-button.test.tsx
│
├── e2e/                        # Playwright E2E specs (web-app scoped)
│   ├── prd-17-step1-3-3b.spec.ts
│   ├── prd-18-step-4-5-6-7-8.spec.ts
│   ├── prd-19-frontend-backend.spec.ts
│   ├── prd-20-real-llm.spec.ts
│   └── screenshots/
│
├── public/                     # Static assets
│   └── icons/
├── dist/                       # Build output (gitignored)
├── index.html                  # SPA shell with <div id="root">
├── package.json
├── vite.config.ts
├── vitest.config.ts
├── tailwind.config.ts
├── tsconfig.json (→ tsconfig.app.json)
└── postcss.config.js
```

## Directory Purposes

**`src/pages/step/`:**
- Purpose: One component per step (1-9, 3b, 4b); full tRPC-connected implementation
- Key files: `Step1.tsx` (industry selector), `Step8.tsx` (Tabs: generate + optimize)
- Tests: `__tests__/Step1.test.tsx` through `Step8.test.tsx`

**`src/pages/tools/`:**
- Purpose: 15 tool pages; most tRPC-connected; PRD-23 pages are stubs
- Stub pages (local state, no tRPC): `Analysis.tsx`, `VideoAnalysis.tsx`, `VideoProduction.tsx`, `AcquisitionVideo.tsx`
- Tests: `__tests__/AcquisitionVideo.test.tsx`, `Analysis.test.tsx`, `VideoAnalysis.test.tsx`, `VideoProduction.test.tsx`

**`src/pages/modules/`:**
- Purpose: 6 module pages for higher-level features
- Key files: `Diagnosis.tsx` (8-step wizard, PRD-23), `Accounts.tsx` (account grid, PRD-23)
- Tests: `__tests__/Diagnosis.test.tsx`, `__tests__/Accounts.test.tsx`

**`src/components/accounts/`:**
- Purpose: PRD-23 IP account management components
- Contains: `CreateAccountModal.tsx` (Radix Dialog + tRPC create), `IpAccountCard.tsx` (card with stub edit/delete)

**`src/components/diagnosis/`:**
- Purpose: PRD-23 diagnosis wizard step card
- Contains: `DiagnosisStepCard.tsx` — renders one step of the 8-step IP diagnosis

**`src/components/ui/`:**
- Purpose: Low-level Radix UI + CVA primitive wrappers — no business logic
- Pattern: All use `cn()` + CVA variants; export named from each file

**`src/lib/constants/`:**
- Purpose: All UI string literals ("literal locks" per aiipznt-spec.md); validated in `__tests__/`
- Added in PRD-23: `diagnosis.ts` — `DIAGNOSIS_H1`, `DIAGNOSIS_DIMENSIONS_8`, `REPORT_DIMENSIONS_7`, `REPORT_SUGGESTIONS`

## Naming Conventions

**Files:**
- React components: `PascalCase.tsx` (`FadeInWrapper.tsx`, `DiagnosisStepCard.tsx`)
- React hooks: `useCamelCase.ts` (`useStepData.ts`, `useActiveAccount.ts`)
- Utilities/lib: `kebab-case.ts` (`ls-namespace.ts`) or `camelCase.ts` (`trpc.ts`)
- Constants: `kebab-case.ts` under `src/lib/constants/` (`diagnosis.ts`, `header-nav.ts`)
- Tests: `ComponentName.test.tsx` or `moduleName.test.ts`
- Test directories: `__tests__/` adjacent to tested code

**Directories:**
- Page groups: lowercase (`step/`, `tools/`, `modules/`)
- Multi-file component groups: PascalCase (`StepForm/`, `StepResult/`, `ToolResult/`)
- Domain component folders: lowercase kebab (`accounts/`, `diagnosis/`, `ip-plan/`)

**Constants:**
- String literals: `SCREAMING_SNAKE_CASE` (`DIAGNOSIS_H1`, `STEP1_CTA_LABEL`, `HEADER_NAV`)
- Arrays with count suffix: `STEP1_INDUSTRIES_56`, `DIAGNOSIS_DIMENSIONS_8`

## Key File Locations

**Entry Points:**
- `src/main.tsx` — root render, providers, font and CSS imports
- `src/router.tsx` — all 34 route definitions
- `index.html` — SPA shell

**Configuration:**
- `tailwind.config.ts` — design tokens, color palette, typography scale
- `vite.config.ts` — dev server port, API proxy, build manual chunks
- `tsconfig.app.json` — path aliases `@/*`, `@quanan/*`
- `vitest.config.ts` — jsdom environment, setupFiles, include glob

**Core Logic:**
- `src/lib/trpc.ts` — tRPC client singleton, queryClient, trace ID generation
- `src/lib/ls-namespace.ts` — all LS key builders and namespace management
- `src/lib/stepConfig.ts` — 9-step metadata map
- `src/hooks/useStepData.ts` — step data read/write with dual-write

**Testing:**
- `src/test/setup.ts` — jest-dom matchers
- `src/test/pages.test.tsx` — smoke tests for all page renders

## Where to Add New Code

**New Step Page (e.g., Step10):**
- Implementation: `src/pages/step/Step10.tsx`
- Constants: `src/lib/constants/step10.ts`
- Tests: `src/pages/step/__tests__/Step10.test.tsx`
- Router: Add to `step` lazy group in `src/router.tsx`
- StepLayout: FeedbackButton auto-injected

**New Tool Page (stub first):**
- Implementation: `src/pages/tools/NewTool.tsx` (stub: `useState` + static output)
- Tests: `src/pages/tools/__tests__/NewTool.test.tsx` (≥4 tests: H1 字面 / subtitle / CTA disabled/enabled / output render)
- Export: Add to `src/pages/tools/index.ts`
- Router: Add lazy import to `tools` chunk in `src/router.tsx`
- Header nav: Add to relevant group in `src/lib/constants/header-nav.ts`

**New Module Page:**
- Implementation: `src/pages/modules/NewModule.tsx`
- Tests: `src/pages/modules/__tests__/NewModule.test.tsx`
- Router: Add lazy import to `modules` chunk in `src/router.tsx`

**New Shared Component:**
- Generic primitive: `src/components/ui/new-component.tsx` (Radix + CVA pattern)
- Shared state: `src/components/states/NewState.tsx` + export from `index.ts`
- Domain-specific: `src/components/domain-name/ComponentName.tsx` + `__tests__/` subdirectory

**New Custom Hook:**
- Implementation: `src/hooks/useNewHook.ts`
- Tests: `src/hooks/__tests__/useNewHook.test.tsx`

**New Constant Set:**
- Implementation: `src/lib/constants/feature-name.ts` (`SCREAMING_SNAKE_CASE`, `as const`)
- Tests: `src/lib/constants/__tests__/feature-name.test.ts`

## Special Directories

**`dist/`:**
- Purpose: Vite production build output
- Generated: Yes — Committed: No (gitignored)

**`e2e/screenshots/`:**
- Purpose: Playwright screenshot artifacts for visual regression
- Generated: Yes — Committed: Partially (baseline screenshots checked in)

**`.planning/codebase/`:**
- Purpose: GSD codebase map documents (this directory)
- Generated: Yes (by `/gsd-map-codebase`) — Committed: Yes

---

*Structure analysis: 2026-05-20*
