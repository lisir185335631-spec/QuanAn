# PRD-1 P0 代码事实层(7-in-1 合并版)

> **生成** · 2026-05-08 · /goal-verify §0 · Opus 主对话(简化 GSD 7 文件版)
> **范围** · PRD-1 P0 7 stories 完成后的 monorepo 实际状态
> **跟 AGENTS.md 设计约束对账** · 每节末尾标偏差登 TD

---

## §1 ARCHITECTURE(实际拓扑)

```
QuanAn/  (monorepo · pnpm workspace)
├── apps/
│   ├── web/        @quanan/web    · React 18 + Vite + tRPC client + shadcn 12 + Header
│   ├── api/        @quanan/api    · Hono + tRPC v11 + Prisma + Lucia v3 + arctic OAuth
│   └── admin/      @quanan/admin  · 占位(P9.0 启动 · README + .gitkeep)
├── packages/
│   ├── schemas/    @quanan/schemas · zod 真理来源(占位 · index.ts barrel)
│   ├── ui/         @quanan/ui      · 占位(★ 偏差 · TD-005 · 12 shadcn 写在 apps/web/src/components/ui/)
│   └── clients/    @quanan/clients · tRPC client + AppRouter type re-export
├── prisma/
│   ├── schema.prisma           · 38 model(主 18 + admin 16 + P2 4)
│   ├── migrations/
│   │   ├── 20260507000000_init/        · 1245 行 baseline · 全 38 表
│   │   ├── 20260507154814_add_sessions/ · US-006 加 lucia sessions 表
│   │   ├── manual_rls.sql              · 12 业务表 RLS(P1 实施)
│   │   ├── manual_admin_rls.sql        · 16 admin 表 DISABLE RLS(P9.0 实施)
│   │   └── manual_vector_indexes.sql   · pgvector 索引(P1 实施)
│   └── seed.ts
├── tests/
│   ├── unit/{agents,auth,parseDesignTokens.test.ts}
│   ├── integration/api/{auth,auth.me,trace}.test.ts
│   └── e2e/{header,debug-network}.spec.ts(playwright)
├── scripts/ralph/      · Coding 3.0 工具链(13 文件 sync 自 ~/.claude/scripts/ralph)
├── ui/                  · 60+ Aurelian Dark 设计稿 + DESIGN.md YAML
├── tasks/prd-1.md       · PRD 原文
├── .agents/{rca,tech-debt.json,plans}
└── .planning/{codebase,verifications,retros}  ← 本文件
```

