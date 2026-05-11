/**
 * Unit tests — PRD-9 US-001 AC-10
 * 5 tests: top-K=5 happy / type='case' filter / metadata filter / empty result / EmbeddingWorker fails propagate
 * prisma.$queryRawUnsafe mock + OpenAIEmbeddingWorker mock
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── vi.hoisted — shared mocks ─────────────────────────────────────────────────

const { mockQueryRaw, mockEmbed } = vi.hoisted(() => ({
  mockQueryRaw: vi.fn(),
  mockEmbed: vi.fn(),
}));

// ── Mocks ──────────────────────────────────────────────────────────────────────

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRawUnsafe: mockQueryRaw,
  },
}));

vi.mock('@/workers/embedding/openai-embedding', () => ({
  OpenAIEmbeddingWorker: vi.fn().mockImplementation(() => ({
    embed: mockEmbed,
  })),
}));

// ── Imports after mocks ────────────────────────────────────────────────────────

import { ragRetrieveWorker } from '@/workers/rag/retrieve';

// ── Helpers ────────────────────────────────────────────────────────────────────

const FAKE_EMBEDDING = new Array(1536).fill(0.01);

function makeRow(overrides?: Partial<{
  id: number; type: string; title: string; content: string;
  metadata: unknown; tokens: number; similarity: number;
}>) {
  return {
    id: BigInt(overrides?.id ?? 1),
    type: overrides?.type ?? 'case',
    title: overrides?.title ?? 'Test Title',
    content: overrides?.content ?? 'Test content',
    metadata: overrides?.metadata ?? { scriptType: 'drama', industry: 'education' },
    tokens: BigInt(overrides?.tokens ?? 100),
    similarity: overrides?.similarity ?? 0.85,
  };
}

const BASE_INPUT = {
  query: '如何提升播放量',
  topK: 5,
  accountId: 42,
  traceId: 'tr_rag_test',
};

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockEmbed.mockResolvedValue({ embedding: FAKE_EMBEDDING, tokens: 20, costUsd: 0.00002 });
});

// ── Test 1: happy path top-K=5 ───────────────────────────────────────────────

describe('US-001 AC-10.1: happy path — top-K=5 returns KnowledgeChunkContent[]', () => {
  it('embed → queryRaw → 5 rows mapped to KnowledgeChunkContent with similarity', async () => {
    const rows = Array.from({ length: 5 }, (_, i) =>
      makeRow({ id: i + 1, similarity: 0.9 - i * 0.05 }),
    );
    mockQueryRaw.mockResolvedValueOnce(rows);

    const results = await ragRetrieveWorker.retrieve(BASE_INPUT);

    expect(results).toHaveLength(5);
    expect(results[0]).toMatchObject({
      id: 1,
      type: 'case',
      title: 'Test Title',
      similarity: expect.closeTo(0.9, 2),
    });
    expect(mockEmbed).toHaveBeenCalledOnce();
    expect(mockQueryRaw).toHaveBeenCalledOnce();
  });
});

// ── Test 2: type='case' filter ────────────────────────────────────────────────

describe('US-001 AC-10.2: type filter — type="case" adds WHERE type=$N', () => {
  it('type="case" input → queryRaw called with type in params', async () => {
    mockQueryRaw.mockResolvedValueOnce([makeRow({ type: 'case' })]);

    const results = await ragRetrieveWorker.retrieve({ ...BASE_INPUT, type: 'case' });

    expect(results).toHaveLength(1);
    expect(results[0]?.type).toBe('case');

    // Verify the SQL call includes 'case' as a parameter
    const [_sql, ...params] = mockQueryRaw.mock.calls[0] as [string, ...unknown[]];
    expect(params).toContain('case');
  });
});

// ── Test 3: metadata filter ───────────────────────────────────────────────────

describe('US-001 AC-10.3: metadata filter — metadataFilter adds @> jsonb WHERE clause', () => {
  it('metadataFilter={industry:"finance"} → passed as jsonb param to queryRaw', async () => {
    const filter = { industry: 'finance' };
    mockQueryRaw.mockResolvedValueOnce([makeRow({ metadata: { scriptType: 'vlog', industry: 'finance' } })]);

    const results = await ragRetrieveWorker.retrieve({ ...BASE_INPUT, metadataFilter: filter });

    expect(results).toHaveLength(1);
    const [_sql, ...params] = mockQueryRaw.mock.calls[0] as [string, ...unknown[]];
    // metadataFilter JSON should be in params
    const hasFilter = params.some(
      (p) => typeof p === 'string' && p.includes('finance'),
    );
    expect(hasFilter).toBe(true);
  });
});

// ── Test 4: empty result ──────────────────────────────────────────────────────

describe('US-001 AC-10.4: empty result — no matching chunks → returns []', () => {
  it('queryRaw returns empty array → retrieve returns []', async () => {
    mockQueryRaw.mockResolvedValueOnce([]);

    const results = await ragRetrieveWorker.retrieve(BASE_INPUT);

    expect(results).toEqual([]);
    expect(mockEmbed).toHaveBeenCalledOnce();
  });
});

// ── Test 5: EmbeddingWorker failure propagates ────────────────────────────────

describe('US-001 AC-10.5: EmbeddingWorker failure — error propagates out of retrieve', () => {
  it('embed() throws TRPCError → retrieve propagates same error · queryRaw not called', async () => {
    mockEmbed.mockRejectedValueOnce(
      Object.assign(new Error('INTERNAL_SERVER_ERROR'), { code: 'INTERNAL_SERVER_ERROR' }),
    );

    await expect(ragRetrieveWorker.retrieve(BASE_INPUT)).rejects.toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
    });

    expect(mockQueryRaw).not.toHaveBeenCalled();
  });
});
