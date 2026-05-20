/**
 * Unit tests — PRD-6 US-005
 * acquisitionVideo.generate: 4 unit tests + boundary tests
 * AC-7(1): happy · VideoAgent(mode='acquisition') · agentMode='acquisition' · ctaScript 含 CTA 关键词
 * AC-7(2): conversionGoal 留空 → BAD_REQUEST '转化目标必填'
 * AC-7(3): Specialist throw → fallback (isFallback=true in history)
 * AC-7(4): cross-account RLS 隔离 → INTERNAL_SERVER_ERROR
 * AC-9: sourceCopy 10/3000/3001 边界
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TRPCError } from '@trpc/server';

// ── Mock VideoAgent before router import ──────────────────────────────────────

vi.mock('@/specialists/VideoAgent', () => ({
  videoAgent: {
    execute: vi.fn(),
  },
}));

import { acquisitionVideoRouter } from '@/trpc/routers/app/acquisitionVideo';
import { videoAgent as _mockedAgent } from '@/specialists/VideoAgent';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MOCK_ACQUISITION_RESULT = {
  script:
    '你是否曾经遇到这个问题？每天花大量时间做内容，但粉丝增长却停滞不前？今天分享一个经过验证的方法。',
  cta: '立即关注并私信我获取免费资料',
  conversionPath: '视频引流→私信咨询→成交',
  keyMessages: ['经过验证的涨粉方法', '针对创作者的专属方案'],
};

const FALLBACK_ACQUISITION_RESULT = {
  script:
    '你是否曾经遇到这个问题？每天花大量时间做内容，但粉丝增长却停滞不前？今天分享一个经过验证的方法，帮助你快速突破瓶颈，实现精准涨粉（系统繁忙备用文案·请稍后重试）。',
  cta: '立即扫描下方二维码，免费获取详细方案（系统繁忙备用 CTA）',
  conversionPath: '视频引流→扫码→咨询群→成交',
  keyMessages: ['经验证的涨粉方法', '免费咨询了解详情'],
};

const MOCK_HISTORY_ROW = {
  id: 88,
  content: JSON.stringify({
    script: MOCK_ACQUISITION_RESULT.script,
    ctaScript: MOCK_ACQUISITION_RESULT.cta,
    conversionPath: MOCK_ACQUISITION_RESULT.conversionPath,
    keyMessages: MOCK_ACQUISITION_RESULT.keyMessages,
  }),
  contentType: 'json',
  agentId: 'VideoAgent',
  agentMode: 'acquisition',
  scriptType: null,
  elements: [],
  isFallback: false,
  tokensUsed: 650,
  modelUsed: 'claude-sonnet-4-6',
  durationMs: 2800,
  traceId: 'test-trace-005',
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
      traceId: 'test-trace-005',
      activeAccountId: 1 as number | null,
      user: { id: 55, activeAccountId: 1 } as { id: number; activeAccountId: number | null } | null,
      prisma,
      req: new Request('http://localhost', { headers: { 'x-trace-id': 'test-trace-005' } }),
      sessionId: 'sess-005',
      ...overrides,
    },
    prisma,
  };
}

const VALID_INPUT = {
  sourceCopy: '这是一段有效的获客视频文案素材，包含超过十个字符的内容。',
  conversionGoal: '引流到私域社群',
};

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

// ── AC-7(1): happy path ───────────────────────────────────────────────────────

describe('acquisitionVideo.generate — happy path', () => {
  it('calls VideoAgent(mode=acquisition), writes history agentMode=acquisition, ctaScript contains CTA keyword', async () => {
    const { ctx, prisma } = makeCtx();

    vi.mocked(_mockedAgent.execute).mockResolvedValueOnce({
      result: MOCK_ACQUISITION_RESULT,
      isFallback: false,
      durationMs: 2800,
      tokensUsed: { prompt: 250, completion: 400, total: 650 },
      modelUsed: 'claude-sonnet-4-6',
      traceId: 'test-trace-005',
    });

    const caller = acquisitionVideoRouter.createCaller(ctx);
    const result = await caller.generate(VALID_INPUT);

    // AC-2: VideoAgent called with mode='acquisition' and correct accountId
    expect(vi.mocked(_mockedAgent.execute)).toHaveBeenCalledOnce();
    expect(vi.mocked(_mockedAgent.execute)).toHaveBeenCalledWith(
      expect.objectContaining({
        accountId: 1,
        mode: 'acquisition',
        userInput: VALID_INPUT,
      }),
    );

    // AC-2: history.create with agentMode='acquisition'
    const createArgs = prisma._tx.history.create.mock.calls[0]?.[0] as {
      data: Record<string, unknown>;
    };
    expect(createArgs.data).toMatchObject({
      accountId: 1,
      agentId: 'VideoAgent',
      agentMode: 'acquisition',
      sourceType: 'user',
      contentType: 'json',
      isFallback: false,
      tokensUsed: 650,
      modelUsed: 'claude-sonnet-4-6',
    });

    // AC-4: ctaScript in stored content contains CTA keyword
    const storedContent = createArgs.data.content as string;
    const parsed = JSON.parse(storedContent) as { ctaScript: string; conversionPath: string };
    expect(parsed.ctaScript).toBeDefined();
    expect(/关注|私信|点击|获取|领取/.test(parsed.ctaScript)).toBe(true);
    expect(parsed.conversionPath).toBeDefined();

    // AC-3: findFirst called with explicit accountId double guard
    const findArgs = prisma._tx.history.findFirst.mock.calls[0]?.[0] as {
      where: Record<string, unknown>;
    };
    expect(findArgs.where).toMatchObject({ accountId: 1 });

    expect(result.id).toBe(88);
    expect(result.agentMode).toBe('acquisition');
    expect(result.contentType).toBe('json');
  });
});

// ── AC-7(2): zod validation ───────────────────────────────────────────────────

describe('acquisitionVideo.generate — zod validation', () => {
  it('conversionGoal 留空 → BAD_REQUEST (转化目标必填)', async () => {
    const { ctx } = makeCtx();
    const caller = acquisitionVideoRouter.createCaller(ctx);

    await expect(
      caller.generate({ sourceCopy: '足够长的文案内容让zod通过', conversionGoal: '' }),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  // AC-9: boundary tests
  it('sourceCopy 长度 10 (min boundary) → pass', async () => {
    const { ctx } = makeCtx();

    vi.mocked(_mockedAgent.execute).mockResolvedValueOnce({
      result: MOCK_ACQUISITION_RESULT,
      isFallback: false,
      durationMs: 1000,
      tokensUsed: { prompt: 100, completion: 200, total: 300 },
      modelUsed: 'claude-sonnet-4-6',
      traceId: 'test-trace-005',
    });

    const caller = acquisitionVideoRouter.createCaller(ctx);
    const result = await caller.generate({ sourceCopy: '1234567890', conversionGoal: '引流' });
    expect(result.id).toBe(88);
  });

  it('sourceCopy 长度 3000 (max boundary) → pass', async () => {
    const { ctx } = makeCtx();

    vi.mocked(_mockedAgent.execute).mockResolvedValueOnce({
      result: MOCK_ACQUISITION_RESULT,
      isFallback: false,
      durationMs: 1000,
      tokensUsed: { prompt: 400, completion: 600, total: 1000 },
      modelUsed: 'claude-sonnet-4-6',
      traceId: 'test-trace-005',
    });

    const caller = acquisitionVideoRouter.createCaller(ctx);
    const result = await caller.generate({
      sourceCopy: 'a'.repeat(3000),
      conversionGoal: '私域引流',
    });
    expect(result.id).toBe(88);
  });

  it('sourceCopy 长度 3001 → BAD_REQUEST', async () => {
    const { ctx } = makeCtx();
    const caller = acquisitionVideoRouter.createCaller(ctx);

    await expect(
      caller.generate({ sourceCopy: 'a'.repeat(3001), conversionGoal: '私域引流' }),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });
});

// ── AC-7(3): fallback path ────────────────────────────────────────────────────

describe('acquisitionVideo.generate — fallback path (Specialist internal error)', () => {
  it('agent returns isFallback=true → history written with isFallback=true', async () => {
    const { ctx, prisma } = makeCtx();

    vi.mocked(_mockedAgent.execute).mockResolvedValueOnce({
      result: FALLBACK_ACQUISITION_RESULT,
      isFallback: true,
      durationMs: 150,
      tokensUsed: { prompt: 0, completion: 0, total: 0 },
      modelUsed: 'fallback',
      traceId: 'test-trace-005',
    });

    const caller = acquisitionVideoRouter.createCaller(ctx);
    await caller.generate(VALID_INPUT);

    const createArgs = prisma._tx.history.create.mock.calls[0]?.[0] as {
      data: { isFallback: boolean; modelUsed: string; tokensUsed: number };
    };
    expect(createArgs.data.isFallback).toBe(true);
    expect(createArgs.data.modelUsed).toBe('fallback');
    expect(createArgs.data.tokensUsed).toBe(0);
  });
});

// ── AC-7(4): cross-account RLS isolation ─────────────────────────────────────

describe('acquisitionVideo.generate — cross-account RLS isolation', () => {
  it('findFirst returns null (accountId mismatch blocked by RLS) → INTERNAL_SERVER_ERROR', async () => {
    const { ctx, prisma } = makeCtx();

    vi.mocked(_mockedAgent.execute).mockResolvedValueOnce({
      result: MOCK_ACQUISITION_RESULT,
      isFallback: false,
      durationMs: 2800,
      tokensUsed: { prompt: 250, completion: 400, total: 650 },
      modelUsed: 'claude-sonnet-4-6',
      traceId: 'test-trace-005',
    });

    // Simulate RLS blocking: findFirst returns null (accountId mismatch)
    prisma._tx.history.findFirst.mockResolvedValueOnce(null);

    const caller = acquisitionVideoRouter.createCaller(ctx);

    await expect(caller.generate(VALID_INPUT)).rejects.toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
    });
  });
});
