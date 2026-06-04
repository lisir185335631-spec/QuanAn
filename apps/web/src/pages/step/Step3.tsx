import '@/styles/ikb-hero.css';

import { type FormEvent, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { C, F } from '@/components/home/ikb/system';
import { type AvatarDesignContent } from '@/components/step3/AvatarDesignSection';
import { type BackgroundImageContent } from '@/components/step3/BackgroundImageDesignSection';
import { type IntroCopyEntry } from '@/components/step3/IntroCopySection';
import {
  type NicknameEvaluation,
  type NicknameSelectionStrategy,
} from '@/components/step3/NicknameRecommendSection';
import { type OverallStrategyContent } from '@/components/step3/OverallStrategySection';
import { type VideoReferenceCase } from '@/components/step3/VideoReferenceCaseSection';
import { useActiveAccount } from '@/hooks/useActiveAccount';
import { readOtherStep, useStepData } from '@/hooks/useStepData';
import { IKBLayout } from '@/layouts/IKBLayout';
import { breakSentences } from '@/lib/text';
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

// ── 平台卡数据(保留 color 作为平台图标背景色,与原逻辑兼容) ─────────────────────
const PLATFORMS = [
  { key: 'xiaohongshu', label: '小红书', icon: 'menu_book', color: '#ff2442', desc: '种草 · 图文' },
  { key: 'douyin', label: '抖音', icon: 'music_note', color: '#0ea5b7', desc: '短视频 · 流量' },
  { key: 'wechat', label: '视频号', icon: 'smart_display', color: '#07c160', desc: '私域 · 转化' },
];

export default function Step3() {
  const navigate = useNavigate();
  const { account } = useActiveAccount();
  const accountId = (account as { id: number } | null)?.id ?? null;

  // AC-2: useStepData for persistence + cross-session restore
  const { save, isSaving, dbQuery } = useStepData(accountId, 'step3');

  // AC-3: industry from step1
  const industry = readOtherStep<{ industry?: string }>(accountId, 'step1')?.industry ?? '美业';

  // PRD-29.7 · default form 1:1 复刻 aiipznt sally zhao 真实输入(空账号首次进入即看到 demo 内容)
  const [personalInfo, setPersonalInfo] = useState(
    breakSentences(
      '我是一家软件开发公司的负责人，我们定制企业和个人级别的智能体开发，和opc培训业务，还没有开账号，想在平台获取精准流量以及获客',
    ),
  );
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
  const rawResult = dbQuery.data?.result;
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

  function copyText(text: string) {
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success('已复制'))
      .catch(() => toast.error('复制失败'));
  }

  // ── 雷达数据(IKB 三主色轮转) ──────────────────────────────────────────────
  const radarDims = [
    { label: '专业度', value: 88, color: C.ikb },
    { label: '影响力', value: 76, color: C.burgundy },
    { label: '记忆点', value: 92, color: C.accent3 },
    { label: '转化力', value: 81, color: C.ikb },
    { label: '稀缺性', value: 70, color: C.burgundy },
    { label: '一致性', value: 85, color: C.accent3 },
  ];

  return (
    <IKBLayout>
      <div className="pb-28">
        {/* ── Header ─────────────────────────────────────────── */}
        <header className="mb-12 flex flex-row items-center justify-between gap-8">
          <div className="shrink-0">
            <div className="mb-3 flex items-center gap-3">
              <span
                style={{
                  fontFamily: F.mono,
                  fontSize: 11,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  border: `1px solid ${C.line}`,
                  background: C.base,
                  color: C.ink,
                  padding: '4px 10px',
                }}
              >
                战略节点
              </span>
              <span
                style={{
                  fontFamily: F.mono,
                  fontSize: 11,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  border: `1px solid ${C.accent3}55`,
                  background: `${C.accent3}18`,
                  color: C.purpleText,
                  padding: '4px 10px',
                }}
              >
                账号矩阵
              </span>
            </div>
            <h1
              style={{
                fontFamily: F.display,
                fontWeight: 400,
                fontSize: 40,
                lineHeight: 1.05,
                letterSpacing: '-0.01em',
                margin: 0,
                whiteSpace: 'nowrap',
                background: C.grad,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                color: 'transparent',
              }}
            >
              STEP 03 · 账号包装方案
            </h1>
            <p
              className="mt-2 max-w-[820px]"
              style={{ fontSize: 16, color: '#5A6173', fontFamily: F.cn }}
            >
              为「{industry}」生成高度定制的自媒体账号基础包装 · 构建专业、权威的数字形象基石。
            </p>
          </div>
          <div className="flex shrink-0 flex-nowrap gap-3">
            <button
              type="button"
              onClick={handleOptimize}
              disabled={!canBulkActions}
              aria-label="智能优化"
              className="ikb-focusring"
              style={{
                display: 'flex',
                flexShrink: 0,
                alignItems: 'center',
                gap: 8,
                whiteSpace: 'nowrap',
                border: `1px solid ${C.line}`,
                background: C.paper,
                padding: '10px 16px',
                fontFamily: F.mono,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: C.ink,
                cursor: canBulkActions ? 'pointer' : 'not-allowed',
                opacity: canBulkActions ? 1 : 0.4,
                transition: 'background 0.2s',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden="true">auto_fix_high</span>
              智能优化
            </button>
            <button
              type="button"
              onClick={handleRegenerateAll}
              disabled={isLoading || !personalInfo.trim() || !platform}
              aria-label="重新生成"
              className="ikb-focusring"
              style={{
                display: 'flex',
                flexShrink: 0,
                alignItems: 'center',
                gap: 8,
                whiteSpace: 'nowrap',
                border: `1px solid ${C.line}`,
                background: C.paper,
                padding: '10px 16px',
                fontFamily: F.mono,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: C.ink,
                cursor: (!isLoading && personalInfo.trim() && platform) ? 'pointer' : 'not-allowed',
                opacity: (!isLoading && personalInfo.trim() && platform) ? 1 : 0.4,
                transition: 'background 0.2s',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden="true">refresh</span>
              重新生成
            </button>
            <button
              type="button"
              onClick={handleCopyAll}
              aria-label="导出方案"
              className="ikb-gradbtn"
              style={{
                display: 'flex',
                flexShrink: 0,
                alignItems: 'center',
                gap: 8,
                whiteSpace: 'nowrap',
                padding: '10px 18px',
                fontFamily: F.cn,
                fontSize: 13,
                fontWeight: 700,
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden="true">download</span>
              导出方案
            </button>
          </div>
        </header>

        {/* ── 输入节点参数 ───────────────────────────────────── */}
        <section
          style={{
            position: 'relative',
            border: `1px solid ${C.line}`,
            background: `linear-gradient(135deg, ${C.paper} 0%, ${C.base} 100%)`,
            padding: 24,
            marginBottom: 48,
            overflow: 'hidden',
          }}
        >
          {/* 装饰光晕 */}
          <div
            aria-hidden="true"
            style={{
              pointerEvents: 'none',
              position: 'absolute',
              right: -64,
              top: -64,
              height: 176,
              width: 176,
              borderRadius: '50%',
              background: `${C.ikb}08`,
              filter: 'blur(32px)',
            }}
          />
          <div
            aria-hidden="true"
            style={{
              pointerEvents: 'none',
              position: 'absolute',
              bottom: -80,
              left: '33%',
              height: 176,
              width: 176,
              borderRadius: '50%',
              background: `${C.burgundy}06`,
              filter: 'blur(32px)',
            }}
          />

          {/* 段落标题 */}
          <div
            style={{
              position: 'relative',
              marginBottom: 24,
              paddingBottom: 20,
              borderBottom: `1px solid ${C.line}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                style={{
                  display: 'flex',
                  height: 44,
                  width: 44,
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: C.grad,
                  color: '#fff',
                }}
              >
                <span className="material-symbols-outlined" aria-hidden="true">tune</span>
              </span>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: C.ink, fontFamily: F.cn, margin: 0 }}>输入节点参数</h2>
                <p style={{ fontSize: 12, color: '#6b7280', fontFamily: F.cn, margin: 0 }}>填写基础信息 · AI 据此生成全套账号包装矩阵</p>
              </div>
            </div>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                borderRadius: 999,
                background: `${C.ikb}15`,
                padding: '4px 12px',
                fontSize: 12,
                fontWeight: 600,
                color: C.ikb,
                fontFamily: F.mono,
                letterSpacing: '0.04em',
              }}
            >
              <span
                style={{
                  height: 6,
                  width: 6,
                  borderRadius: '50%',
                  background: C.ikb,
                  animation: 'ikb-pulse 1.6s ease-in-out infinite',
                  display: 'inline-block',
                }}
              />
              参数就绪
            </span>
          </div>

          {/* 表单 */}
          <div style={{ position: 'relative' }}>
            <form onSubmit={handleSubmit} className="space-y-7">
              {/* 目标平台 · 可视化平台卡 */}
              <div>
                <span
                  style={{
                    marginBottom: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 14,
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    color: C.ink,
                    fontFamily: F.cn,
                  }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      height: 14,
                      width: 3,
                      background: C.grad,
                      flexShrink: 0,
                    }}
                    aria-hidden="true"
                  />
                  目标平台
                </span>
                <div className="grid grid-cols-3 gap-4">
                  {PLATFORMS.map((p) => {
                    const active = platform === p.key;
                    return (
                      <button
                        type="button"
                        key={p.key}
                        onClick={() => setPlatform(p.key)}
                        aria-pressed={active}
                        className="ikb-focusring"
                        style={{
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          overflow: 'hidden',
                          border: active ? `2px solid ${C.ikb}` : `1px solid ${C.line}`,
                          background: active ? `${C.ikb}08` : C.paper,
                          padding: '14px',
                          textAlign: 'left',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          boxShadow: active ? `0 2px 12px ${C.ikb}20` : 'none',
                        }}
                      >
                        <span
                          style={{
                            display: 'flex',
                            height: 40,
                            width: 40,
                            flexShrink: 0,
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            backgroundColor: p.color,
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 22 }} aria-hidden="true">{p.icon}</span>
                        </span>
                        <span style={{ minWidth: 0 }}>
                          <span style={{ display: 'block', fontSize: 14, fontWeight: 700, color: C.ink, fontFamily: F.cn }}>{p.label}</span>
                          <span style={{ display: 'block', fontSize: 11, color: '#6b7280', fontFamily: F.mono }}>{p.desc}</span>
                        </span>
                        <span
                          style={{
                            position: 'absolute',
                            right: 10,
                            top: 10,
                            display: 'flex',
                            height: 16,
                            width: 16,
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '50%',
                            background: active ? C.ikb : C.paper,
                            border: active ? 'none' : `1px solid ${C.line}`,
                            color: active ? '#fff' : 'transparent',
                            transition: 'all 0.2s',
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 12 }} aria-hidden="true">check</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 目标受众 + 账号状态 · 双列带图标输入 */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="s3-audience"
                    style={{
                      marginBottom: 8,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 14,
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      color: C.ink,
                      fontFamily: F.cn,
                    }}
                  >
                    <span style={{ display: 'inline-block', height: 14, width: 3, background: C.grad, flexShrink: 0 }} aria-hidden="true" />
                    目标受众
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span className="material-symbols-outlined" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: '#6b7280', pointerEvents: 'none' }} aria-hidden="true">groups</span>
                    <input
                      id="s3-audience"
                      type="text"
                      value={audience}
                      onChange={(e) => setAudience(e.target.value)}
                      placeholder="例如：企业老板和创业者"
                      className="ikb-input"
                      style={{
                        width: '100%',
                        border: `1px solid ${C.line}`,
                        background: C.paper,
                        padding: '12px 12px 12px 40px',
                        fontSize: 14,
                        fontFamily: F.cn,
                        color: C.ink,
                        transition: 'border-color 0.2s',
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="s3-account-status"
                    style={{
                      marginBottom: 8,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 14,
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      color: C.ink,
                      fontFamily: F.cn,
                    }}
                  >
                    <span style={{ display: 'inline-block', height: 14, width: 3, background: C.grad, flexShrink: 0 }} aria-hidden="true" />
                    账号状态
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span className="material-symbols-outlined" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: '#6b7280', pointerEvents: 'none' }} aria-hidden="true">verified_user</span>
                    <input
                      id="s3-account-status"
                      type="text"
                      value={accountStatus}
                      onChange={(e) => setAccountStatus(e.target.value)}
                      placeholder="例如：新账号 / 已有粉丝"
                      className="ikb-input"
                      style={{
                        width: '100%',
                        border: `1px solid ${C.line}`,
                        background: C.paper,
                        padding: '12px 12px 12px 40px',
                        fontSize: 14,
                        fontFamily: F.cn,
                        color: C.ink,
                        transition: 'border-color 0.2s',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* 个人背景 · 框式编辑器 + 工具栏 */}
              <div>
                <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label
                    htmlFor="s3-personal-info"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 14,
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      color: C.ink,
                      fontFamily: F.cn,
                    }}
                  >
                    <span style={{ display: 'inline-block', height: 14, width: 3, background: C.grad, flexShrink: 0 }} aria-hidden="true" />
                    个人背景与核心优势提取
                  </label>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#6b7280', fontFamily: F.cn }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14, color: C.burgundyText }} aria-hidden="true">auto_awesome</span>
                    AI 据此提取人设关键词
                  </span>
                </div>
                <div
                  style={{
                    overflow: 'hidden',
                    border: `1px solid ${C.line}`,
                    background: C.paper,
                    transition: 'border-color 0.2s',
                  }}
                  onFocusCapture={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = C.ikb;
                    (e.currentTarget as HTMLDivElement).style.outline = `1px solid ${C.ikb}`;
                  }}
                  onBlurCapture={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = C.line;
                    (e.currentTarget as HTMLDivElement).style.outline = 'none';
                  }}
                >
                  <textarea
                    id="s3-personal-info"
                    value={personalInfo}
                    onChange={(e) => setPersonalInfo(e.target.value)}
                    rows={6}
                    placeholder="输入过去的经历、成就、特殊技能，以及希望传达的核心人设"
                    className="ikb-input"
                    style={{
                      width: '100%',
                      resize: 'none',
                      border: 0,
                      background: 'transparent',
                      padding: 16,
                      fontSize: 14,
                      lineHeight: 1.6,
                      fontFamily: F.cn,
                      color: C.ink,
                    }}
                  />
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      borderTop: `1px solid ${C.line}`,
                      background: `${C.paper}99`,
                      padding: '10px 16px',
                    }}
                  >
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 11, color: '#6b7280', fontFamily: F.cn }}>可包含</span>
                      {['经历', '成就', '技能', '人设', '价值观'].map((t) => (
                        <span
                          key={t}
                          style={{
                            borderRadius: 999,
                            background: `${C.ikb}10`,
                            padding: '2px 10px',
                            fontSize: 11,
                            fontWeight: 500,
                            color: C.purpleText,
                            fontFamily: F.mono,
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <span style={{ flexShrink: 0, fontSize: 11, fontFamily: F.mono, color: '#6b7280' }}>{personalInfo.length} 字</span>
                  </div>
                </div>
                <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="submit"
                    disabled={!personalInfo.trim() || !platform || isLoading}
                    className="ikb-gradbtn"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '12px 32px',
                      fontFamily: F.cn,
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: '#fff',
                      border: 'none',
                      cursor: (!personalInfo.trim() || !platform || isLoading) ? 'not-allowed' : 'pointer',
                      opacity: (!personalInfo.trim() || !platform || isLoading) ? 0.4 : 1,
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden="true">auto_awesome</span>
                    {isLoading ? '生成中…' : '生成包装矩阵'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </section>

        {/* ── 数据洞察(雷达 + 趋势)──────────────────────────── */}
        <div className="mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined" style={{ fontSize: 20, color: C.ikb }} aria-hidden="true">insights</span>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: C.ink, fontFamily: F.cn, margin: 0 }}>数据洞察</h2>
          <span style={{ fontSize: 12, color: '#6b7280', fontFamily: F.cn }}>· AI 综合评估 · 实时测算</span>
          <span
            style={{
              marginLeft: 'auto',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              borderRadius: 999,
              background: `${C.ikb}15`,
              padding: '4px 12px',
              fontSize: 12,
              fontWeight: 600,
              color: C.ikb,
              fontFamily: F.mono,
              letterSpacing: '0.04em',
            }}
          >
            <span
              style={{
                height: 6,
                width: 6,
                borderRadius: '50%',
                background: C.ikb,
                animation: 'ikb-pulse 1.6s ease-in-out infinite',
                display: 'inline-block',
              }}
            />
            模型已就绪
          </span>
        </div>

        <div className="mb-8 grid grid-cols-12 gap-6">
          {/* 人设竞争力雷达 */}
          <div
            className="col-span-5 ikb-hovercard"
            style={{
              border: `1px solid ${C.line}`,
              background: `linear-gradient(135deg, ${C.paper} 0%, ${C.base} 100%)`,
              padding: 24,
            }}
          >
            <div className="mb-1 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span
                  style={{
                    display: 'flex',
                    height: 36,
                    width: 36,
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `${C.ikb}18`,
                    color: C.ikb,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden="true">radar</span>
                </span>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: C.ink, fontFamily: F.cn, margin: 0 }}>人设竞争力雷达</h3>
                  <p style={{ fontSize: 11, color: '#6b7280', fontFamily: F.cn, margin: 0 }}>六维模型评估</p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p
                  className="ikb-gradtext"
                  style={{ fontSize: 26, fontWeight: 700, lineHeight: 1, margin: 0, fontFamily: F.display }}
                >
                  82
                </p>
                <p style={{ fontSize: 10, color: '#6b7280', fontFamily: F.mono, margin: 0 }}>综合分</p>
              </div>
            </div>
            {(() => {
              const dims = radarDims;
              const cx = 130;
              const cy = 122;
              const R = 88;
              const ang = (i: number) => ((-90 + i * 60) * Math.PI) / 180;
              const pt = (i: number, r: number): [number, number] => [cx + r * Math.cos(ang(i)), cy + r * Math.sin(ang(i))];
              const poly = (r: number) => dims.map((_, i) => pt(i, r).map((n) => n.toFixed(1)).join(',')).join(' ');
              const dataPoly = dims.map((d, i) => pt(i, R * (d.value / 100)).map((n) => n.toFixed(1)).join(',')).join(' ');
              return (
                <svg viewBox="0 0 260 244" className="w-full">
                  <defs>
                    <linearGradient id="radarFillS3" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C.ikb} stopOpacity="0.38" />
                      <stop offset="100%" stopColor={C.burgundy} stopOpacity="0.12" />
                    </linearGradient>
                  </defs>
                  {[0.25, 0.5, 0.75, 1].map((f) => (
                    <polygon key={f} points={poly(R * f)} fill="none" stroke="#e8ebf2" strokeWidth="1" />
                  ))}
                  {dims.map((_, i) => {
                    const [x, y] = pt(i, R);
                    return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#eef1f6" strokeWidth="1" />;
                  })}
                  <polygon points={dataPoly} fill="url(#radarFillS3)" stroke={C.ikb} strokeWidth="2" strokeLinejoin="round" />
                  {dims.map((d, i) => {
                    const [x, y] = pt(i, R * (d.value / 100));
                    return <circle key={i} cx={x} cy={y} r="3.2" fill="#fff" stroke={d.color} strokeWidth="2" />;
                  })}
                  {dims.map((d, i) => {
                    const [x, y] = pt(i, R + 16);
                    return (
                      <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fill="#6b7280" fontSize="10.5" fontWeight="600">
                        {d.label}
                      </text>
                    );
                  })}
                </svg>
              );
            })()}
            <div className="mt-2 grid grid-cols-3 gap-y-2">
              {radarDims.map((d) => (
                <div key={d.label} className="flex items-center gap-1.5">
                  <span style={{ height: 8, width: 8, borderRadius: '50%', backgroundColor: d.color, flexShrink: 0, display: 'inline-block' }} />
                  <span style={{ fontSize: 11, color: '#6b7280', fontFamily: F.cn }}>{d.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.ink, fontFamily: F.mono }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 90 天曝光 / 涨粉预估 */}
          <div
            className="col-span-7 ikb-hovercard"
            style={{
              border: `1px solid ${C.line}`,
              background: `linear-gradient(135deg, ${C.paper} 0%, ${C.base} 100%)`,
              padding: 24,
            }}
          >
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <span
                  style={{
                    display: 'flex',
                    height: 36,
                    width: 36,
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `${C.burgundy}18`,
                    color: C.burgundyText,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden="true">show_chart</span>
                </span>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: C.ink, fontFamily: F.cn, margin: 0 }}>90 天曝光预估</h3>
                  <p style={{ fontSize: 11, color: '#6b7280', fontFamily: F.cn, margin: 0 }}>按当前人设矩阵测算</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {(['曝光', '涨粉', '互动'] as const).map((t, i) => (
                  <span
                    key={t}
                    style={{
                      borderRadius: 4,
                      padding: '4px 10px',
                      fontSize: 11,
                      fontWeight: 600,
                      fontFamily: F.mono,
                      background: i === 0 ? C.ikb : '#f1f3f9',
                      color: i === 0 ? '#fff' : '#6b7280',
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="mb-3 flex items-end gap-3">
              <p style={{ fontSize: 30, fontWeight: 700, lineHeight: 1, color: C.ink, fontFamily: F.display, margin: 0 }}>1.24M</p>
              <span
                style={{
                  marginBottom: 4,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 2,
                  borderRadius: 999,
                  background: `${C.ikb}15`,
                  padding: '2px 8px',
                  fontSize: 12,
                  fontWeight: 700,
                  color: C.ikb,
                  fontFamily: F.mono,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }} aria-hidden="true">trending_up</span>+214%
              </span>
              <span style={{ marginBottom: 4, fontSize: 12, color: '#6b7280', fontFamily: F.cn }}>较冷启动基线</span>
            </div>
            {(() => {
              const data = [18, 26, 24, 38, 49, 45, 60, 70, 66, 80, 88, 100];
              const W = 560;
              const H = 168;
              const padL = 6;
              const padR = 6;
              const padT = 12;
              const padB = 8;
              const innerW = W - padL - padR;
              const innerH = H - padT - padB;
              const max = 110;
              const x = (i: number) => padL + (innerW * i) / (data.length - 1);
              const y = (v: number) => padT + innerH * (1 - v / max);
              const line = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
              const area = `${line} L ${x(data.length - 1).toFixed(1)} ${(padT + innerH).toFixed(1)} L ${x(0).toFixed(1)} ${(padT + innerH).toFixed(1)} Z`;
              return (
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
                  <defs>
                    <linearGradient id="trendFillS3" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C.ikb} stopOpacity="0.24" />
                      <stop offset="100%" stopColor={C.ikb} stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="trendLineS3" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={C.ikb} />
                      <stop offset="100%" stopColor={C.burgundy} />
                    </linearGradient>
                  </defs>
                  {[0, 0.33, 0.66, 1].map((f) => (
                    <line
                      key={f}
                      x1={padL}
                      x2={W - padR}
                      y1={(padT + innerH * f).toFixed(1)}
                      y2={(padT + innerH * f).toFixed(1)}
                      stroke="#f1f3f9"
                      strokeWidth="1"
                    />
                  ))}
                  <path d={area} fill="url(#trendFillS3)" />
                  <path d={line} fill="none" stroke="url(#trendLineS3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  {data.map((v, i) =>
                    i % 3 === 0 ? <circle key={i} cx={x(i)} cy={y(v)} r="3.4" fill="#fff" stroke={C.ikb} strokeWidth="2" /> : null,
                  )}
                </svg>
              );
            })()}
            <div className="mt-1 flex justify-between px-1" style={{ fontSize: 10, color: '#6b7280', fontFamily: F.mono }}>
              {['第1周', '第3周', '第5周', '第7周', '第9周', '第12周'].map((m) => (
                <span key={m}>{m}</span>
              ))}
            </div>
          </div>
        </div>

        {/* ── 数据概览(KPI 仪表盘)──────────────────────────── */}
        <div className="mb-8 grid grid-cols-4 gap-6">
          {/* 人设完整度 · 环形进度 */}
          <div
            className="ikb-hovercard"
            style={{
              border: `1px solid ${C.line}`,
              background: C.paper,
              padding: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', height: 36, width: 36, alignItems: 'center', justifyContent: 'center', background: `${C.ikb}18`, color: C.ikb }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden="true">verified</span>
              </span>
              <span
                style={{
                  borderRadius: 999,
                  padding: '2px 10px',
                  fontSize: 11,
                  fontWeight: 700,
                  fontFamily: F.mono,
                  letterSpacing: '0.06em',
                  background: `${C.ikb}18`,
                  color: C.ikb,
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 13 }} aria-hidden="true">trending_up</span>
                  +18%
                </span>
              </span>
            </div>
            <div style={{ marginTop: 16, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 28, fontWeight: 700, lineHeight: 1, color: C.ink, fontFamily: F.display, margin: 0 }}>
                  92<span style={{ fontSize: 15, color: '#6b7280', fontFamily: F.cn, fontWeight: 400 }}>%</span>
                </p>
                <p style={{ marginTop: 6, fontSize: 12, color: '#6b7280', fontFamily: F.cn }}>人设完整度</p>
              </div>
              <div style={{ height: 48, width: 48, flexShrink: 0 }}>
                <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#eef2ff" strokeWidth="3.5" />
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke={C.ikb} strokeWidth="3.5" strokeLinecap="round" strokeDasharray="92 100" />
                </svg>
              </div>
            </div>
          </div>

          {/* 推荐昵称 · 数量 + 迷你柱 */}
          <div
            className="ikb-hovercard"
            style={{
              border: `1px solid ${C.line}`,
              background: C.paper,
              padding: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', height: 36, width: 36, alignItems: 'center', justifyContent: 'center', background: `${C.burgundy}18`, color: C.burgundyText }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden="true">text_fields</span>
              </span>
              <span
                style={{
                  borderRadius: 999,
                  padding: '2px 10px',
                  fontSize: 11,
                  fontWeight: 700,
                  fontFamily: F.mono,
                  letterSpacing: '0.06em',
                  background: `${C.burgundy}18`,
                  color: C.burgundyText,
                }}
              >
                已评估
              </span>
            </div>
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 28, fontWeight: 700, lineHeight: 1, color: C.ink, fontFamily: F.display, margin: 0 }}>
                {generated.nicknames.length}<span style={{ fontSize: 15, color: '#6b7280', fontFamily: F.cn, fontWeight: 400 }}> 个</span>
              </p>
              <p style={{ marginTop: 6, fontSize: 12, color: '#6b7280', fontFamily: F.cn }}>推荐昵称</p>
            </div>
            <div style={{ marginTop: 12, display: 'flex', height: 24, alignItems: 'flex-end', gap: 4 }}>
              {[58, 84, 70, 96, 78].map((h, i) => (
                <div key={i} style={{ flex: 1, borderRadius: '2px 2px 0 0', background: `${C.burgundy}99`, height: `${h}%` }} />
              ))}
            </div>
          </div>

          {/* 平台覆盖 · 进度条 */}
          <div
            className="ikb-hovercard"
            style={{
              border: `1px solid ${C.line}`,
              background: C.paper,
              padding: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', height: 36, width: 36, alignItems: 'center', justifyContent: 'center', background: `${C.accent3}18`, color: C.purpleText }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden="true">hub</span>
              </span>
              <span
                style={{
                  borderRadius: 999,
                  padding: '2px 10px',
                  fontSize: 11,
                  fontWeight: 700,
                  fontFamily: F.mono,
                  letterSpacing: '0.06em',
                  background: `${C.accent3}18`,
                  color: C.purpleText,
                }}
              >
                全覆盖
              </span>
            </div>
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 28, fontWeight: 700, lineHeight: 1, color: C.ink, fontFamily: F.display, margin: 0 }}>
                5<span style={{ fontSize: 15, color: '#6b7280', fontFamily: F.cn, fontWeight: 400 }}> 平台</span>
              </p>
              <p style={{ marginTop: 6, fontSize: 12, color: '#6b7280', fontFamily: F.cn }}>平台覆盖</p>
            </div>
            <div style={{ marginTop: 12, height: 8, width: '100%', borderRadius: 999, background: `${C.accent3}22` }}>
              <div style={{ height: 8, borderRadius: 999, background: C.grad, width: '100%', transition: 'width 0.4s' }} />
            </div>
          </div>

          {/* 简介方案 · 数量 + 关键词 */}
          <div
            className="ikb-hovercard"
            style={{
              border: `1px solid ${C.line}`,
              background: C.paper,
              padding: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', height: 36, width: 36, alignItems: 'center', justifyContent: 'center', background: `${C.ikb}18`, color: C.ikb }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden="true">edit_document</span>
              </span>
              <span
                style={{
                  borderRadius: 999,
                  padding: '2px 10px',
                  fontSize: 11,
                  fontWeight: 700,
                  fontFamily: F.mono,
                  letterSpacing: '0.06em',
                  background: `${C.ikb}18`,
                  color: C.ikb,
                }}
              >
                {generated.bioCoreKeywords?.length ?? 5} 关键词
              </span>
            </div>
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 28, fontWeight: 700, lineHeight: 1, color: C.ink, fontFamily: F.display, margin: 0 }}>
                {generated.bioEntries.length}<span style={{ fontSize: 15, color: '#6b7280', fontFamily: F.cn, fontWeight: 400 }}> 套</span>
              </p>
              <p style={{ marginTop: 6, fontSize: 12, color: '#6b7280', fontFamily: F.cn }}>简介文案方案</p>
            </div>
            <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {(generated.bioCoreKeywords ?? []).slice(0, 3).map((k) => (
                <span
                  key={k}
                  style={{
                    borderRadius: 0,
                    background: `${C.ikb}10`,
                    padding: '2px 6px',
                    fontSize: 10,
                    fontWeight: 500,
                    color: C.ikb,
                    fontFamily: F.mono,
                  }}
                >
                  {k}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Results bento grid ─────────────────────────────── */}
        <div className="grid grid-cols-12 gap-6">
          {/* 核心定位策略 (col-12) */}
          <div
            className="relative col-span-12 overflow-hidden"
            style={{
              border: `1px solid ${C.line}`,
              background: `linear-gradient(135deg, ${C.paper} 0%, ${C.base} 100%)`,
              padding: 24,
            }}
          >
            <div aria-hidden="true" style={{ pointerEvents: 'none', position: 'absolute', right: -48, top: -48, height: 176, width: 176, borderRadius: '50%', background: `${C.ikb}08`, filter: 'blur(32px)' }} />
            <div aria-hidden="true" style={{ pointerEvents: 'none', position: 'absolute', bottom: -64, right: 160, height: 160, width: 160, borderRadius: '50%', background: `${C.burgundy}07`, filter: 'blur(32px)' }} />
            <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <div
                style={{
                  display: 'flex',
                  height: 48,
                  width: 48,
                  flexShrink: 0,
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: C.grad,
                  color: '#fff',
                }}
              >
                <span className="material-symbols-outlined icon-fill" aria-hidden="true">psychology</span>
              </div>
              <div>
                <span
                  style={{
                    marginBottom: 6,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    borderRadius: 999,
                    background: `${C.ikb}12`,
                    padding: '2px 10px',
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: C.ikb,
                    fontFamily: F.mono,
                  }}
                >
                  <span style={{ height: 6, width: 6, borderRadius: '50%', background: C.ikb, display: 'inline-block' }} />
                  Core Strategy
                </span>
                <h3 style={{ marginBottom: 8, fontSize: 20, fontWeight: 700, color: C.ink, fontFamily: F.cn }}>核心定位策略</h3>
                <p style={{ fontSize: 16, lineHeight: 1.65, color: '#5A6173', fontFamily: F.cn }}>
                  {generated.overallStrategy.视觉统一性}
                </p>
              </div>
            </div>
          </div>

          {/* 矩阵命名 (col-4 · Module 01) */}
          <div
            className="col-span-4 ikb-hovercard"
            style={{
              border: `1px solid ${C.line}`,
              background: C.paper,
              padding: 24,
            }}
          >
            <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 18, fontWeight: 600, color: C.ink, fontFamily: F.cn, margin: 0 }}>
                <span style={{ display: 'flex', height: 36, width: 36, alignItems: 'center', justifyContent: 'center', background: `${C.burgundy}18`, color: C.burgundyText }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden="true">text_fields</span>
                </span>
                矩阵命名
              </h3>
              <span
                style={{
                  borderRadius: 999,
                  padding: '4px 10px',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  fontFamily: F.mono,
                  background: `${C.burgundy}18`,
                  color: C.burgundyText,
                }}
              >
                Module 01
              </span>
            </div>
            <div className="space-y-4">
              {generated.nicknames.slice(0, 4).map((n) => {
                const score = n.searchability?.startsWith('高')
                  ? 92
                  : n.searchability?.startsWith('中高')
                    ? 80
                    : n.searchability?.startsWith('中')
                      ? 66
                      : 74;
                return (
                  <div
                    key={n.name}
                    role="button"
                    tabIndex={0}
                    aria-label={`复制 ${n.name}`}
                    onClick={() => copyText(n.name)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') copyText(n.name); }}
                    className="group ikb-focusring ikb-hovercard"
                    style={{
                      cursor: 'pointer',
                      border: `1px solid ${C.line}`,
                      background: C.base,
                      padding: 12,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: C.ink, fontFamily: F.cn }}>{n.name}</div>
                      <span className="material-symbols-outlined" style={{ flexShrink: 0, color: '#6b7280', fontSize: 18 }} aria-hidden="true">
                        content_copy
                      </span>
                    </div>
                    <div style={{ marginTop: 4, fontSize: 13, lineHeight: 1.45, color: '#6b7280', fontFamily: F.cn }}>{n.description}</div>
                    <div style={{ marginTop: 10 }}>
                      <div style={{ marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11 }}>
                        <span style={{ color: '#6b7280', fontFamily: F.mono }}>搜索度</span>
                        <span style={{ fontWeight: 700, color: C.burgundyText, fontFamily: F.mono }}>{score}%</span>
                      </div>
                      <div style={{ height: 6, width: '100%', borderRadius: 999, background: '#eef2ff' }}>
                        <div
                          style={{
                            height: 6,
                            borderRadius: 999,
                            background: C.burgundy,
                            width: `${score}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 头像生成流 (col-4 · Module 02) */}
          <div
            className="col-span-4 ikb-hovercard"
            style={{
              border: `1px solid ${C.line}`,
              background: C.paper,
              padding: 24,
            }}
          >
            <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 18, fontWeight: 600, color: C.ink, fontFamily: F.cn, margin: 0 }}>
                <span style={{ display: 'flex', height: 36, width: 36, alignItems: 'center', justifyContent: 'center', background: `${C.burgundy}18`, color: C.burgundyText }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden="true">face</span>
                </span>
                头像生成流
              </h3>
              <span
                style={{
                  borderRadius: 999,
                  padding: '4px 10px',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  fontFamily: F.mono,
                  background: `${C.burgundy}18`,
                  color: C.burgundyText,
                }}
              >
                Module 02
              </span>
            </div>
            <button
              type="button"
              onClick={handleImageGenStub}
              aria-label="点击生成头像"
              className="ikb-focusring"
              style={{
                marginBottom: 16,
                display: 'flex',
                aspectRatio: '1',
                width: '100%',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                border: `1px solid ${C.line}`,
                background: C.base,
                padding: 16,
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.ikb; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.line; }}
            >
              <span className="material-symbols-outlined" style={{ marginBottom: 8, fontSize: 36, color: '#757685' }} aria-hidden="true">image</span>
              <p style={{ fontSize: 14, color: '#5A6173', fontFamily: F.cn }}>点击生成头像</p>
            </button>
            <div style={{ border: `1px solid ${C.line}`, background: C.base, padding: 12 }}>
              <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', fontFamily: F.mono, color: C.burgundyText }}>
                AI Prompt
                <button
                  type="button"
                  aria-label="复制"
                  onClick={() => copyText(generated.avatar.aiPrompt ?? '')}
                  className="ikb-focusring"
                  style={{ cursor: 'pointer', fontSize: 16, color: C.burgundyText, background: 'none', border: 'none', padding: 0 }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }} aria-hidden="true">content_copy</span>
                </button>
              </div>
              <p style={{ wordBreak: 'break-word', fontFamily: F.mono, fontSize: 13, lineHeight: 1.6, color: '#5A6173' }}>
                {generated.avatar.aiPrompt}
              </p>
            </div>
          </div>

          {/* 背景墙视觉 (col-4 · Module 03) */}
          <div
            className="col-span-4 ikb-hovercard"
            style={{
              border: `1px solid ${C.line}`,
              background: C.paper,
              padding: 24,
            }}
          >
            <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 18, fontWeight: 600, color: C.ink, fontFamily: F.cn, margin: 0 }}>
                <span style={{ display: 'flex', height: 36, width: 36, alignItems: 'center', justifyContent: 'center', background: `${C.burgundy}18`, color: C.burgundyText }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden="true">wallpaper</span>
                </span>
                背景墙视觉
              </h3>
              <span
                style={{
                  borderRadius: 999,
                  padding: '4px 10px',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  fontFamily: F.mono,
                  background: `${C.burgundy}18`,
                  color: C.burgundyText,
                }}
              >
                Module 03
              </span>
            </div>
            {/* 背景预览 · 红蓝紫主渐变 */}
            <div
              style={{
                position: 'relative',
                marginBottom: 16,
                display: 'flex',
                aspectRatio: '16/9',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                border: `1px solid ${C.line}`,
                background: C.grad,
              }}
            >
              <div style={{ position: 'absolute', inset: 0, background: C.grad, opacity: 0.85 }} />
              <div style={{ position: 'relative', zIndex: 10, padding: '0 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', fontFamily: F.display }}>理性 · 认知 · 破局</div>
                <div style={{ marginTop: 8, fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.8)', fontFamily: F.mono }}>
                  Systematic Thinking
                </div>
              </div>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.65, color: '#5A6173', fontFamily: F.cn }}>{generated.background.风格理念}</p>
          </div>

          {/* 简介文案公式 (col-8 · Module 04) */}
          <div
            className="col-span-8 ikb-hovercard"
            style={{
              border: `1px solid ${C.line}`,
              background: C.paper,
              padding: 24,
            }}
          >
            <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 18, fontWeight: 600, color: C.ink, fontFamily: F.cn, margin: 0 }}>
                <span style={{ display: 'flex', height: 36, width: 36, alignItems: 'center', justifyContent: 'center', background: `${C.accent3}18`, color: C.purpleText }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden="true">edit_document</span>
                </span>
                简介文案公式
              </h3>
              <span
                style={{
                  borderRadius: 999,
                  padding: '4px 10px',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  fontFamily: F.mono,
                  background: `${C.accent3}18`,
                  color: C.purpleText,
                }}
              >
                Module 04
              </span>
            </div>
            {generated.bioFormula && (
              <div
                style={{
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  border: `1px solid ${C.accent3}44`,
                  background: `${C.accent3}08`,
                  padding: 12,
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: C.purpleText,
                  fontFamily: F.cn,
                }}
              >
                <span className="material-symbols-outlined" style={{ marginTop: 2, fontSize: 18, color: C.purpleText }} aria-hidden="true">bolt</span>
                <span>
                  <span style={{ fontWeight: 700 }}>公式 · </span>
                  {generated.bioFormula}
                </span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              {generated.bioEntries.slice(0, 2).map((b) => (
                <div key={b.platformKey} style={{ border: `1px solid ${C.line}`, background: C.base, padding: 16 }}>
                  <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        borderRadius: 999,
                        background: C.grad,
                        WebkitBackgroundClip: 'text',
                        backgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        color: 'transparent',
                        padding: '4px 0',
                        fontSize: 12,
                        fontWeight: 700,
                        fontFamily: F.mono,
                      }}
                    >
                      {b.platformLabel}
                    </span>
                    <button
                      type="button"
                      aria-label={`复制 ${b.platformLabel} 简介`}
                      onClick={() => copyText(b.copy)}
                      className="ikb-focusring"
                      style={{ cursor: 'pointer', fontSize: 16, color: '#6b7280', background: 'none', border: 'none', padding: 0, transition: 'color 0.2s' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = C.ikb; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#6b7280'; }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }} aria-hidden="true">content_copy</span>
                    </button>
                  </div>
                  <div style={{ whiteSpace: 'pre-line', fontSize: 14, lineHeight: 1.65, color: C.ink, fontFamily: F.cn }}>
                    {b.copy}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 下一步执行 (col-4 · Module 05 · 红蓝紫渐变底) */}
          <div
            className="relative col-span-4 overflow-hidden"
            style={{
              background: C.grad,
              padding: 24,
              color: '#fff',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div aria-hidden="true" style={{ pointerEvents: 'none', position: 'absolute', right: -48, top: -48, height: 160, width: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', filter: 'blur(32px)' }} />
            <div aria-hidden="true" style={{ pointerEvents: 'none', position: 'absolute', bottom: -40, left: -40, height: 128, width: 128, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', filter: 'blur(32px)' }} />
            <div style={{ position: 'relative' }}>
              <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, fontSize: 18, fontWeight: 600, color: '#fff', fontFamily: F.cn }}>
                <span style={{ display: 'flex', height: 36, width: 36, alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.18)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden="true">rocket_launch</span>
                </span>
                下一步执行
              </h3>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 12, fontSize: 15, fontFamily: F.cn }}>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span className="material-symbols-outlined" style={{ marginTop: 2, fontSize: 20, color: 'rgba(255,255,255,0.75)', flexShrink: 0 }} aria-hidden="true">check_box</span>
                  确认并导出全套包装物料
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span className="material-symbols-outlined" style={{ marginTop: 2, fontSize: 20, color: 'rgba(255,255,255,0.75)', flexShrink: 0 }} aria-hidden="true">check_box_outline_blank</span>
                  进入 STEP 04 进行内容选题规划
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span className="material-symbols-outlined" style={{ marginTop: 2, fontSize: 20, color: 'rgba(255,255,255,0.75)', flexShrink: 0 }} aria-hidden="true">check_box_outline_blank</span>
                  注册目标平台账号并应用配置
                </li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => navigate('/step/4')}
              className="ikb-focusring"
              style={{
                marginTop: 32,
                width: '100%',
                border: `1px solid rgba(255,255,255,0.6)`,
                background: 'rgba(255,255,255,0.15)',
                padding: '12px 0',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#fff',
                cursor: 'pointer',
                transition: 'background 0.2s',
                fontFamily: F.mono,
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.25)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.15)'; }}
            >
              进入内容系统 →
            </button>
          </div>
        </div>
      </div>
    </IKBLayout>
  );
}
