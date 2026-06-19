/**
 * QuanAn · PRD-4 US-009 + PRD-5 US-002
 * CopywritingAgent — step7(爆款文案·SSE·markdown) + free(/generate) + boom(/boom-generate)
 *
 * AC-1:  继承 BaseSpecialist · 五层配置完整
 * AC-2:  outputSchema getter · step7→CopywritingOutputSchema / free→copywritingFreeOutput /
 *        boom→boomOutput / acquisition→throw 'Not implemented · PRD-6'(D-035)
 * AC-3:  invokeLLM step7/free/boom 均走 SSE stream · _consumeStream 复用
 * AC-9:  tools=['llm.stream'] · streaming=true · timeout_ms=60000
 * SHIELD REJ-001: no direct SDK import
 * SHIELD REJ-002: single stream call · 不在 Specialist 内 loop
 * SHIELD REJ-003/D-019: model from stream meta chunk · no hardcoding
 * SHIELD REJ-007: outputSchema getter 按 mode
 */

import { z } from 'zod';

import { piiMask } from '@/lib/compliance/pii-mask';
import { BaseSpecialist } from './base/BaseSpecialist';

import type {
  SpecialistConfig,
  SpecialistRequest,
  InvokeLLMResult,
  AssembledContext,
  ILLMGateway,
  LLMCompleteRequest,
} from './base/types';
import type { AcquisitionCopywritingOutput } from '@quanan/schemas/specialist-io';

// ── Mode type ─────────────────────────────────────────────────────────────────

export type CopywritingMode = 'step7' | 'free' | 'boom' | 'acquisition';

// ── step7 output schema ───────────────────────────────────────────────────────

export const CopywritingOutputSchema = z
  .object({
    markdown: z.string().min(500),
    structure: z.string(),
    hooks: z.array(z.string()).min(1),
    cta: z.string(),
  })
  .refine((v) => /^# .+/m.test(v.markdown), {
    message: '必含 # 标题 heading',
  });

// Base schemas for responseFormat (no min/length constraints — avoids JSON schema issues)
const CopywritingBaseSchema = z.object({
  markdown: z.string(),
  structure: z.string(),
  hooks: z.array(z.string()),
  cta: z.string(),
});

const CopywritingFreeBaseSchema = z.object({
  markdown: z.string(),
  metadata: z.object({
    scriptType: z.string(),
    elements: z.array(z.string()),
    structureSummary: z.string(),
    estimatedDuration: z.string(),
  }),
});

const BoomCandidateBaseSchema = z.object({
  title: z.string(),
  opening: z.string(),
  development: z.string(),
  climax: z.string(),
  ending: z.string(),
  reason: z.string(),
  indexScore: z.string(),
});

const BoomBaseSchema = z.object({
  candidates: z.array(BoomCandidateBaseSchema),
  metadata: z.object({
    count: z.number(),
    elements: z.array(z.string()),
  }),
});

// free mode output schema (inline equiv of @quanan/schemas copywritingFreeOutput)
// Note: Zod schemas inlined — @quanan/schemas/specialist-io has canonical definition for client use
export const CopywritingFreeOutputSchema = z.object({
  markdown: z.string().min(400).max(1500),
  metadata: z.object({
    scriptType: z.string().min(1),
    elements: z.array(z.string()),
    structureSummary: z.string(),
    estimatedDuration: z.string(),
  }),
});

// boom mode output schema (inline equiv of @quanan/schemas boomOutput)
const BoomCandidateOutputSchema = z.object({
  title: z.string().min(6).max(80),
  opening: z.string().min(40),
  development: z.string().min(40),
  climax: z.string().min(40),
  ending: z.string().min(40),
  reason: z.string().min(20),
  indexScore: z.string().min(1).max(8),
});

export const BoomOutputSchema = z.object({
  candidates: z.array(BoomCandidateOutputSchema).length(5),
  metadata: z.object({
    count: z.literal(5),
    elements: z.array(z.string()),
  }),
});

// acquisition mode output schema (D-035 落地 · PRD-6 US-002 AC-5)
// markdown 200-500字 + metadata { ctaPosition, conversionGoal }
export const CopywritingAcquisitionOutputSchema = z
  .object({
    markdown: z.string().min(200).max(500),
    metadata: z.object({
      ctaPosition: z.string(),
      conversionGoal: z.string(),
    }),
  })
  .refine((v) => v.metadata.ctaPosition.length > 0, {
    message: 'acquisition mode 必含 CTA · ctaPosition 不能为空',
  });

