/**
 * /voice-chat 1:1 复刻 · sally zhao aiipznt.vip/voice-chat
 * mock-first · 0 backend · SPEC §4.1 字面锁
 */

// ── chip + subtitle ───────────────────────────────────────────────────────────
export const VOICE_CHAT_CHIP_TITLE = 'VOICE CHAT' as const;
export const VOICE_CHAT_CHIP_SUBTITLE = '语音对话 · 你的专属IP变现顾问' as const;

// ── input ─────────────────────────────────────────────────────────────────────
export const VOICE_CHAT_INPUT_PLACEHOLDER = '有什么问题尽管问我...' as const;

// ── action labels ─────────────────────────────────────────────────────────────
export const VOICE_CHAT_LABEL_PLAY = '播放' as const;
export const VOICE_CHAT_LABEL_COPY = '复制' as const;

// ── toast texts (LLM 接入留 PRR) ─────────────────────────────────────────────
export const VOICE_CHAT_TOAST_AUDIO = '音频播放 · 即将上线' as const;
export const VOICE_CHAT_TOAST_CLEAR = '清空对话 · 即将上线' as const;
export const VOICE_CHAT_TOAST_VOICE = '语音输入 · 即将上线' as const;
export const VOICE_CHAT_TOAST_SEND = 'AI 对话 · 即将上线' as const;
export const VOICE_CHAT_TOAST_COPIED = '已复制' as const;

// ── mock messages (default state) ────────────────────────────────────────────
export type MessageRole = 'user' | 'assistant';

export interface MockMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
}

export const VOICE_CHAT_MOCK_MESSAGES: ReadonlyArray<MockMessage> = [
  {
    id: 'msg-1',
    role: 'user',
    content: 'Hello Hello你好你好',
    timestamp: '10:53',
  },
  {
    id: 'msg-2',
    role: 'assistant',
    content:
      '哈喽哈喽！老铁你好！很高兴能在这里跟你聊聊。\n\n我是你的AIP智能体，一个专门帮你把IP玩转起来、实现变现的实战导师。有什么关于短视频、直播、IP打造或者美业变现的问题，尽管开口问我！\n\n别客气，直接说你的困惑或者想了解什么，我都在这儿听着呢！咱们直接上干货，帮你把问题解决掉！',
    timestamp: '10:53',
  },
];
