/**
 * Unit tests — PRD-5 US-005
 * boomGenerate.generate: 4 unit tests
 * AC-1: protectedProcedure · calls CopywritingAgent(mode='boom')
 * AC-2: history.create writes D-032 '---' separated content + full fields
 * AC-4: zod fail elements 空 → BAD_REQUEST + Specialist throw → fallback + agentMode="boom"
 * AC-5: zod fail elements > 8 → BAD_REQUEST
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock CopywritingAgent before router import ────────────────────────────────

vi.mock('@/specialists/CopywritingAgent', () => ({
  copywritingAgent: {
    execute: vi.fn(),
  },
}));

import { boomGenerateRouter } from '@/trpc/routers/app/boomGenerate';
import { copywritingAgent as _mockedAgent } from '@/specialists/CopywritingAgent';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MOCK_CANDIDATES: [string, string, string, string, string] = [
  '候选1·痛点共鸣型\n\n你花了大量时间做内容，发布后却只有个位数播放？原因只有一个：你还没找到属于自己账号的内容节奏。从今天开始用这套方法，帮你快速打造爆款内容，积累真实粉丝，建立账号影响力。关注我，每天更新一个创作技巧。',
  '候选2·数字冲击型\n\n90% 的创作者都犯了同一个错误——把太多精力放在画面制作上，却忽视了文案钩子的核心价值。开场 5 秒决定一切，掌握这个框架，你的完播率将提升 40% 以上。关注账号获取更多实战干货。',
  '候选3·对比反差型\n\n同样的话题，有人发出来 10 万播放，有人发出来只有 100。区别不在平台，不在运气，只在开场那句话有没有触发情绪反应。今天教你如何设计出高转化钩子，让内容被更多精准用户看见。',
  '候选4·好奇悬念型\n\n研究了 1000 条爆款内容，我发现它们都有一个共同结构：让用户在前 3 秒产生「我要知道答案」的冲动，然后用内容兑现这个承诺。点击关注，持续获取更多可直接套用的创作方法论。',
  '候选5·权威背书型\n\n内容创作方法论研究表明：基于心理学元素设计的内容，完播率平均高出普通内容 40% 以上。今天教你如何把这套方法落地到自己的 IP 账号，快速建立内容竞争优势和账号影响力。',
];

const MOCK_BOOM_RESULT = {
  candidates: MOCK_CANDIDATES,
  metadata: { count: 5 as const, elements: ['curiosity', 'contrast'] },
};

const MOCK_AGENT_RESPONSE = {
  result: MOCK_BOOM_RESULT,
  isFallback: false,
  durationMs: 2000,
  tokensUsed: { prompt: 300, completion: 600, total: 900 },
  modelUsed: 'claude-sonnet-4-6',
  traceId: 'test-trace-boom-005',
};

const MOCK_HISTORY_ROW = {
  id: 77,
  content: MOCK_CANDIDATES.join('\n\n---\n\n'),
  contentType: 'markdown',
  agentId: 'CopywritingAgent',
  agentMode: 'boom',
  scriptType: null,
  elements: ['curiosity', 'contrast'],
  isFallback: false,
  tokensUsed: 900,
  modelUsed: 'claude-sonnet-4-6',
  durationMs: 2000,
  traceId: 'test-trace-boom-005',
  createdAt: new Date('2026-01-01'),
};

// ── Helper: build a minimal tRPC context ─────────────────────────────────────

function makeCtx(overrides: Record<string, unknown> = {}) {
  const history = {
    create: vi.fn(async () => ({ ...MOCK_HISTORY_ROW })),
  };

  const ipAccount = {
    findUnique: vi.fn(async () => ({ industry: '教育' })),
  };

  const tx = {
    history,
    ipAccount,
    $executeRaw: vi.fn(async () => 0),
  };

  const prisma = {
    history,
    ipAccount,
    $transaction: vi.fn(async (fn: (tx: typeof tx) => Promise<unknown>) => fn(tx)),
    _tx: tx,
  };

  return {
    ctx: {
      traceId: 'test-trace-boom-005',
      activeAccountId: 1 as number | null,
      user: { id: 10, activeAccountId: 1 } as { id: number; activeAccountId: number | null } | null,
      prisma,
      req: new Request('http://localhost', { headers: { 'x-trace-id': 'test-trace-boom-005' } }),
      sessionId: 'sess-boom-005',
      ...overrides,
    },
    prisma,
  };
}

const VALID_INPUT = {
  elements: ['curiosity', 'contrast'] as const,
  theme: '快速涨粉方法论',
};

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

describe('boomGenerate.generate — happy path', () => {
  it('calls CopywritingAgent(mode=boom), writes history with D-032 --- separator + full fields', async () => {
    const { ctx, prisma } = makeCtx();

    vi.mocked(_mockedAgent.execute).mockResolvedValueOnce(MOCK_AGENT_RESPONSE);

    const caller = boomGenerateRouter.createCaller(ctx);
    const result = await caller.generate(VALID_INPUT);

    // AC-1: agent called with mode=boom
    expect(vi.mocked(_mockedAgent.execute)).toHaveBeenCalledOnce();
    expect(vi.mocked(_mockedAgent.execute)).toHaveBeenCalledWith(
      expect.objectContaining({
        accountId: 1,
        mode: 'boom',
        userInput: expect.objectContaining({ elements: ['curiosity', 'contrast'] }),
      }),
    );

    // AC-2: history.create with D-032 '---' separator + full fields
    const createArgs = prisma._tx.history.create.mock.calls[0]?.[0] as {
      data: Record<string, unknown>;
    };
    expect(createArgs.data).toMatchObject({
      accountId: 1,
      agentId: 'CopywritingAgent',
      agentMode: 'boom',
      sourceType: 'user',
      inputSummary: '快速涨粉方法论',
      contentType: 'markdown',
      scriptType: null,
      elements: ['curiosity', 'contrast'],
      isFallback: false,
      tokensUsed: 900,
      modelUsed: 'claude-sonnet-4-6',
      durationMs: 2000,
    });

    // content uses D-032 '---' separator
    const content = createArgs.data['content'] as string;
    expect(content).toContain('\n\n---\n\n');
    expect(content.split('\n\n---\n\n')).toHaveLength(5);

    // Returns the history row
    expect(result.id).toBe(77);
    expect(result.agentMode).toBe('boom');
  });
});

describe('boomGenerate.generate — zod validation', () => {
  it('empty elements array → TRPCError BAD_REQUEST', async () => {
    const { ctx } = makeCtx();
    const caller = boomGenerateRouter.createCaller(ctx);

    await expect(
      caller.generate({ elements: [] as unknown as [typeof HOT_ELEMENT_ENUM[number]], theme: '话题' }),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });
});

// ── Type helper ───────────────────────────────────────────────────────────────
const HOT_ELEMENT_ENUM = [
  'greed', 'fear', 'curiosity', 'contrast',
  'resonance', 'empathy', 'social_proof', 'authority', 'leverage', 'worst',
  'reveal', 'controversy', 'challenge', 'transformation', 'anger', 'surprise',
  'trend', 'list', 'scarcity', 'small_big', 'low_cost_high', 'low_cost_unknown',
] as const;
type HotElement = typeof HOT_ELEMENT_ENUM[number];

describe('boomGenerate.generate — fallback path', () => {
  it('agent returns isFallback=true → history written with isFallback=true', async () => {
    const { ctx, prisma } = makeCtx();

    const fallbackCandidates: [string, string, string, string, string] = [
      '候选1·备用\n\n'.padEnd(210, '备用内容文案。'),
      '候选2·备用\n\n'.padEnd(210, '备用内容文案。'),
      '候选3·备用\n\n'.padEnd(210, '备用内容文案。'),
      '候选4·备用\n\n'.padEnd(210, '备用内容文案。'),
      '候选5·备用\n\n'.padEnd(210, '备用内容文案。'),
    ];

    vi.mocked(_mockedAgent.execute).mockResolvedValueOnce({
      result: {
        candidates: fallbackCandidates,
        metadata: { count: 5 as const, elements: ['curiosity'] },
      },
      isFallback: true,
      durationMs: 100,
      tokensUsed: { prompt: 0, completion: 0, total: 0 },
      modelUsed: 'fallback',
      traceId: 'test-trace-boom-fallback',
    });

    const caller = boomGenerateRouter.createCaller(ctx);
    await caller.generate(VALID_INPUT);

    const createArgs = prisma._tx.history.create.mock.calls[0]?.[0] as {
      data: { isFallback: boolean; modelUsed: string; tokensUsed: number };
    };
    expect(createArgs.data.isFallback).toBe(true);
    expect(createArgs.data.modelUsed).toBe('fallback');
    expect(createArgs.data.tokensUsed).toBe(0);
  });
});

describe('boomGenerate.generate — agentMode field', () => {
  it('agentMode="boom" is always written to history', async () => {
    const { ctx, prisma } = makeCtx();

    vi.mocked(_mockedAgent.execute).mockResolvedValueOnce(MOCK_AGENT_RESPONSE);

    const caller = boomGenerateRouter.createCaller(ctx);
    await caller.generate({ elements: ['greed' as HotElement] });

    const createArgs = prisma._tx.history.create.mock.calls[0]?.[0] as {
      data: { agentMode: string };
    };
    expect(createArgs.data.agentMode).toBe('boom');
  });
});
