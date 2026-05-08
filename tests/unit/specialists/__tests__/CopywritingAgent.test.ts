/**
 * Unit tests — PRD-4 US-009
 * CopywritingAgent: SSE 流式 · step7 · ≥ 5 tests
 * AC-14: happy / fallback / 流式断流 / heading 校验 / hooks 校验 + modelUsed + config
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  CopywritingAgent,
  CopywritingOutputSchema,
} from '@/specialists/CopywritingAgent';
import { SchemaValidationError } from '@/specialists/base/errors';
import type { ILLMGateway, LLMStreamChunk } from '@/specialists/base/types';

// ── Hoisted shared state ───────────────────────────────────────────────────────

const { mockAssemble, mockCostLogCreate } = vi.hoisted(() => ({
  mockAssemble: vi.fn().mockResolvedValue({
    systemPrompt:
      '- step1: {"industry":"beauty"}\n- step3b: {"coreIdentity":"美妆博主"}\n- step5: {"category":"traffic","topics":[]}',
    userPrompt: '<user_input>{}</user_input>',
    tools: [],
    metadata: {
      contextTokens: 0,
      layersUsed: ['L2_step_data', 'L2_history', 'constants'],
      ragHits: [],
    },
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

/** Produces >= 500 char markdown with # heading and 3+ paragraphs */
function makeValidMarkdown(): string {
  const para = '这是一段爆款文案内容，包含深度干货和有价值的信息，让读者能够得到启发并想要了解更多。\n\n';
  return '# 爆款文案标题：揭秘涨粉 10 万的核心方法\n\n' + para.repeat(20);
}

function makeValidContent() {
  return {
    markdown: makeValidMarkdown(),
    structure: '痛点引入→解决方案→案例佐证→CTA',
    hooks: ['这个方法让我的粉丝翻了 10 倍', '99% 的人不知道的涨粉秘诀'],
    cta: '点击关注，获取更多 IP 起号干货',
  };
}

/** Build a gateway that streams the given content as a single delta chunk */
function makeStreamGateway(content: unknown, model = 'test-model-mock'): ILLMGateway {
  const json = JSON.stringify(content);
  return {
    complete: vi.fn() as unknown as ILLMGateway['complete'],
    stream: vi.fn().mockImplementation(async function* (): AsyncIterable<LLMStreamChunk> {
      yield { type: 'meta', meta: { model } };
      yield { type: 'delta', delta: json };
      yield { type: 'done', tokens: { prompt: 500, completion: 2500, total: 3000 } };
    }),
  };
}

/** Make a gateway that yields incomplete JSON (断流) */
function makeErrorStreamGateway(): ILLMGateway {
  return {
    complete: vi.fn() as unknown as ILLMGateway['complete'],
    stream: vi.fn().mockImplementation(async function* (): AsyncIterable<LLMStreamChunk> {
      yield { type: 'meta', meta: { model: 'test-model-mock' } };
      yield { type: 'delta', delta: '{"markdown":"# 标题\n\n断流了' }; // incomplete JSON
      yield { type: 'done', tokens: { prompt: 100, completion: 50, total: 150 } };
    }),
  };
}

const BASE_REQ = {
  accountId: 42,
  traceId: 'test-trace-009',
  stepKey: 'step7' as const,
  mode: 'step7',
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CopywritingAgent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // AC-1/AC-2: happy path — step7 mode returns valid copywriting output
  it('happy path: step7 returns valid CopywritingOutput with # heading', async () => {
    const content = makeValidContent();
    const agent = new CopywritingAgent(makeStreamGateway(content));
    const res = await agent.execute({ ...BASE_REQ, userInput: {} });

    expect(res.result.markdown).toMatch(/^# .+/m);
    expect(res.result.markdown.length).toBeGreaterThanOrEqual(500);
    expect(res.result.hooks.length).toBeGreaterThanOrEqual(1);
    expect(typeof res.result.structure).toBe('string');
    expect(typeof res.result.cta).toBe('string');
    expect(res.isFallback).toBe(false);
    expect(res.tokensUsed.total).toBe(3000);
    expect(CopywritingOutputSchema.safeParse(res.result).success).toBe(true);
  });

  // AC-10: markdown 不含 # heading → refine 失败 → retry → SchemaValidationError
  it('AC-10: markdown without # heading → refine fails → SchemaValidationError', async () => {
    // No "# heading" line — fails the refine check
    const noHeadingContent = {
      markdown: '这段文案没有标题行，完全没有以 # 开头的行。' + '内容'.repeat(250),
      structure: '痛点→方案',
      hooks: ['一个钩子'],
      cta: '关注我',
    };
    const agent = new CopywritingAgent(makeStreamGateway(noHeadingContent));
    await expect(
      agent.execute({ ...BASE_REQ, userInput: {} }),
    ).rejects.toBeInstanceOf(SchemaValidationError);
  });

  // AC-11: hooks 数组为空 → min(1) 失败 → retry → SchemaValidationError
  it('AC-11: hooks empty array → zod min(1) fails → SchemaValidationError', async () => {
    const noHooksContent = {
      markdown: makeValidMarkdown(),
      structure: '痛点→方案',
      hooks: [], // empty — violates min(1)
      cta: '关注我',
    };
    const agent = new CopywritingAgent(makeStreamGateway(noHooksContent));
    await expect(
      agent.execute({ ...BASE_REQ, userInput: {} }),
    ).rejects.toBeInstanceOf(SchemaValidationError);
  });

  // AC-12: 断流 → JSON.parse 失败 → retry → both fail → SchemaValidationError
  it('AC-12: 断流(incomplete JSON) → retry → SchemaValidationError', async () => {
    const agent = new CopywritingAgent(makeErrorStreamGateway());
    await expect(
      agent.execute({ ...BASE_REQ, userInput: {} }),
    ).rejects.toThrow();
  });

  // AC-13: non-step7 modes throw 'Not implemented · PRD-5'
  it.each(['free', 'boom', 'acquisition'])(
    'AC-13: mode=%s → throws Not implemented · PRD-5',
    async (mode) => {
      const agent = new CopywritingAgent(makeStreamGateway(makeValidContent()));
      await expect(
        agent.execute({ ...BASE_REQ, mode, userInput: {} }),
      ).rejects.toThrow('Not implemented · PRD-5');
    },
  );

  // D-019: modelUsed captured from stream meta chunk — not hardcoded
  it('modelUsed reflects stream meta chunk model (D-019 pattern)', async () => {
    const content = makeValidContent();
    const agent = new CopywritingAgent(makeStreamGateway(content, 'reasoning-model-v99'));
    const res = await agent.execute({ ...BASE_REQ, userInput: {} });
    expect(res.modelUsed).toBe('reasoning-model-v99');
  });

  // Config shape — AC-1 five-layer structure
  it('config has required 5-layer structure', () => {
    const agent = new CopywritingAgent(makeStreamGateway(makeValidContent()));
    expect(agent.config.tools).toContain('llm.stream');
    expect(agent.config.execution.streaming).toBe(true);
    expect(agent.config.execution.timeout_ms).toBe(60_000); // SHIELD REJ-006
    expect(agent.config.execution.model_tier).toBe('reasoning');
    expect(agent.config.knowledge.constants).toContain('hotElements');
    expect(agent.config.knowledge.constants).toContain('scriptTypes');
    expect(agent.config.memory.l2_read).toContain('stepData');
    expect(agent.config.memory.l2_read).toContain('history'); // AC-6
    expect(agent.config.memory.l2_write).toContain('history'); // AC-7
  });
});
