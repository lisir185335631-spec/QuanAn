/**
 * PRD-9 US-003 AC-6
 * ContextAssembler RAG 接通 — 5 unit tests
 * (1) CopywritingAgent RAG hit → 5 chunks (case+formula+element)
 * (2) TopicAgent RAG hit → 5 chunks (element+case)
 * (3) DiagnosisAgent 跳过 RAG → ragChunks []
 * (4) RAG retrieve 失败 → no L5_rag · no [Section 6]
 * (5) contextTokens 算入 RAG chunks 字符
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks(必须在 import 之前声明) ─────────────────────────────────────────────

const { mockRetrieve } = vi.hoisted(() => ({
  mockRetrieve: vi.fn(),
}));

vi.mock('@/workers/rag', () => ({
  ragRetrieveWorker: { retrieve: mockRetrieve },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    stepData: { findMany: vi.fn().mockResolvedValue([]) },
  },
}));

vi.mock('@/memory/l4-profile', () => ({
  getLatestInsight: vi.fn().mockResolvedValue(null),
  getDeepLearningSamples: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// ── Imports ───────────────────────────────────────────────────────────────────

import { ContextAssembler } from '@/services/context-assembler/ContextAssembler';
import type { AssembleRequest } from '@/services/context-assembler/types';
import type { KnowledgeChunkContent } from '@quanan/schemas';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeChunk(type: 'case' | 'formula' | 'element', idx: number): KnowledgeChunkContent {
  return {
    id: idx,
    type,
    title: `${type} title ${idx}`,
    content: `${type} content ${idx} `.repeat(20), // >200 chars for preview test
    metadata: {},
    tokens: 50,
    similarity: 0.85 + idx * 0.01,
  };
}

const CASE_CHUNKS = [makeChunk('case', 1), makeChunk('case', 2), makeChunk('case', 3)];
const FORMULA_CHUNKS = [makeChunk('formula', 10)];
const ELEMENT_CHUNKS_1 = [makeChunk('element', 20)];
const ELEMENT_CHUNKS_3 = [makeChunk('element', 20), makeChunk('element', 21), makeChunk('element', 22)];
const CASE_CHUNKS_2 = [makeChunk('case', 1), makeChunk('case', 2)];

function makeReq(overrides: Partial<AssembleRequest> = {}): AssembleRequest {
  return {
    agentId: 'CopywritingAgent',
    accountId: 42,
    userInput: { userMessage: '美妆文案创作' },
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ContextAssembler RAG AC-6 — 5 unit tests', () => {
  let assembler: ContextAssembler;

  beforeEach(() => {
    assembler = new ContextAssembler();
    vi.clearAllMocks();
  });

  // (1) CopywritingAgent RAG hit → 5 chunks 含 case+formula+element 类型
  it('(1) CopywritingAgent → 3 case + 1 formula + 1 element = 5 chunks · L5_rag', async () => {
    mockRetrieve
      .mockResolvedValueOnce(CASE_CHUNKS)      // case topK=3
      .mockResolvedValueOnce(FORMULA_CHUNKS)    // formula topK=1
      .mockResolvedValueOnce(ELEMENT_CHUNKS_1); // element topK=1

    const ctx = await assembler.assemble(makeReq({ agentId: 'CopywritingAgent' }));

    expect(ctx.metadata.layersUsed).toContain('L5_rag');
    expect(ctx.systemPrompt).toContain('[Section 6]');
    expect(ctx.systemPrompt).toContain('RAG 知识库参考');

    // ragHits should cover all 3 types
    const hitTypes = ctx.metadata.ragHits.map((h) => h.source);
    expect(hitTypes).toContain('case');
    expect(hitTypes).toContain('formula');
    expect(hitTypes).toContain('element');

    // retrieve called 3 times with correct types
    const calls = mockRetrieve.mock.calls;
    expect(calls).toHaveLength(3);
    expect(calls[0]![0]).toMatchObject({ type: 'case', topK: 3 });
    expect(calls[1]![0]).toMatchObject({ type: 'formula', topK: 1 });
    expect(calls[2]![0]).toMatchObject({ type: 'element', topK: 1 });
  });

  // (2) TopicAgent RAG hit → 5 chunks 含 element+case
  it('(2) TopicAgent → 3 element + 2 case = 5 chunks · [Section 6] 注入', async () => {
    mockRetrieve
      .mockResolvedValueOnce(ELEMENT_CHUNKS_3) // element topK=3
      .mockResolvedValueOnce(CASE_CHUNKS_2);   // case topK=2

    const ctx = await assembler.assemble(makeReq({ agentId: 'TopicAgent' }));

    expect(ctx.metadata.layersUsed).toContain('L5_rag');
    expect(ctx.systemPrompt).toContain('[Section 6]');

    const hitTypes = ctx.metadata.ragHits.map((h) => h.source);
    expect(hitTypes).toContain('element');
    expect(hitTypes).toContain('case');

    const calls = mockRetrieve.mock.calls;
    expect(calls).toHaveLength(2);
    expect(calls[0]![0]).toMatchObject({ type: 'element', topK: 3 });
    expect(calls[1]![0]).toMatchObject({ type: 'case', topK: 2 });
  });

  // (3) DiagnosisAgent 跳过 RAG → ragChunks [] · no L5_rag · no [Section 6]
  it('(3) DiagnosisAgent 非生成型 → 跳过 RAG · no L5_rag · no [Section 6]', async () => {
    const ctx = await assembler.assemble(makeReq({ agentId: 'DiagnosisAgent' }));

    expect(mockRetrieve).not.toHaveBeenCalled();
    expect(ctx.metadata.layersUsed).not.toContain('L5_rag');
    expect(ctx.systemPrompt).not.toContain('[Section 6]');
    expect(ctx.metadata.ragHits).toEqual([]);
  });

  // (4) RAG retrieve 失败 → metadata.layersUsed 不含 L5_rag · systemPrompt 不含 [Section 6]
  it('(4) RAG retrieve 失败降级 → no L5_rag · no [Section 6] · assemble 不抛出', async () => {
    mockRetrieve.mockRejectedValue(new Error('embedding failed'));

    const ctx = await assembler.assemble(makeReq({ agentId: 'PositioningAgent' }));

    expect(ctx.metadata.layersUsed).not.toContain('L5_rag');
    expect(ctx.systemPrompt).not.toContain('[Section 6]');
    expect(ctx.metadata.ragHits).toEqual([]);
  });

  // (5) contextTokens 算入 RAG chunks 字符(影响 D-020 token budget)
  it('(5) contextTokens 包含 RAG Section 6 字符(D-020 token budget)', async () => {
    // No RAG case
    mockRetrieve.mockResolvedValue([]);
    const ctxNoRag = await assembler.assemble(makeReq({ agentId: 'CopywritingAgent' }));
    vi.clearAllMocks();

    // With RAG case
    mockRetrieve
      .mockResolvedValueOnce(CASE_CHUNKS)
      .mockResolvedValueOnce(FORMULA_CHUNKS)
      .mockResolvedValueOnce(ELEMENT_CHUNKS_1);
    const ctxWithRag = await assembler.assemble(makeReq({ agentId: 'CopywritingAgent' }));

    // systemPrompt is longer with RAG → contextTokens larger
    expect(ctxWithRag.systemPrompt.length).toBeGreaterThan(ctxNoRag.systemPrompt.length);
    expect(ctxWithRag.metadata.contextTokens).toBeGreaterThan(ctxNoRag.metadata.contextTokens);

    // Verify formula: contextTokens = CJK-aware 加权估算(改进版 · G1)
    // estimateTokens: ASCII ≈ 0.25 token, 非 ASCII(CJK) ≈ 1.5 token
    function estimateTokens(text: string): number {
      const raw = [...text].reduce((n, ch) => n + (ch.charCodeAt(0) < 128 ? 0.25 : 1.5), 0);
      return Math.ceil(raw);
    }
    const expected = estimateTokens(ctxWithRag.systemPrompt) + estimateTokens(ctxWithRag.userPrompt);
    expect(ctxWithRag.metadata.contextTokens).toBe(expected);
  });
});
