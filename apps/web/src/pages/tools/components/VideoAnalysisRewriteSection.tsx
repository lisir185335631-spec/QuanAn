// /video-analysis · 一键仿写 + 仿写结果 sub-component
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SubCard } from '@/components/ui/sub-card';
import { cn } from '@/lib/utils';

interface RewriteResult {
  title: string;
  intro: string;
  body: string[];
  twist: string;
  ending: string;
  hashtags: string;
}

interface VideoAnalysisRewriteSectionProps {
  rewriteTopic: string;
  onTopicChange: (v: string) => void;
  onGenerate: () => void;
  result?: RewriteResult;
  onCopy?: () => void;
  className?: string;
}

const SECTION_LABELS = ['标题', '开头', '正文', '转折/升华', '结尾', '话题标签'] as const;

export function VideoAnalysisRewriteSection({
  rewriteTopic,
  onTopicChange,
  onGenerate,
  result,
  onCopy,
  className,
}: VideoAnalysisRewriteSectionProps) {
  const sectionContents: string[] = result
    ? [
        result.title,
        result.intro,
        result.body.join('\n\n'),
        result.twist,
        result.ending,
        result.hashtags,
      ]
    : [];

  return (
    <SubCard className={cn('space-y-4', className)}>
      {/* H3 row */}
      <h3 className="text-base font-semibold text-on-surface flex items-center gap-2">
        ⚙ 一键仿写
      </h3>
      <p className="text-xs text-muted-foreground">
        基于以上爆款分析结果，AI将为你生成同类型的仿写文案
      </p>

      {/* Topic input */}
      <Input
        value={rewriteTopic}
        onChange={(e) => onTopicChange(e.target.value)}
        placeholder="输入你的仿写主题（选填，不填则AI自由发挥）"
      />

      {/* Generate button */}
      <Button
        onClick={onGenerate}
        className="bg-orange-500 hover:bg-orange-500/90 text-white"
      >
        ⟳ 生成仿写文案
      </Button>

      {/* Rewrite result */}
      {result && (
        <SubCard className="space-y-2 mt-4">
          {/* Header row with copy button */}
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-on-surface">仿写结果</p>
            {onCopy && (
              <button
                type="button"
                onClick={onCopy}
                className="text-muted-foreground hover:text-on-surface transition-colors text-base"
                aria-label="复制仿写文案"
              >
                📋
              </button>
            )}
          </div>

          {/* 6 sub-sections */}
          {SECTION_LABELS.map((label, i) => (
            <div key={label} className="space-y-2 mt-4">
              <p className="text-primary text-sm font-semibold flex items-center gap-2">
                <span>•</span> {label}
              </p>
              <p className="text-sm text-on-surface/85 leading-relaxed whitespace-pre-line">
                {sectionContents[i]}
              </p>
            </div>
          ))}
        </SubCard>
      )}
    </SubCard>
  );
}
