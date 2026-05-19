/**
 * ip-progress-integration.test.ts — US-013 AC-16
 * 真实 DB 插入 stepData → 验证 getProgress 返回正确 N/9
 *
 * Connects to quanan_test. Superuser bypasses RLS — no SET LOCAL ROLE needed here.
 * getProgress uses explicit accountId WHERE so isolation is correct even without RLS.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

import { getProgress, STEP_KEYS_9 } from '@/services/ip-progress/IPProgressService';

const TEST_DB =
  process.env.DATABASE_URL_TEST ?? 'postgresql://return@localhost:5432/quanan_test';

const prisma = new PrismaClient({ datasources: { db: { url: TEST_DB } } });

const RUN_ID = `ip_prog_${Date.now()}`;
let userId: number;
let accountId: number;

beforeAll(async () => {
  const user = await prisma.user.create({
    data: {
      openId: `${RUN_ID}_u`,
      name: 'IP Progress Test User',
      email: `${RUN_ID}@ip-progress.test`,
      loginMethod: 'mock',
    },
  });
  userId = user.id;

  const account = await prisma.ipAccount.create({
    data: { userId, name: 'Test Account', industry: 'tech', platform: 'wechat' },
  });
  accountId = account.id;
});

afterAll(async () => {
  await prisma.stepData.deleteMany({ where: { accountId } });
  await prisma.ipAccount.deleteMany({ where: { userId } });
  await prisma.user.deleteMany({ where: { id: userId } });
  await prisma.$disconnect();
});

describe('getProgress integration', () => {
  it('creates account → inserts 7 stepData completed → progress = 7/9', async () => {
    const step7Keys = ['step1', 'step3', 'step3b', 'step4', 'step4b', 'step5', 'step6'] as const;

    // Insert 7 completed rows
    for (const stepKey of step7Keys) {
      await prisma.stepData.create({
        data: {
          accountId,
          stepKey,
          inputs: {},
          agentId: 'test',
          status: 'completed',
        },
      });
    }

    const result = await getProgress(prisma, accountId);

    expect(result.completed).toBe(7);
    expect(result.total).toBe(9);
    expect(result.completedSteps).toHaveLength(7);
    for (const key of step7Keys) {
      expect(result.completedSteps).toContain(key);
    }
  });

  it('in_progress and failed status rows are NOT counted', async () => {
    // step7 and step8 inserted as non-completed — should not count
    await prisma.stepData.create({
      data: {
        accountId,
        stepKey: 'step7',
        inputs: {},
        agentId: 'test',
        status: 'in_progress',
      },
    });
    await prisma.stepData.create({
      data: {
        accountId,
        stepKey: 'step8',
        inputs: {},
        agentId: 'test',
        status: 'failed',
      },
    });

    const result = await getProgress(prisma, accountId);

    // Still only 7 completed (step7/step8 are in_progress/failed)
    expect(result.completed).toBe(7);
    expect(result.completedSteps).not.toContain('step7');
    expect(result.completedSteps).not.toContain('step8');
  });

  it('step2 is never counted (not in STEP_KEYS_9)', async () => {
    await prisma.stepData.create({
      data: {
        accountId,
        stepKey: 'step2',
        inputs: {},
        agentId: 'test',
        status: 'completed',
      },
    });

    const result = await getProgress(prisma, accountId);

    // step2 completed row exists but STEP_KEYS_9 excludes it
    expect(result.completed).toBe(7);
    expect(result.completedSteps).not.toContain('step2');
    expect(STEP_KEYS_9).not.toContain('step2');
  });
});
