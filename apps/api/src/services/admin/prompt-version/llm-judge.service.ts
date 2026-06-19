// PRD-13 US-003 AC-10 · llm-judge.service.ts
// evaluatePromptVersion — isMock=true default (D-077: real eval via GitHub Actions CI)
// Mock returns score 4.2~4.8 · writes judgeScore to prompt_versions table
// G11: isMock=false calls real LLM Judge via llmGateway (US-010)
import { z } from 'zod';
import { SYSTEM_USER_ID } from '@/lib/constants/system';
import { prisma } from '@/lib/prisma';
import { llmGateway } from '@/workers/llm-gateway';

// ── Schema for LLM Judge structured output ────────────────────────────────

const LlmJudgeOutputSchema = z.object({
  score: z.number(),
  rationale: z.string(),
});

// ── System prompt: reviewer persona + rubric ──────────────────────────────

const JUDGE_SYSTEM_PROMPT = `你是一名专业的 AI Prompt 质量审查员。
你的任务是评估一段系统提示词（System Prompt）的质量，并给出 0-5 分的综合评分与详细说明。

评分维度（各维度均等权重）：
1. 清晰度（Clarity）：指令是否表达明确，无歧义、无矛盾。
2. 完整度（Completeness）：是否涵盖了 Agent 任务所需的所有核心信息与边界情况。
3. 安全合规（Safety / Compliance）：是否不含提示注入风险，不泄露 PII，符合安全规范。
4. 具体可执行（Concrete & Actionable）：输出格式、约束条件是否有足够具体的可操作指引。
5. 角色一致（Role Consistency）：角色定义与行为约束是否贯穿始终，无前后矛盾。

评分标准：
- 5 分：所有维度均优秀，可直接投产。
- 4 分：绝大多数维度良好，有一处小瑕疵。
- 3 分：基本达标，但有 1-2 个维度需要改进。
- 2 分：多个维度存在明显问题，需要较多修改。
- 1 分：绝大多数维度不及格，需要大幅重写。
- 0 分：完全不可用，缺乏任何有效内容。

请以如下 JSON 格式输出（不要输出其他内容）：
{"score": <0-5 的数字，允许一位小数>, "rationale": "<中文说明，指出优缺点与改进建议>"}`;

// ── Public types ──────────────────────────────────────────────────────────

export interface JudgeResult {
  versionId: number;
  score: number;
  rationale?: string;
  isMock: boolean;
}

// ── Main function ─────────────────────────────────────────────────────────

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

  // ── G11: Real LLM Judge (US-010) ────────────────────────────────────────

  // 1. Fetch the prompt version to get the content being evaluated
  const promptVersion = await prisma.promptVersion.findUnique({
    where: { id: versionId },
    select: { content: true },
  });

  if (!promptVersion) {
    throw new Error(`PromptVersion id=${versionId} not found`);
  }

  // 2. Call LLM Gateway — reasoning tier (judging is a reasoning task)
  const response = await llmGateway.complete({
    model_tier: 'reasoning',
    systemPrompt: JUDGE_SYSTEM_PROMPT,
    userPrompt: promptVersion.content,
    responseFormat: { type: 'json_schema', schema: LlmJudgeOutputSchema },
    metadata: {
      trace_id: `llm-judge-pv-${versionId}-${Date.now()}`,
      agentId: 'LlmJudge-PromptVersion',
      accountId: 0,
      userId: SYSTEM_USER_ID,
      eventType: 'prompt_judge',
    },
    timeout_ms: 60_000,
  });

  // 3. Parse and validate — propagate errors (no silent fake scores)
  const parsed = LlmJudgeOutputSchema.safeParse(response.content);
  if (!parsed.success) {
    throw new Error(
      `LLM Judge returned invalid schema: ${JSON.stringify(response.content)} — ${parsed.error.message}`,
    );
  }

  // 4. Clamp score to [0, 5]
  const clampedScore = Math.max(0, Math.min(5, parsed.data.score));
  const rationale = parsed.data.rationale;

  // 5. Persist to DB — judgeScore only (no rationale column in PromptVersion schema)
  await prisma.promptVersion.update({
    where: { id: versionId },
    data: { judgeScore: clampedScore },
  });

  return { versionId, score: clampedScore, rationale, isMock: false };
}
