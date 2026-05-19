# Coding Conventions — apps/api

**Analysis Date:** 2026-05-13
**Scope:** `apps/api/src/**/*.ts` 173 文件 · 主应用 + admin 共用风格

## Naming Patterns

**Files:**
- camelCase 单实体文件 · `adminAuth.ts` / `roleCheck.ts` / `users.ts` / `accounts.ts` / `evolution.ts`(典型 router / middleware / agent)
- kebab-case 多词模块 · `admin-audit-service.ts` / `pdf-bill.service.ts` / `kpi-snapshot.service.ts` / `cost-anomaly.job.ts` / `daily-task-runner.ts` / `account-isolation.ts`
- 测试文件 · `<name>.test.ts` 后缀 · 位于同目录 `__tests__/`(`apps/api/src/trpc/routers/admin/__tests__/audit.test.ts`)
- 不允许大写开头(除 Agent class 文件如 `BaseSpecialist.ts` / `CopywritingAgent.ts` / `EvolutionAgent.ts`)

**Functions:**
- camelCase 全部(`computeSnapshot` / `logAdminAction` / `detectCostAnomalies` / `generateForensicPdf` / `redactSensitiveFields`)
- 动词开头表示 action(`get*` / `create*` / `update*` / `delete*` / `compute*` / `detect*` / `validate*` / `extract*`)
- 处理函数(handler)· `handle*` 前缀(`handleExportUsersCSV` `apps/api/src/trpc/routers/admin/users.ts:156`)
- async 函数返回类型必显 · `Promise<T>` 必写(`compute(): Promise<KpiSnapshotData>`)

**Variables:**
- camelCase 局部 + 实例(`adminUser` / `payloadHash` / `traceId`)
- SCREAMING_SNAKE_CASE 常量(`ADMIN_ROLES` / `MFA_STALE_MS` / `DAILY_THRESHOLD` / `CSV_MAX_EXPORT_ROWS` / `BATCH_IMPORT_MAX_ROWS`)
- 文件级 const 在文件顶部(import 之后 · 类型定义之前)· 见 `apps/api/src/trpc/routers/admin/audit.ts:18-21`

**Types:**
- PascalCase interface + type(`AdminTRPCContext` / `KpiSnapshotData` / `LogAdminActionInput` / `AnomalyRecord`)
- Suffix `Input` · zod schema 推导(`listInput` / `byTraceIdInput` / `exportPdfInput`)
- Suffix `Result` / `Output` · service 返回(`DetectCostAnomaliesResult` / `GenerateBillResult` / `DingtalkSendResult`)
- Suffix `Error` · Error class(`ValidationError` / `AdminRLSBypassError` / `SnapshotComputationTimeout` / `CampaignKeyConflictError`)

## Code Style

**Formatting:**
- Prettier(根 `format` script · `prettier --write "{apps,packages,scripts,tests,prisma}/**/*.{ts,tsx,css,json,md}"`)
- 单引号 string(全部源码 grep 验证)
- 行末分号
- 缩进 2 空格

**Linting:**
- ESLint 8.57 + @typescript-eslint/eslint-plugin ^6.21
- 规则: `--max-warnings=0`(零警告强约束 · `apps/api/package.json:11`)
- 显式 disable 用单行注释 + 短理由 · 例: `// eslint-disable-next-line import/no-named-as-default` (`apps/api/src/lib/logger.ts:9`)
- 例: `// eslint-disable-next-line @typescript-eslint/no-explicit-any` 用于 React PDF renderToBuffer 第三方类型不齐(`apps/api/src/services/admin/cost/pdf-bill.service.ts:151`)

**TypeScript Strict:**
- tsconfig 根 base 全开 strict + `noUncheckedIndexedAccess` + `verbatimModuleSyntax` + `useUnknownInCatchVariables`(`tsconfig.base.json:18-30`)
- `import type` 用于 type-only 导入(`import type { PrismaClient } from '@prisma/client'`)
- catch 用 `err: unknown` 不允许默认 any · 见 `apps/api/src/index.ts:155` `err instanceof Error ? err.message : String(err)`

## Import Organization

**Order(实际观察 ESLint 自动排序):**
1. Node.js builtin · `import { randomBytes } from 'node:crypto'`(强制 `node:` 前缀)
2. 空行
3. Third-party · `@trpc/server` `zod` `ipaddr.js` `arctic` `hono` `lucia` `bullmq` ...
4. 空行
5. 内部 alias `@/` · `@/lib/auth/lucia` `@/services/admin/admin-audit-service` `@/trpc/procedures/admin`
6. 空行
7. 同目录相对 · `import { adminAuthMiddleware } from './adminAuth';`
8. 空行
9. `import type` 单独段(实际有时混入第 5 段 · 不严格)

**示例(`apps/api/src/trpc/routers/admin/audit.ts:6-14`):**
```typescript
import { createHash } from 'node:crypto';

import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { logAdminAction } from '@/services/admin/admin-audit-service';
import { generateForensicPdf } from '@/services/admin/audit/pdf-forensic.service';
import { adminProcedure } from '@/trpc/procedures/admin';
import { adminTrpcRouter } from '@/trpc/trpc-admin';
```