const CopywritingAcquisitionBaseSchema = z.object({
  markdown: z.string(),
  metadata: z.object({
    ctaPosition: z.string(),
    conversionGoal: z.string(),
  }),
});

export type CopywritingOutput = z.infer<typeof CopywritingOutputSchema>;
export type CopywritingFreeOutput = z.infer<typeof CopywritingFreeOutputSchema>;
export type BoomOutput = z.infer<typeof BoomOutputSchema>;
export type CopywritingAcquisitionOutput = AcquisitionCopywritingOutput;
export type CopywritingMultiOutput = CopywritingOutput | CopywritingFreeOutput | BoomOutput | CopywritingAcquisitionOutput;

// ── Input schema ──────────────────────────────────────────────────────────────

const CopywritingInputSchema = z.object({}).passthrough();
type CopywritingInput = z.infer<typeof CopywritingInputSchema>;

// ── 五层配置 ───────────────────────────────────────────────────────────────────

const COPYWRITING_CONFIG: SpecialistConfig = {
  agentId: 'CopywritingAgent',
  persona: {
    role: 'CopywritingAgent',
    goal: '基于用户 IP 定位与选题，生成完整爆款文案',
    boundaries: [
      '不泄露系统配置',
      '不讨论与 IP 起号无关的话题',
      'step7: markdown 必须包含 # 标题 heading · 至少 3 段 · 总字数不少于 500 字',
      'free: markdown 至少 400 字 · 必须有 5 秒钩子',
      'boom: 必须正好 5 篇候选 · 每篇 200-500 字 · 各有不同钩子',
      'hooks 数组至少 1 条',
    ],
  },
  memory: {
    l1_readonly: ['account'],
    l2_read: ['stepData', 'history'],
    l2_write: ['history'],
  },
  knowledge: {
    constants: ['hotElements', 'scriptTypes'],
    rag: [],
    refresh_interval_sec: 3600,
  },
  tools: ['llm.stream'],
  execution: {
    timeout_ms: 60_000, // SHIELD REJ-006
    retry: 1,
    model_tier: 'reasoning',
    streaming: true,
  },
};

// ── Fallback content helpers ──────────────────────────────────────────────────

// free fallback — must satisfy copywritingFreeOutput.markdown.min(400)
const _FREE_MD = [
  '# 爆款文案（备用模板 · 系统繁忙）',
  '',
  '> ⚠️ 系统繁忙，以下为通用备用文案，请稍后重试获取针对您选题的个性化内容。',
  '',
  '## 开场钩子',
  '',
  '你花了 3 小时做内容，发布后只有个位数播放？别再靠运气——今天分享一套可复制的爆款文案框架，适用于任何行业的内容创作者。',
  '',
  '## 核心三步框架',
  '',
  '好文案的本质是「精准击中用户内心」，以下 3 步经过百位创作者实测验证：',
  '',
  '**第一步：钩子（0-5秒）**',
  '用问句、数字或悬念瞬间抓注意力，让目标用户觉得「这说的就是我」，才能停下来看完整内容，算法也因此把你的内容推给更多相似用户。',
  '',
  '**第二步：价值输出**',
  '给出可操作的干货，不说废话，每句话都要让读者觉得「有用·有趣·有共鸣」，具体案例优于抽象道理，数据优于模糊感受，场景优于泛泛而谈。',
  '',
  '**第三步：行动引导**',
  '结尾明确 CTA，例如：「关注我，每天分享一个可直接用的创作技巧，帮你少走三年弯路，快速建立自己的内容影响力」。',
  '',
  '## 立即行动',
  '',
  '关注账号，解锁更多爆款文案模板与创作干货，欢迎在评论区分享你的创作问题与困惑。',
].join('\n');

// boom fallback — structured candidate objects satisfying BoomOutputSchema constraints
type BoomCandidateObj = {
  title: string;
  opening: string;
  development: string;
  climax: string;
  ending: string;
  reason: string;
  indexScore: string;
};

