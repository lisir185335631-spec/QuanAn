// PRD-29.8 · H3-3 内容人设
import { FlameIcon } from '@/components/icons/aiipznt-icons';
import { SubCard } from '@/components/ui/sub-card';
import { cn } from '@/lib/utils';

export interface ContentPersonaContent {
  speakingStyle: string;
  speakingDos: string[];
  speakingDonts: string[];
  examplePitch: string;
  visualStyle: {
    style: string;
    outfit: string;
    scene: string;
    props: string[];
  };
  contentPillars: Array<{
    title: string;
    percentage: string;
    frequency: string;
    desc: string;
    cases: string[];
  }>;
}

interface ContentPersonaSectionProps {
  content?: ContentPersonaContent;
  className?: string;
}

export function ContentPersonaSection({ content, className }: ContentPersonaSectionProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* H3 row */}
      <h3 className="flex items-center gap-2 text-base font-semibold text-on-surface">
        <FlameIcon className="h-4 w-4 shrink-0" size={4} />
        内容人设
      </h3>

      {/* 说话风格 */}
      <SubCard>
        <div className="space-y-2">
          <p className="text-xs font-semibold text-on-surface/80">说话风格</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {content?.speakingStyle ?? ''}
          </p>
        </div>
      </SubCard>

      {/* ✓✗ list */}
      <SubCard>
        <div className="space-y-3">
          <div className="space-y-2">
            {(content?.speakingDos ?? []).map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-emerald-500 shrink-0 font-semibold">✓</span>
                <p className="text-xs text-muted-foreground leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            {(content?.speakingDonts ?? []).map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-rose-400 shrink-0 font-semibold">✗</span>
                <p className="text-xs text-muted-foreground leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </SubCard>

      {/* 示例口播 */}
      <SubCard>
        <div className="space-y-2">
          <p className="text-xs font-semibold text-on-surface/80">示例口播</p>
          <div className="bg-primary/8 border border-primary/25 rounded-lg p-4">
            <p className="text-xs italic text-muted-foreground leading-relaxed">
              {content?.examplePitch ?? ''}
            </p>
          </div>
        </div>
      </SubCard>

      {/* 视觉风格 */}
      <SubCard>
        <div className="space-y-3">
          <p className="text-xs font-semibold text-on-surface/80">视觉风格</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-on-surface/70">风格</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{content?.visualStyle.style ?? ''}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-on-surface/70">场景</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{content?.visualStyle.scene ?? ''}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-on-surface/70">穿搭</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{content?.visualStyle.outfit ?? ''}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-on-surface/70">道具</p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {(content?.visualStyle.props ?? []).map((prop, i) => (
                    <span key={i} className="text-xs bg-primary/10 border border-primary/25 text-on-surface rounded px-2 py-1">
                      {prop}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </SubCard>

      {/* 内容支柱 */}
      <SubCard>
        <div className="space-y-3">
          <p className="text-xs font-semibold text-on-surface/80">内容支柱</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(content?.contentPillars ?? []).map((pillar, i) => (
              <div key={i} className="border border-primary/15 rounded p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-on-surface">{pillar.title}</p>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs bg-primary/15 text-primary border border-primary/25 rounded px-2 py-0.5">
                      {pillar.percentage}
                    </span>
                    <span className="text-xs bg-muted/30 text-muted-foreground border border-border/30 rounded px-2 py-0.5">
                      {pillar.frequency}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{pillar.desc}</p>
                <div className="flex flex-wrap gap-1">
                  {pillar.cases.map((c, j) => (
                    <span key={j} className="text-[11px] bg-primary/8 border border-primary/15 text-on-surface/80 rounded px-2 py-1">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </SubCard>
    </div>
  );
}
