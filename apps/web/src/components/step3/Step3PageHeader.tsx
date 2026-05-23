import { Copy, RefreshCw, Sparkles } from 'lucide-react';

import { FlameIcon, SparkleIcon } from '@/components/icons/aiipznt-icons';
import { Button } from '@/components/ui/button';
import { GoldenHighlight } from '@/components/ui/golden-highlight';
import {
  STEP3_BREADCRUMB,
  STEP3_CTA_BULK_COPY,
  STEP3_CTA_BULK_OPTIMIZE,
  STEP3_CTA_BULK_REGENERATE,
  STEP3_H1,
  STEP3_RESULT_H2,
} from '@/lib/constants/step3';

export interface Step3PageHeaderProps {
  industry?: string;
  canBulkActions?: boolean;
  onOptimize?: () => void;
  onRegenerateAll?: () => void;
  onCopyAll?: () => void;
}

export function Step3PageHeader({
  industry = '美业',
  canBulkActions = false,
  onOptimize,
  onRegenerateAll,
  onCopyAll,
}: Step3PageHeaderProps) {
  return (
    <div className="space-y-2">
      {/* breadcrumb */}
      <p className="text-xs text-muted-foreground font-label tracking-wide">{STEP3_BREADCRUMB}</p>

      {/* H1 row + toolbar */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-on-surface">
            <SparkleIcon className="h-6 w-6 shrink-0" size={6} />
            {STEP3_H1}
          </h1>
          <p className="text-body-sm text-muted-foreground">
            当前行业：<GoldenHighlight industry={industry} />。输入你的个人信息，AI 将为你生成极其详细的账号包装方案。
          </p>
        </div>

        {/* 3 button toolbar */}
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!canBulkActions}
            onClick={onOptimize}
          >
            <Sparkles className="mr-1 h-4 w-4" />
            {STEP3_CTA_BULK_OPTIMIZE}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!canBulkActions}
            onClick={onRegenerateAll}
          >
            <RefreshCw className="mr-1 h-4 w-4" />
            {STEP3_CTA_BULK_REGENERATE}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!canBulkActions}
            onClick={onCopyAll}
          >
            <Copy className="mr-1 h-4 w-4" />
            {STEP3_CTA_BULK_COPY}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function Step3SectionDivider() {
  return (
    <div className="flex items-center gap-2 py-2">
      <FlameIcon className="h-5 w-5 shrink-0" size={5} />
      <h2 className="text-lg font-semibold text-on-surface">{STEP3_RESULT_H2}</h2>
    </div>
  );
}
