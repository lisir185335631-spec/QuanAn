/**
 * QuanAn · PRD-8 US-007
 * DailyTaskAgent — 真实 LLM 接入 (L5 · 每日任务大脑)
 *
 * AC-1: execute() 真接 LLMGateway.complete(model_tier='lightweight') · timeout 30s
 * AC-2: 冷启动判定 · stepData progress=0 OR EvolutionProfile null → 5 模板 tasks
 *       isFallback=false · modelUsed='cold-start-template'
 * AC-10: cost_log eventType='l5_agent' (via gateway metadata)
 */

import { randomUUID } from 'node:crypto';

import { DailyTaskOutputSchema } from '@quanan/schemas/specialist-io';
import { z } from 'zod';

import { generateSpecialistTraceId } from '@/agents/base/types';
import type { SpecialistId } from '@/agents/base/types';
import { SYSTEM_USER_ID } from '@/lib/constants/system';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { contextAssembler } from '@/services/context-assembler/ContextAssembler';
import { BaseSpecialist } from '@/specialists/base/BaseSpecialist';
import { LLMTimeoutError, SchemaValidationError } from '@/specialists/base/errors';
import { runWithBudget, checkBudget, addCost, estimateCostUsd } from '@/lib/security/cost-budget-guard';
import type {
  AssembledContext,
  ILLMGateway,
  InvokeLLMResult,
  SpecialistConfig,
  SpecialistRequest,
  SpecialistResponse,
} from '@/specialists/base/types';

import type { DailyTaskOutput } from '@quanan/schemas/specialist-io';
import type { ZodType } from 'zod';

export type { DailyTaskOutput };
export { DailyTaskOutputSchema };

// ── Input schema ─────────────────────────────────────────────────────────────

const dailyTaskAgentInputSchema = z.object({
  accountId: z.number().int().positive(),
  taskDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'taskDate must be YYYY-MM-DD'),
});

export type DailyTaskAgentInput = z.infer<typeof dailyTaskAgentInputSchema>;

// ── Specialist config ─────────────────────────────────────────────────────────

const DAILY_TASK_CONFIG: SpecialistConfig = {
  agentId: 'DailyTaskAgent',
  persona: {
    role: 'IP 教练',
    goal: '每天给用户安排 3-5 个具体任务 · 让用户每天都有今天该做什么的明确清单 · 不再迷茫',
    boundaries: [
      '不重复昨天 / 前天的任务',
      '不出先休息一下等无价值任务',
      '不强制要求用户用完特定功能',
      '不超过 5 个任务',
      '任务必带明确 ctaUrl 跳转(站内路径 · 以 / 开头)',
      'estimatedMinutes 真实',
      '难度递进 · 不全 hard 也不全 easy',
    ],
  },
  memory: {
    l1_readonly: ['account', 'currentStep'],
    l2_read: ['stepData', 'evolution'],
    l2_write: [],
  },
  knowledge: {
    constants: [],
    rag: [],
    refresh_interval_sec: 86400,
  },
  tools: [],
  execution: {
    timeout_ms: 30_000, // AC-1: 30s
    retry: 1,
    model_tier: 'lightweight', // AC-1
    streaming: false,
  },
};

// ── AC-2: 冷启动 5 个模板 onboarding tasks ────────────────────────────────────

