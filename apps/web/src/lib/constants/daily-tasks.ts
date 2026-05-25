/**
 * /daily-tasks · 今日行动清单 · constants
 * mock-first · 4 固定 sally task + 3 stat + progress + footer
 */
import type { LucideIcon } from 'lucide-react';
import { BookOpen, Settings, Zap } from 'lucide-react';

// ── Page-level constants ──────────────────────────────────────────────────────
export const DAILY_TASKS_CHIP = '每日任务' as const;
export const DAILY_TASKS_H1 = '今日行动清单' as const;
export const DAILY_TASKS_SUBTITLE = '每天完成具体任务，一步步打造变现IP' as const;

// ── 3 stat cards ──────────────────────────────────────────────────────────────
export interface StatCardData {
  id: string;
  value: number;
  label: string;
}

export const DAILY_TASKS_STATS: ReadonlyArray<StatCardData> = [
  { id: 'streak', value: 0, label: '连续打卡天数' },
  { id: 'total-days', value: 1, label: '累计打卡天数' },
  { id: 'total-tasks', value: 1, label: '累计完成任务' },
];

// ── Today progress ────────────────────────────────────────────────────────────
export const DAILY_TASKS_PROGRESS_LABEL = '今日进度' as const;
export const DAILY_TASKS_PROGRESS_COMPLETED = 0 as const;
export const DAILY_TASKS_PROGRESS_TOTAL = 4 as const;

// ── 4 mock tasks(per sally 截图) ──────────────────────────────────────────────
export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskCategory = '学习研究' | '内容创作' | '账号优化';

export interface TaskMockItem {
  id: string;
  title: string;
  priority: TaskPriority;
  category: TaskCategory;
  desc: string;
}

export const DAILY_TASKS_MOCK: ReadonlyArray<TaskMockItem> = [
  {
    id: 'task-1',
    title: '复盘已发布内容数据并总结',
    priority: 'high',
    category: '学习研究',
    desc: '登录抖音/快手/B站等已发布内容的平台后台，查看过去一周所有流量型和价值型内容的播放量、点赞量、评论量、分享量、完播率等核心数据。将数据汇总到表格中，并针对表现较好的内容和表现较差的内容，初步分析可能的原因（例如：选题、标题、封面、开头、剪辑节奏、口播表现等）。',
  },
  {
    id: 'task-2',
    title: '优化下一批内容选题和脚本方向',
    priority: 'high',
    category: '内容创作',
    desc: '根据任务1的数据复盘结果，结合你之前规划的流量型和价值型内容选题库，调整和优化下一批（至少2条流量型和2条价值型）内容的选题方向。对于表现好的内容类型，思考如何延续；对于表现不佳的内容，思考如何改进。为其中一条流量型内容（例如：关于企业服务行业某个鲜为人知的"坑"或"黑幕"）撰写详细脚本，包括开场白、核心内容点、案例/数据支撑、结尾引导。',
  },
  {
    id: 'task-3',
    title: '研究对标账号的评论区互动策略',
    priority: 'medium',
    category: '学习研究',
    desc: '选择3-5个你认为做得好的企业服务领域对标IP账号（或相关领域的知识分享型IP），重点观察他们最新发布的5-10条内容的评论区。分析他们是如何回复用户评论的？是否有引导用户提问或参与讨论？是否有利用评论区进行二次内容创作？记录下你认为值得借鉴的互动方式和话术。',
  },
  {
    id: 'task-4',
    title: '进行一次口播训练并录制',
    priority: 'high',
    category: '账号优化',
    desc: '选取你为任务2撰写好的流量型内容脚本，进行至少3次口播训练。每次训练都用手机录制下来，并回放检查：1. 语速是否适中？2. 语调是否有起伏，避免平铺直叙？3. 表情和肢体语言是否自然？4. 是否有"念稿"感？5. 重点信息是否清晰有力？找出至少2个需要改进的点。',
  },
];

// ── Tag mapping ───────────────────────────────────────────────────────────────
export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  high: '高',
  medium: '中',
  low: '低',
};

export const CATEGORY_ICON_MAP: Record<TaskCategory, LucideIcon> = {
  学习研究: BookOpen,
  内容创作: Zap,
  账号优化: Settings,
};

// ── Footer buttons ────────────────────────────────────────────────────────────
export const DAILY_TASKS_FOOTER_BTN_1 = 'IP诊断' as const;
export const DAILY_TASKS_FOOTER_BTN_2 = '继续做IP方案' as const;
export const DAILY_TASKS_FOOTER_BTN_1_HREF = '/diagnosis' as const;
export const DAILY_TASKS_FOOTER_BTN_2_HREF = '/step/1' as const;
