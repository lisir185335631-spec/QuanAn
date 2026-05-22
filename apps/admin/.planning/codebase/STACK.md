# Technology Stack — apps/admin

**Analysis Date:** 2026-05-21

## Languages

**Primary:**
- TypeScript 5.6 — all source files; strict mode via `tsconfig.base.json`

**Secondary:**
- CSS — `src/styles/admin.css` (344 lines, CSS custom properties; no preprocessor)

## Runtime

**Environment:**
- Browser (SPA); no server-side rendering

**Dev Server:**
- Vite 5.4 — port 5174 (distinguished from main web app on 5173)

**Package Manager:**
- pnpm 9.15.9 (workspace)
- Lockfile: `pnpm-lock.yaml` at monorepo root

## Frameworks

**Core:**
- React 18.3 — UI framework; functional components + hooks throughout
- React DOM 18.3 — browser renderer
- React Router DOM 6.27 — `BrowserRouter` + `Routes`/`Route`/`Navigate`/`Outlet`/`useSearchParams`

**Data Fetching:**
- `@trpc/client` 11.0.0-rc.0 — typed HTTP client
- `@trpc/react-query` 11.0.0-rc.0 — React Query integration for tRPC
- `@tanstack/react-query` 5.59 — server state cache; `staleTime: 30_000`, `retry: 1`

**UI:**
- `@quanan/ui` (workspace) — shared admin primitives (`Sidebar`, `TopBar`, `StatusBar`, `AuditDrawer`, `DenseTable`)
- `recharts` 3.8 — charts (NSM funnel, cost breakdown, distributions)
- `@monaco-editor/react` 4 — code editor in ConstantsPage and PromptsPage
- `@react-pdf/renderer` 4.5.1 — PDF generation (cost bill, compliance report, AB experiment report, audit forensics)
- `@tanstack/react-virtual` 3.13 — virtual scrolling for long lists

**Testing:**
- Vitest 2.1 — unit test runner; jsdom environment
- `@testing-library/react` 16 — component rendering + DOM queries
- `@testing-library/jest-dom` 6.6 — custom matchers (`toBeInTheDocument`, etc.)
- Playwright — e2e tests (config at repo root `playwright.config.ts`); `admin` project at port 5174

**Build/Dev:**
- Vite 5.4 — dev server + production build
- `@vitejs/plugin-react` 4.3 — Fast Refresh + JSX transform
- TypeScript compiler — `tsc --noEmit` for type-check; `tsc && vite build` for production

## Key Dependencies

**Critical:**
- `@quanan/clients` (workspace) — provides `AdminRouter` type from `admin-router-types.ts`; required for tRPC type inference
- `@quanan/ui` (workspace) — layout components shared between admin and potentially main app
- `@trpc/server` 11.0.0-rc.0 — listed in `dependencies` (needed by shadow router type file via `initTRPC`); NOT imported at runtime in browser pages
- `react-router-dom` 6.27 — all client-side routing

**Infrastructure:**
- `@react-pdf/renderer` 4.5.1 — pinned exact version; breaking changes between majors affect PDF template syntax

## Configuration

**Environment:**
- `VITE_API_BASE_URL` — API base URL; defaults to `http://localhost:3000` if unset (`src/lib/admin-client.ts:22`)
- `DEV` — Vite built-in; controls mock OAuth button visibility in `Login.tsx`
- `OAUTH_PROVIDER` — read by API side for mock vs Google OAuth selection
- `DATABASE_URL` / `DATABASE_URL_TEST` — used by Playwright e2e tests directly (Prisma seeding)
- `ADMIN_E2E_BASE_URL` — overrides Playwright admin baseURL (default `http://localhost:5174`)

**Build:**
- `vite.config.ts` — 4 manual Rollup chunks; build output to `dist-admin/`
- `tsconfig.json` — path aliases `@/*` → `src/*`, `@quanan/ui` → `packages/ui/src`, etc.
- `vitest.config.ts` — same path aliases for test resolution

## Platform Requirements

**Development:**
- Node.js v24+ (project uses v24.15.0)
- pnpm 9.15.9
- Port 5174 available (admin dev server)
- Port 3000 available (API server; admin calls `VITE_API_BASE_URL/trpc/admin`)
- For e2e tests: PostgreSQL running, `quanqn` / `quanqn_test` databases seeded

**Production:**
- Static SPA bundle in `dist-admin/`; can be served by any static host
- Requires API server at the configured `VITE_API_BASE_URL`
- Must be served at a URL where `admin_session_id` cookie domain aligns with API domain (same-site cookie auth)

---

*Stack analysis: 2026-05-21*
