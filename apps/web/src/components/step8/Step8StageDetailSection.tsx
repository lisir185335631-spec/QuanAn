// PRD-29.12 · Step8 单个 stage detail
import { SubCard } from '@/components/ui/sub-card';
import { cn } from '@/lib/utils';
import { type Step8StageDetail } from './Step8PlanTabs';

interface Step8StageDetailSectionProps {
  detail: Step8StageDetail;
  className?: string;
}

function stageIcon(index: number): string {
  if (index === 1) return '🕐';
  if (index === 2) return '▷';
  if (index === 6) return '⚡';
  if (index === 7) return '🛡';
  return '🔊';
}

function accentClasses(accent: Step8StageDetail['accent']): string {
  if (accent === 'green') return 'border-emerald-500/30 bg-emerald-500/5';
  if (accent === 'red') return 'border-rose-500/30 bg-rose-500/5';
  if (accent === 'orange') return 'border-primary/30 bg-primary/5';
  return '';
}

function accentTitleClass(accent: Step8StageDetail['accent']): string {
  if (accent === 'green') return 'text-emerald-400';
  if (accent === 'red') return 'text-rose-400';
  if (accent === 'orange') return 'text-primary';
  return 'text-on-surface';
}

export function Step8StageDetailSection({ detail, className }: Step8StageDetailSectionProps) {
  const titleColorClass = accentTitleClass(detail.accent);
  const containerClass = accentClasses(detail.accent);

  return (
    <div
      className={cn(
        'bg-card/40 backdrop-blur-md border rounded-lg p-4 space-y-4',
        containerClass || 'border-border/40',
        className,
      )}
    >
      {/* H3 row */}
      <div className="flex items-center justify-between gap-4">
        <h3 className={cn('text-base font-semibold flex items-center gap-2', titleColorClass)}>
          {stageIcon(detail.index)} {detail.name}
        </h3>
        <span className="inline-flex items-center rounded border border-primary/25 bg-primary/10 px-2 py-0.5 text-xs text-primary">
          {detail.duration}
        </span>
      </div>

      <div className="space-y-4">
        {/* 话术 */}
        <SubCard>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-on-surface/80">{detail.scriptLabel}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{detail.script}</p>
          </div>
        </SubCard>

        {/* 执行动作 */}
        {detail.actions && detail.actions.length > 0 && (
          <SubCard>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-on-surface/80">执行动作</p>
              <ul className="space-y-1.5">
                {detail.actions.map((action, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <span className="text-primary/60 shrink-0">·</span>
                    <span className="leading-relaxed">{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          </SubCard>
        )}

        {/* 留人钩子 */}
        {detail.hooks && detail.hooks.length > 0 && (
          <SubCard>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-on-surface/80">留人钩子</p>
              <div className="flex gap-2 flex-wrap">
                {detail.hooks.map((hook, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 px-3 py-1.5 text-xs"
                  >
                    {hook}
                  </span>
                ))}
              </div>
            </div>
          </SubCard>
        )}

        {/* 互动设计 + 转化节点 */}
        {(detail.interaction ?? detail.conversion) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {detail.interaction && (
              <SubCard>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-on-surface/80">互动设计</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{detail.interaction}</p>
                </div>
              </SubCard>
            )}
            {detail.conversion && (
              <SubCard>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-on-surface/80">转化节点</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{detail.conversion}</p>
                </div>
              </SubCard>
            )}
          </div>
        )}

        {/* 紧迫感策略 */}
        {detail.urgencyTags && detail.urgencyTags.length > 0 && (
          <SubCard className="border-rose-500/30 bg-rose-500/5">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-rose-400">紧迫感策略</p>
              <div className="flex gap-2 flex-wrap">
                {detail.urgencyTags.map((tag, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center rounded border border-rose-500/30 bg-rose-500/10 text-rose-400 px-3 py-1.5 text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </SubCard>
        )}

        {/* 成交技巧 */}
        {detail.closeTechniques && detail.closeTechniques.length > 0 && (
          <SubCard className="border-rose-500/30 bg-rose-500/5">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-rose-400">成交技巧</p>
              <ul className="space-y-1.5">
                {detail.closeTechniques.map((technique, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-rose-400/70 shrink-0 text-xs">✓</span>
                    <span className="text-xs text-rose-300 leading-relaxed">{technique}</span>
                  </li>
                ))}
              </ul>
            </div>
          </SubCard>
        )}

        {/* 下场预告 */}
        {detail.nextPreview && (
          <SubCard>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-on-surface/80">下场预告</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{detail.nextPreview}</p>
            </div>
          </SubCard>
        )}
      </div>
    </div>
  );
}
