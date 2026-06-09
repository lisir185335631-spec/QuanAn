import { FlameIcon } from '@/components/icons/aiipznt-icons';
import { C, F } from '@/components/home-next/ikb/system';
import { Button } from '@/components/ui/button';
import { SubCard } from '@/components/ui/sub-card';
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
        <div className="h-4 rounded w-3/5" style={{ background: 'rgba(255,255,255,0.08)' }} />
        <div className="h-3 rounded w-full" style={{ background: 'rgba(255,255,255,0.08)' }} />
        <div className="h-3 rounded w-4/5" style={{ background: 'rgba(255,255,255,0.08)' }} />
        <div className="h-6 rounded-full w-2/5 mt-2" style={{ background: 'rgba(255,255,255,0.08)' }} />
      </div>
    </SubCard>
  );
}

function CaseCard({ title, description, searchHint, platform }: VideoReferenceCase) {
  return (
    <SubCard>
      <div className="space-y-2">
        <p className="text-sm font-semibold" style={{ color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>{title}</p>
        <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, textShadow: C.textShadow }}>{description}</p>
        <div className="flex items-center gap-2 flex-wrap">
          {platform && (
            <span className="inline-block text-xs rounded px-2 py-0.5 font-medium" style={{ background: 'rgba(216,232,255,0.15)', color: C.ikb, border: `0.5px solid rgba(216,232,255,0.35)` }}>
              {platform}
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-xs" style={{ color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>
            <span style={{ color: C.ikb }}>⌕</span>搜索:&nbsp;{searchHint}
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
        <h3 className="flex items-center gap-2 text-base font-semibold" style={{ color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>
          <FlameIcon className="h-4 w-4 shrink-0" aria-hidden size={4} />
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
      <div className="grid grid-cols-2 gap-4">
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
