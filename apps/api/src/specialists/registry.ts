/**
 * Specialist Agent 注册表 —— 热插拔核心
 *
 * 之前:`trpc/routers/app/stepData.ts` 的 save 用 8 段 `if (stepKey === ...)` 硬编码分发,
 * 每段还重复 ~15 行把 agent 结果写回 stepData 的样板。新增一个 step agent 要改多处。
 *
 * 现在三件套:
 *   ① SPECIALISTS          —— 全部 specialist 单实例的【集中登记表】(id → 实例),消除"无中央 registry"。
 *   ② STEP_AGENT_REGISTRY  —— stepKey → agent 的【声明式映射】(mode / userInput / afterPersist 钩子)。
 *   ③ findStepAgent + persistStepAgentResult —— 通用分发 + 收敛后的统一持久化。
 *
 * 新增一个 step agent = 在 STEP_AGENT_REGISTRY 加一条目(必要时在 SPECIALISTS 加一行),
 * 完全不用动 stepData.ts 的分发逻辑 —— 这才是真·热插拔。
 *
 * 类型说明:dispatch 边界把各 agent 擦成统一的 SpecialistLike(execute 形状一致、仅 userInput 泛型不同)。
 * 这是 registry 模式的固有取舍 —— 运行时由每个 agent 自己的 inputSchema.parse 兜底校验,安全。
 */

import { analysisAgent } from './AnalysisAgent';
import { brandingAgent } from './BrandingAgent';
import { copywritingAgent, type CopywritingOutput } from './CopywritingAgent';
import { deepLearnAgent } from './DeepLearnAgent';
import { diagnosisAgent } from './DiagnosisAgent';
import { livestreamAgent } from './LivestreamAgent';
import { monetizationAgent } from './MonetizationAgent';
import { positioningAgent } from './PositioningAgent';
import { presentationAgent } from './PresentationAgent';
import { privateDomainAgent } from './PrivateDomainAgent';
import { topicAgent } from './TopicAgent';
import { videoAgent } from './VideoAgent';
import type { Prisma, PrismaClient } from '@prisma/client';

/** 每个 Specialist 都满足的最小结构(= SpecialistRequest<Record> → SpecialistResponse<unknown>)。 */
export interface SpecialistResult {
  result: unknown;
  isFallback: boolean;
  durationMs: number;
  tokensUsed: { prompt: number; completion: number; total: number };
  modelUsed: string;
  traceId: string;
}

export interface SpecialistLike {
  execute(req: {
    accountId: number;
    userId: number;
    mode?: string;
    userInput: Record<string, unknown>;
    traceId?: string;
    stepKey?: string;
  }): Promise<SpecialistResult>;
}

/** 全部 specialist 单实例的集中登记表。新增 agent 在此加一行即被"发现"。 */
const _specialists = {
  positioning: positioningAgent,
  branding: brandingAgent,
  monetization: monetizationAgent,
  video: videoAgent,
  topic: topicAgent,
  copywriting: copywritingAgent,
  livestream: livestreamAgent,
  analysis: analysisAgent,
  deepLearn: deepLearnAgent,
  diagnosis: diagnosisAgent,
  presentation: presentationAgent,
  privateDomain: privateDomainAgent,
};

export type SpecialistId = keyof typeof _specialists;

/** dispatch 边界统一类型(见文件头"类型说明")。 */
export const SPECIALISTS = _specialists as unknown as Record<SpecialistId, SpecialistLike>;

/** stepData.save 分发表的一条目。 */
export interface StepAgentEntry {
  /** 写回 stepData.agentId 的名字 */
  agentId: string;
  /** 用哪个 specialist(取自 SPECIALISTS) */
  agent: SpecialistLike;
  /** 此条目是否处理该 stepKey */
  match: (stepKey: string) => boolean;
  /** 解析传给 agent 的 mode(可选) */
  resolveMode?: (stepKey: string, inputs: Record<string, unknown>) => string | undefined;
  /** 构造 agent 的 userInput(默认 = inputs) */
  buildUserInput?: (inputs: Record<string, unknown>, stepKey: string) => Record<string, unknown>;
  /** persist 之后的副作用(如 step7 额外写 history 表) */
  afterPersist?: (args: {
    prisma: PrismaClient;
    accountId: number;
    stepKey: string;
    agentRes: SpecialistResult;
    traceId: string | null;
  }) => Promise<void>;
}

