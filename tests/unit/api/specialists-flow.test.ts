/**
 * Unit tests — PRD-2 US-005
 * 4 Specialist mock routers: privateDomain/diagnosis/evolution(7 new)/deepLearning
 * AC-8: ≥ 16 unit tests · ≥ 1 per procedure
 */

import { describe, it, expect, vi } from 'vitest';
import { privateDomainRouter } from '@/trpc/routers/privateDomain';
import { diagnosisRouter } from '@/trpc/routers/diagnosis';
import { evolutionRouter } from '@/trpc/routers/evolution';
import { deepLearningRouter } from '@/trpc/routers/deepLearning';

// ─── Mock data fixtures ───────────────────────────────────────────────────────

const MOCK_HISTORY_ROW = {
  id: 1,
  content: '[mock]',
  agentId: 'mock',
  traceId: 'test-trace-005',
  createdAt: new Date('2026-01-01'),
};

const MOCK_DIAGNOSIS = {
  id: 10,
  answers: [],
  dimensions: {},
  overallScore: 0,
  inferredStage: 'starter',
  topPriority: '[mock]',
  recommendedSteps: [],
  agentId: 'DiagnosisAgent',
  traceId: 'test-trace-005',
  createdAt: new Date('2026-01-01'),
};

const MOCK_FEEDBACK_LOG = {
  id: 20,
  rating: 'good',
  agentId: 'copywriting',
  comment: null,
  traceId: 'test-trace-005',
  createdAt: new Date('2026-01-01'),
};

