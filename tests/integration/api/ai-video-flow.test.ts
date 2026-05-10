/**
 * Integration test — PRD-6 US-007 AC-10
 * aiVideo.generateStoryboard + aiVideo.jobStatus: queue mock + real DB
 * Flow: generateStoryboard → 5 jobs queued → mock worker 反写 history → jobStatus completed=5
 */

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';

// ── Mocks (before router import) ──────────────────────────────────────────────

const mockQueueAddIntegration = vi.hoisted(() => {
  let callCount = 0;
  return vi.fn().mockImplementation(async () => {
    callCount++;
    return { id: `integ-job-${callCount}`, name: 'image-gen-job' };
  });
});

vi.mock('@/workers/image-gen/queue', () => ({
  imageGenQueue: { add: mockQueueAddIntegration },
}));

vi.mock('@/lib/rate-limit/image-gen', () => ({
  checkImageGenRateLimit: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/specialists/VideoAgent', () => ({
  videoAgent: { execute: vi.fn() },
}));

vi.mock('@/lib/logger', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/logger')>();
  return { ...actual, logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } };
});

// ── Router import (after mocks) ───────────────────────────────────────────────

import { aiVideoRouter } from '@/trpc/routers/aiVideo';
import { videoAgent as _mockedAgent } from '@/specialists/VideoAgent';

// ── Fixtures ──────────────────────────────────────────────────────────────────

let testAccountId = 0;
let testUserId = 0;

const MOCK_STORYBOARD_5_SCENES = {
  title: 'Integration Test Storyboard',
  totalDuration: '75s',
  scenes: [
    { index: 1, description: '开场镜头特写产品', imagePromptEn: 'Close-up shot of product with studio lighting on clean background', duration: '5s' },
    { index: 2, description: '使用场景展示', imagePromptEn: 'Person using product outdoors in natural daylight setting', duration: '10s' },
    { index: 3, description: '产品功能演示', imagePromptEn: 'Detailed product feature demonstration with annotation arrows', duration: '20s' },
    { index: 4, description: '用户证言场景', imagePromptEn: 'Happy customer testimonial with warm lighting and genuine smile', duration: '25s' },
    { index: 5, description: '行动号召结束场景', imagePromptEn: 'Call to action scene with product display and clear text overlay', duration: '15s' },
  ],
};

async function createTestFixtures(): Promise<void> {
  const user = await prisma.user.create({
    data: {
      openId: `test-ai-video-flow-${Date.now()}`,
      name: 'Test AI Video Flow User',
      email: `ai-video-flow-${Date.now()}@test.internal`,
      loginMethod: 'google',
    },
  });
  testUserId = user.id;

  const account = await prisma.ipAccount.create({
    data: {
      userId: user.id,
      name: 'Test AI Video Account',
      industry: '教育培训',
      platform: 'douyin',
    },
  });
  testAccountId = account.id;
}

async function cleanupTestFixtures(): Promise<void> {
  if (testAccountId) {
    // Clean histories (cascade from account)
    await prisma.history.deleteMany({ where: { accountId: testAccountId } });
    await prisma.ipAccount.deleteMany({ where: { id: testAccountId } });
  }
  if (testUserId) {
    await prisma.user.deleteMany({ where: { id: testUserId } });
  }
}

// ── Helper: build tRPC ctx with real prisma + mocked account ─────────────────

function makeRealCtx() {
  return {
    traceId: `tr_ai_video_flow_${Date.now()}`,
    activeAccountId: testAccountId as number | null,
    user: { id: testUserId, activeAccountId: testAccountId } as { id: number; activeAccountId: number | null } | null,
    prisma,
    req: new Request('http://localhost'),
    sessionId: 'sess-integ-007',
  };
}

beforeAll(async () => {
  await createTestFixtures();
});

afterAll(async () => {
  await cleanupTestFixtures();
});

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Integration test ──────────────────────────────────────────────────────────

