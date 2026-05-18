/**
 * Integration test — PRD-8 US-010 AC-8
 * OpenAITtsWorker: 真 OpenAI 调用(env OPENAI_API_KEY 存在时)
 * Runs 1 short Chinese text · expect publicUrl + asset + cost_log written
 *
 * Skip when OPENAI_API_KEY not set (CI default).
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import { OpenAITtsWorker } from '@/workers/tts/openai-tts';

const HAS_OPENAI_KEY = !!process.env.OPENAI_API_KEY;

// ── Fixtures ──────────────────────────────────────────────────────────────────

let testAccountId = 0;
const testTraceId = `tr_tts_integration_${Date.now()}`;

async function createFixtures(): Promise<void> {
  const user = await prisma.user.create({
    data: {
      openId: `tts-integ-${Date.now()}`,
      name: 'TTS Integration Test User',
      email: `tts-integ-${Date.now()}@test.internal`,
      loginMethod: 'google',
    },
  });
  const account = await prisma.ipAccount.create({
    data: {
      userId: user.id,
      name: 'TTS Integration Account',
      industry: '教育',
      platform: 'douyin',
    },
  });
  testAccountId = account.id;
}

async function cleanupFixtures(): Promise<void> {
  if (testAccountId) {
    await prisma.costLog.deleteMany({ where: { traceId: testTraceId } });
    await prisma.asset.deleteMany({ where: { traceId: testTraceId } });
    const account = await prisma.ipAccount.findUnique({ where: { id: testAccountId } });
    if (account) {
      await prisma.ipAccount.delete({ where: { id: testAccountId } });
      await prisma.user.delete({ where: { id: account.userId } });
    }
  }
}

beforeAll(async () => {
  if (!HAS_OPENAI_KEY) return;
  await createFixtures();
});

afterAll(async () => {
  if (!HAS_OPENAI_KEY) return;
  await cleanupFixtures();
});

// ── Integration test ──────────────────────────────────────────────────────────

describe('US-010 AC-8: TTS OpenAI integration — real TTS-1 call', () => {
  it.skipIf(!HAS_OPENAI_KEY)(
    'short Chinese text → real TTS-1 → mp3 buffer + asset + cost_log written to DB',
    async () => {
      const text = '大家好，这是一段测试文本，用于验证 TTS 接口是否正常工作。';

      const worker = new OpenAITtsWorker({ timeoutMs: 60_000 });
      const result = await worker.synthesize({
        text,
        accountId: testAccountId,
        traceId: testTraceId,
      });

      expect(result.publicUrl).toBeTruthy();
      expect(result.sizeBytes).toBeGreaterThan(0);
      expect(result.costUsd).toBeGreaterThan(0);

      // AC-3: asset written to real DB
      const assetRow = await prisma.asset.findFirst({
        where: { traceId: testTraceId, assetType: 'tts_audio' },
      });
      expect(assetRow).not.toBeNull();
      expect(assetRow?.mimeType).toBe('audio/mpeg');
      expect(assetRow?.generationModel).toBe('tts-1');
      expect(assetRow?.accountId).toBe(testAccountId);
      expect(assetRow?.sizeBytes).toBeGreaterThan(0);

      // AC-4: cost_log written to real DB
      const costRow = await prisma.costLog.findFirst({
        where: { traceId: testTraceId, eventType: 'tts_call' },
      });
      expect(costRow).not.toBeNull();
      expect(costRow?.modelUsed).toBe('tts-1');
      expect(costRow?.provider).toBe('openai');
      expect(costRow?.accountId).toBe(testAccountId);
      expect(Number(costRow?.charactersIn)).toBeGreaterThan(0);
      expect(Number(costRow?.costUsd)).toBeGreaterThan(0);
    },
    90_000,
  );
});

// ── AC-9: R-001 key exposure check ───────────────────────────────────────────

describe('US-010 AC-9: R-001 — OPENAI_API_KEY not in frontend code', () => {
  it('grep OPENAI_API_KEY apps/web should return 0 matches', async () => {
    const { execSync } = await import('node:child_process');
    let count = 0;
    try {
      execSync('grep -r "OPENAI_API_KEY" apps/web/src --include="*.ts" --include="*.tsx" -l', {
        stdio: 'pipe',
      });
      count = 1; // grep succeeded = matches found
    } catch {
      count = 0; // grep exit code 1 = no matches
    }
    expect(count).toBe(0);
  });
});
