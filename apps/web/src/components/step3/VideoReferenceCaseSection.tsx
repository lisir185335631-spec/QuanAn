import { FlameIcon } from '@/components/icons/aiipznt-icons';
import { SubCard } from '@/components/ui/sub-card';
import { Button } from '@/components/ui/button';
import { STEP3_CTA_GENERATE_REFERENCE, STEP3_OUTPUT_H3_6 } from '@/lib/constants/step3';
import { cn } from '@/lib/utils';

export interface VideoReferenceCase {
  title: string;
  description: string;
  searchHint: string;
  platform?: string; // 截图: 抖音 / 小红书 / 视频号 · chip label
}

export interface VideoReferenceCaseSectionProps {
  cases?: VideoReferenceCase[];
  canGenerate?: boolean;
  onGenerate?: () => void;
  className?: string;
}

const H3_LABEL = STEP3_OUTPUT_H3_6[0]!.h3Label; // '视频参考案例'

function CaseSkeleton() {
  return (
    <SubCard>
      <div className="space-y-3 animate-pulse">
        <div className="h-4 bg-muted/60 rounded w-3/5" />
        <div className="h-3 bg-muted/40 rounded w-full" />
        <div className="h-3 bg-muted/40 rounded w-4/5" />
        <div className="h-6 bg-muted/30 rounded-full w-2/5 mt-2" />
      </div>
    </SubCard>
  );
}

function CaseCard({ title, description, searchHint, platform }: VideoReferenceCase) {
  return (
    <SubCard>
      <div className="space-y-2">
        <p className="text-sm font-semibold text-on-surface">{title}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        <div className="flex items-center gap-2 flex-wrap">
          {platform && (
            <span className="inline-block text-xs bg-primary/15 text-primary border border-primary/30 rounded px-2 py-0.5 font-medium">
              {platform}
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <span className="text-primary">⌕</span>搜索:&nbsp;{searchHint}
          </span>
        </div>
      </div>
    </SubCard>
  );
}

export function VideoReferenceCaseSection({
  cases = [],
  canGenerate = false,
  onGenerate,
  className,
}: VideoReferenceCaseSectionProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {/* H3 row: FlameIcon + title + [生成参考图] button */}
      <div className="flex items-center justify-between gap-4">
        <h3 className="flex items-center gap-2 text-base font-semibold text-on-surface">
          <FlameIcon className="h-4 w-4 shrink-0" size={4} />
          {H3_LABEL}
        </h3>
        <Button
          variant="outline"
          size="sm"
          disabled={!canGenerate}
          onClick={onGenerate}
        >
          {STEP3_CTA_GENERATE_REFERENCE}
        </Button>
      </div>

      {/* Grid: always renders, skeleton when empty */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cases.length === 0 ? (
          <>
            <CaseSkeleton />
            <CaseSkeleton />
          </>
        ) : (
          cases.map((c, i) => (
            <CaseCard key={i} {...c} />
          ))
        )}
      </div>
    </div>
  );
}
