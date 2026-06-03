/**
 * BrandingAgent fallback unit tests — PRD-29.6 review fix
 * Non-skipIf: always runs (no real LLM key needed).
 * Covers: fallback trigger path (LLM error → fallbackTemplate → isFallback=true),
 * Step3bOutputSchema conformance on fallback result, and key nested field assertions.
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

import { BrandingAgent, Step3bOutputSchema, type Step3bOutput } from '../BrandingAgent';

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('BrandingAgent fallback (persona mode)', () => {
  const TEST_ACCOUNT_ID = 7001;

  beforeEach(() => {
    vi.resetAllMocks();
    // Re-establish stable mocks that ContextAssembler needs after resetAllMocks
    mockStepDataFindMany.mockResolvedValue([]);
    mockCostLogCreate.mockResolvedValue({ id: 1 });
    mockGetLatestInsight.mockResolvedValue(null);
    // Trigger fallback: LLM throws an error that includes API_KEY missing
    mockComplete.mockRejectedValue(new Error('API_KEY missing: ANTHROPIC_API_KEY'));
  });

  it('returns isFallback=true when LLM throws API_KEY error', async () => {
    const agent = new BrandingAgent();
    const result = await agent.execute({
      accountId: TEST_ACCOUNT_ID,
      mode: 'persona',
      userInput: {},
    });
    expect(result.isFallback).toBe(true);
  });

  it('returns modelUsed="fallback" on fallback path', async () => {
    const agent = new BrandingAgent();
    const result = await agent.execute({
      accountId: TEST_ACCOUNT_ID,
      mode: 'persona',
      userInput: {},
    });
    expect(result.modelUsed).toBe('fallback');
  });

  it('fallback result passes Step3bOutputSchema.safeParse', async () => {
    const agent = new BrandingAgent();
    const result = await agent.execute({
      accountId: TEST_ACCOUNT_ID,
      mode: 'persona',
      userInput: {},
    });
    const parsed = Step3bOutputSchema.safeParse(result.result);
    expect(parsed.success).toBe(true);
  });

  it('fallback coreIdentity.identityTag is a non-empty string', async () => {
    const agent = new BrandingAgent();
    const result = await agent.execute({
      accountId: TEST_ACCOUNT_ID,
      mode: 'persona',
      userInput: {},
    });
    const data = result.result as Step3bOutput;
    expect(typeof data.coreIdentity.identityTag).toBe('string');
    expect(data.coreIdentity.identityTag.length).toBeGreaterThan(0);
  });

  it('fallback coreIdentity.memoryPoints has at least 3 items', async () => {
    const agent = new BrandingAgent();
    const result = await agent.execute({
      accountId: TEST_ACCOUNT_ID,
      mode: 'persona',
      userInput: {},
    });
    const data = result.result as Step3bOutput;
    expect(data.coreIdentity.memoryPoints.length).toBeGreaterThanOrEqual(3);
  });

  it('fallback thoughtSystem.mottos has at least 3 items', async () => {
    const agent = new BrandingAgent();
    const result = await agent.execute({
      accountId: TEST_ACCOUNT_ID,
      mode: 'persona',
      userInput: {},
    });
    const data = result.result as Step3bOutput;
    expect(data.thoughtSystem.mottos.length).toBeGreaterThanOrEqual(3);
  });

  it('fallback contentPersona.visualStyle exists with expected shape', async () => {
    const agent = new BrandingAgent();
    const result = await agent.execute({
      accountId: TEST_ACCOUNT_ID,
      mode: 'persona',
      userInput: {},
    });
    const data = result.result as Step3bOutput;
    expect(data.contentPersona.visualStyle).toBeDefined();
    expect(typeof data.contentPersona.visualStyle.style).toBe('string');
  });

  it('fallback contentPersona.contentPillars has at least 4 items', async () => {
    const agent = new BrandingAgent();
    const result = await agent.execute({
      accountId: TEST_ACCOUNT_ID,
      mode: 'persona',
      userInput: {},
    });
    const data = result.result as Step3bOutput;
    expect(data.contentPersona.contentPillars.length).toBeGreaterThanOrEqual(4);
  });

  it('fallback trustSystem.storyLine.mainStory is a non-empty string', async () => {
    const agent = new BrandingAgent();
    const result = await agent.execute({
      accountId: TEST_ACCOUNT_ID,
      mode: 'persona',
      userInput: {},
    });
    const data = result.result as Step3bOutput;
    expect(typeof data.trustSystem.storyLine.mainStory).toBe('string');
    expect(data.trustSystem.storyLine.mainStory.length).toBeGreaterThan(0);
  });

  it('fallback roadmap has exactly 3 stages with correct accent order', async () => {
    const agent = new BrandingAgent();
    const result = await agent.execute({
      accountId: TEST_ACCOUNT_ID,
      mode: 'persona',
      userInput: {},
    });
    const data = result.result as Step3bOutput;
    expect(data.roadmap.length).toBe(3);
    expect(data.roadmap[0]!.accent).toBe('green');
    expect(data.roadmap[1]!.accent).toBe('yellow');
    expect(data.roadmap[2]!.accent).toBe('purple');
  });

  it('fallback roadmap stages each have at least 3 steps', async () => {
    const agent = new BrandingAgent();
    const result = await agent.execute({
      accountId: TEST_ACCOUNT_ID,
      mode: 'persona',
      userInput: {},
    });
    const data = result.result as Step3bOutput;
    for (const stage of data.roadmap) {
      expect(stage.steps.length).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('BrandingAgent fallback (packaging mode)', () => {
  const TEST_ACCOUNT_ID = 7002;

  beforeEach(() => {
    vi.resetAllMocks();
    mockStepDataFindMany.mockResolvedValue([]);
    mockCostLogCreate.mockResolvedValue({ id: 1 });
    mockGetLatestInsight.mockResolvedValue(null);
    mockComplete.mockRejectedValue(new Error('API_KEY missing: ANTHROPIC_API_KEY'));
  });

  it('packaging mode fallback returns isFallback=true and modelUsed=fallback', async () => {
    const agent = new BrandingAgent();
    const result = await agent.execute({
      accountId: TEST_ACCOUNT_ID,
      mode: 'packaging',
      userInput: {},
    });
    expect(result.isFallback).toBe(true);
    expect(result.modelUsed).toBe('fallback');
  });
});
