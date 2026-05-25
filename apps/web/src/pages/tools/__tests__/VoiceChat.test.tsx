/**
 * VoiceChat.test.tsx — 1:1 复刻 mock-first 验证
 * SPEC §8 D1-D5 断言
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import VoiceChat from '@/pages/tools/VoiceChat';

// ── mocks ─────────────────────────────────────────────────────────────────────

const mockToastInfo = vi.fn();

vi.mock('sonner', () => ({
  toast: { info: vi.fn((...args) => mockToastInfo(...args)), success: vi.fn(), error: vi.fn() },
}));

// navigator.clipboard mock
Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: vi.fn().mockResolvedValue(undefined) },
  writable: true,
});

// ── helper ────────────────────────────────────────────────────────────────────

function renderVC() {
  return render(
    <MemoryRouter>
      <VoiceChat />
    </MemoryRouter>,
  );
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('VoiceChat · 1:1 复刻 mock-first', () => {
  it('chip "VOICE CHAT" 渲染', () => {
    renderVC();
    expect(screen.getByTestId('voice-chat-chip-title')).toHaveTextContent('VOICE CHAT');
  });

  it('chip subtitle 字面锁', () => {
    renderVC();
    expect(screen.getByTestId('voice-chat-chip-subtitle')).toHaveTextContent(
      '语音对话 · 你的专属IP变现顾问',
    );
  });

  it('user mock message "Hello Hello你好你好" 出现', () => {
    renderVC();
    expect(screen.getByText('Hello Hello你好你好')).toBeInTheDocument();
  });

  it('assistant mock message 含 "哈喽哈喽" + "AIP智能体"', () => {
    renderVC();
    // assistant content uses whitespace-pre-wrap · check by partial match
    const assistantBubble = screen.getByTestId('message-bubble-assistant');
    expect(assistantBubble).toBeInTheDocument();
    expect(assistantBubble.textContent).toContain('哈喽哈喽');
    expect(assistantBubble.textContent).toContain('AIP智能体');
  });

  it('input placeholder "有什么问题尽管问我..." 出现', () => {
    renderVC();
    const input = screen.getByTestId('voice-chat-input');
    expect(input).toHaveAttribute('placeholder', '有什么问题尽管问我...');
  });

  it('send btn · 空 input 时 toast 不触发', () => {
    renderVC();
    mockToastInfo.mockClear();
    const sendBtn = screen.getByTestId('voice-chat-send-btn');
    fireEvent.click(sendBtn);
    expect(mockToastInfo).not.toHaveBeenCalled();
  });

  it('send btn · 非空 input 时 toast "AI 对话 · 即将上线"', () => {
    renderVC();
    mockToastInfo.mockClear();
    const input = screen.getByTestId('voice-chat-input');
    fireEvent.change(input, { target: { value: '你好' } });
    const sendBtn = screen.getByTestId('voice-chat-send-btn');
    fireEvent.click(sendBtn);
    expect(mockToastInfo).toHaveBeenCalledWith('AI 对话 · 即将上线');
  });

  it('mic btn · toast "语音输入 · 即将上线"', () => {
    renderVC();
    mockToastInfo.mockClear();
    const micBtn = screen.getByTestId('voice-chat-mic-btn');
    fireEvent.click(micBtn);
    expect(mockToastInfo).toHaveBeenCalledWith('语音输入 · 即将上线');
  });

  it('audio btn (顶部 Volume2) · toast "音频播放 · 即将上线"', () => {
    renderVC();
    mockToastInfo.mockClear();
    const audioBtn = screen.getByTestId('voice-chat-audio-btn');
    fireEvent.click(audioBtn);
    expect(mockToastInfo).toHaveBeenCalledWith('音频播放 · 即将上线');
  });

  it('clear btn (顶部 Trash2) · toast "清空对话 · 即将上线"', () => {
    renderVC();
    mockToastInfo.mockClear();
    const clearBtn = screen.getByTestId('voice-chat-clear-btn');
    fireEvent.click(clearBtn);
    expect(mockToastInfo).toHaveBeenCalledWith('清空对话 · 即将上线');
  });

  it('assistant bubble 底部 播放 + 复制 btn 存在', () => {
    renderVC();
    expect(screen.getByTestId('message-play-btn')).toBeInTheDocument();
    expect(screen.getByTestId('message-copy-btn')).toBeInTheDocument();
    expect(screen.getByTestId('message-play-btn')).toHaveTextContent('播放');
    expect(screen.getByTestId('message-copy-btn')).toHaveTextContent('复制');
  });

  it('timestamp "10:53" 出现 2 次', () => {
    renderVC();
    const timestamps = screen.getAllByText('10:53');
    // user bubble has 1 timestamp · assistant bubble row has 1 timestamp
    expect(timestamps.length).toBeGreaterThanOrEqual(2);
  });

  it('无 trpc · 无 useSubscription · 无 quick prompts grid', () => {
    renderVC();
    // quick-prompt-0 should NOT exist
    expect(screen.queryByTestId('quick-prompt-0')).toBeNull();
    // cancel button should NOT exist
    expect(screen.queryByTestId('cancel-button')).toBeNull();
  });
});
