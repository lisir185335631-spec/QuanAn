import {
  BookOpen,
  Brain,
  Camera,
  Clapperboard,
  Cpu,
  DollarSign,
  FileText,
  Film,
  Fingerprint,
  Globe,
  LayoutGrid,
  Mic,
  Radio,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Video,
  Zap,
} from 'lucide-react';

import type { LucideIcon } from 'lucide-react';

// Hero
export const HOME_HERO_CHIP = 'SYSTEM ONLINE · AIP全案获客操盘手' as const;
// hero 大字 typewriter 轮播 · 4 句(与副标题一致)逐字打字+删除+光标
export const HOME_HERO_ROTATION: ReadonlyArray<string> = [
  'OPC全案落地',
  '从流量到成交',
  'AI+短视频+IP',
  '全链路变现',
];
export const HOME_HERO_SUBTITLE = 'OPC全案落地 · 从流量到成交 · AI+短视频+IP · 全链路变现' as const;
export const HOME_HERO_QUOTE = '"善用AI，你一个人就是千军万马！"' as const;
export const HOME_HERO_BRAND = 'POWERED BY ADVANCED AI · FULL-CHAIN INTELLIGENT ACCELERATION' as const;
export const HOME_HERO_CTA1 = '启动智能分析' as const;
export const HOME_HERO_CTA2 = '使用说明' as const;
export const HOME_HERO_CTA1_HREF = '/step/1' as const;
export const HOME_HERO_CTA2_HREF = '/guide' as const;
export const HOME_HERO_TYPE_MS = 120 as const; // 每字打字间隔
export const HOME_HERO_DELETE_MS = 55 as const; // 每字删除间隔
export const HOME_HERO_HOLD_MS = 1400 as const; // 打满后停留

// Progress block
export const HOME_PROGRESS_TITLE = '我的IP打造进度' as const;
export const HOME_PROGRESS_SUBTITLE = '恭喜！全部流程已完成' as const;
export const HOME_PROGRESS_VIEW_PLAN = '查看IP方案' as const;
export const HOME_PROGRESS_OVERALL = '总体进度' as const;
export const HOME_PROGRESS_PERCENT = '100%' as const;
export const HOME_PROGRESS_VIEW_PLAN_HREF = '/ip-plan' as const;

export interface HomeStep {
  label: string;
  icon: LucideIcon;
}
export const HOME_STEPS: ReadonlyArray<HomeStep> = [
  { label: '选择行业', icon: LayoutGrid },
  { label: '账号包装', icon: Users },
  { label: '人设定制', icon: Fingerprint },
  { label: '执行计划', icon: Target },
  { label: '变现路径', icon: DollarSign },
  { label: '爆款选题', icon: TrendingUp },
  { label: '拍摄计划', icon: Camera },
  { label: '文案生成', icon: Sparkles },
  { label: '直播策划', icon: Radio },
];

// Stats
export interface HomeStat {
  icon: LucideIcon;
  value: string;
  label: string;
}
export const HOME_STATS: ReadonlyArray<HomeStat> = [
  { icon: Globe, value: '56+', label: '覆盖行业' },
  { icon: Zap, value: '22', label: '爆款元素' },
  { icon: Film, value: '20', label: '脚本类型' },
  { icon: TrendingUp, value: '5', label: '平台覆盖' },
];

// Function matrix
export const HOME_MATRIX_TITLE = 'FUNCTION MATRIX' as const;
export const HOME_MATRIX_SUBTITLE = '全链路功能矩阵 · 洞察市场 → 设计变现 → 创作内容 → 智能工具' as const;

export interface HomeMatrixCard {
  icon: LucideIcon;
  title: string;
  desc: string;
  href: string;
  arrow?: boolean;
}
export interface HomeMatrixGroup {
  groupIcon: LucideIcon;
  groupTitle: string;
  cols: 2 | 3 | 5;
  cards: ReadonlyArray<HomeMatrixCard>;
}

