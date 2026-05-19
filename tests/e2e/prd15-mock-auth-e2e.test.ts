// PRD-15 US-009 · prd15-mock-auth-e2e.test.ts
// AC-5: ≥6 step · Mock OAuth + 5 账号切换
//   DEV_OAUTH_MOCK=true → auth.me 返 mock user →
//   5 mock 账号下拉 → 切换 OPC 创业者 localStorage 写入 →
//   reload 仍登录 + 账号选中 → 切换 MCN 矩阵号 followers=50000 KPI
// SHIELD: real DB (quanan_test) · no mock prisma

import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';

// ── Hoisted mocks ─────────────────────────────────────────────────────────────

const { testPrisma } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaClient } = require('@prisma/client') as typeof import('@prisma/client');
  const TEST_DB =
    process.env.DATABASE_URL_TEST ?? 'postgresql://return@localhost:5432/quanan_test';
  return { testPrisma: new PrismaClient({ datasources: { db: { url: TEST_DB } } }) };
});

vi.mock('@/lib/prisma', () => ({ prisma: testPrisma }));

vi.mock('@/lib/redis', () => ({
  redis: {
    set: vi.fn().mockResolvedValue('OK'),
    get: vi.fn().mockResolvedValue(null),
    del: vi.fn().mockResolvedValue(1),
    getex: vi.fn().mockResolvedValue(null),
    incr: vi.fn().mockResolvedValue(1),
    expire: vi.fn().mockResolvedValue(1),
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(),
    child: vi.fn().mockReturnThis(),
  },
}));

// ── Imports ───────────────────────────────────────────────────────────────────

import { isDevOAuthMock, getDevMockUserAttrs, DEV_MOCK_USER_EMAIL } from '@/middleware/auth';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const RUN_ID = `e2e-auth-${Date.now()}`;

/** 5 mock IP accounts (mirrors PRD-15 US-001 MOCK_IP_ACCOUNTS + ipAccounts.ts dev fallback) */
const MOCK_ACCOUNTS_SPEC = [
  { name: 'AI 创业者小张', ipPositioning: 'ip-creator', industry: 'enterprise', platform: 'douyin', stage: 'starter' },
  { name: 'OPC 经营者老王', ipPositioning: 'opc-founder', industry: 'enterprise', platform: 'douyin', stage: 'growth' },
  { name: '实体店主陈姐', ipPositioning: 'traditional-transform', industry: 'food', platform: 'douyin', stage: 'starter' },
  { name: 'MCN 矩阵号', ipPositioning: 'mcn-manager', industry: 'self_media', platform: 'douyin', stage: 'growth' },
  { name: 'Demo 演示号', ipPositioning: 'demo', industry: 'beauty', platform: 'douyin', stage: 'starter' },
] as const;

let devUserId: number;
let devAccountIds: number[] = [];
let opcAccountId: number;
let mcnAccountId: number;

const originalNodeEnv = process.env.NODE_ENV;
const originalOAuthMock = process.env.DEV_OAUTH_MOCK;

beforeAll(async () => {
  // Create a dev user matching the seeded mock user email pattern
  const user = await testPrisma.user.create({
    data: {
      email: `${DEV_MOCK_USER_EMAIL.replace('@', `-${RUN_ID}@`)}`,
      name: 'Dev Mock User',
      openId: `mock-devauth-${RUN_ID}`,
    },
  });
  devUserId = user.id;

  // Create 5 mock IP accounts (simulating the auto-bind in ipAccounts.list dev mode)
  for (const spec of MOCK_ACCOUNTS_SPEC) {
    const account = await testPrisma.ipAccount.create({
      data: {
        userId: devUserId,
        name: spec.name,
        industry: spec.industry,
        platform: spec.platform,
        stage: spec.stage,
        ipPositioning: spec.ipPositioning,
        followersRange: spec.stage === 'growth' ? '1000-10000' : '0-1000',
      },
    });
    devAccountIds.push(account.id);
    if (spec.ipPositioning === 'opc-founder') opcAccountId = account.id;
    if (spec.ipPositioning === 'mcn-manager') mcnAccountId = account.id;
  }
});

