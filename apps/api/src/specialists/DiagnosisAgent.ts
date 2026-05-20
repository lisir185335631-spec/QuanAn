/**
 * QuanAn · PRD-25 US-001
 * DiagnosisAgent — /diagnosis IP 账号诊断 · 真 LLM 7 维度评分
 * AC-1: invokeLLM 完整实施 · system prompt 中文专业 IP 顾问 ≥ 800 字符 · 含 7 维度定义
 * AC-2: outputSchema 严守 · 7 维度 Record<string, {score, issues, suggestions}> + overallScore + priority
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

// Base schema for responseFormat (without strict numeric constraints — avoids JSON schema issues)
const diagnosisBaseSchema = z.object({
  dimensions: z.record(z.string(), z.object({
    score: z.number(),
    issues: z.array(z.string()),
    suggestions: z.array(z.string()),
  })),
  overallScore: z.number(),
  priority: z.array(z.string()),
});

type DiagnosisInput = z.infer<typeof diagnosisInput>;
export type DiagnosisOutput = z.infer<typeof diagnosisOutput>;

// ── Config ────────────────────────────────────────────────────────────────────

const DIAGNOSIS_CONFIG: SpecialistConfig = {
  agentId: 'DiagnosisAgent',
  persona: {
    role: 'DiagnosisAgent',
    goal: '根据 8 维度问卷生成 IP 账号诊断报告 · 7 维度评分 + 优先改进项',
    boundaries: ['只分析传入的 8 维度答案 · 不做扩展推断', '不承诺具体的粉丝增长数字'],
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

  // US-015 AC-2: fallback template — 7 维度规则评分 isFallback=true 路径
  static override readonly fallbackTemplate = {
    default: {
      dimensions: {
        positioning: { score: 5, issues: ['系统繁忙，暂无法完成深度分析'], suggestions: ['请稍后重试以获取 AI 精准诊断建议'] },
        branding:    { score: 5, issues: ['系统繁忙，暂无法完成深度分析'], suggestions: ['请稍后重试以获取 AI 精准诊断建议'] },
        traffic:     { score: 5, issues: ['系统繁忙，暂无法完成深度分析'], suggestions: ['请稍后重试以获取 AI 精准诊断建议'] },
        value:       { score: 5, issues: ['系统繁忙，暂无法完成深度分析'], suggestions: ['请稍后重试以获取 AI 精准诊断建议'] },
        case:        { score: 5, issues: ['系统繁忙，暂无法完成深度分析'], suggestions: ['请稍后重试以获取 AI 精准诊断建议'] },
        persona:     { score: 5, issues: ['系统繁忙，暂无法完成深度分析'], suggestions: ['请稍后重试以获取 AI 精准诊断建议'] },
        authentic:   { score: 5, issues: ['系统繁忙，暂无法完成深度分析'], suggestions: ['请稍后重试以获取 AI 精准诊断建议'] },
      },
      overallScore: 50,
      priority: ['完善账号基础信息', '建立内容发布节奏', '优化账号主页包装'],
    } satisfies DiagnosisOutput,
  };

  constructor(gateway?: ILLMGateway) {
    super(gateway);
  }

  // AC-1: invokeLLM 完整实施
  protected async invokeLLM(
    ctx: AssembledContext,
    req: SpecialistRequest<DiagnosisInput>,
  ): Promise<InvokeLLMResult> {
    const userPrompt = this._buildUserPrompt(req.userInput);

    return this.llmGateway.complete({
      model_tier: this.config.execution.model_tier,
      systemPrompt: ctx.systemPrompt,
      userPrompt,
      responseFormat: { type: 'json_schema' as const, schema: diagnosisBaseSchema },
      metadata: {
        trace_id: req.traceId ?? '',
        agentId: this.config.agentId,
        accountId: req.accountId,
        userId: 0,
        eventType: 'specialist_call',
      },
      timeout_ms: this.config.execution.timeout_ms,
      retry: this.config.execution.retry,
    });
  }

  private _buildUserPrompt(userInput: DiagnosisInput): string {
    const { answers } = userInput;
    return [
      '[诊断任务]',
      '以下是用户完成 8 步问卷后的自评数据，请根据这些数据生成 7 维度 IP 账号诊断报告：',
      '',
      '用户自评数据（JSON）：',
      JSON.stringify({ answers }, null, 2),
      '',
      '⚠️ 严格约束：',
      '- 必须为以下 7 个维度分别评分：positioning / branding / traffic / value / case / persona / authentic',
      '- 每个维度的 score 必须是 0-10 的整数',
      '- 每个维度必须提供 issues 列表（2-4 条具体问题）和 suggestions 列表（2-4 条具体可执行建议）',
      '- overallScore 是 0-100 的整数，综合评估整体账号健康度',
      '- priority 数组按重要性排列，列出最需要优先改进的 3-5 项',
      '- 输出必须是合法的 JSON 格式，键名必须严格匹配上述 7 个维度英文 key',
    ].join('\n');
  }
}

export const diagnosisAgent = new DiagnosisAgent();
