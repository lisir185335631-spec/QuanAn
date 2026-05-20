// PRD-25 US-007 AC-10 · ipAccounts.smartRecommend router unit tests
// ≥ 3 cases · mock positioningAgent to avoid real LLM calls
// (a) 正常调用返回 {platform, followersRange, ipPositioning, rationale}
// (b) industry 为空字符串时 Zod 抛 BAD_REQUEST (min(1))
// (c) positioningAgent.execute 被调用且 mode='recommend'

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoisted mocks ─────────────────────────────────────────────────────────────

const mockPositioningAgentExecute = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
    result: {
      platform: 'douyin',
      followersRange: '0-1k',
      ipPositioning: '企业服务领域知识博主',
      rationale: '抖音覆盖面广，企业服务受众广泛，0-1k粉丝阶段适合深耕垂直内容。',
    },
    isFallback: false,
  }),
);

vi.mock('@/specialists/PositioningAgent', () => ({
  positioningAgent: { execute: mockPositioningAgentExecute },
}));

// Minimal prisma mock — protectedProcedure wraps calls in $transaction
vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn().mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const txProxy = {
        $executeRaw: vi.fn().mockResolvedValue(undefined),
      };
      return fn(txProxy);
    }),
    $executeRaw: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('@/lib/logger', async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const actual = await importOriginal<typeof import('@/lib/logger')>();
  return {
    ...actual,
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  };
});

// ── Router + context helpers ──────────────────────────────────────────────────

import { prisma } from '@/lib/prisma';
import type { TRPCContext } from '@/trpc/context';

import { ipAccountsRouter } from '../ipAccounts';


const MOCK_USER = {
  id: 42,
  email: 'test@example.com',
  activeAccountId: 7,
  role: 'user',
  inviteCode: null,
  createdAt: new Date(),
  updatedAt: new Date(),
} as unknown as TRPCContext['user'];

function makeCtx(overrides: Partial<TRPCContext> = {}): TRPCContext {
  return {
    prisma: prisma,
    traceId: 'trace-smart-recommend-test',
    req: new Request('http://localhost/trpc/ipAccounts.smartRecommend'),
    user: MOCK_USER,
    sessionId: 'session-test',
    activeAccountId: 7,
    ...overrides,
  };
}

function makeCaller(overrides: Partial<TRPCContext> = {}) {
  return ipAccountsRouter.createCaller(makeCtx(overrides));
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ipAccounts.smartRecommend', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPositioningAgentExecute.mockResolvedValue({
      result: {
        platform: 'douyin',
        followersRange: '0-1k',
        ipPositioning: '企业服务领域知识博主',
        rationale: '抖音覆盖面广，企业服务受众广泛，0-1k粉丝阶段适合深耕垂直内容。',
      },
      isFallback: false,
    });
  });

  it('(a) 正常调用返回 {platform, followersRange, ipPositioning, rationale}', async () => {
    const caller = makeCaller();
    const result = await caller.smartRecommend({ industry: '企业服务' });

    expect(result).toMatchObject({
      platform: expect.any(String),
      followersRange: expect.any(String),
      ipPositioning: expect.any(String),
      rationale: expect.any(String),
      isFallback: expect.any(Boolean),
    });
    expect(result.platform).toBe('douyin');
    expect(result.followersRange).toBe('0-1k');
  });

  it('(b) industry 为空字符串时抛 BAD_REQUEST (Zod min(1))', async () => {
    const caller = makeCaller();
    await expect(caller.smartRecommend({ industry: '' })).rejects.toMatchObject({
      code: 'BAD_REQUEST',
    });
  });

  it('(c) positioningAgent.execute 被调用且 mode="recommend"', async () => {
    const caller = makeCaller();
    await caller.smartRecommend({ industry: '美妆' });

    expect(mockPositioningAgentExecute).toHaveBeenCalledOnce();
    expect(mockPositioningAgentExecute).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'recommend',
        userInput: { industry: '美妆' },
        accountId: 7,
      }),
    );
  });

  it('(d) activeAccountId=null 时 protectedProcedure 抛 FORBIDDEN', async () => {
    const caller = makeCaller({ activeAccountId: null });
    await expect(caller.smartRecommend({ industry: '电商' })).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });

  it('(e) isFallback=true 时透传给调用方', async () => {
    mockPositioningAgentExecute.mockResolvedValueOnce({
      result: {
        platform: 'xiaohongshu',
        followersRange: '1k-10k',
        ipPositioning: '时尚博主',
        rationale: '小红书女性用户多。',
      },
      isFallback: true,
    });

    const caller = makeCaller();
    const result = await caller.smartRecommend({ industry: '时尚' });

    expect(result.isFallback).toBe(true);
    expect(result.platform).toBe('xiaohongshu');
  });
});
