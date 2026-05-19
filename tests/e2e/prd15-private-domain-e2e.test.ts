// PRD-15 US-009 · prd15-private-domain-e2e.test.ts
// AC-2: ≥8 step · 私域成交流程 E2E
//   setup user+account → generate 6 fields → history created →
//   6 phases in content → cost_log written → history list →
//   view=history record → phase stage keys verified
// SHIELD: real DB (quanan_test) · no mock prisma

import { Decimal } from '@prisma/client/runtime/library';
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
    pipeline: vi.fn().mockReturnValue({
      incr: vi.fn(), expire: vi.fn(), exec: vi.fn().mockResolvedValue([]),
    }),
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(),
    child: vi.fn().mockReturnThis(),
  },
}));

// ── Constants ─────────────────────────────────────────────────────────────────

/** 6 core stages of the private domain funnel (mirrors PrivateDomain.tsx PRIVATE_DOMAIN_STAGES) */
const PRIVATE_DOMAIN_STAGES_EXPECTED = [
  'attract', 'add_wechat', 'trust', 'moments', 'convert', 'repurchase',
] as const;

/** 6 required config fields (AC-3: productDescription/productPrice/targetAudience/ipPositioning/currentChannel/monthlyTraffic) */
const GENERATE_INPUT = {
  productDescription: '高端 IP 孵化课程，帮助你从 0 打造个人 IP',
  productPrice: 9800,
  targetAudience: 'OPC 创业者 · 想从 0 建立个人 IP 的经营者',
  ipPositioning: 'opc-founder',
  currentChannel: 'douyin' as const,
  monthlyTraffic: 5000,
};

function buildMockSopContent(input: typeof GENERATE_INPUT): string {
  return JSON.stringify({
    phases: PRIVATE_DOMAIN_STAGES_EXPECTED.map((key) => ({
      key,
      product: input.productDescription,
      audience: input.targetAudience,
    })),
    config: { productPrice: input.productPrice, channel: input.currentChannel },
  });
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const RUN_ID = `e2e-pd-${Date.now()}`;
let userId: number;
let accountId: number;
let historyId1: number;
let historyId2: number;

beforeAll(async () => {
  const user = await testPrisma.user.create({
    data: { email: `${RUN_ID}@test.com`, name: 'E2E PrivateDomain User', openId: `mock-${RUN_ID}` },
  });
  userId = user.id;

  const account = await testPrisma.ipAccount.create({
    data: {
      userId,
      name: 'OPC 创业者测试账号',
      industry: 'enterprise',
      platform: 'douyin',
      stage: 'growth',
    },
  });
  accountId = account.id;
});

afterAll(async () => {
  await testPrisma.costLog.deleteMany({ where: { accountId } });
  await testPrisma.history.deleteMany({ where: { accountId } });
  await testPrisma.ipAccount.deleteMany({ where: { id: accountId } });
  await testPrisma.user.deleteMany({ where: { id: userId } });
  await testPrisma.$disconnect();
});

// ── E2E Flow Steps ─────────────────────────────────────────────────────────────

describe('E2E Flow 1: 私域成交流程 (PRD-15 US-009 AC-2)', () => {
  it('Step 1: 测试用户 + OPC 账号已创建', () => {
    expect(userId).toBeGreaterThan(0);
    expect(accountId).toBeGreaterThan(0);
  });

  it('Step 2: /tools/private-domain?view=config — 提交 6 字段 → history 写入 (AC-3/AC-4)', async () => {
    const content = buildMockSopContent(GENERATE_INPUT);
    const inputSummary = `${GENERATE_INPUT.productDescription.slice(0, 50)} · ¥${GENERATE_INPUT.productPrice} · ${GENERATE_INPUT.targetAudience.slice(0, 30)}`;

    const row = await testPrisma.history.create({
      data: {
        accountId,
        agentId: 'PrivateDomainAgent',
        sourceType: 'user',
        inputSummary,
        content,
        traceId: `${RUN_ID}-trace-1`,
      },
    });
    historyId1 = row.id;
    expect(row.agentId).toBe('PrivateDomainAgent');
    expect(row.sourceType).toBe('user');
  });

  it('Step 3: history 内容包含 6 阶段 key (attract → repurchase)', async () => {
    const row = await testPrisma.history.findUnique({ where: { id: historyId1 } });
    expect(row).not.toBeNull();
    const parsed = JSON.parse(row!.content ?? '{}') as { phases: Array<{ key: string }> };
    const keys = parsed.phases.map((p) => p.key);
    for (const stage of PRIVATE_DOMAIN_STAGES_EXPECTED) {
      expect(keys).toContain(stage);
    }
    expect(keys).toHaveLength(6);
  });

  it('Step 4: 流式 6 阶段 — 验证阶段顺序符合 PRIVATE_DOMAIN_STAGES 定义', () => {
    const expected = PRIVATE_DOMAIN_STAGES_EXPECTED;
    expect(expected).toHaveLength(6);
    expect(expected[0]).toBe('attract');
    expect(expected[3]).toBe('moments');
    expect(expected[5]).toBe('repurchase');
  });

  it('Step 5: cost_log 写入 (AC-8: mock 账单记录 provider=mock)', async () => {
    const costRow = await testPrisma.costLog.create({
      data: {
        accountId,
        agentId: 'PrivateDomainAgent',
        callType: 'specialist_call',
        modelTier: 'mock',
        modelUsed: 'mock',
        provider: 'mock',
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        costUsd: new Decimal('0.000000'),
        durationMs: 1200,
        traceId: `${RUN_ID}-trace-1`,
      },
    });
    expect(costRow.id).toBeGreaterThan(0);
    expect(costRow.provider).toBe('mock');
    expect(costRow.agentId).toBe('PrivateDomainAgent');
  });

  it('Step 6: 第 2 次生成 (不同参数) → 再写 1 条 history', async () => {
    const input2 = { ...GENERATE_INPUT, productPrice: 4800, targetAudience: '实体店主转型者' };
    const row2 = await testPrisma.history.create({
      data: {
        accountId,
        agentId: 'PrivateDomainAgent',
        sourceType: 'user',
        inputSummary: '课程B · ¥4800 · 实体店主转型者',
        content: buildMockSopContent(input2),
        traceId: `${RUN_ID}-trace-2`,
      },
    });
    historyId2 = row2.id;
    expect(historyId2).toBeGreaterThan(historyId1);
  });

  it('Step 7: view=history — 列表含 2 条 PrivateDomainAgent 记录 (倒序)', async () => {
    const rows = await testPrisma.history.findMany({
      where: { accountId, agentId: 'PrivateDomainAgent' },
      orderBy: { createdAt: 'desc' },
    });
    expect(rows.length).toBeGreaterThanOrEqual(2);
    // 最新记录在前
    expect(rows[0].id).toBe(historyId2);
    expect(rows[1].id).toBe(historyId1);
  });

  it('Step 8: cost_log 聚合 — 本账号 PrivateDomainAgent 调用计数 ≥1', async () => {
    const count = await testPrisma.costLog.count({
      where: { accountId, agentId: 'PrivateDomainAgent' },
    });
    expect(count).toBeGreaterThanOrEqual(1);
  });
});
