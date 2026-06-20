import {
  Brain,
  Clapperboard,
  DollarSign,
  Film,
  LayoutGrid,
  Search,
  Shield,
  Sparkles,
  TrendingUp,
  Users,
  Video,
  Zap,
} from 'lucide-react';

import type { LucideIcon } from 'lucide-react';

// ── 兼容旧接口(其他 page 可能引用) ─────────────────────────────────────────────
export interface GuideModule {
  icon: string;
  title: string;
  desc: string;
  steps?: string[];
}

export interface FAQ {
  q: string;
  a: string;
}

// 旧 GUIDE_MODULES export · 保留兼容(Guide.tsx 不再 import)
export const GUIDE_MODULES: GuideModule[] = [
  {
    icon: '🔥',
    title: '爆款库',
    desc: '一键抓取全平台爆款视频和文案',
    steps: [
      '选择行业分类和内容类型',
      '浏览平台爆款内容排行',
      '收藏高价值爆款到选题库',
      '分析爆款共性提炼规律',
    ],
  },
  {
    icon: '🔍',
    title: '爆款解析',
    desc: '粘贴文案，AI深度拆解爆款密码+一键仿写',
    steps: [
      '粘贴目标文案或视频链接',
      'AI自动识别爆款核心结构',
      '查看钩子/痛点/解决方案拆解',
      '一键生成同款风格仿写',
    ],
  },
  {
    icon: '🎨',
    title: '呈现形式',
    desc: '14种爆款呈现形式全解析',
    steps: [
      '浏览14种视频呈现形式',
      '选择适合自己IP的风格',
      '参考示例视频学习拍摄要点',
      '生成对应形式的脚本模板',
    ],
  },
  {
    icon: '💰',
    title: '变现模型',
    desc: '定制清晰的IP变现路径和收入结构',
    steps: [
      '选择IP类型和目标受众',
      'AI推荐最适合的变现路径',
      '设计三阶梯产品收入结构',
      '生成完整变现方案文档',
    ],
  },
  {
    icon: '🤝',
    title: '私域成交',
    desc: '全链路话术覆盖六大成交阶段',
    steps: [
      '选择成交场景和产品类型',
      '获取六大阶段话术脚本',
      '自定义关键词和风格调整',
      '导出完整私域运营手册',
    ],
  },
  {
    icon: '✨',
    title: '爆款生成',
    desc: 'AI自动生成多角度爆款元素',
    steps: [
      '输入核心主题和目标人群',
      'AI生成多组爆款标题候选',
      '选择最优方案进行微调',
      '一键导出到文案创作模块',
    ],
  },
  {
    icon: '🤖',
    title: '生成文案',
    desc: '基于方法论一键生成爆款文案',
    steps: [
      '选择文案类型和使用场景',
      '填写IP定位和产品信息',
      'AI按22元素结构生成文案',
      '评分优化后导出使用',
    ],
  },
  {
    icon: '📊',
    title: '文案分析',
    desc: '多维度分析评分精准优化',
    steps: [
      '粘贴待分析的文案内容',
      '查看多维度评分报告',
      '按AI建议逐项优化',
      '对比优化前后效果提升',
    ],
  },
  {
    icon: '🎬',
    title: 'AI视频',
    desc: 'AI生成分镜脚本和拍摄指导',
    steps: [
      '输入视频主题和时长',
      'AI自动拆分分镜结构',
      '生成每个镜头的拍摄说明',
      '导出完整视频制作方案',
    ],
  },
  {
    icon: '🧠',
    title: '深度学习',
    desc: '个人知识库AI深度学习管理',
    steps: [
      '上传个人作品和知识资料',
      'AI分析提炼核心创作风格',
      '构建专属知识图谱',
      '在文案生成中调用个人风格',
    ],
  },
  {
    icon: '📹',
    title: '视频制作',
    desc: '文案转分镜脚本和拍摄方案',
    steps: [
      '输入或导入文案内容',
      'AI拆解文案为视频段落',
      '生成分镜脚本和道具清单',
      '获取完整拍摄执行方案',
    ],
  },
];

