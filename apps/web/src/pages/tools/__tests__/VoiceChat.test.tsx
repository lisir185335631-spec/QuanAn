/**
 * PRD-25 US-002 · VoiceChat unit tests
 * AC-9: ≥ 7 test cases
 *  (a) delta 累积到 currentAnswer
 *  (b) tool_call hint 显示
 *  (c) done 后 history append + localStorage
 *  (d) error retry button
 *  (e) cancel partial=true hint
 *  + AC-1 H1/H3字面 · AC-7 quick prompt click → input(不发送) · AC-3 model hint
 */
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useActiveAccount } from '@/hooks/useActiveAccount';
import {
  VOICE_CHAT_INTRO,
  VOICE_CHAT_QUICK_PROMPTS_6,
} from '@/lib/constants/voice-chat';
import VoiceChat from '@/pages/tools/VoiceChat';

// ── mock useActiveAccount ────────────────────────────────────────────────────
vi.mock('@/hooks/useActiveAccount', () => ({
  useActiveAccount: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

// ── mock trpc ────────────────────────────────────────────────────────────────
// Capture the latest onData/onError callbacks from useSubscription
type OnDataFn = (chunk: Record<string, unknown>) => void;
type OnErrorFn = (err: Error) => void;

const mockSubscription = {
  onData: null as OnDataFn | null,
  onError: null as OnErrorFn | null,
  enabled: false,
};

vi.mock('@/lib/trpc', () => ({
  trpc: {
    voiceChat: {
      start: {
        useSubscription: vi.fn((_input: unknown, opts: { enabled?: boolean; onData?: OnDataFn; onError?: OnErrorFn }) => {
          mockSubscription.onData = opts.onData ?? null;
          mockSubscription.onError = opts.onError ?? null;
          mockSubscription.enabled = opts.enabled ?? false;
        }),
      },
    },
  },
}));

// ── helpers ──────────────────────────────────────────────────────────────────

const mockAccount = {
  id: 99,
  name: 'Test',
  platform: 'douyin' as const,
  stage: 'starter' as const,
  industry: '科技',
  followersRange: '0-1000' as const,
};

function renderVC() {
  return render(
    <MemoryRouter>
      <VoiceChat />
    </MemoryRouter>,
  );
}

// ── tests ────────────────────────────────────────────────────────────────────

describe('VoiceChat PRD-25 streaming', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(useActiveAccount).mockReturnValue({
      account: mockAccount,
      isLoading: false,
      isSwitching: false,
      switchTo: vi.fn(),
    });
    mockSubscription.onData = null;
    mockSubscription.onError = null;
    mockSubscription.enabled = false;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ── existing AC-1 tests ───────────────────────────────────────────────────

  it('AC-1 · H1 字面锁 "VOICE CHAT"', () => {
    renderVC();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('VOICE CHAT');
  });

  it('AC-1 · H3 模块标题 "你的专属 IP 变现顾问"', () => {
    renderVC();
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('你的专属 IP 变现顾问');
  });

  it('AC-3 · 自我介绍字面锁 (VOICE_CHAT_INTRO)', () => {
    renderVC();
    expect(screen.getByText(VOICE_CHAT_INTRO)).toBeInTheDocument();
  });

  it('AC-7 · 6 quick prompts 全部渲染(字面对照)', () => {
    renderVC();
    for (const prompt of VOICE_CHAT_QUICK_PROMPTS_6) {
      expect(screen.getByText(prompt)).toBeInTheDocument();
    }
  });

  it('AC-7 · quick prompt click → 填到 input(不直接发送)', () => {
    renderVC();
    const firstPrompt = VOICE_CHAT_QUICK_PROMPTS_6[0] as string;
    fireEvent.click(screen.getByTestId('quick-prompt-0'));
    const input = screen.getByTestId('chat-input');
    expect((input as HTMLInputElement).value).toBe(firstPrompt);
    // history should NOT appear yet (not sent)
    expect(screen.queryByTestId('history-list')).toBeNull();
  });

  // ── new PRD-25 streaming tests ────────────────────────────────────────────

  it('(a) AC-2 · delta chunks 累积到 currentAnswer', () => {
    renderVC();
    const input = screen.getByTestId('chat-input');
    fireEvent.change(input, { target: { value: '你好' } });
    fireEvent.click(screen.getByTestId('send-button'));

    act(() => {
      mockSubscription.onData?.({ type: 'meta', meta: { model: 'claude-sonnet-4-6' } });
      mockSubscription.onData?.({ type: 'delta', delta: '我是' });
      mockSubscription.onData?.({ type: 'delta', delta: 'AI顾问' });
    });

    const answer = screen.getByTestId('current-answer');
    expect(answer.textContent).toBe('我是AI顾问');
  });

  it('(b) AC-2 · tool_call hint 显示', () => {
    renderVC();
    const input = screen.getByTestId('chat-input');
    fireEvent.change(input, { target: { value: '查今日任务' } });
    fireEvent.click(screen.getByTestId('send-button'));

    act(() => {
      mockSubscription.onData?.({ type: 'tool_call', toolName: 'get_today_tasks', args: {} });
    });

    expect(screen.getByTestId('tool-hint-0')).toHaveTextContent('调用工具: get_today_tasks...');
  });

  it('(c) AC-4 · done 后 history append + localStorage', () => {
    renderVC();
    const input = screen.getByTestId('chat-input');
    fireEvent.change(input, { target: { value: '帮我分析IP' } });
    fireEvent.click(screen.getByTestId('send-button'));

    act(() => {
      mockSubscription.onData?.({ type: 'delta', delta: '好的，' });
      mockSubscription.onData?.({ type: 'delta', delta: '我来帮您分析' });
      mockSubscription.onData?.({
        type: 'done',
        sessionId: 'sess-1',
        modelUsed: 'claude-sonnet-4-6',
        turns: 1,
        tokensUsed: { prompt: 10, completion: 20, total: 30 },
      });
    });

    // history list should appear
    expect(screen.getByTestId('history-list')).toBeInTheDocument();
    expect(screen.getByText('帮我分析IP')).toBeInTheDocument();

    // localStorage saved
    const key = `aiip_memory_acc_${mockAccount.id}_voice_chat_history`;
    const stored = localStorage.getItem(key);
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored as string) as Array<{ question: string; answer: string }>;
    expect(parsed[0]?.question).toBe('帮我分析IP');
    expect(parsed[0]?.answer).toBe('好的，我来帮您分析');
  });

  it('(d) AC-5 · error → retry button 显示', () => {
    renderVC();
    const input = screen.getByTestId('chat-input');
    fireEvent.change(input, { target: { value: '错误测试' } });
    fireEvent.click(screen.getByTestId('send-button'));

    act(() => {
      mockSubscription.onData?.({ type: 'error', error: 'api_error' });
    });

    expect(screen.getByTestId('stream-error')).toBeInTheDocument();
    expect(screen.getByTestId('retry-button')).toBeInTheDocument();
  });

  it('(e) AC-6 · cancel → partial=true hint in history', () => {
    renderVC();
    const input = screen.getByTestId('chat-input');
    fireEvent.change(input, { target: { value: '取消测试' } });
    fireEvent.click(screen.getByTestId('send-button'));

    act(() => {
      mockSubscription.onData?.({ type: 'delta', delta: '部分' });
      mockSubscription.onData?.({ type: 'delta', delta: '内容' });
    });

    // cancel button appears during streaming
    const cancelBtn = screen.getByTestId('cancel-button');
    expect(cancelBtn).toBeInTheDocument();

    act(() => {
      fireEvent.click(cancelBtn);
    });

    // history entry with partial=true
    const partialHint = screen.getByTestId('partial-hint');
    expect(partialHint).toBeInTheDocument();
    expect(partialHint.textContent).toContain('已取消 · 部分生成');
  });

  it('AC-3 · done 후 tokensUsed footer 显示', () => {
    renderVC();
    const input = screen.getByTestId('chat-input');
    fireEvent.change(input, { target: { value: 'footer测试' } });
    fireEvent.click(screen.getByTestId('send-button'));

    act(() => {
      mockSubscription.onData?.({ type: 'delta', delta: '测试回答' });
      mockSubscription.onData?.({
        type: 'done',
        sessionId: 'sess-2',
        modelUsed: 'claude-sonnet-4-6',
        turns: 1,
        tokensUsed: { prompt: 5, completion: 15, total: 20 },
      });
    });

    const footer = screen.getByTestId('stream-footer');
    expect(footer.textContent).toContain('20 tokens');
  });

  it('AC-2 · meta chunk → model hint 显示', () => {
    renderVC();
    const input = screen.getByTestId('chat-input');
    fireEvent.change(input, { target: { value: 'meta测试' } });
    fireEvent.click(screen.getByTestId('send-button'));

    act(() => {
      mockSubscription.onData?.({ type: 'meta', meta: { model: 'claude-opus-4-7' } });
    });

    const hint = screen.getByTestId('model-hint');
    expect(hint.textContent).toContain('claude-opus-4-7');
  });

  it('AC-5 · onError callback → retry button 显示', () => {
    renderVC();
    const input = screen.getByTestId('chat-input');
    fireEvent.change(input, { target: { value: 'network错误' } });
    fireEvent.click(screen.getByTestId('send-button'));

    act(() => {
      mockSubscription.onError?.(new Error('network failure'));
    });

    expect(screen.getByTestId('stream-error')).toBeInTheDocument();
    expect(screen.getByTestId('retry-button')).toBeInTheDocument();
  });
});
