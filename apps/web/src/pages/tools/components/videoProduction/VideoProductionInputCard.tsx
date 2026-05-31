// VideoProductionInputCard.tsx — textarea(预填默认文案) + 生成制作方案 button

import { Clapperboard } from 'lucide-react';
import { toast } from 'sonner';

import { VIDEO_PRODUCTION_CTA } from '@/lib/constants/video-production';

interface VideoProductionInputCardProps {
  copy: string;
  onCopyChange: (v: string) => void;
}

export function VideoProductionInputCard({ copy, onCopyChange }: VideoProductionInputCardProps) {
  function handleGenerate() {
    toast.success('已生成制作方案');
  }

  return (
    <div className="rounded-2xl border border-primary/20 bg-card p-6">
      <textarea
        value={copy}
        onChange={(e) => onCopyChange(e.target.value)}
        className="w-full min-h-[280px] resize-y border-0 bg-transparent font-cn text-base leading-relaxed text-on-surface focus:outline-none"
      />
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={handleGenerate}
          className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 font-cn font-bold text-on-primary hover:bg-primary/90 transition-colors"
        >
          <Clapperboard className="h-4 w-4" />
          {VIDEO_PRODUCTION_CTA}
        </button>
      </div>
    </div>
  );
}