const _BOOM_CANDS: [BoomCandidateObj, BoomCandidateObj, BoomCandidateObj, BoomCandidateObj, BoomCandidateObj] = [
  {
    title: '候选1·痛点共鸣型：做了很久内容，粉丝就是涨不上去？',
    opening: '你是不是发现，做了很久内容，粉丝就是涨不上去？其实原因只有一个：你还没找到「精准触达目标受众」的正确方式，每次发内容都像在瞎猫碰死耗子。',
    development: '好的爆款内容并非偶然，它一定在开场 5 秒内触发了某种强烈的心理反应：恐惧、好奇、共鸣或冲突感。掌握这些元素，你的内容就有更高概率被算法推给精准用户，完播率和互动率自然提升。',
    climax: '真正的痛点在于，我们太容易被「努力」迷惑，忽略了方法本身有没有对准目标受众的心理触发点。当你学会用共鸣元素设计开场钩子，流量会找上门，而不是你去追流量。',
    ending: '从今天开始，每次构思内容先选定 2-3 个核心元素设计开场钩子。关注账号，持续获取更多内容创作实战干货，让你的每条内容都有爆款潜力。',
    reason: '痛点共鸣型直击内容创作者最普遍的困境，「做了很久却没结果」触发强烈共情，用户停下来看的概率极高，转发率也会因「说出了我的心声」而自然提升。',
    indexScore: '8/10',
  },
  {
    title: '候选2·数字冲击型：90%创作者都犯同一个错误',
    opening: '90% 的创作者都犯了同一个错误——把太多精力放在画面制作上，却忽视了文案钩子的核心价值。开场 5 秒决定一切，而你可能一直在错的地方努力。',
    development: '数据说明问题：开场前 3 秒的留存率每提升 10%，整体完播率能拉升 30% 以上。但大多数人把 80% 时间花在剪辑上，却只用 5 分钟想开场那句话，本末倒置是流量低迷的根本原因。',
    climax: '当你把注意力从「画面好看」转向「开场够不够击中人」，会发现同样的内容，换一个有冲突感的开场，播放量可以翻 3-5 倍。这不是玄学，是心理学在内容分发算法里的真实体现。',
    ending: '今天就开始审视你最近 5 条内容的前 5 秒：有没有触发情绪反应？没有的话，先改开场再发。关注我，每天一个可直接用的爆款钩子公式，帮你把努力用在刀刃上。',
    reason: '「90%」这个数字制造了强烈的认知冲击，让用户自我对号入座；「开场 5 秒」给出了具体可操作的改进方向，数字型内容天然容易被转发和收藏。',
    indexScore: '9/10',
  },
  {
    title: '候选3·对比反差型：同样话题，有人10万播放，有人只有100',
    opening: '同样的话题，有人发出来 10 万播放，有人发出来只有 100。区别不在平台，不在运气，只在开场那句话有没有触发情绪反应。你属于哪一种？',
    development: '对比是最强的认知冲击工具。当用户看到「10万 vs 100」这组数字，大脑会自动进入「为什么」的思考模式，这就是好奇元素在发挥作用。真正的差距在于：是否用正确的元素设计了钩子，让算法读懂你的内容适合推给谁。',
    climax: '我分析了 200 条同题材内容发现：播放量高出 50 倍以上的内容，80% 都在开场 3 秒内完成了「情绪锚定」——不是让用户知道你说什么，而是让用户感受到「这说的就是我」的强烈共鸣。',
    ending: '下次创作前，先问自己：我这条内容的开场，能让目标用户在 3 秒内产生「哦对就是这样」的反应吗？关注我，我会持续分享这套可复制的爆款思维框架。',
    reason: '对比反差天然制造信息不对称感，触发用户的好奇心和竞争意识；「你属于哪一种」把用户带入主角视角，互动率和评论数都会显著提升。',
    indexScore: '8/10',
  },
  {
    title: '候选4·好奇悬念型：研究了1000条爆款，发现同一个结构',
    opening: '研究了 1000 条爆款内容，我发现它们都有一个共同结构：让用户在前 3 秒产生「我要知道答案」的冲动，然后用内容兑现这个承诺。这个结构，你可以直接复制。',
    development: '好奇元素的本质是「信息差」——你拥有用户还不知道的有价值信息。当开场制造了「原来如此」的期待，用户会主动完播去寻找答案。这解释了为什么「揭秘类」「真相类」内容天然比「教程类」有更高的完播率，因为前者的悬念感更强烈。',
    climax: '但大多数人用错了好奇元素：他们的「悬念」是假悬念，没有真正有价值的信息兑现，用户看到结尾反而会觉得被骗，下次不会再点。真正的爆款悬念 = 真实的信息差 + 超出预期的价值交付。',
    ending: '今天分享一个公式：「[反直觉的结论] + [你的真实数据] + [可验证的细节]」就能构建有说服力的好奇钩子。关注我，每周分享 3 个经过实测的爆款公式，让你的内容库越来越强。',
    reason: '「研究了1000条」建立了权威感，「共同结构」满足了内容创作者对可复制方法论的渴望；好奇元素的核心「信息差」在这条内容本身就得到了完美示范，用户边看边学。',
    indexScore: '9/10',
  },
  {
    title: '候选5·权威背书型：心理学研究证实，这类内容完播率高40%',
    opening: '心理学研究告诉我们：基于情绪触发元素设计的内容，完播率平均高出普通内容 40% 以上。今天教你如何把这套科学方法落地到自己的 IP 账号，不靠运气，靠系统。',
    development: '权威背书的力量在于「可信度」。当你把心理学原理（恐惧回避、好奇驱动、社会认同）和内容创作结合，你的每条内容都在以科学方式触达用户的深层决策系统，而不是靠随机的「感觉好像行」。这就是头部创作者和普通创作者的核心认知差距。',
    climax: '我用这套方法帮助 50+ 创作者优化内容钩子，平均完播率从 23% 提升到 61%，互动率提升了 3 倍。关键不是「你有没有好内容」，而是「你有没有用正确的元素让好内容被看见」。',
    ending: '现在就行动：把你下一条内容的开场套用「[心理触发元素] + [具体数据/场景] + [用户利益点]」这个公式重新写一遍，感受一下区别。关注我，获取完整的爆款元素使用手册。',
    reason: '权威背书（心理学/数据/案例）大幅降低用户的信任门槛；「40%」这个具体数字和「50+创作者」的案例规模让内容具有可信度；内容本身就在用权威元素示范权威元素的价值，说服力加倍。',
    indexScore: '8/10',
  },
];

