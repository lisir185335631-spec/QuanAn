/**
 * QuanAn · PRD-28 US-005 · Evaluation Pipeline · runSampleEvaluation
 * AC-8: returns {structurePass, judgeScore, judgePass, durationMs, tokensUsed, costUsd}
 * Anti-pattern: must use specialist.execute() chain, NOT direct LLM SDK calls
 */

import { z } from 'zod';

import { evolutionAgent } from '@/agents/evolution/EvolutionAgent';
import { dailyTaskAgent } from '@/agents/specialists/DailyTaskAgent';
import { analysisAgent } from '@/specialists/AnalysisAgent';
import { brandingAgent } from '@/specialists/BrandingAgent';
import { copywritingAgent } from '@/specialists/CopywritingAgent';
import { deepLearnAgent } from '@/specialists/DeepLearnAgent';
import { diagnosisAgent } from '@/specialists/DiagnosisAgent';
import { livestreamAgent } from '@/specialists/LivestreamAgent';
import { monetizationAgent } from '@/specialists/MonetizationAgent';
import { positioningAgent } from '@/specialists/PositioningAgent';
import { presentationAgent } from '@/specialists/PresentationAgent';
import { privateDomainAgent } from '@/specialists/PrivateDomainAgent';
import { topicAgent } from '@/specialists/TopicAgent';
import { videoAgent } from '@/specialists/VideoAgent';
import { SYSTEM_USER_ID } from '@/lib/constants/system';
import { llmGateway } from '@/workers/llm-gateway';

import type { GoldenSample } from '@quanan/schemas';

// ── Specialist registry ───────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SPECIALIST_REGISTRY: Record<string, { execute: (...args: any[]) => Promise<any> }> = {
  AnalysisAgent: analysisAgent,
  BrandingAgent: brandingAgent,
  CopywritingAgent: copywritingAgent,
  DailyTaskAgent: dailyTaskAgent,
  DeepLearnAgent: deepLearnAgent,
  DiagnosisAgent: diagnosisAgent,
  EvolutionAgent: evolutionAgent,
  LivestreamAgent: livestreamAgent,
  MonetizationAgent: monetizationAgent,
  PositioningAgent: positioningAgent,
  PresentationAgent: presentationAgent,
  PrivateDomainAgent: privateDomainAgent,
  TopicAgent: topicAgent,
  VideoAgent: videoAgent,
};

// ── Judge logic (mirrors tests/judge/judge-runner.ts, avoids cross-boundary import) ──

const JudgeResultSchema = z.object({
  pass: z.boolean(),
  score: z.number().int().min(0).max(10),
  reason: z.string().min(1),
});

export const JUDGE_PASS_THRESHOLD = 6;

const JUDGE_SYSTEM_PROMPT = `你是一个严格的 AI 输出质量评判员(LLM Judge)。
任务: 根据 criteria 评判 actualOutput 是否达标。
输出格式: JSON { "pass": boolean, "score": integer 0-10, "reason": string }

评分规则(必须严格遵守):
- score 6-10 → pass=true; score 0-5 → pass=false
- pass 与 score 必须一致: score>=6 时 pass=true, score<6 时 pass=false
- reason 必须引用具体 criteria 条款,不能笼统说"很好"
- 每条 criteria 必须明确满足/不满足,才能决定最终分数
- 若 expectedKeyFields 有缺失字段 → 自动 score<=3`;

function buildJudgePrompt(
  specialistId: string,
  mode: string | undefined,
  input: Record<string, unknown>,
  actualOutput: Record<string, unknown>,
  criteria: string[],
  expectedKeyFields: string[],
): string {
  const modeStr = mode ? ` (mode: ${mode})` : '';
  const criteriaStr = criteria.map((c, i) => `  ${i + 1}. ${c}`).join('\n');
  return `Specialist: ${specialistId}${modeStr}
Expected Key Fields: ${expectedKeyFields.join(', ')}

Input:
${JSON.stringify(input, null, 2)}

Actual Output:
${JSON.stringify(actualOutput, null, 2)}

Evaluation Criteria (ALL must be satisfied for pass=true):
${criteriaStr}

请逐条评判,输出 JSON { pass, score, reason }。`;
}

export interface JudgeResult {
  score: number;
  pass: boolean;
  reason: string;
}

