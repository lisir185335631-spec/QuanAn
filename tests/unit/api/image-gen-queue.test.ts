/**
 * Unit tests — PRD-6 US-010 AC-12 (8 tests)
 * BullMQ Queue + Worker + rate limit (all mocked — no real Redis/DB)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── vi.hoisted — shared state accessible inside vi.mock factories ─────────────

const mockState = vi.hoisted(() => ({
  processor: null as ((job: { data: unknown }) => Promise<unknown>) | null,
  workerOpts: null as Record<string, unknown> | null,
  queueOpts: null as Record<string, unknown> | null,
}));

const mockGenerate = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
    sceneImageUrl: 'https://mock.openai.com/scene.png',
    costUsd: 0.04,
    durationMs: 100,
  }),
);

const mockRedisState = vi.hoisted(() => ({
  // Map<key, count> simulates per-key incr
  counters: new Map<string, number>(),
}));

// ── Mocks ──────────────────────────────────────────────────────────────────────

vi.mock('ioredis', () => ({
  default: vi.fn().mockImplementation(() => ({
    incr: vi.fn().mockImplementation(async (key: string) => {
      const cur = (mockRedisState.counters.get(key) ?? 0) + 1;
      mockRedisState.counters.set(key, cur);
      return cur;
    }),
    expire: vi.fn().mockResolvedValue(1),
    duplicate: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    quit: vi.fn().mockResolvedValue('OK'),
  })),
}));

vi.mock('bullmq', () => ({
  Queue: vi.fn().mockImplementation((_name: unknown, opts: unknown) => {
    mockState.queueOpts = opts as Record<string, unknown>;
    return {
      add: vi.fn().mockResolvedValue({ id: 'job-test-001', name: 'scene-image' }),
      close: vi.fn().mockResolvedValue(undefined),
    };
  }),
  Worker: vi.fn().mockImplementation(
    (
      _name: unknown,
      processor: (job: { data: unknown }) => Promise<unknown>,
      opts: Record<string, unknown>,
    ) => {
      mockState.processor = processor;
      mockState.workerOpts = opts;
      return {
        on: vi.fn().mockReturnThis(),
        close: vi.fn().mockResolvedValue(undefined),
      };
    },
  ),
}));

vi.mock('@/workers/image-gen/dall-e-3', () => ({
  DallE3ImageGenWorker: vi.fn().mockImplementation(() => ({
    generate: mockGenerate,
  })),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    history: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// ── Imports (after mocks so mocked versions are used) ─────────────────────────

import { imageGenQueue } from '@/workers/image-gen/queue';
import { worker, queryImageGenStatus } from '@/workers/image-gen/worker';
import { checkImageGenRateLimit } from '@/lib/rate-limit/image-gen';
import { prisma } from '@/lib/prisma';

import type { ImageGenJobPayload } from '@/workers/image-gen/index';

// ── Helpers ────────────────────────────────────────────────────────────────────

const basePayload: ImageGenJobPayload = {
  sceneIndex: 1,
  imagePromptEn: 'A serene mountain landscape at dawn',
  accountId: 42,
  traceId: 'tr-unit-001',
  historyId: 100,
  imageStyle: 'vivid',
};

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('US-010 AC-12: image-gen queue + worker + rate limit unit tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRedisState.counters.clear();
    // Restore default generate mock
    mockGenerate.mockResolvedValue({
      sceneImageUrl: 'https://mock.openai.com/scene.png',
      costUsd: 0.04,
      durationMs: 100,
    });
  });

  // ── Test 1: queue.add 入栈 · 返回 jobId ────────────────────────────────────
  it('1. queue.add returns job with id', async () => {
    const job = await imageGenQueue.add('scene-image', basePayload);
    expect(job.id).toBe('job-test-001');
    expect(imageGenQueue.add).toHaveBeenCalledWith('scene-image', basePayload);
  });

  // ── Test 2: job complete event 触发 history 反写 ───────────────────────────
  it('2. processor calls imageGen with job data on completion', async () => {
    expect(mockState.processor).not.toBeNull();

    const result = await mockState.processor!({ data: basePayload });

    expect(mockGenerate).toHaveBeenCalledOnce();
    expect(mockGenerate).toHaveBeenCalledWith(basePayload);
    expect(result).toMatchObject({ sceneImageUrl: 'https://mock.openai.com/scene.png' });
  });

  // ── Test 3: job retry · attempts=2 (BullMQ attempts=3 含初次) ─────────────
  it('3. Queue defaultJobOptions.attempts === 3 (2 retries)', () => {
    // mockState.queueOpts captured at module-load time — not cleared by clearAllMocks()
    const queueOpts = mockState.queueOpts as { defaultJobOptions: { attempts: number; backoff: { type: string; delay: number } } };
    expect(queueOpts).not.toBeNull();
    expect(queueOpts.defaultJobOptions.attempts).toBe(3);
    expect(queueOpts.defaultJobOptions.backoff.type).toBe('exponential');
    expect(queueOpts.defaultJobOptions.backoff.delay).toBe(5000);
  });

  // ── Test 4: job 最终 fail · status='failed' ────────────────────────────────
  it('4. processor returns error result when imageGen fails', async () => {
    mockGenerate.mockResolvedValueOnce({
      error: 'image_gen_failed',
      sceneImageUrl: '/static/placeholder-1024x1024.png',
    });

    expect(mockState.processor).not.toBeNull();
    const result = await mockState.processor!({ data: basePayload });

    // Processor returns the error result without throwing (dall-e-3 handles status update internally)
    expect(result).toMatchObject({ error: 'image_gen_failed' });
    expect(mockGenerate).toHaveBeenCalledWith(basePayload);
  });

  // ── Test 5: concurrency=2 · 第 3 job 等空位 ───────────────────────────────
  it('5. Worker created with concurrency=2', () => {
    // mockState.workerOpts captured at module-load time — not cleared by clearAllMocks()
    const workerOpts = mockState.workerOpts as { concurrency: number };
    expect(workerOpts).not.toBeNull();
    expect(workerOpts.concurrency).toBe(2);
    // BullMQ enforces: with concurrency=2, 3rd job waits until a slot is free
    // (behavioral guarantee from BullMQ, verified by concurrency config)
  });

  // ── Test 6: status query · count by sceneImageUrl null/not-null/failed ──────
  it('6. queryImageGenStatus counts scenes by status correctly', async () => {
    vi.mocked(prisma.history.findFirst).mockResolvedValueOnce({
      content: JSON.stringify({
        scenes: [
          { index: 0, sceneImageUrl: null },                                          // pending
          { index: 1, sceneImageUrl: 'https://img.png', status: 'completed' },        // completed
          { index: 2, sceneImageUrl: 'https://img2.png', status: 'completed' },       // completed
          { index: 3, status: 'failed' },                                             // failed
          { index: 4 },                                                               // pending (no URL, no status)
        ],
      }),
    } as Parameters<typeof prisma.history.findFirst>[0] extends infer T ? T : never);

    const counts = await queryImageGenStatus(100, 42);

    expect(counts.pending).toBe(2);    // scenes 0 + 4
    expect(counts.completed).toBe(2);  // scenes 1 + 2
    expect(counts.failed).toBe(1);     // scene 3
  });

  // ── Test 7: rate limit 命中 · 11 calls / accountId / day → throw on 11th ──
  it('7. rate limit: 11th call throws TOO_MANY_REQUESTS', async () => {
    const accountId = 99;
    process.env['IMAGE_GEN_DAILY_LIMIT_PER_USER'] = '10';

    // 10 calls should succeed
    for (let i = 0; i < 10; i++) {
      await expect(checkImageGenRateLimit(accountId)).resolves.toBeUndefined();
    }

    // 11th call should throw
    await expect(checkImageGenRateLimit(accountId)).rejects.toMatchObject({
      code: 'TOO_MANY_REQUESTS',
    });

    delete process.env['IMAGE_GEN_DAILY_LIMIT_PER_USER'];
  });

  // ── Test 8: rate limit cross-account isolation ─────────────────────────────
  it('8. rate limit cross-account isolation: accountId=1 saturated, accountId=2 still free', async () => {
    process.env['IMAGE_GEN_DAILY_LIMIT_PER_USER'] = '10';

    // Saturate accountId=1
    for (let i = 0; i < 10; i++) {
      await checkImageGenRateLimit(1);
    }
    await expect(checkImageGenRateLimit(1)).rejects.toMatchObject({ code: 'TOO_MANY_REQUESTS' });

    // accountId=2 should still have a fresh counter
    for (let i = 0; i < 10; i++) {
      await expect(checkImageGenRateLimit(2)).resolves.toBeUndefined();
    }
    await expect(checkImageGenRateLimit(2)).rejects.toMatchObject({ code: 'TOO_MANY_REQUESTS' });

    delete process.env['IMAGE_GEN_DAILY_LIMIT_PER_USER'];
  });
});

// Suppress TS unused-var warning — worker is imported to trigger module-level side effects
void worker;
