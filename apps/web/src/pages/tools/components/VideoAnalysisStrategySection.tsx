// /video-analysis · 选题策略 + 钩子分析 + 叙事结构 · 3 折叠 sub-card
import { useState } from 'react';

import { SubCard } from '@/components/ui/sub-card';
import { cn } from '@/lib/utils';

interface TopicStrategy {
  category: string;
  angle: string;
  targetAudience: string;
  evaluation: string;
}

interface HookAnalysis {
  score: number;
  maxScore: number;
  type: string;
  technique: string;
  evaluation: string;
}

interface NarrativeStructure {
  label: string;
  timeline: string[];
  evaluation: string;
}

interface VideoAnalysisStrategySectionProps {
  topicStrategy: TopicStrategy;
  hookAnalysis: HookAnalysis;
  narrativeStructure: NarrativeStructure;
  className?: string;
}

function goldChip(text: string) {
  return (
    <span className="inline-flex items-center rounded border border-primary/25 bg-primary/10 px-2 py-0.5 text-xs text-primary font-semibold ml-2">
      {text}
    </span>
  );
}

function CollapseButton({ expanded, onToggle }: { expanded: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="text-muted-foreground hover:text-on-surface transition-colors"
      aria-label={expanded ? '折叠' : '展开'}
    >
      {expanded ? '▲' : '▼'}
    </button>
  );
}

export function VideoAnalysisStrategySection({
  topicStrategy,
  hookAnalysis,
  narrativeStructure,
  className,
}: VideoAnalysisStrategySectionProps) {
  const [expandedTopic, setExpandedTopic] = useState(true);
  const [expandedHook, setExpandedHook] = useState(true);
  const [expandedNarrative, setExpandedNarrative] = useState(true);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Sub 1 · 选题策略分析 */}
      <SubCard className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-on-surface flex items-center">
            选题策略分析
            {goldChip('策略')}
          </h3>
          <CollapseButton expanded={expandedTopic} onToggle={() => setExpandedTopic((v) => !v)} />
        </div>
        {expandedTopic && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-primary font-semibold">选题类别</p>
                <p className="text-sm font-semibold text-on-surface">{topicStrategy.category}</p>
              </div>
              <div>
                <p className="text-xs text-primary font-semibold">切入角度</p>
                <p className="text-sm font-semibold text-on-surface">{topicStrategy.angle}</p>
              </div>
              <div>
                <p className="text-xs text-primary font-semibold">目标受众</p>
                <p className="text-sm font-semibold text-on-surface">{topicStrategy.targetAudience}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mt-4">{topicStrategy.evaluation}</p>
          </>
        )}
      </SubCard>

      {/* Sub 2 · 钩子分析 */}
      <SubCard className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-on-surface flex items-center">
            钩子分析
            {goldChip(`${hookAnalysis.score}/${hookAnalysis.maxScore}`)}
          </h3>
          <CollapseButton expanded={expandedHook} onToggle={() => setExpandedHook((v) => !v)} />
        </div>
        {expandedHook && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-primary font-semibold">类型</p>
                <p className="text-sm font-semibold text-on-surface">{hookAnalysis.type}</p>
              </div>
              <div>
                <p className="text-xs text-primary font-semibold">技巧</p>
                <p className="text-sm font-semibold text-on-surface">{hookAnalysis.technique}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mt-4">{hookAnalysis.evaluation}</p>
          </>
        )}
      </SubCard>

      {/* Sub 3 · 叙事结构 */}
      <SubCard className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-on-surface flex items-center">
            叙事结构
            {goldChip(narrativeStructure.label)}
          </h3>
          <CollapseButton expanded={expandedNarrative} onToggle={() => setExpandedNarrative((v) => !v)} />
        </div>
        {expandedNarrative && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              {narrativeStructure.timeline.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded border border-primary/30 bg-primary/8 px-3 py-1 text-xs text-on-surface">
                    {item}
                  </span>
                  {i < narrativeStructure.timeline.length - 1 && (
                    <span className="text-muted-foreground text-sm">→</span>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mt-4">{narrativeStructure.evaluation}</p>
          </>
        )}
      </SubCard>
    </div>
  );
}