export async function runJudge(
  specialistId: string,
  mode: string | undefined,
  input: Record<string, unknown>,
  actualOutput: Record<string, unknown>,
  criteria: string[],
  expectedKeyFields: string[],
): Promise<JudgeResult> {
  const userPrompt = buildJudgePrompt(specialistId, mode, input, actualOutput, criteria, expectedKeyFields);

  let lastErr: unknown;
  for (let attempt = 0; attempt <= 1; attempt++) {
    try {
      const response = await llmGateway.complete({
        model_tier: 'lightweight',
        systemPrompt: JUDGE_SYSTEM_PROMPT,
        userPrompt,
        responseFormat: { type: 'json_schema', schema: JudgeResultSchema },
        metadata: {
          trace_id: `eval-judge-${specialistId}-${Date.now()}`,
          agentId: `EvalJudge-${specialistId}`,
          accountId: 0,
          userId: SYSTEM_USER_ID,
          eventType: 'judge_call',
        },
        timeout_ms: 15_000,
        retry: 1,
      });

      const parsed = JudgeResultSchema.safeParse(response.content);
      if (!parsed.success) {
        throw new Error(`Judge returned invalid schema: ${JSON.stringify(response.content)}`);
      }
      return parsed.data;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

// ── SampleResult ─────────────────────────────────────────────────────────────

export interface SampleResult {
  structurePass: boolean;
  judgeScore: number;
  judgePass: boolean;
  judgeReason: string;
  durationMs: number;
  tokensUsed: number;
  costUsd: number;
  actualOutput: Record<string, unknown>;
}

// ── SpecialistResponse — shape of specialist.execute() return value ───────────

interface SpecialistResponse {
  result: unknown;
  modelUsed: string;
  tokensUsed: { prompt: number; completion: number; total: number };
  durationMs: number;
}

// ── runSampleEvaluation (AC-8) ────────────────────────────────────────────────

export async function runSampleEvaluation(sample: GoldenSample): Promise<SampleResult> {
  const specialist = SPECIALIST_REGISTRY[sample.specialistId];
  if (!specialist) {
    throw new Error(`Unknown specialist: ${sample.specialistId}`);
  }

  // 1. Call specialist.execute() — respects BaseSpecialist chain (anti-pattern: no direct SDK)
  const response = (await specialist.execute({
    accountId: 0,
    mode: sample.mode,
    userInput: sample.input,
    traceId: `eval-${sample.id}-${Date.now()}`,
  })) as unknown as SpecialistResponse;

  const actualOutput = response.result as Record<string, unknown>;

  // 2. structurePass: check expectedKeyFields are present via zod (AC-8)
  const keyPresenceSchema = z.record(z.unknown()).superRefine((obj, ctx) => {
    for (const field of sample.expectedKeyFields) {
      if (!Object.prototype.hasOwnProperty.call(obj, field)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Missing: ${field}` });
      }
    }
  });
  const structurePass = keyPresenceSchema.safeParse(actualOutput).success;

  // 3. LLM judge (AC-8)
  const judgeResult = await runJudge(
    sample.specialistId,
    sample.mode,
    sample.input,
    actualOutput,
    sample.criteria,
    sample.expectedKeyFields,
  );

  // 4. costUsd from token counts + model pricing (mirrors cost-logger.ts)
  const COST_PER_M: Record<string, { input: number; output: number }> = {
    'claude-sonnet-4-6': { input: 3.0, output: 15.0 },
    'claude-haiku-4-5':  { input: 0.25, output: 1.25 },
    'gpt-4o':            { input: 2.5, output: 10.0 },
    'gpt-4o-mini':       { input: 0.15, output: 0.60 },
  };
  const rates = COST_PER_M[response.modelUsed] ?? { input: 1.0, output: 5.0 };
  const costUsd =
    (response.tokensUsed.prompt * rates.input + response.tokensUsed.completion * rates.output) /
    1_000_000;

  return {
    structurePass,
    judgeScore: judgeResult.score,
    judgePass: judgeResult.score >= JUDGE_PASS_THRESHOLD,
    judgeReason: judgeResult.reason,
    durationMs: response.durationMs,
    tokensUsed: response.tokensUsed.total,
    costUsd,
    actualOutput,
  };
}
