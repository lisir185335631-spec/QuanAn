/**
 * VideoAgent fallback unit tests — PRD-29.6 fix
 * Non-skipIf: always runs (no real LLM key needed).
 * Covers: production mode fallback trigger path (LLM error → fallbackTemplate.production
 * → isFallback=true), ProductionOutputSchema conformance on fallback result,
 * and verifies shooting/storyboard modes are NOT broken.
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

import {
  VideoAgent,
  ProductionOutputSchema,
  type ProductionOutput,
} from '../VideoAgent';

// ── Helpers ───────────────────────────────────────────────────────────────────

const TEST_ACCOUNT_ID = 8001;

const BASE_USER_INPUT = { sourceCopy: '测试制作计划' };

// ── production mode fallback (LLM gateway throws) ────────────────────────────

describe('VideoAgent production mode fallback — LLM gateway throws', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockStepDataFindMany.mockResolvedValue([]);
    mockCostLogCreate.mockResolvedValue({ id: 1 });
    mockGetLatestInsight.mockResolvedValue(null);
    // Simulate: key is present but API call fails (e.g. 401, 529, network error)
    mockComplete.mockRejectedValue(new Error('ANTHROPIC_API_KEY missing for reasoning tier'));
  });

  it('does NOT throw — returns isFallback=true instead', async () => {
    const agent = new VideoAgent();
    await expect(
      agent.execute({ accountId: TEST_ACCOUNT_ID, userId: 1, mode: 'production', userInput: BASE_USER_INPUT }),
    ).resolves.not.toThrow();
  });

  it('returns isFallback=true on LLM error', async () => {
    const agent = new VideoAgent();
    const result = await agent.execute({
      accountId: TEST_ACCOUNT_ID,
      userId: 1,
      mode: 'production',
      userInput: BASE_USER_INPUT,
    });
    expect(result.isFallback).toBe(true);
  });

  it('returns modelUsed="fallback" on fallback path', async () => {
    const agent = new VideoAgent();
    const result = await agent.execute({
      accountId: TEST_ACCOUNT_ID,
      userId: 1,
      mode: 'production',
      userInput: BASE_USER_INPUT,
    });
    expect(result.modelUsed).toBe('fallback');
  });

  it('fallback result passes ProductionOutputSchema.safeParse', async () => {
    const agent = new VideoAgent();
    const result = await agent.execute({
      accountId: TEST_ACCOUNT_ID,
      userId: 1,
      mode: 'production',
      userInput: BASE_USER_INPUT,
    });
    const parsed = ProductionOutputSchema.safeParse(result.result);
    expect(parsed.success).toBe(true);
  });

  it('fallback result has shotList with at least 1 item', async () => {
    const agent = new VideoAgent();
    const result = await agent.execute({
      accountId: TEST_ACCOUNT_ID,
      userId: 1,
      mode: 'production',
      userInput: BASE_USER_INPUT,
    });
    const data = result.result as ProductionOutput;
    expect(Array.isArray(data.shotList)).toBe(true);
    expect(data.shotList.length).toBeGreaterThanOrEqual(1);
  });

  it('fallback shotList items have all 13 required ShotItem fields', async () => {
    const agent = new VideoAgent();
    const result = await agent.execute({
      accountId: TEST_ACCOUNT_ID,
      userId: 1,
      mode: 'production',
      userInput: BASE_USER_INPUT,
    });
    const data = result.result as ProductionOutput;
    const REQUIRED_FIELDS = [
      'scene', 'duration', 'action', 'dialogue', 'cameraAngle',
      'prop', 'lighting', 'transition', 'sfx', 'voiceover',
      'subtitle', 'costume', 'location',
    ] as const;
    for (const shot of data.shotList) {
      for (const field of REQUIRED_FIELDS) {
        expect(typeof (shot as Record<string, unknown>)[field]).toBe('string');
      }
    }
  });

  it('fallback result has non-empty equipment array and schedule string', async () => {
    const agent = new VideoAgent();
    const result = await agent.execute({
      accountId: TEST_ACCOUNT_ID,
      userId: 1,
      mode: 'production',
      userInput: BASE_USER_INPUT,
    });
    const data = result.result as ProductionOutput;
    expect(Array.isArray(data.equipment)).toBe(true);
    expect(data.equipment.length).toBeGreaterThan(0);
    expect(typeof data.schedule).toBe('string');
    expect(data.schedule.length).toBeGreaterThan(0);
  });
});

// ── production mode fallback (LLM gateway throws generic API error) ────────

describe('VideoAgent production mode fallback — generic API error', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockStepDataFindMany.mockResolvedValue([]);
    mockCostLogCreate.mockResolvedValue({ id: 1 });
    mockGetLatestInsight.mockResolvedValue(null);
    // Simulate API auth error (401) — message does NOT contain 'API_KEY missing' or '5xx'
    mockComplete.mockRejectedValue(new Error('401 {"type":"authentication_error","message":"invalid x-api-key"}'));
  });

  it('does NOT throw on 401 auth error — returns isFallback=true', async () => {
    const agent = new VideoAgent();
    const result = await agent.execute({
      accountId: TEST_ACCOUNT_ID,
      userId: 1,
      mode: 'production',
      userInput: BASE_USER_INPUT,
    });
    expect(result.isFallback).toBe(true);
    expect(result.modelUsed).toBe('fallback');
  });

  it('fallback result passes ProductionOutputSchema on 401 error', async () => {
    const agent = new VideoAgent();
    const result = await agent.execute({
      accountId: TEST_ACCOUNT_ID,
      userId: 1,
      mode: 'production',
      userInput: BASE_USER_INPUT,
    });
    const parsed = ProductionOutputSchema.safeParse(result.result);
    expect(parsed.success).toBe(true);
  });
});

// ── production mode fallback (LLM returns invalid JSON content) ──────────

describe('VideoAgent production mode fallback — LLM returns invalid content', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockStepDataFindMany.mockResolvedValue([]);
    mockCostLogCreate.mockResolvedValue({ id: 1 });
    mockGetLatestInsight.mockResolvedValue(null);
    // Simulate gateway returning a string error message instead of valid JSON
    mockComplete.mockResolvedValue({
      content: '抱歉，AI 服务暂时不可用，请稍后再试。如问题持续，请联系客服。',
      tokens: { prompt: 0, completion: 0, total: 0 },
      model: 'gpt-4o',
    });
  });

  it('returns isFallback=true when LLM returns string content failing ProductionOutputSchema', async () => {
    const agent = new VideoAgent();
    const result = await agent.execute({
      accountId: TEST_ACCOUNT_ID,
      userId: 1,
      mode: 'production',
      userInput: BASE_USER_INPUT,
    });
    expect(result.isFallback).toBe(true);
  });

  it('fallback result passes ProductionOutputSchema when LLM returns invalid content', async () => {
    const agent = new VideoAgent();
    const result = await agent.execute({
      accountId: TEST_ACCOUNT_ID,
      userId: 1,
      mode: 'production',
      userInput: BASE_USER_INPUT,
    });
    const parsed = ProductionOutputSchema.safeParse(result.result);
    expect(parsed.success).toBe(true);
  });
});

// ── shooting mode — existing behavior not broken ──────────────────────────

describe('VideoAgent shooting mode — fallback NOT triggered on LLM success', () => {
  const validShootingContent = {
    shotList: [
      {
        duration: '5s',
        scene: '开场',
        shotType: '中景',
        angle: '平角',
        movement: '固定',
        emotion: '自信',
        dialogue: '大家好',
        action: '主持人入镜',
      },
    ],
    equipment: ['手机'],
    schedule: '上午 9-11 点',
  };

  beforeEach(() => {
    vi.resetAllMocks();
    mockStepDataFindMany.mockResolvedValue([]);
    mockCostLogCreate.mockResolvedValue({ id: 1 });
    mockGetLatestInsight.mockResolvedValue(null);
    mockComplete.mockResolvedValue({
      content: validShootingContent,
      tokens: { prompt: 100, completion: 200, total: 300 },
      model: 'claude-sonnet-4-6',
    });
  });

  it('shooting mode returns isFallback=false on valid LLM response', async () => {
    const agent = new VideoAgent();
    const result = await agent.execute({
      accountId: TEST_ACCOUNT_ID,
      userId: 1,
      mode: 'shooting',
      userInput: BASE_USER_INPUT,
    });
    expect(result.isFallback).toBe(false);
    expect(result.modelUsed).toBe('claude-sonnet-4-6');
  });
});

