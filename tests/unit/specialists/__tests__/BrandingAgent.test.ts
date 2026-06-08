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

// VALID_STEP3B_CONTENT matches Step3bOutputSchema (PRD-29.8 upgrade:
//   coreIdentity → object; thoughtSystem.coreBeliefs/viewpoints/mottos → objects;
//   contentPersona full fields; trustSystem + roadmap added)
const VALID_STEP3B_CONTENT = {
  coreIdentity: {
    identityTag: '护肤成分党科普达人',
    quote: '成分看懂，护肤不踩雷',
    differentiation: '唯一用数据和成分科学做护肤科普的博主',
    memoryPoints: [
      { title: '成分党', desc: '深度解析护肤成分', practice: '每周发布成分解析视频' },
      { title: '真测评', desc: '亲测产品，不收黑钱', practice: '每月三款真实测评' },
      { title: '避坑专家', desc: '帮用户省钱不踩雷', practice: '每周盘点避坑清单' },
    ],
    traits: [
      { name: '专业', desc: '皮肤科学背景，用数据说话' },
      { name: '真诚', desc: '不接黑钱广告，直说产品缺点' },
      { name: '实用', desc: '每个建议都能立刻用上' },
    ],
  },
  thoughtSystem: {
    coreBeliefs: [
      { belief: '科学护肤优于跟风', reason: '成分数据不说谎', angle: '对比实测' },
      { belief: '成分透明才是真良心', reason: '让用户看清标签', angle: '成分解读' },
      { belief: '护肤需要长期坚持', reason: '皮肤屏障修复需要时间', angle: '周期追踪' },
    ],
    viewpoints: [
      { title: '贵不等于好', desc: '成分决定效果而非价格', exampleTitle: '《百元平替挑战大牌》' },
      { title: '护肤没有捷径', desc: '科学认知才是捷径', exampleTitle: '《三分钟读懂成分表》' },
    ],
    mottos: [
      { motto: '成分看懂，护肤不踩雷', whenToUse: '开场白', effect: '建立专业感' },
      { motto: '科学测评不忽悠', whenToUse: '测评结尾', effect: '强化信任' },
      { motto: '用数据说话', whenToUse: '对比分析时', effect: '增加说服力' },
    ],
  },
  contentPersona: {
    speakingStyle: '理性专业，言简意赅，用数据和案例说话',
    speakingDos: ['多引用成分研究', '展示对比实测数据'],
    speakingDonts: ['不夸大效果', '不接无底线广告'],
    examplePitch: '今天来拆解这款火爆精华的成分表，看看它究竟值不值这个价。',
    visualStyle: {
      style: '简洁白色实验室风',
      outfit: '白大褂或简约白T',
      scene: '实验台或书桌',
      props: ['护肤品', '成分表放大镜'],
    },
    contentPillars: [
      { title: '成分解析', percentage: '40%', frequency: '每周2次', desc: '深度拆解热门成分', cases: ['烟酰胺真相', '视黄醇入门'] },
      { title: '产品测评', percentage: '30%', frequency: '每周1次', desc: '真实使用感受', cases: ['平价精华横评', '百元面霜PK'] },
      { title: '护肤误区', percentage: '20%', frequency: '每周1次', desc: '纠正常见错误认知', cases: ['越洗越油的真相', '防晒误区盘点'] },
      { title: '护肤方案', percentage: '10%', frequency: '每两周1次', desc: '个性化护肤推荐', cases: ['干皮入门方案', '敏感肌修复计划'] },
    ],
  },
  trustSystem: {
    backings: [
      { claim: '皮肤科学专业背景', display: '展示相关证书和研究资质' },
      { claim: '三年成分研究实操经验', display: '分享实验室测试过程' },
    ],
    socialProofs: [
      { proof: '粉丝护肤改善反馈', method: '定期收集粉丝before/after对比' },
    ],
    storyLine: {
      mainStory: '从护肤小白到成分党达人的蜕变之路',
      turningPoint: '发现市面护肤品成分表存在大量误导信息',
      narrationMethod: '用个人经历贯穿每期内容，让专业知识更亲切',
    },
  },
  roadmap: [
    { period: '0-3个月', accent: 'green' as const, goal: '建立专业形象', steps: ['发布10条成分解析', '积累首批铁杆粉丝', '完成品牌定位'] },
    { period: '3-6个月', accent: 'yellow' as const, goal: '扩大影响力', steps: ['跨平台同步运营', '与品牌建立合作', '开设成分课程', '建立粉丝社群'] },
    { period: '6-12个月', accent: 'purple' as const, goal: '商业化变现', steps: ['正版课程上线', '联名产品研发', '线下活动', '品牌代言' ] },
  ],
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
      // New Step3bOutputSchema (PRD-29.8): coreBeliefs/viewpoints/mottos are objects, not plain strings
      expect(result.thoughtSystem.coreBeliefs).toHaveLength(3);
      expect(result.thoughtSystem.viewpoints).toHaveLength(2);
      expect(result.thoughtSystem.mottos).toHaveLength(3);
      expect(result.contentPersona.contentPillars).toHaveLength(4);
      // AC-3 schema validation
      expect(Step3bOutputSchema.safeParse(res.result).success).toBe(true);
      expect(res.isFallback).toBe(false);
      expect(mockCostLogCreate).toHaveBeenCalledOnce();
    });

    it('schema retry: coreBeliefs wrong shape → schema fails twice → fallback (US-015 AC-1)', async () => {
      // US-015: with fallbackTemplate.persona, schema errors now trigger fallback instead of throw
      // coreBeliefs objects missing required fields → Step3bOutputSchema fails
      const badContent = {
        ...VALID_STEP3B_CONTENT,
        thoughtSystem: {
          ...VALID_STEP3B_CONTENT.thoughtSystem,
          coreBeliefs: [{ belief: '信念1' }, { belief: '信念2' }], // missing reason/angle + only 2 (< min 3)
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
