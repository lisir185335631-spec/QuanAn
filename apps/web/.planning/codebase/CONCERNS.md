# Codebase Concerns

**Analysis Date:** 2026-05-20

## Tech Debt

**TypeScript project references not used:**
- Issue: `src/lib/trpc.ts` carries comment "TD: switch to TypeScript project references in P1." Path aliases are duplicated across `tsconfig.app.json`, `vite.config.ts`, and `vitest.config.ts`.
- Files: `tsconfig.app.json`, `vite.config.ts`, `vitest.config.ts`
- Impact: Triple maintenance of the same alias block; drift risk when one config is updated without the others
- Fix approach: Enable TypeScript project references in P1; remove duplicate alias blocks from Vite and Vitest configs

**`App.tsx` not used by router:**
- Issue: `src/App.tsx` exists as a standalone shell with `migrateLegacyLs` call, but the production router uses `RootLayout.tsx`. `App.tsx` is dead code.
- Files: `src/App.tsx`
- Impact: Confusion for new contributors; `migrateLegacyLs` in App.tsx never runs
- Fix approach: Delete `src/App.tsx`; confirm `migrateLegacyLs` is called correctly from `RootLayout.tsx` or main.tsx

**Repeated `eslint-disable-next-line react-hooks/exhaustive-deps`:**
- Issue: 15+ suppressions across step pages (`Step1.tsx`, `Step3.tsx`, `Step4b.tsx`, `Step5.tsx`, `Step7.tsx`, `Step8.tsx`, `StepForm.tsx`, etc.)
- Files: Most files in `src/pages/step/` and `src/components/step8/`
- Impact: Masks potential stale closure bugs; makes effect behavior harder to audit
- Fix approach: Replace suppressed effects with stable `useCallback` deps or `useRef`-tracked values (pattern in `Step1.tsx:prevIsSavingRef`)

**`parseDesignTokens.js` is plain JavaScript:**
- Issue: `src/lib/parseDesignTokens.js` is the only non-TypeScript source file in `src/`
- Files: `src/lib/parseDesignTokens.js`
- Impact: No type safety; must be excluded from `tsc`; currently has no tests
- Fix approach: Convert to TypeScript; add unit tests for YAML parsing logic

**Stub pages use native `<select>` instead of Radix `Select`:**
- Issue: PRD-23 stub pages (`AcquisitionVideo.tsx`, etc.) use `<select>` with inline Tailwind rather than `<Select>` from `src/components/ui/select.tsx`
- Files: `src/pages/tools/AcquisitionVideo.tsx`
- Impact: Visual inconsistency with design system; will need refactor when stubs are wired to real LLM
- Fix approach: Replace with `<Select>` component when implementing LLM integration in future PRDs

**IpAccountCard edit/delete are stubs:**
- Issue: `handleStubEdit` and `handleStubDelete` in `IpAccountCard.tsx` call `toast.info('功能 PRD-25+')` instead of real logic
- Files: `src/components/accounts/IpAccountCard.tsx`
- Impact: Edit and delete actions do nothing useful in production
- Fix approach: Implement `trpc.ipAccounts.update` and `trpc.ipAccounts.delete` in PRD-25+

## Known Bugs

**Step 2 and Step 9 are placeholders:**
- Symptoms: `/step/2` and `/step/9` render placeholder content only
- Files: `src/pages/step/Step2.tsx`, `src/pages/step/Step9.tsx`
- Trigger: Navigate to `/step/2` or `/step/9`
- Workaround: Expected; implementation deferred to later PRDs

**Login page is a placeholder:**
- Symptoms: `/login` renders static text; auth handled by backend OAuth redirect
- Files: `src/pages/Login.tsx`
- Workaround: Auth works via `useAuth.ts` redirect; login page not needed yet

**PRD-23 stub output renders static "AI 生成中…" placeholders:**
- Symptoms: After form submission on Analysis, VideoAnalysis, VideoProduction, AcquisitionVideo, all output sections show "AI 生成中…" placeholder text
- Files: `src/pages/tools/Analysis.tsx`, `VideoAnalysis.tsx`, `VideoProduction.tsx`, `AcquisitionVideo.tsx`
- Trigger: Submit any stub tool page form
- Workaround: Expected stub behavior; LLM wiring deferred to future PRDs

**Diagnosis report scores are deterministic stubs:**
- Symptoms: 7-dimension scores are `60 + (hash % 36)` — not real AI output
- Files: `src/pages/modules/Diagnosis.tsx:44` (`stubScore()` function)
- Trigger: Complete 8-step diagnosis flow
- Workaround: Expected PRD-23 behavior; real scoring deferred to PRD-25+

