// PRD-29.8 · H3-1 核心身份定位
import { FlameIcon } from '@/components/icons/aiipznt-icons';
import { SubCard } from '@/components/ui/sub-card';
import { cn } from '@/lib/utils';

export interface CoreIdentityContent {
  identityTag: string;
  quote: string;
  differentiation: string;
  memoryPoints: Array<{
    title: string;
    desc: string;
    practice: string;
  }>;
  traits: Array<{
    name: string;
    desc: string;
  }>;
}

interface CoreIdentitySectionProps {
  content?: CoreIdentityContent;
  className?: string;
}

export function CoreIdentitySection({ content, className }: CoreIdentitySectionProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* H3 row */}
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-base font-semibold text-on-surface">
          <FlameIcon className="h-4 w-4 shrink-0" size={4} />
          核心身份定位
        </h3>
        <span className="text-xs bg-primary/15 text-primary border border-primary/30 rounded px-3 py-1">
          人设核心
        </span>
      </div>

      {/* 人设标签 */}
      <SubCard>
        <div className="space-y-2">
          <p className="text-xs font-semibold text-on-surface/80">人设标签</p>
          <p className="text-base font-semibold text-on-surface leading-relaxed">
            {content?.identityTag ?? ''}
          </p>
        </div>
      </SubCard>

      {/* 个人口号/金句 */}
      <SubCard>
        <div className="space-y-2">
          <p className="text-xs font-semibold text-on-surface/80">个人口号/金句</p>
          <p className="text-sm italic text-on-surface/90 text-center leading-relaxed">
            {content?.quote ?? ''}
          </p>
        </div>
      </SubCard>

      {/* 差异化定位 */}
      <SubCard>
        <div className="space-y-2">
          <p className="text-xs font-semibold text-primary/85">差异化定位</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {content?.differentiation ?? ''}
          </p>
        </div>
      </SubCard>

      {/* 记忆点设计 */}
      <SubCard>
        <div className="space-y-3">
          <p className="text-xs font-semibold text-on-surface/80">记忆点设计</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(content?.memoryPoints ?? []).map((point, i) => (
              <div key={i} className="border border-primary/15 rounded p-3 space-y-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-primary">⭐</span>
                  <span className="text-sm font-semibold text-on-surface">{point.title}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{point.desc}</p>
                <div>
                  <span className="text-[11px] font-semibold text-on-surface/70">落地方式：</span>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{point.practice}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </SubCard>

      {/* 性格特质 */}
      <SubCard>
        <div className="space-y-3">
          <p className="text-xs font-semibold text-on-surface/80">性格特质</p>
          <div className="flex flex-wrap gap-2">
            {(content?.traits ?? []).map((trait, i) => (
              <span
                key={i}
                className="text-xs bg-primary/10 border border-primary/25 text-on-surface rounded px-3 py-1.5"
              >
                {trait.name}
                <span className="text-on-surface/55">（{trait.desc}）</span>
              </span>
            ))}
          </div>
        </div>
      </SubCard>
    </div>
  );
}
