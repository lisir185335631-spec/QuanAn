/**
 * QuanAn · PRD-9+ (留 PRR)
 * PrivateDomainAgent — /private-domain 私域运营文案
 * 本期骨架 · 真实 LLM 接入留 PRD-9
 */

import { z } from 'zod';

import { BaseSpecialist } from './base/BaseSpecialist';

import type { AssembledContext, ILLMGateway, InvokeLLMResult, SpecialistConfig, SpecialistRequest } from './base/types';

// ── I/O ──────────────────────────────────────────────────────────────────────

export const privateDomainInput = z.object({
  stage: z.enum(['welcome', 'icebreak', 'trust', 'discover', 'close', 'follow']),
  product: z.string().min(1).max(200),
  targetUser: z.string().min(1).max(200),
  scenario: z.string().max(300).optional(),
});

export const privateDomainOutput = z.object({
  stage: z.string(),
  scripts: z.array(
    z.object({
      title: z.string(),
      content: z.string(),
    }),
  ),
});

type PrivateDomainInput = z.infer<typeof privateDomainInput>;
type PrivateDomainOutput = z.infer<typeof privateDomainOutput>;

// ── Config ────────────────────────────────────────────────────────────────────

const PRIVATE_DOMAIN_CONFIG: SpecialistConfig = {
  agentId: 'PrivateDomainAgent',
  persona: {
    role: 'PrivateDomainAgent',
    goal: '生成针对私域运营场景的对话脚本',
    boundaries: ['仅生成站内跳转脚本 · 不涉及外链'],
  },
  memory: { l1_readonly: ['account'], l2_read: ['stepData'], l2_write: [] },
  knowledge: { constants: [], rag: [], refresh_interval_sec: 86400 },
  tools: [],
  execution: { timeout_ms: 60_000, retry: 1, model_tier: 'reasoning', streaming: false },
};

// ── PrivateDomainAgent ────────────────────────────────────────────────────────

export class PrivateDomainAgent extends BaseSpecialist<PrivateDomainInput, PrivateDomainOutput> {
  readonly config = PRIVATE_DOMAIN_CONFIG;
  readonly inputSchema = privateDomainInput;
  readonly outputSchema = privateDomainOutput;

  constructor(gateway?: ILLMGateway) {
    super(gateway);
  }

  protected async invokeLLM(
    _ctx: AssembledContext,
    req: SpecialistRequest<PrivateDomainInput>,
  ): Promise<InvokeLLMResult> {
    // 留 PRD-9 · 当前路由 privateDomain.ts 直接调 LLM · 此 Specialist 骨架为 AC-14 计数用
    return this.llmGateway.complete({
      model_tier: this.config.execution.model_tier,
      systemPrompt: _ctx.systemPrompt,
      userPrompt: `生成 ${req.userInput.stage} 阶段私域脚本`,
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

export const privateDomainAgent = new PrivateDomainAgent();