export function buildColdStartTasks(): DailyTaskOutput['tasks'] {
  return [
    {
      id: randomUUID(),
      title: '完成 IP 基础信息填写',
      description: '填写你的 IP 定位、目标受众、行业等基础信息，让系统了解你的方向，后续任务更精准',
      type: 'review_diagnosis',
      ctaUrl: '/step/1',
      ctaText: '去填写',
      expectedOutcome: '系统掌握你的基础 IP 定位，后续推荐更精准',
      estimatedMinutes: 10,
      difficulty: 'easy',
      completed: false,
    },
    {
      id: randomUUID(),
      title: '完成 IP 诊断问卷',
      description: '回答 10 个问题，系统为你生成专属 IP 诊断报告，识别你的核心优势和提升方向',
      type: 'review_diagnosis',
      ctaUrl: '/step/2',
      ctaText: '开始诊断',
      expectedOutcome: '获得完整 IP 诊断报告，明确下一步方向',
      estimatedMinutes: 15,
      difficulty: 'easy',
      completed: false,
    },
    {
      id: randomUUID(),
      title: '生成第一篇内容选题',
      description: '基于你的 IP 定位，让 AI 帮你生成 5 个高质量选题，选一个最感兴趣的开始创作',
      type: 'do_step',
      ctaUrl: '/step/4',
      ctaText: '生成选题',
      expectedOutcome: '得到 5 个契合 IP 定位的内容选题',
      estimatedMinutes: 20,
      difficulty: 'medium',
      completed: false,
    },
    {
      id: randomUUID(),
      title: '了解 IP 起号方法论',
      description: '花 15 分钟学习平台核心方法论，理解爆款内容的底层逻辑，避免走弯路',
      type: 'learn_methodology',
      ctaUrl: '/knowledge',
      ctaText: '去学习',
      expectedOutcome: '掌握平台核心方法论框架',
      estimatedMinutes: 15,
      difficulty: 'easy',
      completed: false,
    },
    {
      id: randomUUID(),
      title: '上传一个你的成功内容样本',
      description: '把你过去表现最好的一条内容上传，系统学习你的风格，未来生成的内容更贴合你',
      type: 'upload_sample',
      ctaUrl: '/deep-learning',
      ctaText: '上传样本',
      expectedOutcome: '系统学习你的内容风格，提升生成质量',
      estimatedMinutes: 5,
      difficulty: 'easy',
      completed: false,
    },
  ];
}

// ── DailyTaskAgent ────────────────────────────────────────────────────────────

export class DailyTaskAgent extends BaseSpecialist<DailyTaskAgentInput, DailyTaskOutput> {
  readonly config = DAILY_TASK_CONFIG;
  readonly inputSchema = dailyTaskAgentInputSchema;
  // ZodDefault makes completed optional in _input_ but required in _output_ — cast to align with TOut
  readonly outputSchema = DailyTaskOutputSchema as unknown as ZodType<DailyTaskOutput>;

  constructor(gateway?: ILLMGateway) {
    super(gateway);
  }

