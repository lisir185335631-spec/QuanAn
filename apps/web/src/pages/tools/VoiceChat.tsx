/**
 * VoiceChat.tsx — PRD-25 US-002
 * /voice-chat · VOICE CHAT · 你的专属 IP 变现顾问
 * AC-1: useSubscription hook → trpc.voiceChat.start.useSubscription(D-244)
 * AC-2: chunk 类型处理 meta/delta/tool_call/tool_result/done
 * AC-3: 实时渲染 + typing indicator + tokensUsed/durationMs footer
 * AC-4: 历史记录 localStorage acc_{accountId}_voice_chat_history
 * AC-5: onError toast + retry button
 * AC-6: cancel button → partial=true hint
 * AC-7: 6 quick prompts click → setInput (D-239 继承)
 */
import { Copy, Mic, Send, Trash2, Volume2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useActiveAccount } from '@/hooks/useActiveAccount';
import { VOICE_CHAT_INTRO, VOICE_CHAT_QUICK_PROMPTS_6 } from '@/lib/constants/voice-chat';
import { getLsKey } from '@/lib/ls-namespace';
import { trpc } from '@/lib/trpc';

// ── Types ─────────────────────────────────────────────────────────────────────

interface HistoryEntry {
  id: string;
  question: string;
  answer: string;
  timestamp: number;
  partial?: boolean;
}

