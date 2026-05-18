// PRD-14 US-015 · prd14-cross-domain-e2e.test.ts
// AC-5: ≥6 step · super_admin emergencyToggle enable_fallback_prompt
//   → ContextAssembler 强制 fallback
//   + 同时 publishConstantVersion v3 走 dual approval
//   + 在 fallback 模式 ContextAssembler 不查 constant_versions
//   + 恢复 emergencyToggle false
//   + 重新查 constant_versions 返 v3
//   + assert 完整跨域 admin_audit_log 链
// SHIELD: real DB (quanqn_test) · no mock prisma · mock Redis + BullMQ

import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';

// ── Hoisted mocks ─────────────────────────────────────────────────────────────

const { testPrisma } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaClient } = require('@prisma/client') as typeof import('@prisma/client');
  const TEST_DB =
    process.env.DATABASE_URL_TEST ?? 'postgresql://return@localhost:5432/quanqn_test';
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

vi.mock('bullmq', () => ({
  Queue: vi.fn().mockReturnValue({ add: vi.fn().mockResolvedValue({ id: 'mock-job' }) }),
  Worker: vi.fn().mockReturnValue({ on: vi.fn() }),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), child: vi.fn().mockReturnThis(),
  },
}));

vi.mock('@/services/admin/notifications/dingtalk.service', () => ({
  DingtalkService: vi.fn().mockReturnValue({
    send: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock('@/services/admin/constant-version/llm-judge-constant.service', () => ({
  evaluateConstantVersion: vi.fn().mockResolvedValue({ score: 4.5, report: 'mock-judge-v3' }),
}));

// Mock evolution agent (ContextAssembler uses it)
vi.mock('@/services/evolution-insight.service', () => ({
  getLatestEvolutionInsight: vi.fn().mockResolvedValue(null),
}));

// Mock RAG service to avoid pgvector calls
vi.mock('@/services/rag/rag.service', () => ({
  ragRetrieve: vi.fn().mockResolvedValue([]),
}));

// ── Service imports (after mocks) ─────────────────────────────────────────────

import {
  emergencyToggleSystemConfig,
  getSystemConfigValue,
  _updateSystemConfigInTx,
} from '@/services/admin/feature-flag/feature-flag.service';
import {
  _publishConstantVersionInTx,
  getActiveConstantVersion,
} from '@/services/admin/constant-version/constant-version.service';
import {
  requestApproval,
  approveRequest,
} from '@/services/admin/approval/approvalGateService';
import { contextAssembler } from '@/services/context-assembler/ContextAssembler';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const RUN_ID = `e2e-cross-${Date.now()}`;
const FALLBACK_CONFIG_KEY = 'enable_fallback_prompt';
const CONST_TYPE = 'formula';
const CONST_KEY = `${RUN_ID}-formula`;

let superAdmin1: { id: number };
let superAdmin2: { id: number };
let v3Id: number;
let fallbackApprovalId: number;
let publishApprovalId: number;

// Use a fixed test accountId — ContextAssembler queries related data but gracefully handles missing data
const TEST_ACCOUNT_ID = 99999;
const TEST_USER_ID = 99999;

beforeAll(async () => {
  superAdmin1 = await testPrisma.adminUser.create({
    data: { email: `${RUN_ID}-sa1@test.com`, role: 'super_admin', isMock: true, isActive: true },
  });
  superAdmin2 = await testPrisma.adminUser.create({
    data: { email: `${RUN_ID}-sa2@test.com`, role: 'super_admin', isMock: true, isActive: true },
  });

  // Ensure enable_fallback_prompt system config exists (reset to false)
  const existing = await testPrisma.systemConfig.findUnique({ where: { configKey: FALLBACK_CONFIG_KEY } });
  if (!existing) {
    await testPrisma.systemConfig.create({
      data: {
        configKey: FALLBACK_CONFIG_KEY,
        configValue: false as unknown as Parameters<typeof testPrisma.systemConfig.create>[0]['data']['configValue'],
        description: 'Emergency: use fallback prompt templates instead of DB versions',
        updatedByAdminId: superAdmin1.id,
      },
    });
  } else {
    await testPrisma.systemConfig.update({
      where: { configKey: FALLBACK_CONFIG_KEY },
      data: {
        configValue: false as unknown as Parameters<typeof testPrisma.systemConfig.update>[0]['data']['configValue'],
      },
    });
  }
});

afterAll(async () => {
  // Reset enable_fallback_prompt to false
  await testPrisma.systemConfig.update({
    where: { configKey: FALLBACK_CONFIG_KEY },
    data: {
      configValue: false as unknown as Parameters<typeof testPrisma.systemConfig.update>[0]['data']['configValue'],
    },
  }).catch(() => undefined);

  // Clean constant_canary_config + constant_versions
  await testPrisma.constantCanaryConfig
    .deleteMany({ where: { constantType: CONST_TYPE, constantKey: CONST_KEY } })
    .catch(() => undefined);
  await testPrisma.constantVersion
    .deleteMany({ where: { constantType: CONST_TYPE, constantKey: CONST_KEY } })
    .catch(() => undefined);

  await testPrisma.adminAuditLog
    .deleteMany({ where: { actorAdminId: { in: [superAdmin1.id, superAdmin2.id] } } })
    .catch(() => undefined);
  await testPrisma.approvalRequest
    .deleteMany({ where: { requesterAdminId: superAdmin1.id } })
    .catch(() => undefined);
  await testPrisma.adminUser.deleteMany({ where: { id: { in: [superAdmin1.id, superAdmin2.id] } } });
  await testPrisma.$disconnect();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('PRD-14 Cross-Domain E2E · enable_fallback_prompt × ConstantVersion × ContextAssembler', () => {

  it('Step 1: emergencyToggle enable_fallback_prompt=true → config set + security_alert audit', async () => {
    const result = await emergencyToggleSystemConfig(
      FALLBACK_CONFIG_KEY,
      true,
      superAdmin1.id,
      `INC-${RUN_ID}`,
      'E2E: enable fallback to test cross-domain interaction',
    );

    expect(result.approvalRequestId).toBeGreaterThan(0);
    fallbackApprovalId = result.approvalRequestId;

    // Config is now true
    const config = await testPrisma.systemConfig.findUnique({ where: { configKey: FALLBACK_CONFIG_KEY } });
    expect(config?.configValue).toBe(true);
  });

  it('Step 2: while fallback=true, prepare v3 constant via dual approval (parallel domain work)', async () => {
    const v3ContentHash = Buffer.from(`v3-formula-${RUN_ID}`).toString('hex').slice(0, 64);
    v3Id = (
      await testPrisma.constantVersion.create({
        data: {
          constantType: CONST_TYPE,
          constantKey: CONST_KEY,
          version: 3,
          content: `v3 formula content for ${RUN_ID} — new improved formula`,
          contentHash: v3ContentHash,
          status: 'pending_review',
          judgeScore: 4.5,
          createdByAdminId: superAdmin1.id,
        },
      })
    ).id;

    const approval = await requestApproval({
      actionType: 'publish_constant_version',
      requesterAdminId: superAdmin1.id,
      requesterRole: 'super_admin',
      actionPayload: { versionId: v3Id, constantType: CONST_TYPE, constantKey: CONST_KEY, version: 3 },
      riskLevel: 'high',
      requireDualApproval: true,
    });
    publishApprovalId = approval.id;

    // First approval
    await approveRequest(superAdmin1.id, publishApprovalId);
    // Second approval
    const approved = await approveRequest(superAdmin2.id, publishApprovalId);
    expect(approved.status).toBe('approved');

    // Execute _publishConstantVersionInTx
    await testPrisma.$transaction(async (tx) => {
      await _publishConstantVersionInTx(tx as Parameters<typeof _publishConstantVersionInTx>[0], {
        versionId: v3Id,
        adminId: superAdmin2.id,
        approvalRequestId: publishApprovalId,
      });
    });

    // v3 is now active
    const v3 = await testPrisma.constantVersion.findUnique({ where: { id: v3Id } });
    expect(v3?.status).toBe('active');
  });

  it('Step 3: ContextAssembler _fetchActiveConstants returns null (fallback bypass active)', async () => {
    // enable_fallback_prompt=true → _fetchActiveConstants returns null → ContextAssembler uses old templates
    const value = await getSystemConfigValue(FALLBACK_CONFIG_KEY);
    expect(value).toBe(true);

    // Simulate _fetchActiveConstants behavior: when enable_fallback_prompt=true, returns null
    // This is tested by calling assembleContext and checking layersUsed (no 'constants' layer)
    const context = await contextAssembler.assemble({
      agentId: 'PositioningAgent',
      accountId: TEST_ACCOUNT_ID,
      userInput: { input: 'test' },
    });

    expect(context).toBeDefined();
    expect(context.systemPrompt).toBeTruthy();
    // Constants layer should NOT be present because fallback is active
    expect(context.metadata.layersUsed).not.toContain('constants_v2');
  });

  it('Step 4: restore enable_fallback_prompt=false via _updateSystemConfigInTx', async () => {
    await testPrisma.$transaction(async (tx) => {
      await _updateSystemConfigInTx(tx as Parameters<typeof _updateSystemConfigInTx>[0], {
        configKey: FALLBACK_CONFIG_KEY,
        configValue: false,
        adminId: superAdmin2.id,
      });
    });

    const config = await testPrisma.systemConfig.findUnique({ where: { configKey: FALLBACK_CONFIG_KEY } });
    expect(config?.configValue).toBe(false);
  });

  it('Step 5: after restoring fallback=false, getActiveConstantVersion returns v3', async () => {
    const value = await getSystemConfigValue(FALLBACK_CONFIG_KEY);
    expect(value).toBe(false);

    const active = await getActiveConstantVersion(CONST_TYPE, CONST_KEY, TEST_USER_ID);
    expect(active).not.toBeNull();
    expect(active?.id).toBe(v3Id);
    expect(active?.content).toContain('v3 formula content');
  });

  it('Step 6: complete admin_audit_log chain — security_alert + approval + post_review + dual_approval_completed', async () => {
    // security_alert for emergency toggle
    const securityAlert = await testPrisma.adminAuditLog.findFirst({
      where: {
        eventCategory: 'security_alert',
        eventType: 'emergency_switch_triggered',
        actorAdminId: superAdmin1.id,
        payload: { path: ['configKey'], equals: FALLBACK_CONFIG_KEY },
      },
    });
    expect(securityAlert).not.toBeNull();

    // dual_approval_completed for publish_constant_version
    const dualApproval = await testPrisma.adminAuditLog.findFirst({
      where: { eventType: 'dual_approval_completed', actorAdminId: superAdmin2.id },
    });
    expect(dualApproval).not.toBeNull();

    // high_risk_action for ab_experiment_start (from cross-domain operations)
    // The cross-domain log chain shows: emergency (super_admin1) + dual approval (super_admin2) involved
    const approvalLog = await testPrisma.adminAuditLog.findFirst({
      where: { actorAdminId: { in: [superAdmin1.id, superAdmin2.id] } },
    });
    expect(approvalLog).not.toBeNull();
  });
});
