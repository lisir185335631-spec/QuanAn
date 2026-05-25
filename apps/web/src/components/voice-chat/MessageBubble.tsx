import { Copy, Volume2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  VOICE_CHAT_LABEL_COPY,
  VOICE_CHAT_LABEL_PLAY,
  VOICE_CHAT_TOAST_AUDIO,
  VOICE_CHAT_TOAST_COPIED,
  type MockMessage,
} from '@/lib/constants/voice-chat';

interface MessageBubbleProps {
  message: MockMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end" data-testid="message-bubble-user">
        <div className="max-w-2xl rounded-2xl rounded-tr-sm bg-primary/20 px-4 py-3">
          <p className="text-sm text-on-surface">{message.content}</p>
          <p className="mt-1 text-xs text-muted-foreground">{message.timestamp}</p>
        </div>
      </div>
    );
  }

  // assistant bubble
  return (
    <div className="flex flex-col gap-1" data-testid="message-bubble-assistant">
      <div className="max-w-3xl rounded-2xl rounded-tl-sm border border-border bg-card/60 px-4 py-3">
        <p className="whitespace-pre-wrap text-sm text-on-surface">{message.content}</p>
      </div>

      {/* bottom row: timestamp + play + copy */}
      <div className="flex items-center gap-3 pl-1">
        <span className="text-xs text-muted-foreground">{message.timestamp}</span>

        <button
          type="button"
          onClick={() => toast.info(VOICE_CHAT_TOAST_AUDIO)}
          className="flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-card hover:text-primary"
          data-testid="message-play-btn"
          aria-label={VOICE_CHAT_LABEL_PLAY}
        >
          <Volume2 className="h-3 w-3 text-primary" />
          {VOICE_CHAT_LABEL_PLAY}
        </button>

        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(message.content).catch(() => {});
            toast.info(VOICE_CHAT_TOAST_COPIED);
          }}
          className="flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-card hover:text-primary"
          data-testid="message-copy-btn"
          aria-label={VOICE_CHAT_LABEL_COPY}
        >
          <Copy className="h-3 w-3 text-primary" />
          {VOICE_CHAT_LABEL_COPY}
        </button>
      </div>
    </div>
  );
}
