# Codebase Structure — apps/admin

**Analysis Date:** 2026-05-21

## Directory Layout

```
apps/admin/
├── index.html                      # Vite HTML entry · id="root"
├── package.json                    # @quanan/admin · workspace deps
├── tsconfig.json                   # Extends ../../tsconfig.base.json · @/* alias
├── vite.config.ts                  # React plugin · @/ alias · 4 manual chunks · port 5174 · outDir dist-admin
├── vitest.config.ts                # jsdom · setupFiles · workspace path aliases
├── vite-env.d.ts                   # VITE_API_BASE_URL env type
├── dist-admin/                     # Build output (git-ignored)
├── screenshots/                    # Admin e2e screenshots (visual baselines)
└── src/
    ├── main.tsx                    # createRoot · renders App
    ├── App.tsx                     # tRPC + QueryClient providers + BrowserRouter
    ├── router.tsx                  # 17 lazy pages + Suspense + route tree
    ├── index.ts                    # Re-exports AdminRoutes + AdminLayout
    ├── components/
    │   └── AdminLoading.tsx        # Suspense fallback spinner
    ├── layouts/
    │   └── AdminLayout.tsx         # Grid shell · route guard · page_view audit
    ├── lib/
    │   ├── admin-client.ts         # adminTrpc · adminQueryClient · adminTrpcClient
    │   └── admin-routes.ts         # ADMIN_ROUTES metadata · isDomainAllowed · getAllowedRoutes
    ├── styles/
    │   └── admin.css               # Aurelian Dark CSS variables + grid layout (344 lines)
    ├── test/
    │   └── setup.ts                # @testing-library/jest-dom import
    └── pages/
        ├── Login.tsx               # /login · mock OAuth + Google stub
        ├── nsm/                    # P0 核心 · /admin/nsm
        │   ├── index.tsx
        │   ├── NsmAlerts.tsx
        │   ├── NsmDistributions.tsx
        │   ├── NsmFunnel.tsx
        │   ├── NsmOverviewCards.tsx
        │   └── __tests__/NsmDashboard.test.tsx
        ├── users/                  # P0 核心 · /admin/users
        │   ├── index.tsx
        │   └── __tests__/UsersPage.test.tsx
        ├── accounts/               # P0 核心 · /admin/accounts
        │   ├── index.tsx
        │   ├── AnomalyTab.tsx
        │   └── __tests__/AccountsPage.test.tsx
        ├── cost/                   # P0 核心 · /admin/cost
        │   ├── index.tsx
        │   └── __tests__/CostPage.test.tsx
        ├── audit/                  # P0 核心 · /admin/audit
        │   ├── index.tsx
        │   ├── AuditTimeline.tsx
        │   └── __tests__/AuditPage.test.tsx
        ├── invites/                # P0 核心 · /admin/invites
        │   ├── index.tsx
        │   ├── BatchImportDialog.tsx
        │   ├── CampaignFunnelChart.tsx
        │   ├── CreateInviteDialog.tsx
        │   ├── InviteDetailDrawer.tsx
        │   └── __tests__/InvitesPage.test.tsx
        ├── reviewTrending/         # P0 审核 · /admin/reviewTrending
        │   ├── index.tsx
        │   └── __tests__/ReviewTrendingPage.test.tsx
        ├── reviewDeepLearn/        # P0 审核 · /admin/reviewDeepLearn
        │   ├── index.tsx
        │   ├── ReviewDeepLearnTable.tsx
        │   ├── UserViolationsTab.tsx
        │   └── __tests__/ReviewDeepLearnPage.test.tsx
        ├── evolutionHealth/        # P1 健康度 · /admin/evolution-health
        │   ├── EvolutionHealthPage.tsx
        │   ├── components/
        │   └── __tests__/EvolutionHealthPage.test.tsx
        ├── prompts/                # P1 健康度 · /admin/prompts
        │   ├── PromptsPage.tsx
        │   ├── components/
        │   │   └── LlmJudgeCard.tsx
        │   └── __tests__/PromptsPage.test.tsx
        ├── quota/                  # P1 健康度 · /admin/quota
        │   ├── QuotaPage.tsx
        │   ├── QuotaDetailDrawer.tsx
        │   ├── components/
        │   └── __tests__/QuotaPage.test.tsx
        ├── compliance/             # P1 健康度 · /admin/compliance
        │   ├── index.tsx
        │   ├── components/
        │   │   └── ComplianceReportPdf.tsx
        │   └── __tests__/CompliancePage.test.tsx
        ├── approvals/              # P1 健康度 · /admin/approvals
        │   ├── index.tsx
        │   ├── ApprovalDetailDrawer.tsx
        │   ├── EmergencyApproveModal.tsx
        │   └── __tests__/ApprovalGatesPage.test.tsx
        ├── abExperiments/          # P2 高级 · /admin/ab-experiments[/:key]
        │   ├── AbExperimentsPage.tsx
        │   ├── ExperimentDetailPage.tsx
        │   ├── AbExperimentDrawer.tsx
        │   ├── ExperimentReportPdf.tsx
        │   ├── ExperimentTimeline.tsx
        │   ├── components/
        │   └── __tests__/AbExperimentsPage.test.tsx
        ├── constants/              # P2 高级 · /admin/constants
        │   ├── ConstantsPage.tsx
        │   ├── components/
        │   │   └── LlmJudgeCard.tsx
        │   └── __tests__/ConstantsPage.test.tsx
        ├── featureFlags/           # P2 高级 · /admin/feature-flags
        │   ├── FeatureFlagsPage.tsx
        │   └── __tests__/FeatureFlagsPage.test.tsx
        └── admin/
            └── placeholder/
                ├── knowledge.tsx   # P2 高级 · /admin/knowledge · placeholder
                └── __tests__/KnowledgePlaceholder.test.tsx
```

