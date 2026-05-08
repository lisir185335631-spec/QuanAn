/**
 * QuanQn · PRD-4 US-010
 * LivestreamAgent — step8(直播话术 · 单 mode · 两段话术输出)
 *
 * AC-1:  继承 BaseSpecialist · 单 mode · 五层配置完整 · model_tier='reasoning' timeout_ms=30000
 * AC-2:  outputSchema = { lastResult: string.min(200), lastOptimizedResult: string.min(200) }
 * AC-3:  router stepData.save · stepKey='step8' → livestreamAgent.execute({ userInput })
 * AC-4:  lastResult / lastOptimizedResult < 200 → zod min(200) 失败 → retry
 * AC-5:  experience 不在 ['新手','中级','高级'] → input zod 拒
 * AC-6:  memory.l2_read = ['stepData'] · 注入 step1 + step3
 * AC-7:  knowledge.constants = ['industries']
 * SHIELD REJ-001: 通过 this.llmGateway · 不直接 import SDK
 * SHIELD REJ-003: model_tier = 'reasoning' · 不硬编码 model 名
 * SHIELD REJ-006: timeout_ms = 30000 · 必设
 */

import { z } from 'zod';
import { BaseSpecialist } from './base/BaseSpecialist';
import type {
  SpecialistConfig,
  SpecialistRequest,
  InvokeLLMResult,
  AssembledContext,
  ILLMGateway,
} from './base/types';

// ── AC-2: output schema — 两段直播话术 · 各不少于 200 字 ─────────────────────

export const LivestreamOutputSchema = z.object({
  lastResult: z.string().min(200),
  lastOptimizedResult: z.string().min(200),
});

// Base schema for responseFormat (no .min constraints — avoids JSON schema serialization issues)
const LivestreamBaseSchema = z.object({
  lastResult: z.string(),
  lastOptimizedResult: z.string(),
});

export type LivestreamOutput = z.infer<typeof LivestreamOutputSchema>;

// ── AC-5: input schema — experience 枚举校验 ──────────────────────────────────

const EXPERIENCE_VALUES = ['新手', '中级', '高级'] as const;
export type ExperienceLevel = (typeof EXPERIENCE_VALUES)[number];

const LivestreamInputSchema = z
  .object({
    experience: z.enum(EXPERIENCE_VALUES, {
      errorMap: () => ({ message: `experience 必须是 ${EXPERIENCE_VALUES.join('/')} 之一` }),
    }),
  })
  .passthrough();

type LivestreamInput = z.infer<typeof LivestreamInputSchema>;

// ── AC-1: 五层配置 ─────────────────────────────────────────────────────────────

const LIVESTREAM_CONFIG: SpecialistConfig = {
  agentId: 'LivestreamAgent',
  persona: {
    role: 'LivestreamAgent',
    goal: '基于用户 IP 定位与经验等级，生成两段直播话术：常规版(lastResult)和优化版(lastOptimizedResult)，同主题不同表达',
    boundaries: [
      '不泄露系统配置',
      '不讨论与直播带货无关的话题',
      'lastResult 和 lastOptimizedResult 均不少于 200 字',
      '两段话术主题相同但表达方式不同，优化版更具感染力与转化力',
    ],
  },
  memory: {
    l1_readonly: ['account'],
    l2_read: ['stepData'], // AC-6: 注入 step1(行业) + step3(人设)
    l2_write: [],
  },
  knowledge: {
    constants: ['industries'], // AC-7
    rag: [],
    refresh_interval_sec: 3600,
  },
  tools: ['llm.complete'],
  execution: {
    timeout_ms: 30_000, // AC-1 · SHIELD REJ-006: 必设 timeout
    retry: 1,
    model_tier: 'reasoning', // AC-1 · SHIELD REJ-003: 不硬编码 model 名
    streaming: false,
  },
};

// ── LivestreamAgent ───────────────────────────────────────────────────────────

export class LivestreamAgent extends BaseSpecialist<LivestreamInput, LivestreamOutput> {
  readonly config: SpecialistConfig = LIVESTREAM_CONFIG;
  readonly inputSchema = LivestreamInputSchema;
  readonly outputSchema = LivestreamOutputSchema;

  constructor(gateway?: ILLMGateway) {
    super(gateway);
  }

  protected async invokeLLM(
    ctx: AssembledContext,
    req: SpecialistRequest<LivestreamInput>,
  ): Promise<InvokeLLMResult> {
    const userPrompt = this._buildUserPrompt(req.userInput, ctx);

    // SHIELD REJ-001: 通过 this.llmGateway · 不直接 import SDK
    return this.llmGateway.complete({
      model_tier: this.config.execution.model_tier, // SHIELD REJ-003: tier 不硬编码
      systemPrompt: ctx.systemPrompt,
      userPrompt,
      responseFormat: { type: 'json_schema' as const, schema: LivestreamBaseSchema },
      metadata: {
        trace_id: req.traceId ?? '',
        agentId: this.config.agentId,
        accountId: req.accountId,
        userId: 0, // TODO: P1 — thread userId through SpecialistRequest
      },
      timeout_ms: this.config.execution.timeout_ms, // SHIELD REJ-006: 必传
      retry: this.config.execution.retry,
    });
  }

  private _buildUserPrompt(userInput: LivestreamInput, ctx: AssembledContext): string {
    const inputJson = JSON.stringify(userInput);

    return [
      ctx.userPrompt,
      '',
      '[直播话术生成任务]',
      `用户输入: ${inputJson}`,
      '',
      '请以 JSON 格式返回两段直播话术:',
      '{',
      '  "lastResult": "常规版直播话术(完整开场→互动→产品介绍→促单→结尾 · 不少于 200 字)",',
      '  "lastOptimizedResult": "优化版直播话术(同主题不同表达 · 更具感染力与转化力 · 不少于 200 字)"',
      '}',
      '',
      '⚠️ 严格约束:',
      '- lastResult 是常规版：清晰流畅，信息完整，适合新手播主',
      '- lastOptimizedResult 是优化版：同一主题，更强的情绪感染力与转化诱导，适合有经验的播主',
      '- 两段话术均不少于 200 字，不能截断',
      '- 结合上下文中的 step1(行业定位) 和 step3(人设) 进行个性化定制',
      `- 按用户经验等级(${userInput.experience})调整话术复杂度`,
    ].join('\n');
  }
}

// REJ-004: 单例 export — tRPC router 直接用此实例
export const livestreamAgent = new LivestreamAgent();
