/**
 * Integration test — PRD-6 US-010 AC-13
 * ★ 真 BullMQ + Redis · mock dall-e-3 fast (OpenAI SDK mock) · real DB
 * 入栈 → 真 worker tick → completed event → history 反写 · 端到端跑通
 * SHIELD: beforeEach redis.flushdb() — prevent stale job pollution
 */

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { Queue, Worker as BullMQWorker } from 'bullmq';
import IORedis from 'ioredis';

import { prisma } from '@/lib/prisma';

// ── Mock OpenAI SDK (mock dall-e-3 fast — no real API calls) ─────────────────

const mockImagesGenerate = vi.fn();

vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    images: { generate: mockImagesGenerate },
  })),
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// ── Import real worker after mocks ────────────────────────────────────────────

import { DallE3ImageGenWorker } from '@/workers/image-gen/dall-e-3';
import type { ImageGenJobPayload } from '@/workers/image-gen/index';

// ── Constants ─────────────────────────────────────────────────────────────────

const TEST_QUEUE_NAME = 'image-gen-integration-test';
const MOCK_DALLE_URL = 'https://oaidalleapi.blob.core.windows.net/private/bullmq-integration.png';
const REDIS_URL = process.env['REDIS_URL'] ?? 'redis://localhost:6379';

// ── Fixtures ──────────────────────────────────────────────────────────────────

let testAccountId = 0;
let testHistoryId = 0;
let testTraceId = '';

const MOCK_STORYBOARD_CONTENT = JSON.stringify({
  scenes: [
    {
      index: 0,
      description: 'Opening shot',
      imagePromptEn: 'A vibrant product close-up with studio lighting',
      duration: '5s',
      sceneImageUrl: null,
    },
  ],
  totalDuration: '5s',
});

async function createTestFixtures(): Promise<void> {
  const user = await prisma.user.create({
    data: {
      openId: `test-bullmq-integ-${Date.now()}`,
      name: 'BullMQ Integration Test User',
      email: `bullmq-integ-${Date.now()}@test.internal`,
      loginMethod: 'google',
    },
  });
  const account = await prisma.ipAccount.create({
    data: {
      userId: user.id,
      name: 'BullMQ Test Account',
      industry: '科技',
      platform: 'douyin',
    },
  });
  testAccountId = account.id;

  const history = await prisma.history.create({
    data: {
      accountId: testAccountId,
      agentId: 'VideoAgent',
      agentMode: 'storyboard',
      sourceType: 'user',
      inputSummary: 'BullMQ integration test storyboard',
      content: MOCK_STORYBOARD_CONTENT,
      contentType: 'json',
      isFallback: false,
      traceId: `tr_bullmq_integ_${Date.now()}`,
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

// ── BullMQ test infrastructure ────────────────────────────────────────────────

let testRedis: IORedis;
let testQueue: Queue<ImageGenJobPayload>;
let testWorker: BullMQWorker<ImageGenJobPayload>;

beforeAll(async () => {
  // Env setup for DallE3ImageGenWorker
  process.env['IMAGE_GEN_ENABLED'] = 'true';
  process.env['OPENAI_API_KEY'] = 'sk-test-bullmq-integration';

  // Real Redis connections (separate for Queue + Worker per BullMQ best practice)
  testRedis = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });

  // SHIELD: flush stale jobs from previous test runs
  await testRedis.flushdb();

  await createTestFixtures();

  // Use real DallE3ImageGenWorker (OpenAI SDK mocked)
  const imageGenWorkerInst = new DallE3ImageGenWorker();

  testQueue = new Queue<ImageGenJobPayload>(TEST_QUEUE_NAME, {
    connection: testRedis.duplicate(),
    defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 100 } },
  });

  testWorker = new BullMQWorker<ImageGenJobPayload>(
    TEST_QUEUE_NAME,
    async (job) => imageGenWorkerInst.generate(job.data),
    { connection: testRedis.duplicate(), concurrency: 2 },
  );
});

afterAll(async () => {
  await testWorker.close();
  await testQueue.close();
  await testRedis.quit();

  delete process.env['IMAGE_GEN_ENABLED'];
  delete process.env['OPENAI_API_KEY'];
  await cleanupTestFixtures();
});

beforeEach(async () => {
  vi.clearAllMocks();
  // SHIELD: clear Redis between tests to prevent stale job pollution
  await testRedis.flushdb();
});

// ── Integration tests ─────────────────────────────────────────────────────────

describe('US-010 AC-13: BullMQ image-gen integration — real Queue + Worker + DB', () => {
  it('job added → worker processes → completed event → history.scenes 反写', async () => {
    mockImagesGenerate.mockResolvedValue({ data: [{ url: MOCK_DALLE_URL }] });

    const payload: ImageGenJobPayload = {
      sceneIndex: 0,
      imagePromptEn: 'A vibrant product close-up with studio lighting',
      accountId: testAccountId,
      traceId: testTraceId,
      historyId: testHistoryId,
      imageStyle: 'vivid',
    };

    // ── Add job to queue ──────────────────────────────────────────────────────
    const job = await testQueue.add('scene-image', payload);
    expect(job.id).toBeDefined();

    // ── Wait for Worker 'completed' event (timeout 8s) ────────────────────────
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Worker completed event timeout (8s)')), 8000);
      testWorker.on('completed', () => {
        clearTimeout(timeout);
        resolve();
      });
      testWorker.on('failed', (_failedJob, err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });

    // ── Verify history.scenes[0] 反写 to real DB ──────────────────────────────
    const updatedHistory = await prisma.history.findFirst({
      where: { id: testHistoryId, accountId: testAccountId },
    });
    expect(updatedHistory).not.toBeNull();

    const content = JSON.parse(updatedHistory!.content) as {
      scenes: Array<{ index: number; sceneImageUrl?: string; status?: string }>;
    };
    const scene0 = content.scenes.find((s) => s.index === 0);
    expect(scene0?.sceneImageUrl).toBe(MOCK_DALLE_URL);
    expect(scene0?.status).toBe('completed');

    // ── Verify Asset written to real DB ───────────────────────────────────────
    const asset = await prisma.asset.findFirst({
      where: { relatedHistoryId: testHistoryId, sceneIndex: 0 },
    });
    expect(asset).not.toBeNull();
    expect(asset?.publicUrl).toBe(MOCK_DALLE_URL);
    expect(asset?.accountId).toBe(testAccountId);

    // ── Verify cost_log written ───────────────────────────────────────────────
    const costLog = await prisma.costLog.findFirst({
      where: { traceId: testTraceId, eventType: 'image_gen' },
    });
    expect(costLog).not.toBeNull();
    expect(costLog?.modelUsed).toBe('dall-e-3');
  });
});
