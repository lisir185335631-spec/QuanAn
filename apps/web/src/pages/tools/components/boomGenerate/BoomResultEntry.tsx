import { Copy, ThumbsDown, ThumbsUp } from 'lucide-react';

import {
  BOOM_INDEX_PREFIX,
  BOOM_SECTION_OPENING,
  BOOM_SECTION_DEVELOPMENT,
  BOOM_SECTION_CLIMAX,
  BOOM_SECTION_ENDING,
  BOOM_SECTION_FULL,
  BOOM_REASON_PREFIX,
  BOOM_FEEDBACK_PROMPT,
  type BoomEntry,
} from '@/lib/constants/boomGenerate';

interface BoomResultEntryProps {
  entry: BoomEntry;
}

export function BoomResultEntry({ entry }: BoomResultEntryProps) {
  const fullText = [entry.opening, entry.development, entry.climax, entry.ending].join(' ');

  const sections = [
    { label: BOOM_SECTION_OPENING, body: entry.opening, color: 'border-orange-500', labelColor: 'text-orange-500' },
    { label: BOOM_SECTION_DEVELOPMENT, body: entry.development, color: 'border-orange-500', labelColor: 'text-orange-500' },
    { label: BOOM_SECTION_CLIMAX, body: entry.climax, color: 'border-orange-500', labelColor: 'text-orange-500' },
    { label: BOOM_SECTION_ENDING, body: entry.ending, color: 'border-green-500', labelColor: 'text-green-500' },
  ];

  return (
    <div className="rounded-2xl border border-primary/20 bg-card p-6">
      {/* top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className="w-7 h-7 rounded-full border border-primary/40 text-primary font-bold inline-flex items-center justify-center text-sm shrink-0">
            {entry.index}
          </span>
          <span className="font-cn text-base font-bold text-on-surface flex-1">{entry.title}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-display text-sm font-bold text-orange-500">
            {BOOM_INDEX_PREFIX}{entry.indexScore}
          </span>
          <button
            type="button"
            aria-label="复制"
            className="rounded-md p-1 hover:bg-muted/40 transition"
          >
            <Copy className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* 3 type chips */}
      <div className="flex gap-2 mt-3 flex-wrap">
        <span className="rounded-full border border-orange-500/60 bg-orange-500/10 px-3 py-1 font-cn text-xs text-orange-500">
          {entry.type}
        </span>
        <span className="rounded-full border border-green-500/60 bg-green-500/10 px-3 py-1 font-cn text-xs text-green-600">
          {entry.format}
        </span>
        <span className="rounded-full border border-primary/60 bg-primary/10 px-3 py-1 font-cn text-xs text-primary">
          {entry.element}
        </span>
      </div>

      {/* 4 sections */}
      <div className="space-y-4 mt-4">
        {sections.map((sec) => (
          <div key={sec.label} className={`border-l-2 ${sec.color} pl-3`}>
            <p className={`font-cn text-xs font-bold mb-1 ${sec.labelColor}`}>{sec.label}</p>
            <p className="font-cn text-sm text-muted-foreground leading-relaxed">{sec.body}</p>
          </div>
        ))}
      </div>

      {/* full text */}
      <div className="mt-6 rounded-xl border border-border bg-muted/20 p-4">
        <p className="font-cn text-xs font-bold text-primary mb-2">{BOOM_SECTION_FULL}</p>
        <p className="font-cn text-sm text-on-surface/85 leading-relaxed whitespace-pre-wrap">{fullText}</p>
        <div className="flex items-center gap-3 mt-4 pt-3 border-t border-border/30">
          <p className="font-cn text-xs text-muted-foreground">{BOOM_FEEDBACK_PROMPT}</p>
          <button type="button" aria-label="有帮助" className="rounded-md p-1 hover:bg-muted/40 transition">
            <ThumbsUp className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          <button type="button" aria-label="无帮助" className="rounded-md p-1 hover:bg-muted/40 transition">
            <ThumbsDown className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* reason */}
      <div className="mt-4 rounded-lg border-l-2 border-destructive bg-destructive/5 p-3">
        <span className="font-cn text-xs font-bold text-destructive">{BOOM_REASON_PREFIX}</span>
        <span className="font-cn text-xs text-muted-foreground">{entry.reason}</span>
      </div>
    </div>
  );
}
