<!-- refreshed: 2026-05-21 -->
# Architecture — apps/admin

**Analysis Date:** 2026-05-21

## System Overview

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                         Browser · port 5174                              │
│                      React SPA · BrowserRouter                           │
├──────────────────┬──────────────────────┬───────────────────────────────┤
│   /login         │  /admin (layout)      │  lazy page chunks             │
│ `src/pages/      │  `src/layouts/        │  `src/pages/<domain>/`        │
│  Login.tsx`      │   AdminLayout.tsx`    │   17 pages, 4 chunk groups    │
└────────┬─────────┴────────┬─────────────┴──────────────┬────────────────┘
         │  adminTrpc.auth  │  adminTrpc.*                │
         ▼                  ▼                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                  tRPC client  ·  `src/lib/admin-client.ts`               │
│           httpBatchLink → /trpc/admin  ·  credentials: 'include'         │
│           type: AdminRouter from `@quanan/clients/admin-router-types`    │
└─────────────────────────────────────────────────────────────────────────┘
         │
         ▼ HTTP (cookie session)
┌─────────────────────────────────────────────────────────────────────────┐
│      apps/api  ·  adminRouter  ·  6-gate adminProcedure chain            │
│  `apps/api/src/trpc/routers/admin/index.ts`                              │
│  Gate order: adminAuth → roleCheck → ipWhitelist → mfaCheck             │
│            → adminRLS → approvalGateCheck → auditLog                     │
└─────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  PostgreSQL (quanqn DB)  ·  admin_* tables  ·  RLS DISABLED             │
│  Redis  ·  session store + rate-limit                                    │
└─────────────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| `App` | tRPC + QueryClient provider tree, BrowserRouter mount | `src/App.tsx` |
| `AdminRoutes` | React Router route tree, 17 lazy page imports, Suspense | `src/router.tsx` |
| `AdminLayout` | Grid shell, route guard, page_view audit, sidebar groups | `src/layouts/AdminLayout.tsx` |
| `Login` | Email input, mock OAuth (DEV), Google stub (disabled) | `src/pages/Login.tsx` |
| `adminTrpc` | `createTRPCReact<AdminRouter>()`, typed against shadow router | `src/lib/admin-client.ts` |
| `ADMIN_ROUTES` | 17-domain metadata array, `domainKey` mapping for RBAC | `src/lib/admin-routes.ts` |
| `AdminLoading` | Suspense fallback spinner | `src/components/AdminLoading.tsx` |
| `@quanan/ui/admin` | Shared layout components: Sidebar, TopBar, StatusBar, AuditDrawer, DenseTable | `packages/ui/src/admin/` |

## Pattern Overview

**Overall:** SPA with server-driven RBAC, tRPC for all data fetching, cookie-session auth

**Key Characteristics:**
- All 17 pages are `React.lazy()` code-split into 4 named Rollup chunks (`p0-core`, `p0-review`, `p1-health`, `p2-advanced`)
- `AdminLayout` owns the route guard: checks `me.allowedDomains` against `domainKey` of current route; redirects if forbidden
- The tRPC client type `AdminRouter` comes from a shadow router in `packages/clients/src/admin-router-types.ts` — keeps `@trpc/server` out of the browser bundle
- No local state manager (Redux/Zustand); all server state via `@tanstack/react-query` through tRPC hooks

## Layers

**Entry:**
- Purpose: Bootstrap React tree
- Location: `src/main.tsx`
- Contains: `createRoot` + `App` mount

**Providers (App):**
- Purpose: Wrap with tRPC context + QueryClient + BrowserRouter
- Location: `src/App.tsx`
- Depends on: `src/lib/admin-client.ts`
- Used by: Everything

**Router:**
- Purpose: Route tree with lazy-loaded pages, Suspense boundary
- Location: `src/router.tsx`
- Contains: All 17 page imports, default redirect to `/admin/nsm`, 404 redirect to `/login`
- Depends on: Page components, `AdminLoading`

**Layout:**
- Purpose: Authenticated shell, sidebar, topbar, audit drawer, route guard
- Location: `src/layouts/AdminLayout.tsx`
- Depends on: `@quanan/ui/admin` (Sidebar, TopBar, StatusBar, AuditDrawer), `admin-client`, `admin-routes`
- Used by: All `/admin/*` routes via `<Outlet />`

**Pages (17 domains):**
- Purpose: Domain-specific data fetch + render
- Location: `src/pages/<domain>/`
- Contains: One index.tsx or named Page file + optional sub-components in `components/`, optional `__tests__/`
- Depends on: `adminTrpc` hooks, `@quanan/ui/admin` (DenseTable, tokens)
- Used by: Router

**Lib:**
- Purpose: tRPC client singleton + route metadata
- Location: `src/lib/`
- Key files: `admin-client.ts`, `admin-routes.ts`

## Data Flow

### Primary Request Path

1. Page component calls `adminTrpc.<namespace>.<procedure>.useQuery(input)` (`src/pages/<domain>/index.tsx`)
2. tRPC React Query hook batches request via httpBatchLink to `POST /trpc/admin` (`src/lib/admin-client.ts:18-30`)
3. `apps/api` runs 6-gate `adminProcedure` chain: auth → role → ip → mfa → RLS → approvalGate → auditLog (`apps/api/src/trpc/procedures/admin.ts`)
4. Router handler calls service, returns typed response
5. React Query caches result with `staleTime: 30_000`; component re-renders

### Auth Flow

