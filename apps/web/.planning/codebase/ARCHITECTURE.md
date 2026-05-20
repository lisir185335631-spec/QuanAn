# apps/web — Architecture Fact Layer
> Generated: 2026-05-20 (PRD-24 §0 gsd-map-codebase)
> Scope: apps/web (React + TypeScript + Vite + tRPC + shadcn/ui)

## Core Architecture

**Framework**: React 18 + TypeScript + Vite (SPA, CSR-only)
**Routing**: React Router v6 (`src/router.tsx`) — 34+ routes, React.lazy code-splitting
**State**: No Redux/Zustand. Local component state + React Context (AuthContext, ActiveAccountContext)
**Backend contract**: tRPC v11 (`src/lib/trpc.ts`) — typed end-to-end. `splitLink` for subscription routing
**Styling**: Tailwind CSS v3 + CSS Variables (HSL tokens in `tailwind.config.js`) + shadcn/ui components
**LLM access**: NO direct LLM calls from frontend. All AI via tRPC procedure → backend Specialist agents

## Page Topology (PRD-24 state)

### Module Pages (`src/pages/modules/`)
- `DailyTasks.tsx` — 今日行动清单 stub · 3 task cards · LS acc_ prefix (PRD-24 US-001)
- `Evolution.tsx` — 智能体进化中心 · 5 badges + 4 metrics + 5 H3 modules + 4 direction radio (PRD-24 US-002)
- `Diagnosis.tsx` — 7维度诊断 · 8-step wizard (PRD-23)
- `MyTopics.tsx` · `History.tsx` · `Accounts.tsx`

### Tool Pages (`src/pages/tools/`)
- `VoiceChat.tsx` — VOICE CHAT H1 · 6 quick prompts · LS history (PRD-24 US-003)
- `VideoAnalysis.tsx` · `Analysis.tsx` · `VideoProduction.tsx` · `AcquisitionVideo.tsx` — stub 4工具 (PRD-23)
- `Trending.tsx` · `Generate.tsx` · `Copywriting.tsx` · `Knowledge.tsx` · `BoomGenerate.tsx` · `AiVideo.tsx` · etc.

### Step Pages (`src/pages/step/`)
- Step1~Step8 — IP起号9步流程

## Layout Architecture

- `RootLayout` → `MainLayout` (sidebar + header) → page content
- `StepLayout` shared across all 9 step pages (avoids double-render)
- Sidebar: `src/components/sidebar/AppSidebar.tsx` (navigates all 34+ routes)
