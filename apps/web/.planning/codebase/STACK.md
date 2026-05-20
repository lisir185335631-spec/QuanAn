# apps/web — Technology Stack Fact Layer
> Generated: 2026-05-20 (PRD-24 §0 gsd-map-codebase)

## Runtime Dependencies (key)

| Package | Version | Role |
|---|---|---|
| react | 18.x | UI framework |
| react-router-dom | 6.x | Client routing (34+ routes) |
| @trpc/client + @trpc/react-query | 11.x | Type-safe API client |
| @tanstack/react-query | 5.x | Server state, caching |
| tailwindcss | 3.x | Utility CSS + design token vars |
| @radix-ui/* | latest | Headless UI primitives (shadcn/ui) |
| lucide-react | latest | Icon library |
| sonner | latest | Toast notifications |
| zod | 3.x | Schema validation |

## Dev Tools

- TypeScript 5.x (strict mode)
- Vite (build + HMR)
- vitest (unit tests, 334 tests PRD-24 state)
- Playwright (E2E: tests/e2e/, 18 spec files)
- pnpm workspace (monorepo)

## Key Custom Utilities

- `src/lib/ls-namespace.ts` — `getLsKey(accountId, key)` / `getToolLsKey(accountId, tool, key)` — LD-009 compliant namespaced localStorage
- `src/lib/trpc.ts` — tRPC client with `splitLink` (subscription vs HTTP routing)
- `src/hooks/useActiveAccount.ts` — active account context hook
- `src/components/ui/` — shadcn/ui component library (Button, Card, Input, Badge, Tabs, etc.)
