/**
 * ArchiveCard.tsx — 单已完成档案 card
 * header row: title + 已完成 chip + Copy/Trash btn + Chevron toggle
 * 展开: 风格画像 + 文案逻辑 + 包装风格 + 精华片段
 */
import { CheckCircle2, ChevronDown, ChevronUp, Copy, FileText, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  DL_ARCHIVE_STATUS_DONE,
  DL_SECTION_LOGIC,
  DL_SECTION_PACKAGING,
  DL_TOAST_COPY,
  DL_TOAST_DELETE,
} from '@/lib/constants/deep-learning';
import type { ArchiveMock } from '@/lib/constants/deep-learning';

import { FieldGridSection } from './FieldGridSection';
import { HighlightsSection } from './HighlightsSection';
import { StylePortraitSection } from './StylePortraitSection';

interface ArchiveCardProps {
  archive: ArchiveMock;
}

export function ArchiveCard({ archive }: ArchiveCardProps) {
  const [expanded, setExpanded] = useState(true);

  function handleCopy() {
    toast.success(DL_TOAST_COPY);
  }

  function handleDelete() {
    toast.info(DL_TOAST_DELETE);
  }

  return (
    <div
      data-testid={`archive-card-${archive.id}`}
      className="rounded-xl border border-border bg-card p-6 space-y-6"
    >
      {/* header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3
              data-testid="archive-title"
              className="text-base font-semibold text-foreground"
            >
              {archive.title}
            </h3>
            <span
              data-testid="archive-done-chip"
              className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-400"
            >
              <CheckCircle2 className="h-3 w-3" />
              {DL_ARCHIVE_STATUS_DONE}
            </span>
          </div>
          <p
            data-testid="archive-subtitle"
            className="text-xs text-muted-foreground flex items-center gap-1"
          >
            <FileText className="h-3.5 w-3.5" />
            添加{archive.sampleCount}篇文案 · {archive.sampleCount}篇文案
          </p>
        </div>

        {/* action buttons */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            data-testid="archive-copy-btn"
            type="button"
            onClick={handleCopy}
            className="p-1.5 rounded-md hover:bg-primary/10 text-primary transition-colors"
            aria-label="复制"
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            data-testid="archive-delete-btn"
            type="button"
            onClick={handleDelete}
            className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive transition-colors"
            aria-label="删除"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            data-testid="archive-toggle-btn"
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors"
            aria-label={expanded ? '折叠' : '展开'}
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* expanded content */}
      {expanded && (
        <div data-testid="archive-expanded" className="space-y-6">
          <StylePortraitSection body={archive.stylePortrait} />
          <FieldGridSection
            title={DL_SECTION_LOGIC}
            fields={archive.logic}
            testId="logic-grid-section"
          />
          <FieldGridSection
            title={DL_SECTION_PACKAGING}
            fields={archive.packaging}
            testId="packaging-grid-section"
          />
          <HighlightsSection quotes={archive.highlights} />
        </div>
      )}
    </div>
  );
}
