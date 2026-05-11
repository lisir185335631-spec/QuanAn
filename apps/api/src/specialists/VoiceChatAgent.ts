/**
 * QuanQn · PRD-8 US-002
 * VoiceChatAgent — 骨架 (L5 · 多轮语音对话)
 *
 * AC-3: agentId='VoiceChatAgent' · model_tier='reasoning' · tools=['llm.stream','llm.tools']
 * AC-3: execute() throw 'PRD-8 US-011 真接'
 * AC-3: export VOICE_CHAT_TOOLS (5 工具 per §1.0.4 · canonical source 在本文件)
 * AC-8: import type + export type re-export from @quanqn/schemas/specialist-io
 * AC-9 SoT 验 3: 5 工具 name(get_current_step|search_history|query_diagnosis|get_today_tasks|get_evolution_insights)
 */

import { VoiceChatBufferSchema } from '@quanqn/schemas/specialist-io';
import { z } from 'zod';

import { BaseSpecialist } from './base/BaseSpecialist';

import type {
  AssembledContext,
  ILLMGateway,
  InvokeLLMResult,
  SpecialistConfig,
  SpecialistRequest,
  SpecialistResponse,
} from './base/types';

// AC-8: type re-export
export type { VoiceChatBuffer, VoiceChatTurn, VoiceChatRole } from '@quanqn/schemas/specialist-io';
export { VoiceChatBufferSchema };

// ── AC-3: VOICE_CHAT_TOOLS — 5 工具 (§1.0.4 canonical) ──────────────────────
// SoT: PRD-8 §1.0.4 · 下游 US-011 router 必须从本文件 import(不直接用 @quanqn/schemas)

export const VOICE_CHAT_TOOLS = [
  {
    name: 'get_current_step' as const,
    description: '查询当前 IP 账号 9 步主线的完成进度',
    parameters: { type: 'object' as const, properties: {}, required: [] as string[] },
  },
  {
    name: 'search_history' as const,
    description: '在用户的历史生成内容中搜索 · 按关键词模糊匹配',
    parameters: {
      type: 'object' as const,
      properties: {
        keyword: { type: 'string', description: '搜索关键词' },
        limit: { type: 'number', default: 5 },
      },
      required: ['keyword'] as string[],
    },
  },
  {
    name: 'query_diagnosis' as const,
    description: '查最新诊断报告(8 维度短板)',
    parameters: { type: 'object' as const, properties: {}, required: [] as string[] },
  },
  {
    name: 'get_today_tasks' as const,
    description: '查今日 3-5 个推荐任务',
    parameters: { type: 'object' as const, properties: {}, required: [] as string[] },
  },
  {
    name: 'get_evolution_insights' as const,
    description: '查当前 EvolutionProfile + 最新 insight',
    parameters: { type: 'object' as const, properties: {}, required: [] as string[] },
  },
] as const;

export type VoiceChatToolName = (typeof VOICE_CHAT_TOOLS)[number]['name'];

// ── Input schema (placeholder · 真实 schema PRD-8 US-011 补充) ───────────────

const voiceChatAgentInput = z.object({
  userMessage: z.string(),
});

type VoiceChatAgentInput = z.infer<typeof voiceChatAgentInput>;
type VoiceChatOutput = z.infer<typeof VoiceChatBufferSchema>;

// ── SpecialistConfig ─────────────────────────────────────────────────────────

const VOICE_CHAT_CONFIG: SpecialistConfig = {
  agentId: 'VoiceChatAgent',
  persona: {
    role: 'VoiceChatAgent',
    goal: '跟用户语音对话 · 帮他理清思路 / 查数据 / 给建议',
    boundaries: [
      '不假装是真人(主动 self-disclose AI 身份)',
      '不在没用户授权时调工具',
      '每轮 ≤ 80 字 · 让用户主动说下一句',
      '短句 + 口语化(目标是"听"不是"读")',
    ],
  },
  memory: {
    l1_readonly: ['voice_chat_buffer'],
    l2_read: ['step_data', 'diagnosis', 'daily_task', 'evolution_insight'],
    l2_write: ['voice_chat_buffer'],
  },
  knowledge: {
    constants: [],
    rag: ['history'],
    refresh_interval_sec: 1800,
  },
  tools: ['llm.stream', 'llm.tools'],
  execution: {
    timeout_ms: 30_000,
    retry: 0,
    model_tier: 'reasoning',
    streaming: true,
  },
};

// ── VoiceChatAgent ────────────────────────────────────────────────────────────

export class VoiceChatAgent extends BaseSpecialist<VoiceChatAgentInput, VoiceChatOutput> {
  readonly config = VOICE_CHAT_CONFIG;
  readonly inputSchema = voiceChatAgentInput;
  readonly outputSchema = VoiceChatBufferSchema;

  constructor(gateway?: ILLMGateway) {
    super(gateway);
  }

  /** PRD-8 US-011 真接 · 本期仅骨架 */
  override execute(
    _req: SpecialistRequest<VoiceChatAgentInput>,
  ): Promise<SpecialistResponse<VoiceChatOutput>> {
    return Promise.reject(new Error('PRD-8 US-011 真接'));
  }

  protected invokeLLM(
    _ctx: AssembledContext,
    _req: SpecialistRequest<VoiceChatAgentInput>,
  ): Promise<InvokeLLMResult> {
    return Promise.reject(new Error('PRD-8 US-011 真接'));
  }
}

export const voiceChatAgent = new VoiceChatAgent();
