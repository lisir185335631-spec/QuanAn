/**
 * Unit tests — PRD-5 US-003
 * copywriting.freeGenerate: 4 unit tests
 * AC-1: protectedProcedure · calls CopywritingAgent(mode='free')
 * AC-2: history.create writes all required fields
 * AC-6: zod input fail → TRPCError BAD_REQUEST
 * AC-7: agent isFallback=true → history written with isFallback=true
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
// Note: @trpc/server lives in apps/api/node_modules — cannot import TRPCError directly in root vitest.
// Test error fields via toMatchObject({ code: 'BAD_REQUEST' }) instead.

// ── Mock CopywritingAgent before router import (vi.mock factory must not reference outer vars) ──

vi.mock('@/specialists/CopywritingAgent', () => ({
  copywritingAgent: {
    execute: vi.fn(),
  },
}));

// Import router and mocked agent AFTER vi.mock declaration (vi.mock is hoisted, imports resolve after)
import { copywritingRouter } from '@/trpc/routers/app/copywriting';
import { copywritingAgent as _mockedAgent } from '@/specialists/CopywritingAgent';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MOCK_FREE_MARKDOWN =
  '# 爆款文案标题\n\n第一段内容钩子，让读者停下来继续看。\n\n第二段核心价值输出，提供具体可操作的干货信息和方法论。\n\n第三段行动引导，告诉读者下一步该做什么，关注账号获取更多内容。' +
  'x'.repeat(300);

const MOCK_FREE_RESULT = {
  markdown: MOCK_FREE_MARKDOWN,
  metadata: {
    scriptType: 'tutorial',
    elements: ['curiosity'],
    structureSummary: '钩子→干货→行动',
    estimatedDuration: '60-90 秒',
  },
};

const FALLBACK_FREE_RESULT = {
  markdown: '# 爆款文案（备用模板）\n\n备用内容正文占位。'.padEnd(410, '备用内容，稍后重试。'),
  metadata: {
    scriptType: 'tutorial',
    elements: ['curiosity', 'contrast'],
    structureSummary: '钩子→三步框架→行动引导（通用备用）',
    estimatedDuration: '60-90 秒',
  },
};

const MOCK_HISTORY_ROW = {
  id: 42,
  content: MOCK_FREE_MARKDOWN,
  contentType: 'markdown',
  agentId: 'CopywritingAgent',
  agentMode: 'free',
  scriptType: 'tutorial',
  elements: ['curiosity'],
  isFallback: false,
  tokensUsed: 700,
  modelUsed: 'claude-sonnet-4-6',
  durationMs: 1200,
  traceId: 'test-trace-003',
  createdAt: new Date('2026-01-01'),
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
      traceId: 'test-trace-003',
      activeAccountId: 1 as number | null,
      user: { id: 42, activeAccountId: 1 } as { id: number; activeAccountId: number | null } | null,
      prisma,
      req: new Request('http://localhost', { headers: { 'x-trace-id': 'test-trace-003' } }),
      sessionId: 'sess-003',
      ...overrides,
    },
    prisma,
  };
}

const VALID_INPUT = {
  scriptType: 'tutorial' as const,
  elements: ['curiosity' as const],
  topic: '如何快速涨粉 — 三步打造爆款内容框架',
};

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

describe('copywriting.freeGenerate — happy path', () => {
  it('calls CopywritingAgent(mode=free), writes history with full fields, returns row', async () => {
    const { ctx, prisma } = makeCtx();

    vi.mocked(_mockedAgent.execute).mockResolvedValueOnce({
      result: MOCK_FREE_RESULT,
      isFallback: false,
      durationMs: 1200,
      tokensUsed: { prompt: 200, completion: 500, total: 700 },
      modelUsed: 'claude-sonnet-4-6',
      traceId: 'test-trace-003',
    });

    const caller = copywritingRouter.createCaller(ctx);
    const result = await caller.freeGenerate(VALID_INPUT);

    // AC-1: agent called with correct args
    expect(vi.mocked(_mockedAgent.execute)).toHaveBeenCalledOnce();
    expect(vi.mocked(_mockedAgent.execute)).toHaveBeenCalledWith(
      expect.objectContaining({
        accountId: 1,
        mode: 'free',
        userInput: VALID_INPUT,
      }),
    );

    // AC-2: history.create called with all required fields
    const createArgs = prisma._tx.history.create.mock.calls[0]?.[0] as {
      data: Record<string, unknown>;
    };
    expect(createArgs.data).toMatchObject({
      accountId: 1,
      agentId: 'CopywritingAgent',
      agentMode: 'free',
      sourceType: 'user',
      inputSummary: VALID_INPUT.topic,
      content: MOCK_FREE_MARKDOWN,
      contentType: 'markdown',
      scriptType: 'tutorial',
      isFallback: false,
      tokensUsed: 700,
      modelUsed: 'claude-sonnet-4-6',
      durationMs: 1200,
    });

    // Returns the history row
    expect(result.id).toBe(42);
    expect(result.agentMode).toBe('free');
  });
});

describe('copywriting.freeGenerate — zod validation', () => {
  it('empty topic → TRPCError BAD_REQUEST', async () => {
    const { ctx } = makeCtx();
    const caller = copywritingRouter.createCaller(ctx);

    await expect(
      caller.freeGenerate({ scriptType: 'tutorial', elements: ['curiosity'], topic: '' }),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });
});

describe('copywriting.freeGenerate — fallback path', () => {
  it('agent returns isFallback=true → history written with isFallback=true', async () => {
    const { ctx, prisma } = makeCtx();

    vi.mocked(_mockedAgent.execute).mockResolvedValueOnce({
      result: FALLBACK_FREE_RESULT,
      isFallback: true,
      durationMs: 300,
      tokensUsed: { prompt: 0, completion: 0, total: 0 },
      modelUsed: 'fallback',
      traceId: 'test-trace-003',
    });

    const caller = copywritingRouter.createCaller(ctx);
    await caller.freeGenerate(VALID_INPUT);

    const createArgs = prisma._tx.history.create.mock.calls[0]?.[0] as {
      data: { isFallback: boolean; modelUsed: string; tokensUsed: number };
    };
    expect(createArgs.data.isFallback).toBe(true);
    expect(createArgs.data.modelUsed).toBe('fallback');
    expect(createArgs.data.tokensUsed).toBe(0);
  });
});

describe('copywriting.freeGenerate — agentMode field', () => {
  it('agentMode="free" is always written to history regardless of result', async () => {
    const { ctx, prisma } = makeCtx();

    vi.mocked(_mockedAgent.execute).mockResolvedValueOnce({
      result: MOCK_FREE_RESULT,
      isFallback: false,
      durationMs: 900,
      tokensUsed: { prompt: 100, completion: 200, total: 300 },
      modelUsed: 'claude-haiku-4-5',
      traceId: 'test-trace-003',
    });

    const caller = copywritingRouter.createCaller(ctx);
    await caller.freeGenerate(VALID_INPUT);

    const createArgs = prisma._tx.history.create.mock.calls[0]?.[0] as {
      data: { agentMode: string };
    };
    expect(createArgs.data.agentMode).toBe('free');
  });
});
