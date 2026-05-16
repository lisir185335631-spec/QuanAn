export interface HeaderNavItem {
  label: string;
  href: string;
}

export interface HeaderNavGroup {
  label: string;
  items: HeaderNavItem[];
}

export const HEADER_NAV: HeaderNavGroup[] = [
  {
    label: '创作',
    items: [
      { label: '爆款选题', href: '/step/5' },
      { label: '文案生成', href: '/step/7' },
      { label: '文案解析', href: '/video-analysis' },
      { label: '获客视频', href: '/acquisition-video' },
      { label: '呈现形式', href: '/present-styles' },
    ],
  },
  {
    label: '策划',
    items: [
      { label: '选择行业', href: '/step/1' },
      { label: '账号包装', href: '/step/3' },
      { label: '人设定制', href: '/step/3b' },
      { label: '执行计划', href: '/step/4' },
      { label: '变现路径', href: '/step/4b' },
      { label: '拍摄计划', href: '/step/6' },
      { label: '直播策划', href: '/step/8' },
      { label: '私域成交', href: '/private-domain' },
    ],
  },
  {
    label: '智能',
    items: [
      { label: 'IP诊断', href: '/diagnosis' },
      { label: '每日任务', href: '/daily-tasks' },
      { label: 'AI视频', href: '/ai-video' },
      { label: '语音对话', href: '/voice-chat' },
      { label: '深度学习', href: '/deep-learning' },
      { label: '进化仪表盘', href: '/evolution' },
    ],
  },
  {
    label: '更多',
    items: [
      { label: '账号管理', href: '/accounts' },
      { label: '方法论', href: '/knowledge' },
      { label: '使用说明', href: '/guide' },
      { label: '我的IP方案', href: '/ip-plan' },
      { label: '我的选题库', href: '/my-topics' },
      { label: '历史记录', href: '/history' },
    ],
  },
];
