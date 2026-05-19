# External Integrations

**Analysis Date:** 2026-05-19

## APIs & External Services

**Backend (tRPC):**
- QuanQn API server — all data fetching and mutations via tRPC
  - SDK/Client: `@trpc/react-query` + `@trpc/client` (see `src/lib/trpc.ts`)
  - Transport: `httpBatchStreamLink` for queries/mutations; `httpSubscriptionLink` for SSE subscriptions
  - URL: `${VITE_API_BASE_URL}/trpc` (default `http://localhost:3000/trpc`)
  - Dev proxy: Vite proxies `/api/trpc` → `http://localhost:3000` (`vite.config.ts`)

**Auth:**
- Session cookie auth via backend (`/auth/login`, `/auth/logout` redirects)
  - Client uses `credentials: 'include'` on all fetch calls (`src/lib/trpc.ts`)
  - `useAuth` hook navigates to `${API_BASE}/auth/login` for OAuth redirect (`src/hooks/useAuth.ts`)
  - Auth state read via `trpc.auth.me.useQuery` (returns `AuthMeOutput`)

## Data Storage

**Databases:**
- PostgreSQL (backend-managed; frontend does not connect directly)
  - All DB reads/writes go through tRPC procedures

**Local Storage (browser):**
- Pattern: `aiip_memory_acc_{accountId}_{suffix}` — per-account namespaced keys
- Managed by `src/lib/ls-namespace.ts`
- Used for:
  - Step data dual-write: `aiip_memory_acc_{accountId}_{stepKey}` (via `useStepData`)
  - Tool data: `aiip_memory_acc_{accountId}_tool_{toolKey}_{suffix}`
  - Evolution profile cache: `aiip_memory_acc_{accountId}_evolution`
  - Active account ID: `aiip_active_account_id` (plain key, not namespaced)
  - Legacy migration flag: `aiip_legacy_migration_v1_done`
- 5 MB limit enforced; non-active namespaces pruned automatically (`pruneLsNamespaces`)

**File Storage:**
- Not integrated on frontend (uploads go to backend via tRPC)

**Caching:**
- React Query in-memory cache: `staleTime: 30_000` default, `60_000` for auth/evolution
- LS cache for evolution profile (instant read before DB response)

## Authentication & Identity

**Auth Provider:**
- Backend-managed (OAuth redirect flow, likely Google OAuth — PRR item per CLAUDE.md)
  - Login: `GET ${API_BASE}/auth/login` (backend redirects to OAuth provider)
  - Logout: `GET ${API_BASE}/auth/logout`
  - Session: cookie-based (`credentials: 'include'`)
  - Current user: `trpc.auth.me` → `AuthMeOutput` (`src/hooks/useAuth.ts`)

**IP Account Management:**
- `trpc.ipAccounts.active` — fetch active account
- `trpc.ipAccounts.switchActive` — switch active account (triggers LS namespace clear + full page reload)
- `trpc.ipAccounts.list` — list all accounts for switcher dropdown

## Monitoring & Observability

**Error Tracking:**
- Not integrated (Sentry listed as PRR item in CLAUDE.md §7)

**Logs:**
- `console.error` for ErrorBoundary (`src/components/ErrorBoundary.tsx`)
- `console.error`/`console.warn` with `[module]` prefixes in hooks and migration utilities
- No structured logging or remote log shipping

**Tracing:**
- `x-trace-id` header injected on every tRPC fetch (16-char random hex, generated in `src/lib/trpc.ts`)
- Trace ID also written to `console.error` on DB write failures for debugging

## CI/CD & Deployment

**Hosting:**
- Vercel (listed as future deployment target in CLAUDE.md §7; not yet configured)

**CI Pipeline:**
- Not yet configured (PRR item)

## Environment Configuration

**Required env vars:**
- `VITE_API_BASE_URL` — backend base URL (default: `http://localhost:3000`)

**Secrets location:**
- No secrets committed; `.env` existence noted

## Webhooks & Callbacks

**Incoming:**
- None (frontend only)

**Outgoing:**
- SSE subscriptions via `httpSubscriptionLink` for:
  - `voiceChat.start` — streaming voice chat chunks (`VoiceChatStreamChunk`)
  - `stepData.saveStream` — step save streaming (subscribed in mock; implementation in `src/components/StepForm/StepForm.tsx`)

## Workspace Package Integrations

**@quanqn/clients (`packages/clients/src`):**
- Provides `AppRouter` type (imported as `import type`) — keeps `@trpc/server` out of browser bundle
- Provides output types: `AuthMeOutput`, `ActiveAccountOutput`, `EvolutionProfileOutput`, `TrendingListItem`, `VoiceChatStreamChunk`

**@quanqn/schemas (`packages/schemas/src`):**
- Shared zod validation schemas (imported in `src/lib/schemas/` and form components)

**@quanqn/ui (`packages/ui/src`):**
- Shared UI components (available but most UI is implemented locally in `src/components/ui/`)
- Design token source: `../../ui/aurelian_dark/DESIGN.md` parsed by `src/lib/parseDesignTokens.js`

---

*Integration audit: 2026-05-19*