**Path Aliases:**
- `@/*` → `apps/api/src/*`(`apps/api/tsconfig.json:9`)
- `@quanan/schemas` → `packages/schemas/src`(workspace)
- `@quanan/ui/admin/pdf` → `packages/ui/src/admin/PdfBillTemplate.tsx`(`apps/api/tsconfig.json:12`)

## Error Handling

**Patterns:**
- tRPC 内 · `throw new TRPCError({ code: 'FORBIDDEN', message: 'insufficient_role' })`
  - code 用 tRPC 内置(UNAUTHORIZED / FORBIDDEN / NOT_FOUND / BAD_REQUEST / NOT_IMPLEMENTED / PRECONDITION_FAILED / INTERNAL_SERVER_ERROR)
  - message 用 snake_case 短串(`'unauthenticated'` / `'ip_not_whitelisted'` / `'MFA_REQUIRED'` / `'privilege_escalation'`)
  - 见 `apps/api/src/trpc/middleware/admin/roleCheck.ts:21`

- service 域 · 自定义 Error class
  - 必须 `super(message)` 后 `this.name = 'XxxError'`(便于 toString debug)
  - 见 `apps/api/src/services/admin/nsm/kpi-snapshot.service.ts:17-36`
  ```typescript
  export class ValidationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'ValidationError';
    }
  }
  ```

- audit / log 写失败 · `.catch()` 兜底但不抛
  - `.catch(() => undefined)`(纯静默 · 如 `index.ts:174` audit log create 失败)
  - `.catch((err) => console.error('[ADMIN AUDIT WRITE FAILED]', err))`(落 console + 不抛 · LD-A3 强约束 · 见 `admin-audit-service.ts:70`)
  - 业务调用方 · `void logAdminAction({...})` 表示故意 fire-and-forget(`apps/api/src/trpc/routers/admin/users.ts:282`)

- catch 一定 narrowing
  - `err instanceof Error ? err.message : String(err)` 模式(`apps/api/src/index.ts:112, 155`)
  - 自定义 narrow · `'code' in err`(`apps/api/src/trpc/middleware/admin/auditLog.ts:46`)

## Logging

**Framework:** pino 9.0 + AsyncLocalStorage(traceStore)· `apps/api/src/lib/logger.ts`

**Patterns:**
- 严禁 `console.log`(AGENTS §6.9 + 实际 grep 仅 admin-audit-service.ts:70 + users.ts:523 例外)
- 唯一允许的 console · audit 写失败兜底 `console.error('[ADMIN AUDIT WRITE FAILED]', err)`
- 模式 · `logger.<level>(context_obj, message_string)`
  - `logger.info({ port: PORT }, 'server.starting')`
  - `logger.error({ err }, 'oauth.callback.failed')`
  - `logger.warn({ userId, dailySpent: ..., threshold: ... }, 'cost_anomaly_detect.alert')`
  - 见 `apps/api/src/services/admin/cost/detect-anomalies.service.ts:107`
- event 名 · snake_case + namespace 风格(`<module>.<verb>.<status>`)
  - `daily_task_cron.fan_out_start` / `kpi_snapshot_worker.completed` / `cost_anomaly_detect.deduped`

**traceId 自动注入:**
- 不需要手动传 · pino `mixin()` 读 AsyncLocalStorage(`apps/api/src/lib/logger.ts:25-30`)
- 测试期间 `traceStore.run()` 用于显式打 traceId 进 store(`apps/api/src/index.ts:97`)

## Comments

**When to Comment:**
- 文件头 · 必须有 PRD/US 引用 + 1-3 行职责说明
  ```typescript
  // PRD-10 US-003 · adminProcedure — 6-gate chain (order is a hard constraint per LD-A-chain)
  // Gate order: adminAuth → roleCheck → ipWhitelist → mfaCheck → adminRLS → approvalGateCheck → auditLog
  ```
  见 `apps/api/src/trpc/procedures/admin.ts:1-2`

- 关键约束 · `SHIELD:` 前缀标 anti-pattern 防御
  ```typescript
  // SHIELD: SET LOCAL (not SET) — scoped to current transaction only
  // SHIELD: Promise.all 并行 · 不串行 await A; await B
  // SHIELD: prisma.contains mode:insensitive prevents SQL injection
  ```
  见 `apps/api/src/services/admin/invites/campaign.service.ts:116` · `apps/api/src/trpc/routers/admin/audit.ts:3-4`

- money-critical · 文件级标识
  ```typescript
  // # $ money-critical: true
  ```
  见 `apps/api/src/trpc/routers/admin/cost.ts:88, 148, 186, 213, 252, 303` (每个 procedure 都标)

- AC 引用 · `AC-N` 形式串编号
  ```typescript
  // AC-2: $transaction + SET LOCAL · 查 cost_log 24h sum > $5
  // AC-7: dedupe per user per day via adminAuditLog.findFirst
  ```
  见 `apps/api/src/services/admin/cost/detect-anomalies.service.ts:2-4`

