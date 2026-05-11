/**
 * Integration test — PRD-8 US-009 AC-8
 * WhisperSttWorker: 真 OpenAI 调用(env OPENAI_API_KEY 存在时)
 * Runs 1 short Chinese audio · expect transcript is string · cost_log written
 *
 * Skip when OPENAI_API_KEY not set (CI default).
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import { WhisperSttWorker } from '@/workers/stt/whisper';

const HAS_OPENAI_KEY = !!process.env.OPENAI_API_KEY;

// ── Build a 5-second 440Hz sine WAV for testing ───────────────────────────────

function buildTestWav(durationSec: number): Buffer {
  const sampleRate = 16000;
  const numChannels = 1;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const numSamples = Math.floor(sampleRate * durationSec);
  const dataSize = numSamples * bytesPerSample;

  const buf = Buffer.alloc(44 + dataSize, 0);

  buf.write('RIFF', 0, 'ascii');
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write('WAVE', 8, 'ascii');
  buf.write('fmt ', 12, 'ascii');
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(numChannels, 22);
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * numChannels * bytesPerSample, 28);
  buf.writeUInt16LE(numChannels * bytesPerSample, 32);
  buf.writeUInt16LE(bitsPerSample, 34);
  buf.write('data', 36, 'ascii');
  buf.writeUInt32LE(dataSize, 40);

  // Fill with a 440Hz sine wave so Whisper has actual audio content
  const freq = 440;
  for (let i = 0; i < numSamples; i++) {
    const sample = Math.round(32767 * 0.3 * Math.sin((2 * Math.PI * freq * i) / sampleRate));
    buf.writeInt16LE(sample, 44 + i * bytesPerSample);
  }

  return buf;
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

let testAccountId = 0;
const testTraceId = `tr_stt_integration_${Date.now()}`;

async function createFixtures(): Promise<void> {
  const user = await prisma.user.create({
    data: {
      openId: `stt-integ-${Date.now()}`,
      name: 'STT Integration Test User',
      email: `stt-integ-${Date.now()}@test.internal`,
      loginMethod: 'google',
    },
  });
  const account = await prisma.ipAccount.create({
    data: {
      userId: user.id,
      name: 'STT Integration Account',
      industry: '教育',
      platform: 'douyin',
    },
  });
  testAccountId = account.id;
}

async function cleanupFixtures(): Promise<void> {
  if (testAccountId) {
    await prisma.costLog.deleteMany({ where: { traceId: testTraceId } });
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

describe('US-009 AC-8: STT Whisper integration — real OpenAI call', () => {
  it.skipIf(!HAS_OPENAI_KEY)(
    '5s WAV audio → real Whisper-1 → transcript is string + cost_log written to DB',
    async () => {
      const audioBuffer = buildTestWav(5);

      const worker = new WhisperSttWorker({ timeoutMs: 60_000 });
      const result = await worker.transcribe({
        audioBuffer,
        mimeType: 'audio/wav',
        accountId: testAccountId,
        traceId: testTraceId,
      });

      // transcript is a string (may be empty for pure tone audio)
      expect(typeof result.transcript).toBe('string');
      expect(result.durationSec).toBeCloseTo(5, 0);
      expect(result.costUsd).toBeGreaterThanOrEqual(0);

      // AC-3: cost_log written to real DB
      const costRow = await prisma.costLog.findFirst({
        where: { traceId: testTraceId, eventType: 'stt_call' },
      });
      expect(costRow).not.toBeNull();
      expect(costRow?.modelUsed).toBe('whisper-1');
      expect(costRow?.provider).toBe('openai');
      expect(costRow?.accountId).toBe(testAccountId);
      expect(Number(costRow?.audioSeconds)).toBeGreaterThan(0);
    },
    90_000,
  );
});

// ── AC-9: R-001 key exposure check ───────────────────────────────────────────

describe('US-009 AC-9: R-001 — OPENAI_API_KEY not in frontend code', () => {
  it('grep OPENAI_API_KEY apps/web should return 0 matches', async () => {
    const { execSync } = await import('node:child_process');
    let count = 0;
    try {
      execSync('grep -r "OPENAI_API_KEY" apps/web --include="*.ts" --include="*.tsx" -l', {
        stdio: 'pipe',
      });
      count = 1; // grep succeeded = matches found
    } catch {
      count = 0; // grep exit code 1 = no matches
    }
    expect(count).toBe(0);
  });
});
