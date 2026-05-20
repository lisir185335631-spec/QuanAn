/**
 * PRD-24 US-003 · /voice-chat stub constants (D-239 字面锁)
 * AC-2: VOICE_CHAT_QUICK_PROMPTS_6 spec §8.4.2 line 2196-2201
 * AC-3: VOICE_CHAT_INTRO spec §8.4.2 line 2185
 */

export const VOICE_CHAT_QUICK_PROMPTS_6 = [
  '我是新手，怎么从0开始做短视频变现？',
  '帮我分析一下美业赛道怎么做IP',
  '怎么写出让人停不下来的爆款文案？',
  '直播带货有哪些实操技巧？',
  '如何打造个人 IP 的记忆点？',
  '小红书和抖音哪个更适合新手？',
] as const;

export const VOICE_CHAT_INTRO =
  '有什么问题尽管问我，我会用大白话给你讲清楚，还会给你详细的解决方案和落地步骤。不管是短视频、直播、还是私域变现，我都能帮你搞定。' as const;
