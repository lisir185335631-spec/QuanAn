// VideoProductionTeleprompter.tsx — 口播提词器(绿色卡) + 复制按钮

import { Copy, Mic } from 'lucide-react';
import { toast } from 'sonner';

import {
  VIDEO_PRODUCTION_TELEPROMPTER,
  VIDEO_PRODUCTION_TELEPROMPTER_TITLE,
} from '@/lib/constants/video-production';

export function VideoProductionTeleprompter() {
  function handleCopy() {
    void navigator.clipboard
      .writeText(VIDEO_PRODUCTION_TELEPROMPTER)
      .then(() => toast.success('已复制提词器'));
  }

  return (
    <div className="rounded-2xl border border-green-500/30 bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-display text-xl font-bold text-green-500">
          <Mic className="h-5 w-5" />
          {VIDEO_PRODUCTION_TELEPROMPTER_TITLE}
        </h2>
        <button
          type="button"
          aria-label="复制提词器"
          onClick={handleCopy}
          className="text-muted-foreground hover:text-on-surface transition-colors"
        >
          <Copy className="h-4 w-4" />
        </button>
      </div>
      <div className="rounded-lg border border-border/40 bg-input/30 p-4">
        <p className="font-cn text-sm leading-loose text-on-surface/90 whitespace-pre-wrap">
          {VIDEO_PRODUCTION_TELEPROMPTER}
        </p>
      </div>
    </div>
  );
}
