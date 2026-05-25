import { Mic, Send } from 'lucide-react';

import { VOICE_CHAT_INPUT_PLACEHOLDER } from '@/lib/constants/voice-chat';

interface VoiceChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onMicClick: () => void;
  onSend: () => void;
}

export function VoiceChatInput({ value, onChange, onMicClick, onSend }: VoiceChatInputProps) {
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }

  return (
    <div
      className="flex items-center gap-3 rounded-xl border border-border bg-card/40 px-4 py-3"
      data-testid="voice-chat-input-row"
    >
      {/* left mic button */}
      <button
        type="button"
        onClick={onMicClick}
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90"
        data-testid="voice-chat-mic-btn"
        aria-label="语音输入"
      >
        <Mic className="h-5 w-5 text-black" />
      </button>

      {/* text input */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={VOICE_CHAT_INPUT_PLACEHOLDER}
        data-testid="voice-chat-input"
        className="flex-1 bg-transparent text-sm text-on-surface outline-none placeholder:text-muted-foreground"
      />

      {/* right send button */}
      <button
        type="button"
        onClick={onSend}
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90"
        data-testid="voice-chat-send-btn"
        aria-label="发送"
      >
        <Send className="h-5 w-5 text-black" />
      </button>
    </div>
  );
}
