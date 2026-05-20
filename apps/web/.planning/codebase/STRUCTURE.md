# apps/web — Directory Structure Fact Layer
> Generated: 2026-05-20 (PRD-24 §0 gsd-map-codebase)

```
apps/web/src/
├── components/
│   ├── ui/                      # shadcn/ui primitives
│   ├── sidebar/                 # AppSidebar.tsx
│   ├── inline-pickers/          # PRD-22: 3 reusable picker utilities
│   ├── diagnosis/               # DiagnosisStepCard.tsx (PRD-23)
│   ├── accounts/                # IpAccountCard.tsx + CreateAccountModal.tsx (PRD-23)
│   └── step8/                   # Step8GeneratePlan.tsx (PRD-23)
├── pages/
│   ├── modules/                 # Module pages (non-step, non-tool)
│   │   ├── DailyTasks.tsx       # PRD-24 US-001 · 今日行动清单
│   │   ├── Evolution.tsx        # PRD-24 US-002 · 智能体进化中心
│   │   ├── Diagnosis.tsx        # PRD-23
│   │   ├── Accounts.tsx         # PRD-23
│   │   ├── MyTopics.tsx
│   │   └── History.tsx
│   │   └── __tests__/
│   │       ├── DailyTasks.test.tsx  # PRD-24 (7 tests)
│   │       ├── Evolution.test.tsx   # PRD-24 (10 tests)
│   │       ├── Diagnosis.test.tsx   # PRD-23
│   │       └── Accounts.test.tsx    # PRD-23
│   ├── tools/                   # Tool pages (AI-gated features, stub for now)
│   │   ├── VoiceChat.tsx        # PRD-24 US-003 · VOICE CHAT
│   │   ├── VideoAnalysis.tsx    # PRD-23
│   │   ├── Analysis.tsx         # PRD-23
│   │   ├── VideoProduction.tsx  # PRD-23
│   │   ├── AcquisitionVideo.tsx # PRD-23
│   │   └── ... (Trending, Generate, Copywriting, Knowledge, etc.)
│   │   └── __tests__/
│   │       ├── VoiceChat.test.tsx    # PRD-24 (10 tests)
│   │       ├── VideoAnalysis.test.tsx # PRD-23
│   │       └── Analysis.test.tsx      # PRD-23
│   └── step/                    # IP起号 9-step flow
│       ├── Step1.tsx ~ Step8.tsx
│       └── __tests__/
├── lib/
│   ├── constants/               # Page-specific literals (PRD-22+ pattern)
│   │   ├── daily-tasks.ts       # PRD-24 US-001 · DAILY_TASKS_STUB + LOADING_TEXT + EMPTY_*
│   │   ├── evolution.ts         # PRD-24 US-002 · EVOLUTION_LEVELS_5/MODULES_5/DIRECTIONS_4
│   │   ├── voice-chat.ts        # PRD-24 US-003 · VOICE_CHAT_QUICK_PROMPTS_6 + INTRO
│   │   ├── diagnosis.ts         # PRD-23
│   │   └── __tests__/
│   │       ├── daily-tasks.test.ts  # PRD-24 (5 tests)
│   │       └── voice-chat.test.ts   # PRD-24 (8 tests)
│   ├── ls-namespace.ts          # LD-009 getLsKey/getToolLsKey
│   └── trpc.ts                  # tRPC client with splitLink
├── hooks/
│   └── useActiveAccount.ts      # Active account context hook
├── router.tsx                   # 34+ routes, React.lazy code-splitting
└── test/
    ├── pages.test.tsx            # Global page smoke tests (all pages)
    └── setup.ts
```
