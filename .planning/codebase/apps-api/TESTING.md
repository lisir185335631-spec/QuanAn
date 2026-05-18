# Testing Patterns — apps/api

**Analysis Date:** 2026-05-13
**Scope:** apps/api 范围内 vitest 测试 · 16 测试文件 · admin 子系统覆盖最完善(PRD-10/11 强约束)

## Test Framework

**Runner:**
- Vitest(monorepo 根驱动)· 实际版本未在 apps/api/package.json 直接 list · 由根 devDeps 提供
- Config: 根 `vitest.config.ts`(单一 config · 含 apps/api glob)
- alias `@` → `apps/api/src`(`vitest.config.ts:23`)

**Assertion Library:**
- `vitest` 内置 `expect`(jest-compat)
- jsdom 仅用于 admin component test(`tests/unit/admin/*.tsx`)· apps/api 测试全跑 `environment: 'node'`

**Run Commands:**
```bash
pnpm test                                    # 根 · vitest run · 全跑(单元 + 集成 · 含 apps/api)
pnpm test:unit                               # 根 · 仅 tests/unit/ 下
pnpm test:integration                        # 根 · 仅 tests/integration/ 下
pnpm test:admin-integration                  # 根 · tests/integration/admin/
pnpm --filter @quanqn/api test:admin         # AGENTS §10.4.3 列出 · 实际 apps/api/package.json 无此 script · 跑根级 vitest 即可
```

**Coverage:**
- v8 provider · 阈值在根 `vitest.config.ts:71-76`
  - 全局 lines 80 · functions 80 · branches 75 · statements 80
  - `src/server/agents/**` 强约束 · lines 90 · branches 85
  - `src/lib/**` 最严 · lines 95 · branches 90
- 例外 · `**/*.test.ts` / `tests/**` / `scripts/**` / `**/index.ts` / `src/lib/constants/**`

## Test File Organization

**Location:**
- co-located 模式 · 每个源文件平级或子目录 `__tests__/<name>.test.ts`
- 例:
  - `apps/api/src/trpc/routers/admin/users.ts` ↔ `apps/api/src/trpc/routers/admin/__tests__/users.test.ts`
  - `apps/api/src/services/admin/cost/detect-anomalies.service.ts` ↔ `apps/api/src/services/admin/cost/__tests__/detect-anomalies.service.test.ts`
  - `apps/api/src/jobs/admin/kpi-snapshot.job.ts` ↔ `apps/api/src/jobs/admin/__tests__/kpi-snapshot.job.test.ts`
- 不允许 spec.ts 后缀 · 全部统一 `.test.ts`

**Naming:**
- 测试文件名跟源文件名一致(`audit.ts` ↔ `audit.test.ts`)
- 特例 admin · users-export 单独测 CSV 流式(从 users.ts 的 handleExportUsersCSV 独立测)
- audit-forensic 单独测 PDF 生成

**Structure:**
```
apps/api/src/
├── jobs/admin/__tests__/                  # 2 文件
│   ├── cost-anomaly.job.test.ts
│   └── kpi-snapshot.job.test.ts
├── middleware/__tests__/                  # 1 文件
│   └── auth-lastlogin.test.ts
├── services/admin/
│   ├── accounts/__tests__/anomaly-detection.service.test.ts
│   ├── cost/__tests__/{detect-anomalies, pdf-bill}.test.ts
│   ├── invites/__tests__/campaign.test.ts
│   └── nsm/__tests__/kpi-snapshot.test.ts
└── trpc/routers/admin/__tests__/          # 7 文件
    ├── accounts.test.ts
    ├── audit-forensic.test.ts
    ├── audit.test.ts                       # 30 tests
    ├── cost.test.ts
    ├── invites.test.ts
    ├── nsm.test.ts
    ├── users-export.test.ts
    └── users.test.ts
```

## Test Structure

