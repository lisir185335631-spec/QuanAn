/**
 * QuanQn · 私域成交 6 阶段
 * 派生自 ARCHITECTURE.md §3.6 + spec.md §Ⅹ.5 + PROMPTS §8.2
 */

export interface PrivateDomainStage {
  key: string;
  label: string;
  desc: string;
  /** 此阶段的话术核心 · 给 PrivateDomainAgent prompt 用 */
  coreGoal: string;
}

export const PRIVATE_DOMAIN_STAGES: readonly PrivateDomainStage[] = [
  { key: 'welcome',  label: '欢迎话术', desc: '新好友添加后的第一印象话术', coreGoal: '自我介绍 + 1 个具体价值 · 让对方留下' },
  { key: 'icebreak', label: '破冰暖场', desc: '第 1-2 天 · 让对方主动聊',     coreGoal: '提具体问题 / 分享干货 · 不推产品' },
  { key: 'trust',    label: '信任建立', desc: '第 3-7 天 · 建立专业信任',     coreGoal: '真实案例 / 用户证明 / 个人故事' },
  { key: 'discover', label: '需求挖掘', desc: '探索用户痛点',                 coreGoal: '5W1H 提问 / 倾听 · 找到真需求' },
  { key: 'close',    label: '成交话术', desc: '临门一脚 · 转化',              coreGoal: 'FABE 介绍 + 限时(合规)+ 案例' },
  { key: 'follow',   label: '售后跟进', desc: '复购 + 升级',                  coreGoal: '关心使用 + 邀请反馈 + 介绍升级品' },
] as const;

export const PRIVATE_DOMAIN_STAGE_KEYS = PRIVATE_DOMAIN_STAGES.map((s) => s.key) as readonly string[];

if (PRIVATE_DOMAIN_STAGES.length !== 6) {
  throw new Error(`Expected 6 private domain stages, got ${PRIVATE_DOMAIN_STAGES.length}`);
}