// 旧 FAQS export · 保留兼容(Guide.tsx 不再 import)
export const FAQS: FAQ[] = [
  {
    q: 'AI 生成的内容可以直接使用吗？',
    a: 'AI生成内容仅供参考，建议根据实际情况修改调整后使用，以确保内容符合您的风格和目标受众需求。直接使用生成内容可能缺乏个人特色，建议二次加工。',
  },
  {
    q: 'AI 视频功能可以直接生成视频吗？',
    a: 'AI视频功能生成的是分镜脚本和拍摄方案，不直接输出视频文件。您需要根据脚本自行拍摄或配合剪辑工具完成最终视频制作。',
  },
  {
    q: '如何让 AI 更了解我的风格？',
    a: '使用深度学习模块上传您的作品、文案和知识资料，AI会逐步分析并构建您的专属风格图谱。积累的素材越多，AI匹配您创作风格的效果越好。',
  },
  {
    q: '数据会被保存吗？',
    a: '您的创作数据和历史记录会安全保存在服务器中，可通过操作历史模块随时查看和恢复。请避免在内容中填写敏感个人信息。',
  },
];

// ── 新增 · sally 1:1 复刻 ────────────────────────────────────────────────────

// ── header chip ──────────────────────────────────────────────────────────────
export const GUIDE_CHIP_TITLE = 'USER GUIDE' as const;
export const GUIDE_CHIP_SUBTITLE = '产品使用说明 · 功能详解 · 最佳实践' as const;

// ── 推荐使用流程 ─────────────────────────────────────────────────────────────
export const GUIDE_FLOW_TITLE = '推荐使用流程' as const;

export interface FlowStep {
  icon: LucideIcon;
  name: string;
  sub: string;
}

export const GUIDE_FLOW: ReadonlyArray<FlowStep> = [
  { icon: Brain, name: '深度学习', sub: '批量文案分析' },
  { icon: DollarSign, name: '设计变现', sub: '规划盈利模式' },
  { icon: Zap, name: '创作内容', sub: '爆款文案生成' },
  { icon: Clapperboard, name: '制作视频', sub: 'AI辅助制作' },
  { icon: Users, name: '私域成交', sub: '转化变现' },
];

// ── search ──────────────────────────────────────────────────────────────────
export const GUIDE_SEARCH_PLACEHOLDER = '搜索功能说明...' as const;

// ── 12 section ──────────────────────────────────────────────────────────────
export interface SectionStep {
  title: string;
  desc: string;
}

export interface GuideSection {
  id: string;
  icon: LucideIcon;
  name: string;
  sub: string;
  steps: ReadonlyArray<SectionStep>;
  tips: ReadonlyArray<string>;
}

