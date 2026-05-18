// PRD-13 US-003 · llm-judge.service.ts unit tests
// AC-10: evaluatePromptVersion isMock=true returns score 4.2-4.8 + writes judgeScore

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Prisma mock ────────────────────────────────────────────────────────────

const mockPrisma = vi.hoisted(() => ({
  promptVersion: {
    update: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

// ── Import (after mocks) ──────────────────────────────────────────────────

import { evaluatePromptVersion } from '../llm-judge.service';

// ── Tests ─────────────────────────────────────────────────────────────────

describe('evaluatePromptVersion', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('returns isMock=true with score in [4.2, 4.8] range', async () => {
    const result = await evaluatePromptVersion(1, true);
    expect(result.isMock).toBe(true);
    expect(result.versionId).toBe(1);
    expect(result.score).toBeGreaterThanOrEqual(4.2);
    expect(result.score).toBeLessThanOrEqual(4.8);
  });

  it('writes judgeScore to prompt_versions table', async () => {
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

  it('throws when isMock=false (real LLM not implemented per D-077)', async () => {
    await expect(evaluatePromptVersion(1, false)).rejects.toThrow(
      'Real LLM Judge not implemented',
    );
  });
});
