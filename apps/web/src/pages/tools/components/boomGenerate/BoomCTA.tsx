import { Sparkles } from 'lucide-react';

import { BOOM_CTA } from '@/lib/constants/boomGenerate';

interface BoomCTAProps {
  onClick?: () => void;
}

export function BoomCTA({ onClick }: BoomCTAProps) {
  return (
    <div className="flex justify-center">
      <button
        type="button"
        onClick={onClick}
        className="block mx-auto bg-primary text-white hover:bg-primary/90 rounded-full px-10 py-3 font-cn font-bold flex items-center gap-2 transition"
      >
        <Sparkles className="w-4 h-4" />
        {BOOM_CTA}
      </button>
    </div>
  );
}
