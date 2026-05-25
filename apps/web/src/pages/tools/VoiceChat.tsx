/**
 * VoiceChat.tsx — 1:1 复刻 aiipznt.vip/voice-chat
 * mock-first · 0 backend · default state = 2 mock messages
 * SPEC §6.1 · LLM 接入留 PRR
 */
import { Trash2, Volume2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { MessageBubble } from '@/components/voice-chat/MessageBubble';
import { VoiceChatChip } from '@/components/voice-chat/VoiceChatChip';
import { VoiceChatInput } from '@/components/voice-chat/VoiceChatInput';
import {
  VOICE_CHAT_MOCK_MESSAGES,
  VOICE_CHAT_TOAST_AUDIO,
  VOICE_CHAT_TOAST_CLEAR,
  VOICE_CHAT_TOAST_SEND,
  VOICE_CHAT_TOAST_VOICE,
} from '@/lib/constants/voice-chat';

export default function VoiceChat() {
  const [input, setInput] = useState('');

  return (
    <main className="container mx-auto max-w-4xl space-y-6 py-8">
      {/* top row: chip left + 2 btn right */}
      <div className="flex items-start justify-between gap-4">
        <VoiceChatChip />

        <div className="flex shrink-0 items-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => toast.info(VOICE_CHAT_TOAST_AUDIO)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-primary hover:bg-card"
            data-testid="voice-chat-audio-btn"
            aria-label="音频"
          >
            <Volume2 className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => toast.info(VOICE_CHAT_TOAST_CLEAR)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-primary hover:bg-card"
            data-testid="voice-chat-clear-btn"
            aria-label="清空"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* messages area */}
      <div className="min-h-[400px] space-y-6">
        {VOICE_CHAT_MOCK_MESSAGES.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
      </div>

      {/* input row */}
      <VoiceChatInput
        value={input}
        onChange={setInput}
        onMicClick={() => toast.info(VOICE_CHAT_TOAST_VOICE)}
        onSend={() => {
          if (input.trim()) {
            toast.info(VOICE_CHAT_TOAST_SEND);
          }
        }}
      />
    </main>
  );
}
