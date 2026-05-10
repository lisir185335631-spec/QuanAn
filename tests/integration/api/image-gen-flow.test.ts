/**
 * Integration test — PRD-6 US-009 AC-13
 * DallE3ImageGenWorker: mock OpenAI SDK · real DB
 * full flow: input → DALL-E mock → Asset write → history 反写 · end-to-end
 */

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';

// ── Mock OpenAI SDK before worker import ──────────────────────────────────────

const mockImagesGenerate = vi.fn();
vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    images: { generate: mockImagesGenerate },
  })),
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// ── Worker import (after mocks) ───────────────────────────────────────────────

import { DallE3ImageGenWorker } from '@/workers/image-gen/dall-e-3';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MOCK_DALLE_URL = 'https://oaidalleapi.blob.core.windows.net/private/integration-test.png';

let testAccountId = 0;
let testHistoryId = 0;
let testTraceId = '';

const MOCK_STORYBOARD_CONTENT = JSON.stringify({
  scenes: [
    { index: 1, description: '开场镜头 · 产品特写', imagePromptEn: 'Close-up shot of product with studio lighting', duration: '5s' },
    { index: 2, description: '使用场景', imagePromptEn: 'Person using product in natural daylight setting', duration: '10s' },
  ],
  totalDuration: '15s',
});

async function createTestFixtures(): Promise<void> {
  const user = await prisma.user.create({
    data: {
      openId: `test-image-gen-flow-${Date.now()}`,
      name: 'Test ImageGen Flow User',
      email: `image-gen-flow-${Date.now()}@test.internal`,
      loginMethod: 'google',
    },
  });
  const account = await prisma.ipAccount.create({
    data: {
      userId: user.id,
      name: 'Test ImageGen Account',
      industry: '美妆',
      platform: 'douyin',
    },
  });
  testAccountId = account.id;

  // Create a storyboard history row (simulating what US-007 would create)
  const history = await prisma.history.create({
    data: {
      accountId: testAccountId,
      agentId: 'VideoAgent',
      agentMode: 'storyboard',
      sourceType: 'user',
      inputSummary: '测试分镜 input summary',
      content: MOCK_STORYBOARD_CONTENT,
      contentType: 'json',
      isFallback: false,
      traceId: `tr_image_gen_flow_${Date.now()}`,
    },
  });
  testHistoryId = history.id;
  testTraceId = history.traceId ?? '';
}

async function cleanupTestFixtures(): Promise<void> {
  if (testHistoryId) {
    await prisma.asset.deleteMany({ where: { relatedHistoryId: testHistoryId } });
    await prisma.costLog.deleteMany({ where: { traceId: testTraceId } });
    await prisma.history.deleteMany({ where: { id: testHistoryId } });
  }
  if (testAccountId) {
    const account = await prisma.ipAccount.findUnique({ where: { id: testAccountId } });
    if (account) {
      await prisma.ipAccount.delete({ where: { id: testAccountId } });
      await prisma.user.delete({ where: { id: account.userId } });
    }
  }
}

beforeAll(async () => {
  process.env.IMAGE_GEN_ENABLED = 'true';
  process.env.OPENAI_API_KEY = 'sk-openai-integration-test';
  await createTestFixtures();
});

afterAll(async () => {
  delete process.env.IMAGE_GEN_ENABLED;
  delete process.env.OPENAI_API_KEY;
  await cleanupTestFixtures();
});

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Integration test ──────────────────────────────────────────────────────────

describe('US-009 AC-13: ImageGen full flow integration — mock OpenAI + real DB', () => {
  it('generate: mock DALL-E 3 → writes Asset to real DB → updates history.scenes[1].sceneImageUrl', async () => {
    mockImagesGenerate.mockResolvedValue({ data: [{ url: MOCK_DALLE_URL }] });

    const payload = {
      sceneIndex: 1,
      imagePromptEn: 'Close-up shot of product with studio lighting',
      accountId: testAccountId,
      traceId: testTraceId,
      historyId: testHistoryId,
      imageStyle: 'vivid' as const,
    };

    const worker = new DallE3ImageGenWorker();
    const start = Date.now();
    const result = await worker.generate(payload);
    const elapsed = Date.now() - start;

    // AC-15: mock call < 100ms
    expect(elapsed).toBeLessThan(100);

    // Result shape
    expect(result).toMatchObject({ sceneImageUrl: MOCK_DALLE_URL, costUsd: 0.04 });

    // OpenAI was called once with correct params
    expect(mockImagesGenerate).toHaveBeenCalledOnce();
    expect(mockImagesGenerate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'dall-e-3',
        prompt: payload.imagePromptEn,
        size: '1024x1024',
        style: 'vivid',
        quality: 'standard',
      }),
    );

    // AC-13: Asset written to real DB
    const assetRow = await prisma.asset.findFirst({
      where: { relatedHistoryId: testHistoryId, assetType: 'scene_image' },
    });
    expect(assetRow).not.toBeNull();
    expect(assetRow?.accountId).toBe(testAccountId);
    expect(assetRow?.publicUrl).toBe(MOCK_DALLE_URL);
    expect(assetRow?.sceneIndex).toBe(1);
    expect(assetRow?.generationModel).toBe('dall-e-3');
    expect(assetRow?.generationPrompt).toBe(payload.imagePromptEn);

    // AC-13: history.scenes 反写 to real DB
    const historyRow = await prisma.history.findFirst({
      where: { id: testHistoryId, accountId: testAccountId },
    });
    expect(historyRow).not.toBeNull();

    const updatedContent = JSON.parse(historyRow!.content) as {
      scenes: Array<{ index: number; sceneImageUrl?: string; status?: string }>;
    };
    const scene1 = updatedContent.scenes.find((s) => s.index === 1);
    expect(scene1?.sceneImageUrl).toBe(MOCK_DALLE_URL);
    expect(scene1?.status).toBe('completed');

    // Scene 2 untouched
    const scene2 = updatedContent.scenes.find((s) => s.index === 2);
    expect(scene2?.sceneImageUrl).toBeUndefined();

    // AC-16: cost_log written < 50ms (written synchronously, checking existence)
    const costRow = await prisma.costLog.findFirst({ where: { traceId: testTraceId, eventType: 'image_gen' } });
    expect(costRow).not.toBeNull();
    expect(costRow?.modelUsed).toBe('dall-e-3');
    expect(costRow?.provider).toBe('openai');
    expect(costRow?.imageCount).toBe(1);
  });
});
