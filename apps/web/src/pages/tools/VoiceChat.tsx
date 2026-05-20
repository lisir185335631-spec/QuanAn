/**
 * VoiceChat.tsx — PRD-24 US-003 (完整重写)
 * /voice-chat · VOICE CHAT · 你的专属 IP 变现顾问
 * AC-1: H1 'VOICE CHAT'(Orbitron) + 副标 + H3 模块标题
 * AC-2: VOICE_CHAT_QUICK_PROMPTS_6 字面锁 (D-239)
 * AC-3: VOICE_CHAT_INTRO 自我介绍 glass-card
 * AC-4: 6 quick prompts grid(2×3) + input + 发送 + mic stub + speaker stub
 * AC-5: 历史 list from localStorage acc_{accountId}_voice_chat_history
 * AC-6: quick prompt click → setInput(不直接发送) · 发送 → add history + localStorage save
 * PRD-25+: 接 LLM 时替换 stub AI 回复
 */
import { Copy, Mic, Send, Trash2, Volume2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useActiveAccount } from '@/hooks/useActiveAccount';
import { VOICE_CHAT_INTRO, VOICE_CHAT_QUICK_PROMPTS_6 } from '@/lib/constants/voice-chat';
import { getLsKey } from '@/lib/ls-namespace';

// ── Types ─────────────────────────────────────────────────────────────────────

interface HistoryEntry {
  id: string;
  question: string;
  answer: string;
  timestamp: number;
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

  // AC-5: load history from localStorage on mount / accountId change
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

  // AC-6: quick prompt click → fill input only (不直接发送, per anti_patterns)
  function handleQuickPrompt(prompt: string) {
    setInput(prompt);
  }

  // AC-6: send → add history + localStorage save
  function handleSend() {
    const q = input.trim();
    if (!q) return;
    const entry: HistoryEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      question: q,
      // PRD-25+: replace with real LLM response
      answer: '功能 PRD-25+ 接 LLM',
      timestamp: Date.now(),
    };
    const next = [...history, entry];
    setHistory(next);
    saveHistory(next);
    setInput('');
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // AC-5: clear history stub
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

      {/* AC-1: H3 模块标题 + 自我介绍 glass-card */}
      <div className="bg-card/40 backdrop-blur-md border border-border/40 rounded-xl p-6 space-y-3">
        <h3 className="text-h3 font-display text-on-surface">你的专属 IP 变现顾问</h3>
        <p className="text-body-md text-muted-foreground leading-relaxed">{VOICE_CHAT_INTRO}</p>
      </div>

      {/* AC-4: 6 quick prompts grid 2×3 */}
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

      {/* AC-5: 历史对话 list */}
      {history.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-label-sm font-label text-on-surface-variant uppercase tracking-wide">
              历史对话
            </p>
            {/* AC-5: 清空历史 button */}
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

      {/* AC-4: input + 发送 + mic stub + speaker stub */}
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
        {/* AC-4: mic button stub */}
        <button
          data-testid="mic-button"
          aria-label="语音输入"
          onClick={() => toast.info('语音输入 PRD-25+')}
          className="rounded-full p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
        >
          <Mic className="size-5" />
        </button>
        {/* AC-4: speaker button stub */}
        <button
          data-testid="speaker-button"
          aria-label="语音播报"
          onClick={() => toast.info('语音播报 PRD-25+')}
          className="rounded-full p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
        >
          <Volume2 className="size-5" />
        </button>
        {/* AC-4: 发送 button */}
        <Button
          size="sm"
          onClick={handleSend}
          disabled={!input.trim()}
          data-testid="send-button"
          aria-label="发送"
          className="gap-1.5"
        >
          <Send className="size-4" />
          发送
        </Button>
      </div>
    </main>
  );
}
