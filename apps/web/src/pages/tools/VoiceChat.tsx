/**
 * /voice-chat 页面 — PRD-8 US-012
 * AC-1: 录音按钮 + turn list + audio player + status bar
 * AC-2: MediaRecorder webm/opus · max 30s · 按住录 + 松开发
 * AC-3: STT → user bubble → voiceChat.start subscription → assistant streaming
 * AC-4: done event → tts.synthesize → audio play(autoplay)
 * AC-5: tool call cards (name + args + result) · 折叠展开
 * AC-6: 30s silence detection → 主动问'还想聊什么吗?'
 * AC-7: 挂掉按钮 → clearBuffer + 显示总结
 * AC-9: 无 console error · 无未 release media stream
 */

import { ChevronDown, ChevronUp, Mic, MicOff, PhoneOff, Wrench } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { trpc, trpcClient } from '@/lib/trpc';
import { cn } from '@/lib/utils';

import type { VoiceChatStreamChunk } from '@quanqn/clients/router-types';
import type { Unsubscribable } from '@trpc/server/observable';

// ── Types ─────────────────────────────────────────────────────────────────────

type ToolCallEntry = {
  id: string;
  name: string;
  args: Record<string, unknown>;
  result: string | null;
  expanded: boolean;
};

type Turn = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  toolCalls: ToolCallEntry[];
  audioUrl?: string;
};

type PageStatus = 'idle' | 'recording' | 'transcribing' | 'streaming' | 'synthesizing' | 'ended';

const STATUS_LABEL: Record<PageStatus, string> = {
  idle: '就绪 · 按住录音',
  recording: '录音中 · 松开发送',
  transcribing: '识别语音…',
  streaming: 'AI 思考中…',
  synthesizing: '生成语音…',
  ended: '对话已结束',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1] ?? '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return '不到 1 分钟';
  return `${minutes} 分钟`;
}

function formatToolName(name: string): string {
  return name.replace(/_/g, ' ');
}

// ── ToolCallCard ──────────────────────────────────────────────────────────────

