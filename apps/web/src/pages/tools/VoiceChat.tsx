/**
 * VoiceChat.tsx — iOS26 液态玻璃皮 · 语音对话 / AI 助手
 * LiquidShell 外壳 · home-next/ikb/system C/F/Reveal/RevealGroup/Item
 * 业务逻辑/状态/mutation/subscription/testid 零改动
 * 2026-06-08
 */

import { motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { LiquidShell } from '@/components/home-next/LiquidShell';
import { C, F, Item, Reveal, RevealGroup } from '@/components/home-next/ikb/system';
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
        <div
          className="max-w-2xl rounded-2xl rounded-tr-sm px-5 py-3.5"
          style={{
            background: C.grad,
            boxShadow: '0 4px 16px rgba(168,197,224,0.22)',
          }}
        >
          <p
            className="text-[14px] leading-relaxed"
            style={{ color: C.ink, textShadow: C.textShadow }}
          >
            {message.content}
          </p>
          <p className="mt-1.5 text-[11px]" style={{ color: 'rgba(255,255,255,0.8)' }}>
            {message.timestamp}
          </p>
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
        <span
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{
            background: 'rgba(168,197,224,0.22)',
            color: C.ikb,
          }}
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>
            smart_toy
          </span>
        </span>
        <div
          className="lg-glass max-w-3xl rounded-2xl rounded-tl-sm px-5 py-3.5"
          style={{ borderRadius: 18 }}
        >
          <p
            className="whitespace-pre-wrap text-[14px] leading-relaxed"
            style={{ color: C.ink, textShadow: C.textShadow }}
          >
            {message.content}
            {isStreaming && (
              <span
                className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse"
                style={{ background: C.ikb }}
                aria-hidden={true}
              />
            )}
          </p>
        </div>
      </div>

      {/* bottom row: timestamp + play + copy */}
      {!isStreaming && (
        <div className="flex items-center gap-3 pl-12">
          <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.72)' }}>
            {message.timestamp}
          </span>

          <button
            type="button"
            onClick={() => toast.info(VOICE_CHAT_TOAST_AUDIO)}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[12px] font-medium transition-colors"
            style={{ color: 'rgba(255,255,255,0.84)', background: 'transparent', border: 'none' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(168,197,224,0.18)';
              (e.currentTarget as HTMLButtonElement).style.color = C.ikb;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.84)';
            }}
            data-testid="message-play-btn"
            aria-label={VOICE_CHAT_LABEL_PLAY}
          >
            <span className="material-symbols-outlined text-[14px]" aria-hidden={true}>
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
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[12px] font-medium transition-colors"
            style={{ color: 'rgba(255,255,255,0.84)', background: 'transparent', border: 'none' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(168,197,224,0.18)';
              (e.currentTarget as HTMLButtonElement).style.color = C.ikb;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.84)';
            }}
            data-testid="message-copy-btn"
            aria-label={VOICE_CHAT_LABEL_COPY}
          >
            <span className="material-symbols-outlined text-[14px]" aria-hidden={true}>
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
      className="lg-glass flex items-center gap-3 px-4 py-3"
      style={{ borderRadius: 18 }}
      onFocus={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.boxShadow = `0 0 0 2px rgba(168,197,224,0.55), 0 26px 52px -14px rgba(8,20,48,0.55)`;
      }}
      onBlur={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.boxShadow = '';
      }}
      data-testid="voice-chat-input-row"
    >
      {/* left mic button */}
      <motion.button
        type="button"
        onClick={onMicClick}
        disabled={disabled}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 240, damping: 18 }}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white disabled:opacity-60"
        style={{
          background: C.grad,
          boxShadow: '0 4px 14px rgba(168,197,224,0.3)',
          border: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
        data-testid="voice-chat-mic-btn"
        aria-label="语音输入"
      >
        <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>
          mic
        </span>
      </motion.button>

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
        className="flex-1 bg-transparent text-[14px] disabled:opacity-60"
        style={{
          color: C.ink,
          border: 'none',
          outline: 'none',
          fontFamily: F.cn,
        }}
      />

      {/* right send button */}
      <motion.button
        type="button"
        onClick={onSend}
        disabled={disabled}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 240, damping: 18 }}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white disabled:opacity-60"
        style={{
          background: C.grad,
          boxShadow: '0 4px 14px rgba(168,197,224,0.3)',
          border: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
        data-testid="voice-chat-send-btn"
        aria-label="发送"
      >
        <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>
          send
        </span>
      </motion.button>
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

// 轮转三主色 (冷蓝 / 冰蓝 / 同)
const KPI_ACCENT: [string, string, string] = [C.ikb, C.yellow, C.accent3];

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

  // KPI 卡数据(轮转三主色)
  const kpiCards = [
    {
      icon: 'forum',
      value: <span data-testid="kpi-turns">{completedTurns}</span>,
      label: '对话轮次',
      accent: KPI_ACCENT[0],
      bg: 'rgba(168,197,224,0.18)',
    },
    {
      icon: 'speed',
      value: <span>— s</span>,
      label: '平均响应（示例）',
      accent: KPI_ACCENT[1],
      bg: 'rgba(228,238,255,0.18)',
    },
    {
      icon: 'smart_toy',
      value: (
        <span
          className="text-[13px] font-bold leading-none truncate"
          data-testid="kpi-model"
          style={{ color: KPI_ACCENT[2] }}
        >
          {modelName ?? 'AIP'}
        </span>
      ),
      label: '助手模型',
      accent: KPI_ACCENT[2],
      bg: 'rgba(168,197,224,0.18)',
    },
    {
      icon: 'thumb_up',
      value: <span>—</span>,
      label: '满意度（示例）',
      accent: KPI_ACCENT[0],
      bg: 'rgba(168,197,224,0.18)',
    },
  ];

  return (
    <LiquidShell>
      {/* ── Header ─────────────────────────────────────────── */}
      <header style={{ marginBottom: 40, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 32 }}>
        <div style={{ flexShrink: 0 }}>
          {/* 双徽标 */}
          <Reveal style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span
              style={{
                borderRadius: 9999,
                border: `0.5px solid ${C.line}`,
                background: 'rgba(255,255,255,0.10)',
                backdropFilter: 'blur(12px)',
                padding: '4px 14px',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: C.ink,
                fontFamily: F.mono,
                textShadow: C.textShadow,
              }}
            >
              智能引擎
            </span>
            <span
              style={{
                borderRadius: 9999,
                border: `0.5px solid rgba(168,197,224,0.55)`,
                background: 'rgba(168,197,224,0.18)',
                backdropFilter: 'blur(12px)',
                padding: '4px 14px',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: C.ikb,
                fontFamily: F.mono,
                textShadow: C.textShadow,
              }}
            >
              AI 助手
            </span>
          </Reveal>

          {/* 主标题 — 冷蓝渐变字 */}
          <h1
            style={{
              whiteSpace: 'nowrap',
              fontSize: 52,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              fontFamily: F.display,
              margin: 0,
              background: C.grad,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              color: 'transparent',
              textShadow: 'none',
            }}
          >
            {VOICE_CHAT_CHIP_TITLE} · 语音对话
          </h1>
          <p
            style={{
              marginTop: 10,
              maxWidth: 820,
              fontSize: 16,
              lineHeight: 1.6,
              color: C.burgundyText,
              fontFamily: F.cn,
              textShadow: C.textShadow,
            }}
          >
            {VOICE_CHAT_CHIP_SUBTITLE} · 实时 AI 对话 · 多模态交互 · 随时随地获取专业建议
          </p>
        </div>

        {/* 右侧控制按钮 + 在线状态 */}
        <div style={{ display: 'flex', flexShrink: 0, alignItems: 'center', gap: 12 }}>
          {/* 连接状态 — 按实际订阅状态显示 */}
          {isStreaming ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                borderRadius: 9999,
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 600,
                background: 'rgba(168,197,224,0.18)',
                color: C.ikb,
                textShadow: C.textShadow,
              }}
            >
              <span
                className="animate-pulse"
                style={{ height: 6, width: 6, borderRadius: '50%', background: C.ikb, display: 'inline-block' }}
              />
              回复中…
            </span>
          ) : (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                borderRadius: 9999,
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 600,
                background: 'rgba(168,197,224,0.18)',
                color: C.ikb,
                textShadow: C.textShadow,
              }}
            >
              <span
                className="animate-pulse"
                style={{ height: 6, width: 6, borderRadius: '50%', background: C.ikb, display: 'inline-block' }}
              />
              在线
            </span>
          )}

          {/* audio btn */}
          <motion.button
            type="button"
            onClick={() => toast.info(VOICE_CHAT_TOAST_AUDIO)}
            className="lg-glass flex h-10 w-10 items-center justify-center rounded-full"
            style={{ borderRadius: '50%', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)' }}
            whileHover={{ y: -2, color: C.ikb }}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            data-testid="voice-chat-audio-btn"
            aria-label="音频"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>
              volume_up
            </span>
          </motion.button>

          {/* clear btn */}
          <motion.button
            type="button"
            onClick={() => clearSessionMutation.mutate()}
            disabled={clearSessionMutation.isPending || isStreaming}
            className="lg-glass flex h-10 w-10 items-center justify-center rounded-full disabled:opacity-50"
            style={{ borderRadius: '50%', border: 'none', cursor: clearSessionMutation.isPending || isStreaming ? 'not-allowed' : 'pointer', color: 'rgba(255,255,255,0.7)' }}
            whileHover={{ y: -2 }}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            data-testid="voice-chat-clear-btn"
            aria-label="清空"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>
              delete_sweep
            </span>
          </motion.button>
        </div>
      </header>

      {/* ── 轻量概览 KPI chips ──────────────────────────────── */}
      <RevealGroup style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 36 }}>
        {kpiCards.map((kpi, idx) => (
          <Item key={idx} style={{ height: '100%' }}>
            <motion.div
              className="lg-glass lg-spec"
              whileHover={{ y: -5 }}
              transition={{ type: 'spring', stiffness: 240, damping: 18 }}
              style={{ borderRadius: 20, padding: 22, height: '100%', display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span
                  style={{
                    display: 'flex',
                    height: 38,
                    width: 38,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 10,
                    background: kpi.bg,
                    color: kpi.accent,
                  }}
                >
                  <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 22 }}>
                    {kpi.icon}
                  </span>
                </span>
              </div>
              <p style={{ marginTop: 14, fontSize: 30, fontWeight: 800, lineHeight: 1, color: C.ink, fontFamily: F.display, textShadow: C.textShadow }}>
                {kpi.value}
              </p>
              <p style={{ marginTop: 6, fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>{kpi.label}</p>
            </motion.div>
          </Item>
        ))}
      </RevealGroup>

      {/* ── 聊天主体卡 ─────────────────────────────────────── */}
      <Reveal>
        <section
          className="lg-glass overflow-hidden"
          style={{ borderRadius: 20 }}
        >
          {/* chip header bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '16px 24px',
              borderBottom: `0.5px solid ${C.line}`,
              background: 'rgba(255,255,255,0.06)',
            }}
          >
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
              style={{
                background: C.grad,
                boxShadow: '0 4px 12px rgba(168,197,224,0.25)',
              }}
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>
                mic
              </span>
            </span>
            <div>
              <p
                className="text-[18px] font-extrabold uppercase tracking-widest"
                style={{
                  fontFamily: F.mono,
                  background: C.grad,
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  color: 'transparent',
                  margin: 0,
                }}
                data-testid="voice-chat-chip-title"
              >
                {VOICE_CHAT_CHIP_TITLE}
              </p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.84)', margin: 0, fontFamily: F.cn }} data-testid="voice-chat-chip-subtitle">
                {VOICE_CHAT_CHIP_SUBTITLE}
              </p>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
              {isStreaming ? (
                <>
                  <span className="animate-pulse" style={{ height: 6, width: 6, borderRadius: '50%', background: C.ikb, display: 'inline-block' }} />
                  <span
                    style={{ fontSize: 12, fontWeight: 600, color: C.ikb, textShadow: C.textShadow }}
                    data-testid="status-streaming"
                  >
                    回复中…
                  </span>
                </>
              ) : (
                <>
                  <span className="animate-pulse" style={{ height: 6, width: 6, borderRadius: '50%', background: C.ikb, display: 'inline-block' }} />
                  <span
                    style={{ fontSize: 12, fontWeight: 600, color: C.ikb, textShadow: C.textShadow }}
                    data-testid="status-online"
                  >
                    在线
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
                <span
                  style={{
                    display: 'flex',
                    height: 64,
                    width: 64,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 18,
                    background: 'rgba(168,197,224,0.22)',
                    color: C.ink,
                    filter: 'drop-shadow(0 2px 6px rgba(6,14,38,.8))',
                  }}
                >
                  <span className="material-symbols-outlined text-[36px]" aria-hidden={true}>
                    chat_bubble_outline
                  </span>
                </span>
                <p style={{ fontSize: 16, fontWeight: 600, color: C.ink, textShadow: C.textShadow }}>开始你的对话</p>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>在下方输入问题，AI 助手将实时回复</p>
              </div>
            ) : (
              messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* input row */}
          <div
            style={{
              padding: '16px 24px',
              borderTop: `0.5px solid ${C.line}`,
              background: 'rgba(255,255,255,0.04)',
            }}
          >
            <VoiceChatInput
              value={input}
              onChange={setInput}
              onMicClick={() => toast.info(VOICE_CHAT_TOAST_VOICE)}
              onSend={handleSend}
              disabled={isStreaming}
            />
          </div>
        </section>
      </Reveal>
    </LiquidShell>
  );
}
