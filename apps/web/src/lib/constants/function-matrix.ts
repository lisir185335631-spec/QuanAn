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
      { icon: '🔥', title: '全网爆款库', desc: '追踪全平台热门内容趋势', href: '/trending' },
      { icon: '🔍', title: '爆款文案解析', desc: '深度拆解高流量文案逻辑', href: '/video-analysis' },
      { icon: '🎨', title: '爆款呈现形式', desc: '分析主流视觉呈现风格', href: '/present-styles' },
    ],
  },
  {
    title: '变现设计',
    cards: [
      { icon: '💰', title: 'IP变现模型', desc: '构建多维度IP变现路径', href: '/monetization' },
      { icon: '🤝', title: '私域成交流程', desc: '设计高转化私域运营方案', href: '/private-domain' },
    ],
  },
  {
    title: '内容创作',
    cards: [
      { icon: '✨', title: '爆款元素生成', desc: '一键生成爆款内容关键元素', href: '/boom-generate' },
      { icon: '🤖', title: 'AI智能生成', desc: '多模态AI内容智能创作', href: '/generate' },
      { icon: '📊', title: '文案结构分析', desc: '解析高转化文案底层结构', href: '/analysis' },
      { icon: '🎬', title: '短视频制作', desc: '系统化短视频拍摄制作', href: '/video-production' },
      { icon: '🎯', title: '获客型视频', desc: '专为引流获客优化的视频', href: '/acquisition-video' },
    ],
  },
  {
    title: '智能工具',
    cards: [
      { icon: '🎥', title: '一键生成视频', desc: 'AI驱动全流程视频生成', href: '/ai-video' },
      { icon: '🎙️', title: '语音对话', desc: '智能语音交互与内容辅助', href: '/voice-chat' },
      { icon: '📚', title: '深度学习', desc: '系统化IP打造知识体系', href: '/deep-learning' },
      { icon: '📖', title: '方法论知识库', desc: '沉淀可复用的运营方法论', href: '/knowledge' },
    ],
  },
];

export const FUNCTION_MATRIX_FOOTER: FunctionCard = {
  icon: '📘',
  title: '使用说明',
  desc: '了解如何高效使用全部功能模块',
  href: '/guide',
};