**Suite Organization:**
```typescript
// 1. file header comment with PRD/US ref
// PRD-11 US-016 · audit router unit tests — 30 tests
// byTraceId(4表全有/部分/全无) · byUserId(分页+filter) · byAdminId(鉴权) · search(SQL注入) · exportPdf(链路)

import { describe, it, expect, vi, beforeEach } from 'vitest';

// 2. Hoisted mocks(必须 在源文件 import 之前)
const mockLogAdminAction = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockPrismaTransaction = vi.hoisted(() => vi.fn().mockImplementation(...));

// 3. vi.mock
vi.mock('@/services/admin/admin-audit-service', () => ({ logAdminAction: mockLogAdminAction }));
vi.mock('@/lib/prisma', () => ({ prisma: { /* all mock methods */ } }));

// 4. Imports(after mocks)
import { adminAuditRouter } from '@/trpc/routers/admin/audit';
import type { AdminTRPCContext } from '@/server/context-admin';

// 5. Fixtures
const SUPER_ADMIN: AdminLuciaUser = { id: 1, email: 'super@quanqn.com', role: 'super_admin', ... };
const MOCK_SESSION: AdminLuciaSession = { id: 'sess-audit-test', expiresAt: ..., fresh: false };

// 6. Helpers
function makeRequest(headers: Record<string, string> = {}): Request {
  const h = new Headers(headers);
  return { headers: h } as unknown as Request;
}
function makeCtx(user: AdminLuciaUser | null, overrides: Partial<AdminTRPCContext> = {}): AdminTRPCContext { ... }

// 7. Test blocks
describe('adminAuditRouter.listMine', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  it('returns last 50 audit log entries for current admin', async () => { ... });
});
```

**Patterns:**
- describe per procedure(`describe('adminAuditRouter.listMine', ...)`)
- it 用完整句子描述行为(`it('writes privilege_escalation audit + throws FORBIDDEN for readonly_admin', ...)`)
- beforeEach 必清 `vi.clearAllMocks()` 防 mock 状态串(`apps/api/src/trpc/routers/admin/__tests__/audit.test.ts` 标准)
- 不用 afterEach 起 cleanup(因为 mock 已在 hoisted · clearAllMocks 足够)

## Mocking

**Framework:** vitest 的 `vi.mock` + `vi.hoisted` + `vi.fn().mockResolvedValue(...)` / `mockImplementation(...)`

**Standard Pattern(admin router):**
```typescript
// 1. Hoisted: 必须在 file top · vi.mock 之前(因为 hoist · 自动提到 import 之前)
const mockLogAdminAction = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockAuditLogFindMany = vi.hoisted(() => vi.fn().mockResolvedValue([]));
const mockAdminAuditLogCreate = vi.hoisted(() => vi.fn().mockResolvedValue({}));

const mockPrismaTransaction = vi.hoisted(() =>
  vi.fn().mockImplementation((cb: (tx: unknown) => unknown) =>
    cb({
      $executeRaw: vi.fn().mockResolvedValue(undefined),
      $executeRawUnsafe: vi.fn().mockResolvedValue(undefined),
      auditLog: { findMany: mockAuditLogFindMany },
      adminAuditLog: { findMany: mockAdminAuditLogFindMany },
      costLog: { findMany: mockCostLogFindMany },
      feedbackLog: { findMany: mockFeedbackLogFindMany },
    }),
  ),
);

// 2. vi.mock with module factory
vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: mockPrismaTransaction,
    auditLog: { findMany: mockAuditLogFindMany, count: mockAuditLogCount },
    adminAuditLog: { findMany: mockAdminAuditLogFindMany, findFirst: ..., create: ... },
    // ... 所有用到的 model
  },
}));

vi.mock('@/services/admin/admin-audit-service', () => ({
  logAdminAction: mockLogAdminAction,
}));
```

**What to Mock:**
- 数据库 · `@/lib/prisma`(必 mock · 单元测试不依赖真 DB)
- 外部 service · `logAdminAction`(admin-audit-service)· `generateForensicPdf`(pdf-forensic)· `getCampaignFunnel`(campaign service)
- redis(BullMQ Queue / Worker · ratelimit)
- HTTP fetch(钉钉 webhook · `apps/api/src/services/admin/notifications/__tests__/`)
- Lucia validateAdminSession(`apps/api/src/lib/auth/lucia-admin.ts`)在 router test 中通过直接构造 ctx 旁路

