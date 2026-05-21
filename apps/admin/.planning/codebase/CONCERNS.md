# Codebase Concerns — apps/admin

**Analysis Date:** 2026-05-21

## Tech Debt

**Google Workspace OAuth stub:**
- Issue: Login page has a disabled "Google Workspace 登录" button that does nothing
- Files: `src/pages/Login.tsx:111-128`
- Impact: Production login only works in DEV mode (`import.meta.env.DEV` gate); Google OAuth path is not available at all
- Fix approach: Awaiting PRR; implement `apps/api/src/lib/auth/oauth-admin-google.ts` (already scaffolded), then remove the `disabled` prop and DEV guard

**Shadow router desync risk:**
- Issue: `packages/clients/src/admin-router-types.ts` is a manual mirror of `apps/api/src/trpc/routers/admin/index.ts`; no automated sync check
- Files: `packages/clients/src/admin-router-types.ts`, `apps/api/src/trpc/routers/admin/index.ts`
- Impact: If a new procedure is added to the real router without updating the shadow router, TypeScript will not error immediately (shadow router uses `(x: unknown) => x as T` casts); runtime 404/type mismatch possible
- Fix approach: Add a CI step that diffs the two files or generates the shadow router from the real one automatically

**PDF charts use placeholder stubs:**
- Issue: `ComplianceReportPdf.tsx` and `ExperimentReportPdf.tsx` use a stub box for time-series chart sections instead of real SVG-to-PNG rendering
- Files: `src/pages/compliance/components/ComplianceReportPdf.tsx`, `src/pages/abExperiments/ExperimentReportPdf.tsx`
- Impact: PDF exports contain placeholder text "后端 puppeteer 生成 PNG 留 PRR" in the chart section
- Fix approach: PRR item; implement backend Puppeteer PNG generation for chart sections

**LlmJudgeCard "isMock stub" label:**
- Issue: Both `PromptsPage` and `ConstantsPage` show "模型: claude-sonnet (isMock stub)" in their LLM judge cards
- Files: `src/pages/prompts/components/LlmJudgeCard.tsx`, `src/pages/constants/components/LlmJudgeCard.tsx`
- Impact: Production judge runs will display "isMock stub" if the real LLM judge endpoint returns `isMock: true`
- Fix approach: Update label rendering to differentiate real vs mock calls once API endpoint is fully live

**Compliance DisclaimerModal stub:**
- Issue: "配置免责模板" button in CompliancePage triggers a toast "功能开发中 · P9.4" — no actual modal
- Files: `src/pages/compliance/index.tsx`
- Impact: Compliance disclaimer template editing not functional
- Fix approach: Implement disclaimer template modal in P9.4 per PRD roadmap

**ApprovalDetailDrawer action description stubs:**
- Issue: `ApprovalDetailDrawer.tsx` uses per-actionType impact description stubs
- Files: `src/pages/approvals/ApprovalDetailDrawer.tsx`
- Impact: Risk descriptions shown in approval UI may be generic/incomplete
- Fix approach: Populate full impact descriptions per actionType

## Known Bugs

**No known bugs at time of PRD-26 sealing.** PRD-26 polished all 17 pages; regression suite (51 unit tests + 3 Playwright projects) passes clean.

## Security Considerations

**Mock OAuth in non-DEV environments:**
- Risk: `import.meta.env.DEV` guard on mock login button could be circumvented if the build is created with `NODE_ENV=development` accidentally
- Files: `src/pages/Login.tsx:89-108`
- Current mitigation: Vite replaces `import.meta.env.DEV` at build time; production build (`vite build`) always sets `DEV=false`
- Recommendation: Verify CI build command never passes `--mode development` to `vite build`

**Cookie domain alignment:**
- Risk: `admin_session_id` is set HttpOnly by the API; the admin SPA must be served from a domain where the cookie is accessible (same-site policy)
- Files: `src/lib/admin-client.ts:24-28` (`credentials: 'include'`)
- Current mitigation: Local dev uses same-domain localhost; production deployment must align API + SPA domains
- Recommendation: Document cookie domain requirements in deployment runbook before PRR

**No client-side rate limiting:**
- Risk: Admin users can trigger rapid mutations (ban, quota adjust) without client-side throttle
- Files: All mutation-heavy pages (users, quota, approvals)
- Current mitigation: `approvalGateCheckMiddleware` on server side; high-risk actions require approval workflow
- Recommendation: Low priority given server-side gates; acceptable current state

## Performance Bottlenecks

**`@monaco-editor/react` bundle weight:**
- Problem: Monaco editor is a large bundle (~2MB+); loaded as part of `p2-advanced` chunk
- Files: `src/pages/prompts/PromptsPage.tsx`, `src/pages/constants/ConstantsPage.tsx`
- Cause: Monaco is not lazily loaded within the chunk — it loads when any P2 page is first visited
- Improvement path: Wrap Monaco import itself in `React.lazy` / dynamic import with a dedicated mini-chunk

**React Query default retry on admin API:**
- Problem: `retry: 1` means failed queries (e.g., 401 session expired) will retry once before showing an error, adding ~1s delay to auth expiry detection
- Files: `src/lib/admin-client.ts:12-14`
- Improvement path: Set `retry: false` for auth-related queries, or intercept 401 responses to redirect immediately

