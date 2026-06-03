/**
 * VoiceChat.tsx — 先锋白·工业精密版 语音对话 / AI 助手
 * 阶段2 页9: 接真流式后端 · trpc.voiceChat.start subscription (SSE)
 * 先锋白标准 · PioneerLayout · 品牌三主色 · 逻辑 / testid 零改动
 * 3 voice-chat 子组件 inline
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { PioneerLayout } from '@/layouts/PioneerLayout';
import {
  VOICE_CHAT_CHIP_SUBTITLE,
  VOICE_CHAT_CHIP_TITLE,
  VOICE_CHAT_INPUT_PLACEHOLDER,
  VOICE_CHAT_LABEL_COPY,
  VOICE_CHAT_LABEL_PLAY,
  VOICE_CHAT_MOCK_MESSAGES,
  VOICE_CHAT_TOAST_AUDIO,
  VOICE_CHAT_TOAST_VOICE,
  VOICE_CHAT_TOAST_COPIED,
  type MockMessage,
} from '@/lib/constants/voice-chat';
import { trpc } from '@/lib/trpc';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  streaming?: boolean;
}

// ── helpers ────────────────────────────────────────────────────────────────────

function genMsgId() {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function nowTime() {
  return new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function genSessionId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// ── inline MessageBubble ───────────────────────────────────────────────────────

function MessageBubble({ message }: { message: ChatMessage | MockMessage }) {
  const isUser = message.role === 'user';
  const isStreaming = 'streaming' in message && message.streaming;

  if (isUser) {
    return (
      <div className="flex justify-end" data-testid="message-bubble-user">
        <div className="max-w-2xl rounded-2xl rounded-tr-sm bg-[#002fa7] px-5 py-3.5 shadow-sm">
          <p className="text-[14px] leading-relaxed text-white">{message.content}</p>
          <p className="mt-1.5 text-[11px] text-[#a5b8ee]">{message.timestamp}</p>
        </div>
      </div>
    );
  }

  // assistant bubble
  return (
    <div className="flex flex-col gap-1.5" data-testid="message-bubble-assistant">
      {/* AI avatar chip + bubble */}
      <div className="flex items-start gap-3">
        {/* AI avatar icon chip */}
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#002fa7]/10 text-[#002fa7]">
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
            smart_toy
          </span>
        </span>
        <div className="max-w-3xl rounded-2xl rounded-tl-sm border border-[#e5e7eb] bg-white px-5 py-3.5 shadow-sm">
          <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-[#1b1b1b]">
            {message.content}
            {isStreaming && (
              <span
                className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-[#002fa7]"
                aria-hidden="true"
              />
            )}
          </p>
        </div>
      </div>

      {/* bottom row: timestamp + play + copy */}
      {!isStreaming && (
        <div className="flex items-center gap-3 pl-12">
          <span className="text-[11px] text-[#9ca3af]">{message.timestamp}</span>

          <button
            type="button"
            onClick={() => toast.info(VOICE_CHAT_TOAST_AUDIO)}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[12px] font-medium text-[#6b7280] transition-colors hover:bg-[#f3f4f6] hover:text-[#002fa7]"
            data-testid="message-play-btn"
            aria-label={VOICE_CHAT_LABEL_PLAY}
          >
            <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
              volume_up
            </span>
            {VOICE_CHAT_LABEL_PLAY}
          </button>

          <button
            type="button"
            onClick={() => {
              void navigator.clipboard.writeText(message.content).catch(() => {});
              toast.info(VOICE_CHAT_TOAST_COPIED);
            }}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[12px] font-medium text-[#6b7280] transition-colors hover:bg-[#f3f4f6] hover:text-[#002fa7]"
            data-testid="message-copy-btn"
            aria-label={VOICE_CHAT_LABEL_COPY}
          >
            <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
              content_copy
            </span>
            {VOICE_CHAT_LABEL_COPY}
          </button>
        </div>
      )}
    </div>
  );
}

// ── inline VoiceChatInput ──────────────────────────────────────────────────────

interface VoiceChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onMicClick: () => void;
  onSend: () => void;
  disabled?: boolean;
}

function VoiceChatInput({ value, onChange, onMicClick, onSend, disabled }: VoiceChatInputProps) {
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }

  return (
    <div
      className="flex items-center gap-3 rounded-2xl border border-[#e5e7eb] bg-white px-4 py-3 shadow-sm"
      data-testid="voice-chat-input-row"
    >
      {/* left mic button */}
      <button
        type="button"
        onClick={onMicClick}
        disabled={disabled}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#002fa7] text-white shadow-sm transition-all hover:bg-[#001e73] active:scale-95 disabled:opacity-60"
        data-testid="voice-chat-mic-btn"
        aria-label="语音输入"
      >
        <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
          mic
        </span>
      </button>

      {/* text input */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={VOICE_CHAT_INPUT_PLACEHOLDER}
        data-testid="voice-chat-input"
        aria-label="输入消息"
        disabled={disabled}
        className="flex-1 bg-transparent text-[14px] text-[#1b1b1b] outline-none placeholder:text-[#9ca3af] disabled:opacity-60"
      />

      {/* right send button */}
      <button
        type="button"
        onClick={onSend}
        disabled={disabled}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#002fa7] text-white shadow-sm transition-all hover:bg-[#001e73] active:scale-95 disabled:opacity-60"
        data-testid="voice-chat-send-btn"
        aria-label="发送"
      >
        <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
          send
        </span>
      </button>
    </div>
  );
}

// ── VoiceChat page ─────────────────────────────────────────────────────────────

// Welcome message shown at start (not from MOCK_MESSAGES data source)
const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: VOICE_CHAT_MOCK_MESSAGES[1]?.content ?? '你好！我是你的AI助手，有什么问题尽管问我！',
  timestamp: VOICE_CHAT_MOCK_MESSAGES[1]?.timestamp ?? '00:00',
};

