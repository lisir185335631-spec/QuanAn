# apps/web — Testing Fact Layer
> Generated: 2026-05-20 (PRD-24 §0 gsd-map-codebase)

## Test Suite Status (PRD-24 final state)

| Suite | Count | Status |
|---|---|---|
| Vitest (unit + integration) | 334 tests | ✅ all pass |
| E2E (Playwright) | 18 spec files | ✅ prd24 10/10 |
| Visual Baseline | 32 fixtures | ✅ prd22(13) + prd23(16) + prd24(3) |

## Vitest Configuration

- Config: `apps/web/vitest.config.ts`
- Setup: `src/test/setup.ts` (jsdom + @testing-library/jest-dom)
- Global test file: `src/test/pages.test.tsx` (smoke tests for all pages)
- Run: `cd apps/web && pnpm test`

## E2E Configuration

- Root config: `playwright.config.ts` (covers `tests/e2e/`)
- Web-specific: `apps/web/playwright.config.ts` (covers `apps/web/e2e/`)
- PRD-specific specs: `tests/e2e/prd{N}-*.spec.ts`
- Auth bypass: `GET /auth/dev-login` (NODE_ENV=development) → e2e beforeEach

## Visual Baseline System

- Utility: `apps/web/scripts/visual-diff.ts` (`expectVisualMatch`)
- Storage: `/tmp/aiipznt-clone-research/screenshots/`
- Threshold: 0.05 maxDiffPixelRatio
- Viewport: 1440×900 fullPage
- Naming: `prd{N}-{page-slug}.png`
- PRD-22: 13 fixtures · PRD-23: 16 fixtures · PRD-24: 3 fixtures (daily-tasks + evolution + voice-chat)

## PRD-24 Test Files Added

- `tests/e2e/prd24-daily-tasks-flow.spec.ts` (3 tests × 2 browsers = 6)
- `tests/e2e/prd24-evolution-flow.spec.ts` (3 tests × 2 browsers = 6)
- `tests/e2e/prd24-voice-chat-flow.spec.ts` (5 tests × 2 browsers = 10)
- `tests/e2e/prd24-visual-baseline.spec.ts` (3 baseline captures)
- `apps/web/src/pages/__tests__/DailyTasks.test.tsx` (7 tests)
- `apps/web/src/pages/__tests__/Evolution.test.tsx` (10 tests)
- `apps/web/src/pages/tools/__tests__/VoiceChat.test.tsx` (10 tests)
- `apps/web/src/lib/constants/__tests__/daily-tasks.test.ts` (5 tests)
- `apps/web/src/lib/constants/__tests__/voice-chat.test.ts` (8 tests)
