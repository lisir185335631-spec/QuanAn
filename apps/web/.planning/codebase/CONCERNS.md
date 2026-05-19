# Codebase Concerns

**Analysis Date:** 2026-05-19

## Tech Debt

**TypeScript project references not used:**
- Issue: `src/lib/trpc.ts` comment "TD: switch to TypeScript project references in P1." Currently uses path aliases in `tsconfig.json` which work at Vite/dev time but `tsc --noEmit` has to resolve them through manual alias config.
- Files: `tsconfig.json`, `vite.config.ts`, `vitest.config.ts` (all repeat the same alias block)
- Impact: Triplication of path alias config; drift risk if one config is updated and others are not
- Fix approach: Enable TypeScript project references (`"references": [...]`) in P1 and remove duplicated alias blocks from `vite.config.ts` and `vitest.config.ts`

**App.tsx not used by router:**
- Issue: `src/App.tsx` exists with a standalone shell (Header + main placeholder), but the production router uses `RootLayout.tsx` as the root element. `App.tsx` is a dead file.
- Files: `src/App.tsx`
- Impact: Confusion for new contributors; stale App.tsx still imports and calls `migrateLegacyLs` which should now run exclusively in App if App were used, or be moved
- Fix approach: Delete `src/App.tsx` or document why it exists alongside `RootLayout`

**Nested `apps/web/apps/web/` directory:**
- Issue: `apps/web/apps/web/src/lib/migration/` exists as a duplicate/stale path — likely an artifact of initial scaffolding
- Files: `/Users/return/Desktop/QuanQn/apps/web/apps/web/src/lib/migration/`
- Impact: Confusing directory tree; potential for stale code to be accidentally imported
- Fix approach: Delete `apps/web/apps/` subtree after confirming it is not referenced anywhere

**Repeated `eslint-disable-next-line react-hooks/exhaustive-deps`:**
- Issue: 15+ suppressions across step pages (`Step1.tsx`, `Step3.tsx`, `Step4b.tsx`, `Step5.tsx`, `Step7.tsx`, `Step8.tsx`, `StepForm.tsx`, etc.)
- Files: Most files in `src/pages/step/` and `src/components/step8/`
- Impact: Masks potential stale closure bugs; makes effect behavior harder to audit
- Fix approach: Replace suppressed effects with stable `useCallback` deps or `useRef`-tracked previous values (pattern demonstrated in `Step1.tsx:prevIsSavingRef`)

**`parseDesignTokens.js` is plain JavaScript:**
- Issue: `src/lib/parseDesignTokens.js` is `.js` not `.ts` — the only non-TypeScript source file in `src/`
- Files: `src/lib/parseDesignTokens.js`
- Impact: No type safety; must be excluded from `tsc` checks; imported by `tailwind.config.js`
- Fix approach: Convert to TypeScript (runs at build time, not at runtime — can use `ts-node` or keep as `.js` in `vite.config.ts` imports context)

## Known Bugs

**Step 2 and Step 9 are placeholders:**
- Symptoms: `/step/2` and `/step/9` render only a card with "PRD-3 占位 · 实施 PRD-4" text; no real functionality
- Files: `src/pages/step/Step2.tsx`, `src/pages/step/Step9.tsx`
- Trigger: Navigate to `/step/2` or `/step/9`
- Workaround: Expected placeholder state; implementation deferred to later PRDs

**Login page is a placeholder:**
- Symptoms: `/login` renders static text "PRD-3 占位 · auth 由 lucia 处理"
- Files: `src/pages/Login.tsx`
- Trigger: Navigate to `/login`
- Workaround: Auth handled by backend OAuth redirect via `useAuth.ts`; login page not needed yet

## Security Considerations

**No route guards:**
- Risk: Pages that should require authentication (all step/tool/module pages) have no redirect-to-login guard
- Files: `src/router.tsx`, `src/hooks/useAuth.ts`
- Current mitigation: Pages gracefully degrade (show empty state or null content) when `trpc.auth.me` returns unauthenticated
- Recommendations: Add a `RequireAuth` route wrapper in `src/router.tsx` that reads `useAuth` and redirects to `${API_BASE}/auth/login` if unauthenticated

**LS key `aiip_active_account_id` not namespaced:**
- Risk: Written with `localStorage.setItem('aiip_active_account_id', ...)` in `useActiveAccount.ts` (plain key, not prefixed with account namespace)
- Files: `src/hooks/useActiveAccount.ts`
- Current mitigation: Low risk — this key does not contain sensitive data, just an account ID integer
- Recommendations: Document intentional exemption from namespace pattern

**Credentials: include on all tRPC requests:**
- Risk: Session cookies sent to `VITE_API_BASE_URL` — if `VITE_API_BASE_URL` is misconfigured to a different origin, session cookies could be leaked
- Files: `src/lib/trpc.ts`
- Current mitigation: Dev proxy in `vite.config.ts` ensures same-origin during local dev
- Recommendations: Validate `VITE_API_BASE_URL` is same-origin or a trusted first-party domain before production deploy

## Performance Bottlenecks

**History.tsx is 839 lines — the largest file:**
- Problem: Single file implements two full views (timeline + dashboard) with 4 KPI cards, 4 recharts charts, URL state, filters, pagination, and virtualization
- Files: `src/pages/modules/History.tsx`
- Cause: Single-file implementation of a complex feature
- Improvement path: Extract `HistoryTimelineView` and `HistoryDashboardView` into `src/pages/modules/components/history/`

**StepForm.tsx and ToolForm.tsx are 602 lines each:**
- Problem: Both are monolithic switch-based forms with all step/tool variants inline
- Files: `src/components/StepForm/StepForm.tsx`, `src/components/ToolForm/ToolForm.tsx`
- Cause: stepKey-switch pattern embeds all field variants in one file
- Improvement path: Extract each step variant to a separate `StepNFields.tsx` module; keep `StepForm` as orchestrator

