import { Sparkles } from 'lucide-react';
import {
  GENERATE_TOPIC_TITLE,
  GENERATE_TOPIC_MAXLEN,
  GENERATE_CTA,
} from '@/lib/constants/generatePage';

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export function GenerateTopicForm({ value, onChange }: Props) {
  return (
    <section className="rounded-2xl border border-primary/20 bg-card p-6">
      <h2 className="text-base font-bold text-on-surface">{GENERATE_TOPIC_TITLE}</h2>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={GENERATE_TOPIC_MAXLEN}
        rows={4}
        className="w-full min-h-[100px] rounded-lg border border-border bg-input px-4 py-3 font-cn text-sm mt-4 placeholder:text-muted-foreground/60 resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
      />
      <p className="text-xs text-muted-foreground/60 mt-1 text-right">
        {value.length}/{GENERATE_TOPIC_MAXLEN}
      </p>
      <div className="flex justify-center mt-4">
        <button
          type="button"
          className="bg-primary text-on-primary hover:bg-primary/90 rounded-full px-10 py-3 font-cn font-bold flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          {GENERATE_CTA}
        </button>
      </div>
    </section>
  );
}