// ── TypingIndicator ───────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2" data-testid="typing-indicator">
      <div className="rounded-2xl rounded-tl-sm bg-card/60 backdrop-blur-md border border-border/40 px-4 py-3">
        <div className="flex gap-1.5 items-center h-4">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="inline-block size-2 rounded-full bg-muted-foreground/60 animate-bounce"
              style={{ animationDelay: `${i * 150}ms`, animationDuration: '1s' }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── HistoryItem ───────────────────────────────────────────────────────────────

function HistoryItem({ entry }: { entry: HistoryEntry }) {
  const date = new Date(entry.timestamp);
  const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  return (
    <div className="space-y-2" data-testid="history-item">
      <div className="flex justify-end">
        <div className="max-w-[75%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5">
          <p className="text-body-sm text-primary-foreground">{entry.question}</p>
        </div>
      </div>
      <div className="flex items-end gap-2">
        <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-card/60 backdrop-blur-md border border-border/40 px-4 py-2.5">
          <p className="text-body-sm text-on-surface">{entry.answer}</p>
          {entry.partial && (
            <p className="text-xs text-muted-foreground mt-1" data-testid="partial-hint">
              已取消 · 部分生成
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0 pb-1">
          <span className="text-xs text-muted-foreground">{timeStr}</span>
          <button
            aria-label="复制回答"
            onClick={() => {
              void navigator.clipboard.writeText(entry.answer).catch(() => {});
              toast.info('已复制');
            }}
            className="rounded p-1 text-muted-foreground/60 hover:text-primary hover:bg-primary/10 transition-colors"
          >
            <Copy className="size-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── VoiceChat ─────────────────────────────────────────────────────────────────

export default function VoiceChat() {
  const { account } = useActiveAccount();
  const accountId = account?.id ?? null;

  const [input, setInput] = useState('');
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // ── Streaming state ────────────────────────────────────────────────────────
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [modelHint, setModelHint] = useState<string | null>(null);
  const [toolHints, setToolHints] = useState<string[]>([]);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [streamDone, setStreamDone] = useState<{
    tokensUsed: { prompt: number; completion: number; total: number };
    durationMs: number;
  } | null>(null);

  // ── Subscription input state ───────────────────────────────────────────────
  const [subscriptionState, setSubscriptionState] = useState<{
    userMessage: string;
    sessionId: string;
    enabled: boolean;
  }>({ userMessage: '', sessionId: '', enabled: false });

  // Refs for stable closure access
  const currentAnswerRef = useRef('');
  const currentQuestionRef = useRef('');
  const startTimeRef = useRef<number>(0);

  // AC-4: load history from localStorage on mount / accountId change
  useEffect(() => {
    if (accountId === null) {
      setHistory([]);
      return;
    }
    const key = getLsKey(accountId, 'voice_chat_history');
    try {
      const stored = localStorage.getItem(key);
      setHistory(stored ? (JSON.parse(stored) as HistoryEntry[]) : []);
    } catch {
      setHistory([]);
    }
  }, [accountId]);

  function saveHistory(next: HistoryEntry[]) {
    if (accountId === null) return;
    const key = getLsKey(accountId, 'voice_chat_history');
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // quota exceeded — ignore
    }
  }

  // ── tRPC subscription ──────────────────────────────────────────────────────
  // AC-1: useSubscription hook
  trpc.voiceChat.start.useSubscription(
    { userMessage: subscriptionState.userMessage, sessionId: subscriptionState.sessionId },
    {
      enabled: subscriptionState.enabled,
      onData(chunk) {
        if (chunk.type === 'meta') {
          // AC-2: meta → show model hint
          setModelHint(chunk.meta.model);
        } else if (chunk.type === 'delta') {
          // AC-2: delta → accumulate
          currentAnswerRef.current += chunk.delta;
          setCurrentAnswer(currentAnswerRef.current);
        } else if (chunk.type === 'tool_call') {
          // AC-2: tool_call → show hint
          setToolHints((prev) => [...prev, `调用工具: ${chunk.toolName}...`]);
        } else if (chunk.type === 'tool_result') {
          // AC-2: tool_result → continue generate (no UI change)
        } else if (chunk.type === 'done') {
          // AC-2: done → finalize
          const finalAnswer = currentAnswerRef.current;
          const dMs = Date.now() - startTimeRef.current;
          setStreamDone({ tokensUsed: chunk.tokensUsed, durationMs: dMs });
          setIsStreaming(false);
          setSubscriptionState((prev) => ({ ...prev, enabled: false }));

          // AC-4: append to history + localStorage
          const entry: HistoryEntry = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            question: currentQuestionRef.current,
            answer: finalAnswer,
            timestamp: Date.now(),
          };
          setHistory((h) => {
            const next = [...h, entry];
            saveHistory(next);
            return next;
          });
          setCurrentAnswer('');
          currentAnswerRef.current = '';
        } else if (chunk.type === 'error') {
          // AC-5: error → toast + retry
          toast.error('AI 暂未响应 · 请稍后再试');
          setStreamError(chunk.error);
          setIsStreaming(false);
          setSubscriptionState((prev) => ({ ...prev, enabled: false }));
        }
      },
      onError() {
        // AC-5: network error → toast + retry
        toast.error('AI 暂未响应 · 请稍后再试');
        setStreamError('AI 暂未响应 · 请稍后再试');
        setIsStreaming(false);
        setSubscriptionState((prev) => ({ ...prev, enabled: false }));
      },
    },
  );

  // ── AC-7: quick prompt click → fill input (不直接发送) ──────────────────────
  function handleQuickPrompt(prompt: string) {
    setInput(prompt);
  }

  // ── AC-1: handleSend ───────────────────────────────────────────────────────
  function handleSend() {
    const q = input.trim();
    if (!q || isStreaming) return;

    // reset streaming state
    currentAnswerRef.current = '';
    currentQuestionRef.current = q;
    startTimeRef.current = Date.now();
    setCurrentAnswer('');
    setModelHint(null);
    setToolHints([]);
    setStreamError(null);
    setStreamDone(null);
    setIsStreaming(true);
    setInput('');

    // trigger subscription
    setSubscriptionState({
      userMessage: q,
      sessionId: crypto.randomUUID(),
      enabled: true,
    });
  }

  // ── AC-6: retry ────────────────────────────────────────────────────────────
  function handleRetry() {
    const q = currentQuestionRef.current;
    if (!q) return;

    currentAnswerRef.current = '';
    startTimeRef.current = Date.now();
    setCurrentAnswer('');
    setModelHint(null);
    setToolHints([]);
    setStreamError(null);
    setStreamDone(null);
    setIsStreaming(true);

    setSubscriptionState({
      userMessage: q,
      sessionId: crypto.randomUUID(),
      enabled: true,
    });
  }

  // ── AC-6: cancel ───────────────────────────────────────────────────────────
  function handleCancel() {
    const partialAnswer = currentAnswerRef.current;

    setSubscriptionState((prev) => ({ ...prev, enabled: false }));
    setIsStreaming(false);
    setCurrentAnswer('');
    currentAnswerRef.current = '';

    // AC-6: save partial to history with partial=true
    if (partialAnswer && currentQuestionRef.current) {
      const entry: HistoryEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        question: currentQuestionRef.current,
        answer: partialAnswer,
        partial: true,
        timestamp: Date.now(),
      };
      setHistory((h) => {
        const next = [...h, entry];
        saveHistory(next);
        return next;
      });
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleClearHistory() {
    setHistory([]);
    if (accountId !== null) {
      const key = getLsKey(accountId, 'voice_chat_history');
      localStorage.removeItem(key);
    }
    toast.info('历史已清空');
  }

  return (
    <main className="flex-1 container py-8 space-y-8 max-w-3xl">
      {/* AC-1: H1 + 副标 */}
      <div>
        <span className="text-label-sm font-label text-primary uppercase tracking-wide">
          智能工具
        </span>
        <h1 className="mt-1 text-h1 font-display uppercase tracking-widest text-on-surface">
          VOICE CHAT
        </h1>
        <p className="mt-2 text-body-md text-muted-foreground">
          语音对话 · 你的专属 IP 变现顾问
        </p>
      </div>

      {/* H3 模块标题 + 自我介绍 glass-card */}
      <div className="bg-card/40 backdrop-blur-md border border-border/40 rounded-xl p-6 space-y-3">
        <h3 className="text-h3 font-display text-on-surface">你的专属 IP 变现顾问</h3>
        <p className="text-body-md text-muted-foreground leading-relaxed">{VOICE_CHAT_INTRO}</p>
      </div>

      {/* AC-7: 6 quick prompts grid 2×3 */}
      <div className="space-y-3">
        <p className="text-label-sm font-label text-on-surface-variant uppercase tracking-wide">
          快速提问
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {VOICE_CHAT_QUICK_PROMPTS_6.map((prompt, i) => (
            <button
              key={i}
              data-testid={`quick-prompt-${i}`}
              onClick={() => handleQuickPrompt(prompt)}
              className="text-left rounded-lg border border-border/50 bg-surface-variant/30 px-4 py-3 text-body-sm text-on-surface hover:bg-surface-variant/60 hover:border-primary/40 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* AC-3: streaming area — current question + live answer */}
      {(isStreaming || currentAnswer) && (
        <div className="space-y-4" data-testid="streaming-area">
          {/* current question bubble */}
          {currentQuestionRef.current && (
            <div className="flex justify-end">
              <div className="max-w-[75%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5">
                <p className="text-body-sm text-primary-foreground">
                  {currentQuestionRef.current}
                </p>
              </div>
            </div>
          )}

          {/* AC-2: model hint */}
          {modelHint && (
            <p className="text-xs text-muted-foreground" data-testid="model-hint">
              由 {modelHint} 生成
            </p>
          )}

          {/* AC-2: tool_call hints */}
          {toolHints.map((hint, i) => (
            <p key={i} className="text-xs text-muted-foreground italic" data-testid={`tool-hint-${i}`}>
              {hint}
            </p>
          ))}

          {/* AC-3: typing indicator or live answer */}
          {isStreaming && !currentAnswer ? (
            <TypingIndicator />
          ) : currentAnswer ? (
            <div className="flex items-end gap-2">
              <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-card/60 backdrop-blur-md border border-border/40 px-4 py-2.5">
                <p className="text-body-sm text-on-surface" data-testid="current-answer">
                  {currentAnswer}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* AC-5: error state */}
      {streamError && !isStreaming && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex items-center justify-between gap-4" data-testid="stream-error">
          <p className="text-body-sm text-on-surface">AI 暂未响应 · 请稍后再试</p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetry}
            data-testid="retry-button"
          >
            重试
          </Button>
        </div>
      )}

      {/* AC-4: 历史对话 list */}
      {history.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-label-sm font-label text-on-surface-variant uppercase tracking-wide">
              历史对话
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearHistory}
              data-testid="clear-history"
              className="text-muted-foreground hover:text-destructive gap-1.5"
            >
              <Trash2 className="size-3.5" />
              清空历史
            </Button>
          </div>
          <div
            className="space-y-4 rounded-xl border border-border/30 bg-surface-container/20 p-4"
            data-testid="history-list"
          >
            {history.map((entry) => (
              <HistoryItem key={entry.id} entry={entry} />
            ))}
          </div>
        </div>
      )}

      {/* AC-3: done footer — tokensUsed + durationMs */}
      {streamDone && !isStreaming && (
        <p className="text-xs text-muted-foreground" data-testid="stream-footer">
          {streamDone.tokensUsed.total} tokens · {streamDone.durationMs}ms
        </p>
      )}

      {/* input bar */}
      <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-card/40 backdrop-blur-md px-4 py-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="有什么问题尽管问我..."
          data-testid="chat-input"
          className="flex-1 bg-transparent text-body-md text-on-surface placeholder:text-muted-foreground outline-none"
        />

        {/* AC-6: cancel button replaces mic/speaker during streaming */}
        {isStreaming ? (
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            data-testid="cancel-button"
            className="gap-1.5"
          >
            <X className="size-4" />
            取消
          </Button>
        ) : (
          <>
            <button
              data-testid="mic-button"
              aria-label="语音输入"
              onClick={() => toast.info('语音输入 PRD-25+')}
              className="rounded-full p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            >
              <Mic className="size-5" />
            </button>
            <button
              data-testid="speaker-button"
              aria-label="语音播报"
              onClick={() => toast.info('语音播报 PRD-25+')}
              className="rounded-full p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            >
              <Volume2 className="size-5" />
            </button>
            <Button
              size="sm"
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              data-testid="send-button"
              aria-label="发送"
              className="gap-1.5"
            >
              <Send className="size-4" />
              发送
            </Button>
          </>
        )}
      </div>
    </main>
  );
}
