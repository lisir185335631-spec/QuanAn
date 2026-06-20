export interface FunctionCard {
  icon: string;
  title: string;
  desc: string;
  href: string;
}

export interface FunctionGroup {
  title: string;
  cards: FunctionCard[];
}

export const FUNCTION_MATRIX: FunctionGroup[] = [
  {
    title: '市场洞察',
    cards: [
      { icon: '🔥', title: '全网爆款库', desc: '一键抓取全平台爆款视频和文案', href: '/trending' },
      { icon: '🔍', title: '爆款文案解析', desc: '粘贴文案，AI深度拆解爆款密码+一键仿写', href: '/video-analysis' },
    ],
  },
  {
    title: '变现设计',
    cards: [
      { icon: '💰', title: 'IP变现模型', desc: '定制清晰的IP变现路径和收入结构', href: '/monetization' },
      { icon: '🤝', title: '私域成交流程', desc: '全链路话术覆盖六大成交阶段', href: '/private-domain' },
    ],
  },
  {
    title: '内容创作',
    cards: [
      { icon: '✨', title: '爆款元素生成', desc: 'AI自动生成多角度爆款文案', href: '/boom-generate' },
      { icon: '🤖', title: 'AI智能生成', desc: '基于方法论一键生成爆款文案', href: '/generate' },
      { icon: '📊', title: '文案结构分析', desc: '多维度分析评分精准优化', href: '/analysis' },
      { icon: '🎬', title: '短视频制作', desc: '文案转分镜脚本和拍摄方案', href: '/video-production' },
    ],
  },
  {
    title: '智能工具',
    cards: [
      { icon: '🎥', title: '一键生成视频', desc: '文案自动转视频分镜+AI生成', href: '/ai-video' },
      { icon: '📚', title: '深度学习', desc: '批量添加文案，AI深度分析风格逻辑', href: '/deep-learning' },
      { icon: '📖', title: '方法论知识库', desc: '系统学习全网爆款创作技巧', href: '/knowledge' },
    ],
  },
];

export const FUNCTION_MATRIX_FOOTER: FunctionCard = {
  icon: '📘',
  title: '使用说明',
  desc: '完整产品操作手册',
  href: '/guide',
};
