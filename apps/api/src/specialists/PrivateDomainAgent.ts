/**
 * QuanAn · PRD-27 US-002
 * PrivateDomainAgent — /private-domain 私域话术生成
 * mode='phase-generate' · 单 phase LLM 调用 · 输出 phaseScript + 3 风格变体
 *
 * AC-3: phase z.enum([welcome,warmup,trust,discover,close,follow]) + 6 phase 各 prompt template
 * AC-4: 输出 schema {phaseScript, variants{professional, friendly, sales}}
 * [SHIELD] D-261 字面锁: welcome/warmup/trust/discover/close/follow 严守
 */

import { z } from 'zod';

import { piiMask } from '@/lib/compliance/pii-mask';

import { BaseSpecialist } from './base/BaseSpecialist';

import type {
  AssembledContext,
  ILLMGateway,
  InvokeLLMResult,
  SpecialistConfig,
  SpecialistRequest,
} from './base/types';

// ── Phase enum (D-261 字面锁) ─────────────────────────────────────────────────

export const PRIVATE_DOMAIN_PHASE_ENUM = ['welcome', 'warmup', 'trust', 'discover', 'close', 'follow'] as const;
export type PrivateDomainPhase = (typeof PRIVATE_DOMAIN_PHASE_ENUM)[number];

// ── I/O ──────────────────────────────────────────────────────────────────────

export const privateDomainPhaseGenerateInput = z.object({
  phase: z.enum(PRIVATE_DOMAIN_PHASE_ENUM),
  productDescription: z.string().min(1).max(1000),
  productPrice: z.number().positive(),
  targetAudience: z.string().min(1).max(500),
  ipPositioning: z.string().min(1).max(500),
  currentChannel: z.enum(['wechat', 'douyin', 'xiaohongshu', 'weibo', 'other']),
  monthlyTraffic: z.number().int().min(0),
  scene: z.string().max(300).optional(),
});

export const privateDomainPhaseGenerateOutput = z.object({
  phaseScript: z.string(),
  variants: z.object({
    professional: z.string(),
    friendly: z.string(),
    sales: z.string(),
  }),
});

const privateDomainPhaseGenerateBaseSchema = z.object({
  phaseScript: z.string(),
  variants: z.object({
    professional: z.string(),
    friendly: z.string(),
    sales: z.string(),
  }),
});

export type PrivateDomainPhaseGenerateInput = z.infer<typeof privateDomainPhaseGenerateInput>;
export type PrivateDomainPhaseGenerateOutput = z.infer<typeof privateDomainPhaseGenerateOutput>;

// ── 6 phase prompt templates ──────────────────────────────────────────────────

interface PhaseTemplate {
  goal: string;
  tactics: string;
  outputHint: string;
}

export const PHASE_TEMPLATES: Record<PrivateDomainPhase, PhaseTemplate> = {
  welcome: {
    goal: '新好友添加后建立第一印象 · 让对方感受到价值和温度 · 提升留存率',
    tactics: '自我介绍+价值主张 · 福利钩子 · 引导对方表达需求 · 避免硬推销',
    outputHint: '友好开场白 + 自我介绍 + 价值说明 + 福利引导',
  },
  warmup: {
    goal: '通过日常互动破冰 · 朋友圈评论 · 私聊暖场 · 建立熟悉感',
    tactics: '共情话题 · 朋友圈互动 · 生活化聊天切入 · 建立情感连接',
    outputHint: '轻松自然的互动话术 · 不涉及产品 · 以聊天为主',
  },
  trust: {
    goal: '通过专业内容和案例建立信任感 · 强化 IP 权威性',
    tactics: '价值输出 · 客户成功案例分享 · 专业知识展示 · 社会认证',
    outputHint: '专业干货分享 + 客户见证 + 权威背书',
  },
  discover: {
    goal: '引导客户主动表达需求和痛点 · 完成需求摸底',
    tactics: '开放式提问 · 场景化引导 · 痛点触发 · 倾听反馈',
    outputHint: '提问话术 + 场景引导 · 让客户说出自己的需求',
  },
  close: {
    goal: '临门一脚促成成交 · 处理价格异议 · 降低决策风险',
    tactics: '稀缺性 · 社会证明 · 风险反转 · 价格锚点 · 限时优惠',
    outputHint: '成交话术 + 异议处理 + 限时报价',
  },
  follow: {
    goal: '售后维护 · 复购唤醒 · 转介绍激励 · 流失客户挽回',
    tactics: '关怀回访 · 满意度确认 · 复购优惠 · 裂变奖励',
    outputHint: '回访问候 + 满意度跟进 + 复购/转介绍激励',
  },
};

export const PHASE_LABEL: Record<PrivateDomainPhase, string> = {
  welcome: '欢迎话术',
  warmup: '破冰暖场',
  trust: '信任建立',
  discover: '需求挖掘',
  close: '成交话术',
  follow: '售后跟进',
};

// ── Config ────────────────────────────────────────────────────────────────────