**What NOT to Mock:**
- zod 校验(实测 input validation 行为)
- 业务逻辑函数 · audit-helpers redactSensitiveFields / extractActionType
- 常量(ADMIN_ROLES / ADMIN_ROLE_HIERARCHY)
- 错误类(ValidationError / AdminRLSBypassError)

## Fixtures and Factories

**Test Data:**
```typescript
// Admin user 三档(super / admin / readonly)在每个测试文件顶部 const
const SUPER_ADMIN: AdminLuciaUser = {
  id: 1, email: 'super@quanqn.com', role: 'super_admin', isMock: false, isActive: true,
};
const REGULAR_ADMIN: AdminLuciaUser = {
  id: 2, email: 'admin@quanqn.com', role: 'admin', isMock: false, isActive: true,
};
const READONLY_ADMIN: AdminLuciaUser = {
  id: 3, email: 'readonly@quanqn.com', role: 'readonly_admin', isMock: false, isActive: true,
};

// Session fixture
const MOCK_SESSION: AdminLuciaSession = {
  id: 'sess-audit-test',
  expiresAt: new Date(Date.now() + 3_600_000),
  fresh: false,
};

// Time fixtures(ms-precision · 测 sort + 时间 delta)
const T1 = new Date('2026-01-01T10:00:00Z');
const T2 = new Date('2026-01-01T10:01:00Z');
const T3 = new Date('2026-01-01T10:02:00Z');
const TRACE_ID = 'trace-abc-def-ghi';

// Helper functions
function makeRequest(headers: Record<string, string> = {}): Request {
  const h = new Headers(headers);
  return { headers: h } as unknown as Request;
}

function makeCtx(
  user: AdminLuciaUser | null,
  overrides: Partial<AdminTRPCContext> = {},
): AdminTRPCContext {
  return {
    prisma: prisma as unknown as PrismaClient,
    adminPrisma: prisma as unknown as PrismaClient,
    traceId: TRACE_ID,
    req: makeRequest(),
    resHeaders: new Headers(),
    adminSession: user ? MOCK_SESSION : null,
    activeAdminUser: user,
    crossAccountAccessed: true,  // 模拟 adminRLS 已注
    ...overrides,
  };
}
```

**Location:**
- 跟测试文件内联(co-located)· 没有共享 fixture 文件
- 跨文件复用 · 复制粘贴(因为是 narrow 范围 · `admin/__tests__/` 内 7 文件大同小异)

## Coverage

**Requirements:**
- 全局 80%(lines / functions / statements)+ 75% branches
- admin service(`src/services/admin/**`)· 实际未在 vitest.config 设专项门槛 · 跟全局
- admin router(`src/trpc/routers/admin/**`)· 跟全局
- `src/lib/**` 95% / 90%(最严)

**View Coverage:**
```bash
pnpm test -- --coverage   # 全跑 + v8 coverage 报告
# 输出 · text(终端) + json + html + lcov
```

## Test Types

**Unit Tests:**
- 范围 · 单 procedure / 单 service function
- 不接真 DB(全 mock prisma)
- 不接真 Redis / BullMQ(mock queue.add / worker)
- 示例 · `apps/api/src/trpc/routers/admin/__tests__/audit.test.ts` 30 tests · 全 mock

**Integration Tests:**
- 位置 · 根 `tests/integration/admin/` 下(根 script `test:admin-integration`)
- 范围 · 真 DB(via testcontainers PG)+ 真 Lucia + 真 6 闸 chain
- 实际数量 · 未在 apps/api 内 list · 在根 tests 目录

**E2E Tests:**
- 框架 · Playwright(根 `playwright.config.ts` 配置)
- 范围 · admin SPA 主链路(登录 → MFA → 跨账号查 → Approval → 审核 → 导出 → 封禁 → 紧急止损)8 条 · 见 AGENTS §10.5
- 实际位置 · 根 tests 目录(不在 apps/api 内)

