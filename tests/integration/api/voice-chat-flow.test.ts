/**
 * Integration test — PRD-8 US-011 AC-10
 * 模拟 3 turn 对话 · 验证 L1 Buffer 3 user + 3 assistant turns
 * Requires: running API server + Redis + PostgreSQL
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

import { VoiceChatAgent } from '@/specialists/VoiceChatAgent';
import { getTurns, clearBuffer } from '@/memory/l1-buffer';
import type { ILLMGateway, LLMStreamChunk } from '@/specialists/base/types';

const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL ?? 'postgresql://return@localhost:5432/quanqn' },
  },
});

// ── Seed test account ─────────────────────────────────────────────────────────

const TEST_ACCOUNT_ID = 99901;

beforeAll(async () => {
  // Ensure test account exists (may already exist from other tests)
  await prisma.$executeRaw`
    INSERT INTO ip_accounts (id, user_id, ip_name, ip_positioning, platform, created_at, updated_at)
    VALUES (${TEST_ACCOUNT_ID}, 1, '测试IP账号', '测试方向', 'douyin', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING
  `.catch(() => undefined);
  await clearBuffer(TEST_ACCOUNT_ID);
});

afterAll(async () => {
  await clearBuffer(TEST_ACCOUNT_ID);
  await prisma.$disconnect();
});

// ── Mock gateway — returns delta text without real LLM ───────────────────────

function buildTestGateway(responseText: string): ILLMGateway {
  const chunks: LLMStreamChunk[] = [
    { type: 'meta', meta: { model: 'claude-test' } },
    { type: 'delta', delta: responseText },
    { type: 'done', tokens: { prompt: 10, completion: responseText.length, total: 10 + responseText.length } },
  ];
  return {
    complete: () => Promise.reject(new Error('not used')),
    stream: async function* () {
      for (const c of chunks) yield c;
    },
  };
}

// ── AC-10: 3-turn conversation ────────────────────────────────────────────────

describe('[Integration] VoiceChatAgent 3-turn L1 Buffer (AC-10)', () => {
  it('3 turns: 3 user + 3 assistant turns in L1 Buffer', async () => {
    const messages = ['你好', '我的IP进展怎么样', '今天有什么任务'];
    const responses = ['你好，有什么可以帮你？', '你的 IP 进展良好。', '今天有 3 个任务。'];

    for (let i = 0; i < 3; i++) {
      const gateway = buildTestGateway(responses[i]!);
      const agent = new VoiceChatAgent(gateway);
      const chunks = [];
      for await (const chunk of agent.executeStream(
        { accountId: TEST_ACCOUNT_ID, userInput: { userMessage: messages[i]! } },
        async () => '{}',
      )) {
        chunks.push(chunk);
      }
      expect(chunks.some((c) => c.type === 'done')).toBe(true);
    }

    // Verify L1 Buffer has 6 turns (3 user + 3 assistant)
    const turns = await getTurns(TEST_ACCOUNT_ID, 20);
    expect(turns.length).toBe(6);

    const userTurns = turns.filter((t) => t.role === 'user');
    const assistantTurns = turns.filter((t) => t.role === 'assistant');
    expect(userTurns.length).toBe(3);
    expect(assistantTurns.length).toBe(3);

    // Verify turn content
    const userContents = userTurns.map((t) => t.content);
    for (const msg of messages) {
      expect(userContents).toContain(msg);
    }
  }, 30_000);

  it('clearBuffer removes all turns', async () => {
    await clearBuffer(TEST_ACCOUNT_ID);
    const turns = await getTurns(TEST_ACCOUNT_ID, 20);
    expect(turns.length).toBe(0);
  });
});
