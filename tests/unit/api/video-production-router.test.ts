/**
 * Unit tests — PRD-6 US-003
 * videoProduction.generate: 4 unit tests
 * AC-2: protectedProcedure · calls VideoAgent(mode='production') · writes history
 * AC-3: history.create accountId explicit · findFirst({ where: { accountId } }) 双层防护
 * AC-9: sourceCopy < 10 → BAD_REQUEST 中文 message
 * AC-3(fallback): LLMTimeoutError → BaseSpecialist fallback → isFallback=true in history
 * AC-4(cross-account): findFirst returns null → INTERNAL_SERVER_ERROR
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TRPCError } from '@trpc/server';

// ── Mock VideoAgent before router import ──────────────────────────────────────

vi.mock('@/specialists/VideoAgent', () => ({
  videoAgent: {
    execute: vi.fn(),
  },
}));

import { videoProductionRouter } from '@/trpc/routers/videoProduction';
import { videoAgent as _mockedAgent } from '@/specialists/VideoAgent';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MOCK_PRODUCTION_RESULT = {
  shotList: [
    {
      scene: '开场介绍',
      duration: '5s',
      action: '主持人入镜',
      dialogue: '大家好，今天分享视频制作技巧',
      cameraAngle: '正面中景',
      prop: '无',
      lighting: '柔光灯',
      transition: '切入',
      sfx: '开场音效',
      voiceover: '欢迎收看',
      subtitle: '视频制作技巧',
      costume: '休闲服装',
      location: '室内',
    },
  ],
  equipment: ['手机', '三脚架', '补光灯'],
  schedule: '上午10点开始拍摄，预计2小时',
};

const FALLBACK_PRODUCTION_RESULT = {
  shotList: [
    {
      scene: '备用开场',
      duration: '3s',
      action: '面向镜头',
      dialogue: '系统繁忙备用内容',
      cameraAngle: '正面中景',
      prop: '无',
      lighting: '自然光',
      transition: '切入',
      sfx: '无',
      voiceover: '备用旁白',
      subtitle: '备用字幕',
      costume: '正装',
      location: '室内摄影棚',
    },
  ],
  equipment: ['手机'],
  schedule: '备用拍摄时间安排（系统繁忙）',
};

const MOCK_HISTORY_ROW = {
  id: 77,
  content: JSON.stringify(MOCK_PRODUCTION_RESULT),
  contentType: 'json',
  agentId: 'VideoAgent',
  agentMode: 'production',
  scriptType: null,
  elements: [],
  isFallback: false,
  tokensUsed: 600,
  modelUsed: 'claude-sonnet-4-6',
  durationMs: 2500,
  traceId: 'test-trace-003',
  createdAt: new Date('2026-05-10'),
};

// ── Helper: build a minimal tRPC context ─────────────────────────────────────

function makeCtx(overrides: Record<string, unknown> = {}) {
  const history = {
    create: vi.fn(async () => ({ ...MOCK_HISTORY_ROW })),
    findFirst: vi.fn(async () => ({ ...MOCK_HISTORY_ROW })),
  };

  const tx = {
    history,
    $executeRaw: vi.fn(async () => 0),
  };

  const prisma = {
    history,
    $transaction: vi.fn(async (fn: (tx: typeof tx) => Promise<unknown>) => fn(tx)),
    _tx: tx,
  };

  return {
    ctx: {
      traceId: 'test-trace-003',
      activeAccountId: 1 as number | null,
      user: { id: 55, activeAccountId: 1 } as { id: number; activeAccountId: number | null } | null,
      prisma,
      req: new Request('http://localhost', { headers: { 'x-trace-id': 'test-trace-003' } }),
      sessionId: 'sess-003',
      ...overrides,
    },
    prisma,
  };
}

const VALID_INPUT = {
  sourceCopy: '这是一段有效的视频制作文案素材，包含超过十个字符的内容。',
};

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

describe('videoProduction.generate — happy path', () => {
  it('calls VideoAgent(mode=production), writes history with agentId=VideoAgent + agentMode=production + contentType=json + explicit accountId', async () => {
    const { ctx, prisma } = makeCtx();

    vi.mocked(_mockedAgent.execute).mockResolvedValueOnce({
      result: MOCK_PRODUCTION_RESULT,
      isFallback: false,
      durationMs: 2500,
      tokensUsed: { prompt: 200, completion: 400, total: 600 },
      modelUsed: 'claude-sonnet-4-6',
      traceId: 'test-trace-003',
    });

    const caller = videoProductionRouter.createCaller(ctx);
    const result = await caller.generate(VALID_INPUT);

    // AC-2: VideoAgent called with mode='production' and correct accountId
    expect(vi.mocked(_mockedAgent.execute)).toHaveBeenCalledOnce();
    expect(vi.mocked(_mockedAgent.execute)).toHaveBeenCalledWith(
      expect.objectContaining({
        accountId: 1,
        mode: 'production',
        userInput: VALID_INPUT,
      }),
    );

    // AC-2: history.create with full fields
    const createArgs = prisma._tx.history.create.mock.calls[0]?.[0] as {
      data: Record<string, unknown>;
    };
    expect(createArgs.data).toMatchObject({
      accountId: 1,
      agentId: 'VideoAgent',
      agentMode: 'production',
      sourceType: 'user',
      contentType: 'json',
      scriptType: null,
      elements: [],
      isFallback: false,
      tokensUsed: 600,
      modelUsed: 'claude-sonnet-4-6',
      durationMs: 2500,
    });

    // AC-3: findFirst called with explicit accountId double guard
    const findArgs = prisma._tx.history.findFirst.mock.calls[0]?.[0] as {
      where: Record<string, unknown>;
    };
    expect(findArgs.where).toMatchObject({ accountId: 1 });

    expect(result.id).toBe(77);
    expect(result.agentMode).toBe('production');
    expect(result.contentType).toBe('json');
  });
});

describe('videoProduction.generate — zod validation', () => {
  it('sourceCopy < 10 字符 → TRPCError BAD_REQUEST', async () => {
    const { ctx } = makeCtx();
    const caller = videoProductionRouter.createCaller(ctx);

    await expect(
      caller.generate({ sourceCopy: '短文案' }),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  it('sourceCopy = 10 (min boundary) → pass', async () => {
    const { ctx } = makeCtx();

    vi.mocked(_mockedAgent.execute).mockResolvedValueOnce({
      result: MOCK_PRODUCTION_RESULT,
      isFallback: false,
      durationMs: 1000,
      tokensUsed: { prompt: 100, completion: 200, total: 300 },
      modelUsed: 'claude-sonnet-4-6',
      traceId: 'test-trace-003',
    });

    const caller = videoProductionRouter.createCaller(ctx);
    // 10 chars exactly
    const result = await caller.generate({ sourceCopy: '1234567890' });
    expect(result.id).toBe(77);
  });

  it('sourceCopy = 3001 字符 → TRPCError BAD_REQUEST', async () => {
    const { ctx } = makeCtx();
    const caller = videoProductionRouter.createCaller(ctx);

    await expect(
      caller.generate({ sourceCopy: 'a'.repeat(3001) }),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });
});

describe('videoProduction.generate — fallback path (LLMTimeoutError)', () => {
  it('agent returns isFallback=true → history written with isFallback=true', async () => {
    const { ctx, prisma } = makeCtx();

    // BaseSpecialist handles LLMTimeoutError internally and returns isFallback=true
    vi.mocked(_mockedAgent.execute).mockResolvedValueOnce({
      result: FALLBACK_PRODUCTION_RESULT,
      isFallback: true,
      durationMs: 150,
      tokensUsed: { prompt: 0, completion: 0, total: 0 },
      modelUsed: 'fallback',
      traceId: 'test-trace-003',
    });

    const caller = videoProductionRouter.createCaller(ctx);
    await caller.generate(VALID_INPUT);

    const createArgs = prisma._tx.history.create.mock.calls[0]?.[0] as {
      data: { isFallback: boolean; modelUsed: string; tokensUsed: number };
    };
    expect(createArgs.data.isFallback).toBe(true);
    expect(createArgs.data.modelUsed).toBe('fallback');
    expect(createArgs.data.tokensUsed).toBe(0);
  });
});

describe('videoProduction.generate — cross-account RLS isolation', () => {
  it('findFirst returns null (accountId mismatch blocked by RLS) → INTERNAL_SERVER_ERROR', async () => {
    const { ctx, prisma } = makeCtx();

    vi.mocked(_mockedAgent.execute).mockResolvedValueOnce({
      result: MOCK_PRODUCTION_RESULT,
      isFallback: false,
      durationMs: 2500,
      tokensUsed: { prompt: 200, completion: 400, total: 600 },
      modelUsed: 'claude-sonnet-4-6',
      traceId: 'test-trace-003',
    });

    // Simulate RLS blocking: findFirst returns null (accountId mismatch)
    prisma._tx.history.findFirst.mockResolvedValueOnce(null);

    const caller = videoProductionRouter.createCaller(ctx);

    await expect(caller.generate(VALID_INPUT)).rejects.toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
    });
  });
});
