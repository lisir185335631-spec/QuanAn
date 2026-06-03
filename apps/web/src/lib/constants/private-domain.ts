/**
 * Private domain stage constants — PRD-27 US-002 AC-5
 * D-261 字面锁: welcome/warmup/trust/discover/close/follow 严守
 * spec §27.7 + §26.1
 */

export interface Stage {
  value: 'welcome' | 'warmup' | 'trust' | 'discover' | 'close' | 'follow';
  label: string;
  icon: string;
  desc: string;
}

export const PRIVATE_DOMAIN_STAGES: readonly Stage[] = [
  { value: 'welcome', label: '欢迎话术', icon: 'Send', desc: '新好友添加后的第一印象话术' },
  { value: 'warmup', label: '破冰暖场', icon: 'MessageCircle', desc: '日常互动、朋友圈评论、私聊破冰' },
  { value: 'trust', label: '信任建立', icon: 'Shield', desc: '价值输出、案例分享、专业展示' },
  { value: 'discover', label: '需求挖掘', icon: 'Search', desc: '引导客户表达需求 + 场景化提问' },
  { value: 'close', label: '成交话术', icon: 'Handshake', desc: '临门一脚 + 价格谈判 + 异议处理' },
  { value: 'follow', label: '售后跟进', icon: 'RefreshCw', desc: '复购唤醒 + 转介绍 + 流失挽回' },
] as const;

// ─── PRD-29.13 · 真实字面 ──────────────────────────────────
export const PRIVATE_DOMAIN_H1 = '私域成交流程' as const;
export const PRIVATE_DOMAIN_SUBTITLE = '覆盖从加好友到成交复购的全链路话术，让私域转化率翻倍' as const;
export const PRIVATE_DOMAIN_FORM_PRODUCT_LABEL = '产品/服务名称' as const;
export const PRIVATE_DOMAIN_FORM_TARGET_LABEL = '目标用户' as const;
export const PRIVATE_DOMAIN_FORM_SCENARIO_LABEL = '具体场景' as const;
export const PRIVATE_DOMAIN_CTA_GENERATE = '生成话术' as const;
export const PRIVATE_DOMAIN_CTA_COPY_ALL = '复制全部话术' as const;
export const PRIVATE_DOMAIN_FOOTER_FEEDBACK = '这个结果对你有帮助吗？' as const;
