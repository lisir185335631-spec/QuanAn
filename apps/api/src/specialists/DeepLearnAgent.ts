/**
 * QuanAn · PRD-9+ (留 PRR)
 * DeepLearnAgent — /deep-learning 深度学习样本分析
 * 本期骨架 · 真实 LLM 接入留 PRD-9
 */

import { z } from 'zod';

import { BaseSpecialist } from './base/BaseSpecialist';

import type { AssembledContext, ILLMGateway, InvokeLLMResult, SpecialistConfig, SpecialistRequest } from './base/types';

// ── I/O ──────────────────────────────────────────────────────────────────────

export const deepLearnInput = z.object({
  sample: z.string().min(10).max(5000),
  sampleType: z.enum(['text', 'url']),
});

export const deepLearnOutput = z.object({
  styleVector: z.record(z.string(), z.number()),
  tags: z.array(z.string()).max(10),
  summary: z.string().max(500),
});

type DeepLearnInput = z.infer<typeof deepLearnInput>;
type DeepLearnOutput = z.infer<typeof deepLearnOutput>;

// ── Config ────────────────────────────────────────────────────────────────────

const DEEP_LEARN_CONFIG: SpecialistConfig = {
  agentId: 'DeepLearnAgent',
  persona: {
    role: 'DeepLearnAgent',
    goal: '从内容样本中提炼风格向量、标签、摘要 · 写入用户深度学习库',
    boundaries: ['只分析传入样本 · 不做外部搜索'],
  },
  memory: { l1_readonly: ['account'], l2_read: [], l2_write: ['deep_learning_archive'] },
  knowledge: { constants: [], rag: [], refresh_interval_sec: 86400 },
  tools: [],
  execution: { timeout_ms: 60_000, retry: 1, model_tier: 'lightweight', streaming: false },
};

// ── DeepLearnAgent ────────────────────────────────────────────────────────────

export class DeepLearnAgent extends BaseSpecialist<DeepLearnInput, DeepLearnOutput> {
  readonly config = DEEP_LEARN_CONFIG;
  readonly inputSchema = deepLearnInput;
  readonly outputSchema = deepLearnOutput;

  constructor(gateway?: ILLMGateway) {
    super(gateway);
  }

  protected async invokeLLM(
    _ctx: AssembledContext,
    req: SpecialistRequest<DeepLearnInput>,
  ): Promise<InvokeLLMResult> {
    // 留 PRD-9 · 当前路由 deepLearning.ts 直接写 DB · 此 Specialist 骨架为 AC-14 计数用
    return this.llmGateway.complete({
      model_tier: this.config.execution.model_tier,
      systemPrompt: _ctx.systemPrompt,
      userPrompt: `分析样本: ${req.userInput.sample.slice(0, 100)}...`,
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

export const deepLearnAgent = new DeepLearnAgent();
