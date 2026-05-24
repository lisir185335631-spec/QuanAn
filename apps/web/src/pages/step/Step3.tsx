import { type FormEvent, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { AvatarDesignSection, type AvatarDesignContent } from '@/components/step3/AvatarDesignSection';
import { BackgroundImageDesignSection, type BackgroundImageContent } from '@/components/step3/BackgroundImageDesignSection';
import { IntroCopySection, type IntroCopyEntry } from '@/components/step3/IntroCopySection';
import { NicknameRecommendSection, type NicknameEvaluation, type NicknameSelectionStrategy } from '@/components/step3/NicknameRecommendSection';
import { OverallStrategySection, type OverallStrategyContent } from '@/components/step3/OverallStrategySection';
import { Step3Form } from '@/components/step3/Step3Form';
import { Step3LoadingState } from '@/components/step3/Step3LoadingState';
import { Step3PageHeader, Step3SectionDivider } from '@/components/step3/Step3PageHeader';
import { VideoReferenceCaseSection, type VideoReferenceCase } from '@/components/step3/VideoReferenceCaseSection';
import { useActiveAccount } from '@/hooks/useActiveAccount';
import { readOtherStep, useStepData } from '@/hooks/useStepData';
import { trpc } from '@/lib/trpc';

// ── AC-5: stub result shape (D-292 锁 · 6 sections always renderable) ────────

interface Step3Result {
  videoReferences: VideoReferenceCase[];
  nicknames: NicknameEvaluation[];
  nicknameStrategy?: NicknameSelectionStrategy;
  avatar: AvatarDesignContent;
  background: BackgroundImageContent;
  bioFormula?: string;
  bioEntries: IntroCopyEntry[];
  // 图 13 末尾 · 整个 H3-5 共享的 5 个核心关键词
  bioCoreKeywords?: string[];
  overallStrategy: OverallStrategyContent;
}

// PRD-29.7 · AC-5: mock fallback 1:1 字面复刻 aiipznt sally zhao /step/3 真实输出
// (3 张截图全部文字逐字嵌入 · 智能体 / 软件开发 / opc 培训行业 · 不是美业)
function generateMockResult(): Step3Result {
  return {
    // ── H3-1 视频参考案例 (3 个参考) ───────────────────────────────────────
    videoReferences: [
      {
        title: '美业头部账号主页参考',
        description: '观察头部账号的头像、昵称、背景图、简介的整体搭配效果',
        searchHint: '美业 头部账号',
        platform: '抖音',
      },
      {
        title: '高转化率账号包装案例',
        description: '分析高转化率账号如何通过主页包装吸引精准粉丝',
        searchHint: '美业 账号包装',
        platform: '小红书',
      },
      {
        title: '爆款简介文案参考',
        description: '学习爆款账号如何用简介文案建立信任感和专业度',
        searchHint: '美业 简介文案',
        platform: '视频号',
      },
    ],

    // ── H3-2 昵称推荐 (5 个备选) ──────────────────────────────────────────
    nicknames: [
      {
        name: '智能体老王',
        description: '结合行业核心词"智能体"和亲切的姓氏"老王"，易记、接地气，且暗示经验丰富。"老王"自带信任感和专业度，能快速拉近与企业老板和创业者的距离。',
        searchability: '高。"智能体"是核心关键词，"老王"作为常见称谓，组合后辨识度高，便于搜索和记忆。',
        tags: ['智能体', '老王', '亲切'],
      },
      {
        name: 'AI定制师老高',
        description: '直接点明"AI定制师"的专业身份，强调定制服务。"老高"同样是亲切且有经验感的称呼，符合目标受众对专业人士的期待。',
        searchability: '中高。"AI定制师"是精准关键词，但"老高"可能存在同名情况，需配合头像和简介强化识别。',
        tags: ['AI定制师', '老高', '专业'],
      },
      {
        name: '智能体架构师高',
        description: '"架构师"一词更显技术深度和系统性，定位高端，符合企业级定制的专业形象。"高"作为姓氏，简洁有力。',
        searchability: '中。智能体架构师专业性强，能吸引精准流量，但姓氏"高"略显普通，需配合内容输出强化IP。',
        tags: ['架构师', '高端', '技术'],
      },
      {
        name: '高老板的智能体',
        description: '以"高老板"自称，直接对话企业老板和创业者，强调自身也是老板，理解他们的痛点，增强共鸣。"智能体"明确服务内容。',
        searchability: '中。"高老板"具有一定辨识度，"智能体"是核心业务，组合起来能吸引对定制服务感兴趣的客户。',
        tags: ['高老板', '共鸣', '服务'],
      },
      {
        name: 'AI赋能者老高',
        description: '"赋能者"强调为客户带来价值和能力提升，更具商业价值导向，符合企业老板追求降本增效的需求。"老高"保持亲切感。',
        searchability: '中高。"AI赋能者"是高价值关键词，"老高"增加记忆点，有助于在同类账号中脱颖而出。',
        tags: ['赋能', '价值', '老高'],
      },
    ],
    nicknameStrategy: {
      hint: '',
      chips: [],
      principles: [
        '专业性与亲和力结合：昵称中包含行业关键词（智能体、AI定制），同时使用姓氏或老X增加亲近感，降低沟通门槛。',
        '目标受众导向：直接或间接点明服务对象（老板、创业者），让目标客户一眼识别，产生共鸣。',
        '简洁易记：避免冗长复杂的昵称，控制在4-6个字，便于传播和记忆。',
        '突出价值：昵称中暗示能为客户带来的核心价值（定制、赋能、解决问题）。',
      ],
      avoidances: [
        '纯数字/字母组合：缺乏辨识度，不易记忆，无法传达专业感。',
        '过于口语化/娱乐化：不符合企业级服务和专业培训的严肃性，影响信任感。',
        '与行业无关的词汇：无法让用户快速理解账号内容，浪费曝光机会。',
        '包含特殊符号：影响搜索和传播，显得不专业。',
      ],
      note: '抖音昵称更强调口语化和记忆点，可以适当加入"老X"等称谓。小红书可更偏向专业人设或个人成长，例如"高总AI成长记"。视频号昵称可与微信名保持一致，强化个人品牌。',
    },

    // ── H3-3 头像设计方案 ─────────────────────────────────────────────────
    avatar: {
      风格: '专业、自信、有亲和力的商务形象。选择这种风格是因为它能有效传达信任感和专业度，符合企业老板和创业者对合作伙伴的期待，避免过于休闲或技术宅的刻板印象。',
      配色方案: '主色调：深蓝色（代表科技、专业、信任）或高级灰（代表沉稳、智慧）。辅色调：少量亮色如金色或橙色（代表活力、创新、成功）。',
      主色调: '深蓝色（代表科技、专业、信任）或高级灰（代表沉稳、智慧）',
      辅色调: '少量亮色如金色或橙色（代表活力、创新、成功）',
      心理学依据: '深蓝色能增强信任感，高级灰提升专业度，亮色点缀则能吸引注意力，避免沉闷。',
      '表情/姿态': '微笑，眼神真诚且专注。微笑能拉近距离，展现亲和力；专注的眼神则传达出专业和可靠，让用户感受到你的认真和投入。',
      '服装/造型': '商务休闲装，如衬衫或西服外套，显得专业且不失亲和。',
      背景设计: '纯色或轻质感渐变，避免杂乱背景，突出人物主体。',
      参考案例: '参考同行业或商业咨询类成功账号，他们的头像通常是面带微笑的半身照，服装得体，背景简洁，眼神自信，传达出专业、可靠、值得信赖的形象。例如一些知名商业顾问或企业家的抖音头像。',
      必含元素: [
        { title: '个人半身照', desc: '清晰展现面部表情，眼神坚定自信，穿着商务休闲装，如衬衫或西服外套，显得专业且不失亲和。这是建立个人IP最直接有效的方式。' },
        { title: '背景模糊化或纯色', desc: '避免杂乱背景分散注意力，突出人物主体。纯色背景（如深蓝、高级灰）能强化专业感。' },
      ],
      禁忌: [
        { title: '自拍照', desc: '角度随意，缺乏专业感。' },
        { title: '卡通头像/风景图', desc: '无法建立个人IP，降低信任度。' },
        { title: '多人合照', desc: '模糊主体，让用户无法识别。' },
        { title: '过度美颜/滤镜', desc: '显得不真实，影响专业形象。' },
      ],
      aiPrompt:
        'A professional headshot of a confident Asian man in his late 30s, wearing a smart business casual outfit (e.g., a dark blue blazer over a light shirt). He has a genuine, approachable smile and direct eye contact. The background is a soft, out-of-focus gradient of deep blue and charcoal gray, with subtle technological elements like abstract circuit lines or glowing data streams. Studio lighting, high resolution, sharp focus on the subject.',
    },

    // ── H3-4 背景图设计方案 ───────────────────────────────────────────────
    background: {
      风格理念: '科技感与商业价值结合的风格。选择这种风格是为了在视觉上体现AI智能体业务的科技属性，同时通过简洁的设计传达商业价值，避免过于冰冷的技术感。',
      布局结构: '左侧放置个人IP核心Slogan或价值主张，右侧或下方放置服务关键词和联系方式。这种布局符合用户从左到右的阅读习惯，先看到价值，再了解服务和行动路径。',
      色调: '主色调：深蓝、科技灰、墨绿。辅色调：少量亮色如金色或浅蓝。整体偏冷色调，营造科技、专业、信任感；但通过少量亮色提升活力和现代性。例如，深蓝色背景搭配白色或浅金色文字。',
      主色调: '深蓝、科技灰、墨绿',
      辅色调: '少量亮色如金色或浅蓝',
      品牌元素: '抽象的科技网络结构、数据流、芯片纹理等科技感元素，以低饱和度、半透明方式呈现，巧妙增强视觉感。',
      '字体/icon': '现代无衬线字体（如思源黑体 / Inter） + 科技感线性 icon · 字号大、留白足、对比强',
      分镜建议: '抖音 1920x1080 / 小红书 1242x208 / 视频号 1242x208 · 3 平台尺寸独立适配',
      文案内容: [
        { title: '核心Slogan', desc: '一句精炼的话表达你的价值主张，如"AI智能体，企业增长引擎"，这是吸引用户停留的核心。' },
        { title: '服务关键词', desc: '明确你的服务内容，如"定制智能体 | OPC培训 | AI工作流"，让用户快速了解你能提供什么。' },
        { title: '联系方式/引流钩子', desc: '例如"添加微信领取免费AI诊断"，鼓励智能体咨询课程体验，建立后续转化的关键一步。' },
        { title: '科技感元素', desc: '抽象的科技网络结构、数据流、芯片纹理等，以低饱和度、半透明方式呈现，巧妙增强视觉感。' },
      ],
      必含元素: [
        { title: '核心Slogan', desc: '一句精炼的话表达你的价值主张。' },
        { title: '服务关键词', desc: '明确你提供的服务内容。' },
        { title: '联系方式/引流钩子', desc: '引导用户主动联系或体验。' },
        { title: '科技感元素', desc: '增强视觉专业度。' },
      ],
      平台适配: [
        {
          platform: '抖音',
          size: '1920x1080像素',
          desc: '突出个人IP和核心服务的视觉冲击力，文字大而清晰，适合短视频用户快速浏览，搭配视觉化关键字，提高曝光与点击。',
        },
        {
          platform: '小红书',
          size: '1242x208像素',
          desc: '小红书背景图通常较精致和明亮，可以加入更多个性化元素，文字简洁，搭配关键词。',
        },
        {
          platform: '视频号',
          size: '1242x208像素',
          desc: '视频号背景图风格可与社交属性结合，可适当加入引导关注或互动元素，文字内容要简洁，加强视频播放页面客户。',
        },
      ],
      aiPrompt:
        "A sophisticated and modern banner image for an AI intelligent agent customization company. The design should feature abstract, glowing neural network patterns or data streams in deep blue and purple hues, subtly integrated into a dark, professional background. On the left side, bold, clean white text states 'AI Intelligent Agents: Boost Efficiency, Seize Opportunities!' Below it, smaller text reads 'Custom AI Agents | OPC Training | Workflow Automation'. The overall feel is high-tech, trustworthy, and forward-thinking.",
    },

    // ── H3-5 简介文案方案 ─────────────────────────────────────────────────
    bioFormula:
      '【身份/背景亮点】+【核心业务/服务】+【客户价值/信任背书】+【目标受众/解决方案】+【明确行动号召/引流钩子】。这个公式确保简介信息全面，既能吸引眼球，又能传递信任，并引导用户进一步行动，实现从了解到转化的闭环。',
    bioEntries: [
      {
        platformKey: 'douyin_main',
        platformLabel: '抖音（主号）：专业人设号',
        copy: '12年餐饮老板转型AI，负债百万到智能体架构师。\n专注：企业/个人智能体定制 | AI工作流。\n已助多位老板降本增效，实现利润倍增。\nOPC创业者，逆袭指南，助你从0到1。\n私信【智能体】免费诊断，定制专属方案。',
        hashtags: [],
        evaluation: '',
        structureExplain: [
          '第一行：个人经历亮点，吸引眼球，建立人设。',
          '第二行：核心业务定位，明确服务内容。',
          '第三行：客户价值与成果，建立信任背书。',
          '第四行：针对OPC创业者的解决方案，扩大受众。',
          '第五行：明确的引流钩子和行动号召，降低用户转化门槛。',
        ],
        lineHighlights: [
          '12年餐饮老板转型AI，负债百万到智能体架构师：强烈的个人故事和转型经历，引发用户好奇和共鸣，证明韧性和学习能力。',
          '已助多位老板降本增效，实现利润倍增：直接展示客户价值和成果，增强信任感和吸引力。',
          '私信【智能体】免费诊断，定制专属方案：明确的引流钩子和行动指令，降低用户转化门槛。',
        ],
        seoKeywords: ['智能体定制', 'AI工作流', '企业降本增效', '私信【智能体】', 'OPC创业', 'AI创业'],
      },
      {
        platformKey: 'douyin_sub',
        platformLabel: '抖音（副号）：生活记录号',
        copy: '高总：餐饮老板转型AI的真实记录。\n分享：AI学习心得 | 创业感悟 | 负债翻身。\n从技术小白到智能体交付，我的成长之路。\n不定期直播，聊聊AI与商业的未来。\n关注我，一起探索AI新机遇。',
        hashtags: [],
        evaluation: '',
        structureExplain: [
          '第一行：个人身份与账号定位。',
          '第二行：分享内容方向，吸引关注。',
          '第三行：个人成长路径，建立人设。',
          '第四行：互动形式预告，增加粘性。',
          '第五行：号召关注，点明价值。',
        ],
        lineHighlights: [
          '餐饮老板转型AI的真实记录：强调真实性和个人经历，吸引对转型故事感兴趣的用户。',
          '从技术小白到智能体交付，我的成长之路：展现学习能力和实践成果，激励同类创业者。',
          '不定期直播，聊聊AI与商业的未来：预告互动形式，增加用户期待和粘性。',
        ],
        seoKeywords: ['AI学习', '创业感悟', '个人成长', 'AI商业', '转型故事'],
      },
      {
        platformKey: 'xhs_knowledge',
        platformLabel: '小红书（主号）：干货种草号',
        copy: '🔥AI智能体实战派 | 助你打造专属AI工作流。\n🎯企业降本增效，个人创业提速，AI是关键。\n💡分享：智能体搭建教程 | AI工具推荐 | 商业案例。\n🚫避坑指南：OPC创业如何少走弯路。\n➕关注我，解锁AI生产力，实现财富自由。',
        hashtags: [],
        evaluation: '',
        structureExplain: [
          '第一行：核心身份与价值主张，带表情符号吸引注意。',
          '第二行：明确AI的关键作用，引发共鸣。',
          '第三行：具体分享内容，突出干货属性。',
          '第四行：针对痛点提供解决方案，建立信任。',
          '第五行：行动号召，点明长期价值。',
        ],
        lineHighlights: [
          '🔥AI智能体实战派 | 助你打造专属AI工作流：直接点明专业性和实用价值，适合小红书干货分享的氛围。',
          '💡分享：智能体搭建教程 | AI工具推荐 | 商业案例：具体列出干货内容，吸引精准用户。',
          '🚫避坑指南：OPC创业如何少走弯路：击中OPC创业者的痛点，提供解决方案，建立专家形象。',
        ],
        seoKeywords: ['AI智能体', 'AI工作流', '企业提效', 'OPC创业避坑', 'AI工具'],
      },
      {
        platformKey: 'xhs_personal',
        platformLabel: '小红书（副号）：创始人IP号',
        copy: '高总：12年餐饮老板，AI赛道二次创业者。\n📖我的AI学习笔记 | 商业思考 | 个人成长。\n从负债百万到AI智能体公司创始人，真实经历。\n⚡不设限的人生，持续迭代，永远在路上。\n评论区聊聊你的AI创业困惑。',
        hashtags: [],
        evaluation: '',
        structureExplain: [
          '第一行：个人身份与背景，建立人设。',
          '第二行：分享内容方向，偏向个人感悟和思考。',
          '第三行：核心人生经历，增强故事性。',
          '第四行：个人价值观表达，吸引同频用户。',
          '第五行：互动引导，增加用户参与。',
        ],
        lineHighlights: [
          '12年餐饮老板，AI赛道二次创业者：强调个人经历和创业精神，吸引对个人成长和创业故事感兴趣的用户。',
          '从负债百万到AI智能体公司创始人，真实经历：强烈的个人故事，展现韧性和成功，引发共鸣。',
          '评论区聊聊你的AI创业困惑：鼓励互动，建立社区感。',
        ],
        seoKeywords: ['AI创业', '个人成长', '商业思考', '转型故事', '创始人'],
      },
      {
        platformKey: 'sph_quality',
        platformLabel: '视频号（主号）：品牌宣传号',
        copy: '高总：智能体定制专家 | 企业AI工作流赋能者。\n✅已服务多家企业，实现AI降本增效。\n📽️直播：智能体最新趋势 | 客户案例分享。\n点击下方链接，获取专属AI解决方案。\n私信【智能体】预约免费咨询。',
        hashtags: [],
        evaluation: '',
        structureExplain: [
          '第一行：核心身份与专业定位。',
          '第二行：信任背书与成果展示。',
          '第三行：直播预告与内容形式。',
          '第四行：明确引流路径（视频号可挂链接）。',
          '第五行：行动号召，引导转化。',
        ],
        lineHighlights: [
          '智能体定制专家 | 企业AI工作流赋能者：直接点明专业身份和为企业带来的价值。',
          '已服务多家企业，实现AI降本增效：强大的信任背书，增强说服力。',
          '点击下方链接，获取专属AI解决方案：直接引导用户点击链接，提高转化效率。',
        ],
        seoKeywords: ['智能体定制', '企业AI', 'AI解决方案', 'AI直播', '客户案例'],
      },
      {
        platformKey: 'sph_life',
        platformLabel: '视频号（副号）：个人生活号',
        copy: '高总：我的AI创业日常与生活感悟。\n分享：AI学习干货 | 商业洞察 | 个人成长。\n从餐饮到AI，持续创业，永不设限。\n🤝链接微信生态，私信交流AI商业机会。\n点赞关注，一起探索AI的无限可能。',
        hashtags: [],
        evaluation: '',
        structureExplain: [
          '第一行：个人身份与账号内容定位。',
          '第二行：具体分享方向，兼顾专业与生活。',
          '第三行：个人经历与价值观，强化IP。',
          '第四行：引流至微信，强调社交属性。',
          '第五行：号召关注，展望未来。',
        ],
        lineHighlights: [
          '我的AI创业日常与生活感悟：展现更真实、生活化的一面，拉近距离。',
          '链接微信生态，私信交流AI商业机会：充分利用视频号与微信的连接优势，高效引流。',
          '从餐饮到AI，持续创业，永不设限：强调个人奋斗精神和成长性。',
        ],
        seoKeywords: ['AI创业日常', '生活感悟', '商业洞察', '个人成长', '微信交流'],
      },
    ],
    // 图 13 末尾 · 整个 H3-5 共享的 5 个核心关键词(无 SEO 前缀)
    bioCoreKeywords: ['智能体定制', 'AI工作流', 'OPC创业', '降本增效', 'AI解决方案'],

    // ── H3-6 整体包装策略 ─────────────────────────────────────────────────
    overallStrategy: {
      视觉统一性:
        '头像、背景图和简介需要保持统一的科技感与专业性风格。主色调（深蓝、科技灰）应贯穿始终，头像选用商务微笑，背景图加上Slogan和引流信息，以及简介中的视觉化模板（如标题区、人物形象、品牌Logo）和构成视觉识别系统，让用户在任何平台都能一眼认出，强化品牌IP印象。',
      第一印象设计:
        '新用户进入主页时，首先看到的是头像与昵称。接着是简介开头，突出业内背景信息。再往下是精选内容栏目。整个过程应在用户从上到下浏览时，你能提供的什么、以及你如何帮助他们。通过视觉和文字的精准传达，迅速建立信任和受信感，激发用户深入了解的兴趣。',
      内容封面与简介公益策略:
        '封面设计统一性 · 用品牌色板（深蓝/科技灰/金色）做统一模板，左侧竖色块 + 标题 + 数字 hook（如「12 年 · 餐饮转型 AI」）。简介公益策略侧重知识普惠，通过免费 AI 诊断、直播分享、案例拆解建立公益形象，转化为信任。每条内容封面强化"专业 + 价值"双重锚点。',
      内容创意建议:
        '每周输出 3-5 条干货（智能体案例 / 客户成果 / 工作流教程）+ 1-2 条人设故事（创业经历 / 转型痛点）+ 1 条互动话题（评论引导 / 直播预告），内容比例约 7:2:1，兼顾专业度与人格化。每月做 1 次深度复盘，沉淀长文 / 视频系列，强化个人 IP 厚度。',
      时长策略: [
        { stage: '第1秒', desc: '头像/昵称/背景图，快速吸引目标客户注意。' },
        { stage: '第2-7秒', desc: '简介阐述账号专业度，解决痛点，建立信任。' },
        { stage: '第8-15秒', desc: '简介中的私信钩子和置顶内容，引导用户私信或点击关注。' },
        { stage: '第16-60秒', desc: '精选内容/视频，提供更深入的价值，促成付费转化。' },
        { stage: '60秒以上', desc: '将用户引导至微信私域，通过社群、企业微信等持续互动。建立长期信任，提升复购率。' },
      ],
      平台优势: [
        {
          platform: '抖音',
          desc: '流量大，转化率高，适合短平快内容形式。注重短视频开篇前3秒钩子，以及评论区互动，搭建直播带货增加专业可信度。',
        },
        {
          platform: '小红书',
          desc: '用户精准，内容垂直度高，适合干货分享、案例分析、个人成长记录，通过笔记互动建立深度连接。',
        },
        {
          platform: '视频号',
          desc: '微信生态优势，易于私域转化，内容偏向品牌宣传和客户案例展示，通过朋友圈和社群进行裂变。',
        },
      ],
    },
  };
}

// AC-5: 从 backend raw output 解析 · 字段不全时用 mock 兜底
function adaptStep3Result(raw: Record<string, unknown>): Step3Result {
  const mock = generateMockResult();

  // nicknames: backend returns string[] → convert to NicknameEvaluation[]
  const nicknameArr = Array.isArray(raw.nickname) ? (raw.nickname as string[]) : [];
  const nicknames: NicknameEvaluation[] = nicknameArr.length > 0
    ? nicknameArr.map((name) => ({
        name: typeof name === 'string' ? name : '昵称推荐',
        description: '命名策略见下方"命名策略"段落',
        searchability: '中',
        tags: [],
      }))
    : mock.nicknames;

  // avatar: backend returns { prompt, style }
  const rawAvatar = raw.avatar as { prompt?: string; style?: string } | undefined;
  const avatar: AvatarDesignContent = rawAvatar
    ? {
        风格: rawAvatar.style ?? mock.avatar.风格,
        配色方案: mock.avatar.配色方案,
        主色调: mock.avatar.主色调,
        辅色调: mock.avatar.辅色调,
        心理学依据: mock.avatar.心理学依据,
        '表情/姿态': mock.avatar['表情/姿态'],
        '服装/造型': mock.avatar['服装/造型'],
        背景设计: rawAvatar.prompt ?? mock.avatar.背景设计,
      }
    : mock.avatar;

  // background: backend returns { prompt, platformVersions: string[3] }
  const rawBg = raw.background as { prompt?: string; platformVersions?: string[] } | undefined;
  const background: BackgroundImageContent = rawBg
    ? {
        风格理念: rawBg.prompt ?? mock.background.风格理念,
        布局结构: mock.background.布局结构,
        色调: mock.background.色调,
        主色调: mock.background.主色调,
        辅色调: mock.background.辅色调,
        品牌元素: mock.background.品牌元素,
        '字体/icon': mock.background['字体/icon'],
        分镜建议: Array.isArray(rawBg.platformVersions)
          ? rawBg.platformVersions.join(' · ')
          : mock.background.分镜建议,
      }
    : mock.background;

  // bio: backend returns [{ platform, text }][6]
  const rawBio = Array.isArray(raw.bio)
    ? (raw.bio as Array<{ platform?: string; text?: string }>)
    : [];
  const BIO_LABEL_MAP: Record<string, { key: string; label: string }> = {
    douyin: { key: 'douyin_main', label: '抖音主号' },
    xiaohongshu: { key: 'xhs_knowledge', label: '小红书干货博主' },
    wechat: { key: 'sph_quality', label: '视频号品质创业' },
    kuaishou: { key: 'douyin_sub', label: '抖音副号' },
    bilibili: { key: 'xhs_personal', label: '小红书个人IP' },
  };
  const bioEntries: IntroCopyEntry[] = rawBio.length > 0
    ? rawBio.map((b, i) => {
        const mapped = b.platform ? (BIO_LABEL_MAP[b.platform] ?? { key: `bio_${i}`, label: b.platform }) : { key: `bio_${i}`, label: `平台 ${i + 1}` };
        return {
          platformKey: mapped.key,
          platformLabel: mapped.label,
          copy: typeof b.text === 'string' ? b.text : '',
          hashtags: [],
          evaluation: '',
        };
      })
    : mock.bioEntries;

  // overallStrategy
  const rawStrategy = typeof raw.overallStrategy === 'string' ? raw.overallStrategy : null;
  const overallStrategy: OverallStrategyContent = rawStrategy
    ? { 视觉统一性: rawStrategy, 第一印象设计: mock.overallStrategy.第一印象设计, 内容封面与简介公益策略: mock.overallStrategy.内容封面与简介公益策略, 内容创意建议: mock.overallStrategy.内容创意建议 }
    : mock.overallStrategy;

  return {
    videoReferences: mock.videoReferences,
    nicknames,
    nicknameStrategy: mock.nicknameStrategy,
    avatar,
    background,
    bioFormula: mock.bioFormula,
    bioEntries,
    bioCoreKeywords: mock.bioCoreKeywords,
    overallStrategy,
  };
}

export default function Step3() {
  const { account } = useActiveAccount();
  const accountId = (account as { id: number } | null)?.id ?? null;

  // AC-2: useStepData for persistence + cross-session restore
  const { save, isSaving, dbQuery } = useStepData(accountId, 'step3');

  // AC-3: industry from step1
  const industry = readOtherStep<{ industry?: string }>(accountId, 'step1')?.industry ?? '美业';

  // PRD-29.7 · default form 1:1 复刻 aiipznt sally zhao 真实输入(空账号首次进入即看到 demo 内容)
  const [personalInfo, setPersonalInfo] = useState('我是一家软件开发公司的负责人，我们定制企业和个人级别的智能体开发，和opc培训业务，还没有开账号，想在平台获取精准流量以及获客');
  const [platform, setPlatform] = useState('douyin');
  const [audience, setAudience] = useState('企业老板和opc创业者');
  const [accountStatus, setAccountStatus] = useState('新账号');

  const prevIsSavingRef = useRef(false);

  // Restore form from LS on accountId change
  useEffect(() => {
    if (accountId === null) return;
    const saved = readOtherStep<{ personalInfo?: string; platform?: string; audience?: string; accountStatus?: string }>(accountId, 'step3');
    if (saved?.personalInfo) {
      setPersonalInfo(saved.personalInfo);
      if (saved.platform) setPlatform(saved.platform);
      if (saved.audience) setAudience(saved.audience);
      if (saved.accountStatus) setAccountStatus(saved.accountStatus);
    }
  }, [accountId]);

  // Refetch after save completes
  useEffect(() => {
    if (prevIsSavingRef.current && !isSaving) {
      void dbQuery.refetch();
    }
    prevIsSavingRef.current = isSaving;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSaving]);

  const isForceRegenerateRef = useRef(false);

  // AC-1: trpc.step3.generatePackage mutation
  const generateMutation = trpc.step3.generatePackage.useMutation({
    onSuccess: () => {
      save({ personalInfo, platform, audience, accountStatus });
      void dbQuery.refetch();
      toast.success(isForceRegenerateRef.current ? '已重新生成全部' : '生成完成');
      isForceRegenerateRef.current = false;
    },
    onError: (err) => {
      isForceRegenerateRef.current = false;
      toast.error(err.message || '生成失败，请重试');
    },
  });

  // AC-4: trpc.step3.optimizeSection mutation
  const optimizeMutation = trpc.step3.optimizeSection.useMutation({
    onSuccess: () => {
      void dbQuery.refetch();
      toast.success('已智能优化');
    },
    onError: (err) => {
      toast.error(err.message || '智能优化失败，请重试');
    },
  });

  const isLoading = generateMutation.isPending || optimizeMutation.isPending || isSaving;

  // PRD-29.7 · default 强制 mock 1:1 复刻 aiipznt sally zhao demo
  // 仅当用户当前 session 主动 generate / optimize 成功后 · 才用 backend 返回数据
  // (老 db 残留视为 stale · 不打扰首屏 demo 视觉)
  const rawResult = dbQuery.data?.result as Record<string, unknown> | null | undefined;
  const sessionMutationData =
    (generateMutation.data as Record<string, unknown> | undefined) ??
    (optimizeMutation.data as Record<string, unknown> | undefined);
  const useBackendResult = sessionMutationData ?? null;
  const generated: Step3Result = useBackendResult
    ? adaptStep3Result(useBackendResult)
    : generateMockResult();
  // 抑制 unused 警告 · rawResult 留作未来"db restore 开关"使用
  void rawResult;

  // AC-4: D-302 锁 · canBulkActions = !isLoading(去掉 hasRealData 限制 · mock data 时也可 click)
  const canBulkActions = !isLoading;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!personalInfo.trim() || !platform || isLoading) return;
    generateMutation.mutate({ personalInfo, platform, audience, accountStatus });
  }

  // AC-2 + AC-3: shared handler for toolbar "一键重新生成" + form副 button
  function handleRegenerateAll() {
    if (isLoading || !personalInfo.trim() || !platform) return;
    isForceRegenerateRef.current = true;
    generateMutation.mutate({ personalInfo, platform, audience, accountStatus, force: true });
  }

  // AC-1: toolbar 复制全部 → 拼接全 6 H3 内容 → clipboard + toast
  function handleCopyAll() {
    const text = JSON.stringify(generated, null, 2);
    navigator.clipboard.writeText(text).then(() => {
      toast.success('已复制全部到剪贴板');
    }).catch(() => {
      toast.error('复制失败，请手动复制');
    });
  }

  // AC-4: optimize button handler
  function handleOptimize() {
    if (!canBulkActions || isLoading) return;
    optimizeMutation.mutate({ currentResult: generated as unknown as Record<string, unknown> });
  }

  // AC-1 (US-006): stub handler for image generation buttons — no real DALL-E integration yet
  function handleImageGenStub() {
    toast.info('图片生成功能需 admin 配置 OpenAI DALL-E key · 当前请使用文字描述参考');
  }

  return (
    <main className="flex-1 container py-8 space-y-8">
      {/* 1. Step3PageHeader · canBulkActions controls 3 toolbar buttons */}
      <Step3PageHeader
        industry={industry}
        canBulkActions={canBulkActions}
        onOptimize={handleOptimize}
        onRegenerateAll={handleRegenerateAll}
        onCopyAll={handleCopyAll}
      />

      {/* 2. Step3Form */}
      <Step3Form
        personalInfo={personalInfo}
        onPersonalInfoChange={setPersonalInfo}
        platform={platform}
        onPlatformChange={setPlatform}
        audience={audience}
        onAudienceChange={setAudience}
        accountStatus={accountStatus}
        onAccountStatusChange={setAccountStatus}
        onSubmit={handleSubmit}
        onRegenerate={handleRegenerateAll}
        isLoading={isLoading}
        isDisabled={!personalInfo.trim() || !platform || isLoading}
      />

      {/* 3. Step3LoadingState — inline notification when isLoading=true (AC-3) */}
      {isLoading && <Step3LoadingState />}

      {/* 4. Step3SectionDivider */}
      <Step3SectionDivider />

      {/* 4-9. 6 H3 sections — D-292 锁: always render, skeleton when no data */}
      <VideoReferenceCaseSection
        cases={generated?.videoReferences ?? []}
        canGenerate={canBulkActions}
        onGenerate={handleImageGenStub}
      />

      <NicknameRecommendSection
        nicknames={generated?.nicknames ?? []}
        strategy={generated?.nicknameStrategy}
      />

      <AvatarDesignSection
        content={generated?.avatar ?? null}
        canViewImage={canBulkActions}
        onViewImage={handleImageGenStub}
      />

      <BackgroundImageDesignSection
        content={generated?.background ?? null}
        canGenerate={canBulkActions}
        onGenerate={handleImageGenStub}
      />

      <IntroCopySection
        formula={generated?.bioFormula}
        entries={generated?.bioEntries ?? []}
        coreKeywords={generated?.bioCoreKeywords}
      />

      <OverallStrategySection
        content={generated?.overallStrategy ?? null}
      />
    </main>
  );
}
