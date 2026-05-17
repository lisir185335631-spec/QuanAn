import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

import {
  STEP4B_OUTPUT_H3_5,
  STEP4B_PRODUCT_TYPES_4,
  STEP4B_THREE_STAGES,
  type Step4bResult,
  type Step4bStageDetail,
} from '@/lib/constants/step4b';
import { cn } from '@/lib/utils';

export type { Step4bResult };

// ── Sub-components ────────────────────────────────────────────────────────────

function MarketAnalysisInfoCard({ data }: { data: Step4bResult['market_analysis'] }) {
  const fields = [
    { label: '行业', value: data.industry },
    { label: '市场规模', value: data.marketSize },
    { label: '竞争程度', value: data.competitionLevel },
    { label: '变现潜力', value: data.monetizationPotential },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {fields.map((f) => (
        <div key={f.label} className="glass-card rounded-lg p-4">
          <p className="text-body-xs font-label text-primary uppercase tracking-wide mb-1">{f.label}</p>
          <p className="text-body-sm text-on-surface">{f.value}</p>
        </div>
      ))}
    </div>
  );
}

interface StageCardProps {
  stageConst: { range: string; title: string; duration: string };
  stage: Step4bStageDetail;
  index: number;
}

function StageCard({ stageConst, stage, index }: StageCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="glass-card rounded-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4"
      style={{ animationDelay: `${index * 0.1}s`, animationFillMode: 'both' }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start justify-between p-5 text-left hover:bg-primary/5 transition-colors"
        aria-expanded={open}
      >
        <div className="space-y-1">
          <p className="text-label-sm font-label text-primary uppercase tracking-wide">
            {stageConst.range}
          </p>
          <p className="text-body-sm font-medium text-on-surface">{stageConst.title}</p>
          <p className="text-body-xs text-muted-foreground">{stageConst.duration}</p>
        </div>
        {open ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
        )}
      </button>

      <div
        className={cn(
          'overflow-hidden transition-all duration-300',
          open ? 'max-h-[900px] opacity-100' : 'max-h-0 opacity-0',
        )}
      >
        <div className="px-5 pb-5 space-y-5 border-t border-primary/10 pt-4">
          {/* Core Strategy */}
          <div>
            <p className="text-body-xs font-label text-on-surface uppercase tracking-wide mb-2">核心策略</p>
            <p className="text-body-sm text-muted-foreground">{stage.coreStrategy}</p>
          </div>

          {/* Product Matrix — 4 types via STEP4B_PRODUCT_TYPES_4 */}
          <div>
            <p className="text-body-xs font-label text-on-surface uppercase tracking-wide mb-3">产品矩阵</p>
            <div className="space-y-2">
              {stage.productMatrix.map((item, pi) => {
                const typeIdx = STEP4B_PRODUCT_TYPES_4.indexOf(item.type);
                const opacityMap = ['bg-primary/10', 'bg-primary/20', 'bg-primary/30', 'bg-primary/40'] as const;
                const badgeBg = opacityMap[typeIdx] ?? 'bg-primary/10';
                return (
                  <div key={pi} className="flex gap-3 items-start">
                    <span className={cn('shrink-0 text-body-xs px-2 py-0.5 rounded font-label text-primary', badgeBg)}>
                      {item.type}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm text-on-surface">{item.name}</p>
                      <p className="text-body-xs text-muted-foreground">
                        {item.priceRange} · {item.targetCustomer} · 月目标 {item.monthlyTarget}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Traffic Strategy */}
          <div>
            <p className="text-body-xs font-label text-on-surface uppercase tracking-wide mb-2">引流策略</p>
            <p className="text-body-sm text-muted-foreground">{stage.trafficStrategy}</p>
          </div>

          {/* Conversion Flow — arrow connected */}
          <div>
            <p className="text-body-xs font-label text-on-surface uppercase tracking-wide mb-3">成交流程</p>
            <div className="flex flex-wrap gap-1 items-center">
              {stage.conversionFlow.map((step, ci) => (
                <span key={ci} className="flex items-center gap-1">
                  <span className="text-body-xs bg-primary/10 text-primary px-2 py-1 rounded-md">
                    {step}
                  </span>
                  {ci < stage.conversionFlow.length - 1 && (
                    <span className="text-primary text-body-xs">→</span>
                  )}
                </span>
              ))}
            </div>
          </div>

          {/* Key Actions — ✓ list */}
          <div>
            <p className="text-body-xs font-label text-on-surface uppercase tracking-wide mb-2">关键动作</p>
            <ul className="space-y-1.5">
              {stage.keyActions.map((action, ai) => (
                <li key={ai} className="flex gap-2 text-body-sm text-muted-foreground">
                  <span className="text-primary shrink-0 mt-0.5">✓</span>
                  {action}
                </li>
              ))}
            </ul>
          </div>

          {/* Risks — warning/destructive color */}
          {stage.risks.length > 0 && (
            <div>
              <p className="text-body-xs font-label text-destructive uppercase tracking-wide mb-2">风险提示</p>
              <ul className="space-y-1.5">
                {stage.risks.map((risk, ri) => (
                  <li key={ri} className="flex gap-2 text-body-sm text-destructive/80">
                    <span className="shrink-0">⚠</span>
                    {risk}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface Props {
  result: Step4bResult;
}

export default function Step4bOutputContent({ result }: Props) {
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  const stageItems: Array<{ stageConst: { range: string; title: string; duration: string }; stage: Step4bStageDetail }> = [
    { stageConst: STEP4B_THREE_STAGES[0], stage: result.three_stages[0] },
    { stageConst: STEP4B_THREE_STAGES[1], stage: result.three_stages[1] },
    { stageConst: STEP4B_THREE_STAGES[2], stage: result.three_stages[2] },
  ];

  return (
    <section className="space-y-6">
      {STEP4B_OUTPUT_H3_5.map((block) => (
        <div key={block.id} className="glass-card rounded-xl p-6">
          <h3 className="font-display text-2xl text-on-surface mb-4">{block.h3Label}</h3>

          {block.id === 'market_analysis' && (
            <MarketAnalysisInfoCard data={result.market_analysis} />
          )}

          {block.id === 'three_stages' && (
            <div className="space-y-3">
              {stageItems.map(({ stageConst, stage }, i) => (
                <StageCard key={i} stageConst={stageConst} stage={stage} index={i} />
              ))}
            </div>
          )}

          {block.id === 'revenue_structure' && (
            <ul className="space-y-4">
              {result.revenue_structure.map((item, i) => (
                <li key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-body-sm font-medium text-on-surface">{item.category}</span>
                    <span className="text-body-sm font-label text-primary">{item.percent}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-primary/10 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-700"
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                  <p className="text-body-xs text-muted-foreground">{item.description}</p>
                </li>
              ))}
            </ul>
          )}

          {block.id === 'success_cases' && (
            <ul className="space-y-3">
              {result.success_cases.map((c, i) => (
                <li key={i} className="glass-card rounded-lg p-4 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-body-sm font-label text-primary">{c.name}</span>
                    <span className="text-body-xs text-muted-foreground">·</span>
                    <span className="text-body-xs text-muted-foreground">{c.type}</span>
                  </div>
                  <p className="text-body-sm text-muted-foreground">{c.journey}</p>
                  <p className="text-body-sm font-medium text-on-surface">{c.result}</p>
                  <p className="text-body-xs text-primary/80 italic">{c.insight}</p>
                </li>
              ))}
            </ul>
          )}

          {block.id === 'feedback' && (
            <div className="flex flex-col items-center gap-4 py-2">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setFeedback('up')}
                  className={cn(
                    'flex items-center gap-2 px-5 py-2.5 rounded-lg border transition-colors text-body-sm',
                    feedback === 'up'
                      ? 'border-primary/60 bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/40 text-muted-foreground',
                  )}
                >
                  👍
                </button>
                <button
                  type="button"
                  onClick={() => setFeedback('down')}
                  className={cn(
                    'flex items-center gap-2 px-5 py-2.5 rounded-lg border transition-colors text-body-sm',
                    feedback === 'down'
                      ? 'border-destructive/60 bg-destructive/10 text-destructive'
                      : 'border-border hover:border-primary/40 text-muted-foreground',
                  )}
                >
                  👎
                </button>
              </div>
              {feedback !== null && (
                <p className="text-body-xs text-muted-foreground">感谢你的反馈！</p>
              )}
            </div>
          )}
        </div>
      ))}
    </section>
  );
}
