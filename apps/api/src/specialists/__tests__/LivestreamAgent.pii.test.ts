/**
 * LivestreamAgent · PII 脱敏守护单测
 * R-14 / LD-018
 *
 * 验证 generate_plan / optimize_script / legacy 三路 userPrompt 构建对
 * incidental 元数据字段正确脱敏:
 *   - productInfo/targetAudience (generate_plan) → 含手机/邮箱时被脱敏
 *   - optimizeGoal (optimize_script) → 含手机/邮箱时被脱敏
 *   - scriptText (optimize_script) → 主体内容·不 mask
 *   - legacy path: productInfo/targetAudience/optimizeGoal → 被脱敏
 *   - experience/sub_function (枚举) → 不受影响
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import { LivestreamAgent } from '../LivestreamAgent';

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

// ── Fixtures ─────────────────────────────────────────────────────────────────

const VALID_GENERATE_PLAN_RESULT = {
  opening: '欢迎来到直播间，我是主播！'.repeat(5),
  warmup: '大家扣个1互动一下！'.repeat(5),
  product: '今天主推的产品特点如下：特性优势利益证明，请大家认真听！'.repeat(4),
  conversion: '限时限量，今天专属价！'.repeat(5),
  faq: '发货3天，质量问题包退！'.repeat(4),
  closing: '感谢大家，下次见！'.repeat(4),
};

const VALID_OPTIMIZE_RESULT = {
  optimized_text: '【高转化版】欢迎来到直播间！今天带来超值好物，品质保证，名额有限！'.repeat(5),
  optimization_notes: '改进了开场钩子，增加了紧迫感和个人背书，节奏更紧凑。',
};

const VALID_LEGACY_RESULT = {
  lastResult: '欢迎来到直播间！'.repeat(50),
  lastOptimizedResult: '优化版：大家好！'.repeat(50),
};

// ── Tests: generate_plan path ─────────────────────────────────────────────────

describe('LivestreamAgent.generate_plan · PII 脱敏 (R-14)', () => {
  beforeEach(() => {
    mockComplete.mockClear();
    mockComplete.mockResolvedValue({
      content: VALID_GENERATE_PLAN_RESULT,
      tokens: { prompt: 500, completion: 300, total: 800 },
      model: 'claude-sonnet-4-6',
    });
  });

  it('productInfo 含手机号 → llmGateway userPrompt 不含原文手机', async () => {
    const agent = new LivestreamAgent();
    await agent.execute({
      accountId: 9999,
      userId: 1,
      mode: 'generate_plan',
      userInput: {
        sub_function: 'generate_plan',
        experience: '新手',
        productInfo: '联系客服13812345678了解产品详情',
        targetAudience: '25-40岁健康人群',
      },
    });

    expect(mockComplete).toHaveBeenCalled();
    const callArgs = mockComplete.mock.calls[0]![0] as { userPrompt: string };
    expect(callArgs.userPrompt).not.toContain('13812345678');
    expect(callArgs.userPrompt).toContain('<PHONE>');
  });

  it('targetAudience 含邮箱 → llmGateway userPrompt 不含原文邮箱', async () => {
    const agent = new LivestreamAgent();
    await agent.execute({
      accountId: 9999,
      userId: 1,
      mode: 'generate_plan',
      userInput: {
        sub_function: 'generate_plan',
        experience: '有经验',
        productInfo: '高端护肤品',
        targetAudience: '联系 vip@brand.com 的 VIP 会员群体',
      },
    });

    expect(mockComplete).toHaveBeenCalled();
    const callArgs = mockComplete.mock.calls[0]![0] as { userPrompt: string };
    expect(callArgs.userPrompt).not.toContain('vip@brand.com');
    expect(callArgs.userPrompt).toContain('<EMAIL>');
  });

  it('experience(枚举) 不受脱敏影响', async () => {
    const agent = new LivestreamAgent();
    await agent.execute({
      accountId: 9999,
      userId: 1,
      mode: 'generate_plan',
      userInput: {
        sub_function: 'generate_plan',
        experience: '资深',
        productInfo: '普通产品',
        targetAudience: '普通受众',
      },
    });

    expect(mockComplete).toHaveBeenCalled();
    const callArgs = mockComplete.mock.calls[0]![0] as { userPrompt: string };
    expect(callArgs.userPrompt).toContain('资深');
  });

  it('无 PII 的 productInfo/targetAudience 正常透传(不误伤)', async () => {
    const agent = new LivestreamAgent();
    await agent.execute({
      accountId: 9999,
      userId: 1,
      mode: 'generate_plan',
      userInput: {
        sub_function: 'generate_plan',
        experience: '新手',
        productInfo: '有机绿茶礼盒套装',
        targetAudience: '注重健康的中产消费者',
      },
    });

    expect(mockComplete).toHaveBeenCalled();
    const callArgs = mockComplete.mock.calls[0]![0] as { userPrompt: string };
    expect(callArgs.userPrompt).toContain('有机绿茶礼盒套装');
    expect(callArgs.userPrompt).toContain('注重健康的中产消费者');
  });
});

// ── Tests: optimize_script path ───────────────────────────────────────────────

describe('LivestreamAgent.optimize_script · PII 脱敏 + 主体内容保留 (R-14)', () => {
  beforeEach(() => {
    mockComplete.mockClear();
    mockComplete.mockResolvedValue({
      content: VALID_OPTIMIZE_RESULT,
      tokens: { prompt: 400, completion: 200, total: 600 },
      model: 'claude-sonnet-4-6',
    });
  });

  it('optimizeGoal 含手机号 → userPrompt 不含原文手机', async () => {
    const agent = new LivestreamAgent();
    await agent.execute({
      accountId: 9999,
      userId: 1,
      mode: 'optimize_script',
      userInput: {
        sub_function: 'optimize_script',
        experience: '有经验',
        scriptText: '欢迎来到直播间，今天介绍一款好产品。',
        optimizeGoal: '联系13900139000反馈优化意见',
      },
    });

    expect(mockComplete).toHaveBeenCalled();
    const callArgs = mockComplete.mock.calls[0]![0] as { userPrompt: string };
    expect(callArgs.userPrompt).not.toContain('13900139000');
    expect(callArgs.userPrompt).toContain('<PHONE>');
  });

  it('scriptText(主体内容) 含手机号 → 不 mask(AI 优化对象·掩码会毁任务)', async () => {
    const agent = new LivestreamAgent();
    await agent.execute({
      accountId: 9999,
      userId: 1,
      mode: 'optimize_script',
      userInput: {
        sub_function: 'optimize_script',
        experience: '有经验',
        // scriptText 是用户提供的待优化直播脚本正文 — 不 mask
        scriptText: '各位朋友好，想了解的请加微信或拨打13800138000，我们为您提供专属服务。',
        optimizeGoal: '提升开场吸引力',
      },
    });

    expect(mockComplete).toHaveBeenCalled();
    const callArgs = mockComplete.mock.calls[0]![0] as { userPrompt: string };
    // scriptText 是被 AI 分析/优化的主体内容 → 必须原文保留
    expect(callArgs.userPrompt).toContain('13800138000');
    expect(callArgs.userPrompt).toContain('各位朋友好');
  });

  it('无 PII 的 optimizeGoal 正常透传(不误伤)', async () => {
    const agent = new LivestreamAgent();
    await agent.execute({
      accountId: 9999,
      userId: 1,
      mode: 'optimize_script',
      userInput: {
        sub_function: 'optimize_script',
        experience: '新手',
        scriptText: '欢迎来到直播间！',
        optimizeGoal: '提升转化率和开场吸引力',
      },
    });

    expect(mockComplete).toHaveBeenCalled();
    const callArgs = mockComplete.mock.calls[0]![0] as { userPrompt: string };
    expect(callArgs.userPrompt).toContain('提升转化率和开场吸引力');
  });
});

// ── Tests: legacy (default) path ──────────────────────────────────────────────

describe('LivestreamAgent.legacy · PII 脱敏 (R-14)', () => {
  beforeEach(() => {
    mockComplete.mockClear();
    mockComplete.mockResolvedValue({
      content: VALID_LEGACY_RESULT,
      tokens: { prompt: 400, completion: 200, total: 600 },
      model: 'claude-sonnet-4-6',
    });
  });

  it('legacy path productInfo 含手机号 → userPrompt 不含原文手机', async () => {
    const agent = new LivestreamAgent();
    await agent.execute({
      accountId: 9999,
      userId: 1,
      userInput: {
        experience: '有经验',
        productInfo: '联系13711112222了解产品',
      },
    });

    expect(mockComplete).toHaveBeenCalled();
    const callArgs = mockComplete.mock.calls[0]![0] as { userPrompt: string };
    expect(callArgs.userPrompt).not.toContain('13711112222');
    expect(callArgs.userPrompt).toContain('<PHONE>');
  });

  it('legacy path targetAudience 含邮箱 → userPrompt 不含原文邮箱', async () => {
    const agent = new LivestreamAgent();
    await agent.execute({
      accountId: 9999,
      userId: 1,
      userInput: {
        experience: '新手',
        targetAudience: '请发邮件到 info@company.org 报名',
      },
    });

    expect(mockComplete).toHaveBeenCalled();
    const callArgs = mockComplete.mock.calls[0]![0] as { userPrompt: string };
    expect(callArgs.userPrompt).not.toContain('info@company.org');
    expect(callArgs.userPrompt).toContain('<EMAIL>');
  });
});
