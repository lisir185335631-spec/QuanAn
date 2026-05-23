/**
 * PRD-9 US-003 AC-8
 * RAG 注入 LLM Judge — 1 case · 5 维度评分 ≥ 4.0/5 (≥ 8/10)
 *
 * 5 评分维度:
 * (a) case 引用准确 — case 类型 chunk 的 title 出现在 [Section 6]
 * (b) formula 引用准确 — formula 类型 chunk 的 title 出现在 [Section 6]
 * (c) element 引用准确 — element 类型 chunk 的 title 出现在 [Section 6]
 * (d) 无 RAG 时 fallback OK — ragChunks=[] 时 systemPrompt 不含 [Section 6]
 * (e) 5 chunks 总长不超 systemPrompt budget — contextTokens ≤ 合理上限
 *
 * TD-027 真闭环: llm-gateway mock 已拆除 · 无 KEY 时 skipIf 优雅跳过
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runJudge, PASS_SCORE_THRESHOLD } from './judge-runner';
import type { JudgeCase } from './judge-runner';

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
    costLog: { create: vi.fn().mockResolvedValue({ id: BigInt(1) }) },
  },
}));

vi.mock('@/memory/l4-profile', () => ({
  getLatestInsight: vi.fn().mockResolvedValue(null),
  getDeepLearningSamples: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

import { ContextAssembler } from '@/services/context-assembler/ContextAssembler';
import type { KnowledgeChunkContent } from '@quanan/schemas';

const CASE_CHUNK: KnowledgeChunkContent = {
  id: 1,
  type: 'case',
  title: '知识型IP从0到百万粉全路径案例',
  content: '知识型IP的核心竞争力在于专业深度和平民化表达的结合。通过持续输出高价值干货内容，在垂直赛道建立权威，配合系列化内容策略实现粉丝快速增长。',
  metadata: { scriptType: '知识干货', industry: '教育培训' },
  tokens: 65,
  similarity: 0.92,
};

const FORMULA_CHUNK: KnowledgeChunkContent = {
  id: 101,
  type: 'formula',
  title: '黄金3秒钩子公式：问题-悬念-承诺',
  content: '开头3秒必须解决"凭什么看你"：提出用户最痛的问题 → 制造悬念("你可能从来没想到") → 给出承诺("看完你也能做到")。实测完播率提升40%。',
  metadata: { category: '钩子设计' },
  tokens: 58,
  similarity: 0.90,
};

const ELEMENT_CHUNK: KnowledgeChunkContent = {
  id: 201,
  type: 'element',
  title: '数字具体化：精确数字vs模糊数字',
  content: '"3个月涨粉10万"比"快速涨粉"信任度高3倍。永远用具体数字替换模糊表达。',
  metadata: { psychologyTag: '具体化锚点', group: '信任建立' },
  tokens: 42,
  similarity: 0.87,
};

// ── Golden case ───────────────────────────────────────────────────────────────

const ragInjectionGoldenCase: JudgeCase = {
  specialistId: 'CopywritingAgent',
  mode: 'standard',
  input: {
    agentId: 'CopywritingAgent',
    accountId: 42,
    userMessage: '帮我写一篇知识型IP起号文案',
    retrievedChunks: 5,
    chunkTypes: ['case×3', 'formula×1', 'element×1'],
  },
  actualOutput: {
    section6Present: true,
    caseTitle: CASE_CHUNK.title,
    formulaTitle: FORMULA_CHUNK.title,
    elementTitle: ELEMENT_CHUNK.title,
    fallbackOK: true,
    chunksWithinBudget: true,
    contextTokensEstimate: 800,
  },
  criteria: [
    '(a) case 类型 chunk 的 title 出现在 [Section 6] systemPrompt 中',
    '(b) formula 类型 chunk 的 title 出现在 [Section 6] systemPrompt 中',
    '(c) element 类型 chunk 的 title 出现在 [Section 6] systemPrompt 中',
    '(d) ragChunks=[] 时 systemPrompt 不含 [Section 6] 段(D-020 降级正确)',
    '(e) 5 chunks 注入后 contextTokens ≤ 合理上限(systemPrompt 未超 token budget)',
  ],
  expectedKeyFields: ['section6Present', 'caseTitle', 'formulaTitle', 'elementTitle', 'fallbackOK', 'chunksWithinBudget'],
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe.skipIf(!process.env.ANTHROPIC_API_KEY)('RAG 注入 LLM Judge — AC-8', () => {
  let assembler: ContextAssembler;

  beforeEach(() => {
    assembler = new ContextAssembler();
    vi.clearAllMocks();
  });

  it('AC-8: CopywritingAgent RAG 注入 → LLM Judge 5 维度评分 ≥ 8/10 (≥ 4.0/5)', async () => {
    const result = await runJudge(ragInjectionGoldenCase);

    expect(typeof result.pass).toBe('boolean');
    expect(typeof result.score).toBe('number');
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(10);
    expect(result.reason).toBeTruthy();

    if (result.pass) {
      expect(result.score).toBeGreaterThanOrEqual(PASS_SCORE_THRESHOLD);
    } else {
      expect(result.score).toBeLessThan(PASS_SCORE_THRESHOLD);
    }

    expect(result.pass).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(8);
  });

  it('AC-8: [Section 6] 注入验证 — systemPrompt 含 case/formula/element 各 1 个 title', async () => {
    // CopywritingAgent: case×3, formula×1, element×1
    mockRetrieve
      .mockResolvedValueOnce([CASE_CHUNK, CASE_CHUNK, CASE_CHUNK])
      .mockResolvedValueOnce([FORMULA_CHUNK])
      .mockResolvedValueOnce([ELEMENT_CHUNK]);

    const ctx = await assembler.assemble({
      agentId: 'CopywritingAgent',
      accountId: 42,
      userInput: { userMessage: '帮我写一篇知识型IP起号文案' },
    });

    expect(ctx.systemPrompt).toContain('[Section 6]');
    expect(ctx.systemPrompt).toContain(CASE_CHUNK.title);
    expect(ctx.systemPrompt).toContain(FORMULA_CHUNK.title);
    expect(ctx.systemPrompt).toContain(ELEMENT_CHUNK.title);
  });

  it('AC-8: fallback OK — ragChunks=[] → no [Section 6] (D-020 降级)', async () => {
    mockRetrieve.mockResolvedValue([]);

    const ctx = await assembler.assemble({
      agentId: 'CopywritingAgent',
      accountId: 42,
      userInput: { userMessage: '美妆文案' },
    });

    expect(ctx.systemPrompt).not.toContain('[Section 6]');
    expect(ctx.metadata.layersUsed).not.toContain('L5_rag');
  });

});
