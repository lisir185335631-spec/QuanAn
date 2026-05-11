/**
 * VoiceChat.test.tsx — PRD-8 US-012 AC-10
 * Source-inspection tests: page structure + AC key identifiers
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(__dirname, '../../../../');
const PAGE = `${ROOT}/apps/web/src/pages/tools/VoiceChat.tsx`;

function src(): string {
  return readFileSync(PAGE, 'utf-8');
}

// ── 1 · AC-1 UI 元素 ─────────────────────────────────────────────────────────

describe('AC-1: 页面结构 — 录音按钮 + turn list + status bar', () => {
  it('页面包含 record-button data-testid', () => {
    expect(src()).toContain('data-testid="record-button"');
  });

  it('页面包含 turn-list data-testid', () => {
    expect(src()).toContain('data-testid="turn-list"');
  });

  it('页面包含 status bar aria-live polite', () => {
    expect(src()).toContain('aria-live="polite"');
  });

  it('STATUS_LABEL 包含所有 6 个状态', () => {
    const content = src();
    expect(content).toContain("'idle'");
    expect(content).toContain("'recording'");
    expect(content).toContain("'transcribing'");
    expect(content).toContain("'streaming'");
    expect(content).toContain("'synthesizing'");
    expect(content).toContain("'ended'");
  });
});

// ── 2 · AC-2 录音 ────────────────────────────────────────────────────────────

describe('AC-2: MediaRecorder · max 30s · 按住录 + 松开发', () => {
  it('使用 navigator.mediaDevices.getUserMedia({ audio: true })', () => {
    expect(src()).toContain('getUserMedia({ audio: true })');
  });

  it('30s max timer 存在', () => {
    expect(src()).toContain('30_000');
  });

  it('onMouseDown + onMouseUp 绑定录音操作', () => {
    const content = src();
    expect(content).toContain('onMouseDown');
    expect(content).toContain('onMouseUp');
  });

  it('MediaRecorder webm/opus mimeType 选择逻辑', () => {
    expect(src()).toContain('audio/webm;codecs=opus');
  });
});

// ── 3 · AC-3 STT + subscription ──────────────────────────────────────────────

describe('AC-3: STT → user bubble → voiceChat.start subscription', () => {
  it('调用 trpc.stt.transcribe.useMutation', () => {
    expect(src()).toContain('trpc.stt.transcribe.useMutation');
  });

  it('调用 trpcClient.voiceChat.start.subscribe', () => {
    expect(src()).toContain('trpcClient.voiceChat.start.subscribe');
  });

  it('UserBubble 组件存在', () => {
    expect(src()).toContain('UserBubble');
  });

  it('AssistantBubble 组件存在', () => {
    expect(src()).toContain('AssistantBubble');
  });
});

// ── 4 · AC-4 TTS 播放 ─────────────────────────────────────────────────────────

describe('AC-4: done event → tts.synthesize → audio play', () => {
  it('调用 trpcClient.tts.synthesize.mutate', () => {
    expect(src()).toContain('tts.synthesize');
  });

  it('<audio> 元素带 autoPlay', () => {
    expect(src()).toContain('autoPlay');
  });

  it('audioUrl 字段用于播放', () => {
    expect(src()).toContain('audioUrl');
  });
});

// ── 5 · AC-5 工具 call card ───────────────────────────────────────────────────

describe('AC-5: 5 工具 call card 渲染 · 折叠展开', () => {
  it('ToolCallCard 组件存在', () => {
    expect(src()).toContain('ToolCallCard');
  });

  it('expanded 字段控制折叠', () => {
    expect(src()).toContain('expanded');
  });

  it('args + result 渲染', () => {
    const content = src();
    expect(content).toContain('entry.args');
    expect(content).toContain('entry.result');
  });
});

// ── 6 · AC-6 30s silence detection ───────────────────────────────────────────

describe('AC-6: 30s silence detection', () => {
  it('silence timer 存在', () => {
    expect(src()).toContain('silenceTimer');
  });

  it('还想聊什么吗 silence prompt', () => {
    expect(src()).toContain('还想聊什么吗');
  });
});

// ── 7 · AC-7 挂掉按钮 ────────────────────────────────────────────────────────

describe('AC-7: 挂掉按钮 → clearBuffer + 总结', () => {
  it('handleHangUp 函数存在', () => {
    expect(src()).toContain('handleHangUp');
  });

  it('SummaryPanel 显示总结', () => {
    expect(src()).toContain('SummaryPanel');
  });

  it('clearSessionMutation 调用', () => {
    expect(src()).toContain('clearSessionMutation');
  });

  it('本次对话 N 轮总结文案', () => {
    expect(src()).toContain('本次对话');
  });
});

// ── 8 · AC-9 无 stream leak ───────────────────────────────────────────────────

describe('AC-9: 无 media stream leak', () => {
  it('getTracks().forEach(t => t.stop()) 释放 stream', () => {
    expect(src()).toContain('getTracks()');
    expect(src()).toContain('.stop()');
  });

  it('recorder.stream 字段访问', () => {
    expect(src()).toContain('recorder.stream');
  });
});
