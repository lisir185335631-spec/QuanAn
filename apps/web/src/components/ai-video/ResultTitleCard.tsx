/**
 * ResultTitleCard.tsx — 结果标题 card
 * H2 标题 + 时长 + 分镜数 + 复制/导出 button
 */
import { Clock, LayoutGrid, Copy, Download } from 'lucide-react';

import { AI_VIDEO_COPY_ALL_TEXT, AI_VIDEO_EXPORT_CSV_TEXT } from '@/lib/constants/ai-video';

interface ResultTitleCardProps {
  title: string;
  duration: string;
  shotCount: string;
  onCopy: () => void;
  onExport: () => void;
}

export function ResultTitleCard({ title, duration, shotCount, onCopy, onExport }: ResultTitleCardProps) {
  return (
    <div
      className="rounded-xl border border-border bg-card p-6 space-y-4"
      data-testid="result-title-card"
    >
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-xl font-bold text-on-surface">{title}</h2>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={onCopy}
            data-testid="result-copy-btn"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm text-primary hover:border-primary/60 transition-all duration-200"
          >
            <Copy className="w-4 h-4" />
            {AI_VIDEO_COPY_ALL_TEXT}
          </button>
          <button
            type="button"
            onClick={onExport}
            data-testid="result-export-btn"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-on-primary text-sm font-medium hover:opacity-90 transition-all duration-200"
          >
            <Download className="w-4 h-4" />
            {AI_VIDEO_EXPORT_CSV_TEXT}
          </button>
        </div>
      </div>
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Clock className="w-4 h-4" />
          {duration}
        </span>
        <span className="flex items-center gap-1.5">
          <LayoutGrid className="w-4 h-4" />
          {shotCount}
        </span>
      </div>
    </div>
  );
}