// ── CopywritingAgent ──────────────────────────────────────────────────────────

export class CopywritingAgent extends BaseSpecialist<CopywritingInput, CopywritingMultiOutput> {
  /**
   * Stores the mode for the current invocation.
   * Set in invokeLLM() BEFORE BaseSpecialist calls this.outputSchema.safeParse().
   * (SHIELD REJ-007: outputSchema getter 按 mode 返回对应 schema)
   */
  private _mode: CopywritingMode = 'step7';

  readonly config: SpecialistConfig = COPYWRITING_CONFIG;
  readonly inputSchema = CopywritingInputSchema;

  // SHIELD REJ-007: getter per mode (AC-6 — 4 mode 全 cover · D-035 落地 PRD-6 US-002)
  get outputSchema(): z.ZodType<CopywritingMultiOutput> {
    if (this._mode === 'step7') return CopywritingOutputSchema as z.ZodType<CopywritingMultiOutput>;
    if (this._mode === 'free') return CopywritingFreeOutputSchema as z.ZodType<CopywritingMultiOutput>;
    if (this._mode === 'boom') return BoomOutputSchema as z.ZodType<CopywritingMultiOutput>;
    if (this._mode === 'acquisition') return CopywritingAcquisitionOutputSchema as z.ZodType<CopywritingMultiOutput>;
    throw new Error(`Unknown mode: ${this._mode as string}`);
  }

