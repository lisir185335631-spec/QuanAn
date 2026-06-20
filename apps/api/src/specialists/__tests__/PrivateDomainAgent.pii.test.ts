/**
 * PrivateDomainAgent · PII 脱敏守护单测
 * P0-A · US-002 AC-5 · R-14 / LD-018
 *
 * 验证 _buildUserPrompt 对用户自由文本字段正确脱敏:
 *   - 手机号(13800138000)不以原文进 LLM
 *   - 邮箱(a@b.com)不以原文进 LLM
 *
 * 非 PII 字段(price 数字 / channel 枚举)不受影响。
 *
 * AC-5 升级: 同时验证 llmGateway.complete 收到的 systemPrompt+userPrompt 不含 PII 原文
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import { PrivateDomainAgent } from '../PrivateDomainAgent';
import type { PrivateDomainPhaseGenerateInput } from '../PrivateDomainAgent';

// ── Hoisted mocks ─────────────────────────────────────────────────────────────

const { mockComplete } = vi.hoisted(() => ({
  mockComplete: vi.fn(),
}));

vi.mock('@/workers/llm-gateway', () => ({
  llmGateway: { complete: mockComplete },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    stepData: { findMany: vi.fn().mockResolvedValue([]) },
    userQuota: { findUnique: vi.fn().mockResolvedValue(null) },
    costLog: { create: vi.fn().mockResolvedValue({ id: 1 }) },
    constantVersion: { count: vi.fn().mockResolvedValue(0) },
    constantCanaryConfig: { findMany: vi.fn().mockResolvedValue([]) },
  },
}));

vi.mock('@/memory/l4-profile', () => ({
  getLatestInsight: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/workers/rag', () => ({
  ragRetrieveWorker: { retrieve: vi.fn().mockResolvedValue([]) },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('@/services/admin/feature-flag/feature-flag.service', () => ({
  getSystemConfigValue: vi.fn().mockResolvedValue(false),
}));

vi.mock('@/services/admin/prompt-version/prompt-version.service', () => ({
  getActivePromptVersion: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/workers/methodology-query', () => ({
  methodologyQueryWorker: {
    getAll: vi.fn().mockReturnValue({
      scriptTypes: [],
      hotElements: [],
      industries: [],
    }),
  },
}));

// ── Fixtures ─────────────────────────────────────────────────────────────────

const BASE_INPUT: PrivateDomainPhaseGenerateInput = {
  phase: 'welcome',
  productDescription: '高端护肤品',
  productPrice: 299,
  targetAudience: '25-35岁女性',
  ipPositioning: '美妆博主',
  currentChannel: 'wechat',
  monthlyTraffic: 5000,
};

const VALID_LLM_RESULT = {
  phaseScript: '欢迎话术正文',
  variants: {
    professional: '专业版',
    friendly: '亲切版',
    sales: '销售版',
  },
};

const agent = new PrivateDomainAgent();

// ── Tests: _buildUserPrompt 直接测试 ─────────────────────────────────────────

describe('PrivateDomainAgent._buildUserPrompt · PII 脱敏 (P0-A US-002 AC-5)', () => {
  it('productDescription 含手机号 → 输出不含原始手机字面', () => {
    const input: PrivateDomainPhaseGenerateInput = {
      ...BASE_INPUT,
      productDescription: '联系客服13812345678获取优惠',
    };
    const prompt = agent._buildUserPrompt('welcome', input);

    expect(prompt).not.toContain('13812345678');
    expect(prompt).toContain('<PHONE>');
  });

  it('targetAudience 含邮箱 → 输出不含原始邮箱字面', () => {
    const input: PrivateDomainPhaseGenerateInput = {
      ...BASE_INPUT,
      targetAudience: '联系 test@example.com 了解详情',
    };
    const prompt = agent._buildUserPrompt('welcome', input);

    expect(prompt).not.toContain('test@example.com');
    expect(prompt).toContain('<EMAIL>');
  });

  it('scene 含手机号 → 输出不含原始手机字面', () => {
    const input: PrivateDomainPhaseGenerateInput = {
      ...BASE_INPUT,
      scene: '客户留言：请致电13898765432',
    };
    const prompt = agent._buildUserPrompt('welcome', input);

    expect(prompt).not.toContain('13898765432');
    expect(prompt).toContain('<PHONE>');
  });

  it('无 PII 字段时输出与原文一致(不误伤正常文本)', () => {
    const input: PrivateDomainPhaseGenerateInput = {
      ...BASE_INPUT,
      productDescription: '纯植物精华液',
      targetAudience: '注重肌肤护理的年轻女性',
    };
    const prompt = agent._buildUserPrompt('welcome', input);

    expect(prompt).toContain('纯植物精华液');
    expect(prompt).toContain('注重肌肤护理的年轻女性');
  });

  it('productPrice(数值)和 currentChannel(枚举)不受脱敏影响', () => {
    const input: PrivateDomainPhaseGenerateInput = {
      ...BASE_INPUT,
      productPrice: 299,
      currentChannel: 'wechat',
    };
    const prompt = agent._buildUserPrompt('welcome', input);

    expect(prompt).toContain('¥299');
  });
});

// ── Tests: AC-5 端到端 llmGateway.complete 不含 PII 原文 ──────────────────────

describe('PrivateDomainAgent.execute · AC-5 llmGateway 不收到 PII 原文', () => {
  beforeEach(() => {
    mockComplete.mockClear();
    mockComplete.mockResolvedValue({
      content: VALID_LLM_RESULT,
      tokens: { prompt: 100, completion: 50, total: 150 },
      model: 'claude-haiku-4-5',
    });
  });

  it('productDescription 含手机(13800138000) → llmGateway 收到的 userPrompt 不含原文手机', async () => {
    const a = new PrivateDomainAgent();
    await a.execute({
      accountId: 9999,
      userId: 1,
      userInput: {
        ...BASE_INPUT,
        productDescription: '联系13800138000了解产品',
      },
    });

    expect(mockComplete).toHaveBeenCalled();
    const callArgs = mockComplete.mock.calls[0]![0] as { systemPrompt: string; userPrompt: string };
    expect(callArgs.userPrompt).not.toContain('13800138000');
    expect(callArgs.userPrompt).toContain('<PHONE>');
  });

  it('targetAudience 含邮箱(a@b.com) → llmGateway 收到的 userPrompt 不含原文邮箱', async () => {
    const a = new PrivateDomainAgent();
    await a.execute({
      accountId: 9999,
      userId: 1,
      userInput: {
        ...BASE_INPUT,
        targetAudience: '请联系 a@b.com 报名',
      },
    });

    expect(mockComplete).toHaveBeenCalled();
    const callArgs = mockComplete.mock.calls[0]![0] as { systemPrompt: string; userPrompt: string };
    expect(callArgs.userPrompt).not.toContain('a@b.com');
    expect(callArgs.userPrompt).toContain('<EMAIL>');
  });

  it('systemPrompt 来自 ctx · 不含 raw productDescription/targetAudience', async () => {
    const a = new PrivateDomainAgent();
    await a.execute({
      accountId: 9999,
      userId: 1,
      userInput: {
        ...BASE_INPUT,
        productDescription: '特殊产品UNIQUE_PRODUCT_MARKER',
        targetAudience: '特殊受众UNIQUE_AUDIENCE_MARKER',
      },
    });

    expect(mockComplete).toHaveBeenCalled();
    const callArgs = mockComplete.mock.calls[0]![0] as { systemPrompt: string; userPrompt: string };
    // systemPrompt is from ctx (ContextAssembler) · should not contain raw product/audience
    expect(callArgs.systemPrompt).not.toContain('特殊产品UNIQUE_PRODUCT_MARKER');
    expect(callArgs.systemPrompt).not.toContain('特殊受众UNIQUE_AUDIENCE_MARKER');
  });
});
