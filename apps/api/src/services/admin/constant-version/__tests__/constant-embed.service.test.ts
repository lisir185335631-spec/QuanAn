// PRD-14 US-007 · constant-embed.service.test.ts
// AC-6: ≥ 6 it · 3 constantType 路由 + 失败 catch 不写 cost_log + mock LLMGateway 1536d + evaluateConstantVersion

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoisted mocks ──────────────────────────────────────────────────────────

const mockEmbed = vi.hoisted(() => vi.fn());
const mockExecuteRawUnsafe = vi.hoisted(() => vi.fn());
const mockCostLogCreate = vi.hoisted(() => vi.fn());
const mockConstantVersionUpdate = vi.hoisted(() => vi.fn());

vi.mock('@/workers/llm-gateway', () => ({
  llmGateway: {
    embed: mockEmbed,
  },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $executeRawUnsafe: mockExecuteRawUnsafe,
    costLog: { create: mockCostLogCreate },
    constantVersion: { update: mockConstantVersionUpdate },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// ── Imports (after mocks) ──────────────────────────────────────────────────

import {
  rebuildConstantVectorIndex,
  evaluateConstantVersion,
} from '../constant-embed.service';

// ── Helpers ────────────────────────────────────────────────────────────────

// 1536-dim fake embedding (SHIELD: mock LLMGateway 1536d fake embedding)
const FAKE_EMBEDDING_1536 = new Array<number>(1536).fill(0.1);

// ── Tests ──────────────────────────────────────────────────────────────────

describe('rebuildConstantVectorIndex', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEmbed.mockResolvedValue(FAKE_EMBEDDING_1536);
    mockExecuteRawUnsafe.mockResolvedValue(1);
    mockCostLogCreate.mockResolvedValue({});
  });

  // AC-6 test 1: case type routes correctly
  it('upserts knowledge_chunk with type=case for constantType=case', async () => {
    const result = await rebuildConstantVectorIndex('case', 'opinion_beauty_01', '案例内容', 42);

    expect(mockEmbed).toHaveBeenCalledOnce();
    expect(mockEmbed).toHaveBeenCalledWith('案例内容');

    const [sql, chunkType] = mockExecuteRawUnsafe.mock.calls[0] as [string, ...unknown[]];
    expect(sql).toContain('INSERT INTO knowledge_chunk');
    expect(chunkType).toBe('case');

    expect(result.versionId).toBe(42);
    expect(result.constantType).toBe('case');
    expect(result.constantKey).toBe('opinion_beauty_01');
  });

  // AC-6 test 2: formula type routes correctly
  it('upserts knowledge_chunk with type=formula for constantType=formula', async () => {
    await rebuildConstantVectorIndex('formula', 'pain_hook', '公式内容', 10);

    const [, chunkType] = mockExecuteRawUnsafe.mock.calls[0] as [string, ...unknown[]];
    expect(chunkType).toBe('formula');
  });

  // AC-6 test 3: element type routes correctly
  it('upserts knowledge_chunk with type=element for constantType=element', async () => {
    await rebuildConstantVectorIndex('element', 'greed', '元素内容', 5);

    const [, chunkType] = mockExecuteRawUnsafe.mock.calls[0] as [string, ...unknown[]];
    expect(chunkType).toBe('element');
  });

  // AC-6 test 4: failure — embed throws → does NOT write cost_log
  it('throws and does not write cost_log when LLMGateway.embed fails', async () => {
    mockEmbed.mockRejectedValue(new Error('Gateway unavailable'));

    await expect(
      rebuildConstantVectorIndex('case', 'some_key', 'content', 99),
    ).rejects.toThrow('Gateway unavailable');

    expect(mockCostLogCreate).not.toHaveBeenCalled();
    expect(mockExecuteRawUnsafe).not.toHaveBeenCalled();
  });

  // AC-6 test 5: mock LLMGateway returns 1536-dim embedding + metadata in UPSERT
  it('passes 1536-dim embedding and correct metadata to executeRawUnsafe', async () => {
    await rebuildConstantVectorIndex('formula', 'curiosity_gap', '好奇缺口内容', 7);

    expect(mockEmbed).toHaveBeenCalledWith('好奇缺口内容');

    // SQL template, then $1=chunkType $2=constantKey $3=content $4=metadata $5=vector $6=tokens
    const args = mockExecuteRawUnsafe.mock.calls[0] as [string, ...unknown[]];
    // arg[5] is the vector string ($5)
    const vectorArg = args[5] as string;
    expect(vectorArg).toMatch(/^\[0\.1/);
    expect(vectorArg.split(',').length).toBe(1536);

    // metadata arg[4] must contain versionId ($4)
    const metadataArg = JSON.parse(args[4] as string) as { versionId: number };
    expect(metadataArg.versionId).toBe(7);

    // cost_log written on success
    expect(mockCostLogCreate).toHaveBeenCalledOnce();
    const logData = mockCostLogCreate.mock.calls[0]![0] as { data: { eventType: string } };
    expect(logData.data.eventType).toBe('constant_embed_rebuild');
  });

  // AC-6 test 6: cost_log write failure is swallowed (not propagated)
  it('does not throw when cost_log write fails after successful embed', async () => {
    mockCostLogCreate.mockRejectedValue(new Error('DB write failed'));

    // Should NOT throw even though cost_log fails
    await expect(
      rebuildConstantVectorIndex('element', 'fear', 'fear psychology content', 3),
    ).resolves.toMatchObject({ versionId: 3 });
  });
});

describe('evaluateConstantVersion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConstantVersionUpdate.mockResolvedValue({ id: 1, judgeScore: 4.5 });
  });

  it('isMock=true returns score 4.2-4.8 and writes judgeScore to constantVersion', async () => {
    const result = await evaluateConstantVersion(1, true);

    expect(result.isMock).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(4.2);
    expect(result.score).toBeLessThanOrEqual(4.8);
    expect(result.versionId).toBe(1);

    expect(mockConstantVersionUpdate).toHaveBeenCalledOnce();
    expect(mockConstantVersionUpdate).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { judgeScore: result.score },
    });
  });

  it('isMock=false throws not-implemented error', async () => {
    await expect(evaluateConstantVersion(1, false)).rejects.toThrow(
      'Real LLM Judge not implemented',
    );
  });
});