**对账 AGENTS §10 admin 边界(LD-A-1) ·**
- ✅ apps/admin 仅占位 README · 0 业务代码
- ✅ apps/web 不引 apps/admin
- ✅ apps/api 不含 admin/* router
- ✅ packages/ui/src/admin 占位空
- ✅ prisma admin 16 表已 schema 但未跑 RLS migration

**偏差** · TD-005(shadcn 12 组件在 apps/web/src/components/ui/ 而非 packages/ui/src/base/)

---

## §2 STACK(实际 deps)

| Package | 关键 deps |
|---|---|
| **apps/web** | React 18 / @tanstack/react-query / @trpc/client+react-query / 10 @radix-ui / @fontsource/{manrope,inter,plus-jakarta-sans} / lucide-react / cva+clsx+twMerge / sonner / react-hook-form / zod / zustand / @quanan/* workspace |
| **apps/api** | hono / @hono/node-server / @trpc/server / @prisma/client / lucia + arctic / @upstash/{ratelimit,redis} / bullmq / pino+pino-pretty / @anthropic-ai/sdk / openai / handlebars / node-cron / @quanan/schemas |
| **apps/admin** | (空 · P9.0 起填) |
| **packages/schemas** | zod |
| **packages/ui** | React + lucide + cva+clsx+twMerge + tailwindcss-animate(★ 实际占位 · 12 shadcn 在 apps/web · TD-005) |
| **packages/clients** | @trpc/{client,server,react-query} + @tanstack/react-query + @quanan/schemas |
| **root devDeps** | typescript / vitest / playwright / prisma / tsx / eslint / prettier / husky / lint-staged / turbo |

**Prisma 38 model 分类 ·**
- 全局 3 · User / InviteCode / TrendingItem
- 主应用 16 · IpAccount / StepData / History / Topic / Asset / DiagnosisReport / FeedbackLog / EvolutionProfile / EvolutionInsight / DeepLearningArchive / KnowledgeFavorite / KnowledgeNote / CostLog / AuditLog / DailyTask + Session(US-006 加 · lucia)
- admin 16 · AdminAuditLog / ApprovalRequest / PromptVersion / PromptCanaryConfig / UserQuota / QuotaAdjustmentLog / KpiSnapshot / IpAccountAdminNote / IpAccountAnomalyFlag / InviteCampaign / TrendingReviewQueue / TrendingTakedown / AutoReviewRule / DeepLearnReviewQueue / UserViolationLog / EvolutionAnomalyFlag
- P2 占位 4 · AbExperiment / AbAssignment / FeatureFlag / SystemConfig

**对账 AGENTS §2 锁定 deps** · ✅ 主要 deps 跟 AGENTS §2 一致(React 18 / Vite 5 / tRPC v11 / Prisma 5 / Lucia 3 / pino / zod)

---

## §3 CONVENTIONS(实际编码约定)

**TS strict(LD-013)** · ✅ tsconfig.base.json 全开 ·
```
strict / strictNullChecks / strictFunctionTypes / strictBindCallApply
strictPropertyInitialization / noUncheckedIndexedAccess / noImplicitOverride
noImplicitReturns / noFallthroughCasesInSwitch / noUnusedLocals
noUnusedParameters / useUnknownInCatchVariables
```

**Path aliases ·**
- `@/*` → 各 app 自己的 `./src/*`(apps/web · apps/api · apps/admin · vitest config 跑 unit 测 api 时映 apps/api/src)
- `@quanan/schemas` → `./packages/schemas/src`
- `@quanan/ui` → `./packages/ui/src`
- `@quanan/clients` → `./packages/clients/src`

**Module/Build ·**
- ESM 全栈("type":"module")
- target ES2022 + DOM(web)/ ES2022(api)
- moduleResolution: Bundler

**Logging(LD-013 + AGENTS §6.9) ·**
- pino structured JSON Lines(prod)/ pino-pretty(dev)
- AsyncLocalStorage traceStore + mixin 自动注入 traceId
- ✅ 全 apps/api/src 0 console.log 命中(已 grep 验证)

**Style(LD-015) ·**
- Tailwind v3 · token 派生自 ui/aurelian_dark/DESIGN.md YAML(parseDesignTokens.js)
- ✅ globals.css + tailwind.config.js + parseDesignTokens.js · grep `#[0-9a-fA-F]{6}` 命中 0
- shadcn CSS vars 用 HSL space(`240 7% 8%`)+ `theme('colors.X')` runtime 解析

**测试** · vitest(unit + integration)+ playwright(e2e)+ pytest-full.xml 由 Validator 落产物

**对账 AGENTS §3 18 LD ·**
- ✅ LD-001 95% Workflow(BaseSpecialist run() 单次 execute · 不循环)
- ✅ LD-005 BaseSpecialist abstract class(grep 验证)
- ✅ LD-008 全栈 OAuth + lucia(US-006)
- ✅ LD-012 LLM Gateway 唯一入口(R-1 grep 0 命中直接 SDK)
- ✅ LD-013 strict TS(全 6 workspace typecheck 0 error)
- ✅ LD-015 token 派生(grep hardcode hex 0)
- 🟡 LD-009 RLS · schema 已就位 · manual_rls.sql 文件存在但未 apply(P1 实施)

---

## §4 INTEGRATIONS(关键集成点)

**Hono routes(apps/api/src/index.ts) ·**
```
GET  /health             · health check
GET  /auth/login         · OAuth start(setCookie state + code_verifier)
GET  /auth/callback      · OAuth callback(CSRF check · upsert user · create session)
POST /auth/logout        · logout(invalidate session)
ALL  /trpc/*             · fetchRequestHandler → appRouter
```

**tRPC routers(apps/api/src/trpc/routers/) ·**
- `_app.ts` · root router · 含 auth
- `auth.ts` · auth.me publicProcedure · 返 user(authenticated)/ unauthenticated stub
- (待 P1)13 router 全部 · ARCHITECTURE §3.2 列(stepData / specialist / ipAccounts / cost / 等)

**OAuth provider(apps/api/src/lib/auth/) ·**
- providers.ts · OAuthProvider interface + MockProvider + GoogleProvider(arctic v3 PKCE)+ requiresCsrfCheck(单参 · CSRF 旁路 bug 已修)+ validateStartupConfig(SESSION_SECRET ≥32 + prod-mock guard)
- lucia.ts · Lucia v3 · cookie name='app_session'(跟 admin_session 隔离 · REJ-026)+ secure=isProd + sameSite=lax
- adapter.ts · Prisma adapter for Lucia

**Vite proxy(apps/web/vite.config.ts) ·**
- `/api/trpc` → `http://localhost:3000`(dev 跨域桥)

**Prisma extensions ·**
- pgvector 0.8.0(source build for PG 16 · CREATE EXTENSION 已跑)

---

## §5 CONCERNS(已知 TD · 8 条)

| TD | 状态 | 类别 | 一句话 | 修期 |
|:-:|:-:|:-:|---|:-:|
| TD-001 | ✅ closed | design-drift | tailwind.config.js hardcode color | US-004 |
| TD-002 | ✅ closed | design-drift | globals.css 新硬编码 color | US-004 |
| TD-003 | open(已自然修)| process-gap | audit-artifacts manifest exit_code | US-003 |
| TD-004 | 🟢 accepted | scope-creep | prisma migrate baseline 由 US-003 跑 | PRD-2 不重做 |
| TD-005 | 🟡 scheduled | scope-mismatch | shadcn 12 组件路径(apps/web vs packages/ui) | P9.0 lift |
| TD-006 | open | process-gap | fail-over 漏跑 git log → 二次实施 | §9.6.5 已加 Step 0 |
| TD-007 | scheduled | lint-quality | 3 lint errors(no-misused-promises × 2 + unsafe-any × 1) | 下次 web 改动 |
| TD-008 | scheduled | naming-confusion | generateTraceId 同名 2 函数 | PRD-2 重命名 |

---

## §6 TESTING(实际覆盖)

| Layer | 文件 | 数量 |
|---|---|:-:|
| Unit | tests/unit/parseDesignTokens.test.ts | 10 |
| Unit | tests/unit/agents/base.test.ts | 8 |
| Unit | tests/unit/auth/providers.test.ts | 9 |
| Integration | tests/integration/api/auth.test.ts | 6 |
| Integration | tests/integration/api/auth.me.test.ts | 1 |
| Integration | tests/integration/api/trace.test.ts | 2 |
| E2E | tests/e2e/header.spec.ts(playwright)| 12(6 cases × chromium + mobile) |
| E2E | tests/e2e/debug-network.spec.ts | (debug · 不计) |
| **总** | **PRD-1 P0** | **36 vitest + 12 playwright = 48** |

**对账 PRD §5 测试配额 ·**
- PRD §5 写 12 单元 + 4 集成 + 3 E2E + 0 Judge = 19
- 实际 27 unit + 9 integration + 12 e2e = 48
- ✅ 超额完成(2.5x)· 因 ralph 多写 OAuth + parseDesignTokens + Header 覆盖

---

## §7 修订记录

- 2026-05-08 · v0.1 · /goal-verify §0 自动生成(Opus 主对话简化版)
- 此文件由 PRD-2 起每完成一个 PRD 后增量更新

---

> 跟 AGENTS.md 设计约束完全对齐 · 5 处偏差全部已登 TD(详 §5)· 0 未登记 drift。