const MOCK_ARCHIVE = {
  id: 30,
  sourceType: 'text',
  sample: 'test sample',
  summary: null,
  tags: [],
  userTitle: null,
  userTags: [],
  learningStatus: 'pending',
  isActive: true,
  agentId: 'DeepLearnAgent',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

// ─── Helper: minimal tRPC context with mocked prisma ─────────────────────────

function makeCtx(overrides: Record<string, unknown> = {}) {
  const history = {
    create: vi.fn(async () => ({ ...MOCK_HISTORY_ROW })),
    findMany: vi.fn(async () => [{ ...MOCK_HISTORY_ROW }]),
    delete: vi.fn(async () => ({})),
  };

  const diagnosisReport = {
    create: vi.fn(async () => ({ ...MOCK_DIAGNOSIS })),
    findMany: vi.fn(async () => [{ ...MOCK_DIAGNOSIS }]),
    findFirst: vi.fn(async () => ({ ...MOCK_DIAGNOSIS })),
  };

  const feedbackLog = {
    create: vi.fn(async () => ({ ...MOCK_FEEDBACK_LOG })),
    findMany: vi.fn(async () => [{ ...MOCK_FEEDBACK_LOG }]),
  };

  const evolutionProfile = {
    findUnique: vi.fn(async () => ({ autoEvolutionEnabled: false, currentDirection: '综合', level: 'L1' })),
    upsert: vi.fn(async () => ({ autoEvolutionEnabled: true, currentDirection: '技术圈', level: 'L1' })),
  };

  const evolutionInsight = {
    findMany: vi.fn(async () => []),
  };

  const deepLearningArchive = {
    findMany: vi.fn(async () => [{ ...MOCK_ARCHIVE }]),
    create: vi.fn(async () => ({ ...MOCK_ARCHIVE })),
    update: vi.fn(async () => ({})),
  };

  const deepLearnReviewQueue = {
    create: vi.fn(async () => ({ id: 1, status: 'pending', autoVerdict: 'needs_review' })),
    findMany: vi.fn(async () => [
      {
        id: 1,
        fileName: 'sample.txt',
        fileMime: 'text/plain',
        autoScanResult: { redactedTextPreview: 'sample text', sourcePlatform: '微博', analysis: { coreFormula: '3段式' } },
        status: 'pending',
        uploadedAt: new Date('2026-01-01'),
      },
    ]),
    update: vi.fn(async () => ({})),
    findFirst: vi.fn(async () => null),
  };

  const tx = {
    history,
    diagnosisReport,
    feedbackLog,
    evolutionProfile,
    evolutionInsight,
    deepLearningArchive,
    deepLearnReviewQueue,
    $executeRaw: vi.fn(async () => 0),
  };

  const prisma = {
    history,
    diagnosisReport,
    feedbackLog,
    evolutionProfile,
    evolutionInsight,
    deepLearningArchive,
    deepLearnReviewQueue,
    $transaction: vi.fn(async (fn: (tx: typeof tx) => Promise<unknown>) => fn(tx)),
    _tx: tx,
  };

  return {
    ctx: {
      traceId: 'test-trace-005',
      activeAccountId: 1 as number | null,
      user: { id: 42, activeAccountId: 1 } as { id: number; activeAccountId: number | null } | null,
      prisma,
      req: new Request('http://localhost', { headers: { 'x-trace-id': 'test-trace-005' } }),
      sessionId: 'sess-001',
      ...overrides,
    },
    prisma,
  };
}

const DIAGNOSIS_ANSWERS = Array.from({ length: 8 }, (_, i) => ({
  dimension: `dim_${i + 1}`,
  score: 5,
}));

// ─── privateDomain.generate ──────────────────────────────────────────────────

describe('privateDomain.generate', () => {
  it('AC-7: creates History row with agentId=PrivateDomainAgent and traceId', async () => {
    const { ctx, prisma } = makeCtx();
    const caller = privateDomainRouter.createCaller(ctx);
    const result = await caller.generate({ stepKey: 'step_pd' });
    expect(prisma.history.create).toHaveBeenCalledOnce();
    const createArgs = prisma.history.create.mock.calls[0]?.[0] as {
      data: { agentId: string; traceId: string; content: string };
    };
    expect(createArgs.data.agentId).toBe('PrivateDomainAgent');
    expect(createArgs.data.traceId).toBe('test-trace-005');
    expect(result.content).toBe('[mock]');
  });
});

// ─── diagnosis.generate ──────────────────────────────────────────────────────

describe('diagnosis.generate', () => {
  it('AC-7: creates DiagnosisReport row with agentId=DiagnosisAgent and traceId', async () => {
    const { ctx, prisma } = makeCtx();
    const caller = diagnosisRouter.createCaller(ctx);
    const result = await caller.generate({ answers: DIAGNOSIS_ANSWERS });
    expect(prisma.diagnosisReport.create).toHaveBeenCalledOnce();
    const createArgs = prisma.diagnosisReport.create.mock.calls[0]?.[0] as {
      data: { agentId: string; traceId: string; isFallback: boolean };
    };
    expect(createArgs.data.agentId).toBe('DiagnosisAgent');
    expect(createArgs.data.traceId).toBe('test-trace-005');
    expect(createArgs.data.isFallback).toBe(true);
    expect(result.inferredStage).toBe('starter');
  });

  it('zod: rejects answers array with wrong length', async () => {
    const { ctx } = makeCtx();
    const caller = diagnosisRouter.createCaller(ctx);
    await expect(caller.generate({ answers: DIAGNOSIS_ANSWERS.slice(0, 7) })).rejects.toThrow();
  });
});

// ─── diagnosis.history ───────────────────────────────────────────────────────

describe('diagnosis.history', () => {
  it('calls diagnosisReport.findMany with default limit=10', async () => {
    const { ctx, prisma } = makeCtx();
    const caller = diagnosisRouter.createCaller(ctx);
    const result = await caller.history({});
    expect(prisma.diagnosisReport.findMany).toHaveBeenCalledOnce();
    const args = prisma.diagnosisReport.findMany.mock.calls[0]?.[0] as { take: number };
    expect(args.take).toBe(10);
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─── diagnosis.latest ────────────────────────────────────────────────────────

describe('diagnosis.latest', () => {
  it('calls diagnosisReport.findFirst ordered by createdAt desc', async () => {
    const { ctx, prisma } = makeCtx();
    const caller = diagnosisRouter.createCaller(ctx);
    const result = await caller.latest();
    expect(prisma.diagnosisReport.findFirst).toHaveBeenCalledOnce();
    const args = prisma.diagnosisReport.findFirst.mock.calls[0]?.[0] as {
      orderBy: { createdAt: string };
    };
    expect(args.orderBy.createdAt).toBe('desc');
    expect(result).not.toBeNull();
  });

  it('returns null when no reports found', async () => {
    const { ctx, prisma } = makeCtx();
    prisma.diagnosisReport.findFirst.mockResolvedValueOnce(null);
    const caller = diagnosisRouter.createCaller(ctx);
    const result = await caller.latest();
    expect(result).toBeNull();
  });
});

// ─── evolution.evolve ────────────────────────────────────────────────────────

describe('evolution.evolve', () => {
  it('AC-7: creates FeedbackLog row with rating and agentId', async () => {
    const { ctx, prisma } = makeCtx();
    const caller = evolutionRouter.createCaller(ctx);
    const result = await caller.evolve({
      rating: 'good',
      agentId: 'copywriting',
      rateableId: 1,
    });
    expect(result.ok).toBe(true);
    expect(result.feedbackId).toBe(MOCK_FEEDBACK_LOG.id);
    expect(prisma.feedbackLog.create).toHaveBeenCalledOnce();
    const createArgs = prisma.feedbackLog.create.mock.calls[0]?.[0] as {
      data: { rating: string; agentId: string };
    };
    expect(createArgs.data.rating).toBe('good');
    expect(createArgs.data.agentId).toBe('copywriting');
  });
});

// ─── evolution.getConfig ─────────────────────────────────────────────────────

describe('evolution.getConfig', () => {
  it('returns profile config when profile exists', async () => {
    const { ctx } = makeCtx();
    const caller = evolutionRouter.createCaller(ctx);
    const result = await caller.getConfig();
    expect(result).toMatchObject({ autoEvolutionEnabled: false, currentDirection: '综合', level: 'L1' });
  });

  it('returns default config when profile does not exist', async () => {
    const { ctx, prisma } = makeCtx();
    prisma.evolutionProfile.findUnique.mockResolvedValueOnce(null);
    const caller = evolutionRouter.createCaller(ctx);
    const result = await caller.getConfig();
    expect(result.level).toBe('L1');
    expect(result.currentDirection).toBe('综合');
    expect(result.autoEvolutionEnabled).toBe(false);
  });
});

// ─── evolution.updateConfig ──────────────────────────────────────────────────

describe('evolution.updateConfig', () => {
  it('upserts EvolutionProfile and returns ok + updated config', async () => {
    const { ctx, prisma } = makeCtx();
    const caller = evolutionRouter.createCaller(ctx);
    const result = await caller.updateConfig({ autoEvolutionEnabled: true });
    expect(result.ok).toBe(true);
    expect(result.config.autoEvolutionEnabled).toBe(true);
    expect(prisma.evolutionProfile.upsert).toHaveBeenCalledOnce();
  });
});

// ─── evolution.history ───────────────────────────────────────────────────────

describe('evolution.history', () => {
  it('calls evolutionInsight.findMany with default limit=20', async () => {
    const { ctx, prisma } = makeCtx();
    const caller = evolutionRouter.createCaller(ctx);
    const result = await caller.history({});
    expect(prisma.evolutionInsight.findMany).toHaveBeenCalledOnce();
    const args = prisma.evolutionInsight.findMany.mock.calls[0]?.[0] as { take: number };
    expect(args.take).toBe(20);
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─── evolution.recentFeedback ────────────────────────────────────────────────

describe('evolution.recentFeedback', () => {
  it('calls feedbackLog.findMany and returns array', async () => {
    const { ctx, prisma } = makeCtx();
    const caller = evolutionRouter.createCaller(ctx);
    const result = await caller.recentFeedback({});
    expect(prisma.feedbackLog.findMany).toHaveBeenCalledOnce();
    expect(Array.isArray(result)).toBe(true);
  });

  it('passes agentId filter to where clause when provided', async () => {
    const { ctx, prisma } = makeCtx();
    const caller = evolutionRouter.createCaller(ctx);
    await caller.recentFeedback({ agentId: 'copywriting' });
    const args = prisma.feedbackLog.findMany.mock.calls[0]?.[0] as {
      where?: { agentId: string };
    };
    expect(args.where?.agentId).toBe('copywriting');
  });
});

// ─── evolution.feedbackTrend ─────────────────────────────────────────────────

describe('evolution.feedbackTrend', () => {
  it('returns mock trend data with requested days', async () => {
    const { ctx } = makeCtx();
    const caller = evolutionRouter.createCaller(ctx);
    const result = await caller.feedbackTrend({ days: 14 });
    expect(result.days).toBe(14);
    expect(Array.isArray(result.data)).toBe(true);
  });
});

// ─── evolution.moduleRanking ─────────────────────────────────────────────────

describe('evolution.moduleRanking', () => {
  it('returns mock ranking array', async () => {
    const { ctx } = makeCtx();
    const caller = evolutionRouter.createCaller(ctx);
    const result = await caller.moduleRanking({ limit: 5 });
    expect(Array.isArray(result.ranking)).toBe(true);
  });
});

// ─── deepLearning.list ───────────────────────────────────────────────────────

describe('deepLearning.list', () => {
  it('calls deepLearnReviewQueue.findMany with accountId filter by default', async () => {
    const { ctx, prisma } = makeCtx();
    const caller = deepLearningRouter.createCaller(ctx);
    const result = await caller.list({});
    expect(prisma.deepLearnReviewQueue.findMany).toHaveBeenCalledOnce();
    const args = prisma.deepLearnReviewQueue.findMany.mock.calls[0]?.[0] as {
      where?: { accountId: number };
    };
    expect(args.where?.accountId).toBe(1);
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─── deepLearning.create ─────────────────────────────────────────────────────

describe('deepLearning.create', () => {
  it('enqueues to deepLearnReviewQueue (LD-A-5: no direct archive.create)', async () => {
    const { ctx, prisma } = makeCtx();
    const caller = deepLearningRouter.createCaller(ctx);
    const result = await caller.create({ sample: 'this is my sample text' });
    expect(prisma.deepLearnReviewQueue.create).toHaveBeenCalledOnce();
    expect(prisma.deepLearningArchive.create).not.toHaveBeenCalled();
    expect(result.ok).toBe(true);
    expect(result.queueId).toBe(1);
    expect(result.status).toBe('pending');
  });
});

// ─── deepLearning.createFromFile ─────────────────────────────────────────────

describe('deepLearning.createFromFile', () => {
  it('enqueues to deepLearnReviewQueue with fileUrl (LD-A-5: no direct archive.create)', async () => {
    const { ctx, prisma } = makeCtx();
    const caller = deepLearningRouter.createCaller(ctx);
    const result = await caller.createFromFile({ fileUrl: 'https://example.com/doc.pdf' });
    expect(prisma.deepLearnReviewQueue.create).toHaveBeenCalledOnce();
    expect(prisma.deepLearningArchive.create).not.toHaveBeenCalled();
    const createArgs = prisma.deepLearnReviewQueue.create.mock.calls[0]?.[0] as {
      data: { fileUrl: string };
    };
    expect(createArgs.data.fileUrl).toBe('https://example.com/doc.pdf');
    expect(result.ok).toBe(true);
    expect(result.status).toBe('pending');
  });
});

// ─── deepLearning.learn ──────────────────────────────────────────────────────

describe('deepLearning.learn', () => {
  it('updates archive learningStatus to pending and returns {ok:true, status:"queued"}', async () => {
    const { ctx, prisma } = makeCtx();
    const caller = deepLearningRouter.createCaller(ctx);
    const result = await caller.learn({ archiveId: 30 });
    expect(result).toEqual({ ok: true, status: 'queued' });
    expect(prisma.deepLearningArchive.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 30 }, data: { learningStatus: 'pending' } }),
    );
  });
});

// ─── deepLearning.delete ─────────────────────────────────────────────────────

describe('deepLearning.delete', () => {
  it('soft-cancels queue entry by setting status=cancelled', async () => {
    const { ctx, prisma } = makeCtx();
    const caller = deepLearningRouter.createCaller(ctx);
    const result = await caller.delete({ archiveId: 30 });
    expect(result).toEqual({ ok: true });
    expect(prisma.deepLearnReviewQueue.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ id: 30 }), data: { status: 'cancelled' } }),
    );
  });
});
