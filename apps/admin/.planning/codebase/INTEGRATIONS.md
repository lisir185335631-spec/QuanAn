# External Integrations — apps/admin

**Analysis Date:** 2026-05-21

## APIs & External Services

**Admin API (apps/api):**
- tRPC router mounted at `/trpc/admin`
- Client: `adminTrpc` from `src/lib/admin-client.ts` — `httpBatchLink` with `credentials: 'include'`
- Config: `VITE_API_BASE_URL` env var (default `http://localhost:3000`)
- Type contract: `AdminRouter` from `packages/clients/src/admin-router-types.ts` (shadow router pattern)
- All 17 domain namespaces: `auth`, `users`, `ipAccounts`, `inviteCodes`, `reviewTrending`, `reviewDeepLearn`, `prompts`, `quota`, `nsm`, `cost`, `evolution`, `audit`, `compliance`, `approvals`, `abExperiments`, `constants`, `featureFlags`

**Google Workspace OAuth (future):**
- Status: Stub present in `src/pages/Login.tsx` — button rendered but `disabled`
- Gated behind: PRR (Pre-Release Review) — see `// Google Workspace OAuth — stub, disabled until PRR`
- Expected: `OAUTH_PROVIDER=google` env var on API side; handled by `apps/api/src/lib/auth/oauth-admin-google.ts`

## Data Storage

**Databases:**
- The admin SPA does NOT directly access any database.
- All data access goes through `apps/api` via tRPC.
- Playwright e2e tests directly access PostgreSQL using Prisma (`quanqn` / `quanqn_test`) for test seeding only.
  - Connection: `DATABASE_URL` = `postgresql://return@localhost:5432/quanqn` (test seeding)
  - Connection: `DATABASE_URL_TEST` = `postgresql://return@localhost:5432/quanqn_test` (test isolation)

**File Storage:**
- None — admin SPA is a pure client-side app
- PDF generation is done client-side via `@react-pdf/renderer` (bill, forensic, compliance, AB report)

**Caching:**
- React Query in-memory cache: `staleTime: 30_000ms`, `retry: 1`
- No external cache from the admin frontend perspective

## Package Integration: @quanan/ui/admin

The most critical internal integration. Admin layout components live in `packages/ui/src/admin/` and are imported by `apps/admin`.

**Components:**
- `Sidebar` — 240px left navigation; accepts `SidebarGroup[]` props; no app deps
- `TopBar` — 60px header; email/role badges, audit bell, logout dropdown
- `StatusBar` — 24px bottom bar; role display
- `AuditDrawer` — 480px right drawer; shows `AuditRow[]` logs
- `DenseTable<T>` — generic dense data table with typed columns; used across 10+ pages

**Design tokens:**
- `adminTokens` in `packages/ui/src/admin/tokens.ts` — Aurelian Dark palette (gold `#d4af37`, bg `#0a0a0a`)
- CSS custom properties in `src/styles/admin.css` mirror these tokens

**Import path:** `@quanan/ui/admin` — resolves to `packages/ui/src/admin/index.ts`

**Contract:** These components accept only plain data props and callback functions. They do NOT import `adminTrpc`, React Router, or any app-layer code. Violations would create circular dependencies.

## Package Integration: @quanan/clients

Provides the `AdminRouter` type:
- File: `packages/clients/src/admin-router-types.ts`
- Exports: `AdminRouter` (type only)
- Pattern: Shadow router — uses `initTRPC.create()` to build a replica of the real router's shape; no server logic runs
- Consumer: `src/lib/admin-client.ts:10` — `createTRPCReact<AdminRouter>()`
- Maintenance rule: When a new procedure is added to `apps/api/src/trpc/routers/admin/`, the corresponding shadow declaration must be added to `admin-router-types.ts`

## Authentication & Identity

**Auth Provider:**
- Custom — Lucia Auth (`luciaAdmin`) + cookie session (`admin_session_id`)
- Implementation: `apps/api/src/lib/auth/lucia-admin.ts` (server), `apps/api/src/server/context-admin.ts` (context factory)
- Dev mode: Mock OAuth via `adminTrpc.auth.login.useMutation({ email })` — accepts any email when `OAUTH_PROVIDER=mock`
- Prod mode: Google Workspace OAuth (stub, awaits PRR)
- Admin context fields: `prisma`, `adminPrisma`, `traceId`, `adminSession`, `activeAdminUser`, `adminSessionMfaVerifiedAt`, `crossAccountAccessed`

## Monitoring & Observability

**Error Tracking:**
- None client-side (Sentry not yet integrated — listed as PRR item in `CLAUDE.md §7`)

**Logs:**
- Client: `console.*` only; no structured logging
- Server: Admin audit log written on every `adminProcedure` call via `auditLogMiddleware`; accessible from admin at `/admin/audit`

## CI/CD & Deployment

**Hosting:**
- Not yet deployed; planned for Vercel (static SPA) — listed as PRR item
- Build command: `pnpm build` → `tsc && vite build` → output in `dist-admin/`

**CI Pipeline:**
- None configured yet (PRR item)

## Webhooks & Callbacks

**Incoming:**
- None — admin SPA has no server to receive webhooks

**Outgoing:**
- None from admin frontend

## Environment Configuration

**Required env vars (admin SPA):**
- `VITE_API_BASE_URL` — API base URL for tRPC (`http://localhost:3000` default)
- `DEV` — injected by Vite automatically; no manual config needed

**Env vars used only by e2e tests:**
- `DATABASE_URL` — direct Prisma access for test seeding
- `DATABASE_URL_TEST` — test DB
- `ADMIN_E2E_BASE_URL` — admin SPA base URL for Playwright (`http://localhost:5174` default)
- `OAUTH_PROVIDER` — set to `mock` in e2e `test.beforeAll`

**Secrets location:**
- `.env` files at monorepo root (not checked in); see `CLAUDE.md §3` for local dev values

---

*Integration audit: 2026-05-21*
