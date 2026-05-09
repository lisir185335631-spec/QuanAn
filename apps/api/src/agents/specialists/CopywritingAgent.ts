/**
 * QuanQn · CopywritingAgent ★ 4 mode 完整示例
 * 派生自 PROMPTS.md §5 + ARCHITECTURE.md §4.3 + ADR-003
 *
 * 服务 · /step/7 + /generate + /boom-generate + /acquisition-video
 * mode · 'step7' | 'free' | 'boom' | 'acquisition'
 *
 * ⚠️ 这是 14 Specialist 的"参考示例"· 其他 13 个按此模板填充
 */

import { z } from 'zod';

import { llmGateway } from '@/workers/llm-gateway';

import { BaseSpecialist } from '../base/BaseSpecialist';

import type {
  SpecialistInput,
  SpecialistOutput,
  SpecialistConfig,
  AssembledContext,
} from '../base/types';

// ============== 输入 + 输出 schema ==============

export const CopywritingInputSchema = z.object({
  scriptType: z.string().min(1),                              // 20 脚本之一
  elements: z.array(z.string()).max(5).default([]),           // 22 元素 · max 5
  topic: z.string().min(2).max(200),
  // boom mode 专属
  candidateCount: z.number().int().min(1).max(5).optional(),
  // acquisition mode 专属
  productInfo: z.string().max(500).optional(),
  conversionGoal: z.enum(['wechat', 'comment', 'private_msg']).optional(),
  ctaText: z.string().max(50).optional(),
});
export type CopywritingInput = z.infer<typeof CopywritingInputSchema>;

export const CopywritingResultSchema = z.object({
  result: z.string().min(100),                                // markdown 文案 · boom 用 "---" 分隔 5 篇
  metadata: z
    .object({
      mode: z.enum(['step7', 'free', 'boom', 'acquisition']),
      scriptType: z.string().optional(),
      elements: z.array(z.string()).optional(),
      structureSummary: z.string().optional(),
      estimatedDuration: z.string().optional(),
      candidateCount: z.number().optional(),
    })
    .optional(),
});
export type CopywritingResult = z.infer<typeof CopywritingResultSchema>;

// ============== Specialist 实现 ==============

export class CopywritingAgent extends BaseSpecialist<CopywritingInput, CopywritingResult> {
  readonly id = 'CopywritingAgent' as const;

  readonly config: SpecialistConfig = {
    persona: {
      role: '文案魔法师',
      goal: '按用户的 scriptType + elements + topic 组合 · 输出可直接发的文案 · 符合用户进化档案风格',
      boundaries: [
        '不写"哎呀/让我们/让我帮你"等 AI 味开头',
        '不写"希望对你有帮助"类总结',
        '不重复 evolutionProfile.avoidList 表达',
        '不编造数据 / 真实人物',
        '必须有 hook(5 秒钩子)',
        '必须呼应 account.ipPositioning',
      ],
    },
    memory: {
      l1_readonly: ['account', 'currentStep'],
      l2_read: ['stepData', 'evolution'],
      l2_write: ['history'],
    },
    knowledge: {
      constants: ['scriptTypes', 'hotElements'],
      rag: ['knowledge_cases', 'user_samples'],
      refresh_interval_sec: 600,
    },
    tools: ['llm.stream'],
    execution: {
      timeout_ms: 60_000,
      retry: 1,
      model_tier: 'reasoning',
      streaming: true,
      parallel_group: 'copywriting',
    },
    fallback: {
      on_missing: ['evolution_profile', 'step_data'],
      strategy: 'use_industry_default',
    },
  };

  protected async execute(
    input: SpecialistInput<CopywritingInput>,
    ctx: AssembledContext,
  ): Promise<SpecialistOutput<CopywritingResult>> {
    // 1. 输入校验(zod · 严格)
    const payload = CopywritingInputSchema.parse(input.payload);
    const ModeSchema = z.enum(['step7', 'free', 'boom', 'acquisition']);
    const mode = ModeSchema.parse(input.mode ?? 'free');

    // 2. 调 LLM(单次 · R-3 不允许循环)
    const resp = await llmGateway.complete({
      model_tier: this.config.execution.model_tier,
      systemPrompt: ctx.systemPrompt,
      userPrompt: ctx.userPrompt,
      responseFormat: { type: 'json_schema', schema: CopywritingResultSchema },
      metadata: {
        trace_id: input.trace_id ?? '',
        agentId: this.id,
        accountId: input.accountId,
        userId: input.userId,
      },
      timeout_ms: this.config.execution.timeout_ms,
      retry: this.config.execution.retry,
    });

    // 3. zod 校验输出(LD-013 · R-8)
    const parsed = CopywritingResultSchema.safeParse(resp.content);
    if (!parsed.success) {
      // 重试 1 次 · 仍失败 → fallback 模板
      return this.fallbackResponse(mode, payload, input, '输出 schema 校验失败');
    }

    // 4. 写 history(L3)· P3 阶段填真实 prisma.history.create
    const historyId = 0; // TODO P3

    return {
      success: true,
      result: parsed.data,
      trace_id: input.trace_id ?? '',
      agentId: this.id,
      model: resp.model,
      tokens: resp.tokens,
      durationMs: resp.duration_ms,
      feedbackHook: { rateableContentId: historyId, rateableType: 'history' },
      isFallback: !!resp.fallback,
    };
  }

  private fallbackResponse(
    mode: string,
    _payload: CopywritingInput,
    input: SpecialistInput<CopywritingInput>,
    reason: string,
  ): SpecialistOutput<CopywritingResult> {
    return {
      success: true,
      result: {
        result: '系统繁忙 · 请稍后再试 · 或换一个角度重新生成。',
        metadata: { mode: z.enum(['step7','free','boom','acquisition']).parse(mode) },
      },
      trace_id: input.trace_id ?? '',
      agentId: this.id,
      model: 'fallback-template',
      tokens: { prompt: 0, completion: 0, total: 0 },
      durationMs: 0,
      feedbackHook: { rateableContentId: 0, rateableType: 'history' },
      isFallback: true,
      error: { code: 'fallback', message: reason, retryable: true },
    };
  }
}

export const copywritingAgent = new CopywritingAgent();