/**
 * stepKey → agent 声明式映射。顺序即匹配优先级(step5_* 用前缀判定)。
 * 每条目完整等价于原 stepData.ts 里对应的 if 分支。
 */
export const STEP_AGENT_REGISTRY: StepAgentEntry[] = [
  // step1 → industry / step4 → execution(US-004)
  {
    agentId: 'PositioningAgent',
    agent: SPECIALISTS.positioning,
    match: (k) => k === 'step1' || k === 'step4',
    resolveMode: (k) => (k === 'step1' ? 'industry' : 'execution'),
  },
  // step3 → packaging / step3b → persona(US-005)
  {
    agentId: 'BrandingAgent',
    agent: SPECIALISTS.branding,
    match: (k) => k === 'step3' || k === 'step3b',
    resolveMode: (k) => (k === 'step3' ? 'packaging' : 'persona'),
  },
  // step4b → 变现(US-006)
  {
    agentId: 'MonetizationAgent',
    agent: SPECIALISTS.monetization,
    match: (k) => k === 'step4b',
  },
  // step6 → 拍摄分镜(US-008)
  {
    agentId: 'VideoAgent',
    agent: SPECIALISTS.video,
    match: (k) => k === 'step6',
    resolveMode: () => 'shooting',
  },
  // step5 / step5_<category> → 选题(US-017)。category 从 stepKey 后缀解析,回退 inputs.lastCategory,默认 traffic。
  {
    agentId: 'TopicAgent',
    agent: SPECIALISTS.topic,
    match: (k) => k === 'step5' || k.startsWith('step5_'),
    buildUserInput: (inputs, stepKey) => {
      const categoryFromKey = stepKey.startsWith('step5_')
        ? stepKey.slice('step5_'.length)
        : undefined;
      const category = categoryFromKey || (inputs['lastCategory'] as string) || 'traffic';
      return { category, ...inputs };
    },
  },
  // step7 → 文案(US-017)+ 额外写 history 表
  {
    agentId: 'CopywritingAgent',
    agent: SPECIALISTS.copywriting,
    match: (k) => k === 'step7',
    resolveMode: () => 'step7',
    afterPersist: async ({ prisma, accountId, stepKey, agentRes, traceId }) => {
      await prisma.history.create({
        data: {
          accountId,
          agentId: 'CopywritingAgent',
          sourceType: 'user',
          inputSummary: stepKey,
          content: (agentRes.result as CopywritingOutput).markdown,
          traceId,
        },
      });
    },
  },
  // step8 → 直播话术(US-010/007)。mode 取 inputs.sub_function(generate_plan / optimize_script)
  {
    agentId: 'LivestreamAgent',
    agent: SPECIALISTS.livestream,
    match: (k) => k === 'step8',
    resolveMode: (_k, inputs) => (inputs['sub_function'] as string) ?? 'generate_plan',
  },
];

/** 找到处理该 stepKey 的注册条目(无则返回 undefined,表示该 step 不触发 agent)。 */
export function findStepAgent(stepKey: string): StepAgentEntry | undefined {
  return STEP_AGENT_REGISTRY.find((e) => e.match(stepKey));
}

/**
 * 把 agent 结果写回 stepData 行(原 8 段重复的 update 收敛成这一处)。
 * select 由调用方传入(与 stepData 的 STEP_DATA_SELECT 对齐)。
 */
export async function persistStepAgentResult(
  prisma: PrismaClient,
  accountId: number,
  stepKey: string,
  agentRes: SpecialistResult,
  agentId: string,
  select: Prisma.StepDataSelect,
) {
  return prisma.stepData.update({
    where: { accountId_stepKey: { accountId, stepKey } },
    data: {
      result: agentRes.result as Prisma.InputJsonValue,
      isFallback: agentRes.isFallback,
      status: agentRes.isFallback ? 'fallback' : 'completed',
      durationMs: agentRes.durationMs,
      tokensUsed: agentRes.tokensUsed.total,
      modelUsed: agentRes.modelUsed,
      agentId,
    },
    select,
  });
}
