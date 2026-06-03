/**
 * myTopics.ts — /my-topics 我的选题库 constants · sally 1:1 复刻版
 * 字面全角标点(，。：？...) · 走 constants 不 hardcode
 * Phase-2: 筛选维度对齐后端 source 字段 · 4 个 filter
 * 禁 lucide · icon 字段已删(页面用 Material Symbols FILTER_ICON)
 */

export const MY_TOPICS_BACK = '返回爆款选题' as const;
export const MY_TOPICS_BREADCRUMB = 'MY TOPICS' as const;
export const MY_TOPICS_H1 = '我的选题库' as const;
export const MY_TOPICS_SUBTITLE = '你收藏的所有爆款选题都在这里，支持按类型筛选、一键导出和生成文案。' as const;
export const MY_TOPICS_SEARCH_PLACEHOLDER = '搜索选题标题...' as const;
export const MY_TOPICS_COPY_ALL = '复制全部' as const;
export const MY_TOPICS_DOWNLOAD_TXT = '下载TXT' as const;
export const MY_TOPICS_EMPTY_TITLE = '还没有收藏任何选题' as const;
export const MY_TOPICS_EMPTY_DESC = '去爆款选题页面生成选题，点击红心即可收藏' as const;
export const MY_TOPICS_EMPTY_CTA = '去生成选题' as const;
/** 空列表提示 (toast.info) */
export const MY_TOPICS_TOAST_COPY = '暂无选题可复制' as const;
export const MY_TOPICS_TOAST_DOWNLOAD = '暂无选题可下载' as const;
/** 成功操作提示 (toast.success) — 支持运行时字符串模板拼 N */
export const MY_TOPICS_TOAST_COPY_SUCCESS = (n: number) => `已复制 ${n} 条选题` as const;
export const MY_TOPICS_TOAST_DOWNLOAD_SUCCESS = '已下载 my-topics.txt' as const;
export const MY_TOPICS_BACK_HREF = '/step/5' as const;
export const MY_TOPICS_CTA_HREF = '/step/5' as const;

/** 对齐后端 source 字段: all / step5 / trending / manual */
export type TopicFilterKey = 'all' | 'step5' | 'trending' | 'manual';

export interface TopicFilter {
  key: TopicFilterKey;
  label: string;
}

export const MY_TOPICS_FILTERS: ReadonlyArray<TopicFilter> = [
  { key: 'all',      label: '全部'     },
  { key: 'step5',    label: '选题策划' },
  { key: 'trending', label: '热点收藏' },
  { key: 'manual',   label: '手动添加' },
];