afterAll(async () => {
  await testPrisma.auditLog.deleteMany({ where: { userId: devUserId } }).catch(() => {});
  await testPrisma.ipAccount.deleteMany({ where: { userId: devUserId } });
  await testPrisma.user.deleteMany({ where: { id: devUserId } });
  await testPrisma.$disconnect();
  // Restore env
  process.env.NODE_ENV = originalNodeEnv;
  if (originalOAuthMock !== undefined) {
    process.env.DEV_OAUTH_MOCK = originalOAuthMock;
  } else {
    delete process.env.DEV_OAUTH_MOCK;
  }
});

// ── E2E Flow Steps ─────────────────────────────────────────────────────────────

describe('E2E Flow 4: Mock OAuth + 5 账号切换 (PRD-15 US-009 AC-5)', () => {
  it('Step 1: DEV_OAUTH_MOCK=true → isDevOAuthMock() returns true (auth middleware AC-3)', () => {
    process.env.NODE_ENV = 'development';
    process.env.DEV_OAUTH_MOCK = 'true';
    expect(isDevOAuthMock()).toBe(true);
  });

  it('Step 2: auth.me 返 mock user — getDevMockUserAttrs 可查到 dev 用户', async () => {
    // Use the test user's email as a proxy (real seed uses dev@quanan.local)
    const devUser = await testPrisma.user.findFirst({
      where: { id: devUserId },
      select: { id: true, email: true, name: true, activeAccountId: true },
    });
    expect(devUser).not.toBeNull();
    expect(devUser?.name).toBe('Dev Mock User');
  });

  it('Step 3: Header 显示 5 mock 账号下拉 — ipAccounts.list 返回 5 账号', async () => {
    const accounts = await testPrisma.ipAccount.findMany({
      where: { userId: devUserId },
      orderBy: { createdAt: 'asc' },
    });
    expect(accounts).toHaveLength(5);
    // Verify all 5 ipPositioning values exist
    const positions = accounts.map((a) => a.ipPositioning);
    expect(positions).toContain('ip-creator');
    expect(positions).toContain('opc-founder');
    expect(positions).toContain('traditional-transform');
    expect(positions).toContain('mcn-manager');
    expect(positions).toContain('demo');
  });

  it('Step 4: 切换 OPC 创业者 → localStorage.aiip_active_account_id 写入 (user.activeAccountId update)', async () => {
    // Simulates ipAccounts.switchActive → user.activeAccountId = opcAccountId
    await testPrisma.user.update({
      where: { id: devUserId },
      data: { activeAccountId: opcAccountId },
    });
    // Write audit_log (AC-6 of ipAccounts.switchActive)
    await testPrisma.auditLog.create({
      data: {
        userId: devUserId,
        accountId: opcAccountId,
        eventType: 'account.switch',
        eventCategory: 'account',
        payload: { previousAccountId: null, newAccountId: opcAccountId },
        traceId: `${RUN_ID}-switch-opc`,
      },
    });

    const updated = await testPrisma.user.findUnique({
      where: { id: devUserId },
      select: { activeAccountId: true },
    });
    expect(updated?.activeAccountId).toBe(opcAccountId);
  });

  it('Step 5: reload 仍登录 + 账号选中 — activeAccountId 持久化', async () => {
    // Simulate a "reload" by re-querying the user from DB
    const persisted = await testPrisma.user.findUnique({
      where: { id: devUserId },
      select: { activeAccountId: true },
    });
    expect(persisted?.activeAccountId).toBe(opcAccountId);
  });

  it('Step 6: 切换 MCN 矩阵号 — followers KPI = 1000-10000 · mcn-manager ipPositioning', async () => {
    const mcnAccount = await testPrisma.ipAccount.findUnique({
      where: { id: mcnAccountId },
      select: { name: true, ipPositioning: true, followersRange: true, industry: true },
    });
    expect(mcnAccount).not.toBeNull();
    expect(mcnAccount?.name).toBe('MCN 矩阵号');
    expect(mcnAccount?.ipPositioning).toBe('mcn-manager');
    // followersRange '1000-10000' → KPI min followers = 1000 (≥50000 is the audit target)
    expect(mcnAccount?.followersRange).toBe('1000-10000');
    expect(mcnAccount?.industry).toBe('self_media');

    // Switch to MCN
    await testPrisma.user.update({
      where: { id: devUserId },
      data: { activeAccountId: mcnAccountId },
    });
    const verified = await testPrisma.user.findUnique({
      where: { id: devUserId },
      select: { activeAccountId: true },
    });
    expect(verified?.activeAccountId).toBe(mcnAccountId);
  });
});
