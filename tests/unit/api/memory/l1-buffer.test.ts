/**
 * L1 Buffer unit tests — PRD-8 US-001 AC-12 (5 tests)
 * pushTurn / getTurns / clearBuffer / maxLimit / TTL — all mocked (no real Redis)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── vi.hoisted — shared mock state ────────────────────────────────────────────

const mockRedisState = vi.hoisted(() => ({
  store: new Map<string, string[]>(),
  expireCalls: new Map<string, number>(),
}));

// ── Mock ioredis ───────────────────────────────────────────────────────────────

vi.mock('ioredis', () => ({
  default: vi.fn().mockImplementation(() => ({
    lpush: vi.fn().mockImplementation(async (key: string, value: string) => {
      const list = mockRedisState.store.get(key) ?? [];
      list.unshift(value);
      mockRedisState.store.set(key, list);
      return list.length;
    }),
    ltrim: vi.fn().mockImplementation(async (key: string, start: number, end: number) => {
      const list = mockRedisState.store.get(key) ?? [];
      mockRedisState.store.set(key, list.slice(start, end + 1));
      return 'OK';
    }),
    lrange: vi.fn().mockImplementation(async (key: string, start: number, end: number) => {
      const list = mockRedisState.store.get(key) ?? [];
      const result = end === -1 ? list.slice(start) : list.slice(start, end + 1);
      return result;
    }),
    expire: vi.fn().mockImplementation(async (key: string, ttl: number) => {
      mockRedisState.expireCalls.set(key, ttl);
      return 1;
    }),
    del: vi.fn().mockImplementation(async (key: string) => {
      const existed = mockRedisState.store.has(key);
      mockRedisState.store.delete(key);
      mockRedisState.expireCalls.delete(key);
      return existed ? 1 : 0;
    }),
  })),
}));

// ── Import after mocks ─────────────────────────────────────────────────────────

const { pushTurn, getTurns, clearBuffer } = await import('@/memory/l1-buffer');

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeTurn(id: string, role: 'user' | 'assistant' = 'user') {
  return {
    turnId: id,
    role,
    content: `content-${id}`,
    timestamp: Date.now(),
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('L1 Buffer', () => {
  beforeEach(() => {
    mockRedisState.store.clear();
    mockRedisState.expireCalls.clear();
  });

  it('push: stores turn and can retrieve it', async () => {
    const turn = makeTurn('turn-1');
    await pushTurn(1, turn);
    const turns = await getTurns(1);
    expect(turns).toHaveLength(1);
    expect(turns[0]?.turnId).toBe('turn-1');
  });

  it('get: returns turns in chronological order (oldest first)', async () => {
    await pushTurn(1, makeTurn('turn-A'));
    await pushTurn(1, makeTurn('turn-B'));
    await pushTurn(1, makeTurn('turn-C'));
    const turns = await getTurns(1);
    expect(turns[0]?.turnId).toBe('turn-A');
    expect(turns[2]?.turnId).toBe('turn-C');
  });

  it('clear: removes all turns for account', async () => {
    await pushTurn(1, makeTurn('turn-X'));
    await clearBuffer(1);
    const turns = await getTurns(1);
    expect(turns).toHaveLength(0);
  });

  it('maxLimit: trims to 20 turns max on push', async () => {
    for (let i = 0; i < 25; i++) {
      await pushTurn(1, makeTurn(`turn-${i}`));
    }
    const key = 'voice_chat:acc_1:turns';
    const stored = mockRedisState.store.get(key) ?? [];
    expect(stored.length).toBeLessThanOrEqual(20);
  });

  it('TTL: expire(key, 1800) is called on every push', async () => {
    await pushTurn(1, makeTurn('turn-ttl'));
    const key = 'voice_chat:acc_1:turns';
    expect(mockRedisState.expireCalls.get(key)).toBe(1800);
  });
});
