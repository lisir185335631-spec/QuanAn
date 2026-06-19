// PRD-13 US-003 / US-010 · llm-judge.service.ts unit tests
// AC-10: evaluatePromptVersion isMock=true returns score 4.2-4.8 + writes judgeScore
// G11: evaluatePromptVersion isMock=false calls real LLM + clamps score + propagates errors

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Prisma mock ────────────────────────────────────────────────────────────

const mockPrisma = vi.hoisted(() => ({
  promptVersion: {
    findUnique: vi.fn(),
    update: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

// ── LLM Gateway mock ──────────────────────────────────────────────────────

const mockComplete = vi.hoisted(() => vi.fn());

vi.mock('@/workers/llm-gateway', () => ({
  llmGateway: { complete: mockComplete },
}));

// ── Import (after mocks) ──────────────────────────────────────────────────

import { evaluatePromptVersion } from '../llm-judge.service';

// ── Helpers ───────────────────────────────────────────────────────────────

function makeGatewayResponse(score: number, rationale = 'Test rationale') {
  return {
    content: { score, rationale },
    tokens: { prompt: 10, completion: 10, total: 20 },
    model: 'claude-sonnet-4-6',
    duration_ms: 100,
    trace_id: 'test-trace',
  };
}

const MOCK_PROMPT_VERSION = { content: 'You are a helpful assistant that answers questions.' };

// ── Tests ─────────────────────────────────────────────────────────────────

describe('evaluatePromptVersion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.promptVersion.update.mockResolvedValue({});
    mockPrisma.promptVersion.findUnique.mockResolvedValue(MOCK_PROMPT_VERSION);
  });

  // ── isMock=true (existing behaviour, must remain unchanged) ──────────────

  it('returns isMock=true with score in [4.2, 4.8] range', async () => {
    const result = await evaluatePromptVersion(1, true);
    expect(result.isMock).toBe(true);
    expect(result.versionId).toBe(1);
    expect(result.score).toBeGreaterThanOrEqual(4.2);
    expect(result.score).toBeLessThanOrEqual(4.8);
  });

  it('writes judgeScore to prompt_versions table (isMock=true)', async () => {
    const result = await evaluatePromptVersion(5, true);
    expect(mockPrisma.promptVersion.update).toHaveBeenCalledWith({
      where: { id: 5 },
      data: { judgeScore: result.score },
    });
  });

  it('defaults to isMock=true when not specified', async () => {
    const result = await evaluatePromptVersion(2);
    expect(result.isMock).toBe(true);
  });

  it('does NOT call llmGateway.complete when isMock=true (D-077)', async () => {
    await evaluatePromptVersion(1, true);
    expect(mockComplete).not.toHaveBeenCalled();
  });

  // ── isMock=false (G11 real LLM Judge) ────────────────────────────────────

  it('G11 happy path: calls gateway with reasoning tier and returns real score', async () => {
    mockComplete.mockResolvedValue(makeGatewayResponse(3.8, 'Good clarity but missing edge cases'));

    const result = await evaluatePromptVersion(7, false);

    // (a) gateway.complete WAS called
    expect(mockComplete).toHaveBeenCalledTimes(1);

    // (b) used reasoning tier
    const callArg = mockComplete.mock.calls[0]![0];
    expect(callArg.model_tier).toBe('reasoning');

    // (c) system prompt contains rubric keywords
    expect(callArg.systemPrompt).toContain('清晰度');
    expect(callArg.systemPrompt).toContain('完整度');
    expect(callArg.systemPrompt).toContain('安全合规');
    expect(callArg.systemPrompt).toContain('具体可执行');
    expect(callArg.systemPrompt).toContain('角色一致');

    // (d) user prompt is the actual prompt content
    expect(callArg.userPrompt).toBe(MOCK_PROMPT_VERSION.content);

    // (e) returned score comes from LLM response, not random
    expect(result.score).toBe(3.8);
    expect(result.isMock).toBe(false);
    expect(result.versionId).toBe(7);
    expect(result.rationale).toBe('Good clarity but missing edge cases');
  });

  it('G11: judgeScore is written to DB with the real LLM score', async () => {
    mockComplete.mockResolvedValue(makeGatewayResponse(3.8));

    await evaluatePromptVersion(7, false);

    expect(mockPrisma.promptVersion.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { judgeScore: 3.8 },
    });
  });

  it('G11: score clamped high — LLM returns 7, result is clamped to 5', async () => {
    mockComplete.mockResolvedValue(makeGatewayResponse(7));

    const result = await evaluatePromptVersion(1, false);

    expect(result.score).toBe(5);
    expect(mockPrisma.promptVersion.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { judgeScore: 5 },
    });
  });

  it('G11: score clamped low — LLM returns -1, result is clamped to 0', async () => {
    mockComplete.mockResolvedValue(makeGatewayResponse(-1));

    const result = await evaluatePromptVersion(1, false);

    expect(result.score).toBe(0);
    expect(mockPrisma.promptVersion.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { judgeScore: 0 },
    });
  });

  it('G11: LLM gateway failure propagates — error is NOT swallowed', async () => {
    mockComplete.mockRejectedValue(new Error('LLM provider timeout'));

    await expect(evaluatePromptVersion(1, false)).rejects.toThrow('LLM provider timeout');

    // DB update must NOT have been called (no fake score written)
    expect(mockPrisma.promptVersion.update).not.toHaveBeenCalled();
  });

  it('G11: invalid LLM response schema propagates as error', async () => {
    mockComplete.mockResolvedValue({
      content: { unexpected_field: 'bad', no_score: true },
      tokens: { prompt: 5, completion: 5, total: 10 },
      model: 'claude-sonnet-4-6',
      duration_ms: 50,
      trace_id: 'test',
    });

    await expect(evaluatePromptVersion(1, false)).rejects.toThrow('LLM Judge returned invalid schema');
  });

  it('G11: throws when PromptVersion not found', async () => {
    mockPrisma.promptVersion.findUnique.mockResolvedValue(null);

    await expect(evaluatePromptVersion(999, false)).rejects.toThrow('PromptVersion id=999 not found');
  });

  it('G11: fetches correct versionId from DB', async () => {
    mockComplete.mockResolvedValue(makeGatewayResponse(4.0));

    await evaluatePromptVersion(42, false);

    expect(mockPrisma.promptVersion.findUnique).toHaveBeenCalledWith({
      where: { id: 42 },
      select: { content: true },
    });
  });
});
