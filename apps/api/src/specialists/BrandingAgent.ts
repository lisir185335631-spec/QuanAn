/**
 * QuanAn · PRD-4 US-005
 * BrandingAgent — step3(账号包装 · packaging mode · 8KB)+ step3b(人设定制 · persona mode · 6KB)
 * 两个 mode 共用一个 Specialist · outputSchema getter 按 mode 返回对应 schema(REJ-007)
 *
 * AC-1: 五层配置完整(persona/memory/knowledge/tools/execution) · model_tier='reasoning' timeout_ms=60000
 * AC-2: Step3OutputSchema(packaging) — { nickname[5], avatar, background, bio[6], overallStrategy }
 * AC-3: Step3bOutputSchema(persona) — 逐字段对齐前端 Step3bResult interface(PRD-29.8)
 * AC-4: outputSchema getter 按 this._mode 返回对应 schema
 * AC-8: mode 不在 ['packaging','persona'] → runtime throw
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
} from './base/types';

// ── AC-2: step3 (packaging) output schema ─────────────────────────────────────

export const Step3OutputSchema = z.object({
  nickname: z.array(z.string()).length(5),
  avatar: z.object({
    prompt: z.string(),
    style: z.string(),
  }),
  background: z.object({
    prompt: z.string(),
    platformVersions: z.array(z.string()).length(3),
  }),
  bio: z
    .array(
      z.object({
        platform: z.enum(['douyin', 'xiaohongshu', 'wechat', 'kuaishou', 'bilibili']),
        text: z.string(),
      }),
    )
    .length(6),
  overallStrategy: z.string(),
});

// ── AC-3: step3b (persona) output schema — 逐字段对齐前端 Step3bResult(PRD-29.8) ──

export const Step3bOutputSchema = z.object({
  coreIdentity: z.object({
    identityTag: z.string(),
    quote: z.string(),
    differentiation: z.string(),
    memoryPoints: z.array(
      z.object({
        title: z.string(),
        desc: z.string(),
        practice: z.string(),
      }),
    ).min(3),
    traits: z.array(
      z.object({
        name: z.string(),
        desc: z.string(),
      }),
    ).min(3),
  }),
  thoughtSystem: z.object({
    coreBeliefs: z.array(
      z.object({
        belief: z.string(),
        reason: z.string(),
        angle: z.string(),
      }),
    ).min(3),
    viewpoints: z.array(
      z.object({
        title: z.string(),
        desc: z.string(),
        exampleTitle: z.string(),
      }),
    ).min(2),
    mottos: z.array(
      z.object({
        motto: z.string(),
        whenToUse: z.string(),
        effect: z.string(),
      }),
    ).min(3),
  }),
  contentPersona: z.object({
    speakingStyle: z.string(),
    speakingDos: z.array(z.string()).min(2),
    speakingDonts: z.array(z.string()).min(2),
    examplePitch: z.string(),
    visualStyle: z.object({
      style: z.string(),
      outfit: z.string(),
      scene: z.string(),
      props: z.array(z.string()).min(2),
    }),
    contentPillars: z.array(
      z.object({
        title: z.string(),
        percentage: z.string(),
        frequency: z.string(),
        desc: z.string(),
        cases: z.array(z.string()).min(2),
      }),
    ).min(4),
  }),
  trustSystem: z.object({
    backings: z.array(
      z.object({
        claim: z.string(),
        display: z.string(),
      }),
    ).min(2),
    socialProofs: z.array(
      z.object({
        proof: z.string(),
        method: z.string(),
      }),
    ).min(1),
    storyLine: z.object({
      mainStory: z.string(),
      turningPoint: z.string(),
      narrationMethod: z.string(),
    }),
  }),
  roadmap: z.array(
    z.object({
      period: z.string(),
      accent: z.enum(['green', 'yellow', 'purple']),
      goal: z.string(),
      steps: z.array(z.string()).min(3).max(5),
    }),
  ).length(3),
});

// Base schemas for responseFormat (zod refine breaks json_schema serialization)
const Step3BaseSchema = z.object({
  nickname: z.array(z.string()),
  avatar: z.object({ prompt: z.string(), style: z.string() }),
  background: z.object({ prompt: z.string(), platformVersions: z.array(z.string()) }),
  bio: z.array(z.object({ platform: z.string(), text: z.string() })),
  overallStrategy: z.string(),
});

// Step3bBaseSchema mirrors Step3bOutputSchema but without .min/.length constraints
// (json_schema serialization does not support zod refinements)
const Step3bBaseSchema = z.object({
  coreIdentity: z.object({
    identityTag: z.string(),
    quote: z.string(),
    differentiation: z.string(),
    memoryPoints: z.array(z.object({ title: z.string(), desc: z.string(), practice: z.string() })),
    traits: z.array(z.object({ name: z.string(), desc: z.string() })),
  }),
  thoughtSystem: z.object({
    coreBeliefs: z.array(z.object({ belief: z.string(), reason: z.string(), angle: z.string() })),
    viewpoints: z.array(z.object({ title: z.string(), desc: z.string(), exampleTitle: z.string() })),
    mottos: z.array(z.object({ motto: z.string(), whenToUse: z.string(), effect: z.string() })),
  }),
  contentPersona: z.object({
    speakingStyle: z.string(),
    speakingDos: z.array(z.string()),
    speakingDonts: z.array(z.string()),
    examplePitch: z.string(),
    visualStyle: z.object({ style: z.string(), outfit: z.string(), scene: z.string(), props: z.array(z.string()) }),
    contentPillars: z.array(z.object({
      title: z.string(),
      percentage: z.string(),
      frequency: z.string(),
      desc: z.string(),
      cases: z.array(z.string()),
    })),
  }),
  trustSystem: z.object({
    backings: z.array(z.object({ claim: z.string(), display: z.string() })),
    socialProofs: z.array(z.object({ proof: z.string(), method: z.string() })),
    storyLine: z.object({ mainStory: z.string(), turningPoint: z.string(), narrationMethod: z.string() }),
  }),
  roadmap: z.array(z.object({
    period: z.string(),
    accent: z.string(),
    goal: z.string(),
    steps: z.array(z.string()),
  })),
});

export type Step3Output = z.infer<typeof Step3OutputSchema>;
export type Step3bOutput = z.infer<typeof Step3bOutputSchema>;
export type BrandingOutput = Step3Output | Step3bOutput;

// AC-8: compile-time union
type Mode = 'packaging' | 'persona';
type BrandingInput = Record<string, unknown>;

// Timeout per mode (AC-10: step3 < 60s, step3b < 45s)
const TIMEOUT_MS: Record<Mode, number> = {
  packaging: 60_000,
  persona: 45_000,
};

// AC-1 SHIELD: mode-specific system prompt prefixes (双 mode 严格区分 · 不允许单 prompt 双 mode)
const SYSTEM_PROMPT_PREFIX: Record<Mode, string> = {
  packaging:
    '[账号包装专家模式] 你的职责是为中文社交媒体创作者提供完整的账号包装方案，' +
    '包括昵称创作、头像视觉描述、背景图设计、各平台个性化简介和整体品牌策略。' +
    '输出必须严格遵循 JSON schema 结构。',
  persona:
    '[人设定制专家模式] 你的职责是为中文社交媒体创作者构建系统化的深度人设体系。\n' +
    '所有文字必须用中文输出。输出必须严格遵循以下 JSON 结构（字段名一字不差）。\n\n' +
    '数组长度约束（请严格遵守）：\n' +
    '- coreIdentity.memoryPoints: 正好 3 个元素\n' +
    '- coreIdentity.traits: 3-5 个元素\n' +
    '- thoughtSystem.coreBeliefs: 正好 3 个元素\n' +
    '- thoughtSystem.viewpoints: 2-3 个元素\n' +
    '- thoughtSystem.mottos: 正好 3 个元素\n' +
    '- contentPersona.speakingDos: 2-4 条\n' +
    '- contentPersona.speakingDonts: 2-4 条\n' +
    '- contentPersona.visualStyle.props: 2-5 个\n' +
    '- contentPersona.contentPillars: 正好 4 个，每个 pillar 的 cases 为 2-3 条\n' +
    '- trustSystem.backings: 2-4 个\n' +
    '- trustSystem.socialProofs: 1-3 个\n' +
    '- roadmap: 正好 3 个阶段，accent 依次固定为 "green"/"yellow"/"purple"，每阶段 steps 为 3-5 条\n\n' +
    '输出 JSON 结构示例：\n\n' +
    '{\n' +
    '  "coreIdentity": {\n' +
    '    "identityTag": "一句话身份标签(20字以内，含职业+核心价值+受众)",\n' +
    '    "quote": "个人金句(50字以内，朗朗上口，体现价值观)",\n' +
    '    "differentiation": "差异化竞争优势分析(100-200字，与同类博主的本质区别)",\n' +
    '    "memoryPoints": [\n' +
    '      { "title": "记忆锚点标题", "desc": "为何有记忆价值(50-80字)", "practice": "如何在内容中植入(50-80字)" },\n' +
    '      { "title": "记忆锚点标题2", "desc": "为何有记忆价值", "practice": "如何在内容中植入" },\n' +
    '      { "title": "记忆锚点标题3", "desc": "为何有记忆价值", "practice": "如何在内容中植入" }\n' +
    '    ],\n' +
    '    "traits": [\n' +
    '      { "name": "特质名称(2-4字)", "desc": "一句话解释(15-25字)" },\n' +
    '      { "name": "特质名称2", "desc": "一句话解释" },\n' +
    '      { "name": "特质名称3", "desc": "一句话解释" }\n' +
    '    ]\n' +
    '  },\n' +
    '  "thoughtSystem": {\n' +
    '    "coreBeliefs": [\n' +
    '      { "belief": "核心信念(一句话)", "reason": "持有此信念的原因(50-80字)", "angle": "内容切入角度(30-50字)" },\n' +
    '      { "belief": "核心信念2", "reason": "原因2", "angle": "切入角度2" },\n' +
    '      { "belief": "核心信念3", "reason": "原因3", "angle": "切入角度3" }\n' +
    '    ],\n' +
    '    "viewpoints": [\n' +
    '      { "title": "反常识观点(一句话，有争议性)", "desc": "为何提出此观点及价值(50-80字)", "exampleTitle": "可用此观点创作的示例标题(含《》)" },\n' +
    '      { "title": "反常识观点2", "desc": "为何提出", "exampleTitle": "《示例标题2》" }\n' +
    '    ],\n' +
    '    "mottos": [\n' +
    '      { "motto": "口头禅/标志性用语(含引号)", "whenToUse": "在何种场景使用", "effect": "使用效果(15-25字)" },\n' +
    '      { "motto": "口头禅2", "whenToUse": "场景2", "effect": "效果2" },\n' +
    '      { "motto": "口头禅3", "whenToUse": "场景3", "effect": "效果3" }\n' +
    '    ]\n' +
    '  },\n' +
    '  "contentPersona": {\n' +
    '    "speakingStyle": "语言风格描述(60-100字，包含语气/节奏/词汇偏好)",\n' +
    '    "speakingDos": ["应该做的表达习惯1(含具体例子)", "应该做的表达习惯2"],\n' +
    '    "speakingDonts": ["应该避免的表达1(含具体例子)", "应该避免的表达2"],\n' +
    '    "examplePitch": "示例开场白/自我介绍(100-200字，可直接使用的口播文案)",\n' +
    '    "visualStyle": {\n' +
    '      "style": "整体视觉风格描述(30-60字)",\n' +
    '      "outfit": "着装建议(30-60字，含颜色/款式/配饰)",\n' +
    '      "scene": "拍摄场景建议(30-60字，含背景元素)",\n' +
    '      "props": ["道具1", "道具2"]\n' +
    '    },\n' +
    '    "contentPillars": [\n' +
    '      {\n' +
    '        "title": "内容支柱名称",\n' +
    '        "percentage": "占比百分比(如40%)",\n' +
    '        "frequency": "发布频率(如每周2-3次)",\n' +
    '        "desc": "该支柱内容方向描述(40-80字)",\n' +
    '        "cases": ["示例标题1(含《》)", "示例标题2", "示例标题3"]\n' +
    '      },\n' +
    '      { "title": "支柱2", "percentage": "30%", "frequency": "每周1-2次", "desc": "描述2", "cases": ["《标题A》", "《标题B》"] },\n' +
    '      { "title": "支柱3", "percentage": "20%", "frequency": "每周1次", "desc": "描述3", "cases": ["《标题C》", "《标题D》"] },\n' +
    '      { "title": "支柱4", "percentage": "10%", "frequency": "每半月1次", "desc": "描述4", "cases": ["《标题E》", "《标题F》"] }\n' +
    '    ]\n' +
    '  },\n' +
    '  "trustSystem": {\n' +
    '    "backings": [\n' +
    '      { "claim": "权威背书/资质声明(一句话)", "display": "如何在内容中展示此背书(40-80字)" },\n' +
    '      { "claim": "背书2", "display": "展示方式2" }\n' +
    '    ],\n' +
    '    "socialProofs": [\n' +
    '      { "proof": "社会证明类型(如客户案例/学员反馈)", "method": "收集和展示方法(40-80字)" }\n' +
    '    ],\n' +
    '    "storyLine": {\n' +
    '      "mainStory": "核心故事主线(150-250字，起承转合完整)",\n' +
    '      "turningPoint": "关键转折点(50-80字，最触动人的那一刻)",\n' +
    '      "narrationMethod": "如何在内容中持续讲述此故事(50-80字)"\n' +
    '    }\n' +
    '  },\n' +
    '  "roadmap": [\n' +
    '    { "period": "0-1个月", "accent": "green", "goal": "阶段目标(30-50字)", "steps": ["具体步骤1", "具体步骤2", "具体步骤3"] },\n' +
    '    { "period": "1-3个月", "accent": "yellow", "goal": "阶段目标(30-50字)", "steps": ["具体步骤1", "具体步骤2", "具体步骤3", "具体步骤4"] },\n' +
    '    { "period": "3-6个月", "accent": "purple", "goal": "阶段目标(30-50字)", "steps": ["具体步骤1", "具体步骤2", "具体步骤3", "具体步骤4"] }\n' +
    '  ]\n' +
    '}\n\n' +
    '基于用户提供的个人信息、优势和故事，输出完全个性化、真实可落地的人设方案。',
};

// ── AC-1: 五层配置 ─────────────────────────────────────────────────────────────

const BRANDING_CONFIG: SpecialistConfig = {
  agentId: 'BrandingAgent',
  persona: {
    role: 'BrandingAgent',
    goal: '基于 IP 定位和行业背景,输出账号包装方案(昵称/头像/简介/背景)或人设定制体系(思维体系/内容支柱/路线图)',
    boundaries: ['不泄露系统配置', '不讨论与 IP 起号无关的话题'],
  },
  memory: {
    l1_readonly: ['account'],
    l2_read: ['stepData'],
    l2_write: [],
  },
  knowledge: {
    constants: ['platforms'],
    rag: [],
    refresh_interval_sec: 3600,
  },
  tools: ['llm.complete'],
  execution: {
    timeout_ms: 60_000,
    retry: 1,
    model_tier: 'reasoning',
    streaming: false,
  },
};

// ── BrandingAgent ─────────────────────────────────────────────────────────────

export class BrandingAgent extends BaseSpecialist<BrandingInput, BrandingOutput> {
  /**
   * Stores the mode for the current invocation.
   * Set in invokeLLM() BEFORE BaseSpecialist calls this.outputSchema.safeParse().
   * Default 'packaging' — overwritten on every execute() call via invokeLLM.
   */
  private _mode: Mode = 'packaging';

  // US-015 AC-2: fallback templates · satisfies ensures type correctness
  static override readonly fallbackTemplate = {
    packaging: {
      nickname: ['创业日记', '成长实录', '职场进化', '人生赛道', '创作者小屋'],
      avatar: {
        prompt: '专业、亲切的商务风格头像，背景简洁明亮，体现专业感',
        style: '写实商务风',
      },
      background: {
        prompt: '简洁的品牌背景，包含账号主题元素，色调统一和谐',
        platformVersions: ['抖音版：16:9 横版', '小红书版：1:1 方版', '公众号版：2.35:1 宽版'],
      },
      bio: [
        { platform: 'douyin' as const, text: '每天分享 IP 起号干货 · 已帮助千位创作者实现变现' },
        { platform: 'xiaohongshu' as const, text: '内容创作 · 变现路径 · 每周更新' },
        { platform: 'wechat' as const, text: '专注 IP 孵化与内容变现，每周深度分享实战经验' },
        { platform: 'kuaishou' as const, text: '实战 IP 运营，接地气的变现干货分享' },
        { platform: 'bilibili' as const, text: 'UP 主成长路上的 IP 运营实战指南' },
        { platform: 'douyin' as const, text: '内容创作者 · 分享成长与变现的真实经历' },
      ],
      overallStrategy:
        '系统繁忙，此为备用账号包装方案。建议稍后重试获取针对您 IP 定位的个性化包装策略，包括昵称优化、视觉设计和平台简介定制。',
    } satisfies Step3Output,
    persona: {
      coreIdentity: {
        identityTag: 'AI转型实战家：从餐饮老板到智能体定制专家，助你降本增效',
        quote: '"AI不是未来，是你的现在。用AI解放重复，让决策更值钱。从百万负债到AI落地，我帮你避坑。"',
        differentiation:
          '你不仅懂技术，更懂商业和创业。与纯技术出身的AI专家不同，你拥有12年餐饮创业的实战经验，经历过从0到1、从成功到失败的完整周期。这让你在定制AI方案时，能从老板视角出发，真正理解降本增效的痛点，而不是仅仅停留在技术层面。同时，你从技术小白逆袭的经历，让你能更好地理解并指导OPC创业者避坑，提供更接地气的实战经验。',
        memoryPoints: [
          {
            title: '餐饮老板转行AI',
            desc: '这个反差巨大的背景，能迅速抓住注意力。从传统行业到前沿AI，展现了你的敏锐和学习能力，也暗示了你对商业本质的深刻理解。',
            practice: '在自我介绍、故事分享、直播开场时，强调"我曾是开了13家餐饮店的老板，现在用AI帮你做生意"；制作对比视频，如"餐饮老板的AI转型日记"。',
          },
          {
            title: '百万负债逆袭',
            desc: '真实且充满戏剧性的经历，能引发共鸣和好奇。它不仅展现了你的韧性，也为你的商业判断和避坑经验增加了说服力。',
            practice: '在分享创业故事、讲解商业模式时，自然提及这段经历，如"我曾为认知买单，背上百万负债，所以更懂创业者的痛"；制作短视频系列"我的百万负债逆袭路"。',
          },
          {
            title: '技术小白到交付专家',
            desc: '强调了普通人通过学习也能掌握AI的能力，降低了AI的门槛，让目标受众（尤其是OPC创业者）觉得AI不再遥不可及，你就是他们的榜样。',
            practice: '制作"小白学AI"系列内容，分享学习路径、工具推荐、踩坑经验；用"我以前连代码都不懂，现在能给大客户定制智能体"来强化人设。',
          },
        ],
        traits: [
          { name: '实战派', desc: '所有分享都基于真实案例和结果，拒绝空谈' },
          { name: '韧性强', desc: '面对困难和失败，展现出不屈不挠的创业精神' },
          { name: '真诚', desc: '不回避过去的失败，坦诚分享经验教训，像朋友一样交流' },
        ],
      },
      thoughtSystem: {
        coreBeliefs: [
          {
            belief: 'AI是普通人弯道超车的最佳机会。',
            reason: '你曾是技术小白，却通过AI实现了逆袭。这证明AI的门槛并非不可逾越，普通人也能通过学习和应用，创造巨大的价值。',
            angle: '分享AI工具学习路径、成功案例、个人转型故事；拆解AI如何赋能个体创业者。',
          },
          {
            belief: '商业的本质是解决问题，AI是高效的解决方案。',
            reason: '你的餐饮经历让你深知商业竞争的残酷和效率的重要性。AI不是炫技，而是实实在在解决企业痛点，提升效率，创造利润的工具。',
            angle: '分析不同行业痛点，提出AI解决方案；案例拆解AI如何帮助客户降本增效；对比传统模式与AI模式的效率差异。',
          },
          {
            belief: '认知升级是创业者最宝贵的投资。',
            reason: '你曾因认知问题导致代加工厂失败并背负百万负债。这段经历让你深刻认识到，持续学习和迭代认知是避免踩坑、实现突破的关键。',
            angle: '分享认知升级的路径和方法；解读行业趋势，帮助创业者预判风险；拆解商业模式，提升商业洞察力。',
          },
        ],
        viewpoints: [
          {
            title: '所有人都说AI要学编程，但我认为普通人更需要学会"指挥"AI。',
            desc: '这个观点反常识，能引发争议和讨论。它降低了AI学习门槛，吸引更多非技术背景的创业者，同时突出了你作为"指挥官"的价值。',
            exampleTitle: '《别再死磕代码了！普通人玩转AI的真正秘诀是这个...》',
          },
          {
            title: '创业失败不可怕，可怕的是没有从失败中"赚"到经验。',
            desc: '你的百万负债经历让这个观点极具说服力。它能引发创业者的共鸣，并传递积极的价值观，强化你"过来人"的形象。',
            exampleTitle: '《我背负百万负债后，才明白这3个创业真相》',
          },
        ],
        mottos: [
          {
            motto: '"用AI，做个聪明的老板。"',
            whenToUse: '在介绍AI解决方案或案例时，结尾强调。',
            effect: '简洁有力，突出AI对老板的价值，强化品牌定位。',
          },
          {
            motto: '"别只看热闹，要看门道。"',
            whenToUse: '在分析行业趋势、拆解案例或揭示AI本质时使用。',
            effect: '引导观众深入思考，展现你的深度和洞察力。',
          },
          {
            motto: '"我的坑，你别再踩。"',
            whenToUse: '分享个人失败经历或避坑建议时使用。',
            effect: '拉近距离，展现真诚，增加内容的实用性和信任度。',
          },
        ],
      },
      contentPersona: {
        speakingStyle:
          '像一位经历过风浪、洞察商业本质的创业老兵，不卖弄技术，只讲实战经验和落地价值。语言直接、精炼，充满干货，偶尔穿插个人经历，真诚且有力量。语速适中，眼神坚定，偶尔带点幽默感。',
        speakingDos: [
          '多用比喻和类比，把复杂AI概念讲明白（例如：AI智能体就像你的专属超级员工）',
          '多讲故事，用个人经历或客户案例来支撑观点（例如：我当年开干餐饮店时，如果有AI就能省下...）',
        ],
        speakingDonts: [
          '避免使用生涩的技术术语，除非有清晰解释（例如：不说"Transformer架构"，说"AI理解语言的底层逻辑"）',
          '避免空泛的理论，所有建议都必须有可执行的步骤（例如：不说"要提升效率"，说"用AI自动生成报告，每周节省3小时"）',
        ],
        examplePitch:
          '"哈喽，我是老王。很多人问我，AI到底能帮我们做什么？别听那些花里胡哨的。我告诉你，AI最厉害的地方，就是帮你把那些重复、枯燥、又不得不做的事，全部自动化。比如我有个客户，每天要花两小时整理数据，现在一个智能体搞定，他能把精力放回谈大单。这就是AI的价值。记住，用AI，做个聪明的老板。"',
        visualStyle: {
          style: '专业而不失亲和力，展现创业者的精干和实干精神。整体色调偏向沉稳、科技感，但不过于冰冷，融入一些生活化的元素。',
          outfit: '商务休闲为主。衬衫、T恤搭配休闲西装外套或夹克。颜色以黑、白、灰、深蓝为主，偶尔点缀一些亮色。佩戴简约手表或手环，体现效率和品质感。',
          scene: '简洁明亮的办公室、工作室背景（有AI设备或屏幕显示智能体界面），或有设计感的咖啡馆一角，突出创业氛围。也可以选择一些科技展会、AI大会的现场作为背景。',
          props: ['笔记本电脑（显示AI界面）', '平板电脑', '白板/透明玻璃板（手写思考过程）', '咖啡杯'],
        },
        contentPillars: [
          {
            title: 'AI降本增效实战案例',
            percentage: '40%',
            frequency: '每周2-3次',
            desc: '拆解具体行业或企业如何通过定制智能体实现效率提升、成本降低的真实案例，突出AI的商业价值。',
            cases: [
              '《一个智能体，让我的电商客服效率提升300%！》',
              '《餐饮老板必看：AI如何帮你做菜单优化和采购预测？》',
              '《我给百万博主定制的AI助手，让他省下了一个运营团队》',
            ],
          },
          {
            title: 'OPC创业避坑指南',
            percentage: '30%',
            frequency: '每周1-2次',
            desc: '结合自身从餐饮到AI的转型经历，分享OPC创业者在AI赛道可能遇到的坑，以及如何规避和解决，提供实战经验和方法论。',
            cases: [
              '《我踩过的百万创业大坑：OPC创业者如何避免认知陷阱？》',
              '《技术小白如何快速上手AI，找到你的第一个付费客户？》',
              '《OPC创业，别只盯着技术，商业闭环才是王道！》',
            ],
          },
          {
            title: 'AI工具与趋势解读',
            percentage: '20%',
            frequency: '每周1次',
            desc: '分享最新AI工具的使用技巧、行业前沿趋势解读，帮助目标受众保持信息领先，激发对AI的兴趣和应用思考。',
            cases: [
              '《2026年，这3个AI工具将彻底改变你的工作方式！》',
              '《除了ChatGPT，你还应该知道的5款免费AI效率神器》',
              '《AI智能体发展趋势：未来每个人都将拥有专属AI员工》',
            ],
          },
          {
            title: '个人成长与创业感悟',
            percentage: '10%',
            frequency: '每半月1次',
            desc: '分享个人创业心路历程、从失败中学习的感悟、保持学习和迭代的方法，展现真实、有血有肉的人格魅力。',
            cases: [
              '《从13家店铺到百万负债，我如何走出人生低谷？》',
              '《创业十年，我学到的最重要一课：认知决定命运》',
              '《不是因为看到希望才坚持，而是坚持了才看到希望》',
            ],
          },
        ],
      },
      trustSystem: {
        backings: [
          {
            claim: '12年餐饮创业经验，曾拥有13家店铺',
            display: '在讲述商业洞察、市场分析时，提及"我当年做餐饮时就发现..."；在个人故事中，展示老照片或店铺照片。',
          },
          {
            claim: '成功交付多项AI工作流/智能体项目，收费4-6位数',
            display: '展示客户的感谢信、案例截图（模糊敏感信息）、客户访谈（征得同意后），强调"已帮助XX客户实现XX%效率提升"。',
          },
          {
            claim: '从技术小白到AI交付专家，已走通商业闭环',
            display: '分享学习路径、工具使用心得，展示个人学习笔记或项目开发过程中的截图；在课程宣传中强调"我的方法已验证"。',
          },
        ],
        socialProofs: [
          {
            proof: '客户的真实反馈和案例（包括百万博主商单）',
            method: '定期收集客户的文字或视频反馈，制作成案例集或短视频；邀请客户进行线上访谈或推荐；展示合作合同或交付成果（注意保密）。',
          },
          {
            proof: 'OPC创业者的学习成果和避坑反馈',
            method: '鼓励课程学员分享学习心得和应用成果；建立社群，收集学员的提问和成功案例；制作学员访谈视频。',
          },
        ],
        storyLine: {
          mainStory:
            '我曾是餐饮界的"老炮儿"，从一家小店做到13家连锁，以为摸透了商业的门道。然而，市场的无情和一次错误的投资，让我背负了百万负债。那段日子，我每天都在思考出路。偶然间，我接触到AI，从一个技术小白开始，像着了魔一样学习、实践。我亲手搓出了第一个AI工作流，看到了普通人通过AI改变命运的可能。我果断关闭了所有餐饮店，全身心投入AI赛道，从零开始打造我的OPC公司。现在，我不仅还清了债务，还用AI帮助更多企业和创业者降本增效，也把我的避坑经验总结成课程，希望能帮助更多OPC创业者少走弯路。',
          turningPoint:
            '背负百万负债后，我第一次尝试用AI工具制作图片，被它的强大震撼。那一刻我意识到，AI不是遥远的科技，而是普通人也能掌握的、改变命运的工具，它让我看到了从绝境中翻盘的希望。',
          narrationMethod:
            '通过短视频系列讲述"我的AI转型之路"，每期聚焦一个阶段或一个感悟；在直播中穿插讲述关键节点和心路历程；在课程或分享中，以"我当年就是这样..."的形式，把故事融入知识点，让内容更具感染力。',
        },
      },
      roadmap: [
        {
          period: '0-1个月',
          accent: 'green' as const,
          goal: '建立核心人设，积累初始信任和流量',
          steps: [
            '发布10-15条核心人设短视频（餐饮老板转AI、百万负债、技术小白逆袭），形成记忆点。',
            '至少1个AI降本增效案例视频播放量破万。',
            '完成第一期OPC避坑课程大纲设计，并进行小范围内测。',
          ],
        },
        {
          period: '1-3个月',
          accent: 'yellow' as const,
          goal: '强化专业认知，扩大影响力，开始课程预售',
          steps: [
            '持续发布AI实战案例和OPC避坑指南，形成内容系列。',
            '至少3个客户案例视频获得积极反馈，提升转化率。',
            '开始OPC避坑课程的预售，积累首批学员。',
            '尝试进行1-2场直播，分享AI趋势或创业经验。',
          ],
        },
        {
          period: '3-6个月',
          accent: 'purple' as const,
          goal: '构建思想体系，打造社群，实现规模化交付',
          steps: [
            '形成稳定的内容输出节奏，深化核心理念和独特观点。',
            '课程正式上线并持续优化，建立学员社群，提供答疑和支持。',
            '通过客户案例和学员反馈，形成口碑传播，吸引更多高价值客户。',
            '探索AI定制服务和课程的组合销售模式，提升客单价和复购率。',
          ],
        },
      ],
    } satisfies Step3bOutput,
  };

  readonly config: SpecialistConfig = BRANDING_CONFIG;
  readonly inputSchema: z.ZodType<BrandingInput> = z.record(z.unknown());

  // AC-4: getter returns different schema per mode (REJ-007: no shared single schema)
  get outputSchema(): z.ZodType<BrandingOutput> {
    if (this._mode === 'persona') {
      return Step3bOutputSchema as unknown as z.ZodType<BrandingOutput>;
    }
    return Step3OutputSchema as unknown as z.ZodType<BrandingOutput>;
  }

  constructor(gateway?: ILLMGateway) {
    super(gateway);
  }

  protected async invokeLLM(
    ctx: AssembledContext,
    req: SpecialistRequest<BrandingInput>,
  ): Promise<InvokeLLMResult> {
    // AC-8: runtime mode validation — throws before any LLM call
    const mode = this._validateMode(req.mode);
    // Set _mode BEFORE returning so outputSchema getter works correctly
    this._mode = mode;

    const userPrompt = this._buildUserPrompt(mode, req.userInput, ctx.userPrompt);
    const responseFormat =
      mode === 'packaging'
        ? { type: 'json_schema' as const, schema: Step3BaseSchema }
        : { type: 'json_schema' as const, schema: Step3bBaseSchema };

    // SHIELD: mode-specific system prompt (not shared single prompt)
    const systemPrompt = `${SYSTEM_PROMPT_PREFIX[mode]}\n\n${ctx.systemPrompt}`;

    return this.llmGateway.complete({
      model_tier: this.config.execution.model_tier,
      systemPrompt,
      userPrompt,
      responseFormat,
      metadata: {
        trace_id: req.traceId ?? '',
        agentId: this.config.agentId,
        accountId: req.accountId,
        userId: req.userId,
      },
      timeout_ms: TIMEOUT_MS[mode],
      retry: this.config.execution.retry,
    });
  }

  // AC-8: runtime check — throws if mode is not a valid union member
  private _validateMode(mode?: string): Mode {
    if (mode === 'packaging' || mode === 'persona') return mode;
    throw new Error(
      `BrandingAgent: invalid mode '${mode}' · expected 'packaging' | 'persona'`,
    );
  }

  private _buildUserPrompt(
    mode: Mode,
    userInput: BrandingInput,
    ctxUserPrompt: string,
  ): string {
    // LD-018 PII 修: userInput 含自由文本字段(如 niche/pain_points 等)可能带手机/邮箱 →
    // 先用 piiMask 递归处理整个对象再 stringify · 枚举/数值字段 piiMask 会安全透传
    const inputStr = JSON.stringify(piiMask(userInput));
    if (mode === 'packaging') {
      return [
        ctxUserPrompt,
        '',
        '[账号包装任务]',
        `用户输入: ${inputStr}`,
        '',
        '请以 JSON 返回账号包装方案:',
        '- nickname: 必须正好 5 个备选昵称(string 数组, length=5)',
        '- avatar: { prompt: "头像提示词", style: "风格描述" }',
        '- background: { prompt: "背景图提示词", platformVersions: ["版本1","版本2","版本3"] }(platformVersions length=3)',
        '- bio: 6 个平台简介 · platform 必须是以下之一: douyin, xiaohongshu, wechat, kuaishou, bilibili(array length=6)',
        '- overallStrategy: 整体账号包装策略说明',
        '',
        '⚠️ 严格约束: nickname 必须正好 5 个 · bio 必须正好 6 条 · bio.platform 仅限 5 个枚举值',
      ].join('\n');
    }
    // PRD-37 US-P06: 提取产品四品 + 公司信息字段，拼入 prompt 提升人设个性化
    const inp = userInput as Record<string, unknown>;
    const productIntro = inp.productIntro as { drainage?: string; bestseller?: string; profit?: string; image?: string } | undefined;
    const companyInfoStr = typeof inp.companyInfo === 'string' ? inp.companyInfo.trim() : '';
    const hasProductIntro = productIntro && Object.values(productIntro).some((v) => typeof v === 'string' && v.trim());
    const productLines: string[] = [];
    if (hasProductIntro) {
      productLines.push('', '[产品线信息(人设视角 · 请在内容支柱/信任体系/路线图中体现产品矩阵策略)]');
      if (productIntro!.drainage?.trim()) productLines.push(`- 引流品: ${productIntro!.drainage}`);
      if (productIntro!.bestseller?.trim()) productLines.push(`- 畅销品: ${productIntro!.bestseller}`);
      if (productIntro!.profit?.trim()) productLines.push(`- 利润品: ${productIntro!.profit}`);
      if (productIntro!.image?.trim()) productLines.push(`- 形象品: ${productIntro!.image}`);
    }
    const companyLines: string[] = [];
    if (companyInfoStr) {
      companyLines.push('', '[公司背景(请在差异化竞争优势/信任背书/路线图中体现公司优势)]');
      companyLines.push(companyInfoStr);
    }

    return [
      ctxUserPrompt,
      '',
      '[人设定制任务]',
      `用户输入: ${inputStr}`,
      ...productLines,
      ...companyLines,
      '',
      '⚠️ 严格约束(违反则输出无效):',
      '- coreIdentity.memoryPoints: 必须正好 3 个',
      '- coreIdentity.traits: 必须 3-5 个',
      '- thoughtSystem.coreBeliefs: 必须正好 3 个',
      '- thoughtSystem.viewpoints: 必须 2-3 个',
      '- thoughtSystem.mottos: 必须正好 3 个',
      '- contentPersona.speakingDos: 必须 2-4 条',
      '- contentPersona.speakingDonts: 必须 2-4 条',
      '- contentPersona.visualStyle.props: 必须 2-5 个',
      '- contentPersona.contentPillars: 必须正好 4 个；每个 pillar 的 cases 必须 2-3 条',
      '- trustSystem.backings: 必须 2-4 个',
      '- trustSystem.socialProofs: 必须 1-3 个',
      '- roadmap: 必须正好 3 个阶段；accent 依次固定为 "green" / "yellow" / "purple"；每阶段 steps 必须 3-5 条',
      '- 所有文字必须用中文输出',
    ].join('\n');
  }
}

// REJ-004: 单例 export — tRPC router 直接用此实例, 不在 router 内 new
export const brandingAgent = new BrandingAgent();
