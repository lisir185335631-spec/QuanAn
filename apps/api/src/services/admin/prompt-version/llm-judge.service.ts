// PRD-13 US-003 AC-10 · llm-judge.service.ts
// evaluatePromptVersion — isMock=true default (D-077: real eval via GitHub Actions CI)
// Mock returns score 4.2~4.8 · writes judgeScore to prompt_versions table
import { prisma } from '@/lib/prisma';

export interface JudgeResult {
  versionId: number;
  score: number;
  isMock: boolean;
}

export async function evaluatePromptVersion(
  versionId: number,
  isMock: boolean = true,
): Promise<JudgeResult> {
  if (isMock) {
    // D-077: mock mode returns deterministic-ish score 4.2~4.8
    const score = parseFloat((4.2 + Math.random() * 0.6).toFixed(2));

    await prisma.promptVersion.update({
      where: { id: versionId },
      data: { judgeScore: score },
    });

    return { versionId, score, isMock: true };
  }

  // Real LLM Judge (D-077: enabled via GitHub Actions CI / PRR phase)
  // Placeholder — real implementation deferred to PRR phase per D-077
  throw new Error('Real LLM Judge not implemented (D-077: enable via GitHub Actions CI)');
}