describe('US-007 AC-10: aiVideo flow integration — queue mock + real DB', () => {
  it('generateStoryboard: 5 scenes → 5 jobs queued · history written to real DB · jobStatus returns completed=5 after worker mock', async () => {
    vi.mocked(_mockedAgent.execute).mockResolvedValueOnce({
      result: MOCK_STORYBOARD_5_SCENES,
      isFallback: false,
      durationMs: 1500,
      tokensUsed: { prompt: 600, completion: 400, total: 1000 },
      modelUsed: 'claude-sonnet-4-6',
      traceId: 'tr-integ-007',
    });

    const ctx = makeRealCtx();
    const caller = aiVideoRouter.createCaller(ctx);

    // ── Step 1: generateStoryboard ────────────────────────────────────────────
    const result = await caller.generateStoryboard({
      sourceCopy: '这是一段真实的整合测试文案素材，超过10个字符用于触发分镜板生成流程。',
      scenesCount: 5,
      imageStyle: 'vivid',
    });

    // AC-3: return shape
    expect(result.historyId).toBeGreaterThan(0);
    expect(result.jobIds).toHaveLength(5);
    expect(result.scenesPlaceholder).toHaveLength(5);

    // AC-10: 5 jobs queued
    expect(mockQueueAddIntegration).toHaveBeenCalledTimes(5);

    // AC-2: each queue job payload includes historyId + accountId
    for (const [, payload] of mockQueueAddIntegration.mock.calls as [string, Record<string, unknown>][]) {
      expect(payload).toMatchObject({
        historyId: result.historyId,
        accountId: testAccountId,
        imageStyle: 'vivid',
      });
    }

    // AC-2: history written to real DB
    const historyRow = await prisma.history.findFirst({
      where: { id: result.historyId, accountId: testAccountId },
    });
    expect(historyRow).not.toBeNull();
    expect(historyRow?.agentMode).toBe('storyboard');
    expect(historyRow?.agentId).toBe('VideoAgent');

    // AC-5: history.content stores scenes with sceneImageUrl=null initially
    const content = JSON.parse(historyRow!.content) as { scenes: Array<{ sceneImageUrl: string | null; status: string }> };
    expect(content.scenes).toHaveLength(5);
    for (const scene of content.scenes) {
      expect(scene.sceneImageUrl).toBeNull();
      expect(scene.status).toBe('pending');
    }

    // ── Step 2: Simulate worker completing all 5 scenes ───────────────────────
    const updatedScenes = content.scenes.map((scene, i) => ({
      ...scene,
      sceneImageUrl: `https://mock.storage.com/scene-${i + 1}.png`,
      status: 'completed',
    }));

    await prisma.history.update({
      where: { id: result.historyId },
      data: { content: JSON.stringify({ ...content, scenes: updatedScenes }) },
    });

    // ── Step 3: jobStatus returns completed=5 ────────────────────────────────
    const status = await caller.jobStatus({ historyId: result.historyId });

    expect(status.total).toBe(5);
    expect(status.completed).toBe(5);
    expect(status.pending).toBe(0);
    expect(status.failed).toBe(0);

    // All scenes have sceneImageUrl set
    for (const scene of status.scenes) {
      expect(scene.status).toBe('completed');
      expect(scene.sceneImageUrl).toMatch(/mock\.storage\.com\/scene-\d\.png/);
    }
  });

  it('cross-account jobStatus: different accountId → NOT_FOUND', async () => {
    // Create a history for testAccountId
    const history = await prisma.history.create({
      data: {
        accountId: testAccountId,
        agentId: 'VideoAgent',
        agentMode: 'storyboard',
        sourceType: 'user',
        inputSummary: 'cross-account test',
        content: JSON.stringify({ scenes: [] }),
        contentType: 'json',
        isFallback: false,
        traceId: `tr_cross_acct_${Date.now()}`,
      },
    });

    // Try to access with a different accountId
    const otherCtx = {
      ...makeRealCtx(),
      activeAccountId: testAccountId + 9999, // non-existent account
    };

    const caller = aiVideoRouter.createCaller(otherCtx);
    await expect(caller.jobStatus({ historyId: history.id })).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });

    // Cleanup
    await prisma.history.delete({ where: { id: history.id } });
  });
});
