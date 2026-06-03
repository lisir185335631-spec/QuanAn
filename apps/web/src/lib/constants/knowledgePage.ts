/**
 * knowledgePage.ts — /knowledge 页面顶部字面常量
 * SPEC §3 · h1/subtitle/tab label/search placeholder/count text/filter chip
 */

export const KNOWLEDGE_PAGE = {
  h1: 'AIP文案方法论',
  subtitle: '系统学习AIP的短视频文案创作方法论，掌握爆款文案的核心技巧',

  tabs: {
    scripts: '20类脚本',
    elements: '20大爆款',
    opening: '开头公式',
    core: '核心公式',
  },

  searchPlaceholders: {
    scripts: '搜索脚本类型...',
    opening: '搜索开头公式...',
    core: '搜索核心公式...',
  },

  countText: {
    scripts: (total: number, shown: number) => `共 ${total} 类 · 显示 ${shown} 类`,
    elements: (total: number, shown: number) => `共 ${total} 大 · 显示 ${shown} 个`,
    opening: (total: number, shown: number) => `共 ${total} 个公式 · 显示 ${shown} 个`,
    core: (total: number, shown: number) => `共 ${total} 个公式 · 显示 ${shown} 个`,
  },

  filterChips: {
    all: '全部',
    classic: '经典元素',
    emotion: '情绪驱动',
    content: '内容策略',
    conversion: '转化驱动',
  },

  toasts: {
    copied: '已复制',
    bookmarked: '收藏 · 即将上线',
    generate: '生成文案 · 即将上线',
  },
} as const;
