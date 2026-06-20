// PRD-29.6 US-003 · optimizeSection mutation unit test
// AC-7: integration test step3.optimizeSection mutation

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoisted mocks ──────────────────────────────────────────────────────────

const mockBrandingAgentExecute = vi.hoisted(() => vi.fn());
const mockStepDataUpsert = vi.hoisted(() => vi.fn());

vi.mock('@/specialists/BrandingAgent', () => ({
  brandingAgent: {
    execute: mockBrandingAgentExecute,
  },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    stepData: { upsert: mockStepDataUpsert },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// ── Import router (after mocks) ────────────────────────────────────────────

import { step3Router } from '../step3';

// ── Types for internal router access ──────────────────────────────────────

type ResolverOpts = {
  ctx: Record<string, unknown>;
  input: unknown;
  path: string;
  type: string;
  rawInput: unknown;
};

type RouterDef = {
  _def: {
    procedures: Record<string, { _def: { resolver: (opts: ResolverOpts) => Promise<unknown> } }>;
  };
};

// ── Test helpers ────────────────────────────────────────────────────────────

function makeCtx() {
  return {
    prisma: { stepData: { upsert: mockStepDataUpsert } },
    activeAccountId: 42,
    traceId: 'trace-abc',
    user: { id: 1 },
  };
}

function getMutation() {
  const proc = (step3Router as unknown as RouterDef)._def.procedures['optimizeSection'];
  if (!proc) throw new Error('optimizeSection procedure not found in step3Router');
  return proc._def.resolver;
}

const mockStep3Output = {
  nickname: ['优化昵称1', '优化昵称2', '优化昵称3', '优化昵称4', '优化昵称5'],
  avatar: { prompt: '优化头像描述', style: '专业风' },
  background: { prompt: '优化背景描述', platformVersions: ['抖音版', '小红书版', '视频号版'] },
  bio: [
    { platform: 'douyin', text: '优化简介 抖音' },
    { platform: 'xiaohongshu', text: '优化简介 小红书' },
    { platform: 'wechat', text: '优化简介 微信' },
    { platform: 'kuaishou', text: '优化简介 快手' },
    { platform: 'bilibili', text: '优化简介 B站' },
    { platform: 'douyin', text: '优化简介 抖音副号' },
  ],
  overallStrategy: '优化整体策略',
};

const mockAgentRes = {
  result: mockStep3Output,
  isFallback: false,
  durationMs: 3000,
  tokensUsed: { total: 500 },
  modelUsed: 'claude-sonnet',
};

const mockUpsertRow = {
  stepKey: 'step3',
  inputs: {},
  result: mockStep3Output,
  isFallback: false,
  version: 2,
  updatedAt: new Date(),
};

const mockCurrentResult = {
  nicknames: [{ name: '旧昵称' }],
  avatar: { 风格: '旧风格' },
};

// ── Tests ──────────────────────────────────────────────────────────────────

describe('step3.optimizeSection', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('calls brandingAgent.execute with mode=packaging and optimize prompt', async () => {
    mockBrandingAgentExecute.mockResolvedValueOnce(mockAgentRes);
    mockStepDataUpsert.mockResolvedValueOnce(mockUpsertRow);

    const resolver = getMutation();
    const result = await resolver({
      ctx: makeCtx(),
      input: { currentResult: mockCurrentResult },
      path: 'step3.optimizeSection',
      type: 'mutation',
      rawInput: {},
    });

    expect(mockBrandingAgentExecute).toHaveBeenCalledTimes(1);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const callArgs = mockBrandingAgentExecute.mock.calls[0]![0] as {
      mode: string;
      userInput: { personalInfo: string };
    };
    expect(callArgs.mode).toBe('packaging');
    expect(callArgs.userInput.personalInfo).toContain('[智能优化模式]');
    expect(result).toMatchObject({ ok: true, isFallback: false });
  });

  it('upserts stepData with accountId and step3 key', async () => {
    mockBrandingAgentExecute.mockResolvedValueOnce(mockAgentRes);
    mockStepDataUpsert.mockResolvedValueOnce(mockUpsertRow);

    const resolver = getMutation();
    await resolver({
      ctx: makeCtx(),
      input: { currentResult: mockCurrentResult },
      path: 'step3.optimizeSection',
      type: 'mutation',
      rawInput: {},
    });

    expect(mockStepDataUpsert).toHaveBeenCalledTimes(1);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const upsertArgs = mockStepDataUpsert.mock.calls[0]![0] as {
      where: { accountId_stepKey: { accountId: number; stepKey: string } };
    };
    expect(upsertArgs.where.accountId_stepKey.stepKey).toBe('step3');
    expect(upsertArgs.where.accountId_stepKey.accountId).toBe(42);
  });

  it('returns isFallback=true when agent returns fallback', async () => {
    const fallbackRes = { ...mockAgentRes, isFallback: true, modelUsed: 'fallback' };
    mockBrandingAgentExecute.mockResolvedValueOnce(fallbackRes);
    mockStepDataUpsert.mockResolvedValueOnce({ ...mockUpsertRow, isFallback: true });

    const resolver = getMutation();
    const result = await resolver({
      ctx: makeCtx(),
      input: { currentResult: mockCurrentResult },
      path: 'step3.optimizeSection',
      type: 'mutation',
      rawInput: {},
    });

    expect((result as { isFallback: boolean }).isFallback).toBe(true);
  });

  it('includes currentResult context in the optimize prompt', async () => {
    mockBrandingAgentExecute.mockResolvedValueOnce(mockAgentRes);
    mockStepDataUpsert.mockResolvedValueOnce(mockUpsertRow);

    const resolver = getMutation();
    await resolver({
      ctx: makeCtx(),
      input: { currentResult: mockCurrentResult },
      path: 'step3.optimizeSection',
      type: 'mutation',
      rawInput: {},
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const callArgs = mockBrandingAgentExecute.mock.calls[0]![0] as {
      userInput: { personalInfo: string };
    };
    expect(callArgs.userInput.personalInfo).toContain('旧昵称');
  });
});
