// PRD-14 US-008 AC-3 · llm-judge-constant.service.ts
// evaluateConstantVersion — isMock=true default (D-077: real eval via GitHub Actions CI)
// Mirrors PRD-13 US-003 llm-judge.service.ts · 改 prompt_versions → constant_versions
import { prisma } from '@/lib/prisma';

export interface ConstantJudgeResult {
  versionId: number;
  score: number;
  isMock: boolean;
}

export async function evaluateConstantVersion(
  versionId: number,
  isMock: boolean = true,
): Promise<ConstantJudgeResult> {
  if (isMock) {
    const score = parseFloat((4.2 + Math.random() * 0.6).toFixed(2));

    await prisma.constantVersion.update({
      where: { id: versionId },
      data: { judgeScore: score },
    });

    return { versionId, score, isMock: true };
  }

  // Real LLM Judge deferred to PRR phase per D-077
  throw new Error('Real LLM Judge not implemented for constants (D-077: enable via GitHub Actions CI)');
}
