/**
 * Unit tests — PRD-6 US-009
 * DallE3ImageGenWorker: 6 unit tests
 * AC-12: IMAGE_GEN_ENABLED=true happy · false placeholder · retry 3x fail · cost_log · Asset · history 反写
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── vi.hoisted: shared mocks available inside vi.mock factories (hoisting-safe) ─

const {
  mockImagesGenerate,
  mockCostLogCreate,
  mockAssetCreate,
  mockHistoryFindFirst,
  mockHistoryUpdate,
  mockTransaction,
} = vi.hoisted(() => ({
  mockImagesGenerate: vi.fn(),
  mockCostLogCreate: vi.fn().mockResolvedValue({ id: BigInt(1) }),
  mockAssetCreate: vi.fn().mockResolvedValue({ id: 1 }),
  mockHistoryFindFirst: vi.fn(),
  mockHistoryUpdate: vi.fn().mockResolvedValue({ id: 1 }),
  mockTransaction: vi.fn(),
}));

// ── Mock declarations (factories reference hoisted vars) ──────────────────────

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// ★ D-038: OpenAI image SDK imported only in dall-e-3.ts
vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    images: { generate: mockImagesGenerate },
  })),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    costLog: { create: mockCostLogCreate },
    asset: { create: mockAssetCreate },
    history: { findFirst: mockHistoryFindFirst, update: mockHistoryUpdate },
    $transaction: mockTransaction,
  },
}));

// ── Imports (after vi.mock) ───────────────────────────────────────────────────

import { DallE3ImageGenWorker } from '@/workers/image-gen/dall-e-3';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MOCK_PAYLOAD = {
  sceneIndex: 1,
  imagePromptEn: 'A beautiful sunset over a mountain range with vivid orange colors',
  accountId: 42,
  traceId: 'tr_test_us009_001',
  historyId: 100,
  imageStyle: 'vivid' as const,
};

const MOCK_DALLE_URL = 'https://oaidalleapi.blob.core.windows.net/private/dalle3-test-image.png';
const PLACEHOLDER_URL = '/static/placeholder-1024x1024.png';

const MOCK_HISTORY_CONTENT = JSON.stringify({
  scenes: [
    { index: 1, description: 'Opening shot', imagePromptEn: MOCK_PAYLOAD.imagePromptEn, duration: '5s' },
    { index: 2, description: 'Middle shot', imagePromptEn: 'another prompt', duration: '10s' },
  ],
  totalDuration: '15s',
});

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.IMAGE_GEN_ENABLED;
  delete process.env.OPENAI_API_KEY;

  // History findFirst returns mock storyboard content by default
  mockHistoryFindFirst.mockResolvedValue({ content: MOCK_HISTORY_CONTENT });

  // $transaction executes the callback with a minimal tx stub
  mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) =>
    fn({ history: { findFirst: mockHistoryFindFirst, update: mockHistoryUpdate } }),
  );
});

afterEach(() => {
  delete process.env.IMAGE_GEN_ENABLED;
  delete process.env.OPENAI_API_KEY;
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('US-009 AC-12-1: IMAGE_GEN_ENABLED=true happy path', () => {
  it('calls DALL-E 3, returns sceneImageUrl + costUsd=0.04, writes cost_log + Asset + history', async () => {
    process.env.IMAGE_GEN_ENABLED = 'true';
    process.env.OPENAI_API_KEY = 'sk-test-key';
    mockImagesGenerate.mockResolvedValue({ data: [{ url: MOCK_DALLE_URL }] });

    const worker = new DallE3ImageGenWorker();
    const result = await worker.generate(MOCK_PAYLOAD);

    // Returns sceneImageUrl + costUsd
    expect(result).toMatchObject({ sceneImageUrl: MOCK_DALLE_URL, costUsd: 0.04 });
    expect('durationMs' in result).toBe(true);

    // OpenAI called with correct params
    expect(mockImagesGenerate).toHaveBeenCalledOnce();
    expect(mockImagesGenerate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'dall-e-3',
        size: '1024x1024',
        style: 'vivid',
        quality: 'standard',
        n: 1,
      }),
    );

    // cost_log written
    expect(mockCostLogCreate).toHaveBeenCalledOnce();
    // Asset written
    expect(mockAssetCreate).toHaveBeenCalledOnce();
    // history 反写 via $transaction
    expect(mockTransaction).toHaveBeenCalledOnce();
    expect(mockHistoryUpdate).toHaveBeenCalledOnce();
  });
});

describe('US-009 AC-12-2: IMAGE_GEN_ENABLED=false', () => {
  it('returns placeholder URL without calling OpenAI or writing cost_log', async () => {
    process.env.IMAGE_GEN_ENABLED = 'false';

    const worker = new DallE3ImageGenWorker();
    const result = await worker.generate(MOCK_PAYLOAD);

    expect(result).toMatchObject({ sceneImageUrl: PLACEHOLDER_URL, costUsd: 0, durationMs: 0 });
    expect(mockImagesGenerate).not.toHaveBeenCalled();
    expect(mockCostLogCreate).not.toHaveBeenCalled();
  });
});

describe('US-009 AC-12-3: network failure retry 3 times → failed result', () => {
  it('retries 3 times on network error, returns { error: image_gen_failed, sceneImageUrl: placeholder }', async () => {
    process.env.IMAGE_GEN_ENABLED = 'true';
    process.env.OPENAI_API_KEY = 'sk-test-key';
    mockImagesGenerate.mockRejectedValue(new Error('ECONNRESET: network failure'));

    const worker = new DallE3ImageGenWorker();
    const result = await worker.generate(MOCK_PAYLOAD);

    // All 3 retries attempted
    expect(mockImagesGenerate).toHaveBeenCalledTimes(3);

    // Failed result with placeholder
    expect(result).toMatchObject({ error: 'image_gen_failed', sceneImageUrl: PLACEHOLDER_URL });

    // No cost_log on failure
    expect(mockCostLogCreate).not.toHaveBeenCalled();

    // history updated with status='failed'
    expect(mockHistoryUpdate).toHaveBeenCalledOnce();
    const updateCall = mockHistoryUpdate.mock.calls[0]?.[0] as { data: { content: string } };
    const updatedContent = JSON.parse(updateCall.data.content) as { scenes: Array<{ status?: string }> };
    expect(updatedContent.scenes[0]?.status).toBe('failed');
  }, 15_000);
});

describe('US-009 AC-12-4: cost_log eventType=image_gen accurate', () => {
  it('writes cost_log with eventType=image_gen provider=openai modelUsed=dall-e-3 costUsd=0.04', async () => {
    process.env.IMAGE_GEN_ENABLED = 'true';
    process.env.OPENAI_API_KEY = 'sk-test-key';
    mockImagesGenerate.mockResolvedValue({ data: [{ url: MOCK_DALLE_URL }] });

    const worker = new DallE3ImageGenWorker();
    await worker.generate(MOCK_PAYLOAD);

    expect(mockCostLogCreate).toHaveBeenCalledOnce();
    const createArgs = mockCostLogCreate.mock.calls[0]?.[0] as { data: Record<string, unknown> };

    expect(createArgs.data).toMatchObject({
      accountId: MOCK_PAYLOAD.accountId,
      eventType: 'image_gen',
      provider: 'openai',
      modelUsed: 'dall-e-3',
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      imageCount: 1,
      traceId: MOCK_PAYLOAD.traceId,
    });
    expect(Number(String(createArgs.data.costUsd))).toBeCloseTo(0.04, 6);
  });
});

describe('US-009 AC-12-5: Asset write all fields', () => {
  it('writes Asset with accountId, assetType=scene_image, sceneIndex, publicUrl, generationModel, relatedHistoryId', async () => {
    process.env.IMAGE_GEN_ENABLED = 'true';
    process.env.OPENAI_API_KEY = 'sk-test-key';
    mockImagesGenerate.mockResolvedValue({ data: [{ url: MOCK_DALLE_URL }] });

    const worker = new DallE3ImageGenWorker();
    await worker.generate(MOCK_PAYLOAD);

    expect(mockAssetCreate).toHaveBeenCalledOnce();
    const createArgs = mockAssetCreate.mock.calls[0]?.[0] as { data: Record<string, unknown> };

    expect(createArgs.data).toMatchObject({
      accountId: MOCK_PAYLOAD.accountId,
      assetType: 'scene_image',
      sceneIndex: MOCK_PAYLOAD.sceneIndex,
      publicUrl: MOCK_DALLE_URL,
      generationPrompt: MOCK_PAYLOAD.imagePromptEn,
      generationModel: 'dall-e-3',
      relatedHistoryId: MOCK_PAYLOAD.historyId,
      traceId: MOCK_PAYLOAD.traceId,
    });
    expect(createArgs.data.fileName).toContain('scene-1');
    expect(createArgs.data.mimeType).toBe('image/png');
    expect(createArgs.data.sizeBytes).toBe(0);
    expect(createArgs.data.storageKey).toContain('dalle3/');
  });
});

describe('US-009 AC-12-6: history.scenes 反写 correct', () => {
  it('updates history content with sceneImageUrl merged into correct scene by index, untouched scene unchanged', async () => {
    process.env.IMAGE_GEN_ENABLED = 'true';
    process.env.OPENAI_API_KEY = 'sk-test-key';
    mockImagesGenerate.mockResolvedValue({ data: [{ url: MOCK_DALLE_URL }] });

    const worker = new DallE3ImageGenWorker();
    await worker.generate(MOCK_PAYLOAD);

    expect(mockHistoryFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: MOCK_PAYLOAD.historyId, accountId: MOCK_PAYLOAD.accountId },
      }),
    );

    expect(mockHistoryUpdate).toHaveBeenCalledOnce();
    const updateArgs = mockHistoryUpdate.mock.calls[0]?.[0] as {
      where: { id: number };
      data: { content: string };
    };

    // update uses PK only (security checked by findFirst)
    expect(updateArgs.where).toMatchObject({ id: MOCK_PAYLOAD.historyId });

    const updatedContent = JSON.parse(updateArgs.data.content) as {
      scenes: Array<{ index: number; sceneImageUrl?: string; status?: string }>;
    };

    // Scene with index=1 gets sceneImageUrl + status
    const scene1 = updatedContent.scenes.find((s) => s.index === 1);
    expect(scene1?.sceneImageUrl).toBe(MOCK_DALLE_URL);
    expect(scene1?.status).toBe('completed');

    // Scene with index=2 is untouched
    const scene2 = updatedContent.scenes.find((s) => s.index === 2);
    expect(scene2?.sceneImageUrl).toBeUndefined();
  });
});
