/**
 * QuanQn · PRD-8 US-002
 * DailyTaskAgent — 骨架 (L5 · 每日任务生成)
 *
 * AC-2: agentId='DailyTaskAgent' · outputSchema=DailyTaskOutputSchema · model_tier='lightweight' · timeout_ms=30000
 * AC-8: import type + export type re-export from @quanqn/schemas/specialist-io
 * execute(): throw 'PRD-8 US-007 真接' (真实实现留 US-007)
 *
 * 任务类型(SoT: dailyTask.schema.ts TaskTypeEnum · 7 大类 · AC-9 SoT 验证 4):
 * - do_step: 推进 9 步主线未完成步骤
 * - optimize_content: 优化已有内容质量
 * - learn_methodology: 学习 IP 方法论
 * - review_diagnosis: 复盘诊断报告
 * - upload_sample: 上传深度学习样本
 * - set_goal: 设定阶段目标
 * - engage_community: 互动运营
 */

import { DailyTaskOutputSchema } from '@quanqn/schemas/specialist-io';
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

// AC-8: type re-export for downstream consumers
export type { DailyTaskOutput, TaskItem, TaskType } from '@quanqn/schemas/specialist-io';
export { DailyTaskOutputSchema };

// ── Input schema (placeholder · 真实 schema PRD-8 US-007 补充) ───────────────

const dailyTaskAgentInput = z.object({
  accountId: z.number().int().positive(),
});

type DailyTaskAgentInput = z.infer<typeof dailyTaskAgentInput>;
type DailyTaskOutput = z.infer<typeof DailyTaskOutputSchema>;

// ── SpecialistConfig ─────────────────────────────────────────────────────────

const DAILY_TASK_CONFIG: SpecialistConfig = {
  agentId: 'DailyTaskAgent',
  persona: {
    role: 'DailyTaskAgent',
    goal: '每天给用户安排 3-5 个具体任务 · 让用户每天都有"今天该做什么"的明确清单',
    boundaries: [
      '不重复昨天 / 前天的任务(从历史拉去重)',
      '不出"先休息一下"等无价值任务',
      '不超过 5 个任务',
      '任务必带明确 ctaUrl 跳转',
      'estimatedMinutes 真实',
    ],
  },
  memory: {
    l1_readonly: ['account'],
    l2_read: ['step_data', 'daily_task', 'evolution_insight'],
    l2_write: ['daily_task'],
  },
  knowledge: {
    constants: [],
    rag: [],
    refresh_interval_sec: 86400,
  },
  tools: [],
  execution: {
    timeout_ms: 30_000,
    retry: 1,
    model_tier: 'lightweight',
    streaming: false,
  },
};

// ── DailyTaskAgent ────────────────────────────────────────────────────────────

export class DailyTaskAgent extends BaseSpecialist<DailyTaskAgentInput, DailyTaskOutput> {
  readonly config = DAILY_TASK_CONFIG;
  readonly inputSchema = dailyTaskAgentInput;
  // Cast needed: ZodDefault on `completed` makes _input ≠ _output · output type is correct
  readonly outputSchema = DailyTaskOutputSchema as unknown as z.ZodType<DailyTaskOutput>;

  constructor(gateway?: ILLMGateway) {
    super(gateway);
  }

  /** PRD-8 US-007 真接 · 本期仅骨架 */
  override execute(
    _req: SpecialistRequest<DailyTaskAgentInput>,
  ): Promise<SpecialistResponse<DailyTaskOutput>> {
    return Promise.reject(new Error('PRD-8 US-007 真接'));
  }

  protected invokeLLM(
    _ctx: AssembledContext,
    _req: SpecialistRequest<DailyTaskAgentInput>,
  ): Promise<InvokeLLMResult> {
    return Promise.reject(new Error('PRD-8 US-007 真接'));
  }
}

export const dailyTaskAgent = new DailyTaskAgent();