## Directory Purposes

**`src/lib/`:**
- Purpose: Singleton tRPC client + route metadata constants
- Key files: `admin-client.ts` (tRPC instance, QueryClient), `admin-routes.ts` (ADMIN_ROUTES array, role utils)
- Rule: No React components here; pure config and typed clients only

**`src/layouts/`:**
- Purpose: Top-level authenticated page shell
- Key files: `AdminLayout.tsx`
- Contains: Route guard, `usePageViewAudit`, sidebar group builder, tRPC me query

**`src/pages/<domain>/`:**
- Purpose: One admin domain per directory
- Pattern: Primary component is `index.tsx` or `<PascalCase>Page.tsx`; sub-components in `components/` sub-dir; tests in `__tests__/`

**`src/styles/`:**
- Purpose: Global Aurelian Dark CSS variables and layout grid
- Key file: `admin.css` — imported once in `App.tsx`; defines `--topbar-height`, `--sidebar-width`, `.admin-layout` grid

**`packages/ui/src/admin/`:**
- Purpose: Shared admin UI primitives with no app-layer dependencies
- Key files: `Sidebar.tsx`, `TopBar.tsx`, `StatusBar.tsx`, `AuditDrawer.tsx`, `DenseTable.tsx`, `tokens.ts`, `index.ts`
- Rule: These components accept only plain data props. No `adminTrpc` or React Router imports inside them.

**`packages/clients/src/`:**
- Purpose: Type-only shadow router consumed by apps/admin tRPC client
- Key file: `admin-router-types.ts` — exports `AdminRouter` type

**`tests/e2e/admin/`:**
- Purpose: Playwright e2e tests for admin flows
- Key files: `admin-foundation-loop.spec.ts` (7-step login/logout/audit loop), `_admin-seed.ts` (shared DB seed helper)

**`tests/e2e/prd26-admin-*.spec.ts`:**
- Purpose: PRD-26 visual baselines (17 pages), smoke tests (17 pages), role matrix (3 roles)
- Run via: Playwright `admin` project (port 5174, serial)

## Naming Conventions

**Files:**
- Pages: `index.tsx` for simple pages, `<PascalCase>Page.tsx` for complex ones
- Sub-components: `<PascalCase>.tsx` (e.g., `NsmAlerts.tsx`, `ApprovalDetailDrawer.tsx`)
- Tests: `__tests__/<ComponentName>.test.tsx`

**Directories:**
- Page directories: camelCase matching the route segment (e.g., `abExperiments/`, `reviewDeepLearn/`)
- Route paths: kebab-case in the URL (e.g., `/admin/ab-experiments`, `/admin/evolution-health`)

## Where to Add New Code

**New admin domain page:**
1. Create `src/pages/<domainName>/index.tsx` (or `<DomainName>Page.tsx`)
2. Add `__tests__/<DomainName>Page.test.tsx` with vi.hoisted mock pattern
3. Add `lazy()` import in `src/router.tsx` under the correct chunk comment
4. Add `<Route>` element in `AdminRoutes()`
5. Add entry in `ADMIN_ROUTES` array in `src/lib/admin-routes.ts` (path, label, emoji, prd, requiredRole, group, domainKey)
6. Assign to one of 4 chunk groups in `vite.config.ts` `manualChunks`

**New sub-component within a page:**
- Add to `src/pages/<domain>/components/<ComponentName>.tsx`
- Import from parent page component

**New shared admin primitive (no app deps):**
- Add to `packages/ui/src/admin/<ComponentName>.tsx`
- Export from `packages/ui/src/admin/index.ts`

**New tRPC admin endpoint:**
- Add handler to `apps/api/src/trpc/routers/admin/<domain>.ts`
- Add shadow type to corresponding namespace in `packages/clients/src/admin-router-types.ts`

## Special Directories

**`dist-admin/`:**
- Purpose: Vite build output for admin SPA
- Generated: Yes
- Committed: No

**`screenshots/`:**
- Purpose: Admin e2e screenshots captured by `admin-foundation-loop.spec.ts`
- Generated: By Playwright
- Committed: Yes (visual baseline tracking)

**`test-results/`:**
- Purpose: Playwright HTML report output
- Generated: Yes
- Committed: No

---

*Structure analysis: 2026-05-21*
