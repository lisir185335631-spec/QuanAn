/**
 * VoiceChat.test.tsx — 阶段2 接真流式后端
 * useSubscription mock 策略:
 *   - vi.hoisted() 提升 handlers map，让测试可在渲染前/后注入 onData/onError
 *   - useSubscription mock 在调用时保存 opts，测试通过 triggerData/triggerError 驱动
 *   - clearSession.useMutation mock 捕获 onSuccess/onError 回调
 */
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import VoiceChat from '@/pages/tools/VoiceChat';

// ── hoisted shared state ───────────────────────────────────────────────────────

// These are hoisted so vi.mock factories can reference them
const mockToastInfo = vi.hoisted(() => vi.fn());
const mockToastError = vi.hoisted(() => vi.fn());

// Subscription opts captured from the last useSubscription call
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const capturedSubOpts = vi.hoisted(() => ({ current: null as any }));

// clearSession mutation: captured callbacks + mock mutate
const clearMutate = vi.hoisted(() => vi.fn());
const capturedClearOpts = vi.hoisted(() => ({ current: null as { onSuccess?: () => void; onError?: (e: Error) => void } | null }));

// ── mocks ─────────────────────────────────────────────────────────────────────

vi.mock('sonner', () => ({
  toast: { info: mockToastInfo, success: vi.fn(), error: mockToastError },
}));

vi.mock('@/lib/trpc', () => ({
  trpc: {
    ipAccounts: {
      list: { useQuery: () => ({ data: [], isLoading: false }) },
      active: { useQuery: () => ({ data: null, isLoading: false }) },
      switchActive: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
    auth: {
      me: { useQuery: () => ({ data: null, isLoading: false }) },
    },
    voiceChat: {
      start: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        useSubscription: (_input: any, opts: any) => {
          // Capture the latest opts each render so tests can call onData / onError
          capturedSubOpts.current = opts;
        },
      },
      clearSession: {
        useMutation: (opts: { onSuccess?: () => void; onError?: (e: Error) => void }) => {
          capturedClearOpts.current = opts;
          return { mutate: clearMutate, isPending: false };
        },
      },
    },
  },
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: null, login: vi.fn(), logout: vi.fn() }),
}));

vi.mock('@/hooks/useActiveAccount', () => ({
  useActiveAccount: () => ({ account: null, switchTo: vi.fn() }),
}));

// navigator.clipboard mock
Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: vi.fn().mockResolvedValue(undefined) },
  writable: true,
});

// ── helpers ────────────────────────────────────────────────────────────────────

function renderVC() {
  return render(
    <MemoryRouter>
      <VoiceChat />
    </MemoryRouter>,
  );
}

/** Fire a chunk through the captured subscription's onData */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function triggerData(chunk: any) {
  act(() => {
    capturedSubOpts.current?.onData?.(chunk);
  });
}

/** Fire an error through the captured subscription's onError */
function triggerError(err: Error) {
  act(() => {
    capturedSubOpts.current?.onError?.(err);
  });
}

// ── setup ──────────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockToastInfo.mockClear();
  mockToastError.mockClear();
  clearMutate.mockClear();
  capturedSubOpts.current = null;
  capturedClearOpts.current = null;
});

// ── tests ─────────────────────────────────────────────────────────────────────