  // AC-8: fallback for step7 / free / boom / acquisition modes
  static override readonly fallbackTemplate: Record<string, unknown> = {
    step7: {
      markdown: [
        '# 备用辩论文案（系统繁忙）',
        '',
        '> ⚠️ 系统繁忙，以下为通用备用辩论文案，请稍后重试以获取针对您主题的个性化内容文案。',
        '',
        '#### 话题抛出',
        '',
        '**一个让内容创作者反复纠结的问题：该不该专注单一垂类？**',
        '',
        '很多人觉得"多元发展才能抓住更多流量"，也有人坚信"垂直深耕才能建立权威"。今天我们把这个问题摊开来聊——你选哪边？',
        '',
        '#### 正方',
        '',
        '**专注单一垂类，才能真正建立信任。**',
        '',
        '- 算法更容易识别你的内容方向，系统性推给精准用户',
        '- 粉丝对你的期待值清晰，关注转化率更高',
        '- 垂直领域深耕后，商业合作溢价明显（客单价高 2-5 倍）',
        '- 案例：头部美食博主均聚焦"家常菜"or"探店"单一赛道，鲜有跨界成功',
        '',
        '**结论：** 在资源有限的起号期，聚焦是最高效的路径。',
        '',
        '#### 反方',
        '',
        '**过度垂直会让你的账号失去活力和抗风险能力。**',
        '',
        '- 单一垂类内容创作者容易进入枯竭期，选题空间天花板明显',
        '- 平台算法迭代，垂类流量可能突然萎缩（如某垂类被限流）',
        '- 多元内容有助于触达不同圈层粉丝，提升账号黏性',
        '- 案例：部分千万级博主靠"生活方式"宽泛标签，反而打破圈层壁垒',
        '',
        '**结论：** 在粉丝基础扎实后，适度扩展边界才能持续增长。',
        '',
        '#### 我的立场',
        '',
        '**起号期垂直，成长期微扩张。**',
        '',
        '这不是非此即彼的选择。0-5 万粉阶段，必须聚焦垂类建立账号标签；5 万粉之后，可以在保持核心定位的前提下，向相邻领域延伸（如美食→厨房好物→生活方式）。',
        '',
        '你怎么看？评论区告诉我——你是垂类派还是多元派？',
        '',
        '**评论区引导：** 你现在的账号是聚焦垂类还是多元发展？遇到了什么问题？评论区说说你的情况，我来帮你分析。',
      ].join('\n'),
      structure: '话题抛出→正方论点→反方论点→我的立场→评论引导（辩论模板）',
      hooks: ['该不该专注单一垂类？两边都有道理，但只有一个选择是对的', '专注 vs 多元，内容创作者最纠结的问题今天说清楚'],
      cta: '评论区告诉我你的选择，我来帮你分析适合你的路径',
    } satisfies CopywritingOutput,

    free: {
      markdown: _FREE_MD,
      metadata: {
        scriptType: 'tutorial',
        elements: ['curiosity', 'contrast'],
        structureSummary: '钩子→三步框架→行动引导（通用备用）',
        estimatedDuration: '60-90 秒',
      },
    },

    boom: {
      candidates: _BOOM_CANDS,
      metadata: {
        count: 5 as const,
        elements: ['curiosity', 'contrast'],
      },
    },

    acquisition: {
      markdown: [
        '你是否正在寻找一个能帮你快速增长的解决方案？今天我们为你提供一个经过验证的方法。',
        '',
        '这套方案已经帮助数百位创作者实现了从 0 到起步的突破。我们专注于帮助 IP 创作者建立可持续的内容体系，让你的每一条内容都能为账号带来精准流量。',
        '',
        '现在就行动，扫描二维码获取你的免费咨询（系统繁忙备用文案 · 请稍后重试获取个性化内容）。',
      ].join('\n'),
      metadata: {
        ctaPosition: '结尾段落',
        conversionGoal: '扫码咨询 · 了解详情',
      },
    } satisfies CopywritingAcquisitionOutput,
  };

  constructor(gateway?: ILLMGateway) {
    super(gateway);
  }

  protected async invokeLLM(
    ctx: AssembledContext,
    req: SpecialistRequest<CopywritingInput>,
  ): Promise<InvokeLLMResult> {
    const mode = (req.mode ?? 'step7') as CopywritingMode;

    // Set _mode BEFORE any returns so outputSchema getter works correctly (SHIELD REJ-007)
    this._mode = mode;

    const gateway = this.llmGateway;
    if (!gateway.stream) {
      throw new Error('CopywritingAgent requires a streaming LLM gateway');
    }

    const streamFn = gateway.stream.bind(gateway);
    if (mode === 'step7') {
      return this._invokeStep7(ctx, req, streamFn);
    }
    if (mode === 'free') {
      // D-019: stream.meta.model captured via meta chunk, not hardcoded
      return this._invokeFree(ctx, req, streamFn);
    }
    if (mode === 'boom') {
      // D-019: stream.meta.model captured via meta chunk, not hardcoded
      return this._invokeBoom(ctx, req, streamFn);
    }
    // acquisition — D-035 落地 · PRD-6 US-002 AC-5
    return this._invokeAcquisition(ctx, req, streamFn);
  }

  private async _invokeStep7(
    ctx: AssembledContext,
    req: SpecialistRequest<CopywritingInput>,
    streamFn: NonNullable<ILLMGateway['stream']>,
  ): Promise<InvokeLLMResult> {
    const streamReq: LLMCompleteRequest = {
      model_tier: this.config.execution.model_tier,
      systemPrompt: ctx.systemPrompt,
      userPrompt: this._buildStep7UserPrompt(req.userInput, ctx),
      responseFormat: { type: 'json_schema' as const, schema: CopywritingBaseSchema },
      metadata: {
        trace_id: req.traceId ?? '',
        agentId: this.config.agentId,
        accountId: req.accountId,
        userId: req.userId,
      },
      timeout_ms: this.config.execution.timeout_ms,
    };

    const step7Result = await this._consumeStream(streamFn, streamReq);
    const { accumulated } = step7Result;
    let { tokens: finalTokens, model } = step7Result;

    let content: unknown;
    try {
      content = JSON.parse(accumulated);
    } catch {
      const retry = await this._consumeStream(streamFn, streamReq);
      try {
        content = JSON.parse(retry.accumulated);
        finalTokens = retry.tokens;
        model = retry.model || model;
      } catch {
        return {
          content: null,
          tokens: finalTokens ?? { prompt: 0, completion: 0, total: 0 },
          model: model || '',
          isFallback: true,
        };
      }
    }

    return {
      content,
      tokens: finalTokens ?? { prompt: 0, completion: 0, total: 0 },
      model: model || '',
    };
  }

