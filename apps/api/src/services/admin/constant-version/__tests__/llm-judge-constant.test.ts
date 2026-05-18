// PRD-14 US-008 AC-3 · llm-judge-constant.service.ts unit tests
// evaluateConstantVersion isMock=true returns score 4.2-4.8 + writes judgeScore to constant_versions

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Prisma mock ────────────────────────────────────────────────────────────

const mockPrisma = vi.hoisted(() => ({
  constantVersion: {
    update: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

// ── Import (after mocks) ──────────────────────────────────────────────────

import { evaluateConstantVersion } from '../llm-judge-constant.service';

// ── Tests ─────────────────────────────────────────────────────────────────

describe('evaluateConstantVersion', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('returns isMock=true with score in [4.2, 4.8] range', async () => {
    const result = await evaluateConstantVersion(1, true);
    expect(result.isMock).toBe(true);
    expect(result.versionId).toBe(1);
    expect(result.score).toBeGreaterThanOrEqual(4.2);
    expect(result.score).toBeLessThanOrEqual(4.8);
  });

  it('writes judgeScore to constant_versions table', async () => {
    const result = await evaluateConstantVersion(5, true);
    expect(mockPrisma.constantVersion.update).toHaveBeenCalledWith({
      where: { id: 5 },
      data: { judgeScore: result.score },
    });
  });

  it('defaults to isMock=true when not specified', async () => {
    const result = await evaluateConstantVersion(2);
    expect(result.isMock).toBe(true);
  });

  it('throws when isMock=false (real LLM not implemented per D-077)', async () => {
    await expect(evaluateConstantVersion(1, false)).rejects.toThrow(
      'Real LLM Judge not implemented for constants',
    );
  });
});
