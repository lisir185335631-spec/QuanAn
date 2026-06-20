/**
 * BaseSpecialist isFallbackable fix — PRD-29.6 root-cause test
 * Verifies that real-world API error shapes (401, 429, 529, network abort, schema
 * validation failure) all produce isFallback=true instead of throwing.
 *
 * Root cause: old code used `err.message?.includes('5xx')` and
 * `err.message?.includes('API_KEY missing')` — dead-string heuristics that never
 * matched real gateway errors.  Fixed to "default fallbackable, only
 * re-throw genuine programming/type errors".
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoisted mocks ─────────────────────────────────────────────────────────────

const { mockComplete, mockStepDataFindMany, mockCostLogCreate, mockGetLatestInsight } = vi.hoisted(() => ({
  mockComplete: vi.fn(),
  mockStepDataFindMany: vi.fn().mockResolvedValue([]),
  mockCostLogCreate: vi.fn().mockResolvedValue({ id: 1 }),
  mockGetLatestInsight: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/workers/llm-gateway', () => ({
  llmGateway: { complete: mockComplete },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    stepData: { findMany: mockStepDataFindMany },
    userQuota: { findUnique: vi.fn().mockResolvedValue(null) },
    costLog: { create: mockCostLogCreate },
  },
}));

vi.mock('@/memory/l4-profile', () => ({
  getLatestInsight: mockGetLatestInsight,
}));

vi.mock('@/workers/rag', () => ({
  ragRetrieveWorker: { retrieve: vi.fn().mockResolvedValue([]) },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// ── Imports (after mocks) ─────────────────────────────────────────────────────

import { VideoAgent, ProductionOutputSchema } from '../VideoAgent';
import { BrandingAgent } from '../BrandingAgent';

// ── Helpers ───────────────────────────────────────────────────────────────────

const TEST_ACCOUNT_ID = 9001;
const BASE_VIDEO_INPUT = { sourceCopy: '测试内容，用于验证 isFallbackable 修复' };

function makeVideoAgent() { return new VideoAgent(); }
function makeBrandingAgent() { return new BrandingAgent(); }

// ── VideoAgent real-shape error scenarios ─────────────────────────────────────

describe('BaseSpecialist.isFallbackable fix — VideoAgent production mode', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockStepDataFindMany.mockResolvedValue([]);
    mockCostLogCreate.mockResolvedValue({ id: 1 });
    mockGetLatestInsight.mockResolvedValue(null);
  });

  it('returns isFallback=true on real-shape 401 auth error', async () => {
    mockComplete.mockRejectedValue(
      new Error('401 {"type":"authentication_error","message":"invalid x-api-key"}'),
    );
    const result = await makeVideoAgent().execute({
      accountId: TEST_ACCOUNT_ID,
      userId: 1,
      mode: 'production',
      userInput: BASE_VIDEO_INPUT,
    });
    expect(result.isFallback).toBe(true);
    expect(result.modelUsed).toBe('fallback');
  });

  it('returns isFallback=true on 429 rate_limit_error', async () => {
    mockComplete.mockRejectedValue(
      new Error('429 {"type":"rate_limit_error","message":"rate limit exceeded"}'),
    );
    const result = await makeVideoAgent().execute({
      accountId: TEST_ACCOUNT_ID,
      userId: 1,
      mode: 'production',
      userInput: BASE_VIDEO_INPUT,
    });
    expect(result.isFallback).toBe(true);
  });

  it('returns isFallback=true on 529 overloaded error', async () => {
    mockComplete.mockRejectedValue(
      new Error('529 {"type":"overloaded_error","message":"Anthropic is temporarily overloaded"}'),
    );
    const result = await makeVideoAgent().execute({
      accountId: TEST_ACCOUNT_ID,
      userId: 1,
      mode: 'production',
      userInput: BASE_VIDEO_INPUT,
    });
    expect(result.isFallback).toBe(true);
  });

  it('returns isFallback=true on 403 forbidden error', async () => {
    mockComplete.mockRejectedValue(
      new Error('403 {"type":"permission_error","message":"Your API key does not have permission"}'),
    );
    const result = await makeVideoAgent().execute({
      accountId: TEST_ACCOUNT_ID,
      userId: 1,
      mode: 'production',
      userInput: BASE_VIDEO_INPUT,
    });
    expect(result.isFallback).toBe(true);
  });

  it('returns isFallback=true on network/fetch error', async () => {
    mockComplete.mockRejectedValue(
      new Error('fetch failed: ECONNRESET'),
    );
    const result = await makeVideoAgent().execute({
      accountId: TEST_ACCOUNT_ID,
      userId: 1,
      mode: 'production',
      userInput: BASE_VIDEO_INPUT,
    });
    expect(result.isFallback).toBe(true);
  });

  it('returns isFallback=true on generic API Error with no message', async () => {
    mockComplete.mockRejectedValue(new Error());
    const result = await makeVideoAgent().execute({
      accountId: TEST_ACCOUNT_ID,
      userId: 1,
      mode: 'production',
      userInput: BASE_VIDEO_INPUT,
    });
    expect(result.isFallback).toBe(true);
  });

  it('fallback result passes ProductionOutputSchema on 401 error', async () => {
    mockComplete.mockRejectedValue(
      new Error('401 {"type":"authentication_error","message":"invalid x-api-key"}'),
    );
    const result = await makeVideoAgent().execute({
      accountId: TEST_ACCOUNT_ID,
      userId: 1,
      mode: 'production',
      userInput: BASE_VIDEO_INPUT,
    });
    const parsed = ProductionOutputSchema.safeParse(result.result);
    expect(parsed.success).toBe(true);
  });

  it('fallback result passes ProductionOutputSchema on 529 overloaded', async () => {
    mockComplete.mockRejectedValue(
      new Error('529 {"type":"overloaded_error","message":"Anthropic is temporarily overloaded"}'),
    );
    const result = await makeVideoAgent().execute({
      accountId: TEST_ACCOUNT_ID,
      userId: 1,
      mode: 'production',
      userInput: BASE_VIDEO_INPUT,
    });
    const parsed = ProductionOutputSchema.safeParse(result.result);
    expect(parsed.success).toBe(true);
  });

  it('returns isFallback=true when LLM returns invalid JSON (safeParse fails twice)', async () => {
    // LLM gateway resolves with a string instead of a JSON object — both safeParse
    // calls will fail → SchemaValidationError → should now be fallbackable.
    mockComplete.mockResolvedValue({
      content: '抱歉系统暂时不可用，请稍后再试。',
      tokens: { prompt: 0, completion: 0, total: 0 },
      model: 'claude-sonnet-4-6',
    });
    const result = await makeVideoAgent().execute({
      accountId: TEST_ACCOUNT_ID,
      userId: 1,
      mode: 'production',
      userInput: BASE_VIDEO_INPUT,
    });
    expect(result.isFallback).toBe(true);
  });
});

// ── BrandingAgent real-shape error scenarios ──────────────────────────────────

describe('BaseSpecialist.isFallbackable fix — BrandingAgent persona mode', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockStepDataFindMany.mockResolvedValue([]);
    mockCostLogCreate.mockResolvedValue({ id: 1 });
    mockGetLatestInsight.mockResolvedValue(null);
  });

  it('returns isFallback=true on 401 auth error (persona mode)', async () => {
    mockComplete.mockRejectedValue(
      new Error('401 {"type":"authentication_error","message":"invalid x-api-key"}'),
    );
    const result = await makeBrandingAgent().execute({
      accountId: TEST_ACCOUNT_ID,
      userId: 1,
      mode: 'persona',
      userInput: {},
    });
    expect(result.isFallback).toBe(true);
    expect(result.modelUsed).toBe('fallback');
  });

  it('returns isFallback=true on 529 overloaded (persona mode)', async () => {
    mockComplete.mockRejectedValue(
      new Error('529 {"type":"overloaded_error","message":"Anthropic is temporarily overloaded"}'),
    );
    const result = await makeBrandingAgent().execute({
      accountId: TEST_ACCOUNT_ID,
      userId: 1,
      mode: 'persona',
      userInput: {},
    });
    expect(result.isFallback).toBe(true);
  });

  it('returns isFallback=true on 429 rate limit (packaging mode)', async () => {
    mockComplete.mockRejectedValue(
      new Error('429 {"type":"rate_limit_error","message":"rate limit exceeded"}'),
    );
    const result = await makeBrandingAgent().execute({
      accountId: TEST_ACCOUNT_ID,
      userId: 1,
      mode: 'packaging',
      userInput: {},
    });
    expect(result.isFallback).toBe(true);
  });

  it('does NOT fallback when invokeLLM throws for invalid mode — mode error should propagate', async () => {
    // Invalid mode → _validateMode throws a plain Error (not TypeError/ReferenceError)
    // → isFallbackable=true BUT fallbackTemplate['bad_mode'] === undefined → re-throw
    mockComplete.mockResolvedValue({
      content: {},
      tokens: { prompt: 0, completion: 0, total: 0 },
      model: 'fallback',
    });
    await expect(
      makeBrandingAgent().execute({
        accountId: TEST_ACCOUNT_ID,
      userId: 1,
        mode: 'bad_mode',
        userInput: {},
      }),
    ).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// G12 fix: fallback path 写 success=false 到 cost_log — canary 错误率真感知
// ---------------------------------------------------------------------------

describe('G12 fix: fallback path writes success=false to cost_log', () => {
  beforeEach(() => {
    // 使用 clearAllMocks(仅清 call history) 而非 resetAllMocks(会清 implementation)
    vi.clearAllMocks();
    mockStepDataFindMany.mockResolvedValue([]);
    mockCostLogCreate.mockResolvedValue({ id: 1 });
    mockGetLatestInsight.mockResolvedValue(null);
  });

  it('G12 fix: BaseSpecialist fallback path 写 success=false (BrandingAgent persona)', async () => {
    // VideoAgent.production 有自己的内部 catch(不走 BaseSpecialist outer catch)，
    // 用 BrandingAgent.persona 来测试 BaseSpecialist.execute() 的 catch block。
    // 429 → BrandingAgent.invokeLLM throw → BaseSpecialist outer catch → fallback path → cost_log.success=false
    mockComplete.mockRejectedValue(
      new Error('429 {"type":"rate_limit_error","message":"rate limit exceeded"}'),
    );

    // spy on costLog.create at the prisma mock level — capture actual args
    const capturedArgs: Array<{ data: Record<string, unknown> }> = [];
    mockCostLogCreate.mockImplementation(async (arg: { data: Record<string, unknown> }) => {
      capturedArgs.push(arg);
      return { id: 42 };
    });

    const result = await makeBrandingAgent().execute({
      accountId: TEST_ACCOUNT_ID,
      userId: 1,
      mode: 'persona',
      userInput: {},
    });

    // 确认确实走了 BaseSpecialist outer catch 的 fallback
    expect(result.isFallback).toBe(true);
    expect(result.modelUsed).toBe('fallback');

    // G12 核心断言: BaseSpecialist.execute() catch path 的 cost_log 写 success=false
    // 这保证 canary 止损统计的 costLog.count({ success:false }) 能感知到真实失败
    expect(capturedArgs).toHaveLength(1);
    const written = capturedArgs[0]!.data;
    expect(written['success']).toBe(false);
    expect(written['isFallback']).toBe(true);
    expect(written['modelUsed']).toBe('fallback');
  });
});
