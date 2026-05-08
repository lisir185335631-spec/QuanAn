/**
 * ip-progress.test.ts — PRD-3 US-005 · AC-8
 * IPProgressService unit tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma before importing the service
vi.mock('@/lib/prisma', () => ({
  prisma: {
    stepData: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import { ipProgressService } from '@/agents/base/IPProgressService';

const mockFindMany = prisma.stepData.findMany as ReturnType<typeof vi.fn>;

describe('IPProgressService.progress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 0/9 with empty completedSteps when no stepData rows exist', async () => {
    mockFindMany.mockResolvedValue([]);

    const result = await ipProgressService.progress(42);

    expect(result.completed).toBe(0);
    expect(result.total).toBe(9);
    expect(result.percentage).toBe(0);
    expect(result.completedSteps).toHaveLength(0);
    expect(result.pendingSteps).toHaveLength(9);
    expect(result.nextStep).not.toBeNull();
    expect(result.nextStep?.key).toBe('step1');
  });

  it('correctly counts completed steps from DB rows', async () => {
    mockFindMany.mockResolvedValue([
      { stepKey: 'step1' },
      { stepKey: 'step3' },
      { stepKey: 'step5' },
    ]);

    const result = await ipProgressService.progress(1);

    expect(result.completed).toBe(3);
    expect(result.percentage).toBe(33);
    expect(result.completedSteps).toContain('step1');
    expect(result.completedSteps).toContain('step3');
    expect(result.completedSteps).toContain('step5');
  });

  it('sets nextStep to first incomplete step', async () => {
    mockFindMany.mockResolvedValue([{ stepKey: 'step1' }, { stepKey: 'step3' }]);

    const result = await ipProgressService.progress(1);

    // step1 and step3 done → step3b is next
    expect(result.nextStep?.key).toBe('step3b');
  });

  it('returns nextStep=null when all 9 steps completed', async () => {
    mockFindMany.mockResolvedValue([
      { stepKey: 'step1' },
      { stepKey: 'step3' },
      { stepKey: 'step3b' },
      { stepKey: 'step4' },
      { stepKey: 'step4b' },
      { stepKey: 'step5' },
      { stepKey: 'step6' },
      { stepKey: 'step7' },
      { stepKey: 'step8' },
    ]);

    const result = await ipProgressService.progress(1);

    expect(result.completed).toBe(9);
    expect(result.percentage).toBe(100);
    expect(result.nextStep).toBeNull();
    expect(result.pendingSteps).toHaveLength(0);
  });

  it('ignores unknown stepKeys (not in STEPS constant)', async () => {
    mockFindMany.mockResolvedValue([{ stepKey: 'step1' }, { stepKey: 'unknown-key' }]);

    const result = await ipProgressService.progress(1);

    // Only step1 counted — unknown-key ignored
    expect(result.completed).toBe(1);
  });

  it('queries DB with correct accountId', async () => {
    mockFindMany.mockResolvedValue([]);

    await ipProgressService.progress(99);

    expect(mockFindMany).toHaveBeenCalledWith({
      where: { accountId: 99 },
      select: { stepKey: true },
    });
  });
});