  private async _invokeFree(
    ctx: AssembledContext,
    req: SpecialistRequest<CopywritingInput>,
    streamFn: NonNullable<ILLMGateway['stream']>,
  ): Promise<InvokeLLMResult> {
    const streamReq: LLMCompleteRequest = {
      model_tier: this.config.execution.model_tier,
      systemPrompt: ctx.systemPrompt,
      userPrompt: this._buildFreeUserPrompt(req.userInput),
      responseFormat: { type: 'json_schema' as const, schema: CopywritingFreeBaseSchema },
      metadata: {
        trace_id: req.traceId ?? '',
        agentId: this.config.agentId,
        accountId: req.accountId,
        userId: req.userId,
      },
      timeout_ms: this.config.execution.timeout_ms,
    };

    // D-019: stream.meta.model captured from SSE meta chunk (not hardcoded · REJ-003)
    const freeResult = await this._consumeStream(streamFn, streamReq);
    const { accumulated } = freeResult;
    let { tokens: finalTokens, model } = freeResult;

    let content: unknown;
    try {
      content = JSON.parse(accumulated);
    } catch {
      const retry = await this._consumeStream(streamFn, streamReq);
      try {
        content = JSON.parse(retry.accumulated);
        finalTokens = retry.tokens;
        model = retry.model || model;
      } catch {
        return {
          content: null,
          tokens: finalTokens ?? { prompt: 0, completion: 0, total: 0 },
          model: model || '',
          isFallback: true,
        };
      }
    }

    return {
      content,
      tokens: finalTokens ?? { prompt: 0, completion: 0, total: 0 },
      model: model || '',
    };
  }

  private async _invokeBoom(
    ctx: AssembledContext,
    req: SpecialistRequest<CopywritingInput>,
    streamFn: NonNullable<ILLMGateway['stream']>,
  ): Promise<InvokeLLMResult> {
    const streamReq: LLMCompleteRequest = {
      model_tier: this.config.execution.model_tier,
      systemPrompt: ctx.systemPrompt,
      userPrompt: this._buildBoomUserPrompt(req.userInput),
      responseFormat: { type: 'json_schema' as const, schema: BoomBaseSchema },
      metadata: {
        trace_id: req.traceId ?? '',
        agentId: this.config.agentId,
        accountId: req.accountId,
        userId: req.userId,
      },
      timeout_ms: this.config.execution.timeout_ms,
    };

    // D-019: stream.meta.model captured from SSE meta chunk (not hardcoded · REJ-003)
    const boomResult = await this._consumeStream(streamFn, streamReq);
    const { accumulated } = boomResult;
    let { tokens: finalTokens, model } = boomResult;

    let content: unknown;
    try {
      content = JSON.parse(accumulated);
    } catch {
      const retry = await this._consumeStream(streamFn, streamReq);
      try {
        content = JSON.parse(retry.accumulated);
        finalTokens = retry.tokens;
        model = retry.model || model;
      } catch {
        return {
          content: null,
          tokens: finalTokens ?? { prompt: 0, completion: 0, total: 0 },
          model: model || '',
          isFallback: true,
        };
      }
    }

    return {
      content,
      tokens: finalTokens ?? { prompt: 0, completion: 0, total: 0 },
      model: model || '',
    };
  }

  /** Consume SSE stream: accumulate delta text + capture final tokens + model from meta chunk */
  private async _consumeStream(
    streamFn: NonNullable<ILLMGateway['stream']>,
    req: LLMCompleteRequest,
  ): Promise<{ accumulated: string; tokens: { prompt: number; completion: number; total: number } | undefined; model: string }> {
    let accumulated = '';
    let tokens: { prompt: number; completion: number; total: number } | undefined;
    let model = '';
    for await (const streamChunk of streamFn(req)) {
      if (streamChunk.type === 'meta' && streamChunk.meta) model = streamChunk.meta.model;
      if (streamChunk.type === 'delta' && streamChunk.delta) accumulated += streamChunk.delta;
      if (streamChunk.type === 'done') tokens = streamChunk.tokens;
      if (streamChunk.type === 'error') {
        throw new Error(`LLM stream error: ${streamChunk.error?.message ?? 'unknown'}`);
      }
    }
    return { accumulated, tokens, model };
  }

