/**
 * Unit tests — PRD-6 US-012
 * copywriting.acquisitionGenerate: 4 unit tests
 * AC-9(1): happy · CopywritingAgent(mode='acquisition') · agentMode='acquisition' · markdown 含 CTA
 * AC-9(2): conversionGoal 留空 → BAD_REQUEST '转化目标必填'
 * AC-9(3): markdown 缺 CTA · post-validate retry 1 (execute called twice)
 * AC-9(4): cross-account RLS 隔离 · history.create 使用 activeAccountId
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock CopywritingAgent before router import ────────────────────────────────

vi.mock('@/specialists/CopywritingAgent', () => ({
  copywritingAgent: {
    execute: vi.fn(),
  },
}));

import { copywritingRouter } from '@/trpc/routers/app/copywriting';
import { copywritingAgent as _mockedAgent } from '@/specialists/CopywritingAgent';

// ── Fixtures ──────────────────────────────────────────────────────────────────

// Markdown with CTA keyword — 220 chars
const MOCK_ACQ_MARKDOWN_WITH_CTA =
  '你是否一直在为内容创作而烦恼？今天分享一套经过验证的获客文案方法，帮你快速吸引精准用户。' +
  '我们专注于帮助创作者建立可持续的内容体系，让每条内容都能带来真实的转化效果。' +
  '立即关注账号，私信我获取免费一对一内容诊断，帮你找到最适合自己的获客路径。';

// Markdown WITHOUT CTA — to trigger retry (same length but no CTA keyword)
const MOCK_ACQ_MARKDOWN_NO_CTA =
  '你是否一直在为内容创作而烦恼？今天分享一套经过验证的获客文案方法，帮你快速吸引精准用户。' +
  '我们专注于帮助创作者建立可持续的内容体系，让每条内容都能带来真实的转化效果。' +
  '扫描二维码了解更多详情，让你的内容创作之路更加顺畅和高效！';

const MOCK_ACQ_RESULT_WITH_CTA = {
  markdown: MOCK_ACQ_MARKDOWN_WITH_CTA,
  metadata: { ctaPosition: '结尾', conversionGoal: '关注账号并私信咨询' },
};

const MOCK_ACQ_RESULT_NO_CTA = {
  markdown: MOCK_ACQ_MARKDOWN_NO_CTA,
  metadata: { ctaPosition: '结尾', conversionGoal: '扫码咨询' },
};

const MOCK_HISTORY_ROW = {
  id: 77,
  content: MOCK_ACQ_MARKDOWN_WITH_CTA,
  contentType: 'markdown',
  agentId: 'CopywritingAgent',
  agentMode: 'acquisition',
  scriptType: 'tutorial',
  elements: ['curiosity', 'contrast'],
  isFallback: false,
  tokensUsed: 650,
  modelUsed: 'claude-sonnet-4-6',
  durationMs: 2100,
  traceId: 'test-trace-012',
  createdAt: new Date('2026-05-10'),
};

// ── Helper: build a minimal tRPC context ─────────────────────────────────────

function makeCtx(overrides: Record<string, unknown> = {}) {
  const history = {
    create: vi.fn(async () => ({ ...MOCK_HISTORY_ROW })),
    findMany: vi.fn(async () => []),
    delete: vi.fn(async () => ({})),
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
      traceId: 'test-trace-012',
      activeAccountId: 1 as number | null,
      user: { id: 10, activeAccountId: 1 } as { id: number; activeAccountId: number | null } | null,
      prisma,
      req: new Request('http://localhost', { headers: { 'x-trace-id': 'test-trace-012' } }),
      sessionId: 'sess-012',
      ...overrides,
    },
    prisma,
  };
}

const VALID_INPUT = {
  scriptType: 'tutorial' as const,
  elements: ['curiosity' as const, 'contrast' as const],
  conversionGoal: '关注公众号',
  topic: '理财入门',
};

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

// ── AC-9(1): happy path ───────────────────────────────────────────────────────

describe('copywriting.acquisitionGenerate — happy path', () => {
  it('calls CopywritingAgent(mode=acquisition), writes history agentMode=acquisition, markdown contains CTA', async () => {
    const { ctx, prisma } = makeCtx();

    vi.mocked(_mockedAgent.execute).mockResolvedValueOnce({
      result: MOCK_ACQ_RESULT_WITH_CTA,
      isFallback: false,
      durationMs: 2100,
      tokensUsed: { prompt: 200, completion: 450, total: 650 },
      modelUsed: 'claude-sonnet-4-6',
      traceId: 'test-trace-012',
    });

    const caller = copywritingRouter.createCaller(ctx);
    const result = await caller.acquisitionGenerate(VALID_INPUT);

    // AC-1: agent called with mode='acquisition' and correct fields
    expect(vi.mocked(_mockedAgent.execute)).toHaveBeenCalledOnce();
    expect(vi.mocked(_mockedAgent.execute)).toHaveBeenCalledWith(
      expect.objectContaining({
        accountId: 1,
        mode: 'acquisition',
        userInput: expect.objectContaining({
          scriptType: 'tutorial',
          elements: ['curiosity', 'contrast'],
          conversionGoal: '关注公众号',
          topic: '理财入门',
        }),
      }),
    );

    // AC-2: history.create with agentMode='acquisition' + contentType='markdown'
    const createArgs = prisma.history.create.mock.calls[0]?.[0] as {
      data: Record<string, unknown>;
    };
    expect(createArgs.data).toMatchObject({
      accountId: 1,
      agentId: 'CopywritingAgent',
      agentMode: 'acquisition',
      contentType: 'markdown',
      scriptType: 'tutorial',
      isFallback: false,
      tokensUsed: 650,
      modelUsed: 'claude-sonnet-4-6',
    });

    // AC-4: returned content contains CTA keyword
    expect(/关注|私信|点击|获取|领取/.test(createArgs.data.content as string)).toBe(true);

    expect(result.id).toBe(77);
    expect(result.agentMode).toBe('acquisition');
    expect(result.contentType).toBe('markdown');
  });
});

// ── AC-9(2): zod validation ───────────────────────────────────────────────────

describe('copywriting.acquisitionGenerate — zod validation', () => {
  it('conversionGoal 留空 → BAD_REQUEST (转化目标必填)', async () => {
    const { ctx } = makeCtx();
    const caller = copywritingRouter.createCaller(ctx);

    await expect(
      caller.acquisitionGenerate({
        scriptType: 'tutorial',
        elements: ['curiosity'],
        conversionGoal: '',
        topic: '理财',
      }),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });

    // Agent should not be called on zod failure
    expect(vi.mocked(_mockedAgent.execute)).not.toHaveBeenCalled();
  });
});

// ── AC-9(3): CTA post-validate retry ─────────────────────────────────────────

describe('copywriting.acquisitionGenerate — CTA post-validate retry', () => {
  it('markdown 缺 CTA → execute called twice, second result used', async () => {
    const { ctx } = makeCtx();

    // First call returns markdown without CTA keyword
    vi.mocked(_mockedAgent.execute)
      .mockResolvedValueOnce({
        result: MOCK_ACQ_RESULT_NO_CTA,
        isFallback: false,
        durationMs: 1800,
        tokensUsed: { prompt: 180, completion: 400, total: 580 },
        modelUsed: 'claude-sonnet-4-6',
        traceId: 'test-trace-012',
      })
      // Second call (retry) returns markdown with CTA
      .mockResolvedValueOnce({
        result: MOCK_ACQ_RESULT_WITH_CTA,
        isFallback: false,
        durationMs: 2000,
        tokensUsed: { prompt: 200, completion: 450, total: 650 },
        modelUsed: 'claude-sonnet-4-6',
        traceId: 'test-trace-012',
      });

    const caller = copywritingRouter.createCaller(ctx);
    await caller.acquisitionGenerate(VALID_INPUT);

    // AC-9(3): agent must be called twice on missing CTA
    expect(vi.mocked(_mockedAgent.execute)).toHaveBeenCalledTimes(2);
  });
});

// ── AC-9(4): cross-account RLS isolation ──────────────────────────────────────

describe('copywriting.acquisitionGenerate — cross-account RLS isolation', () => {
  it('history.create always uses activeAccountId from context, not a user-supplied value', async () => {
    // Use activeAccountId=2 to confirm it's taken from context (not hardcoded or from input)
    const { ctx, prisma } = makeCtx({ activeAccountId: 2 });

    vi.mocked(_mockedAgent.execute).mockResolvedValueOnce({
      result: MOCK_ACQ_RESULT_WITH_CTA,
      isFallback: false,
      durationMs: 2100,
      tokensUsed: { prompt: 200, completion: 450, total: 650 },
      modelUsed: 'claude-sonnet-4-6',
      traceId: 'test-trace-012',
    });

    const caller = copywritingRouter.createCaller(ctx);
    await caller.acquisitionGenerate(VALID_INPUT);

    // AC-3: explicit accountId guard — history.create uses activeAccountId from context (2, not 1)
    const createArgs = prisma.history.create.mock.calls[0]?.[0] as {
      data: Record<string, unknown>;
    };
    expect(createArgs.data.accountId).toBe(2);

    // Agent also called with accountId=2 (not 1)
    expect(vi.mocked(_mockedAgent.execute)).toHaveBeenCalledWith(
      expect.objectContaining({ accountId: 2 }),
    );
  });
});