## Security Considerations

**No route guards:**
- Risk: All routes accessible to unauthenticated users (show empty/null state)
- Files: `src/router.tsx`, `src/hooks/useAuth.ts`
- Current mitigation: Pages gracefully degrade when unauthenticated
- Recommendations: Add `RequireAuth` route wrapper reading `useAuth` and redirecting to `${API_BASE}/auth/login`

**`aiip_active_account_id` not namespaced:**
- Risk: Written with plain `localStorage.setItem('aiip_active_account_id', ...)` in `useActiveAccount.ts`
- Files: `src/hooks/useActiveAccount.ts`
- Current mitigation: Low risk — key contains only an integer account ID
- Recommendations: Document intentional exemption; add comment explaining why plain key is acceptable

**`credentials: 'include'` on all tRPC requests:**
- Risk: Session cookies sent to `VITE_API_BASE_URL`; misconfiguration could leak cookies to wrong origin
- Files: `src/lib/trpc.ts:52`
- Current mitigation: Dev proxy in `vite.config.ts` ensures same-origin during local dev
- Recommendations: Validate `VITE_API_BASE_URL` is first-party domain before production deploy

## Performance Bottlenecks

**History.tsx is 839 lines — largest file in the codebase:**
- Problem: Implements two full views (timeline + dashboard) with 4 KPI cards, 4 recharts charts, URL state, filters, pagination, and virtualization in a single file
- Files: `src/pages/modules/History.tsx`
- Cause: Single-file monolith
- Improvement path: Extract `HistoryTimelineView` and `HistoryDashboardView` into `src/pages/modules/components/history/`

**StepForm.tsx and ToolForm.tsx are 602 lines each — monolithic switch forms:**
- Problem: All step/tool field variants embedded in one large switch statement per file
- Files: `src/components/StepForm/StepForm.tsx`, `src/components/ToolForm/ToolForm.tsx`
- Cause: stepKey-switch pattern with inline JSX for every variant
- Improvement path: Extract each step/tool variant to `StepNFields.tsx`; keep orchestrator thin

**VoiceChat.tsx is 612 lines with coupled real-time concerns:**
- Problem: MediaRecorder lifecycle, SSE subscription, and TTS synthesis tightly coupled in one component
- Files: `src/pages/tools/VoiceChat.tsx`
- Cause: No hook extraction
- Improvement path: Extract `useVoiceRecorder`, `useVoiceChatSession` hooks

**No code coverage enforcement:**
- Problem: No coverage threshold in `vitest.config.ts`; gaps go undetected
- Files: `vitest.config.ts`
- Improvement path: Add `coverage: { thresholds: { lines: 70 } }` after P1

## Fragile Areas

**Dual-write LS-first pattern:**
- Files: `src/hooks/useStepData.ts`, `src/lib/ls-namespace.ts`
- Why fragile: LS and DB writes decoupled by design; if LS is cleared externally (private browsing, user clears data), data is lost without notice
- Safe modification: Never change `stepLsKey()` format without a migration in `src/lib/migration/legacy-ls.ts`; always add renamed keys to `LEGACY_KEYS`

**Design token chain (DESIGN.md → parseDesignTokens → tailwind.config.ts):**
- Files: `src/lib/parseDesignTokens.js`, `tailwind.config.ts`, `../../ui/aurelian_dark/DESIGN.md`
- Why fragile: If DESIGN.md YAML frontmatter changes format, `parseDesignTokens.js` silently returns partial tokens with no build error
- Safe modification: After any DESIGN.md change, run `pnpm build` and inspect output CSS for undefined color values

**Constants as "literal locks":**
- Files: `src/lib/constants/diagnosis.ts`, `src/lib/constants/industries.ts`, `src/lib/constants/step3.ts` through `step8.ts`
- Why fragile: Strings are spec-locked (marked `D1=A 字面锁`); any change breaks E2E test assertions
- Safe modification: Only change with corresponding spec update; PRD-23 visual baseline asserts exact heading text

**tRPC `AppRouter` type import chain:**
- Files: `src/lib/trpc.ts` → `@quanan/clients/router-types` → `apps/api`
- Why fragile: Type drift between `@quanan/clients` and `apps/api` causes TS errors without runtime signal
- Safe modification: After any API router change, run `pnpm typecheck` in `apps/web`