describe('VoiceChat · 接真流式后端', () => {
  // ── chip & subtitle 字面锁 ───────────────────────────────────────────────
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

  // ── 初始状态 ─────────────────────────────────────────────────────────────
  it('初始渲染: 欢迎语 "哈喽哈喽" 出现（来自 WELCOME_MESSAGE，不是 mock 原始数据源）', () => {
    renderVC();
    // welcome message is rendered as the first assistant message
    const assistantBubbles = screen.getAllByTestId('message-bubble-assistant');
    expect(assistantBubbles[0]?.textContent).toContain('哈喽哈喽');
  });

  it('初始渲染: input placeholder "有什么问题尽管问我..." 出现', () => {
    renderVC();
    expect(screen.getByTestId('voice-chat-input')).toHaveAttribute('placeholder', '有什么问题尽管问我...');
  });

  it('初始渲染: assistant bubble 底部 播放 + 复制 btn 存在', () => {
    renderVC();
    // Welcome message is a completed assistant bubble → should show play/copy
    expect(screen.getByTestId('message-play-btn')).toBeInTheDocument();
    expect(screen.getByTestId('message-copy-btn')).toBeInTheDocument();
    expect(screen.getByTestId('message-play-btn')).toHaveTextContent('播放');
    expect(screen.getByTestId('message-copy-btn')).toHaveTextContent('复制');
  });

  it('初始状态 status chip 显 "连接中"', () => {
    renderVC();
    expect(screen.getByTestId('status-online')).toHaveTextContent('连接中');
  });

  // ── 发送消息 ─────────────────────────────────────────────────────────────
  it('send btn · 空 input 时不发消息', () => {
    renderVC();
    const before = screen.queryAllByTestId('message-bubble-user').length;
    fireEvent.click(screen.getByTestId('voice-chat-send-btn'));
    expect(screen.queryAllByTestId('message-bubble-user')).toHaveLength(before);
  });

  it('send btn · 非空 input → 用户消息渲染到 DOM', async () => {
    renderVC();
    fireEvent.change(screen.getByTestId('voice-chat-input'), { target: { value: '你好世界' } });
    fireEvent.click(screen.getByTestId('voice-chat-send-btn'));
    await waitFor(() => {
      const userBubbles = screen.getAllByTestId('message-bubble-user');
      const texts = userBubbles.map((b) => b.textContent);
      expect(texts.some((t) => t?.includes('你好世界'))).toBe(true);
    });
  });

  it('发送后 input 清空', async () => {
    renderVC();
    const inputEl = screen.getByTestId('voice-chat-input');
    fireEvent.change(inputEl, { target: { value: '测试消息' } });
    fireEvent.click(screen.getByTestId('voice-chat-send-btn'));
    await waitFor(() => {
      expect(inputEl).toHaveValue('');
    });
  });

  it('发送后 status chip 变为 "回复中…"', async () => {
    renderVC();
    fireEvent.change(screen.getByTestId('voice-chat-input'), { target: { value: '开始流式' } });
    fireEvent.click(screen.getByTestId('voice-chat-send-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('status-streaming')).toHaveTextContent('回复中…');
    });
  });

  it('Enter 键发送消息', async () => {
    renderVC();
    const inputEl = screen.getByTestId('voice-chat-input');
    fireEvent.change(inputEl, { target: { value: '按 Enter' } });
    fireEvent.keyDown(inputEl, { key: 'Enter', shiftKey: false });
    await waitFor(() => {
      const userBubbles = screen.getAllByTestId('message-bubble-user');
      const texts = userBubbles.map((b) => b.textContent);
      expect(texts.some((t) => t?.includes('按 Enter'))).toBe(true);
    });
  });

  // ── 流式 delta 累积 ──────────────────────────────────────────────────────
  it('delta chunk 累积到 assistant streaming 消息', async () => {
    renderVC();
    fireEvent.change(screen.getByTestId('voice-chat-input'), { target: { value: '流式测试' } });
    fireEvent.click(screen.getByTestId('voice-chat-send-btn'));

    // send delta chunks
    triggerData({ type: 'delta', delta: '你好' });
    triggerData({ type: 'delta', delta: '，我来了' });

    await waitFor(() => {
      const assistantBubbles = screen.getAllByTestId('message-bubble-assistant');
      // last assistant bubble is the streaming one
      const lastBubble = assistantBubbles[assistantBubbles.length - 1];
      expect(lastBubble?.textContent).toContain('你好，我来了');
    });
  });

  // ── done 后 finalize ─────────────────────────────────────────────────────
  it('done chunk 后 streaming=false, status 恢复 "连接中"', async () => {
    renderVC();
    fireEvent.change(screen.getByTestId('voice-chat-input'), { target: { value: '完成测试' } });
    fireEvent.click(screen.getByTestId('voice-chat-send-btn'));

    triggerData({ type: 'delta', delta: '回复内容' });
    triggerData({
      type: 'done',
      sessionId: 'new-session-uuid',
      modelUsed: 'claude-3-opus',
      turns: 1,
      tokensUsed: { prompt: 10, completion: 5, total: 15 },
    });

    await waitFor(() => {
      expect(screen.getByTestId('status-online')).toHaveTextContent('连接中');
    });
  });

  it('done chunk 后 model 名更新到 KPI', async () => {
    renderVC();
    fireEvent.change(screen.getByTestId('voice-chat-input'), { target: { value: '模型测试' } });
    fireEvent.click(screen.getByTestId('voice-chat-send-btn'));

    triggerData({ type: 'meta', meta: { model: 'claude-sonnet-4' } });
    triggerData({
      type: 'done',
      sessionId: 'abc-123',
      modelUsed: 'claude-sonnet-4',
      turns: 1,
      tokensUsed: { prompt: 5, completion: 3, total: 8 },
    });

    await waitFor(() => {
      expect(screen.getByTestId('kpi-model')).toHaveTextContent('claude-sonnet-4');
    });
  });

  it('done 后 play + copy 按钮出现在 finalized 消息', async () => {
    renderVC();
    fireEvent.change(screen.getByTestId('voice-chat-input'), { target: { value: '按钮测试' } });
    fireEvent.click(screen.getByTestId('voice-chat-send-btn'));

    triggerData({ type: 'delta', delta: '答案文本' });
    triggerData({
      type: 'done',
      sessionId: 'done-session',
      modelUsed: 'test-model',
      turns: 1,
      tokensUsed: { prompt: 5, completion: 3, total: 8 },
    });

    await waitFor(() => {
      // At least one play and copy button visible (welcome + finalized assistant)
      const playBtns = screen.getAllByTestId('message-play-btn');
      const copyBtns = screen.getAllByTestId('message-copy-btn');
      expect(playBtns.length).toBeGreaterThanOrEqual(2);
      expect(copyBtns.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ── 对话轮次 KPI ──────────────────────────────────────────────────────────
  it('初始 KPI 对话轮次为 0（welcome 已排除）', () => {
    renderVC();
    // P1-5: welcome bubble (id='welcome') is excluded from completedTurns
    expect(screen.getByTestId('kpi-turns')).toHaveTextContent('0');
  });

  it('完成一轮后 KPI 对话轮次 +2（user + assistant）', async () => {
    renderVC();
    // initial: 0 (welcome excluded)
    const initialTurns = parseInt(screen.getByTestId('kpi-turns').textContent ?? '0', 10);

    fireEvent.change(screen.getByTestId('voice-chat-input'), { target: { value: 'KPI 测试' } });
    fireEvent.click(screen.getByTestId('voice-chat-send-btn'));
    // user message is immediately added (not streaming)
    // assistant streaming message is not counted yet

    triggerData({ type: 'delta', delta: '好的' });
    triggerData({
      type: 'done',
      sessionId: 'kpi-session',
      modelUsed: 'aip',
      turns: 1,
      tokensUsed: { prompt: 2, completion: 1, total: 3 },
    });

    await waitFor(() => {
      const newTurns = parseInt(screen.getByTestId('kpi-turns').textContent ?? '0', 10);
      // +2: user + finalized assistant
      expect(newTurns).toBe(initialTurns + 2);
    });
  });

  // ── 错误态 ────────────────────────────────────────────────────────────────
  it('onError: toast.error 触发, status 恢复 "连接中"', async () => {
    renderVC();
    fireEvent.change(screen.getByTestId('voice-chat-input'), { target: { value: '错误测试' } });
    fireEvent.click(screen.getByTestId('voice-chat-send-btn'));

    triggerError(new Error('network failure'));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalled();
      expect(screen.getByTestId('status-online')).toHaveTextContent('连接中');
    });
  });

  it('error chunk: toast.error 触发', async () => {
    renderVC();
    fireEvent.change(screen.getByTestId('voice-chat-input'), { target: { value: 'chunk 错误' } });
    fireEvent.click(screen.getByTestId('voice-chat-send-btn'));

    triggerData({ type: 'error', error: 'upstream_error' });

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalled();
    });
  });

  // ── clear 清空 ────────────────────────────────────────────────────────────
  it('clear btn 调用 clearSession mutation', async () => {
    renderVC();
    fireEvent.click(screen.getByTestId('voice-chat-clear-btn'));
    expect(clearMutate).toHaveBeenCalled();
  });

  it('clearSession onSuccess 后 messages 清空 → empty-state 出现', async () => {
    renderVC();
    // trigger clear onSuccess callback
    act(() => {
      capturedClearOpts.current?.onSuccess?.();
    });
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });
  });

  it('clearSession onError 后 toast.error 触发', async () => {
    renderVC();
    act(() => {
      capturedClearOpts.current?.onError?.(new Error('clear failed'));
    });
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('清空失败: clear failed');
    });
  });

  // ── 空态 ──────────────────────────────────────────────────────────────────
  it('清空后 empty-state 渲染', async () => {
    renderVC();
    act(() => {
      capturedClearOpts.current?.onSuccess?.();
    });
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });
  });

  // ── P2-9: 流式生命周期 disabled / 防重发 ─────────────────────────────────
  it('流式中 send-btn + input + mic-btn 均 disabled', async () => {
    renderVC();
    fireEvent.change(screen.getByTestId('voice-chat-input'), { target: { value: '流式 disabled 测试' } });
    fireEvent.click(screen.getByTestId('voice-chat-send-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('voice-chat-send-btn')).toBeDisabled();
      expect(screen.getByTestId('voice-chat-input')).toBeDisabled();
      expect(screen.getByTestId('voice-chat-mic-btn')).toBeDisabled();
    });
  });

  it('流式中再点 send 不增加新 user bubble', async () => {
    renderVC();
    fireEvent.change(screen.getByTestId('voice-chat-input'), { target: { value: '第一条' } });
    fireEvent.click(screen.getByTestId('voice-chat-send-btn'));
    // now streaming — try to send again
    fireEvent.change(screen.getByTestId('voice-chat-input'), { target: { value: '第二条' } });
    fireEvent.click(screen.getByTestId('voice-chat-send-btn'));
    await waitFor(() => {
      const userBubbles = screen.getAllByTestId('message-bubble-user');
      // only 1 user bubble — second send was blocked
      expect(userBubbles).toHaveLength(1);
    });
  });

  it('done chunk 后 send-btn + input + mic-btn 恢复 enabled', async () => {
    renderVC();
    fireEvent.change(screen.getByTestId('voice-chat-input'), { target: { value: '恢复测试' } });
    fireEvent.click(screen.getByTestId('voice-chat-send-btn'));
    triggerData({
      type: 'done',
      sessionId: 'restore-session',
      modelUsed: 'aip',
      turns: 1,
      tokensUsed: { prompt: 1, completion: 1, total: 2 },
    });
    await waitFor(() => {
      expect(screen.getByTestId('voice-chat-send-btn')).not.toBeDisabled();
      expect(screen.getByTestId('voice-chat-input')).not.toBeDisabled();
      expect(screen.getByTestId('voice-chat-mic-btn')).not.toBeDisabled();
    });
  });

  it('useSubscription enabled=false 时不触发 onData', () => {
    renderVC();
    // Before sending, pendingUserMessage is null → enabled should be false
    // capturedSubOpts.current.enabled is evaluated at render time
    expect(capturedSubOpts.current?.enabled).toBe(false);
  });

  // ── mic / audio btns ──────────────────────────────────────────────────────
  it('mic btn · toast "语音输入 · 即将上线"', () => {
    renderVC();
    mockToastInfo.mockClear();
    fireEvent.click(screen.getByTestId('voice-chat-mic-btn'));
    expect(mockToastInfo).toHaveBeenCalledWith('语音输入 · 即将上线');
  });

  it('audio btn · toast "音频播放 · 即将上线"', () => {
    renderVC();
    mockToastInfo.mockClear();
    fireEvent.click(screen.getByTestId('voice-chat-audio-btn'));
    expect(mockToastInfo).toHaveBeenCalledWith('音频播放 · 即将上线');
  });

  // ── copy 功能 ─────────────────────────────────────────────────────────────
  it('copy btn · 调用 navigator.clipboard.writeText + toast "已复制"', async () => {
    renderVC();
    mockToastInfo.mockClear();
    fireEvent.click(screen.getByTestId('message-copy-btn'));
    await waitFor(() => {
      expect(mockToastInfo).toHaveBeenCalledWith('已复制');
    });
  });

  // ── play btn (TTS toast) ──────────────────────────────────────────────────
  it('play btn · toast "音频播放 · 即将上线"', () => {
    renderVC();
    mockToastInfo.mockClear();
    fireEvent.click(screen.getByTestId('message-play-btn'));
    expect(mockToastInfo).toHaveBeenCalledWith('音频播放 · 即将上线');
  });

  // ── MOCK_MESSAGES 常量保留供测试 ──────────────────────────────────────────
  it('VOICE_CHAT_MOCK_MESSAGES 常量仍可从 constants 导入（供测试用）', async () => {
    const { VOICE_CHAT_MOCK_MESSAGES } = await import('@/lib/constants/voice-chat');
    expect(VOICE_CHAT_MOCK_MESSAGES).toHaveLength(2);
    expect(VOICE_CHAT_MOCK_MESSAGES[0]?.content).toBe('Hello Hello你好你好');
  });
});