1. User submits email at `/login` → `adminTrpc.auth.login.useMutation()` (`src/pages/Login.tsx:15`)
2. API sets `admin_session_id` cookie (HttpOnly)
3. `AdminLayout` queries `adminTrpc.auth.me.useQuery()` on every route enter
4. If `me` returns null or 401, redirect to `/login` happens via React Router `<Navigate>`
5. If route's `domainKey` not in `me.allowedDomains`, redirect to first allowed route or `/login`
6. Each page navigation fires `adminTrpc.auth.logPageView.useMutation({ path })` via `usePageViewAudit` hook in `AdminLayout`

### Page View Audit

1. `usePageViewAudit(location.pathname)` inside `AdminLayout` (`src/layouts/AdminLayout.tsx:14-23`)
2. De-duplicates via `useRef<string>` — only fires on path change
3. Calls `adminTrpc.auth.logPageView.useMutation`

**State Management:**
- Server state: React Query (via tRPC). `staleTime: 30_000ms`, `retry: 1`
- URL state: `useSearchParams` used in list pages for filter persistence (23 usages)
- Local UI state: `useState` inside individual page components for drawers/modals

## Key Abstractions

**Shadow Router (`AdminRouter`):**
- Purpose: Provides full TypeScript types for the tRPC client without importing `@trpc/server` in the browser
- Location: `packages/clients/src/admin-router-types.ts`
- Pattern: Mirror of real `apps/api/src/trpc/routers/admin/index.ts`; must be kept in sync when API adds/changes procedures

**`ADMIN_ROUTES` metadata array:**
- Purpose: Single source of truth for all 17 pages — path, label, emoji, requiredRole, group, domainKey
- Location: `src/lib/admin-routes.ts`
- Consumed by: `AdminLayout` (sidebar groups, route guard), `prd26-admin-*` e2e tests

**`adminProcedure` (API side):**
- Purpose: 6-gate middleware chain that every admin tRPC endpoint must use
- Location: `apps/api/src/trpc/procedures/admin.ts`
- Gate order: `adminAuth → roleCheck → ipWhitelist → mfaCheck → adminRLS → approvalGateCheck → auditLog`
- Rule: Gate order is a hard constraint per LD-A-chain; never reorder or skip gates

## Entry Points

**`src/main.tsx`:**
- Triggers: Browser load of `index.html`
- Responsibilities: `createRoot` → render `<App />`

**`index.html`:**
- Location: `apps/admin/index.html`
- Triggers: Vite dev server at port 5174 / prod build to `dist-admin/`

## Architectural Constraints

- **Cookie auth:** The tRPC client uses `credentials: 'include'` on all requests. Session ID is in an HttpOnly cookie `admin_session_id`. Do not use Authorization headers.
- **Shadow router sync:** `packages/clients/src/admin-router-types.ts` must mirror `apps/api/src/trpc/routers/admin/index.ts`. Desync causes type errors at build time.
- **Rollup chunks:** The 4 manual chunks in `vite.config.ts` must be updated whenever a new page directory is added. Failure to assign a chunk causes all code into a single bundle.
- **Route guard at layout level:** Authorization is enforced in `AdminLayout`, not at the page level. Individual pages do not need to check `me.role` for routing.
- **No cross-domain DB access:** Admin API code reads only `admin_*` tables. Main app tables are read-only via `adminPrisma` (RLS disabled, admin context set).
- **`adminProcedure` gate order:** Hard constraint per AGENTS.md LD-A-chain. Never reorder the 6 middleware gates.

## Anti-Patterns

### Using `protectedProcedure` for admin routes

**What happens:** An admin router handler is built with `protectedProcedure` (main app auth) instead of `adminProcedure`.
**Why it's wrong:** `protectedProcedure` validates user sessions, not admin sessions. The 6-gate chain (ipWhitelist, mfaCheck, approvalGateCheck, auditLog) is bypassed entirely.
**Do this instead:** Always use `adminProcedure` from `apps/api/src/trpc/procedures/admin.ts` for every admin router handler.

### Adding route guard logic inside page components

**What happens:** A page component calls `adminTrpc.auth.me` and conditionally renders based on role.
**Why it's wrong:** Route-level access control is centralized in `AdminLayout`. Duplicating it in pages creates inconsistency and drift.
**Do this instead:** Route access is handled by `AdminLayout`'s domain-guard logic using `allowedDomains` + `isDomainAllowed`. For UI-level role gating within a page (e.g., show emergency button only for `super_admin`), check `me?.role` inline.

### Importing from `@trpc/server` in admin frontend

**What happens:** A file in `apps/admin/src/` imports a type or utility from `@trpc/server`.
**Why it's wrong:** This pulls the server runtime into the browser bundle, increasing bundle size and potentially breaking SSR-incompatible server code.
**Do this instead:** Import types only from `packages/clients/src/admin-router-types.ts` (`AdminRouter`).

## Error Handling

**Strategy:** tRPC errors propagate through React Query's `isError`/`error` state; pages render an inline error message or skeleton.

**Patterns:**
- NSM page wraps child components in a class-based `NsmErrorBoundary` with a "数据加载失败 · 点击重试" fallback — prevents full page white-screen on chart errors
- Login page uses `onError` callback on the mutation to show a toast
- Most pages check `isPending` / `isLoading` to show loading skeletons rather than null renders

## Cross-Cutting Concerns

**Logging:** No client-side logger; browser console only. Server-side audit via `auditLogMiddleware` on every `adminProcedure` call.
**Validation:** Input validation is on the API side (Zod). The shadow router uses raw `(x: unknown) => x as T` casts in the type mirror — frontend does not independently validate.
**Authentication:** Cookie-based. `AdminLayout` queries `auth.me` on mount and redirects on null. Page view audit on every route change via `usePageViewAudit`.

---

*Architecture analysis: 2026-05-21*