**Diagnosis localStorage key format:**
- Files: `src/pages/modules/Diagnosis.tsx:53` — key `getLsKey(accountId, 'diagnosis_progress')`
- Why fragile: Not yet registered in `src/lib/migration/legacy-ls.ts` `LEGACY_KEYS`; if key is renamed in future, old data will be orphaned
- Safe modification: Register any future key rename in `legacy-ls.ts`

## Scaling Limits

**localStorage 5 MB cap:**
- Current capacity: Enforced by `pruneLsNamespaces` in `src/lib/ls-namespace.ts`
- Limit: Browser localStorage typically 5-10 MB; non-active accounts pruned approaching limit
- Scaling path: Move to IndexedDB for larger step/diagnosis data payloads

**React Query `staleTime: 30_000`:**
- Current capacity: Adequate for single-tab usage
- Limit: Multi-tab with same account will have up to 30s stale data divergence
- Scaling path: `queryClient.invalidateQueries` on mutation success

## Dependencies at Risk

**`@trpc/client` and `@trpc/react-query` are RC versions:**
- Risk: `11.0.0-rc.0` — pre-release; `splitLink`, `httpSubscriptionLink`, `httpBatchStreamLink` APIs could change in stable
- Impact: All tRPC transport layer
- Migration plan: Monitor `@trpc/trpc` releases; upgrade to stable `11.x.x` when available

## Missing Critical Features

**No authentication route guards:**
- Problem: All routes accessible to unauthenticated users
- Blocks: Production deployment with user data protection

**No error logging service:**
- Problem: `console.error` only; no Sentry or equivalent
- Blocks: Production debugging at scale

**LLM integration not wired for PRD-23 stub pages:**
- Problem: `/analysis`, `/video-analysis`, `/video-production`, `/acquisition-video` show static placeholder output
- Files: `src/pages/tools/Analysis.tsx`, `VideoAnalysis.tsx`, `VideoProduction.tsx`, `AcquisitionVideo.tsx`
- Blocks: Real AI output for these 4 tool pages (deferred to PRD-25+)

**Diagnosis scores not real:**
- Problem: `stubScore()` in `Diagnosis.tsx` returns deterministic integer; not AI-generated
- Files: `src/pages/modules/Diagnosis.tsx:44`
- Blocks: Meaningful IP health diagnosis (deferred to PRD-25+)

## Test Coverage Gaps

**Most tool pages (11/15) have no vitest unit tests:**
- What's not tested: `Trending.tsx`, `Copywriting.tsx`, `PrivateDomain.tsx`, `DeepLearning.tsx`, `BoomGenerate.tsx`, `Generate.tsx`, `AiVideo.tsx`, `VoiceChat.tsx`, `Monetization.tsx`, `PresentStyles.tsx`, `Knowledge.tsx`
- Files: `src/pages/tools/` (above list)
- Risk: Render regressions undetected until smoke test or E2E
- Priority: Medium — partially covered by `pages.test.tsx` smoke tests (Trending, Copywriting, Knowledge, Generate)

**PRD-23 stub pages have ≥4 tests each (meets AC-6) but narrow coverage:**
- What's not tested: Multi-field validation combinations, empty-string edge cases, account.industry auto-fill via useEffect
- Files: `src/pages/tools/__tests__/AcquisitionVideo.test.tsx` and siblings
- Risk: Interaction edge cases missed
- Priority: Low — AC-6 minimum met; expand during LLM wiring

**`parseDesignTokens.js` has no tests:**
- What's not tested: Token parsing from DESIGN.md YAML
- Files: `src/lib/parseDesignTokens.js`
- Risk: Silent color regression if DESIGN.md format changes
- Priority: Medium

**`StepForm.tsx` switch branches have no isolated tests:**
- What's not tested: Step-specific field rendering (category selects, platform selects per step)
- Files: `src/components/StepForm/StepForm.tsx`
- Risk: Field regression requires E2E detection
- Priority: Medium

**E2E tests for PRD-23 pages not in `apps/web/e2e/`:**
- What's not tested: Full browser flow for `/diagnosis`, `/accounts`, `/acquisition-video`, `/video-analysis`, `/analysis`, `/video-production`
- Files: Visual baseline only at `tests/e2e/prd23-visual-baseline.spec.ts`
- Risk: Form interaction + multi-step flow regressions not caught by unit tests alone
- Priority: High — add `prd-23-modules-tools.spec.ts` in `apps/web/e2e/`

---

*Concerns audit: 2026-05-20*
