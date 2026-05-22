# Coding Conventions — apps/admin

**Analysis Date:** 2026-05-21

## Naming Patterns

**Files:**
- Page files: `index.tsx` for single-file pages, `<PascalCase>Page.tsx` for multi-file pages (e.g., `QuotaPage.tsx`, `FeatureFlagsPage.tsx`)
- Sub-components: `<PascalCase>.tsx` matching the component function name (e.g., `NsmAlerts.tsx`, `ApprovalDetailDrawer.tsx`)
- Test files: `__tests__/<PageName>.test.tsx` co-located inside the page directory

**Functions:**
- Components: PascalCase exported functions (e.g., `export function AdminLayout()`, `export default function Login()`)
- Hooks: camelCase with `use` prefix (e.g., `usePageViewAudit`)
- Route helpers: camelCase (e.g., `getRouteByPath`, `isDomainAllowed`, `getAllowedRoutes`)

**Variables:**
- Constants: UPPER_SNAKE_CASE for module-level arrays/objects (e.g., `ADMIN_ROUTES`, `SIDEBAR_GROUPS`, `ROUTE_GROUP_LABELS`)
- Local state: camelCase (e.g., `drawerOpen`, `mockList`)

**Types/Interfaces:**
- Interfaces: PascalCase with `I`-prefix NOT used (e.g., `AdminRouteItem`, `SidebarGroup`)
- Type aliases: PascalCase (e.g., `AdminRole`, `InviteRow`)

## Code Style

**Formatting:**
- Prettier (inferred from project config); no explicit `.prettierrc` in `apps/admin/` — uses root config
- Semicolons: present
- Single quotes for strings
- Trailing commas in arrays/objects

**Linting:**
- ESLint with `--max-warnings=0` enforced in `npm run lint` script
- `eslint-disable-next-line react-hooks/exhaustive-deps` used judiciously in `AdminLayout.tsx` for the logPageView effect

## Import Organization

**Order (observed pattern):**
1. Node built-ins and React (e.g., `import { lazy, Suspense } from 'react'`)
2. Third-party packages (e.g., `import { Navigate, Route, Routes } from 'react-router-dom'`)
3. Workspace packages with `@quanan/` prefix (e.g., `import { DenseTable } from '@quanan/ui/admin'`)
4. Local `@/` alias imports (e.g., `import { adminTrpc } from '@/lib/admin-client'`)
5. Relative imports (e.g., `import { NsmAlerts } from './NsmAlerts'`)

**Path Aliases:**
- `@/*` → `src/*` (configured in both `vite.config.ts` and `tsconfig.json`)
- `@quanan/ui` → `packages/ui/src`
- `@quanan/clients` → `packages/clients/src`
- `@quanan/schemas` → `packages/schemas/src`

## Mock Pattern: vi.hoisted

The `vi.hoisted()` pattern is the canonical way to create mutable mock implementations in all admin unit tests. This is the most important convention to follow when writing tests.

```typescript
// 1. Declare hoisted mock function at module level
const { mockOverview } = vi.hoisted(() => ({ mockOverview: vi.fn() }));

// 2. Mock the entire @/lib/admin-client module
vi.mock('@/lib/admin-client', () => {
  // q = query factory (returns data + loading flags)
  const q = (data: unknown = null) => () => ({ data, isLoading: false, isPending: false, refetch: () => {} });
  // m = mutation factory
  const m = () => ({ mutate: () => {}, mutateAsync: async () => ({}), isPending: false });
  return {
    adminTrpc: {
      auth: { me: { useQuery: q({ role: 'admin' }) } },
      nsm: {
        getOverview: { useQuery: mockOverview },   // ← hoisted fn, configurable per test
        getAlerts: { useQuery: q() },              // ← fixed stub
        // ...
      },
    },
    adminQueryClient: {},
    adminTrpcClient: {},
  };
});

// 3. Reset in beforeEach
beforeEach(() => {
  mockOverview.mockReturnValue({ data: null, isLoading: false, isPending: false, refetch: () => {} });
});

// 4. Override per test case
it('loading state when isPending', () => {
  mockOverview.mockReturnValue({ data: undefined, isLoading: true, isPending: true, refetch: () => {} });
  render(<NsmDashboard />, { wrapper: MemoryRouter });
});
```