function ToolCallCard({ entry, onToggle }: { entry: ToolCallEntry; onToggle: () => void }) {
  return (
    <div className="mt-2 rounded-md border border-border/50 bg-surface-variant/30 text-label-sm">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-surface-variant/50 rounded-md"
      >
        <Wrench className="size-3 text-primary shrink-0" />
        <span className="flex-1 font-label text-on-surface-variant truncate">{formatToolName(entry.name)}</span>
        {entry.result === null && (
          <span className="size-2 rounded-full bg-primary/60 animate-pulse shrink-0" />
        )}
        {entry.expanded ? <ChevronUp className="size-3 shrink-0" /> : <ChevronDown className="size-3 shrink-0" />}
      </button>
      {entry.expanded && (
        <div className="border-t border-border/30 px-3 py-2 space-y-1">
          <p className="text-on-surface-variant/60 text-xs">参数</p>
          <pre className="whitespace-pre-wrap break-all text-on-surface-variant text-xs">
            {JSON.stringify(entry.args, null, 2)}
          </pre>
          {entry.result !== null && (
            <>
              <p className="text-on-surface-variant/60 mt-2 text-xs">结果</p>
              <p className="text-on-surface whitespace-pre-wrap break-all text-xs">{entry.result}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── UserBubble / AssistantBubble ──────────────────────────────────────────────

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[75%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5">
        <p className="text-body-sm text-primary-foreground">{text}</p>
      </div>
    </div>
  );
}

function AssistantBubble({
  turn,
  onToggleTool,
}: {
  turn: Turn;
  onToggleTool: (turnId: string, toolId: string) => void;
}) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[80%]">
        <div className="rounded-2xl rounded-tl-sm bg-surface-container px-4 py-2.5">
          {turn.text ? (
            <p className="text-body-sm text-on-surface whitespace-pre-wrap">{turn.text}</p>
          ) : (
            <span className="inline-block h-4 w-1.5 animate-pulse bg-primary" aria-label="AI 正在输入" />
          )}
          {turn.toolCalls.map((tc) => (
            <ToolCallCard
              key={tc.id}
              entry={tc}
              onToggle={() => onToggleTool(turn.id, tc.id)}
            />
          ))}
        </div>
        {turn.audioUrl && (
          <audio
            src={turn.audioUrl}
            controls
            autoPlay
            className="mt-1 h-8 w-full"
            aria-label="AI 语音回复"
          />
        )}
      </div>
    </div>
  );
}

// ── SummaryPanel ──────────────────────────────────────────────────────────────

function SummaryPanel({
  turns,
  durationMs,
  onRestart,
}: {
  turns: Turn[];
  durationMs: number;
  onRestart: () => void;
}) {
  const roundCount = turns.filter((t) => t.role === 'user').length;
  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <PhoneOff className="size-12 text-muted-foreground" />
      <p className="text-h3 font-display text-on-surface">对话已结束</p>
      <p className="text-body-md text-muted-foreground">
        本次对话 {roundCount} 轮 · 用时 {formatDuration(durationMs)}
      </p>
      <Button variant="outline" onClick={onRestart}>
        开始新对话
      </Button>
    </div>
  );
}

// ── VoiceChat ─────────────────────────────────────────────────────────────────

export default function VoiceChat() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [status, setStatus] = useState<PageStatus>('idle');
  const [endedAt, setEndedAt] = useState<number | null>(null);

  const sessionId = useRef(crypto.randomUUID());
  const startTimeRef = useRef(Date.now());
  const subRef = useRef<Unsubscribable | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const maxRecordTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentAssistantTurnId = useRef<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // status ref for use inside callbacks without stale closure
  const statusRef = useRef<PageStatus>('idle');
  statusRef.current = status;

  const transcribeMutation = trpc.stt.transcribe.useMutation();
  const synthesizeMutation = trpc.tts.synthesize.useMutation();
  const clearSessionMutation = trpc.voiceChat.clearSession.useMutation();

  // Auto-scroll on new content
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [turns]);

  // Cleanup on unmount (AC-9)
  useEffect(() => {
    return () => {
      subRef.current?.unsubscribe();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (maxRecordTimerRef.current) clearTimeout(maxRecordTimerRef.current);
      stopRecorder();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────────

  function stopRecorder() {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      try {
        recorder.stream.getTracks().forEach((t) => t.stop()); // AC-9: no stream leak
        recorder.stop();
      } catch {
        // ignore
      }
    }
    mediaRecorderRef.current = null;
  }

  function clearSilenceTimer() {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }

  function scheduleSilencePrompt() {
    clearSilenceTimer();
    silenceTimerRef.current = setTimeout(() => {
      if (statusRef.current === 'idle') {
        void startVoiceChatWith('还想聊什么吗?', true);
      }
    }, 30_000); // AC-6: 30s silence detection
  }

  // ── Chunk handler ─────────────────────────────────────────────────────────────

  function handleChunk(chunk: VoiceChatStreamChunk) {
    const assistantId = currentAssistantTurnId.current;
    if (!assistantId) return;

    if (chunk.type === 'delta') {
      setTurns((prev) =>
        prev.map((t) => (t.id === assistantId ? { ...t, text: t.text + chunk.delta } : t)),
      );
    } else if (chunk.type === 'tool_call') {
      const tcId = `${chunk.toolName}-${Date.now()}`;
      setTurns((prev) =>
        prev.map((t) =>
          t.id === assistantId
            ? {
                ...t,
                toolCalls: [
                  ...t.toolCalls,
                  { id: tcId, name: chunk.toolName, args: chunk.args, result: null, expanded: false },
                ],
              }
            : t,
        ),
      );
    } else if (chunk.type === 'tool_result') {
      setTurns((prev) =>
        prev.map((t) =>
          t.id === assistantId
            ? {
                ...t,
                toolCalls: t.toolCalls.map((tc) =>
                  tc.name === chunk.toolName && tc.result === null
                    ? { ...tc, result: chunk.result }
                    : tc,
                ),
              }
            : t,
        ),
      );
    } else if (chunk.type === 'done') {
      setStatus('synthesizing');
      setTurns((prev) => {
        const assistantTurn = prev.find((t) => t.id === assistantId);
        const finalText = assistantTurn?.text ?? '';
        if (finalText) {
          void synthesizeMutation
            .mutateAsync({ text: finalText })
            .then((result) => {
              setTurns((p) =>
                p.map((t) => (t.id === assistantId ? { ...t, audioUrl: result.publicUrl } : t)),
              );
            })
            .catch((err: unknown) => {
              console.error('TTS synthesis error:', err);
            })
            .finally(() => {
              setStatus('idle');
              scheduleSilencePrompt();
            });
        } else {
          setStatus('idle');
          scheduleSilencePrompt();
        }
        return prev;
      });
    } else if (chunk.type === 'error') {
      console.error('Voice chat error:', chunk.error);
      setStatus('idle');
    }
  }

  // ── Start chat with text ──────────────────────────────────────────────────────

  async function startVoiceChatWith(userMessage: string, isSilencePrompt = false) {
    clearSilenceTimer();

    if (!isSilencePrompt) {
      const userTurnId = `user-${Date.now()}`;
      setTurns((prev) => [
        ...prev,
        { id: userTurnId, role: 'user', text: userMessage, toolCalls: [] },
      ]);
    }

    const assistantTurnId = `assistant-${Date.now()}`;
    currentAssistantTurnId.current = assistantTurnId;
    setTurns((prev) => [
      ...prev,
      { id: assistantTurnId, role: 'assistant', text: '', toolCalls: [] },
    ]);

    setStatus('streaming');

    subRef.current?.unsubscribe();
    subRef.current = trpcClient.voiceChat.start.subscribe(
      { userMessage, sessionId: sessionId.current },
      {
        onData: handleChunk,
        onError: (err) => {
          console.error('Subscription error:', err);
          setStatus('idle');
        },
        onComplete: () => {
          // done chunk handles transitions; no-op here
        },
      },
    );
  }

  // ── Recording ─────────────────────────────────────────────────────────────────

  async function handleRecordStart() {
    if (statusRef.current !== 'idle') return;
    clearSilenceTimer();

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      console.error('Mic access denied:', err);
      return;
    }

    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : '';

    const recorder = mimeType
      ? new MediaRecorder(stream, { mimeType })
      : new MediaRecorder(stream);

    audioChunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunksRef.current.push(e.data);
    };

    recorder.start(100);
    mediaRecorderRef.current = recorder;
    setStatus('recording');

    // max 30s (AC-2)
    maxRecordTimerRef.current = setTimeout(() => {
      void handleRecordStop();
    }, 30_000);
  }

  async function handleRecordStop() {
    if (maxRecordTimerRef.current) {
      clearTimeout(maxRecordTimerRef.current);
      maxRecordTimerRef.current = null;
    }

    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') return;

    // Release mic stream immediately (AC-9)
    recorder.stream.getTracks().forEach((t) => t.stop());

    await new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
      recorder.stop();
    });

    mediaRecorderRef.current = null;

    if (audioChunksRef.current.length === 0) {
      setStatus('idle');
      return;
    }

    setStatus('transcribing');

    const mimeType = recorder.mimeType || 'audio/webm';
    const blob = new Blob(audioChunksRef.current, { type: mimeType });

    let base64: string;
    try {
      base64 = await blobToBase64(blob);
    } catch (err) {
      console.error('Audio conversion error:', err);
      setStatus('idle');
      return;
    }

    let transcript: string;
    try {
      const result = await transcribeMutation.mutateAsync({ audioBase64: base64, mimeType });
      transcript = result.transcript;
    } catch (err) {
      console.error('STT error:', err);
      setStatus('idle');
      return;
    }

    if (!transcript.trim()) {
      setStatus('idle');
      return;
    }

    await startVoiceChatWith(transcript);
  }

  // ── Hang up (AC-7) ────────────────────────────────────────────────────────────

  async function handleHangUp() {
    clearSilenceTimer();
    subRef.current?.unsubscribe();
    subRef.current = null;
    stopRecorder();

    try {
      await clearSessionMutation.mutateAsync();
    } catch {
      // ignore
    }

    setEndedAt(Date.now());
    setStatus('ended');
  }

  // ── Toggle tool card ──────────────────────────────────────────────────────────

  function handleToggleTool(turnId: string, toolId: string) {
    setTurns((prev) =>
      prev.map((t) =>
        t.id === turnId
          ? {
              ...t,
              toolCalls: t.toolCalls.map((tc) =>
                tc.id === toolId ? { ...tc, expanded: !tc.expanded } : tc,
              ),
            }
          : t,
      ),
    );
  }

  // ── Restart ───────────────────────────────────────────────────────────────────

  function handleRestart() {
    sessionId.current = crypto.randomUUID();
    startTimeRef.current = Date.now();
    setTurns([]);
    setEndedAt(null);
    setStatus('idle');
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  const isRecording = status === 'recording';
  const canRecord = status === 'idle';
  const isEnded = status === 'ended';
  const durationMs = (endedAt ?? Date.now()) - startTimeRef.current;

  return (
    <main className="flex flex-col h-[calc(100vh-4rem)] container py-4 max-w-2xl">
      {/* Status bar (AC-1) */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <h1 className="text-h2 font-display text-on-surface">语音对话</h1>
        <span
          aria-live="polite"
          aria-label={`状态: ${STATUS_LABEL[status]}`}
          className={cn(
            'px-3 py-1 rounded-full text-label-sm font-label transition-colors',
            isRecording
              ? 'bg-destructive/20 text-destructive animate-pulse'
              : status === 'streaming' || status === 'synthesizing' || status === 'transcribing'
                ? 'bg-primary/20 text-primary'
                : 'bg-surface-variant text-on-surface-variant',
          )}
        >
          {STATUS_LABEL[status]}
        </span>
      </div>

      {/* Turn list (AC-1) */}
      <ScrollArea className="flex-1 rounded-xl border border-border/30 bg-surface-container/30">
        <div ref={scrollAreaRef} className="px-4 py-3 space-y-3">
          {isEnded ? (
            <SummaryPanel turns={turns} durationMs={durationMs} onRestart={handleRestart} />
          ) : turns.length === 0 ? (
            <div
              data-testid="turn-list"
              className="flex flex-col items-center gap-2 py-12 text-center"
            >
              <Mic className="size-10 text-muted-foreground/40" />
              <p className="text-body-md text-muted-foreground">按住下方按钮开始语音对话</p>
              <p className="text-body-sm text-on-surface-variant/60">每轮 ≤ 30 秒 · 松开即发送</p>
            </div>
          ) : (
            <div data-testid="turn-list">
              {turns.map((turn) =>
                turn.role === 'user' ? (
                  <UserBubble key={turn.id} text={turn.text} />
                ) : (
                  <AssistantBubble key={turn.id} turn={turn} onToggleTool={handleToggleTool} />
                ),
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Controls */}
      {!isEnded && (
        <div className="flex items-center justify-center gap-6 mt-4 pb-2 shrink-0">
          {/* Record button — hold to record, release to send (AC-2) */}
          <button
            data-testid="record-button"
            aria-label={isRecording ? '松开发送' : '按住录音'}
            disabled={!canRecord && !isRecording}
            onMouseDown={() => { void handleRecordStart(); }}
            onMouseUp={() => { void handleRecordStop(); }}
            onMouseLeave={() => { if (isRecording) void handleRecordStop(); }}
            onTouchStart={(e) => { e.preventDefault(); void handleRecordStart(); }}
            onTouchEnd={() => { void handleRecordStop(); }}
            className={cn(
              'size-16 rounded-full flex items-center justify-center transition-all duration-150 select-none touch-none',
              isRecording
                ? 'bg-destructive scale-110 shadow-lg shadow-destructive/30'
                : canRecord
                  ? 'bg-primary hover:bg-primary/90 active:scale-95 shadow-md'
                  : 'bg-surface-variant opacity-50 cursor-not-allowed',
            )}
          >
            {isRecording ? (
              <MicOff className="size-7 text-destructive-foreground" />
            ) : (
              <Mic className="size-7 text-primary-foreground" />
            )}
          </button>

          {/* Hang up (AC-7) */}
          <Button
            variant="outline"
            size="icon"
            aria-label="挂掉"
            onClick={() => { void handleHangUp(); }}
            disabled={isRecording}
            className="size-10 rounded-full border-destructive/50 text-destructive hover:bg-destructive/10"
          >
            <PhoneOff className="size-4" />
          </Button>
        </div>
      )}
    </main>
  );
}
