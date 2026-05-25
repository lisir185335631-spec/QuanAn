/**
 * evolution.ts · sally 1:1 复刻版 constants
 * PRD-25 /evolution 智能体进化中心 · mock-first
 */

import type { LucideIcon } from 'lucide-react';
import { BookOpen, Crown, Leaf, Sprout, Trees } from 'lucide-react';

// ── header ────────────────────────────────────────────────────────────────────
export const EVOLUTION_BREADCRUMB_LEFT = 'EVOLUTION' as const;
export const EVOLUTION_H1 = '智能体进化中心' as const;
export const EVOLUTION_SUBTITLE_PARTS = {
  prefix: '你的智能体通过',
  highlight1: '反馈学习',
  middle: '和',
  highlight2: '深度学习',
  suffix: '持续进化，越用越懂你',
} as const;
export const EVOLUTION_TRIGGER_BTN = '触发进化' as const;

// ── 5 levels ─────────────────────────────────────────────────────────────────
export interface EvolutionLevel {
  id: 'L1' | 'L2' | 'L3' | 'L4' | 'L5';
  label: string;
  range: string;
  icon: LucideIcon;
}

export const EVOLUTION_LEVELS_5: ReadonlyArray<EvolutionLevel> = [
  { id: 'L1', label: '初始化', range: '0-4 反馈',   icon: Sprout   },
  { id: 'L2', label: '学习中', range: '5-19 反馈',  icon: BookOpen },
  { id: 'L3', label: '成长期', range: '20-49 反馈', icon: Leaf     },
  { id: 'L4', label: '成熟期', range: '50-99 反馈', icon: Trees    },
  { id: 'L5', label: '大师级', range: '100+ 反馈',  icon: Crown    },
];

// ── level card ───────────────────────────────────────────────────────────────
export const EVOLUTION_LEVEL_TITLE_TPL = (id: string, label: string) => `进化等级 ${id}：${label}`;
export const EVOLUTION_LEVEL_INFO_TPL = (feedbacks: number, archives: number) =>
  `已收集 ${feedbacks} 条反馈 · ${archives} 个深度学习档案`;
export const EVOLUTION_LEVEL_NEXT_TPL = (need: number) =>
  `距离下一等级还需 ${need} 条反馈`;

// ── 4 stat labels ────────────────────────────────────────────────────────────
export const EVOLUTION_STAT_LABELS = {
  good: '好评数',
  needsImprove: '待改进',
  learningArchive: '学习档案',
  satisfaction: '满意率',
} as const;

// ── 2 empty col ───────────────────────────────────────────────────────────────
export const EVOLUTION_INSIGHT_TITLE = '进化洞察' as const;
export const EVOLUTION_INSIGHT_EMPTY_TITLE = '还没有进化洞察' as const;
export const EVOLUTION_INSIGHT_EMPTY_DESC = '积累至少3条反馈后，点击"触发进化"生成洞察' as const;

export const EVOLUTION_FEEDBACK_TITLE = '最近反馈' as const;
export const EVOLUTION_FEEDBACK_EMPTY_TITLE = '还没有反馈记录' as const;
export const EVOLUTION_FEEDBACK_EMPTY_DESC = '在使用各功能时点击 👍 或 👎 留下反馈' as const;

// ── archive section ──────────────────────────────────────────────────────────
export const EVOLUTION_ARCHIVE_TITLE = '深度学习档案' as const;
export const EVOLUTION_ARCHIVE_ADD = '新增学习' as const;
export const EVOLUTION_ARCHIVE_DONE_CHIP = '已学习' as const;

export interface ArchiveEntry {
  id: string;
  title: string;
  date: string;
  source: string;
  done: boolean;
}

export const EVOLUTION_ARCHIVE_MOCK: ReadonlyArray<ArchiveEntry> = [
  {
    id: 'archive-1',
    title: '文案学习 2026/5/25 (1篇)',
    date: '2026/5/25',
    source: '来源: 添加1篇文案...',
    done: true,
  },
];

// ── settings ─────────────────────────────────────────────────────────────────
export const EVOLUTION_SETTINGS_TITLE = '进化设置' as const;
export const EVOLUTION_SETTING_AUTO_LABEL = '自动进化' as const;
export const EVOLUTION_SETTING_AUTO_DESC = '根据反馈自动优化生成质量' as const;
export const EVOLUTION_SETTING_DIR_LABEL = '进化方向' as const;
export const EVOLUTION_SETTING_DIR_DESC = '综合优化（积累反馈后自动生成）' as const;
export const EVOLUTION_DIR_DEFAULT_TAG = 'L1 初始化' as const;

// ── default mock state ───────────────────────────────────────────────────────
export const EVOLUTION_DEFAULT_LEVEL_ID = 'L1' as const;
export const EVOLUTION_DEFAULT_FEEDBACKS = 0 as const;
export const EVOLUTION_DEFAULT_ARCHIVES = 1 as const;
export const EVOLUTION_DEFAULT_NEXT_NEED = 5 as const;
export const EVOLUTION_DEFAULT_STATS = {
  good: 0,
  needsImprove: 0,
  learningArchive: 1,
  satisfaction: 0,
} as const;

// ── toast ────────────────────────────────────────────────────────────────────
export const EVOLUTION_TOAST_TRIGGER = '触发进化 · 即将上线' as const;
export const EVOLUTION_TOAST_AUTO_ON = '自动进化已开启' as const;
export const EVOLUTION_TOAST_AUTO_OFF = '自动进化已关闭' as const;
