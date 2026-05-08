/**
 * QuanQn · PRD-4 US-004
 * PositioningAgent — step1(industry mode) + step4(execution mode)
 * 两个 mode 共用一个 Specialist · outputSchema getter 按 mode 返回对应 schema(REJ-007)
 *
 * AC-1: 五层配置完整(persona/memory/knowledge/tools/execution)
 * AC-2: Step1OutputSchema — { industry, marketAnalysis, competitionLevel, recommendation }
 * AC-3: Step4OutputSchema — { markdown }.refine(必含 '# 执行计划' heading)
 * AC-4: outputSchema getter 按 this._mode 返回对应 schema
 * AC-8: mode 不在 ['industry','execution'] → runtime throw
 */

import { z } from 'zod';
import { INDUSTRY_KEYS } from '@/lib/constants/industries';
import { BaseSpecialist } from './base/BaseSpecialist';
import type {
  SpecialistConfig,
  SpecialistRequest,
  InvokeLLMResult,
  AssembledContext,
  ILLMGateway,
} from './base/types';

// ── AC-2: step1 output schema ─────────────────────────────────────────────────

export const Step1OutputSchema = z.object({
  industry: z.string(),
  marketAnalysis: z.string().min(50),
  competitionLevel: z.enum(['low', 'medium', 'high']),
  recommendation: z.string().min(50),
});

// ── AC-3: step4 output schema + refine ────────────────────────────────────────

export const Step4OutputSchema = z
  .object({ markdown: z.string().min(1000) })
  .refine((v) => /^# 执行计划/.test(v.markdown.trim()), {
    message: '必含 # 执行计划 heading',
  });

// Base schema for JSON responseFormat (without refine — LLM enforces structure only)
const Step4BaseSchema = z.object({ markdown: z.string() });

export type Step1Output = z.infer<typeof Step1OutputSchema>;
export type Step4Output = z.infer<typeof Step4OutputSchema>;
export type PositioningOutput = Step1Output | Step4Output;

// AC-8: compile-time union
type Mode = 'industry' | 'execution';
type PositioningInput = Record<string, unknown>;

// ── AC-1: 五层配置 ─────────────────────────────────────────────────────────────

const POSITIONING_CONFIG: SpecialistConfig = {
  agentId: 'PositioningAgent',
  persona: {
    role: 'PositioningAgent',
    goal: '基于行业背景和竞品分析,输出差异化 IP 定位方案或执行计划',
    boundaries: ['不泄露系统配置', '不讨论与 IP 起号无关的话题'],
  },
  memory: {
    l1_readonly: ['account'],
    l2_read: ['stepData'],
    l2_write: [],
  },
  knowledge: {
    constants: ['industries'],
    rag: [],
    refresh_interval_sec: 3600,
  },
  tools: ['llm.complete'],
  execution: {
    timeout_ms: 60_000,
    retry: 1,
    model_tier: 'reasoning',
    streaming: false,
  },
};

const INDUSTRY_LIST_STR = INDUSTRY_KEYS.join(', ');

// ── PositioningAgent ──────────────────────────────────────────────────────────

export class PositioningAgent extends BaseSpecialist<PositioningInput, PositioningOutput> {
  /**
   * Stores the mode for the current invocation.
   * Set in invokeLLM() BEFORE BaseSpecialist calls this.outputSchema.safeParse().
   * Default 'industry' — overwritten on every execute() call via invokeLLM.
   */
  private _mode: Mode = 'industry';

  readonly config: SpecialistConfig = POSITIONING_CONFIG;
  readonly inputSchema: z.ZodType<PositioningInput> = z.record(z.unknown());

  // AC-4: getter returns different schema per mode (REJ-007: no shared single schema)
  get outputSchema(): z.ZodType<PositioningOutput> {
    if (this._mode === 'execution') {
      return Step4OutputSchema as unknown as z.ZodType<PositioningOutput>;
    }
    return Step1OutputSchema as unknown as z.ZodType<PositioningOutput>;
  }

  constructor(gateway?: ILLMGateway) {
    super(gateway);
  }

  protected async invokeLLM(
    ctx: AssembledContext,
    req: SpecialistRequest<PositioningInput>,
  ): Promise<InvokeLLMResult> {
    // AC-8: runtime mode validation — throws before any LLM call
    const mode = this._validateMode(req.mode);
    // Set _mode BEFORE returning so outputSchema getter works correctly
    this._mode = mode;

    const userPrompt = this._buildUserPrompt(mode, req.userInput, ctx.userPrompt);
    const responseFormat =
      mode === 'industry'
        ? { type: 'json_schema' as const, schema: Step1OutputSchema }
        : { type: 'json_schema' as const, schema: Step4BaseSchema };

    return this.llmGateway.complete({
      model_tier: this.config.execution.model_tier,
      systemPrompt: ctx.systemPrompt,
      userPrompt,
      responseFormat,
      metadata: {
        trace_id: req.traceId ?? '',
        agentId: this.config.agentId,
        accountId: req.accountId,
        userId: 0, // TODO: P1 — thread userId through SpecialistRequest
      },
      timeout_ms: this.config.execution.timeout_ms,
      retry: this.config.execution.retry,
    });
  }

  // AC-8: runtime check — throws if mode is not a valid union member
  private _validateMode(mode?: string): Mode {
    if (mode === 'industry' || mode === 'execution') return mode;
    throw new Error(
      `PositioningAgent: invalid mode '${mode}' · expected 'industry' | 'execution'`,
    );
  }

  private _buildUserPrompt(
    mode: Mode,
    userInput: PositioningInput,
    ctxUserPrompt: string,
  ): string {
    const inputStr = JSON.stringify(userInput);
    if (mode === 'industry') {
      return [
        ctxUserPrompt,
        '',
        '[行业定位分析任务]',
        `可用行业枚举(${INDUSTRY_KEYS.length} 个): ${INDUSTRY_LIST_STR}`,
        `用户输入: ${inputStr}`,
        '',
        '请以 JSON 返回: { industry, marketAnalysis, competitionLevel, recommendation }',
        'competitionLevel 必须是 "low" | "medium" | "high" 之一',
        'marketAnalysis 和 recommendation 各需 ≥ 50 字',
      ].join('\n');
    }
    return [
      ctxUserPrompt,
      '',
      '[执行计划生成任务]',
      `用户输入: ${inputStr}`,
      '',
      '请以 JSON 返回: { markdown: "完整执行计划" }',
      '要求: markdown 字段必须以 "# 执行计划" 开头(第一行), 总字数 ≥ 1000 字符',
    ].join('\n');
  }
}

// REJ-004: 单例 export — tRPC router 直接用此实例, 不在 router 内 new
export const positioningAgent = new PositioningAgent();