const PRIVATE_DOMAIN_CONFIG: SpecialistConfig = {
  agentId: 'PrivateDomainAgent',
  persona: {
    role: 'PrivateDomainAgent',
    goal: '生成针对私域运营特定阶段的高转化话术 · 包含主稿和三种风格变体',
    boundaries: ['仅生成私域运营话术 · 不涉及违法违规内容', '不承诺具体成交率数字'],
  },
  memory: { l1_readonly: ['account'], l2_read: ['stepData'], l2_write: [] },
  knowledge: { constants: [], rag: [], refresh_interval_sec: 86400 },
  tools: [],
  execution: { timeout_ms: 60_000, retry: 1, model_tier: 'balanced', streaming: false },
};

// ── PrivateDomainAgent ────────────────────────────────────────────────────────

export class PrivateDomainAgent extends BaseSpecialist<PrivateDomainPhaseGenerateInput, PrivateDomainPhaseGenerateOutput> {
  readonly config = PRIVATE_DOMAIN_CONFIG;
  readonly inputSchema = privateDomainPhaseGenerateInput;
  readonly outputSchema = privateDomainPhaseGenerateOutput;

  static override readonly fallbackTemplate: Record<string, unknown> = {
    'phase-generate': {
      phaseScript:
        '系统繁忙，暂时无法生成话术。请稍后重试，或参考以下通用话术：您好，感谢关注！我专注于[您的领域]，定期分享干货内容，欢迎随时交流。',
      variants: {
        professional:
          '您好，非常感谢您的关注。作为[领域]专家，我致力于为您提供专业价值。如有任何问题，欢迎随时沟通。',
        friendly:
          '哈喽～很高兴认识你！我平时分享很多[领域]干货，有什么想了解的随时找我聊，不用客气哦～',
        sales:
          '感谢关注！现在加我还有专属福利等你领取，点击了解详情，名额有限，先到先得！',
      },
    } satisfies PrivateDomainPhaseGenerateOutput,
    default: {
      phaseScript: '系统繁忙，请稍后重试。',
      variants: { professional: '系统繁忙，请稍后重试。', friendly: '系统繁忙，请稍后重试。', sales: '系统繁忙，请稍后重试。' },
    } satisfies PrivateDomainPhaseGenerateOutput,
  };

  constructor(gateway?: ILLMGateway) {
    super(gateway);
  }

  protected async invokeLLM(
    ctx: AssembledContext,
    req: SpecialistRequest<PrivateDomainPhaseGenerateInput>,
  ): Promise<InvokeLLMResult> {
    const input = req.userInput;
    const systemPrompt = ctx.systemPrompt;
    const userPrompt = this._buildUserPrompt(input.phase, input);

    return this.llmGateway.complete({
      model_tier: this.config.execution.model_tier,
      systemPrompt,
      userPrompt,
      responseFormat: { type: 'json_schema' as const, schema: privateDomainPhaseGenerateBaseSchema },
      metadata: {
        trace_id: req.traceId ?? '',
        agentId: this.config.agentId,
        accountId: req.accountId,
        userId: req.userId,
        eventType: 'specialist_call',
      },
      timeout_ms: this.config.execution.timeout_ms,
      retry: this.config.execution.retry,
    });
  }

  _buildUserPrompt(phase: PrivateDomainPhase, input: PrivateDomainPhaseGenerateInput): string {
    // PII 脱敏: 用户自由文本字段可能含手机/邮箱 · R-14 / LD-018 / US-002 AC-5
    // 枚举字段(currentChannel)与数值字段(productPrice/monthlyTraffic)不含 PII · 不脱敏
    const productDescription = piiMask(input.productDescription);
    const targetAudience = piiMask(input.targetAudience);
    const ipPositioning = piiMask(input.ipPositioning);
    const scene = input.scene ? piiMask(input.scene) : undefined;

    const tmpl = PHASE_TEMPLATES[phase];

    return [
      `## 当前阶段:${PHASE_LABEL[phase]}`,
      `**目标**:${tmpl.goal}`,
      `**核心策略**:${tmpl.tactics}`,
      `**输出期望**:${tmpl.outputHint}`,
      '',
      `请为以下产品生成「${PHASE_LABEL[phase]}」阶段的私域话术：`,
      `产品：${productDescription}（¥${input.productPrice}）`,
      `受众：${targetAudience}`,
      `IP 定位：${ipPositioning}`,
      // 渠道/流量为非 PII 业务上下文(枚举+数值)·影响话术调性·US-002 接通时随产品背景块迁入此处
      `主渠道：${input.currentChannel}（月流量 ${input.monthlyTraffic}）`,
      ...(scene ? [`场景：${scene}`] : []),
      '',
      '请返回 JSON 格式：{"phaseScript": "...", "variants": {"professional": "...", "friendly": "...", "sales": "..."}}',
    ].join('\n');
  }
}

export const privateDomainAgent = new PrivateDomainAgent();
