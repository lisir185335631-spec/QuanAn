/**
 * CopywritingAgent · PII 脱敏守护单测
 * R-14 / LD-018
 *
 * 验证 step7 / free / boom / acquisition 四 mode 各自对
 * incidental 元数据字段正确脱敏:
 *   - step7:  topic → mask(含手机/邮箱被脱敏); scriptType/elements(枚举) → 不动
 *   - free:   topic → mask
 *   - boom:   theme/topic → mask; elements/industry(枚举) → 不动
 *   - acquisition: conversionGoal/topic → mask; scriptType/elements(枚举) → 不动
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import { CopywritingAgent } from '../CopywritingAgent';

// ── Hoisted mocks ─────────────────────────────────────────────────────────────

const { mockStream } = vi.hoisted(() => ({
  mockStream: vi.fn(),
}));

vi.mock('@/workers/llm-gateway', () => ({
  llmGateway: { stream: mockStream },
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

// ── SSE stream mock helper ────────────────────────────────────────────────────

function makeStreamMock(jsonPayload: unknown) {
  return async function* () {
    yield { type: 'meta', meta: { model: 'claude-sonnet-4-6' } };
    yield { type: 'delta', delta: JSON.stringify(jsonPayload) };
    yield { type: 'done', tokens: { prompt: 300, completion: 200, total: 500 } };
  };
}

// ── Fixtures ─────────────────────────────────────────────────────────────────

const STEP7_RESULT = {
  markdown: '# 爆款标题\n\n第一段正文内容，至少五百字的占位文本内容输出。'.padEnd(510, '内容'),
  structure: '痛点引入→解决方案→案例佐证→CTA',
  hooks: ['钩子1', '钩子2'],
  cta: '关注我获取更多干货',
};

const FREE_RESULT = {
  markdown: '# 自由创作\n\n文案正文，至少四百字的输出。'.padEnd(420, '内容'),
  metadata: {
    scriptType: 'tutorial',
    elements: ['curiosity'],
    structureSummary: '钩子→价值→CTA',
    estimatedDuration: '60-90 秒',
  },
};

const BOOM_RESULT = {
  candidates: Array(5).fill(null).map((_, i) => ({
    title: `候选${i + 1}·标题至少六字`,
    opening: '开场话术至少四十字的占位内容，这里输出足够多的文本。',
    development: '内容发展至少四十字的占位内容，这里输出足够多的文本内容。',
    climax: '高潮转折至少四十字的占位内容，这里输出足够多的文字内容。',
    ending: '结尾CTA至少四十字的占位内容，这里输出足够多的文字结尾。',
    reason: '爆款原因至少二十字的说明内容。',
    indexScore: `${7 + (i % 3)}/10`,
  })),
  metadata: { count: 5, elements: ['curiosity', 'contrast'] },
};

const ACQUISITION_RESULT = {
  markdown: '获客文案正文内容，至少二百字的输出，包含明确的关注行动引导词。'.padEnd(210, '内容'),
  metadata: {
    ctaPosition: '结尾',
    conversionGoal: '扫码咨询了解详情',
  },
};

// ── Tests: step7 mode ─────────────────────────────────────────────────────────

describe('CopywritingAgent.step7 · topic PII 脱敏 (R-14)', () => {
  beforeEach(() => {
    mockStream.mockClear();
    mockStream.mockImplementation(makeStreamMock(STEP7_RESULT));
  });

  it('topic 含手机号 → userPrompt 不含原文手机', async () => {
    const agent = new CopywritingAgent();
    await agent.execute({
      accountId: 9999,
      userId: 1,
      mode: 'step7',
      userInput: {
        scriptType: 'educational',
        elements: ['curiosity'],
        topic: '联系13812340000了解更多内容创作技巧',
      },
    });

    expect(mockStream).toHaveBeenCalled();
    const callArgs = mockStream.mock.calls[0]![0] as { userPrompt: string };
    expect(callArgs.userPrompt).not.toContain('13812340000');
    expect(callArgs.userPrompt).toContain('<PHONE>');
  });

  it('topic 含邮箱 → userPrompt 不含原文邮箱', async () => {
    const agent = new CopywritingAgent();
    await agent.execute({
      accountId: 9999,
      userId: 1,
      mode: 'step7',
      userInput: {
        scriptType: 'debate',
        elements: ['contrast'],
        topic: '发邮件到 creator@studio.ai 了解合作',
      },
    });

    expect(mockStream).toHaveBeenCalled();
    const callArgs = mockStream.mock.calls[0]![0] as { userPrompt: string };
    expect(callArgs.userPrompt).not.toContain('creator@studio.ai');
    expect(callArgs.userPrompt).toContain('<EMAIL>');
  });

  it('scriptType/elements(枚举) 不受脱敏影响', async () => {
    const agent = new CopywritingAgent();
    await agent.execute({
      accountId: 9999,
      userId: 1,
      mode: 'step7',
      userInput: {
        scriptType: 'tutorial',
        elements: ['curiosity', 'contrast'],
        topic: '健康饮食习惯',
      },
    });

    expect(mockStream).toHaveBeenCalled();
    const callArgs = mockStream.mock.calls[0]![0] as { userPrompt: string };
    expect(callArgs.userPrompt).toContain('tutorial');
    expect(callArgs.userPrompt).toContain('curiosity');
  });

  it('无 PII 的 topic 正常透传(不误伤)', async () => {
    const agent = new CopywritingAgent();
    await agent.execute({
      accountId: 9999,
      userId: 1,
      mode: 'step7',
      userInput: {
        scriptType: 'educational',
        elements: ['curiosity'],
        topic: '健康饮食习惯与生活方式',
      },
    });

    expect(mockStream).toHaveBeenCalled();
    const callArgs = mockStream.mock.calls[0]![0] as { userPrompt: string };
    expect(callArgs.userPrompt).toContain('健康饮食习惯与生活方式');
  });
});

// ── Tests: free mode ──────────────────────────────────────────────────────────

describe('CopywritingAgent.free · topic PII 脱敏 (R-14)', () => {
  beforeEach(() => {
    mockStream.mockClear();
    mockStream.mockImplementation(makeStreamMock(FREE_RESULT));
  });

  it('topic 含手机号 → userPrompt 不含原文手机', async () => {
    const agent = new CopywritingAgent();
    await agent.execute({
      accountId: 9999,
      userId: 1,
      mode: 'free',
      userInput: {
        scriptType: 'story',
        elements: ['resonance'],
        topic: '拨打13700001111报名参加训练营',
      },
    });

    expect(mockStream).toHaveBeenCalled();
    const callArgs = mockStream.mock.calls[0]![0] as { userPrompt: string };
    expect(callArgs.userPrompt).not.toContain('13700001111');
    expect(callArgs.userPrompt).toContain('<PHONE>');
  });

  it('topic 含邮箱 → userPrompt 不含原文邮箱', async () => {
    const agent = new CopywritingAgent();
    await agent.execute({
      accountId: 9999,
      userId: 1,
      mode: 'free',
      userInput: {
        scriptType: 'tutorial',
        elements: ['curiosity'],
        topic: '发送邮件 free@content.cn 加入社群',
      },
    });

    expect(mockStream).toHaveBeenCalled();
    const callArgs = mockStream.mock.calls[0]![0] as { userPrompt: string };
    expect(callArgs.userPrompt).not.toContain('free@content.cn');
    expect(callArgs.userPrompt).toContain('<EMAIL>');
  });
});

// ── Tests: boom mode ──────────────────────────────────────────────────────────

describe('CopywritingAgent.boom · theme/topic PII 脱敏 (R-14)', () => {
  beforeEach(() => {
    mockStream.mockClear();
    mockStream.mockImplementation(makeStreamMock(BOOM_RESULT));
  });

  it('theme 含手机号 → userPrompt 不含原文手机', async () => {
    const agent = new CopywritingAgent();
    await agent.execute({
      accountId: 9999,
      userId: 1,
      mode: 'boom',
      userInput: {
        elements: ['curiosity', 'contrast'],
        theme: '联系13655556666报名学习',
        industry: '教育',
      },
    });

    expect(mockStream).toHaveBeenCalled();
    const callArgs = mockStream.mock.calls[0]![0] as { userPrompt: string };
    expect(callArgs.userPrompt).not.toContain('13655556666');
    expect(callArgs.userPrompt).toContain('<PHONE>');
  });

  it('topic 含邮箱 → userPrompt 不含原文邮箱', async () => {
    const agent = new CopywritingAgent();
    await agent.execute({
      accountId: 9999,
      userId: 1,
      mode: 'boom',
      userInput: {
        elements: ['fear', 'proof'],
        topic: '发邮件 boom@brand.com 获取资料',
        industry: '美妆',
      },
    });

    expect(mockStream).toHaveBeenCalled();
    const callArgs = mockStream.mock.calls[0]![0] as { userPrompt: string };
    expect(callArgs.userPrompt).not.toContain('boom@brand.com');
    expect(callArgs.userPrompt).toContain('<EMAIL>');
  });

  it('elements/industry(枚举/分类) 不受脱敏影响', async () => {
    const agent = new CopywritingAgent();
    await agent.execute({
      accountId: 9999,
      userId: 1,
      mode: 'boom',
      userInput: {
        elements: ['curiosity', 'proof'],
        theme: '内容创作方法论',
        industry: '教育培训',
      },
    });

    expect(mockStream).toHaveBeenCalled();
    const callArgs = mockStream.mock.calls[0]![0] as { userPrompt: string };
    expect(callArgs.userPrompt).toContain('教育培训');
    expect(callArgs.userPrompt).toContain('curiosity');
  });

  it('无 PII 的 theme 正常透传(不误伤)', async () => {
    const agent = new CopywritingAgent();
    await agent.execute({
      accountId: 9999,
      userId: 1,
      mode: 'boom',
      userInput: {
        elements: ['curiosity'],
        theme: '内容创作变现路径',
        industry: '通用',
      },
    });

    expect(mockStream).toHaveBeenCalled();
    const callArgs = mockStream.mock.calls[0]![0] as { userPrompt: string };
    expect(callArgs.userPrompt).toContain('内容创作变现路径');
  });
});

// ── Tests: acquisition mode ───────────────────────────────────────────────────

describe('CopywritingAgent.acquisition · conversionGoal/topic PII 脱敏 (R-14)', () => {
  beforeEach(() => {
    mockStream.mockClear();
    mockStream.mockImplementation(makeStreamMock(ACQUISITION_RESULT));
  });

  it('conversionGoal 含手机号 → userPrompt 不含原文手机', async () => {
    const agent = new CopywritingAgent();
    await agent.execute({
      accountId: 9999,
      userId: 1,
      mode: 'acquisition',
      userInput: {
        scriptType: 'story',
        elements: ['proof'],
        conversionGoal: '拨打13988887777预约咨询',
        topic: '免费咨询方案',
      },
    });

    expect(mockStream).toHaveBeenCalled();
    const callArgs = mockStream.mock.calls[0]![0] as { userPrompt: string };
    expect(callArgs.userPrompt).not.toContain('13988887777');
    expect(callArgs.userPrompt).toContain('<PHONE>');
  });

  it('topic 含邮箱 → userPrompt 不含原文邮箱', async () => {
    const agent = new CopywritingAgent();
    await agent.execute({
      accountId: 9999,
      userId: 1,
      mode: 'acquisition',
      userInput: {
        scriptType: 'tutorial',
        elements: ['authority'],
        conversionGoal: '扫码关注',
        topic: '发邮件到 acq@growth.io 申请体验',
      },
    });

    expect(mockStream).toHaveBeenCalled();
    const callArgs = mockStream.mock.calls[0]![0] as { userPrompt: string };
    expect(callArgs.userPrompt).not.toContain('acq@growth.io');
    expect(callArgs.userPrompt).toContain('<EMAIL>');
  });

  it('scriptType/elements(枚举) 不受脱敏影响', async () => {
    const agent = new CopywritingAgent();
    await agent.execute({
      accountId: 9999,
      userId: 1,
      mode: 'acquisition',
      userInput: {
        scriptType: 'debate',
        elements: ['curiosity', 'proof'],
        conversionGoal: '私信了解课程',
        topic: '如何快速涨粉',
      },
    });

    expect(mockStream).toHaveBeenCalled();
    const callArgs = mockStream.mock.calls[0]![0] as { userPrompt: string };
    expect(callArgs.userPrompt).toContain('debate');
    expect(callArgs.userPrompt).toContain('curiosity');
  });

  it('无 PII 的 conversionGoal/topic 正常透传(不误伤)', async () => {
    const agent = new CopywritingAgent();
    await agent.execute({
      accountId: 9999,
      userId: 1,
      mode: 'acquisition',
      userInput: {
        scriptType: 'story',
        elements: ['resonance'],
        conversionGoal: '关注账号了解课程详情',
        topic: '零基础学内容创作',
      },
    });

    expect(mockStream).toHaveBeenCalled();
    const callArgs = mockStream.mock.calls[0]![0] as { userPrompt: string };
    expect(callArgs.userPrompt).toContain('关注账号了解课程详情');
    expect(callArgs.userPrompt).toContain('零基础学内容创作');
  });
});
