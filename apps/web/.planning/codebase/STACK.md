# Technology Stack

**Analysis Date:** 2026-05-19

## Languages

**Primary:**
- TypeScript 5.6 - All source files in `src/`

**Secondary:**
- JavaScript (ESM) - `src/lib/parseDesignTokens.js`, `tailwind.config.js`, `postcss.config.js`

## Runtime

**Environment:**
- Browser (SPA) — no SSR

**Package Manager:**
- pnpm 9.15.9 (workspace monorepo)
- Lockfile: present (`pnpm-lock.yaml` at repo root)

## Frameworks

**Core:**
- React 18.3 — UI rendering, `src/main.tsx`
- react-router-dom 6.27 — SPA routing with `createBrowserRouter`, `src/router.tsx`
- Vite 5.4 — dev server (port 5173) and build tool, `vite.config.ts`

**State / Data Fetching:**
- @tanstack/react-query 5.59 — server state cache (`queryClient` in `src/lib/trpc.ts`)
- @trpc/react-query 11.0-rc — type-safe API client (`trpc` object in `src/lib/trpc.ts`)
- zustand 4.5 — available as dependency (not yet used in source; prepared for client state)

**Styling:**
- Tailwind CSS 3.4 — utility classes, `tailwind.config.js`
- tailwindcss-animate — animation utilities
- postcss + autoprefixer — `postcss.config.js`
- Custom design tokens sourced from `../../ui/aurelian_dark/DESIGN.md` via `src/lib/parseDesignTokens.js`

**Animation:**
- framer-motion 11 — `<FadeInWrapper>` in `src/components/FadeInWrapper.tsx`

**Forms:**
- react-hook-form 7.53 — `src/components/StepForm/StepForm.tsx`
- @hookform/resolvers 3.9 — zod integration
- zod 3.23 — schema validation (`src/lib/schemas/`)

**UI Primitives:**
- Radix UI — full set: avatar, dialog, dropdown-menu, progress, scroll-area, select, separator, slot, tabs, toast, tooltip
- class-variance-authority 0.7 — variant API in `src/components/ui/button.tsx`
- tailwind-merge 2.5 + clsx 2.1 — `cn()` utility in `src/lib/utils.ts`
- lucide-react 0.460 — icons throughout

**Charts / Data Viz:**
- recharts 3.8 — `src/pages/modules/History.tsx`, `src/pages/modules/Evolution.tsx`
- react-virtualized 9.22 — virtual list in `src/pages/tools/Trending.tsx`

**Content:**
- react-markdown 9.0 + remark-gfm 4.0 — markdown rendering in `src/components/StreamdownPreview.tsx`

**Notifications:**
- sonner 1.7 — toast notifications, `<Toaster>` in `src/layouts/RootLayout.tsx`

**Fonts (loaded via @fontsource):**
- Manrope 400/600/700
- Plus Jakarta Sans 400/600
- Inter 400/500/600

**Testing:**
- vitest 2.1 — unit/component tests, `vitest.config.ts`
- @testing-library/react 16.0 — component rendering
- @testing-library/user-event 14.5 — user interaction simulation
- @testing-library/jest-dom 6.6 — custom matchers
- playwright (via workspace root) — E2E tests in `e2e/`

## Key Dependencies

**Critical:**
- `@quanan/clients` (workspace) — exports `AppRouter`, `AuthMeOutput`, `ActiveAccountOutput`, `EvolutionProfileOutput`, `TrendingListItem`, `VoiceChatStreamChunk` from `router-types`
- `@quanan/schemas` (workspace) — shared zod schemas
- `@quanan/ui` (workspace) — shared UI components

**Infrastructure:**
- `@trpc/client` 11.0-rc — `httpBatchStreamLink`, `httpSubscriptionLink`, `splitLink`
- `@trpc/server` 11.0-rc (devDependency) — needed for `AppRouter` type import at dev time

## Configuration

**Environment:**
- `VITE_API_BASE_URL` — backend API base, defaults to `http://localhost:3000`; used in `src/lib/trpc.ts` and `src/hooks/useAuth.ts`
- No `.env` file committed; presence noted

**Build:**
- `tsconfig.json` — extends `../../tsconfig.base.json`, path aliases `@/*` → `src/*`, monorepo package aliases
- `vite.config.ts` — dev proxy `/api/trpc` → `http://localhost:3000`, manual chunks for `react`, `trpc`, `ui`
- `tailwind.config.js` — dark mode `class`, content scanning `./src/**/*.{ts,tsx}`, tokens from `../../ui/aurelian_dark/DESIGN.md`

## Platform Requirements

**Development:**
- Node 24.15 (`.nvmrc` present at repo root)
- pnpm workspace

**Production:**
- Static SPA bundle output to `dist/`
- Requires separate API server at `VITE_API_BASE_URL` (tRPC)
- Target ES2022 (Vite build config)

---

*Stack analysis: 2026-05-19*
