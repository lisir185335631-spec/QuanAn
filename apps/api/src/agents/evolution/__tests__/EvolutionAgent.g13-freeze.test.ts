/**
 * EvolutionAgent G13 freeze guard unit tests — US-009
 * Verifies: feedbackCountTotal >= 100 → skipped (no invokeLLM call)
 *           feedbackCountTotal = 99  → normal flow continues (invokeLLM IS called)
 * Non-skipIf: always runs (no real LLM key needed).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoisted mocks ──────────────────────────────────────────────────────────────

const {
  mockComplete,
  mockProfileFindUnique,
  mockFeedbackLogFindMany,
  mockEvolutionInsightCreate,
  mockEvolutionProfileUpdate,
  mockTransaction,
  mockGetSystemConfigValue,
  mockAssemble,
  mockGetDeepLearningSamples,
} = vi.hoisted(() => ({
  mockComplete: vi.fn(),
  mockProfileFindUnique: vi.fn(),
  mockFeedbackLogFindMany: vi.fn().mockResolvedValue([]),
  mockEvolutionInsightCreate: vi.fn().mockResolvedValue({ id: 1 }),
  mockEvolutionProfileUpdate: vi.fn().mockResolvedValue({}),
  mockTransaction: vi.fn(),
  mockGetSystemConfigValue: vi.fn().mockResolvedValue(null),
  mockAssemble: vi.fn().mockResolvedValue({
    systemPrompt: 'test-system-prompt',
    evolutionInsight: null,
  }),
  mockGetDeepLearningSamples: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/workers/llm-gateway', () => ({
  llmGateway: { complete: mockComplete },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    evolutionProfile: {
      findUnique: mockProfileFindUnique,
      update: mockEvolutionProfileUpdate,
    },
    evolutionInsight: {
      create: mockEvolutionInsightCreate,
    },
    feedbackLog: {
      findMany: mockFeedbackLogFindMany,
    },
    $transaction: mockTransaction,
  },
}));

vi.mock('@/services/admin/feature-flag/feature-flag.service', () => ({
  getSystemConfigValue: mockGetSystemConfigValue,
}));

vi.mock('@/services/context-assembler/ContextAssembler', () => ({
  contextAssembler: {
    assemble: mockAssemble,
  },
}));

vi.mock('@/memory/l4-profile', () => ({
  getDeepLearningSamples: mockGetDeepLearningSamples,
}));

vi.mock('@/services/admin/evolution-health/anomaly-detection.service', () => ({
  detectEvolutionAnomalies: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/services/admin/notifications/dingtalk.service', () => ({
  DingtalkService: vi.fn().mockImplementation(() => ({
    send: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// ── Imports (after mocks) ──────────────────────────────────────────────────────

import { EvolutionAgent } from '../EvolutionAgent';

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('EvolutionAgent G13 freeze guard', () => {
  const TEST_ACCOUNT_ID = 9001;

  const baseRequest = {
    accountId: TEST_ACCOUNT_ID,
    userId: 1,
    mode: 'execute' as const,
    userInput: {
      accountId: TEST_ACCOUNT_ID,
      triggerType: 'threshold:100',
    },
  };

  beforeEach(() => {
    vi.resetAllMocks();
    // Re-establish stable mocks after resetAllMocks clears implementations
    mockGetSystemConfigValue.mockResolvedValue(null); // kill-switch off
    mockFeedbackLogFindMany.mockResolvedValue([]);
    mockGetDeepLearningSamples.mockResolvedValue([]);
    mockAssemble.mockResolvedValue({
      systemPrompt: 'test-system-prompt',
      evolutionInsight: null,
    });
  });

  it('feedbackCountTotal=100 → skipped=true, no invokeLLM call', async () => {
    mockProfileFindUnique.mockResolvedValue({ feedbackCountTotal: 100 });

    const agent = new EvolutionAgent();
    const result = await agent.execute(baseRequest) as unknown as Record<string, unknown>;

    expect(result['skipped']).toBe(true);
    expect(result['isFallback']).toBe(true);
    expect(result['modelUsed']).toBe('g13-freeze');
    expect(mockComplete).not.toHaveBeenCalled();
  });

  it('feedbackCountTotal=150 → also skipped (above threshold)', async () => {
    mockProfileFindUnique.mockResolvedValue({ feedbackCountTotal: 150 });

    const agent = new EvolutionAgent();
    const result = await agent.execute(baseRequest) as unknown as Record<string, unknown>;

    expect(result['skipped']).toBe(true);
    expect(mockComplete).not.toHaveBeenCalled();
  });

  it('feedbackCountTotal=99 → normal flow continues (invokeLLM IS called)', async () => {
    mockProfileFindUnique.mockResolvedValue({ feedbackCountTotal: 99 });
    mockFeedbackLogFindMany.mockResolvedValue([]);

    // Inject mock gateway directly to bypass module-level singleton
    const mockGatewayComplete = vi.fn().mockRejectedValue(new Error('API_KEY missing'));
    const agent = new EvolutionAgent({ complete: mockGatewayComplete });

    try {
      await agent.execute(baseRequest);
    } catch {
      // expected — invokeLLM should still have been called
    }

    expect(mockGatewayComplete).toHaveBeenCalled();
  });

  it('feedbackCountTotal=0 → normal flow continues (no profile case)', async () => {
    mockProfileFindUnique.mockResolvedValue(null);
    mockFeedbackLogFindMany.mockResolvedValue([]);

    const mockGatewayComplete = vi.fn().mockRejectedValue(new Error('API_KEY missing'));
    const agent = new EvolutionAgent({ complete: mockGatewayComplete });

    try {
      await agent.execute(baseRequest);
    } catch {
      // expected
    }

    expect(mockGatewayComplete).toHaveBeenCalled();
  });
});
