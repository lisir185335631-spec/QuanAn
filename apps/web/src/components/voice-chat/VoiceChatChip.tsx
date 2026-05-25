import { Mic } from 'lucide-react';

import { VOICE_CHAT_CHIP_SUBTITLE, VOICE_CHAT_CHIP_TITLE } from '@/lib/constants/voice-chat';

export function VoiceChatChip() {
  return (
    <div
      className="flex items-center gap-4 rounded-xl border border-primary/40 bg-card p-4"
      data-testid="voice-chat-chip"
    >
      {/* Mic icon container */}
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-primary/60 bg-primary/10">
        <Mic className="h-6 w-6 text-primary" />
      </div>

      {/* Text */}
      <div>
        <p
          className="text-2xl font-bold uppercase tracking-wide text-primary"
          data-testid="voice-chat-chip-title"
        >
          {VOICE_CHAT_CHIP_TITLE}
        </p>
        <p className="text-sm text-muted-foreground" data-testid="voice-chat-chip-subtitle">
          {VOICE_CHAT_CHIP_SUBTITLE}
        </p>
      </div>
    </div>
  );
}