  private _buildStep7UserPrompt(userInput: CopywritingInput, ctx: AssembledContext): string {
    const input = userInput as Record<string, unknown>;
    const scriptType = String(input['scriptType'] ?? '未指定'); // 枚举 → 不动
    const elements = JSON.stringify(input['elements'] ?? []); // 枚举数组 → 不动
    // R-14: topic = 用户填写的创作主题(incidental 元数据) → piiMask
    const topic = piiMask(String(input['topic'] ?? '未指定'));

    const parts: string[] = [];

    // Inject account-level system context (persona · memory · knowledge assembled by BaseSpecialist)
    if (ctx.systemPrompt) {
      parts.push(ctx.systemPrompt);
      parts.push('');
    }
    if (ctx.userPrompt) {
      parts.push(ctx.userPrompt);
      parts.push('');
    }

    parts.push(
      '[爆款文案生成任务]',
      '',
      `脚本类型: ${scriptType}`,
      `爆款元素: ${elements}`,
      `文案主题: ${topic}`,
      '',
      '请以 JSON 格式返回完整文案方案:',
      '{',
      '  "markdown": "# 爆款文案标题\\n\\n第一段正文内容...\\n\\n(必须以 # 标题开头 · 至少 3 段 · 总字数不少于 500 字)",',
      '  "structure": "内容结构说明(如:痛点引入→解决方案→案例佐证→CTA)",',
      '  "hooks": ["钩子文案 1", "钩子文案 2"],',
      '  "cta": "行动号召文案"',
      '}',
      '',
      '⚠️ 严格约束:',
      '- markdown 第一行必须是 # 开头的标题',
      '- markdown 至少包含 3 个段落 · 总字数不少于 500 字',
      '- hooks 数组至少 1 条',
      `- 内容必须围绕主题「${topic}」展开，融合所选脚本类型「${scriptType}」的叙事框架`,
      '- 爆款元素必须自然融入文案，不得生硬堆砌',
    );

    return parts.join('\n');
  }

  private _buildFreeUserPrompt(userInput: CopywritingInput): string {
    const input = userInput as Record<string, unknown>;
    // R-14: topic = 用户填写的话题(incidental 元数据) → piiMask; scriptType/elements = 枚举 → 不动
    return [
      '[自由创作文案任务]',
      '',
      `脚本类型: ${String(input['scriptType'] ?? '未指定')}`,
      `元素: ${JSON.stringify(input['elements'] ?? [])}`,
      `话题: ${piiMask(String(input['topic'] ?? '未指定'))}`,
      '',
      '请以 JSON 格式返回:',
      '{',
      '  "markdown": "文案正文(至少 400 字 · 必须有 5 秒钩子开场)",',
      '  "metadata": {',
      '    "scriptType": "所用脚本类型",',
      '    "elements": ["使用的元素"],',
      '    "structureSummary": "内容结构说明",',
      '    "estimatedDuration": "预计时长(如: 60-90 秒)"',
      '  }',
      '}',
      '',
      '⚠️ 严格约束:',
      '- markdown 正文至少 400 字 · 必须有 5 秒钩子开场',
      '- 基于所选脚本类型和元素组合创作',
    ].join('\n');
  }

  private async _invokeAcquisition(
    ctx: AssembledContext,
    req: SpecialistRequest<CopywritingInput>,
    streamFn: NonNullable<ILLMGateway['stream']>,
  ): Promise<InvokeLLMResult> {
    const streamReq: LLMCompleteRequest = {
      model_tier: this.config.execution.model_tier,
      systemPrompt: ctx.systemPrompt,
      userPrompt: this._buildAcquisitionUserPrompt(req.userInput),
      responseFormat: { type: 'json_schema' as const, schema: CopywritingAcquisitionBaseSchema },
      metadata: {
        trace_id: req.traceId ?? '',
        agentId: this.config.agentId,
        accountId: req.accountId,
        userId: req.userId,
      },
      timeout_ms: this.config.execution.timeout_ms,
    };

    const result = await this._consumeStream(streamFn, streamReq);
    const { accumulated } = result;
    let { tokens: finalTokens, model } = result;

    let content: unknown;
    try {
      content = JSON.parse(accumulated);
    } catch {
      const retry = await this._consumeStream(streamFn, streamReq);
      try {
        content = JSON.parse(retry.accumulated);
        finalTokens = retry.tokens;
        model = retry.model || model;
      } catch {
        return {
          content: null,
          tokens: finalTokens ?? { prompt: 0, completion: 0, total: 0 },
          model: model || '',
          isFallback: true,
        };
      }
    }

    return {
      content,
      tokens: finalTokens ?? { prompt: 0, completion: 0, total: 0 },
      model: model || '',
    };
  }