**Why hoisted:** `vi.mock()` is hoisted to the top of the file by Vitest; if you reference a variable from outside the factory, it won't be initialized yet. `vi.hoisted()` executes before the mock factory, making the mock function available at the time `vi.mock()` runs.

## adminProcedure vs protectedProcedure

Two separate tRPC procedure chains exist in `apps/api`. Use the correct one for each context:

| Procedure | File | Use When |
|-----------|------|----------|
| `adminProcedure` | `apps/api/src/trpc/procedures/admin.ts` | ALL admin router handlers (anything under `/trpc/admin`) |
| `protectedProcedure` | `apps/api/src/trpc/procedures/app.ts` | Main app handlers (anything under `/trpc/app`) |
| `publicAdminProcedure` | `apps/api/src/trpc/trpc-admin.ts` | Only the `health` check endpoint (no auth required) |

`adminProcedure` runs 6 middleware gates in this fixed order:
```
adminAuth → roleCheck → ipWhitelist → mfaCheck → adminRLS → approvalGateCheck → auditLog
```
Gate order is a hard constraint. Never skip or reorder.

## Route Metadata Pattern

All 17 admin domain routes are declared once in `ADMIN_ROUTES` in `src/lib/admin-routes.ts`:

```typescript
export const ADMIN_ROUTES: AdminRouteItem[] = [
  {
    path: '/admin/nsm',
    label: 'NSM 仪表盘',
    emoji: '📊',
    prd: 11,
    requiredRole: 'readonly_admin',
    summary: '...',
    group: 'p0-core',
    domainKey: 'nsm',      // ← must match allowedDomains values from API
  },
  // ...
];
```

`domainKey` maps to entries in `me.allowedDomains` returned by `adminTrpc.auth.me`. An empty `allowedDomains` array means super_admin (all domains allowed). This is enforced in `AdminLayout` via `isDomainAllowed()`.

## Component Pattern

Typical page component structure:

```typescript
// Header comment: PRD + AC refs
// PRD-11 US-013 · 成本仪表盘 UI
// AC-7: ...

import { ... } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DenseTable } from '@quanan/ui/admin';
import type { DenseTableColumn } from '@quanan/ui/admin';
import { adminTrpc } from '../../lib/admin-client';
import { SubComponent } from './SubComponent';

type RowType = { id: number; ... };

export default function CostPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data, isLoading, isPending } = adminTrpc.cost.aggregate.useQuery({ ... });

  const columns: DenseTableColumn<RowType>[] = [...];

  return (
    <div>
      <h2>...</h2>
      {isPending && <div>加载中...</div>}
      <DenseTable columns={columns} rows={data?.items ?? []} />
    </div>
  );
}
```

## Logging

No client-side logger. Use `console.warn` / `console.error` sparingly in development only. Server-side audit is handled by `auditLogMiddleware` on every `adminProcedure` call.

## Comments

**When to Comment:**
- Every file starts with a header comment citing the PRD + US + key AC numbers (e.g., `// PRD-11 US-013 · 成本仪表盘 UI`)
- Complex business logic inline (e.g., domain filtering, gate order rationale)
- PRR-deferred stubs documented with `// ... stub (PRR required)`

**Style:**
- Chinese and English mixed; domain UI labels in Chinese, code identifiers in English
- Gate order constraints use `// Gate order:` comment in procedure files

## Function Design

**Size:** Each page component is self-contained; sub-components extracted when > ~200 lines or reused

**Parameters:** Props interfaces defined inline above component or as named `interface`

**Return Values:** Always JSX from components; typed return values from utilities in `admin-routes.ts`

## Module Design

**Exports:**
- Pages: default export (lazy-loadable)
- Lib files: named exports
- `src/index.ts`: re-exports `AdminRoutes` and `AdminLayout` for external consumers

**Barrel Files:**
- `src/index.ts` — thin barrel for layout + routes only
- `packages/ui/src/admin/index.ts` — barrel for all admin UI primitives

---

*Convention analysis: 2026-05-21*
