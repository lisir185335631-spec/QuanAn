// PRD-29.6 US-002 · loadLlmKey + 5min cache + invalidateLlmKeyCache unit tests
// AC-4: unit test loadLlmKey + cache 行为 + invalidate

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ── Hoisted mocks ──────────────────────────────────────────────────────────

const mockSystemConfigFindUnique = vi.hoisted(() => vi.fn());

vi.mock('@/lib/prisma', () => ({
  prisma: {
    systemConfig: {
      findUnique: mockSystemConfigFindUnique,
    },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// Mock SDK clients — not needed for loadLlmKey tests but prevent import errors
vi.mock('@anthropic-ai/sdk', () => ({ default: vi.fn() }));
vi.mock('openai', () => ({ default: vi.fn() }));

// ── Imports (after mocks) ──────────────────────────────────────────────────

import { loadLlmKey, invalidateLlmKeyCache } from '../index';

// ── Helpers ────────────────────────────────────────────────────────────────

function makeConfig(value: string) {
  return { configValue: value };
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('loadLlmKey', () => {
  beforeEach(() => {
    vi.resetAllMocks(); // clears call history AND pending mockResolvedValueOnce queue
    invalidateLlmKeyCache();
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.OPENAI_API_KEY;
  });

  afterEach(() => {
    invalidateLlmKeyCache();
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.OPENAI_API_KEY;
  });

  it('returns the DB value for anthropic when SystemConfig is set', async () => {
    mockSystemConfigFindUnique.mockResolvedValueOnce(makeConfig('sk-ant-db-key'));
    const result = await loadLlmKey('anthropic');
    expect(result).toBe('sk-ant-db-key');
    expect(mockSystemConfigFindUnique).toHaveBeenCalledWith({
      where: { configKey: 'LLM_ANTHROPIC_API_KEY' },
    });
  });

  it('returns the DB value for openai when SystemConfig is set', async () => {
    mockSystemConfigFindUnique.mockResolvedValueOnce(makeConfig('sk-openai-db-key'));
    const result = await loadLlmKey('openai');
    expect(result).toBe('sk-openai-db-key');
    expect(mockSystemConfigFindUnique).toHaveBeenCalledWith({
      where: { configKey: 'LLM_OPENAI_API_KEY' },
    });
  });

  it('falls back to process.env when SystemConfig returns null', async () => {
    mockSystemConfigFindUnique.mockResolvedValueOnce(null);
    process.env.ANTHROPIC_API_KEY = 'sk-ant-env-key';
    const result = await loadLlmKey('anthropic');
    expect(result).toBe('sk-ant-env-key');
  });

  it('falls back to process.env when SystemConfig value is empty string', async () => {
    mockSystemConfigFindUnique.mockResolvedValueOnce({ configValue: '' });
    process.env.ANTHROPIC_API_KEY = 'sk-ant-env-fallback';
    const result = await loadLlmKey('anthropic');
    expect(result).toBe('sk-ant-env-fallback');
  });

  it('returns undefined when both DB and env are unset', async () => {
    mockSystemConfigFindUnique.mockResolvedValueOnce(null);
    const result = await loadLlmKey('anthropic');
    expect(result).toBeUndefined();
  });

  it('falls back to env when DB throws', async () => {
    mockSystemConfigFindUnique.mockRejectedValueOnce(new Error('DB connection failed'));
    process.env.ANTHROPIC_API_KEY = 'sk-ant-env-fallback';
    const result = await loadLlmKey('anthropic');
    expect(result).toBe('sk-ant-env-fallback');
  });

  it('caches the result — second call does not query DB', async () => {
    mockSystemConfigFindUnique.mockResolvedValueOnce(makeConfig('sk-ant-cached'));
    const first = await loadLlmKey('anthropic');
    const second = await loadLlmKey('anthropic');
    expect(first).toBe('sk-ant-cached');
    expect(second).toBe('sk-ant-cached');
    // DB only queried once
    expect(mockSystemConfigFindUnique).toHaveBeenCalledTimes(1);
  });

  it('cache is independent per provider', async () => {
    mockSystemConfigFindUnique
      .mockResolvedValueOnce(makeConfig('sk-ant-key'))
      .mockResolvedValueOnce(makeConfig('sk-oai-key'));
    const anthropic = await loadLlmKey('anthropic');
    const openai = await loadLlmKey('openai');
    expect(anthropic).toBe('sk-ant-key');
    expect(openai).toBe('sk-oai-key');
    expect(mockSystemConfigFindUnique).toHaveBeenCalledTimes(2);
  });
});

describe('invalidateLlmKeyCache', () => {
  beforeEach(() => {
    vi.resetAllMocks(); // clears call history AND pending mockResolvedValueOnce queue
    invalidateLlmKeyCache();
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.OPENAI_API_KEY;
  });

  afterEach(() => {
    invalidateLlmKeyCache();
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.OPENAI_API_KEY;
  });

  it('invalidating anthropic clears cache — next call re-queries DB', async () => {
    mockSystemConfigFindUnique
      .mockResolvedValueOnce(makeConfig('sk-ant-first'))
      .mockResolvedValueOnce(makeConfig('sk-ant-second'));

    await loadLlmKey('anthropic');
    invalidateLlmKeyCache('anthropic');
    const second = await loadLlmKey('anthropic');

    expect(second).toBe('sk-ant-second');
    expect(mockSystemConfigFindUnique).toHaveBeenCalledTimes(2);
  });

  it('invalidating openai does not clear anthropic cache', async () => {
    mockSystemConfigFindUnique
      .mockResolvedValueOnce(makeConfig('sk-ant-cached'))
      .mockResolvedValueOnce(makeConfig('sk-oai-new'));

    await loadLlmKey('anthropic');
    invalidateLlmKeyCache('openai');

    // anthropic cache still valid — no new DB query
    const anthropic = await loadLlmKey('anthropic');
    expect(anthropic).toBe('sk-ant-cached');
    // Only 1 DB call (anthropic initial load)
    expect(mockSystemConfigFindUnique).toHaveBeenCalledTimes(1);
  });

  it('invalidating all (no args) clears both provider caches', async () => {
    mockSystemConfigFindUnique
      .mockResolvedValueOnce(makeConfig('sk-ant-first'))
      .mockResolvedValueOnce(makeConfig('sk-oai-first'))
      .mockResolvedValueOnce(makeConfig('sk-ant-second'))
      .mockResolvedValueOnce(makeConfig('sk-oai-second'));

    await loadLlmKey('anthropic');
    await loadLlmKey('openai');
    invalidateLlmKeyCache(); // clear all

    const ant2 = await loadLlmKey('anthropic');
    const oai2 = await loadLlmKey('openai');

    expect(ant2).toBe('sk-ant-second');
    expect(oai2).toBe('sk-oai-second');
    expect(mockSystemConfigFindUnique).toHaveBeenCalledTimes(4);
  });
});
