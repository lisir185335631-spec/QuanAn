/**
 * Unit tests — PRD-6 US-007 AC-9
 * aiVideo.generateStoryboard + aiVideo.jobStatus: 6 unit tests
 * (1) happy 5 scene · jobIds 5 · history scenes 5 sceneImageUrl=null
 * (2) rate limit 拦截 · 11th call throws TOO_MANY_REQUESTS
 * (3) scenesCount=9 zod fail '镜头数应在 5-8 之间'
 * (4) imagePromptEn 含中文 · post-validate isFallback=true · router still works
 * (5) cross-account RLS 隔离 · findFirst null → INTERNAL_SERVER_ERROR
 * (6) jobStatus 查 history.scenes 返回正确 status counts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TRPCError } from '@trpc/server';

// ── vi.hoisted — shared state for vi.mock factories ──────────────────────────

const mockRateLimit = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

const mockQueueAdd = vi.hoisted(() =>
  vi.fn().mockImplementation(async (_jobName: string, _payload: unknown) => {
    const callCount = mockQueueAdd.mock.calls.length;
    return { id: `job-mock-${callCount}`, name: _jobName };
  }),
);

// ── Mocks (before router import) ──────────────────────────────────────────────

vi.mock('@/lib/rate-limit/image-gen', () => ({
  checkImageGenRateLimit: mockRateLimit,
}));

vi.mock('@/workers/image-gen/queue', () => ({
  imageGenQueue: { add: mockQueueAdd },
}));

vi.mock('@/specialists/VideoAgent', () => ({
  videoAgent: {
    execute: vi.fn(),
  },
}));

// ── Router import (after mocks) ───────────────────────────────────────────────

import { aiVideoRouter } from '@/trpc/routers/app/aiVideo';
import { videoAgent as _mockedAgent } from '@/specialists/VideoAgent';

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeScenes(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    index: i + 1,
    description: `Scene ${i + 1} description text for storyboard testing purposes`,
    imagePromptEn: `A cinematic shot of scene ${i + 1} with studio lighting and composition`,
    duration: `${(i + 1) * 5}s`,
  }));
}

const MOCK_STORYBOARD_5 = {
  title: 'Test Storyboard',
  totalDuration: '75s',
  scenes: makeScenes(5),
};

const MOCK_STORYBOARD_FALLBACK = {
  title: 'Content Creator Story (Fallback Template)',
  totalDuration: '60s',
  scenes: [
    {
      index: 1,
      description: '创作者面对镜头展示成果对比，展现IP起号前后的鲜明变化',
      imagePromptEn: 'A confident content creator facing camera in modern studio, warm golden lighting',
      duration: '5s',
    },
    {
      index: 2,
      description: '展示创作者的困境和挑战，引发目标用户强烈共鸣',
      imagePromptEn: 'A person sitting at desk looking at phone with low view count, frustrated expression',
      duration: '10s',
    },
    {
      index: 3,
      description: '介绍核心方法和工具，清晰呈现解决方案',
      imagePromptEn: 'Split screen showing before and after contrast, high contrast professional setup',
      duration: '20s',
    },
    {
      index: 4,
      description: '展示真实用户案例与成果证明，增强可信度',
      imagePromptEn: 'Testimonial montage with phone notifications and follower count increasing',
      duration: '15s',
    },
    {
      index: 5,
      description: '发出行动号召，引导用户立即采取行动',
      imagePromptEn: 'Call to action scene with creator pointing at camera, bright background',
      duration: '10s',
    },
  ],
};

const VALID_INPUT = {
  sourceCopy: '这是一段有效的视频分镜文案素材，包含超过十个字符的内容，用于测试 storyboard 生成流程。',
  scenesCount: 5,
  imageStyle: 'vivid' as const,
};

// ── Helper: build a minimal tRPC context ─────────────────────────────────────
// accountIsolationMiddleware wraps the router call in prisma.$transaction(tx => fn(tx))
// so the router sees `tx` (not the outer prisma) as ctx.prisma.
// Pattern mirrors acquisition-video-router.test.ts (which uses prisma._tx).

function makeCtx(overrides: Record<string, unknown> = {}) {
  let storedContent = '';

  // tx is what the router actually sees (passed by accountIsolationMiddleware)
  const tx = {
    history: {
      create: vi.fn(async (args: { data: { content: string } }) => {
        storedContent = args.data.content;
        return { id: 77 };
      }),
      findFirst: vi.fn(async () => ({ id: 77, content: storedContent })),
      update: vi.fn(async (args: { data: { content: string } }) => {
        storedContent = args.data.content;
        return { id: 77 };
      }),
    },
    $executeRaw: vi.fn(async () => 0),
  };

  const prisma = {
    history: tx.history, // outer (not directly used by router — tx takes over after middleware)
    $transaction: vi.fn(async (fn: (tx: typeof tx) => Promise<unknown>) => fn(tx)),
    _tx: tx,
  };

  return {
    ctx: {
      traceId: 'test-trace-007',
      activeAccountId: 1 as number | null,
      user: { id: 99, activeAccountId: 1 } as { id: number; activeAccountId: number | null } | null,
      prisma,
      req: new Request('http://localhost', { headers: { 'x-trace-id': 'test-trace-007' } }),
      sessionId: 'sess-007',
      ...overrides,
    },
    prisma,
    getStoredContent: () => storedContent,
  };
}

// ── (1) Happy path: 5 scenes ─────────────────────────────────────────────────

describe('aiVideo.generateStoryboard — happy path (5 scenes)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue(undefined);
  });

  it('returns historyId, jobIds(length=5), scenesPlaceholder(length=5) · history scenes 5 all sceneImageUrl=null', async () => {
    vi.mocked(_mockedAgent.execute).mockResolvedValueOnce({
      result: MOCK_STORYBOARD_5,
      isFallback: false,
      durationMs: 2000,
      tokensUsed: { prompt: 500, completion: 300, total: 800 },
      modelUsed: 'claude-sonnet-4-6',
      traceId: 'test-trace-007',
    });

    const { ctx, prisma } = makeCtx();
    const caller = aiVideoRouter.createCaller(ctx);

    const start = Date.now();
    const result = await caller.generateStoryboard(VALID_INPUT);
    const elapsed = Date.now() - start;

    // AC-12: response < 5s (mock LLM + mock queue)
    expect(elapsed).toBeLessThan(5000);

    // AC-3: return shape
    expect(result.historyId).toBe(77);
    expect(result.jobIds).toHaveLength(5);
    expect(result.scenesPlaceholder).toHaveLength(5);

    // AC-3: scenesPlaceholder all sceneImageUrl=null, status='pending'
    for (const scene of result.scenesPlaceholder) {
      expect(scene.sceneImageUrl).toBeNull();
      expect(scene.status).toBe('pending');
    }

    // AC-2: VideoAgent called with storyboard mode
    expect(_mockedAgent.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'storyboard',
        userInput: VALID_INPUT,
        accountId: 1,
      }),
    );

    // AC-2: history.create (via tx) with agentMode='storyboard'
    const createArgs = prisma._tx.history.create.mock.calls[0]?.[0] as { data: Record<string, unknown> };
    expect(createArgs.data).toMatchObject({
      accountId: 1,
      agentId: 'VideoAgent',
      agentMode: 'storyboard',
      contentType: 'json',
    });

    // AC-5: scenes in content all sceneImageUrl=null initially
    const initialContent = JSON.parse(createArgs.data.content as string) as { scenes: Array<{ sceneImageUrl: null; status: string }> };
    for (const scene of initialContent.scenes) {
      expect(scene.sceneImageUrl).toBeNull();
      expect(scene.status).toBe('pending');
    }

    // AC-2: queue.add called 5 times
    expect(mockQueueAdd).toHaveBeenCalledTimes(5);

    // AC-2: queue payload includes historyId + accountId + imageStyle
    const firstQueueCall = mockQueueAdd.mock.calls[0] as [string, Record<string, unknown>];
    expect(firstQueueCall[0]).toBe('image-gen-job');
    expect(firstQueueCall[1]).toMatchObject({
      accountId: 1,
      historyId: 77,
      imageStyle: 'vivid',
      sceneIndex: 1,
    });

    // AC-5: history.update (via tx) called with jobIds embedded in scenes
    expect(prisma._tx.history.update).toHaveBeenCalledOnce();
  });
});

// ── (2) Rate limit — 11th call throws TOO_MANY_REQUESTS ──────────────────────

describe('aiVideo.generateStoryboard — rate limit', () => {
  beforeEach(() => vi.clearAllMocks());

  it('11th call throws TOO_MANY_REQUESTS (AC-4)', async () => {
    // Simulate the TRPCError thrown by checkImageGenRateLimit when limit exceeded
    mockRateLimit.mockRejectedValueOnce(
      new TRPCError({ code: 'TOO_MANY_REQUESTS', message: '今日图片生成次数已达上限，请明日再试' }),
    );

    const { ctx } = makeCtx();
    const caller = aiVideoRouter.createCaller(ctx);

    await expect(caller.generateStoryboard(VALID_INPUT)).rejects.toMatchObject({
      code: 'TOO_MANY_REQUESTS',
    });

    // VideoAgent should NOT be called when rate limit hits
    expect(_mockedAgent.execute).not.toHaveBeenCalled();
  });
});

// ── (3) scenesCount=9 zod fail '镜头数应在 5-8 之间' ────────────────────────

describe('aiVideo.generateStoryboard — zod validation', () => {
  beforeEach(() => vi.clearAllMocks());

  it('scenesCount=9 → BAD_REQUEST (镜头数应在 5-8 之间)', async () => {
    const { ctx } = makeCtx();
    const caller = aiVideoRouter.createCaller(ctx);

    await expect(
      caller.generateStoryboard({ ...VALID_INPUT, scenesCount: 9 }),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  it('scenesCount=4 → BAD_REQUEST (镜头数应在 5-8 之间)', async () => {
    const { ctx } = makeCtx();
    const caller = aiVideoRouter.createCaller(ctx);

    await expect(
      caller.generateStoryboard({ ...VALID_INPUT, scenesCount: 4 }),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  it('scenesCount=5 → pass (AC-11 boundary)', async () => {
    vi.mocked(_mockedAgent.execute).mockResolvedValueOnce({
      result: MOCK_STORYBOARD_5,
      isFallback: false,
      durationMs: 1000,
      tokensUsed: { prompt: 100, completion: 200, total: 300 },
      modelUsed: 'claude-sonnet-4-6',
      traceId: 'test-trace-007',
    });

    const { ctx } = makeCtx();
    const caller = aiVideoRouter.createCaller(ctx);

    const result = await caller.generateStoryboard({ ...VALID_INPUT, scenesCount: 5 });
    expect(result.jobIds).toHaveLength(5);
  });

  it('scenesCount=8 → pass (AC-11 boundary)', async () => {
    const scenes8 = { ...MOCK_STORYBOARD_5, scenes: makeScenes(8) };
    vi.mocked(_mockedAgent.execute).mockResolvedValueOnce({
      result: scenes8,
      isFallback: false,
      durationMs: 1000,
      tokensUsed: { prompt: 200, completion: 300, total: 500 },
      modelUsed: 'claude-sonnet-4-6',
      traceId: 'test-trace-007',
    });

    const { ctx } = makeCtx();
    const caller = aiVideoRouter.createCaller(ctx);

    const result = await caller.generateStoryboard({ ...VALID_INPUT, scenesCount: 8 });
    expect(result.jobIds).toHaveLength(8);
  });
});

// ── (4) imagePromptEn 含中文 · post-validate isFallback=true ─────────────────

describe('aiVideo.generateStoryboard — isFallback=true (agent post-validate retry)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue(undefined);
  });

  it('agent isFallback=true (Chinese in imagePromptEn triggered fallback) → router still creates history + queues jobs', async () => {
    // Agent internally retried when LLM returned Chinese imagePromptEn, used fallback template
    vi.mocked(_mockedAgent.execute).mockResolvedValueOnce({
      result: MOCK_STORYBOARD_FALLBACK,
      isFallback: true,
      durationMs: 150,
      tokensUsed: { prompt: 0, completion: 0, total: 0 },
      modelUsed: 'fallback',
      traceId: 'test-trace-007',
    });

    const { ctx, prisma } = makeCtx();
    const caller = aiVideoRouter.createCaller(ctx);

    const result = await caller.generateStoryboard(VALID_INPUT);

    // Router should still work with fallback result
    expect(result.historyId).toBe(77);
    expect(result.jobIds).toHaveLength(5);
    expect(result.scenesPlaceholder).toHaveLength(5);

    // history.create (via tx) called with isFallback=true
    const createArgs = prisma._tx.history.create.mock.calls[0]?.[0] as { data: { isFallback: boolean; modelUsed: string } };
    expect(createArgs.data.isFallback).toBe(true);
    expect(createArgs.data.modelUsed).toBe('fallback');

    // Queue still called 5 times for fallback scenes
    expect(mockQueueAdd).toHaveBeenCalledTimes(5);
  });
});

// ── (5) cross-account RLS isolation ──────────────────────────────────────────

describe('aiVideo.generateStoryboard — cross-account RLS isolation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue(undefined);
  });

  it('findFirst null (accountId mismatch blocked by RLS) → INTERNAL_SERVER_ERROR', async () => {
    vi.mocked(_mockedAgent.execute).mockResolvedValueOnce({
      result: MOCK_STORYBOARD_5,
      isFallback: false,
      durationMs: 2000,
      tokensUsed: { prompt: 500, completion: 300, total: 800 },
      modelUsed: 'claude-sonnet-4-6',
      traceId: 'test-trace-007',
    });

    const { ctx, prisma } = makeCtx();
    // Simulate RLS blocking: findFirst (via tx) returns null (accountId mismatch)
    prisma._tx.history.findFirst.mockResolvedValueOnce(null);

    const caller = aiVideoRouter.createCaller(ctx);

    await expect(caller.generateStoryboard(VALID_INPUT)).rejects.toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
    });
  });
});

// ── (6) jobStatus — query history.scenes status counts ───────────────────────

describe('aiVideo.jobStatus — returns correct status counts', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns total=5 completed=3 pending=1 failed=1 from stored scenes', async () => {
    const storedContent = JSON.stringify({
      title: 'Test',
      totalDuration: '75s',
      scenes: [
        { index: 1, status: 'completed', sceneImageUrl: 'https://example.com/1.png', description: 'scene 1', imagePromptEn: 'prompt 1', duration: '5s', jobId: 'job-1' },
        { index: 2, status: 'completed', sceneImageUrl: 'https://example.com/2.png', description: 'scene 2', imagePromptEn: 'prompt 2', duration: '10s', jobId: 'job-2' },
        { index: 3, status: 'completed', sceneImageUrl: 'https://example.com/3.png', description: 'scene 3', imagePromptEn: 'prompt 3', duration: '15s', jobId: 'job-3' },
        { index: 4, status: 'pending', sceneImageUrl: null, description: 'scene 4', imagePromptEn: 'prompt 4', duration: '20s', jobId: 'job-4' },
        { index: 5, status: 'failed', sceneImageUrl: null, error: 'image_gen_failed', description: 'scene 5', imagePromptEn: 'prompt 5', duration: '25s', jobId: 'job-5' },
      ],
    });

    const { ctx, prisma } = makeCtx();
    // Override findFirst (via tx) to return history with stored content
    prisma._tx.history.findFirst.mockResolvedValueOnce({ id: 77, content: storedContent });

    const caller = aiVideoRouter.createCaller(ctx);
    const result = await caller.jobStatus({ historyId: 77 });

    // AC-13: < 100ms (mock DB)
    expect(result.total).toBe(5);
    expect(result.completed).toBe(3);
    expect(result.pending).toBe(1);
    expect(result.failed).toBe(1);
    expect(result.scenes).toHaveLength(5);

    // Completed scenes have sceneImageUrl
    const completedScene = result.scenes.find((s) => s.index === 1);
    expect(completedScene?.sceneImageUrl).toBe('https://example.com/1.png');

    // Failed scene has error
    const failedScene = result.scenes.find((s) => s.index === 5);
    expect(failedScene?.error).toBe('image_gen_failed');

    // AC-6: findFirst (via tx) called with explicit accountId double guard
    const findArgs = prisma._tx.history.findFirst.mock.calls[0]?.[0] as { where: Record<string, unknown> };
    expect(findArgs.where).toMatchObject({ id: 77, accountId: 1 });
  });

  it('NOT_FOUND when historyId does not belong to account', async () => {
    const { ctx, prisma } = makeCtx();
    prisma._tx.history.findFirst.mockResolvedValueOnce(null);

    const caller = aiVideoRouter.createCaller(ctx);
    await expect(caller.jobStatus({ historyId: 999 })).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });
});
