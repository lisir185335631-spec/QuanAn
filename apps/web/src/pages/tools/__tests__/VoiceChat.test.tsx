/**
 * PRD-24 US-003 · VoiceChat unit tests (D-233 AC-9)
 * ≥ 7 tests: H1字面 / 6快速提问字面 / 自我介绍字面 / quick prompt click 填 input
 *           / 发送 add 历史 / localStorage save / load 历史
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useActiveAccount } from '@/hooks/useActiveAccount';
import {
  VOICE_CHAT_INTRO,
  VOICE_CHAT_QUICK_PROMPTS_6,
} from '@/lib/constants/voice-chat';
import VoiceChat from '@/pages/tools/VoiceChat';

vi.mock('@/hooks/useActiveAccount', () => ({
  useActiveAccount: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

const mockAccount = {
  id: 99,
  name: 'Test',
  platform: 'douyin' as const,
  stage: 'starter' as const,
  industry: '科技',
  followersRange: '0-1000' as const,
};

function renderVoiceChat() {
  return render(
    <MemoryRouter>
      <VoiceChat />
    </MemoryRouter>,
  );
}

describe('VoiceChat page', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(useActiveAccount).mockReturnValue({
      account: mockAccount,
      isLoading: false,
      isSwitching: false,
      switchTo: vi.fn(),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('AC-1 · H1 字面锁 "VOICE CHAT"', () => {
    renderVoiceChat();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('VOICE CHAT');
  });

  it('AC-1 · H3 模块标题 "你的专属 IP 变现顾问"', () => {
    renderVoiceChat();
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('你的专属 IP 变现顾问');
  });

  it('AC-3 · 自我介绍字面锁(VOICE_CHAT_INTRO)', () => {
    renderVoiceChat();
    expect(screen.getByText(VOICE_CHAT_INTRO)).toBeInTheDocument();
  });

  it('AC-2 · 6 quick prompts 全部渲染(字面对照)', () => {
    renderVoiceChat();
    for (const prompt of VOICE_CHAT_QUICK_PROMPTS_6) {
      expect(screen.getByText(prompt)).toBeInTheDocument();
    }
  });

  it('AC-6 · quick prompt click → 填到 input(不直接发送)', () => {
    renderVoiceChat();
    const firstPrompt = VOICE_CHAT_QUICK_PROMPTS_6[0]!;
    fireEvent.click(screen.getByTestId('quick-prompt-0'));
    const input = screen.getByTestId('chat-input') as HTMLInputElement;
    expect(input.value).toBe(firstPrompt);
    // history should NOT appear yet (not sent)
    expect(screen.queryByTestId('history-list')).toBeNull();
  });

  it('AC-6 · 发送 → 历史 list 渲染', () => {
    renderVoiceChat();
    const input = screen.getByTestId('chat-input');
    fireEvent.change(input, { target: { value: '测试问题' } });
    fireEvent.click(screen.getByTestId('send-button'));
    expect(screen.getByTestId('history-list')).toBeInTheDocument();
    expect(screen.getByText('测试问题')).toBeInTheDocument();
  });

  it('AC-6 · 发送 → localStorage 保存(acc_ 前缀)', () => {
    renderVoiceChat();
    const input = screen.getByTestId('chat-input');
    fireEvent.change(input, { target: { value: '存储测试' } });
    fireEvent.click(screen.getByTestId('send-button'));

    const key = `aiip_memory_acc_${mockAccount.id}_voice_chat_history`;
    const stored = localStorage.getItem(key);
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!) as Array<{ question: string }>;
    expect(parsed[0]?.question).toBe('存储测试');
  });

  it('AC-5 · 从 localStorage 加载历史', () => {
    const key = `aiip_memory_acc_${mockAccount.id}_voice_chat_history`;
    const stub = [
      { id: 'h1', question: '历史问题', answer: '历史回答', timestamp: Date.now() - 60000 },
    ];
    localStorage.setItem(key, JSON.stringify(stub));

    renderVoiceChat();
    expect(screen.getByTestId('history-list')).toBeInTheDocument();
    expect(screen.getByText('历史问题')).toBeInTheDocument();
  });

  it('AC-7 · DOM button 数 ≥ 12', () => {
    // Pre-load 2 history entries: 6 quick + send + mic + speaker + clear + 2 copy = 12
    const key = `aiip_memory_acc_${mockAccount.id}_voice_chat_history`;
    localStorage.setItem(key, JSON.stringify([
      { id: 'h1', question: '问题1', answer: '回答1', timestamp: Date.now() - 1000 },
      { id: 'h2', question: '问题2', answer: '回答2', timestamp: Date.now() },
    ]));
    renderVoiceChat();
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(12);
  });

  it('AC-8 · DOM H 标签数 ≥ 2 (H1 + H3)', () => {
    renderVoiceChat();
    const h1s = screen.getAllByRole('heading', { level: 1 });
    const h3s = screen.getAllByRole('heading', { level: 3 });
    expect(h1s.length + h3s.length).toBeGreaterThanOrEqual(2);
  });
});
