/**
 * G1 token 预算约束 · ContextAssembler 真裁剪测试
 *
 * 4 场景:
 *   A. 超大 stepData  → step 被截、旧 step 不在、新 step 在、trimmed 含 step_data_truncated
 *   B. 超大 RAG chunks → RAG 被截/丢、低优先层(DB constants)被丢、trimmed 含 rag/rag_truncated
 *   C. 正常小输入    → 不裁剪 trimmed: []
 *   D. userPrompt 单独超 MAX → systemPrompt 只剩 persona + trimmed 包含全部层
 *
 * 铁律证据:
 *   - 用真实 estimateTokens 跑(不 mock 掉估算)
 *   - 断言最终 contextTokens ≤ MAX_CONTEXT_TOKENS
 *   - 断言 persona 仍在
 *   - 断言低优先层在超预算时被丢/截
 *
 * 注: 测试使用自定义低预算(TEST_BUDGET)模拟超预算场景，不修改生产代码。
 * 实现方式：通过 vi.spyOn 临时覆盖模块导出的常量。
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoisted mock 函数引用 ─────────────────────────────────────────────────────

const {
  mockStepDataFindMany,
  mockGetLatestInsight,
  mockRagRetrieve,
  mockGetSystemConfigValue,
  mockGetActivePromptVersion,
  mockMethodologyGetAll,
  mockConstantVersionCount,
  mockConstantCanaryConfigFindMany,
  mockCostLogCreate,
} = vi.hoisted(() => ({
  mockStepDataFindMany: vi.fn(),
  mockGetLatestInsight: vi.fn(),
  mockRagRetrieve: vi.fn(),
  mockGetSystemConfigValue: vi.fn().mockResolvedValue(false),
  mockGetActivePromptVersion: vi.fn().mockResolvedValue(null),
  mockMethodologyGetAll: vi.fn(),
  mockConstantVersionCount: vi.fn().mockResolvedValue(0),
  mockConstantCanaryConfigFindMany: vi.fn().mockResolvedValue([]),
  mockCostLogCreate: vi.fn().mockResolvedValue({ id: 1 }),
}));

// ── 模块 mock ─────────────────────────────────────────────────────────────────

vi.mock('@/lib/prisma', () => ({
  prisma: {
    stepData: { findMany: mockStepDataFindMany },
    constantVersion: { count: mockConstantVersionCount },
    constantCanaryConfig: { findMany: mockConstantCanaryConfigFindMany },
    userQuota: { findUnique: vi.fn().mockResolvedValue(null) },
    costLog: { create: mockCostLogCreate },
  },
}));

vi.mock('@/memory/l4-profile', () => ({
  getLatestInsight: mockGetLatestInsight,
}));

vi.mock('@/workers/rag', () => ({
  ragRetrieveWorker: { retrieve: mockRagRetrieve },
}));

vi.mock('@/services/admin/feature-flag/feature-flag.service', () => ({
  getSystemConfigValue: mockGetSystemConfigValue,
}));

vi.mock('@/services/admin/prompt-version/prompt-version.service', () => ({
  getActivePromptVersion: mockGetActivePromptVersion,
}));

vi.mock('@/workers/methodology-query', () => ({
  methodologyQueryWorker: { getAll: mockMethodologyGetAll },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// ── 被测模块(在 mock 声明之后 import) ─────────────────────────────────────────

import { estimateTokens } from '@/lib/constants/context-budget';
import * as contextBudget from '@/lib/constants/context-budget';

// ContextAssembler 类直接导入(不是单例)以便于 spy
import { ContextAssembler } from '../ContextAssembler';

// ── 默认空 mock 配置 ──────────────────────────────────────────────────────────

function setupDefaultMocks() {
  mockGetLatestInsight.mockResolvedValue(null);
  mockRagRetrieve.mockResolvedValue([]);
  mockMethodologyGetAll.mockReturnValue({ scriptTypes: [], hotElements: [], industries: [] });
  mockConstantVersionCount.mockResolvedValue(0);
  mockConstantCanaryConfigFindMany.mockResolvedValue([]);
}

// ─────────────────────────────────────────────────────────────────────────────
// 铁律 5: estimateTokens CJK 加权证明(先跑，不依赖 mock)
// ─────────────────────────────────────────────────────────────────────────────
describe('estimateTokens · CJK 加权正确性', () => {
  it('CJK 字符 token 估算值 > 相同数量 ASCII 字符', () => {
    // 8 个 ASCII chars: ceil(8 * 0.25) = ceil(2.0) = 2
    const asciiStr = 'abcdefgh';
    expect(estimateTokens(asciiStr)).toBe(2);

    // 8 个 CJK chars: ceil(8 * 1.5) = ceil(12.0) = 12
    const cjkStr = '你好世界测试文本';
    expect(estimateTokens(cjkStr)).toBe(12);

    // CJK >> ASCII (相同字符数)
    expect(estimateTokens(cjkStr)).toBeGreaterThan(estimateTokens(asciiStr));
  });

  it('标准值验证: estimateTokens("你好世界") = 6', () => {
    // 4 CJK chars: ceil(4 * 1.5) = ceil(6.0) = 6
    expect(estimateTokens('你好世界')).toBe(6);
  });

  it('标准值验证: estimateTokens("hello") = 2', () => {
    // 5 ASCII chars: ceil(5 * 0.25) = ceil(1.25) = 2
    expect(estimateTokens('hello')).toBe(2);
  });

  it('混合文本: ASCII + CJK 混合估算', () => {
    // 'abc你好' = 3 ASCII + 2 CJK
    // = ceil(3*0.25 + 2*1.5) = ceil(0.75 + 3.0) = ceil(3.75) = 4
    expect(estimateTokens('abc你好')).toBe(4);
  });
});

// ── 测试套件 ──────────────────────────────────────────────────────────────────

describe('ContextAssembler · G1 token 预算约束', () => {
  let assembler: ContextAssembler;

  // 为超预算测试使用低预算(避免需要生成几十万 chars 的测试数据)
  // 测试 A/B/D 通过 spy 临时把 MAX_CONTEXT_TOKENS 覆盖为低值
  const TEST_BUDGET = 2_000; // 2000 token = 约 8000 ASCII chars — 明显低于正常上下文

  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
    assembler = new ContextAssembler();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 场景 A: 超大 stepData → step 被截、旧 step 丢失、新 step 保留
  // ─────────────────────────────────────────────────────────────────────────────
  describe('场景 A: 超大 stepData 超预算 → step 截断，旧 step 丢失，新 step 保留', () => {
    it('断言: contextTokens ≤ MAX · persona 仍在 · 旧 step 不在 · 新 step 在 · trimmed 含 step_data_truncated', async () => {
      // 用低预算模拟超限场景
      vi.spyOn(contextBudget, 'MAX_CONTEXT_TOKENS', 'get').mockReturnValue(TEST_BUDGET);

      // 200 条 step，每条 data 含 50 个 ASCII chars → ~12 tokens/条
      // 200 条 × ~12 token ≈ 2400 token > TEST_BUDGET(2000)
      const steps = Array.from({ length: 200 }, (_, i) => ({
        stepKey: `step_${i.toString().padStart(3, '0')}`,
        result: { data: 'x'.repeat(50) }, // 50 ASCII chars ~12 token (with JSON wrapper)
      }));

      mockStepDataFindMany.mockResolvedValue(steps);

      const result = await assembler.assemble({
        agentId: 'DiagnosisAgent', // non-generative → RAG skip
        accountId: 1,
        userInput: { userMessage: 'hi' }, // 很短的 userPrompt
      });

      // 铁律: contextTokens ≤ TEST_BUDGET
      expect(result.metadata.contextTokens).toBeLessThanOrEqual(TEST_BUDGET);

      // persona 必须在 (DiagnosisAgent 无 DB prompt → 走 default fallback)
      expect(result.systemPrompt.length).toBeGreaterThan(0);

      // step_data_truncated 说明步骤被截断(而不是完全丢弃)
      expect(result.metadata.trimmed).toContain('step_data_truncated');

      // 旧 step(step_000)不在 · 新 step(step_199)在
      expect(result.systemPrompt).not.toContain('step_000');
      expect(result.systemPrompt).toContain('step_199');

      // trimmed 不应含 'evolution' / 'methodology'(这些层是空的，不触发 trim)
      expect(result.metadata.trimmed).not.toContain('evolution');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 场景 B: 超大 RAG chunks → RAG 被截、DB constants 被丢
  // ─────────────────────────────────────────────────────────────────────────────
  describe('场景 B: 超大 RAG chunks 超预算 → RAG 截断或整段丢，DB constants 被丢', () => {
    it('断言: contextTokens ≤ MAX · persona 仍在 · trimmed 含 rag 相关 · db_constants 被丢', async () => {
      // 低预算场景
      vi.spyOn(contextBudget, 'MAX_CONTEXT_TOKENS', 'get').mockReturnValue(TEST_BUDGET);

      // step 为空
      mockStepDataFindMany.mockResolvedValue([]);

      // RAG: 50 个 chunk，每个 content=200 chars(ASCII) ≈ 50 token，共 50×50 = 2500 token > 2000
      const bigRagChunks = Array.from({ length: 50 }, (_, i) => ({
        id: `chunk-${i}`,
        title: `Case${i}`,
        content: 'C'.repeat(200),
        type: 'case' as const,
        similarity: 0.9,
        source: 'test',
      }));
      mockRagRetrieve.mockResolvedValue(bigRagChunks);

      // methodology 也消耗一些 token
      mockMethodologyGetAll.mockReturnValue({
        scriptTypes: [{ label: 'type1' }, { label: 'type2' }],
        hotElements: [{ label: 'elem1' }],
        industries: [{ category: 'beauty' }],
      });

      // DB constants: 10 条，每条 content=200 chars
      mockConstantVersionCount.mockResolvedValue(1);
      mockConstantCanaryConfigFindMany.mockResolvedValue(
        Array.from({ length: 10 }, (_, i) => ({
          constantType: 'type',
          constantKey: `key${i}`,
          canaryPct: 0,
          currentVersion: { content: 'D'.repeat(200) },
          nextVersion: null,
        })),
      );

      // CopywritingAgent 是生成型 → 会走 RAG
      const result = await assembler.assemble({
        agentId: 'CopywritingAgent',
        accountId: 42,
        userInput: { userMessage: 'test' },
      });

      // 铁律: contextTokens ≤ TEST_BUDGET
      expect(result.metadata.contextTokens).toBeLessThanOrEqual(TEST_BUDGET);

      // persona 必须在
      expect(result.systemPrompt.length).toBeGreaterThan(0);

      // RAG 被截断或整段丢 → trimmed 含 'rag' 或 'rag_truncated'
      const ragTrimmed = result.metadata.trimmed.some((t) => t === 'rag' || t === 'rag_truncated');
      expect(ragTrimmed).toBe(true);

      // DB constants 低优先 · 被裁掉
      expect(result.metadata.trimmed).toContain('db_constants');

      // 不能同时含 'rag' 和 'rag_truncated'(只会是其中一个)
      const hasRag = result.metadata.trimmed.includes('rag');
      const hasRagTruncated = result.metadata.trimmed.includes('rag_truncated');
      expect(hasRag && hasRagTruncated).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 场景 C: 正常小输入 → 不裁剪 trimmed: []
  // ─────────────────────────────────────────────────────────────────────────────
  describe('场景 C: 正常小输入 → 不裁剪，全层都在', () => {
    it('断言: trimmed 为空数组 · 所有层都在 systemPrompt', async () => {
      // 使用真实 MAX_CONTEXT_TOKENS(110000)，小输入应无问题
      const steps = [
        { stepKey: 'step_brand', result: { name: '测试品牌' } },
        { stepKey: 'step_target', result: { audience: '25-35岁女性' } },
      ];
      mockStepDataFindMany.mockResolvedValue(steps);

      mockGetLatestInsight.mockResolvedValue({
        direction: '美妆护肤',
        insights: {
          styleTone: '温暖亲切',
          preferredCatchphrases: ['种草必备'],
          avoidList: [],
          strongPoints: [],
          weakPoints: [],
        },
      });

      mockMethodologyGetAll.mockReturnValue({
        scriptTypes: [{ label: '情感共鸣型' }],
        hotElements: [{ label: '痛点开场' }],
        industries: [{ category: '美妆' }],
      });

      // DiagnosisAgent 不走 RAG
      const result = await assembler.assemble({
        agentId: 'DiagnosisAgent',
        accountId: 1,
        userInput: { userMessage: '正常输入' },
      });

      // 不裁剪
      expect(result.metadata.trimmed).toEqual([]);

      // contextTokens ≤ MAX(真实值 110000)
      expect(result.metadata.contextTokens).toBeLessThanOrEqual(110_000);

      // 各层内容都在 systemPrompt
      expect(result.systemPrompt).toContain('step_brand');
      expect(result.systemPrompt).toContain('step_target');
      expect(result.systemPrompt).toContain('[Section 4] 用户偏好画像');
      expect(result.systemPrompt).toContain('# 方法论(常量)');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 场景 D: userPrompt 单独超 MAX → systemPrompt 只剩 persona
  // ─────────────────────────────────────────────────────────────────────────────
  describe('场景 D: userPrompt 单独超 MAX_CONTEXT_TOKENS → systemPrompt 只留 persona', () => {
    it('断言: systemPrompt 不含 step/evolution/methodology · trimmed 包含所有层', async () => {
      // 低预算: 500 token
      const TINY_BUDGET = 500;
      vi.spyOn(contextBudget, 'MAX_CONTEXT_TOKENS', 'get').mockReturnValue(TINY_BUDGET);

      // userPrompt 用 CJK 超过 TINY_BUDGET
      // 400 CJK chars × 1.5 = 600 token > 500
      // _formatUserPrompt 会把 userInput 包装成 JSON + <user_input>...</user_input>
      const bigInput = '测'.repeat(400); // estimateTokens ≈ 600 tokens > 500

      mockStepDataFindMany.mockResolvedValue([{ stepKey: 'step_x', result: {} }]);
      mockGetLatestInsight.mockResolvedValue({
        direction: '美妆',
        insights: { styleTone: '温暖', preferredCatchphrases: [], avoidList: [], strongPoints: [], weakPoints: [] },
      });

      const result = await assembler.assemble({
        agentId: 'DiagnosisAgent',
        accountId: 1,
        userInput: { userMessage: bigInput },
      });

      // systemPrompt 只剩 persona(不含 step · evolution · methodology)
      expect(result.systemPrompt).not.toContain('历史 step 摘要');
      expect(result.systemPrompt).not.toContain('[Section 4]');
      expect(result.systemPrompt).not.toContain('# 方法论');

      // trimmed 包含被丢的主要层
      expect(result.metadata.trimmed).toContain('step_data');
      expect(result.metadata.trimmed).toContain('evolution');
      expect(result.metadata.trimmed).toContain('methodology');
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// _deriveRagQuery — query 派生优先级测试
// ─────────────────────────────────────────────────────────────────────────────

describe('ContextAssembler._deriveRagQuery · query 派生优先级', () => {
  let assembler: ContextAssembler;

  beforeEach(() => {
    assembler = new ContextAssembler();
  });

  it('优先级1: userMessage 存在 → query = userMessage, 不管其他字段', () => {
    const query = assembler._deriveRagQuery(
      { userMessage: '我想写美业获客的朋友圈文案', topic: '美业', platform: 'wechat' },
      'CopywritingAgent',
    );
    expect(query).toBe('我想写美业获客的朋友圈文案');
  });

  it('优先级2: 无 userMessage · lastDescription 存在 → query = lastDescription', () => {
    const query = assembler._deriveRagQuery(
      { lastDescription: '上轮生成了护肤品种草内容', platform: 'douyin' },
      'CopywritingAgent',
    );
    expect(query).toBe('上轮生成了护肤品种草内容');
  });

  it('优先级3: 无 userMessage/lastDescription · 有长度≥4 的自由文本字段 → query 含真实输入·非 agentId', () => {
    const query = assembler._deriveRagQuery(
      { topic: '美业获客文案怎么写', industry: 'beauty', theme: '新客转化' },
      'CopywritingAgent',
    );
    // 包含真实输入文本，不是 agentId
    expect(query).toContain('美业获客文案怎么写');
    expect(query).not.toBe('CopywritingAgent');
  });

  it('优先级3: 枚举短值(长度<4)被过滤·query 不含无意义枚举', () => {
    // 'hi'(2), 'wx'(2) 长度 < 4 → 被过滤
    const query = assembler._deriveRagQuery(
      { status: 'hi', code: 'wx', realTopic: '美业私域引流内容' },
      'TopicAgent',
    );
    expect(query).toContain('美业私域引流内容');
    expect(query).not.toContain('hi');
    expect(query).not.toContain('wx');
  });

  it('优先级3: 只有枚举短值(如 {platform:"wechat"}) → wechat(6字符≥4) 被纳入(可接受)', () => {
    // 'wechat' 长度=6 ≥ 4 → 会被纳入；但仍然不是 agentId
    const query = assembler._deriveRagQuery({ platform: 'wechat' }, 'BrandingAgent');
    // 有文本可用 → 不走 agentId 兜底
    expect(query).not.toBe('BrandingAgent');
    expect(query).toContain('wechat');
  });

  it('优先级4: input 完全无文本 → 兜底 agentId', () => {
    // 所有值都是非 string 类型 → 无文本字段
    const query = assembler._deriveRagQuery(
      { count: 3, enabled: true, nested: { key: 'value' } },
      'BrandingAgent',
    );
    expect(query).toBe('BrandingAgent');
  });

  it('长文本截断: 超过 500 字符的拼接结果截断到 500', () => {
    const longText = '美'.repeat(300); // 300 chars
    const anotherLong = '好'.repeat(300); // 300 chars; joined = 601
    const query = assembler._deriveRagQuery(
      { fieldA: longText, fieldB: anotherLong },
      'CopywritingAgent',
    );
    expect(query.length).toBeLessThanOrEqual(500);
    expect(query).not.toBe('CopywritingAgent');
  });

  it('断言: 有真实输入文本时 query 不是裸 agentId', () => {
    const agentId = 'BrandingAgent';
    const queryWithText = assembler._deriveRagQuery(
      { brandVision: '打造高端美妆品牌', targetDemo: '25-35岁都市女性' },
      agentId,
    );
    expect(queryWithText).not.toBe(agentId);

    const queryWithMessage = assembler._deriveRagQuery(
      { userMessage: '帮我写品牌故事' },
      agentId,
    );
    expect(queryWithMessage).not.toBe(agentId);
  });
});
