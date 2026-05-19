/**
 * QuanAn · PRD-9+ (留 PRR)
 * DiagnosisAgent — /diagnosis IP 账号诊断
 * 本期骨架 · 真实 LLM 接入留 PRD-9
 */

import { z } from 'zod';

import { BaseSpecialist } from './base/BaseSpecialist';

import type { AssembledContext, ILLMGateway, InvokeLLMResult, SpecialistConfig, SpecialistRequest } from './base/types';

// ── I/O ──────────────────────────────────────────────────────────────────────

export const diagnosisInput = z.object({
  answers: z.array(
    z.object({
      dimension: z.string().min(1).max(64),
      score: z.number().int().min(0).max(10),
      comment: z.string().max(200).optional(),
    }),
  ).length(8),
});

const dimensionResultSchema = z.object({
  score: z.number().int().min(0).max(10),
  issues: z.array(z.string()),
  suggestions: z.array(z.string()),
});

export const diagnosisOutput = z.object({
  dimensions: z.record(z.string(), dimensionResultSchema),
  overallScore: z.number().min(0).max(100),
  priority: z.array(z.string()),
});

type DiagnosisInput = z.infer<typeof diagnosisInput>;
type DiagnosisOutput = z.infer<typeof diagnosisOutput>;

// ── Config ────────────────────────────────────────────────────────────────────

const DIAGNOSIS_CONFIG: SpecialistConfig = {
  agentId: 'DiagnosisAgent',
  persona: {
    role: 'DiagnosisAgent',
    goal: '根据 8 维度问卷生成 IP 账号诊断报告',
    boundaries: ['只分析传入的 8 维度答案 · 不做扩展推断'],
  },
  memory: { l1_readonly: ['account'], l2_read: ['stepData'], l2_write: [] },
  knowledge: { constants: [], rag: [], refresh_interval_sec: 86400 },
  tools: [],
  execution: { timeout_ms: 60_000, retry: 1, model_tier: 'reasoning', streaming: false },
};

// ── DiagnosisAgent ────────────────────────────────────────────────────────────

export class DiagnosisAgent extends BaseSpecialist<DiagnosisInput, DiagnosisOutput> {
  readonly config = DIAGNOSIS_CONFIG;
  readonly inputSchema = diagnosisInput;
  readonly outputSchema = diagnosisOutput;

  constructor(gateway?: ILLMGateway) {
    super(gateway);
  }

  protected async invokeLLM(
    _ctx: AssembledContext,
    req: SpecialistRequest<DiagnosisInput>,
  ): Promise<InvokeLLMResult> {
    // 留 PRD-9 · 当前路由 diagnosis.ts 直接写 DB · 此 Specialist 骨架为 AC-14 计数用
    return this.llmGateway.complete({
      model_tier: this.config.execution.model_tier,
      systemPrompt: _ctx.systemPrompt,
      userPrompt: `分析 ${req.userInput.answers.length} 维度诊断问卷`,
      metadata: {
        trace_id: req.traceId ?? '',
        agentId: this.config.agentId,
        accountId: req.accountId,
        userId: 0,
        eventType: 'specialist_call',
      },
      timeout_ms: this.config.execution.timeout_ms,
    });
  }
}

export const diagnosisAgent = new DiagnosisAgent();
