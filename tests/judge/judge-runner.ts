/**
 * QuanQn · US-016 · Shared LLM Judge Runner
 * AC-1: runJudge(case_) → llmGateway.complete({ model_tier:'lightweight', responseFormat:json_schema, retry:1 })
 * AC-5: cost_log event_type='judge_call' (D-023)
 * AC-6: judge-runner 内置 retry 1 (flaky防止)
 * AC-9: lightweight tier (haiku/4o-mini) — 成本敏感
 * AC-13: timeout_ms=10000 (single judge < 10s)
 */

import { z } from 'zod';
import { llmGateway } from '@/workers/llm-gateway';

// ── AC-1: Judge result schema ─────────────────────────────────────────────────

export const JudgeResultSchema = z.object({
  pass: z.boolean(),
  score: z.number().int().min(0).max(10),
  reason: z.string().min(1),
});

export type JudgeResult = z.infer<typeof JudgeResultSchema>;

// ── Judge case interface (AC-2) ───────────────────────────────────────────────

export interface JudgeCase {
  specialistId: string;
  mode?: string;
  input: Record<string, unknown>;
  actualOutput: Record<string, unknown>;
  /** AC-11: 必须可量化 — e.g. '含至少 3 段 markdown' not '看起来好' */
  criteria: string[];
  expectedKeyFields: string[];
}

// ── AC-7: score/pass consistency threshold ────────────────────────────────────

export const PASS_SCORE_THRESHOLD = 6;

// ── Judge system prompt (strict criteria) ─────────────────────────────────────

const JUDGE_SYSTEM_PROMPT = `你是一个严格的 AI 输出质量评判员(LLM Judge)。
任务: 根据 criteria 评判 actualOutput 是否达标。
输出格式: JSON { "pass": boolean, "score": integer 0-10, "reason": string }

评分规则(必须严格遵守):
- score 6-10 → pass=true; score 0-5 → pass=false
- pass 与 score 必须一致: score>=6 时 pass=true, score<6 时 pass=false
- reason 必须引用具体 criteria 条款,不能笼统说"很好"
- 每条 criteria 必须明确满足/不满足,才能决定最终分数
- 若 expectedKeyFields 有缺失字段 → 自动 score<=3`;

/**
 * AC-1: Run LLM judge on a golden case
 * AC-6: 内置 retry=1 防 flaky — judge call 失败时重试 1 次
 * AC-9: model_tier='lightweight' (haiku/4o-mini)
 * AC-13: timeout_ms=10000
 */
export async function runJudge(case_: JudgeCase): Promise<JudgeResult> {
  const userPrompt = buildJudgePrompt(case_);

  let lastErr: unknown;
  for (let attempt = 0; attempt <= 1; attempt++) {
    try {
      const response = await llmGateway.complete({
        model_tier: 'lightweight',
        systemPrompt: JUDGE_SYSTEM_PROMPT,
        userPrompt,
        responseFormat: { type: 'json_schema', schema: JudgeResultSchema },
        metadata: {
          trace_id: `judge-${case_.specialistId}-${Date.now()}`,
          agentId: `Judge-${case_.specialistId}`,
          accountId: 0,
          userId: 0,
          eventType: 'judge_call', // AC-5: D-023
        },
        timeout_ms: 10_000, // AC-13: single judge < 10s
        retry: 1,
      });

      const parsed = JudgeResultSchema.safeParse(response.content);
      if (!parsed.success) {
        throw new Error(`Judge returned invalid schema: ${JSON.stringify(response.content)}`);
      }
      return parsed.data;
    } catch (err) {
      lastErr = err;
      // attempt=0 → retry; attempt=1 → fall through to throw
    }
  }
  throw lastErr;
}

function buildJudgePrompt(case_: JudgeCase): string {
  const modeStr = case_.mode ? ` (mode: ${case_.mode})` : '';
  const criteriaStr = case_.criteria.map((c, i) => `  ${i + 1}. ${c}`).join('\n');
  return `Specialist: ${case_.specialistId}${modeStr}
Expected Key Fields: ${case_.expectedKeyFields.join(', ')}

Input:
${JSON.stringify(case_.input, null, 2)}

Actual Output:
${JSON.stringify(case_.actualOutput, null, 2)}

Evaluation Criteria (ALL must be satisfied for pass=true):
${criteriaStr}

请逐条评判,输出 JSON { pass, score, reason }。`;
}
