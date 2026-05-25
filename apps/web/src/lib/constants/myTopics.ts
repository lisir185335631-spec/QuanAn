/**
 * myTopics.ts — /my-topics 我的选题库 constants · sally 1:1 复刻版
 * 字面全角标点(，。：？...) · 走 constants 不 hardcode
 */
import type { LucideIcon } from 'lucide-react';
import {
  BookOpen, Brain, DollarSign, Heart, TrendingUp, Users,
} from 'lucide-react';

export const MY_TOPICS_BACK = '返回爆款选题' as const;
export const MY_TOPICS_BREADCRUMB = 'MY TOPICS' as const;
export const MY_TOPICS_H1 = '我的选题库' as const;
export const MY_TOPICS_SUBTITLE = '你收藏的所有爆款选题都在这里，支持按类型筛选、一键导出和生成文案。' as const;
export const MY_TOPICS_SEARCH_PLACEHOLDER = '搜索选题、行业、产品...' as const;
export const MY_TOPICS_COPY_ALL = '复制全部' as const;
export const MY_TOPICS_DOWNLOAD_TXT = '下载TXT' as const;
export const MY_TOPICS_EMPTY_TITLE = '还没有收藏任何选题' as const;
export const MY_TOPICS_EMPTY_DESC = '去爆款选题页面生成选题，点击红心即可收藏' as const;
export const MY_TOPICS_EMPTY_CTA = '去生成选题' as const;
export const MY_TOPICS_TOAST_COPY = '暂无选题可复制' as const;
export const MY_TOPICS_TOAST_DOWNLOAD = '暂无选题可下载' as const;
export const MY_TOPICS_BACK_HREF = '/step/5' as const;
export const MY_TOPICS_CTA_HREF = '/step/5' as const;

export type TopicFilterKey = 'all' | 'traffic' | 'monetize' | 'persona' | 'cognitive' | 'case';

export interface TopicFilter {
  key: TopicFilterKey;
  label: string;
  icon: LucideIcon;
}

export const MY_TOPICS_FILTERS: ReadonlyArray<TopicFilter> = [
  { key: 'all',       label: '全部',   icon: Heart       },
  { key: 'traffic',   label: '流量型', icon: TrendingUp  },
  { key: 'monetize',  label: '变现型', icon: DollarSign  },
  { key: 'persona',   label: '人设型', icon: Users       },
  { key: 'cognitive', label: '认知型', icon: Brain       },
  { key: 'case',      label: '案例型', icon: BookOpen    },
];
