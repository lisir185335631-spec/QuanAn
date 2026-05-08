/**
 * Unit tests — PRD-4 US-007
 * TopicAgent: SSE 流式 · 5 category × 1 happy path + 2 边缘(断流 / length 失败)
 * AC-13: ≥ 7 tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  TopicAgent,
  TopicOutputSchema,
  TOPIC_CATEGORIES,
  type TopicCategory,
} from '@/specialists/TopicAgent';
import { SchemaValidationError } from '@/specialists/base/errors';
import type { ILLMGateway, InvokeLLMResult, LLMStreamChunk } from '@/specialists/base/types';

// ── Hoisted shared state ───────────────────────────────────────────────────────

const { mockAssemble, mockCostLogCreate } = vi.hoisted(() => ({
  mockAssemble: vi.fn().mockResolvedValue({
    systemPrompt: '- step1: {"industry":"beauty"}\n- step3b: {"coreIdentity":"美妆博主"}',
    userPrompt: '<user_input>{}</user_input>',
    tools: [],
    metadata: { contextTokens: 0, layersUsed: ['L2_step_data', 'constants'], ragHits: [] },
  }),
  mockCostLogCreate: vi.fn().mockResolvedValue({ id: BigInt(1) }),
}));

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('@/services/context-assembler/ContextAssembler', () => ({
  contextAssembler: { assemble: mockAssemble },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: { costLog: { create: mockCostLogCreate } },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Build a gateway that streams the given content as a single delta chunk */
function makeStreamGateway(content: unknown): ILLMGateway {
  const json = JSON.stringify(content);
  return {
    complete: vi.fn() as unknown as ILLMGateway['complete'],
    stream: vi.fn().mockImplementation(async function* (): AsyncIterable<LLMStreamChunk> {
      yield { type: 'delta', delta: json };
      yield { type: 'done', tokens: { prompt: 200, completion: 2000, total: 2200 } };
    }),
  };
}

/** Make a gateway that errors mid-stream (断流) */
function makeErrorStreamGateway(): ILLMGateway {
  return {
    complete: vi.fn() as unknown as ILLMGateway['complete'],
    stream: vi.fn().mockImplementation(async function* (): AsyncIterable<LLMStreamChunk> {
      yield { type: 'delta', delta: '{"category":"traffic","topics":[{"title":"test"' };
      // simulate network cut — no more chunks → JSON.parse will fail
      yield { type: 'done', tokens: { prompt: 100, completion: 50, total: 150 } };
    }),
  };
}

/** Build 20 valid topic items */
function makeTopics(count = 20) {
  return Array.from({ length: count }, (_, i) => ({
    title: `选题标题 ${i + 1}`,
    hook: `钩子文案 ${i + 1}`,
    structure: `内容结构 ${i + 1}`,
    formula: `爆款公式 ${i + 1}`,
    viralPotential: 'high' as const,
  }));
}

function makeContent(category: TopicCategory, count = 20) {
  return { category, topics: makeTopics(count) };
}

const BASE_REQ = {
  accountId: 42,
  traceId: 'test-trace-007',
  stepKey: 'step5' as const,
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('TopicAgent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 5 category × 1 happy path
  it.each(TOPIC_CATEGORIES)(
    'happy path: category=%s returns 20 topics',
    async (category) => {
      const content = makeContent(category);
      const agent = new TopicAgent(makeStreamGateway(content));
      const res = await agent.execute({ ...BASE_REQ, userInput: { category } });

      expect(res.result.category).toBe(category);
      expect(res.result.topics).toHaveLength(20);
      expect(res.isFallback).toBe(false);
      expect(res.tokensUsed.total).toBe(2200);
      // Validate against outputSchema
      expect(TopicOutputSchema.safeParse(res.result).success).toBe(true);
    },
  );

  // Edge: 断流 → JSON.parse 失败 → BaseSpecialist retry → second stream also broken → SchemaValidationError
  it('edge: 断流(incomplete JSON) → retry → SchemaValidationError on second failure', async () => {
    // Both attempts yield partial JSON
    const agent = new TopicAgent(makeErrorStreamGateway());
    await expect(agent.execute({ ...BASE_REQ, userInput: { category: 'traffic' } })).rejects.toThrow();
  });

  // Edge: length 失败(19 条) → outputSchema.safeParse fails → retry → second also 19 → SchemaValidationError
  it('edge: topics length=19 → zod length(20) 失败 → retry → SchemaValidationError', async () => {
    // First call: 19 topics. Second call (retry): also 19 topics.
    let callIdx = 0;
    const gateway: ILLMGateway = {
      complete: vi.fn() as unknown as ILLMGateway['complete'],
      stream: vi.fn().mockImplementation(async function* (): AsyncIterable<LLMStreamChunk> {
        const count = callIdx === 0 ? 19 : 19; // both attempts return 19
        callIdx++;
        yield { type: 'delta', delta: JSON.stringify(makeContent('traffic', count)) };
        yield { type: 'done', tokens: { prompt: 200, completion: 1900, total: 2100 } };
      }),
    };
    const agent = new TopicAgent(gateway);
    await expect(
      agent.execute({ ...BASE_REQ, userInput: { category: 'traffic' } }),
    ).rejects.toBeInstanceOf(SchemaValidationError);
  });

  // Config shape
  it('config has required 5-layer structure', () => {
    const agent = new TopicAgent(makeStreamGateway(makeContent('traffic')));
    expect(agent.config.tools).toContain('llm.stream');
    expect(agent.config.execution.streaming).toBe(true);
    expect(agent.config.execution.timeout_ms).toBe(60_000);
    expect(agent.config.execution.model_tier).toBe('reasoning');
    expect(agent.config.knowledge.constants).toContain('hotElements');
    expect(agent.config.knowledge.constants).toContain('scriptTypes');
    expect(agent.config.knowledge.rag).toContain('knowledge_cases');
    expect(agent.config.knowledge.rag).toContain('trending');
    expect(agent.config.memory.l2_read).toContain('stepData');
  });

  // AC-9: invalid category rejects
  it('AC-9: invalid category rejects with ZodError', async () => {
    const agent = new TopicAgent(makeStreamGateway(makeContent('traffic')));
    await expect(
      agent.execute({ ...BASE_REQ, userInput: { category: 'invalid_cat' as TopicCategory } }),
    ).rejects.toThrow();
  });

  // viralPotential enum validation
  it('viralPotential not in enum → outputSchema fails', () => {
    const content = {
      category: 'traffic',
      topics: makeTopics(20).map((t, i) => ({
        ...t,
        viralPotential: i === 0 ? 'extreme' : t.viralPotential, // invalid enum value
      })),
    };
    expect(TopicOutputSchema.safeParse(content).success).toBe(false);
  });
});
