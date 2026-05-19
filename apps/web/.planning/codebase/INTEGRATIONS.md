# External Integrations

**Analysis Date:** 2026-05-20

## APIs & External Services

**Backend (tRPC):**
- QuanAn API server — all data fetching and mutations via tRPC
  - SDK/Client: `@trpc/react-query` + `@trpc/client` (`src/lib/trpc.ts`)
  - Transport: `httpBatchStreamLink` for queries/mutations; `httpSubscriptionLink` for SSE
  - URL: `${VITE_API_BASE_URL}/trpc` (default `http://localhost:3000/trpc`)
  - Dev proxy: Vite proxies `/api/trpc` → `http://localhost:3000` (`vite.config.ts`)
  - Headers: `x-trace-id` (16-char hex) injected on every fetch for end-to-end tracing

**Auth:**
- Backend session cookie auth — OAuth redirect flow
  - Login redirect: `GET ${API_BASE}/auth/login`
  - Logout redirect: `GET ${API_BASE}/auth/logout`
  - All tRPC fetches use `credentials: 'include'` (`src/lib/trpc.ts:52`)
  - Auth state: `trpc.auth.me.useQuery` → `AuthMeOutput` (`src/hooks/useAuth.ts`)

## Data Storage

**Databases:**
- PostgreSQL (backend-managed; frontend does not connect directly)
  - All DB access through tRPC procedures

**Local Storage (browser):**
- Pattern: `aiip_memory_acc_{accountId}_{suffix}` — per-account namespaced
- Managed by `src/lib/ls-namespace.ts`
- Key families:
  - Step data: `aiip_memory_acc_{accountId}_{stepKey}` (via `useStepData`)
  - Tool data: `aiip_memory_acc_{accountId}_tool_{toolKey}_{suffix}`
  - Evolution cache: `aiip_memory_acc_{accountId}_evolution`
  - Diagnosis progress: `aiip_memory_acc_{accountId}_diagnosis_progress`
  - Active account: `aiip_active_account_id` (plain key, intentionally not namespaced)
  - Legacy migration flag: `aiip_legacy_migration_v1_done`
- 5 MB limit enforced; `pruneLsNamespaces()` removes non-active account namespaces automatically

**File Storage:**
- Not integrated on frontend (uploads handled by backend via tRPC)

**Caching:**
- React Query in-memory: `staleTime: 30_000` default, `60_000` for auth/evolution queries
- LS cache for evolution profile — instant read on mount before DB response

## Authentication & Identity

**Auth Provider:**
- Backend-managed OAuth redirect (Google OAuth planned — PRR item per CLAUDE.md §7)
  - `useAuth.ts` probes `/auth/login`, handles `opaqueredirect` and 3xx responses
  - No frontend route guards — pages degrade gracefully when unauthenticated

**IP Account Management (multi-account):**
- `trpc.ipAccounts.active` — fetch current active account
- `trpc.ipAccounts.switchActive` — switch + clear old LS namespace + `window.location.reload()`
- `trpc.ipAccounts.list` — list all accounts for dropdown
- `trpc.ipAccounts.create` — create new account via `CreateAccountModal` (`src/components/accounts/CreateAccountModal.tsx`)

## Monitoring & Observability

**Error Tracking:**
- Not integrated (Sentry listed as PRR item in CLAUDE.md §7)

**Logs:**
- `console.error('[ModuleName]', ...)` convention in hooks and boundary components
- No structured logging or remote log shipping

**Tracing:**
- `x-trace-id` header on every tRPC fetch, generated in `src/lib/trpc.ts:24`
- Trace ID written to `console.error` on DB write failures for debugging correlation

## CI/CD & Deployment

**Hosting:**
- Vercel (future; not yet configured — PRR item per CLAUDE.md §7)

**CI Pipeline:**
- Not yet configured (PRR item)

## Environment Configuration

**Required env vars:**
- `VITE_API_BASE_URL` — backend base URL (default: `http://localhost:3000`)

**Secrets location:**
- No secrets in source; no `.env` file committed at `apps/web/` level

## Webhooks & Callbacks

**Incoming:**
- None (frontend SPA only)

**Outgoing SSE Subscriptions (via `httpSubscriptionLink`):**
- `voiceChat.start` — streaming voice chat chunks in `src/pages/tools/VoiceChat.tsx`

## Workspace Package Integrations

**`@quanan/clients` (`packages/clients/src`):**
- `import type { AppRouter }` — keeps `@trpc/server` out of browser bundle
- Output types: `AuthMeOutput`, `ActiveAccountOutput`, `EvolutionProfileOutput`, `TrendingListItem`, `VoiceChatStreamChunk`

**`@quanan/schemas` (`packages/schemas/src`):**
- Shared Zod validation schemas

**`@quanan/ui` (`packages/ui/src`):**
- Shared UI components
- Design token source: `../../ui/aurelian_dark/DESIGN.md` parsed at build time by `src/lib/parseDesignTokens.js`

---

*Integration audit: 2026-05-20*
