/**
 * Unit tests — PRD-4 US-005
 * BrandingAgent: 2 mode × 3 场景(happy / schema-retry / cold start)
 * AC-9: ≥ 6 tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  BrandingAgent,
  Step3OutputSchema,
  Step3bOutputSchema,
} from '@/specialists/BrandingAgent';
import { SchemaValidationError } from '@/specialists/base/errors';
import type { ILLMGateway, InvokeLLMResult } from '@/specialists/base/types';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('@/services/context-assembler/ContextAssembler', () => ({
  contextAssembler: {
    assemble: vi.fn().mockResolvedValue({
      systemPrompt: '[system: BrandingAgent · 品牌顾问]',
      userPrompt: '<user_input>{}</user_input>',
      tools: [],
      metadata: { contextTokens: 0, layersUsed: [], ragHits: [] },
    }),
  },
}));

const { mockCostLogCreate } = vi.hoisted(() => ({
  mockCostLogCreate: vi.fn().mockResolvedValue({ id: BigInt(1) }),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: { costLog: { create: mockCostLogCreate } },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

const VALID_STEP3_CONTENT = {
  nickname: ['美妆小仙女', '护肤成分党', '皮肤科学家', '素颜研究所', '美肤实验室'],
  avatar: { prompt: '专业美妆博主形象', style: '清爽简约' },
  background: {
    prompt: '护肤实验室背景',
    platformVersions: ['竖版1:1', '横版16:9', '方版1:1'],
  },
  bio: [
    { platform: 'douyin', text: '护肤成分党｜每天分享测评' },
    { platform: 'xiaohongshu', text: '成分党护肤｜干皮救星' },
    { platform: 'wechat', text: '专注护肤科普，帮你避坑' },
    { platform: 'kuaishou', text: '实惠好物推荐，护肤不踩雷' },
    { platform: 'bilibili', text: '护肤科普UP主，成分党必看' },
    { platform: 'douyin', text: '深度成分解析，让护肤更科学' },
  ],
  overallStrategy: '聚焦成分党护肤赛道，以科学测评建立专业信任感',
};

const VALID_STEP3B_CONTENT = {
  coreIdentity: '专业护肤成分研究者，帮助用户科学护肤',
  thoughtSystem: {
    coreBeliefs: ['科学护肤优于跟风', '成分透明才是真良心', '护肤需要长期坚持'],
    uniqueViews: ['贵不等于好，成分说了算', '护肤没有捷径只有科学'],
    catchphrases: ['成分看懂，护肤不踩雷', '科学测评不忽悠', '用数据说话'],
  },
  contentPersona: {
    contentPillars: ['成分解析', '产品测评', '护肤误区纠正', '护肤方案定制'],
  },
  trustBuilding: '通过专业成分分析和真实测评数据建立用户信任',
  personaRoadmap: {
    phase1: '0-3个月：建立专业形象，积累核心粉丝',
    phase2: '3-6个月：扩大影响力，布局多平台',
    phase3: '6-12个月：商业化变现，建立品牌合作',
  },
};

function makeGateway(contents: unknown[]): ILLMGateway {
  let callIdx = 0;
  return {
    complete: vi.fn().mockImplementation(async () => {
      const content = contents[callIdx] ?? contents[contents.length - 1];
      callIdx++;
      return {
        content,
        tokens: { prompt: 200, completion: 800, total: 1000 },
        model: 'claude-sonnet-4-6',
      } satisfies InvokeLLMResult;
    }),
  };
}

function makeAgent(gateway?: ILLMGateway): BrandingAgent {
  return new BrandingAgent(gateway);
}

const BASE_REQ = {
  accountId: 42,
  userInput: { industry: 'beauty', positioning: '护肤成分党科普' },
  traceId: 'trace-branding-001',
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('BrandingAgent', () => {
  beforeEach(() => {
    mockCostLogCreate.mockClear();
  });

  // ── packaging mode (step3) ─────────────────────────────────────────────────

  describe('packaging mode (step3)', () => {
    it('happy path: returns valid Step3Output with 5 nicknames, 6 bios, writes cost_log', async () => {
      const agent = makeAgent(makeGateway([VALID_STEP3_CONTENT]));
      const res = await agent.execute({ ...BASE_REQ, mode: 'packaging', stepKey: 'step3' });

      const result = res.result as typeof VALID_STEP3_CONTENT;
      expect(result.nickname).toHaveLength(5);
      expect(result.bio).toHaveLength(6);
      expect(result.background.platformVersions).toHaveLength(3);
      // AC-2 schema validation
      expect(Step3OutputSchema.safeParse(res.result).success).toBe(true);
      expect(res.isFallback).toBe(false);
      // cost_log written
      expect(mockCostLogCreate).toHaveBeenCalledOnce();
      expect(mockCostLogCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            agentId: 'BrandingAgent',
            callType: 'specialist_call',
          }),
        }),
      );
    });

    it('schema retry: nickname wrong length → schema fails twice → fallback (US-015 AC-1)', async () => {
      // US-015: with fallbackTemplate.packaging, schema errors now trigger fallback instead of throw
      const badContent = {
        ...VALID_STEP3_CONTENT,
        nickname: ['名字1', '名字2', '名字3', '名字4'], // only 4 → fails length(5)
      };
      const agent = makeAgent(makeGateway([badContent, badContent]));
      const res = await agent.execute({ ...BASE_REQ, mode: 'packaging' });
      expect(res.isFallback).toBe(true);
      expect(res.modelUsed).toBe('fallback');
      expect(Step3OutputSchema.safeParse(res.result).success).toBe(true);
    });

    it('cold start: succeeds with empty userInput (新用户 · 无历史 stepData)', async () => {
      const agent = makeAgent(makeGateway([VALID_STEP3_CONTENT]));
      const res = await agent.execute({
        ...BASE_REQ,
        mode: 'packaging',
        userInput: {},
      });
      expect(res.result).toBeDefined();
      expect(Step3OutputSchema.safeParse(res.result).success).toBe(true);
    });
  });

  // ── persona mode (step3b) ──────────────────────────────────────────────────

  describe('persona mode (step3b)', () => {
    it('happy path: returns valid Step3bOutput with correct array lengths', async () => {
      const agent = makeAgent(makeGateway([VALID_STEP3B_CONTENT]));
      const res = await agent.execute({ ...BASE_REQ, mode: 'persona', stepKey: 'step3b' });

      const result = res.result as typeof VALID_STEP3B_CONTENT;
      expect(result.thoughtSystem.coreBeliefs).toHaveLength(3);
      expect(result.thoughtSystem.uniqueViews).toHaveLength(2);
      expect(result.thoughtSystem.catchphrases).toHaveLength(3);
      expect(result.contentPersona.contentPillars).toHaveLength(4);
      // AC-3 schema validation
      expect(Step3bOutputSchema.safeParse(res.result).success).toBe(true);
      expect(res.isFallback).toBe(false);
      expect(mockCostLogCreate).toHaveBeenCalledOnce();
    });

    it('schema retry: coreBeliefs wrong length → schema fails twice → fallback (US-015 AC-1)', async () => {
      // US-015: with fallbackTemplate.persona, schema errors now trigger fallback instead of throw
      const badContent = {
        ...VALID_STEP3B_CONTENT,
        thoughtSystem: {
          ...VALID_STEP3B_CONTENT.thoughtSystem,
          coreBeliefs: ['信念1', '信念2', '信念3', '信念4', '信念5'], // 5 instead of 3
        },
      };
      const agent = makeAgent(makeGateway([badContent, badContent]));
      const res = await agent.execute({ ...BASE_REQ, mode: 'persona' });
      expect(res.isFallback).toBe(true);
      expect(res.modelUsed).toBe('fallback');
      expect(Step3bOutputSchema.safeParse(res.result).success).toBe(true);
    });

    it('cold start: succeeds with empty userInput', async () => {
      const agent = makeAgent(makeGateway([VALID_STEP3B_CONTENT]));
      const res = await agent.execute({
        ...BASE_REQ,
        mode: 'persona',
        userInput: {},
      });
      expect(res.result).toBeDefined();
      expect(Step3bOutputSchema.safeParse(res.result).success).toBe(true);
    });
  });

  // ── mode validation ────────────────────────────────────────────────────────

  it('throws on invalid mode (AC-8 runtime check)', async () => {
    const agent = makeAgent(makeGateway([VALID_STEP3_CONTENT]));
    await expect(agent.execute({ ...BASE_REQ, mode: 'invalid_mode' })).rejects.toThrow(
      /invalid mode/,
    );
  });

  it('config: has correct five-layer structure (AC-1)', () => {
    const agent = makeAgent();
    expect(agent.config.agentId).toBe('BrandingAgent');
    expect(agent.config.persona.role).toBe('BrandingAgent');
    expect(agent.config.memory.l2_read).toContain('stepData');
    expect(agent.config.knowledge.constants).toContain('platforms');
    expect(agent.config.tools).toContain('llm.complete');
    expect(agent.config.execution.model_tier).toBe('reasoning');
    expect(agent.config.execution.timeout_ms).toBe(60_000);
    expect(agent.config.execution.retry).toBe(1);
  });
});