**LLM Judge(主应用 only):**
- 根 script `test:judge` · `vitest.judge.config.ts`
- 范围 · Specialist 输出 100 金标准
- admin 子系统不参与 LLM Judge(per AGENTS §10.5 表 · admin 不调 LLM)

## Common Patterns

**Async Testing:**
```typescript
it('returns timeline + summary when all 4 tables have rows', async () => {
  mockAuditLogFindMany.mockResolvedValueOnce([{ id: 1n, eventType: 'auth.login', createdAt: T1, ... }]);
  mockAdminAuditLogFindMany.mockResolvedValueOnce([{ id: 2, eventType: 'admin_login', createdAt: T2, ... }]);

  const caller = adminAuditRouter.createCaller(makeCtx(SUPER_ADMIN));
  const result = await caller.byTraceId({ traceId: TRACE_ID });

  expect(result.summary.eventCount).toBe(2);
  expect(result.timeline[0].source).toBe('audit_log');
});
```

**Error Testing(role check):**
```typescript
it('throws FORBIDDEN when readonly_admin tries to mutate', async () => {
  const caller = usersRouter.createCaller(makeCtx(READONLY_ADMIN));

  await expect(caller.banUser({ userId: 99, reason: 'spam x10' })).rejects.toThrow('privilege_escalation');

  // 验证 audit 仍有写 · privilege_escalation event
  expect(mockLogAdminAction).toHaveBeenCalledWith(
    expect.objectContaining({
      eventType: 'privilege_escalation',
      success: false,
      errorCode: 'FORBIDDEN',
    }),
  );
});
```

**Mock 不同模型返回值(多表查):**
```typescript
mockAuditLogFindMany.mockResolvedValueOnce([{ ... }]);       // 第一次调
mockAdminAuditLogFindMany.mockResolvedValueOnce([{ ... }]);  // 同 transaction 内并行
mockCostLogFindMany.mockResolvedValueOnce([]);
mockFeedbackLogFindMany.mockResolvedValueOnce([{ ... }]);

// 第二次调(exportPdf · 全表查 500 行 · 再调一次)
mockAuditLogFindMany.mockResolvedValueOnce([{ ... }]);
// ...
```

**RLS bypass 测试:**
- `mockPrismaTransaction` 直接 callback execute(不真启 transaction)
- callback 内 `$executeRawUnsafe` 是 vi.fn · 可断言 `expect(mockPrismaTransaction.mock.calls[0][0]).toBeDefined()`
- 实际 SET LOCAL SQL 内容不测(因为 prisma 接口是 vi.fn · 真测要 integration test)

**Cron schedule 测试(job test):**
```typescript
// 替 BullMQ Queue.add 为 vi.fn
const mockQueueAdd = vi.hoisted(() => vi.fn().mockResolvedValue({ id: 'mock-job' }));
vi.mock('bullmq', () => ({
  Queue: vi.fn().mockImplementation(() => ({ add: mockQueueAdd })),
  Worker: vi.fn(),
}));

it('scheduleDailySnapshot adds repeat job with Asia/Shanghai tz and jobId', async () => {
  await scheduleDailySnapshot();

  expect(mockQueueAdd).toHaveBeenCalledWith(
    'daily-snapshot',
    { granularity: 'day' },
    expect.objectContaining({
      repeat: { pattern: '0 * * * *', tz: 'Asia/Shanghai' },
      jobId: 'daily-snapshot-recurring',
    }),
  );
});
```

## Special Considerations

**pool: forks + singleFork=true(vitest.config.ts:57-62):**
- 防 DB 并发冲突(集成测试用真 PG container · 单 fork 串行跑)
- 单元测试也受此影响 · 跑得稍慢但稳定

**testTimeout: 30000 / hookTimeout: 60000:**
- service 测试(如 kpi-snapshot)涉及多步 SQL 模拟 · 30s 够
- hook(beforeAll setupFiles)允许 60s · 等 testcontainer 启动

**setupFiles: ['./tests/setup.ts'](根级):**
- 全测试前置 · 实际内容未在 apps/api 内(根 tests/setup.ts)· 推断负责 DB 重置 / env 注入

---

*Testing analysis: 2026-05-13*