**VoiceChat.tsx is 612 lines with multiple `console.error` calls:**
- Problem: Complex real-time audio page with WebRTC, MediaRecorder, SSE subscription, TTS all in one component
- Files: `src/pages/tools/VoiceChat.tsx`
- Cause: High coupling between MediaRecorder lifecycle, SSE subscription, TTS synthesis
- Improvement path: Extract `useVoiceRecorder`, `useVoiceChatSession` hooks to separate files

**No code coverage enforcement:**
- Problem: `vitest.config.ts` has no `coverage` threshold; test gaps go undetected
- Files: `vitest.config.ts`
- Cause: Coverage not yet configured
- Improvement path: Add `coverage: { thresholds: { lines: 70 } }` to vitest config after P1

## Fragile Areas

**Dual-write LS-first pattern:**
- Files: `src/hooks/useStepData.ts`, `src/lib/ls-namespace.ts`
- Why fragile: LS write and DB write are decoupled by design (LS never rolled back on DB failure); if LS is corrupted or cleared externally (private browsing, user clears data), data is lost without notice
- Safe modification: Never change the `stepLsKey()` format without running `migrateLegacyLs`-style migration; always add to `LEGACY_KEYS` if renaming keys
- Test coverage: `src/hooks/__tests__/useStepData.test.tsx` covers the AC; LS quota overflow tested

**Design token chain (DESIGN.md → parseDesignTokens → tailwind.config.js):**
- Files: `src/lib/parseDesignTokens.js`, `tailwind.config.js`, `../../ui/aurelian_dark/DESIGN.md`
- Why fragile: If `DESIGN.md` YAML frontmatter format changes, `parseDesignTokens.js` silently returns partial tokens, causing undefined color values in Tailwind without build error
- Safe modification: After any DESIGN.md change, run `pnpm build` and inspect output CSS for missing color values
- Test coverage: No tests for `parseDesignTokens.js`

**Constants as "literal locks":**
- Files: `src/lib/constants/industries.ts`, `src/lib/constants/step3.ts` through `step8.ts`
- Why fragile: These constants are marked as `D1=A 字面锁` — spec-locked strings. Any modification can break spec compliance verified by E2E tests
- Safe modification: Only change with corresponding spec update; E2E tests (`prd-17-step1-3-3b.spec.ts`) assert exact text

**tRPC `AppRouter` type import chain:**
- Files: `src/lib/trpc.ts` → `@quanqn/clients/router-types` → `apps/api`
- Why fragile: `import type { AppRouter }` depends on `@quanqn/clients` being in sync with `apps/api`; type drift causes TS errors without runtime signal
- Safe modification: After any API router change, run `pnpm typecheck` in `apps/web`

## Scaling Limits

**localStorage 5 MB cap:**
- Current capacity: 5 MB enforced by `pruneLsNamespaces` in `src/lib/ls-namespace.ts`
- Limit: Browser localStorage is typically 5-10 MB; non-active accounts are pruned when approaching limit
- Scaling path: Move to IndexedDB for larger step data payloads if step outputs grow beyond a few KB each

**React Query `staleTime: 30_000`:**
- Current capacity: 30s stale time on all step data queries; adequate for single-tab usage
- Limit: Multi-tab usage with the same account will have up to 30s of stale data divergence
- Scaling path: Use `queryClient.invalidateQueries` on mutation success for real-time consistency

## Dependencies at Risk

**`@trpc/client` and `@trpc/react-query` are RC versions:**
- Risk: `11.0.0-rc.0` — pre-release; breaking changes in stable release possible
- Impact: `splitLink`, `httpSubscriptionLink`, `httpBatchStreamLink` APIs could change
- Migration plan: Monitor `@trpc/trpc` releases; upgrade to stable `11.x.x` when available

## Missing Critical Features

**No authentication route guards:**
- Problem: All routes are publicly accessible to unauthenticated users (they just show empty states)
- Blocks: Full production deployment with user data protection

**No error logging service:**
- Problem: `console.error` only; no Sentry or equivalent
- Blocks: Production debugging of client-side errors at scale

**No service worker / offline support:**
- Problem: No PWA or caching strategy
- Blocks: Resilient mobile experience

## Test Coverage Gaps

**Tool pages (14) have no vitest unit tests:**
- What's not tested: `src/pages/tools/` — Trending, Copywriting, PrivateDomain, DeepLearning, etc.
- Files: All `src/pages/tools/*.tsx`
- Risk: Regression in tool page renders undetected until E2E or manual testing
- Priority: Medium — covered partially by smoke tests in `pages.test.tsx` but only for a subset (Trending, Copywriting, Knowledge, Generate)

**`parseDesignTokens.js` has no tests:**
- What's not tested: Token parsing logic from DESIGN.md YAML
- Files: `src/lib/parseDesignTokens.js`
- Risk: Silent color value regression if DESIGN.md format changes
- Priority: Medium

**`StepForm.tsx` switch branches have no isolated tests:**
- What's not tested: Step-specific field rendering inside the generic form (category selects, platform selects, textarea fields per step)
- Files: `src/components/StepForm/StepForm.tsx`
- Risk: Field regression per step requires E2E detection
- Priority: Medium

**E2E tests require running backend:**
- What's not tested: Any E2E spec in `e2e/` runs without the backend API server returns failures
- Files: `e2e/*.spec.ts`
- Risk: CI pipeline must start both frontend and backend; complex setup
- Priority: High for CI configuration

---

*Concerns audit: 2026-05-19*
