# apps/web — Coding Conventions Fact Layer
> Generated: 2026-05-20 (PRD-24 §0 gsd-map-codebase)

## Locked Decisions (LD) in Effect

| LD | Convention | Evidence |
|---|---|---|
| LD-009 | localStorage MUST use `getLsKey`/`getToolLsKey` — no bare string keys | All PRD-24 pages: DailyTasks/VoiceChat use getLsKey |
| LD-015 | Tailwind: no hardcoded color values; use HSL CSS vars | tailwind.config.js + PRD-22 audit |
| D-234 | Stub pages: local state only, NO tRPC mutation | DailyTasks/Evolution/VoiceChat: 0 useMutation calls |
| D-239 | VoiceChat VOICE CHAT H1 Orbitron + 6 prompts literal lock | voice-chat.ts VOICE_CHAT_QUICK_PROMPTS_6 |
| D-237 | Evolution EVOLUTION_LEVELS_5 + EVOLUTION_MODULES_5 literal lock | evolution.ts constants |
| D-238 | Evolution EVOLUTION_DIRECTIONS_4 literal lock | evolution.ts constants |

## Constants Pattern (PRD-22+)

All page-specific literals extracted to `src/lib/constants/{page}.ts`:
- `readonly` arrays with `as const` assertion
- Named exports: `PAGENAME_H1`, `PAGENAME_SUBTITLE`, `PAGENAME_ITEMS_N` etc.
- JSX: imports from constants, no inline literal strings
- Unit tests in `src/lib/constants/__tests__/{page}.test.ts`

## Test Conventions (TD-093 fix · D-233 rule)

- Every page rewrite MUST have `__tests__/{Page}.test.tsx`
- Location: same directory as page (`pages/__tests__/` or `pages/tools/__tests__/`)
- Minimum 5 test cases: H1 text / H3 text / key interaction / edge case / accessibility
- No tRPC mock needed for stub pages (MemoryRouter + vi.mock useActiveAccount)
- Constant unit tests: `src/lib/constants/__tests__/{page}.test.ts`
