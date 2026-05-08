/**
 * ip-progress.test.ts — US-013
 * getProgress unit tests: 0/9 · 3/9 · 9/9 · account isolation · status filter
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PrismaClient } from '@prisma/client';

import { getProgress, STEP_KEYS_9 } from '@/services/ip-progress/IPProgressService';

function makePrismaMock(rows: { stepKey: string }[]) {
  return {
    stepData: {
      findMany: vi.fn().mockResolvedValue(rows),
    },
  } as unknown as PrismaClient;
}

describe('getProgress', () => {
  it('returns 0/9 with empty completedSteps when no stepData rows exist', async () => {
    const prisma = makePrismaMock([]);
    const result = await getProgress(prisma, 42);

    expect(result.completed).toBe(0);
    expect(result.total).toBe(9);
    expect(result.completedSteps).toHaveLength(0);
  });

  it('returns 3/9 when 3 completed-status rows returned', async () => {
    const prisma = makePrismaMock([
      { stepKey: 'step1' },
      { stepKey: 'step3' },
      { stepKey: 'step5' },
    ]);
    const result = await getProgress(prisma, 1);

    expect(result.completed).toBe(3);
    expect(result.total).toBe(9);
    expect(result.completedSteps).toContain('step1');
    expect(result.completedSteps).toContain('step3');
    expect(result.completedSteps).toContain('step5');
  });

  it('returns 9/9 when all 9 steps completed', async () => {
    const allSteps = [...STEP_KEYS_9].map((key) => ({ stepKey: key }));
    const prisma = makePrismaMock(allSteps);
    const result = await getProgress(prisma, 7);

    expect(result.completed).toBe(9);
    expect(result.total).toBe(9);
    expect(result.completedSteps).toHaveLength(9);
  });

  it('passes correct accountId for account isolation', async () => {
    const prisma = makePrismaMock([]);
    await getProgress(prisma, 99);

    expect(prisma.stepData.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ accountId: 99 }) })
    );
  });

  it('queries only status=completed rows (belt-and-suspenders beyond RLS)', async () => {
    const prisma = makePrismaMock([]);
    await getProgress(prisma, 1);

    expect(prisma.stepData.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'completed' }),
      })
    );
  });

  it('queries only STEP_KEYS_9 (step2 excluded)', async () => {
    const prisma = makePrismaMock([]);
    await getProgress(prisma, 1);

    const call = (prisma.stepData.findMany as ReturnType<typeof vi.fn>).mock.calls[0]![0];
    expect(call.where.stepKey.in).toHaveLength(9);
    expect(call.where.stepKey.in).not.toContain('step2');
  });

  it('switching account ID returns independent progress', async () => {
    const prismaA = makePrismaMock([{ stepKey: 'step1' }]);
    const prismaB = makePrismaMock([]);

    const resultA = await getProgress(prismaA, 10);
    const resultB = await getProgress(prismaB, 20);

    expect(resultA.completed).toBe(1);
    expect(resultB.completed).toBe(0);
    expect(prismaA.stepData.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ accountId: 10 }) })
    );
    expect(prismaB.stepData.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ accountId: 20 }) })
    );
  });
});
