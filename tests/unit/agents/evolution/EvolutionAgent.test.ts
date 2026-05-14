// PRD-13 US-004 · detectAnomalies integration tests
// AC-5: ≥2 it tests: frequent_style_flip 命中 + avoidlist_overflow 命中

import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mock prisma
// ---------------------------------------------------------------------------

const mockEvolutionInsightFindMany = vi.fn();
const mockEvolutionInsightFindFirst = vi.fn();
const mockFeedbackLogFindMany = vi.fn();
const mockEvolutionAnomalyFlagCreate = vi.fn();
const mockEvolutionProfileFindUnique = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    evolutionInsight: {
      findMany: mockEvolutionInsightFindMany,
      findFirst: mockEvolutionInsightFindFirst,
    },
    feedbackLog: {
      findMany: mockFeedbackLogFindMany,
    },
    evolutionAnomalyFlag: {
      create: mockEvolutionAnomalyFlagCreate,
    },
    evolutionProfile: {
      findUnique: mockEvolutionProfileFindUnique,
    },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

const { detectEvolutionAnomalies } = await import(
  '@/services/admin/evolution-health/anomaly-detection.service'
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeInsight(id: number, direction: string, avoidList: string[] = [], preferredCatchphrases: string[] = []) {
  return {
    id,
    direction,
    content: {
      direction,
      insights: { avoidList, preferredCatchphrases, styleTone: 'casual' },
    },
    createdAt: new Date(Date.now() - id * 60 * 60 * 1000), // spread over hours
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('detectAnomalies integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: no feedbacks, no stalled (return recent insight)
    mockFeedbackLogFindMany.mockResolvedValue([]);
    mockEvolutionInsightFindFirst
      .mockResolvedValue({ id: 1, createdAt: new Date() }); // not stalled
    mockEvolutionAnomalyFlagCreate.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
      Promise.resolve({ id: Math.floor(Math.random() * 1000), ...data }),
    );
  });

  it('命中 frequent_style_flip — 3 insights with 2+ direction flips triggers flag', async () => {
    // 3 insights: 综合→创意→综合 = 2 flips
    const insights = [
      makeInsight(1, '综合'),
      makeInsight(2, '创意'),
      makeInsight(3, '综合'),
    ];

    // findMany called multiple times: flip check (sorted asc) + avoidlist check + conflict check
    mockEvolutionInsightFindMany.mockImplementation(({ orderBy, where }: { orderBy?: { createdAt: string }; where?: Record<string, unknown> }) => {
      // Return insights for all findMany calls
      return Promise.resolve(insights);
    });

    const flags = await detectEvolutionAnomalies(42);

    const flipFlag = flags.find((f) => f.anomalyType === 'frequent_style_flip');
    expect(flipFlag).toBeDefined();
    expect(flipFlag?.evidence).toMatchObject({ styleFlipCount: 2 });
    expect(flipFlag?.severity).toBe('medium'); // 2 flips → medium
  });

  it('命中 avoidlist_overflow — >50 unique avoidList terms triggers flag', async () => {
    // Generate 52 unique avoidList terms across insights
    const avoidTerms = Array.from({ length: 52 }, (_, i) => `term_${i}`);
    const chunks = [];
    for (let i = 0; i < avoidTerms.length; i += 10) {
      chunks.push(avoidTerms.slice(i, i + 10));
    }

    const insights = chunks.map((chunk, i) =>
      makeInsight(i + 1, '综合', chunk),
    );

    mockEvolutionInsightFindMany.mockResolvedValue(insights);

    const flags = await detectEvolutionAnomalies(99);

    const overflowFlag = flags.find((f) => f.anomalyType === 'avoidlist_overflow');
    expect(overflowFlag).toBeDefined();
    const evidence = overflowFlag?.evidence as Record<string, unknown>;
    expect(evidence.avoidListCount).toBeGreaterThan(50);
  });

  it('no flag when flip count < 2', async () => {
    // Only 1 flip: 综合→创意
    const insights = [
      makeInsight(1, '综合'),
      makeInsight(2, '创意'),
    ];

    mockEvolutionInsightFindMany.mockResolvedValue(insights);

    const flags = await detectEvolutionAnomalies(7);

    const flipFlag = flags.find((f) => f.anomalyType === 'frequent_style_flip');
    expect(flipFlag).toBeUndefined();
  });

  it('no avoidlist_overflow flag when ≤50 unique terms', async () => {
    // Only 10 unique terms
    const insights = [makeInsight(1, '综合', ['a', 'b', 'c'])];

    mockEvolutionInsightFindMany.mockResolvedValue(insights);

    const flags = await detectEvolutionAnomalies(8);

    const overflowFlag = flags.find((f) => f.anomalyType === 'avoidlist_overflow');
    expect(overflowFlag).toBeUndefined();
  });
});
