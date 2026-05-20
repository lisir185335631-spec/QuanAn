/**
 * PRD-24 US-003 · voice-chat constants tests (D-239 字面锁)
 * AC-2: VOICE_CHAT_QUICK_PROMPTS_6 6条字面 + AC-3: VOICE_CHAT_INTRO 字面
 */
import { describe, expect, it } from 'vitest';

import {
  VOICE_CHAT_INTRO,
  VOICE_CHAT_QUICK_PROMPTS_6,
} from '@/lib/constants/voice-chat';

describe('VOICE_CHAT_QUICK_PROMPTS_6', () => {
  it('exactly 6 prompts (D-239)', () => {
    expect(VOICE_CHAT_QUICK_PROMPTS_6).toHaveLength(6);
  });

  it('prompt[0] 字面锁', () => {
    expect(VOICE_CHAT_QUICK_PROMPTS_6[0]).toBe('我是新手，怎么从0开始做短视频变现？');
  });

  it('prompt[1] 字面锁', () => {
    expect(VOICE_CHAT_QUICK_PROMPTS_6[1]).toBe('帮我分析一下美业赛道怎么做IP');
  });

  it('prompt[2] 字面锁', () => {
    expect(VOICE_CHAT_QUICK_PROMPTS_6[2]).toBe('怎么写出让人停不下来的爆款文案？');
  });

  it('prompt[3] 字面锁', () => {
    expect(VOICE_CHAT_QUICK_PROMPTS_6[3]).toBe('直播带货有哪些实操技巧？');
  });

  it('prompt[4] 字面锁', () => {
    expect(VOICE_CHAT_QUICK_PROMPTS_6[4]).toBe('如何打造个人 IP 的记忆点？');
  });

  it('prompt[5] 字面锁', () => {
    expect(VOICE_CHAT_QUICK_PROMPTS_6[5]).toBe('小红书和抖音哪个更适合新手？');
  });
});

describe('VOICE_CHAT_INTRO', () => {
  it('自我介绍字面锁 (AC-3)', () => {
    expect(VOICE_CHAT_INTRO).toBe(
      '有什么问题尽管问我，我会用大白话给你讲清楚，还会给你详细的解决方案和落地步骤。不管是短视频、直播、还是私域变现，我都能帮你搞定。',
    );
  });
});