export default function VoiceChat() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [sessionId] = useState<string>(() => genSessionId());
  const [pendingUserMessage, setPendingUserMessage] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  // model name from 'meta' chunk — shown in KPI card
  const [modelName, setModelName] = useState<string | null>(null);
  // streaming assistant message id, stable across delta updates
  const streamingMsgIdRef = useRef<string | null>(null);
  // P1-4: ref-based streaming guard — prevents concurrent subscriptions on
  // rapid Enter presses where state updates haven't committed yet
  const isStreamingRef = useRef(false);
  // P0-2: store backend-returned sessionId in ref — never mutate subscription
  // input (sessionId state), which would cause queryKey churn + re-subscription
  const serverSessionIdRef = useRef<string | null>(null);

  // ── mutations ──────────────────────────────────────────────────────────────
  const clearSessionMutation = trpc.voiceChat.clearSession.useMutation({
    onSuccess: () => {
      // P1-6: full state reset — covers edge-case where clear fires while
      // something is mid-stream (e.g. user clears from another tab)
      setMessages([]);
      setIsStreaming(false);
      isStreamingRef.current = false;
      setPendingUserMessage(null);
      streamingMsgIdRef.current = null;
      serverSessionIdRef.current = null;
    },
    onError: (e) => {
      toast.error(`清空失败: ${e.message}`);
    },
  });

  // ── subscription ───────────────────────────────────────────────────────────
  trpc.voiceChat.start.useSubscription(
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    { userMessage: pendingUserMessage!, sessionId },
    {
      enabled: !!pendingUserMessage,
      onData: (chunk) => {
        const c = chunk as { type: string; delta?: string; toolName?: string; sessionId?: string; modelUsed?: string; meta?: { model: string } };

        if (c.type === 'meta' && c.meta?.model) {
          setModelName(c.meta.model);
        } else if (c.type === 'delta' && c.delta) {
          const delta = c.delta;
          const deltaId = streamingMsgIdRef.current;
          if (deltaId) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === deltaId ? { ...m, content: m.content + delta } : m,
              ),
            );
          }
        } else if (c.type === 'tool_call') {
          // lightweight indicator — no new message, streaming stays active
          toast.info(`正在调用工具: ${c.toolName ?? '…'}`);
        } else if (c.type === 'tool_result') {
          // silently absorbed
        } else if (c.type === 'done') {
          // P0-2: store server sessionId in ref only — never update sessionId state
          // here, which would change subscription input → queryKey → re-subscription
          if (c.sessionId) serverSessionIdRef.current = c.sessionId;
          if (c.modelUsed) setModelName(c.modelUsed);
          // Capture ref value before clearing it so the setMessages updater
          // can still use it even if React defers calling the updater
          const finalizeId = streamingMsgIdRef.current;
          streamingMsgIdRef.current = null;
          isStreamingRef.current = false;
          if (finalizeId) {
            setMessages((prev) =>
              prev.map((m) => (m.id === finalizeId ? { ...m, streaming: false } : m)),
            );
          }
          setIsStreaming(false);
          setPendingUserMessage(null);
        } else if (c.type === 'error') {
          toast.error(`对话出错，请重试`);
          // finalize streaming message (keep whatever was accumulated)
          const finalizeId = streamingMsgIdRef.current;
          streamingMsgIdRef.current = null;
          isStreamingRef.current = false;
          if (finalizeId) {
            setMessages((prev) =>
              prev.map((m) => (m.id === finalizeId ? { ...m, streaming: false } : m)),
            );
          }
          setIsStreaming(false);
          setPendingUserMessage(null);
        }
      },
      onError: (e) => {
        toast.error(`连接错误: ${String(e)}`);
        // finalize streaming message
        const finalizeId = streamingMsgIdRef.current;
        streamingMsgIdRef.current = null;
        isStreamingRef.current = false;
        if (finalizeId) {
          setMessages((prev) =>
            prev.map((m) => (m.id === finalizeId ? { ...m, streaming: false } : m)),
          );
        }
        setIsStreaming(false);
        setPendingUserMessage(null);
      },
    },
  );

  // ── send handler ───────────────────────────────────────────────────────────
  const handleSend = useCallback(() => {
    const text = input.trim();
    // P1-4: check ref FIRST (instant, no commit lag) to prevent concurrent
    // subscriptions from rapid Enter presses between React state commits
    if (!text || isStreamingRef.current) return;

    const userMsg: ChatMessage = {
      id: genMsgId(),
      role: 'user',
      content: text,
      timestamp: nowTime(),
    };

    const assistantMsgId = genMsgId();
    streamingMsgIdRef.current = assistantMsgId;
    // arm ref immediately so any re-entrant call is blocked before state commits
    isStreamingRef.current = true;

    const assistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: nowTime(),
      streaming: true,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput('');
    setIsStreaming(true);
    // setting pendingUserMessage triggers the subscription
    setPendingUserMessage(text);
  }, [input]);

  // auto-scroll to bottom when messages change
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (typeof messagesEndRef.current?.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // ── derived stats ──────────────────────────────────────────────────────────
  // Count completed turns: exclude streaming msgs and the static welcome bubble
  // (id === 'welcome') so an empty conversation shows 0, not 1
  const completedTurns = messages.filter((m) => !m.streaming && m.id !== 'welcome').length;

  return (
    <PioneerLayout>
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="mb-10 flex flex-row items-center justify-between gap-8">
        <div className="shrink-0">
          {/* 双徽标 */}
          <div className="mb-3 flex items-center gap-3">
            <span className="rounded-lg border border-[#e5e7eb] bg-[#e8e8e8] px-3 py-1 text-[12px] font-bold uppercase tracking-widest text-[#1b1b1b]">
              智能引擎
            </span>
            <span className="rounded-lg border border-[#6e5e00] bg-[#F6D300] px-3 py-1 text-[12px] font-bold uppercase tracking-widest text-[#221b00]">
              AI 助手
            </span>
          </div>
          <h1 className="whitespace-nowrap text-[40px] font-extrabold tracking-tighter text-[#1b1b1b]">
            {VOICE_CHAT_CHIP_TITLE} · 语音对话
          </h1>
          <p className="mt-2 max-w-[820px] text-[16px] leading-relaxed text-[#444653]">
            {VOICE_CHAT_CHIP_SUBTITLE} · 实时 AI 对话 · 多模态交互 · 随时随地获取专业建议
          </p>
        </div>

        {/* 右侧控制按钮 + 在线状态 */}
        <div className="flex shrink-0 items-center gap-3">
          {/* 连接状态 — 按实际订阅状态显示 */}
          {isStreaming ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#002fa7]/10 px-3 py-1.5 text-[12px] font-semibold text-[#002fa7]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#002fa7]" />
              回复中…
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#10b981]/10 px-3 py-1.5 text-[12px] font-semibold text-[#10b981]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#10b981]" />
              在线
            </span>
          )}

          {/* audio btn */}
          <button
            type="button"
            onClick={() => toast.info(VOICE_CHAT_TOAST_AUDIO)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e5e7eb] bg-white text-[#444653] shadow-sm transition-all hover:border-[#002fa7] hover:text-[#002fa7]"
            data-testid="voice-chat-audio-btn"
            aria-label="音频"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              volume_up
            </span>
          </button>

          {/* clear btn */}
          <button
            type="button"
            onClick={() => clearSessionMutation.mutate()}
            disabled={clearSessionMutation.isPending || isStreaming}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e5e7eb] bg-white text-[#444653] shadow-sm transition-all hover:border-[#781621] hover:text-[#781621] disabled:opacity-50"
            data-testid="voice-chat-clear-btn"
            aria-label="清空"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              delete_sweep
            </span>
          </button>
        </div>
      </header>

      {/* ── 轻量概览 KPI chips ──────────────────────────────── */}
      <div className="mb-8 grid grid-cols-4 gap-5">
        {/* 对话轮次 — 真实数据 */}
        <div className="flex items-center gap-3 rounded-xl border border-[#e0e7ff] bg-gradient-to-br from-white to-[#f3f6ff] p-4 pw-shadow-soft">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#002fa7]/10 text-[#002fa7]">
            <span className="material-symbols-outlined text-[22px]" aria-hidden="true">
              forum
            </span>
          </span>
          <div className="min-w-0">
            <p className="text-[22px] font-bold leading-none text-[#002fa7]" data-testid="kpi-turns">
              {completedTurns}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-[#6b7280]">对话轮次</p>
          </div>
        </div>

        {/* 平均响应 — 示例值 */}
        <div className="flex items-center gap-3 rounded-xl border border-[#f3d4d7] bg-gradient-to-br from-white to-[#fff5f6] p-4 pw-shadow-soft">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#781621]/10 text-[#781621]">
            <span className="material-symbols-outlined text-[22px]" aria-hidden="true">
              speed
            </span>
          </span>
          <div className="min-w-0">
            <p className="text-[22px] font-bold leading-none text-[#781621]">— s</p>
            <p className="mt-0.5 truncate text-[11px] text-[#6b7280]">平均响应（示例）</p>
          </div>
        </div>

        {/* 助手模型 — 真实模型名（若有）*/}
        <div className="flex items-center gap-3 rounded-xl border border-[#fef3c0] bg-gradient-to-br from-white to-[#fffbeb] p-4 pw-shadow-soft">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F6D300]/20 text-[#8A6A00]">
            <span className="material-symbols-outlined text-[22px]" aria-hidden="true">
              smart_toy
            </span>
          </span>
          <div className="min-w-0">
            <p
              className="text-[13px] font-bold leading-none text-[#8A6A00] truncate"
              data-testid="kpi-model"
            >
              {modelName ?? 'AIP'}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-[#6b7280]">助手模型</p>
          </div>
        </div>

        {/* 满意度 — 示例值 */}
        <div className="flex items-center gap-3 rounded-xl border border-[#e0e7ff] bg-gradient-to-br from-white to-[#f3f6ff] p-4 pw-shadow-soft">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#002fa7]/10 text-[#002fa7]">
            <span className="material-symbols-outlined text-[22px]" aria-hidden="true">
              thumb_up
            </span>
          </span>
          <div className="min-w-0">
            <p className="text-[22px] font-bold leading-none text-[#002fa7]">—</p>
            <p className="mt-0.5 truncate text-[11px] text-[#6b7280]">满意度（示例）</p>
          </div>
        </div>
      </div>

      {/* ── 聊天主体卡 ─────────────────────────────────────── */}
      <section className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-[#f8f9fa] pw-shadow-soft">
        {/* chip header bar */}
        <div className="flex items-center gap-3 border-b border-[#e5e7eb] bg-white px-6 py-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#002fa7] text-white shadow-sm">
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              mic
            </span>
          </span>
          <div>
            <p
              className="text-[18px] font-extrabold uppercase tracking-widest text-[#002fa7]"
              data-testid="voice-chat-chip-title"
            >
              {VOICE_CHAT_CHIP_TITLE}
            </p>
            <p className="text-[12px] text-[#6b7280]" data-testid="voice-chat-chip-subtitle">
              {VOICE_CHAT_CHIP_SUBTITLE}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {isStreaming ? (
              <>
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#002fa7]" />
                <span className="text-[12px] font-semibold text-[#002fa7]" data-testid="status-streaming">
                  回复中…
                </span>
              </>
            ) : (
              <>
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#10b981]" />
                <span className="text-[12px] font-semibold text-[#10b981]" data-testid="status-online">
                  连接中
                </span>
              </>
            )}
          </div>
        </div>

        {/* messages area — role=log lets screen readers announce streaming replies */}
        <div
          role="log"
          aria-live="polite"
          aria-atomic="false"
          aria-label="对话消息列表"
          className="min-h-[400px] max-h-[480px] space-y-6 overflow-y-auto px-6 py-6"
          data-testid="messages-area"
        >
          {messages.length === 0 ? (
            <div
              className="flex h-full min-h-[300px] flex-col items-center justify-center gap-3 text-center"
              data-testid="empty-state"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#002fa7]/10 text-[#002fa7]">
                <span className="material-symbols-outlined text-[36px]" aria-hidden="true">
                  chat_bubble_outline
                </span>
              </span>
              <p className="text-[16px] font-semibold text-[#1b1b1b]">开始你的对话</p>
              <p className="text-[14px] text-[#6b7280]">在下方输入问题，AI 助手将实时回复</p>
            </div>
          ) : (
            messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* input row */}
        <div className="border-t border-[#e5e7eb] bg-white px-6 py-4">
          <VoiceChatInput
            value={input}
            onChange={setInput}
            onMicClick={() => toast.info(VOICE_CHAT_TOAST_VOICE)}
            onSend={handleSend}
            disabled={isStreaming}
          />
        </div>
      </section>
    </PioneerLayout>
  );
}
