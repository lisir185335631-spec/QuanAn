import { type FormEvent, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

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
import { PioneerLayout } from '@/layouts/PioneerLayout';
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

  const PLATFORMS = [
    { key: 'xiaohongshu', label: '小红书', icon: 'menu_book', color: '#ff2442', desc: '种草 · 图文' },
    { key: 'douyin', label: '抖音', icon: 'music_note', color: '#0ea5b7', desc: '短视频 · 流量' },
    { key: 'wechat', label: '视频号', icon: 'smart_display', color: '#07c160', desc: '私域 · 转化' },
  ];
  const btnSecondary =
    'flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border border-[#e5e7eb] bg-white px-4 py-2.5 text-[12px] font-bold uppercase tracking-widest text-[#1b1b1b] transition-colors hover:bg-[#e8e8e8] disabled:cursor-not-allowed disabled:opacity-40';

  return (
    <PioneerLayout>
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="mb-12 flex flex-row items-center justify-between gap-8">
        <div className="shrink-0">
          <div className="mb-3 flex items-center gap-3">
            <span className="rounded-lg border border-[#e5e7eb] bg-[#e8e8e8] px-3 py-1 text-[12px] font-bold uppercase tracking-widest text-[#1b1b1b]">
              战略节点
            </span>
            <span className="rounded-lg border border-[#6e5e00] bg-[#F6D300] px-3 py-1 text-[12px] font-bold uppercase tracking-widest text-[#221b00]">
              账号矩阵
            </span>
          </div>
          <h1 className="whitespace-nowrap text-[40px] font-extrabold tracking-tighter text-[#1b1b1b]">
            STEP 03 · 账号包装方案
          </h1>
          <p className="mt-2 max-w-[820px] text-[16px] leading-relaxed text-[#444653]">
            为「{industry}」生成高度定制的自媒体账号基础包装 · 构建专业、权威的数字形象基石。
          </p>
        </div>
        <div className="flex shrink-0 flex-nowrap gap-3">
          <button type="button" onClick={handleOptimize} disabled={!canBulkActions} className={btnSecondary}>
            <span className="material-symbols-outlined text-[18px]">auto_fix_high</span>
            智能优化
          </button>
          <button
            type="button"
            onClick={handleRegenerateAll}
            disabled={isLoading || !personalInfo.trim() || !platform}
            className={btnSecondary}
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            重新生成
          </button>
          <button
            type="button"
            onClick={handleCopyAll}
            className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-md bg-gradient-to-r from-[#002fa7] to-[#3654c8] px-4 py-2 text-[13px] font-semibold text-white shadow-sm shadow-[#002fa7]/25 transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            导出方案
          </button>
        </div>
      </header>

      {/* ── 输入节点参数 ───────────────────────────────────── */}
      <section className="relative mb-12 overflow-hidden rounded-xl border border-[#e5e7eb] bg-gradient-to-br from-white to-[#f7faff] p-6 pw-shadow-soft">
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[#002fa7]/[0.05] blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-44 w-44 rounded-full bg-[#781621]/[0.04] blur-2xl" />
        <div className="relative mb-6 flex items-center justify-between border-b border-[#eef1f6] pb-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#002fa7] to-[#3654c8] text-white shadow-lg shadow-[#002fa7]/25">
              <span className="material-symbols-outlined">tune</span>
            </span>
            <div>
              <h2 className="text-[18px] font-bold text-[#111827]">输入节点参数</h2>
              <p className="text-[12px] text-[#9ca3af]">填写基础信息 · AI 据此生成全套账号包装矩阵</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#10b981]/10 px-3 py-1 text-[12px] font-semibold text-[#10b981]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#10b981]" />
            参数就绪
          </span>
        </div>
        <div className="relative">
        <form onSubmit={handleSubmit} className="space-y-7">
          {/* 目标平台 · 可视化平台卡 */}
          <div>
            <span className="mb-3 flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide text-[#1b1b1b] before:h-3.5 before:w-1 before:rounded-full before:bg-gradient-to-b before:from-[#002fa7] before:to-[#781621] before:content-['']">
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
                    className={`group relative flex items-center gap-3 overflow-hidden rounded-xl border p-3.5 text-left transition-all ${active ? 'border-[#002fa7] bg-[#002fa7]/[0.04] shadow-sm' : 'border-[#e5e7eb] bg-white hover:border-[#c7d2fe] hover:bg-[#f8faff]'}`}
                  >
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white shadow-sm"
                      style={{ backgroundColor: p.color }}
                    >
                      <span className="material-symbols-outlined text-[22px]">{p.icon}</span>
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[14px] font-bold text-[#111827]">{p.label}</span>
                      <span className="block text-[11px] text-[#9ca3af]">{p.desc}</span>
                    </span>
                    <span
                      className={`absolute right-2.5 top-2.5 flex h-4 w-4 items-center justify-center rounded-full transition-all ${active ? 'bg-[#002fa7] text-white' : 'border border-[#e5e7eb] bg-white text-transparent'}`}
                    >
                      <span className="material-symbols-outlined text-[12px]">check</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 目标受众 + 账号状态 · 双列带图标输入 */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label htmlFor="s3-audience" className="mb-2 flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide text-[#1b1b1b] before:h-3.5 before:w-1 before:rounded-full before:bg-gradient-to-b before:from-[#002fa7] before:to-[#781621] before:content-['']">
                目标受众
              </label>
              <div className="relative">
                <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#9ca3af]">groups</span>
                <input
                  id="s3-audience"
                  type="text"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  placeholder="例如：企业老板和创业者"
                  className="w-full rounded-lg border border-[#e5e7eb] bg-[#f9f9f9] py-3 pl-10 pr-3 text-[14px] outline-none transition-all focus:border-[#002fa7] focus:bg-white focus:ring-1 focus:ring-[#002fa7]"
                />
              </div>
            </div>
            <div>
              <label htmlFor="s3-account-status" className="mb-2 flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide text-[#1b1b1b] before:h-3.5 before:w-1 before:rounded-full before:bg-gradient-to-b before:from-[#002fa7] before:to-[#781621] before:content-['']">
                账号状态
              </label>
              <div className="relative">
                <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#9ca3af]">verified_user</span>
                <input
                  id="s3-account-status"
                  type="text"
                  value={accountStatus}
                  onChange={(e) => setAccountStatus(e.target.value)}
                  placeholder="例如：新账号 / 已有粉丝"
                  className="w-full rounded-lg border border-[#e5e7eb] bg-[#f9f9f9] py-3 pl-10 pr-3 text-[14px] outline-none transition-all focus:border-[#002fa7] focus:bg-white focus:ring-1 focus:ring-[#002fa7]"
                />
              </div>
            </div>
          </div>

          {/* 个人背景 · 框式编辑器 + 工具栏 */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="s3-personal-info" className="flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide text-[#1b1b1b] before:h-3.5 before:w-1 before:rounded-full before:bg-gradient-to-b before:from-[#002fa7] before:to-[#781621] before:content-['']">
                个人背景与核心优势提取
              </label>
              <span className="flex items-center gap-1 text-[11px] text-[#9ca3af]">
                <span className="material-symbols-outlined text-[14px] text-[#781621]">auto_awesome</span>
                AI 据此提取人设关键词
              </span>
            </div>
            <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-[#f9f9f9] transition-all focus-within:border-[#002fa7] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#002fa7]">
              <textarea
                id="s3-personal-info"
                value={personalInfo}
                onChange={(e) => setPersonalInfo(e.target.value)}
                rows={6}
                placeholder="输入过去的经历、成就、特殊技能，以及希望传达的核心人设"
                className="w-full resize-none border-0 bg-transparent p-4 text-[14px] leading-relaxed outline-none"
              />
              <div className="flex items-center justify-between gap-3 border-t border-[#eef1f6] bg-white/60 px-4 py-2.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-[#9ca3af]">可包含</span>
                  {['经历', '成就', '技能', '人设', '价值观'].map((t) => (
                    <span key={t} className="rounded-full bg-[#f1f3f9] px-2.5 py-0.5 text-[11px] font-medium text-[#6b7280]">
                      {t}
                    </span>
                  ))}
                </div>
                <span className="shrink-0 text-[11px] tabular-nums text-[#9ca3af]">{personalInfo.length} 字</span>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                disabled={!personalInfo.trim() || !platform || isLoading}
                className="flex items-center gap-2 rounded-xl bg-[#002fa7] px-8 py-3 text-[12px] font-bold uppercase tracking-widest text-white pw-shadow-soft transition-all hover:bg-[#001e73] active:translate-x-px active:translate-y-px active:shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                {isLoading ? '生成中…' : '生成包装矩阵'}
              </button>
            </div>
          </div>
        </form>
        </div>
      </section>

      {/* ── 数据洞察(雷达 + 趋势)──────────────────────────── */}
      <div className="mb-3 flex items-center gap-2">
        <span className="material-symbols-outlined text-[20px] text-[#002fa7]">insights</span>
        <h2 className="text-[16px] font-bold text-[#111827]">数据洞察</h2>
        <span className="text-[12px] text-[#9ca3af]">· AI 综合评估 · 实时测算</span>
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-[#10b981]/10 px-3 py-1 text-[12px] font-semibold text-[#10b981]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#10b981]" />
          模型已就绪
        </span>
      </div>
      <div className="mb-8 grid grid-cols-12 gap-6">
        {/* 人设竞争力雷达 */}
        <div className="col-span-5 rounded-xl border border-[#e5e7eb] bg-gradient-to-br from-white to-[#f5f8ff] p-6 pw-shadow-soft">
          <div className="mb-1 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#002fa7]/10 text-[#002fa7]">
                <span className="material-symbols-outlined text-[20px]">radar</span>
              </span>
              <div>
                <h3 className="text-[14px] font-bold text-[#111827]">人设竞争力雷达</h3>
                <p className="text-[11px] text-[#9ca3af]">六维模型评估</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[26px] font-bold leading-none text-[#002fa7]">82</p>
              <p className="text-[10px] text-[#9ca3af]">综合分</p>
            </div>
          </div>
          {(() => {
            const dims = [
              { label: '专业度', value: 88, color: '#002fa7' },
              { label: '影响力', value: 76, color: '#781621' },
              { label: '记忆点', value: 92, color: '#F6D300' },
              { label: '转化力', value: 81, color: '#002fa7' },
              { label: '稀缺性', value: 70, color: '#781621' },
              { label: '一致性', value: 85, color: '#F6D300' },
            ];
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
                    <stop offset="0%" stopColor="#002fa7" stopOpacity="0.38" />
                    <stop offset="100%" stopColor="#781621" stopOpacity="0.12" />
                  </linearGradient>
                </defs>
                {[0.25, 0.5, 0.75, 1].map((f) => (
                  <polygon key={f} points={poly(R * f)} fill="none" stroke="#e8ebf2" strokeWidth="1" />
                ))}
                {dims.map((_, i) => {
                  const [x, y] = pt(i, R);
                  return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#eef1f6" strokeWidth="1" />;
                })}
                <polygon points={dataPoly} fill="url(#radarFillS3)" stroke="#002fa7" strokeWidth="2" strokeLinejoin="round" />
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
            {[
              { label: '专业度', value: 88, color: '#002fa7' },
              { label: '影响力', value: 76, color: '#781621' },
              { label: '记忆点', value: 92, color: '#F6D300' },
              { label: '转化力', value: 81, color: '#002fa7' },
              { label: '稀缺性', value: 70, color: '#781621' },
              { label: '一致性', value: 85, color: '#F6D300' },
            ].map((d) => (
              <div key={d.label} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-[11px] text-[#6b7280]">{d.label}</span>
                <span className="text-[11px] font-bold text-[#111827]">{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 90 天曝光 / 涨粉预估 */}
        <div className="col-span-7 rounded-xl border border-[#e5e7eb] bg-gradient-to-br from-white to-[#f7f5ff] p-6 pw-shadow-soft">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#781621]/10 text-[#781621]">
                <span className="material-symbols-outlined text-[20px]">show_chart</span>
              </span>
              <div>
                <h3 className="text-[14px] font-bold text-[#111827]">90 天曝光预估</h3>
                <p className="text-[11px] text-[#9ca3af]">按当前人设矩阵测算</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {['曝光', '涨粉', '互动'].map((t, i) => (
                <span
                  key={t}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-semibold ${i === 0 ? 'bg-[#002fa7] text-white' : 'bg-[#f1f3f9] text-[#6b7280]'}`}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="mb-3 flex items-end gap-3">
            <p className="text-[30px] font-bold leading-none text-[#111827]">1.24M</p>
            <span className="mb-1 inline-flex items-center gap-0.5 rounded-full bg-[#10b981]/10 px-2 py-0.5 text-[12px] font-bold text-[#10b981]">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>+214%
            </span>
            <span className="mb-1 text-[12px] text-[#9ca3af]">较冷启动基线</span>
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
                    <stop offset="0%" stopColor="#002fa7" stopOpacity="0.24" />
                    <stop offset="100%" stopColor="#002fa7" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="trendLineS3" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#002fa7" />
                    <stop offset="100%" stopColor="#781621" />
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
                  i % 3 === 0 ? <circle key={i} cx={x(i)} cy={y(v)} r="3.4" fill="#fff" stroke="#002fa7" strokeWidth="2" /> : null,
                )}
              </svg>
            );
          })()}
          <div className="mt-1 flex justify-between px-1 text-[10px] text-[#9ca3af]">
            {['第1周', '第3周', '第5周', '第7周', '第9周', '第12周'].map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── 数据概览(KPI 仪表盘)──────────────────────────── */}
      <div className="mb-8 grid grid-cols-4 gap-6">
        {/* 人设完整度 · 环形进度 */}
        <div className="rounded-xl border border-[#e0e7ff] bg-gradient-to-br from-white to-[#f3f6ff] p-5 pw-shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#002fa7]/10 text-[#002fa7]">
              <span className="material-symbols-outlined text-[20px]">verified</span>
            </span>
            <span className="inline-flex items-center gap-0.5 rounded-full bg-[#10b981]/10 px-2 py-0.5 text-[11px] font-bold text-[#10b981]">
              <span className="material-symbols-outlined text-[13px]">trending_up</span>+18%
            </span>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-[28px] font-bold leading-none text-[#111827]">
                92<span className="text-[15px] text-[#9ca3af]">%</span>
              </p>
              <p className="mt-1.5 text-[12px] text-[#6b7280]">人设完整度</p>
            </div>
            <div className="h-12 w-12 shrink-0">
              <svg viewBox="0 0 36 36" className="-rotate-90">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#eef2ff" strokeWidth="3.5" />
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="none"
                  stroke="#002fa7"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeDasharray="92 100"
                />
              </svg>
            </div>
          </div>
        </div>
        {/* 推荐昵称 · 数量 + 迷你柱 */}
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 pw-shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#781621]/10 text-[#781621]">
              <span className="material-symbols-outlined text-[20px]">text_fields</span>
            </span>
            <span className="rounded-full bg-[#781621]/10 px-2 py-0.5 text-[11px] font-bold text-[#781621]">已评估</span>
          </div>
          <div className="mt-4">
            <p className="text-[28px] font-bold leading-none text-[#111827]">
              {generated.nicknames.length}
              <span className="text-[15px] text-[#9ca3af]"> 个</span>
            </p>
            <p className="mt-1.5 text-[12px] text-[#6b7280]">推荐昵称</p>
          </div>
          <div className="mt-3 flex h-6 items-end gap-1">
            {[58, 84, 70, 96, 78].map((h, i) => (
              <div key={i} className="flex-1 rounded-t bg-[#781621]/70" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
        {/* 平台覆盖 · 进度条 */}
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 pw-shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F6D300]/20 text-[#8a6a00]">
              <span className="material-symbols-outlined text-[20px]">hub</span>
            </span>
            <span className="rounded-full bg-[#F6D300]/20 px-2 py-0.5 text-[11px] font-bold text-[#8a6a00]">全覆盖</span>
          </div>
          <div className="mt-4">
            <p className="text-[28px] font-bold leading-none text-[#111827]">
              5<span className="text-[15px] text-[#9ca3af]"> 平台</span>
            </p>
            <p className="mt-1.5 text-[12px] text-[#6b7280]">平台覆盖</p>
          </div>
          <div className="mt-3 h-2 w-full rounded-full bg-[#fdf6cc]">
            <div className="h-2 w-full rounded-full bg-gradient-to-r from-[#F6D300] to-[#ffe45c]" />
          </div>
        </div>
        {/* 简介方案 · 数量 + 关键词 */}
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 pw-shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#002fa7]/10 text-[#002fa7]">
              <span className="material-symbols-outlined text-[20px]">edit_document</span>
            </span>
            <span className="rounded-full bg-[#002fa7]/10 px-2 py-0.5 text-[11px] font-bold text-[#002fa7]">
              {generated.bioCoreKeywords?.length ?? 5} 关键词
            </span>
          </div>
          <div className="mt-4">
            <p className="text-[28px] font-bold leading-none text-[#111827]">
              {generated.bioEntries.length}
              <span className="text-[15px] text-[#9ca3af]"> 套</span>
            </p>
            <p className="mt-1.5 text-[12px] text-[#6b7280]">简介文案方案</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-1">
            {(generated.bioCoreKeywords ?? []).slice(0, 3).map((k) => (
              <span
                key={k}
                className="rounded bg-[#eff4ff] px-1.5 py-0.5 text-[10px] font-medium text-[#002fa7]"
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
        <div className="relative col-span-12 overflow-hidden rounded-xl border border-[#dbe2ff] bg-gradient-to-br from-[#eff4ff] via-white to-[#f7f1ff] p-6 pw-shadow-soft">
          <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-[#002fa7]/[0.07] blur-2xl" />
          <div className="pointer-events-none absolute -bottom-16 right-40 h-40 w-40 rounded-full bg-[#781621]/[0.06] blur-2xl" />
          <div className="relative flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#002fa7] to-[#3654c8] shadow-lg shadow-[#002fa7]/25">
              <span className="material-symbols-outlined icon-fill text-white">psychology</span>
            </div>
            <div>
              <span className="mb-1.5 inline-flex items-center gap-1.5 rounded-full bg-[#002fa7]/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#002fa7]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#002fa7]" />
                Core Strategy
              </span>
              <h3 className="mb-2 text-[20px] font-bold text-[#111827]">核心定位策略</h3>
              <p className="text-[16px] leading-relaxed text-[#444653]">
                {generated.overallStrategy.视觉统一性}
              </p>
            </div>
          </div>
        </div>

        {/* 矩阵命名 (col-4 · Module 01) */}
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-6 pw-shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md col-span-4">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="flex items-center gap-2.5 text-[18px] font-semibold text-[#111827]">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#781621]/10 text-[#781621]">
                <span className="material-symbols-outlined text-[20px]">text_fields</span>
              </span>
              矩阵命名
            </h3>
            <span className="rounded-full bg-[#781621]/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[#781621]">
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
                  onClick={() => copyText(n.name)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') copyText(n.name); }}
                  className="group cursor-pointer rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-3 transition-all hover:border-[#781621] hover:bg-white"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-[16px] font-bold text-[#111827]">{n.name}</div>
                    <span className="material-symbols-outlined shrink-0 text-[#9ca3af] group-hover:text-[#781621]">
                      content_copy
                    </span>
                  </div>
                  <div className="mt-1 text-[13px] leading-snug text-[#6b7280]">{n.description}</div>
                  <div className="mt-2.5">
                    <div className="mb-1 flex items-center justify-between text-[11px]">
                      <span className="text-[#9ca3af]">搜索度</span>
                      <span className="font-bold text-[#781621]">{score}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-[#eef2ff]">
                      <div
                        className="h-1.5 rounded-full bg-gradient-to-r from-[#781621] to-[#781621]"
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 头像生成流 (col-4 · Module 02 · border-t red) */}
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-6 pw-shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md col-span-4">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="flex items-center gap-2.5 text-[18px] font-semibold text-[#111827]">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#781621]/10 text-[#781621]">
                <span className="material-symbols-outlined text-[20px]">face</span>
              </span>
              头像生成流
            </h3>
            <span className="rounded-full bg-[#781621]/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[#781621]">
              Module 02
            </span>
          </div>
          <button
            type="button"
            onClick={handleImageGenStub}
            className="mb-4 flex aspect-square w-full flex-col items-center justify-center rounded-lg border border-[#e5e7eb] bg-[#f9f9f9] p-4 text-center transition-colors hover:border-[#002fa7]"
          >
            <span className="material-symbols-outlined mb-2 text-4xl text-[#757685]">image</span>
            <p className="text-[14px] text-[#444653]">点击生成头像</p>
          </button>
          <div className="rounded-lg border border-[#e5e7eb] bg-[#f9f9f9] p-3">
            <div className="mb-2 flex justify-between text-[12px] font-bold uppercase text-[#a5383f]">
              AI Prompt
              <button
                type="button"
                aria-label="复制"
                onClick={() => copyText(generated.avatar.aiPrompt ?? '')}
                className="cursor-pointer text-[16px] hover:text-[#1b1b1b]"
              >
                <span className="material-symbols-outlined text-[16px]" aria-hidden="true">content_copy</span>
              </button>
            </div>
            <p className="break-words font-mono text-[13px] leading-relaxed text-[#444653]">
              {generated.avatar.aiPrompt}
            </p>
          </div>
        </div>

        {/* 背景墙视觉 (col-4 · Module 03) */}
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-6 pw-shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md col-span-4">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="flex items-center gap-2.5 text-[18px] font-semibold text-[#111827]">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#781621]/10 text-[#781621]">
                <span className="material-symbols-outlined text-[20px]">wallpaper</span>
              </span>
              背景墙视觉
            </h3>
            <span className="rounded-full bg-[#781621]/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[#781621]">
              Module 03
            </span>
          </div>
          <div className="relative mb-4 flex aspect-video items-center justify-center overflow-hidden rounded-xl border border-[#e5e7eb] bg-[#002fa7]">
            <div className="absolute inset-0 bg-gradient-to-br from-[#001e73] via-[#002fa7] to-[#3654c8] opacity-80" />
            <div className="relative z-10 px-4 text-center">
              <div className="text-[20px] font-bold text-white">理性 · 认知 · 破局</div>
              <div className="mt-2 text-[12px] font-bold uppercase tracking-widest text-white/80">
                Systematic Thinking
              </div>
            </div>
          </div>
          <p className="text-[14px] leading-relaxed text-[#444653]">{generated.background.风格理念}</p>
        </div>

        {/* 简介文案公式 (col-8 · Module 04 · border-t gold) */}
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-6 pw-shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md col-span-8">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="flex items-center gap-2.5 text-[18px] font-semibold text-[#111827]">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F6D300]/10 text-[#8a6a00]">
                <span className="material-symbols-outlined text-[20px]">edit_document</span>
              </span>
              简介文案公式
            </h3>
            <span className="rounded-full bg-[#F6D300]/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[#8a6a00]">
              Module 04
            </span>
          </div>
          {generated.bioFormula && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-[#F3E08A] bg-gradient-to-r from-[#fefce0] to-[#fefce8] p-3 text-[14px] leading-relaxed text-[#854d0e]">
              <span className="material-symbols-outlined mt-0.5 text-[18px] text-[#8a6a00]">bolt</span>
              <span>
                <span className="font-bold">公式 · </span>
                {generated.bioFormula}
              </span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            {generated.bioEntries.slice(0, 2).map((b) => (
              <div key={b.platformKey} className="rounded-lg border border-[#e5e7eb] bg-[#f9f9f9] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-gradient-to-r from-[#002fa7]/10 to-[#781621]/10 px-2.5 py-1 text-[12px] font-bold text-[#002fa7]">
                    <span className="material-symbols-outlined text-[14px]">alternate_email</span>
                    {b.platformLabel}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyText(b.copy)}
                    className="material-symbols-outlined cursor-pointer text-[16px] text-[#9ca3af] transition-colors hover:text-[#002fa7]"
                  >
                    content_copy
                  </button>
                </div>
                <div className="whitespace-pre-line text-[14px] leading-relaxed text-[#1b1b1b]">
                  {b.copy}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 下一步执行 (col-4 · Module 05 · blue) */}
        <div className="relative col-span-4 flex flex-col justify-between overflow-hidden rounded-xl bg-gradient-to-br from-[#002fa7] to-[#001952] p-6 text-white pw-shadow-soft">
          <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-[#781621]/20 blur-2xl" />
          <div className="relative">
            <h3 className="mb-4 flex items-center gap-2.5 text-[18px] font-semibold">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
                <span className="material-symbols-outlined text-[20px]">rocket_launch</span>
              </span>
              下一步执行
            </h3>
            <ul className="space-y-3 text-[15px]">
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined mt-0.5 text-[20px] text-[#b8c4ff]">check_box</span>
                确认并导出全套包装物料
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined mt-0.5 text-[20px] text-[#b8c4ff]">
                  check_box_outline_blank
                </span>
                进入 STEP 04 进行内容选题规划
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined mt-0.5 text-[20px] text-[#b8c4ff]">
                  check_box_outline_blank
                </span>
                注册目标平台账号并应用配置
              </li>
            </ul>
          </div>
          <button
            type="button"
            onClick={() => navigate('/step/4')}
            className="mt-8 w-full rounded-xl border border-[#e5e7eb] bg-white py-3 text-[12px] font-bold uppercase tracking-widest text-[#002fa7] shadow-sm transition-colors hover:bg-[#f3f3f3]"
          >
            进入内容系统 →
          </button>
        </div>
      </div>
    </PioneerLayout>
  );
}