export const HOME_MATRIX: ReadonlyArray<HomeMatrixGroup> = [
  {
    groupIcon: Globe,
    groupTitle: '市场洞察',
    cols: 3,
    cards: [
      {
        icon: TrendingUp,
        title: '全网爆款库',
        desc: '一键抓取全平台爆款视频和文案',
        href: '/trending',
      },
      {
        icon: Video,
        title: '爆款文案解析',
        desc: '粘贴文案，AI深度拆解爆款密码+一键仿写',
        href: '/video-analysis',
      },
      {
        icon: LayoutGrid,
        title: '爆款呈现形式',
        desc: '14种爆款呈现形式全解析',
        href: '/present-styles',
      },
    ],
  },
  {
    groupIcon: DollarSign,
    groupTitle: '变现设计',
    cols: 2,
    cards: [
      {
        icon: DollarSign,
        title: 'IP变现模型',
        desc: '定制清晰的IP变现路径和收入结构',
        href: '/monetization',
      },
      {
        icon: Users,
        title: '私域成交流程',
        desc: '全链路话术覆盖六大成交阶段',
        href: '/private-domain',
        arrow: true,
      },
    ],
  },
  {
    groupIcon: Sparkles,
    groupTitle: '内容创作',
    cols: 5,
    cards: [
      {
        icon: Zap,
        title: '爆款元素生成',
        desc: 'AI自动生成多角度爆款文案',
        href: '/boom-generate',
      },
      {
        icon: Sparkles,
        title: 'AI智能生成',
        desc: '基于方法论一键生成爆款文案',
        href: '/generate',
      },
      {
        icon: Search,
        title: '文案结构分析',
        desc: '多维度分析评分精准优化',
        href: '/analysis',
      },
      {
        icon: Film,
        title: '短视频制作',
        desc: '文案转分镜脚本和拍摄方案',
        href: '/video-production',
      },
      {
        icon: Target,
        title: '获客型视频',
        desc: '精准获客短视频方案',
        href: '/acquisition-video',
      },
    ],
  },
  {
    groupIcon: Cpu,
    groupTitle: '智能工具',
    cols: 5,
    cards: [
      {
        icon: Clapperboard,
        title: '一键生成视频',
        desc: '文案自动转视频分镜+AI生成',
        href: '/ai-video',
      },
      {
        icon: Mic,
        title: '语音对话',
        desc: '语音交互AI智能对话助手',
        href: '/voice-chat',
        arrow: true,
      },
      {
        icon: Brain,
        title: '深度学习',
        desc: '批量添加文案，AI深度分析风格逻辑',
        href: '/deep-learning',
      },
      {
        icon: BookOpen,
        title: '方法论知识库',
        desc: '系统学习全网爆款创作技巧',
        href: '/knowledge',
      },
      {
        icon: FileText,
        title: '使用说明',
        desc: '完整产品操作手册',
        href: '/guide',
      },
    ],
  },
];

// Workflow
export const HOME_WORKFLOW_TITLE = 'WORKFLOW' as const;
export const HOME_WORKFLOW_SUBTITLE = '按照流程从零到一打造你的短视频变现体系' as const;

export interface HomeWorkflowStep {
  num: string;
  title: string;
  desc: string;
}
export const HOME_WORKFLOW_STEPS: ReadonlyArray<HomeWorkflowStep> = [
  { num: '01', title: '选择行业', desc: '确定赛道' },
  { num: '02', title: '制定变现', desc: '设计模型' },
  { num: '03', title: '抓取爆款', desc: '学习套路' },
  { num: '05', title: '创作文案', desc: 'AI生成' },
  { num: '06', title: '制作视频', desc: '分镜脚本' },
  { num: '07', title: '私域成交', desc: '话术转化' },
];

// Ready to start
export const HOME_READY_TITLE = 'READY TO START?' as const;
export const HOME_READY_SUBTITLE = '愿无知者有力，愿有力者前行' as const;
export const HOME_READY_CTA = '立即启动' as const;
export const HOME_READY_CTA_HREF = '/step/1' as const;

// Footer
export const HOME_FOOTER = 'AIP AGENT · AI FULL-CHAIN IP MONETIZATION ENGINE' as const;
