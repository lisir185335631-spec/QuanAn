/**
 * PhaseCard — 私域成交 6 阶段卡片 · PRD-15 US-005
 * ui/_1 设计: 阶段名+描述+状态(未生成/已生成) · 点击展开详情
 */

import { ChevronDown, ChevronRight, CheckCircle2, Circle } from 'lucide-react';
import { useState } from 'react';

import { cn } from '@/lib/utils';

export interface PhaseData {
  key: string;
  name: string;
  goal: string;
  tactics: string[];
  scripts: string[];
  metrics: string[];
}

interface PhaseCardProps {
  phase: PhaseData;
  index: number;
  isGenerated: boolean;
  isStreaming?: boolean;
  onClick?: () => void;
}

const PHASE_ICONS: Record<string, string> = {
  attract: '🎯',
  add_wechat: '💬',
  trust: '🤝',
  moments: '📸',
  convert: '💰',
  repurchase: '🔄',
};

const PHASE_COLORS: Record<string, string> = {
  attract: 'border-blue-500/40 bg-blue-500/5',
  add_wechat: 'border-green-500/40 bg-green-500/5',
  trust: 'border-yellow-500/40 bg-yellow-500/5',
  moments: 'border-purple-500/40 bg-purple-500/5',
  convert: 'border-orange-500/40 bg-orange-500/5',
  repurchase: 'border-rose-500/40 bg-rose-500/5',
};

export function PhaseCard({ phase, index, isGenerated, isStreaming, onClick }: PhaseCardProps) {
  const [expanded, setExpanded] = useState(false);
  const icon = PHASE_ICONS[phase.key] ?? '📋';
  const colorClass = PHASE_COLORS[phase.key] ?? 'border-border bg-surface-variant/10';

  function handleToggle() {
    if (isGenerated) {
      setExpanded((v) => !v);
    } else {
      onClick?.();
    }
  }

  return (
    <div
      className={cn(
        'rounded-lg border transition-all duration-200',
        colorClass,
        isGenerated ? 'cursor-pointer' : 'cursor-default opacity-70',
        expanded && 'shadow-md',
      )}
      data-testid={`phase-card-${phase.key}`}
      onClick={handleToggle}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleToggle(); }}
      role={isGenerated ? 'button' : undefined}
      tabIndex={isGenerated ? 0 : undefined}
      aria-expanded={expanded}
    >
      {/* Card header */}
      <div className="flex items-center gap-3 p-4">
        <span className="text-xl select-none">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-label-xs text-muted-foreground">阶段 {index + 1}</span>
            {isStreaming && (
              <span className="text-label-xs text-primary animate-pulse">生成中…</span>
            )}
          </div>
          <h3 className="text-body-md font-medium text-on-surface">{phase.name}</h3>
          <p className="text-body-sm text-on-surface-variant truncate">{phase.goal}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isGenerated ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <Circle className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-label-xs text-muted-foreground">
            {isGenerated ? '已生成' : '未生成'}
          </span>
          {isGenerated && (
            expanded
              ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
              : <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Expanded details */}
      {expanded && isGenerated && (
        <div
          className="px-4 pb-4 space-y-3 border-t border-border/40 pt-3"
          data-testid={`phase-detail-${phase.key}`}
          role="none"
          onClick={(e) => e.stopPropagation()}
        >
          {phase.tactics.length > 0 && (
            <div>
              <p className="text-label-xs text-muted-foreground uppercase tracking-wide mb-1">执行策略</p>
              <ul className="space-y-1">
                {phase.tactics.map((t, i) => (
                  <li key={i} className="text-body-sm text-on-surface flex items-start gap-2">
                    <span className="text-primary mt-0.5">·</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {phase.scripts.length > 0 && (
            <div>
              <p className="text-label-xs text-muted-foreground uppercase tracking-wide mb-1">话术模板</p>
              <ul className="space-y-1">
                {phase.scripts.map((s, i) => (
                  <li key={i} className="text-body-sm text-on-surface italic text-muted-foreground">
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {phase.metrics.length > 0 && (
            <div>
              <p className="text-label-xs text-muted-foreground uppercase tracking-wide mb-1">关键指标</p>
              <div className="flex flex-wrap gap-2">
                {phase.metrics.map((m, i) => (
                  <span
                    key={i}
                    className="text-label-xs bg-surface-container px-2 py-0.5 rounded-full text-on-surface-variant"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