  /**
   * AC-1/AC-2: 覆写 BaseSpecialist.execute()
   * 1. 冷启动判定 (stepData=0 OR evolutionProfile=null) → 5 模板 tasks (no LLM, no budget scope)
   * 2. 非冷启动 → LLMGateway.complete(lightweight, 30s, eventType='l5_agent')
   * F-1 fix: non-cold-start path wrapped in runWithBudget; LLM calls have checkBudget + addCost;
   *          final output passed through _applyOutputGuardrail (inherited from BaseSpecialist).
   */
  override async execute(
    req: SpecialistRequest<DailyTaskAgentInput>,
  ): Promise<SpecialistResponse<DailyTaskOutput>> {
    const traceId =
      req.traceId ??
      generateSpecialistTraceId(req.accountId, this.config.agentId as SpecialistId);
    const startedAt = Date.now();

    // Step 1: 入参校验
    this.inputSchema.parse(req.userInput);

    // Step 2: AC-2 冷启动判定 (stepData count=0 OR evolutionProfile null)
    const [stepCount, evolutionProfile] = await Promise.all([
      prisma.stepData.count({ where: { accountId: req.accountId } }),
      prisma.evolutionProfile.findUnique({
        where: { accountId: req.accountId },
        select: { id: true },
      }),
    ]);

    const isColdStart = stepCount === 0 || evolutionProfile === null;

    if (isColdStart) {
      // AC-2: cold start → template tasks · no LLM call · no budget scope needed
      logger.info({ accountId: req.accountId, traceId }, 'daily_task.cold_start');
      const tasks = buildColdStartTasks();
      return {
        result: { tasks },
        isFallback: false, // AC-2: 冷启动不是 fallback
        durationMs: Date.now() - startedAt,
        tokensUsed: { prompt: 0, completion: 0, total: 0 },
        modelUsed: 'cold-start-template', // AC-2
        traceId,
      };
    }

    // F-1: LLM path — wrap in runWithBudget so checkBudget/addCost share budget scope
    return runWithBudget(async () => {
      // Step 3: ContextAssembler
      const ctx = (await contextAssembler.assemble({
        agentId: this.config.agentId as SpecialistId,
        accountId: req.accountId,
        mode: req.mode,
        userInput: req.userInput,
        needRag: this.config.knowledge.rag,
      })) as AssembledContext;

      // F-1: conservative pre-call budget estimate
      const CONSERVATIVE_MODEL = 'claude-sonnet-4-6';
      const CONSERVATIVE_COMPLETION = 4096;
      checkBudget(estimateCostUsd(CONSERVATIVE_MODEL, ctx.metadata?.contextTokens ?? 2000, CONSERVATIVE_COMPLETION));

      // Step 4: invokeLLM (AC-1: lightweight · 30s · AC-10: l5_agent)
      let raw: InvokeLLMResult;
      try {
        raw = await this.invokeLLM(ctx, { ...req, traceId });
        // F-1: record actual cost
        addCost(estimateCostUsd(raw.model, raw.tokens.prompt, raw.tokens.completion));
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          throw new LLMTimeoutError(this.config.agentId, this.config.execution.timeout_ms);
        }
        throw err;
      }

      // Step 5: schema 校验 + retry 1 次
      let parsed = this.outputSchema.safeParse(raw.content);
      if (!parsed.success) {
        logger.warn(
          { agentId: this.config.agentId, traceId, issues: parsed.error.message },
          'daily_task.schema_validation.retry',
        );
        // F-1: budget check before retry
        checkBudget(estimateCostUsd(CONSERVATIVE_MODEL, ctx.metadata?.contextTokens ?? 2000, CONSERVATIVE_COMPLETION));
        try {
          raw = await this.invokeLLM(ctx, { ...req, traceId });
          addCost(estimateCostUsd(raw.model, raw.tokens.prompt, raw.tokens.completion));
        } catch (retryErr) {
          if (retryErr instanceof Error && retryErr.name === 'AbortError') {
            throw new LLMTimeoutError(this.config.agentId, this.config.execution.timeout_ms);
          }
          throw retryErr;
        }
        parsed = this.outputSchema.safeParse(raw.content);
        if (!parsed.success) {
          throw new SchemaValidationError(parsed.error, raw.content);
        }
      }

      const durationMs = Date.now() - startedAt;

      // F-1: apply output guardrail (PII + over-promise scan on task text fields)
      const guardedData = this._applyOutputGuardrail(parsed.data, traceId);

      return {
        result: guardedData,
        isFallback: false,
        durationMs,
        tokensUsed: raw.tokens,
        modelUsed: raw.model,
        traceId,
      };
    }); // end runWithBudget
  }

  /**
   * AC-1/AC-10: invokeLLM — lightweight tier · 30s timeout · eventType='l5_agent'
   */
  protected async invokeLLM(
    ctx: AssembledContext,
    req: SpecialistRequest<DailyTaskAgentInput>,
  ): Promise<InvokeLLMResult> {
    const userPrompt = this._buildUserPrompt(req.userInput);

    const result = await this.llmGateway.complete({
      model_tier: this.config.execution.model_tier,
      systemPrompt: ctx.systemPrompt,
      userPrompt,
      responseFormat: { type: 'json_schema', schema: this.outputSchema },
      metadata: {
        trace_id: req.traceId ?? '',
        agentId: this.config.agentId,
        accountId: req.accountId,
        userId: SYSTEM_USER_ID, // worker 上下文 · 无用户 session
        eventType: 'l5_agent', // AC-10: D-040 cost_log 第 4 类
      },
      timeout_ms: this.config.execution.timeout_ms, // AC-1: 30s
    });

    return {
      content: result.content,
      tokens: result.tokens,
      model: result.model,
    };
  }

  private _buildUserPrompt(input: DailyTaskAgentInput): string {
    return [
      `<task_date>${input.taskDate}</task_date>`,
      `<account_id>${input.accountId}</account_id>`,
      '请根据用户的当前 IP 进化状态和历史步骤数据，为今日安排 3-5 个具体任务。',
      '任务必须有明确的 ctaUrl(以 / 开头的站内路径)、estimatedMinutes 和 difficulty。',
      '不要重复昨天已安排的任务类型。',
    ].join('\n\n');
  }
}

export const dailyTaskAgent = new DailyTaskAgent();
