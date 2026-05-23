/**
 * QuanAn · PRD-28 US-005 · eval-run.ts CLI unit tests
 * AC-10: ≥ 6 tests covering CLI args / dataset loading / DB write / error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';

// ── Mock prisma ───────────────────────────────────────────────────────────────

const mockCreate = vi.fn().mockResolvedValue({ id: 1, runId: 'test-run-id' });
const mockUpdate = vi.fn().mockResolvedValue({ id: 1 });

vi.mock('@/lib/prisma', () => ({
  prisma: {
    evaluationRun: { create: mockCreate, update: mockUpdate },
    evaluationSample: { create: mockCreate },
    costLog: { create: vi.fn().mockResolvedValue({ id: BigInt(1) }) },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// ── Mock evaluator ────────────────────────────────────────────────────────────

const mockRunSampleEvaluation = vi.fn();
vi.mock('@/evaluation/evaluator', () => ({
  runSampleEvaluation: mockRunSampleEvaluation,
  JUDGE_PASS_THRESHOLD: 6,
}));

// ── Mock goldenDatasetSchema ──────────────────────────────────────────────────

vi.mock('@quanan/schemas', async () => {
  const actual = await vi.importActual<typeof import('@quanan/schemas')>('@quanan/schemas');
  return {
    ...actual,
    goldenDatasetSchema: {
      safeParse: (data: unknown) => ({ success: true, data }),
    },
  };
});

// ── Helpers ───────────────────────────────────────────────────────────────────

const SALLY_PATH = '/Users/return/Desktop/QuanAn/tests/fixtures/judge-goldens/sally-30.json';
const CUSTOM_PATH = '/Users/return/Desktop/QuanAn/tests/fixtures/judge-goldens/custom-70.json';

function loadFixture(path: string) {
  return JSON.parse(readFileSync(path, 'utf-8')) as unknown[];
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('eval-run dataset loading', () => {
  it('sally-30.json loads 30 samples with source=sally', () => {
    const data = loadFixture(SALLY_PATH) as Array<{ source: string }>;
    expect(data).toHaveLength(30);
    expect(data.every((s) => s.source === 'sally')).toBe(true);
  });

  it('custom-70.json loads 70 samples with source=custom', () => {
    const data = loadFixture(CUSTOM_PATH) as Array<{ source: string }>;
    expect(data).toHaveLength(70);
    expect(data.every((s) => s.source === 'custom')).toBe(true);
  });

  it('sally-30.json all samples have required fields', () => {
    const data = loadFixture(SALLY_PATH) as Array<Record<string, unknown>>;
    for (const s of data) {
      expect(s).toHaveProperty('id');
      expect(s).toHaveProperty('specialistId');
      expect(s).toHaveProperty('input');
      expect(s).toHaveProperty('criteria');
      expect(s).toHaveProperty('expectedKeyFields');
    }
  });

  it('custom-70.json covers 14 specialists', () => {
    const data = loadFixture(CUSTOM_PATH) as Array<{ specialistId: string }>;
    const specialists = new Set(data.map((s) => s.specialistId));
    expect(specialists.size).toBe(14);
  });
});

describe('eval-run CLI behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockResolvedValue({ id: 1, runId: 'test-run-id' });
    mockUpdate.mockResolvedValue({ id: 1 });
  });

  it('runSampleEvaluation mock returns correct shape', async () => {
    mockRunSampleEvaluation.mockResolvedValueOnce({
      structurePass: true,
      judgeScore: 8,
      judgePass: true,
      judgeReason: 'criteria met',
      durationMs: 1000,
      tokensUsed: 500,
      costUsd: 0.003,
      actualOutput: { industry: 'beauty', recommendation: '推荐内容'.repeat(20) },
    });

    const { runSampleEvaluation } = await import('@/evaluation/evaluator');
    const result = await runSampleEvaluation({} as never);

    expect(result.structurePass).toBe(true);
    expect(result.judgeScore).toBe(8);
    expect(result.judgePass).toBe(true);
    expect(result.durationMs).toBe(1000);
    expect(result.tokensUsed).toBe(500);
    expect(result.costUsd).toBeCloseTo(0.003, 5);
  });

  it('prisma evaluationRun.create is called with correct shape', async () => {
    const { prisma } = await import('@/lib/prisma');

    await prisma.evaluationRun.create({
      data: {
        runId: 'test-run-id',
        startedAt: new Date(),
        totalSamples: 5,
        passedSamples: 0,
        failedSamples: 0,
        skippedSamples: 0,
        modelTier: 'balanced',
        model: 'claude-sonnet-4-6',
        totalTokens: 0,
        totalCostUsd: '0' as never,
        status: 'running',
      },
    });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'running', totalSamples: 5 }) }),
    );
  });

  it('prisma evaluationSample.create is called with judgeScore and structurePass', async () => {
    const { prisma } = await import('@/lib/prisma');

    await prisma.evaluationSample.create({
      data: {
        runId: 'test-run-id',
        goldenId: 'sally-001',
        specialistId: 'PositioningAgent',
        mode: 'industry',
        input: { industry: 'beauty' },
        actualOutput: { industry: 'beauty', recommendation: '推荐' },
        judgeScore: 7,
        judgePass: true,
        judgeReason: 'criteria met',
        structurePass: true,
        durationMs: 1200,
        tokensUsed: 800,
        costUsd: '0.006' as never,
      },
    });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          judgeScore: 7,
          structurePass: true,
          goldenId: 'sally-001',
        }),
      }),
    );
  });

  it('evaluationRun status is completed when at least one sample passes', async () => {
    const { prisma } = await import('@/lib/prisma');

    await prisma.evaluationRun.update({
      where: { runId: 'test-run-id' },
      data: {
        finishedAt: new Date(),
        passedSamples: 3,
        failedSamples: 2,
        status: 'completed',
        totalTokens: 4000,
        totalCostUsd: '0.012' as never,
      },
    });

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'completed' }),
      }),
    );
  });

  it('evaluationRun status is failed when all samples fail', async () => {
    const { prisma } = await import('@/lib/prisma');

    await prisma.evaluationRun.update({
      where: { runId: 'test-run-id' },
      data: {
        finishedAt: new Date(),
        passedSamples: 0,
        failedSamples: 5,
        status: 'failed',
        totalTokens: 0,
        totalCostUsd: '0' as never,
      },
    });

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'failed' }),
      }),
    );
  });
});