**JSDoc/TSDoc:**
- 用 `/** ... */` 但不严格 · 主要给 export function 加单行说明
- 不强制 @param @returns(因为 TS 类型已显)
- 示例 `apps/api/src/trpc/routers/admin/cost.ts:89-90`
  ```typescript
  /** aggregate · 4-dimension × 3-granularity cost rollup · Prisma.raw whitelist 防注入 (AC-2) */
  ```

## Function Design

**Size:**
- procedure handler · 50-200 行(典型 PRD-11 router 单 procedure)
- service function · 30-100 行 · 关键路径(如 `computeSnapshot`)可达 100 行(`apps/api/src/services/admin/nsm/kpi-snapshot.service.ts:285-389`)
- middleware · 20-50 行(单职责)· 见 `apps/api/src/trpc/middleware/admin/adminRLS.ts` 仅 23 行
- 不强制行数门禁 · 按职责切分

**Parameters:**
- service function 用 named param object · 不允许 5+ positional
  ```typescript
  // 正确
  export async function logAdminAction(input: LogAdminActionInput): Promise<void>
  // 不允许
  function logAdminAction(adminId, role, category, type, ...)
  ```
  见 `apps/api/src/services/admin/admin-audit-service.ts:35`

- service 接受 PrismaClient 注入(cron / router 双调用兼容)
  ```typescript
  export async function generateMonthlyBill(
    month: string,
    adminId: number,
    prismaClient: PrismaClient,
  ): Promise<GenerateBillResult>
  ```
  见 `apps/api/src/services/admin/cost/pdf-bill.service.ts:34`

**Return Values:**
- async 必显 Promise<T> 返回类型(strict)
- nullable 用 `| null` 不用 undefined(数据库行业实践)· 见 `adminSessionMfaVerifiedAt: Date | null`(`apps/api/src/server/context-admin.ts:21`)
- service 返回 typed object · 不返回 tuple(可读性)

## Module Design

**Exports:**
- 优先 named export · 默认 export 仅极少数(none in admin code 检索)
- service / router / middleware 一个文件可有多个 named export
  - 例 `apps/api/src/trpc/routers/admin/users.ts` 同时 export `usersRouter`(router)+ `handleExportUsersCSV`(REST handler)+ `escapeCsvField` / `formatUserCsvRow`(给测试用)
- type re-export · `export type { AdminRole, AuditEventCategory } from './constants'`(`apps/api/src/lib/admin/types.ts:5`)

**Barrel Files:**
- `apps/api/src/trpc/middleware/admin/index.ts`: re-export 7 middleware
- `apps/api/src/cron/index.ts`: cron barrel(留位)
- 不普遍 · 一般直接 from `@/services/admin/<x>/<y>.service.ts` 全路径

**No-side-effect modules:**
- 顶层不允许跑 await(strict)· cron schedule 必须在 `start()` 内 await(`apps/api/src/index.ts:313-321`)
- 例外 · Queue/Worker 实例化在 top-level(`jobs/admin/kpi-snapshot.job.ts:21` `new Queue(...)`)· 因为 ioredis 连接是 lazy

## Special Patterns

**vi.hoisted mock(测试):**
- 所有 admin test 用 `vi.hoisted(() => vi.fn())` 创 mock fn
- 然后 `vi.mock('@/lib/prisma', () => ({ prisma: { ... } }))`
- mock 必须在 `import { adminAuditRouter } from '@/trpc/routers/admin/audit'` 之前(hoist 保证)
- 标准结构 见 `apps/api/src/trpc/routers/admin/__tests__/audit.test.ts:8-67`

**$transaction wrap for SET LOCAL:**
- 所有跨账号 admin 读 / 写 必须用
  ```typescript
  prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe("SET LOCAL app.role = 'admin'");
    // ... business ops ...
  })
  ```
- 见 `apps/api/src/services/admin/cost/detect-anomalies.service.ts:38-115` 标准实现
- 等价 `tx.$executeRaw\`SELECT set_config('app.role', 'admin', true)\``(`apps/api/src/trpc/middleware/admin/adminRLS.ts:10`)

**Prisma.raw + 白名单 防注入:**
- 动态字段名(如 `groupBy` 列名)· 不允许字符串拼接 raw SQL
- 模式 · 用 `Record<string, string>` 白名单 + `Prisma.raw(whitelisted_value)` + template literal
  ```typescript
  const DIMENSION_COLUMN: Record<string, string> = {
    user: 'user_id', specialist: 'agent_id', model: 'model_used', provider: 'provider',
  };
  const dimCol = DIMENSION_COLUMN[dimension]!;
  await db.$queryRaw`SELECT ${Prisma.raw(dimCol)}::text ...`
  ```
- 见 `apps/api/src/trpc/routers/admin/cost.ts:22-34, 105-115`

**Cookie 手写 vs Hono `setCookie`:**
- 主应用用 `setCookie` from `hono/cookie`(`apps/api/src/index.ts:14`)
- admin tRPC 用 `ctx.resHeaders.append('Set-Cookie', makeCookieStr(...))` 手写字符串(因为 tRPC fetch adapter context 不是 Hono context · `apps/api/src/trpc/routers/admin/auth.ts:17, 80`)

---

*Convention analysis: 2026-05-13*
