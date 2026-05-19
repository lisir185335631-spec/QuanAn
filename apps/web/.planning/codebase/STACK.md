# Technology Stack

**Analysis Date:** 2026-05-20

## Languages

**Primary:**
- TypeScript 5.6 — all source files in `src/` (strict mode, `noUncheckedIndexedAccess`, `noUnusedLocals`, `noImplicitReturns`)
- TSX — React component files throughout `src/components/`, `src/pages/`

**Secondary:**
- CSS — global styles at `src/styles/globals.css`, `src/styles/aiipznt-motion.css`
- JavaScript — `src/lib/parseDesignTokens.js` (sole `.js` file, runs at build time only)

## Runtime

**Environment:**
- Browser SPA — no SSR
- Target: ES2022 (`vite.config.ts` `build.target`)

**Package Manager:**
- pnpm 9.15.9 (workspace monorepo rooted at `/Users/return/Desktop/QuanAn`)
- Lockfile: `pnpm-lock.yaml` at repo root — present

## Frameworks

**Core:**
- React 18.3 — UI rendering (`StrictMode` in `src/main.tsx`)
- react-router-dom 6.27 — `createBrowserRouter`, nested layouts, lazy chunk splitting
- Vite 5.4 — dev server (port 5173), build output to `dist/`, proxy `/api/trpc` → port 3000

**State Management:**
- TanStack React Query 5.59 — server state, default `staleTime: 30_000`
- tRPC `@trpc/react-query` 11.0.0-rc.0 — typed API client, `splitLink` routing subscriptions to SSE
- zustand 4.5 — installed, not yet used in pages
- `localStorage` — per-account namespaced step/tool data (LS-first dual-write, ADR-010)

**Forms:**
- react-hook-form 7.53 + `@hookform/resolvers/zod` — `StepForm.tsx`, `ToolForm.tsx`

**Testing:**
- vitest 2.1 — unit + component tests, config at `vitest.config.ts`
- `@testing-library/react` 16 + `@testing-library/user-event` 14 — React component tests
- Playwright (repo root `playwright.config.ts`) — E2E + visual baseline tests

**Build/Dev:**
- `@vitejs/plugin-react` 4.3 — HMR fast refresh
- TypeScript tsc — type check via `pnpm typecheck`
- Autoprefixer + PostCSS 8.4 — CSS processing

## Key Dependencies

**Critical:**
- `@trpc/client` + `@trpc/react-query` 11.0.0-rc.0 — end-to-end type safety
- `@quanan/clients` (workspace:*) — `AppRouter` type + `router-types` exports; `import type` only to keep `@trpc/server` out of bundle
- `@quanan/schemas` (workspace:*) — shared Zod schemas
- `@quanan/ui` (workspace:*) — shared UI components (also source of `aurelian_dark/DESIGN.md` tokens)
- `zod` 3.23 — form + runtime schema validation

**UI / Design System:**
- Tailwind CSS 3.4 — design tokens parsed from `../../ui/aurelian_dark/DESIGN.md` via `src/lib/parseDesignTokens.js`
- `tailwindcss-animate` 1.0.7 — animation utility classes
- Radix UI primitives — `@radix-ui/react-{avatar,dialog,dropdown-menu,progress,scroll-area,select,separator,slot,tabs,toast,tooltip}`
- `class-variance-authority` 0.7 + `clsx` 2.1 + `tailwind-merge` 2.5 — `cn()` utility in `src/lib/utils.ts`
- `lucide-react` 0.460 — icons
- `framer-motion` 11 — `FadeInWrapper` animations (`src/components/FadeInWrapper.tsx`)
- `sonner` 1.7 — toast notifications (`<Toaster>` in `RootLayout.tsx`)
- `react-markdown` 9 + `remark-gfm` 4 — markdown rendering in step/tool result components
- `recharts` 3.8 — charts in `src/pages/modules/Evolution.tsx`, `src/pages/modules/History.tsx`
- `react-virtualized` 9.22 — virtual scrolling in `src/pages/modules/History.tsx`

**Fonts (via @fontsource):**
- `@fontsource/manrope` 400/600/700 — display/heading font
- `@fontsource/plus-jakarta-sans` 400/600 — body font
- `@fontsource/inter` 400/500/600 — UI/mono font

## Configuration

**Environment:**
- `VITE_API_BASE_URL` — backend base URL (defaults to `http://localhost:3000`)
- No `.env` file at `apps/web/` level (none detected)
- tRPC endpoint resolves to `${VITE_API_BASE_URL}/trpc`

**Build:**
- `vite.config.ts` — manual chunks: `react` bundle, `trpc` bundle, `ui` bundle
- `tsconfig.app.json` — extends `../../tsconfig.base.json`; path aliases `@/` → `./src/`, `@quanan/*` → workspace packages
- `tsconfig.base.json` — strict mode, `noUncheckedIndexedAccess`, `noUnusedLocals`, `noImplicitReturns`

## Platform Requirements

**Development:**
- Node.js v24.15.0, pnpm 9.15.9
- Dev server: `pnpm dev` → Vite port 5173; API backend required at port 3000

**Production:**
- SPA build: `tsc -b && vite build` → `dist/`
- Sourcemaps enabled
- Deployment target: Vercel (configured post-PRD-14 per CLAUDE.md §7)

---

*Stack analysis: 2026-05-20*
