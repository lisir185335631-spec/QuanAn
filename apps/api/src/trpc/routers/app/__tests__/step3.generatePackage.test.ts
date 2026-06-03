// PRD-29.6 US-004 · generatePackage force flag integration test
// AC-7: integration test force flag behavior

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
  };
}

function getMutation() {
  const proc = (step3Router as unknown as RouterDef)._def.procedures['generatePackage'];
  if (!proc) throw new Error('generatePackage procedure not found in step3Router');
  return proc._def.resolver;
}

const mockStep3Output = {
  nickname: ['昵称1', '昵称2', '昵称3', '昵称4', '昵称5'],
  avatar: { prompt: '头像描述', style: '专业风' },
  background: { prompt: '背景描述', platformVersions: ['抖音版', '小红书版', '视频号版'] },
  bio: [{ platform: 'douyin', text: '简介文案' }],
  overallStrategy: '整体策略',
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
  version: 1,
  updatedAt: new Date(),
};

const baseInput = {
  personalInfo: '美容师10年经验',
  platform: 'douyin',
  audience: '25-35岁女性',
  accountStatus: '新账号',
};

// ── Tests ──────────────────────────────────────────────────────────────────

describe('step3.generatePackage force flag', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('accepts force=true and calls brandingAgent.execute normally', async () => {
    mockBrandingAgentExecute.mockResolvedValueOnce(mockAgentRes);
    mockStepDataUpsert.mockResolvedValueOnce(mockUpsertRow);

    const resolver = getMutation();
    const result = await resolver({
      ctx: makeCtx(),
      input: { ...baseInput, force: true },
      path: 'step3.generatePackage',
      type: 'mutation',
      rawInput: {},
    });

    expect(mockBrandingAgentExecute).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ ok: true });
  });

  it('accepts force=false and behaves same as omitting force', async () => {
    mockBrandingAgentExecute.mockResolvedValueOnce(mockAgentRes);
    mockStepDataUpsert.mockResolvedValueOnce(mockUpsertRow);

    const resolver = getMutation();
    const result = await resolver({
      ctx: makeCtx(),
      input: { ...baseInput, force: false },
      path: 'step3.generatePackage',
      type: 'mutation',
      rawInput: {},
    });

    expect(mockBrandingAgentExecute).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ ok: true });
  });

  it('accepts omitted force (undefined) — backwards compatible', async () => {
    mockBrandingAgentExecute.mockResolvedValueOnce(mockAgentRes);
    mockStepDataUpsert.mockResolvedValueOnce(mockUpsertRow);

    const resolver = getMutation();
    const result = await resolver({
      ctx: makeCtx(),
      input: baseInput,
      path: 'step3.generatePackage',
      type: 'mutation',
      rawInput: {},
    });

    expect(mockBrandingAgentExecute).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ ok: true });
  });

  it('returns isFallback=true when agent returns fallback (force=true)', async () => {
    const fallbackRes = { ...mockAgentRes, isFallback: true, modelUsed: 'fallback' };
    mockBrandingAgentExecute.mockResolvedValueOnce(fallbackRes);
    mockStepDataUpsert.mockResolvedValueOnce({ ...mockUpsertRow, isFallback: true });

    const resolver = getMutation();
    const result = await resolver({
      ctx: makeCtx(),
      input: { ...baseInput, force: true },
      path: 'step3.generatePackage',
      type: 'mutation',
      rawInput: {},
    });

    expect((result as { data: { isFallback: boolean } }).data.isFallback).toBe(true);
  });

  it('upserts stepData with correct accountId and stepKey', async () => {
    mockBrandingAgentExecute.mockResolvedValueOnce(mockAgentRes);
    mockStepDataUpsert.mockResolvedValueOnce(mockUpsertRow);

    const resolver = getMutation();
    await resolver({
      ctx: makeCtx(),
      input: { ...baseInput, force: true },
      path: 'step3.generatePackage',
      type: 'mutation',
      rawInput: {},
    });

    expect(mockStepDataUpsert).toHaveBeenCalledTimes(1);
    const upsertArgs = mockStepDataUpsert.mock.calls[0]![0] as {
      where: { accountId_stepKey: { accountId: number; stepKey: string } };
    };
    expect(upsertArgs.where.accountId_stepKey.stepKey).toBe('step3');
    expect(upsertArgs.where.accountId_stepKey.accountId).toBe(42);
  });
});
