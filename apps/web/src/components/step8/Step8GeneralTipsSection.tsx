// PRD-29.12 · Step8 通用直播技巧 3 sub
import { SubCard } from '@/components/ui/sub-card';
import { cn } from '@/lib/utils';

interface InteractionTemplate {
  scenario: string;
  script: string;
}

interface ObjectionHandling {
  objection: string;
  response: string;
}

interface DataOptimization {
  metric: string;
  target: string;
  advice: string;
}

interface Step8GeneralTipsSectionProps {
  interactionTemplates: InteractionTemplate[];
  objectionHandling: ObjectionHandling[];
  dataOptimization: DataOptimization[];
  className?: string;
}

export function Step8GeneralTipsSection({
  interactionTemplates,
  objectionHandling,
  dataOptimization,
  className,
}: Step8GeneralTipsSectionProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* H3 row */}
      <h3 className="text-base font-semibold text-on-surface flex items-center gap-2">
        💡 通用直播技巧
      </h3>

      {/* 互动话术模板 */}
      <SubCard>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs font-semibold text-on-surface/80">💬 互动话术模板</p>
            <span className="inline-flex items-center rounded border border-primary/25 bg-primary/10 px-2 py-0.5 text-xs text-primary">
              {interactionTemplates.length}个场景
            </span>
          </div>
          <div className="space-y-3">
            {interactionTemplates.map((tpl, i) => (
              <SubCard key={i}>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-on-surface">{tpl.scenario}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{tpl.script}</p>
                </div>
              </SubCard>
            ))}
          </div>
        </div>
      </SubCard>

      {/* 异议处理话术 · 红边 */}
      <div className="border border-rose-500/30 bg-rose-500/5 rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs font-semibold text-rose-400">🛡 异议处理话术</p>
          <span className="inline-flex items-center rounded border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-xs text-rose-400">
            {objectionHandling.length}种异议
          </span>
        </div>
        <div className="space-y-3">
          {objectionHandling.map((item, i) => (
            <SubCard key={i}>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-rose-400">⚠️ 异议：{item.objection}</p>
                <p className="text-xs leading-relaxed">
                  <span className="text-emerald-400 font-semibold">应对：</span>
                  <span className="text-muted-foreground">{item.response}</span>
                </p>
              </div>
            </SubCard>
          ))}
        </div>
      </div>

      {/* 数据优化建议 · 绿边 */}
      <div className="border border-emerald-500/30 bg-emerald-500/5 rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs font-semibold text-emerald-400">📊 数据优化建议</p>
          <span className="inline-flex items-center rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400">
            关键指标
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {dataOptimization.map((item, i) => (
            <SubCard key={i}>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-on-surface">{item.metric}</p>
                  <span className="text-emerald-400 font-semibold text-sm">{item.target}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.advice}</p>
              </div>
            </SubCard>
          ))}
        </div>
      </div>
    </div>
  );
}