  private _buildAcquisitionUserPrompt(userInput: CopywritingInput): string {
    const input = userInput as Record<string, unknown>;
    // R-14: conversionGoal/topic = 业务元数据(incidental PII) → piiMask
    // scriptType/elements = 枚举 → 不动
    return [
      '[获客文案任务 · acquisition mode]',
      '',
      `脚本类型: ${String(input['scriptType'] ?? '未指定')}`,
      `爆款元素: ${JSON.stringify(input['elements'] ?? [])}`,
      `转化目标: ${piiMask(String(input['conversionGoal'] ?? '未指定'))}`,
      `话题方向: ${piiMask(String(input['topic'] ?? '未指定'))}`,
      '',
      '请以 JSON 格式返回:',
      '{',
      '  "markdown": "获客文案正文(200-500字 · 含钩子+价值+明确CTA · 转化导向 · 结尾必须含关注/私信/点击/获取/领取等行动引导词)",',
      '  "metadata": {',
      '    "ctaPosition": "CTA 在文案中的位置(如: 结尾/中段结尾双出现)",',
      '    "conversionGoal": "转化目标描述(如: 扫码咨询/私信了解/点击链接)"',
      '  }',
      '}',
      '',
      '⚠️ 严格约束:',
      '- markdown 必须 200-500 字 · 不能超出范围',
      '- CTA 必须明确出现在文案中 · 必须含「关注」「私信」「点击」「获取」「领取」之一',
      '- ctaPosition 不能为空',
      '- 转化导向 · 每句话都服务于最终转化目标',
    ].join('\n');
  }

  private _buildBoomUserPrompt(userInput: CopywritingInput): string {
    const input = userInput as Record<string, unknown>;
    // R-14: theme/topic = 用户填写的主题(incidental 元数据) → piiMask
    // elements = 枚举数组 → 不动; industry = 行业分类 → 不动
    const maskedTheme = piiMask(String(input['theme'] ?? input['topic'] ?? '未指定'));
    return [
      '[5 篇结构化爆款文案候选任务]',
      '',
      `元素: ${JSON.stringify(input['elements'] ?? [])}`,
      `主题: ${maskedTheme}`,
      `行业: ${String(input['industry'] ?? '通用')}`,
      '',
      '请以 JSON 格式返回 5 个不同方向的候选文案，每篇包含完整的叙事弧：',
      '{',
      '  "candidates": [',
      '    {',
      '      "title": "标题（6-80字，点题有吸引力）",',
      '      "opening": "黄金3秒开头（≥40字，立即抓住注意力的钩子，触发强烈情绪反应）",',
      '      "development": "内容发展（≥40字，深化主题，给出有价值的信息或故事展开）",',
      '      "climax": "高潮/转折（≥40字，情绪或认知的最高点，点明核心价值或反转）",',
      '      "ending": "结尾/CTA（≥40字，明确行动引导，让用户有所行动）",',
      '      "reason": "爆款原因（≥20字，解释为何该方向能基于所选元素产生病毒传播效果）",',
      '      "indexScore": "爆款指数（如 8/10，基于元素契合度与传播潜力诚实自评）"',
      '    },',
      '    ...(共 5 个，各有不同的情绪切入和钩子角度)',
      '  ],',
      '  "metadata": {',
      '    "count": 5,',
      '    "elements": ["使用的元素"]',
      '  }',
      '}',
      '',
      '⚠️ 严格约束:',
      '- 必须正好 5 篇候选，candidates 数组长度 = 5',
      '- 每篇的 opening/development/climax/ending 各至少 40 字，合计不少于 300 字',
      '- 5 篇的钩子角度、情绪切入必须各不相同（如痛点型/数字冲击型/对比反差型/好奇悬念型/权威背书型）',
      '- reason 必须解释为何基于所选爆款元素该方向具有病毒传播潜力，至少 20 字',
      '- indexScore 格式为 "N/10"，基于元素契合度和传播潜力诚实评分，不得全部给 9 或 10',
      `- 所有内容必须围绕主题「${maskedTheme}」展开，融合所选爆款元素`,
    ].join('\n');
  }
}

// REJ-004: 单例 export — tRPC router 直接用此实例
export const copywritingAgent = new CopywritingAgent();