## Fragile Areas

**Shadow router type mirror (`packages/clients/src/admin-router-types.ts`):**
- Files: `packages/clients/src/admin-router-types.ts`
- Why fragile: 1731-line file manually maintained; no codegen. Adding a new API procedure without updating this file causes silent runtime errors (TypeScript doesn't catch `(x: unknown) => x as T` mismatches)
- Safe modification: Always update both files atomically in the same commit when adding/changing admin procedures

**Rollup chunk assignment in `vite.config.ts`:**
- Files: `apps/admin/vite.config.ts:17-53`
- Why fragile: New pages not assigned to a chunk silently fall into the default chunk, potentially bloating it
- Safe modification: Every new page directory added to `src/pages/` must have a corresponding `id.includes()` clause in `manualChunks`

**Playwright admin project serial execution:**
- Files: `playwright.config.ts:47-55`, `tests/e2e/prd26-admin-role-matrix.spec.ts`
- Why fragile: `workers: 1` + `fullyParallel: false` for the admin project is intentional (shared admin user race conditions). Adding a parallel admin spec would silently introduce flakiness
- Safe modification: All new admin Playwright specs must be added to `tests/e2e/admin/` or named `prd*-admin-*.spec.ts`; never set `test.describe.parallel` on admin specs

**`usePageViewAudit` dedup logic:**
- Files: `src/layouts/AdminLayout.tsx:14-23`
- Why fragile: Uses `useRef` to track last path; if `AdminLayout` remounts (e.g., full re-render from provider change), `lastPath` resets and an extra `logPageView` fires
- Safe modification: Provider tree above `AdminLayout` must be stable; avoid re-mounting providers on navigation

## Scaling Limits

**DenseTable with large datasets:**
- Current capacity: `@tanstack/react-virtual` installed for virtual scrolling but usage is page-dependent
- Limit: Pages that don't use virtual scrolling (e.g., some compliance list views) will slow down with >500 rows in memory
- Scaling path: Ensure all list pages use server-side pagination (already present on most via `page`/`pageSize` params) and add virtual scrolling where needed

**A/B experiment timeline charts:**
- Current capacity: `ExperimentTimeline.tsx` renders Recharts with all data points from API
- Limit: Experiments running for months with daily data points may render 365+ data points in a single chart
- Scaling path: Add date range selector on the timeline before data grows large

## Dependencies at Risk

**`@trpc/client` and `@trpc/react-query` at `11.0.0-rc.0`:**
- Risk: Release candidate; API may change before stable release
- Impact: Breaking changes in tRPC v11 stable would require updates to `admin-client.ts` and all hook call sites
- Migration plan: Pin to `-rc.0` until v11 stable; monitor tRPC changelog; upgrade in one batch

**`@react-pdf/renderer` pinned at `4.5.1`:**
- Risk: Exact pin means automatic security updates are blocked; major upgrades have breaking JSX API changes
- Impact: PDF templates in cost, compliance, abExperiments, audit pages
- Migration plan: Upgrade only when breaking CVE is found; test all 4 PDF templates after any version bump

## Missing Critical Features

**Real-time audit notifications:**
- Problem: `AuditDrawer` refetches every 30s when open; no WebSocket/SSE push
- Blocks: Admins may miss time-sensitive audit events (e.g., mass ban action) for up to 30s
- Note: Acceptable for V1 per PRD scope; WebSocket infrastructure not yet implemented

**MFA enforcement UI:**
- Problem: `adminSessionMfaVerifiedAt` is validated by `mfaCheckMiddleware` on the API, but there is no frontend MFA prompt/flow
- Blocks: MFA-required procedures will return a 403 with no user-facing recovery path
- Note: TOTP/MFA UI is PRR-gated; current admin users bypass MFA in dev mode

## Test Coverage Gaps

**`AdminLayout` route guard logic:**
- What's not tested: The `isDomainAllowed` redirect logic in `AdminLayout.tsx` (lines 45-52) is not covered by unit tests
- Files: `src/layouts/AdminLayout.tsx`
- Risk: Role-based redirect bugs would go unnoticed until Playwright e2e
- Priority: Medium — covered at e2e level by `prd26-admin-role-matrix.spec.ts` but no unit test

**`src/lib/admin-routes.ts` helper functions:**
- What's not tested: `isDomainAllowed`, `getAllowedRoutes`, `getRouteByPath` have no unit tests
- Files: `src/lib/admin-routes.ts`
- Risk: Logic bugs in RBAC helpers would affect all pages silently
- Priority: Medium — these are pure functions; easy to add unit tests

**Login page error paths:**
- What's not tested: No unit test for login failure (onError callback), empty email validation
- Files: `src/pages/Login.tsx`
- Risk: Auth UX regression in error handling
- Priority: Low — covered by e2e foundation loop test

**`AdminLoading` component:**
- What's not tested: No test for the spinner/loading component
- Files: `src/components/AdminLoading.tsx`
- Risk: Very low — trivial presentational component
- Priority: Low

---

*Concerns audit: 2026-05-21*
