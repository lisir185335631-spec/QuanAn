/**
 * PrivateDomainResultView — ui/_7 设计稿 · 生成结果 · PRD-15 US-005
 * AC-4: 渲染 6 阶段完整 SOP · 每阶段 {goal,tactics[],scripts[],metrics[]} · 阶段间连线动画
 */

import { ArrowDown, CheckCircle2, RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import { PhaseCard } from './PhaseCard';

import type { PhaseData } from './PhaseCard';

interface PrivateDomainResultViewProps {
  phases: PhaseData[];
  isStreaming: boolean;
  summary?: string;
  onRetry: () => void;
  onViewHistory: () => void;
}

export function PrivateDomainResultView({
  phases,
  isStreaming,
  summary,
  onRetry,
  onViewHistory,
}: PrivateDomainResultViewProps) {
  return (
    <div className="space-y-4" data-testid="private-domain-result-view">
      {/* Status bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isStreaming ? (
            <span className="text-label-sm text-primary animate-pulse">AI 生成中…</span>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-label-sm text-green-600">6 阶段 SOP 已生成</span>
            </>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onViewHistory}
            data-testid="view-history-btn"
          >
            历史记录
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            data-testid="retry-btn"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            重新生成
          </Button>
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <Card className="border-outline-variant bg-surface-variant/10">
          <CardContent className="pt-3 pb-3">
            <p className="text-body-sm text-on-surface-variant">{summary}</p>
          </CardContent>
        </Card>
      )}

      {/* 6-phase result with connectors */}
      <div className="space-y-1" data-testid="result-phases-list">
        {phases.map((phase, idx) => (
          <div key={phase.key} data-testid={`result-phase-row-${idx}`}>
            <PhaseCard
              phase={phase}
              index={idx}
              isGenerated={!isStreaming}
              isStreaming={isStreaming}
            />
            {idx < phases.length - 1 && (
              <div
                className="flex justify-center py-0.5"
                aria-hidden="true"
                data-testid="phase-arrow"
              >
                <ArrowDown className="h-4 w-4 text-primary/40 animate-bounce" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
