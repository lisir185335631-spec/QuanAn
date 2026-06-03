/**
 * historyPage.ts — /history 历史记录页常量 · sally 1:1 复刻
 * D1A 字面锁 · SPEC §3 完整字面
 */

import { Copy, Eye, Trash2 } from 'lucide-react';

import type { LucideIcon } from 'lucide-react';

// ── header ─────────────────────────────────────────────────────────────────────

export const HISTORY_H1 = '历史记录' as const;
export const HISTORY_SUBTITLE_TPL = (n: number) =>
  // eslint-disable-next-line no-irregular-whitespace -- 全角空格是 sally 设计 1:1 字面锁(historyPage.test 锁定)
  `查看和管理你生成的所有文案　（共 ${n} 条）` as const;

// ── entry prefix ───────────────────────────────────────────────────────────────

export const HISTORY_TOPIC_PREFIX = '主题：' as const;

// ── toast ──────────────────────────────────────────────────────────────────────

export const HISTORY_TOAST_VIEW = '查看详情' as const;
export const HISTORY_TOAST_COPY = '已复制' as const;
export const HISTORY_TOAST_DELETE = '已删除' as const;

// ── types ──────────────────────────────────────────────────────────────────────

export interface HistoryEntry {
  id: string;
  scriptType: string;
  elementKeys: ReadonlyArray<string>;
  topic: string;
  timestamp: string;
}

// ── mock data ──────────────────────────────────────────────────────────────────

export const HISTORY_MOCK: ReadonlyArray<HistoryEntry> = [
  {
    id: 'h1',
    scriptType: '搞辩论',
    elementKeys: [
      'contrast', 'curiosity', 'leverage', 'resonance',
      'low_cost_high', 'small_big', 'controversy', 'benefit', 'greed',
    ],
    topic: '为什么有的人赚钱那么轻松',
    timestamp: '2026/5/24 14:53:07',
  },
  {
    id: 'h2',
    scriptType: '搞辩论',
    elementKeys: [
      'contrast', 'curiosity', 'leverage', 'resonance',
      'low_cost_high', 'small_big', 'controversy', 'benefit', 'greed',
    ],
    topic: '为什么有的人赚钱那么轻松',
    timestamp: '2026/4/14 15:33:43',
  },
  {
    id: 'h3',
    scriptType: '讲故事',
    elementKeys: [
      'contrast', 'curiosity', 'leverage', 'resonance',
      'low_cost_high', 'small_big', 'controversy', 'benefit', 'greed',
    ],
    topic: '为什么有的人赚钱那么轻松',
    timestamp: '2026/4/14 15:32:19',
  },
  {
    id: 'h4',
    scriptType: '讲故事',
    elementKeys: [
      'contrast', 'curiosity', 'leverage', 'resonance',
      'low_cost_high', 'small_big', 'controversy', 'benefit', 'greed',
    ],
    topic: '为什么有的人赚钱那么轻松',
    timestamp: '2026/3/28 09:11:02',
  },
];

// ── actions ────────────────────────────────────────────────────────────────────

export const HISTORY_ACTIONS: ReadonlyArray<{
  key: string;
  icon: LucideIcon;
  label: string;
}> = [
  { key: 'view',   icon: Eye,    label: '查看' },
  { key: 'copy',   icon: Copy,   label: '复制' },
  { key: 'delete', icon: Trash2, label: '删除' },
];