export const GUIDE_SECTIONS_12: ReadonlyArray<GuideSection> = [
  {
    id: 'system_overview',
    icon: Shield,
    name: '系统概览',
    sub: '了解AIP智能体的核心能力',
    steps: [
      {
        title: '什么是AIP智能体？',
        desc: 'AIP智能体是一款专为IP变现设计的AI智能工具，集成了爆款创作、视频制作、深度学习等多项AI能力，帮助你快速打造个人IP并实现变现。',
      },
      {
        title: '核心定位',
        desc: '从行业洞察 → 内容创作 → 流量变现，覆盖IP变现全链路。无论你是刚起步的创作者，还是需要提效的成熟IP，都能找到适合的工具。',
      },
      {
        title: '使用前准备',
        desc: '1. 登录账号（点击右上角登录按钮）\n2. 选择你所在的行业领域\n3. 根据需求选择对应功能模块',
      },
    ],
    tips: ['建议先完成行业选择，这样AI会根据你的行业提供更精准的建议', '所有AI生成的内容都可以复制和导出'],
  },
  {
    id: 'trending_library',
    icon: TrendingUp,
    name: '爆款库',
    sub: '全网爆款内容实时追踪',
    steps: [
      {
        title: '选择行业分类',
        desc: '选择你所在的行业，系统会自动抓取该行业最新的爆款内容。',
      },
      {
        title: '浏览爆款内容',
        desc: '查看各平台（抖音、小红书、视频号）的爆款文案、视频和话题。',
      },
      {
        title: '收藏和学习',
        desc: '收藏你感兴趣的爆款内容，分析其爆款元素，为自己的创作提供灵感。',
      },
    ],
    tips: ['每天花10分钟浏览爆款库，培养爆款感觉', '关注爆款的开头和结构，而非简单模仿'],
  },
  {
    id: 'trending_analysis',
    icon: Video,
    name: '爆款解析',
    sub: '拆解爆款视频的成功密码',
    steps: [
      {
        title: '输入视频链接或文案',
        desc: '粘贴你想分析的爆款视频链接或文案内容。',
      },
      {
        title: 'AI深度拆解',
        desc: 'AI会从选题角度、开头设计、内容结构、爆款元素、情绪节奏等维度进行拆解。',
      },
      {
        title: '一键改写',
        desc: '基于分析结果，AI可以帮你一键改写成适合你风格的文案。',
      },
    ],
    tips: ['分析爆款时重点关注前3秒的开头设计', '改写时融入自己的行业特色和个人风格'],
  },
  {
    id: 'presentation_forms',
    icon: LayoutGrid,
    name: '呈现形式',
    sub: '多样化的内容呈现方式',
    steps: [
      {
        title: '浏览呈现形式库',
        desc: '查看口播、情景剧、vlog、图文、直播切片等多种内容呈现形式。',
      },
      {
        title: '了解各形式特点',
        desc: '每种形式都有详细的适用场景、优势分析和制作要点说明。',
      },
      {
        title: '选择适合的形式',
        desc: '根据你的行业和个人特点，选择最适合的1-2种呈现形式深耕。',
      },
    ],
    tips: ['新手建议从口播开始，门槛低且容易出效果', '不要贪多，先专注做好1种形式再扩展'],
  },
  {
    id: 'monetization_model',
    icon: DollarSign,
    name: '变现模型',
    sub: '定制你的IP变现策略',
    steps: [
      {
        title: '输入行业和产品信息',
        desc: '告诉AI你的行业、产品/服务、目标客户等基本信息。',
      },
      {
        title: '生成变现模型',
        desc: 'AI会根据你的情况，生成包含前端引流产品、中端转化产品、后端利润产品的完整变现模型。',
      },
      {
        title: '优化变现路径',
        desc: 'AI会给出具体的定价策略、转化话术和私域运营建议。',
      },
    ],
    tips: ['变现模型要定期根据数据反馈进行调整', '先跑通最小闭环，再扩大规模'],
  },
  {
    id: 'private_domain',
    icon: Users,
    name: '私域成交',
    sub: '打造高转化的私域成交体系',
    steps: [
      {
        title: '设定成交场景',
        desc: '选择你的成交场景（微信私聊、社群、朋友圈等）和产品类型。',
      },
      {
        title: '生成成交方案',
        desc: 'AI会生成完整的私域成交方案，包括引流话术、破冰话术、需求挖掘、异议处理、逼单话术等。',
      },
      {
        title: '实战应用',
        desc: '将AI生成的话术模板应用到实际成交场景中，根据反馈持续优化。',
      },
    ],
    tips: ['私域成交的关键是建立信任，不要急于推销', '定期复盘对话记录，优化话术效果'],
  },
  {
    id: 'trending_generation',
    icon: Zap,
    name: '爆款生成',
    sub: '融合爆款元素一键生成文案',
    steps: [
      {
        title: '选择爆款元素',
        desc: '从反差、悬念、共鸣、争议、干货、故事、数据、痛点等爆款元素中选择1-3个。',
      },
      {
        title: '设定主题方向',
        desc: '输入你想创作的主题或方向（可选），AI会结合爆款元素自动生成。',
      },
      {
        title: '获取5篇爆款文案',
        desc: 'AI会一次性生成5篇融合所选爆款元素的文案，每篇采用不同的切入角度。',
      },
    ],
    tips: ['建议每次选2-3个爆款元素组合使用', '生成后可以在"生成文案"模块进一步优化'],
  },
  {
    id: 'content_generation',
    icon: Sparkles,
    name: '生成文案',
    sub: 'AI智能文案创作与优化',
    steps: [
      {
        title: '选择脚本类型',
        desc: '选择观点型、故事型、干货型、情感型等脚本类型。',
      },
      {
        title: '输入创作要求',
        desc: '输入主题、关键词、目标受众等信息，AI会根据你的风格档案生成文案。',
      },
      {
        title: '优化和导出',
        desc: '对生成的文案进行AI优化，调整语气、长度、风格，满意后复制导出。',
      },
    ],
    tips: [
      '先在"智能进化"中设置你的风格档案，生成的文案会更贴合你的风格',
      '善用优化功能，一篇文案可以反复优化3-5次',
    ],
  },
  {
    id: 'content_analysis',
    icon: Search,
    name: '文案分析',
    sub: 'AI分析文案结构和优化建议',
    steps: [
      {
        title: '粘贴文案',
        desc: '将你写好的文案或看到的好文案粘贴到分析框中。',
      },
      {
        title: '获取分析报告',
        desc: 'AI会从结构、节奏、情绪曲线、爆款元素、开头吸引力等维度进行分析。',
      },
      {
        title: '应用优化建议',
        desc: '根据AI的分析建议，针对性地优化你的文案。',
      },
    ],
    tips: ['先分析10篇同行爆款，找到行业内容规律', '重点优化开头3秒和结尾引导'],
  },
  {
    id: 'ai_video',
    icon: Clapperboard,
    name: 'AI视频',
    sub: '文案一键转视频分镜',
    steps: [
      {
        title: '输入文案',
        desc: '将你的短视频文案粘贴到输入框中。',
      },
      {
        title: '选择风格和比例',
        desc: '选择视觉风格（电影质感/赛博朋克/写实/卡通/极简）和画面比例（竖屏/横屏/方形）。',
      },
      {
        title: '生成分镜脚本',
        desc: 'AI会自动将文案拆解为4-8个分镜场景，包含画面描述、旁白、镜头运动、转场等详细信息。',
      },
      {
        title: '生成场景图片',
        desc: '点击每个分镜的"生成图片"按钮，AI会根据画面描述生成对应的场景图片。也可以一键生成全部图片。',
      },
    ],
    tips: ['赛博朋克风格适合科技/潮流类内容', '生成的分镜脚本可以直接交给剪辑师执行'],
  },
  {
    id: 'deep_learning',
    icon: Brain,
    name: '深度学习',
    sub: '批量添加文案，AI深度分析风格逻辑',
    steps: [
      {
        title: '批量添加文案',
        desc: '粘贴或输入你的文案样本，最多支持50篇。',
      },
      {
        title: 'AI深度分析',
        desc: 'AI会分析文案的写作风格、内容逻辑、语言特征等。',
      },
      {
        title: '应用到创作',
        desc: '学习完成后，文案生成时可选择已学习的风格模板。',
      },
    ],
    tips: ['添加5-10篇代表作效果最佳', '可以创建多个风格模板，适用于不同场景'],
  },
  {
    id: 'video_production',
    icon: Film,
    name: '视频制作',
    sub: 'AI辅助视频脚本制作',
    steps: [
      {
        title: '输入视频主题',
        desc: '告诉AI你想制作什么类型的视频，包括主题、时长、风格等。',
      },
      {
        title: '生成完整脚本',
        desc: 'AI会生成包含分镜、台词、画面描述、BGM建议的完整视频脚本。',
      },
      {
        title: '导出执行',
        desc: '将脚本导出，按照分镜指导进行拍摄和剪辑。',
      },
    ],
    tips: ['视频脚本要先写好再开拍，避免临场发挥', 'BGM建议结合内容情绪选择'],
  },
];

// ── FAQ ─────────────────────────────────────────────────────────────────────
export const GUIDE_FAQ_TITLE = '常见问题' as const;

export const GUIDE_FAQS_4: ReadonlyArray<FAQ> = [
  {
    q: 'AI生成的内容可以直接使用吗？',
    a: 'AI生成的内容是高质量的初稿，建议根据你的实际情况和个人风格进行适当调整后使用。',
  },
  {
    q: 'AI视频功能可以直接生成视频吗？',
    a: '目前AI视频功能会生成详细的分镜脚本和场景图片，你可以根据这些素材在剪辑软件中快速制作视频。',
  },
  {
    q: '如何让AI更了解我的风格？',
    a: '使用"智能进化"功能，上传你的代表作品，AI会学习你的写作风格，后续生成的内容会更贴合你的特点。',
  },
  {
    q: '数据会被保存吗？',
    a: '你的所有生成记录都会保存在"历史记录"中，可以随时查看和复用。',
  },
];

// ── 实用技巧 box label ──────────────────────────────────────────────────────
export const GUIDE_TIPS_TITLE = '实用技巧' as const;
