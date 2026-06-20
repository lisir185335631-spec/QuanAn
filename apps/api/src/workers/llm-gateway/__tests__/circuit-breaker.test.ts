/**
 * G9 真熔断器 — Gateway 集成测试
 *
 * 核心证据 C：
 *   - primary circuit OPEN → canAttempt(primary)=false →
 *     circuit_open_skip_primary 被 log → _callWithRetry(primary) 从未被调用
 *   - primary OPEN + fallback healthy → complete 仍返回结果（只跳过坏模型）
 *   - primary healthy → 正常调用，熔断不干扰
 *
 * 注：CircuitBreaker/isTransientError 单元测试在 circuit-breaker.unit.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── hoisted mock setup ────────────────────────────────────────────────────────

const {
  MockCircuitBreaker,
  mockCanAttempt,
  mockRecordSuccess,
  mockRecordFailure,
  mockIsTransientError,
  mockSystemConfigFindUnique,
  mockLoggerWarn,
  mockLoggerError,
  mockWriteCostLog,
} = vi.hoisted(() => {
  const mockCanAttempt = vi.fn((_key: string): boolean => true);
  const mockRecordSuccess = vi.fn((_key: string): void => undefined);
  const mockRecordFailure = vi.fn((_key: string): void => undefined);
  const mockIsTransientError = vi.fn((_err: unknown): boolean => true);

  const MockCircuitBreaker = vi.fn().mockImplementation(() => ({
    canAttempt: mockCanAttempt,
    recordSuccess: mockRecordSuccess,
    recordFailure: mockRecordFailure,
  }));

  const mockSystemConfigFindUnique = vi.fn().mockResolvedValue({ configValue: 'sk-ant-mocked' });
  const mockLoggerWarn = vi.fn();
  const mockLoggerError = vi.fn();
  const mockWriteCostLog = vi.fn().mockResolvedValue(undefined);

  return {
    MockCircuitBreaker,
    mockCanAttempt,
    mockRecordSuccess,
    mockRecordFailure,
    mockIsTransientError,
    mockSystemConfigFindUnique,
    mockLoggerWarn,
    mockLoggerError,
    mockWriteCostLog,
  };
});

// ── module mocks ─────────────────────────────────────────────────────────────

vi.mock('@/lib/prisma', () => ({
  prisma: {
    systemConfig: { findUnique: mockSystemConfigFindUnique },
    costLog: { create: vi.fn().mockResolvedValue({}) },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    warn: mockLoggerWarn,
    info: vi.fn(),
    error: mockLoggerError,
    debug: vi.fn(),
  },
}));

vi.mock('@anthropic-ai/sdk', () => ({ default: vi.fn() }));
vi.mock('openai', () => ({ default: vi.fn() }));

vi.mock('../rate-limiter', () => ({
  checkRateLimit: vi.fn().mockResolvedValue(undefined),
  RateLimitError: class RateLimitError extends Error {
    userId: number;
    constructor(userId: number) {
      super('Rate limit exceeded');
      this.userId = userId;
    }
  },
}));

vi.mock('../cost-logger', () => ({
  writeCostLog: mockWriteCostLog,
}));

vi.mock('../anthropic-provider', () => ({
  buildAnthropicPayload: vi.fn().mockReturnValue({}),
  parseAnthropicResponse: vi.fn(),
  isAnthropicModel: vi.fn((m: string) => m.startsWith('claude')),
}));

vi.mock('../openai-provider', () => ({
  buildOpenAIPayload: vi.fn().mockReturnValue({}),
  parseOpenAIResponse: vi.fn(),
}));

// Mock the circuit-breaker module — inject controllable breaker
vi.mock('../circuit-breaker', () => ({
  CircuitBreaker: MockCircuitBreaker,
  isTransientError: mockIsTransientError,
  FAILURE_THRESHOLD: 5,
  COOLDOWN_MS: 30_000,
  llmCircuitBreaker: {
    canAttempt: mockCanAttempt,
    recordSuccess: mockRecordSuccess,
    recordFailure: mockRecordFailure,
  },
}));

// ── tests ─────────────────────────────────────────────────────────────────────

describe('LLMGateway — 集成（熔断器行为）', () => {
  const baseReq = {
    model_tier: 'balanced' as const,
    systemPrompt: 'system',
    userPrompt: 'user',
    metadata: { trace_id: 'trace-001', agentId: 'agent-1', accountId: 1, userId: 99 },
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    // Restore defaults after clearAllMocks
    mockSystemConfigFindUnique.mockResolvedValue({ configValue: 'sk-ant-mocked' });
    mockWriteCostLog.mockResolvedValue(undefined);
    mockCanAttempt.mockReturnValue(true);
    mockIsTransientError.mockReturnValue(true);

    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.OPENAI_API_KEY;

    // Invalidate key cache so each test gets a fresh state
    const { invalidateLlmKeyCache } = await import('../index');
    invalidateLlmKeyCache();
  });

  it('【集成 真熔断 A】primary + fallback 双 OPEN → template 返回 + circuit_open_skip_primary log', async () => {
    // Both circuits OPEN
    mockCanAttempt.mockReturnValue(false);

    const { llmGateway } = await import('../index');
    const result = await llmGateway.complete(baseReq);

    // 真熔断证据：primary_skip log 被调用
    expect(mockLoggerWarn).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'claude-sonnet-4-6' }),
      'llm.circuit_open_skip_primary',
    );

    // Template response returned (both circuits OPEN)
    expect(typeof result.content).toBe('string');
    expect(result.content).toContain('暂时不可用');

    // Neither model got success/failure recorded (both skipped at canAttempt)
    expect(mockRecordSuccess).not.toHaveBeenCalled();
    expect(mockRecordFailure).not.toHaveBeenCalled();
  });

  it('【集成 真熔断 B：主模型被跳过】primary OPEN → fallback healthy → complete 返回 fallback 结果', async () => {
    const { parseOpenAIResponse } = await import('../openai-provider');

    // primary OPEN, fallback CLOSED
    mockCanAttempt.mockImplementation((key: string) => {
      return key !== 'claude-sonnet-4-6'; // gpt-4o (fallback) → true, primary → false
    });

    // Mock fallback (OpenAI) response
    (parseOpenAIResponse as ReturnType<typeof vi.fn>).mockReturnValue({
      content: 'fallback answer',
      tokens: { prompt: 10, completion: 5, total: 15 },
      model: 'gpt-4o',
      duration_ms: 50,
      trace_id: 'trace-001',
    });

    // Provide OpenAI key via mock DB
    mockSystemConfigFindUnique.mockImplementation(({ where }: { where: { configKey: string } }) => {
      if (where.configKey === 'LLM_ANTHROPIC_API_KEY') return Promise.resolve({ configValue: 'sk-ant-mocked' });
      if (where.configKey === 'LLM_OPENAI_API_KEY') return Promise.resolve({ configValue: 'sk-oai-mocked' });
      return Promise.resolve(null);
    });

    const mockCreate = vi.fn().mockResolvedValue({});
    const OpenAIModule = await import('openai');
    (OpenAIModule.default as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      chat: { completions: { create: mockCreate } },
    }));

    const { invalidateLlmKeyCache } = await import('../index');
    invalidateLlmKeyCache('openai');

    const { llmGateway } = await import('../index');
    const result = await llmGateway.complete(baseReq);

    // 真熔断证据：primary was skipped (OPEN → skip log)
    expect(mockLoggerWarn).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'claude-sonnet-4-6' }),
      'llm.circuit_open_skip_primary',
    );

    // Fallback called and succeeded
    expect(result.content).toBe('fallback answer');
    expect(result.fallback).toBeDefined();
    expect(result.fallback?.from).toBe('claude-sonnet-4-6');
    expect(result.fallback?.to).toBe('gpt-4o');

    // recordSuccess called for fallback — primary never got recordSuccess/recordFailure
    expect(mockRecordSuccess).toHaveBeenCalledWith('gpt-4o');
    expect(mockRecordSuccess).not.toHaveBeenCalledWith('claude-sonnet-4-6');
    expect(mockRecordFailure).not.toHaveBeenCalledWith('claude-sonnet-4-6');

    // cost log written with success=true
    expect(mockWriteCostLog).toHaveBeenCalledWith(
      expect.objectContaining({ success: true }),
    );
  });

  it('primary 健康时 canAttempt=true → 正常调用路径（熔断不干扰）', async () => {
    const { parseAnthropicResponse, isAnthropicModel } = await import('../anthropic-provider');

    // All circuits CLOSED
    mockCanAttempt.mockReturnValue(true);

    (isAnthropicModel as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (parseAnthropicResponse as ReturnType<typeof vi.fn>).mockReturnValue({
      content: 'healthy response',
      tokens: { prompt: 10, completion: 5, total: 15 },
      model: 'claude-sonnet-4-6',
      duration_ms: 80,
      trace_id: 'trace-001',
    });

    const mockAnthropicCreate = vi.fn().mockResolvedValue({});
    const AnthropicModule = await import('@anthropic-ai/sdk');
    (AnthropicModule.default as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      messages: { create: mockAnthropicCreate },
    }));

    const { invalidateLlmKeyCache } = await import('../index');
    invalidateLlmKeyCache('anthropic');

    const { llmGateway } = await import('../index');
    const result = await llmGateway.complete(baseReq);

    expect(result.content).toBe('healthy response');
    // No fallback
    expect(result.fallback).toBeUndefined();
    // recordSuccess for primary
    expect(mockRecordSuccess).toHaveBeenCalledWith('claude-sonnet-4-6');
  });
});
