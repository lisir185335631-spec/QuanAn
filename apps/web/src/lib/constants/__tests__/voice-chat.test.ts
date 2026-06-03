/**
 * voice-chat.test.ts — constants 字面锁 (SPEC §4.1)
 * 验证 7 字面 const + 2 mock messages
 */
import { describe, expect, it } from 'vitest';

import {
  VOICE_CHAT_CHIP_SUBTITLE,
  VOICE_CHAT_CHIP_TITLE,
  VOICE_CHAT_INPUT_PLACEHOLDER,
  VOICE_CHAT_LABEL_COPY,
  VOICE_CHAT_LABEL_PLAY,
  VOICE_CHAT_MOCK_MESSAGES,
  VOICE_CHAT_TOAST_AUDIO,
  VOICE_CHAT_TOAST_CLEAR,
  VOICE_CHAT_TOAST_COPIED,
  VOICE_CHAT_TOAST_SEND,
  VOICE_CHAT_TOAST_VOICE,
} from '@/lib/constants/voice-chat';

describe('VOICE_CHAT constants · 字面锁', () => {
  it('CHIP_TITLE', () => {
    expect(VOICE_CHAT_CHIP_TITLE).toBe('VOICE CHAT');
  });

  it('CHIP_SUBTITLE', () => {
    expect(VOICE_CHAT_CHIP_SUBTITLE).toBe('语音对话 · 你的专属IP变现顾问');
  });

  it('INPUT_PLACEHOLDER', () => {
    expect(VOICE_CHAT_INPUT_PLACEHOLDER).toBe('有什么问题尽管问我...');
  });

  it('LABEL_PLAY', () => {
    expect(VOICE_CHAT_LABEL_PLAY).toBe('播放');
  });

  it('LABEL_COPY', () => {
    expect(VOICE_CHAT_LABEL_COPY).toBe('复制');
  });

  it('TOAST_AUDIO', () => {
    expect(VOICE_CHAT_TOAST_AUDIO).toBe('音频播放 · 即将上线');
  });

  it('TOAST_CLEAR', () => {
    expect(VOICE_CHAT_TOAST_CLEAR).toBe('清空对话 · 即将上线');
  });

  it('TOAST_VOICE', () => {
    expect(VOICE_CHAT_TOAST_VOICE).toBe('语音输入 · 即将上线');
  });

  it('TOAST_SEND', () => {
    expect(VOICE_CHAT_TOAST_SEND).toBe('AI 对话 · 即将上线');
  });

  it('TOAST_COPIED', () => {
    expect(VOICE_CHAT_TOAST_COPIED).toBe('已复制');
  });
});

describe('VOICE_CHAT_MOCK_MESSAGES · 2 entries', () => {
  it('共 2 条 mock message', () => {
    expect(VOICE_CHAT_MOCK_MESSAGES).toHaveLength(2);
  });

  it('msg-1 · user · "Hello Hello你好你好" · 10:53', () => {
    const msg = VOICE_CHAT_MOCK_MESSAGES[0];
    expect(msg?.role).toBe('user');
    expect(msg?.content).toBe('Hello Hello你好你好');
    expect(msg?.timestamp).toBe('10:53');
  });

  it('msg-2 · assistant · 含 "哈喽哈喽" + "AIP智能体" + 3 段 · 10:53', () => {
    const msg = VOICE_CHAT_MOCK_MESSAGES[1];
    expect(msg?.role).toBe('assistant');
    expect(msg?.content).toContain('哈喽哈喽');
    expect(msg?.content).toContain('AIP智能体');
    expect(msg?.content).toContain('实战导师');
    expect(msg?.timestamp).toBe('10:53');
  });

  it('assistant content 含 \\n\\n 换行(3 段分隔)', () => {
    const msg = VOICE_CHAT_MOCK_MESSAGES[1];
    expect(msg?.content).toContain('\n\n');
  });

  it('assistant content 全角标点严守 · 含 ！', () => {
    const msg = VOICE_CHAT_MOCK_MESSAGES[1];
    // must contain full-width ！ not half-width !
    expect(msg?.content).toContain('！');
  });
});
