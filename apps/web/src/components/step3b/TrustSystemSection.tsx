// PRD-29.8 · H3-4 信任构建体系
import { FlameIcon } from '@/components/icons/aiipznt-icons';
import { SubCard } from '@/components/ui/sub-card';
import { cn } from '@/lib/utils';

export interface TrustSystemContent {
  backings: Array<{
    claim: string;
    display: string;
  }>;
  socialProofs: Array<{
    proof: string;
    method: string;
  }>;
  storyLine: {
    mainStory: string;
    turningPoint: string;
    narrationMethod: string;
  };
}

interface TrustSystemSectionProps {
  content?: TrustSystemContent;
  className?: string;
}

export function TrustSystemSection({ content, className }: TrustSystemSectionProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* H3 row */}
      <h3 className="flex items-center gap-2 text-base font-semibold text-on-surface">
        <FlameIcon className="h-4 w-4 shrink-0" size={4} />
        信任构建体系
      </h3>

      {/* 信任背书 */}
      <SubCard>
        <div className="space-y-3">
          <p className="text-xs font-semibold text-on-surface/80">信任背书</p>
          <div className="space-y-3">
            {(content?.backings ?? []).map((item, i) => (
              <div key={i} className="space-y-1">
                <p className="text-sm font-semibold text-on-surface">{item.claim}</p>
                <div>
                  <span className="text-[11px] font-semibold text-on-surface/70">展示方式：</span>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{item.display}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </SubCard>

      {/* 社会证明 */}
      <SubCard>
        <div className="space-y-3">
          <p className="text-xs font-semibold text-on-surface/80">社会证明</p>
          <div className="space-y-3">
            {(content?.socialProofs ?? []).map((item, i) => (
              <div key={i} className="space-y-1">
                <p className="text-sm font-semibold text-on-surface">{item.proof}</p>
                <div>
                  <span className="text-[11px] font-semibold text-on-surface/70">获取方式：</span>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{item.method}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </SubCard>

      {/* 个人故事线 */}
      <SubCard>
        <div className="space-y-2">
          <p className="text-xs font-semibold text-on-surface/80">个人故事线</p>
          <div className="bg-primary/8 border border-primary/25 rounded-lg p-5 space-y-3">
            <p className="text-sm text-on-surface/90 leading-relaxed">
              {content?.storyLine.mainStory ?? ''}
            </p>
            <div>
              <p className="text-[11px] font-semibold text-on-surface/70">转折点：</p>
              <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                {content?.storyLine.turningPoint ?? ''}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-on-surface/70">讲述方式：</p>
              <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                {content?.storyLine.narrationMethod ?? ''}
              </p>
            </div>
          </div>
        </div>
      </SubCard>
    </div>
  );
}
