/**
 * PRD-9 US-003 AC-7
 * ContextAssembler RAG 注入集成测试 — 3 tests
 * (1) PositioningAgent → systemPrompt 含 [Section 6] + 至少 1 个案例 title 出现
 * (2) CopywritingAgent → case+formula 双类型 至少各 1
 * (3) DiagnosisAgent → 不含 [Section 6](skip)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks ─────────────────────────────────────────────────────────────────────

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
import type { KnowledgeChunkContent } from '@quanqn/schemas';

// ── Fixtures — simulate seeded knowledge chunks ───────────────────────────────

const SEEDED_CASE_CHUNKS: KnowledgeChunkContent[] = [
  {
    id: 1,
    type: 'case',
    title: '美妆教程爆款案例：30秒定妆粉底',
    content: '这是一个真实的美妆类爆款内容案例，通过快节奏展示30秒完成底妆，吸引了100万播放。核心在于场景化+快速价值交付。',
    metadata: { scriptType: '教程类', industry: '美妆个护' },
    tokens: 60,
    similarity: 0.91,
  },
  {
    id: 2,
    type: 'case',
    title: '职场穿搭周系列：7天不重样',
    content: '系列内容策略案例，通过"7天不重样"话题引发用户跟拍热潮，系列标签累计播放破500万。关键：系列感+互动性+易模仿。',
    metadata: { scriptType: '系列类', industry: '服饰穿搭' },
    tokens: 65,
    similarity: 0.88,
  },
  {
    id: 3,
    type: 'case',
    title: '知识型IP定位：财经垂直领域',
    content: '知识IP从0到100万粉的增长路径案例。核心：专业壁垒+平民化表达+高频更新策略。适合有专业背景的创作者。',
    metadata: { scriptType: '知识干货', industry: '财经商业' },
    tokens: 58,
    similarity: 0.85,
  },
];

const SEEDED_FORMULA_CHUNKS: KnowledgeChunkContent[] = [
  {
    id: 101,
    type: 'formula',
    title: '痛点-解决-证明 三段式公式',
    content: '开头3秒说出用户痛点("你是不是也有这个问题？") → 中间展示解决方案 → 结尾用数据/实测证明效果。通用率最高的爆款结构。',
    metadata: { category: '脚本结构' },
    tokens: 55,
    similarity: 0.90,
  },
];

const SEEDED_ELEMENT_CHUNKS_3: KnowledgeChunkContent[] = [
  {
    id: 201,
    type: 'element',
    title: '稀缺性制造：限时限量',
    content: '通过"限时48小时""仅剩最后3个名额"等表达制造紧迫感，触发FOMO心理。配合CTA效果提升2-3倍。',
    metadata: { psychologyTag: 'FOMO', group: '稀缺性触发器' },
    tokens: 48,
    similarity: 0.87,
  },
  {
    id: 202,
    type: 'element',
    title: '社会认同：数字背书',
    content: '"10万人已使用""大众点评4.9分"等具体数字建立社会认同感，降低用户决策成本。',
    metadata: { psychologyTag: '社会认同', group: '信任建立' },
    tokens: 42,
    similarity: 0.84,
  },
  {
    id: 203,
    type: 'element',
    title: '好奇心钩子：悬念开篇',
    content: '以问句或意外结论开头制造悬念，迫使用户停留看完："我用这个方法3个月涨粉10万，但大多数人都不知道..."',
    metadata: { psychologyTag: '好奇心', group: '注意力捕捉' },
    tokens: 50,
    similarity: 0.82,
  },
];

function makeReq(overrides: Partial<AssembleRequest> = {}): AssembleRequest {
  return {
    agentId: 'PositioningAgent',
    accountId: 1,
    userInput: { userMessage: 'IP 起号定位建议' },
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AC-7: RAG 注入集成测试', () => {
  let assembler: ContextAssembler;

  beforeEach(() => {
    assembler = new ContextAssembler();
    vi.clearAllMocks();
  });

  // (1) PositioningAgent → systemPrompt 含 [Section 6] + 至少 1 个案例 title 出现
  it('(1) PositioningAgent seed knowledge → systemPrompt 含 [Section 6] + case title', async () => {
    // Other 8 generative: 3 case + 2 element
    mockRetrieve
      .mockResolvedValueOnce(SEEDED_CASE_CHUNKS)                     // case topK=3
      .mockResolvedValueOnce(SEEDED_ELEMENT_CHUNKS_3.slice(0, 2));    // element topK=2

    const ctx = await assembler.assemble(makeReq({ agentId: 'PositioningAgent' }));

    expect(ctx.systemPrompt).toContain('[Section 6]');
    expect(ctx.systemPrompt).toContain('RAG 知识库参考');
    // At least 1 seeded case title should appear in the prompt
    const hasTitle = SEEDED_CASE_CHUNKS.some((c) => ctx.systemPrompt.includes(c.title));
    expect(hasTitle).toBe(true);
    expect(ctx.metadata.layersUsed).toContain('L5_rag');
  });

  // (2) CopywritingAgent → case+formula 双类型 至少各 1
  it('(2) CopywritingAgent → systemPrompt 含 case + formula 各至少 1 个 title', async () => {
    mockRetrieve
      .mockResolvedValueOnce(SEEDED_CASE_CHUNKS)          // case topK=3
      .mockResolvedValueOnce(SEEDED_FORMULA_CHUNKS)        // formula topK=1
      .mockResolvedValueOnce(SEEDED_ELEMENT_CHUNKS_3.slice(0, 1)); // element topK=1

    const ctx = await assembler.assemble(makeReq({ agentId: 'CopywritingAgent' }));

    expect(ctx.systemPrompt).toContain('[Section 6]');

    // At least 1 case title
    const hasCaseTitle = SEEDED_CASE_CHUNKS.some((c) => ctx.systemPrompt.includes(c.title));
    expect(hasCaseTitle).toBe(true);

    // At least 1 formula title
    const hasFormulaTitle = SEEDED_FORMULA_CHUNKS.some((f) => ctx.systemPrompt.includes(f.title));
    expect(hasFormulaTitle).toBe(true);

    // ragHits covers both case and formula
    const hitTypes = ctx.metadata.ragHits.map((h) => h.source);
    expect(hitTypes).toContain('case');
    expect(hitTypes).toContain('formula');
  });

  // (3) DiagnosisAgent → 不含 [Section 6](non-generative skip)
  it('(3) DiagnosisAgent 非生成型 → 不含 [Section 6] · retrieve not called', async () => {
    const ctx = await assembler.assemble(makeReq({ agentId: 'DiagnosisAgent' }));

    expect(mockRetrieve).not.toHaveBeenCalled();
    expect(ctx.systemPrompt).not.toContain('[Section 6]');
    expect(ctx.metadata.layersUsed).not.toContain('L5_rag');
  });
});
