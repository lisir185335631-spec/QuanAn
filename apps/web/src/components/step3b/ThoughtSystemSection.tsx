// PRD-29.8 · H3-2 思想体系
import { FlameIcon } from '@/components/icons/aiipznt-icons';
import { SubCard } from '@/components/ui/sub-card';
import { cn } from '@/lib/utils';

export interface ThoughtSystemContent {
  coreBeliefs: Array<{
    belief: string;
    reason: string;
    angle: string;
  }>;
  viewpoints: Array<{
    title: string;
    desc: string;
    exampleTitle: string;
  }>;
  mottos: Array<{
    motto: string;
    whenToUse: string;
    effect: string;
  }>;
}

interface ThoughtSystemSectionProps {
  content?: ThoughtSystemContent;
  className?: string;
}

export function ThoughtSystemSection({ content, className }: ThoughtSystemSectionProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* H3 row */}
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-base font-semibold text-on-surface">
          <FlameIcon className="h-4 w-4 shrink-0" size={4} />
          思想体系
        </h3>
        <span className="text-xs bg-primary/15 text-primary border border-primary/30 rounded px-3 py-1">
          深度内核
        </span>
      </div>

      {/* 核心理念 */}
      <SubCard>
        <div className="space-y-4">
          <p className="text-xs font-semibold text-on-surface/80">核心理念</p>
          <div className="space-y-4">
            {(content?.coreBeliefs ?? []).map((item, i) => (
              <div key={i} className="space-y-1.5">
                <p className="text-sm font-semibold text-on-surface">{item.belief}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.reason}</p>
                <div>
                  <span className="text-[11px] font-semibold text-on-surface/70">内容角度：</span>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{item.angle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </SubCard>

      {/* 独特观点（引爆流量） */}
      <SubCard>
        <div className="space-y-3">
          <p className="text-xs font-semibold text-on-surface/80">独特观点（引爆流量）</p>
          <div className="space-y-3">
            {(content?.viewpoints ?? []).map((item, i) => (
              <div key={i} className="bg-primary/8 border border-primary/25 rounded-lg p-4 space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-primary text-base shrink-0">✨</span>
                  <p className="text-sm font-semibold text-on-surface">{item.title}</p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                <div>
                  <span className="text-[11px] font-semibold text-on-surface/70">示例标题：</span>
                  <span className="text-xs italic text-primary/85 ml-1">{item.exampleTitle}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </SubCard>

      {/* 口头禅设计 */}
      <SubCard>
        <div className="space-y-3">
          <p className="text-xs font-semibold text-on-surface/80">口头禅设计</p>
          <div className="space-y-3">
            {(content?.mottos ?? []).map((item, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex items-start gap-2">
                  <span className="text-primary shrink-0">🎤</span>
                  <p className="text-sm font-semibold text-on-surface">{item.motto}</p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.whenToUse}</p>
                <div>
                  <span className="text-[11px] font-semibold text-on-surface/70">效果：</span>
                  <span className="text-xs text-muted-foreground ml-1">{item.effect}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </SubCard>
    </div>
  );
}
